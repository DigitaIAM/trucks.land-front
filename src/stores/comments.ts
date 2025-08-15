import { acceptHMRUpdate, defineStore } from 'pinia'
import { debouncePromise } from '@/utils/cache.ts'

export interface Comment extends CommentCreate {
  id: number
  created_at: Date
}

export interface CommentCreate {
  document: number
  user: number
  note: string
}

export interface CommentUpdate {
  note?: string
}

export const useCommentsStore = defineStore('comment', () => {
  const mapping = ref(new Map<number, Comment>())

  const orderId = ref<number | null>(null)
  const listing = ref<Array<Comment>>([])

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
        if (payload.eventType == 'INSERT') {
          listing.value.unshift(payload.new as Comment)
        }
      },
    )
    .subscribe()

  async function setOrderId(id: number) {
    orderId.value = id
    listing.value = []

    const response = await supabase
      .from('comments')
      .select()
      .eq('document', id)
      .order('created_at', { ascending: false })

    if (response.status == 200) {
      response.data?.forEach((json) => {
        const comment = json as Comment
        listing.value.push(comment)
      })
    }
  }

  async function _fetching(ids: Array<number>): Promise<Array<Comment>> {
    const response = await supabase.from('comment_last_in_document').select().in('document', ids)

    if (response.status == 200) {
      const list: Array<Comment> = []
      response.data?.forEach((json) => {
        const comment = json as Comment
        list.push(comment)
      })
      return list
    }
    return []
  }

  const _resolver = debouncePromise<Comment>(_fetching, 10)

  async function commentsForOrder(orderId: number): Promise<Array<Comment>> {
    const list = await _resolver(orderId)
    for (const comment of list) {
      if (comment.document === orderId) {
        return [comment]
      }
    }

    return []
  }

  function create(comment: CommentCreate) {
    supabase
      .from('comments')
      .insert(comment)
      .select()
      .then((response) => {
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

  return { setOrderId, listing, create, update, resolve, commentsForOrder }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCommentsStore, import.meta.hot))
}
