import { groupBy } from '@/utils/group-by.ts'
import dayjs, { Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import type { Order, OrderEnriched } from '@/stores/orders.ts'
import type { SettlementEmployee } from '@/stores/employee_settlements.ts'
import type { User } from '@/stores/users.ts'
import type {
  EmployeePaymentRecord,
  EmployeePaymentSummary,
  PaymentTerms,
} from '@/stores/employee_unpaid_orders.ts'

dayjs.extend(isoWeek)

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

export interface ContractCommissionDetail {
  vehicle_id: number
  vehicle_unit_id: string
  vehicle_type_name: string
  orders_count: number
  total_gross: number
  dispatch_fee_percent: number
  dispatcher_commission_percent: number
  commission_amount: number
}

export interface WeeklyContractCommission {
  employee_id: number
  week: number
  year: number
  total_commission: number
  details_count: number
  details: ContractCommissionDetail[]
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
    .select('*, events:order_events(*)')
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

  const { data: contractVehiclesData } = await supabase
    .from('vehicles')
    .select('id, unit_id, kind')
    .eq('contract', true)
  const vehicleMap = new Map<number, { unit_id: string; kind: string }>()
  contractVehiclesData?.forEach((v) => vehicleMap.set(v.id, { unit_id: v.unit_id, kind: v.kind }))

  const { data: vehicleTypesData } = await supabase.from('vehicle_type').select('id, name')
  const vehicleTypeMap = new Map<string, number>()
  vehicleTypesData?.forEach((vt) => vehicleTypeMap.set(vt.name, vt.id))

  const { data: tiersData } = await supabase
    .from('vehicle_commission_tiers')
    .select('*')
    .eq('deleted', false)
  const tiersByVehicleType = groupBy(
    (tiersData || []) as CommissionTier[],
    (t) => t.vehicle_type_id,
  )

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

    let orders_number = 0
    let orders_number_contract = 0
    let orders_amount = 0
    let orders_driver = 0
    let orders_profit = 0
    let orders_amount_direct = 0
    let orders_driver_direct = 0
    let orders_profit_direct = 0
    let orders_amount_contract = 0
    let missedWorkingDays = 0
    let toPayment = 0

    const orders = new Map<number, Order>()
    const orderToVehicle = new Map<number, number>()
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
    const vehicleContractData = new Map<number, { totalGross: number; orderCount: number }>()

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

        // console.log('p.order', p.order)

        const sortedEvents = [...p.order.events].sort((a, b) => {
          return new Date(a.datetime) - new Date(b.datetime)
        })

        let vehicleId
        for (const event of sortedEvents) {
          if (event.kind === 'agreement') {
            // console.log('event agreement', event)
            if (vehicleId) {
              console.log('p.order', p.order)
              throw 'two vehicles: ' + vehicleId + ' and ' + event.vehicle
            }
            vehicleId = event.vehicle
          } else if (event.kind === 'change') {
            // console.log('event change', event)
            vehicleId = event.vehicle
          }
        }

        // console.log('vehicleId', vehicleId)

        if (vehicleId && vehicleMap.has(vehicleId)) {
          if (pc != 1) {
            throw 'unexpected pc ' + pc
          }
          console.log('contract', vehicleId)
          orders_number_contract += 1
          orders_amount_contract += costVal * pc

          const d = vehicleContractData.get(vehicleId) || { totalGross: 0, orderCount: 0 }

          d.totalGross += costVal * pc
          d.orderCount += 1
          vehicleContractData.set(vehicleId, d)

          orderToVehicle.set(p.order.id, vehicleId)
        } else {
          orders_number += 1
          orders_amount += costVal * pc
          orders_driver += driverCostVal * pc
          orders_profit += profit * pc
        }
      }

      const num = Number(paymentsByOrder.get(p.order.id)) || 0
      paymentsByOrder.set(p.order.id, num + p.order.driver_cost)

      orders.set(p.order.id, p.order)
    })

    const contractDetails: ContractCommissionDetail[] = []

    for (const [vehicleId, data] of vehicleContractData) {
      const vehicle = vehicleMap.get(vehicleId)
      if (!vehicle) throw 'unexpected: unknown vehicle ' + vehicleId

      const vehicleTypeId = vehicleTypeMap.get(vehicle.kind)
      if (!vehicleTypeId) throw 'unexpected: unknown vehicle type ' + vehicle.kind

      const vehicleTiers = tiersByVehicleType.get(vehicleTypeId) || []
      if (vehicleTiers.length === 0) throw 'unexpected: no vehicle tiers ' + vehicle.kind

      const sortedTiers = [...vehicleTiers].sort((a, b) => a.gross - b.gross)
      let matchedTier = sortedTiers[sortedTiers.length - 1]
      for (const tier of sortedTiers) {
        if (data.totalGross <= tier.gross) {
          matchedTier = tier
          break
        }
      }

      const commissionAmount = (data.totalGross * matchedTier.dispatcher_commission) / 100

      contractDetails.push({
        vehicle_id: vehicleId,
        vehicle_unit_id: vehicle.unit_id,
        vehicle_type_name: vehicle.kind,
        orders_count: data.orderCount,
        total_gross: data.totalGross,
        dispatch_fee_percent: matchedTier.dispatch_fee,
        dispatcher_commission_percent: matchedTier.dispatcher_commission,
        commission_amount: commissionAmount,
      })

      toPayment += commissionAmount
    }

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
        orders_number_contract: orderToVehicle.size,
        vehicle: 0,
        orders_amount: orders_amount,
        orders_driver: orders_driver,
        orders_profit: orders_profit,
        orders_amount_direct: orders_amount_direct,
        orders_driver_direct: orders_driver_direct,
        orders_profit_direct: orders_profit_direct,
        orders_amount_contract: orders_amount_contract,
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
        contract_details: contractDetails,
        contract_commission_total: contractDetails.reduce((sum, d) => sum + d.commission_amount, 0),
        orderToVehicle: orderToVehicle,
      } as EmployeePaymentSummary,
    })
  }

  list.sort((a, b) => b.summary.payout_usd - a.summary.payout_usd)

  return list
}

