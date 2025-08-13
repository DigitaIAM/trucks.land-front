import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Session } from '@supabase/auth-js/dist/module/lib/types'
import type { RouteLocationNormalized } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const promise = ref() as Ref<Promise<any>>

  const session = ref<Session | null>(null)
  const user = computed(() => session.value?.user)
  const account = computedAsync(async () => {
    const uuid = user.value?.id
    if (uuid) {
      return await useUsersStore().resolveUUID(uuid)
    } else {
      return null
    }
  }, null)

  const org = ref<Organization | null>(null)
  const oid = computed<int | null>(() => org.value?.id)

  const isInitDone = ref(false)

  const loginRedirect = ref<RouteLocationNormalized | null>(null)

  // error
  const lastError = ref<Error | null>(null)
  const clearError = () => (lastError.value = null)

  // async function signInWithEmail(email: string, password: string) {
  const signInWithEmail = async (email: string, password: string) => {
    // console.log('signInWithEmail', email, password)
    promise.value = supabase.auth
      .signInWithPassword({
        email: email,
        password: password,
      })
      .then(({ data, error }) => {
        // console.log('signInWithEmail data', data)
        // console.log('signInWithEmail error', error)

        lastError.value = error

        return { data, error }
      })
      .catch((error: any) => {
        lastError.value = error
        // return onInitError(error)
        return error
      })

    return promise.value
  }

  promise.value = supabase.auth.getSession().then(({ data }) => {
    // console.log('supabase.auth.getSession()', data)
    isInitDone.value = true
    session.value = data.session
  })
  supabase.auth.onAuthStateChange((_, _session) => {
    // console.log('supabase.auth.onAuthStateChange', _session)
    session.value = _session
  })

  const logout = async () => {
    return supabase.auth
      .signOut()
      .then((response: any) => {
        console.log('logout success', response)
        session.value = null
        // userId.value = null
        // isAuthenticated.value = false
        return response
      })
      .catch((error: any) => {
        console.log('logout error', error)
        lastError.value = error
        // return onLogoutError(error)
        return error
      })
  }

  return {
    user,
    account,
    oid,
    org,
    isInitDone,
    signInWithEmail,
    loginRedirect,
    getPromise: () => promise.value,
    logout,
    lastError,
    clearError,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
