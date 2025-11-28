import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib'
import { drawTable } from 'pdf-lib-draw-table-beta'
import moment from 'moment'
import type { CellContent, ColumnOptions, DrawTableOptions } from 'pdf-lib-draw-table-beta/types.ts'
import type { PaymentToEmployeeSummary } from '@/stores/employee_payments.ts'

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

  let currentY = await _head(pdfDoc, page, font, boldFont, document, org, page.getWidth() - margin)

  // Set the table options
  const options = {
    textSize: 10,
    title: {
      text: 'Shipments Details',
      textSize: 12,
      font: font,
      alignment: 'center',
    },
    header: {
      hasHeaderRow: true,
      font: font,
      textSize: 10,
      backgroundColor: rgb(0.9, 0.9, 0.9),
      contentAlignment: 'center',
    },
    border: {
      color: rgb(0.9, 0.9, 0.9),
      width: 0.4,
    },
    font: font,
    column: {
      widthMode: 'auto',
      overrideWidths: [30, 150, 150],
    } as ColumnOptions,
  } as DrawTableOptions

  const fh12 = font.heightAtSize(options.title.textSize) * 1.8
  const fh10 = font.heightAtSize(options.textSize) * 1.8

  // Define the table data
  let tableData = [['#', 'order', 'gross']] as CellContent[][]

  const lines = await usePaymentToEmployeeStore().fetchingOrder(document.id)
  let pos = 0
  for (const line of lines) {
    tableData.push([`${++pos}`, `${org.code2}-${line.order.number}`, `\$${line.order.cost}`])

    if (currentY - fh12 - fh10 * (tableData.length - 1) < fh12) {
      await drawTable(pdfDoc, page, tableData, margin, currentY, options)

      page = pdfDoc.addPage()
      tableData = [['#', 'order', 'gross']] as CellContent[][]

      currentY = page.getHeight() - margin
    }
  }

  if (tableData.length > 1) {
    await drawTable(pdfDoc, page, tableData, margin, currentY, options)
  }

  return pdfDoc
}

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

  // Set the starting X and Y coordinates for the table
  const startX = 50

  if (org.url_logo) {
    const jpgImageBytes = await fetch(org.url_logo).then((res) => res.arrayBuffer())

    const jpgImage = await pdfDoc.embedJpg(jpgImageBytes)
    const jpgDims = jpgImage.size()

    // logo
    page.drawImage(jpgImage, {
      x: startX,
      y: 710, //page.getHeight() / 2 - jpgDims.height / 2 + 250,
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

  const date1 = moment(document.created_at).subtract(30, 'days').format('MM/DD/YYYY')
  const date2 = moment(document.created_at).format('MM/DD/YYYY')

  // const period = ts.month() + 2
  cy -= bls + text_right(page, boldFont, 16, `${date1} - ${date2}`, endX, cy)

  cy -= bls * 3

  const employee = await useUsersStore().resolve(document.employee)
  if (employee == null) {
    throw 'missing employee'
  }
  cy -= bls + text_right(page, boldFont, 16, employee.real_name.toUpperCase(), endX, cy)

  cy -= bls * 3

  const cx = endX - 50

  const fs = 10
  text_right(page, font, fs, 'Total gross:', cx, cy)
  cy -= bls + text_left(page, font, fs, `\$${document.gross}`, cx + bls, cy)

  text_right(page, font, fs, 'Dispatch fee:', cx, cy)
  cy -= bls + text_left(page, font, fs, `${document.percent_of_gross}\%`, cx + bls, cy)

  text_right(page, font, fs, 'Calculation:', cx, cy)
  cy -= bls + text_left(page, font, fs, `\$${document.to_pay}`, cx + bls, cy)

  text_right(page, font, fs, 'Settlements:', cx, cy)
  cy -= bls + text_left(page, font, fs, `\$${document.settlements}`, cx + bls, cy)

  const toPay = (document.to_pay + document.settlements).valueOf()
  text_right(page, boldFont, fs, 'Total pay:', cx, cy)
  cy -= bls + text_left(page, boldFont, fs, `\$${toPay}`, cx + bls, cy)

  //text left
  // const textMargin = 40 // Desired margin below the table
  // cy = cy - textMargin
  const textX = 50

  //
  // text_left(page, font, fs, 'Vacation pay:', textX + bls, cy)
  // cy -= bls + text_left(page, font, fs, '+$', font.widthOfTextAtSize('Vacation pay:', fs) + 60, cy)

  text_left(page, font, fs, 'Ex rate:', textX + bls, cy)
  cy -=
    bls +
    text_left(
      page,
      font,
      fs,
      `${document.ex_rate} sum`,
      font.widthOfTextAtSize('Ex rate:', fs) + 60,
      cy,
    )

  text_left(page, font, fs, 'Date:', textX + bls, cy)
  cy -= bls + text_left(page, font, fs, `${date1}`, font.widthOfTextAtSize('Date:', fs) + 60, cy)

  const toPaySum = toPay * document.ex_rate
  text_left(page, font, fs, 'Calculation:', textX + bls, cy)
  cy -=
    bls +
    text_left(
      page,
      font,
      fs,
      `${toPaySum.toFixed(2)} sum`,
      font.widthOfTextAtSize('Calculation:', fs) + 60,
      cy,
    )

  text_left(page, font, fs, 'Taxes:', textX + bls, cy)
  cy -=
    bls +
    text_left(
      page,
      font,
      fs,
      `${document.income_tax} %`,
      font.widthOfTextAtSize('Taxes:', fs) + 60,
      cy,
    )

  const perIn_tax = (toPaySum * (document.income_tax - 0.1)) / 100
  text_left(page, font, fs, 'Personal Income Tax:', textX + bls, cy)
  cy -=
    bls +
    text_left(
      page,
      font,
      fs,
      `${perIn_tax.toFixed(2)} sum`,
      font.widthOfTextAtSize('Personal Income Tax:', fs) + 60,
      cy,
    )

  const inps_tax = (toPaySum * 0.1) / 100
  text_left(page, font, fs, 'INPS:', textX + bls, cy)
  cy -=
    bls +
    text_left(
      page,
      font,
      fs,
      `${inps_tax.toFixed(2)} sum`,
      font.widthOfTextAtSize('INPS:', fs) + 60,
      cy,
    )

  const totalInSum = toPaySum - perIn_tax
  text_left(page, boldFont, fs, 'Total pay:', textX + bls, cy)
  cy -=
    bls * 2 +
    text_left(
      page,
      boldFont,
      fs,
      `${totalInSum.toFixed(2)} sum`,
      font.widthOfTextAtSize('Total pay:', fs) + 65,
      cy,
    )

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
  // const textWidth = font.widthOfTextAtSize(text, fontSize)

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
