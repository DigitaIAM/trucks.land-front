<script setup lang="ts">
import '@vuepic/vue-datepicker/dist/main.css'

const listOfVanTypes = ['cargo van', 'small straight', 'large straight']

const owners = useOwnersStore()

const props = defineProps<{
  edit: Vehicle | null
}>()

const id = ref<number>()

const is_active = ref(false)

const owner = ref(null)

const unit_id = ref('')
const vin = ref('')
//const expiry_date = ref(new Date() as Date | undefined)
const model = ref('')
const kind = ref('')

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

  owner.value = vehicle ? { id: vehicle.owner } : null
  unit_id.value = vehicle?.unit_id
  vin.value = vehicle?.vin
  //expiry_date.value = vehicle?.expiry_date
  model.value = vehicle?.model
  kind.value = vehicle?.kind

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

  edit_vehicle.showModal()
}

async function saveVehicle() {
  try {
    if (id.value == null) {
      await vehicleStore.create({
        owner: owner.value?.id,
        unit_id: unit_id.value,
        vin: vin.value,
        //expiry_date: expiry_date.value,
        model: model.value,
        kind: kind.value,

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
      } as VehicleCreate)
    } else {
      vehicleStore.update(id.value, {
        owner: owner.value?.id,
        unit_id: unit_id.value,
        vin: vin.value,
        //expiry_date: expiry_date.value,
        model: model.value,
        kind: kind.value,

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
      } as VehicleUpdate)
    }
    edit_vehicle.close()
    emit('closed')
  } catch (e) {
    console.log('error', e)
  }
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <SearchVue :store="vehicleStore"></SearchVue>
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="edit_vehicle">
    <ModalBox class="w-4/5">
      <div class="flex space-x-3 mb-2 mt-2 w-full">
        <div class="md:w-1/5 md:mb-0 mr-12">
          <Text size="2xl">Vehicle</Text>
        </div>
        <div class="md:w-4/5 md:mb-0">
          <Button
            class="mr-3"
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

      <!--      <div class="flex space-x-3 mb-2 mt-4 w-full">-->
      <!--        <div class="md:w-1/2 md:mb-0">-->
      <!--          <Label>VIN</Label>-->
      <!--          <TextInput v-model="vin" />-->
      <!--        </div>-->
      <!--        <div class="md:w-1/2 md:mb-0">-->
      <!--          <Label>Expiry date</Label>-->
      <!--          <VueDatePicker-->
      <!--            class="my-custom-datepicker"-->
      <!--            teleport-center-->
      <!--            :enable-time-picker="false"-->
      <!--            v-model="expiry_date"-->
      <!--          ></VueDatePicker>-->
      <!--        </div>-->
      <!--      </div>-->
      <div class="flex space-x-3 mb-4 mt-4 w-full">
        <div class="md:w-1/4 md:mb-0">
          <Label>Model</Label>
          <TextInput v-model="model" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <Label>Type</Label>
          <TextInput v-model="kind" />
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
.dp__theme_light {
  --dp-background-color: gray-500;
  --dp-text-color: gray-200;
}
</style>
