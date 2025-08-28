<script setup lang="ts">
const props = defineProps<{
  ownerId: number | null
}>()

const ownerStore = useOwnersStore()
const reportStore = useReportOwner()
const statusesStore = useStatusesStore()

watch(
  () => props.ownerId,
  (ownerId) => {
    resetAndShow(ownerId)
  },
  { deep: true },
)

function resetAndShow(ownerId: number) {
  payment_owner.showModal(ownerId)
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
    value: (v: Order) => v.id,
    size: 50,
  },

  {
    label: 'cost',
    value: (v: Order) => '$' + v.cost,
    size: 120,
  },
  {
    label: 'd/payments',
    value: (v: Order) => '$' + summary.value?.paymentsByOrder.get(v.id),
    size: 120,
  },
  {
    label: 'status',
    value: (v: Order) =>
      resolve(
        v,
        'status_' + v.status,
        () => ({ name: '?', color: '' }),
        () => statusesStore.resolve(v.status),
        (map) => map.name,
      ),
    size: 200,
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

const summary = computed(() => {
  for (const summary of reportStore.owners) {
    if (summary.owner == props.ownerId) {
      return summary
    }
  }
})

const orders = computed(() => {
  const data = summary.value

  if (data) {
    return data.orders.values().toArray()
  } else {
    return []
  }
})

const expenses = computed(() => {
  const data = summary.value

  if (data) {
    return data.expenses
  } else {
    return []
  }
})
</script>

<template>
  <Modal id="payment_owner">
    <ModalBox class="max-w-[calc(90vw-6.25rem)]">
      <div class="flex flex-cols-3 gap-10">
        <div>
          <Text size="2xl">
            <QueryAndShow :id="props.ownerId" :store="ownerStore" />
          </Text>
        </div>
      </div>
      <div class="mb-4 mt-4">
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
          <tr v-for="order in orders" :key="order.id">
            <td v-for="col in cols" class="py-3 px-4" :style="{ width: col.size + 'px' }">
              <p
                class="block antialiasing tracking-wide font-light leading-normal truncate"
                :style="{ width: col.size + 'px' }"
              >
                {{ col.value(order) }}
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
            <tr v-for="expense in expenses" :key="expense.id">
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
        <Text size="lg">Orders {{ summary?.orders_number }}</Text>
        <Text size="lg">Orders amount $ {{ summary?.orders_amount }}</Text>
        <Text size="lg">Payment $ {{ summary?.orders_driver }}</Text>
        <Text size="lg">Expenses $ {{ summary?.expenses_total }}</Text>
        <Text size="lg">Payout $ {{ summary?.payout }}</Text>
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
