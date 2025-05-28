import './assets/main.css'

import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'

import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

import { createPinia } from 'pinia'
// import { useAuthStore } from 'stores/auth'

// import { createHead } from '@unhead/vue/server

import 'vue-color/style.css'

// const head = createHead()

const app = createApp(App)

app.use(createPinia())
app.provide('supabase', supabase)

app.use(router)
// app.use(head)

app.component('VueDatePicker', VueDatePicker)

app.mount('#app')
