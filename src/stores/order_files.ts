import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Order } from '@/stores/orders.ts'

export interface FileRecord extends FileRecordCreate {
  id: number
  created_at: string
}

export interface FileRecordCreate {
  document: number
  path: string
  file_type: string
  signed_by: string
  created_by: number
}

export interface FileRecordUpdate {
  is_deleted?: boolean
}

export const useFilesStore = defineStore('file', () => {
  const listing = ref<Array<FileRecord>>([])

  async function loading(orderId: number | null) {
    if (orderId) {
      const response = await supabase.from('order_files').select().eq('document', orderId)

      if (response.status == 200) {
        const list: Array<FileRecord> = []

        response.data?.forEach((json) => {
          const file = json as FileRecord
          list.push(file)
        })

        listing.value = list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      listing.value = [] as Array<FileRecord>
    }
  }

  async function create(file: FileRecordCreate) {
    const response = await supabase.from('order_files').insert(file).select() // .throwOnError()

    if (response.status == 201 && response.data?.length == 1) {
      const record = response.data[0] as FileRecord

      const list = Array.from(listing.value)

      list.push(record)

      listing.value = list
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  return { listing, loading, create }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFilesStore, import.meta.hot))
}
