<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue'
import { type EventCreate, useEventsStore } from '@/stores/events.ts'
import VueDatePicker from '@vuepic/vue-datepicker'

const listOfPriorites = ['normal', 'direct']
const listOfTimeliness = ['early', 'on time', 'behind']

const props = defineProps<{
  order: number | null
  edit: Event | null
}>()

const id = ref(null)
const address = ref('')
const city = ref('')
const state = ref('')
const zip = ref('')
const datetime = ref(new Date() as Date | undefined)

const note = ref('')
const priority = ref<string>()
const timeliness = ref<string>()

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (event) => {
    console.log('watch', event)
    resetAndShow(event)
  },
  { deep: true },
)

const eventsStore = useEventsStore()

function resetAndShow(event: Event | null) {
  if (event?.kind != 'delivery') {
    throw 'incorrect kind "' + event?.kind + '" expected delivery'
  }

  id.value = event?.id
  address.value = event?.address || ''
  city.value = event?.city || ''
  state.value = event?.state || ''
  zip.value = event?.zip
  datetime.value = event?.datetime || ''
  note.value = event?.details?.note || ''
  priority.value = event?.details?.priority ?? 'normal'
  timeliness.value = event?.details?.timeliness ?? 'on time'

  create_delivery.showModal()
}

async function saveAndEdit() {
  try {
    await eventsStore.create({
      order: props.order,
      kind: 'delivery',
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

    close()
  } catch (e) {
    console.log('error', e)
  }
}

function close() {
  create_delivery.close()
  // emit('closed')
}
</script>

<template>
  <Modal id="create_delivery">
    <ModalBox class="max-w-[calc(40vw-6.25rem)]">
      <div class="flex items-start justify-between">
        <div>
          <Text size="2xl">Delivery</Text>
        </div>
        <div class="flex items-center justify-between">
          <Button
            sm
            class="mr-1 mb-2"
            v-for="ft in listOfPriorites"
            :key="ft"
            :class="{ 'bg-accent': priority == ft }"
            @click="priority = ft"
          >
            {{ ft }}
          </Button>
        </div>
      </div>

      <Label>Note</Label>
      <TextInput class="w-full px-3" v-model="note" />

      <Label class="mt-4">Address</Label>
      <TextInput class="w-full px-3" v-model="address" />

      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>City / town</Label>
          <TextInput v-model="city" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <Label>State</Label>
          <TextInput v-model="state" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <Label>Zip</Label>
          <TextInput v-model="zip" />
        </div>
      </div>

      <div class="flex space-x-3 mb-2 w-full">
        <Label class="mt-2 mr-4">Completed</Label>
        <div class="flex items-center justify-between mt-4 mr-4">
          <Button
            sm
            class="mr-1 mb-2"
            v-for="item in listOfTimeliness"
            :key="item"
            :class="{ 'bg-accent': timeliness == item }"
            @click="timeliness = item"
          >
            {{ item }}
          </Button>
        </div>
        <div class="w-1/2 mt-4 ml-4">
          <VueDatePicker
            teleport-center
            :enable-time-picker="true"
            v-model="datetime"
          ></VueDatePicker>
        </div>
      </div>
      <ModalAction>
        <Button @click="saveAndEdit">Create</Button>
        <Button class="ml-3" @click="close">Close</Button>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
