import i18n from '../i18n/config'
import { formatCurrency, formatPercent } from './format'
import type { ReceiptBatch, TaxReceipt } from './storage/receipts'

type Worksheet = {
  name: string
  rows: Array<Array<string>>
}

const renderRowValue = (
  value: number | string | undefined,
  valueType: TaxReceipt['breakdown'][number]['valueType'],
): string => {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  if (valueType === 'text') return String(value)
  if (valueType === 'percent') {
    const numeric = typeof value === 'number' ? value : Number(value) || 0
    return formatPercent(numeric)
  }
  const numeric = typeof value === 'number' ? value : Number(value) || 0
  return formatCurrency(numeric)
}

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const buildWorksheet = ({ name, rows }: Worksheet) => {
  const safeName = escapeXml(name || 'Sheet1')
  const tableRows = rows
    .map((cells) => {
      const columns = cells
        .map(
          (cell) =>
            `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`,
        )
        .join('')
      return `<Row>${columns}</Row>`
    })
    .join('')
  return `<Worksheet ss:Name="${safeName}"><Table>${tableRows}</Table></Worksheet>`
}

const buildWorkbook = (worksheets: Array<Worksheet>) => {
  const sheets = worksheets.map(buildWorksheet).join('')
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${sheets}
</Workbook>`
}

const sanitizeFilename = (value: string) =>
  value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'hitung-pajak'

type ReceiptBreakdownRow = TaxReceipt['breakdown'][number]

type PrintableBreakdownSection = {
  heading?: string
  rows: Array<ReceiptBreakdownRow>
}

const buildPrintableBreakdownSections = (rows: Array<ReceiptBreakdownRow>) => {
  const sections: Array<PrintableBreakdownSection> = []
  let current: PrintableBreakdownSection = { rows: [] }

  rows.forEach((row) => {
    if (row.variant === 'spacer') {
      if (current.rows.length > 0) {
        sections.push(current)
        current = { rows: [] }
      }
      return
    }

    if (row.variant === 'group' || row.variant === 'section') {
      if (current.rows.length > 0) {
        sections.push(current)
      }
      current = { heading: row.label, rows: [] }
      return
    }

    current.rows.push(row)
  })

  if (current.rows.length > 0) {
    sections.push(current)
  }

  return sections
}

const printableRowClass = (row: ReceiptBreakdownRow) => {
  if (row.variant === 'total') return 'breakdown-row total-row'
  if (row.variant === 'subtotal') return 'breakdown-row subtotal-row'
  return 'breakdown-row'
}

const renderPrintableBreakdown = (rows: Array<ReceiptBreakdownRow>) =>
  buildPrintableBreakdownSections(rows)
    .map(
      (section) => `
        <section class="breakdown-section">
          ${
            section.heading
              ? `<div class="breakdown-heading">${escapeHtml(section.heading)}</div>`
              : ''
          }
          ${section.rows
            .map(
              (row) => `
                <div class="${printableRowClass(row)}">
                  <div>${escapeHtml(row.label)}</div>
                  <div class="value">${escapeHtml(renderRowValue(row.value, row.valueType))}</div>
                  <div class="note">${escapeHtml(row.note ?? '')}</div>
                </div>
              `,
            )
            .join('')}
        </section>
      `,
    )
    .join('')

export const downloadWorkbook = (
  filename: string,
  worksheets: Array<Worksheet>,
) => {
  if (typeof window === 'undefined') return
  const xml = buildWorkbook(worksheets)
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`
  link.click()
  URL.revokeObjectURL(url)
}

export const downloadReceiptWorkbook = (receipt: TaxReceipt) => {
  const rows: Array<Array<string>> = [
    [i18n.t('table.component'), i18n.t('table.value'), i18n.t('table.note')],
    ...receipt.breakdown.map((row) => [
      row.label,
      renderRowValue(row.value, row.valueType),
      row.note ?? '',
    ]),
  ]
  downloadWorkbook(`${sanitizeFilename(receipt.title)}.xls`, [
    { name: 'Receipt', rows },
  ])
}

