<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import SideBar from '@/components/windowElements/SideBar.vue'
import TopBar from '@/components/windowElements/TopBar.vue'

// import { useHead } from '@unhead/vue'
//
// useHead({
//   title: 'Feathers-Pinia + Vite',
//   meta: [
//     {
//       name: 'description',
//       content: 'Feathers-Pinia + Vue + Vite for the perfect Single Page App experience',
//     },
//   ],
//   link: [],
// })

// import { onMounted, ref } from 'vue'
// import Account from 'components/Account.vue'
// import Auth from 'components/Auth.vue'

// const session = ref()
// onMounted(() => {
//   const supabase = useSupabase()
//   supabase.auth.getSession().then(({ data }) => {
//     session.value = data.session
//   })
//   supabase.auth.onAuthStateChange((_, _session) => {
//     session.value = _session
//   })
// })

const authStore = useAuthStore()
</script>

<template>
  <RouterView v-if="authStore.isInitDone" />
  <Loading v-else />

  <!--  <div class="container" style="padding: 50px 0 100px 0">-->
  <!--    <Account v-if="session" :session="session" />-->
  <!--    <Auth v-else />-->
  <!--  </div>-->

  <!--  <Loading v-if="!authStore.isInitDone"> Loading</Loading>-->
  <!--  <RouterView v-else />-->

  <!--  <TopBar></TopBar>-->

  <!--  <SideBar></SideBar>-->

  <!--  <div class="content ml-12 transform ease-in-out duration-500 pt-20 px-2 md:px-5 pb-4">-->
  <!--    <RouterView />-->
  <!--  </div>-->
</template>

<style scoped></style>
