/* ===========================================================
   store.js — progreso del alumno
   Escribe siempre en localStorage (instantáneo) y, cuando el
   visor lo permite, además en el almacén `db` para que el
   progreso viaje entre el celular y la compu.
   =========================================================== */

const CLAVE_LOCAL = 'cuaderno-de-mate/v1';
const DOC_REMOTO = 'progreso/alumno';

function estadoNuevo() {
  return {
    v: 1,
    actualizado: 0,
    xp: 0,
    racha: 0,
    rachaMax: 0,
    ultimoDia: null,
    dias: {},          // 'AAAA-MM-DD' -> XP ganada ese día
    lecciones: {},     // idLeccion -> { vueltas, mejorTino, ultima, oro }
    tarjetas: {},      // clave ejercicio -> { caja, prox, ok, mal }
    medallas: {},      // idMedalla -> fecha
    correctas: 0,
    respuestas: 0,
    segundos: 0,
    meta: 30,          // XP por día
  };
}

/** Une dos estados sin perder progreso: gana el valor más alto de cada cosa. */
function fundir(a, b) {
  if (!a) return b;
  if (!b) return a;
  const r = estadoNuevo();
  const max = (k) => Math.max(a[k] || 0, b[k] || 0);
  r.xp = max('xp');
  r.rachaMax = max('rachaMax');
  r.correctas = max('correctas');
  r.respuestas = max('respuestas');
  r.segundos = max('segundos');
  r.meta = (a.actualizado > b.actualizado ? a.meta : b.meta) || 30;

  r.dias = Object.assign({}, a.dias);
  for (const d in (b.dias || {})) r.dias[d] = Math.max(r.dias[d] || 0, b.dias[d]);

  const dias = Object.keys(r.dias).sort();
  r.ultimoDia = dias.length ? dias[dias.length - 1] : null;
  r.racha = (a.ultimoDia === r.ultimoDia ? a.racha : b.racha) || 0;
  r.rachaMax = Math.max(r.rachaMax, r.racha);

  r.lecciones = Object.assign({}, a.lecciones);
  for (const id in (b.lecciones || {})) {
    const x = r.lecciones[id], y = b.lecciones[id];
    r.lecciones[id] = !x ? y : {
      vueltas: Math.max(x.vueltas || 0, y.vueltas || 0),
      mejorTino: Math.max(x.mejorTino || 0, y.mejorTino || 0),
      ultima: (x.ultima || '') > (y.ultima || '') ? x.ultima : y.ultima,
      oro: x.oro || y.oro || false,
    };
  }

  r.tarjetas = Object.assign({}, a.tarjetas);
  for (const k in (b.tarjetas || {})) {
    const x = r.tarjetas[k], y = b.tarjetas[k];
    r.tarjetas[k] = !x ? y : {
      caja: Math.max(x.caja || 0, y.caja || 0),
      prox: (x.prox || '') > (y.prox || '') ? x.prox : y.prox,
      ok: Math.max(x.ok || 0, y.ok || 0),
      mal: Math.max(x.mal || 0, y.mal || 0),
    };
  }

  r.medallas = Object.assign({}, b.medallas, a.medallas);
  r.actualizado = Math.max(a.actualizado || 0, b.actualizado || 0);
  return r;
}

const Store = {
  est: estadoNuevo(),
  remoto: null,
  oyentes: [],
  _timer: null,

  alCambiar(fn) { this.oyentes.push(fn); },
  avisar() { for (const fn of this.oyentes) { try { fn(this.est); } catch (e) { /* un oyente roto no frena al resto */ } } },

  leerLocal() {
    try {
      const crudo = localStorage.getItem(CLAVE_LOCAL);
      if (!crudo) return null;
      const d = JSON.parse(crudo);
      return d && d.v === 1 ? Object.assign(estadoNuevo(), d) : null;
    } catch (e) { return null; }
  },

  escribirLocal() {
    try { localStorage.setItem(CLAVE_LOCAL, JSON.stringify(this.est)); } catch (e) { /* modo privado */ }
  },

  arrancar() {
    const local = this.leerLocal();
    if (local) this.est = local;
    this.conectarRemoto();
    return this.est;
  },

  async conectarRemoto() {
    let db = null;
    try { db = window.claude && claude.use ? await claude.use('db') : null; } catch (e) { db = null; }
    if (!db) return;
    try {
      const doc = db.doc(DOC_REMOTO);
      const snap = await doc.get();
      const datos = snap && (snap.data ? (typeof snap.data === 'function' ? snap.data() : snap.data) : null);
      if (datos && datos.v === 1) {
        this.est = fundir(this.est, Object.assign(estadoNuevo(), datos));
        this.escribirLocal();
        this.avisar();
      }
      this.remoto = doc;
      this.guardar();
    } catch (e) { this.remoto = null; }
  },

  guardar() {
    this.est.actualizado = Date.now();
    this.escribirLocal();
    this.avisar();
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      if (!this.remoto) return;
      try { this.remoto.set(JSON.parse(JSON.stringify(this.est))); } catch (e) { /* offline: queda lo local */ }
    }, 900);
  },

  borrarTodo() {
    this.est = estadoNuevo();
    try { localStorage.removeItem(CLAVE_LOCAL); } catch (e) { /* nada */ }
    this.guardar();
  },
};
