<script setup lang="ts">
const props = defineProps<{
  edit: Payment | null
}>()

const dispatcher = ref('')
const payed = ref(false)

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (payment) => {
    resetAndShow(payment)
  },
  { deep: true },
)

function resetAndShow(payment: Payment | null) {
  dispatcher.value = payment?.name || ''
  payed.value = payment?.payed || false

  payment_dispatcher.showModal()
}

const cols = [
  {
    label: '#',
    value: (v) => v.num,
    size: 100,
  },
  {
    label: 'Driver payments',
    value: (v) => v.driver_cost,
    size: 150,
  },
  {
    label: 'Profit',
    value: (v) => v.profit,
    size: 150,
  },
  {
    label: 'Direct profit',
    value: (v) => v.direct_profit,
    size: 150,
  },
  {
    label: 'Status',
    value: (v) => v.status,
    size: 150,
  },
]

const details = [
  {
    num: 'T2-37778',
    driver_cost: '1140',
    profit: '60',
    direct_profit: '0',
    status: 'Completed',
  },
  {
    num: 'CF-00407',
    driver_cost: '825',
    profit: '40',
    direct_profit: '0',
    status: 'Completed',
  },
  {
    num: 'CF-00408',
    driver_cost: '2250',
    profit: '125',
    direct_profit: '0',
    status: 'Completed',
  },
  {
    num: 'CF-00406',
    driver_cost: '1000',
    profit: '50',
    direct_profit: '0',
    status: 'Completed',
  },
]
</script>

<template>
  <Modal id="payment_dispatcher">
    <ModalBox class="max-w-[calc(60vw-6.25rem)]">
      <div class="grid grid-cols-2 gap-2">
        <div>
          <Text size="2xl">Payment # 1227 to Timur Adashov - $ 14</Text>
        </div>
        <Button sm class="place-self-end">payed</Button>
        <!--            <label class="label">-->
        <!--              <Toggle v-model="payed"></Toggle>-->
        <!--              <span class="ml-3">payed</span>-->
        <!--            </label>-->
      </div>

      <Label class="mt-4">Note</Label>
      <TextInput class="w-full mb-4" v-model="note" />
      <div class="mb-4">
        <Text bold size="lg">Orders</Text>
      </div>

      <div class="grid grid-cols-4 gap-4 items-center">
        <Text size="lg">Total</Text>
        <Text size="lg">5215</Text>
        <Text size="lg">275</Text>
        <Text size="lg">275*5% = 14</Text>
      </div>
      <Divider></Divider>
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
          <tr v-for="line in details">
            <td
              v-for="col in cols"
              class="py-3 px-4 border-b border-b-gray-400"
              :style="{ width: col.size + 'px' }"
            >
              <p
                class="block antialiasing font-normal leading-normal truncate"
                :style="{ width: col.size + 'px' }"
              >
                {{ col.value(line) }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      <ModalAction>
        <form method="dialog">
          <Button class="ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
