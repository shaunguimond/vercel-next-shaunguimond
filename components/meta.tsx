import Head from 'next/head'
import { useTheme } from 'next-themes'

// Browser-chrome colours for the two themes. The light value is
// --color-laccent-1 (#acb1db at 70% alpha) composited over the white canvas
// that the browser paints behind <body>, which is what `bg-laccent-1` renders
// as; the dark value is --color-daccent-1.
const THEME_COLORS = {
  light: '#c5c8e6',
  dark: '#242a3e',
}

export default function Meta() {
  const { systemTheme, theme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme

  const renderThemeIcons = () => {
    // `apple-touch-icon-dark` is not a registered link type, so browsers
    // dropped the dark icon entirely. The valid relation is always
    // `apple-touch-icon`; switching which file it points at is what implements
    // the dark variant, mirroring the theme switch for the favicons.
    if (currentTheme === 'dark') {
      return (
        <>
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/favicon/apple-touch-icon-dark.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon/favicon-32x32-dark.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon/favicon-16x16-dark.png"
          />
          <link rel="shortcut icon" href="/favicon/favicon-dark.ico" />
        </>
      )
    }

    return (
      <>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
      </>
    )
  }

  return (
    <Head>
      {renderThemeIcons()}
      <link rel="manifest" href="/favicon/site.webmanifest" />
      <link rel="me" href="https://sifa.id/p/shaunguimond.com" />
      <link
        rel="mask-icon"
        href="/favicon/safari-pinned-tab.svg"
        color="#000000"
      />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
      {/*
        `#000` matched neither theme, so the browser chrome never matched the
        page. Next's <Head> de-duplicates <meta> by name, so only one
        theme-color can be emitted; it follows the resolved theme the same way
        the favicons above do.
      */}
      <meta
        name="theme-color"
        content={currentTheme === 'dark' ? THEME_COLORS.dark : THEME_COLORS.light}
      />
      <meta
        name="description"
        content="Essays on technology, business, travel, and personal projects by Shaun Guimond."
      />
    </Head>
  )
}
