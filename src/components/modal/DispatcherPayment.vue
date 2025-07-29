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
const organizationsStore = useOrganizationsStore()

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
    label: '',
    value: (v: Order) =>
      resolve(
        v,
        'organization',
        () => ({ code3: '?' }),
        () => organizationsStore.resolve(v.organization),
        (map) => map.code3,
      ),
    size: 50,
  },
  {
    label: '#',
    value: (v: Order) => v.id,
    size: 20,
  },
  {
    label: 'Refs',
    value: (v: Order) => v.refs,
    size: 90,
  },
  {
    label: 'Broker',
    value: (v: Order) =>
      resolve(
        v,
        'broker',
        () => ({ name: '?' }),
        () => brokersStore.resolve(v.broker),
        (map) => map.name,
      ),
    size: 150,
  },
  {
    label: 'Cost',
    value: (v: Order) => '$' + v.cost,
    size: 100,
  },
  {
    label: 'Payments to driver',
    value: (v: Order) => '$' + summary.value?.paymentsByOrder.get(v.id),
    size: 100,
  },
  {
    label: 'Status',
    value: (v: Order) =>
      resolve(
        v,
        'status',
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
          <tr>
            <th
              v-for="col in cols"
              class="p-4 border-b border-b-gray-400"
              :style="{ width: col.size + 'px' }"
            >
              <p class="block antialiasing font-bold leading-none">
                {{ col.label }}
              </p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders">
            <td
              v-for="col in cols"
              class="py-3 px-4 border-b border-b-gray-400"
              :style="{ width: col.size + 'px' }"
            >
              <p
                class="block antialiasing font-normal leading-normal truncate"
                :style="{ width: col.size + 'px' }"
              >
                {{ col.value(order) }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="grid grid-cols-6 mt-10">
        <Text bold size="lg">Total</Text>
        <Text size="lg">Orders {{ summary?.orders_number }}</Text>
        <Text size="lg">Orders amount $ {{ summary?.orders_amount }}</Text>
        <Text size="lg" class="px-10">Payments $ {{ summary?.orders_driver }}</Text>
        <Text size="lg" class="px-10">Profit $ {{ summary?.orders_profit }}</Text>
        <Text size="lg" class="px-10">To pay $ {{ summary?.toPayment }}</Text>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button class="ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
