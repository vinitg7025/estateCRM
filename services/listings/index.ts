// Bundle entry for Vercel (tools/bundle-service.mjs → dist/vercel/app.mjs, re-exported by vercel.mjs): the composed app is
// the default export. Local dev uses src/server.ts.
import { compose } from './src/main.js';

export default compose().app;
