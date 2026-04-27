<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker'
import { type User, useUsersStore } from '@/stores/users.ts'
import {
  type EmployeeAbsenceCreate,
  type EmployeeAbsences,
  type EmployeeAbsenceUpdate,
  useEmployeeAbsencesStore,
} from '@/stores/employee_absences.ts'
import dayjs from 'dayjs'
import moment from 'moment-timezone'

const absenceSettings = [
  { color: '#94a3b8', id: 'unpaid leave', label: 'unpaid leave' },
  { color: '#f59e0b', id: 'sick leave', label: 'sick leave' },
  { color: '#3b82f6', id: 'vacation', label: 'vacation' },
]

const usersStore = useUsersStore()

const props = defineProps<{
  event: EmployeeAbsences | null | undefined
  disabled?: boolean
}>()

const employee = ref<User | null>(null)
const absence_type = ref<string>('unpaid leave')
const note = ref<string>('')
const datetime = ref([new Date(), new Date()])

const colorMode = useColorMode()

const emit = defineEmits(['on-update'])

watch(
  () => props.event,
  (event) => resetAndShow(event),
  { deep: true },
)

const employeeAbsencesStore = useEmployeeAbsencesStore()

async function resetAndShow(event: EmployeeAbsences) {
  const from = event?.start_date
  const till = event?.end_date

  employee.value = event.employee ? ({ id: event.employee } as User) : null
  datetime.value = [
    from ? moment(from).toDate() : new Date(),
    till ? moment(till).toDate() : new Date(),
  ]
  absence_type.value = event.absence_type ?? 'unpaid leave'
  note.value = event.note || ''
  create_absence.showModal()
}

async function saveAndEdit() {
  try {
    const employeeId = employee.value?.id
    const eventId = props.event.id
    if (eventId && eventId > 0) {
      await employeeAbsencesStore.updateAbsence(eventId, {
        employee: employeeId,
        start_date: dayjs(datetime.value[0]).format('YYYY-MM-DD'),
        end_date: dayjs(datetime.value[1]).format('YYYY-MM-DD'),
        absence_type: absence_type.value,
        note: note.value,
      } as EmployeeAbsenceUpdate)
    } else if (employeeId) {
      await employeeAbsencesStore.createAbsence({
        employee: employeeId,
        start_date: dayjs(datetime.value[0]).format('YYYY-MM-DD'),
        end_date: dayjs(datetime.value[1]).format('YYYY-MM-DD'),
        absence_type: absence_type.value,
        note: note.value,
      } as EmployeeAbsenceCreate)
    }
    emit('on-update')
    create_absence.close()
  } catch (e) {
    console.error('Error saving absence:', e)
  }
}

function close() {
  create_absence.close()
  emit('on-update')
}

function setAbsenceType(v: string) {
  if (!props.disabled) {
    absence_type.value = v
  }
}

const selectedDaysCount = computed(() => {
  if (!datetime.value || datetime.value.length < 2) return 0

  const start = dayjs(datetime.value[0])
  const end = dayjs(datetime.value[1])

  if (!start.isValid() || !end.isValid()) return 0

  return end.diff(start, 'day') + 1
})
</script>

<template>
  <Modal id="create_absence">
    <ModalBox class="max-w-[calc(100vw-6.25rem)]0vw)]">
      <div class="flex items-start justify-between mb-4">
        <div>
          <Text size="2xl">Absence</Text>
        </div>
        <div class="flex items-center justify-between px-2">
          <Button
            sm
            class="mr-1 mb-2"
            v-for="type in absenceSettings"
            :key="type.id"
            :style="{
              backgroundColor: absence_type === type.id ? type.color : 'transparent',
              color: absence_type === type.id ? 'white' : '#475569',
            }"
            @click="setAbsenceType(type.id)"
          >
            {{ type.label }}
          </Button>
        </div>
      </div>
      <div class="flex space-x-3 mb-2 mt-2 w-full">
        <div class="md:w-5/6 md:mb-0">
          <VueDatePicker
            class="my-custom-datepicker"
            range
            teleport-center
            :enable-time-picker="false"
            v-model="datetime"
            :dark="colorMode.preference == 'dark'"
          ></VueDatePicker>
        </div>
        <div class="md:w-1/6 md:mb-0 mt-2">
          <Text>{{ selectedDaysCount }} day (s)</Text>
        </div>
      </div>
      <div class="mb-4">
        <Label>Employee</Label>
        <selector v-model="employee" :store="usersStore" name="real_name"></selector>
      </div>

      <Label>Note</Label>
      <TextInput class="w-full" v-model="note" ref="firstFocus" />

      <ModalAction>
        <Button class="btn-soft font-light tracking-wider" @click="saveAndEdit">
          {{ event?.id > 0 ? 'Update' : 'Create' }}
        </Button>
        <Button class="btn-soft font-light tracking-wider ml-3" @click="close">Close</Button>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
