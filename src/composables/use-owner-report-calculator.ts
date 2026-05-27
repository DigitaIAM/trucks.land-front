import type { Order } from '@/stores/orders.ts'
import type { ExpensesToOwner } from '@/stores/owner_expenses.ts'
import type { OwnerPaymentRecord, OwnerPaymentSummary } from '@/stores/owner_unpaid_orders.ts'

export async function loadOwnerPayments(orgId: number | null) {
  const response = await supabase
    .from('owner_unpaid_orders')
    .select()
    .eq('organization', orgId)

  const paymentsMap = new Map<number, Array<OwnerPaymentRecord>>()
  response.data?.forEach((json) => {
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
  return paymentsMap
}

export async function loadOwnerExpenses(orgId: number | null) {
  const response = await supabase
    .from('owner_unpaid_expenses')
    .select()
    .eq('organization', orgId)

  const expensesMap = new Map<number, Array<ExpensesToOwner>>()
  response.data?.forEach((json) => {
    const record = json as ExpensesToOwner

    const key = record.owner
    const list = expensesMap.get(key) ?? []
    list.push(record)
    expensesMap.set(key, list)
  })
  return expensesMap
}

export async function calculateOwnerReport(
  paymentsMap: Map<number, Array<OwnerPaymentRecord>>,
  expensesMap: Map<number, Array<ExpensesToOwner>>,
  searchQuery: string | null,
) {
  const ownersStore = useOwnersStore()

  const list = [] as OwnerPaymentSummary[]

  const keys = new Set([...paymentsMap.keys(), ...expensesMap.keys()])
  for (const owner of keys) {
    let orders_amount = 0
    let owner_payment = 0

    const orders = new Map<number, Order>()
    const paymentsByOrder = new Map<number, number>()

    paymentsMap.get(owner)?.forEach((v) => {
      if (v.order.stage === 3) {
        // ignore
      } else {
        orders_amount += v.order.cost
        owner_payment += v.driver_payment
      }

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

    if (searchQuery != null) {
      const ownerRecord = await ownersStore.resolve(owner)
      if (!ownerRecord?.name.toLowerCase().includes(searchQuery)) {
        continue
      }
    }

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

  list.sort((a, b) => b.payout - a.payout)

  return list
}
