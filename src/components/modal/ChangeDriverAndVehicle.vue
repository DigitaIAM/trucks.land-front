<script setup lang="ts">
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
const cost = ref(null)
const city = ref('')
const state = ref('')
const zip = ref('')

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

function resetAndShow(event: Event | null) {
  if (event?.kind != 'change') {
    throw 'incorrect kind "' + event?.kind + '" expected "change"'
  }

  id.value = event?.id
  datetime.value = event?.datetime || ''
  note.value = event?.details?.note || ''
  driver.value = event.driver ? { id: event.driver } : null
  vehicle.value = event.vehicle ? { id: event.vehicle } : null
  cost.value = event?.cost
  city.value = event?.city || ''
  state.value = event?.state || ''
  zip.value = event?.zip

  create_change.showModal()
}

async function saveAndEdit() {
  try {
    await eventsStore.create({
      document: props.document,
      kind: 'change',
      datetime: datetime.value,
      driver: driver.value?.id,
      vehicle: vehicle.value?.id,
      cost: cost.value,
      details: {
        note: note.value,
      },
      city: city.value,
      state: state.value,
      zip: zip.value,
    } as EventCreate)

    close()
  } catch (e) {
    console.log('error', e)
  }
}

function close() {
  create_change.close()
  emit('on-update')
}
</script>

<template>
  <Modal id="create_change">
    <ModalBox class="max-w-[calc(40vw-6.25rem)]">
      <div class="flex items-start justify-between">
        <div class="md:w-1/2 md:mb-0">
          <Text size="2xl">Change of driver and vehicle</Text>
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

      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>City / town</Label>
          <TextInput v-model="city" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <Label>State</Label>
          <TextInput v-model="state" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <Label>Zip</Label>
          <TextInput v-model="zip" />
        </div>
      </div>
      <ModalAction>
        <Button class="btn-soft font-light tracking-wider" @click="saveAndEdit">
          {{ id > 0 ? 'Update' : 'Create' }}
        </Button>
        <Button class="btn-soft font-light tracking-wider ml-3" @click="close">Close</Button>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped>
.dp__theme_light {
  --dp-background-color: gray-500;
  --dp-text-color: gray-200;
}
</style>
