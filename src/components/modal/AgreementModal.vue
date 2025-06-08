<script setup lang="ts">
import { defineEmits, defineProps, ref } from 'vue'
import { type EventCreate, useEventsStore } from '@/stores/events.ts'
import VueDatePicker from '@vuepic/vue-datepicker'

const props = defineProps<{
  order: number
  edit: Event | null
}>()

const id = ref(null)
const datetime = ref(new Date() as Date | undefined)
const note = ref('')
const driver = ref(null)
const vehicle = ref(null)
const cost = ref(null)

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (event) => {
    console.log('watch', event)
    resetAndShow(event)
  },
  { deep: true },
)

const eventsStore = useEventsStore()
const driversStore = useEventsStore()
const vehiclesStore = useVehiclesStore()

function resetAndShow(event: Event | null) {
  if (event?.kind != 'agreement') {
    throw 'incorrect kind "' + event?.kind + '" expected "agreement"'
  }

  id.value = event?.id
  datetime.value = event?.datetime || ''
  note.value = event?.details?.note || ''
  driver.value = event ? { id: event.driver } : null
  vehicle.value = event ? { id: event.vehicle } : null
  cost.value = event?.cost

  create_agreement.showModal()
}

async function saveAndEdit() {
  try {
    await eventsStore.create({
      order: props.order,
      kind: 'agreement',
      datetime: datetime.value,
      driver: driver.value?.id,
      vehicle: vehicle.value?.id,
      cost: cost.value,
      details: {
        note: note.value,
      },
    } as EventCreate)

    close()
  } catch (e) {
    console.log('error', e)
  }
}

function close() {
  create_agreement.close()
  // emit('closed')
}
</script>

<template>
  <Modal id="create_agreement">
    <ModalBox class="max-w-[calc(40vw-6.25rem)]">
      <div class="flex items-start justify-between">
        <div class="md:w-1/2 md:mb-0">
          <Text size="2xl">Agreement</Text>
        </div>
        <div class="md:w-1/2 md:mb-0">
          <VueDatePicker
            teleport-center
            :enable-time-picker="true"
            v-model="datetime"
          ></VueDatePicker>
        </div>
      </div>

      <Label class="mt-2">Note</Label>
      <TextInput class="w-full" v-model="note" />

      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-2/3 md:mb-0">
          <Label>Driver</Label>
          <selector v-model="driver" :store="driversStore"></selector>
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label>Driver payment $</Label>
          <TextInput v-model="cost" />
        </div>
      </div>

      <Label class="mt-2">Vehicle</Label>
      <selector v-model="vehicle" :store="vehiclesStore"></selector>

      <ModalAction>
        <Button @click="saveAndEdit">Create</Button>
        <Button class="ml-3" @click="close">Close</Button>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
