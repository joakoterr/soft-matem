// Ensambla dist/index.html: un único archivo autocontenido.
// KaTeX (CSS + fuentes woff2) se incrusta como data-URI porque el CSP de los
// Artifacts sólo admite hojas de estilo de fonts.googleapis.com.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

function katexCss() {
  let css = rd('vendor/katex.min.css');
  // Dejamos una sola fuente por familia: woff2 en data-URI.
  css = css.replace(/,url\(fonts\/[\w-]+\.woff\)\s*format\("woff"\)/g, '');
  css = css.replace(/,url\(fonts\/[\w-]+\.ttf\)\s*format\("truetype"\)/g, '');
  css = css.replace(/url\(fonts\/([\w-]+)\.woff2\)/g, (_, name) => {
    const b64 = fs.readFileSync(path.join(ROOT, 'vendor/fonts', `${name}.woff2`)).toString('base64');
    return `url(data:font/woff2;base64,${b64})`;
  });
  if (/url\(fonts\//.test(css)) throw new Error('Quedaron referencias a fuentes sin incrustar');
  return css;
}

const UNIDADES = fs.readdirSync(path.join(ROOT, 'src/content'))
  .filter((f) => /^u\d+\.js$/.test(f))
  .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));

const MODULOS = ['util.js', 'store.js', 'mate.js', 'engine.js', 'render.js', 'screens.js', 'paneles.js', 'app.js'];

const js = [
  rd('vendor/katex.min.js'),
  ...UNIDADES.map((f) => rd(`src/content/${f}`)),
  rd('src/content/curso.js'),
  ...MODULOS.map((f) => rd(`src/js/${f}`)),
].join('\n;\n');

const html = rd('src/shell.html')
  .replace('/*@KATEX_CSS@*/', () => katexCss())
  .replace('/*@APP_CSS@*/', () => rd('src/styles.css'))
  .replace('/*@APP_JS@*/', () => js);

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/index.html'), html);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`dist/index.html  ${kb(Buffer.byteLength(html))}`);
console.log(`  unidades: ${UNIDADES.length} (${UNIDADES.join(', ')})`);