export async function calculateWeeklyContractCommission(
  orgId: number | null,
  week: number,
  year: number,
  filterEmployeeId?: number,
): Promise<WeeklyContractCommission[]> {
  if (!orgId) return []

  const { data: contractVehiclesData } = await supabase
    .from('vehicles')
    .select('id, unit_id, kind')
    .eq('contract', true)
  const vehicleMap = new Map<number, { unit_id: string; kind: string }>()
  contractVehiclesData?.forEach((v) => vehicleMap.set(v.id, { unit_id: v.unit_id, kind: v.kind }))
  if (vehicleMap.size === 0) return []

  const { data: vehicleTypesData } = await supabase.from('vehicle_type').select('id, name')
  const vehicleTypeMap = new Map<string, number>()
  vehicleTypesData?.forEach((vt) => vehicleTypeMap.set(vt.name, vt.id))

  const { data: tiersData } = await supabase
    .from('vehicle_commission_tiers')
    .select('*')
    .eq('deleted', false)
  const tiersByVehicleType = groupBy(
    (tiersData || []) as CommissionTier[],
    (t) => t.vehicle_type_id,
  )

  const { data: stagesData } = await supabase
    .from('stages')
    .select('id')
    .eq('is_ready_for_payout', true)
  const readyStageIds = new Set((stagesData || []).map((s: any) => s.id))
  if (readyStageIds.size === 0) return []

  const startOfWeek = dayjs().year(year).isoWeek(week).startOf('isoWeek')
  const endOfWeek = dayjs().year(year).isoWeek(week).endOf('isoWeek')

  const response = await supabase
    .from('orders_journal')
    .select()
    .eq('organization', orgId)
    .gte('created_at', startOfWeek.format('YYYY-MM-DD HH:mm:ss'))
    .lte('created_at', endOfWeek.format('YYYY-MM-DD HH:mm:ss'))
  const allOrders = (response.data || []) as Order[]

  const { data: eventsData } = await supabase.from('order_events').select('document, vehicle')
  const orderVehicleMap = new Map<number, number>()
  if (eventsData) {
    for (const event of eventsData as Array<{ document: number; vehicle: number }>) {
      orderVehicleMap.set(event.document, event.vehicle)
    }
  }

  const employeeVehicleData = new Map<
    number,
    Map<number, { totalGross: number; orderCount: number }>
  >()

  for (const order of allOrders) {
    if (order.excluded || !readyStageIds.has(order.stage)) continue

    const vehicleId = orderVehicleMap.get(order.id)
    if (!vehicleId || !vehicleMap.has(vehicleId)) continue

    const vehicle = vehicleMap.get(vehicleId)!
    if (!vehicleTypeMap.has(vehicle.kind)) continue

    if (!employeeVehicleData.has(order.created_by)) {
      employeeVehicleData.set(order.created_by, new Map())
    }
    const vehicleData = employeeVehicleData.get(order.created_by)!

    const d = vehicleData.get(vehicleId) || { totalGross: 0, orderCount: 0 }
    d.totalGross += order.cost
    d.orderCount += 1
    vehicleData.set(vehicleId, d)
  }

  const result: WeeklyContractCommission[] = []

  for (const [empId, vehicles] of employeeVehicleData) {
    const details: ContractCommissionDetail[] = []

    for (const [vId, data] of vehicles) {
      const vehicle = vehicleMap.get(vId)!
      const vehicleTypeId = vehicleTypeMap.get(vehicle.kind)
      if (!vehicleTypeId) continue

      const vehicleTiers = tiersByVehicleType.get(vehicleTypeId) || []
      if (vehicleTiers.length === 0) continue

      const sortedTiers = [...vehicleTiers].sort((a, b) => a.gross - b.gross)
      let matchedTier = sortedTiers[sortedTiers.length - 1]
      for (const tier of sortedTiers) {
        if (data.totalGross <= tier.gross) {
          matchedTier = tier
          break
        }
      }

      const commissionAmount = (data.totalGross * matchedTier.dispatcher_commission) / 100

      details.push({
        vehicle_id: vId,
        vehicle_unit_id: vehicle.unit_id,
        vehicle_type_name: vehicle.kind,
        orders_count: data.orderCount,
        total_gross: data.totalGross,
        dispatch_fee_percent: matchedTier.dispatch_fee,
        dispatcher_commission_percent: matchedTier.dispatcher_commission,
        commission_amount: commissionAmount,
      })
    }

    if (details.length > 0) {
      result.push({
        employee_id: empId,
        week,
        year,
        total_commission: details.reduce((sum, d) => sum + d.commission_amount, 0),
        details_count: details.length,
        details,
      })
    }
  }

  if (filterEmployeeId !== undefined) {
    return result
      .filter((r) => r.employee_id === filterEmployeeId)
      .sort((a, b) => b.total_commission - a.total_commission)
  }

  return result.sort((a, b) => b.total_commission - a.total_commission)
}

