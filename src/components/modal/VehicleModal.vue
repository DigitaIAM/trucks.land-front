<script setup lang="ts">
import '@vuepic/vue-datepicker/dist/main.css'

const listOfVanTypes = ['cargo van', 'small straight', 'large straight', 'dry van']

const LEGACY_TYPE_ID = -1

const owners = useOwnersStore()

const props = defineProps<{
  edit: Vehicle | null
}>()

const id = ref<number>()

const is_active = ref(false)

const owner = ref(null)

const unit_id = ref('')
const vin = ref('')

const model = ref('')
const kind = ref('')
const vehicle_type_id = ref<number | null>(null)

const color = ref('')
const year = ref<number>()

const load_capacity = ref<number>()
const length = ref<number>()
const width = ref<number>()
const height = ref<number>()
const door_width = ref<number>()
const door_height = ref<number>()

const vanType = ref<string>()
const contract = ref(false)

const saveError = ref<string | null>(null)

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (vehicle) => {
    resetAndShow(vehicle)
  },
  { deep: true },
)

const vehicleStore = useVehiclesStore()
const vehicleTypeStore = useVehicleTypeStore()

const vehicleTypeOptions = computed(() => {
  const options = (vehicleTypeStore.listing ?? []).map((vt) => ({ id: vt.id, name: vt.name }))

  if (kind.value && !options.some((option) => option.name === kind.value)) {
    options.unshift({ id: LEGACY_TYPE_ID, name: `${kind.value} (нет в справочнике)` })
  }

  return options
})

function syncVehicleTypeId() {
  if (vehicle_type_id.value && vehicle_type_id.value !== LEGACY_TYPE_ID) return

  const match = (vehicleTypeStore.listing ?? []).find((vt) => vt.name === kind.value)
  vehicle_type_id.value = match?.id ?? (kind.value ? LEGACY_TYPE_ID : null)
}

watch(
  () => vehicleTypeStore.listing,
  () => syncVehicleTypeId(),
  { immediate: true },
)

function resetAndShow(vehicle: Vehicle | null) {
  saveError.value = null

  id.value = vehicle?.id

  owner.value = vehicle ? { id: vehicle.owner } : null
  unit_id.value = vehicle?.unit_id
  vin.value = vehicle?.vin
  model.value = vehicle?.model
  kind.value = vehicle?.kind ?? ''
  vehicle_type_id.value = vehicle?.vehicle_type_id ?? null

  syncVehicleTypeId()

  color.value = vehicle?.color
  year.value = vehicle?.year

  load_capacity.value = vehicle?.load_capacity
  length.value = vehicle?.length
  width.value = vehicle?.width
  height.value = vehicle?.height
  door_width.value = vehicle?.door_width
  door_height.value = vehicle?.door_height

  is_active.value = vehicle?.is_active || false
  vanType.value = vehicle?.type ?? 'cargo van'
  contract.value = vehicle?.contract || false

  edit_vehicle.showModal()
}

async function saveVehicle() {
  saveError.value = null

  const selectedType = vehicleTypeOptions.value.find(
    (option) => option.id === vehicle_type_id.value,
  )
  const validType = selectedType && selectedType.id !== LEGACY_TYPE_ID ? selectedType : null
  const selectedTypeId =
    validType?.id ??
    (vehicle_type_id.value && vehicle_type_id.value !== LEGACY_TYPE_ID
      ? vehicle_type_id.value
      : null)

  const vehicleData = {
    owner: owner.value?.id,
    unit_id: unit_id.value,
    vin: vin.value,
    model: model.value,
    kind: validType?.name ?? kind.value,
    color: color.value,
    year: year.value,
    load_capacity: load_capacity.value,
    length: length.value,
    width: width.value,
    height: height.value,
    door_width: door_width.value,
    door_height: door_height.value,
    is_active: is_active.value,
    type: vanType.value,
    contract: contract.value,
    vehicle_type_id: selectedTypeId,
  }

  try {
    if (id.value == null) {
      await vehicleStore.create(vehicleData as VehicleCreate)
    } else {
      await vehicleStore.update(id.value, vehicleData as VehicleUpdate)
    }
    edit_vehicle.close()
    emit('closed')
  } catch (e) {
    saveError.value = e?.message ?? 'Unknown error'
  }
}

function handleClick() {
  contract.value = !contract.value
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <SearchVue :store="vehicleStore"></SearchVue>
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  </div>
  <div v-if="saveError" class="mt-4 px-4 py-2 rounded bg-red-100 text-red-700 text-sm">
    {{ saveError }}
  </div>
  <Modal id="edit_vehicle">
    <ModalBox class="w-4/5">
      <div class="flex mb-2 mt-2 w-full">
        <Text class="mr-3" size="xl">Vehicle</Text>
        <div class="md:w-5/6 md:mb-0">
          <Button
            class="mr-1"
            sm
            v-for="ft in listOfVanTypes"
            :key="ft"
            :class="{ 'bg-accent': ft == vanType }"
            @click="vanType = ft"
          >
            {{ ft }}
          </Button>
        </div>
      </div>

      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-4/5 md:mb-0">
          <Label>Unit ID</Label>
          <TextInput v-model="unit_id" />
        </div>
        <div class="md:w-1/5 md:mb-0 mt-8">
          <label class="label">
            <Toggle v-model="is_active"></Toggle>
            <span>active</span>
          </label>
        </div>
      </div>

      <Label class="mt-2">Owner</Label>
      <selector v-model="owner" :store="owners"></selector>

      <div class="mb-2 mt-4 w-full">
        <Label>VIN</Label>
        <TextInput class="w-full" v-model="vin" />
      </div>

      <div class="flex space-x-3 mb-4 mt-4 w-full">
        <div class="md:w-1/4 md:mb-0">
          <Label>Model</Label>
          <TextInput v-model="model" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <Label>Type</Label>
          <Select v-model="vehicle_type_id" :options="vehicleTypeOptions" class="w-full" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <Label>Color</Label>
          <TextInput v-model="color" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <Label>Year</Label>
          <TextInput v-model="year" />
        </div>
      </div>
      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Text>Cargo compartment</Text>
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Text>it's dimensions</Text>
        </div>
      </div>
      <div class="flex space-x-3 mb-4 mt-2 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>load capacity</Label>
          <TextInput v-model="load_capacity" />
        </div>
        <div class="md:w-1/6 md:mb-0">
          <Label>length</Label>
          <TextInput v-model="length" />
        </div>
        <div class="md:w-1/6 md:mb-0">
          <Label>width</Label>
          <TextInput v-model="width" />
        </div>
        <div class="md:w-1/6 md:mb-0">
          <Label>height</Label>
          <TextInput v-model="height" />
        </div>
      </div>
      <div class="flex space-x-3 mb-4 mt-4 w-full">
        <div class="md:w-1/5 md:mb-0 mt-6">
          <Text>and door</Text>
        </div>
        <div class="md:w-2/5 md:mb-0">
          <Label>width</Label>
          <TextInput v-model="door_width" />
        </div>
        <div class="md:w-2/5 md:mb-0">
          <Label>height</Label>
          <TextInput v-model="door_height" />
        </div>
      </div>
      <div class="flex space-x-3 mb-4 mt-10 w-full">
        <Button class="mr-3" :class="{ 'bg-accent': contract }" @click="handleClick"
          >contract
        </Button>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button @click="saveVehicle" class="btn-soft font-light tracking-wider">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped>
.exclude-active {
  background-color: red;
}
</style>
