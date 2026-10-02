import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { stripPathPrefixes } from '../src/index.js';

const inner = new Hono();
inner.get('/health/live', (c) => c.json({ path: c.req.path, q: c.req.query('x') ?? null }));
inner.post('/v1/echo', async (c) => c.json({ path: c.req.path, body: await c.req.json<unknown>() }));
inner.notFound((c) => c.json({ notFound: c.req.path }, 404));
const app = stripPathPrefixes(inner, ['/svc/records', '/public']);

describe('stripPathPrefixes', () => {
  it('strips the first matching prefix and keeps the query string', async () => {
    const r = await app.request('/svc/records/health/live?x=1');
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ path: '/health/live', q: '1' });
  });

  it('passes paths without a prefix through unchanged', async () => {
    expect(await (await app.request('/health/live')).json()).toEqual({ path: '/health/live', q: null });
  });

  it('only matches whole path segments', async () => {
    const r = await app.request('/publicity/health/live');
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({ notFound: '/publicity/health/live' });
  });

  it('forwards method, headers and body', async () => {
    const r = await app.request('/public/v1/echo', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ a: 1 }),
    });
    expect(await r.json()).toEqual({ path: '/v1/echo', body: { a: 1 } });
  });

  it('maps the bare prefix to the root path', async () => {
    expect(await (await app.request('/svc/records')).json()).toEqual({ notFound: '/' });
  });
});
