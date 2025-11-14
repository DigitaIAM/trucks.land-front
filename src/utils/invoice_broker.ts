import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib'
import { drawTable } from 'pdf-lib-draw-table-beta'
import type { CellContent, DrawTableOptions } from 'pdf-lib-draw-table-beta/types.ts'
import moment from 'moment'
import type { FileRecord } from '@/stores/order_files.ts'
import { createFetch } from '@vueuse/core'
import { openInNewTab } from '@/utils/pdf-helper.ts'

const eventsStore = useEventsStore()
const userStore = useUsersStore()
const filesStore = useFilesStore()
const accessTokenStore = useAccessTokenStore()

function text_left(
  page: PDFPage,
  font: PDFFont,
  fontSize: number,
  text: string,
  x: number,
  y: number
): number {
  // const textWidth = font.widthOfTextAtSize(text, fontSize)

  page.drawText(text, {
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

  page.drawText(text, {
    x: x - textWidth,
    y: y,
    size: fontSize,
    font: font
  })

  return font.heightAtSize(fontSize)
}

export async function generateBI(
  order: Order,
  org: Organization,
  broker: Broker,
  record: FileRecord
): Promise<Blob> {
  const dispatcher = await userStore.resolve(order.created_by)
  const events = await eventsStore.fetching(order.id)
  const files = await filesStore.request(order.id)

  if (org.id != order.organization) {
    throw 'fail organization check'
  }

  if (broker.id != order.broker) {
    throw 'fail broker check'
  }

  const token = await accessTokenStore.getTokenZoho(org.id)
  if (token == null) {
    throw 'missing token'
  }

  const pieces = (order?.total_pieces as number) ?? ''
  const weight = (order?.total_weight as number) ?? ''

  let pickup_kind: string = ''
  let pickup_city: string = ''
  let pickup_state: string = ''
  let pickup_zip: string = ''
  let delivery_kind: string = ''
  let delivery_city: string = ''
  let delivery_state: string = ''
  let delivery_zip: string = ''

  for (const event of events) {
    if (event.kind === 'pick-up') {
      pickup_kind = event.kind
      pickup_city = event.city
      pickup_state = event.state
      pickup_zip = event.zip
    }
    if (event.kind === 'delivery') {
      delivery_kind = event.kind
      delivery_city = event.city
      delivery_state = event.state
      delivery_zip = event.zip
    }
  }

  const tableData = [
    ['event', 'location', 'pieces', 'weight', ''],
    [pickup_kind, `${pickup_city} ${pickup_state} ${pickup_zip}`, `${pieces}`, `${weight}`, `BOL:`],
    [
      delivery_kind,
      `${delivery_city} ${delivery_state} ${delivery_zip}`,
      '',
      '',
      `POD: ${dispatcher?.name}`
    ]
  ] as CellContent[][]

  const pdfDoc = await PDFDocument.create()

  const page = pdfDoc.addPage()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const bls = font.heightAtSize(12) / 2

  // Set the starting X and Y coordinates for the table
  const startX = 50
  const startY = 580

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
      height: (100 * jpgDims.height) / jpgDims.width
    })
  }
  text_left(page, font, 10, `${org.address1}`, startX + bls, 700)
  text_left(page, font, 10, `${org.address2}`, startX + bls, 685)

  // head
  let cy = 800
  cy -= bls + text_right(page, font, 12, 'Invoice number', tableDimensions.endX, cy + 2 * bls)
  const ts = moment().subtract(3, 'days')
  const currentWeek = ref(ts.isoWeek())
  const currentYear = ref(ts.year())
  const numberFormated = `${org.code2}-${currentWeek.value}-${order.number}`
  cy -= bls + text_right(page, boldFont, 16, numberFormated, tableDimensions.endX, cy + bls)

  cy -= bls + text_right(page, font, 12, 'Invoice date', tableDimensions.endX, cy + bls)
  const dateFormated = moment(record.created_at).format('MM/DD/YYYY')
  cy -= bls + text_right(page, boldFont, 16, dateFormated, tableDimensions.endX, cy)

  cy -= bls * 4

  const cx = tableDimensions.endX - 124

  const fs = 10

  text_right(page, boldFont, fs, 'REFs:', cx, cy)
  cy -= bls + text_left(page, font, fs, `${order?.refs}`, cx + bls, cy)

  text_right(page, boldFont, fs, 'BILLING TERMS:', cx, cy)
  cy -= bls + text_left(page, font, fs, 'Third Party', cx + bls, cy)

  text_right(page, boldFont, fs, 'ORDERED BY:', cx, cy)
  cy -= bls + text_left(page, font, fs, 'Carrier team (Third Party)', cx + bls, cy)

  text_right(page, boldFont, fs, 'DUE DATE:', cx, cy)
  const due_date = moment(record.created_at).add(30, 'days').format('MM/DD/YYYY')
  cy -= bls + text_left(page, font, fs, `${due_date}`, cx + bls, cy)

  // text left
  text_left(page, boldFont, fs, 'Bill To:', 50, cy)
  cy -= bls + text_left(page, font, fs, `${broker?.name}`, 50, cy - bls * 3)
  cy -= bls + text_left(page, font, fs, `${broker?.street}`, 50, cy - bls * 3)
  cy -=
    bls +
    text_left(page, font, fs, `${broker?.city} , ${broker?.state} ${broker?.zip}`, 50, cy - bls * 3)

  //tableBottom
  const tableBottomY = tableDimensions.endY // Calculate the bottom edge of the table
  const textMargin = 16 // Desired margin below the table
  let textY = tableBottomY - textMargin // Y-coordinate for the start of the text
  const textX = 50

  text_left(page, boldFont, fs, 'Totals', textX, textY)
  text_left(page, boldFont, fs, 'Miles:', 150, textY)
  textY -= bls + text_left(page, boldFont, fs, `${order.total_miles}`, 180, textY)
  text_left(page, boldFont, fs, `${pieces}`, 250, textY + 13)
  text_left(page, boldFont, fs, `${weight} Pounds`, 350, textY + 13)

  text_left(page, boldFont, fs, 'Charge Type', textX, textY - 20)
  text_left(page, font, fs, 'per mile', textX, textY - 36)

  text_left(page, boldFont, fs, 'Leg', 200, textY - 20)
  text_left(page, font, fs, `${pieces}`, 200, textY - 36)

  text_left(page, boldFont, fs, 'Quantity', 320, textY - 20)
  text_left(page, font, fs, `${order.total_miles} Miles`, 320, textY - 36)

  text_left(page, boldFont, fs, 'Total Charges: $ US', 400, textY - 52)

  text_left(page, boldFont, fs, 'Amount', tableDimensions.endX - 40, textY - 20)
  text_left(page, font, fs, `\$${order.cost}`, tableDimensions.endX - 40, textY - 36)
  text_left(page, boldFont, fs, `${order.cost}`, tableDimensions.endX - 40, textY - 52)

  const paths = []
  for (const file of files) {
    if (file.kind == 'RC') {
      paths.push(file.path)
    }
  }
  for (const file of files) {
    if (file.kind == 'POD') {
      paths.push(file.path)
    }
  }

  for (const path of paths) {
    const { data: pdfBlob, error } = await supabase.storage.from('orders').download(path)

    const donorPdf = await PDFDocument.load(await pdfBlob.arrayBuffer())
    const pages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices())
    for (const page of pages) {
      pdfDoc.addPage(page)
    }
    console.log('error', error)
  }

  // Save the PDF and send email
  const pdfBytes = await pdfDoc.save()

  await openInNewTab(pdfDoc)


  const base64String = await pdfDoc.saveAsBase64()

  const email = {
    from: { address: `noreply@${org.domain}` },
    to: [{ email_address: { address: `${broker?.email}`, name: `${broker?.name}` } }], //'shabanovanatali@gmail.com', name: ''  `${broker?.email}`, name: `${broker?.name}`
    subject: `Invoice ${currentWeek.value}-${org.code2}-${order.id}`,
    htmlbody:
      'Greetings,<br />' +
      '<br />' +
      'Invoice #&nbsp;' +
      `${currentWeek.value}` +
      '&nbsp;of&nbsp;' +
      `${currentYear.value}` +
      '&nbsp;is attached.<br />' +
      '<br />' +
      'For any inquiries regarding calculations, please contact us at emma.clark@caravanfreight.net <br />' +
      '<br />' +
      'Best Regards,<br />' +
      '<br />' +
      `${org.name}<br />` +
      `${org.address1}<br />` +
      `${org.address2}<br />`,
    attachments: [
      {
        name: `invoice_${currentWeek.value}-${org.code2}-${order.number}.pdf`,
        content: base64String,
        mime_type: 'plain/txt'
      }
    ]
  }

  const myFetch = createFetch({
    // baseUrl: 'https://api.zeptomail.com/',
    // baseUrl: 'http://localhost:5173/',
    options: {
      async beforeFetch({ options }) {
        options.headers = {
          ...options.headers,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: token
        }
        return { options }
      }
    },
    fetchOptions: { mode: 'cors' }
  })

  const { isFetching, error, data } = await myFetch('/zeptomail/v1.1/email').post(email)

  console.log('isFetching', isFetching)
  console.log('error', error)
  console.log('data', data)

  return new Blob([pdfBytes], { type: 'application/pdf' })
}
