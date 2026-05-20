import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'

export async function employeePaymentsExportToExcel(orgId: number, year: number, month: number) {
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('paysheet')
  const paymentToEmployeeStore = usePaymentToEmployeeStore()
  const userStore = useUsersStore()

  sheet.columns = [
    { header: '№', key: 'index', width: 5, style: { alignment: { horizontal: 'center' } } },
    { header: 'ФИО', key: 'employee', width: 30 },
    { header: 'Оклад в USD', key: 'fixed_salary', width: 15 },
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
    const employeeOrders = allOrders.filter((o) => o.doc_payment === record.id)

    // Суммы direct заказов
    const directStats = employeeOrders.reduce(
      (acc, order) => {
        if (order.profit_kind === 'direct-vehicle' || order.profit_kind === 'direct-dispatcher') {
          acc.orderCost += Number(order.order_cost || 0)
          acc.driverCost += Number(order.driver_cost || 0)
        }
        return acc
      },
      { orderCost: 0, driverCost: 0 },
    )

    // Обычные заказы — вычитаем direct из общих сумм
    const regularGross = Number(record.gross) - directStats.orderCost
    const regularDriverPayment = Number(record.driver_payment) - directStats.driverCost
    const regularToPayment =
      ((regularGross - regularDriverPayment) * record.percent_of_profit) / 100

    // Direct заказы
    const directProfit = employeeOrders.reduce((acc, order) => {
      if (order.profit_kind === 'direct-vehicle' || order.profit_kind === 'direct-dispatcher') {
        const orderProfit = Number(order.order_cost || 0) - Number(order.driver_cost || 0)
        const profitPc = Number(order.profit_pc || 0)

        if (order.profit_kind === 'direct-vehicle') {
          acc += (orderProfit * profitPc) / 100
        } else {
          // direct-dispatcher получает оставшийся процент
          acc += (orderProfit * (100 - profitPc)) / 100
        }
      }
      return acc
    }, 0)

    const directToPayment = (directProfit * record.percent_of_profit) / 100
    const to_payment = regularToPayment + directToPayment

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
