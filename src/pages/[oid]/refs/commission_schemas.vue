<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const insurancesStore = useInsuranceStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await insurancesStore.loading(org.id)
    // console.table(org)
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
import { useVehicleTypeStore } from '@/stores/vehicle_type.ts'

defineOptions({
  __loaders: [useOrgData],
})

const vehicleTypeStore = useVehicleTypeStore()
const authStore = useAuthStore()

const isManager = ref(true)
const activeTab = ref<number | null>(null)

interface Tier {
  id?: number
  vehicle_type_id: number
  gross: number
  dispatch_fee: number
  dispatcher_commission: number
  _deleted?: boolean
}

const tiers = ref<Tier[]>([])
const loading = ref(false)

async function fetchTiers() {
  const { data, error } = await supabase
    .from('vehicle_commission_tiers')
    .select('*')
    .eq('deleted', false)
    .order('gross', { ascending: true })

  if (error) {
    console.error('Error fetching tiers:', error)
    return
  }

  tiers.value = data || []
}

function getTiersForVehicle(vehicleTypeId: number) {
  const list = tiers.value
    .filter((t) => t.vehicle_type_id === vehicleTypeId && !t._deleted)
    .sort((a, b) => a.gross - b.gross)
  return list
}

function addTier(vehicleTypeId: number) {
  tiers.value.push({
    vehicle_type_id: vehicleTypeId,
    gross: 0,
    dispatch_fee: 0,
    dispatcher_commission: 0,
  })
}

async function removeTier(tier: Tier) {
  const account = await authStore.currentAccount()
  if (tier.id) {
    const { error } = await supabase
      .from('vehicle_commission_tiers')
      .update({
        deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: account?.id,
      })
      .eq('id', tier.id)

    if (error) {
      alert('Ошибка: ' + error.message)
      return
    }
  }

  const index = tiers.value.indexOf(tier)
  tiers.value.splice(index, 1)
}

async function saveSchema() {
  loading.value = true
  const account = await authStore.currentAccount()

  try {
    // 1. Удаляем помеченные
    const toDelete = tiers.value.filter((t) => t._deleted && t.id).map((t) => t.id!)
    if (toDelete.length) {
      const { error } = await supabase.from('vehicle_commission_tiers').delete().in('id', toDelete)
      if (error) throw error
    }

    // 2. Новые записи (без id)
    const toInsert = tiers.value
      .filter((t) => !t._deleted && !t.id)
      .map((t) => ({
        vehicle_type_id: t.vehicle_type_id,
        gross: t.gross,
        dispatch_fee: t.dispatch_fee,
        dispatcher_commission: t.dispatcher_commission,
        created_by: account?.id,
      }))

    if (toInsert.length) {
      const { error } = await supabase.from('vehicle_commission_tiers').insert(toInsert)
      if (error) throw error
    }

    // 3. Существующие записи (с id)
    const toUpdate = tiers.value
      .filter((t) => !t._deleted && t.id)
      .map((t) => ({
        id: t.id,
        vehicle_type_id: t.vehicle_type_id,
        gross: t.gross,
        dispatch_fee: t.dispatch_fee,
        dispatcher_commission: t.dispatcher_commission,
        created_by: account?.id,
      }))

    if (toUpdate.length) {
      const { error } = await supabase
        .from('vehicle_commission_tiers')
        .upsert(toUpdate, { onConflict: 'id' })
      if (error) throw error
    }

    await fetchTiers()
    alert('Сохранено!')
  } catch (err: any) {
    console.error('Save error:', err)
    alert('Ошибка: ' + err.message)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await vehicleTypeStore.fetchListing()
  await fetchTiers()
  if (vehicleTypeStore.listing?.length) {
    activeTab.value = vehicleTypeStore.listing[0].id
  }
})
</script>

<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-800">Setting up commission scales</h1>
        <p class="text-sm text-gray-500">
          Managing Dispatch FEE percentages and dispatcher commissions
        </p>
      </div>
    </div>

    <div class="flex space-x-2 border-b border-gray-200 mb-6 bg-white p-2 rounded-lg shadow-sm">
      <button
        v-for="truck in vehicleTypeStore.listing"
        :key="truck.id"
        @click="activeTab = truck.id"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-md transition-colors',
          activeTab === truck.id
            ? 'bg-indigo-600 text-white shadow'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
        ]"
      >
        {{ truck.name }}
      </button>
    </div>

    <div v-for="truck in vehicleTypeStore.listing" :key="truck.id">
      <div
        v-if="activeTab === truck.id"
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div class="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 class="font-semibold text-gray-700">{{ truck.name }}</h2>
          <button
            @click="addTier(truck.id)"
            :disabled="!isManager"
            class="disabled:opacity-50 btn-indigo flex items-center space-x-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            <span>+ Add range</span>
          </button>
        </div>

        <div class="p-6 overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr
                class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-3"
              >
                <th class="w-16 pb-3">#</th>
                <th class="w-32 pb-3"></th>
                <th class="w-48 pb-3">gross ($)</th>
                <th class="w-40 pb-3">dispatch FEE</th>
                <th class="w-40 pb-3">dispatcher commissions</th>
                <th class="w-24 pb-3 text-right" v-if="isManager">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(tier, index) in getTiersForVehicle(truck.id)"
                :key="tier.id ?? index"
                class="hover:bg-gray-50/50 transition-colors"
              >
                <td class="py-4 text-sm font-medium text-gray-700">{{ index + 1 }}</td>

                <td class="py-4 text-sm text-gray-600">
                  {{ index === getTiersForVehicle(truck.id).length - 1 ? 'over' : 'till' }}
                </td>

                <td class="py-4 pr-4">
                  <div class="relative rounded-lg shadow-sm">
                    <input
                      type="number"
                      v-model.number="tier.gross"
                      :disabled="!isManager"
                      placeholder="5000"
                      class="w-full rounded-lg border-gray-300 text-sm pl-3 pr-8 py-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    />
                    <div
                      class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm"
                    >
                      $
                    </div>
                  </div>
                </td>

                <td class="py-4 pr-4">
                  <div class="relative rounded-lg shadow-sm">
                    <input
                      type="number"
                      step="0.1"
                      v-model.number="tier.dispatch_fee"
                      :disabled="!isManager"
                      placeholder="10"
                      class="w-full rounded-lg border-gray-300 text-sm pl-3 pr-8 py-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    />
                    <div
                      class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm"
                    >
                      %
                    </div>
                  </div>
                </td>

                <td class="py-4 pr-4">
                  <div class="relative rounded-lg shadow-sm">
                    <input
                      type="number"
                      step="0.01"
                      v-model.number="tier.dispatcher_commission"
                      :disabled="!isManager"
                      placeholder="0.90"
                      class="w-full rounded-lg border-gray-300 text-sm pl-3 pr-8 py-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    />
                    <div
                      class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm"
                    >
                      %
                    </div>
                  </div>
                </td>

                <td class="py-4 text-right text-sm" v-if="isManager">
                  <button
                    @click="removeTier(tier)"
                    class="text-red-600 hover:text-red-900 font-medium p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="mt-6 flex justify-end" v-if="isManager">
      <button
        @click="saveSchema"
        class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors"
      >
        Save scale changes
      </button>
    </div>
  </div>
</template>
