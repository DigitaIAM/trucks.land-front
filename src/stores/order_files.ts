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
  const mapping = ref(new Map<number, FileRecord>())

  async function listing(orderId: number | null) {
    if (orderId) {
      const response = await supabase.from('order_files').select().eq('document', orderId)

      if (response.status == 200) {
        const list = <FileRecord>[]

        response.data?.forEach((json) => {
          const file = json as FileRecord
          list.push(file)
        })

        return list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      return <FileRecord>[]
    }
  }

  async function create(file: FileRecordCreate) {
    const response = await supabase.from('order_files').insert(file).select() // .throwOnError()


    if (response.status == 201) {
      response.data?.forEach((json) => {})
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  function update(id: number, file: FileRecordUpdate) {
    supabase
      .from('order_files')
      .update(file)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            // const event = json as Event
            // mapping.value.set(event.id, event)
          })
        }
      })
  }

  return { listing, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFilesStore, import.meta.hot))
}
