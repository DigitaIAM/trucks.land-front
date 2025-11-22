import { PDFDocument } from 'pdf-lib'
import { openInNewTab } from '@/utils/pdf-helper.ts'

const filesStore = useFilesStore()

export async function generateFI(order: Order, org: Organization): Promise<Blob> {
  const files = await filesStore.request(order.id)

  if (org.id != order.organization) {
    throw 'fail organization check'
  }
  const pdfDoc = await PDFDocument.create()

  const paths = []
  for (const file of files) {
    if (file.kind == 'RC' && !file.is_deleted) {
      paths.push(file.path)
    }
  }
  for (const file of files) {
    if (file.kind == 'POD' && !file.is_deleted) {
      paths.push(file.path)
    }
  }

  for (const path of paths) {
    const { data: pdfBlob, error } = await supabase.storage.from('orders').download(path)

    const donorPdf = await PDFDocument.load(await pdfBlob.arrayBuffer())
    const pages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices())
    for (const page of pages) {
      pdfDoc.addPage(page)
    }
    console.log('error', error)
  }
  const pdfBytes = await pdfDoc.save()

  await openInNewTab(pdfDoc)

  return new Blob([pdfBytes], { type: 'application/pdf' })
}
