<route lang="yaml">
# @formatter:off
meta:
  layout: order-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
defineOptions({
  __loaders: [useOrgData],
})

const _insurance = ref<Insurance | null>(null)
const owner = ref<Owner | null>(null)
const policy_number = ref('')
const start_date = ref<Date | null>(null)
const end_date = ref<Date | null>(null)

const vehicle = ref<Vehicle | null>(null)
const driver = ref<Driver | null>(null)

const insurancesStore = useInsuranceStore()
const insuranceVehicleStore = useInsuranceVehicleStore()
const insuranceDriverStore = useInsuranceDriverStore()
const ownerStore = useOwnersStore()
const vehicleStore = useVehiclesStore()
const driverStore = useDriversStore()

const route = useRoute()

watch(
  () => route.params.id,
  (id) => {
    resetAndShow(id)
  },
  { deep: true },
)

resetAndShow(route.params.id)

async function resetAndShow(str: string) {
  const id = Number(str)

  await insuranceVehicleStore.loading(id)
  await insuranceDriverStore.loading(id)
  const insurance = await insurancesStore.resolve(id)

  if (insurance) {
    _insurance.value = insurance
    owner.value = { id: insurance.owner } as Owner
    policy_number.value = insurance.policy_number
    start_date.value = insurance.start_date
    end_date.value = insurance.end_date
  } else {
    // TODO show error
  }
}

const state = reactive({})

function resolve(
  order: Order,
  name: string,
  create: () => object,
  request: () => Promise<object | null>,
  label: (obj: object) => string,
) {
  const s = state[order.id] ?? {}
  if (s && s[name]) {
    return label(s[name])
  } else {
    s[name] = create()
    state[order.id] = s
    request().then((obj) => {
      if (obj) state[order.id][name] = obj
    })
    return label(s[name])
  }
}

const cols = [
  {
    label: 'Unit Id',
    value: (v: InsuranceVehicle) =>
      resolve(
        v,
        'unitId_' + v.vehicle,
        () => ({ name: '_' }),
        () => vehicleStore.resolve(v.vehicle),
        (map) => map.unit_id,
      ),
    size: 190,
  },
  {
    label: 'VIN',
    value: (v: InsuranceVehicle) =>
      resolve(
        v,
        'unitId_' + v.vehicle,
        () => ({ name: '_' }),
        () => vehicleStore.resolve(v.vehicle),
        (map) => map.vin,
      ),
    size: 190,
  },
  {
    label: 'Model',
    value: (v: InsuranceVehicle) =>
      resolve(
        v,
        'unitId_' + v.vehicle,
        () => ({ name: '_' }),
        () => vehicleStore.resolve(v.vehicle),
        (map) => map.model,
      ),
    size: 190,
  },
  {
    label: 'year',
    value: (v: InsuranceVehicle) =>
      resolve(
        v,
        'unitId_' + v.vehicle,
        () => ({ name: '_' }),
        () => vehicleStore.resolve(v.vehicle),
        (map) => map.year,
      ),
    size: 190,
  },
]

const colDs = [
  {
    label: 'Name',
    value: (v: InsuranceDriver) =>
      resolve(
        v,
        'driver_' + v.driver,
        () => ({ name: '-' }),
        () => driverStore.resolve(v.driver),
        (map) => map.name,
      ),
    size: 300,
  },
]

function addVehicle() {
  const docId = _insurance.value?.id
  const vehicleId = vehicle.value?.id
  try {
    if (docId && vehicleId) {
      insuranceVehicleStore.create({
        insurance: docId,
        vehicle: vehicleId,
      } as InsuranceVehicleCreate)
      vehicle.value = null
    }
  } catch (e) {
    console.log('error', e)
  }
}

function addDriver() {
  const docId = _insurance.value?.id
  const driverId = driver.value?.id
  try {
    if (docId && driverId) {
      insuranceDriverStore.create({
        insurance: docId,
        driver: driverId,
      } as InsuranceDriverCreate)
      driver.value = null
    }
  } catch (e) {
    console.log('error', e)
  }
}
</script>

<template>
  <Text size="xl" class="ml-6 mt-5">Insurance</Text>
  <div class="flex w-full mt-5">
    <div class="w-[90vw] md:w-[50vw]">
      <div class="ml-5 mb-3">
        <Label class="mb-1">Owner</Label>
        <selector disabled v-model="owner" :store="ownerStore"></selector>
      </div>
      <div class="flex space-x-3 mb-6 w-full">
        <div class="md:w-1/3 md:mb-0 ml-5">
          <Label class="mb-1">Policy number</Label>
          <TextInput disabled :modelValue="policy_number" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label class="mb-1">Policy EFF</Label>
          <TextInput disabled v-model="start_date" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label class="mb-1">Policy EXP</Label>
          <TextInput disabled v-model="end_date" />
        </div>
      </div>
      <Text size="xl" class="ml-6 mt-10">Vehicles</Text>
      <div class="ml-6 mb-6">
        <table class="w-full text-left table-fixed">
          <thead>
            <tr
              class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
            >
              <th
                v-for="col in cols"
                :key="col.label"
                class="p-4"
                :style="{ width: col.size + 'px' }"
              >
                <p class="block antialiasing tracking-wider font-thin leading-none">
                  {{ col.label }}
                </p>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="vehicle in insuranceVehicleStore.listing" :key="vehicle.id">
              <td
                v-for="col in cols"
                class="py-3 px-4"
                :key="col.label"
                :style="{ width: col.size + 'px' }"
              >
                <p
                  class="block antialiasing tracking-wide font-light leading-normal truncate"
                  :style="{ width: col.size + 'px' }"
                >
                  {{ col.value(vehicle) }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex space-x-3 mb-6 w-full">
        <selector
          class="md:w-4/5 md:mb-0 ml-5"
          label="Select a vehicle"
          v-model="vehicle"
          :store="vehicleStore"
        ></selector>
        <div class="md:w-1/5 md:mb-0">
          <Button class="btn-soft font-light tracking-wider" @click="addVehicle"> Add </Button>
        </div>
      </div>

      <Text size="xl" class="ml-6 mt-10">Drivers</Text>
      <div class="ml-6 mb-6">
        <table class="w-full text-left table-fixed">
          <thead>
            <tr
              class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
            >
              <th
                v-for="colD in colDs"
                :key="colD.label"
                class="p-4"
                :style="{ width: colD.size + 'px' }"
              >
                <p class="block antialiasing tracking-wider font-thin leading-none">
                  {{ colD.label }}
                </p>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="driver in insuranceDriverStore.listing" :key="driver.id">
              <td
                v-for="colD in colDs"
                class="py-3 px-4"
                :key="colD.label"
                :style="{ width: colD.size + 'px' }"
              >
                <p
                  class="block antialiasing tracking-wide font-light leading-normal truncate"
                  :style="{ width: colD.size + 'px' }"
                >
                  {{ colD.value(driver) }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex space-x-3 mb-6 w-full">
        <selector
          class="md:w-4/5 md:mb-0 ml-5"
          label="Select a driver"
          v-model="driver"
          :store="driverStore"
        ></selector>
        <div class="md:w-1/5 md:mb-0">
          <Button class="btn-soft font-light tracking-wider" @click="addDriver"> Add </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
