import { acceptHMRUpdate, defineStore } from 'pinia'
import { groupBy } from '@/utils/group-by.ts'
import type { User } from '@/stores/users.ts'

export interface EmployeePaymentRecord {
  employee: number
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
  user_id: number
  percent_of_gross: number
  percent_of_profit: number
  fixed_salary: number
  income_tax: number
}

interface Record {
  user: User
  summary: EmployeePaymentSummary
}

export const useReportDispatcher = defineStore('employee_unpaid_orders', () => {
  const org = ref<number | null>(null)
  const mapping = ref(new Map<number, Array<EmployeePaymentRecord>>())
  const settlements = ref(new Map<number, Array<SettlementEmployee>>())
  const processing = ref<Array<number>>([])

  const searchQuery = ref<string | null>(null)

  async function loading(orgId: number | null, userId: number | null) {
    org.value = orgId
    let requestPayments = supabase
      .from('employee_unpaid_orders')
      .select('*')
      .eq('organization', orgId)

    if (userId) {
      requestPayments = requestPayments.or(
        'created_by.eq.' + userId + ',vehicle_found_by.eq.' + userId,
      )
    }

    const responsePayments = await requestPayments

    const map = new Map<number, Array<EmployeePaymentRecord>>()
    responsePayments.data?.forEach((json) => {
      const record = {
        employee: json['created_by'],
        employee_payment: 0,
        order: json as Order,
      } as EmployeePaymentRecord

      const key = record.employee
      const list = map.get(key) ?? []
      list.push(record)
      map.set(key, list)

      if (json['vehicle_found_by']) {
        const record = {
          employee: json['vehicle_found_by'],
          employee_payment: 0,
          order: json as Order,
        } as EmployeePaymentRecord

        const key = record.employee
        const list = map.get(key) ?? []
        list.push(record)
        map.set(key, list)
      }
    })
    mapping.value = map

    let requestSettlements = supabase
      .from('employee_unpaid_settlements')
      .select()
      .eq('organization', orgId)

    if (userId) {
      requestSettlements = requestSettlements.eq('employee', userId)
    }

    const responseSettlements = await requestSettlements

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

  const report = computedAsync(async () => {
    const orgId = org.value
    if (!orgId) {
      return []
    }

    const userStore = useUsersStore()

    const paymentsMap = mapping.value
    const settlementsMap = settlements.value

    const keys = new Set([...paymentsMap.keys(), ...settlementsMap.keys()])

    const responseTerms = await supabase
      .from('user_conditions')
      .select()
      .eq('organization', orgId)
      .in('user_id', Array.from(keys.values()))

    const terms = groupBy(
      responseTerms.data!.map((v) => v as PaymentTerms),
      (v) => v.user_id,
    )

    const list = [] as Record[]

    for (const employee of keys) {
      let orders_amount = 0
      let orders_driver = 0
      let orders_profit = 0

      const orders = new Map<number, Order>()
      const paymentsByOrder = new Map<number, number>()

      const employeeTerms = (terms.get(employee)?.at(0) || {
        created_by: 1,
        organization: orgId,
        user_id: employee,
        percent_of_gross: 0,
        percent_of_profit: 0,
        fixed_salary: 0,
        income_tax: 0,
      }) as PaymentTerms

      paymentsMap.get(employee)?.forEach((p) => {
        if (p.order.excluded) {
          // ignore
        } else {
          const profit = p.order.cost - p.order.driver_cost
          let pc = 1
          if (p.order.vehicle_found_by) {
            if (p.order.vehicle_found_by == employee) {
              pc = p.order.percent_vf / 100
            } else {
              pc = (100 - p.order.percent_vf) / 100
            }
          }
          orders_amount += p.order.cost * pc
          orders_driver += p.order.driver_cost * pc
          orders_profit += profit * pc
        }

        const num = paymentsByOrder.get(p.order.id) ?? 0
        paymentsByOrder.set(p.order.id, num + p.order.driver_cost)

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
      if (employeeTerms.percent_of_gross) {
        toPayment += (orders_amount * employeeTerms.percent_of_gross) / 100
      }
      if (employeeTerms.percent_of_profit) {
        toPayment += (orders_profit * employeeTerms.percent_of_profit) / 100
      }
      if (employeeTerms.fixed_salary) {
        toPayment += employeeTerms.fixed_salary
      }
      if (employeeTerms.fixed_salary && employeeTerms.percent_of_profit) {
        toPayment +=
          (orders_profit * employeeTerms.percent_of_profit) / 100 + employeeTerms.fixed_salary
      }

      list.push(<Record>{
        user: await userStore.resolve(employee),
        summary: {
          employee: employee,
          orders_number: orders.size,
          orders_amount: orders_amount,
          orders_driver: orders_driver,
          orders_profit: orders_profit,
          toPayment: toPayment,
          orders: orders,
          paymentsByOrder: paymentsByOrder,
          paymentTerms: employeeTerms,
          settlements: settlementsRecords,
          settlements_total: settlementsTotal,
          payout: toPayment + settlementsTotal,
        } as EmployeePaymentSummary,
      })
    }

    console.log('list', list)

    list.sort((a, b) => b.summary.payout - a.summary.payout)

    return list
  }, [])

  const employees = computed(() => {
    try {
      const list = report.value

      const str = searchQuery.value
      if (str) {
        console.log('str', str)

        const result = []
        for (const item of list) {
          if (item.user && item.user.real_name && item.user.real_name.toLowerCase().includes(str)) {
            result.push(item.summary)
          }
        }

        return result
      } else {
        const result = []
        for (const item of list) {
          result.push(item.summary)
        }
        return result
      }
    } catch (e) {
      console.log('error', e)
    }
    return []
  })

  async function createPayment(org: number, year: number, month: number, ex_rate: number) {
    const paymentToEmployeeStore = usePaymentToEmployeeStore()

    const data = report.value.slice()
    for (const record of data) {
      const summary = record.summary

      mapping.value.delete(processing.value[1])
      settlements.value.delete(processing.value[1])

      processing.value = [summary.employee, processing.value[0]]

      const records = []

      for (const order of summary.orders.values()) {
        if (
          order.vehicle_found_by == summary.employee &&
          order.vehicle_found_by != order.created_by
        ) {
          records.push({
            doc_payment: -1,
            doc_order: order.id,
            order_cost: order.cost,
            driver_cost: order.driver_cost,
            profit_kind: 'direct',
          } as PaymentToDispatcherOrderCreate)
        } else {
          records.push({
            doc_payment: -1,
            doc_order: order.id,
            order_cost: order.cost,
            driver_cost: order.driver_cost,
            profit_kind: 'profit',
          } as PaymentToDispatcherOrderCreate)
        }
      }

      const settlementsRecords = []
      for (const settlement of summary.settlements.values()) {
        settlementsRecords.push({
          doc_payment: -1,
          doc_settlements: settlement.id,
          amount: settlement.amount,
        } as EmployeePaymentSettlementsCreate)
      }

      await paymentToEmployeeStore.create(
        {
          organization: org,
          employee: summary.employee,
          month: month,
          year: year,
          percent_of_gross: summary.paymentTerms.percent_of_gross,
          percent_of_profit: summary.paymentTerms.percent_of_profit,
          fixed_salary: summary.paymentTerms.fixed_salary,
          to_pay: summary.toPayment,
          ex_rate: ex_rate,
          income_tax: summary.paymentTerms.income_tax,
        } as PaymentToEmployeeCreate,
        records,
        settlementsRecords,
      )
    }

    for (const employeeId of processing.value) {
      mapping.value.delete(employeeId)
      settlements.value.delete(employeeId)
    }
    processing.value = []
  }

  async function searchAndListing(text: string) {
    searchQuery.value = text
  }

  return { loading, employees, processing, createPayment, searchAndListing }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportDispatcher, import.meta.hot))
}
