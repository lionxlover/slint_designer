// Verifies the static site and assembles ./_site for deployment.
//   node scripts/build.mjs --check   verify only
//   node scripts/build.mjs           verify, copy to _site/, stamp sw.js with a content hash
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';

const cfg = JSON.parse(readFileSync('scripts/files.json', 'utf8'));
const sha = (b, a = 'sha256') => createHash(a).update(b).digest('hex');
const errors = [];
const fail = (m) => errors.push(m);

for (const f of cfg.publish) if (!existsSync(f)) fail(`missing publish file: ${f}`);

for (const [f, want] of Object.entries(cfg.vendorSha256))
  if (existsSync(f) && sha(readFileSync(f)) !== want) fail(`vendor file changed (hash mismatch): ${f}`);

const html = readFileSync('index.html', 'utf8');
if (!/http-equiv="Content-Security-Policy"/.test(html)) fail('index.html: CSP meta tag missing');
if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) fail('index.html: inline <script> would be blocked by CSP');
if (/(?:src|href)="https?:\/\//.test(html.replace(/rel="canonical"[^>]*|property="og:image"[^>]*/g, '')))
  fail('index.html: external resource reference (CSP only allows same-origin)');
if (/'unsafe-eval'/.test(html)) fail("index.html: CSP must not contain 'unsafe-eval'");

try {
  const m = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
  for (const i of m.icons) if (!existsSync(i.src)) fail(`manifest icon missing: ${i.src}`);
} catch (e) { fail(`manifest.webmanifest invalid: ${e.message}`); }

const sw = readFileSync('sw.js', 'utf8');
for (const [, u] of sw.matchAll(/'((?:\.\/|[\w.-]+\/)?[\w./-]*)'/g))
  if (u && /\.(js|css|html|svg|png|webmanifest)$/.test(u) && !existsSync(u)) fail(`sw.js precache entry missing: ${u}`);

if (errors.length) { console.error('✗ checks failed:\n  - ' + errors.join('\n  - ')); process.exit(1); }
console.log('✓ checks passed');
if (process.argv.includes('--check')) process.exit(0);

rmSync('_site', { recursive: true, force: true });
const h = createHash('sha256');
for (const f of cfg.publish) {
  mkdirSync(dirname(join('_site', f)), { recursive: true });
  cpSync(f, join('_site', f));
  if (f !== 'sw.js') h.update(readFileSync(f));
}
const build = h.digest('hex').slice(0, 12);
writeFileSync('_site/sw.js', sw.replace("const BUILD = 'dev';", `const BUILD = '${build}';`));
writeFileSync('_site/.nojekyll', '');
console.log(`✓ _site ready (cache build ${build})`);
