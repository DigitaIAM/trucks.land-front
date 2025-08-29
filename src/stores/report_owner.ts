import type { Order } from '@/stores/orders.ts'
import { acceptHMRUpdate, defineStore } from 'pinia'
import type { ExpensesToOwner } from '@/stores/expenses_owner.ts'
import type { PaymentToOwnerExpenseCreate } from '@/stores/payment_to_owners.ts'

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

export const useReportOwner = defineStore('report_current_owners_payments', () => {
  const org = ref<number | null>(null)
  const payments = ref(new Map<number, Array<OwnerPaymentRecord>>())
  const expenses = ref(new Map<number, Array<ExpensesToOwner>>())
  const processing = ref<Array<number>>([])

  async function loading(orgId: number | null) {
    org.value = orgId
    const responsePayments = await supabase
      .from('report_current_owners_payments')
      .select()
      .eq('organization', orgId)

    const paymentsMap = new Map<number, Array<OwnerPaymentRecord>>()
    responsePayments.data?.forEach((json) => {
      const record = {
        owner: json['owner'],
        driver_payment: json['driver_cost'],
        order: json as Order,
      } as OwnerPaymentRecord

      const key = record.owner
      const list = paymentsMap.get(key) ?? []
      list.push(record)
      paymentsMap.set(key, list)
    })
    payments.value = paymentsMap

    const responseExpenses = await supabase
      .from('report_current_owners_expenses')
      .select()
      .eq('organization', orgId)

    const expensesMap = new Map<number, Array<ExpensesToOwner>>()
    responseExpenses.data?.forEach((json) => {
      // console.log('json', json)
      const record = json as ExpensesToOwner

      const key = record.owner
      const list = expensesMap.get(key) ?? []
      list.push(record)
      expensesMap.set(key, list)
    })
    expenses.value = expensesMap
  }

  const owners = computed(() => {
    const list = [] as OwnerPaymentSummary[]

    const paymentsMap = payments.value
    const expensesMap = expenses.value

    const keys = new Set([...paymentsMap.keys(), ...expensesMap.keys()])
    for (const owner of keys) {
      let orders_amount = 0
      let owner_payment = 0

      const orders = new Map<number, Order>()
      const paymentsByOrder = new Map<number, number>()

      paymentsMap.get(owner)?.forEach((v) => {
        orders_amount += v.order.cost
        owner_payment += v.driver_payment

        const num = paymentsByOrder.get(v.order.id) ?? 0
        paymentsByOrder.set(v.order.id, num + v.driver_payment)

        orders.set(v.order.id, v.order)
      })

      const expensesRecords = [] as Array<ExpensesToOwner>
      let expensesTotal = 0

      expensesMap.get(owner)?.forEach((v) => {
        if (v.owner === owner) {
          expensesRecords.push(v)
          expensesTotal += v.amount
        }
      })

      list.push({
        owner: owner,
        orders_number: orders.size,
        orders_amount: orders_amount,
        orders_driver: owner_payment,
        orders: orders,
        paymentsByOrder: paymentsByOrder,
        expenses: expensesRecords,
        expenses_total: expensesTotal,
        payout: owner_payment - expensesTotal,
      } as OwnerPaymentSummary)
    }

    // console.log('list', list)
    return list
  })

  async function createPayment(org: number, year: number, week: number, account: User) {
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
        const payment = summary.paymentsByOrder.get(order.id)

        paymentRecords.push({
          created_by: account.id,
          document: -1,
          doc_order: order.id,
          amount: order.cost,
          payment: payment,
        } as PaymentToOwnerOrderCreate)
      }

      const expensesRecords = []

      for (const expense of summary.expenses.values()) {
        expensesRecords.push({
          created_by: account.id,
          document: -1,
          doc_expense: expense.id,
          amount: expense.amount,
        } as PaymentToOwnerExpenseCreate)
      }

      await paymentToOwnerStore.create(
        {
          created_by: account.id,
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

  return { loading, owners, processing, createPayment }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportOwner, import.meta.hot))
}
