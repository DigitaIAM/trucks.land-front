<script setup lang="ts">
import { generateDispatcherPaymentPdf } from '@/utils/export_dispatchers_payments_to_pdf.ts'
import { openInNewTab } from '@/utils/pdf-helper.ts'

const props = defineProps<{
  document: PaymentToEmployeeSummary | null
}>()

const paymentToDispatcherOrdersStore = usePaymentToDispatcherOrdersStore()
const orderStore = useOrdersStore()
const userStore = useUsersStore()
const organizationsStore = useOrganizationsStore()
const accessTokenStore = useAccessTokenStore()
const employeePaymentSettlementsStore = useEmployeePaymentSettlementsStore()

const emit = defineEmits(['closed'])

const selectedDocument = ref<SettlementEmployee | null>(null)

watch(
  () => props.document,
  (document) => {
    resetAndShow(document)
  },
  { deep: true },
)

// resetAndShow(props.id)

async function resetAndShow(document: PaymentToEmployeeSummary | null) {
  if (!document?.id) return

  await paymentToDispatcherOrdersStore.loading(document.id)
  await employeePaymentSettlementsStore.loading(document.id)
  details.showModal()
}

async function generatePdf() {
  const document = props.document

  if (document == null) {
    throw 'missing document'
  }

  // const employee = await userStore.resolve(document.employee)

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
  //   const base64String = await pdfDoc.saveAsBase64()
  //
  //   const email = {
  //     from: { address: `noreply@${org.domain}` },
  //     to: [
  //       {
  //         email_address: {
  //           address: 'shabanovanatali@gmail.com',
  //           name: `${employee?.real_name}`,
  //         },
  //       },
  //     ],
  //     //cc: [{ email_address: { address: 'sitora@cnulogistics.com', name: 'Sitora Subkhankulova' } }], // 'shabanovanatali@gmail.com', name: '' address: `${dispatcher?.email}`,name: `${dispatcher?.real_name}`
  //     subject: `Payment sheet ${document.month}-${org.code3}-${document.id}`,
  //     htmlbody:
  //       'Greetings,<br />' +
  //       '<br />' +
  //       'Payment sheet of month #&nbsp;' +
  //       `${document.month}` +
  //       '&nbsp;of&nbsp;' +
  //       `${document.year}` +
  //       '&nbsp;is attached.<br />' +
  //       '<br />' +
  //       'For any inquiries regarding calculations, please contact us at emma.clark@caravanfreight.net' +
  //       '<br />' +
  //       'Best Regards,<br />' +
  //       '<br />' +
  //       `${org.name}<br />` +
  //       `${org.address1}<br />` +
  //       `${org.address2}<br />`,
  //     attachments: [
  //       {
  //         name: `paySheet_${document.month}-${org.code3}-${document.id}.pdf`,
  //         content: base64String,
  //         mime_type: 'plain/txt',
  //       },
  //     ],
  //   }
  //
  //   const myFetch = createFetch({
  //     // baseUrl: 'https://api.zeptomail.com/',
  //     // baseUrl: 'http://localhost:5173/',
  //     options: {
  //       async beforeFetch({ options }) {
  //         options.headers = {
  //           ...options.headers,
  //           Accept: 'application/json',
  //           'Content-Type': 'application/json',
  //           Authorization: token,
  //         }
  //         return { options }
  //       },
  //     },
  //     fetchOptions: { mode: 'cors' },
  //   })
  //
  //   const { isFetching, error, data } = await myFetch('/zeptomail/v1.1/email').post(email)
  //
  //   console.log('isFetching', isFetching)
  //   console.log('error', error)
  //   console.log('data', data)
}

const state = reactive({})

function resolve(
  order: Order,
  name: string,
  create: () => object,
  request: () => Promise<object | null>,
  label: (obj: object) => string,
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
        (map) => map.number,
      ),
    size: 70,
  },

  {
    label: 'order amount',
    value: (v: PaymentToDispatcherOrder) => '$' + v.order_cost,
    size: 120,
  },
  {
    label: 'd/payments',
    value: (v: PaymentToDispatcherOrder) => '$' + v.driver_cost,
    size: 120,
  },
]

function close() {
  details.close()
  emit('closed')
}

async function openSettlementModal() {
  const doc = props.document
  if (doc) {
    selectedDocument.value = {
      organization: doc.organization,
      employee: doc.employee,
    } as SettlementEmployee
  }
}

function onClose() {
  selectedDocument.value = null
}
</script>

