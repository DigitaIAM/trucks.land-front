import { createFetch } from '@vueuse/core'

export async function sendEmail(token: string, body: object) {
  const myFetch = createFetch({
    baseUrl: 'https://supabase.trucks.land/',
    // baseUrl: 'https://api.zeptomail.com/',
    // baseUrl: 'http://localhost:5173/',
    options: {
      async beforeFetch({ options }) {
        options.headers = {
          ...options.headers,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: token,
        }
        return { options }
      },
    },
    fetchOptions: { mode: 'cors' },
  })

  const { isFetching, error, data } = await myFetch('/zeptomail/v1.1/email').post(body)

  console.log('isFetching', isFetching)
  console.log('error', error)
  console.log('data', data)
}
