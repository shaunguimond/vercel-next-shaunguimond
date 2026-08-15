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
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://wp.shaunguimond.com https://*.smushcdn.com https://secure.gravatar.com https://cdn.bsky.app https://avatars.bsky.app https://pbs.bsky.app https://atp.shaunguimond.com",
      "font-src 'self'",
      "connect-src 'self' https://public.api.bsky.app https://wp.shaunguimond.com https://atp.shaunguimond.com https://vercel.com https://va.vercel-insights.com https://vitals.vercel-insights.com",
      "object-src 'none'",
      "frame-src 'none'",
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
