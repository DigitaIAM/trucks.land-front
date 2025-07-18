<script setup lang="ts">
const emit = defineEmits(['selected'])

const brokersStore = useBrokersStore()
const ownersStore = useOwnersStore()
const driversStore = useDriversStore()
const vehiclesStore = useVehiclesStore()
const usersStore = useUsersStore()
const statusesStore = useStatusesStore()

const isOpen = computed(() => searchQuery.value.toString().length != 0)
const isSetResult = computed(
  () =>
    brokers.value?.length != 0 ||
    owners.value?.length != 0 ||
    drivers.value?.length != 0 ||
    vehicles.value?.length != 0 ||
    dispatchers.value?.length != 0 ||
    statuses.value?.length != 0,
)

const searchQuery = ref('')
const queryStr = ref('')

let timer: ReturnType<typeof setTimeout>
const delay = 250

watch(
  () => searchQuery.value,
  (query: string) => {
    clearTimeout(timer)
    if (query) {
      const text = query
      timer = setTimeout(() => {
        const query = searchQuery.value
        if (text === query) {
          queryStr.value = query.toString().trim().toLowerCase()
        }
      }, delay)
    } else {
      queryStr.value = ''
    }
  },
)

const brokers = computedAsync(async () => {
  const str = queryStr.value
  if (str) {
    return await brokersStore.search(str)
  }
  return []
}, [])

const owners = computedAsync(async () => {
  const str = queryStr.value
  if (str) {
    return await ownersStore.search(str)
  }
  return []
}, [])

const drivers = computedAsync(async () => {
  const str = queryStr.value
  if (str) {
    return await driversStore.search(str)
  }
  return []
}, [])

const vehicles = computedAsync(async () => {
  const str = queryStr.value
  if (str) {
    return await vehiclesStore.search(str)
  }
  return []
}, [])

const dispatchers = computedAsync(async () => {
  const str = queryStr.value
  if (str) {
    return await usersStore.search(str)
  }
  return []
}, [])

const statuses = computedAsync(async () => {
  const str = queryStr.value
  if (str) {
    return await statusesStore.search(str)
  }
  return []
}, [])

function select(field, value) {
  emit('selected', field, value)
  searchQuery.value = ''
}
</script>

<template>
  <div class="flex-1/2">
    <div
      class="flex items-center px-2 py-2 group hover:ring-1 hover:ring-gray-200 focus-within:!ring-2 ring-inset focus-within:!ring-blue-500 rounded-sm"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="mr-2 size-5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
      <input
        class="block appearance-none bg-transparent text-base focus:outline-none"
        placeholder=""
        aria-label="Search components"
        id="headlessui-combobox-input-:r5n:"
        role="combobox"
        type="text"
        aria-expanded="false"
        aria-autocomplete="list"
        v-model="searchQuery"
        v-on:blur="onFocusLost"
      />
    </div>
    <div
      v-if="isOpen && isSetResult"
      class="absolute z-50 p-1 glass border rounded-lg overflow-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full"
      style="display: block; margin-bottom: 5px"
    >
      <div class="flex flex-col-5 gap-10 mt-4">
        <Card v-if="brokers.length > 0">
          <CardBody>
            <CardTitle>Broker</CardTitle>
            <div
              class="cursor-pointer py-2 px-4 w-full text-sm rounded-lg focus:outline-hidden"
              v-for="(item, index) in brokers"
              :key="'broker_' + item.id"
              :tabindex="index"
              @click="select('broker', item)"
            >
              <div class="flex justify-between items-center w-full">
                <span>{{ item.name }}</span>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card v-if="drivers.length > 0">
          <CardBody>
            <CardTitle>Driver</CardTitle>
            <div
              class="cursor-pointer py-2 px-4 w-full text-sm rounded-lg focus:outline-hidden"
              v-for="(item, index) in drivers"
              :key="'driver_' + item.id"
              :tabindex="index"
              @click="select('driver', item)"
            >
              <div class="flex justify-between items-center w-full">
                <span>{{ item.name }}</span>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card v-if="vehicles.length > 0">
          <CardBody>
            <CardTitle>Vehicle</CardTitle>
            <div
              class="cursor-pointer py-2 px-4 w-full text-sm rounded-lg focus:outline-hidden"
              v-for="(item, index) in vehicles"
              :key="'vehicle_' + item.id"
              :tabindex="index"
              @click="select('vehicle', item)"
            >
              <div class="flex justify-between items-center w-full">
                <span>{{ item.name }}</span>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card v-if="owners.length > 0">
          <CardBody>
            <CardTitle>Owner</CardTitle>
            <div
              class="cursor-pointer py-2 px-4 w-full text-sm rounded-lg focus:outline-hidden"
              v-for="(item, index) in owners"
              :key="'owner_' + item.id"
              :tabindex="index"
              @click="select('owner', item)"
            >
              <div class="flex justify-between items-center w-full">
                <span>{{ item.name }}</span>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card v-if="dispatchers.length > 0">
          <CardBody>
            <CardTitle>Dispatcher</CardTitle>
            <div
              class="cursor-pointer py-2 px-4 w-full text-sm rounded-lg focus:outline-hidden"
              v-for="(item, index) in dispatchers"
              :key="'dispatcher_' + item.id"
              :tabindex="index"
              @click="select('dispatcher', item)"
            >
              <div class="flex justify-between items-center w-full">
                <span>{{ item.name }}</span>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card v-if="statuses.length > 0">
          <CardBody>
            <CardTitle>Status</CardTitle>
            <div
              class="cursor-pointer py-2 px-4 w-full text-sm rounded-lg focus:outline-hidden"
              v-for="(item, index) in statuses"
              :key="'status_' + item.id"
              :tabindex="index"
              @click="select('status', item)"
            >
              <div class="flex justify-between items-center w-full">
                <span>{{ item.name }}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
