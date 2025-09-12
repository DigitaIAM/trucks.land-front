<script setup lang="ts">
import * as tus from 'tus-js-client'
import { generateBI } from '@/utils/invoice_broker.ts'
import moment from 'moment/moment'

const props = defineProps<{
  order: Order | null
}>()

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const usersStore = useUsersStore()
const filesStore = useFilesStore()
const organizationsStore = useOrganizationsStore()
const brokersStore = useBrokersStore()

const stages = ref([
  { label: 'RC', check: false },
  { label: 'BOL', check: false },
  { label: 'POD', check: false },
  { label: 'BI', check: false },
  { label: 'FI', check: false },
])

const uploadProgress = ref<number | null>(null)

const isReadOnly = computed(() => uploadProgress.value != null)

const fileType = ref('RC')
const fileInfo = ref<File | null>(null)
const signedBy = ref('')

async function uploadFile(
  bucketName: string,
  fileName: string,
  file: File | Blob,
  onProgress: (percentage: number) => void,
) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      // endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
      endpoint: `${supabase.supabaseUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'x-upsert': 'true', // optionally set upsert to true to overwrite existing files
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true, // Important if you want to allow re-uploading the same file https://github.com/tus/tus-js-client/blob/main/docs/api.md#removefingerprintonsuccess
      metadata: {
        bucketName: bucketName,
        objectName: fileName,
        // contentType: contentType,
        cacheControl: '3600',
        metadata: JSON.stringify({
          // custom metadata passed to the user_metadata column
          yourCustomMetadata: true,
        }),
      },
      chunkSize: 6 * 1024 * 1024, // NOTE: it must be set to 6MB (for now) do not change it
      onError: function (error) {
        console.log('Failed because: ' + error)
        reject(error)
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = (bytesUploaded / bytesTotal) * 100
        // const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
        console.log(bytesUploaded, bytesTotal, percentage + '%')
        onProgress(percentage)
      },
      onSuccess: function () {
        console.log('Download %s from %s', upload.file.name, upload.url)
        resolve()
      },
    })
    // Check if there are any previous uploads to continue.
    return upload.findPreviousUploads().then(function (previousUploads) {
      // Found previous uploads so we select the first one.
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0])
      }
      // Start the upload
      upload.start()
    })
  })
}

async function upload() {
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

      await uploadFile('orders', path, file, (percentage) => (uploadProgress.value = percentage))
      // const result = await supabase.storage.from('orders').upload(path, file)

      await filesStore.create({
        document: order.id,
        file_type: fileType.value,
        signed_by: signedBy.value,
        path: path,
        created_by: cUser.id,
      })

      const sl = stages.value
      for (const idx in sl) {
        if (fileType.value == sl[idx].label) {
          sl[idx].check = true
          break
        }
      }

      uploadProgress.value = null
    } else {
      throw 'no order creation date'
    }
  } else {
    throw 'one file expected'
  }
}

watch(
  () => props.order,
  (order) => {
    resetAndShow(order?.id)
  },
  { deep: true },
)

resetAndShow(props.order?.id)

async function resetAndShow(id: number | null) {
  await filesStore.loading(id)
}

function isPresent(file_type: string) {
  const list = filesStore.listing
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
    const { data, error } = await supabase.storage.from('orders').createSignedUrl(file.path, 15)
    if (error) throw error
    window.open(data.signedUrl, '_blank')
  } catch (error) {
    console.error('Error downloading image: ', error.message)
  }
}

function close() {
  modal.close()
  emit('close')
}

async function createAndPdfBI() {
  const ts = moment().subtract(3, 'days')
  const currentWeek = ref(ts.isoWeek())

  const order = props.order
  const user = authStore.user
  if (order && user) {
    const cUser = await usersStore.resolveUUID(user.id)

    const org = await organizationsStore.resolve(order.organization)
    const broker = await brokersStore.resolve(order.broker)

    if (org && broker) {
      const createAt = order.created_at
      const path =
        createAt.substring(0, 4) +
        '/' +
        createAt.substring(5, 7) +
        '/' +
        createAt.substring(8, 10) +
        '/' +
        order.id +
        '/' +
        'BI_' +
        org.code2 +
        '-' +
        currentWeek.value +
        '-' +
        order.id +
        '.pdf'

      if (cUser == null) {
        throw 'authorize first'
      }

      const record = await filesStore.create({
        document: order.id,
        file_type: 'BI',
        signed_by: '',
        path: path,
        created_by: cUser.id,
      })
      console.log('createAndPdfBI', path)

      const blob = await generateBI(order, org, broker, record)

      await uploadFile('orders', path, blob, (percentage) => (uploadProgress.value = percentage))
      uploadProgress.value = null

      await download(record)
    }
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
      <div class="flex space-x-4 mb-6 w-full">
        <Text size="2xl" class="mr-4">Files</Text>
        <Button
          :disabled="isReadOnly"
          sm
          class="mr-4 mb-2"
          v-for="ft in ['RC', 'BOL', 'POD']"
          :key="ft"
          :class="{ 'bg-accent': ft == fileType }"
          @click="fileType = ft"
        >
          {{ ft }}
        </Button>
        <div class="ml-32">
          <Button class="btn-soft font-light tracking-wider" @click="close">Close</Button>
        </div>
      </div>
      <div class="flex space-x-4 mb-6 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <TextInput :disabled="isReadOnly" placeholder="Signed by" v-model="signedBy"></TextInput>
        </div>
        <div class="md:w-1/2 md:mb-0">
          <FileInput :disabled="isReadOnly" @file="(f) => (fileInfo = f)"></FileInput>
        </div>
      </div>

      <ModalAction>
        <Progress v-if="uploadProgress" :value="uploadProgress" :max="100" />
        <Button v-else class="btn-soft font-light tracking-wider" @click="upload">Upload</Button>
      </ModalAction>

      <div class="mt-6">
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
              v-for="file in filesStore.listing"
              :key="file.path"
              @click="download(file)"
              class="cursor-pointer"
            >
              <td class="py-2 px-3">{{ file.file_type }}</td>
              <td class="py-2 px-3">
                <QueryAndShow :id="file.created_by" :store="usersStore" />
              </td>
              <td class="py-2 px-3">{{ file.signed_by }}</td>
              <td class="py-2 px-3">{{ useDateFormat(file.created_at, 'MMM DD, HH:mm') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="grid grid-cols-1 mb-2 mt-8 w-full">
        <Text size="xl" class="mt-6 mb-4">Invoice for</Text>
        <Button class="flex btn-soft font-light tracking-wider mb-6" @click="createAndPdfBI">
          broker by
          <QueryAndShow name="email" :id="order?.broker" :store="brokersStore"></QueryAndShow>
        </Button>
        <Button class="btn-soft font-light tracking-wider">factoring company</Button>
      </div>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
