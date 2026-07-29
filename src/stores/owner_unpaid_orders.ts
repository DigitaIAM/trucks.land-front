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
}

export interface OwnerPaymentSummary {
  owner: number
  orders_number: number
  orders_amount: number
  orders_driver: number
  orders: Map<number, Order>
  paymentsByOrder: Map<number, number>
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
      for (const order of summary.orders.values()) {
        if (order.contract && order.stage != 3) {
          const ag = agreementMap.get(order.id)
          const vehicleId = ag?.vehicle
          if (vehicleId == null) continue

          const prev = grossByVehicle.get(vehicleId) ?? 0
          grossByVehicle.set(vehicleId, prev + order.cost)

          if (!vehicleToTypeId.has(vehicleId)) {
            const kind = vehicleKindMap.get(vehicleId)
            const typeId = kind ? vehicleTypeMap.get(kind) : undefined
            if (typeId != null) vehicleToTypeId.set(vehicleId, typeId)
          }
        }
      }

      const paymentRecords = []

      for (const order of summary.orders.values()) {
        if (order.stage != 3) {
          const ag = agreementMap.get(order.id)
          const vehicleId = ag?.vehicle

          const amount =
            order.contract && vehicleId != null && vehicleToTypeId.has(vehicleId)
              ? tierStore.calcAmount(
                  order.cost,
                  grossByVehicle.get(vehicleId) ?? order.cost,
                  vehicleToTypeId.get(vehicleId)!,
                )
              : summary.paymentsByOrder.get(order.id)

          if (order.contract && vehicleId != null && vehicleToTypeId.has(vehicleId)) {
            await supabase.from('order_events').insert({
              document: order.id,
              kind: 'weekly-calculation',
              datetime: weekEndDate,
              cost: amount,
              driver: ag?.driver ?? null,
              vehicle: vehicleId,
            })
          }

          paymentRecords.push({
            doc_payment: -1,
            doc_order: order.id,
            order_cost: order.cost,
            amount,
          } as PaymentToOwnerOrderCreate)
        } else {
          paymentRecords.push({
            doc_payment: -1,
            doc_order: order.id,
            order_cost: order.cost,
            amount: 0,
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
