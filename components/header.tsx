import Link from 'next/link'
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon, Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Nav from './nav'
import MobileNav from './mobile-nav'
import { useState, useEffect, useRef } from 'react'

export default function Header() {
  const { systemTheme, theme, setTheme } = useTheme()
  const [nav, setNav] = useState(false)
  const [mounted, setMounted] = useState(false)
  const navToggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const renderThemeChanger = () => {
    if (!mounted) return null
    const currentTheme = theme === 'system' ? systemTheme : theme

    if (currentTheme === 'dark') {
      return (
        <button
          type="button"
          aria-label="Switch to light theme"
          onClick={() => setTheme('light')}
          className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          <SunIcon className="h-6 w-6 text-accent-1" aria-hidden="true" />
        </button>
      )
    } else {
      return (
        <button
          type="button"
          aria-label="Switch to dark theme"
          onClick={() => setTheme('dark')}
          className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          <MoonIcon className="h-6 w-6 text-accent-1" aria-hidden="true" />
        </button>
      )
    }
  }

  return (
    <div className="fixed flex flex-row m-1 pl-7.5 pr-5 nav-fixed bg-daccent-2">
      <div className="flex flex-row justify-between pb-5 pt-6 items-center w-full">
        <h2 className="ml-12 text-2xl font-bold tracking-tight md:tracking-tighter leading-tight">
          <Link
            href="/"
            className="hover:underline text-accent-1 font-serif whitespace-nowrap focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500"
          >
            Shaun Guimond
          </Link>
        </h2>
        <Nav />
        <div className="flex flex-row gap-5">
          <Link
            href="/search"
            aria-label="Search posts and categories"
            title="Search"
            className="hidden h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 lg:flex"
          >
            <MagnifyingGlassIcon className="h-7 w-7 text-accent-1" aria-hidden="true" />
          </Link>
          <div className="hidden lg:block">{renderThemeChanger()}</div>
          <button
            ref={navToggleRef}
            type="button"
            onClick={() => setNav(!nav)}
            aria-label={nav ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={nav}
            aria-controls="mobile-navigation"
            aria-haspopup="dialog"
            aria-hidden={nav}
            tabIndex={nav ? -1 : 0}
            className={`z-10 flex h-11 w-11 items-center justify-center rounded-full pr-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 lg:hidden ${nav ? 'invisible' : ''}`}
          >
            <Bars3Icon className="h-8 w-8 text-accent-1" aria-hidden="true" />
          </button>

          {nav && (
            <MobileNav
              setNav={setNav}
              themeToggle={renderThemeChanger()}
              onClose={() => requestAnimationFrame(() => navToggleRef.current?.focus())}
            />
          )}
        </div>
      </div>
    </div>
  )
}
