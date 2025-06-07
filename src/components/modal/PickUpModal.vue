<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'

const listOfPriorites = ['normal', 'ASAP']
const listOfTimeliness = ['early', 'on time', 'behind']

const props = defineProps<{
  order: number
  edit: PickUp | null
}>()

const id = ref(null)
const note = ref('')
const address1 = ref('')
const address2 = ref('')
const city = ref('')
const state = ref('')
const zip = ref('')
const datetime = ref(new Date() as Date | undefined)

const priority = ref<string>()
const timeliness = ref<string>()

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (pickUp) => {
    console.log('watch', pickUp)
    resetAndShow(pickUp)
  },
  { deep: true },
)

const pickUpStore = usePickUpStore()

function resetAndShow(pickUp: PickUp | null) {
  id.value = pickUp?.id
  note.value = pickUp?.note || ''
  address1.value = pickUp?.address1 || ''
  address2.value = pickUp?.address2 || ''
  city.value = pickUp?.city || ''
  state.value = pickUp?.state || ''
  zip.value = pickUp?.zip
  datetime.value = pickUp?.datetime || ''

  priority.value = pickUp?.priority ?? 'normal'
  timeliness.value = pickUp?.timeliness ?? 'on time'

  create_pickUp.showModal()
}

async function saveAndEdit() {
  try {
    await pickUpStore.create({
      order: props.order,
      note: note.value,
      address1: address1.value,
      address2: address2.value,
      city: city.value,
      state: state.value,
      zip: zip.value,
      datetime: datetime.value,

      priority: priority.value,
      timeliness: timeliness.value,
    } as PickUpCreate)

    close()
  } catch (e) {
    console.log('error', e)
  }
}

function close() {
  create_pickUp.close()
  // emit('closed')
}
</script>

<template>
  <Modal id="create_pickUp">
    <ModalBox class="max-w-[calc(40vw-6.25rem)]">
      <div class="flex items-start justify-between">
        <div>
          <Text size="2xl">Pick up</Text>
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

      <div class="flex space-x-3 mb-2 mt-4">
        <div class="md:w-1/2 md:mb-0">
          <Label>Address 1</Label>
          <TextInput v-model="address1" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Address 2</Label>
          <TextInput v-model="address2" />
        </div>
      </div>
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
        <div class="flex items-center justify-between mt-4">
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
        <div class="w-1/2 mt-4">
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
