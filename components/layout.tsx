import Alert from './alert'
import Footer from './footer'
import Header from './header'
import Meta from './meta'
import { Analytics } from "@vercel/analytics/react"

export default function Layout({ preview, children}) {
  return (
    <>
      <Meta />
      <div className="min-h-screen transition-colors duration-300">
        <Alert preview={preview} />
        <Header />
        <main className="pt-28">{children}</main>
      </div>
      <Footer />
      <Analytics />
    </>
  )
}