<template>
  <Modal id="details">
    <ModalBox class="max-w-[calc(90vw-6.25rem)]">
      <div class="flex items-center justify-between w-full gap-4">
        <div class="flex items-center gap-3">
          <Text size="xl">
            Payment # {{ document?.id }} for {{ document?.month }}-{{ document?.year }}
          </Text>
          <Text size="xl">to</Text>
          <Text size="xl" class="font-medium">
            <QueryAndShow name="real_name" :id="document?.employee" :store="userStore" />
          </Text>
          <Text size="xl" bold>$ {{ document?.payout_usd.toFixed(2) }}</Text>
        </div>

        <div class="flex items-center gap-3">
          <Button
            :disabled="document?.closed === true"
            class="btn-soft font-light tracking-wider"
            @click.stop="openSettlementModal"
          >
            Add settlement
          </Button>

          <Button class="btn-soft font-light tracking-wider" @click="generatePdf">
            Send to
            <QueryAndShow name="email" :id="props.document?.employee" :store="userStore" />
          </Button>
        </div>
      </div>

      <div
        class="mt-10 mb-6 overflow-hidden rounded-xl border border-[#526471] shadow-md bg-[#3e4d59] text-[#e2e9ef]"
      >
        <table class="w-full text-left text-sm border-collapse">
          <tbody class="divide-y divide-[#526471]">
            <!-- Секция: Orders -->
            <tr>
              <td
                rowspan="3"
                class="px-6 py-4 font-semibold text-xs text-white uppercase align-top bg-[#33414b] w-1/3 tracking-wider"
              >
                Orders
              </td>
              <td class="px-6 py-3 text-[#cbd5e0]">quantity orders</td>
              <td class="px-6 py-3 text-right font-medium text-white">
                {{ paymentToDispatcherOrdersStore.listing.length }}
              </td>
            </tr>
            <tr>
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">orders amount</td>
              <td class="px-6 py-3 text-right font-medium text-white">
                $ {{ document?.gross.toFixed(2) }}
              </td>
            </tr>
            <tr>
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">driver payment</td>
              <td class="px-6 py-3 text-right font-medium text-white">
                $ {{ document?.driver_payment.toFixed(2) }}
              </td>
            </tr>

            <!-- Секция: Commission -->
            <tr>
              <td
                :rowspan="1 + (document?.fixed_salary > 0 ? 1 : 0)"
                class="px-6 py-4 font-semibold text-xs text-white uppercase align-top bg-[#33414b] tracking-wider"
              >
                Commission
              </td>
              <td class="px-6 py-3 text-[#cbd5e0]">
                <span v-if="document?.percent_of_profit > 0"
                  >{{ document?.percent_of_profit }}% of profit</span
                >
                <span v-else-if="document?.percent_of_gross > 0"
                  >{{ document?.percent_of_gross }}% of gross</span
                >
                <span v-else>To Pay</span>
              </td>
              <td class="px-6 py-3 text-right font-medium text-white">
                $
                {{
                  (
                    ((Number(document?.gross) - Number(document?.driver_payment)) *
                      Number(document?.percent_of_profit)) /
                    100
                  ).toFixed(2)
                }}
              </td>
            </tr>
            <tr v-if="document?.fixed_salary > 0">
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">fixed salary</td>
              <td class="px-6 py-3 text-right font-medium text-white border-t border-[#526471]">
                $ {{ document?.fixed_salary.toFixed(2) }}
              </td>
            </tr>

            <!-- Секция: Other -->
            <tr>
              <td
                :rowspan="
                  1 +
                  (document?.settlement_fine > 0 ? 1 : 0) +
                  (document?.settlement_vacation > 0 ? 1 : 0) +
                  (document?.settlement_advance > 0 ? 1 : 0)
                "
                class="px-6 py-4 font-semibold text-xs text-white uppercase align-top bg-[#33414b] tracking-wider"
              >
                Other
              </td>
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">bonuses & premiums</td>
              <td class="px-6 py-3 text-right font-medium text-white border-t border-[#526471]">
                $
                {{
                  (
                    Number(document?.settlement_bonus || 0) +
                    Number(document?.settlement_premium || 0)
                  ).toFixed(2)
                }}
              </td>
            </tr>
            <tr v-if="document?.settlement_fine > 0">
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">fine</td>
              <td class="px-6 py-3 text-right font-medium text-white border-t border-[#526471]">
                - $ {{ document?.settlement_fine.toFixed(2) }}
              </td>
            </tr>
            <tr v-if="document?.settlement_vacation > 0">
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">vacation</td>
              <td
                class="px-6 py-3 text-right text-[#cbd5e0] italic text-xs border-t border-[#526471]"
              >
                UZS {{ document?.settlement_vacation.toLocaleString() }}
              </td>
            </tr>
            <tr v-if="document?.settlement_advance > 0">
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">advance</td>
              <td
                class="px-6 py-3 text-right text-[#cbd5e0] italic text-xs border-t border-[#526471]"
              >
                - UZS {{ document?.settlement_advance.toLocaleString() }}
              </td>
            </tr>

            <!-- Итог (Payout) -->
            <tr class="bg-[#2a363f] text-white">
              <!-- colspan="2" объединяет первые две колонки (заголовок и описание) -->
              <td colspan="2" class="px-6 py-6 font-bold uppercase tracking-widest text-left">
                Payout
              </td>
              <!-- Третья колонка для суммы -->
              <td class="px-6 py-5 text-right font-bold text-xl">
                $ {{ (document?.payout_usd || 0).toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mb-2 mt-12">
        <Text bold size="lg" class="mb-4 mt-4">Orders</Text>
      </div>
      <div class="overflow-clip flex flex-col max-h-[40vh]">
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
        </div>
        <div class="flex place-self-end mt-6">
          <Button class="btn-soft font-light tracking-wider" @click="close">Close</Button>
        </div>
      </div>
    </ModalBox>
  </Modal>

  <SettlementEmployeeModal
    :edit="selectedDocument"
    @closed="onClose"
    :types="['bonus', 'premium', 'fine']"
    :payment-id="document?.id"
  ></SettlementEmployeeModal>
</template>

<style scoped></style>
