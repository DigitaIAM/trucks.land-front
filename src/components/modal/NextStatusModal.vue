<script setup lang="ts">
const props = defineProps<{
  edit: Status | null
}>()

watch(
  () => props.edit,
  (status) => {
    selectedStatus.value = statusesNext.nextFor(status)
    next_status.showModal()
  },
  { deep: true },
)

const selectedStatus = ref<number[]>([])
const statuses = useStatusesStore()

const statusesNext = useStatusesNextStore()

function saveNextStatus() {
  statusesNext.update(props.edit!, selectedStatus.value)
}
</script>

<template>
  <Modal id="next_status">
    <ModalBox class="w-2/5 min-w-[20%] max-w-[20%]">
      <Text size="2xl">Next status</Text>
      <div
        v-for="(status, index) of statuses.listing"
        :key="index"
        class="flex items-center gap-2 py-2 mt-2"
      >
        <Checkbox
          :id="status.id"
          v-model="selectedStatus"
          :inputId="'status.id-${index}'"
          name="status"
          :value="status.id"
        />
        <label :for="'' + status.id">{{ status.name }}</label>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button @click="saveNextStatus()">Save</Button>
          <Button class="ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
