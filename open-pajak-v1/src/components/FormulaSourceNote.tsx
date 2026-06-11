import { useTranslation } from 'react-i18next'

export function FormulaSourceNote() {
  const { t } = useTranslation()
  return (
    <div className="rounded-[18px] border border-[#d2d2d7]/70 bg-white p-4 text-sm text-[#1d1d1f]">
      <p className="font-semibold">{t('formulaSource.title')}</p>
      <p className="mt-1 text-[#6e6e73]">
        {t('formulaSource.body')}{' '}
        <a
          href="/Buku_PPh2126_Release_20240108.pdf"
          className="font-normal text-[#0066cc]"
          download
        >
          {t('formulaSource.link')}
        </a>
        .
      </p>
    </div>
  )
}
