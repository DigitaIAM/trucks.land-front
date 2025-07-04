<script setup lang="ts">
import type { Order } from '@/stores/orders.ts'
import { type FileRecord, useFilesStore } from '@/stores/order_files.ts'
import { defineEmits } from 'vue'

const props = defineProps<{
  order: Order | null
}>()

const authStore = useAuthStore()
const usersStore = useUsersStore()
const filesStore = useFilesStore()

const stages = ref([
  { label: 'RC', check: false },
  { label: 'BOL', check: false },
  { label: 'POD', check: false },
])

const fileType = ref('RC')
const fileInfo = ref<File | null>(null)
const signedBy = ref('')

async function upload() {
  console.log('upload happens here', fileType.value, fileInfo.value)

  const user = authStore.user
  if (user == null) {
    throw 'authorize first'
  }

  const cUser = await usersStore.resolveUUID(user.id)
  if (cUser == null) {
    throw 'authorize first'
  }

  const type = fileType.value
  const file = fileInfo.value

  if (file) {
    const createAt = props.order?.created_at
    if (createAt) {
      const path =
        '/' +
        createAt.substring(0, 4) +
        '/' +
        createAt.substring(5, 7) +
        '/' +
        type +
        '/' +
        file.name

      console.log('path', path)
      const result = await supabase.storage.from('orders').upload(path, file)

      console.log('result', result)

      await filesStore.create({
        document: props.order?.id,
        file_type: fileType.value,
        signed_by: signedBy.value,
        path: path,
        created_by: cUser.id,
      })

      if (result.data) {
        const sl = stages.value
        for (const idx in sl) {
          if (fileType.value == sl[idx].label) {
            sl[idx].check = true
            break
          }
        }
      } else {
        // TODO show error
      }
    } else {
      throw 'no order creation date'
    }
  } else {
    throw 'one file expected'
  }
}

const files = ref(<FileRecord>[])

watch(
  () => props.order,
  (order) => {
    console.log('watch id', order, props.order)
    resetAndShow(order?.id)
  },
  { deep: true },
)

resetAndShow(props.order?.id)

async function resetAndShow(id: number | null) {
  files.value = await filesStore.listing(id)
}

function isPresent(file_type: string) {
  const list = files.value
  for (const idx in list) {
    const file = list[idx]
    if (file.file_type == file_type) {
      return true
    }
  }
  return false
}
</script>

<template>
  <Button link onclick="modal.showModal()">
    <div class="flex">
      <label for="dropzone-file" class="flex">
        <div class="w-40 pb-10 mt-8">
          <div class="relative flex justify-between w-full">
            <div class="absolute top-2/4 h-0.5 w-full bg-gray-500"></div>
            <div
              v-for="stage in stages"
              class="relative z-8 grid w-8 h-8 font-bold text-white transition-all duration-300 bg-gray-500 rounded-full place-items-center"
            >
              <svg
                v-if="isPresent(stage.label)"
                class="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <div class="absolute -bottom-[1.5rem] w-max text-center">
                <h6
                  class="block text-base font-semibold leading-relaxed tracking-normal text-gray-400"
                >
                  {{ stage.label }}
                </h6>
              </div>
            </div>
          </div>
        </div>
      </label>
    </div>
  </Button>

  <Modal id="modal">
    <ModalBox>
      <Text size="2xl" class="mr-4">Files</Text>
      <Button
        sm
        class="mr-4 mb-2"
        v-for="ft in ['RC', 'BOL', 'POD']"
        :key="ft"
        :class="{ 'bg-accent': ft == fileType }"
        @click="fileType = ft"
      >
        {{ ft }}
      </Button>

      <div class="flex space-x-4 mb-6 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <TextInput placeholder="signed by" v-model="signedBy"></TextInput>
        </div>
        <div class="md:w-1/2 md:mb-0">
          <FileInput @file="(f) => (fileInfo = f)"></FileInput>
        </div>
      </div>

      <div v-for="file in files" :key="file.path" class="mt-2 mb-2">
        <Text>{{ file.path }}</Text>
      </div>

      <ModalAction>
        <form method="dialog">
          <Button class="mr-4" @click="upload">Upload</Button>
          <Button>Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
