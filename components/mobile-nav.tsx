import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { navLinks } from '../lib/constants'

interface MobileNavProps {
  setNav: (nav: boolean) => void
  themeToggle: ReactNode
  onClose: () => void
}

export default function MobileNav({ setNav, themeToggle, onClose }: MobileNavProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLElement>('nav a[href]')?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const closeMenu = () => {
    setNav(false)
    onClose()
  }

  const trapKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu()
      return
    }

    if (event.key !== 'Tab' || !dialogRef.current) return

    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return (
    <div
      ref={dialogRef}
      id="mobile-navigation"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      onKeyDown={trapKeyboard}
      className="absolute left-0 top-0 z-0 flex h-dvh w-full flex-col items-center justify-center overflow-y-auto bg-accent-3 px-5 py-24 dark:bg-daccent-1"
    >
      <button
        type="button"
        onClick={closeMenu}
        aria-label="Close navigation menu"
        className="absolute right-6 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:text-accent-1"
      >
        <XMarkIcon className="h-8 w-8" aria-hidden="true" />
      </button>

      <nav aria-label="Primary navigation" className="my-auto">
        <ul className="text-center">
          <li className="my-3">
            <Link
              className="my-6 cursor-pointer text-3xl capitalize text-black focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500 dark:text-accent-1"
              href="/"
              onClick={() => setNav(false)}
            >
              Home
            </Link>
          </li>
          {navLinks.map((link) => (
            <li key={link.path} className="my-3">
              <Link
                className="my-6 cursor-pointer text-3xl capitalize text-black focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500 dark:text-accent-1"
                href={link.path}
                onClick={() => setNav(false)}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/50 dark:border-white/50">
          {themeToggle}
        </div>
        <Link
          href="/search"
          onClick={() => setNav(false)}
          aria-label="Search posts and categories"
          title="Search"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-black/50 text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-white/50 dark:text-accent-1"
        >
          <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
