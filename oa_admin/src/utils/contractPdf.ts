import html2pdf from 'html2pdf.js'

export interface PdfOptions {
  filename: string
  element: HTMLElement
}

export const exportToPdf = async ({ filename, element }: PdfOptions): Promise<void> => {
  const opt = {
    margin: [10, 10, 10, 10],
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as string[] }
  }
  await html2pdf().set(opt).from(element).save()
}

export const printHtml = (element: HTMLElement, title: string): void => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(`<!DOCTYPE html>
<html><head><title>${title}</title>
<style>
  @media print { @page { margin: 20mm 25mm; size: A4; } }
  body { font-family: SimSun, "宋体", serif; margin: 0; padding: 0; }
</style>
</head><body>${element.innerHTML}</body></html>`)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
