<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  org: Organization
}>()

const emit = defineEmits(['selected'])

const ordersStore = useOrdersStore()
const brokersStore = useBrokersStore()
const ownersStore = useOwnersStore()
const driversStore = useDriversStore()
const vehiclesStore = useVehiclesStore()
const usersStore = useUsersStore()
const statusesStore = useStatusesStore()

const isOpen = computed(() => searchQuery.value.toString().length != 0)
const isSetResult = computed(
  () =>
    orders_number.value?.length != 0 ||
    orders_references.value?.length != 0 ||
    orders_pl.value?.length != 0 ||

    brokers.value?.length != 0 ||
    owners.value?.length != 0 ||
    drivers.value?.length != 0 ||
    vehicles.value?.length != 0 ||
    dispatchers.value?.length != 0 ||

    statuses.value?.length != 0
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
  }
)

const orders_number = computedAsync(async () => {
  const str = queryStr.value
  if (str && str.length >= 5 && str.length <= 6) {
    return await ordersStore.searchByNumber(props.org.id, str)
  }
  return []
}, [])

const orders_references = computedAsync(async () => {
  const str = queryStr.value
  if (str && str.length >= 2) {
    const list = await ordersStore.searchByReferences(props.org.id, str)
    return list.map((v) => ({ 'id': v, 'name': v }))
  }
  return []
}, [])

const orders_pl = computedAsync(async () => {
  const str = queryStr.value
  if (str && str.length >= 2) {
    const list = await ordersStore.searchByPL(props.org.id, str)
    return list.map((v) => ({ 'id': v, 'name': v }))
  }
  return []
}, [])

const orders_pickup_state = computedAsync(async () => {
  const str = queryStr.value
  if (str && str.length >= 2) {
    const list = await ordersStore.searchByPL(props.org.id, str)
    return list.map((v) => ({ 'id': v, 'name': v }))
  }
  return []
}, [])

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

function select(field: string, value: any) {
  emit('selected', field, value)
  searchQuery.value = ''
}

function openOrder(field: string, value: any) {
  if (value && value.id) {
    window.open('/' + props.org.code3.toLowerCase() + '/order/' + value.id, '_blank')
  }
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
        class="block appearance-none bg-transparent text-base focus:outline-none w-full"
        placeholder=""
        aria-label="Search components"
        id="headlessui-combobox-input-:r5n:"
        role="combobox"
        type="text"
        aria-expanded="false"
        aria-autocomplete="list"
        v-model="searchQuery"
      />
    </div>
    <div
      v-if="isOpen && isSetResult"
      class="absolute z-50 bg-base-300 rounded-lg overflow-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full"
      style="display: block; margin-bottom: 5px"
    >
      <div class="flex flex-col-5 gap-10 mb-2 mx-2">
        <SearchBlock @click="openOrder" id="order_number" label="orders" :items="orders_number"
                     :value="(v: Order) => v.number + ' @ ' + v.created_at.substring(0, 10)" />
        <SearchBlock @click="select" id="refs" label="references"
                     :items="orders_references"
        />
        <SearchBlock @click="select" id="posted_loads" label="posted load" :items="orders_pl"
        />
        <SearchBlock @click="select" id="broker" label="brokers" :items="brokers" />
        <SearchBlock @click="select" id="driver" label="drivers" :items="drivers" />
        <SearchBlock @click="select" id="vehicle" label="vehicles" :items="vehicles" />
        <SearchBlock @click="select" id="owner" label="owners" :items="owners" />
        <SearchBlock @click="select" id="dispatcher" label="dispatchers" :items="dispatchers" />
        <SearchBlock @click="select" id="status" label="statuses" :items="statuses" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
