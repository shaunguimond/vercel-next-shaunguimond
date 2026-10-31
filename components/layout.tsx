import Alert from './alert'
import Footer from './footer'
import Header from './header'
import Meta from './meta'
import { Analytics } from '@vercel/analytics/react'
import type { ReactNode } from 'react'

export default function Layout({ preview, children }: { preview?: boolean; children: ReactNode }) {
  return (
    <>
      <Meta />
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[1100] rounded-lg bg-accent-3 px-4 py-3 font-semibold text-slate-950 focus:not-sr-only focus:outline-2 focus:outline-offset-2 focus:outline-sky-500"
      >
        Skip to main content
      </a>
      <div className="min-h-screen transition-colors duration-300">
        <Alert preview={preview} />
        <Header />
        <main id="main-content" tabIndex={-1} className="pt-28">
          {children}
        </main>
      </div>
      <Footer />
      <Analytics />
    </>
  )
}
