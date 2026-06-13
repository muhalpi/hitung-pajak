// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { openPrintableReceipt, parseSpreadsheetXml } from './receiptExport'
import type { TaxReceipt } from './storage/receipts'

const receipt: TaxReceipt = {
  id: 'rcpt-1',
  type: 'pph21',
  title: 'Receipt <Title>',
  identifier: 'ID & <tag>',
  groupName: 'Group "Alpha"',
  createdAt: '2026-06-08T00:00:00.000Z',
  source: 'manual',
  locale: 'id',
  formSnapshot: {},
  summary: {
    totalTax: 1_000_000,
  },
  breakdown: [
    {
      label: 'Unsafe <b>Label</b>',
      note: 'Needs "escaping" & review',
      value: 'Plain <script>alert(1)</script>',
      valueType: 'text',
    },
  ],
}

describe('receiptExport', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('escapes user-controlled receipt content in printable HTML', () => {
    openPrintableReceipt(receipt)

    const iframe = document.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe?.getAttribute('srcdoc')).toContain('Receipt &lt;Title&gt;')
    expect(iframe?.getAttribute('srcdoc')).toContain('ID &amp; &lt;tag&gt;')
    expect(iframe?.getAttribute('srcdoc')).toContain(
      'Plain &lt;script&gt;alert(1)&lt;/script&gt;',
    )
    expect(iframe?.getAttribute('srcdoc')).not.toContain(
      'Plain <script>alert(1)</script>',
    )
    expect(iframe?.getAttribute('srcdoc')).not.toContain('header-shell')
  })

  it('prints a generated receipt iframe only once', () => {
    openPrintableReceipt(receipt)

    const iframe = document.querySelector('iframe')
    expect(iframe).not.toBeNull()

    const print = vi.fn()
    const focus = vi.fn()
    if (iframe?.contentWindow) {
      iframe.contentWindow.print = print
      iframe.contentWindow.focus = focus
    }

    iframe?.onload?.(new Event('load'))
    iframe?.onload?.(new Event('load'))

    expect(print).toHaveBeenCalledTimes(1)
    expect(focus).toHaveBeenCalledTimes(1)
  })

  it('parses SpreadsheetML rows including sparse indexes', () => {
    const xml = `<?xml version="1.0"?>
      <Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
        <Worksheet ss:Name="Sheet1">
          <Table>
            <Row>
              <Cell><Data ss:Type="String">A</Data></Cell>
              <Cell ss:Index="3"><Data ss:Type="String">C</Data></Cell>
            </Row>
          </Table>
        </Worksheet>
      </Workbook>`

    expect(parseSpreadsheetXml(xml)).toEqual([['A', '', 'C']])
  })
})
