<script setup lang="ts">
const cols = [
  {
    label: 'Name',
    value: (v) => v.name,
    size: 300,
  },
  {
    label: 'Phone',
    value: (v) => v.phone,
    size: 120,
  },
  {
    label: 'Email',
    value: (v) => v.email,
    size: 300,
  },
]

const owners = [
  {
    name: 'Guevara Ground LLC',
    phone: '(256) 273-7299',
    email: 'POD@FLSTransport.com',
  },
  {
    name: 'Atlantic Expedited LLC',
    phone: '(678) 273-7299',
    email: 'dispatch@pegaslogistics.com',
  },
  {
    name: 'Guevara Ground LLC',
    phone: '(256) 273-7299',
    email: 'POD@FLSTransport.com',
  },
  {
    name: 'Atlantic Expedited LLC',
    phone: '(678) 273-7299',
    email: 'dispatch@pegaslogistics.com',
  },
  {
    name: 'Guevara Ground LLC',
    phone: '(256) 273-7299',
    email: 'POD@FLSTransport.com',
  },
  {
    name: 'Atlantic Expedited LLC',
    phone: '(678) 273-7299',
    email: 'dispatch@pegaslogistics.com',
  },
  {
    name: 'Guevara Ground LLC',
    phone: '(256) 273-7299',
    email: 'POD@FLSTransport.com',
  },
  {
    name: 'Atlantic Expedited LLC',
    phone: '(678) 273-7299',
    email: 'dispatch@pegaslogistics.com',
  },
  {
    name: 'Guevara Ground LLC',
    phone: '(256) 273-7299',
    email: 'POD@FLSTransport.com',
  },
  {
    name: 'Atlantic Expedited LLC',
    phone: '(678) 273-7299',
    email: 'dispatch@pegaslogistics.com',
  },
  {
    name: 'Guevara Ground LLC',
    phone: '(256) 273-7299',
    email: 'POD@FLSTransport.com',
  },
  {
    name: 'Atlantic Expedited LLC',
    phone: '(678) 273-7299',
    email: 'dispatch@pegaslogistics.com',
  },
  {
    name: 'Guevara Ground LLC',
    phone: '(256) 273-7299',
    email: 'POD@FLSTransport.com',
  },
  {
    name: 'Atlantic Expedited LLC',
    phone: '(678) 273-7299',
    email: 'dispatch@pegaslogistics.com',
  },
]
</script>

<template>
  <div class="text-black bg-white rounded-xl shadow-xl bg-clip-border">
    <table-of-statutes class="w-full text-left table-auto min-w-max">
      <thead>
        <tr>
          <th
            v-for="col in cols"
            class="p-4 border-b border-b-gray-300"
            :style="{ width: col.size + 'px' }"
          >
            <p class="block text-sm antialiasing font-bold leading-none text-gray-900 opacity-70">
              {{ col.label }}
            </p>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="owner in owners">
          <td
            v-for="col in cols"
            class="py-3 px-4 border-b border-b-gray-300"
            :style="{ width: col.size + 'px' }"
          >
            <p
              class="block text-sm antialiasing font-normal leading-normal text-gray-900 truncate"
              :style="{ width: col.size + 'px' }"
            >
              {{ col.value(owner) }}
            </p>
          </td>
        </tr>
      </tbody>
    </table-of-statutes>

    <div class="flex items-center justify-between p-4">
      <nav aria-label="Page navigation">
        <ul class="inline-flex space-x-2">
          <li>
            <button
              class="flex items-center justify-center w-8 h-8 text-[#313EC6] transition-colors duration-150 rounded-full focus:shadow-outline hover:bg-blue-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="size-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                  clip-rule="evenodd"
                  fill-rule="evenodd"
                />
              </svg>
            </button>
          </li>
          <li>
            <button
              class="w-8 h-8 text-white transition-colors duration-150 bg-[#313EC6] border border-r-0 border-[#313EC6] rounded-full focus:shadow-outline"
            >
              1
            </button>
          </li>
          <li>
            <button
              class="w-8 h-8 text-[#313EC6] transition-colors duration-150 rounded-full focus:shadow-outline hover:bg-blue-100"
            >
              2
            </button>
          </li>
          <li>
            <button
              class="w-8 h-8 text-[#313EC6] transition-colors duration-150 rounded-full focus:shadow-outline hover:bg-blue-100"
            >
              3
            </button>
          </li>
          <li>
            <button
              class="flex items-center justify-center w-8 h-8 text-[#313EC6] transition-colors duration-150 rounded-full focus:shadow-outline hover:bg-blue-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="size-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  clip-rule="evenodd"
                  fill-rule="evenodd"
                />
              </svg>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<style scoped></style>
