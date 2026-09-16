/* ===========================================================
   mate.js — comparación de respuestas
   Un alumno escribe "0,5", "1/2" o ".5" pensando lo mismo.
   Acá se decide cuándo dos escrituras son la misma respuesta.
   =========================================================== */

function sinTildes(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normTexto(s) {
  return sinTildes(String(s))
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.;]+$/, '');
}

function normExpr(s) {
  return normTexto(s)
    .replace(/\s+/g, '')
    .replace(/[·x×∗]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/\*\*/g, '^')
    .replace(/−/g, '-')
    .replace(/^\+/, '');
}

/** Convierte a número lo que se pueda: "2,5" · "-3/4" · "1/2" · "2.5e3". */
function aNumero(s) {
  let t = normTexto(s).replace(/\s/g, '').replace(/−/g, '-');
  if (!t) return null;
  if (t === 'pi' || t === 'π') return Math.PI;
  const frac = t.match(/^(-?\d+(?:[.,]\d+)?)\/(-?\d+(?:[.,]\d+)?)$/);
  if (frac) {
    const a = parseFloat(frac[1].replace(',', '.'));
    const b = parseFloat(frac[2].replace(',', '.'));
    if (!isFinite(a) || !isFinite(b) || b === 0) return null;
    return a / b;
  }
  if (/^-?\d+(?:[.,]\d+)?(?:e-?\d+)?$/i.test(t)) {
    const n = parseFloat(t.replace(',', '.'));
    return isFinite(n) ? n : null;
  }
  if (/^-?[.,]\d+$/.test(t)) return parseFloat(t.replace(',', '.'));
  if (/^-?\d+%$/.test(t)) return parseFloat(t) / 100;
  return null;
}

/** Conjunto escrito a mano: "{3, 1, 2}" y "{1,2,3}" son el mismo. */
function aConjunto(s) {
  const t = normTexto(s);
  const m = t.match(/^\{(.*)\}$/);
  if (!m) return null;
  const cuerpo = m[1].trim();
  if (!cuerpo) return [];
  return cuerpo.split(/[,;]/).map((x) => normExpr(x)).filter((x) => x !== '').sort();
}

function formas(s) {
  const t = normTexto(s);
  const f = new Set([t, normExpr(s)]);
  f.add(normExpr(s).replace(/,/g, '.'));
  f.add(t.replace(/,/g, '.'));
  return f;
}

/**
 * ¿La respuesta escrita coincide con alguna de las aceptadas?
 * @param {string} entrada  lo que tipeó el alumno
 * @param {string[]} aceptadas
 * @param {{tol?:number}} [op] tolerancia absoluta para respuestas numéricas
 */
function coincide(entrada, aceptadas, op) {
  if (entrada === null || entrada === undefined) return false;
  const bruta = String(entrada).trim();
  if (!bruta) return false;
  const lista = Array.isArray(aceptadas) ? aceptadas : [aceptadas];
  const tol = (op && op.tol) || 0;
  const fe = formas(bruta);
  const ne = aNumero(bruta);
  const ce = aConjunto(bruta);

  for (const esp of lista) {
    const fa = formas(esp);
    for (const x of fe) if (x && fa.has(x)) return true;

    const na = aNumero(esp);
    if (ne !== null && na !== null) {
      const margen = tol || Math.max(1e-9, Math.abs(na) * 1e-9);
      if (Math.abs(ne - na) <= margen) return true;
    }

    const ca = aConjunto(esp);
    if (ce && ca && ce.length === ca.length && ce.every((v, i) => v === ca[i])) return true;
  }
  return false;
}

/** Igualdad laxa para fichas de emparejar y ordenar. */
function mismoTexto(a, b) { return normTexto(a) === normTexto(b); }
