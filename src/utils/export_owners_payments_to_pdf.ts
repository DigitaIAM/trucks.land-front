import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib'
import { drawTable } from 'pdf-lib-draw-table-beta'
import type { CellContent, ColumnOptions, DrawTableOptions } from 'pdf-lib-draw-table-beta/types.ts'
import { filterCharSet } from './pdf-helper.ts'
import moment from 'moment-timezone'
import { useQuickPaysStore } from '@/stores/quick_pays.ts'

function text_left(
  page: PDFPage,
  font: PDFFont,
  fontSize: number,
  text: string,
  x: number,
  y: number,
): number {
  // const textWidth = font.widthOfTextAtSize(text, fontSize)

  page.drawText(filterCharSet(text, font), {
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

  page.drawText(filterCharSet(text, font), {
    x: x - textWidth,
    y: y,
    size: fontSize,
    font: font,
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
  const quickPaysStore = useQuickPaysStore()

  const org = await useOrganizationsStore().resolve(document.organization)
  if (org == null) {
    throw 'missing organization'
  }

  const contra = await useOwnersStore().resolve(document.owner)
  if (contra == null) {
    throw 'missing owner'
  }

  const orders = await usePaymentToOwnerOrdersStore().loading(document.id)

  let contractVehicle: any = null
  for (const line of orders.values()) {
    const events = await eventsStore.fetching(line.doc_order)
    for (const event of events) {
      if (event.kind === 'agreement') {
        const v = await vehiclesStore.resolve(event.vehicle)
        if (v) {
          contractVehicle = v
          break
        }
      }
    }
    if (contractVehicle) break
  }

  const isContract = contractVehicle?.contract === true

  // console.log('orders', orders)

  //const expenses = await usePaymentToOwnerExpenseStore().loading(document.id)

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
      height: (100 * jpgDims.height) / jpgDims.width,
    })
  }

  text_left(page, font, 10, `${org.address1}`, margin + bls, 700)
  text_left(page, font, 10, `${org.address2}`, margin + bls, 685)

  const rightSide = page.getWidth() - margin

  // head
  let cy = 800
  cy -= bls + text_right(page, font, 12, 'Pay Sheet', rightSide, cy)
  cy -=
    bls +
    text_right(page, boldFont, 16, `${document.week}-${org.code3}- ${document.id}`, rightSide, cy)
  cy -= bls + text_right(page, font, 12, 'Pay Period', rightSide, cy)
  cy -=
    bls + text_right(page, boldFont, 16, `WEEK ${document.week} of ${document.year}`, rightSide, cy)

  cy -= bls * 2

  cy -= bls + text_right(page, boldFont, 16, contra.name.toUpperCase(), rightSide, cy)

  if (isContract && contractVehicle) {
    cy -=
      bls +
      text_right(
        page,
        boldFont,
        16,
        filterCharSet(`Unit: ${contractVehicle.unit_id}`, font),
        rightSide,
        cy,
      )
  }

  cy -= bls * 2

  const fs = 12

  text_right(page, boldFont, fs, `Total Trips: ${orders.length}`, rightSide, cy)
  cy -= bls * 2

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
    contentAlignment: 'center',
    font: font,
    column: {
      widthMode: 'auto',
      overrideWidths: isContract
        ? [25, 55, 45, 100, 100, 50, 75] // без vehicle
        : [25, 55, 55, 45, 90, 90, 45, 75], // с vehicle
    } as ColumnOptions,
  } as DrawTableOptions

  const fh12 = font.heightAtSize(options.title.textSize) * 2
  const fh10 = font.heightAtSize(options.textSize) * 2

  let tableData = [
    isContract
      ? ['#', 'load', 'miles', 'pick up', 'delivery', 'amount', 'quick pay']
      : ['#', 'load', 'vehicle', 'miles', 'pick up', 'delivery', 'amount', 'quick pay'],
  ] as CellContent[][]

  let lines = 0
  let pos = 0
  let tableDimensions = { endY: cy }

  const quickPayMap = new Map<number, QuickPay | null>()

  console.log('orders type', Array.isArray(orders), orders)

  for (const line of orders.values()) {
    const orderId = line.doc_order
    const events = await eventsStore.fetching(orderId)
    const order = await ordersStore.resolve(orderId)
    const quickPay = await quickPaysStore.findByOrder(orderId)
    quickPayMap.set(orderId, quickPay)

    console.log('line', line)

    if (order?.stage === 3) {
    } else {
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
          pickup.push(
            filterCharSet(
              moment(event.datetime).tz('America/New_York').format('MM/DD, HH:mm a'),
              font,
            ),
          )
          pickup.push(filterCharSet(event.city, font))
          pickup.push(filterCharSet(`${event.state} ${event.zip}`, font))
        }
        if (event.kind === 'delivery') {
          delivery.push(
            filterCharSet(
              moment(event.datetime).tz('America/New_York').format('MM/DD, HH:mm a'),
              font,
            ),
          )
          delivery.push(filterCharSet(event.city, font))
          delivery.push(filterCharSet(`${event.state} ${event.zip}`, font))
        }
      }

      const cLines = Math.max(1, Math.max(pickup.length, delivery.length))

      if (cy - fh12 - fh10 * (lines + cLines) < fh12 + margin) {
        tableDimensions = await drawTable(pdfDoc, page, tableData, margin, cy, options)

        page = pdfDoc.addPage()
        tableData = [
          isContract
            ? ['#', 'load', 'miles', 'pick up', 'delivery', 'amount', 'quick pay']
            : ['#', 'load', 'vehicle', 'miles', 'pick up', 'delivery', 'amount', 'quick pay'],
        ] as CellContent[][]

        cy = page.getHeight() - margin
        lines = 0
      }

      lines += cLines

      tableData.push(
        isContract
          ? [
              `${++pos}`,
              `${org.code2}-${order?.number}`,
              `${order?.total_miles}`,
              pickup,
              delivery,
              `\$${line.amount?.toFixed(2)}`,
              quickPay ? 'yes' : 'no',
            ]
          : [
              `${++pos}`,
              `${org.code2}-${order?.number}`,
              vehicle,
              `${order?.total_miles}`,
              pickup,
              delivery,
              `\$${line.amount?.toFixed(2)}`,
              quickPay ? 'yes' : 'no',
            ],
      )
    }
  }

  const totalQuickPay = Array.from(quickPayMap.values()).reduce(
    (sum, qp) => sum + (qp?.to_pay ?? 0),
    0,
  )

  if (tableData.length > 1) {
    tableDimensions = await drawTable(pdfDoc, page, tableData, margin, cy, options)
  }

  //tableBottom
  const tableBottomY = tableDimensions.endY
  const textMargin = 40

  const totalGross = orders.reduce((sum, line) => sum + (line.order_cost ?? 0), 0)

  let bottomY = tableBottomY - textMargin

  if (isContract) {
    const totalAmount = orders.reduce((sum, line) => sum + (line.amount ?? 0), 0)
    const dispatchFeePercent = (totalAmount / totalGross) * 100
    const contractorPercent = 100 - dispatchFeePercent

    text_left(page, boldFont, 10, `Total Gross: $${totalGross.toFixed(2)}`, margin, bottomY)
    bottomY -= font.heightAtSize(10) + 5

    text_left(
      page,
      boldFont,
      10,
      `Contractor Gross Earnings: $${totalAmount.toFixed(2)}`,
      margin,
      bottomY,
    )
    bottomY -= font.heightAtSize(10) + 5

    text_left(
      page,
      boldFont,
      10,
      `Dispatch Fee: ${dispatchFeePercent.toFixed(0)} % - $${((totalGross * dispatchFeePercent) / 100).toFixed(2)}`,
      margin,
      bottomY,
    )
    bottomY -= font.heightAtSize(10) + 5

    text_left(
      page,
      boldFont,
      10,
      `Contractor Percentage: ${contractorPercent.toFixed(0)}%`,
      margin,
      bottomY,
    )
    bottomY -= font.heightAtSize(10) + 5

    if (totalQuickPay > 0) {
      text_left(
        page,
        boldFont,
        10,
        `Quick Pay requested for: $${totalQuickPay.toFixed(2)}`,
        margin,
        bottomY,
      )
      bottomY -= font.heightAtSize(10) + 5
    }

    const netPayment = totalAmount - totalQuickPay
    text_left(page, boldFont, 10, `Net Payment: $${netPayment.toFixed(2)}`, margin, bottomY)
    bottomY -= font.heightAtSize(10) + 5
  } else {
    if (totalQuickPay > 0) {
      text_left(
        page,
        boldFont,
        10,
        `Quick Pay requested for: $${totalQuickPay.toFixed(2)}`,
        margin,
        bottomY,
      )
      bottomY -= font.heightAtSize(10) + 5
    }
  }

  return pdfDoc
}
