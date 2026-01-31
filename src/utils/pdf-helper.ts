import type { PDFDocument } from 'pdf-lib'

export async function openInNewTab(pdfDoc: PDFDocument) {
  const pdfBytes = await pdfDoc.save()

  const blob = new Blob([pdfBytes], { type: 'application/pdf' })

  const pdfUrl = URL.createObjectURL(blob)

  window.open(pdfUrl, '_blank')
}

// export function filterCharSet(text: string, font) {
//   let str = text.split('')
//   const charSet = font.getCharacterSet()
//   for (let i = 0; i < str.length; i++) {
//     if (str[i] && !charSet.includes(str[i].charCodeAt(0))) str[i] = '?'
//   }
//   // str = str.replace(/[\uE000-\uF8FF]/g, '?')
//   // str = str.replace(/[^\w\s!?{}()-;:"'*@#$%&+=]/g, '?')
//   return str.join('')
// }

export function filterCharSet(text: string, font: any) {
  if (!text) return ''
  const charSet = font.getCharacterSet()

  // Using [...] correctly handles emojis and multi-unit characters
  return [...text]
    .map((char) => {
      const codePoint = char.codePointAt(0)
      return codePoint && charSet.includes(codePoint) ? char : '?'
    })
    .join('')
}
