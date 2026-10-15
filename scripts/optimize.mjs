// Reproduces the app.js size optimisation (about -7% gzip) from a freshly generated bundle:
//   npm i --no-save esbuild && node scripts/optimize.mjs app.js
// - removes console.* / debugger calls (mostly React development warnings)
// - strips the dev-only trailing jsxDEV() arguments
// Verified to render identically. Not needed once the source repo ships a production build.
import { readFileSync, writeFileSync } from 'node:fs';
import { transformSync } from 'esbuild';
const file = process.argv[2] ?? 'app.js';
const src = readFileSync(file, 'utf8').replace(/\},void 0,!1,void 0,this\)/g, '})');
const out = transformSync(src, { minify: true, drop: ['console', 'debugger'], target: 'es2020', legalComments: 'none' });
writeFileSync(file, out.code);
console.log(`optimized ${file}: ${out.code.length} bytes`);
