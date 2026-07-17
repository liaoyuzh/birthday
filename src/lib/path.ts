/**
 * Asset path helpers.
 *
 * On GitHub Pages the site is served under a sub-path (`/birthday`), so any
 * URL beginning with `/assets/...` must be prefixed with that base path.
 * Locally we serve the site from the root, so we just use the original
 * leading slash.
 *
 * The values are read at build / runtime from
 * `process.env.NEXT_PUBLIC_BASE_PATH`, populated via `.env.development`
 * (empty string) and `.env.production` (e.g. `/birthday`).
 *
 * Both `basePath` (for joining with a leading slash) and `assetPath`
 * (for wrapping an existing absolute path) are exported so callers can pick
 * whichever is most convenient.
 */

const RAW_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * The configured base path, e.g. `/birthday` in production or `""` locally.
 * Always starts with a single leading slash (unless empty).
 */
export const basePath: string = RAW_BASE_PATH.startsWith("/")
  ? RAW_BASE_PATH
  : RAW_BASE_PATH
    ? `/${RAW_BASE_PATH}`
    : "";

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
