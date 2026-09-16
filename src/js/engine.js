/* ===========================================================
   engine.js — reglas del juego
   Qué está abierto, cuánta XP vale cada cosa, cuándo vuelve a
   aparecer un ejercicio y qué medallas se ganan.
   =========================================================== */

const NIVELES_LECCION = 3;              // tres coronas por lección
const VIDAS_POR_INTENTO = 5;
const XP_ACIERTO = 2;
const XP_TERMINAR = 6;
const XP_PERFECTA = 6;
const INTERVALOS = [0, 1, 2, 4, 9, 18, 35];   // días por caja de Leitner

const RANGOS = [
  [0, 'Primer día'], [80, 'Aprendiz'], [220, 'Calculista'], [450, 'Despejador'],
  [800, 'Analista'], [1300, 'Funcionario'], [2000, 'Matriz viviente'],
  [3000, 'Combinatorio'], [4500, 'Demostrador'], [6500, 'Profe suplente'],
];

const Juego = {

  /* ---------- catálogo ---------- */

  lecciones() {
    const out = [];
    CURSO.unidades.forEach((u, iu) => u.lecciones.forEach((l, il) => out.push({ u, l, iu, il })));
    return out;
  },

  buscarLeccion(id) {
    for (const u of CURSO.unidades) {
      const i = u.lecciones.findIndex((l) => l.id === id);
      if (i >= 0) return { u, l: u.lecciones[i], il: i, iu: CURSO.unidades.indexOf(u) };
    }
    return null;
  },

  /* ---------- progreso ---------- */

  datosLeccion(id) {
    return Store.est.lecciones[id] || { vueltas: 0, mejorTino: 0, ultima: null, oro: false };
  },

  nivelLeccion(id) {
    const d = this.datosLeccion(id);
    return Math.min(NIVELES_LECCION, d.vueltas || 0);
  },

  estadoLeccion(id) {
    const d = this.datosLeccion(id);
    if (d.oro) return 'oro';
    if ((d.vueltas || 0) >= NIVELES_LECCION) return 'oro';
    if ((d.vueltas || 0) > 0) return 'hecho';
    return this.abierta(id) ? 'abierto' : 'cerrado';
  },

  /**
   * En modo exploración está todo abierto. Si no, se abre la primera
   * lección del curso y la siguiente a cada una ya hecha.
   */
  abierta(id) {
    if (Store.est.libre) return true;
    const todas = this.lecciones();
    const i = todas.findIndex((x) => x.l.id === id);
    if (i <= 0) return i === 0;
    const anterior = todas[i - 1].l.id;
    return (this.datosLeccion(anterior).vueltas || 0) > 0;
  },

  /** La lección en la que el alumno debería seguir ahora. */
  siguiente() {
    const todas = this.lecciones();
    for (const x of todas) if ((this.datosLeccion(x.l.id).vueltas || 0) === 0) return x;
    return todas[todas.length - 1];
  },

  dominioUnidad(u) {
    const total = u.lecciones.length * NIVELES_LECCION;
    let hecho = 0;
    for (const l of u.lecciones) hecho += this.nivelLeccion(l.id);
    return total ? hecho / total : 0;
  },

  dominioCurso() {
    let t = 0, h = 0;
    for (const u of CURSO.unidades) { t += u.lecciones.length * NIVELES_LECCION; for (const l of u.lecciones) h += this.nivelLeccion(l.id); }
    return t ? h / t : 0;
  },

  rango() {
    const xp = Store.est.xp;
    let r = RANGOS[0], sig = null;
    for (let i = 0; i < RANGOS.length; i++) {
      if (xp >= RANGOS[i][0]) { r = RANGOS[i]; sig = RANGOS[i + 1] || null; }
    }
    return { nombre: r[1], desde: r[0], hasta: sig ? sig[0] : null, siguiente: sig ? sig[1] : null };
  },

  tino() {
    const e = Store.est;
    return e.respuestas ? Math.round((e.correctas / e.respuestas) * 100) : 0;
  },

  /* ---------- repaso espaciado ---------- */

  clave(idLeccion, idx) { return idLeccion + '#' + idx; },

  tarjeta(clave) { return Store.est.tarjetas[clave] || { caja: 0, prox: null, ok: 0, mal: 0 }; },

  anotarTarjeta(clave, acerto) {
    const t = this.tarjeta(clave);
    const caja = acerto ? Math.min(INTERVALOS.length - 1, (t.caja || 0) + 1) : 0;
    Store.est.tarjetas[clave] = {
      caja,
      prox: sumarDias(hoy(), INTERVALOS[caja]),
      ok: (t.ok || 0) + (acerto ? 1 : 0),
      mal: (t.mal || 0) + (acerto ? 0 : 1),
    };
  },

  /** Ejercicios vencidos, los más atrasados primero. */
  pendientesDeRepaso(limite) {
    const h = hoy();
    const out = [];
    for (const clave in Store.est.tarjetas) {
      const t = Store.est.tarjetas[clave];
      if (!t.prox || t.prox <= h) {
        const [idLeccion, idx] = clave.split('#');
        const ref = this.buscarLeccion(idLeccion);
        if (!ref) continue;
        const ej = ref.l.ejercicios[Number(idx)];
        if (!ej) continue;
        out.push({ clave, ej, leccion: ref.l, unidad: ref.u, idx: Number(idx), caja: t.caja || 0, prox: t.prox || '' });
      }
    }
    out.sort((a, b) => (a.caja - b.caja) || (a.prox < b.prox ? -1 : 1));
    return limite ? out.slice(0, limite) : out;
  },

  cuantasPendientes() { return this.pendientesDeRepaso().length; },

  /* ---------- registro de una sesión ---------- */

  sumarXp(n) {
    const e = Store.est;
    const d = hoy();
    if (e.ultimoDia !== d) {
      const salto = e.ultimoDia ? diasEntre(e.ultimoDia, d) : 999;
      e.racha = salto === 1 ? (e.racha || 0) + 1 : 1;
      e.rachaMax = Math.max(e.rachaMax || 0, e.racha);
      e.ultimoDia = d;
    }
    e.xp += n;
    e.dias[d] = (e.dias[d] || 0) + n;
  },

  /**
   * Cierra una lección terminada.
   * @returns {{xp:number, tino:number, subioNivel:boolean, oro:boolean, medallas:object[]}}
   */
  cerrarLeccion(idLeccion, aciertos, total, segundos) {
    const e = Store.est;
    const d = this.datosLeccion(idLeccion);
    const tino = total ? Math.round((aciertos / total) * 100) : 0;
    const vueltas = (d.vueltas || 0) + 1;
    const oro = d.oro || (vueltas >= NIVELES_LECCION && tino >= 90);

    let xp = aciertos * XP_ACIERTO + XP_TERMINAR;
    if (tino === 100) xp += XP_PERFECTA;

    e.lecciones[idLeccion] = {
      vueltas,
      mejorTino: Math.max(d.mejorTino || 0, tino),
      ultima: hoy(),
      oro,
    };
    e.segundos += segundos || 0;
    this.sumarXp(xp);
    const medallas = this.revisarMedallas();
    Store.guardar();
    return { xp, tino, subioNivel: vueltas <= NIVELES_LECCION, oro: oro && !d.oro, medallas };
  },

  anotarRespuesta(acerto) {
    Store.est.respuestas += 1;
    if (acerto) Store.est.correctas += 1;
  },

  /* ---------- medallas ---------- */

  MEDALLAS: [
    { id: 'arranque', icono: '🎒', nom: 'Primer día', desc: 'Terminaste tu primera lección', ok: (e) => Object.keys(e.lecciones).length >= 1 },
    { id: 'cien', icono: '💪', nom: 'Cien respuestas', desc: 'Contestaste 100 ejercicios', ok: (e) => e.respuestas >= 100 },
    { id: 'perfecta', icono: '💯', nom: 'Impecable', desc: 'Una lección sin ningún error', ok: (e) => Object.values(e.lecciones).some((l) => l.mejorTino === 100) },
    { id: 'racha3', icono: '🔥', nom: 'Tres al hilo', desc: 'Tres días seguidos', ok: (e) => (e.rachaMax || 0) >= 3 },
    { id: 'racha7', icono: '📅', nom: 'Semana entera', desc: 'Siete días seguidos', ok: (e) => (e.rachaMax || 0) >= 7 },
    { id: 'racha30', icono: '🏔️', nom: 'Un mes derecho', desc: 'Treinta días seguidos', ok: (e) => (e.rachaMax || 0) >= 30 },
    { id: 'oro', icono: '🥇', nom: 'Primera de oro', desc: 'Llevaste una lección a oro', ok: (e) => Object.values(e.lecciones).some((l) => l.oro) },
    { id: 'xp500', icono: '⚡', nom: '500 de XP', desc: 'Juntaste 500 de experiencia', ok: (e) => e.xp >= 500 },
    { id: 'xp2000', icono: '🚀', nom: '2000 de XP', desc: 'Juntaste 2000 de experiencia', ok: (e) => e.xp >= 2000 },
    { id: 'repasador', icono: '🔁', nom: 'Repasador', desc: '50 ejercicios repasados', ok: (e) => Object.values(e.tarjetas).filter((t) => (t.caja || 0) >= 2).length >= 50 },
    { id: 'madrugador', icono: '🌅', nom: 'Madrugador', desc: 'Estudiaste antes de las 8', ok: () => new Date().getHours() < 8 },
    { id: 'buho', icono: '🌙', nom: 'Trasnochado', desc: 'Estudiaste pasada la medianoche', ok: () => new Date().getHours() >= 0 && new Date().getHours() < 5 },
    { id: 'unidad', icono: '📗', nom: 'Unidad cerrada', desc: 'Terminaste todas las lecciones de una unidad', ok: () => CURSO.unidades.some((u) => u.lecciones.every((l) => (Juego.datosLeccion(l.id).vueltas || 0) > 0)) },
    { id: 'binario', icono: '💾', nom: 'Pensás en binario', desc: 'Terminaste la unidad de numeración', ok: () => { const u = CURSO.unidades.find((x) => x.id === 'u8'); return !!u && u.lecciones.every((l) => (Juego.datosLeccion(l.id).vueltas || 0) > 0); } },
    { id: 'todo', icono: '👑', nom: 'Cuaderno completo', desc: 'Todas las lecciones del curso', ok: () => Juego.lecciones().every((x) => (Juego.datosLeccion(x.l.id).vueltas || 0) > 0) },
  ],

  revisarMedallas() {
    const e = Store.est;
    const nuevas = [];
    for (const m of this.MEDALLAS) {
      if (e.medallas[m.id]) continue;
      let gana = false;
      try { gana = !!m.ok(e); } catch (err) { gana = false; }
      if (gana) { e.medallas[m.id] = hoy(); nuevas.push(m); }
    }
    return nuevas;
  },
};
