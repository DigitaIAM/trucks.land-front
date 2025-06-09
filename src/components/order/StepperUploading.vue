<script setup lang="ts">
const props = defineProps<{
  orderId: number | null
}>()

const stages = ref([
  { label: 'RC', check: false },
  { label: 'BOL', check: false },
  { label: 'POD', check: false },
])

const fileType = ref('RC')
const files = ref([])

function upload() {
  console.log('upload happens here', fileType.value, files.value)
  stages.value[2].check = true
}
</script>

<template>
  <Button link onclick="modal.showModal()">
    <div class="flex">
      <label for="dropzone-file" class="flex">
        <div class="w-40 pb-10">
          <div class="relative flex justify-between w-full">
            <div class="absolute top-2/4 h-0.5 w-full bg-gray-500"></div>
            <div
              v-for="stage in stages"
              class="relative z-8 grid w-8 h-8 font-bold text-white transition-all duration-300 bg-gray-500 rounded-full place-items-center"
            >
              <svg
                v-if="stage.check"
                class="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <div class="absolute -bottom-[1.5rem] w-max text-center">
                <h6
                  class="block text-base font-semibold leading-relaxed tracking-normal text-gray-400"
                >
                  {{ stage.label }}
                </h6>
              </div>
            </div>
          </div>
        </div>
      </label>
    </div>
  </Button>

  <Modal id="modal">
    <ModalBox>
      <Text size="2xl" class="mr-4">Files</Text>
      <Button
        sm
        class="mr-4 mb-2"
        v-for="ft in ['RC', 'BOL', 'POD']"
        :key="ft"
        :class="{ 'bg-accent': ft == fileType }"
        @click="fileType = ft"
      >
        {{ ft }}
      </Button>

      <div class="flex space-x-4 mb-6 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <TextInput placeholder="signed by"></TextInput>
        </div>
        <div class="md:w-1/2 md:mb-0">
          <FileInput @files="(list) => (files.value = list)"></FileInput>
        </div>
      </div>

      <ModalAction>
        <form method="dialog">
          <Button class="mr-4" @click="upload">Upload</Button>
          <Button>Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
  <!--      <input-->
  <!--        id="dropzone-file"-->
  <!--        type="file"-->
  <!--        class="hidden"-->
  <!--        @input="$emit('files', ($event.target as any).value)"-->
  <!--      />-->
  <!--    </label>-->
  <!--  </div>-->
</template>

<style scoped></style>
