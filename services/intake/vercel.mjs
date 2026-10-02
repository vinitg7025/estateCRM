// Vercel entry (Services, Hono preset). index.ts is bundled into one ES module by `pnpm bundle:vercel`
// (tools/bundle-service.mjs): Vercel's function bundle has no package.json, so plain .js would load as CommonJS.
export { default } from './dist/vercel/app.mjs';
