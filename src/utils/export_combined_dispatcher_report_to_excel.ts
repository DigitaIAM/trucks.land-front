import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'

export interface ExcelRecord {
  employeeName: string
  fixed_salary: number
  to_pay: number
  settlement_bonus: number
  settlement_premium: number
  settlement_fine: number
  settlement_vacation: number
  settlement_advance: number
  payout_usd: number
}

export async function combinedDispatcherReportExportToExcel(
  data: ExcelRecord[],
  exRate: number,
  year: number,
  month: number,
) {
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('paysheet')

  sheet.columns = [
    { header: '№', key: 'index', width: 5, style: { alignment: { horizontal: 'center' } } },
    { header: 'ФИО', key: 'employee', width: 30 },
    { header: 'Оклад в USD', key: 'fixed_salary', width: 15 },
    { header: 'Комиссионные в USD', key: 'to_payment', width: 20 },
    { header: 'Бонусы в USD', key: 'bonus', width: 15 },
    { header: 'Премия в USD', key: 'premium', width: 15 },
    { header: 'Штраф в USD', key: 'fine', width: 15 },
    { header: 'Итого в USD', key: 'total_usd', width: 15 },
    { header: 'Курс в UZS', key: 'ex_rate', width: 15 },
    { header: 'Отпускные UZS', key: 'vacation', width: 15 },
    { header: 'Итого в UZS', key: 'payout_uzs', width: 20 },
    { header: 'НДФЛ 7.5%', key: 'income_tax', width: 20 },
    { header: 'Аванс UZS', key: 'advance', width: 15 },
    { header: 'К выплате UZS', key: 'payout_total', width: 20 },
  ]

  const headerRow = sheet.getRow(1)

  headerRow.alignment = {
    vertical: 'middle',
    horizontal: 'center',
  }

  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '949494' },
  }
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }

  const sorted = [...data].sort((a, b) =>
    a.employeeName.localeCompare(b.employeeName, 'en', { sensitivity: 'base' }),
  )

  let n = 1
  for (const record of sorted) {
    const total_USD = record.payout_usd
    const vacation = record.settlement_vacation
    const payout_UZS = total_USD * exRate + vacation
    const income_tax = (payout_UZS * 7.5) / 100
    const advance = record.settlement_advance
    const payout_total = payout_UZS - income_tax - advance

    const row = sheet.addRow({
      index: n,
      employee: record.employeeName,
      fixed_salary: record.fixed_salary || 0,
      to_payment: record.to_pay,
      bonus: record.settlement_bonus,
      premium: record.settlement_premium,
      total_usd: total_USD,
      ex_rate: exRate,
      vacation: vacation,
      fine: record.settlement_fine,
      payout_uzs: payout_UZS,
      income_tax: income_tax,
      advance: advance,
      payout_total: payout_total,
    })

    row.eachCell((cell, colNumber) => {
      if (colNumber >= 3) {
        cell.numFmt = '#,##0.00'
      }
    })

    n++
  }

  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `combined_salary_${month}_${year}.xlsx`,
  )
}
