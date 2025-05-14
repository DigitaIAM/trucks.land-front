import { ref } from 'vue'

export function useInitializeStore(apiCall) {
  const initialized = ref(false)
  const loading = ref(false)

  ;(async function () {
    loading.value = true
    try {
      await apiCall()
      initialized.value = true
    } finally {
      loading.value = false
    }
  })()

  return { initialized, loading }
}
