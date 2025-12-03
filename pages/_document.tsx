import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head />
      <body className="bg-laccent-1 dark:bg-daccent-1 transition-colors duration-300">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
