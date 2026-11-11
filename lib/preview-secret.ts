/**
 * The value of `WORDPRESS_PREVIEW_SECRET`, unless it is the example.
 *
 * `/api/preview` is the door to Next.js preview mode, which renders unpublished
 * posts, so the secret in front of it is only as strong as the value the
 * deployment sets. This repository carries a placeholder in `.env` so a fresh
 * clone runs without configuration; if a deployment inherits that file instead
 * of overriding the variable, then the secret is public, and checking against it
 * only proves the visitor read this repository.
 *
 * So an example value is treated as no secret at all: the route refuses every
 * request rather than accepting the one guess anyone can make. Set a real random
 * value in the deployment's environment to turn preview mode on.
 */
const EXAMPLE_SECRETS = new Set([
  'a-strong-preview-secret-key-change-in-production',
  'next-preview-secret',
])

export function previewSecret(): string | undefined {
  const configured = process.env.WORDPRESS_PREVIEW_SECRET
  if (!configured || EXAMPLE_SECRETS.has(configured)) return undefined
  return configured
}
