import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'
import type { EmployeePaymentSummary } from '@/stores/employee_unpaid_orders.ts'

export async function dispatcherPerformanceExportToExcel(
  payments: Array<EmployeePaymentSummary>,
  dateFrom?: string,
  dateTo?: string,
) {
  const workbook = new Workbook()
  const userStore = useUsersStore()
  const vehiclesStore = useVehiclesStore()

  // ── Sheet 1: Summary ──
  const summarySheet = workbook.addWorksheet('Summary')
  summarySheet.columns = [
    { header: 'Dispatcher', key: 'employee', width: 30 },
    { header: 'Total loads', key: 'orders', width: 30 },
    { header: 'Profit', key: 'profit', width: 30 },
  ]

  const headerFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: '949494' },
  }

  for (const record of payments) {
    const employee = await userStore.resolve(record.employee)
    summarySheet.addRow({
      employee: employee?.name ?? '',
      orders: record.orders_number,
      profit: record.orders_profit,
    })
  }

  summarySheet.getRow(1).eachCell((cell) => {
    cell.fill = headerFill
  })

  // ── Sheet 2: Vehicles ──
  const vehicleSheet = workbook.addWorksheet('Vehicles')
  vehicleSheet.columns = [
    { header: 'Dispatcher', key: 'employee', width: 30 },
    { header: 'Unit Id', key: 'unitId', width: 20 },
    { header: 'Loads', key: 'loads', width: 20 },
    { header: 'Profit', key: 'profit', width: 20 },
  ]

  for (const record of payments) {
    const employee = await userStore.resolve(record.employee)
    const employeeName = employee?.name ?? ''
    const vehicleAgg = new Map<
      number,
      { vehicleId: number; ordersCount: number; totalProfit: number }
    >()
    let noVehicleOrders = 0
    let noVehicleProfit = 0

    for (const [orderId, order] of record.orders) {
      const profit = (order.cost || 0) - (order.driver_cost || 0)
      const vehicleId = record.orderToVehicle.get(Number(orderId))
      if (vehicleId) {
        const d = vehicleAgg.get(vehicleId) || {
          vehicleId,
          ordersCount: 0,
          totalProfit: 0,
        }
        d.ordersCount++
        d.totalProfit += profit
        vehicleAgg.set(vehicleId, d)
      } else {
        noVehicleOrders++
        noVehicleProfit += profit
      }
    }

    for (const [, data] of vehicleAgg) {
      const vehicle = await vehiclesStore.resolve(data.vehicleId)
      vehicleSheet.addRow({
        employee: employeeName,
        unitId: vehicle?.name ?? '-',
        loads: data.ordersCount,
        profit: data.totalProfit,
      })
    }

    if (noVehicleOrders > 0) {
      vehicleSheet.addRow({
        employee: employeeName,
        unitId: 'No vehicle',
        loads: noVehicleOrders,
        profit: noVehicleProfit,
      })
    }
  }

  vehicleSheet.getRow(1).eachCell((cell) => {
    cell.fill = headerFill
  })

  const buffer = await workbook.xlsx.writeBuffer()

  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `Dispatcher_Performance${dateFrom ? `_${dateFrom}_${dateTo}` : ''}.xlsx`,
  )
}
