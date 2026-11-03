import type { Order } from '@/stores/orders.ts'
import type { ExpensesToOwner } from '@/stores/owner_expenses.ts'
import type {
  OwnerPaymentRecord,
  OwnerPaymentSummary,
  OwnerOrderVehicle,
} from '@/stores/owner_unpaid_orders.ts'

export async function loadOwnerPayments(orgId: number | null) {
  const response = await supabase.from('owner_unpaid_orders').select().eq('organization', orgId)

  const rows = response.data ?? []

  const orderIds = rows.map((json) => Number(json['id'])).filter((id) => !Number.isNaN(id))

  interface OwnerReportEvent {
    company: number | null
    vehicle: number | null
    driver: number | null
    cost: number | null
    percent: number | null
    datetime: string | null
  }

  const agreementByOrder = new Map<number, Array<OwnerReportEvent>>()
  const changeByOrder = new Map<number, Array<OwnerReportEvent>>()
  const allVehicleIds = new Set<number>()

  for (let i = 0; i < orderIds.length; i += 100) {
    const batch = orderIds.slice(i, i + 100)
    const { data } = await supabase
      .from('order_events')
      .select('document, kind, company, vehicle, driver, cost, percent, datetime')
      .in('document', batch)
      .in('kind', ['agreement', 'change'])

    data?.forEach((ev) => {
      const document = Number(ev['document'])
      if (Number.isNaN(document)) return

      const event: OwnerReportEvent = {
        company: ev['company'] != null ? Number(ev['company']) : null,
        vehicle: ev['vehicle'] != null ? Number(ev['vehicle']) : null,
        driver: ev['driver'] != null ? Number(ev['driver']) : null,
        cost: ev['cost'] != null ? Number(ev['cost']) : null,
        percent: ev['percent'] != null ? Number(ev['percent']) : null,
        datetime: ev['datetime'] != null ? String(ev['datetime']) : null,
      }

      if (ev['kind'] === 'agreement') {
        const list = agreementByOrder.get(document) ?? []
        list.push(event)
        agreementByOrder.set(document, list)
      } else if (ev['kind'] === 'change') {
        const list = changeByOrder.get(document) ?? []
        list.push(event)
        changeByOrder.set(document, list)
      }

      if (event.vehicle != null) allVehicleIds.add(event.vehicle)
    })
  }

  rows.forEach((json) => {
    if (json['vehicle'] != null) allVehicleIds.add(Number(json['vehicle']))
  })

  const vehicleOwner = new Map<number, number>()
  const vehicleContract = new Map<number, boolean>()

  const vehicleIds = [...allVehicleIds]
  for (let i = 0; i < vehicleIds.length; i += 100) {
    const batch = vehicleIds.slice(i, i + 100)
    const { data } = await supabase.from('vehicles').select('id, owner, contract').in('id', batch)

    data?.forEach((v) => {
      const id = Number(v['id'])
      vehicleOwner.set(id, Number(v['owner']))
      vehicleContract.set(id, v['contract'] === true)
    })
  }

  const paymentsMap = new Map<number, Array<OwnerPaymentRecord>>()

  function pushRecord(
    owner: number | null | undefined,
    driverPayment: number,
    order: Order,
    vehicle: number | null,
    driver: number | null,
    contract: boolean,
    gross: number,
  ) {
    if (owner == null || Number.isNaN(Number(owner))) return

    const key = Number(owner)
    const list = paymentsMap.get(key) ?? []
    list.push({
      owner: key,
      driver_payment: driverPayment,
      order,
      vehicle,
      driver,
      contract,
      gross,
    } as OwnerPaymentRecord)
    paymentsMap.set(key, list)
  }

  function getEventAmount(event: OwnerReportEvent | undefined, order: Order) {
    if (!event) return 0
    if (event.percent != null) return ((Number(order.cost) || 0) * event.percent) / 100
    return event.cost ?? 0
  }

  function pickBaseAgreement(
    agreements: Array<OwnerReportEvent>,
    vehicle: number | null,
    driver: number | null,
  ) {
    if (agreements.length === 0) return undefined

    if (vehicle != null) {
      const byVehicle = agreements.find((agreement) => agreement.vehicle === vehicle)
      if (byVehicle) return byVehicle
    }

    if (driver != null) {
      const byDriver = agreements.find((agreement) => agreement.driver === driver)
      if (byDriver) return byDriver
    }

    return agreements.slice().sort((a, b) => {
      const aTime = a.datetime ? new Date(a.datetime).getTime() : 0
      const bTime = b.datetime ? new Date(b.datetime).getTime() : 0
      return bTime - aTime
    })[0]
  }

  rows.forEach((json) => {
    const order = json as Order
    const orderId = Number(json['id'])
    const rowOwner = json['owner'] != null ? Number(json['owner']) : null
    const rowVehicle = json['vehicle'] != null ? Number(json['vehicle']) : null
    const rowDriver = json['driver'] != null ? Number(json['driver']) : null

    const agreements = agreementByOrder.get(orderId) ?? []
    const baseAgreement = pickBaseAgreement(agreements, rowVehicle, rowDriver)

    const agreementVehicle = rowVehicle ?? baseAgreement?.vehicle ?? null
    const agreementDriver = rowDriver ?? baseAgreement?.driver ?? null
    const agreementOwner =
      rowOwner ??
      (agreementVehicle != null ? vehicleOwner.get(agreementVehicle) : undefined) ??
      baseAgreement?.company ??
      null

    const isContract =
      json['contract'] === true ||
      (agreementVehicle != null && vehicleContract.get(agreementVehicle) === true)

    const basePayment =
      json['driver_cost'] != null
        ? Number(json['driver_cost']) || 0
        : getEventAmount(baseAgreement, order)

    const changes = changeByOrder.get(orderId) ?? []
    const hasChange = changes.length > 0

    pushRecord(
      agreementOwner,
      basePayment,
      order,
      agreementVehicle,
      agreementDriver,
      isContract,
      isContract ? (hasChange ? basePayment : Number(order.cost) || 0) : 0,
    )

    changes.forEach((ev) => {
      const changeVehicle = ev.vehicle
      const changeOwner =
        ev.company ??
        (changeVehicle != null ? vehicleOwner.get(changeVehicle) : undefined) ??
        agreementOwner
      const changeContract =
        changeVehicle != null ? vehicleContract.get(changeVehicle) === true : false
      const changePayment = getEventAmount(ev, order)
      pushRecord(
        changeOwner,
        changePayment,
        order,
        changeVehicle,
        ev.driver,
        changeContract,
        changeContract ? changePayment : 0,
      )
    })
  })

  return paymentsMap
}

export async function loadOwnerExpenses(orgId: number | null) {
  const response = await supabase.from('owner_unpaid_expenses').select().eq('organization', orgId)

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
    const orderVehicles = new Map<number, Array<OwnerOrderVehicle>>()

    paymentsMap.get(owner)?.forEach((v) => {
      if (v.order.stage === 3) {
        // ignore
      } else {
        if (!orders.has(v.order.id)) {
          orders_amount += v.order.cost
        }
        owner_payment += v.driver_payment
      }

      const num = paymentsByOrder.get(v.order.id) ?? 0
      paymentsByOrder.set(v.order.id, num + v.driver_payment)

      orders.set(v.order.id, v.order)

      const list = orderVehicles.get(v.order.id) ?? []
      list.push({
        vehicle: v.vehicle,
        driver: v.driver,
        contract: v.contract,
        gross: v.gross,
        dp: v.driver_payment,
      } as OwnerOrderVehicle)
      orderVehicles.set(v.order.id, list)
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
      orderVehicles: orderVehicles,
      expenses: expensesRecords,
      expenses_total: expensesTotal,
      payout: owner_payment - expensesTotal,
    } as OwnerPaymentSummary)
  }

  list.sort((a, b) => b.payout - a.payout)

  return list
}
