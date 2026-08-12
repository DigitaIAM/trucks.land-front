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

interface OrderLine {
  line: PaymentToOwnerOrder
  order: Order | null
  events: OrderEvent[]
  vehicle: Vehicle | null
  quickPay: QuickPay | null
}

interface VehicleGroup {
  vehicle: Vehicle | null
  contract: boolean
  lines: OrderLine[]
}

export async function generateOwnerPaymentPdf(document: PaymentToOwnerSummary | null) {
  if (document == null) {
    throw 'missing document'
  }

  const ordersStore = useOrdersStore()
  const eventsStore = useEventsStore()
  const vehiclesStore = useVehiclesStore()
  const quickPaysStore = useQuickPaysStore()

  const orgResolved = await useOrganizationsStore().resolve(document.organization)
  if (orgResolved == null) {
    throw 'missing organization'
  }
  const org = orgResolved

  const contraResolved = await useOwnersStore().resolve(document.owner)
  if (contraResolved == null) {
    throw 'missing owner'
  }
  const contra = contraResolved

  const orders = await usePaymentToOwnerOrdersStore().loading(document.id)

  const lines: OrderLine[] = []
  const contractVehicles: Vehicle[] = []

  for (const line of orders.values()) {
    const orderId = line.doc_order
    const events = await eventsStore.fetching(orderId)
    const order = (await ordersStore.resolve(orderId)) ?? null
    const quickPay = await quickPaysStore.findByOrder(orderId)

    let vehicle: Vehicle | null = null
    for (const event of events) {
      if (event.kind === 'agreement') {
        vehicle = await vehiclesStore.resolve(event.vehicle)
        break
      }
    }

    if (vehicle && vehicle.contract && !contractVehicles.some((cv) => cv.id === vehicle.id)) {
      contractVehicles.push(vehicle)
    }

    lines.push({ line, order, events, vehicle, quickPay })
  }

  const isContract = contractVehicles.length > 0

  const groups: VehicleGroup[] = []
  const groupMap = new Map<number, VehicleGroup>()
  for (const entry of lines) {
    const vehicleId = entry.vehicle?.id ?? -1
    let group = groupMap.get(vehicleId)
    if (!group) {
      group = { vehicle: entry.vehicle, contract: entry.vehicle?.contract ?? false, lines: [] }
      groupMap.set(vehicleId, group)
      groups.push(group)
    }
    group.lines.push(entry)
  }

  const expenses = await usePaymentToOwnerExpenseStore().loading(document.id)
  const totalExp = expenses?.reduce((s, e) => s + Number(e.amount ?? 0), 0) ?? 0

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
  cy -= bls + text_right(page, font, 12, 'Pay sheet', rightSide, cy)
  cy -=
    bls +
    text_right(page, boldFont, 16, `${document.week}-${org.code3}- ${document.id}`, rightSide, cy)
  cy -= bls + text_right(page, font, 12, 'Pay period', rightSide, cy)
  cy -=
    bls + text_right(page, boldFont, 16, `WEEK ${document.week} of ${document.year}`, rightSide, cy)

  cy -= bls * 2

  cy -= bls + text_right(page, boldFont, 16, contra.name.toUpperCase(), rightSide, cy)

  cy -= bls * 2

  const fs = 12

  text_right(page, boldFont, fs, `Total trips: ${orders.length}`, rightSide, cy)
  cy -= bls * 4

  const contractHeader = ['#', 'load', 'miles', 'pick up', 'delivery', 'amount', 'quick pay']
  const driverHeader = [
    '#',
    'load',
    'vehicle',
    'miles',
    'pick up',
    'delivery',
    'amount',
    'quick pay',
  ]

  function makeOptions(contract: boolean) {
    return {
      textSize: 10,
      title: {
        text: 'SHIPMENTS DETAILS',
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
        overrideWidths: contract
          ? [25, 55, 45, 100, 100, 50, 75] // без vehicle
          : [25, 55, 55, 45, 90, 90, 45, 75], // с vehicle
      } as ColumnOptions,
    } as DrawTableOptions
  }

  const fh12 = font.heightAtSize(12) * 2
  const fh10 = font.heightAtSize(10) * 2
  const lh10 = font.heightAtSize(10) + 10

  const textMargin = 40

  let tableDimensions = { endY: cy }
  let bottomY = 0

  if (isContract) {
    bottomY = cy
    drawOverallSummary()
    cy = bottomY
  }

  function ensureSpaceForSection() {
    // section header + table title + header row + one data row + section totals
    const needed = font.heightAtSize(16) + bls + fh12 + fh10 * 2 + 7 * lh10 + margin
    if (cy - needed < margin) {
      page = pdfDoc.addPage()
      cy = page.getHeight() - margin
    }
  }

  function drawTotalLine(bold: boolean, text: string) {
    if (bottomY - lh10 < margin) {
      page = pdfDoc.addPage()
      bottomY = page.getHeight() - margin
    }
    text_left(page, bold ? boldFont : font, 10, text, margin, bottomY)
    bottomY -= lh10
  }

  function drawDeductions() {
    if (totalExp > 0) {
      drawTotalLine(true, `Deductions: $${totalExp.toFixed(2)}`)
      for (const e of expenses!) {
        const label = `${e.notes || '-'}:`
        const labelWidth = font.widthOfTextAtSize(filterCharSet(label, font), 10)
        if (bottomY - font.heightAtSize(10) - 5 < margin) {
          page = pdfDoc.addPage()
          bottomY = page.getHeight() - margin
        }
        text_left(page, font, 10, label, margin, bottomY)
        text_left(
          page,
          font,
          10,
          `$${Number(e.amount).toFixed(2)}`,
          margin + labelWidth + 10,
          bottomY,
        )
        bottomY -= font.heightAtSize(10) + 5
      }
      bottomY -= 5
    }
  }

  async function drawGroupTable(group: VehicleGroup) {
    const options = makeOptions(group.contract)
    const header = group.contract ? contractHeader : driverHeader
    let tableData = [header] as CellContent[][]

    let lines = 0
    let pos = 0

    for (const entry of group.lines) {
      const order = entry.order
      if (order?.stage === 3) continue

      const vehicle = []
      const pickup = []
      const delivery = []

      for (const event of entry.events) {
        if (event.kind === 'agreement') {
          const v = entry.vehicle
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

      const cLines = Math.max(1, Math.max(vehicle.length, pickup.length, delivery.length))

      if (cy - fh12 - fh10 * (lines + cLines) < fh12 + margin) {
        tableDimensions = await drawTable(pdfDoc, page, tableData, margin, cy, options)

        page = pdfDoc.addPage()
        tableData = [header] as CellContent[][]

        cy = page.getHeight() - margin
        lines = 0
      }

      lines += cLines

      tableData.push(
        group.contract
          ? [
              `${++pos}`,
              `${org.code2}-${order?.number}`,
              `${order?.total_miles}`,
              pickup,
              delivery,
              `\$${entry.line.amount?.toFixed(2)}`,
              entry.quickPay ? 'yes' : 'no',
            ]
          : [
              `${++pos}`,
              `${org.code2}-${order?.number}`,
              vehicle,
              `${order?.total_miles}`,
              pickup,
              delivery,
              `\$${entry.line.amount?.toFixed(2)}`,
              entry.quickPay ? 'yes' : 'no',
            ],
      )
    }

    if (tableData.length > 1) {
      tableDimensions = await drawTable(pdfDoc, page, tableData, margin, cy, options)
    }
  }

  function drawContractTotals(group: VehicleGroup) {
    const totalGross = group.lines.reduce((sum, e) => sum + (e.line.order_cost ?? 0), 0)
    const totalAmount = group.lines.reduce((sum, e) => sum + (e.line.amount ?? 0), 0)
    const totalQuickPay = group.lines.reduce((sum, e) => sum + (e.quickPay?.to_pay ?? 0), 0)

    const dispatchFeePercent = totalGross > 0 ? (totalAmount / totalGross) * 100 : 0
    const contractorPercent = 100 - dispatchFeePercent

    bottomY = tableDimensions.endY - textMargin

    drawTotalLine(true, `Total gross: $${totalGross.toFixed(2)}`)
    drawTotalLine(true, `Contractor gross earnings: $${totalAmount.toFixed(2)}`)
    drawTotalLine(
      true,
      `Dispatch FEE: ${contractorPercent.toFixed(0)}% - $${(totalGross - totalAmount).toFixed(2)}`,
    )
    drawTotalLine(true, `Contractor percentage: ${dispatchFeePercent.toFixed(0)} %`)
    if (totalQuickPay > 0) {
      drawTotalLine(true, `Quick pay requested for: $${totalQuickPay.toFixed(2)}`)
    }
    drawTotalLine(true, `Net payment: $${(totalAmount - totalQuickPay).toFixed(2)}`)
  }

  function drawDriverTotals(group: VehicleGroup) {
    const totalDriverPayment = group.lines.reduce((sum, e) => sum + (e.line.amount ?? 0), 0)
    const totalQuickPay = group.lines.reduce((sum, e) => sum + (e.quickPay?.to_pay ?? 0), 0)

    bottomY = tableDimensions.endY - textMargin

    drawTotalLine(true, `Total driver payment: $${totalDriverPayment.toFixed(2)}`)
    if (totalQuickPay > 0) {
      drawTotalLine(true, `Quick pay requested for: $${totalQuickPay.toFixed(2)}`)
    }
  }

  function drawOverallSummary() {
    const totalGross = lines.reduce((sum, e) => sum + (e.line.order_cost ?? 0), 0)
    const totalAmount = lines.reduce((sum, e) => sum + (e.line.amount ?? 0), 0)
    const totalQuickPay = lines.reduce((sum, e) => sum + (e.quickPay?.to_pay ?? 0), 0)

    const dispatchFeePercent = totalGross > 0 ? (totalAmount / totalGross) * 100 : 0
    const contractorPercent = 100 - dispatchFeePercent

    bottomY -= lh10

    drawTotalLine(true, `Total gross: $${totalGross.toFixed(2)}`)
    drawTotalLine(true, `Contractor gross earnings: $${totalAmount.toFixed(2)}`)
    drawTotalLine(
      true,
      `Dispatch FEE: ${contractorPercent.toFixed(0)}% - $${(totalGross - totalAmount).toFixed(2)}`,
    )
    drawTotalLine(true, `Contractor percentage: ${dispatchFeePercent.toFixed(0)} %`)
    if (totalQuickPay > 0) {
      drawTotalLine(true, `Quick pay requested for: $${totalQuickPay.toFixed(2)}`)
    }
    drawDeductions()
    drawTotalLine(true, `Net payment: $${(totalAmount - totalQuickPay - totalExp).toFixed(2)}`)
  }

  if (isContract) {
    for (const group of groups) {
      if (!group.lines.some((e) => e.order?.stage !== 3)) continue

      ensureSpaceForSection()

      cy -=
        bls + text_right(page, boldFont, 16, `Unit: ${group.vehicle?.unit_id ?? ''}`, rightSide, cy)
      cy -= bls * 2

      await drawGroupTable(group)

      if (group.contract) {
        drawContractTotals(group)
      } else {
        drawDriverTotals(group)
      }

      cy = bottomY
    }
  } else {
    const group: VehicleGroup = { vehicle: null, contract: false, lines }

    if (group.lines.some((e) => e.order?.stage !== 3)) {
      await drawGroupTable(group)
      drawDriverTotals(group)
    }

    drawDeductions()
  }

  return pdfDoc
}
