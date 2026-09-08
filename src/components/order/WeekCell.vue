<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    order: Order
    canEdit?: boolean
  }>(),
  {
    canEdit: false,
  },
)

const emit = defineEmits<{
  save: [week: number, year: number]
}>()

const editing = ref(false)
const week = ref<number | null>(null)
const year = ref<number | null>(null)
const weekInput = ref<HTMLInputElement | null>(null)

function start() {
  if (!props.canEdit || editing.value) return
  week.value = props.order.week ?? null
  year.value = props.order.year ?? null
  editing.value = true
  nextTick(() => weekInput.value?.focus())
}

function onCellClick(e: MouseEvent) {
  if (!props.canEdit || editing.value) return
  e.stopPropagation()
  start()
}

function onWeekInput(e: Event) {
  const parsed = parseInt((e.target as HTMLInputElement).value, 10)
  week.value = Number.isNaN(parsed) ? null : parsed
}

function onYearInput(e: Event) {
  const parsed = parseInt((e.target as HTMLInputElement).value, 10)
  year.value = Number.isNaN(parsed) ? null : parsed
}

async function commit() {
  if (!editing.value) return
  editing.value = false

  const w = week.value
  const y = year.value
  if (w == null || y == null) return
  if (w < 1 || w > 53) return
  if (y < 2000 || y > 2100) return
  if (w === props.order.week && y === props.order.year) return

  emit('save', w, y)
}

function cancel() {
  if (!editing.value) return
  editing.value = false
}
</script>

<template>
  <span v-if="editing" class="inline-flex items-center gap-1" @click.stop @keydown.esc="cancel">
    <input
      ref="weekInput"
      type="number"
      class="input input-xs input-bordered w-12 px-1 text-center font-light"
      :value="week ?? ''"
      min="1"
      max="53"
      @input="onWeekInput"
      @blur="commit"
      @keydown.enter.prevent="commit"
    />
    <span class="font-thin text-gray-400 dark:text-gray-500">/</span>
    <input
      type="number"
      class="input input-xs input-bordered w-16 px-1 text-center font-light"
      :value="year ?? ''"
      min="2000"
      max="2100"
      @input="onYearInput"
      @blur="commit"
      @keydown.enter.prevent="commit"
    />
  </span>
  <p
    v-else
    class="block antialiasing tracking-wide font-light leading-normal truncate cursor-pointer select-none"
    :title="canEdit ? 'Edit week / year' : undefined"
    :class="{ 'hover:text-primary hover:underline': canEdit }"
    @click="onCellClick"
  >
    {{ order.week }}
  </p>
</template>

<style scoped></style>
