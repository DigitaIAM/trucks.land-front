import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib'
import moment from 'moment-timezone'
import type { PaymentToEmployeeSummary } from '@/stores/employee_payments.ts'
import { useEmployeePaymentSettlementsStore } from '@/stores/employee_payment_settlements.ts'

const margin = 50

export async function generateDispatcherPaymentPdf(document: PaymentToEmployeeSummary | null) {
  if (document == null) {
    throw 'missing document'
  }

  const org = await useOrganizationsStore().resolve(document.organization)
  if (org == null) {
    throw 'missing organization'
  }

  const token = await useAccessTokenStore().getTokenZoho(org.id)
  if (token == null) {
    throw 'missing token'
  }

  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Вызываем оригинальную шапку
  let cy = await _head(pdfDoc, page, font, boldFont, document, org, page.getWidth() - margin)

  const cx = page.getWidth() - margin
  const fs = 10
  const bls = font.heightAtSize(12) / 2

  // Опускаем блок контента ниже, чтобы он не налезал на шапку
  cy -= 50

  // Переменная для настройки комфортного вертикального отступа между строками данных
  const rowSpacing = bls + 15

  // --- СЕКЦИЯ 1: ЗАКАЗЫ И РАСЧЕТЫ ПО НИМ (USD) ---
  cy = drawSectionHeader(page, boldFont, 'ORDERS (USD)', cy, page.getWidth() - margin)

  const gross = Number(document.gross ?? 0)
  const driverPayment = Number(document.driver_payment ?? 0)
  const actualProfit = gross - driverPayment

  text_right(page, font, fs, 'total gross:', cx - 120, cy)
  text_left(page, font, fs, `\$${gross.toFixed(2)}`, cx - 100, cy)
  cy -= rowSpacing

  text_right(page, font, fs, 'driver payments:', cx - 120, cy)
  text_left(page, font, fs, `\$${driverPayment.toFixed(2)}`, cx - 100, cy)
  cy -= rowSpacing

  text_right(page, font, fs, 'profit:', cx - 120, cy)
  text_left(page, boldFont, fs, `\$${actualProfit.toFixed(2)}`, cx - 100, cy)
  cy -= rowSpacing

  text_right(page, font, fs, 'dispatcher %:', cx - 120, cy)
  text_left(page, font, fs, `${document.percent_of_profit}`, cx - 100, cy)
  cy -= rowSpacing

  text_right(page, font, fs, 'calculation:', cx - 120, cy)
  text_left(page, boldFont, fs, `\$${document.to_pay.toFixed(2)}`, cx - 100, cy)

  // Большой отступ перед следующей секцией
  cy -= bls * 4

  // --- СЕКЦИЯ 2: SETTLEMENTS ПО ТИПАМ (USD) ---
  cy = drawSectionHeader(page, boldFont, 'SETTLEMENTS', cy, page.getWidth() - margin)

  const epsStore = useEmployeePaymentSettlementsStore()
  const typeStore = useEmployeeSettlementsTypeStore()

  await epsStore.loading(document.id)

  const linkedSettlements = epsStore.listing || []

  let totalSettlementsUsd = 0
  let vacationUzs = 0
  let advanceUzs = 0

  const usdSettlementsToRender = []

  // Распределяем начисления по валютам и типам
  for (const setl of linkedSettlements) {
    let typeLabel = 'Adjustment'
    let rawType = ''

    if (setl.settlement_type) {
      const typeObject = await typeStore.resolve(Number(setl.settlement_type))
      if (typeObject && typeObject.settlement_type) {
        rawType = typeObject.settlement_type.toLowerCase().trim()
        typeLabel = typeObject.settlement_type
      }
    }

    const amt = Number(setl.amount ?? 0)

    if (rawType === 'vacation') {
      vacationUzs += amt
    } else if (rawType === 'advance') {
      advanceUzs += amt
    } else {
      // Сюда попадает 'fine' и любые другие USD-корректировки
      totalSettlementsUsd += amt
      usdSettlementsToRender.push({ label: typeLabel, amount: amt })
    }
  }

  // Рендерим USD-начисления (включая Fine) во 2-й секции
  if (usdSettlementsToRender.length === 0) {
    text_left(page, font, fs, 'No USD settlements or adjustments for this period.', margin, cy)
    cy -= rowSpacing
  } else {
    for (const item of usdSettlementsToRender) {
      let formattedLabel = item.label
      formattedLabel = formattedLabel.replace(/[^\x00-\x7F]/g, '').trim() || 'Adjustment'

      const prefix = item.amount >= 0 ? '+' : ''

      text_left(page, font, fs, `${formattedLabel}:`, margin + 10, cy)
      text_left(page, font, fs, `${prefix}\$${item.amount.toFixed(2)}`, margin + 140, cy)
      cy -= rowSpacing
    }
  }

  cy -= 6
  text_left(page, boldFont, fs, 'Total USD Settlements:', margin + 10, cy)
  text_left(page, boldFont, fs, `\$${totalSettlementsUsd.toFixed(2)}`, margin + 140, cy)

  cy -= 20
  // --- СЕКЦИЯ 3: ИТОГОВЫЙ РАСЧЕТ И НАЛОГИ (UZS) ---

  cy -= 20

  cy = drawSectionHeader(page, boldFont, 'PAYOUT (UZS)', cy, page.getWidth() - margin)

  const totalPayUsd = (document.to_pay ?? 0) + totalSettlementsUsd
  text_right(page, font, fs, 'total:', cx - 120, cy)
  text_left(page, boldFont, fs, `\$${totalPayUsd.toFixed(2)}`, cx - 100, cy)
  cy -= rowSpacing + 4

  text_right(page, font, fs, 'exchange rate (UZS):', cx - 120, cy)
  text_left(
    page,
    font,
    fs,
    `${document.ex_rate.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`,
    cx - 100,
    cy,
  )
  cy -= rowSpacing

  if (vacationUzs !== 0) {
    const vPrefix = vacationUzs >= 0 ? '+' : ''
    text_right(page, font, fs, 'vacation (UZS):', cx - 120, cy)
    text_left(page, font, fs, `${vPrefix}${formatSum(vacationUzs)} UZS`, cx - 100, cy)
    cy -= rowSpacing
  }

  const toPaySumUzs = totalPayUsd * document.ex_rate
  text_right(page, font, fs, 'amount (UZS):', cx - 120, cy)
  text_left(page, font, fs, `${formatSum(toPaySumUzs)}`, cx - 100, cy)
  cy -= rowSpacing

  const incomeTaxPercent = document.income_tax || 7.5
  const taxAmountUzs = (toPaySumUzs * incomeTaxPercent) / 100
  text_right(page, font, fs, `${incomeTaxPercent} % income tax (UZS):`, cx - 120, cy)
  text_left(page, font, fs, `-${formatSum(taxAmountUzs)}`, cx - 100, cy)
  cy -= rowSpacing + 4

  if (advanceUzs !== 0) {
    const aPrefix = advanceUzs > 0 ? '-' : ''
    text_right(page, font, fs, 'advance (UZS):', cx - 120, cy)
    text_left(page, font, fs, `${aPrefix}${formatSum(Math.abs(advanceUzs))} UZS`, cx - 100, cy)
    cy -= rowSpacing + 4
  }

  const finalPayoutUzs = toPaySumUzs - taxAmountUzs
  text_right(page, boldFont, 11, 'FINAL PAYOUT (UZS):', cx - 120, cy)
  text_left(
    page,
    boldFont,
    11,
    `${Math.round(finalPayoutUzs)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`,
    cx - 100,
    cy,
  )

  return pdfDoc
}

