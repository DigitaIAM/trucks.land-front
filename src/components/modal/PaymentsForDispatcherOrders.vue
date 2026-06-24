<script setup lang="ts">
import { generateDispatcherPaymentPdf } from '@/utils/export_dispatchers_payments_to_pdf.ts'
import { openInNewTab } from '@/utils/pdf-helper.ts'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { sleep } from '@/utils/datetime'

dayjs.extend(isoWeek)

const props = defineProps<{
  document: PaymentToEmployeeSummary | null
}>()

const paymentToDispatcherOrdersStore = usePaymentToDispatcherOrdersStore()
const orderStore = useOrdersStore()
const userStore = useUsersStore()
const organizationsStore = useOrganizationsStore()
const accessTokenStore = useAccessTokenStore()
const employeePaymentSettlementsStore = useEmployeePaymentSettlementsStore()
const vehiclesStore = useVehiclesStore()

const emit = defineEmits(['closed'])

const selectedDocument = ref<SettlementEmployee | null>(null)

watch(
  () => props.document,
  (document) => {
    resetAndShow(document)
  },
  { deep: true },
)

// resetAndShow(props.id)

async function resetAndShow(document: PaymentToEmployeeSummary | null) {
  if (!document?.id) return

  await paymentToDispatcherOrdersStore.loading(document.id)
  await employeePaymentSettlementsStore.loading(document.id)
  details.showModal()
}

async function generatePdf() {
  const document = props.document

  if (document == null) {
    throw 'missing document'
  }

  // const employee = await userStore.resolve(document.employee)

  const org = await organizationsStore.resolve(document.organization)
  if (org == null) {
    throw 'missing organization'
  }

  const token = await accessTokenStore.getTokenZoho(org.id)
  if (token == null) {
    throw 'missing token'
  }

  const pdfDoc = await generateDispatcherPaymentPdf(document)

  await openInNewTab(pdfDoc)

  // Send by email
  //   const base64String = await pdfDoc.saveAsBase64()
  //
  //   const email = {
  //     from: { address: `noreply@${org.domain}` },
  //     to: [
  //       {
  //         email_address: {
  //           address: 'shabanovanatali@gmail.com',
  //           name: `${employee?.real_name}`,
  //         },
  //       },
  //     ],
  //     //cc: [{ email_address: { address: 'sitora@cnulogistics.com', name: 'Sitora Subkhankulova' } }], // 'shabanovanatali@gmail.com', name: '' address: `${dispatcher?.email}`,name: `${dispatcher?.real_name}`
  //     subject: `Payment sheet ${document.month}-${org.code3}-${document.id}`,
  //     htmlbody:
  //       'Greetings,<br />' +
  //       '<br />' +
  //       'Payment sheet of month #&nbsp;' +
  //       `${document.month}` +
  //       '&nbsp;of&nbsp;' +
  //       `${document.year}` +
  //       '&nbsp;is attached.<br />' +
  //       '<br />' +
  //       'For any inquiries regarding calculations, please contact us at emma.clark@caravanfreight.net' +
  //       '<br />' +
  //       'Best Regards,<br />' +
  //       '<br />' +
  //       `${org.name}<br />` +
  //       `${org.address1}<br />` +
  //       `${org.address2}<br />`,
  //     attachments: [
  //       {
  //         name: `paySheet_${document.month}-${org.code3}-${document.id}.pdf`,
  //         content: base64String,
  //         mime_type: 'plain/txt',
  //       },
  //     ],
  //   }
  //
  //   const myFetch = createFetch({
  //     // baseUrl: 'https://api.zeptomail.com/',
  //     // baseUrl: 'http://localhost:5173/',
  //     options: {
  //       async beforeFetch({ options }) {
  //         options.headers = {
  //           ...options.headers,
  //           Accept: 'application/json',
  //           'Content-Type': 'application/json',
  //           Authorization: token,
  //         }
  //         return { options }
  //       },
  //     },
  //     fetchOptions: { mode: 'cors' },
  //   })
  //
  //   const { isFetching, error, data } = await myFetch('/zeptomail/v1.1/email').post(email)
  //
  //   console.log('isFetching', isFetching)
  //   console.log('error', error)
  //   console.log('data', data)
}

const state = reactive({})

