import { useMemo, useState } from 'react'
import { Download, Eye, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Input } from './ui/input'
import type { ReceiptBatch, TaxReceipt } from '../lib/storage/receipts'
import type { ChangeEvent } from 'react'

interface ReceiptHistoryDrawerProps {
  open: boolean
  onClose: () => void
  receipts: Array<TaxReceipt>
  batches: Array<ReceiptBatch>
  onView: (receipt: TaxReceipt) => void
  onDelete: (receipt: TaxReceipt) => void
  onDownloadReceipt: (receipt: TaxReceipt) => void
  onPrintReceipt: (receipt: TaxReceipt) => void
  onDownloadBatch: (batch: ReceiptBatch) => void
  onTemplateDownload: () => void
  onBulkUpload: (file: File) => void
  bulkStatus?: {
    state: 'idle' | 'pending' | 'success' | 'error'
    message?: string
  }
}

export function ReceiptHistoryDrawer({
  open,
  onClose,
  receipts,
  batches,
  onView,
  onDelete,
  onDownloadReceipt,
  onPrintReceipt,
  onDownloadBatch,
  onTemplateDownload,
  onBulkUpload,
  bulkStatus,
}: ReceiptHistoryDrawerProps) {
  const { t } = useTranslation()
  const grouped = useMemo(() => {
    const groups = receipts.reduce<
      Record<string, Array<TaxReceipt> | undefined>
    >((acc, entry) => {
      const key = entry.groupId ?? 'ungrouped'
      const group = acc[key] ?? []
      group.push(entry)
      acc[key] = group
      return acc
    }, {})
    return Object.entries(groups).map(([groupId, list]) => {
      const entries = list ?? []
      return {
        groupId,
        groupName: entries[0]?.groupName ?? t('receipts.history.groupLabel'),
        entries,
      }
    })
  }, [receipts, t])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortMode, setSortMode] = useState<'newest' | 'oldest' | 'name'>(
    'newest',
  )
  const [expandedBatches, setExpandedBatches] = useState<
    Record<string, boolean>
  >({})
  const receiptMap = useMemo(() => {
    const map = new Map<string, TaxReceipt>()
    receipts.forEach((entry) => map.set(entry.id, entry))
    return map
  }, [receipts])

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const compare = (a: TaxReceipt, b: TaxReceipt) => {
      if (sortMode === 'name') {
        return a.title.localeCompare(b.title, undefined, {
          sensitivity: 'base',
        })
      }
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return sortMode === 'oldest' ? aTime - bTime : bTime - aTime
    }

    return grouped
      .map((group) => {
        const filteredEntries = group.entries
          .filter((entry) => {
            if (!term) return true
            const haystack =
              `${entry.title} ${entry.identifier ?? ''} ${group.groupName}`.toLowerCase()
            return haystack.includes(term)
          })
          .sort(compare)
        return {
          ...group,
          entries: filteredEntries,
        }
      })
      .filter((group) => group.entries.length > 0 || term === '')
  }, [grouped, searchTerm, sortMode])

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onBulkUpload(file)
      event.target.value = ''
    }
  }

  const toggleBatch = (id: string) => {
    setExpandedBatches((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div
      className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-lg transform flex-col border-l border-[#d2d2d7] bg-white transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#d2d2d7]/70 px-4 py-4">
        <div>
          <p className="text-sm text-[#0066cc]">
            {t('receipts.history.title')}
          </p>
          <p className="text-sm text-[#6e6e73]">
            {t('receipts.history.recordsCount', { count: receipts.length })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label={t('app.buttons.closeNav')}
        >
          <X />
        </Button>
      </div>
      <div className="border-b border-[#d2d2d7]/70 px-4 py-3">
        <div className="flex flex-col gap-2">
          <Input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('receipts.history.searchPlaceholder')}
            className="text-sm"
          />
          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="text-xs font-semibold text-[#6e6e73]">
              {t('receipts.history.sortLabel')}
            </label>
            <select
              value={sortMode}
              onChange={(event) =>
                setSortMode(event.target.value as typeof sortMode)
              }
              className="rounded-[12px] border border-[#d2d2d7] px-3 py-2 text-xs font-semibold text-[#1d1d1f]"
            >
              <option value="newest">{t('receipts.history.sortNewest')}</option>
              <option value="oldest">{t('receipts.history.sortOldest')}</option>
              <option value="name">{t('receipts.history.sortName')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {filteredGroups.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-[#d2d2d7] bg-[#f5f5f7] p-4 text-sm text-[#6e6e73]">
              {searchTerm
                ? t('receipts.history.noResult')
                : t('receipts.history.empty')}
            </p>
          ) : (
            filteredGroups.map((group) => (
              <div
                key={group.groupId}
                className="rounded-[18px] border border-[#d2d2d7]/70 bg-white p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1d1d1f]">
                      {group.groupName}
                    </p>
                    <p className="text-xs text-[#6e6e73]">
                      {group.entries.length}{' '}
                      {t('receipts.history.countLabel', {
                        count: group.entries.length,
                      })}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {group.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[12px] border border-[#d2d2d7]/70 bg-[#f5f5f7] p-3 text-sm"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-[#1d1d1f]">
                            {entry.title}
                          </p>
                          <p className="text-xs text-[#6e6e73]">
                            {entry.type.toUpperCase()} ·{' '}
                            {formatDate(entry.createdAt, entry.locale)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(entry)}
                          >
                            <Eye className="mr-1 size-4" />{' '}
                            {t('receipts.actions.preview')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDownloadReceipt(entry)}
                          >
                            <Download className="mr-1 size-4" />{' '}
                            {t('receipts.actions.downloadExcel')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPrintReceipt(entry)}
                          >
                            {t('receipts.actions.downloadPdf')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(entry)}
                          >
                            <Trash2 className="mr-1 size-4" />{' '}
                            {t('receipts.actions.delete')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          <div className="rounded-[18px] border border-[#d2d2d7]/70 bg-[#f5f5f7] p-4">
            <p className="text-sm font-semibold text-[#1d1d1f]">
              {t('receipts.bulk.title')}
            </p>
            <p className="text-xs text-[#6e6e73]">
              {t('receipts.bulk.description')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onTemplateDownload}>
                {t('receipts.bulk.downloadTemplate')}
              </Button>
              <label className="inline-flex cursor-pointer items-center rounded-full border border-dashed border-[#86868b] px-3 py-2 text-xs font-semibold text-[#0066cc]">
                <input
                  type="file"
                  accept=".xls,.xml"
                  className="hidden"
                  onChange={handleFileInput}
                />
                {t('receipts.bulk.uploadLabel')}
              </label>
            </div>
            {bulkStatus?.message && (
              <p
                className={`mt-2 text-xs ${
                  bulkStatus.state === 'error'
                    ? 'text-[#d70015]'
                    : bulkStatus.state === 'pending'
                      ? 'text-[#0066cc]'
                      : 'text-[#248a3d]'
                }`}
              >
                {bulkStatus.message}
              </p>
            )}
          </div>

          <div className="rounded-[18px] border border-[#d2d2d7]/70 bg-white p-4">
            <p className="text-sm font-semibold text-[#1d1d1f]">
              {t('receipts.history.batchTitle')}
            </p>
            {batches.length === 0 ? (
              <p className="text-xs text-[#6e6e73]">
                {t('receipts.history.batchEmpty')}
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {batches.map((batch) => {
                  const batchReceipts = batch.recordIds
                    .map((id) => receiptMap.get(id))
                    .filter((entry): entry is TaxReceipt => Boolean(entry))
                  const expanded = expandedBatches[batch.id]
                  return (
                    <div
                      key={batch.id}
                      className="rounded-[12px] border border-[#d2d2d7]/70 bg-[#f5f5f7] p-3 text-sm"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-[#1d1d1f]">
                            {batch.label}
                          </p>
                          <p className="text-xs text-[#6e6e73]">
                            {batch.type.toUpperCase()} ·{' '}
                            {formatDate(batch.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDownloadBatch(batch)}
                          >
                            <Download className="mr-1 size-4" />{' '}
                            {t('receipts.history.downloadBatch')}
                          </Button>
                          {batchReceipts.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBatch(batch.id)}
                            >
                              {expanded
                                ? t('receipts.history.hideBatch')
                                : t('receipts.history.viewBatch')}
                            </Button>
                          )}
                        </div>
                      </div>
                      {expanded && batchReceipts.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-[#d2d2d7] pt-3">
                          {batchReceipts.map((entry) => (
                            <div
                              key={`${batch.id}-${entry.id}`}
                              className="rounded-[12px] border border-[#d2d2d7]/70 bg-white p-3"
                            >
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="font-semibold text-[#1d1d1f]">
                                    {entry.title}
                                  </p>
                                  <p className="text-xs text-[#6e6e73]">
                                    {entry.type.toUpperCase()} ·{' '}
                                    {formatDate(entry.createdAt, entry.locale)}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onView(entry)}
                                  >
                                    <Eye className="mr-1 size-4" />{' '}
                                    {t('receipts.actions.preview')}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onDownloadReceipt(entry)}
                                  >
                                    <Download className="mr-1 size-4" />{' '}
                                    {t('receipts.actions.downloadExcel')}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onPrintReceipt(entry)}
                                  >
                                    {t('receipts.actions.downloadPdf')}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const formatDate = (value: string, locale?: string) => {
  try {
    return new Intl.DateTimeFormat(locale ?? 'id', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return new Date(value).toLocaleString()
  }
}
