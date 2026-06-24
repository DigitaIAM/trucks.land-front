import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'
import { sleep } from '@/utils/datetime'

export async function employeePaymentsExportToExcel(orgId: number, year: number, month: number) {
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('paysheet')
  const paymentToEmployeeStore = usePaymentToEmployeeStore()
  const userStore = useUsersStore()

  sheet.columns = [
    { header: '№', key: 'index', width: 5, style: { alignment: { horizontal: 'center' } } },
    { header: 'ФИО', key: 'employee', width: 30 },
    { header: 'Оклад в USD', key: 'fixed_salary', width: 15 },
    { header: 'Контракт комиссия в USD', key: 'contract_tiers', width: 20 },
    { header: 'Комиссионные в USD', key: 'to_payment', width: 20 },
    { header: 'Бонусы в USD', key: 'bonus', width: 15 },
    { header: 'Премия в USD', key: 'premium', width: 15 },
    { header: 'Штраф в USD', key: 'fine', width: 15 },
    { header: 'Итого в USD', key: 'total_usd', width: 15 },
    { header: 'Курс в UZS', key: 'ex_rate', width: 15 },
    { header: 'Отпускные UZS', key: 'vacation', width: 15 },
    { header: 'Итого в UZS', key: 'payout_uzs', width: 20 },
    { header: 'НДФЛ 7.5%', key: 'income_tax', width: 20 },
    { header: 'Аванс UZS', key: 'advance', width: 15 },
    { header: 'К выплате UZS', key: 'payout_total', width: 20 },
  ]

  const headerRow = sheet.getRow(1)

  headerRow.alignment = {
    vertical: 'middle',
    horizontal: 'center',
  }

  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '949494' },
  }
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }

  const payments = await paymentToEmployeeStore.fetchJournalData(orgId, year, month)
  const dispatcherOrdersStore = usePaymentToDispatcherOrdersStore()

  const allOrders = (
    await Promise.all((payments || []).map((payment) => dispatcherOrdersStore.request(payment.id)))
  ).flat()

  // Contract tiers calculation per payment
  const contractTiersMap = new Map<number, number>()
  const contractOrders = allOrders.filter((o) => o.profit_kind === 'contract')
  if (contractOrders.length > 0) {
    const orderIds = [...new Set(contractOrders.map((o) => o.doc_order))]
    const { data: ordersData } = await supabase
      .from('orders_journal')
      .select('id, vehicle, week')
      .in('id', orderIds)
    const orderVehicleMap = new Map<number, number>()
    const orderWeekMap = new Map<number, number>()
    ordersData?.forEach((o: any) => {
      if (o.vehicle) orderVehicleMap.set(o.id, o.vehicle)
      if (o.week) orderWeekMap.set(o.id, o.week)
    })

    const vehicleIds = [...new Set(orderVehicleMap.values())]
    const vehiclesStore = useVehiclesStore()
    const vehicleEntries = await Promise.all(
      vehicleIds.map(async (id) => {
        const v = await vehiclesStore.resolve(id)
        if (!v) return null
        return { id: v.id, kind: v.kind }
      }),
    )
    const vehicleMap = new Map<number, { kind: string }>()
    vehicleEntries.forEach((v) => {
      if (v) vehicleMap.set(v.id, { kind: v.kind })
    })

    const vehicleTypeStore = useVehicleTypeStore()
    while (!vehicleTypeStore.initialized) await sleep(10)
    const typeList = vehicleTypeStore.listing
    const typeMap = new Map<string, number>()
    typeList?.forEach((vt: any) => typeMap.set(vt.name, vt.id))

    const tierStore = useVehicleCommissionTierStore()
    while (!tierStore.initialized) await sleep(10)

    const paymentWeekVehicle = new Map<
      string,
      {
        docPayment: number
        week: number
        vehicleId: number
        totalGross: number
      }
    >()
    for (const co of contractOrders) {
      const vehicleId = orderVehicleMap.get(co.doc_order)
      const week = orderWeekMap.get(co.doc_order)
      if (!vehicleId || !week) continue
      const key = `${co.doc_payment}_${week}_${vehicleId}`
      const existing = paymentWeekVehicle.get(key) || {
        docPayment: co.doc_payment,
        week,
        vehicleId,
        totalGross: 0,
      }
      existing.totalGross += Number(co.order_cost || 0)
      paymentWeekVehicle.set(key, existing)
    }

    for (const [, data] of paymentWeekVehicle) {
      const vehicle = vehicleMap.get(data.vehicleId)
      if (!vehicle) continue
      const typeId = typeMap.get(vehicle.kind)
      if (!typeId) continue
      const vehicleTiers = tierStore.tiers.filter((t: any) => t.vehicle_type_id === typeId)
      if (vehicleTiers.length === 0) continue
      const sortedTiers = [...vehicleTiers].sort((a: any, b: any) => a.gross - b.gross)
      let matchedTier = sortedTiers[sortedTiers.length - 1]
      for (const tier of sortedTiers) {
        if (data.totalGross <= tier.gross) {
          matchedTier = tier
          break
        }
      }
      const commission = (data.totalGross * matchedTier.dispatcher_commission) / 100
      contractTiersMap.set(
        data.docPayment,
        (contractTiersMap.get(data.docPayment) || 0) + commission,
      )
    }
  }

  const paymentsWithNames = await Promise.all(
    (payments || []).map(async (record) => {
      const employeeData = await userStore.resolve(record.employee)
      return {
        ...record,
        fullName: employeeData?.real_name || `ID: ${record.employee}`,
      }
    }),
  )

  paymentsWithNames.sort((a, b) =>
    a.fullName.localeCompare(b.fullName, 'en', { sensitivity: 'base' }),
  )

  let n = 1
  for (const record of paymentsWithNames) {
    const contractTiers = contractTiersMap.get(record.id) || 0
    const to_payment = (record.to_pay || 0) - contractTiers - (record.fixed_salary || 0)

    const bonus = Number(record.settlement_bonus) || 0
    const premium = Number(record.settlement_premium) || 0
    const fine = Number(record.settlement_fine) || 0

    const total_USD = Number(record.payout_usd)
    const vacation = Number(record.settlement_vacation) || 0
    const payout_UZS = total_USD * Number(record.ex_rate) + vacation
    const income_tax = (payout_UZS * (Number(record.income_tax) || 0)) / 100
    const advance = Number(record.settlement_advance) || 0
    const payout_total = payout_UZS - income_tax - advance

    const row = sheet.addRow({
      index: n,
      employee: record.fullName,
      fixed_salary: record.fixed_salary || 0,
      contract_tiers: contractTiers,
      to_payment: to_payment,
      bonus: bonus,
      premium: premium,
      total_usd: total_USD,
      ex_rate: record.ex_rate,
      vacation: vacation,
      fine: fine,
      payout_uzs: payout_UZS,
      income_tax: income_tax,
      advance: advance,
      payout_total: payout_total,
    })

    row.eachCell((cell, colNumber) => {
      if (colNumber >= 3) {
        cell.numFmt = '#,##0.00'
      }
    })

    n++
  }

  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `Salary_${month}_${year}.xlsx`,
  )
}