function resolve(
  order: Order,
  name: string,
  create: () => object,
  request: () => Promise<object | null>,
  label: (obj: object) => string,
) {
  const s = state[order.id] ?? {}
  if (s && s[name]) {
    return label(s[name])
  } else {
    s[name] = create()
    state[order.id] = s
    request().then((obj) => {
      if (obj) state[order.id][name] = obj
    })
    return label(s[name])
  }
}

const cols = [
  {
    label: '#',
    value: (v: PaymentToDispatcherOrder) =>
      resolve(
        v,
        '#_' + v.doc_order,
        () => ({ name: '?' }),
        () => orderStore.resolve(v.doc_order),
        (map) => map.number,
      ),
    size: 70,
  },

  {
    label: 'order amount',
    value: (v: PaymentToDispatcherOrder) => '$' + v.order_cost,
    size: 120,
  },
  {
    label: 'd/payments',
    value: (v: PaymentToDispatcherOrder) => '$' + v.driver_cost,
    size: 120,
  },
  {
    label: 'profit',
    value: (v: PaymentToDispatcherOrder) =>
      '$' + ((v.order_cost - v.driver_cost) * v.profit_pc) / 100,
    size: 120,
  },
  {
    label: 'note',
    value: (v: PaymentToDispatcherOrder) => v.profit_kind,
    size: 120,
  },
]

const directDispatcherOrders = computed(() => {
  const orders = paymentToDispatcherOrdersStore.listing || []
  return orders.reduce(
    (acc, order) => {
      if (order.profit_kind === 'direct-dispatcher') {
        // Фильтр для обычного direct
        const orderCost = Number(order.order_cost || 0)
        const driverCost = Number(order.driver_cost || 0)
        const profitPc = Number(order.profit_pc || 0)

        const directProfit = ((orderCost - driverCost) * profitPc) / 100

        acc.count++
        acc.totalOrderCost += orderCost
        acc.totalDriverCost += driverCost
        acc.totalDirectProfit += directProfit
      }
      return acc
    },
    { count: 0, totalOrderCost: 0, totalDriverCost: 0, totalDirectProfit: 0 },
  )
})

const directVehicleOrders = computed(() => {
  const orders = paymentToDispatcherOrdersStore.listing || []

  const stats = orders.reduce(
    (acc, order) => {
      if (order.profit_kind === 'direct-vehicle') {
        const orderCost = Number(order.order_cost || 0)
        const driverCost = Number(order.driver_cost || 0)
        const profitPc = Number(order.profit_pc || 0)

        const orderProfit = orderCost - driverCost
        const directProfit = (orderProfit * profitPc) / 100

        acc.count++
        acc.totalOrderCost += orderCost
        acc.totalDriverCost += driverCost
        acc.totalDirectProfit += directProfit
      }
      return acc
    },
    { count: 0, totalOrderCost: 0, totalDriverCost: 0, totalDirectProfit: 0 },
  )

  return {
    ...stats,
    // Чистая разница (Gross Profit)
    grossDirectProfit: stats.totalOrderCost - stats.totalDriverCost,
  }
})

const contractOrders = computed(() => {
  const orders = paymentToDispatcherOrdersStore.listing || []
  return orders.reduce(
    (acc, order) => {
      if (order.profit_kind === 'contract') {
        const orderCost = Number(order.order_cost || 0)
        const driverCost = Number(order.driver_cost || 0)
        acc.count++
        acc.totalOrderCost += orderCost
        acc.totalDriverCost += driverCost
      }
      return acc
    },
    { count: 0, totalOrderCost: 0, totalDriverCost: 0 },
  )
})

const ordersRowspan = computed(() => {
  let count = 4 // Базовые: Quantity, Amount, Driver Payment, profit
  if (directDispatcherOrders.value.count > 0) count++
  if (directVehicleOrders.value.count > 0) count++
  if (contractOrders.value.count > 0) count++
  return count
})

const commissionToPay = computed(() => {
  const toPay = props.document?.to_pay || 0
  const tiers = contractBreakdownTotal.value
  const fixedSalary = Number(props.document?.fixed_salary || 0)
  return toPay - tiers - fixedSalary
})

interface ContractVehicleBreakdown {
  vehicleId: number
  unitId: string
  typeName: string
  ordersCount: number
  totalGross: number
  commissionPercent: number
  commissionAmount: number
}

