import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib'
import { filterCharSet, openInNewTab } from '@/utils/pdf-helper.ts'
import type { CellContent, DrawTableOptions } from 'pdf-lib-draw-table-beta/types.ts'
import { drawTable } from 'pdf-lib-draw-table-beta'
import moment from 'moment/moment'

const eventsStore = useEventsStore()
const userStore = useUsersStore()
const accessTokenStore = useAccessTokenStore()

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

function drawLine(page: PDFPage, x: number, y: number, width: number, thickness = 1) {
  page.drawLine({
    start: { x: x, y: y },
    end: { x: x + width, y: y },
    thickness: thickness,
    color: rgb(0, 0, 0),
  })
}

export async function generateRC(order: Order, org: Organization) {
  const dispatcher = await userStore.resolve(order.created_by)
  const events = await eventsStore.fetching(order.id)

  if (org.id != order.organization) {
    throw 'fail organization check'
  }

  const token = await accessTokenStore.getTokenZoho(org.id)
  if (token == null) {
    throw 'missing token'
  }

  const signatureURL =
    'https://supabase.trucks.land/storage/v1/object/public/files/signatures/signature_1IBBA1XfO3Rc3Ay4.png'
  const signatureImageBytes = await fetch(signatureURL).then((res) => res.arrayBuffer())

  const pdfDoc = await PDFDocument.create()

  let page = pdfDoc.addPage()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const bls = font.heightAtSize(12) / 2

  // Set the starting X and Y coordinates for the table
  const startX = 50
  const startY = 470

  // Set the table options
  const options = {
    textSize: 10,
    title: {
      text: 'Transportation details',
      textSize: 12,
      font: boldFont,
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
  } as DrawTableOptions

  const tableData = [['Shipper', 'Receiver']] as CellContent[][]

  const pickup = []
  const delivery = []

  for (const event of events) {
    if (event.kind === 'pick-up') {
      pickup.push(filterCharSet(`Pick up`, boldFont))
      pickup.push(filterCharSet(useDateFormat(event.datetime, 'MM/DD/YYYY, HH:mm').value, font))
      pickup.push(filterCharSet(event.company_at_location, font))
      pickup.push(filterCharSet(`Address`, boldFont))
      pickup.push(filterCharSet(event.address, font))
      pickup.push(filterCharSet(event.city, font))
      pickup.push(filterCharSet(`${event.state} ${event.zip}`, font))
      pickup.push(filterCharSet(`Instructions:`, boldFont))
      pickup.push(`${event.details.note}`, boldFont)
    }
    if (event.kind === 'delivery') {
      delivery.push(filterCharSet(`Drop`, boldFont))
      delivery.push(filterCharSet(useDateFormat(event.datetime, 'MM/DD/YYYY, HH:mm').value, font))
      delivery.push(filterCharSet(event.company_at_location, font))
      delivery.push(filterCharSet(`Address`, boldFont))
      delivery.push(filterCharSet(event.address, font))
      delivery.push(filterCharSet(event.city, font))
      delivery.push(filterCharSet(`${event.state} ${event.zip}`, font))
      delivery.push(filterCharSet(`Instructions:`, boldFont))
      delivery.push(`${event.details.note}`, boldFont)
    }
  }

  tableData.push([pickup, delivery])

  const tableDimensions = await drawTable(pdfDoc, page, tableData, startX, startY, options)

  // logo
  if (org.url_logo) {
    const jpgImageBytes = await fetch(org.url_logo).then((res) => res.arrayBuffer())

    const jpgImage = await pdfDoc.embedJpg(jpgImageBytes)
    const jpgDims = jpgImage.size()

    page.drawImage(jpgImage, {
      x: startX,
      y: 710, //page.getHeight() / 2 - jpgDims.height / 2 + 250,
      width: 100,
      height: (100 * jpgDims.height) / jpgDims.width,
    })
  }
  text_left(page, font, 10, `${org.address1}`, startX + bls, 700)
  text_left(page, font, 10, `${org.address2}`, startX + bls, 685)

  text_left(page, font, 12, 'Carrier', startX + bls, 660)
  text_left(page, font, 12, `Representative:`, startX + bls, 645)
  drawLine(page, font.widthOfTextAtSize(`Representative:`, 12) + 60, 645, 100)
  text_left(page, font, 12, 'Phone:', startX + bls, 630)
  drawLine(page, font.widthOfTextAtSize('Phone:', 12) + 60, 630, 145)
  text_left(page, font, 12, 'Email:', startX + bls, 615)
  drawLine(page, font.widthOfTextAtSize('Email:', 12) + 60, 615, 150)

  text_left(page, font, 10, `Broker`, startX + bls, 585)
  text_left(page, font, 10, `Signature:`, startX + bls, 570)

  // const signatureURL =
  //   'https://mckvgyjkhbwfyilzeakw.supabase.co/storage/v1/object/public/files/signatures/signature_1IBBA1XfO3Rc3Ay4.png'
  // const signatureImageBytes = await fetch(signatureURL).then((res) => res.arrayBuffer())

  const signatureImg = await pdfDoc.embedPng(signatureImageBytes)

  const signatureImgDims = signatureImg.scale(0.25)

  page.drawImage(signatureImg, {
    x: startX + 60,
    y: 550,
    width: signatureImgDims.width,
    height: signatureImgDims.height,
  })

  text_left(page, font, 10, `Position: Ops `, 240, 570)

  const dateFormated = moment(order.created_at).format('MM/DD/YYYY')
  text_left(page, font, 10, `Date:`, 400, 570)
  text_left(page, font, 10, dateFormated, font.widthOfTextAtSize('Date:', 10) + 400, 570)
  drawLine(page, startX + bls, 560, 500)

  text_left(page, font, 10, `Carrier`, startX + bls, 540)
  text_left(page, font, 10, `Signature:`, startX + bls, 525)
  drawLine(page, font.widthOfTextAtSize(`Signature:`, 10) + 60, 525, 100)

  text_left(page, font, 10, `Position:`, 240, 525)
  drawLine(page, font.widthOfTextAtSize(`Position:`, 10) + 400, 525, 100)

  text_left(page, font, 10, `Date:`, 400, 525)
  drawLine(page, font.widthOfTextAtSize(`Position:`, 10) + 244, 525, 100)
  drawLine(page, startX + bls, 515, 500)

  text_left(page, font, 12, `Driver name`, startX + bls, 490)
  drawLine(page, font.widthOfTextAtSize(`Driver name`, 12) + 60, 490, 150)

  text_left(page, font, 12, `Driver cell`, 340, 490)
  drawLine(page, font.widthOfTextAtSize(`Driver cell`, 12) + 344, 490, 150)
  // head
  const textX = 50
  let cy = 800
  text_left(page, boldFont, 24, 'Rate', 280, cy - bls)
  text_left(page, boldFont, 24, 'Confirmation', 230, cy - 6 * bls)

  cy -= bls + text_right(page, font, 12, 'Reference#', tableDimensions.endX, cy)
  const numberFormated = `${org.code2}-${order.number}`
  cy -= bls + text_right(page, boldFont, 16, numberFormated, tableDimensions.endX, cy)

  cy -= bls + text_right(page, font, 12, 'Date', tableDimensions.endX, cy)
  cy -= bls + text_right(page, boldFont, 16, dateFormated, tableDimensions.endX, cy)

  cy -= bls * 4

  const cx = tableDimensions.endX - 124

  const fs = 10

  text_left(page, font, 12, `${org.name}`, cx - 100, 660)

  text_left(page, font, 12, 'Representative:', cx - 100, 645)
  text_left(
    page,
    font,
    12,
    `${dispatcher?.name}`,
    font.widthOfTextAtSize('Representative:', 12) + cx - 96,
    645,
  )

  text_left(page, font, 12, 'Phone:', cx - 100, 630)
  text_left(
    page,
    font,
    12,
    `${dispatcher?.phone}`,
    font.widthOfTextAtSize('Phone:', 12) + cx - 96,
    630,
  )

  text_left(page, font, 12, 'Email:', cx - 100, 615)
  text_left(
    page,
    font,
    12,
    `${dispatcher?.email}`,
    font.widthOfTextAtSize('Email:', 12) + cx - 96,
    615,
  )

  //tableBottom
  const tableBottomY = tableDimensions.endY // Calculate the bottom edge of the table
  const textMargin = 16 // Desired margin below the table
  const textY = tableBottomY - textMargin - 10 // Y-coordinate for the start of the text
  // const textX = 50

  text_left(page, boldFont, 10, 'Carrier', textX, textY)
  drawLine(page, font.widthOfTextAtSize('Carrier', 10) + 55, textY, 100)
  text_left(page, boldFont, 10, 'MC#', font.widthOfTextAtSize('Carrier', 10) + 160, textY)
  drawLine(page, font.widthOfTextAtSize('Carrier', 10) + 190, textY, 70)
  text_left(page, boldFont, 10, `Representative:`, textX, textY - 15)
  drawLine(page, font.widthOfTextAtSize(`Representative:`, 10) + 55, textY - 15, 160)
  text_left(page, boldFont, 10, 'Phone:', textX, textY - 30)
  drawLine(page, font.widthOfTextAtSize('Phone:', 10) + 55, textY - 30, 202)
  text_left(page, boldFont, 10, 'Phone after hours:', textX, textY - 45)
  drawLine(page, font.widthOfTextAtSize('Phone after hours:', 10) + 55, textY - 45, 150)
  text_left(page, boldFont, 10, 'Equipment:', textX, textY - 60)
  drawLine(page, font.widthOfTextAtSize('Equipment:', 10) + 55, textY - 60, 180)

  text_left(page, boldFont, fs, 'Final Charge: $', textX + 300, textY)
  text_left(
    page,
    boldFont,
    fs,
    `${order.driver_cost}`,
    font.widthOfTextAtSize('Final Charge: $', 10) + 355,
    textY,
  )

  const size = 10
  page.moveTo(textX, textY - 100)

  page.drawText('All Invoices should be sent to billing@cnulogistics.com', {
    size: size, // Font size
    font: font, // Embedded font
    color: rgb(0, 0, 0),
  })

  page.moveDown(25)

  const lines = [
    'Invoices will not be paid without a P.O.D. Include reference # with a copy of the P.O.D on your invoices.',
    'By signing this page, you agree to install macropoint for your driver. Location sharing must be allowed at all times',
    'during the transportation of the load. When at the pick up location, the driver must input exact cargo quantity,',
    'take a picture and upload to the application as well as upload scanned BOL(All can be done through the app,',
    'we provided you for macropoint!). When delivered, the driver must scan the signed POD. PODs have to be in legible',
    'condition. Otherwise, the invoice will not be paid.',
  ]

  for (const line of lines) {
    page.drawText(line, {
      size: size, // Font size
      font: font, // Embedded font
      color: rgb(0, 0, 0),
    })
    page.moveDown(15)
  }

  page = pdfDoc.addPage()

  page.moveTo(textX, 800)

  page.moveDown(10)
  page.drawText('Accessorials, Delays and OS&D:', {
    size: 10, // Font size
    font: boldFont, // Embedded font
    color: rgb(0, 0, 0),
  })
  page.moveDown(15)

  const lines2 = [
    'Carrier must provide immediate notification of any issues and OS&D situations to SEL via phone',
    '(267-831-4062). The failure to immediately report delays or OS&D situations may result in carrier liability.',
  ]

  for (const line of lines2) {
    page.drawText(line, {
      size: size, // Font size
      font: font, // Embedded font
      color: rgb(0, 0, 0),
    })
    page.moveDown(15)
  }

  // page = pdfDoc.addPage()
  //
  // page.moveTo(textX, 800)

  page.drawText(
    'Carriers must request detention or other charges at time of services rendered or else request may be denied.',
    {
      size: 10, // Font size
      font: font, // Embedded font
      color: rgb(0, 0, 0),
    },
  )
  page.moveDown(15)

  page.moveDown(10)
  page.drawText('Exclusive use:', {
    size: size,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  page.moveDown(15)

  const lines3 = [
    'Services are being procured for exclusive use of the trailer for the shipment attached to this confirmation.',
    'Supplier may not add additional freight to this shipment or transfer freight from the original trailer. Any',
    'unpermitted violation of this requirement will result in a 50% reduction of the agreed upon transportation rate.',
  ]

  for (const line of lines3) {
    page.drawText(line, {
      size: size,
      font: font,
      color: rgb(0, 0, 0),
    })
    page.moveDown(15)
  }

  page.moveDown(10)
  page.drawText('Priority load requirements:', {
    size: size,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  page.moveDown(15)

  const lines4 = [
    'Driver must arrive to shipper with a seal. All seals must be applied and removed by the shipper and consignee',
    'only. Drivers are NEVER allowed to apply or remove a seal. Trailer must be sealed for the duration of the',
    'shipment. Consignee will confirm seal is intact. No loaded trailers are approved to sit at third party locations',
    'or yards other than pre-approved yards that include complete fencing and gates. CVS must be notified',
    'immediately of any circumstance which occurs that requires a truck to be left unattended, but not limited to,',
    'mechanical failure, driver emergency or accidents. Drivers are not permitted to take priority loads home or',
    'leave unattended at any time. The failure to adhere to the foregoing requirements may result in Carrier liability',
    'for any resulting OS&D.',
  ]

  for (const line of lines4) {
    page.drawText(line, {
      size: size,
      font: font,
      color: rgb(0, 0, 0),
    })
    page.moveDown(15)
  }

  page.moveDown(10)
  page.drawText('Any late pick ups and/or deliveries', {
    size: size,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  page.moveDown(15)

  const lines5 = [
    'The following penalties will be applied for late pickup/delivery:',
    '• up to 1 hour - $25;',
    '• 1-2 hours - up to 10% of pay;',
    '• 3-4 hours - up to 20% of pay;',
    '• 5 and over with no communication - 50%or less pay.',
  ]

  for (const line of lines5) {
    page.drawText(line, {
      size: size,
      font: font,
      color: rgb(0, 0, 0),
    })
    page.moveDown(15)
  }

  page.moveDown(10)
  page.drawText('MC Validation:', {
    size: size,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  page.moveDown(15)

  const lines6 = [
    'The truck that arrives for pickup must have the same MC number as was booked with CVS. The carrier must',
    'operate under and permanently display the approved MC number only, otherwise the truck will NOT be',
    'loaded. If truck is loaded, 50% rate reduction for double brokering.',
  ]

  for (const line of lines6) {
    page.drawText(line, {
      size: size,
      font: font,
      color: rgb(0, 0, 0),
    })
    page.moveDown(15)
  }

  page.moveDown(10)
  page.drawText(
    'Carriers to be paid no more than $25/hour on detention with a max layover of $150 per day.',
    {
      size: size,
      font: boldFont,
      color: rgb(0, 0, 0),
    },
  )
  page.moveDown(15)

  const lines7 = [
    'Detention will not be paid if waiting time incurred as a result of carrier arriving late to appointment. Cargo/',
    'Sprinter Van TONU max $75.00. Straight Truck/DryVan - Max TONU fee $100.00',
  ]

  for (const line of lines7) {
    page.drawText(line, {
      size: size,
      font: font,
      color: rgb(0, 0, 0),
    })
    page.moveDown(15)
  }

  page.moveDown(10)
  page.drawText('Team Loads:', {
    size: size,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  page.moveDown(15)

  const lines8 = [
    'If team drivers are procured for a load, both drivers MUST be physically present at the time of pickup and',
    'delivery. Any unpermitted violation of this requirement at the time of pickup will result in non-loading of the',
    'truck, and any unpermitted violation of this requirement at the time of delivery will result in a 50% reduction of',
    'the agreed upon transportation rate.',
  ]

  for (const line of lines8) {
    page.drawText(line, {
      size: size,
      font: font,
      color: rgb(0, 0, 0),
    })
    page.moveDown(15)
  }

  return pdfDoc
}
