import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'
import type { EmployeePaymentSummary } from '@/stores/employee_unpaid_orders.ts'

export async function dispatchersOrdersMonth(list: Array<EmployeePaymentSummary>) {
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('My Sheet')

  // const dispatcherReportStore = useReportDispatcher()
  const userStore = useUsersStore()
  const eventsStore = useEventsStore()
  const vehiclesStore = useVehiclesStore()
  const organizationsStore = useOrganizationsStore()

  sheet.columns = [
    { header: '#RC', key: 'order', width: 10 },
    { header: 'date', key: 'date', width: 20 },
    { header: 'unit', key: 'unit', width: 20 },
    { header: 'dispatcher', key: 'dispatcher', width: 30 },
    { header: 'profit', key: 'profit', width: 20 },
  ]

  let n = 0

  const orders = []
  for (const detail of list) {
    for (const order of detail.orders ? Array.from(detail.orders.values()) : []) {
      orders.push(order)
    }
  }
  // console.log('orders', orders)

  const agreements = await eventsStore.fetchAgreements(orders.map((v) => v.id))

  for (const order of orders) {
    // console.log('order', order.number, order)
    const orderNumber = order.number
    const dispatcherId = order.created_by
    const dispatcher = await userStore.resolve(dispatcherId)

    const org = await organizationsStore.resolve(order.organization)

    const events = agreements.get(order.id)

    let vehicle
    for (const event of events ?? []) {
      vehicle = await vehiclesStore.resolve(event.vehicle)
      break
    }
    const unit = vehicle?.unit_id

    let createdAt = ''
    if (order.created_at) {
      createdAt = useDateFormat(order.created_at, 'MMM DD, HH:mm').value
    }

    const profit = order.cost - order.driver_cost

    sheet.addRow({
      order: `${org?.code2} - ${orderNumber}`,
      date: createdAt,
      unit: unit,
      dispatcher: dispatcher?.name,
      profit: profit,
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

    n++
  }

  // if (count > 1) {
  //   break
  // }
  //}

  // Example: Save to a buffer (for download or further processing)
  const buffer = await workbook.xlsx.writeBuffer()

  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `Orders_month.xlsx`,
  )
}
