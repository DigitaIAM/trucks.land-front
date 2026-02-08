import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'
import type { EmployeePaymentSummary } from '@/stores/employee_unpaid_orders.ts'

export async function dispatcherPerformanceExportToExcel(payments: Array<EmployeePaymentSummary>) {
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('My Sheet')
  const userStore = useUsersStore()

  sheet.columns = [
    { header: 'Dispatcher', key: 'employee', width: 30 },
    { header: 'Total loads', key: 'orders', width: 30 },
    { header: 'Profit', key: 'profit', width: 30 },
  ]

  let n = 0

  for (const record of payments) {
    const employee = await userStore.resolve(record.employee)

    sheet.addRow({
      employee: `${employee?.name}`,
      orders: `${record.orders_number}`,
      profit: `${record.orders_profit}`,
    })

    for (const col of ['B', 'D']) {
      const cell = sheet.getCell(`${col}${n}`)
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

  // Example: Save to a buffer (for download or further processing)
  const buffer = await workbook.xlsx.writeBuffer()

  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    'Dispatcher_Performance.xlsx',
  )
}
