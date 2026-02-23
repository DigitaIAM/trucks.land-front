import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'

export async function employeePaymentsExportToExcel(payments: Array<PaymentToEmployeeSummary>) {
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('My Sheet')
  const userStore = useUsersStore()

  sheet.columns = [
    { header: 'Dispatcher', key: 'employee', width: 30 },
    { header: 'Total loads', key: 'orders', width: 10 },
    { header: 'Gross', key: 'gross', width: 20 },
    {header: 'Dr_payment', key: 'd_payment', width: 20},
    {header: 'Profit', key: 'profit', width: 20},
    { header: '9%', key: 'payout', width: 20 },
  ]

  let n = 0

  for (const record of payments) {
    const employee = await userStore.resolve(record.employee)

    const profit = record.gross - record.driver_payment

    sheet.addRow({
      employee: `${employee?.real_name}`,
      orders: `${record.number_of_orders}`,
      gross: `${record.gross}`,
      d_payment: `${record.driver_payment}`,
      profit: `${profit}`,
      payout: `${record.to_pay}`,
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
    'salary_data.xlsx',
  )
}