interface ContractWeekBreakdown {
  week: number
  label: string
  vehicles: ContractVehicleBreakdown[]
  weekTotal: number
}

interface CommissionTier {
  vehicle_type_id: number
  gross: number
  dispatch_fee: number
  dispatcher_commission: number
}

const contractBreakdown = ref<ContractWeekBreakdown[]>([])
const contractBreakdownTotal = ref(0)
const contractBreakdownLoading = ref(false)

watch(
  () => paymentToDispatcherOrdersStore.listing,
  async (listing) => {
    const contractOrdersList = listing.filter((o) => o.profit_kind === 'contract')
    if (contractOrdersList.length === 0) {
      contractBreakdown.value = []
      contractBreakdownTotal.value = 0
      return
    }

    contractBreakdownLoading.value = true

    try {
      const orderEntries = await Promise.all(
        contractOrdersList.map(async (co) => {
          const order = await orderStore.resolve(co.doc_order)
          if (!order) return null
          const vehicle = (order as any).vehicle
          if (!vehicle) return null
          const week = (order as any).week
          if (!week) return null
          return {
            orderId: co.doc_order,
            week,
            vehicleId: vehicle,
            orderCost: Number(co.order_cost || 0),
          }
        }),
      )
      const validEntries = orderEntries.filter((e): e is NonNullable<typeof e> => e != null)
      if (validEntries.length === 0) {
        contractBreakdown.value = []
        contractBreakdownTotal.value = 0
        return
      }

      const orderWeekMap = new Map<number, number>()
      for (const e of validEntries) {
        orderWeekMap.set(e.orderId, e.week)
      }

      const vehicleIds = [...new Set(validEntries.map((e) => e.vehicleId))]
      const vehicleEntries = await Promise.all(
        vehicleIds.map(async (id) => {
          const v = await vehiclesStore.resolve(id)
          if (!v) return null
          return { id: v.id, unitId: v.unit_id, kind: v.kind }
        }),
      )
      const validVehicles = vehicleEntries.filter((v): v is NonNullable<typeof v> => v != null)
      const vehicleMap = new Map(validVehicles.map((v) => [v.id, v]))

      const vehicleTypeStore = useVehicleTypeStore()
      const tierStore = useVehicleCommissionTierStore()

      while (!vehicleTypeStore.initialized) {
        await sleep(10)
      }
      const typeList = vehicleTypeStore.listing
      const typeMap = new Map<string, number>()
      typeList?.forEach((vt: any) => typeMap.set(vt.name, vt.id))

      while (!tierStore.initialized) {
        await sleep(10)
      }

      const weekVehicleRaw = new Map<
        string,
        { vehicleId: number; totalGross: number; orderCount: number }
      >()
      for (const e of validEntries) {
        const week = orderWeekMap.get(e.orderId)
        if (!week) continue
        const key = `${week}_${e.vehicleId}`
        const existing = weekVehicleRaw.get(key) || {
          vehicleId: e.vehicleId,
          totalGross: 0,
          orderCount: 0,
        }
        existing.totalGross += e.orderCost
        existing.orderCount += 1
        weekVehicleRaw.set(key, existing)
      }

      const weekGroups = new Map<number, ContractWeekBreakdown>()

      for (const [key, data] of weekVehicleRaw) {
        const week = Number(key.split('_')[0])
        const vehicle = vehicleMap.get(data.vehicleId)
        if (!vehicle) continue

        const typeId = typeMap.get(vehicle.kind)
        if (!typeId) continue

        const vehicleTiers = tierStore.tiers.filter((t: any) => t.vehicle_type_id === typeId)
        if (vehicleTiers.length === 0) continue

        const sortedTiers = [...vehicleTiers].sort((a: any, b: any) => a.gross - b.gross)
        let matchedTier = sortedTiers[sortedTiers.length - 1]
        for (const tier of sortedTiers) {
          if (data.totalGross <= tier.gross) {
            matchedTier = tier
            break
          }
        }

        const commissionAmount = (data.totalGross * matchedTier.dispatcher_commission) / 100
        const weekStart = dayjs().isoWeek(week).startOf('isoWeek')
        const weekEnd = dayjs().isoWeek(week).endOf('isoWeek')

        if (!weekGroups.has(week)) {
          weekGroups.set(week, {
            week,
            label: `${weekStart.format('MMM D')} - ${weekEnd.format('MMM D')}`,
            vehicles: [],
            weekTotal: 0,
          })
        }

        const wg = weekGroups.get(week)!
        wg.vehicles.push({
          vehicleId: data.vehicleId,
          unitId: vehicle.unitId,
          typeName: vehicle.kind,
          ordersCount: data.orderCount,
          totalGross: data.totalGross,
          commissionPercent: matchedTier.dispatcher_commission,
          commissionAmount,
        })
        wg.weekTotal += commissionAmount
      }

      contractBreakdown.value = [...weekGroups.values()].sort((a, b) => a.week - b.week)
      contractBreakdownTotal.value = contractBreakdown.value.reduce(
        (sum, w) => sum + w.weekTotal,
        0,
      )
    } catch (e) {
      console.error('Failed to load contract breakdown', e)
      contractBreakdown.value = []
      contractBreakdownTotal.value = 0
    } finally {
      contractBreakdownLoading.value = false
    }
  },
  { immediate: true, deep: true },
)

