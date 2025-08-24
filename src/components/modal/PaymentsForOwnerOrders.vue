<script setup lang="ts">
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb, Color } from 'pdf-lib'
import { drawTable } from 'pdf-lib-draw-table-beta'
import {
  Alignment,
  CellContent,
  type CustomStyledText,
  DrawTableOptions,
} from 'pdf-lib-draw-table-beta/types.ts'
import type { PaymentToOwnerOrder } from '@/stores/payment_to_owners_orders.ts'

const props = defineProps<{
  document: PaymentToOwnerSummary | null
}>()

const paymentToOwnerOrdersStore = usePaymentToOwnerOrdersStore()
const eventsStore = useEventsStore()
const vehiclesStore = useVehiclesStore()
const ownerStore = useOwnersStore()
const organizationsStore = useOrganizationsStore()

watch(
  () => props.document,
  (document) => {
    resetAndShow(document)
  },
  { deep: true },
)

// resetAndShow(props.id)

function resetAndShow(document: PaymentToOwnerSummary) {
  details.showModal()
  paymentToOwnerOrdersStore.loading(document.id)
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
  //
  // console.log('textWidth', textWidth)
  // console.log('x', x - textWidth)

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

async function generatePdf() {
  console.log('generatePdf')
  const document = props.document
  if (document == null) {
    return
  }

  const org = await organizationsStore.resolve(document.organization)
  if (org == null) {
    return
  }

  const contra = await ownerStore.resolve(document.owner)
  if (contra == null) {
    return
  }

  // Define the table data
  const tableData = [['order #', 'unit no', 'pick up', 'delivery', 'amount']] as CellContent[][]

  for (const line of paymentToOwnerOrdersStore.listing.values()) {
    const events = await eventsStore.fetching(line.doc_order)

    const vehicle = []
    const pickup = []
    const delivery = []

    for (const event of events) {
      if (event.kind === 'agreement') {
        const v = await vehiclesStore.resolve(event.vehicle)
        if (v) {
          vehicle.push(v.name)
        }
      }
      if (event.kind === 'pick-up') {
        pickup.push(useDateFormat(event.datetime, 'MMM DD, HH:mm').value)
        pickup.push(event.city)
        pickup.push(`${event.state} ${event.zip}`)
      }
      if (event.kind === 'delivery') {
        delivery.push(useDateFormat(event.datetime, 'MMM DD, HH:mm').value)
        delivery.push(event.city)
        delivery.push(`${event.state} ${event.zip}`)
      }
    }

    tableData.push([
      `${org.code2}-${line.id}`,
      vehicle,
      pickup,
      delivery,
      `\$${line.payment?.toFixed(2)}`,
    ])
  }

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

  const tableDimensions = await drawTable(pdfDoc, page, tableData, startX, startY, options)

  console.log('tableDimensions', tableDimensions)

  // head
  let cy = 800
  cy -= bls + text_right(page, font, 12, 'Pay Sheet', tableDimensions.endX, cy)
  cy -=
    bls +
    text_right(
      page,
      boldFont,
      16,
      `${document.week}-${org.code3}-${document.id}`,
      tableDimensions.endX,
      cy,
    )
  cy -= bls + text_right(page, font, 12, 'Pay Period', tableDimensions.endX, cy)
  cy -=
    bls +
    text_right(
      page,
      boldFont,
      16,
      `WEEK #${document.week} of ${document.year}`,
      tableDimensions.endX,
      cy,
    )

  cy -= bls * 2

  cy -= bls + text_right(page, boldFont, 16, contra.name.toUpperCase(), tableDimensions.endX, cy)

  cy -= bls * 2

  const cx = tableDimensions.endX - 50
  const weekly = 25
  const totalPay = document?.payment.toFixed(2)

  const fs = 10
  text_right(page, font, fs, 'Trip Related pay:', cx, cy)
  cy -= bls + text_left(page, font, fs, '$6945.75', cx + bls, cy)

  text_right(page, font, fs, 'Total Reimbursable Expenses:', cx, cy)
  cy -= bls + text_left(page, font, fs, '$0.00', cx + bls, cy)

  text_right(page, font, fs, 'Total Deductions:', cx, cy)
  cy -= bls + text_left(page, font, fs, '$0.00', cx + bls, cy)

  text_right(page, font, fs, 'Total Pay:', cx, cy)
  cy -= bls + text_left(page, font, fs, `\$${(totalPay - weekly).toFixed(0)}`, cx + bls, cy)

  text_right(page, font, fs, 'Total Trips:', cx, cy)
  cy -= bls + text_left(page, font, fs, `${paymentToOwnerOrdersStore.listing.length}`, cx + bls, cy)

  console.log('cy', cy)

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
      textY,
    )

  text_left(page, font, fs, 'Total gross:', textX + bls, textY)
  textY -=
    bls +
    text_left(
      page,
      font,
      fs,
      `\$${document?.amount}`,
      font.widthOfTextAtSize('Total gross:', fs) + 60,
      textY,
    )

  text_left(page, font, fs, 'Calculation:', textX + bls, textY)
  textY -=
    bls * 2 +
    text_left(
      page,
      font,
      fs,
      `\$${document?.amount - document?.amount * (0.04 + 0.015)}`,
      font.widthOfTextAtSize('Calculation:', fs) + 60,
      textY,
    )

  textY -= bls + text_left(page, font, fs, 'Expenses:', textX + bls, textY)
  text_left(page, font, fs, 'Fleet care (weekly):', textX + bls, textY)
  textY -=
    bls +
    text_left(
      page,
      font,
      fs,
      `\$${weekly}`,
      font.widthOfTextAtSize('Fleet care (weekly):', fs) + 60,
      textY,
    )

  text_left(page, font, fs, 'Calculation:', textX + bls, textY)
  textY -=
    bls * 2 +
    text_left(
      page,
      font,
      fs,
      `\$${document?.amount - document?.amount * (0.04 + 0.015) - weekly}`,
      font.widthOfTextAtSize('Calculation:', fs) + 60,
      textY,
    )

  console.log('tableBottomY', tableBottomY)

  // Save the PDF
  const pdfBytes = await pdfDoc.save()

  // You can then display or download the PDF (e.g., in a browser)
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  // Open in a new tab or use in an iframe
  window.open(url)
}

