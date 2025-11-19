<script setup lang="ts">
import { TwitterPicker } from 'vue-color'
import type { StatusCreate } from '@/stores/stages.ts'

const props = defineProps<{
  edit: Status | null
}>()

const emit = defineEmits(['closed'])

const id = ref<number>()
const name = ref('')

const palette = [
  '#00000000',
  'rgba(41,240,213,0.8)',
  'rgba(91,200,172,0.8)',
  'rgba(94,252,194,0.8)',
  'rgba(247,200,0,0.8)',
  'rgba(240,36,25,0.8)',
  'rgba(0,255,0,0.8)',
  'rgba(166,167,55,0.8)',
  'rgba(29,78,216,0.8)',
]
const color = defineModel({
  default: '#00000000',
})

watch(
  () => props.edit,
  (status) => {
    resetAndShow(status)
  },
  { deep: true },
)

const statusesStore = useStatusesStore()

function resetAndShow(status: Status | null) {
  id.value = status?.id
  name.value = status?.name || ''
  color.value = status?.color ?? '#00000000'
  edit_status.showModal()
}

function saveStatus() {
  if (id.value == null) {
    statusesStore.create({ name: name.value, color: color.value } as StatusCreate)
  } else {
    statusesStore.update(id.value, { name: name.value, color: color.value } as StatusUpdate)
  }
  edit_status.close()
  emit('closed')
}
</script>

<template>
  <div class="place-self-end px-3 mb-2 mt-3">
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="edit_status">
    <ModalBox class="w-4/5">
      <Text size="2xl">Status</Text>

      <div>
        <Label class="mt-2">Name</Label>
        <TextInput class="w-full" v-model="name" />
      </div>

      <div class="flex space-x-3 mb-6 mt-6 w-full">
        <TwitterPicker :presetColors="palette" triangle="hide" v-model="color" />
      </div>

      <ModalAction>
        <form method="dialog">
          <Button @click="saveStatus()" class="btn-soft font-light tracking-wider">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
