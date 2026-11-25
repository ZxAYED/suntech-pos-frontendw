import { build } from 'esbuild';
import { mkdir, readdir, unlink, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

const root = process.cwd();
const output = resolve(root, 'public/offline-assets');
await mkdir(output, { recursive: true });
await mkdir(resolve(root, 'public/fonts'), { recursive: true });
const fontUrls = [];
let fontsCss = '';
for (const [family, subset, weights] of [['poppins', 'latin', [400, 500, 600, 700]], ['noto-sans-bengali', 'bengali', [400, 600, 700]], ['noto-sans-bengali', 'latin', [400, 600, 700]]]) {
  for (const weight of weights) {
    const name = `${family}-${subset}-${weight}-normal.woff2`;
    await copyFile(resolve(root, `node_modules/@fontsource/${family}/files/${name}`), resolve(root, `public/fonts/${name}`));
    fontUrls.push(`/fonts/${name}`);
    const display = family === 'poppins' ? 'Poppins' : 'Noto Sans Bengali';
    fontsCss += `@font-face{font-family:'${display}';font-style:normal;font-weight:${weight};font-display:swap;src:url('/fonts/${name}') format('woff2');${subset === 'bengali' ? 'unicode-range:U+0980-09FF,U+200C-200D,U+25CC;' : 'unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20A0-20AB,U+20AD-20FF,U+2212,U+2215;'}}\n`;
  }
  await copyFile(resolve(root, `node_modules/@fontsource/${family}/LICENSE`), resolve(root, `public/fonts/${family}-LICENSE.txt`));
}
await writeFile(resolve(root, 'public/fonts/fonts.css'), fontsCss);
const result = await build({
  absWorkingDir: root, entryPoints: ['src/features/offline/pwa/entry.tsx'], outdir: output,
  entryNames: 'app-[hash]', chunkNames: 'chunk-[hash]', assetNames: 'asset-[hash]',
  bundle: true, splitting: true, format: 'esm', platform: 'browser', target: ['es2022'],
  minify: true, metafile: true, sourcemap: false, jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'process.env.NEXT_PUBLIC_OFFLINE_INTAKE': JSON.stringify(process.env.NEXT_PUBLIC_OFFLINE_INTAKE ?? 'true'), 'process.env.NEXT_PUBLIC_ADVANCED_OFFLINE_COMMANDS': JSON.stringify(process.env.NEXT_PUBLIC_ADVANCED_OFFLINE_COMMANDS ?? 'false') },
  alias: { 'next/navigation': resolve(root, 'src/features/offline/pwa/navigation.tsx'), 'next/link': resolve(root, 'src/features/offline/pwa/navigation.tsx'), 'next/image': resolve(root, 'src/features/offline/pwa/image.tsx') },
  logLevel: 'warning',
});
const css = await postcss([tailwind({ base: root, optimize: true })]).process(await readFile(resolve(root, 'src/app/globals.css'), 'utf8'), { from: resolve(root, 'src/app/globals.css') });
const cssHash = createHash('sha256').update(css.css).digest('hex').slice(0, 12);
const cssUrl = `/offline-assets/styles-${cssHash}.css`;
await writeFile(resolve(root, `public${cssUrl}`), css.css);
const built = Object.keys(result.metafile.outputs).map(file => '/' + file.replaceAll('\\', '/').replace(/^.*?public\//, ''));
const entry = Object.entries(result.metafile.outputs).find(([, meta]) => meta.entryPoint === 'src/features/offline/pwa/entry.tsx')?.[0];
if (!entry) throw new Error('Offline bundle entry missing');
const entryUrl = '/' + entry.replaceAll('\\', '/').replace(/^.*?public\//, '');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0052FF"><title>SunTech POS</title><link rel="manifest" href="/manifest.json"><link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="${cssUrl}"></head><body><div id="suntech-offline-root"><p>Opening saved workspace…</p></div><script type="module" src="${entryUrl}"></script></body></html>`;
const version = createHash('sha256').update(html + fontsCss).digest('hex').slice(0, 16);
const shell = `/offline-assets/shell-${version}.html`;
await writeFile(resolve(root, `public${shell}`), html);
const assets = [...new Set([shell, ...built, cssUrl, '/fonts/fonts.css', ...fontUrls, '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'])];
const template = await readFile(resolve(root, 'scripts/service-worker.template.js'), 'utf8');
await writeFile(resolve(root, 'public/suntech-sw.js'), template.replace('__SUNTECH_VERSION__', JSON.stringify(version)).replace('__SUNTECH_SHELL__', JSON.stringify(shell)).replace('__SUNTECH_ASSETS__', JSON.stringify(assets)));
await writeFile(resolve(root, 'public/offline-build.json'), JSON.stringify({ version, shell, assets, generatedAt: new Date().toISOString() }, null, 2));
// Clean only obsolete generated application assets, never browser data.
const keep = new Set(assets.filter(url => url.startsWith('/offline-assets/')).map(url => url.slice('/offline-assets/'.length)));
for (const file of await readdir(output)) if (!keep.has(file) && /^(?:app-|chunk-|asset-|styles-|shell-)/.test(file)) await unlink(resolve(output, file));
console.log(`Offline shell ${version}: ${assets.length} public assets; existing POS components shared.`);