export async function loadDispatcherPerformanceReport(
  orgId: number,
  from: string,
  to: string,
): Promise<EmployeeReportRecord[]> {
  const { data: ordersData, error } = await supabase
    .from('orders_journal')
    .select()
    .eq('organization', orgId)
    .gte('created_at', from)
    .lte('created_at', to + ' 23:59:59')

  if (error || !ordersData) {
    console.error('Error loading orders:', error?.message)
    return []
  }

  const allOrders = ordersData as Order[]

  // Only include orders in payment-ready or completed stages
  const performanceStages = new Set([12, 13, 14, 15])
  const activeOrders = allOrders.filter((o) => !o.excluded && performanceStages.has(o.stage))

  const orderIds = activeOrders.map((o) => o.id)
  const batchSize = 100
  const eventBatches: any[] = []
  for (let i = 0; i < orderIds.length; i += batchSize) {
    const batch = orderIds.slice(i, i + batchSize)
    eventBatches.push(
      supabase
        .from('order_events')
        .select('document, vehicle, datetime')
        .in('document', batch)
        .in('kind', ['agreement', 'change']),
    )
  }
  const batchResults = await Promise.all(eventBatches)
  const eventsData = batchResults.flatMap((r) => r.data || [])

  // Build global order → vehicle map (last chronologically wins)
  const globalOrderToVehicle = new Map<number, number>()
  if (eventsData && eventsData.length > 0) {
    const grouped = groupBy(
      eventsData as Array<{ document: number; vehicle: number; datetime: string }>,
      (e) => e.document,
    )
    for (const [docId, events] of grouped) {
      events.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
      const lastEvent = events[events.length - 1]
      if (lastEvent.vehicle) {
        globalOrderToVehicle.set(Number(docId), lastEvent.vehicle)
      }
    }
  }

  const dispatcherOrders = groupBy(activeOrders, (o) => o.created_by)
  const userStore = useUsersStore()
  const result: EmployeeReportRecord[] = []

  for (const [dispatcherId, orders] of dispatcherOrders) {
    const empId = Number(dispatcherId)
    const ordersMap = new Map<number, Order>()
    const empOrderToVehicle = new Map<number, number>()

    let totalCost = 0
    let totalDriverCost = 0

    for (const order of orders) {
      ordersMap.set(order.id, order)
      totalCost += order.cost
      totalDriverCost += order.driver_cost

      const vId = globalOrderToVehicle.get(order.id)
      if (vId) {
        empOrderToVehicle.set(order.id, vId)
      }
    }

    const profit = totalCost - totalDriverCost

    result.push({
      user: (await userStore.resolve(empId)) as User,
      summary: {
        employee: empId,
        orders_number: orders.length,
        orders_number_contract: 0,
        vehicle: 0,
        orders_amount: totalCost,
        orders_driver: totalDriverCost,
        orders_profit: profit,
        orders_amount_direct: 0,
        orders_driver_direct: 0,
        orders_profit_direct: 0,
        orders_amount_contract: 0,
        toPayment: 0,
        orders: ordersMap,
        orders_in_progress: new Map(),
        paymentsByOrder: new Map(),
        paymentTerms: {
          created_by: 0,
          organization: orgId,
          user_id: empId,
          percent_of_gross: 0,
          percent_of_profit: 0,
          fixed_salary: 0,
          income_tax: 0,
        },
        settlements: [],
        settlements_total: 0,
        vacation_amount: 0,
        advance_amount: 0,
        settlement_fine: 0,
        missed_days: 0,
        payout_usd: profit,
        contract_details: [],
        contract_commission_total: 0,
        orderToVehicle: empOrderToVehicle,
      },
    })
  }

  result.sort((a, b) => b.summary.payout_usd - a.summary.payout_usd)
  return result
}

interface CommissionTier {
  vehicle_type_id: number
  gross: number
  dispatch_fee: number
  dispatcher_commission: number
}
