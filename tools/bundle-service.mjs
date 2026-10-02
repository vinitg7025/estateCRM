// Bundles one backend service into a single ES module for Vercel Services (CR-013).
// Vercel's function bundle does not carry the service's package.json, so Node loads plain .js files as CommonJS and
// our ESM fails on its first `import`. A self-contained .mjs is ESM regardless of package.json.
// Usage (from a service folder): node ../../tools/bundle-service.mjs [entry] [outfile]
// Defaults: index.ts → dist/vercel/app.mjs (the Vercel entrypoint re-exports it).
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// pdfkit (used by @react-pdf/renderer in journeys) loads its standard fonts with `require$1('#standard-fonts/…')`, where
// require$1 = createRequire(import.meta.url). esbuild cannot follow that alias, so the fonts would be missing from the
// bundle; rewriting it to a plain require() lets esbuild resolve pdfkit's "imports" map and inline the fonts.
const pdfkitStandardFonts = {
  name: 'pdfkit-standard-fonts',
  setup(b) {
    b.onLoad({ filter: /[\\/]pdfkit[\\/]js[\\/]pdfkit\.node\.mjs$/ }, (args) => ({
      contents: readFileSync(args.path, 'utf8').replaceAll(
        "require$1('#standard-fonts/",
        "require('#standard-fonts/",
      ),
      loader: 'js',
    }));
  },
};

const cwd = process.cwd();
const [entry = 'index.ts', outfile = 'dist/vercel/app.mjs'] = process.argv.slice(2);
const { name } = JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf8'));

const result = await build({
  absWorkingDir: cwd,
  entryPoints: [entry],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  sourcemap: true,
  legalComments: 'none',
  metafile: true,
  logLevel: 'warning',
  // pg loads pg-native only if it is installed; we never install it.
  external: ['pg-native'],
  plugins: [pdfkitStandardFonts],
  // Bundled CommonJS dependencies call require() for Node built-ins and use __dirname / __filename.
  banner: {
    js: [
      "import { createRequire as __bundleCreateRequire } from 'node:module';",
      "import { fileURLToPath as __bundleFileURLToPath } from 'node:url';",
      "import { dirname as __bundleDirname } from 'node:path';",
      'const require = __bundleCreateRequire(import.meta.url);',
      'const __filename = __bundleFileURLToPath(import.meta.url);',
      'const __dirname = __bundleDirname(__filename);',
    ].join('\n'),
  },
});

const bytes = Object.values(result.metafile.outputs).reduce((sum, o) => sum + o.bytes, 0);
process.stdout.write(`${name}: ${outfile} (${(bytes / 1024 / 1024).toFixed(1)} MB incl. source map)\n`);
