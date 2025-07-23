<script setup lang="ts">
import type { Order } from '@/stores/orders.ts'
import { type FileRecord, useFilesStore } from '@/stores/order_files.ts'

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
  { label: 'INV', check: false },
])

const fileType = ref('RC')
const fileInfo = ref<File | null>(null)
const signedBy = ref('')

const state = reactive({})

function resolve(
  file: File,
  name: string,
  create: () => object,
  request: () => Promise<object | null>,
  label: (obj: object) => string,
) {
  const s = state[file.id] ?? {}
  if (s && s[name]) {
    return label(s[name])
  } else {
    s[name] = create()
    state[file.id] = s
    request().then((obj) => {
      if (obj) state[file.id][name] = obj
    })
    return label(s[name])
  }
}

function resolveAccount(file: File) {
  return resolve(
    file,
    'createdBy',
    () => ({ name: '' }),
    async () => usersStore.resolve(file.created_by),
    (account) => account.name,
  )
}

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
  const order = props.order

  if (file && order) {
    const createAt = order.created_at
    if (createAt) {
      const path =
        '/' +
        createAt.substring(0, 4) +
        '/' +
        createAt.substring(5, 7) +
        '/' +
        createAt.substring(8, 10) +
        '/' +
        order.id +
        '/' +
        type +
        '_' +
        file.name

      const result = await supabase.storage.from('orders').upload(path, file)

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

const files = ref<Array<FileRecord>>([])

watch(
  () => props.order,
  (order) => {
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

async function download(file) {
  try {
    const { data, error } = await supabase.storage.from('orders').createSignedUrl(file.path, 2)
    if (error) throw error
    window.open(data.signedUrl, '_blank')
  } catch (error) {
    console.error('Error downloading image: ', error.message)
  }
}
</script>

<template>
  <Button link>
    <div class="flex">
      <label for="dropzone-file" class="flex">
        <div class="w-60 pb-10 mt-8">
          <div class="relative flex justify-between w-full">
            <div class="absolute top-2/4 h-0.5 w-full bg-gray-500"></div>
            <div
              v-for="stage in stages"
              class="relative z-8 grid w-8 h-8 font-bold text-white transition-all duration-300 bg-gray-500 rounded-full place-items-center cursor-pointer"
              onclick="modal.showModal()"
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
          <TextInput placeholder="Signed by" v-model="signedBy"></TextInput>
        </div>
        <div class="md:w-1/2 md:mb-0">
          <FileInput @file="(f) => (fileInfo = f)"></FileInput>
        </div>
      </div>

      <ModalAction>
        <form method="dialog">
          <Button @click="upload">Upload</Button>
        </form>
      </ModalAction>

      <div class="mt-6 mb-2">
        <table class="w-full text-left table-auto min-w-max">
          <thead>
            <tr>
              <th class="py-2 px-3">Type</th>
              <th class="py-2 px-3">Created by</th>
              <th class="py-2 px-3">Signed by</th>
              <th class="py-2 px-3">Created at</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="file in files"
              :key="file.path"
              @click="download(file)"
              class="cursor-pointer"
            >
              <td class="py-2 px-3">{{ file.file_type }}</td>
              <td class="py-2 px-3">{{ resolveAccount(file) }}</td>
              <td class="py-2 px-3">{{ file.signed_by }}</td>
              <td class="py-2 px-3">{{ useDateFormat(file.created_at, 'MMM DD, HH:mm') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button>Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
