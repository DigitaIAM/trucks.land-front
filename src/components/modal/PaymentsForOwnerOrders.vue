<script setup lang="ts">
import html2pdf from 'html2pdf.js'

const props = defineProps<{
  document: PaymentToOwnerSummary | null
}>()

const paymentToOwnerOrdersStore = usePaymentToOwnerOrdersStore()
const ownerStore = useOwnersStore()

watch(
  () => props.document,
  (document) => {
    resetAndShow(document)
  },
  { deep: true },
)

// resetAndShow(props.id)

function resetAndShow(document: PaymentToOwnerSummary) {
  details.showModal()
  paymentToOwnerOrdersStore.loading(document.id)
}

// function generatePdf() {
//   const element = document.getElementById('element-to-convert')
//   html2pdf(element)
//   console.log('generatePdf')
// }

// function exportToPDF() {
//   html2pdf(document.getElementById('element-to-convert'), {
//     margin: 1,
//     filename: 'file.pdf',
//   })
//   console.log('element-to-convert', element)
// }

const cols = [
  {
    label: '#',
    value: (v: PaymentToOwnerOrder) => v.doc_order,
    size: 30,
  },

  {
    label: 'cost $',
    value: (v: PaymentToOwnerOrder) => '$' + v.amount,
    size: 120,
  },
  {
    label: 'd/payments $',
    value: (v: PaymentToOwnerOrder) => '$' + v.payment,
    size: 120,
  },
  {
    label: 'payout $',
    value: (v: PaymentToOwnerOrder) => '$' + v.payment,
    size: 120,
  },
]
</script>

<template>
  <Modal id="details">
    <ModalBox class="max-w-[calc(90vw-6.25rem)]">
      <div class="flex flex-cols-5 gap-10">
        <Text size="2xl">Payment # {{ document?.id }}</Text>
        <Text size="2xl">to</Text>
        <div>
          <Text size="2xl">
            <QueryAndShow :id="props.document?.owner" :store="ownerStore" />
          </Text>
        </div>
        <Text size="2xl">$ {{ document?.payment }}</Text>
        <Button class="btn-soft font-light tracking-wider ml-6">pdf</Button>
      </div>
      <div class="mb-4 mt-4">
        <Text bold size="lg" class="mb-4 mt-4">Orders</Text>
      </div>
      <table class="w-full text-left table-auto min-w-max">
        <thead>
          <tr
            class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
          >
            <th v-for="col in cols" class="p-4" :style="{ width: col.size + 'px' }">
              <p class="block antialiasing tracking-wider font-thin leading-none">
                {{ col.label }}
              </p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in paymentToOwnerOrdersStore.listing">
            <td v-for="col in cols" class="py-3 px-4" :style="{ width: col.size + 'px' }">
              <p
                class="block antialiasing tracking-wide font-light leading-normal truncate"
                :style="{ width: col.size + 'px' }"
              >
                {{ col.value(line) }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex flex-cols-5 gap-60 mt-10">
        <Text bold size="lg">Total</Text>
        <Text size="lg">Orders {{ paymentToOwnerOrdersStore.listing.length }}</Text>
        <Text size="lg">Orders amount $ {{ document?.amount }}</Text>
        <Text size="lg">Payment $ {{ document?.payment }}</Text>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
