<script setup lang="ts">
import { generateDispatcherPaymentPdf } from '@/utils/export_dispatchers_payments_to_pdf.ts'
import { openInNewTab } from '@/utils/pdf-helper.ts'
import { createFetch } from '@vueuse/core'

const props = defineProps<{
  document: PaymentToEmployeeSummary | null
}>()

const paymentToDispatcherOrdersStore = usePaymentToDispatcherOrdersStore()
// const eventsStore = useEventsStore()
// const vehiclesStore = useVehiclesStore()
const orderStore = useOrdersStore()
const userStore = useUsersStore()
const organizationsStore = useOrganizationsStore()
const accessTokenStore = useAccessTokenStore()
const employeePaymentSettlementsStore = useEmployeePaymentSettlementsStore()

const emit = defineEmits(['close'])

watch(
  () => props.document,
  (document) => {
    resetAndShow(document)
  },
  { deep: true }
)

// resetAndShow(props.id)

function resetAndShow(document: PaymentToEmployeeSummary) {
  details.showModal()
  paymentToDispatcherOrdersStore.loading(document.id)
  employeePaymentSettlementsStore.loading(document.id)
}

async function generatePdf() {
  const document = props.document

  if (document == null) {
    throw 'missing document'
  }

  const employee = await userStore.resolve(document.employee)

  const org = await organizationsStore.resolve(document.organization)
  if (org == null) {
    throw 'missing organization'
  }

  const token = await accessTokenStore.getTokenZoho(org.id)
  if (token == null) {
    throw 'missing token'
  }

  const pdfDoc = await generateDispatcherPaymentPdf(document)

  await openInNewTab(pdfDoc)

  // Send by email
  const base64String = await pdfDoc.saveAsBase64()

  const email = {
    from: { address: `noreply@${org.domain}` },
    to: [
      {
        email_address: {
          address: 'shabanovanatali@gmail.com',
          name: `${employee?.real_name}`
        }
      }
    ],
    //cc: [{ email_address: { address: 'sitora@cnulogistics.com', name: 'Sitora Subkhankulova' } }], // 'shabanovanatali@gmail.com', name: '' address: `${dispatcher?.email}`,name: `${dispatcher?.real_name}`
    subject: `Payment sheet ${document.month}-${org.code3}-${document.id}`,
    htmlbody:
      'Greetings,<br />' +
      '<br />' +
      'Payment sheet of month #&nbsp;' +
      `${document.month}` +
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
        name: `paySheet_${document.month}-${org.code3}-${document.id}.pdf`,
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
    value: (v: PaymentToDispatcherOrder) =>
      resolve(
        v,
        '#_' + v.doc_order,
        () => ({ name: '?' }),
        () => orderStore.resolve(v.doc_order),
        (map) => map.number
      ),
    size: 50
  },

  {
    label: 'order amount',
    value: (v: PaymentToDispatcherOrder) => '$' + v.order_cost,
    size: 120
  },
  {
    label: 'd/payments',
    value: (v: PaymentToDispatcherOrder) => '$' + v.amount,
    size: 120
  }
]

const settlementsCols = [
  {
    label: '#',
    value: (v: SettlementEmployee) => v.id,
    size: 50
  },

  {
    label: 'details',
    value: (v: SettlementEmployee) => v.notes,
    size: 200
  },
  {
    label: 'amount',
    value: (v: SettlementEmployee) => '$' + v.amount,
    size: 120
  }
]

function close() {
  details.close()
  emit('close')
}
</script>

<template>
  <Modal id="details">
    <ModalBox class="max-w-[calc(90vw-6.25rem)]">
      <div class="grid grid-cols-2">
        <div class="flex flex-cols-4 gap-10">
          <Text size="2xl"
          >Payment # {{ document?.id }} for {{ document?.month }}-{{ document?.year }}
          </Text>
          <Text size="2xl">to</Text>
          <div>
            <Text class="flex w-full" size="2xl">
              <QueryAndShow name="real_name" :id="document?.employee" :store="userStore" />
            </Text>
          </div>
          <Text size="2xl">$ {{ document?.payout }}</Text>
        </div>
        <div>
          <div class="justify-self-end">
            <Button class="btn-soft font-light tracking-wider" @click="generatePdf">
              Send to
              <QueryAndShow name="email" :id="props.document?.employee" :store="userStore" />
            </Button>
          </div>
        </div>
      </div>
      <div class="flex flex-cols-8 gap-20 mt-10">
        <Text bold size="lg">Total</Text>
        <Text size="lg">Orders {{ paymentToDispatcherOrdersStore.listing.length }}</Text>
        <Text size="lg">Orders amount $ {{ document?.gross.toFixed(2) }}</Text>
        <Text size="lg">D/payment $ {{ document?.driver_payment.toFixed(2) }}</Text>
        <Text size="lg"> Percent of gross % {{ document?.percent_of_gross }}</Text>
        <Text size="lg">Settlements $ {{ document?.settlements }}</Text>
        <Text size="lg">Payout $ {{ document?.payout }}</Text>
      </div>
      <div class="mb-2 mt-12">
        <Text bold size="lg" class="mb-4 mt-4">Orders</Text>
      </div>
      <div class="overflow-clip flex flex-col">
        <table class="w-full table-fixed text-left">
          <!-- table-auto min-w-max -->
          <thead>
          <tr
            class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
          >
            <th
              v-for="col in cols"
              class="p-4"
              :key="col.label"
              :style="{ width: col.size + 'px' }"
            >
              <p class="block antialiasing tracking-wider font-thin leading-none">
                {{ col.label }}
              </p>
            </th>
          </tr>
          </thead>
        </table>
        <div class="flex-1 overflow-y-auto">
          <table class="w-full table-fixed">
            <tbody>
            <tr
              v-for="line in paymentToDispatcherOrdersStore.listing"
              :key="line.id"
              class="hover:bg-base-200"
            >
              <td
                v-for="col in cols"
                :key="line.id + '_' + col.label"
                class="py-3 px-4"
                :style="{ width: col.size + 'px' }"
              >
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
            <Text bold size="lg" class="mb-4">Settlements</Text>
            <table class="w-full text-left table-auto min-w-max">
              <thead>
              <tr
                class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
              >
                <th
                  v-for="col in settlementsCols"
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
              <tr v-for="settlement in employeePaymentSettlementsStore.listing"
                  :key="settlement.id">
                <td
                  v-for="col in settlementsCols"
                  :key="col.label"
                  class="py-3 px-4"
                  :style="{ width: col.size + 'px' }"
                >
                  <p
                    class="block antialiasing tracking-wide font-light leading-normal truncate"
                    :style="{ width: col.size + 'px' }"
                  >
                    {{ col.value(settlement) }}
                  </p>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="flex place-self-end mt-6">
          <Button class="btn-soft font-light tracking-wider" @click="close">Close</Button>
        </div>
      </div>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
