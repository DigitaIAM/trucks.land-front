<script setup lang="ts">
import { UseTimeAgo } from '@vueuse/components'

const props = defineProps<{
  orderId: number | null
}>()

const id = ref<number>()
const note = ref('')

const commentsStore = useCommentsStore()
const authStore = useAuthStore()
const usersStore = useUsersStore()

watch(
  () => props.orderId,
  (id) => {
    commentsStore.setOrderId(id)
  },
  { deep: true },
)

async function saveComments() {
  const user = authStore.user
  if (user == null) {
    throw 'authorize first'
  }

  const cUser = await usersStore.resolveUUID(user.id)
  if (cUser == null) {
    throw 'authorize first'
  }

  try {
    if (id.value == null) {
      commentsStore.create({
        document: props.orderId,
        user: cUser.id,
        note: note.value,
      } as CommentCreate)
    } else {
      commentsStore.update(id.value, {
        note: note.value,
      } as CommentUpdate)
    }
  } catch (e) {
    console.log('error', e)
  }
}
</script>

<template>
  <section class="relative">
    <div class="w-full max-w-7xl">
      <div class="w-full flex-col justify-start items-start gap-5 inline-flex">
        <h2 class="w-full font-normal tracking-wider">Comments</h2>
        <div
          class="w-full flex-row rounded-xl border-2 border-gray-500 justify-start items-start gap-4 inline-flex p-3"
        >
          <AvatarUser :username="authStore.account?.name ?? authStore.user?.email"></AvatarUser>
          <textarea
            v-model="note"
            name=""
            rows="1"
            class="w-full resize-none focus:outline-none placeholder-gray-400 text-gray-500 text-sm font-normal leading-7"
            placeholder="Add comment..."
          ></textarea>
          <button
            class="rounded-xl self-end text-gray-500 hover:text-blue-500"
            @click="saveComments()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
        <div class="w-full flex-col justify-start items-start gap-8 flex">
          <div
            v-for="comment in commentsStore.listing"
            :key="comment.id"
            class="w-full pb-6 inline-flex justify-start items-start gap-2.5"
          >
            <QueryAnd :id="comment.user" :store="usersStore" v-slot="slotProps">
              <AvatarUser :username="slotProps.user?.email"></AvatarUser>
            </QueryAnd>
            <div class="w-full flex-col justify-start items-start gap-3.5 inline-flex">
              <div class="w-full justify-start items-start flex-col flex gap-1">
                <div class="w-full justify-between items-start gap-1 inline-flex">
                  <Text class="text-gray-500 text-sm font-semibold leading-snug">
                    <QueryAndShow :id="comment.user" :store="usersStore" />
                  </Text>
                  <Label class="text-right text-gray-500 text-xs font-normal leading-5">
                    <UseTimeAgo v-slot="{ timeAgo }" :time="Date.parse(comment.created_at)">
                      {{ timeAgo }}
                    </UseTimeAgo>
                  </Label>
                </div>
                <Text class="text-gray-700">{{ comment.note }}</Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
