/* ===========================================================
   util.js — DOM, texto y matemática tipografiada
   =========================================================== */

const MACROS = {
  '\\sen': '\\operatorname{sen}',
  '\\tg': '\\operatorname{tg}',
  '\\cotg': '\\operatorname{cotg}',
  '\\senh': '\\operatorname{senh}',
  '\\mcd': '\\operatorname{mcd}',
  '\\mcm': '\\operatorname{mcm}',
  '\\N': '\\mathbb{N}',
  '\\Z': '\\mathbb{Z}',
  '\\Q': '\\mathbb{Q}',
  '\\R': '\\mathbb{R}',
  '\\C': '\\mathbb{C}',
  '\\sii': '\\Leftrightarrow',
  '\\dom': '\\operatorname{Dom}',
  '\\img': '\\operatorname{Im}',
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Tipografía una expresión LaTeX. Nunca lanza: si falla, muestra el código. */
function M(tex, display) {
  try {
    return katex.renderToString(String(tex), {
      throwOnError: false,
      displayMode: !!display,
      strict: 'ignore',
      macros: MACROS,
    });
  } catch (e) {
    return '<code class="mono">' + esc(tex) + '</code>';
  }
}

/**
 * Texto enriquecido del contenido: `$x^2$` matemática en línea,
 * `$$...$$` centrada, `**negrita**` y `` `código` ``.
 */
function tx(s) {
  if (s == null) return '';
  return String(s)
    .split(/(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g)
    .map((p) => {
      if (p.length > 4 && p.startsWith('$$') && p.endsWith('$$')) return M(p.slice(2, -2), true);
      if (p.length > 2 && p[0] === '$' && p.endsWith('$')) return M(p.slice(1, -1), false);
      return esc(p)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="mono">$1</code>');
    })
    .join('');
}

function $(sel, raiz) { return (raiz || document).querySelector(sel); }
function $$(sel, raiz) { return Array.from((raiz || document).querySelectorAll(sel)); }

function el(tag, attrs, ...hijos) {
  const n = document.createElement(tag);
  for (const k in (attrs || {})) {
    const v = attrs[k];
    if (v === null || v === undefined || v === false) continue;
    if (k === 'html') n.innerHTML = v;
    else if (k === 'txt') n.textContent = v;
    else if (k === 'cls') n.className = v;
    else if (k === 'on') for (const ev in v) n.addEventListener(ev, v[ev]);
    else if (k === 'estilo') {
      for (const prop in v) {
        // Object.assign no sirve para custom properties (--foo): hay que usar setProperty.
        if (prop.charCodeAt(0) === 45) n.style.setProperty(prop, v[prop]);
        else n.style[prop] = v[prop];
      }
    }
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const h of hijos.flat()) {
    if (h === null || h === undefined || h === false) continue;
    n.appendChild(typeof h === 'string' ? document.createTextNode(h) : h);
  }
  return n;
}

/** Iconos de línea, dibujados a 24×24. */
const ICONOS = {
  mapa: '<path d="M9 4 3 6.5v14L9 18l6 2.5 6-2.5v-14L15 6.5 9 4Zm0 0v14m6-11.5v14"/>',
  diana: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  hoja: '<path d="M6 3h9l4 4v14H6V3Z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 16h5"/>',
  grafico: '<path d="M4 20V10M10 20V4m6 16v-7m6 7V8"/>',
  charla: '<path d="M4 5.5h16v11H9l-5 4v-15Z"/><path d="M8.5 10h7M8.5 13h4"/>',
  fuego: '<path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-1.6.7-3 1.5-4 .2 1.3 1 2 1.8 2C12.5 10 11 6.5 12 3Z"/>',
  gema: '<path d="m12 3 7 5-7 13L5 8l7-5Z"/><path d="M5 8h14M12 3 9 8l3 13 3-13-3-5Z"/>',
  corazon: '<path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"/>',
  equis: '<path d="m6 6 12 12M18 6 6 18"/>',
  tilde: '<path d="m5 13 4.5 4.5L19 7"/>',
  candado: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7"/>',
  cofre: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M3 13h18M12 13v3M3 8l2-4h14l2 4"/>',
  libro: '<path d="M4 4.5h6a2.5 2.5 0 0 1 2 2.5v13a2 2 0 0 0-2-1.5H4v-14Z"/><path d="M20 4.5h-6a2.5 2.5 0 0 0-2 2.5v13a2 2 0 0 1 2-1.5h6v-14Z"/>',
  flecha: '<path d="M5 12h13m-5-5 5 5-5 5"/>',
  chispa: '<path d="m12 3 1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3Z"/>',
  enviar: '<path d="M4.5 12 20 4.5 15 20l-3.5-6-7-2Z"/>',
  reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
};

function icono(nombre, extra) {
  const d = ICONOS[nombre] || '';
  // Los extra van delante: en HTML gana el primer atributo repetido, así
  // que así se puede pisar el fill="none" por defecto.
  return '<svg viewBox="0 0 24 24" ' + (extra ? extra + ' ' : '')
    + 'fill="none" stroke="currentColor" stroke-width="2" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + d + '</svg>';
}

function mezclar(arr, semilla) {
  const a = arr.slice();
  let s = semilla === undefined ? Math.floor(Math.random() * 1e9) : semilla;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hoy() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function diasEntre(a, b) {
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  const da = Date.UTC(pa[0], pa[1] - 1, pa[2]), db = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((db - da) / 86400000);
}

function sumarDias(fecha, n) {
  const p = fecha.split('-').map(Number);
  const d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
  return d.toISOString().slice(0, 10);
}

let brindisTimer = null;
function brindis(mensaje) {
  const n = $('#brindis');
  if (!n) return;
  n.textContent = mensaje;
  n.hidden = false;
  clearTimeout(brindisTimer);
  brindisTimer = setTimeout(() => { n.hidden = true; }, 2600);
}

function plural(n, sing, pl) { return n === 1 ? sing : (pl || sing + 's'); }
