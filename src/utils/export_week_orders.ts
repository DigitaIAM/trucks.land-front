import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'

export async function weekExportToExcel(
  paymentsPromise: Promise<Map<number, PaymentToOwnerSummary>>,
) {
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('My Sheet')

  const paymentToOwnerStore = usePaymentToOwnerStore()
  const userStore = useUsersStore()
  const vehiclesStore = useVehiclesStore()
  const driversStore = useDriversStore()
  const ownerStore = useOwnersStore()
  const organizationsStore = useOrganizationsStore()
  const brokersStore = useBrokersStore()

  sheet.columns = [
    { header: '#', key: 'order', width: 10 },
    { header: 'ref', key: 'ref', width: 20 },
    { header: 'date', key: 'date', width: 20 },
    { header: 'unit', key: 'unit', width: 20 },
    { header: 'driver', key: 'driver', width: 30 },
    { header: 'owner', key: 'owner', width: 30 },
    { header: 'broker', key: 'broker', width: 30 },
    { header: 'from', key: 'from', width: 30 },
    { header: 'state', key: 'state_from', width: 10 },
    { header: 'date', key: 'date_from', width: 20 },
    { header: 'time', key: 'time_from', width: 20 },
    { header: 'to', key: 'to', width: 30 },
    { header: 'state', key: 'state_to', width: 10 },
    { header: 'date', key: 'date_to', width: 20 },
    { header: 'time', key: 'time_to', width: 20 },
    { header: 'dispatcher', key: 'dispatcher', width: 30 },
    { header: 'miles', key: 'miles', width: 10 },
    { header: 'gross', key: 'gross', width: 20 },
    { header: 'driver payment', key: 'd_payment', width: 20 },
    { header: 'profit', key: 'profit', width: 20 },
    { header: '%', key: 'percent', width: 20 },
    { header: 'note', key: 'note', width: 30 },
    { header: 'tranld', key: 'tranld', width: 20 },
    { header: 'tranDate', key: 'tranDate', width: 20 },
    { header: 'vendorRef', key: 'vendorRef', width: 30 },
    { header: 'payableAccountRef_ID', key: 'payableAccountRef_ID', width: 30 },
    {
      header: 'purchaseExpenseLine_category_ID',
      key: 'purchaseExpenseLine_category_ID',
      width: 30,
    },
    { header: 'purchaseExpenseLine_amount', key: 'purchaseExpenseLine_amount', width: 20 },
    { header: 'quick_pay', key: 'quick_pay', width: 20 },
    { header: 'direct_payment', key: 'direct_payment', width: 20 },
    { header: 'class', key: 'class', width: 20 },
    { header: 'week_number', key: 'week_number', width: 20 },
    { header: 'class_custom', key: 'class_custom', width: 20 },
    { header: 'Invoice_ExID', key: 'Invoice_ExID', width: 20 },
  ]

  // let count = 0
  const payments = await paymentsPromise

  const ids = payments.values().map((v) => v.id)
  const detailsList = await paymentToOwnerStore.fetchingDetails(ids)

  for (const payment of payments.values()) {
    // console.log('excel', payment)
    //  count++

    const details = detailsList.get(payment.id)
    for (const detail of details ?? []) {
      const order = detail.order

      if (order.stage === 3) {
        //
      } else {
        const dispatcher = await userStore.resolve(order.created_by)
        const org = await organizationsStore.resolve(order.organization)
        const owner = await ownerStore.resolve(payment.owner)

        const agreement = detail.agreements[0]
        const pickup = detail.pickups[0]
        const delivery = detail.deliveries[0]

        const vehicle = await vehiclesStore.resolve(agreement.vehicle)
        const driver = await driversStore.resolve(agreement.driver)
        const broker = await brokersStore.resolve(order?.broker)

        let createdAt = ''
        if (order?.created_at) {
          createdAt = useDateFormat(order?.created_at, 'MMM DD, HH:mm').value
        }

        let pickupD = ''
        let pickupT = ''
        let deliveryD = ''
        let deliveryT = ''

        if (pickup?.datetime) {
          const date = new Date(pickup?.datetime)
          pickupD = useDateFormat(date, 'MMM DD').value
          pickupT = useDateFormat(date, 'HH:mm').value
        }

        if (delivery?.datetime) {
          const date = new Date(delivery?.datetime)
          deliveryD = useDateFormat(date, 'MMM DD').value
          deliveryT = useDateFormat(date, 'HH:mm').value
        }

        const profit = order.cost - order.driver_cost
        const percent = (profit / order.cost) * 100
        const week = payment.week

        const note = order.notes
        const today = new Date().toISOString().split('T')[0]

        sheet.addRow({
          order: `${org?.code2}-${week}-${order.number}`,
          ref: order?.refs ?? '',
          date: createdAt,
          unit: vehicle?.unit_id,
          driver: driver?.name,
          owner: owner?.name,
          broker: broker?.name,
          from: pickup.address ?? pickup.city ?? '',
          state_from: pickup?.state ?? '',
          date_from: pickupD,
          time_from: pickupT,
          to: delivery?.address ?? delivery.city ?? '',
          state_to: delivery?.state ?? '',
          date_to: deliveryD,
          time_to: deliveryT,
          dispatcher: dispatcher?.name,
          miles: order?.total_miles,
          gross: order.cost,
          d_payment: order.driver_cost,
          profit: profit,
          percent: percent,
          note: note,
          tranld: `${org?.code2}-${week}-${order.number}`,
          tranDate: today,
          vendorRef: owner?.name,
          payableAccountRef_ID: 21000,
          purchaseExpenseLine_category_ID: 62500,
          purchaseExpenseLine_amount: order.driver_cost,
          quick_pay: 'no',
          direct_payment: 'no',
          class: 'CNU Logistics',
          week_number: week,
          class_custom: 'CNU Logistics',
          Invoice_ExID: `${org?.code2}-${week}-${order.number} INV`,
        })
      }
      const colU = sheet.getColumn('U')
      colU.numFmt = '#,##0.0'
      colU.alignment = { horizontal: 'right' }

      // for (const col of ['U']) {
      //   const cell = sheet.getCell(`${col}${n + 1}`)
      //   cell.numFmt = '$#,##0.00'
      // }

      const rowToColor = sheet.getRow(1)

      const fillStyle = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '949494' },
      }

      // Iterate through each cell in the row and apply the fill style
      rowToColor.eachCell((cell) => {
        cell.fill = fillStyle
      })
    }

    // if (count > 1) {
    //   break
    // }
  }

  // Example: Save to a buffer (for download or further processing)
  const buffer = await workbook.xlsx.writeBuffer()

  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `Week-report.xlsx`,
  )
}
