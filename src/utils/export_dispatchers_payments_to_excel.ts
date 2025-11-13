import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'

export async function employeePaymentsExportToExcel(
  payments: Array<PaymentToEmployeeSummary>
) {
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('My Sheet')
  const userStore = useUsersStore()

  sheet.columns = [
    { header: 'Dispatcher', key: 'employee', width: 30 },
    { header: 'Gross', key: 'gross', width: 30 },
    { header: 'Total loads', key: 'orders', width: 30 },
    { header: '3%', key: 'payout', width: 30 }
  ]

  let n = 0

  for (const record of payments) {
    const employee = await userStore.resolve(record.employee)

    sheet.addRow({
      employee: `${employee?.real_name}`,
      gross: `${record.gross}`,
      orders: `${record.number_of_orders}`,
      payout: `${record.to_pay}`
    })

    for (const col of ['B', 'D']) {
      const cell = sheet.getCell(`${col}${n}`)
      cell.numFmt = '#,##0.00'
    }

    const rowToColor = sheet.getRow(1)

    const fillStyle = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '949494' }
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
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    'salary_data.xlsx'
  )
}
