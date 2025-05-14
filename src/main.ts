import './assets/main.css'

import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'

import { createPinia } from 'pinia'
// import { useAuthStore } from 'stores/auth'

// import { createHead } from '@unhead/vue/server

// const head = createHead()

const app = createApp(App)

app.use(createPinia())
app.provide('supabase', supabase)

app.use(router)
// app.use(head)

app.mount('#app')
