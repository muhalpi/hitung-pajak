import { Link, useRouterState } from '@tanstack/react-router'
import { Check, ChevronDown, Github, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { availableLocales, changeLocale } from '../i18n/config'
import { cn } from '../lib/cn'
import { Button } from './ui/button'
import type { ReactNode } from 'react'

const GITHUB_URL = 'https://github.com/muhalpi/hitung-pajak'

const NAV_LINKS: Array<{ to: string; labelKey: string }> = [
  { to: '/', labelKey: 'app.nav.home' },
  { to: '/pph21', labelKey: 'app.nav.pph21' },
  { to: '/pph22', labelKey: 'app.nav.pph22' },
  { to: '/pph23', labelKey: 'app.nav.pph23' },
  { to: '/pph4-2', labelKey: 'app.nav.pph4_2' },
  { to: '/ppn', labelKey: 'app.nav.ppn' },
  { to: '/ppnbm', labelKey: 'app.nav.ppnbm' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const langDropdownRef = useRef<HTMLDivElement>(null)
  const { location } = useRouterState()
  const { t, i18n } = useTranslation()

  const handleLocaleChange = (value: string) => {
    changeLocale(value)
    setLangDropdownOpen(false)
  }

  const currentLocale =
    availableLocales.find((locale) => locale.code === i18n.language) ||
    availableLocales[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target as Node)
      ) {
        setLangDropdownOpen(false)
      }
    }

    if (langDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [langDropdownOpen])

  useEffect(() => {
    if (!open) {
      setLangDropdownOpen(false)
    }
  }, [open])

  const renderNav = (variant: 'dark' | 'light') => (
    <nav className="flex flex-col gap-1 text-sm md:flex-row md:items-center md:justify-center md:gap-1">
      {NAV_LINKS.map((item) => {
        const active = location.pathname === item.to
        const activeClass =
          variant === 'dark'
            ? 'bg-white/15 text-white'
            : 'bg-[#f5f5f7] text-[#1d1d1f]'
        const inactiveClass =
          variant === 'dark'
            ? 'text-white/70 hover:bg-white/10 hover:text-white'
            : 'text-[#424245] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'rounded-full px-3 py-2 transition-colors',
              active ? activeClass : inactiveClass,
            )}
            onClick={() => setOpen(false)}
          >
            {t(item.labelKey)}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/90 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-3 text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-[11px] font-semibold">
              <span>HP</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold leading-snug">
                <span>{t('app.brandMain')}</span>{' '}
                <span className="text-white/70">{t('app.brandAccent')}</span>
              </p>
              <p className="hidden text-[11px] text-white/55 sm:block">
                {t('app.taglineLine1')}
              </p>
            </div>
          </Link>

          <div className="hidden flex-1 items-center justify-between gap-4 md:flex">
            <div className="flex-1">{renderNav('dark')}</div>
            <div className="flex items-center gap-4">
              <div ref={langDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  aria-label="Change language"
                  className="flex h-8 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 text-xs text-white/85 outline-none transition-colors hover:bg-white/10 hover:text-white"
                >
                  <span>{currentLocale.emoji}</span>
                  <span>{currentLocale.label}</span>
                  <ChevronDown
                    className={cn(
                      'size-3.5 transition-transform',
                      langDropdownOpen && 'rotate-180',
                    )}
                  />
                </button>
                {langDropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 min-w-[160px] rounded-[12px] border border-[#d2d2d7] bg-white p-1 text-[#1d1d1f]">
                    {availableLocales.map((locale) => {
                      const isSelected = locale.code === i18n.language
                      return (
                        <button
                          key={locale.code}
                          type="button"
                          onClick={() => handleLocaleChange(locale.code)}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-[9px] px-3 py-2 text-left text-sm transition-colors',
                            isSelected
                              ? 'bg-[#f5f5f7] font-medium text-[#1d1d1f]'
                              : 'text-[#424245] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]',
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span>{locale.emoji}</span>
                            <span>{locale.label}</span>
                          </span>
                          {isSelected && (
                            <Check className="size-4 text-[#0066cc]" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                asChild
                className="text-white/85 hover:bg-white/10 hover:text-white"
              >
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2"
                >
                  <Github className="size-4" />
                  <span className="text-xs">{t('app.buttons.github')}</span>
                </a>
              </Button>
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="bg-transparent text-white hover:bg-white/10 hover:text-white md:hidden"
            onClick={() => setOpen(true)}
            aria-label={t('app.buttons.openNav')}
          >
            <Menu />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        {children}
      </main>

      <div
        className={cn(
          'fixed inset-y-0 right-0 z-40 w-80 border-l border-[#d2d2d7] bg-white p-6 transition-transform md:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-[#1d1d1f]">
              {t('app.menu.title')}
            </p>
            <p className="text-xs text-[#6e6e73]">{t('app.menu.subtitle')}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label={t('app.buttons.closeNav')}
            onClick={() => setOpen(false)}
          >
            <X />
          </Button>
        </div>
        <div className="space-y-4">
          {renderNav('light')}
          <div className="relative">
            <select
              aria-label="Change language"
              value={i18n.language}
              onChange={(event) => handleLocaleChange(event.target.value)}
              className="w-full rounded-[12px] border border-[#d2d2d7] bg-white px-3 py-2 text-sm text-[#1d1d1f] outline-none transition-colors hover:bg-[#f5f5f7]"
            >
              {availableLocales.map((locale) => (
                <option key={locale.code} value={locale.code}>
                  {`${locale.emoji} ${locale.label}`}
                </option>
              ))}
            </select>
          </div>
          <Button asChild className="w-full" variant="outline">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <Github className="size-4" />
              {t('app.buttons.github')}
            </a>
          </Button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/25 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}
