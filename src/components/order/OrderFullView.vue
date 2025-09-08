<script setup lang="ts">
import FormOrder from '@/components/order/FormOrder.vue'
import StepperUploading from '@/components/order/StepperUploading.vue'
import StepperStates from '@/components/order/StepperStates.vue'
import Comments from '@/components/order/Comments.vue'

const props = defineProps<{
  edit: Order | null
}>()

const id = ref<number>()
const organization = ref(null)
const dispatcher = ref(null)
const refs = ref('')
const broker = ref(null)
const driver = ref(null)
const vehicle = ref(null)
const cost = ref<number>()
const spend = ref<number>()
const status = ref(null)
const note = ref('')

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (order) => {
    resetAndShow(order)
  },
  { deep: true },
)

const orderStore = useOrdersStore()

function resetAndShow(order: Order | null) {
  id.value = order?.id
  organization.value = order ? { id: order.organization } : null
  dispatcher.value = order ? { id: order.dispatcher } : null
  refs.value = order?.refs
  broker.value = order ? { id: order.broker } : null
  driver.value = order ? { id: order.driver } : null
  vehicle.value = order ? { id: order.vehicle } : null
  cost.value = order?.cost
  spend.value = order?.spend
  status.value = order ? { id: order.status } : null
  note.value = order?.note

  edit_order.showModal()
}

async function saveOrder() {
  try {
    if (id.value == null) {
      await orderStore.create({
        organization: organization.value?.id,
        dispatcher: dispatcher.value?.id,
        refs: refs.value,
        broker: broker.value?.id,
        driver: driver.value?.id,
        vehicle: vehicle.value?.id,
        cost: cost.value,
        spend: spend.value,
        status: status.value?.id,
        note: note.value,
      } as OrderCreate)
    } else {
      orderStore.update(id.value, {
        organization: organization.value?.id,
        dispatcher: dispatcher.value?.id,
        refs: refs.value,
        broker: broker.value?.id,
        driver: driver.value?.id,
        vehicle: vehicle.value?.id,
        cost: cost.value,
        spend: spend.value,
        status: status.value?.id,
        note: note.value,
      } as OrderUpdate)
    }
    edit_order.close()
    emit('closed')
  } catch (e) {
    console.log('error', e)
  }
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <SearchForPayments></SearchForPayments>
    <Button class="btn" @click="resetAndShow(null)">Create</Button>
  </div>

  <Modal id="edit_order">
    <ModalBox class="max-w-[calc(100vw-6.25rem)] max-h-[calc(100vh-6.25rem)]">
      <div class="flex flex-col-2">
        <div class="flex flex-col w-full h-full">
          <div class="flex space-x-76 w-full">
            <Text semibold size="2xl">Order</Text>
            <div class="flex-1/60">
              <StepperUploading></StepperUploading>
            </div>
          </div>

          <div class="flex mb-6 mt-4 w-full">
            <FormOrder v-model="id"></FormOrder>
          </div>
        </div>

        <div class="w-full flex-col">
          <div class="px-10">
            <StepperStates></StepperStates>
          </div>
          <div class="w-full">
            <div class="px-10">
              <Comments></Comments>
            </div>
          </div>
        </div>
      </div>
      <!--      <div>-->
      <!--        <button class="w-48 h-12 bg-blue-400 hover:bg-blue-600 text-white text-lg rounded-xl transition duration-300">-->
      <!--        Invoices-->
      <!--      </button>-->
      <!--      </div>-->

      <ModalAction>
        <form method="dialog">
          <Button @click="saveOrder">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style></style>
