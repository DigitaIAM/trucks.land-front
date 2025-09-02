import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'
import { type PaymentToOwnerSummary, usePaymentToOwnerStore } from '@/stores/payment_to_owners.ts'

export async function weekExportToExcel(payments: Array<PaymentToOwnerSummary>) {
  console.log('start export')

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
    { header: 'date and time', key: 'dateTime_from', width: 20 },
    { header: 'to', key: 'to', width: 30 },
    { header: 'state', key: 'state_to', width: 10 },
    { header: 'date and time', key: 'dateTime_to', width: 20 },
    { header: 'dispatcher', key: 'dispatcher', width: 30 },
    { header: 'miles', key: 'miles', width: 10 },
    { header: 'gross', key: 'gross', width: 20 },
    { header: 'driver payment', key: 'd_payment', width: 20 },
    { header: 'profit', key: 'profit', width: 20 },
    { header: '%', key: 'percent', width: 20 },
    { header: 'comments', key: 'comments', width: 30 },
  ]

  let n = 0
  let count = 0
  for (const payment of payments) {
    count++
    console.log('payment', payment)
    const details = await paymentToOwnerStore.fetchingDetails(payment.id)

    for (const detail of details) {
      console.log('detail', detail)
      const order = detail.order

      const dispatcher = await userStore.resolve(order.dispatcher)
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

      let pickupDT = ''
      if (pickup?.datetime) {
        pickupDT = useDateFormat(pickup.datetime, 'MMM DD, HH:mm').value
      }

      let deliveryDT = ''
      if (delivery?.datetime) {
        deliveryDT = useDateFormat(delivery.datetime, 'MMM DD, HH:mm').value
      }

      const profit = order.cost - order.driver_cost
      const percent = (profit / order.cost) * 100

      sheet.addRow({
        number: ++n,
        order: `${org?.code2}-${order.id}`,
        ref: order?.refs ?? '',
        date: createdAt,
        unit: vehicle?.unit_id,
        driver: driver?.name,
        owner: owner?.name,
        broker: broker?.name,
        from: pickup?.city ?? '',
        state_from: pickup?.state ?? '',
        dateTime_from: pickupDT,
        to: delivery?.city ?? '',
        state_to: delivery?.state ?? '',
        dateTime_to: deliveryDT,
        dispatcher: dispatcher?.name,
        miles: order?.total_miles,
        gross: order.cost,
        d_payment: order.driver_cost,
        profit: profit,
        percent: percent,
        comments: '',
      })

      const cell = sheet.getCell(`R${n}`)
      cell.numFmt = '#,##0.00'
    }

    if (count > 1) {
      break
    }
  }

  // Example: Save to a buffer (for download or further processing)
  const buffer = await workbook.xlsx.writeBuffer()

  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    'week_data.xlsx',
  )
}
