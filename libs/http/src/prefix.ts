// Path prefixes the edge leaves on the request (Vercel Services, CR-013): the platform routes /svc/<service>/… and /public/…
// to the service but does not apply the path transforms in vercel.json, so the service strips them itself.
import { Hono } from 'hono';
import type { Env } from 'hono';

/** Serves `app` with the first matching prefix removed (`/svc/records/health/live` → `/health/live`); other paths pass through. */
export function stripPathPrefixes<E extends Env>(app: Hono<E>, prefixes: readonly string[]): Hono<E> {
  const outer = new Hono<E>();
  outer.all('*', (c) => {
    const url = new URL(c.req.url);
    const prefix = prefixes.find((p) => url.pathname === p || url.pathname.startsWith(`${p}/`));
    if (!prefix) return app.fetch(c.req.raw, c.env);
    url.pathname = url.pathname.slice(prefix.length) || '/';
    return app.fetch(new Request(url, c.req.raw), c.env);
  });
  return outer;
}
