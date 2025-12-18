<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { useFocus } from '@vueuse/core'
import { useTemplateRef } from 'vue'

const props = defineProps<{
  document: number | null
  edit: OrderEvent | null
  disabled?: boolean
}>()

const id = ref<number | null>(null)
const datetime = ref(new Date() as Date | undefined)
const note = ref<string>('')
const driver = ref<Driver | null>(null)
const company = ref<Owner | null>(null)
const vehicle = ref<Vehicle | null>(null)
const vehicle_found_by = ref<User | null>(null)
const cost = ref<number | null>(null)
const percent = ref<number | null>(null)

const emit = defineEmits(['on-update'])

const firstInput = useTemplateRef('firstFocus')
const { focused: inputFocus } = useFocus(firstInput, { initialValue: true })

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
const usersStore = useUsersStore()
const ownersStore = useOwnersStore()

function resetAndShow(event: OrderEvent | null) {
  if (event) {
    if (event.kind != 'agreement') {
      throw 'incorrect kind "' + event?.kind + '" expected "agreement"'
    }

    id.value = event.id
    datetime.value = event.datetime
    note.value = event.details?.note || ''
    driver.value = event.driver ? { id: event.driver } : null
    company.value = event.company ? { id: event.company } : null
    vehicle.value = event.vehicle ? { id: event.vehicle } : null
    vehicle_found_by.value = event && event.vehicle_found_by ? { id: event.vehicle_found_by } : null
    cost.value = event.cost
    percent.value = event.percent

    create_agreement.showModal()
    setTimeout(() => (inputFocus.value = true), 50)
  } else {
    create_agreement.close()
  }
}

async function saveAndEdit() {
  errorMsg.value = null
  buttonDisabled.value = true
  try {
    const id = props.edit?.id
    if (id >= 0) {
      await eventsStore.update(id, {
        document: props.document,
        kind: 'agreement',
        datetime: datetime.value,
        driver: driver.value?.id ?? null,
        company: company.value?.id ?? null,
        vehicle: vehicle.value?.id ?? null,
        vehicle_found_by: vehicle_found_by.value?.id ?? null,
        cost: cost.value,
        percent: percent.value,
        details: note.value
          ? {
              note: note.value,
            }
          : null,
      } as EventUpdate)
    } else {
      await eventsStore.create({
        document: props.document,
        kind: 'agreement',
        datetime: datetime.value,
        driver: driver.value?.id ?? null,
        company: company.value?.id ?? null,
        vehicle: vehicle.value?.id ?? null,
        vehicle_found_by: vehicle_found_by.value?.id ?? null,
        cost: cost.value,
        percent: percent.value,
        details: note.value
          ? {
              note: note.value,
            }
          : null,
      } as EventCreate)
    }

    close()
  } catch (e) {
    errorMsg.value = e
  } finally {
    buttonDisabled.value = false
    // console.log('vehicle_found_by', vehicle_found_by.value?.id)
  }
}

function close() {
  create_agreement.close()
  emit('on-update')
}
</script>

<template>
  <Modal id="create_agreement">
    <ModalBox class="max-w-[calc(50vw)]">
      <div class="flex items-start justify-between">
        <div class="md:w-1/2 md:mb-0">
          <Text size="2xl">Agreement</Text>
        </div>
        <div class="md:w-1/2 md:mb-0">
          <VueDatePicker
            class="my-custom-datepicker"
            teleport-center
            :enable-time-picker="true"
            v-model="datetime"
            :disabled="props.disabled"
          ></VueDatePicker>
        </div>
      </div>

      <Label class="mt-2">Note</Label>
      <TextInput class="w-full" v-model="note" :disabled="props.disabled" ref="firstFocus" />

      <fieldset :disabled="props.disabled">
        <div class="flex space-x-3 mt-4 w-full">
          <div class="md:w-1/2 md:mb-0">
            <Label>Driver</Label>
            <selector
              v-model="driver"
              :store="driversStore"
              :disabled="company?.id != undefined"
            ></selector>
          </div>
          <Text class="pt-8">or</Text>
          <div class="md:w-1/2 md:mb-0">
            <Label>Company</Label>
            <selector
              v-model="company"
              :store="ownersStore"
              :disabled="driver?.id != undefined"
            ></selector>
          </div>
        </div>
      </fieldset>

      <fieldset :disabled="props.disabled">
        <div class="flex space-x-3 mb-2 mt-2 w-full">
          <div class="md:w-1/3 md:mb-0">
            <Label class="mb-3">Vehicle owner</Label>
            <div>
              <QueryAndShow :id="vehicle?.owner" :store="ownersStore"></QueryAndShow>
            </div>
          </div>
          <div class="md:w-1/3 md:mb-0">
            <Label>Vehicle</Label>
            <selector
              v-model="vehicle"
              :store="vehiclesStore"
              :disabled="company?.id != undefined"
            ></selector>
          </div>
          <div class="md:w-1/3 md:mb-0">
            <Label>found by</Label>
            <selector
              v-model="vehicle_found_by"
              :store="usersStore"
              :disabled="vehicle?.id === undefined || company?.id != undefined"
            />
          </div>
        </div>
      </fieldset>

      <fieldset :disabled="props.disabled">
        <div class="flex space-x-3 mb-2 mt-2 w-full">
          <div class="md:w-1/2 md:mb-0">
            <Label class="mb-1">Payment $</Label>
            <TextInput class="block w-full" v-model="cost" :disabled="percent > 0" />
          </div>
          <Text class="pt-8">or</Text>
          <div class="md:w-1/2 md:mb-0">
            <Label class="mb-1">Percent % </Label>
            <TextInput class="block w-full" v-model="percent" :disabled="cost > 0" />
          </div>
        </div>
      </fieldset>

      <ModalAction>
        <Button
          class="btn-soft font-light tracking-wider"
          :disabled="buttonDisabled"
          @click="saveAndEdit"
          v-if="!props.disabled"
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
