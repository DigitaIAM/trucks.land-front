<script setup lang="ts">
import { defineEmits, defineProps, ref } from 'vue'
import { type EventCreate, useEventsStore } from '@/stores/events.ts'
import VueDatePicker from '@vuepic/vue-datepicker'

const props = defineProps<{
  document: number | null
  edit: Event | null
}>()

const id = ref(null)
const datetime = ref(new Date() as Date | undefined)
const note = ref('')
const driver = ref(null)
const vehicle = ref(null)
const owner = ref(null)
const cost = ref(null)

const emit = defineEmits(['on-update'])

watch(
  () => props.edit,
  (event) => {
    console.log('watch', event)
    resetAndShow(event)
  },
  { deep: true },
)

const eventsStore = useEventsStore()
const driversStore = useDriversStore()
const vehiclesStore = useVehiclesStore()
const ownersStore = useOwnersStore()

function resetAndShow(event: Event | null) {
  if (event?.kind != 'expenses') {
    throw 'incorrect kind "' + event?.kind + '" expected "expenses"'
  }

  id.value = event?.id
  datetime.value = event?.datetime || ''
  note.value = event?.details?.note || ''
  driver.value = event.driver ? { id: event.driver } : null
  vehicle.value = event.vehicle ? { id: event.vehicle } : null
  owner.value = event.owner ? { id: event.owner } : null
  cost.value = event?.cost

  create_expenses.showModal()
}

async function saveAndEdit() {
  try {
    await eventsStore.create({
      document: props.document,
      kind: 'expenses',
      datetime: datetime.value,
      driver: driver.value?.id,
      vehicle: vehicle.value?.id,
      cost: cost.value,
      owner: owner.value?.id,
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
  create_expenses.close()
  emit('on-update')
}
</script>

<template>
  <Modal id="create_expenses">
    <ModalBox class="max-w-[calc(40vw-6.25rem)]">
      <div class="flex items-start justify-between">
        <div class="md:w-1/2 md:mb-0">
          <Text size="2xl">Expenses</Text>
        </div>
        <div class="md:w-1/2 md:mb-0">
          <VueDatePicker
            teleport-center
            :enable-time-picker="true"
            v-model="datetime"
          ></VueDatePicker>
        </div>
      </div>

      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Owner</Label>
          <selector v-model="owner" :store="ownersStore" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Driver</Label>
          <selector v-model="driver" :store="driversStore"></selector>
        </div>
      </div>

      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Vehicle</Label>
          <selector v-model="vehicle" :store="vehiclesStore"></selector>
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Expenses $</Label>
          <TextInput class="w-full" v-model="cost" />
        </div>
      </div>

      <Label class="mt-2">Note</Label>
      <TextInput class="w-full" v-model="note" />

      <ModalAction>
        <Button @click="saveAndEdit">{{ id > 0 ? 'Update' : 'Create' }}</Button>
        <Button class="ml-3" @click="close">Close</Button>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped>
.dp__theme_light {
  --dp-background-color: gray-500;
}
</style>
