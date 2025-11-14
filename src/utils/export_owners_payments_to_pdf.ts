import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib'
import { drawTable } from 'pdf-lib-draw-table-beta'
import type { CellContent, DrawTableOptions } from 'pdf-lib-draw-table-beta/types.ts'
import { filterCharSet } from './pdf-helper.ts'

function text_left(
  page: PDFPage,
  font: PDFFont,
  fontSize: number,
  text: string,
  x: number,
  y: number
): number {
  // const textWidth = font.widthOfTextAtSize(text, fontSize)

  page.drawText(filterCharSet(text, font), {
    x: x,
    y: y,
    size: fontSize,
    font: font
  })

  return font.heightAtSize(fontSize)
}

function text_right(
  page: PDFPage,
  font: PDFFont,
  fontSize: number,
  text: string,
  x: number,
  y: number
): number {
  const textWidth = font.widthOfTextAtSize(text, fontSize)

  page.drawText(filterCharSet(text, font), {
    x: x - textWidth,
    y: y,
    size: fontSize,
    font: font
  })

  return font.heightAtSize(fontSize)
}

const margin = 50

export async function generateOwnerPaymentPdf(document: PaymentToOwnerSummary | null) {
  if (document == null) {
    throw 'missing document'
  }

  const ordersStore = useOrdersStore()
  const eventsStore = useEventsStore()
  const vehiclesStore = useVehiclesStore()

  const org = await useOrganizationsStore().resolve(document.organization)
  if (org == null) {
    throw 'missing organization'
  }

  const contra = await useOwnersStore().resolve(document.owner)
  if (contra == null) {
    throw 'missing owner'
  }

  const orders = await usePaymentToOwnerOrdersStore().loading(document.id)

  const expenses = await usePaymentToOwnerExpenseStore().loading(document.id)

  const pdfDoc = await PDFDocument.create()

  let page = pdfDoc.addPage()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const bls = font.heightAtSize(12) / 2

  // logo
  if (org.url_logo) {
    const jpgImageBytes = await fetch(org.url_logo).then((res) => res.arrayBuffer())
    const jpgImage = await pdfDoc.embedJpg(jpgImageBytes)
    const jpgDims = jpgImage.size()

    page.drawImage(jpgImage, {
      x: margin,
      y: 710, //page.getHeight() / 2 - jpgDims.height / 2 + 250,
      width: 100,
      height: (100 * jpgDims.height) / jpgDims.width
    })
  }

  text_left(page, font, 10, `${org.address1}`, margin + bls, 700)
  text_left(page, font, 10, `${org.address2}`, margin + bls, 685)

  const rightSide = page.getWidth() - 2 * margin

  // head
  let cy = 800
  cy -= bls + text_right(page, font, 12, 'Pay Sheet', rightSide, cy)
  cy -=
    bls +
    text_right(page, boldFont, 16, `${document.week}-${org.code3}-${document.id}`, rightSide, cy)
  cy -= bls + text_right(page, font, 12, 'Pay Period', rightSide, cy)
  cy -=
    bls + text_right(page, boldFont, 16, `WEEK ${document.week} of ${document.year}`, rightSide, cy)

  cy -= bls * 2

  cy -= bls + text_right(page, boldFont, 16, contra.name.toUpperCase(), rightSide, cy)

  cy -= bls * 2

  const cx = rightSide - 50

  const fs = 10
  text_right(page, font, fs, 'Trip Related pay:', cx, cy)
  cy -= bls + text_left(page, font, fs, `\$${document.amount}`, cx + bls, cy)

  text_right(page, font, fs, 'Total Reimbursable Expenses:', cx, cy)
  cy -= bls + text_left(page, font, fs, '$0.00', cx + bls, cy)

  text_right(page, font, fs, 'Total Deductions:', cx, cy)
  cy -= bls + text_left(page, font, fs, '$0.00', cx + bls, cy)

  text_right(page, font, fs, 'Total Pay:', cx, cy)
  cy -=
    bls +
    text_left(
      page,
      font,
      fs,
      `\$${(document?.orders - document?.orders * (0.04 + 0.015) - document.expenses).toFixed(0)}`,
      cx + bls,
      cy
    )

  text_right(page, font, fs, 'Total Trips:', cx, cy)
  cy -= bls + text_left(page, font, fs, `${orders.length}`, cx + bls, cy)

  // Set the table options
  const options = {
    textSize: 10,
    title: {
      text: 'Shipments Details',
      textSize: 12,
      font: font,
      alignment: 'center'
    },
    header: {
      hasHeaderRow: true,
      font: font,
      textSize: 10,
      backgroundColor: rgb(0.9, 0.9, 0.9),
      contentAlignment: 'center'
    },
    border: {
      color: rgb(0.9, 0.9, 0.9),
      width: 0.4
    },
    font: font
  } as DrawTableOptions

  const fh12 = font.heightAtSize(options.title.textSize) * 2
  const fh10 = font.heightAtSize(options.textSize) * 2

  let tableData = [['order #', 'unit no', 'pick up', 'delivery', 'amount']] as CellContent[][]
  let lines = 0
  let tableDimensions = { endY: cy }

  for (const line of orders.values()) {
    const events = await eventsStore.fetching(line.doc_order)

    const vehicle = []
    const pickup = []
    const delivery = []

    for (const event of events) {
      if (event.kind === 'agreement') {
        const v = await vehiclesStore.resolve(event.vehicle)
        if (v) {
          vehicle.push(filterCharSet(v.name, font))
        }
      }
      if (event.kind === 'pick-up') {
        pickup.push(filterCharSet(useDateFormat(event.datetime, 'MMM DD, HH:mm').value, font))
        pickup.push(filterCharSet(event.city, font))
        pickup.push(filterCharSet(`${event.state} ${event.zip}`, font))
      }
      if (event.kind === 'delivery') {
        delivery.push(filterCharSet(useDateFormat(event.datetime, 'MMM DD, HH:mm').value, font))
        delivery.push(filterCharSet(event.city, font))
        delivery.push(filterCharSet(`${event.state} ${event.zip}`, font))
      }
    }

    const cLines = Math.max(1, Math.max(pickup.length, delivery.length))

    if (cy - fh12 - fh10 * (lines + cLines) < fh12 + margin) {
      tableDimensions = await drawTable(pdfDoc, page, tableData, margin, cy, options)

      page = pdfDoc.addPage()
      tableData = [['order #', 'unit no', 'pick up', 'delivery', 'amount']] as CellContent[][]

      cy = page.getHeight() - margin
      lines = 0
    }

    lines += cLines

    const order = await ordersStore.resolve(line.doc_order)

    tableData.push([
      `${org.code2}-${order?.number}`,
      vehicle,
      pickup,
      delivery,
      `\$${line.amount?.toFixed(2)}`
    ])
  }

  if (tableData.length > 1) {
    tableDimensions = await drawTable(pdfDoc, page, tableData, margin, cy, options)
  }

  //tableBottom
  const tableBottomY = tableDimensions.endY // Calculate the bottom edge of the table
  const textMargin = 40 // Desired margin below the table
  let textY = tableBottomY - textMargin // Y-coordinate for the start of the text
  const textX = 50

  text_left(page, font, fs, 'Dispatch fee:', textX + bls, textY)
  textY -=
    bls + text_left(page, font, fs, '4%', font.widthOfTextAtSize('Dispatch fee:', fs) + 60, textY)

  text_left(page, font, fs, 'Factoring/Quick pay fee:', textX + bls, textY)
  textY -=
    bls +
    text_left(
      page,
      font,
      fs,
      '1.5%',
      font.widthOfTextAtSize('Factoring/Quick pay fee:', fs) + 60,
      textY
    )

  text_left(page, font, fs, 'Total gross:', textX + bls, textY)
  textY -=
    bls +
    text_left(
      page,
      font,
      fs,
      `\$${document?.orders}`,
      font.widthOfTextAtSize('Total gross:', fs) + 60,
      textY
    )

  text_left(page, font, fs, 'Calculation:', textX + bls, textY)
  textY -=
    bls * 2 +
    text_left(
      page,
      font,
      fs,
      `\$${document?.orders - document?.orders * (0.04 + 0.015)}`,
      font.widthOfTextAtSize('Calculation:', fs) + 60,
      textY
    )

  textY -= text_right(page, font, fs, 'Expenses:', cx, textY + bls)

  for (const expense of expenses) {
    text_right(page, font, fs, expense.notes, cx, textY)
    textY -= bls + text_left(page, font, fs, `\$${expense.amount}`, cx + bls, textY)
  }

  text_left(page, font, fs, 'Calculation:', textX + bls, textY)
  textY -=
    bls * 2 +
    text_left(
      page,
      font,
      fs,
      `\$${document?.orders - document?.orders * (0.04 + 0.015) - document.expenses}`,
      font.widthOfTextAtSize('Calculation:', fs) + 60,
      textY
    )

  return pdfDoc
}
