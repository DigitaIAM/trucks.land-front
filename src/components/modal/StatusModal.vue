<script setup lang="ts">
import { TwitterPicker } from 'vue-color'

const props = defineProps<{
  edit: Status | null
}>()

const emit = defineEmits(['closed'])

const id = ref(null)
const name = ref('')

const palette = [
  '#00000000',
  '#29f0d5',
  '#5bc8aC',
  '#98dbc6',
  '#eaff00',
  '#DC2626',
  '#00ff00',
  '#a6a737',
  '#1D4ED8',
]
const color = defineModel({
  default: '#00000000',
})

watch(
  () => props.edit,
  (status) => {
    id.value = status?.id
    name.value = status?.name || ''
    color.value = status?.color ?? '#00000000'
    edit_status.showModal()
  },
  { deep: true },
)

const statusesStore = useStatusesStore()

function saveStatus() {
  if (id.value == null) {
    statusesStore.create({ name: name.value, color: color.value } as Status)
  } else {
    const status = { id: id.value, name: name.value, color: color.value } as Status
    statusesStore.update(status)
  }
  edit_status.close()
  emit('closed')
}
</script>

<template>
  <Flex class="mt-6 mb-2 justify-end px-6">
    <Button class="btn" onclick="edit_status.showModal()">Create</Button>
  </Flex>
  <Modal id="edit_status">
    <ModalBox class="w-2/5 min-w-[40%] max-w-[40%]">
      <Text size="2xl">Status</Text>

      <h5 class="text-gray-500 px-1 pb-2 mt-2">Name</h5>
      <div class="flex mb-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <TextInput v-model="name" />
        </div>
        <div class="ml-6 md:w-1/2 md:mb-0">
          <TwitterPicker :presetColors="palette" triangle="hide" v-model="color" />
        </div>
      </div>

      <div class="grid grid-cols-2 mt-10">
        <div class="gap-3 w-full">
          <div class="mb-2">
            <ToggleDescription label="start"></ToggleDescription>
          </div>
          <div class="mb-2">
            <ToggleDescription label="end"></ToggleDescription>
          </div>
        </div>

        <div class="gap-3 w-full">
          <div class="mb-2">
            <ToggleDescription label="Dispatcher team"></ToggleDescription>
          </div>
          <div class="mb-2">
            <ToggleDescription label="Tracking team"></ToggleDescription>
          </div>
          <div class="mb-2">
            <ToggleDescription label="Check out before payments"></ToggleDescription>
          </div>
          <div class="mb-2">
            <ToggleDescription label="Accounts"></ToggleDescription>
          </div>
          <div class="mb-2">
            <ToggleDescription label="QPay"></ToggleDescription>
          </div>
          <div class="mb-2">
            <ToggleDescription label="Ready for pay out"></ToggleDescription>
          </div>
        </div>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button @click="saveStatus()">Create</Button>
          <Button class="ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
