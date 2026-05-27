import { acceptHMRUpdate, defineStore } from 'pinia'
import {
  loadOwnerPayments,
  loadOwnerExpenses,
  calculateOwnerReport,
} from '@/composables/use-owner-report-calculator.ts'
import type { Order } from '@/stores/orders.ts'
import type { ExpensesToOwner } from '@/stores/owner_expenses.ts'

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

    const data = owners.value.slice()
    for (const summary of data) {
      if (summary.payout < 0.0) {
        continue
      }

      payments.value.delete(processing.value[1])
      expenses.value.delete(processing.value[1])

      processing.value = [summary.owner, processing.value[0]]

      const paymentRecords = []

      for (const order of summary.orders.values()) {
        // const payment = summary.paymentsByOrder.get(order.id)
        if (order.stage != 3) {
          paymentRecords.push({
            doc_payment: -1,
            doc_order: order.id,
            order_cost: order.cost,
            amount: summary.paymentsByOrder.get(order.id),
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
