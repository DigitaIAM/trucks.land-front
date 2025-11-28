<script setup lang="ts">
import { createFetch } from '@vueuse/core'
import { generateOwnerPaymentPdf } from '@/utils/export_owners_payments_to_pdf.ts'
import { openInNewTab } from '@/utils/pdf-helper.ts'

const props = defineProps<{
  document: PaymentToOwnerSummary | null
}>()

const paymentToOwnerOrdersStore = usePaymentToOwnerOrdersStore()
const paymentToOwnerExpenseStore = usePaymentToOwnerExpenseStore()
const orderStore = useOrdersStore()
const ownerStore = useOwnersStore()
const organizationsStore = useOrganizationsStore()

watch(
  () => props.document,
  (document) => {
    resetAndShow(document)
  },
  { deep: true }
)

// resetAndShow(props.id)

function resetAndShow(document: PaymentToOwnerSummary) {
  details.showModal()
  paymentToOwnerOrdersStore.loading(document.id)
  paymentToOwnerExpenseStore.loading(document.id)
}

async function generatePdf() {
  const document = props.document
  if (document == null) {
    throw 'missing document'
  }

  const org = await organizationsStore.resolve(document.organization)
  if (org == null) {
    throw 'missing organization'
  }

  const token = await useAccessTokenStore().getTokenZoho(org.id)
  if (token == null) {
    throw 'missing token'
  }

  const contra = await ownerStore.resolve(document.owner)
  if (contra == null) {
    throw 'missing owner'
  }

  const pdfDoc = await generateOwnerPaymentPdf(document)

  await openInNewTab(pdfDoc)

  // Send by email
  const base64String = await pdfDoc.saveAsBase64()

  const email = {
    from: { address: `noreply@${org.domain}` },
    to: [{ email_address: { address: 'shabanovanatali@gmail.com', name: `${contra.name}` } }], // 'shabanovanatali@gmail.com', name: '' `${contra.email}`, name: `${contra.name}`
    //cc: [{ email_address: { address: 'sitora@cnulogistics.com', name: 'Sitora Subkhankulova' } }],
    subject: `Payment sheet ${document.week}-${org.code3}-${document.id}`,
    htmlbody:
      'Greetings,<br />' +
      '<br />' +
      'Payment sheet of week #&nbsp;' +
      `${document.week}` +
      '&nbsp;of&nbsp;' +
      `${document.year}` +
      '&nbsp;is attached.<br />' +
      '<br />' +
      'For any inquiries regarding calculations, please contact us at emma.clark@caravanfreight.net' +
      '<br />' +
      'Best Regards,<br />' +
      '<br />' +
      `${org.name}<br />` +
      `${org.address1}<br />` +
      `${org.address2}<br />`,
    attachments: [
      {
        name: `paySheet_${document.week}-${org.code3}-${document.id}.pdf`,
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
}

const state = reactive({})

function resolve(
  order: Order,
  name: string,
  create: () => object,
  request: () => Promise<object | null>,
  label: (obj: object) => string
) {
  const s = state[order.id] ?? {}
  if (s && s[name]) {
    return label(s[name])
  } else {
    s[name] = create()
    state[order.id] = s
    request().then((obj) => {
      if (obj) state[order.id][name] = obj
    })
    return label(s[name])
  }
}

const cols = [
  {
    label: '#',
    value: (v: PaymentToOwnerOrder) =>
      resolve(
        v,
        '#_' + v.doc_order,
        () => ({ name: '?' }),
        () => orderStore.resolve(v.doc_order),
        (map) => map.number
      ),
    size: 100
  },

  {
    label: 'cost',
    value: (v: PaymentToOwnerOrder) => '$' + v.order_cost,
    size: 120
  },
  {
    label: 'd/payments',
    value: (v: PaymentToOwnerOrder) => '$' + v.amount,
    size: 120
  },
  {
    label: 'payout',
    value: (v: PaymentToOwnerOrder) => '$' + v.amount,
    size: 120
  }
]

const expensesCols = [
  {
    label: '#',
    value: (v: ExpensesToOwner) => v.id,
    size: 50
  },

  {
    label: 'details',
    value: (v: ExpensesToOwner) => v.notes,
    size: 200
  },
  {
    label: 'amount',
    value: (v: ExpensesToOwner) => '$' + v.amount,
    size: 120
  }
]
</script>

<template>
  <Modal id="details">
    <ModalBox class="max-w-[calc(90vw-6.25rem)]">
      <div class="grid grid-cols-2">
        <div class="flex flex-col-5 gap-10">
          <Text size="2xl">Payment # {{ document?.id }}</Text>
          <Text size="2xl">week {{ document?.week }}</Text>
          <Text size="2xl">to</Text>
          <div>
            <Text size="2xl">
              <QueryAndShow :id="props.document?.owner" :store="ownerStore" />
            </Text>
          </div>
          <Text size="2xl">$ {{ document?.payout }}</Text>
        </div>
        <div class="justify-self-end">
          <Button class="btn-soft font-light tracking-wider" @click="generatePdf">
            Send to
            <QueryAndShow name="email" :id="props.document?.owner" :store="ownerStore" />
          </Button>
        </div>
      </div>
      <div class="flex flex-cols-6 gap-40 mt-10">
        <Text bold size="lg">Total</Text>
        <Text size="lg">Orders {{ paymentToOwnerOrdersStore.listing.length }}</Text>
        <Text size="lg">Orders amount $ {{ document?.orders }}</Text>
        <Text size="lg">Payment $ {{ document?.amount }}</Text>
        <Text size="lg">Expenses $ {{ document?.expenses }}</Text>
        <Text size="lg">Payout $ {{ document?.payout }}</Text>
      </div>
      <div class="mb-4 mt-10">
        <Text bold size="lg" class="mb-4 mt-4">Orders</Text>
      </div>
      <table class="w-full text-left table-auto min-w-max">
        <thead>
        <tr
          class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
        >
          <th
            v-for="col in cols"
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
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
