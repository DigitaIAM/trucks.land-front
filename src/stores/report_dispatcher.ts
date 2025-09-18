import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Order } from '@/stores/orders.ts'
import type { PaymentToDispatcherCreate } from '@/stores/payment_to_dispatchers.ts'
import type { PaymentsToEmployeeAdditionalCreate } from '@/stores/payments_to_employee_additional.ts'
import type { PaymentEmployeeFinesCreate } from '@/stores/payment_employee_fines.ts'

export interface DispatcherPaymentRecord {
  dispatcher: number
  driver_payment: number
  order: Order
}

export interface DispatcherPaymentSummary {
  dispatcher: number
  orders_number: number
  orders_amount: number
  orders_driver: number
  orders_profit: number
  toPayment: number
  orders: Map<number, Order>
  paymentsByOrder: Map<number, number>
  paymentTerms: PaymentTerms
  additional_payments_total: number
  additional_payments: Array<PaymentsAdditionalToEmployee>
  fines_total: number
  fines: Array<FinesEmployee>
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

export const useReportDispatcher = defineStore('report_current_dispatcher_payments', () => {
  const org = ref<number | null>(null)
  const mapping = ref(new Map<number, Array<DispatcherPaymentRecord>>())
  const additional_payments = ref(new Map<number, Array<PaymentsAdditionalToEmployee>>())
  const fines = ref(new Map<number, Array<FinesEmployee>>())
  const processing = ref<Array<number>>([])

  async function loading(orgId: number | null) {
    org.value = orgId
    const response = await supabase
      .from('report_current_dispatcher_payments')
      .select('*')
      .eq('organization', orgId)

    const map = new Map<number, Array<DispatcherPaymentRecord>>()
    response.data?.forEach((json) => {
      const record = {
        dispatcher: json['dispatcher'],
        driver_payment: json['driver_payment'],
        dispatcher_payment: 0,
        order: json as Order,
      } as DispatcherPaymentRecord

      const key = record.dispatcher
      const list = map.get(key) ?? []
      list.push(record)
      map.set(key, list)
    })
    mapping.value = map

    const responseAdditional = await supabase
      .from('report_current_employee_additional_payments')
      .select()
      .eq('organization', orgId)

    const additionalMap = new Map<number, Array<PaymentsAdditionalToEmployee>>()
    responseAdditional.data?.forEach((json) => {
      const record = json as PaymentsAdditionalToEmployee

      const key = record.employee
      const list = additionalMap.get(key) ?? []
      list.push(record)
      additionalMap.set(key, list)
    })
    additional_payments.value = additionalMap

    const responseFines = await supabase
      .from('report_current_employee_fines')
      .select()
      .eq('organization', orgId)

    const finesMap = new Map<number, Array<FinesEmployee>>()
    responseFines.data?.forEach((json) => {
      const record = json as FinesEmployee

      const key = record.employee
      const list = finesMap.get(key) ?? []
      list.push(record)
      finesMap.set(key, list)
    })
    fines.value = finesMap
  }

  const dispatchers = computedAsync(async () => {
    const list = [] as DispatcherPaymentSummary[]
    const paymentsMap = mapping.value
    const additionalMap = additional_payments.value
    const finesMap = fines.value

    const keys = new Set([...paymentsMap.keys(), ...additionalMap.keys(), ...finesMap.keys()])
    for (const dispatcher of keys) {
      let orders_amount = 0
      let orders_driver = 0
      let orders_profit = 0

      const orders = new Map<number, Order>()
      const paymentsByOrder = new Map<number, number>()

      const response = await supabase
        .from('conditions')
        .select()
        .eq('user', dispatcher)
        .eq('organization', org.value)
        .maybeSingle()

      const paymentTerms = response.data as PaymentTerms

      paymentsMap.get(dispatcher)?.forEach((p) => {
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

      const additionalRecords = [] as Array<PaymentsAdditionalToEmployee>
      let additionalTotal = 0

      additionalMap.get(dispatcher)?.forEach((v) => {
        if (v.employee == dispatcher) {
          additionalRecords.push(v)
          additionalTotal += v.amount
        }
      })

      const finesRecords = [] as Array<FinesEmployee>
      let finesTotal = 0

      finesMap.get(dispatcher)?.forEach((v) => {
        if (v.employee == dispatcher) {
          finesRecords.push(v)
          finesTotal += v.amount
        }
      })

      let toPayment = 0
      if (paymentTerms.percent_of_gross) {
        toPayment += (orders_amount * paymentTerms.percent_of_gross) / 100
      } else if (paymentTerms.percent_of_driver) {
        toPayment += (orders_driver * paymentTerms.percent_of_driver) / 100
      }

      list.push({
        dispatcher: dispatcher,
        orders_number: orders.size,
        orders_amount: orders_amount,
        orders_driver: orders_driver,
        orders_profit: orders_profit,
        toPayment: toPayment,
        orders: orders,
        paymentsByOrder: paymentsByOrder,
        paymentTerms: paymentTerms,
        additional_payments: additionalRecords,
        additional_payments_total: additionalTotal,
        fines: finesRecords,
        fines_total: finesTotal,
        payout: toPayment + additionalTotal - finesTotal,
      } as DispatcherPaymentSummary)
    }
    console.log('list', list)
    return list
  }, [])

  async function createPayment(
    org: number,
    year: number,
    month: number,
    account: User,
    ex_rate: number,
  ) {
    console.log('ex_rate', ex_rate)
    const paymentToDispatcherStore = usePaymentToDispatcherStore()

    const data = dispatchers.value.slice()
    for (const summary of data) {
      mapping.value.delete(processing.value[1])

      additional_payments.value.delete(processing.value[1])
      fines.value.delete(processing.value[1])

      processing.value = [summary.dispatcher, processing.value[0]]

      const records = []

      for (const order of summary.orders.values()) {
        const payment = summary.paymentsByOrder.get(order.id)

        records.push({
          created_by: account.id,
          document: -1,
          doc_order: order.id,
          amount: order.cost,
          payment: payment,
        } as PaymentToDispatcherOrderCreate)
      }

      const additionalRecords = []
      for (const additional of summary.additional_payments.values()) {
        additionalRecords.push({
          created_by: account.id,
          document: -1,
          doc_additional_payment: additional.id,
          amount: additional.amount,
        } as PaymentsToEmployeeAdditionalCreate)
      }

      const finesRecords = []
      for (const fine of summary.fines.values()) {
        finesRecords.push({
          created_by: account.id,
          document: -1,
          doc_fine: fine.id,
          amount: fine.amount,
        } as PaymentEmployeeFinesCreate)
      }

      await paymentToDispatcherStore.create(
        {
          created_by: account.id,
          organization: org,
          dispatcher: summary.dispatcher,
          month: month,
          year: year,
          percent_of_gross: summary.paymentTerms.percent_of_gross,
          percent_of_driver: summary.paymentTerms.percent_of_driver,
          to_pay: summary.toPayment,
          ex_rate: ex_rate,
          income_tax: summary.paymentTerms.income_tax,
        } as PaymentToDispatcherCreate,
        records,
        additionalRecords,
        finesRecords,
      )
    }

    for (const employeeId of processing.value) {
      mapping.value.clear(employeeId)
      additional_payments.value.clear(employeeId)
      fines.value.clear(employeeId)
    }
    processing.value = []
  }

  return { loading, dispatchers, processing, createPayment }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportDispatcher, import.meta.hot))
}
