<script setup lang="ts">
import { generateDispatcherPaymentPdf } from '@/utils/export_dispatchers_payments_to_pdf.ts'
import { openInNewTab } from '@/utils/pdf-helper.ts'

const props = defineProps<{
  document: PaymentToEmployeeSummary | null
}>()

const id = ref<number>()
const employee = ref<number | null>(null)
const settlement_type = ref<string>('bonus')
const settlement_amount = ref<number>()
const settlement_note = ref('')

const listOfSettelments = [
  { color: '#94a3b8', id: 'bonus', label: 'bonus' },
  { color: '#f59e0b', id: 'premium', label: 'premium' },
  { color: '#3b82f6', id: 'vacation pay', label: 'vacation pay' },
]

const paymentToDispatcherOrdersStore = usePaymentToDispatcherOrdersStore()
// const eventsStore = useEventsStore()
// const vehiclesStore = useVehiclesStore()
const orderStore = useOrdersStore()
const userStore = useUsersStore()
const authStore = useAuthStore()
const organizationsStore = useOrganizationsStore()
const accessTokenStore = useAccessTokenStore()
const employeePaymentSettlementsStore = useEmployeePaymentSettlementsStore()

const emit = defineEmits(['closed'])

const settlement_modal_ref = ref(null)

watch(
  () => props.document,
  (document) => {
    resetAndShow(document)
  },
  { deep: true },
)

// resetAndShow(props.id)

async function resetAndShow() {
  if (!props.document?.id) return

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

function setAbsenceType(v: string) {
  if (!props.disabled) {
    settlement_type.value = v
  }
}

async function openSettlementModal() {
  console.log('Пытаюсь открыть...')

  // Сброс данных
  id.value = null
  employee.value = props.document?.employee || null
  settlement_note.value = ''
  settlement_amount.value = 0

  const modalElement = document.getElementById('settlement_modal')

  if (modalElement) {
    const dialog =
      modalElement.tagName === 'DIALOG' ? modalElement : modalElement.querySelector('dialog')

    if (dialog && typeof (dialog as any).showModal === 'function') {
      ;(dialog as any).showModal()
    } else {
      try {
        modalElement.showModal()
      } catch (e) {
        console.error('Не удалось вызвать showModal ни одним способом', e)
      }
    }
  } else {
    console.error('Элемент с ID settlement_modal не найден в DOM вообще!')
  }
}

async function savePayment() {
  try {
    const account = await authStore.currentAccount()
    if (!account) return

    const currentAmount = Number(settlement_amount.value)
    if (isNaN(currentAmount) || currentAmount === 0) {
      alert('Please enter a valid amount')
      return
    }

    const { error } = await supabase
      .from('employee_payments')
      .update({
        settlement_amount: currentAmount,
        settlement_type: settlement_type.value,
        settlement_note: settlement_note.value,
      })
      .eq('id', props.document?.id)

    if (error) throw error

    if (props.document) {
      Object.assign(props.document, {
        settlement_amount: currentAmount,
        settlement_type: settlement_type.value,
        settlement_note: settlement_note.value,
      })
    }

    const modal = document.getElementById('settlement_modal') as HTMLDialogElement | null
    modal?.close()

    alert('Document updated successfully!')
  } catch (e) {
    console.error('Error updating payment:', e)
    alert('Failed to update document')
  }
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
          <Text size="xl" bold>$ {{ document?.payout.toFixed(2) }}</Text>
        </div>

        <div class="flex items-center gap-3">
          <Button class="btn-soft font-light tracking-wider" @click.stop="openSettlementModal">
            Add settlement
          </Button>

          <Button class="btn-soft font-light tracking-wider" @click="generatePdf">
            Send to
            <QueryAndShow name="email" :id="props.document?.employee" :store="userStore" />
          </Button>
        </div>
      </div>
      <div class="flex flex-cols-8 gap-20 mt-10">
        <Text bold size="lg">Total</Text>
        <Text>Orders {{ paymentToDispatcherOrdersStore.listing.length }}</Text>
        <Text>Orders amount $ {{ document?.gross.toFixed(2) }}</Text>
        <Text>D/payment $ {{ document?.driver_payment.toFixed(2) }}</Text>
        <Text v-if="(document?.percent_of_profit || 0) > 0">
          % of profit
          {{ document?.percent_of_profit }}
        </Text>
        <Text v-if="(document?.percent_of_gross || 0) > 0">
          % of gross
          {{ document?.percent_of_gross }}
        </Text>
        <Text>To pay $ {{ document?.to_pay.toFixed(2) }}</Text>
        <Text v-if="(document?.fixed_salary || 0) > 0">
          Fixed salary
          {{ document?.fixed_salary }}
        </Text>
        <div v-if="document?.settlement_bonus > 0" class="flex gap-2">
          <Text :class="document.settlement_bonus > 0">
            bonus: $ {{ document.settlement_bonus.toFixed(2) }}
          </Text>
        </div>
        <div v-if="document?.settlement_premium > 0" class="flex gap-2">
          <Text :class="document.settlement_premium > 0">
            premium: $ {{ document.settlement_premium.toFixed(2) }}
          </Text>
        </div>
        <div v-if="document?.settlement_vacation > 0" class="flex gap-2">
          <Text :class="document.settlement_vacation > 0">
            vacation: UZS {{ document.settlement_vacation.toFixed(2) }}
          </Text>
        </div>
        <Text>Payout $ {{ (document?.payout || 0).toFixed(2) }}</Text>
        <div v-if="document?.settlement_vacation > 0" class="flex gap-2">
          <Text :class="document.settlement_vacation > 0">
            vacation: UZS {{ document.settlement_vacation.toFixed(2) }}
          </Text>
        </div>
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

  <Modal id="settlement_modal" ref="settlement_modal_ref">
    <ModalBox class="w-2/5">
      <div class="flex items-start justify-between">
        <div>
          <Text class="w-full mt-1" size="xl">Payment # {{ id }}</Text>
        </div>
        <div class="flex items-center justify-between">
          <Button
            sm
            class="mr-1 mb-2"
            v-for="type in listOfSettelments"
            :key="type.id"
            :style="{
              backgroundColor: settlement_type === type.id ? type.color : 'transparent',
              color: settlement_type === type.id ? 'white' : '#475569',
            }"
            @click="setAbsenceType(type.id)"
          >
            {{ type.label }}
          </Button>
        </div>
      </div>
      <div>
        <Label class="mt-2">Employee</Label>
        <QueryAndShow asTextField name="real_name" :id="document?.employee" :store="userStore" />
      </div>
      <Label class="mb-2 mt-4">Note</Label>
      <TextInput class="w-full" v-model="settlement_note" />
      <div class="flex space-x-3 mb-2 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label class="mt-4 mb-2"
            >Amount
            <span class="text-xs font-normal opacity-70">
              ({{ settlement_type === 'vacation pay' ? 'UZS' : 'USD' }})
            </span>
          </Label>
          <TextInput v-model="settlement_amount" />
          <p
            v-if="settlement_type === 'vacation pay'"
            class="text-amber-600 text-sm mt-1 font-medium"
          >
            ⚠️ Please indicate the amount in Uzbek sums (UZS)
          </p>
        </div>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider" @click="savePayment()">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
