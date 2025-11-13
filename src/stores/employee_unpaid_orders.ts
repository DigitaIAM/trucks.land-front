import { acceptHMRUpdate, defineStore } from 'pinia'

export interface EmployeePaymentRecord {
  employee: number
  driver_payment: number
  order: Order
}

export interface EmployeePaymentSummary {
  employee: number
  orders_number: number
  orders_amount: number
  orders_driver: number
  orders_profit: number
  toPayment: number
  orders: Map<number, Order>
  paymentsByOrder: Map<number, number>
  paymentTerms: PaymentTerms
  settlements_total: number
  settlements: Array<SettlementEmployee>
  payout: number
}

export interface PaymentTerms {
  created_by: number
  organization: number
  user: number
  percent_of_gross: number
  percent_of_driver: number
  income_tax: number
}

export const useReportDispatcher = defineStore('employee_unpaid_orders', () => {
  const org = ref<number | null>(null)
  const mapping = ref(new Map<number, Array<EmployeePaymentRecord>>())
  const settlements = ref(new Map<number, Array<SettlementEmployee>>())
  const processing = ref<Array<number>>([])

  async function loading(orgId: number | null) {
    org.value = orgId
    const response = await supabase
      .from('employee_unpaid_orders')
      .select('*')
      .eq('organization', orgId)

    const map = new Map<number, Array<EmployeePaymentRecord>>()
    response.data?.forEach((json) => {
      const record = {
        employee: json['employee'],
        driver_payment: json['driver_payment'],
        employee_payment: 0,
        order: json as Order
      } as EmployeePaymentRecord

      const key = record.employee
      const list = map.get(key) ?? []
      list.push(record)
      map.set(key, list)
    })
    mapping.value = map


    const responseSettlements = await supabase
      .from('employee_unpaid_settlements')
      .select()
      .eq('organization', orgId)

    const settlementsMap = new Map<number, Array<SettlementEmployee>>()
    responseSettlements.data?.forEach((json) => {
      const record = json as SettlementEmployee

      const key = record.employee
      const list = settlementsMap.get(key) ?? []
      list.push(record)
      settlementsMap.set(key, list)
    })
    settlements.value = settlementsMap
  }

  const employees = computedAsync(async () => {
    const list = [] as EmployeePaymentSummary[]
    const paymentsMap = mapping.value
    const settlementsMap = settlements.value

    const keys = new Set([...paymentsMap.keys(), ...settlementsMap.keys()])
    for (const employee of keys) {
      let orders_amount = 0
      let orders_driver = 0
      let orders_profit = 0

      const orders = new Map<number, Order>()
      const paymentsByOrder = new Map<number, number>()


      const responseTerms = await supabase
        .from('user_conditions')
        .select()
        .eq('user_id', employee)
        .eq('organization', org.value)
        .maybeSingle()

      const paymentTerms = responseTerms.data as PaymentTerms

      paymentsMap.get(employee)?.forEach((p) => {
        if (p.order.excluded) {
          // ignore
        } else {
          const profit = p.order.cost - p.driver_payment
          orders_amount += p.order.cost
          orders_driver += p.driver_payment
          orders_profit += profit
        }

        const num = paymentsByOrder.get(p.order.id) ?? 0
        paymentsByOrder.set(p.order.id, num + p.driver_payment)

        orders.set(p.order.id, p.order)
      })


      const settlementsRecords = [] as Array<SettlementEmployee>
      let settlementsTotal = 0

      settlementsMap.get(employee)?.forEach((v) => {
        if (v.employee == employee) {
          settlementsRecords.push(v)
          settlementsTotal += v.amount
        }
      })

      let toPayment = 0
      if (paymentTerms.percent_of_gross) {
        toPayment += (orders_amount * paymentTerms.percent_of_gross) / 100
      } else if (paymentTerms.percent_of_driver) {
        toPayment += (orders_driver * paymentTerms.percent_of_driver) / 100
      }

      list.push({
        employee: employee,
        orders_number: orders.size,
        orders_amount: orders_amount,
        orders_driver: orders_driver,
        orders_profit: orders_profit,
        toPayment: toPayment,
        orders: orders,
        paymentsByOrder: paymentsByOrder,
        paymentTerms: paymentTerms,
        settlements: settlementsRecords,
        settlements_total: settlementsTotal,
        payout: toPayment + settlementsTotal
      } as DispatcherPaymentSummary)
    }
    return list
  }, [])

  async function createPayment(
    org: number,
    year: number,
    month: number,
    ex_rate: number
  ) {
    const paymentToEmployeeStore = usePaymentToEmployeeStore()

    const data = employees.value.slice()
    for (const summary of data) {
      mapping.value.delete(processing.value[1])
      settlements.value.delete(processing.value[1])

      processing.value = [summary.employee, processing.value[0]]

      const records = []

      for (const order of summary.orders.values()) {
        const payment = summary.paymentsByOrder.get(order.id)

        records.push({
          doc_payment: -1,
          doc_order: order.id,
          order_cost: order.cost,
          amount: payment
        } as PaymentToDispatcherOrderCreate)
      }

      const settlementsRecords = []
      for (const settlement of summary.settlements.values()) {
        settlementsRecords.push({
          doc_payment: -1,
          doc_settlements: settlement.id,
          amount: settlement.amount
        } as EmployeePaymentSettlementsCreate)
      }


      await paymentToEmployeeStore.create(
        {
          organization: org,
          employee: summary.employee,
          month: month,
          year: year,
          percent_of_gross: summary.paymentTerms.percent_of_gross,
          percent_of_driver: summary.paymentTerms.percent_of_driver,
          to_pay: summary.toPayment,
          ex_rate: ex_rate,
          income_tax: summary.paymentTerms.income_tax
        } as PaymentToEmployeeCreate,
        records,
        settlementsRecords
      )
    }

    for (const employeeId of processing.value) {
      mapping.value.delete(employeeId)
      settlements.value.delete(employeeId)
    }
    processing.value = []
  }

  return { loading, employees, processing, createPayment }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportDispatcher, import.meta.hot))
}
