<script setup lang="ts">
import {
  type PaymentToDispatcherOrder,
  usePaymentToDispatcherOrdersStore,
} from '@/stores/payment_to_dispatchers_orders.ts'

const props = defineProps<{
  document: PaymentToDispatcherSummary | null
}>()

const paymentToDispatcherOrdersStore = usePaymentToDispatcherOrdersStore()
const userStore = useUsersStore()

watch(
  () => props.document,
  (document) => {
    resetAndShow(document)
  },
  { deep: true },
)

// resetAndShow(props.id)

function resetAndShow(document: PaymentToDispatcherSummary) {
  details.showModal()
  paymentToDispatcherOrdersStore.loading(document.id)
}

const cols = [
  {
    label: '#',
    value: (v: PaymentToDispatcherOrder) => v.doc_order,
    size: 30,
  },

  {
    label: 'order amount',
    value: (v: PaymentToDispatcherOrder) => '$' + v.amount,
    size: 120,
  },
  {
    label: 'd/payments',
    value: (v: PaymentToDispatcherOrder) => '$' + v.payment,
    size: 120,
  },
]
</script>

<template>
  <Modal id="details">
    <ModalBox class="max-w-[calc(90vw-6.25rem)]">
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider">Close</Button>
        </form>
      </ModalAction>
      <div class="flex flex-cols-4 gap-10">
        <Text size="2xl"
          >Payment # {{ document?.id }} for {{ document?.month }}-{{ document?.year }}
        </Text>
        <Text size="2xl">to</Text>
        <div>
          <Text size="2xl">
            <QueryAndShow :id="document?.dispatcher" :store="userStore" />
          </Text>
        </div>
        <Text size="2xl">$ {{ document?.to_pay }}</Text>
      </div>
      <div class="flex flex-cols-5 gap-60 mt-10">
        <Text bold size="lg">Total</Text>
        <Text size="lg">Orders {{ paymentToDispatcherOrdersStore.listing.length }}</Text>
        <Text size="lg">Orders amount $ {{ document?.amount.toFixed(2) }}</Text>
        <Text size="lg">Payment $ {{ document?.payment.toFixed(2) }}</Text>
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
          <tr v-for="line in paymentToDispatcherOrdersStore.listing">
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
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
