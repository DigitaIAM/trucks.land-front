<script setup lang="ts">
const props = defineProps<{
  document: PaymentToDispatcherSummary | null
}>()

const paymentToDispatcherOrdersStore = usePaymentToDispatcherOrdersStore()
const userStore = useUsersStore()

const emit = defineEmits(['close'])

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
    size: 50,
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

function close() {
  details.close()
  emit('close')
}
</script>

<template>
  <Modal id="details">
    <ModalBox class="max-w-[calc(70vw-6.25rem)]">
      <div class="flex place-self-end">
        <Button class="btn-soft font-light tracking-wider" @click="close">Close</Button>
      </div>
      <div class="flex flex-cols-5 gap-10">
        <Text size="2xl"
          >Payment # {{ document?.id }} for {{ document?.month }}-{{ document?.year }}
        </Text>
        <Text size="2xl">to</Text>
        <div>
          <Text size="2xl">
            <QueryAndShow name="real_name" :id="document?.dispatcher" :store="userStore" />
          </Text>
        </div>
        <Text size="2xl">$ {{ document?.to_pay }}</Text>
      </div>
      <div class="flex flex-cols-6 gap-20 mt-10">
        <Text bold size="lg">Total</Text>
        <Text size="lg">Orders {{ paymentToDispatcherOrdersStore.listing.length }}</Text>
        <Text size="lg">Orders amount $ {{ document?.amount.toFixed(2) }}</Text>
        <Text size="lg">D/payment $ {{ document?.payment.toFixed(2) }}</Text>
        <Text size="lg"> Percent of gross % {{ document?.percent_of_gross }}</Text>
        <Text size="lg">Payout $ {{ document?.to_pay }}</Text>
      </div>
      <div class="mb-2 mt-12">
        <Text bold size="lg" class="mb-4 mt-4">Orders</Text>
      </div>
      <div class="max-h-100 overflow-clip flex flex-col">
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
      </div>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
