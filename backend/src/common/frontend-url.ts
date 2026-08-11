/**
 * Origin of the frontend, with any trailing slash removed.
 *
 * A trailing slash on FRONTEND_URL is easy to paste in from a browser bar and
 * breaks two things silently: redirects become `https://host//tasks`, and the
 * CORS `origin` no longer matches the browser's `Origin` header (which never
 * carries a trailing slash).
 */
export function resolveFrontendUrl(value?: string): string {
  const url = value?.trim() || 'http://localhost:3000';
  return url.replace(/\/+$/, '');
}
