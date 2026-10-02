// Bundle entry for Vercel (tools/bundle-service.mjs → dist/vercel/app.mjs, re-exported by vercel.mjs): the composed app is
// the default export. Local dev uses src/server.ts.
import { stripPathPrefixes } from '@11e/http';
import { compose } from './src/main.js';

// Vercel Services routes /svc/<service>/… here without stripping the prefix (CR-013).
export default stripPathPrefixes(compose().app, ['/svc/crm-engine']);