// Помощник разделения секций линией с увеличенным нижним падингом
function drawSectionHeader(
  page: PDFPage,
  font: PDFFont,
  title: string,
  y: number,
  width: number,
): number {
  page.drawText(title, {
    x: margin,
    y: y,
    size: 11,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  })

  page.drawLine({
    start: { x: margin, y: y - 8 },
    end: { x: width, y: y - 8 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  })

  // Увеличили отступ от линии до первой строчки данных
  return y - 28
}

function formatSum(num: number): string {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// ОРИГИНАЛЬНАЯ ШАПКА БЕЗ ИЗМЕНЕНИЙ В РАЗМЕТКЕ
async function _head(
  pdfDoc: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  document: PaymentToEmployeeSummary,
  org: Organization,
  endX: number,
): Promise<number> {
  const bls = font.heightAtSize(12) / 2
  const startX = 50

  if (org.url_logo) {
    const jpgImageBytes = await fetch(org.url_logo).then((res) => res.arrayBuffer())

    const jpgImage = await pdfDoc.embedJpg(jpgImageBytes)
    const jpgDims = jpgImage.size()

    // logo
    page.drawImage(jpgImage, {
      x: startX,
      y: 710,
      width: 100,
      height: (100 * jpgDims.height) / jpgDims.width,
    })
  }
  text_left(page, font, 10, `${org.address1}`, startX + bls, 700)
  text_left(page, font, 10, `${org.address2}`, startX + bls, 685)

  // head
  let cy = 800
  cy -= bls + text_right(page, font, 12, 'Pay Sheet', endX, cy)
  cy -= bls + text_right(page, boldFont, 16, `${document.month} of ${document.year}`, endX, cy)
  cy -= bls + text_right(page, font, 12, 'Pay Period', endX, cy)

  const date1 = moment(document.created_at)
    .tz('America/New_York')
    .subtract(30, 'days')
    .format('MM/DD/YYYY')
  const date2 = moment(document.created_at).tz('America/New_York').format('MM/DD/YYYY')

  cy -= bls + text_right(page, boldFont, 16, `${date1} - ${date2}`, endX, cy)

  cy -= bls * 3

  const employee = await useUsersStore().resolve(document.employee)
  if (employee == null) {
    throw 'missing employee'
  }
  cy -= bls + text_right(page, boldFont, 16, employee.real_name.toUpperCase(), endX, cy)

  return cy
}

function text_left(
  page: PDFPage,
  font: PDFFont,
  fontSize: number,
  text: string,
  x: number,
  y: number,
): number {
  page.drawText(text, {
    x: x,
    y: y,
    size: fontSize,
    font: font,
  })
  return font.heightAtSize(fontSize)
}

function text_right(
  page: PDFPage,
  font: PDFFont,
  fontSize: number,
  text: string,
  x: number,
  y: number,
): number {
  const textWidth = font.widthOfTextAtSize(text, fontSize)
  page.drawText(text, {
    x: x - textWidth,
    y: y,
    size: fontSize,
    font: font,
  })
  return font.heightAtSize(fontSize)
}
