<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker'

const props = defineProps<{
  document: number | null
  edit: Event | null
}>()

const id = ref(null)
const datetime = ref(new Date() as Date | undefined)
const note = ref<string>('')
const driver = ref<Driver | null>(null)
const vehicle = ref<Vehicle | null>(null)
const cost = ref<number | null>(null)

const emit = defineEmits(['on-update'])

const buttonDisabled = ref(false)
const errorMsg = ref<string | null>(null)

watch(
  () => props.edit,
  (event) => {
    resetAndShow(event)
  },
  { deep: true },
)

const eventsStore = useEventsStore()
const driversStore = useDriversStore()
const vehiclesStore = useVehiclesStore()

function resetAndShow(event: Event | null) {
  if (event?.kind != 'expenses') {
    throw 'incorrect kind "' + event?.kind + '" expected "expenses"'
  }

  id.value = event?.id
  datetime.value = event?.datetime || ''
  note.value = event?.details?.note || ''
  driver.value = event.driver ? { id: event.driver } : null
  vehicle.value = event.vehicle ? { id: event.vehicle } : null
  cost.value = event?.cost

  create_expenses.showModal()
}

async function saveAndEdit() {
  errorMsg.value = null
  buttonDisabled.value = true
  try {
    const id = props.edit?.id
    if (id >= 0) {
      await eventsStore.update(id, {
        document: props.document,
        kind: 'expenses',
        datetime: datetime.value,
        driver: driver.value?.id,
        vehicle: vehicle.value?.id,
        cost: cost.value,
        details: {
          note: note.value,
        },
      } as EventUpdate)
    } else {
      await eventsStore.create({
        document: props.document,
        kind: 'expenses',
        datetime: datetime.value,
        driver: driver.value?.id,
        vehicle: vehicle.value?.id,
        cost: cost.value,
        details: {
          note: note.value,
        },
      } as EventCreate)
    }

    close()
  } catch (e) {
    errorMsg.value = e
  } finally {
    buttonDisabled.value = false
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
            class="my-custom-datepicker"
            teleport-center
            :enable-time-picker="true"
            v-model="datetime"
          ></VueDatePicker>
        </div>
      </div>

      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Driver</Label>
          <selector v-model="driver" :store="driversStore"></selector>
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Vehicle</Label>
          <selector v-model="vehicle" :store="vehiclesStore"></selector>
        </div>
      </div>

      <Label>Expenses $</Label>
      <TextInput class="w-full" v-model="cost" />

      <Label class="mt-2">Note</Label>
      <TextInput class="w-full" v-model="note" />

      <ModalAction>
        <Button
          class="btn-soft font-light tracking-wider"
          :disabled="buttonDisabled"
          @click="saveAndEdit"
        >
          {{ id > 0 ? 'Update' : 'Create' }}
        </Button>
        <Button class="btn-soft font-light tracking-wider ml-3" @click="close">Close</Button>
      </ModalAction>
      <div v-if="errorMsg" class="text-red-500">{{ errorMsg }}</div>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
