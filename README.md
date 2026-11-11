# A Refactor of my Blog - Shaun Guimond - from the Frontity Framework to Next.js + GraphQL in Wordpress. 

## Project Overview

This project is a portfolio website for Shaun Guimond. It is built using Next.js and WordPress as the data source. The website showcases my skills, projects, and experiences.

## Features

- **Incremental Static Regeneration:** Next.js's Incremental Static Regeneration feature is used to regenerate pages on-demand, improving the performance of the website.
- **WordPress Integration:** The website uses WordPress as the data source, allowing for easy content management.
- **GraphQL API:** The website leverages the GraphQL API provided by WordPress to fetch and display content dynamically. This ensures seamless integration with WordPress and enables efficient data retrieval.
- **Responsive Design:** The website is designed to be responsive, ensuring a good user experience on various devices.
- **Portfolio Showcase:** The website showcases my skills, projects, and experiences, making it a great platform to showcase my portfolio.
- **Bluesky Integration:** Post comments are rendered from the Bluesky (AT Protocol) public API, and recent Bluesky posts are displayed on the home page.
- **Standard Site:** Posts publish Standard Site links (`site.standard.document` records) via a personal PDS.

## Environment Variables

Configuration lives in `.env` (committed on purpose — every value in it is either public or a harmless placeholder):

| Variable                       | Description                                                                                                                                                                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `WORDPRESS_API_URL`            | URL of the WPGraphQL endpoint used for all content queries. Public.                                                                                                                                                                                                                              |
| `WORDPRESS_PREVIEW_SECRET`     | Shared secret that enables WordPress preview mode via `/api/preview`. The value in the repo is a **placeholder example**, and an example value is treated as no secret: set a real random value in the deployment's environment (and in the WordPress preview plugin) or preview mode stays off. |
| `WORDPRESS_AUTH_REFRESH_TOKEN` | _(optional)_ Refresh token for authenticated WPGraphQL queries (needed to preview draft posts). Not set by default.                                                                                                                                                                              |
| `PDS_URL`                      | URL of the personal (Atmosphere) PDS hosting `site.standard.document` records. Public.                                                                                                                                                                                                           |
| `PDS_DID`                      | DID of the repo on the PDS that owns the standard-site records. Public.                                                                                                                                                                                                                          |

## Scripts

Node.js 22 or newer, matching the runtime the site is deployed to.

| Command          | Description                                        |
| ---------------- | -------------------------------------------------- |
| `pnpm dev`       | Start the development server.                      |
| `pnpm lint`      | Run Biome lint rules over the project.             |
| `pnpm format`    | Format supported project files with Biome.         |
| `pnpm test`      | Run the Vitest suite.                              |
| `pnpm typecheck` | Run TypeScript without emitting files.             |
| `pnpm build`     | Production build (also runs the TypeScript check). |
| `pnpm start`     | Serve the production build.                        |

Pull requests run linting, the test suite, a typecheck, and a production build —
the build because it is the only check that evaluates `next.config.js` and the
static generation of every page. Use the Biome editor extension or `pnpm format`
to format files; Biome is used because the project is on TypeScript 7, which
typescript-eslint did not support.

## Dependency updates

Renovate opens pull requests on a weekly schedule: routine minor and patch
updates in one, the Next.js and React majors separately, and the toolchain apart
from the runtime. They are not auto-merged, because every one of them gets a
Vercel preview build worth looking at before it reaches `main`.

To update by hand, `pnpm update -i` walks through the interactive prompt.
`pnpm outdated` does not work here: the package is `private: true`, so the
registry answers the version check with `401 Unauthorized`.
