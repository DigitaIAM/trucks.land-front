import { acceptHMRUpdate, defineStore } from 'pinia'
import {
  loadOrdersInProgress,
  loadUnpaidOrders,
  loadUnpaidSettlements,
  calculateEmployeeReport,
  loadDispatcherPerformanceReport,
} from '@/composables/use-employee-report-calculator.ts'
import type {
  EmployeeReportRecord,
  ContractCommissionDetail,
} from '@/composables/use-employee-report-calculator.ts'
import type { OrderEnriched } from '@/stores/orders.ts'

export interface EmployeePaymentRecord {
  employee: number
  order: OrderEnriched
}

export interface EmployeePaymentSummary {
  employee: number
  orders_number: number
  orders_number_contract: number
  vehicle: number
  orders_amount: number
  orders_driver: number
  orders_profit: number
  orders_amount_direct: number
  orders_driver_direct: number
  orders_profit_direct: number
  orders_amount_contract: number
  toPayment: number
  orders: Map<number, Order>
  orders_in_progress: Map<number, Order>
  paymentsByOrder: Map<number, number>
  paymentTerms: PaymentTerms
  settlements_total: number
  vacation_amount: number
  advance_amount: number
  settlement_fine: number
  missed_days: number
  settlements: Array<SettlementEmployee>
  payout_usd: number
  contract_details: Array<ContractCommissionDetail>
  contract_commission_total: number
  orderToVehicle: Map<number, number>
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

export interface EmployeePaymentSummaryInDetails {
  order: Order
  agreements: Array<OrderEvent>
}

export const useReportDispatcher = defineStore('employee_unpaid_orders', () => {
  const report = ref<Array<EmployeeReportRecord>>([])
  const processing = ref<Array<number>>([])
  const searchQuery = ref<string | null>(null)
  const dateFrom = ref<string>('')
  const dateTo = ref<string>('')

  async function loading(orgId: number | null, userId: number | null) {
    const ordersInProcessing = await loadOrdersInProgress(orgId)
    const mapping = await loadUnpaidOrders(orgId)
    const settlements = await loadUnpaidSettlements(orgId, userId)

    report.value = await calculateEmployeeReport(orgId, ordersInProcessing, mapping, settlements)
  }

  const employees = computed(() => {
    try {
      const list = report.value

      const str = searchQuery.value
      if (str) {
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
      const currentEmployeeId = summary.employee

      processing.value = [currentEmployeeId]

      const records = []

      for (const order of summary.orders.values()) {
        if (order.stage === 3) {
          records.push({
            doc_payment: -1,
            doc_order: order.id,
            order_cost: 0,
            driver_cost: 0,
            profit_kind: 'profit',
            profit_pc: 100,
          } as PaymentToDispatcherOrderCreate)
        } else {
          if (order.vehicle_found_by && order.vehicle_found_by != order.created_by) {
            if (order.vehicle_found_by == summary.employee) {
              const percent = Number(order.percent_vf) || 100

              records.push({
                doc_payment: -1,
                doc_order: order.id,
                order_cost: Number(order.cost) || 0,
                driver_cost: Number(order.driver_cost) || 0,
                profit_kind: 'direct-vehicle',
                profit_pc: percent,
              } as PaymentToDispatcherOrderCreate)
            } else {
              const percent = Number(order.percent_vf) || 100
              const currentPc = 100 - percent

              records.push({
                doc_payment: -1,
                doc_order: order.id,
                order_cost: Number(order.cost) || 0,
                driver_cost: Number(order.driver_cost) || 0,
                profit_kind: 'direct-dispatcher',
                profit_pc: currentPc,
              } as PaymentToDispatcherOrderCreate)
            }
          } else {
            records.push({
              doc_payment: -1,
              doc_order: order.id,
              order_cost: Number(order.cost) || 0,
              driver_cost: Number(order.driver_cost) || 0,
              profit_kind: 'profit',
              profit_pc: 100,
            } as PaymentToDispatcherOrderCreate)
          }
        }
      }

      const settlementsRecords = []
      for (const settlement of summary.settlements.values()) {
        settlementsRecords.push({
          doc_payment: -1,
          doc_settlements: settlement.id,
          amount: settlement.amount,
          settlement_type: settlement.settlement_type,
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

      // mapping.value.delete(currentEmployeeId)

      // settlements.value.delete(currentEmployeeId)

      const index = report.value.findIndex((r) => r.summary.employee === currentEmployeeId)
      if (index !== -1) {
        report.value.splice(index, 1)
      }
      processing.value = []
    }
  }

  async function searchAndListing(text: string) {
    searchQuery.value = text
  }

  async function loadPerformanceReport(orgId: number, from: string, to: string) {
    dateFrom.value = from
    dateTo.value = to
    report.value = await loadDispatcherPerformanceReport(orgId, from, to)
  }

  return { loading, employees, processing, createPayment, searchAndListing, loadPerformanceReport, dateFrom, dateTo }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportDispatcher, import.meta.hot))
}
