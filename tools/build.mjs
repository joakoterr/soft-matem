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

const MODULOS = ['util.js', 'store.js', 'mate.js', 'engine.js', 'render.js', 'screens.js', 'profe-api.js', 'paneles.js', 'app.js'];

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

const MARCA = '<!--@FIN_CABEZA@-->';
const [cabeza, cuerpo] = html.split(MARCA);
if (cuerpo === undefined) throw new Error('falta el marcador @FIN_CABEZA@ en shell.html');

// 1) Cuerpo suelto: es lo que espera la plataforma de Artifacts, que agrega
//    su propio <!doctype>, <head> y <body>.
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const artifact = cabeza + cuerpo;
fs.writeFileSync(path.join(ROOT, 'dist/index.html'), artifact);

// 2) Página completa: sirve para abrir con doble clic y para publicarla en
//    cualquier hosting estático.
const TITULO = 'Cuaderno de Análisis III';
const RESUMEN = 'Practicá Análisis Matemático III como si fuera un juego: '
  + 'ecuaciones diferenciales, transformada de Laplace, series de Fourier y variable compleja. '
  + '39 lecciones y 389 ejercicios con la teoría al lado.';
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'"
  + "%3E%3Crect width='64' height='64' rx='14' fill='%234B5BD7'/%3E%3Ctext x='32' y='47' "
  + "font-size='44' font-family='Georgia,serif' fill='%23ffffff' text-anchor='middle'"
  + "%3E%E2%88%AB%3C/text%3E%3C/svg%3E";

const pagina = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${RESUMEN}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#EFF3FB" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0F1A16" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_AR">
<meta property="og:title" content="${TITULO}">
<meta property="og:description" content="${RESUMEN}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${FAVICON}">
${cabeza.trim()}
<style>
:root { color-scheme: light dark; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
body { margin: 0; font: 14px system-ui, sans-serif; }
img { max-width: 100%; }
[hidden] { display: none !important; }
</style>
</head>
<body>
${cuerpo.trim()}
</body>
</html>
`;
fs.mkdirSync(path.join(ROOT, 'public'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'public/index.html'), pagina);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`dist/index.html    ${kb(Buffer.byteLength(artifact))}   (cuerpo para el Artifact)`);
console.log(`public/index.html  ${kb(Buffer.byteLength(pagina))}   (página completa para hosting)`);
console.log(`  unidades: ${UNIDADES.length} (${UNIDADES.join(', ')})`);
