import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'

export async function weekExportQuickPay(quickPayments: Array<Order>) {
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('My Sheet')

  const eventStore = useEventsStore()
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

  for (const order of quickPayments) {
    const detailsList = await eventStore.fetching(order.id)

    let vehicle,
      driver,
      owner = ''
    let deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryD = '',
      deliveryT = ''
    let pickupAddress,
      pickupCity,
      pickupState,
      pickupD = '',
      pickupT = ''

    for (const detail of detailsList) {
      if (detail.kind === 'agreement') {
        vehicle = await vehiclesStore.resolve(detail.vehicle)
        driver = await driversStore.resolve(detail.driver)
        owner = await ownerStore.resolve(vehicle?.owner)
      } else if (detail.kind === 'delivery') {
        if (detail.datetime) {
          const date = new Date(detail.datetime)
          deliveryD = useDateFormat(date, 'MMM DD').value
          deliveryT = useDateFormat(date, 'HH:mm').value
        }
        deliveryAddress = detail.address
        deliveryCity = detail.city
        deliveryState = detail.state
      } else if (detail.kind === 'pick-up') {
        if (detail.datetime) {
          const date = new Date(detail.datetime)
          pickupD = useDateFormat(date, 'MMM DD').value
          pickupT = useDateFormat(date, 'HH:mm').value
        }
        pickupAddress = detail.address
        pickupCity = detail.city
        pickupState = detail.state
      }
    }

    const dispatcher = await userStore.resolve(order.created_by)
    const org = await organizationsStore.resolve(order.organization)
    const broker = await brokersStore.resolve(order?.broker)

    const createdAt = order?.created_at
      ? useDateFormat(order.created_at, 'MMM DD, HH:mm').value
      : ''
    const profit = order.cost - order.driver_cost
    const percent = (profit / order.cost) * 100

    sheet.addRow({
      number: ++n,
      order: `${org?.code2}-${order.number}`,
      ref: order?.refs ?? '',
      date: createdAt,
      unit: vehicle?.unit_id,
      driver: driver?.name,
      owner: owner?.name,
      broker: broker?.name,
      from: pickupAddress || pickupCity || '',
      state_from: pickupState || '',
      date_from: pickupD,
      time_from: pickupT,
      to: deliveryAddress || deliveryCity || '',
      state_to: deliveryState || '',
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

  const buffer = await workbook.xlsx.writeBuffer()

  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `Week-report.xlsx`,
  )
}
