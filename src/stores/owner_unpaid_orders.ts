import { acceptHMRUpdate, defineStore } from 'pinia'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import {
  loadOwnerPayments,
  loadOwnerExpenses,
  calculateOwnerReport,
} from '@/composables/use-owner-report-calculator.ts'
import type { Order } from '@/stores/orders.ts'
import type { ExpensesToOwner } from '@/stores/owner_expenses.ts'

dayjs.extend(isoWeek)

export interface OwnerPaymentRecord {
  owner: number
  driver_payment: number
  order: Order
  vehicle: number | null
  driver: number | null
  contract: boolean
  gross: number
}

export interface OwnerOrderVehicle {
  vehicle: number | null
  driver: number | null
  contract: boolean
  gross: number
  dp: number
}

export interface OwnerPaymentSummary {
  owner: number
  orders_number: number
  orders_amount: number
  orders_driver: number
  orders: Map<number, Order>
  paymentsByOrder: Map<number, number>
  orderVehicles: Map<number, Array<OwnerOrderVehicle>>
  expenses_total: number
  expenses: Array<ExpensesToOwner>
  payout: number
}

export const useReportOwner = defineStore('owner_unpaid_orders', () => {
  const payments = ref(new Map<number, Array<OwnerPaymentRecord>>())
  const expenses = ref(new Map<number, Array<ExpensesToOwner>>())
  const processing = ref<Array<number>>([])
  const searchQuery = ref<string | null>(null)

  async function loading(orgId: number | null) {
    payments.value = await loadOwnerPayments(orgId)
    expenses.value = await loadOwnerExpenses(orgId)
  }

  const owners = computedAsync(async () => {
    return await calculateOwnerReport(payments.value, expenses.value, searchQuery.value)
  }, [])

  async function createPayment(org: number, year: number, week: number) {
    const paymentToOwnerStore = usePaymentToOwnerStore()
    const tierStore = useVehicleCommissionTierStore()

    while (tierStore.loading) {
      await sleep(10)
    }

    const weekEndDate = dayjs().year(year).isoWeek(week).endOf('isoWeek').toDate()

    const data = owners.value.slice()
    for (const summary of data) {
      if (summary.payout < 0.0) {
        continue
      }

      payments.value.delete(processing.value[1])
      expenses.value.delete(processing.value[1])

      processing.value = [summary.owner, processing.value[0]]

      const orderIds = Array.from(summary.orders.keys())
      const { data: agreementData } = await supabase
        .from('order_events')
        .select('document, driver, vehicle')
        .in('document', orderIds)
        .eq('kind', 'agreement')

      const agreementMap = new Map<number, { driver: number | null; vehicle: number | null }>()
      if (agreementData) {
        for (const ev of agreementData as Array<{
          document: number
          driver: number
          vehicle: number
        }>) {
          if (!agreementMap.has(ev.document)) {
            agreementMap.set(ev.document, { driver: ev.driver, vehicle: ev.vehicle })
          }
        }
      }

      const vehicleIds = new Set<number>()
      for (const ag of agreementMap.values()) {
        if (ag.vehicle != null) vehicleIds.add(ag.vehicle)
      }
      for (const entries of summary.orderVehicles.values()) {
        for (const e of entries) {
          if (e.vehicle != null) vehicleIds.add(e.vehicle)
        }
      }

      const vehicleKindMap = new Map<number, string>()
      if (vehicleIds.size > 0) {
        const { data: vehiclesData } = await supabase
          .from('vehicles')
          .select('id, kind')
          .in('id', [...vehicleIds])
        vehiclesData?.forEach((v: any) => vehicleKindMap.set(v.id, v.kind))
      }

      const { data: vehicleTypesData } = await supabase.from('vehicle_type').select('id, name')
      const vehicleTypeMap = new Map<string, number>()
      vehicleTypesData?.forEach((vt: any) => vehicleTypeMap.set(vt.name, vt.id))

      const grossByVehicle = new Map<number, number>()
      const vehicleToTypeId = new Map<number, number>()
      for (const entries of summary.orderVehicles.values()) {
        for (const e of entries) {
          if (!e.contract || e.vehicle == null) continue

          const prev = grossByVehicle.get(e.vehicle) ?? 0
          grossByVehicle.set(e.vehicle, prev + e.gross)

          if (!vehicleToTypeId.has(e.vehicle)) {
            const kind = vehicleKindMap.get(e.vehicle)
            const typeId = kind ? vehicleTypeMap.get(kind) : undefined
            if (typeId != null) vehicleToTypeId.set(e.vehicle, typeId)
          }
        }
      }

      const paymentRecords = []

      for (const order of summary.orders.values()) {
        if (order.stage === 3) {
          paymentRecords.push({
            doc_payment: -1,
            doc_order: order.id,
            order_cost: order.cost,
            amount: 0,
          } as PaymentToOwnerOrderCreate)
          continue
        }

        const entries = summary.orderVehicles.get(order.id) ?? []
        const contractEntries = entries.filter((e) => e.contract && e.vehicle != null)

        if (contractEntries.length > 0) {
          const ag = agreementMap.get(order.id)
          let total = 0

          for (const e of contractEntries) {
            const typeId = vehicleToTypeId.get(e.vehicle!)
            const amount =
              typeId != null
                ? Math.round(
                    tierStore.calcAmount(
                      e.gross,
                      grossByVehicle.get(e.vehicle!) ?? e.gross,
                      typeId,
                    ),
                  )
                : e.dp

            await supabase.from('order_events').insert({
              document: order.id,
              kind: 'weekly-calculation',
              datetime: weekEndDate,
              cost: amount,
              driver: e.driver ?? ag?.driver ?? null,
              vehicle: e.vehicle,
            })

            total += amount
          }

          paymentRecords.push({
            doc_payment: -1,
            doc_order: order.id,
            order_cost: order.cost,
            amount: total,
          } as PaymentToOwnerOrderCreate)
        } else {
          paymentRecords.push({
            doc_payment: -1,
            doc_order: order.id,
            order_cost: order.cost,
            amount: summary.paymentsByOrder.get(order.id) ?? 0,
          } as PaymentToOwnerOrderCreate)
        }
      }

      const expensesRecords = []

      for (const expense of summary.expenses.values()) {
        expensesRecords.push({
          doc_payment: -1,
          doc_expense: expense.id,
          amount: expense.amount,
        } as PaymentToOwnerExpenseCreate)
      }

      await paymentToOwnerStore.create(
        {
          organization: org,
          owner: summary.owner,
          year: year,
          week: week,
        } as PaymentToOwnerCreate,
        paymentRecords,
        expensesRecords,
      )
    }

    for (const ownerId of processing.value) {
      payments.value.delete(ownerId)
      expenses.value.delete(ownerId)
    }

    processing.value = []
  }

  async function searchAndListing(text: string) {
    searchQuery.value = text
  }

  return { loading, owners, processing, createPayment, searchAndListing }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportOwner, import.meta.hot))
}
