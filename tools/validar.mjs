/* Revisa el contenido del curso antes de publicar: ids repetidos,
   índices de respuesta fuera de rango, huecos que no coinciden, etc. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.window = {};

const archivos = fs.readdirSync(path.join(ROOT, 'src/content'))
  .filter((f) => /^u\d+\.js$/.test(f))
  .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));

for (const f of archivos) {
  const src = fs.readFileSync(path.join(ROOT, 'src/content', f), 'utf8');
  new Function('window', src)(globalThis.window);
}
const unidades = globalThis.window.__UNIDADES;

const TIPOS = new Set(['mc', 'multi', 'vf', 'in', 'ord', 'par', 'hue']);
const BLOQUES = new Set(['p', 'h', 'mat', 'lista', 'num', 'def', 'ojo', 'truco', 'code', 'ej', 'tabla']);

const errores = [];
const idsU = new Set();
const idsL = new Set();
let nLec = 0, nEj = 0, nForm = 0, nTeo = 0;
const porTipo = {};

for (const u of unidades) {
  const donde = (extra) => `${u.id}${extra ? ' · ' + extra : ''}`;
  if (idsU.has(u.id)) errores.push(`id de unidad repetido: ${u.id}`);
  idsU.add(u.id);
  for (const campo of ['id', 'n', 'titulo', 'glifo', 'resumen']) {
    if (u[campo] === undefined) errores.push(`${donde()}: falta "${campo}"`);
  }
  if (!Array.isArray(u.lecciones) || !u.lecciones.length) { errores.push(`${donde()}: sin lecciones`); continue; }

  for (const l of u.lecciones) {
    nLec++;
    if (idsL.has(l.id)) errores.push(`id de lección repetido: ${l.id}`);
    idsL.add(l.id);
    for (const campo of ['id', 'titulo', 'objetivo']) {
      if (!l[campo]) errores.push(`${donde(l.id)}: falta "${campo}"`);
    }
    if (!Array.isArray(l.teoria) || !l.teoria.length) errores.push(`${donde(l.id)}: sin teoría`);
    else for (const [i, b] of l.teoria.entries()) {
      const ks = Object.keys(b);
      if (ks.length !== 1) errores.push(`${donde(l.id)}: bloque de teoría ${i} tiene ${ks.length} claves`);
      else if (!BLOQUES.has(ks[0])) errores.push(`${donde(l.id)}: bloque de teoría desconocido "${ks[0]}"`);
      else {
        nTeo++;
        const k = ks[0], v = b[k];
        if (k === 'def' && (!Array.isArray(v) || v.length !== 2)) errores.push(`${donde(l.id)}: "def" mal formado`);
        if (k === 'code' && (!Array.isArray(v) || v.length !== 2)) errores.push(`${donde(l.id)}: "code" mal formado`);
        if (k === 'ej' && (!Array.isArray(v) || v.length !== 2 || !Array.isArray(v[1]))) errores.push(`${donde(l.id)}: "ej" mal formado`);
        if (k === 'tabla') {
          if (!Array.isArray(v) || v.length !== 2 || !Array.isArray(v[0]) || !Array.isArray(v[1])) errores.push(`${donde(l.id)}: "tabla" mal formada`);
          else for (const fila of v[1]) {
            if (!Array.isArray(fila) || fila.length !== v[0].length) errores.push(`${donde(l.id)}: fila de tabla con ${fila.length} celdas, se esperaban ${v[0].length}`);
          }
        }
      }
    }

    for (const f of (l.formulas || [])) {
      nForm++;
      if (!Array.isArray(f) || f.length !== 2) errores.push(`${donde(l.id)}: fórmula mal formada`);
    }

    if (!Array.isArray(l.ejercicios) || !l.ejercicios.length) { errores.push(`${donde(l.id)}: sin ejercicios`); continue; }

    for (const [i, ej] of l.ejercicios.entries()) {
      nEj++;
      const q = `${donde(l.id)} ej${i + 1}`;
      porTipo[ej.t] = (porTipo[ej.t] || 0) + 1;
      if (!TIPOS.has(ej.t)) { errores.push(`${q}: tipo desconocido "${ej.t}"`); continue; }
      if (!ej.p) errores.push(`${q}: sin enunciado`);
      if (!ej.x) errores.push(`${q}: sin explicación`);

      if (ej.t === 'mc') {
        if (!Array.isArray(ej.o) || ej.o.length < 2) errores.push(`${q}: necesita al menos 2 opciones`);
        else if (typeof ej.r !== 'number' || ej.r < 0 || ej.r >= ej.o.length) errores.push(`${q}: r=${ej.r} fuera de rango (0..${ej.o.length - 1})`);
        if (ej.o && new Set(ej.o).size !== ej.o.length) errores.push(`${q}: opciones repetidas`);
      } else if (ej.t === 'multi') {
        if (!Array.isArray(ej.o) || ej.o.length < 3) errores.push(`${q}: necesita al menos 3 opciones`);
        if (!Array.isArray(ej.r) || !ej.r.length) errores.push(`${q}: r debe ser un array no vacío`);
        else for (const k of ej.r) if (k < 0 || k >= ej.o.length) errores.push(`${q}: r contiene ${k}, fuera de rango`);
      } else if (ej.t === 'vf') {
        if (typeof ej.r !== 'boolean') errores.push(`${q}: r debe ser true o false`);
      } else if (ej.t === 'in') {
        if (!Array.isArray(ej.r) || !ej.r.length) errores.push(`${q}: r debe ser un array no vacío`);
        else if (ej.r.some((x) => String(x).trim() === '')) errores.push(`${q}: r tiene una respuesta vacía`);
      } else if (ej.t === 'ord') {
        if (!Array.isArray(ej.o) || ej.o.length < 3) errores.push(`${q}: necesita al menos 3 pasos`);
      } else if (ej.t === 'par') {
        if (!Array.isArray(ej.o) || ej.o.length < 3) errores.push(`${q}: necesita al menos 3 pares`);
        else for (const par of ej.o) if (!Array.isArray(par) || par.length !== 2) errores.push(`${q}: par mal formado`);
      } else if (ej.t === 'hue') {
        if (!ej.tpl) errores.push(`${q}: falta tpl`);
        else {
          const huecos = ej.tpl.split('___').length - 1;
          if (!huecos) errores.push(`${q}: el tpl no tiene ningún "___"`);
          if (!Array.isArray(ej.r) || ej.r.length !== huecos) errores.push(`${q}: ${huecos} huecos pero r tiene ${Array.isArray(ej.r) ? ej.r.length : '?'} entradas`);
          else for (const [j, alt] of ej.r.entries()) {
            if (!Array.isArray(alt) || !alt.length) errores.push(`${q}: hueco ${j + 1} sin respuestas aceptadas`);
          }
        }
      }
      // los $ de la matemática tienen que venir en pares
      for (const campo of ['p', 'x', 'tpl']) {
        if (typeof ej[campo] === 'string') {
          const n = (ej[campo].match(/\$/g) || []).length;
          if (n % 2 !== 0) errores.push(`${q}: "${campo}" tiene ${n} signos $ (impar)`);
        }
      }
    }
  }
}

console.log(`unidades: ${unidades.length}   lecciones: ${nLec}   ejercicios: ${nEj}`);
console.log(`bloques de teoría: ${nTeo}   fórmulas: ${nForm}`);
console.log('por tipo: ' + Object.entries(porTipo).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  '));
if (errores.length) {
  console.log(`\n${errores.length} PROBLEMA(S):`);
  for (const e of errores) console.log('  · ' + e);
  process.exit(1);
}
console.log('\nSin problemas.');
