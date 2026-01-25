<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
defineOptions({
  __loaders: [useOrgData],
})

const cOrg = useOrgData()

const props = defineProps<{
  edit: Insurance | null
}>()

const id = ref<number | null>(null)
const created_by = ref<User>()
const policy_number = ref<string>('')
const end_date = ref(new Date() as Date | undefined)
const start_date = ref(new Date() as Date | undefined)

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (insurance) => {
    resetAndShow(insurance)
  },
  { deep: true },
)

const insurancesStore = useInsuranceStore()
const authStore = useAuthStore()

async function resetAndShow(insurance: Insurance | null) {
  const account = await authStore.currentAccount()

  id.value = insurance?.id
  created_by.value = insurance ? { id: insurance?.created_by } : account ? { id: account.id } : null
  policy_number.value = insurance?.policy_number
  end_date.value = insurance?.end_date
  start_date.value = insurance?.start_date

  create_insurance.showModal()
}

function openNewWindow(insurance: Insurance, org: Organization) {
  window.open('/' + org.code3.toLowerCase() + insurance.id, '_blank')
}

async function saveAndEdit() {
  try {
    const org = cOrg.data.value
    const insurance = await insurancesStore.create({
      created_by: created_by.value?.id,
      policy_number: policy_number.value,
      start_date: start_date.value,
      end_date: end_date.value,
    } as InsuranceCreate)

    create_insurance.close()

    openNewWindow(insurance, org)
  } catch (e) {
    console.log('error', e)
  }
  emit('closed')
}

function close() {
  create_insurance.close()
  emit('closed')
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Insurances</Text>
    <!--    <SearchVue :store=""></SearchVue>-->
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="create_insurance">
    <ModalBox class="max-w-[calc(50vw)]">
      <div class="mb-4">
        <Text size="2xl">Insurance</Text>
      </div>
      <Label>Policy number</Label>
      <TextInput class="w-full mb-4" v-model="policy_number" />

      <div class="flex space-x-3 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Policy EFF</Label>
          <date-picker teleport-center v-model="start_date" type="date" />
        </div>

        <div class="md:w-1/2 md:mb-0">
          <Label>Policy EXP</Label>
          <date-picker teleport-center v-model="end_date" type="date" />
        </div>
      </div>

      <ModalAction>
        <Button class="btn-soft font-light tracking-wider" @click="saveAndEdit">
          {{ id > 0 ? 'Update' : 'Create' }}
        </Button>
        <Button class="btn-soft font-light tracking-wider ml-3" @click="close">Close</Button>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
