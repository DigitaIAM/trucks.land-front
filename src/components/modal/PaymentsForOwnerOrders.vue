<script setup lang="ts">
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from 'pdf-lib'
import { drawTable } from 'pdf-lib-draw-table-beta'
import { CellContent, DrawTableOptions } from 'pdf-lib-draw-table-beta/types.ts'

const props = defineProps<{
  document: PaymentToOwnerSummary | null
}>()

const paymentToOwnerOrdersStore = usePaymentToOwnerOrdersStore()
const paymentToOwnerExpenseStore = usePaymentToOwnerExpenseStore()
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
  paymentToOwnerExpenseStore.loading(document.id)
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

async function generatePdf() {
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

  let jpgUrl = ''

  if (org.id == 1) {
    jpgUrl =
      'https://mckvgyjkhbwfyilzeakw.supabase.co/storage/v1/object/public/files/logos/logo_CAF.jpg'
  }
  if (org.id == 2) {
    jpgUrl =
      'https://mckvgyjkhbwfyilzeakw.supabase.co/storage/v1/object/public/files/logos/logo_CVS.jpg'
  }
  if (org.id == 3) {
    jpgUrl =
      'https://mckvgyjkhbwfyilzeakw.supabase.co/storage/v1/object/public/files/logos/logo_CNU.jpg'
  }

  const jpgImageBytes = await fetch(jpgUrl).then((res) => res.arrayBuffer())

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
      `${org.code2}-${line.doc_order}`,
      vehicle,
      pickup,
      delivery,
      `\$${line.payment?.toFixed(2)}`,
    ])
  }

  const pdfDoc = await PDFDocument.create()

  const jpgImage = await pdfDoc.embedJpg(jpgImageBytes)
  const jpgDims = jpgImage.size()

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

  // logo
  page.drawImage(jpgImage, {
    x: startX,
    y: 710, //page.getHeight() / 2 - jpgDims.height / 2 + 250,
    width: 100,
    height: (100 * jpgDims.height) / jpgDims.width,
  })
  text_left(page, font, 10, `${org.address1}`, startX + bls, 700)
  text_left(page, font, 10, `${org.address2}`, startX + bls, 685)

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

  const fs = 10
  text_right(page, font, fs, 'Trip Related pay:', cx, cy)
  cy -= bls + text_left(page, font, fs, `${document.payment}`, cx + bls, cy)

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
      cy,
    )

  text_right(page, font, fs, 'Total Trips:', cx, cy)
  cy -= bls + text_left(page, font, fs, `${paymentToOwnerOrdersStore.listing.length}`, cx + bls, cy)

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
      `\$${document?.orders}`,
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
      `\$${document?.orders - document?.orders * (0.04 + 0.015)}`,
      font.widthOfTextAtSize('Calculation:', fs) + 60,
      textY,
    )

  textY -= text_right(page, font, fs, 'Expenses:', cx, textY + bls)

  for (const expense of paymentToOwnerExpenseStore.listing) {
    text_right(page, font, fs, expense.kind, cx, textY)
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
      textY,
    )

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

const expensesCols = [
  {
    label: '#',
    value: (v: ExpensesToOwner) => v.id,
    size: 50,
  },

  {
    label: 'details',
    value: (v: ExpensesToOwner) => v.kind,
    size: 200,
  },
  {
    label: 'amount',
    value: (v: ExpensesToOwner) => '$' + v.amount,
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
      <div class="mt-10">
        <Text bold size="lg" class="mb-4">Expenses</Text>
        <table class="w-full text-left table-auto min-w-max">
          <thead>
            <tr
              class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
            >
              <th
                v-for="col in expensesCols"
                :key="col.label"
                class="p-4"
                :style="{ width: col.size + 'px' }"
              >
                <p class="block antialiasing tracking-wider font-thin leading-none">
                  {{ col.label }}
                </p>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="expense in paymentToOwnerExpenseStore.listing" :key="expense.id">
              <td
                v-for="col in expensesCols"
                :key="col.label"
                class="py-3 px-4"
                :style="{ width: col.size + 'px' }"
              >
                <p
                  class="block antialiasing tracking-wide font-light leading-normal truncate"
                  :style="{ width: col.size + 'px' }"
                >
                  {{ col.value(expense) }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex flex-cols-6 gap-40 mt-10">
        <Text bold size="lg">Total</Text>
        <Text size="lg">Orders {{ paymentToOwnerOrdersStore.listing.length }}</Text>
        <Text size="lg">Orders amount $ {{ document?.orders }}</Text>
        <Text size="lg">Payment $ {{ document?.payment }}</Text>
        <Text size="lg">Expenses $ {{ document?.expenses }}</Text>
        <Text size="lg">Payout $ {{ document?.payout }}</Text>
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
