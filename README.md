# A Refactor of my Blog - Shaun Guimond - from the Frontity Framework to Next.js + GraphQL in Wordpress. 

## Project Overview
This project is a portfolio website for Shaun Guimond. It is built using Next.js and WordPress as the data source. The website showcases my skills, projects, and experiences.

## Features
* **Incremental Static Regeneration:** Next.js's Incremental Static Regeneration feature is used to regenerate pages on-demand, improving the performance of the website.
* **WordPress Integration:** The website uses WordPress as the data source, allowing for easy content management.
* **GraphQL API:** The website leverages the GraphQL API provided by WordPress to fetch and display content dynamically. This ensures seamless integration with WordPress and enables efficient data retrieval.
* **Responsive Design:** The website is designed to be responsive, ensuring a good user experience on various devices.
* **Portfolio Showcase:** The website showcases my skills, projects, and experiences, making it a great platform to showcase my portfolio.
* **Bluesky Integration:** Post comments are rendered from the Bluesky (AT Protocol) public API, and recent Bluesky posts are displayed on the home page.
* **Standard Site:** Posts publish Standard Site links (`site.standard.document` records) via a personal PDS.

## Environment Variables

Configuration lives in `.env` (committed on purpose — every value in it is either public or a harmless placeholder):

| Variable | Description |
| --- | --- |
| `WORDPRESS_API_URL` | URL of the WPGraphQL endpoint used for all content queries. Public. |
| `WORDPRESS_PREVIEW_SECRET` | Shared secret that enables WordPress preview mode via `/api/preview`. The value in the repo is a **placeholder example**; set a real random value here and in the WordPress preview plugin. |
| `WORDPRESS_AUTH_REFRESH_TOKEN` | *(optional)* Refresh token for authenticated WPGraphQL queries (needed to preview draft posts). Not set by default. |
| `PDS_URL` | URL of the personal (Atmosphere) PDS hosting `site.standard.document` records. Public. |
| `PDS_DID` | DID of the repo on the PDS that owns the standard-site records. Public. |

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server. |
| `pnpm build` | Production build (also runs the TypeScript check). |
| `pnpm start` | Serve the production build. |
| `pnpm lint` | Run ESLint (flat config in `eslint.config.mjs`). |

