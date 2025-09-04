import { acceptHMRUpdate, defineStore } from 'pinia'

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

  async function request(orderId: number | null): Promise<Array<FileRecord>> {
    if (orderId) {
      const response = await supabase.from('order_files').select().eq('document', orderId)

      if (response.status == 200) {
        const list: Array<FileRecord> = []

        response.data?.forEach((json) => {
          const file = json as FileRecord
          list.push(file)
        })

        return list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      return [] as Array<FileRecord>
    }
  }

  async function loading(orderId: number | null) {
    listing.value = await request(orderId)
  }

  async function create(file: FileRecordCreate): Promise<FileRecord> {
    const response = await supabase.from('order_files').insert(file).select() // .throwOnError()

    if (response.status == 201 && response.data?.length == 1) {
      const record = response.data[0] as FileRecord

      const list = Array.from(listing.value)

      list.push(record)

      listing.value = list

      return record
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  return { request, loading, listing, create }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFilesStore, import.meta.hot))
}
