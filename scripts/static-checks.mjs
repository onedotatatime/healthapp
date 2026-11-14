// Static checks over the repo and the build output (CTO decision 3, section 3). Run after `npm run build`.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const fails = [];
const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);

// 1. No .env file tracked except .env.example.
for (const f of tracked) {
  const base = f.split('/').pop();
  if (/^\.env(\..+)?$/.test(base) && base !== '.env.example') fails.push(`tracked env file: ${f}`);
}
if (!tracked.includes('.env.example')) fails.push('.env.example is not tracked');

// 2. No key pattern in tracked files (docs and this script excluded: they name the patterns in prose).
const keyPatterns = [
  /sb_secret_[A-Za-z0-9_-]{10,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, // a JWT (anon or service role)
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/,
];
for (const f of tracked) {
  if (f.startsWith('docs/') || f === 'scripts/static-checks.mjs' || f === 'package-lock.json') continue;
  let text;
  try { text = readFileSync(f, 'utf8'); } catch { continue; }
  for (const p of keyPatterns) if (p.test(text)) fails.push(`key pattern ${p} in ${f}`);
}

// 3. The built bundle holds no secret name or value.
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
if (!existsSync('dist')) fails.push('dist/ missing: run `npm run build` first');
else {
  for (const f of walk('dist')) {
    if (!/\.(js|html|css|map|webmanifest)$/.test(f)) continue;
    const text = readFileSync(f, 'utf8');
    // supabase-js itself contains the bare prefix `sb_secret_` (it refuses secret keys in a browser), so a
    // bare prefix is not a finding: a prefix followed by key characters is. A JWT whose role is service_role is.
    if (/service_role|sb_secret_[A-Za-z0-9_-]{10,}|SUPABASE_SERVICE_ROLE_KEY/.test(text)) fails.push(`secret name or value in bundle: ${f}`);
    for (const m of text.match(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*/g) ?? []) {
      try {
        const role = JSON.parse(Buffer.from(m.split('.')[1], 'base64url').toString()).role;
        if (role === 'service_role') fails.push(`service_role JWT in bundle: ${f}`);
      } catch { /* not a JWT */ }
    }
    if (/password\s*[:=]\s*["'][^"']{4,}/i.test(text)) fails.push(`password literal in bundle: ${f}`);
  }
  // 4. dist/_headers holds the required lines.
  const h = existsSync('dist/_headers') ? readFileSync('dist/_headers', 'utf8') : '';
  const need = [
    'Referrer-Policy: no-referrer',
    'Permissions-Policy: camera=(self)',
    'X-Robots-Tag: noindex, nofollow',
    'Cache-Control: no-cache',
    'Cache-Control: public, max-age=31536000, immutable',
  ];
  for (const n of need) if (!h.includes(n)) fails.push(`dist/_headers lacks: ${n}`);
  for (const p of ['/', '/index.html', '/sw.js', '/manifest.webmanifest', '/assets/*']) {
    if (!new RegExp(`^${p.replace(/[*/.]/g, '\\$&')}$`, 'm').test(h)) fails.push(`dist/_headers lacks rule for ${p}`);
  }
  if (/^\/\*\n(?:\s+.*\n)*?\s+Cache-Control/m.test(h)) fails.push('dist/_headers puts Cache-Control on /* (CTO decision: not allowed)');
  // 5. The service worker never touches a cross-origin or non-GET request.
  const sw = readFileSync('dist/sw.js', 'utf8');
  if (!sw.includes("req.method !== 'GET'") || !sw.includes('url.origin !== self.location.origin')) fails.push('sw.js does not pass through non-GET / cross-origin requests');
}

if (fails.length) { console.error('static checks FAILED:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('static checks passed');
