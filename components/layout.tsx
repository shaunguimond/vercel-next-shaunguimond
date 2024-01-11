import Alert from './alert'
import Footer from './footer'
import Header from './header'
import Meta from './meta'

export default function Layout({ preview, children}) {
  return (
    <>
      <Meta />
      <div className="min-h-screen">
        <Alert preview={preview} />
        <Header />
        <main className="pt-28 bg-laccent-1 dark:bg-daccent-1">{children}</main>
      </div>
      <Footer />
    </>
  )
}
