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
    try {
      const { data: pdfBlob, error } = await supabase.storage.from('orders').download(path)

      if (error) {
        throw error
      }

      if (path.toLowerCase().endsWith('.pdf')) {
        const donorPdf = await PDFDocument.load(await pdfBlob.arrayBuffer())
        const pages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices())
        for (const page of pages) {
          pdfDoc.addPage(page)
        }
      } else if (path.toLowerCase().endsWith('.jpg')) {
        const page = pdfDoc.addPage()
        const jpgImage = await pdfDoc.embedJpg(await pdfBlob.arrayBuffer())

        const { width: pageWidth, height: pageHeight } = page.getSize()

        // Calculate dimensions to fit while maintaining aspect ratio
        const dims = jpgImage.scaleToFit(pageWidth, pageHeight)

        page.drawImage(jpgImage, {
          x: (pageWidth - dims.width) / 2, // Center horizontally
          y: (pageHeight - dims.height) / 2, // Center vertically
          width: dims.width,
          height: dims.height,
        })
      } else {
      }
    } catch (e) {
      throw 'fail to process ' + path + ': ' + e
    }
  }

  const pdfBytes = await pdfDoc.save()

  await openInNewTab(pdfDoc)

  return new Blob([pdfBytes], { type: 'application/pdf' })
}
