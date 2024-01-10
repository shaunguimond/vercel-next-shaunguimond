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
        <main>{children}</main>
      </div>
      <Footer />
    </>
  )
}
