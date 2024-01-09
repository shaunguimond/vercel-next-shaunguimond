import Alert from './alert'
import Footer from './footer'
import Meta from './meta'

export default function Layout({ preview, children, theme }) {
  return (
    <>
      <Meta />
      <div className={theme === "light" ? "light-bg min-h-screen" : "dark-bg min-h-screen"}>
        <Alert preview={preview} />
        <main>{children}</main>
      </div>
      <Footer />
    </>
  )
}
