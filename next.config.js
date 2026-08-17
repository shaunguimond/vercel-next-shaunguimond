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
        hostname: "atp.shaunguimond.com",
      },
    ],
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
    // all external scripts and frames.
    //
    // sifa.id is the one external script allowed: the profile embed on the
    // About page. It also fetches profile data (connect-src) and may render
    // an avatar image from its own origin (img-src).
    const isPreview = process.env.VERCEL_ENV === "preview";

    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' https://sifa.id${isPreview ? " https://vercel.live" : ""}`,
      `style-src 'self' 'unsafe-inline'${isPreview ? " https://vercel.live" : ""}`,
      `img-src 'self' data: blob: https://wp.shaunguimond.com https://*.smushcdn.com https://secure.gravatar.com https://cdn.bsky.app https://avatars.bsky.app https://pbs.bsky.app https://atp.shaunguimond.com https://sifa.id${isPreview ? " https://vercel.live https://vercel.com" : ""}`,
      `font-src 'self'${isPreview ? " https://vercel.live https://assets.vercel.com" : ""}`,
      `connect-src 'self' https://public.api.bsky.app https://wp.shaunguimond.com https://atp.shaunguimond.com https://vercel.com https://va.vercel-insights.com https://vitals.vercel-insights.com https://sifa.id${isPreview ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
      "object-src 'none'",
      `frame-src ${isPreview ? "https://vercel.live" : "'none'"}`,
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
