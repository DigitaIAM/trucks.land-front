<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
dayjs.extend(isBetween)

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

const selectedEvent = ref<EmployeeAbsences | null>(null)

const absencesList = ref([])
const currentMonth = ref(dayjs())
const daysInMonth = computed(() => currentMonth.value.daysInMonth())

const calendarDays = computed(() => {
  return Array.from({ length: daysInMonth.value }, (_, i) => i + 1)
})

function isWeekend(day: number) {
  const date = currentMonth.value.date(day)
  const dayOfWeek = date.day()
  return dayOfWeek === 0
}

const employeesList = computedAsync(async () => {
  const response = await supabase
    .from('users')
    .select('id, real_name, user_conditions!user_conditions_user_id_fkey!inner(user_id)')
    .eq('fired', false)

  return response.data?.sort((a, b) => a.real_name.localeCompare(b.real_name))
}, [])

async function fetchAbsences() {
  const from = currentMonth.value.startOf('month')
  const till = currentMonth.value.endOf('month')

  const response = await supabase
    .from('employee_absences')
    .select('*')
    .lte('start_date', till.format('YYYY-MM-DD'))
    .gte('end_date', from.format('YYYY-MM-DD'))

  if (response.data) {
    absencesList.value = response.data
  }
}

onMounted(() => {
  fetchAbsences()
})

watch(currentMonth, () => {
  fetchAbsences()
})

function getEvent(employeeId: number, day: number) {
  const event = resolveEvent(employeeId, day)
  if (event) return event['absence_type'].replace(' ', '-')
}

function resolveEvent(employeeId: number, day: number) {
  const checkDate = currentMonth.value.startOf('month').date(day)

  for (const event of absencesList.value ?? []) {
    if (event['employee'] == employeeId) {
      if (dayjs(event['end_date']) >= checkDate && dayjs(event['start_date']) <= checkDate) {
        return event
      }
    }
  }
}

function clickOnCell(employee: object, day: number) {
  const event = resolveEvent(employee.id, day)
  if (event) {
    selectedEvent.value = event
  } else {
    const date = currentMonth.value.startOf('month').date(day)
    selectedEvent.value = {
      id: -1,
      employee: employee.id,
      start_date: date.format('YYYY-MM-DD'),
      end_date: date.format('YYYY-MM-DD'),
    } as EmployeeAbsences
  }
}
</script>

<template>
  <div class="flex flex-row items-center justify-between px-4 mb-4 mt-4">
    <Text size="2xl">{{ currentMonth.format('MMMM') }}</Text>
    <div class="flex items-center gap-2">
      <div class="w-4 h-4 rounded bg-[#94a3b8]"></div>
      <span class="text-sm font-medium">Unpaid leave</span>
      <div class="w-4 h-4 rounded bg-[#f59e0b]"></div>
      <span class="text-sm font-medium">Sick leave</span>
      <div class="w-4 h-4 rounded bg-[#3b82f6]"></div>
      <span class="text-sm font-medium">Vacation</span>
    </div>
    <AbsenceEmployee :event="selectedEvent" @on-update="fetchAbsences"></AbsenceEmployee>
  </div>
  <div class="timeline-container">
    <div class="grid-table" :style="{ gridTemplateColumns: `200px repeat(${daysInMonth}, 1fr)` }">
      <div class="header-cell sticky-col">Employees</div>
      <div
        v-for="day in calendarDays"
        :key="day"
        class="header-cell"
        :class="{ 'weekend-bg': isWeekend(day) }"
      >
        {{ day }}
      </div>
      <template v-for="employee in employeesList" :key="employee.id">
        <div class="employee-cell sticky-col">{{ employee.real_name }}</div>
        <div
          v-for="day in calendarDays"
          :key="day"
          class="day-cell"
          :class="[getEvent(employee.id, day), { 'weekend-bg': isWeekend(day) }]"
          @click="clickOnCell(employee, day)"
        ></div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.timeline-container {
  overflow: auto;
  max-width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}

.grid-table {
  display: grid;
  /* Автоматически подстраивается под контент */
  min-width: max-content;
  color: #212121;
  font-size: 14px;
}

.sticky-col {
  position: sticky;
  z-index: 10;
  background-color: #f8fafc !important; /* Светлый фон для имен */
  font-weight: bold;
  box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.header-cell {
  position: sticky;
  justify-content: center;
  align-items: center;
  z-index: 20;
  background: #f1f5f9;
  padding: 16px;
  font-weight: bold;
  border-bottom: 2px solid #cbd5e1;
  border-right: 1px solid #e2e8f0;
}

/* Пересечение шапки и левой колонки */
.header-cell.sticky-col {
  z-index: 30;
}

.day-cell {
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  min-width: 40px; /* Ширина колонки дня */
  height: 60px;
  background: #fff;
  position: relative;
  transition: background-color 0.2s;
}

.day-cell.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.weekend-bg {
  background-color: #f8fafc;
}

.header-cell.weekend-bg {
  color: #ef4444;
}

.event-bar {
  pointer-events: none;
}

.unpaid-leave {
  background: #94a3b8;
}

.sick-leave {
  background: #f59e0b;
}

.vacation {
  background: #3b82f6;
}
</style>
