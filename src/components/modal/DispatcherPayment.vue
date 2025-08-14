<script setup lang="ts">
import { useUsersStore } from '@/stores/users.ts'
import { useStatusesStore } from '@/stores/statuses.ts'
import { useReportDispatcher } from '@/stores/report_dispatcher.ts'

const props = defineProps<{
  dispatcherId: number | null
}>()

const reportStore = useReportDispatcher()
const usersStore = useUsersStore()
const brokersStore = useBrokersStore()
const statusesStore = useStatusesStore()

watch(
  () => props.dispatcherId,
  (id) => {
    resetAndShow(id)
  },
  { deep: true },
)

function resetAndShow(id: number) {
  payment_dispatcher.showModal(id)
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
    size: 20,
  },
  {
    label: 'refs',
    value: (v: Order) => v.refs,
    size: 90,
  },
  {
    label: 'broker',
    value: (v: Order) =>
      resolve(
        v,
        'broker_' + v.broker,
        () => ({ name: '?' }),
        () => brokersStore.resolve(v.broker),
        (map) => map.name,
      ),
    size: 200,
  },
  {
    label: 'cost',
    value: (v: Order) => '$' + v.cost,
    size: 100,
  },
  {
    label: 'payments to driver',
    value: (v: Order) => '$' + summary.value?.paymentsByOrder.get(v.id),
    size: 100,
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
    size: 100,
  },
]

const summary = computed(() => {
  for (const summary of reportStore.dispatchers) {
    if (summary.dispatcher == props.dispatcherId) {
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
</script>

<template>
  <Modal id="payment_dispatcher">
    <ModalBox class="max-w-[calc(90vw-6.25rem)]">
      <div class="grid grid-cols-2 gap-2">
        <div>
          <Text size="2xl">
            <QueryAndShow name="real_name" :id="props.dispatcherId" :store="usersStore" />
          </Text>
        </div>
        <Button sm class="place-self-end">payed</Button>
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
          <tr v-for="order in orders">
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
      <div class="flex flex-cols-6 gap-32 mt-10">
        <Text bold size="lg">Total</Text>
        <Text size="lg">Orders {{ summary?.orders_number }}</Text>
        <Text size="lg">Orders amount $ {{ summary?.orders_amount }}</Text>
        <Text size="lg">Payments $ {{ summary?.orders_driver }}</Text>
        <Text size="lg">Profit $ {{ summary?.orders_profit }}</Text>
        <Text size="lg">To pay $ {{ summary?.toPayment }}</Text>
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
