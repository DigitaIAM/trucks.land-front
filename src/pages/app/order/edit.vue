<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
import StepperUploading from '@/components/order/StepperUploading.vue'
import Comments from '@/components/order/Comments.vue'
import StepperStates from '@/components/order/StepperStates.vue'

const props = defineProps<{
  id: number | null
}>()

const status = ref(null)
const number = ref('')
const dispatcher = ref<User>()
const posted_loads_id = ref('')
const refs = ref('')
const organization = ref<Organization>()
const broker = ref<Broker>()
const total_pieces = ref<number>()
const total_weight = ref<number>()
const total_miles = ref<number>()
const cost = ref<number>()

const usersStore = useUsersStore()
const organizationsStore = useOrganizationsStore()
const brokersStore = useBrokersStore()
const ordersStore = useOrdersStore()
const statusesStore = useStatusesStore()
const nextStatusStore = useStatusesNextStore()

const next = computed(() => {
  const ids = nextStatusStore.nextFor(status.value)
  return Array.from(ids.map((id) => statusesStore.resolve(id)))
})

async function saveOrder(status: Status) {
  try {
    await ordersStore.update({
      status: status.id,
      dispatcher: dispatcher.value?.id,
      posted_loads_id: posted_loads_id.value,
      refs: refs.value,
      organization: organization.value?.id,
      broker: broker.value?.id,
      total_pieces: total_pieces.value,
      total_weight: total_weight.value,
      total_miles: total_miles.value,
      cost: cost.value,
    } as OrderUpdate)
  } catch (e) {
    console.log('error', e)
  }
}
</script>

<template>
  <div class="flex flex-col-2">
    <div class="flex flex-col w-full h-full">
      <div class="flex space-x-3 mb-2 mt-6 w-full">
        <Button v-for="status in next" :key="status.id" @click="saveOrder(status)">
          {{ status.name }}
        </Button>
      </div>

      <div class="flex space-x-76 w-full">
        <Text semibold size="2xl">Order</Text>
        <div class="flex-1/60">
          <StepperUploading></StepperUploading>
        </div>
      </div>

      <div class="flex mb-6 mt-4 w-full">
        <form class="rounded-xl shadow w-[90vw] md:w-[50vw] p-4">
          <div class="flex space-x-3 mb-2 mt-6 w-full">
            <div class="md:w-1/4 md:mb-0">
              <TextInput disabled placeholder="Number" v-model="number" />
            </div>
            <div class="md:w-1/4 md:mb-0">
              <selector label="Broker" :v-model="dispatcher" :store="usersStore"></selector>
            </div>
            <div class="md:w-1/4 md:mb-0">
              <TextInput placeholder="Posted loads ID" v-model="posted_loads_id" />
            </div>
            <div class="md:w-1/4 md:mb-0">
              <TextInput placeholder="Refs" v-model="refs" />
            </div>
          </div>

          <div class="flex space-x-3 mb-2 mt-6 w-full">
            <div class="md:w-1/2 md:mb-0">
              <selector
                label="Organization"
                :v-model="organization"
                :store="organizationsStore"
              ></selector>
            </div>
            <div class="md:w-1/2 md:mb-0">
              <selector label="Broker" :v-model="broker" :store="brokersStore"></selector>
            </div>
          </div>

          <div class="flex space-x-3 mb-2 mt-6 w-full">
            <div class="md:w-1/5 md:mb-0">
              <TextInput placeholder="Total pieces" v-model="total_pieces" />
            </div>
            <div class="md:w-1/5 md:mb-0">
              <TextInput placeholder="Total weight" v-model="total_weight" />
            </div>
            <div class="md:w-1/5 md:mb-0">
              <TextInput placeholder="Total miles" v-model="total_miles" />
            </div>
            <div class="md:w-1/5 md:mb-0">
              <TextInput placeholder="Cost $" v-model="cost" />
            </div>
          </div>
        </form>
      </div>
    </div>

    <div class="w-full flex-col">
      <div class="px-10">
        <StepperStates></StepperStates>
      </div>
      <div class="w-full">
        <div class="px-10">
          <Comments></Comments>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
