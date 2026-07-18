/**
 * Asset path helpers.
 *
 * On GitHub Pages the site is served under a sub-path (`/birthday`), so any
 * URL beginning with `/assets/...` must be prefixed with that base path.
 * Locally we serve the site from the root, so we just use the original
 * leading slash.
 *
 * The base path mirrors the `basePath` / `assetPrefix` setting in
 * `next.config.ts` (`/birthday` in production, empty string locally).
 *
 * Both `basePath` (for joining with a leading slash) and `assetPath`
 * (for wrapping an existing absolute path) are exported so callers can pick
 * whichever is most convenient.
 */

const isProd = process.env.NODE_ENV === "production";

/**
 * The configured base path, e.g. `/birthday` in production or `""` locally.
 * Always starts with a single leading slash (unless empty).
 *
 * Mirrors the logic in `next.config.ts` so client-side code (this helper)
 * agrees with Next.js's built-in `basePath` / `assetPrefix` handling.
 */
export const basePath: string = isProd ? "/birthday" : "";

/**
 * Join the configured base path with a path that is **expected to start
 * with `/`** (for example a public asset like `/assets/birthday/foo.png`).
 *
 * @example
 *   assetPath("/assets/birthday/decorate.png")
 *   // local:      "/assets/birthday/decorate.png"
 *   // production: "/birthday/assets/birthday/decorate.png"
 */
export function assetPath(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${basePath}${path}`;
}
