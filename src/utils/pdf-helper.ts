import type { PDFDocument } from 'pdf-lib'

export async function openInNewTab(pdfDoc: PDFDocument) {
  const pdfBytes = await pdfDoc.save()

  const blob = new Blob([pdfBytes], { type: 'application/pdf' })

  const pdfUrl = URL.createObjectURL(blob)

  window.open(pdfUrl, '_blank')
}