const cols = [
  {
    label: '#',
    value: (v: PaymentToOwnerOrder) => v.doc_order,
    size: 30,
  },

  {
    label: 'cost',
    value: (v: PaymentToOwnerOrder) => '$' + v.amount,
    size: 120,
  },
  {
    label: 'd/payments',
    value: (v: PaymentToOwnerOrder) => '$' + v.payment,
    size: 120,
  },
  {
    label: 'payout',
    value: (v: PaymentToOwnerOrder) => '$' + v.payment,
    size: 120,
  },
]
</script>

<template>
  <Modal id="details">
    <ModalBox class="max-w-[calc(90vw-6.25rem)]">
      <div class="flex flex-cols-6 gap-10">
        <Text size="2xl">Payment # {{ document?.id }}</Text>
        <Text size="2xl">week {{ document?.week }}</Text>
        <Text size="2xl">to</Text>
        <div>
          <Text size="2xl">
            <QueryAndShow :id="props.document?.owner" :store="ownerStore" />
          </Text>
        </div>
        <Text size="2xl">$ {{ document?.payment }}</Text>
        <Button class="btn-soft font-light tracking-wider ml-6" @click="generatePdf">pdf</Button>
      </div>
      <div class="mb-4 mt-4">
        <Text bold size="lg" class="mb-4 mt-4">Orders</Text>
      </div>
      <table class="w-full text-left table-auto min-w-max">
        <thead>
          <tr
            class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
          >
            <th v-for="col in cols" class="p-4" :style="{ width: col.size + 'px' }">
              <p class="block antialiasing tracking-wider font-thin leading-none">
                {{ col.label }}
              </p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in paymentToOwnerOrdersStore.listing">
            <td v-for="col in cols" class="py-3 px-4" :style="{ width: col.size + 'px' }">
              <p
                class="block antialiasing tracking-wide font-light leading-normal truncate"
                :style="{ width: col.size + 'px' }"
              >
                {{ col.value(line) }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex flex-cols-5 gap-60 mt-10">
        <Text bold size="lg">Total</Text>
        <Text size="lg">Orders {{ paymentToOwnerOrdersStore.listing.length }}</Text>
        <Text size="lg">Orders amount $ {{ document?.amount }}</Text>
        <Text size="lg">Payment $ {{ document?.payment }}</Text>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
