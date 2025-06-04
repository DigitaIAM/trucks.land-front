<script setup lang="ts"></script>

<template>
  <section class="relative">
    <div class="w-full max-w-7xl">
      <div class="w-full flex-col justify-start items-start gap-5 inline-flex">
        <h2 class="w-full text-xl font-bold leading-normal">Comments</h2>
        <div
          class="w-full flex-row rounded-xl border-2 border-gray-500 justify-start items-start gap-4 inline-flex p-3"
        >
          <img
            class="object-cover w-10 h-10 rounded-full"
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=faceare&facepad=3&w=688&h=688&q=100"
            alt="Mia John"
          />
          <textarea
            name=""
            rows="1"
            class="w-full resize-none focus:outline-none placeholder-gray-400 text-gray-500 text-sm font-normal leading-7"
            placeholder="Add comment..."
          ></textarea>
          <button class="rounded-xl self-end text-gray-500 hover:text-blue-500">
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
          <div class="w-full pb-6 inline-flex justify-start items-start gap-2.5">
            <img
              class="w-10 h-10 rounded-full object-cover"
              src="https://pagedone.io/asset/uploads/1710226776.png"
              alt="Mia Thompson image"
            />
            <div class="w-full flex-col justify-start items-start gap-3.5 inline-flex">
              <div class="w-full justify-start items-start flex-col flex gap-1">
                <div class="w-full justify-between items-start gap-1 inline-flex">
                  <h5 class="text-gray-500 text-sm font-semibold leading-snug">Mia Thompson</h5>
                  <span class="text-right text-gray-500 text-xs font-normal leading-5"
                    >12 hour ago</span
                  >
                </div>
                <h5 class="text-gray-700">William Reyes | +1 (347) 453-2244</h5>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
