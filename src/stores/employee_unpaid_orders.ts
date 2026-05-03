import { acceptHMRUpdate, defineStore } from 'pinia'
import { groupBy } from '@/utils/group-by.ts'
import dayjs, { Dayjs } from 'dayjs'

export interface EmployeePaymentRecord {
  employee: number
  order: Order
}

export interface EmployeePaymentSummary {
  employee: number
  orders_number: number
  vehicle: number
  orders_amount: number
  orders_driver: number
  orders_profit: number
  orders_amount_direct: number
  orders_driver_direct: number
  orders_profit_direct: number
  toPayment: number
  orders: Map<number, Order>
  orders_in_progress: Map<number, Order>
  paymentsByOrder: Map<number, number>
  paymentTerms: PaymentTerms
  settlements_total: number
  vacation_amount: number
  settlement_fine: number
  missed_days: number
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

interface Absence {
  id?: number
  employee: string | number
  start_date: string
  end_date: string
}

export interface EmployeePaymentSummaryInDetails {
  order: Order
  agreements: Array<OrderEvent>
}

export const useReportDispatcher = defineStore('employee_unpaid_orders', () => {
  const ordersInProcessing = ref(new Map<number, Array<Order>>())
  const mapping = ref(new Map<number, Array<EmployeePaymentRecord>>())
  const settlements = ref(new Map<number, Array<SettlementEmployee>>())
  const processing = ref<Array<number>>([])

  const report = ref<Array<Record>>([])

  const searchQuery = ref<string | null>(null)
  const absencesList = ref<Absence[]>([])

  async function loading(orgId: number | null, userId: number | null) {
    ordersInProcessing.value = await load_orders_in_progress(orgId)

    mapping.value = await load_unpaid_orders(orgId, userId)

    settlements.value = await load_unpaid_settlements(orgId, userId)

    report.value = await calculate_report(orgId)
  }

  async function load_orders_in_progress(orgId: number | null) {
    const response = await supabase
      .from('orders_journal')
      .select()
      .eq('organization', orgId)
      .is('year', null)
      .gte('created_at', '2026-02-24')

    if (response.status == 200) {
      return groupBy(
        response.data!.map((json) => json as Order),
        (v) => v.created_by,
      )
    } else {
      throw 'fail to load orders in progress'
    }
  }

  async function load_unpaid_orders(orgId: number | null, userId: number | null) {
    let requestPayments = supabase
      .from('employee_unpaid_orders')
      .select('*')
      .eq('organization', orgId)

    const responsePayments = await requestPayments

    console.log('Сырые данные (заказы из базы):', responsePayments.data)

    const map = new Map<number, Array<EmployeePaymentRecord>>()

    if (responsePayments.data && responsePayments.data.length > 0) {
      responsePayments.data.forEach((json) => {
        // 1. Обработка created_by (создатель заказа)
        const createdBy = Number(json['created_by'] || json['employee'])
        if (createdBy) {
          const record = {
            employee: createdBy,
            employee_payment: 0,
            order: json as Order,
          } as EmployeePaymentRecord

          const list = map.get(createdBy) ?? []
          list.push(record)
          map.set(createdBy, list)
        }

        // 2. Обработка vehicle_found_by (нашедший транспорт)
        const vehicleFoundBy = Number(json['vehicle_found_by'])
        if (vehicleFoundBy) {
          const record = {
            employee: vehicleFoundBy,
            employee_payment: 0,
            order: json as Order,
          } as EmployeePaymentRecord

          const list = map.get(vehicleFoundBy) ?? []
          list.push(record)
          map.set(vehicleFoundBy, list)
        }
      })
    }

    console.log('Заполненный mapping:', map)
    return map
  }

  async function load_unpaid_settlements(orgId: number | null, userId: number | null) {
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
    return settlementsMap
  }

  function getWorkingDaysInRange(startDate: Dayjs, endDate: Dayjs) {
    let start = startDate
    const end = endDate
    let workingDays = 0

    while (!start.isAfter(end, 'day')) {
      const dayOfWeek = start.day()
      if (dayOfWeek !== 0) {
        // 0 - это воскресенье, пропускаем его
        workingDays++
      }
      start = start.add(1, 'day')
    }
    return workingDays
  }

  async function calculate_report(orgId: number | null) {
    if (!orgId) {
      return []
    }

    const { data: lastPayment } = await supabase
      .from('employee_payments')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const from = dayjs(lastPayment?.created_at)
    const till = dayjs().subtract(1, 'day')

    const response = await supabase
      .from('employee_absences')
      .select('*')
      .lte('start_date', till.format('YYYY-MM-DD'))
      .gte('end_date', from.format('YYYY-MM-DD'))

    absencesList.value = response.data || []

    const userStore = useUsersStore()

    const activeUserIds = new Set(
      [...mapping.value.keys(), ...settlements.value.keys()]
        .filter((id) => id !== undefined && id !== null && !Number.isNaN(Number(id)))
        .map(Number),
    )

    const responseTerms = await supabase
      .from('user_conditions')
      .select(
        `
    *,
    users!user_conditions_user_id_fkey!inner(fired)
  `,
      )
      .eq('organization', orgId)
      .eq('users.fired', false)

    if (responseTerms.error) {
      console.error('Error Supabase:', responseTerms.error.message)
      return []
    }

    const allTermsData = responseTerms.data || []

    const terms = groupBy(
      allTermsData.map((v) => v as PaymentTerms),
      (v) => v.user_id,
    )

    const finalKeys = new Set([
      ...Array.from(activeUserIds).map(Number),
      ...allTermsData.map((t) => Number(t.user_id)),
    ])

    const list = [] as Record[]

    for (const employeeKey of finalKeys) {
      const employee = Number(employeeKey)

      let orders_amount = 0
      let orders_driver = 0
      let orders_profit = 0
      let orders_amount_direct = 0
      let orders_driver_direct = 0
      let orders_profit_direct = 0
      let missedWorkingDays = 0
      let toPayment = 0

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

      // Считываем записи для сотрудника (приводим ключ к строке, либо сравниваем безопасно)
      const employeeRecords =
        mapping.value.get(String(employee)) || mapping.value.get(employee) || []

      employeeRecords.forEach((p) => {
        const order =
          p.order && typeof p.order === 'object' ? JSON.parse(JSON.stringify(p.order)) : p.order

        if (!p.order || !p.order.id) return

        if (p.order.excluded || p.order.stage === 3) {
          // ignore
        } else {
          const costVal = Number(p.order.cost) || 0
          const driverCostVal = Number(p.order.driver_cost || p.order.driver_payment) || 0
          const profit = costVal - driverCostVal

          const createdBy = Number(p.order.created_by)
          const vehicleFoundBy = Number(p.order.vehicle_found_by)

          // 1. Прямая прибыль (Direct Profit) для нашедшего транспорт
          if (vehicleFoundBy && vehicleFoundBy === employee) {
            const percent = Number(p.order.percent_vf) || 100
            const currentPc = percent / 100

            orders_amount_direct += costVal * currentPc
            orders_driver_direct += driverCostVal * currentPc
            orders_profit_direct += profit * currentPc
          }

          // 2. Обычный Gross / Profit
          let pc = 1
          if (vehicleFoundBy) {
            if (vehicleFoundBy === createdBy && vehicleFoundBy === employee) {
              pc = 0
            } else if (vehicleFoundBy !== employee) {
              const percent = Number(p.order.percent_vf) || 100
              pc = (100 - percent) / 100
            } else {
              pc = 0
            }
          }

          orders_amount += costVal * pc
          orders_driver += driverCostVal * pc
          orders_profit += profit * pc
        }

        const num = Number(paymentsByOrder.get(p.order.id)) || 0
        const driverCost = Number(p.order.driver_cost || p.order.driver_payment || 0)
        paymentsByOrder.set(p.order.id, num + driverCost)

        orders.set(p.order.id, p.order)
      })

      const settlementsRecords = [] as Array<SettlementEmployee>
      let settlementsTotal = 0
      let vacationTotal = 0
      let fine = 0

      settlements.value.get(employee)?.forEach((v) => {
        if (v.employee == employee) {
          settlementsRecords.push(v)

          if (v.settlement_type === 'vacation pay') {
            vacationTotal += Number(v.amount)
          } else if (v.settlement_type === 'fine') {
            fine += Number(v.amount)
          } else {
            settlementsTotal += Number(v.amount)
          }
        }
      })

      const totalGross = (orders_amount || 0) + (orders_amount_direct || 0)
      const totalProfit = (orders_profit || 0) + (orders_profit_direct || 0)

      if (employeeTerms?.percent_of_gross) {
        toPayment += (totalGross * employeeTerms.percent_of_gross) / 100
      }
      if (employeeTerms.percent_of_profit) {
        toPayment += (totalProfit * employeeTerms.percent_of_profit) / 100
      }
      if (employeeTerms.fixed_salary) {
        const fixedSalary = Number(employeeTerms?.fixed_salary) || 0
        const totalWorkingDaysInPeriod = getWorkingDaysInRange(from, till)
        const employeeAbsences = absencesList.value?.filter((a) => a.employee === employee) || []

        employeeAbsences.forEach((absence) => {
          let absenceStart = dayjs(absence.start_date).isAfter(from)
            ? dayjs(absence.start_date)
            : from

          const absenceEnd = dayjs(absence.end_date).isBefore(till) ? dayjs(absence.end_date) : till

          while (!absenceStart.isAfter(absenceEnd, 'day')) {
            if (absenceStart.day() !== 0) {
              missedWorkingDays++
            }
            absenceStart = absenceStart.add(1, 'day')
          }
        })

        const totalDaysInPeriod = getWorkingDaysInRange(from, till) || 0
        const salaryPerDay = totalDaysInPeriod > 0 ? fixedSalary / totalDaysInPeriod : 0

        const missed = Number(missedWorkingDays) || 0

        const actualDaysWorked = Math.max(0, totalWorkingDaysInPeriod - missed)
        toPayment += actualDaysWorked * salaryPerDay
      }

      const listOfOrdersInProcessing =
        ordersInProcessing.value.get(employee) || ([] as Array<Order>)

      const orders_in_progress = new Map<number, Order>()
      listOfOrdersInProcessing.forEach((order) => orders_in_progress.set(order.id, order))

      const finalToPayment = Number(toPayment) || 0
      const finalSettlements = Number(settlementsTotal) || 0

      list.push(<Record>{
        user: await userStore.resolve(employee),
        summary: {
          employee: employee,
          orders_number: orders.size,
          orders_amount: orders_amount,
          orders_driver: orders_driver,
          orders_profit: orders_profit,
          orders_amount_direct: orders_amount_direct,
          orders_driver_direct: orders_driver_direct,
          orders_profit_direct: orders_profit_direct,
          toPayment: toPayment,
          orders: orders,
          orders_in_progress: orders_in_progress,
          paymentsByOrder: paymentsByOrder,
          paymentTerms: employeeTerms,
          settlements: settlementsRecords,
          settlements_total: settlementsTotal,
          vacation_amount: vacationTotal,
          settlement_fine: fine,
          missed_days: missedWorkingDays,
          payout:
            Number(finalToPayment || 0) +
            Number(finalSettlements || 0) -
            Math.abs(Number(fine || 0)),
        } as EmployeePaymentSummary,
      })
    }

    list.sort((a, b) => b.summary.payout - a.summary.payout)

    console.log('list', list)

    return list
  }

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
          } as PaymentToDispatcherOrderCreate)
        } else {
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
      }

      // const settlementsRecords = []
      // for (const settlement of summary.settlements.values()) {
      //   settlementsRecords.push({
      //     doc_payment: -1,
      //     doc_settlements: settlement.id,
      //     amount: settlement.amount,
      //     settlement_type: settlement.settlement_type,
      //   } as EmployeePaymentSettlementsCreate)
      // }

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
        // settlementsRecords,
      )

      mapping.value.delete(currentEmployeeId)

      settlements.value.delete(currentEmployeeId)

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

  return { loading, employees, processing, createPayment, searchAndListing }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportDispatcher, import.meta.hot))
}
