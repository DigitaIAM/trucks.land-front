<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'
import { groupKey, loadSimilarLoads } from '@/composables/use-similar-loads'
import type { SimilarLoadGroup, SimilarLoadOrder } from '@/composables/use-similar-loads'
import { useSimilarLoadDismissalsStore } from '@/stores/similar_load_dismissals'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const dismissalsStore = useSimilarLoadDismissalsStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await dismissalsStore.load(org.id)
    const groups = await loadSimilarLoads(org.id, dismissalsStore.verifiedKeys)
    return { org, groups }
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
const brokersStore = useBrokersStore()
const statusesStore = useStatusesStore()
const usersStore = useUsersStore()
const commentsStore = useCommentsStore()

defineOptions({
  __loaders: [useOrgData],
})

const orgData = useOrgData()

const groups = ref<SimilarLoadGroup[]>(orgData.data.value?.groups ?? [])
watch(
  () => orgData.data.value?.groups,
  (value) => {
    if (value) {
      groups.value = value
    }
  },
)

const searchNumber = ref('')

const filteredGroups = computed(() => {
  const text = searchNumber.value.trim()
  if (!text) {
    return groups.value
  }
  return groups.value.filter((group) =>
    group.orders.some((order) => String(order.number).includes(text)),
  )
})

const state = reactive({})

function resolve(
  order: SimilarLoadOrder,
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

function resolveById(
  id: number,
  name: string,
  request: () => Promise<object | null>,
  label: (obj: object) => string,
) {
  const s = state['ref_' + id] ?? {}
  if (s && s[name]) {
    return label(s[name])
  } else {
    s[name] = { name: '?' }
    state['ref_' + id] = s
    request().then((obj) => {
      if (obj) state['ref_' + id][name] = obj
    })
    return label(s[name])
  }
}

const cols = [
  {
    label: '#',
    value: (v: SimilarLoadOrder) => v.number,
    size: 70,
  },
  {
    label: 'week',
    value: (v: SimilarLoadOrder) => v.week,
    size: 50,
  },
  {
    label: 'status',
    value: (v: SimilarLoadOrder) =>
      resolve(
        v,
        'status_' + v.stage,
        () => ({ name: '?', color: '' }),
        () => statusesStore.resolve(v.stage),
        (map) => map.name,
      ),
    size: 120,
  },
  {
    label: 'dispatcher',
    value: (v: SimilarLoadOrder) =>
      resolve(
        v,
        'dispatcher_' + v.created_by,
        () => ({ name: '?' }),
        () => usersStore.resolve(v.created_by),
        (map) => map.name,
      ),
    size: 100,
  },
  {
    label: 'refs',
    value: (v: SimilarLoadOrder) => v.refs,
    size: 150,
  },
  {
    label: 'cost',
    value: (v: SimilarLoadOrder) => '$' + v.cost,
    size: 80,
  },
  {
    label: 'spend',
    value: (v: SimilarLoadOrder) => '$' + (v.driver_cost ?? 0),
    size: 80,
  },
  {
    label: 'rc',
    value: (v: SimilarLoadOrder) =>
      v.rcHashes.map((hash: string) => hash.substring(0, 8)).join(', '),
    size: 140,
  },
  {
    label: 'comment',
    value: (v: SimilarLoadOrder) =>
      resolve(
        v,
        'note',
        () => [],
        () => commentsStore.commentsForOrder(v.id),
        (map) => map[0]?.notes ?? '',
      ),
    size: 200,
  },
]

function locationLabel(event: OrderEvent | null) {
  if (!event) {
    return '-'
  }
  return [event.company_at_location, event.address, event.city, event.state, event.zip]
    .filter((part) => part)
    .join(', ')
}

function openOrder(id: number) {
  window.open('/' + orgData.data.value.org.code3.toLowerCase() + '/order/' + id, '_blank')
}

async function verifyGroup(group: SimilarLoadGroup) {
  const orgId = orgData.data.value.org.id
  groups.value = groups.value.filter((item) => item !== group)
  await dismissalsStore.verify(orgId, groupKey(group.broker, group.pickup, group.delivery))
}

function brokerName(id: number) {
  return resolveById(
    id,
    'broker',
    () => brokersStore.resolve(id),
    (map) => map.name,
  )
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Similar loads</Text>
    <div class="flex items-center text-sm text-gray-500">
      {{ filteredGroups.length }} group{{ filteredGroups.length === 1 ? '' : 's' }}
    </div>
    <div class="ml-auto w-64">
      <TextInput v-model="searchNumber" placeholder="Search by load number" />
    </div>
  </div>

  <div v-if="filteredGroups.length === 0" class="px-4 mt-6 text-gray-500">
    No similar loads found.
  </div>

  <div v-for="(group, groupIndex) in filteredGroups" :key="groupIndex" class="mb-6 px-4">
    <div
      class="flex flex-wrap items-center gap-4 border border-base-300 rounded-lg px-4 py-2 mb-2 bg-base-200"
    >
      <div class="font-medium tracking-wider">Broker: {{ brokerName(group.broker) }}</div>
      <div class="text-sm">
        Pickup: <span class="font-light">{{ locationLabel(group.pickup) }}</span>
      </div>
      <div class="text-sm">
        Delivery: <span class="font-light">{{ locationLabel(group.delivery) }}</span>
      </div>
      <div class="text-sm">Loads: {{ group.orders.length }}</div>
      <div v-if="group.rcMatch" class="badge badge-success badge-outline font-light tracking-wider">
        RC identical
      </div>
      <div v-else class="badge badge-error badge-outline font-light tracking-wider">RC differ</div>
      <Button ghost xs class="ml-auto" title="Mark as verified" @click="verifyGroup(group)">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4 text-success"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </Button>
    </div>

    <table class="w-full text-left table-auto min-w-max">
      <thead>
        <tr class="text-sm text-base-content/60 uppercase border-b border-base-300">
          <th
            v-for="col in cols"
            :key="'head_' + col.label"
            class="p-2"
            :style="{ width: col.size + 'px' }"
          >
            <p class="block antialiasing tracking-wider font-thin leading-none">
              {{ col.label }}
            </p>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="order in group.orders"
          :key="order.id"
          class="hover:bg-base-200"
          @click="openOrder(order.id)"
        >
          <td
            v-for="col in cols"
            :key="'row_' + col.label + '_' + order.id"
            class="py-3 px-2"
            :style="{ width: col.size + 'px' }"
          >
            <p
              class="block antialiasing tracking-wide font-light leading-normal truncate"
              :style="{ width: col.size + 'px' }"
            >
              {{ col.value(order) }}
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped></style>
