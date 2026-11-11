if (!URL.canParse(process.env.WORDPRESS_API_URL)) {
  throw new Error(`
    Please provide a valid WordPress instance URL.
    Add to your environment variables WORDPRESS_API_URL.
  `)
}

// Throw early (with a clear message) if WORDPRESS_API_URL is missing/invalid.
new URL(process.env.WORDPRESS_API_URL)

/** @type {import('next').NextConfig} */
module.exports = {
  // The framework banner is only a fingerprint for automated scanners; the
  // site reveals nothing that the HTML and JS bundles do not already show.
  poweredByHeader: false,
  // Bundle sanitize-html and its ESM-only htmlparser2 dependency into Pages
  // Router server functions instead of loading them through Node's require().
  transpilePackages: ["sanitize-html"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wp.shaunguimond.com",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "**.smushcdn.com",
      },
      {
        protocol: "https",
        hostname: "cdn.bsky.app",
      },
      {
        protocol: "https",
        hostname: "avatars.bsky.app",
      },
      {
        protocol: "https",
        hostname: "pbs.bsky.app",
      },
      {
        protocol: "https",
        hostname: "video.bsky.app",
      },
      {
        protocol: "https",
        hostname: "atp.shaunguimond.com",
      },
    ],
  },
  // `/sitemap.xml` and `/feed.xml` are XML payloads, and Pages Router only
  // emits those from API routes: a page would arrive wrapped in the HTML
  // document shell. The rewrite keeps the conventional crawlable URLs out of
  // robots.txt, the sitemap, and the feed's self-link instead of exposing the
  // `/api` path in all three. Applied after `pages/` and `public/`, so nothing
  // here shadows a real route.
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/api/sitemap' },
      { source: '/feed.xml', destination: '/api/feed' },
      { source: '/feed', destination: '/api/feed' },
      { source: '/rss.xml', destination: '/api/feed' },
      { source: '/atom.xml', destination: '/api/feed' },
    ]
  },
  async headers() {
    // Vercel already sends Strict-Transport-Security, so it is not set here.
    //
    // The CSP only applies in production. Next.js dev mode needs eval-based
    // HMR chunks, which a strict script-src would block.
    //
    // 'unsafe-inline' is required for scripts by next-themes (theme
    // bootstrap script) and for the inline style attributes that WordPress
    // generates for block spacing. The sanitizers in lib/sanitize.ts and
    // the Bluesky text formatter are the first line of defense; this CSP is
    // the second line. It still blocks remote scripts, remote objects,
    // framing, and limits where client-side fetches can go.
    // The Vercel platform injects the Toolbar (deploy previews + comments)
    // into preview deployments. It loads scripts, an iframe, styles, fonts,
    // and images from vercel.live and uses a Pusher WebSocket. Vercel's
    // documented CSP requirements are added for preview environments only
    // (VERCEL_ENV is set by Vercel), so the production CSP stays closed to
    // all external scripts.
    //
    // The one external frame allowed in production is sifa.id: the About
    // page shows a Sifa profile card via <iframe src="https://sifa.id/embed/
    // <handle>">, the same URL Sifa's own embed-builder preview iframes.
    const isPreview = process.env.VERCEL_ENV === "preview";

    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isPreview ? " https://vercel.live" : ""}`,
      `style-src 'self' 'unsafe-inline'${isPreview ? " https://vercel.live" : ""}`,
      `img-src 'self' data: blob: https://wp.shaunguimond.com https://*.smushcdn.com https://secure.gravatar.com https://cdn.bsky.app https://avatars.bsky.app https://pbs.bsky.app https://video.bsky.app https://atp.shaunguimond.com${isPreview ? " https://vercel.live https://vercel.com" : ""}`,
      `font-src 'self'${isPreview ? " https://vercel.live https://assets.vercel.com" : ""}`,
      `connect-src 'self' https://public.api.bsky.app https://video.bsky.app https://wp.shaunguimond.com https://atp.shaunguimond.com https://vercel.com https://va.vercel-insights.com https://vitals.vercel-insights.com${isPreview ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
      "media-src 'self' blob: https://video.bsky.app",
      "object-src 'none'",
      `frame-src 'none' https://sifa.id${isPreview ? " https://vercel.live" : ""}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    const headers = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
      },
      {
        key: "Permissions-Policy",
        value:
          "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), fullscreen=()",
      },
    ];

    if (process.env.NODE_ENV === "production") {
      headers.push({ key: "Content-Security-Policy", value: csp });
    }

    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
}
