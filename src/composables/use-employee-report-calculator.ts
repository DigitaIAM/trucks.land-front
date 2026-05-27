import { groupBy } from '@/utils/group-by.ts'
import dayjs, { Dayjs } from 'dayjs'
import type { Order, OrderEnriched } from '@/stores/orders.ts'
import type { SettlementEmployee } from '@/stores/employee_settlements.ts'
import type { User } from '@/stores/users.ts'
import type {
  EmployeePaymentRecord,
  EmployeePaymentSummary,
  PaymentTerms,
} from '@/stores/employee_unpaid_orders.ts'

export interface EmployeeReportRecord {
  user: User
  summary: EmployeePaymentSummary
}

interface Absence {
  id?: number
  employee: string | number
  start_date: string
  end_date: string
}

export function getWorkingDaysInRange(startDate: Dayjs, endDate: Dayjs) {
  let start = startDate
  const end = endDate
  let workingDays = 0

  while (!start.isAfter(end, 'day')) {
    if (start.day() !== 0) {
      workingDays++
    }
    start = start.add(1, 'day')
  }
  return workingDays
}

export async function loadOrdersInProgress(orgId: number | null) {
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

export async function loadUnpaidOrders(orgId: number | null) {
  const requestPayments = supabase
    .from('employee_unpaid_orders')
    .select('*')
    .eq('organization', orgId)

  const responsePayments = await requestPayments

  const map = new Map<number, Array<EmployeePaymentRecord>>()

  if (responsePayments.data && responsePayments.data.length > 0) {
    responsePayments.data.forEach((json) => {
      const createdBy = Number(json['created_by'] || json['employee'])
      if (createdBy) {
        const record = {
          employee: createdBy,
          employee_payment: 0,
          order: json as OrderEnriched,
        } as EmployeePaymentRecord

        const list = map.get(createdBy) ?? []
        list.push(record)
        map.set(createdBy, list)
      }

      const vehicleFoundBy = Number(json['vehicle_found_by'])
      if (vehicleFoundBy) {
        const record = {
          employee: vehicleFoundBy,
          employee_payment: 0,
          order: json as OrderEnriched,
        } as EmployeePaymentRecord

        const list = map.get(vehicleFoundBy) ?? []
        list.push(record)
        map.set(vehicleFoundBy, list)
      }
    })
  }

  return map
}

export async function loadUnpaidSettlements(orgId: number | null, userId: number | null) {
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

export async function calculateEmployeeReport(
  orgId: number | null,
  ordersInProcessing: Map<number, Array<Order>>,
  mapping: Map<number, Array<EmployeePaymentRecord>>,
  settlements: Map<number, Array<SettlementEmployee>>,
) {
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

  const absencesList = (response.data || []) as Absence[]

  const userStore = useUsersStore()

  const activeUserIds = new Set(
    [...mapping.keys(), ...settlements.keys()]
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
    console.error('Error supabase:', responseTerms.error.message)
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

  const list = [] as EmployeeReportRecord[]

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

    const employeeRecords = mapping.get(employee) || []

    employeeRecords.forEach((p) => {
      // const order =
      //   p.order && typeof p.order === 'object' ? JSON.parse(JSON.stringify(p.order)) : p.order

      if (!p.order || !p.order.id) return

      if (p.order.excluded || p.order.stage === 3) {
        // ignore
      } else {
        const costVal = p.order.cost
        const driverCostVal = p.order.driver_cost
        const profit = costVal - driverCostVal

        const createdBy = p.order.created_by
        const vehicleFoundBy = p.order.vehicle_found_by

        if (vehicleFoundBy && vehicleFoundBy === employee) {
          const percent = p.order.percent_vf || 100
          const currentPc = percent / 100

          orders_amount_direct += costVal * currentPc
          orders_driver_direct += driverCostVal * currentPc
          orders_profit_direct += profit * currentPc
        }

        let pc = 1
        if (vehicleFoundBy) {
          if (vehicleFoundBy === createdBy && vehicleFoundBy === employee) {
            pc = 0
          } else if (vehicleFoundBy !== employee) {
            const percent = p.order.percent_vf || 100
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
      paymentsByOrder.set(p.order.id, num + p.order.driver_cost)

      orders.set(p.order.id, p.order)
    })

    const settlementsRecords = [] as Array<SettlementEmployee>
    let settlementsTotal = 0
    let vacationTotal = 0
    let advanceTotal = 0
    let fine = 0

    settlements.get(employee)?.forEach((v) => {
      if (v.employee == employee) {
        settlementsRecords.push(v)

        if (String(v.settlement_type) === 'vacation pay') {
          vacationTotal += Number(v.amount)
        } else if (String(v.settlement_type) === 'advance') {
          advanceTotal += Number(v.amount)
        } else if (String(v.settlement_type) === 'fine') {
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
      const fixedSalary = Number(employeeTerms.fixed_salary) || 0
      const totalWorkingDays = getWorkingDaysInRange(from, till) || 0

      const employeeAbsences = absencesList?.filter((a) => Number(a.employee) === employee) || []

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

      const salaryPerDay = totalWorkingDays > 0 ? fixedSalary / totalWorkingDays : 0
      const actualDaysWorked = Math.max(0, totalWorkingDays - missedWorkingDays)
      toPayment += actualDaysWorked * salaryPerDay
    }

    const listOfOrdersInProcessing = ordersInProcessing.get(employee) || ([] as Array<Order>)

    const orders_in_progress = new Map<number, Order>()
    listOfOrdersInProcessing.forEach((order) => orders_in_progress.set(order.id, order))

    const finalToPayment = Number(toPayment) || 0
    const finalSettlements = Number(settlementsTotal) || 0

    list.push({
      user: (await userStore.resolve(employee)) as User,
      summary: {
        employee: employee,
        orders_number: orders.size,
        vehicle: 0,
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
        advance_amount: advanceTotal,
        settlement_fine: fine,
        missed_days: missedWorkingDays,
        payout_usd:
          Number(finalToPayment || 0) + Number(finalSettlements || 0) - Math.abs(Number(fine || 0)),
      } as EmployeePaymentSummary,
    })
  }

  list.sort((a, b) => b.summary.payout_usd - a.summary.payout_usd)

  return list
}
