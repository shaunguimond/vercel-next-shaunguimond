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
      {
        protocol: "https",
        hostname: "avatars.bsky.app",
      },
      {
        protocol: "https",
        hostname: "pbs.bsky.app",
      },
    ],
  },
}
