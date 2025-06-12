import { acceptHMRUpdate, defineStore } from 'pinia'

export interface Comment extends CommentCreate {
  id: number
  created_at: Date
}

export interface CommentCreate {
  user: number
  note: string
}

export interface CommentUpdate {
  user?: number
  note?: string
}

export const useCommentsStore = defineStore('comment', () => {
  const mapping = ref(new Map<number, Comment>())

  const orderId = ref(null)
  const listing = ref([])

  const changes = supabase
    .channel('table-db-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
      },
      (payload) => {
        console.log(payload)
        if (payload.eventType == 'INSERT') {
          listing.value.unshift(payload.new as Comment)
        }
      },
    )
    .subscribe()

  async function setOrderId(id: number) {
    console.log('setOrderId', id)
    orderId.value = id

    const response = await supabase
      .from('comments')
      .select()
      .eq('document', id)
      .order('created_at', { ascending: false })

    console.log('comments', response)
    if (response.status == 200) {
      response.data?.forEach((json) => {
        const comment = json as Comment
        listing.value.push(comment)
      })
    }
  }

  function create(comment: CommentCreate) {
    console.log('create comment', comment)
    supabase
      .from('comments')
      .insert(comment)
      .select()
      .then((response) => {
        console.log('comments', response)
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const comment = json as Comment
            mapping.value.set(comment.id, comment)
          })
        }
      })
  }

  function update(id: number, comment: CommentUpdate) {
    supabase
      .from('comments')
      .update(comment)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const comment = json as Comment
            mapping.value.set(comment.id, comment)
          })
        }
      })
  }

  async function resolve(id: number) {
    const v = mapping.value.get(id)
    if (v) {
      return v
    }

    const response = await supabase.from('comments').select().eq('id', id)

    const map = new Map<number, Comment>()
    response.data?.forEach((json) => {
      const comment = json as Comment
      map.set(comment.id, comment)
      mapping.value.set(comment.id, comment)
    })

    return map.get(id)
  }

  return { setOrderId, listing, create, update, resolve }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCommentsStore, import.meta.hot))
}