function close() {
  details.close()
  emit('closed')
}

async function openSettlementModal() {
  const doc = props.document
  if (doc) {
    selectedDocument.value = {
      organization: doc.organization,
      employee: doc.employee,
    } as SettlementEmployee
  }
}

function onClose() {
  selectedDocument.value = null
}
</script>

<template>
  <Modal id="details">
    <ModalBox class="max-w-[calc(90vw-6.25rem)]">
      <div class="flex items-center justify-between w-full gap-4">
        <div class="flex items-center gap-3">
          <Text size="xl">
            Payment # {{ document?.id }} for {{ document?.month }}-{{ document?.year }}
          </Text>
          <Text size="xl">to</Text>
          <Text size="xl" class="font-medium">
            <QueryAndShow name="real_name" :id="document?.employee" :store="userStore" />
          </Text>
          <Text size="xl" bold>$ {{ document?.payout_usd.toFixed(2) }}</Text>
        </div>

        <div class="flex items-center gap-3">
          <Button
            :disabled="document?.closed === true"
            class="btn-soft font-light tracking-wider"
            @click.stop="openSettlementModal"
          >
            Add settlement
          </Button>

          <Button class="btn-soft font-light tracking-wider" @click="generatePdf">
            Send to
            <QueryAndShow name="email" :id="props.document?.employee" :store="userStore" />
          </Button>
        </div>
      </div>

      <div
        class="mt-10 mb-6 overflow-hidden rounded-xl border border-[#526471] shadow-md bg-[#3e4d59] text-[#e2e9ef]"
      >
        <table class="w-full text-left text-sm border-collapse">
          <tbody class="divide-y divide-[#526471]">
            <!-- Секция: Orders -->
            <tr>
              <td
                :rowspan="ordersRowspan"
                class="px-6 py-4 font-semibold text-xs text-white uppercase align-top bg-[#33414b] w-1/3 tracking-wider"
              >
                Orders
              </td>
              <td class="px-6 py-3 text-[#cbd5e0]">quantity orders</td>
              <td class="px-6 py-3 text-right font-medium text-white">
                {{ paymentToDispatcherOrdersStore.listing.length }}
              </td>
            </tr>

            <tr>
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">orders amount</td>
              <td class="px-6 py-3 text-right font-medium text-white border-t border-[#526471]">
                $ {{ document?.gross.toFixed(2) }}
              </td>
            </tr>

            <tr>
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">driver payment</td>
              <td class="px-6 py-3 text-right font-medium text-white border-t border-[#526471]">
                $ {{ document?.driver_payment.toFixed(2) }}
              </td>
            </tr>

            <tr>
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">total profit</td>
              <td class="px-6 py-3 text-right font-bold text-white border-t border-[#526471]">
                $
                {{
                  (Number(document?.gross || 0) - Number(document?.driver_payment || 0)).toFixed(2)
                }}
              </td>
            </tr>

            <!-- Подсекция: Direct Dispatcher (условная) -->
            <tr v-if="directDispatcherOrders.count > 0">
              <td class="px-6 py-2 text-[#cbd5e0] border-t border-[#526471]">
                direct profit
                <span class="ml-1 opacity-70">({{ directDispatcherOrders.count }} orders)</span>
              </td>
              <td class="px-6 py-3 text-right font-bold text-white border-t border-[#526471]">
                $ {{ directDispatcherOrders.totalDirectProfit.toFixed(2) }}
              </td>
            </tr>

            <!-- Подсекция: Direct Vehicle (условная) -->
            <tr v-if="directVehicleOrders.count > 0">
              <td class="px-6 py-2 text-[#cbd5e0] border-t border-[#526471]">
                direct profit
                <span class="ml-1 opacity-70">({{ directVehicleOrders.count }} orders)</span>
              </td>
              <td class="px-6 py-3 text-right font-bold text-white border-t border-[#526471]">
                $ {{ directVehicleOrders.totalDirectProfit.toFixed(2) }}
              </td>
            </tr>

            <!-- Подсекция: Contract orders -->
            <tr v-if="contractOrders.count > 0">
              <td class="px-6 py-2 text-[#cbd5e0] border-t border-[#526471]">
                contract
                <span class="ml-1 opacity-70">({{ contractOrders.count }} orders)</span>
              </td>
              <td class="px-6 py-3 text-right font-bold text-white border-t border-[#526471]">
                $ {{ contractOrders.totalOrderCost.toFixed(2) }}
              </td>
            </tr>

            <!-- Секция: Commission -->
            <tr>
              <td
                :rowspan="
                  1 + (document?.fixed_salary > 0 ? 1 : 0) + (contractOrders.count > 0 ? 1 : 0)
                "
                class="px-6 py-4 font-semibold text-xs text-white uppercase align-top bg-[#33414b] tracking-wider"
              >
                Commission
              </td>
              <td class="px-6 py-3 text-[#cbd5e0]">
                <span v-if="document?.percent_of_profit > 0"
                  >{{ document?.percent_of_profit }}%</span
                >
                <span v-else-if="document?.percent_of_gross > 0"
                  >{{ document?.percent_of_gross }}% of gross</span
                >
                <span v-else>to pay</span>
              </td>
              <td class="px-6 py-3 text-right font-medium text-white">
                $
                {{ commissionToPay.toFixed(2) }}
              </td>
            </tr>
            <tr v-if="contractOrders.count > 0">
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">contract (tiers)</td>
              <td class="px-6 py-3 text-right font-medium text-white border-t border-[#526471]">
                $ {{ contractBreakdownTotal.toFixed(2) }}
              </td>
            </tr>

            <tr v-if="document?.fixed_salary > 0">
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">fixed salary</td>
              <td class="px-6 py-3 text-right font-medium text-white border-t border-[#526471]">
                $ {{ document?.fixed_salary.toFixed(2) }}
              </td>
            </tr>

            <!-- Секция: Other -->
            <tr>
              <td
                :rowspan="
                  1 +
                  (Number(document?.settlement_fine) > 0 ? 1 : 0) +
                  (Number(document?.settlement_vacation) > 0 ? 1 : 0) +
                  (Number(document?.settlement_advance) > 0 ? 1 : 0)
                "
                class="px-6 py-4 font-semibold text-xs text-white uppercase align-top bg-[#33414b] tracking-wider"
              >
                Other
              </td>
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">bonuses & premiums</td>
              <td class="px-6 py-3 text-right font-medium text-white border-t border-[#526471]">
                $
                {{
                  (
                    Number(document?.settlement_bonus || 0) +
                    Number(document?.settlement_premium || 0)
                  ).toFixed(2)
                }}
              </td>
            </tr>
            <tr v-if="document?.settlement_fine > 0">
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">fine</td>
              <td class="px-6 py-3 text-right font-medium text-white border-t border-[#526471]">
                - $ {{ document?.settlement_fine }}
              </td>
            </tr>
            <tr v-if="document?.settlement_vacation > 0">
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">vacation</td>
              <td
                class="px-6 py-3 text-right text-[#cbd5e0] italic text-xs border-t border-[#526471]"
              >
                UZS {{ document?.settlement_vacation }}
              </td>
            </tr>
            <tr v-if="document?.settlement_advance > 0">
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">advance</td>
              <td
                class="px-6 py-3 text-right text-[#cbd5e0] italic text-xs border-t border-[#526471]"
              >
                - UZS {{ document?.settlement_advance }}
              </td>
            </tr>

            <!-- Итог (Payout) -->
            <tr class="bg-[#2a363f] text-white">
              <!-- colspan="2" объединяет первые две колонки (заголовок и описание) -->
              <td colspan="2" class="px-6 py-6 font-bold uppercase tracking-widest text-left">
                Payout
              </td>
              <!-- Третья колонка для суммы -->
              <td class="px-6 py-5 text-right font-bold">
                $ {{ (document?.payout_usd || 0).toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Секция: Contract Commission Breakdown -->
      <div
        v-if="contractBreakdown.length > 0"
        class="mt-6 overflow-hidden rounded-xl border border-[#526471] shadow-md bg-[#3e4d59] text-[#e2e9ef]"
      >
        <div
          class="px-6 py-3 font-semibold text-xs text-white uppercase bg-[#33414b] tracking-wider"
        >
          Contract commission
          <span v-if="contractBreakdownLoading" class="ml-2 opacity-70">loading...</span>
        </div>
        <div class="px-6 py-4">
          <template v-for="week in contractBreakdown" :key="week.week">
            <div class="text-sm font-medium text-[#94a3b8] mb-2 mt-3 first:mt-0">
              Week {{ week.week }} ({{ week.label }})
            </div>
            <table class="w-full text-xs mb-3">
              <thead>
                <tr class="text-[#94a3b8] border-b border-[#526471]">
                  <th class="py-1 pr-4 text-left font-medium">Unit</th>
                  <th class="py-1 pr-4 text-left font-medium">Type</th>
                  <th class="py-1 pr-4 text-right font-medium">Orders</th>
                  <th class="py-1 pr-4 text-right font-medium">Gross</th>
                  <th class="py-1 pr-4 text-right font-medium">%</th>
                  <th class="py-1 text-right font-medium">Commission</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="v in week.vehicles"
                  :key="v.vehicleId"
                  class="border-b border-[#526471]/50"
                >
                  <td class="py-1 pr-4 text-white">{{ v.unitId }}</td>
                  <td class="py-1 pr-4 text-[#cbd5e0]">{{ v.typeName }}</td>
                  <td class="py-1 pr-4 text-right text-white">{{ v.ordersCount }}</td>
                  <td class="py-1 pr-4 text-right text-white">$ {{ v.totalGross.toFixed(2) }}</td>
                  <td class="py-1 pr-4 text-right text-white">{{ v.commissionPercent }}%</td>
                  <td class="py-1 text-right text-white font-medium">
                    $ {{ v.commissionAmount.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="text-white font-medium">
                  <td colspan="5" class="py-1 text-right">Week total:</td>
                  <td class="py-1 text-right">$ {{ week.weekTotal.toFixed(2) }}</td>
                </tr>
              </tfoot>
            </table>
          </template>
          <div class="text-sm font-bold text-white border-t border-[#526471] pt-3 mt-2 text-right">
            Grand total: $ {{ contractBreakdownTotal.toFixed(2) }}
          </div>
        </div>
      </div>

      <div class="mb-2 mt-12">
        <Text bold size="lg" class="mb-4 mt-4">Orders</Text>
      </div>
      <div class="overflow-clip flex flex-col max-h-[40vh]">
        <table class="w-full table-fixed text-left">
          <!-- table-auto min-w-max -->
          <thead>
            <tr
              class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
            >
              <th
                v-for="col in cols"
                class="p-4"
                :key="col.label"
                :style="{ width: col.size + 'px' }"
              >
                <p class="block antialiasing tracking-wider font-thin leading-none">
                  {{ col.label }}
                </p>
              </th>
            </tr>
          </thead>
        </table>
        <div class="flex-1 overflow-y-auto">
          <table class="w-full table-fixed">
            <tbody>
              <tr
                v-for="line in paymentToDispatcherOrdersStore.listing"
                :key="line.id"
                class="hover:bg-base-200"
              >
                <td
                  v-for="col in cols"
                  :key="line.id + '_' + col.label"
                  class="py-3 px-4"
                  :style="{ width: col.size + 'px' }"
                >
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
        </div>
        <div class="flex place-self-end mt-6">
          <Button class="btn-soft font-light tracking-wider" @click="close">Close</Button>
        </div>
      </div>
    </ModalBox>
  </Modal>

  <SettlementEmployeeModal
    :edit="selectedDocument"
    @closed="onClose"
    :types="['bonus', 'premium', 'fine']"
    :payment-id="document?.id"
  ></SettlementEmployeeModal>
</template>

<style scoped></style>
