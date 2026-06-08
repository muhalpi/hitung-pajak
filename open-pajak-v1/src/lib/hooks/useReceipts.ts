import { useCallback, useMemo, useState } from 'react'
import {
  addBatch,
  addReceipt,
  getStoredBatches,
  getStoredReceipts,
  persistBatches,
  removeReceipt,
} from '../storage/receipts'
import type {
  ReceiptBatch,
  ReceiptBatchDraft,
  ReceiptDraft,
  TaxReceipt,
} from '../storage/receipts'

export function useReceipts() {
  const [receipts, setReceipts] = useState<Array<TaxReceipt>>(() =>
    getStoredReceipts(),
  )
  const [batches, setBatches] = useState<Array<ReceiptBatch>>(() =>
    getStoredBatches(),
  )

  const saveReceipt = useCallback(
    (draft: ReceiptDraft) => {
      const { record, all } = addReceipt(draft, receipts)
      setReceipts(all)
      return record
    },
    [receipts],
  )

  const deleteReceipt = useCallback(
    (id: string) => {
      const next = removeReceipt(id, receipts)
      setReceipts(next)
    },
    [receipts],
  )

  const saveBatch = useCallback(
    (draft: ReceiptBatchDraft) => {
      const { batch, all } = addBatch(draft, batches)
      setBatches(all)
      return batch
    },
    [batches],
  )

  const clearBatches = useCallback(() => {
    setBatches([])
    persistBatches([])
  }, [])

  const groupedReceipts = useMemo(() => {
    return receipts.reduce<Record<string, Array<TaxReceipt> | undefined>>(
      (acc, entry) => {
        const key = entry.groupId ?? 'ungrouped'
        const group = acc[key] ?? []
        group.push(entry)
        acc[key] = group
        return acc
      },
      {},
    )
  }, [receipts])

  return {
    receipts,
    batches,
    groupedReceipts,
    saveReceipt,
    deleteReceipt,
    saveBatch,
    clearBatches,
    setReceipts,
    setBatches,
  }
}
