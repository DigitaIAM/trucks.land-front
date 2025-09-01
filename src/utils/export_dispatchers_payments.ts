import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'

export async function paymentToDispatcherExportToExcel(
  payments: Array<PaymentToDispatcherSummary>,
) {
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('My Sheet')
  const userStore = useUsersStore()

  sheet.columns = [
    { header: 'Dispatcher', key: 'dispatcher', width: 30 },
    { header: 'Gross', key: 'gross', width: 30 },
    { header: 'Total loads', key: 'orders', width: 30 },
    { header: '3%', key: 'payout', width: 30 },
  ]

  for (const record of payments) {
    const dispatcher = await userStore.resolve(record.dispatcher)

    console.log('dispatcher', dispatcher)
    sheet.addRow({
      dispatcher: `${dispatcher?.real_name}`,
      gross: `${record.amount}`,
      orders: `${record.number_of_orders}`,
      payout: `${record.to_pay}`,
    })
  }

  // Example: Save to a buffer (for download or further processing)
  const buffer = await workbook.xlsx.writeBuffer()

  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    'my_data.xlsx',
  )
}
