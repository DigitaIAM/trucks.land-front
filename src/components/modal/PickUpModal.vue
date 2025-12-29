<script setup lang="ts">
import { useFocus } from '@vueuse/core'
import { useTemplateRef } from 'vue'

import VueDatePicker from '@vuepic/vue-datepicker'

const listOfPriorities = ['normal', 'ASAP']
const listOfTimeliness = ['early', 'on time', 'behind']

const props = defineProps<{
  document: number | null
  edit: OrderEvent | null
  disabled?: boolean
}>()

const id = ref<number | null>(null)
const company_at_location = ref<string | undefined>(undefined)
const address = ref<string>('')
const city = ref<string>('')
const state = ref<string>('')
const zip = ref<string>('')
const datetime = ref<Date | undefined>(new Date() as Date)
const note = ref<string>('')
const priority = ref<string>('')
const timeliness = ref<string>('')

const emit = defineEmits(['on-update'])

const firstInput = useTemplateRef('firstFocus')
const { focused: inputFocus } = useFocus(firstInput, { initialValue: true })

const buttonDisabled = ref(false)
const errorMsg = ref<string | null>(null)

watch(
  () => props.edit,
  (event) => {
    resetAndShow(event)
  },
  { deep: true },
)

const eventsStore = useEventsStore()

function resetAndShow(event: OrderEvent | null) {
  if (event) {
    if (event.kind != 'pick-up') {
      throw 'incorrect kind "' + event?.kind + '" expected "pick-up"'
    }

    id.value = event.id
    company_at_location.value = event.company_at_location
    address.value = event.address || ''
    city.value = event.city || ''
    state.value = event.state || ''
    zip.value = event.zip
    datetime.value = event.datetime || ''
    note.value = event.details?.note || ''
    priority.value = event.details?.priority ?? 'normal'
    timeliness.value = event.details?.timeliness ?? 'on time'

    create_pickUp.showModal()
    setTimeout(() => (inputFocus.value = true), 50)
  } else {
    create_pickUp.close()
  }
}

async function saveAndEdit() {
  errorMsg.value = null
  buttonDisabled.value = true
  try {
    const id = props.edit?.id
    if (id >= 0) {
      await eventsStore.update(id, {
        document: props.document,
        kind: 'pick-up',
        company_at_location: company_at_location.value,
        address: address.value,
        city: city.value,
        state: state.value,
        zip: zip.value,
        datetime: datetime.value,
        details: {
          note: note.value,
          priority: priority.value,
          timeliness: timeliness.value,
        },
      } as EventUpdate)
    } else {
      await eventsStore.create({
        document: props.document,
        kind: 'pick-up',
        company_at_location: company_at_location.value,
        address: address.value,
        city: city.value,
        state: state.value,
        zip: zip.value,
        datetime: datetime.value,
        details: {
          note: note.value,
          priority: priority.value,
          timeliness: timeliness.value,
        },
      } as EventCreate)
    }
    close()
  } catch (e) {
    errorMsg.value = e
  } finally {
    buttonDisabled.value = false
  }
}

function close() {
  create_pickUp.close()
  emit('on-update')
}

function setPriority(v: string) {
  if (!props.disabled) {
    priority.value = v
  }
}

function setTimeliness(v: string) {
  if (!props.disabled) {
    timeliness.value = v
  }
}
</script>

<template>
  <Modal id="create_pickUp">
    <ModalBox class="max-w-[calc(50vw)]">
      <div class="flex items-start justify-between">
        <div>
          <Text size="2xl">Pick up</Text>
        </div>

        <div class="flex items-center justify-between">
          <Button
            sm
            class="mr-1 mb-2"
            v-for="ft in listOfPriorities"
            :key="ft"
            :class="{ 'bg-accent': priority == ft }"
            @click="setPriority(ft)"
          >
            {{ ft }}
          </Button>
        </div>
      </div>

      <Label>Note</Label>
      <TextInput class="w-full px-3" v-model="note" :disabled="props.disabled" ref="firstFocus" />

      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label class="mt-4">Company at location</Label>
          <TextInput class="w-full px-3" v-model="company_at_location" :disabled="props.disabled" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label class="mt-4">Address</Label>
          <TextInput class="w-full px-3" v-model="address" :disabled="props.disabled" />
        </div>
      </div>

      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/3 md:mb-0">
          <Label>City / town</Label>
          <TextInput v-model="city" :disabled="props.disabled" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label>State</Label>
          <TextInput v-model="state" :disabled="props.disabled" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label>Zip</Label>
          <TextInput v-model="zip" :disabled="props.disabled" />
        </div>
      </div>

      <div class="grid grid-cols-2 justify-items-stretch space-x-3 mb-2 mt-4 w-full">
        <div class="mt-4">
          <Label class="mt-2 mr-4">Completed</Label>
          <Button
            sm
            class="mr-1 mb-2"
            v-for="item in listOfTimeliness"
            :key="item"
            :class="{ 'bg-accent': timeliness == item }"
            @click="setTimeliness(item)"
          >
            {{ item }}
          </Button>
        </div>
        <div class="md:w-7/8 md:mb-0 mt-4 justify-self-end">
          <VueDatePicker
            class="my-custom-datepicker"
            teleport-center
            :enable-time-picker="true"
            v-model="datetime"
            :disabled="props.disabled"
          ></VueDatePicker>
        </div>
      </div>

      <ModalAction>
        <Button
          class="btn-soft font-light tracking-wider"
          :disabled="buttonDisabled"
          @click="saveAndEdit"
          v-if="!props.disabled"
        >
          {{ id > 0 ? 'Update' : 'Create' }}
        </Button>
        <Button class="btn-soft font-light tracking-wider ml-3" @click="close">Close</Button>
      </ModalAction>
      <div v-if="errorMsg" class="text-red-500">{{ errorMsg }}</div>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
