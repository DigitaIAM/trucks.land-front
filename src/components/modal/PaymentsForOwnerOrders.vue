<script setup lang="ts">
import ExpensesOwner from '@/components/modal/ExpensesOwner.vue'

const props = defineProps<{
  document: PaymentToOwnerSummary | null
}>()

const paymentToOwnerOrdersStore = usePaymentToOwnerOrdersStore()
const paymentToOwnerExpenseStore = usePaymentToOwnerExpenseStore()
const orderStore = useOrdersStore()
const ownerStore = useOwnersStore()
const paymentToOwnerStore = usePaymentToOwnerStore()
const statusesStore = useStatusesStore()
const eventsStore = useEventsStore()
const vehiclesStore = useVehiclesStore()

const showExpenseTrigger = ref(0)
const showPaymentTrigger = ref(0)

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

const expensesItems = computed(() =>
  paymentToOwnerExpenseStore.listing.filter((i) => i.kind === 'expense' || i.kind == null),
)
const paymentItems = computed(() =>
  paymentToOwnerExpenseStore.listing.filter((i) => i.kind === 'additional_payment'),
)

const emit = defineEmits<{
  (e: 'document-updated', document: PaymentToOwnerSummary): void
}>()

async function onExpenseClosed() {
  if (props.document) {
    await paymentToOwnerExpenseStore.loading(props.document.id)
    const fresh = await paymentToOwnerStore.refreshOne(props.document.id)
    if (fresh) emit('document-updated', fresh)
  }
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

async function resolveStage(id: number) {
  const order = await orderStore.resolve(id)
  return await statusesStore.resolve(order!.stage)
}

async function resolveVehicleFromOrder(orderId: number) {
  const events = await eventsStore.fetching(orderId)
  const agreement = events.find((e) => e.kind === 'agreement')
  if (agreement?.vehicle) {
    const vehicle = await vehiclesStore.resolve(agreement.vehicle)
    return vehicle
  }
  return null
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
        (map) => map.number,
      ),
    size: 100,
  },

  {
    label: 'vehicle',
    value: (v: PaymentToOwnerOrder) =>
      resolve(
        v,
        'vehicle',
        () => ({ name: '?' }),
        () => resolveVehicleFromOrder(v.doc_order),
        (map) => map?.name,
      ),
    size: 150,
  },

  {
    label: 'gross',
    value: (v: PaymentToOwnerOrder) => '$' + v.order_cost,
    size: 120,
  },
  {
    label: 'driver payment',
    value: (v: PaymentToOwnerOrder) => '$' + v.amount,
    size: 120,
  },
  {
    label: 'profit',
    value: (v: PaymentToOwnerOrder) => '$' + (v.order_cost - v.amount),
    size: 120,
  },
  {
    label: '%',
    value: (v: PaymentToOwnerOrder) =>
      (((v.order_cost - v.amount) / v.order_cost) * 100).toFixed(0) + '%',
    size: 80,
  },
  {
    label: 'stage',
    value: (v: PaymentToOwnerOrder) =>
      resolve(
        v,
        'stage',
        () => '',
        () => resolveStage(v.doc_order),
        (map) => map?.name,
      ),
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
    value: (v: ExpensesToOwner) => v.notes,
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
      <div class="flex items-center justify-between w-full gap-4">
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
        <div class="flex items-center gap-3">
          <Button class="btn-soft font-light tracking-wider" @click="showExpenseTrigger++">
            Add expense
          </Button>
          <Button class="btn-soft font-light tracking-wider" @click="showPaymentTrigger++">
            Add payment
          </Button>

        </div>
      </div>
      <div class="flex flex-cols-7 gap-6 mt-10">
        <Text bold size="lg">Total</Text>
        <Text size="lg">Orders {{ paymentToOwnerOrdersStore.listing.length }}</Text>
        <Text size="lg">Orders amount $ {{ document?.orders }}</Text>
        <Text size="lg">Payment $ {{ document?.amount }}</Text>
        <Text size="lg">Expenses $ {{ document?.expenses }}</Text>
        <Text size="lg">Additional $ {{ document?.additional_payments }}</Text>
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
          <tr v-for="line in paymentToOwnerOrdersStore.listing" :key="line.id">
            <td
              v-for="col in cols"
              :key="line.id + '-' + col.label"
              class="py-3 px-4"
              :style="{ width: col.size + 'px' }"
              :class="{ 'text-gray-500': document?.payout === 0 }"
            >
              <p
                class="block antialiasing tracking-wide font-light leading-normal truncate"
                :style="{ width: col.size + 'px' }"
                :key="col.label"
              >
                {{ col.value(line) }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-10">
        <div class="flex justify-between items-center mb-4">
          <Text bold size="lg">Expenses</Text>
        </div>
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
            <tr v-for="expense in expensesItems" :key="expense.id">
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
      <div class="mt-10">
        <div class="flex justify-between items-center mb-4">
          <Text bold size="lg">Additional payments</Text>
        </div>
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
            <tr v-for="payment in paymentItems" :key="payment.id">
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
                  {{ col.value(payment) }}
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

  <ExpensesOwner
    :document-id="document?.id"
    :document-owner="document?.owner"
    :document-week="document?.week"
    :document-year="document?.year"
    :show="showExpenseTrigger"
    @closed="onExpenseClosed"
    :embedded="true"
    kind="expense"
  />
  <ExpensesOwner
    :document-id="document?.id"
    :document-owner="document?.owner"
    :document-week="document?.week"
    :document-year="document?.year"
    :show="showPaymentTrigger"
    @closed="onExpenseClosed"
    :embedded="true"
    kind="additional_payment"
  />
</template>

<style scoped></style>
