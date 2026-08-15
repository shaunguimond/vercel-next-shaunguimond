if (!URL.canParse(process.env.WORDPRESS_API_URL)) {
  throw new Error(`
    Please provide a valid WordPress instance URL.
    Add to your environment variables WORDPRESS_API_URL.
  `)
}

const { protocol, hostname, port, pathname } = new URL(
  process.env.WORDPRESS_API_URL
)

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
      // Bluesky CDN hosts (user avatars and embedded images).
      // cdn.bsky.app is where avatar/image blobs are actually served from
      // (e.g. /img/avatar/plain/... and /img/feed/plain/...); the others are
      // kept for the PDS avatar proxy.
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
      // This site's own PDS (avatars/images for accounts hosted on it).
      {
        protocol: "https",
        hostname: "atp.shaunguimond.com",
      },
    ],
  },
}