export const downloadBatchWorkbook = (
  batch: ReceiptBatch,
  receipts: Array<TaxReceipt>,
) => {
  const header = ['Batch', 'Receipt', 'Component', 'Value', 'Note']
  const rows = receipts.flatMap((receipt) =>
    receipt.breakdown.map((row) => [
      batch.label,
      receipt.title,
      row.label,
      renderRowValue(row.value, row.valueType),
      row.note ?? '',
    ]),
  )
  downloadWorkbook(`${sanitizeFilename(batch.label)}.xls`, [
    { name: 'Batch', rows: [header, ...rows] },
  ])
}

export const openPrintableReceipt = (receipt: TaxReceipt) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const t = (key: string, fallback?: string) =>
    i18n.t(key, { defaultValue: fallback })
  const dateFormatter = new Intl.DateTimeFormat(receipt.locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const createdAt = receipt.createdAt
    ? dateFormatter.format(new Date(receipt.createdAt))
    : ''

  const summaryRows: Array<{ label: string; value: number }> = [
    { label: t('receipts.summary.totalTax'), value: receipt.summary.totalTax },
  ]
  if (receipt.summary.terPerPeriod !== undefined) {
    summaryRows.push({
      label: t('receipts.summary.terMonthly'),
      value: receipt.summary.terPerPeriod,
    })
  }
  if (receipt.summary.decemberAdjustment !== undefined) {
    summaryRows.push({
      label: t('receipts.summary.decAdjustment'),
      value: receipt.summary.decemberAdjustment,
    })
  }
  if (receipt.summary.takeHomeAnnual !== undefined) {
    summaryRows.push({
      label: t('receipts.summary.thpAnnual'),
      value: receipt.summary.takeHomeAnnual,
    })
  }
  if (receipt.summary.takeHomePerPeriod !== undefined) {
    summaryRows.push({
      label: t('receipts.summary.thpPeriod'),
      value: receipt.summary.takeHomePerPeriod,
    })
  }

  const styles = `
    @page { size: A4; margin: 14mm 12mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #ffffff; color: #1d1d1f; }
    body { font-family: 'SF Pro Text', system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 11px; line-height: 1.45; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page { width: 100%; margin: 0; background: #ffffff; }
    .content { padding: 0; }
    .receipt-heading { break-inside: avoid; page-break-inside: avoid; }
    h1 { margin: 0; font-size: 13px; color: #0066cc; font-weight: 600; }
    h2 { margin: 6px 0 12px; font-size: 26px; line-height: 1.08; color: #1d1d1f; font-weight: 700; }
    .meta { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 0 0 10px; color: #424245; break-inside: avoid; page-break-inside: avoid; }
    .meta div { break-inside: avoid; page-break-inside: avoid; }
    .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 0 0 16px; break-inside: avoid; page-break-inside: avoid; }
    .summary-card { min-height: 52px; background: #ffffff; border-radius: 9px; padding: 8px 10px; border: 1px solid #d2d2d7; break-inside: avoid; page-break-inside: avoid; }
    .summary span { display: block; font-size: 9px; color: #424245; margin-bottom: 5px; }
    .summary strong { display: block; font-size: 15px; line-height: 1.1; }
    .breakdown-table { margin-top: 10px; }
    .breakdown-head, .breakdown-row { display: grid; grid-template-columns: 42% 22% minmax(0, 36%); column-gap: 14px; align-items: start; }
    .breakdown-head { padding: 0 0 6px; border-bottom: 1px solid #c7c7cc; color: #1d1d1f; font-size: 9px; font-weight: 700; text-transform: uppercase; break-after: avoid; page-break-after: avoid; }
    .breakdown-section { margin-top: 9px; break-inside: avoid-page; page-break-inside: avoid; }
    .breakdown-heading { padding: 8px 0; border-bottom: 1px solid #d2d2d7; color: #1d1d1f; font-weight: 700; break-after: avoid; page-break-after: avoid; }
    .breakdown-row { padding: 7px 0; border-bottom: 1px solid #e5e5ea; break-inside: avoid; page-break-inside: avoid; }
    .breakdown-row .value { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .breakdown-row .note { color: #424245; }
    .subtotal-row { font-weight: 600; }
    .total-row { font-weight: 700; }
    @media print {
      .summary, .summary-card, .meta, .breakdown-row, .breakdown-heading { break-inside: avoid; page-break-inside: avoid; }
    }
  `

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(receipt.title)}</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="page">
          <div class="content">
          <div class="receipt-heading">
            <h1>${escapeHtml(t('receipts.print.title'))}</h1>
            <h2>${escapeHtml(receipt.title)}</h2>
          </div>
          <div class="meta">
            ${
              receipt.id
                ? `<div>${escapeHtml(t('receipts.print.meta'))}: <strong>${escapeHtml(receipt.id)}</strong></div>`
                : ''
            }
            ${
              receipt.identifier
                ? `<div>${escapeHtml(t('receipts.print.identifier'))}: <strong>${escapeHtml(receipt.identifier)}</strong></div>`
                : ''
            }
            ${
              receipt.groupName
                ? `<div>${escapeHtml(t('receipts.print.group'))}: <strong>${escapeHtml(receipt.groupName)}</strong></div>`
                : ''
            }
            ${
              createdAt
                ? `<div>${escapeHtml(t('receipts.modal.created'))}: <strong>${escapeHtml(createdAt)}</strong></div>`
                : ''
            }
          </div>
          <div class="summary">
            ${summaryRows
              .map(
                (row) => `
                  <div class="summary-card">
                    <span>${escapeHtml(row.label)}</span>
                    <strong>${escapeHtml(formatCurrency(row.value))}</strong>
                  </div>
                `,
              )
              .join('')}
          </div>
          <div class="breakdown-table">
            <div class="breakdown-head">
              <div>${escapeHtml(t('table.component'))}</div>
              <div>${escapeHtml(t('table.value'))}</div>
              <div>${escapeHtml(t('table.note'))}</div>
            </div>
            ${renderPrintableBreakdown(receipt.breakdown)}
          </div>
          </div>
        </div>
      </body>
    </html>
  `

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.opacity = '0'
  iframe.style.pointerEvents = 'none'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.srcdoc = receiptHtml
  document.body.appendChild(iframe)

  const cleanup = () => {
    try {
      document.body.removeChild(iframe)
    } catch {
      // ignore
    }
  }
  let hasPrinted = false
  const triggerPrint = () => {
    if (hasPrinted) return
    hasPrinted = true
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      // ignore
    } finally {
      setTimeout(cleanup, 500)
    }
  }

  iframe.onload = () => {
    triggerPrint()
  }
}

export const parseSpreadsheetXml = (xml: string): Array<Array<string>> => {
  if (typeof DOMParser === 'undefined') {
    return []
  }
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  if (doc.getElementsByTagName('parsererror').length > 0) {
    return []
  }
  const rows = Array.from(doc.getElementsByTagName('Row'))
  if (!rows.length) {
    const nsNodes = Array.from(doc.getElementsByTagNameNS('*', 'Row'))
    if (!nsNodes.length) return []
    return nsNodes.map(extractRow)
  }
  return rows.map(extractRow)
}

const extractRow = (row: Element) => {
  const cells = (() => {
    const standard = Array.from(row.getElementsByTagName('Cell'))
    if (standard.length) return standard
    return Array.from(row.getElementsByTagNameNS('*', 'Cell'))
  })()
  const values: Array<string> = []
  let currentIndex = 0

  cells.forEach((cell) => {
    const indexAttr =
      cell.getAttribute('ss:Index') ??
      cell.getAttribute('Index') ??
      cell.getAttributeNS(
        'urn:schemas-microsoft-com:office:spreadsheet',
        'Index',
      )
    if (indexAttr) {
      const nextIndex = Number(indexAttr) - 1
      while (currentIndex < nextIndex) {
        values.push('')
        currentIndex += 1
      }
    }
    const data =
      cell.getElementsByTagName('Data').item(0) ??
      cell.getElementsByTagNameNS('*', 'Data').item(0)
    values.push(data ? data.textContent : '')
    currentIndex += 1
  })

  return values
}
