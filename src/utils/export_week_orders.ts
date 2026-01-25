import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'
import { type PaymentToOwnerSummary, usePaymentToOwnerStore } from '@/stores/owner_payments.ts'

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
    { header: '#', key: 'number', width: 10 },
    { header: '#order', key: 'order', width: 10 },
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
  ]

  let n = 0
  // let count = 0
  const payments = await paymentsPromise
  console.log('payments', payments.size)

  const ids = payments.values().map((v) => v.id)
  const detailsList = await paymentToOwnerStore.fetchingDetails(ids)

  for (const payment of payments.values()) {
    // console.log('excel', payment)
    //   count++

    const details = detailsList.get(payment.id)
    for (const detail of details) {
      const order = detail.order

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
      if (pickup?.datetime) {
        const date = new Date(pickup?.datetime)
        pickupD = useDateFormat(date, 'MMM DD').value
        pickupT = useDateFormat(date, 'HH:mm').value
      }

      let deliveryD = ''
      let deliveryT = ''
      if (delivery?.datetime) {
        const date = new Date(delivery?.datetime)
        deliveryD = useDateFormat(date, 'MMM DD').value
        deliveryT = useDateFormat(date, 'HH:mm').value
      }

      const profit = order.cost - order.driver_cost
      const percent = (profit / order.cost) * 100
      const week = payment.week

      sheet.addRow({
        number: ++n,
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
      })

      for (const col of ['S', 'T', 'U', 'V']) {
        const cell = sheet.getCell(`${col}${n + 1}`)
        cell.numFmt = '#,##0.00'
      }

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
