import { AppProps } from 'next/app'
import '../styles/index.css'
import { ThemeProvider } from 'next-themes'

function MyApp({ Component, pageProps }: AppProps) {
  return (
  <ThemeProvider enableSystem={true} attribute="class" disableTransitionOnChange>
    <Component {...pageProps} />
  </ThemeProvider>
  )
}

export default MyApp
