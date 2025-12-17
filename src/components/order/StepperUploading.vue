<script setup lang="ts">
import * as tus from 'tus-js-client'
import { generateBI } from '@/utils/invoice_broker.ts'
import moment from 'moment/moment'
import { generateFI } from '@/utils/invoice_factoring_pdf.ts'
import { generateRC } from '@/utils/createRC.ts'
import { openInNewTab } from '@/utils/pdf-helper.ts'

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

const currentAccount = computedAsync(async () => {
  return await usersStore.resolveUUID(authStore.org?.id, authStore.user?.id)
}, null)

const isDisabled = computedAsync(async () => {
  const account = currentAccount.value
  if (account && account.access) {
    for (const record of account.access) {
      if (record.is_admin || record.is_accountant) {
        return false
      } else if (record.is_dispatcher || record.is_tracking) {
        const id = created_by.value?.id
        if (id && id === created_by.value?.id) {
          return false
        }
      }
    }
  }
  return true
}, true)

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
        kind: fileType.value,
        signed_by: signedBy.value,
        path: path,
        is_deleted: false,
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
    if (file.kind == file_type && file.is_deleted == false) {
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
  if (order) {
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
        order.number +
        '.pdf'

      const record = await filesStore.create({
        document: order.id,
        kind: 'BI',
        signed_by: '',
        path: path,
        is_deleted: false,
      })
      console.log('createAndPdfBI', path)

      const blob = await generateBI(order, org, broker, record)

      await uploadFile('orders', path, blob, (percentage) => (uploadProgress.value = percentage))
      uploadProgress.value = null

      await download(record)
    }
  }
}

async function createAndPdfFI() {
  const ts = moment().subtract(3, 'days')
  const currentWeek = ref(ts.isoWeek())

  const order = props.order

  if (order) {
    const org = await organizationsStore.resolve(order.organization)

    if (org) {
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
        'FI_' +
        org.code2 +
        '-' +
        currentWeek.value +
        '-' +
        order.number +
        '.pdf'

      const record = await filesStore.create({
        document: order.id,
        kind: 'FI',
        signed_by: '',
        path: path,
        is_deleted: false,
      })

      const blob = await generateFI(order, org)

      await uploadFile('orders', path, blob, (percentage) => (uploadProgress.value = percentage))
      uploadProgress.value = null

      await download(record)
    }
  }
}

async function createRC() {
  const order = props.order
  if (order == null) {
    throw 'missing order'
  }

  const org = await organizationsStore.resolve(order.organization)
  if (org == null) {
    throw 'missing organization'
  }

  const token = await useAccessTokenStore().getTokenZoho(org.id)
  if (token == null) {
    throw 'missing token'
  }

  await generateRC(order, org)
}
</script>

<template>
  <div class="flex-col mt-15">
    <ol class="relative text-gray-500 border-l-2 border-gray-500">
      <li class="mb-8 ms-6" v-for="stage in stages" :key="stage.label">
        <span class="cursor-pointer" onclick="modal.showModal()">
          <span
            class="absolute flex items-center justify-center w-8 h-8 bg-gray-500 rounded-full -start-4"
          >
            <svg
              v-if="isPresent(stage.label)"
              class="w-5 h-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </span>
          <Text>{{ stage.label }}</Text>
        </span>
      </li>
    </ol>
  </div>

  <Modal id="modal">
    <ModalBox class="max-w-[calc(50vw)]">
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
        <div class="ml-auto">
          <Button
            class="btn-soft font-light tracking-wider"
            @click="createRC"
            :disabled="isDisabled"
            >Create RC
          </Button>
        </div>
      </div>
      <div class="flex space-x-4 mb-6 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <TextInput :disabled="isReadOnly" placeholder="Signed by" v-model="signedBy"></TextInput>
        </div>
        <div class="md:w-1/2 md:mb-0">
          <FileInput :disabled="isReadOnly" @file="(f) => (fileInfo = f)"></FileInput>
        </div>
        <Progress v-if="uploadProgress" :value="uploadProgress" :max="100" />
        <Button v-else class="btn-soft font-light tracking-wider" @click="upload">Upload</Button>
      </div>

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
              :class="{
                'text-gray-700': file.is_deleted,
                'marked-for-deletion': file.is_deleted,
                'cursor-pointer': true,
              }"
            >
              <td class="py-2 px-3">{{ file.kind }}</td>
              <td class="py-2 px-3">
                <QueryAndShow :id="file.created_by" :store="usersStore" />
              </td>
              <td class="py-2 px-3">{{ file.signed_by }}</td>
              <td class="py-2 px-3">{{ useDateFormat(file.created_at, 'MMM DD, HH:mm') }}</td>
              <td>
                <Button
                  ghost
                  sm
                  @click.stop="filesStore.update(file.id, { is_deleted: !file.is_deleted })"
                  >X
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="grid grid-cols-1 mb-2 mt-8 w-full">
        <Text size="xl" class="mt-6 mb-4">Invoice for</Text>
        <Button
          class="flex btn-soft font-light tracking-wider mb-6"
          @click="createAndPdfBI"
          :disabled="isDisabled"
        >
          broker to
          <QueryAndShow name="email" :id="order?.broker" :store="brokersStore"></QueryAndShow>
        </Button>
        <Button
          class="btn-soft font-light tracking-wider"
          @click="createAndPdfFI"
          :disabled="isDisabled"
          >factoring company
        </Button>
      </div>
      <ModalAction>
        <Button class="btn-soft font-light tracking-wider" @click="close">Close</Button>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped>
.marked-for-deletion {
  text-decoration: line-through;
}
</style>
