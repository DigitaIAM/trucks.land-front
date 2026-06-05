import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver'
import moment from 'moment-timezone'
import type { Fill } from 'exceljs/index'

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

async function fetchInChunks(table: string, ids: number[], filters: Record<string, any> = {}) {
  const chunks = chunkArray(ids, 50)
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      let query = supabase.from(table).select().in('document', chunk)
      Object.entries(filters).forEach(([key, val]) => {
        query = query.eq(key, val)
      })
      const res = await query
      return res.data ?? []
    }),
  )
  return results.flat()
}

export async function weekExportToExcel(
  documents: PaymentToOwnerSummary[],
  onProgress?: (current: number, total: number, status: string) => void,
) {
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('My Sheet')

  const paymentToOwnerOrdersStore = usePaymentToOwnerOrdersStore()
  const userStore = useUsersStore()
  const vehiclesStore = useVehiclesStore()
  const driversStore = useDriversStore()
  const ownerStore = useOwnersStore()
  const organizationsStore = useOrganizationsStore()
  const brokersStore = useBrokersStore()

  sheet.columns = [
    { header: '#', key: 'order', width: 10 },
    { header: 'ref', key: 'ref', width: 20 },
    { header: 'date', key: 'date', width: 20 },
    { header: 'unit', key: 'unit', width: 20 },
    { header: 'driver', key: 'driver', width: 30 },
    { header: 'owner', key: 'owner', width: 30 },
    { header: 'broker', key: 'broker', width: 30 },
    { header: 'from', key: 'from', width: 30 },
    { header: 'state', key: 'state_from', width: 10 },
    { header: 'date', key: 'date_from', width: 20 },
    { header: 'time', key: 'time_from', width: 20 },
    { header: 'to', key: 'to', width: 30 },
    { header: 'state', key: 'state_to', width: 10 },
    { header: 'date', key: 'date_to', width: 20 },
    { header: 'time', key: 'time_to', width: 20 },
    { header: 'dispatcher', key: 'dispatcher', width: 30 },
    { header: 'miles', key: 'miles', width: 10 },
    { header: 'gross', key: 'gross', width: 20 },
    { header: 'driver payment', key: 'd_payment', width: 20 },
    { header: 'profit', key: 'profit', width: 20 },
    { header: '%', key: 'percent', width: 20 },
    { header: 'note', key: 'note', width: 30 },
    { header: 'tranld', key: 'tranld', width: 20 },
    { header: 'tranDate', key: 'tranDate', width: 20 },
    { header: 'vendorRef', key: 'vendorRef', width: 30 },
    { header: 'payableAccountRef_ID', key: 'payableAccountRef_ID', width: 30 },
    {
      header: 'purchaseExpenseLine_category_ID',
      key: 'purchaseExpenseLine_category_ID',
      width: 30,
    },
    { header: 'purchaseExpenseLine_amount', key: 'purchaseExpenseLine_amount', width: 20 },
    { header: 'quick_pay', key: 'quick_pay', width: 20 },
    { header: 'direct_payment', key: 'direct_payment', width: 20 },
    { header: 'class', key: 'class', width: 20 },
    { header: 'week_number', key: 'week_number', width: 20 },
    { header: 'class_custom', key: 'class_custom', width: 20 },
    { header: 'Invoice_ExID', key: 'Invoice_ExID', width: 20 },
  ]

  const today = new Date().toISOString().split('T')[0]

  // ШАГ 1: загружаем все owner/org параллельно
  const ownerIds = [...new Set(documents.map((d) => d.owner))]
  const orgIds = [...new Set(documents.map((d) => d.organization))]

  onProgress?.(0, 4, 'Loading owners and organizations...')
  await Promise.all([
    ...ownerIds.map((id) => ownerStore.resolve(id)),
    ...orgIds.map((id) => organizationsStore.resolve(id)),
  ])

  // ШАГ 2: загружаем все orderLines для всех документов параллельно
  const allOrderLinesMap = new Map<number, PaymentToOwnerOrder[]>()

  onProgress?.(1, 4, 'Loading order lines...')
  await Promise.all(
    documents.map(async (doc) => {
      const lines = await paymentToOwnerOrdersStore.loading(doc.id)
      allOrderLinesMap.set(doc.id, lines)
    }),
  )

  // ШАГ 3: собираем все order ids и батч-запросы
  const allOrderIds = [...new Set([...allOrderLinesMap.values()].flat().map((l) => l.doc_order))]

  onProgress?.(2, 4, 'Loading orders, pickups, deliveries...')
  const [ordersResData, pickupsData, deliveriesData] = await Promise.all([
    Promise.all(
      chunkArray(allOrderIds, 50).map((chunk) =>
        supabase
          .from('orders_journal')
          .select()
          .in('id', chunk)
          .then((r) => r.data ?? []),
      ),
    ).then((r) => r.flat()),
    fetchInChunks('order_events', allOrderIds, { kind: 'pick-up' }),
    fetchInChunks('order_events', allOrderIds, { kind: 'delivery' }),
  ])

  const ordersMap = new Map<number, any>()
  ordersResData.forEach((o) => ordersMap.set(o.id, o))

  const pickupsMap = new Map<number, any>()
  pickupsData.forEach((p) => {
    if (!pickupsMap.has(p.document)) pickupsMap.set(p.document, p)
  })

  const deliveriesMap = new Map<number, any>()
  deliveriesData.forEach((d) => {
    if (!deliveriesMap.has(d.document)) deliveriesMap.set(d.document, d)
  })

  // ШАГ 5: resolve vehicle/driver/broker/dispatcher параллельно
  const vehicleIds = [...new Set(ordersResData.map((o) => o.vehicle).filter(Boolean))]
  const driverIds = [...new Set(ordersResData.map((o) => o.driver).filter(Boolean))]
  const brokerIds = [...new Set(ordersResData.map((o) => o.broker).filter(Boolean))]
  const dispatcherIds = [...new Set(ordersResData.map((o) => o.created_by).filter(Boolean))]

  const [vehiclesList, driversList, brokersList, dispatchersList] = await Promise.all([
    Promise.all(vehicleIds.map((id) => vehiclesStore.resolve(id).then((v) => [id, v] as const))),
    Promise.all(driverIds.map((id) => driversStore.resolve(id).then((d) => [id, d] as const))),
    Promise.all(brokerIds.map((id) => brokersStore.resolve(id).then((b) => [id, b] as const))),
    Promise.all(dispatcherIds.map((id) => userStore.resolve(id).then((u) => [id, u] as const))),
  ])

  const vehiclesMap = new Map(vehiclesList)
  const driversMap = new Map(driversList)
  const brokersMap = new Map(brokersList)
  const dispatchersMap = new Map(dispatchersList)

  // ШАГ 6: формируем строки Excel
  onProgress?.(3, 4, 'Building Excel file...')
  for (const ownerPayment of documents) {
    const owner = ownerStore.resolve(ownerPayment.owner) // уже в кэше
    const org = organizationsStore.resolve(ownerPayment.organization) // уже в кэше
    const [ownerData, orgData] = await Promise.all([owner, org])
    const week = ownerPayment.week

    const orderLines = allOrderLinesMap.get(ownerPayment.id) ?? []

    for (const line of orderLines) {
      const order = ordersMap.get(line.doc_order)
      if (!order || order.stage === 3) continue

      const pickup = pickupsMap.get(order.id)
      const delivery = deliveriesMap.get(order.id)
      const vehicle = vehiclesMap.get(order.vehicle)
      const driver = driversMap.get(order.driver)
      const broker = brokersMap.get(order.broker)
      const dispatcher = dispatchersMap.get(order.created_by)

      let createdAt = ''
      if (order.created_at) {
        createdAt = moment(order.created_at).tz('America/New_York').format('MMM DD, HH:mm a')
      }

      let pickupD = '',
        pickupT = '',
        deliveryD = '',
        deliveryT = ''
      if (pickup?.datetime) {
        pickupD = moment(new Date(pickup.datetime)).tz('America/New_York').format('MMM DD')
        pickupT = moment(new Date(pickup.datetime)).tz('America/New_York').format('HH:mm a')
      }
      if (delivery?.datetime) {
        deliveryD = moment(new Date(delivery.datetime)).tz('America/New_York').format('MMM DD')
        deliveryT = moment(new Date(delivery.datetime)).tz('America/New_York').format('HH:mm a')
      }

      const gross = line.order_cost
      const driverPayment = line.amount
      const profit = gross - driverPayment
      const percent = gross > 0 ? (profit / gross) * 100 : 0

      sheet.addRow({
        order: `${orgData?.code2}-${week}-${order.number}`,
        ref: order?.refs ?? '',
        date: createdAt,
        unit: vehicle?.unit_id,
        driver: driver?.name,
        owner: ownerData?.name,
        broker: broker?.name,
        from: pickup?.address ?? pickup?.city ?? '',
        state_from: pickup?.state ?? '',
        date_from: pickupD,
        time_from: pickupT,
        to: delivery?.address ?? delivery?.city ?? '',
        state_to: delivery?.state ?? '',
        date_to: deliveryD,
        time_to: deliveryT,
        dispatcher: dispatcher?.name,
        miles: order?.total_miles,
        gross: gross,
        d_payment: driverPayment,
        profit: profit,
        percent: percent,
        note: order.notes,
        tranld: `${orgData?.code2}-${week}-${order.number}`,
        tranDate: today,
        vendorRef: ownerData?.name,
        payableAccountRef_ID: 21000,
        purchaseExpenseLine_category_ID: 62500,
        purchaseExpenseLine_amount: driverPayment,
        quick_pay: 'no',
        direct_payment: 'no',
        class: 'CNU Logistics',
        week_number: week,
        class_custom: 'CNU Logistics',
        Invoice_ExID: `${orgData?.code2}-${week}-${order.number} INV`,
      })
    }
  }

  const colU = sheet.getColumn('U')
  colU.numFmt = '#,##0.0'
  colU.alignment = { horizontal: 'right' }

  const rowToColor = sheet.getRow(1)
  const fillStyle: Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '949494' },
  }
  rowToColor.eachCell((cell) => {
    cell.fill = fillStyle
  })

  onProgress?.(4, 4, 'Saving file...')
  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `Week-report.xlsx`,
  )
}
