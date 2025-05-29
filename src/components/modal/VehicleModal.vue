<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const vanTypes = ['cargo van', 'small straight', 'large straight']

const props = defineProps<{
  edit: Vehicle | null
}>()

const id = ref<number>()

const is_cargo_van = ref(false)
const is_small_straight = ref(false)
const is_large_straight = ref(false)
const is_active = ref(false)

const owner = ref('')
const unit_id = ref('')
const vin = ref('')
const expiry_date = ref(new Date() as Date | undefined)
const model = ref('')
const type = ref('')
const color = ref('')
const year = ref<number>()

const load_capacity = ref<number>()
const length = ref<number>()
const width = ref<number>()
const height = ref<number>()
const door_width = ref<number>()
const door_height = ref<number>()

const vanType = ref<string>()

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (vehicle) => {
    resetAndShow(vehicle)
  },
  { deep: true },
)

const vehicleStore = useVehiclesStore()

function resetAndShow(vehicle: Vehicle | null) {
  id.value = vehicle?.id

  owner.value = vehicle?.owner
  unit_id.value = vehicle?.unit_id
  vin.value = vehicle?.vin
  expiry_date.value = vehicle?.expiry_date
  model.value = vehicle?.model
  type.value = vehicle?.type
  color.value = vehicle?.color
  year.value = vehicle?.year

  load_capacity.value = vehicle?.load_capacity
  length.value = vehicle?.lenght
  width.value = vehicle?.width
  height.value = vehicle?.height
  door_width.value = vehicle?.door_width
  door_height.value = vehicle?.door_height

  is_active.value = vehicle?.is_active || false
  is_cargo_van.value = vehicle?.is_cargo_van || false
  is_large_straight.value = vehicle?.is_large_straight || false
  is_small_straight.value = vehicle?.is_small_straight || false

  edit_vehicle.showModal()
}

function saveVehicle() {
  if (id.value == null) {
    vehicleStore.create({
      owner: owner.value,
      unit_id: unit_id.value,
      vin: vin.value,
      expiry_date: expiry_date.value,
      model: model.value,
      type: type.value,
      color: color.value,
      year: year.value,

      load_capacity: load_capacity.value,
      length: length.value,
      width: width.value,
      height: height.value,
      door_width: door_width.value,
      door_height: door_height.value,

      is_active: is_active.value,
      is_cargo_van: is_cargo_van.value,
      is_large_straight: is_large_straight.value,
      is_small_straight: is_small_straight.value,
    } as VehicleCreate)
  } else {
    vehicleStore.update(id.value, {
      owner: owner.value,
      unit_id: unit_id.value,
      vin: vin.value,
      expiry_date: expiry_date.value,
      model: model.value,
      type: type.value,
      color: color.value,
      year: year.value,

      load_capacity: load_capacity.value,
      length: length.value,
      width: width.value,
      height: height.value,
      door_width: door_width.value,
      door_height: door_height.value,

      is_active: is_active.value,
      is_cargo_van: is_cargo_van.value,
      is_large_straight: is_large_straight.value,
      is_small_straight: is_small_straight.value,
    } as VehicleUpdate)
  }
  edit_vehicle.close()
  emit('closed')
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Search></Search>
    <Button class="btn" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="edit_vehicle">
    <ModalBox>
      <Text size="2xl">Vehicle</Text>

      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-4/5 md:mb-0">
          <TextInput placeholder="Unit ID" v-model="unit_id" />
        </div>
        <div class="md:w-1/5 md:mb-0">
          <label class="label">
            <Toggle v-model="is_active"></Toggle>
            <span>active</span>
          </label>
        </div>
      </div>

      <RadioGroup name="Type" v-model="vanType">
        <div class="flex flex-row justify-between mb-4 mt-4 w-full">
          <div class="flex-col space-x-2" v-for="vanType in vanTypes" :key="vanType">
            <Radio xs :id="'vt-' + vanType" :value="vanType"></Radio>
            <label class="truncate" :for="'vt-' + vanType">{{ vanType }}</label>
          </div>
        </div>
      </RadioGroup>
      <selector
        :suggestions="suggestions"
        @build-options="callData"
        @click:suggestion="emit('selected', $event.id)"
      ></selector>

      <div class="flex space-x-3 mb-2 mt-6 w-full">
        <div class="md:w-1/2 md:mb-0">
          <TextInput placeholder="VIN" v-model="vin" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <VueDatePicker
            teleport-center
            :enable-time-picker="false"
            v-model="expiry_date"
          ></VueDatePicker>
        </div>
      </div>
      <div class="flex space-x-3 mb-4 mt-6 w-full">
        <div class="md:w-1/4 md:mb-0">
          <TextInput placeholder="Model" v-model="model" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <TextInput placeholder="Type" v-model="type" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <TextInput placeholder="Color" v-model="color" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <TextInput placeholder="Year" v-model="year" />
        </div>
      </div>
      <div class="flex space-x-3 mb-4 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Text>Cargo compartment</Text>
        </div>
        <div class="md:w-1/2 px-3 md:mb-0">
          <Text>it's dimensions</Text>
        </div>
      </div>
      <div class="flex space-x-3 mb-4 mt-4 w-full">
        <div class="md:w-1/4 md:mb-0">
          <TextInput placeholder="Load capacity" v-model="load_capacity" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <TextInput placeholder="Length" v-model="length" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <TextInput placeholder="Width" v-model="width" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <TextInput placeholder="Height" v-model="height" />
        </div>
      </div>
      <div class="flex space-x-3 mb-4 mt-4 w-full">
        <div class="md:w-1/5 md:mb-0">
          <Text>and door</Text>
        </div>
        <div class="md:w-2/5 md:mb-0">
          <TextInput placeholder="Width" v-model="door_width" />
        </div>
        <div class="md:w-2/5 md:mb-0">
          <TextInput placeholder="Height" v-model="door_height" />
        </div>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button @click="saveVehicle">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
