/* ===========================================================
   screens.js — mapa de unidades y reproductor de lecciones
   =========================================================== */

const OFFSETS = [0, 46, 72, 46, 0, -46, -72, -46];
const PITCH = 118;
const SENDERO_TOP = 34;   // debe coincidir con el padding de .sendero

const SECCIONES = [
  { id: 'mapa', rot: 'Mapa', ic: 'mapa' },
  { id: 'plan', rot: 'Plan', ic: 'reloj' },
  { id: 'practica', rot: 'Repaso', ic: 'diana' },
  { id: 'formulas', rot: 'Fórmulas', ic: 'hoja' },
  { id: 'progreso', rot: 'Progreso', ic: 'grafico' },
  { id: 'profe', rot: 'Profe', ic: 'charla' },
];

let vistaActual = 'mapa';
let Sesion = null;

const CONSIGNAS = {
  mc: 'Elegí la opción correcta',
  multi: 'Elegí todas las correctas',
  vf: '¿Verdadero o falso?',
  in: 'Escribí la respuesta',
  ord: 'Ordená los pasos',
  par: 'Emparejá las fichas',
  hue: 'Completá los huecos',
};

/* -----------------------------------------------------------
   Barra superior y navegación
   ----------------------------------------------------------- */

function pintarBarra() {
  const e = Store.est;
  const b = $('#barra');
  b.textContent = '';
  b.append(
    el('div', { cls: 'marca' },
      el('span', { cls: 'marca-glifo', txt: '∫' }),
      el('span', { txt: 'Análisis III' })),
    el('div', { cls: 'contador racha', title: 'Días seguidos estudiando' },
      el('span', { html: icono('fuego') }),
      el('span', { cls: 'num', txt: String(e.racha || 0) })),
    el('div', { cls: 'contador gemas', title: 'Experiencia acumulada' },
      el('span', { html: icono('gema') }),
      el('span', { cls: 'num', txt: String(e.xp || 0) })));
}

function pintarNav() {
  const n = $('#nav');
  n.textContent = '';
  const pend = Juego.cuantasPendientes();
  const visibles = SECCIONES.filter((s) => s.id !== 'profe' || hayProfe());
  n.style.gridTemplateColumns = 'repeat(' + visibles.length + ', 1fr)';
  for (const s of visibles) {
    const rot = s.id === 'practica' && pend > 0 ? s.rot + ' ' + pend : s.rot;
    n.appendChild(el('button', {
      type: 'button',
      'aria-current': vistaActual === s.id ? 'page' : null,
      on: { click: () => ir(s.id) },
    },
      el('span', { html: icono(s.ic) }),
      el('span', { txt: rot })));
  }
}

function ir(id) {
  vistaActual = id;
  pintarNav();
  dibujar();
  $('#vista').scrollTop = 0;
}

function dibujar() {
  pintarBarra();
  const v = $('#vista');
  v.textContent = '';
  if (vistaActual === 'mapa') pantallaMapa(v);
  else if (vistaActual === 'plan') pantallaPlan(v);
  else if (vistaActual === 'practica') pantallaPractica(v);
  else if (vistaActual === 'formulas') pantallaFormulas(v);
  else if (vistaActual === 'progreso') pantallaProgreso(v);
  else if (vistaActual === 'profe') pantallaProfe(v);
}

/* -----------------------------------------------------------
   Mapa: el sendero de unidades
   ----------------------------------------------------------- */

function aro(nivel) {
  const C = 2 * Math.PI * 36;
  const p = Math.min(1, (nivel || 0) / NIVELES_LECCION);
  return '<svg class="nodo-aro" viewBox="0 0 80 80" aria-hidden="true">'
    + '<circle class="pista" cx="40" cy="40" r="36"></circle>'
    + '<circle class="avance" cx="40" cy="40" r="36" stroke-dasharray="' + C.toFixed(1)
    + '" stroke-dashoffset="' + (C * (1 - p)).toFixed(1) + '"></circle></svg>';
}

function pantallaMapa(v) {
  const sig = Juego.siguiente();
  const dom = Math.round(Juego.dominioCurso() * 100);

  v.appendChild(el('div', { cls: 'saludo', estilo: { '--u': 'var(--' + sig.u.id + ')' } },
    el('div', { cls: 'rotulo-eyebrow', estilo: { color: 'var(--u)' }, txt: 'Seguí acá' }),
    el('h1', { txt: sig.l.titulo }),
    el('p', { txt: 'Unidad ' + sig.u.n + ' · ' + sig.u.titulo + ' · ' + dom + ' % del curso' }),
    Store.est.libre ? el('p', { estilo: { marginTop: '8px' } },
      el('span', { cls: 'cinta ok', txt: '\u2713 Modo exploración: todo abierto' })) : null));

  v.appendChild(el('button', {
    cls: 'btn btn-primario btn-ancho', type: 'button',
    estilo: { marginBottom: '6px' },
    txt: (Juego.datosLeccion(sig.l.id).vueltas || 0) > 0 ? 'Repetir esta lección' : 'Empezar',
    on: { click: () => abrirLeccion(sig.l.id) },
  }));

  for (const u of CURSO.unidades) {
    const sec = el('section', { cls: 'seccion', estilo: { '--u': 'var(--' + u.id + ')' } });
    const hechas = u.lecciones.filter((l) => (Juego.datosLeccion(l.id).vueltas || 0) > 0).length;

    sec.appendChild(el('div', { cls: 'rotulo' },
      el('div', { cls: 'rotulo-txt' },
        el('div', { cls: 'rotulo-eyebrow', txt: 'Unidad ' + u.n + ' · ' + hechas + '/' + u.lecciones.length }),
        el('h2', { txt: u.titulo })),
      el('button', {
        cls: 'rotulo-btn', type: 'button', txt: 'Repasar',
        on: { click: () => repasarUnidad(u) },
      })));

    sec.appendChild(el('p', { cls: 'bajada', estilo: { marginBottom: '0' }, txt: u.resumen }));

    const sendero = el('div', { cls: 'sendero' });
    sendero.innerHTML = '<svg class="trazo" aria-hidden="true"><path d=""></path></svg>';

    u.lecciones.forEach((l, i) => {
      const estado = Juego.estadoLeccion(l.id);
      const nivel = Juego.nivelLeccion(l.id);
      const off = OFFSETS[i % OFFSETS.length];
      const abierto = estado !== 'cerrado';
      const esSiguiente = sig.l.id === l.id;

      const disco = el('span', { cls: 'nodo-disco' });
      disco.innerHTML = (nivel > 0 ? aro(nivel) : '')
        + (abierto ? '<span>' + esc(u.glifo) + '</span>' : icono('candado'));

      const nodo = el('button', {
        cls: 'nodo', type: 'button', 'data-estado': estado,
        disabled: !abierto,
        estilo: { left: 'calc(50% + ' + off + 'px)', transform: 'translateX(-50%)' },
        'aria-label': l.titulo + (abierto ? '' : ' (bloqueada)'),
        on: {
          click: () => {
            if (!abierto) { brindis('Terminá la lección anterior para abrir esta'); return; }
            abrirLeccion(l.id);
          },
        },
      },
        esSiguiente && abierto ? el('span', { cls: 'nodo-aqui', txt: 'ACÁ VAS' }) : null,
        disco,
        el('span', { cls: 'nodo-rotulo', txt: l.titulo }));

      sendero.appendChild(el('div', { cls: 'nodo-fila' }, nodo));
    });

    sec.appendChild(sendero);
    v.appendChild(sec);
    trazarSendero(sendero, u.lecciones.length);
  }

  v.appendChild(el('hr', { cls: 'regla' }));
  v.appendChild(el('div', { cls: 'vacio' },
    el('div', { cls: 'glifo', txt: '∫' }),
    el('p', { txt: CURSO.materia }),
    el('p', { estilo: { fontSize: 'var(--t-xs)' }, txt: CURSO.catedra }),
    el('p', { estilo: { fontSize: 'var(--t-xs)' }, txt: CURSO.alcance }),
    el('p', { estilo: { fontSize: 'var(--t-xs)', marginTop: '10px', maxWidth: '38ch', marginInline: 'auto' },
      txt: CURSO.aviso })));
}

function trazarSendero(cont, n) {
  const svg = $('svg.trazo', cont);
  const path = $('path', svg);
  if (!path) return;
  requestAnimationFrame(() => {
    const w = cont.clientWidth;
    if (!w) return;
    const cx = w / 2;
    let d = '';
    for (let i = 0; i < n; i++) {
      const x = cx + OFFSETS[i % OFFSETS.length];
      const y = SENDERO_TOP + i * PITCH + 33;
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    path.setAttribute('d', d.trim());
  });
}

/* -----------------------------------------------------------
   Sesiones: lección y repaso
   ----------------------------------------------------------- */

function abrirLeccion(idLeccion) {
  const ref = Juego.buscarLeccion(idLeccion);
  if (!ref) return;
  Sesion = {
    tipo: 'leccion',
    titulo: ref.l.titulo,
    leccion: ref.l,
    unidad: ref.u,
    cola: ref.l.ejercicios.map((ej, i) => ({ ej, clave: Juego.clave(ref.l.id, i), leccion: ref.l, unidad: ref.u })),
    idx: 0,
    ok: 0,
    resp: 0,
    vidas: VIDAS_POR_INTENTO,
    repetidos: {},
    t0: Date.now(),
    paso: 'teoria',
  };
  pintarPantalla();
}

function abrirRepaso(items, titulo) {
  if (!items.length) { brindis('No hay nada para repasar todavía'); return; }
  Sesion = {
    tipo: 'repaso',
    titulo: titulo,
    unidad: items[0].unidad,
    cola: items,
    idx: 0,
    ok: 0,
    resp: 0,
    vidas: VIDAS_POR_INTENTO,
    repetidos: {},
    t0: Date.now(),
    paso: 'ejercicio',
  };
  pintarPantalla();
}

function repasarUnidad(u) {
  const items = [];
  u.lecciones.forEach((l) => {
    if (!Juego.abierta(l.id) && (Juego.datosLeccion(l.id).vueltas || 0) === 0) return;
    l.ejercicios.forEach((ej, i) => items.push({ ej, clave: Juego.clave(l.id, i), leccion: l, unidad: u }));
  });
  if (!items.length) { brindis('Abrí la primera lección de la unidad para poder repasar'); return; }
  abrirRepaso(mezclar(items).slice(0, 14), 'Repaso · ' + u.titulo);
}

function cerrarPantalla() {
  const p = $('#pantalla');
  p.hidden = true;
  p.textContent = '';
  Sesion = null;
  pintarNav();
  dibujar();
}

function pintarPantalla() {
  const p = $('#pantalla');
  p.hidden = false;
  p.textContent = '';
  const caja = el('div', { cls: 'leccion', estilo: { '--u': 'var(--' + (Sesion.unidad ? Sesion.unidad.id : 'u0') + ')' } });
  p.appendChild(caja);

  if (Sesion.paso === 'teoria') pasoTeoria(caja);
  else if (Sesion.paso === 'ejercicio') pasoEjercicio(caja);
  else if (Sesion.paso === 'sinvidas') pasoSinVidas(caja);
  else if (Sesion.paso === 'fin') pasoFin(caja);
}

function botonCerrar() {
  return el('button', {
    cls: 'cerrar', type: 'button', 'aria-label': 'Cerrar', html: icono('equis'),
    on: { click: () => confirmarSalida() },
  });
}

function confirmarSalida() {
  if (Sesion && Sesion.paso === 'ejercicio' && Sesion.resp > 0) {
    if (!window.confirm('¿Salir de la lección? Se pierde el avance de esta vuelta.')) return;
  }
  cerrarPantalla();
}

/* ---------- paso 1: teoría ---------- */

function pasoTeoria(caja) {
  const l = Sesion.leccion;
  caja.appendChild(el('header', { cls: 'leccion-tapa' },
    botonCerrar(),
    el('div', { estilo: { flex: '1', minWidth: '0' } },
      el('div', { cls: 'rotulo-eyebrow', estilo: { color: 'var(--u)' }, txt: 'Unidad ' + Sesion.unidad.n }),
      el('strong', { txt: l.titulo }))));

  const cuerpo = el('div', { cls: 'leccion-cuerpo' });
  cuerpo.appendChild(el('p', { cls: 'bajada', html: tx(l.objetivo) }));
  cuerpo.appendChild(pintarTeoria(l.teoria));

  if (l.formulas && l.formulas.length) {
    cuerpo.appendChild(el('hr', { cls: 'regla' }));
    cuerpo.appendChild(el('h3', { estilo: { marginBottom: '9px', color: 'var(--u)' }, txt: 'Para llevar al parcial' }));
    const g = el('div', { estilo: { '--u': 'var(--' + Sesion.unidad.id + ')' } });
    for (const f of l.formulas) {
      g.appendChild(el('div', { cls: 'formula' },
        f[0] ? el('div', { cls: 'que', html: tx(f[0]) }) : null,
        el('div', { cls: 'expr', html: M(f[1], true) })));
    }
    cuerpo.appendChild(g);
  }
  caja.appendChild(cuerpo);

  caja.appendChild(el('footer', { cls: 'pie' },
    el('button', {
      cls: 'btn btn-primario btn-ancho', type: 'button',
      txt: 'Empezar los ' + Sesion.cola.length + ' ejercicios',
      on: { click: () => { Sesion.paso = 'ejercicio'; pintarPantalla(); } },
    })));
}

/* ---------- paso 2: ejercicios ---------- */

function pasoEjercicio(caja) {
  const item = Sesion.cola[Sesion.idx];
  if (!item) { terminar(); return; }
  Sesion.actual = item;
  const ej = item.ej;

  const barra = el('div', { cls: 'progreso' },
    el('i', { estilo: { width: (Sesion.idx / Sesion.cola.length * 100).toFixed(1) + '%' } }));

  const corazones = el('div', { cls: 'corazones', 'aria-label': Sesion.vidas + ' vidas' });
  for (let i = 0; i < VIDAS_POR_INTENTO; i++) {
    corazones.innerHTML += icono('corazon', i < Sesion.vidas ? 'fill="currentColor"' : 'class="vacio"');
  }

  const tapa = el('header', { cls: 'leccion-tapa' }, botonCerrar(), barra, corazones);
  if (Sesion.tipo === 'leccion') {
    tapa.appendChild(el('button', {
      cls: 'cerrar', type: 'button', 'aria-label': 'Ver la teoría', html: icono('libro'),
      on: { click: () => { Sesion.paso = 'teoria'; pintarPantalla(); } },
    }));
  }
  caja.appendChild(tapa);

  const cuerpo = el('div', { cls: 'leccion-cuerpo' });
  cuerpo.appendChild(el('h2', { cls: 'consigna', txt: CONSIGNAS[ej.t] || 'Resolvé' }));
  if (Sesion.tipo === 'repaso') {
    cuerpo.appendChild(el('p', { estilo: { marginBottom: '10px' } },
      el('span', { cls: 'cinta', txt: 'U' + item.unidad.n + ' · ' + item.leccion.titulo })));
  }
  cuerpo.appendChild(el('div', { cls: 'enunciado', html: tx(ej.p) }));

  const boton = el('button', {
    cls: 'btn btn-primario btn-ancho', type: 'button', txt: 'Comprobar', disabled: true,
    on: { click: () => comprobar() },
  });

  Sesion.ctrl = crearEjercicio(ej, () => { boton.disabled = !Sesion.ctrl.listo(); });
  cuerpo.appendChild(Sesion.ctrl.nodo);
  caja.appendChild(cuerpo);

  const cajon = el('div', { cls: 'cajon', 'data-abierto': '0', id: 'cajon' });
  caja.appendChild(el('footer', { cls: 'pie' }, boton, cajon));
  Sesion.boton = boton;

  if (Sesion.ctrl.foco) setTimeout(() => { try { Sesion.ctrl.foco.focus(); } catch (e) { /* nada */ } }, 60);
}

function comprobar() {
  if (!Sesion || !Sesion.ctrl || !Sesion.ctrl.listo()) return;
  const ok = !!Sesion.ctrl.evaluar();
  Sesion.ctrl.marcar(ok);
  Sesion.resp += 1;
  Juego.anotarRespuesta(ok);
  Juego.anotarTarjeta(Sesion.actual.clave, ok);

  if (ok) {
    Sesion.ok += 1;
  } else {
    Sesion.vidas -= 1;
    const c = Sesion.actual.clave;
    if (!Sesion.repetidos[c]) {
      Sesion.repetidos[c] = true;
      Sesion.cola.push(Sesion.actual);
    }
  }
  Store.guardar();
  pintarBarra();
  abrirCajon(ok);
}

function abrirCajon(ok) {
  const cajon = $('#cajon');
  if (!cajon) return;
  const ej = Sesion.actual.ej;
  Sesion.boton.disabled = true;
  Sesion.boton.style.visibility = 'hidden';

  cajon.dataset.tipo = ok ? 'bien' : 'mal';
  cajon.textContent = '';
  cajon.appendChild(el('div', { cls: 'cajon-cabeza' },
    el('span', { html: icono(ok ? 'tilde' : 'equis') }),
    el('h3', { txt: ok ? '¡Bien ahí!' : 'Revisá esto' })));

  const cuerpo = el('div', { cls: 'cajon-cuerpo' });
  if (!ok) {
    cuerpo.appendChild(el('p', { cls: 'sol' },
      el('span', { txt: 'Respuesta: ' }),
      el('span', { html: Sesion.ctrl.solucion() })));
  }
  if (ej.x) cuerpo.appendChild(el('p', { html: tx(ej.x) }));
  cajon.appendChild(cuerpo);

  const sigue = el('button', {
    cls: 'btn btn-ancho ' + (ok ? 'btn-ok' : 'btn-mal'), type: 'button',
    txt: Sesion.vidas <= 0 ? 'Ver resultado' : 'Continuar',
    on: { click: () => siguiente() },
  });
  cajon.appendChild(el('div', { cls: 'cajon-acciones' }, sigue));
  cajon.dataset.abierto = '1';
  setTimeout(() => { try { sigue.focus(); } catch (e) { /* nada */ } }, 80);
}

function siguiente() {
  if (Sesion.vidas <= 0) { Sesion.paso = 'sinvidas'; pintarPantalla(); return; }
  Sesion.idx += 1;
  if (Sesion.idx >= Sesion.cola.length) { terminar(); return; }
  pintarPantalla();
}

function terminar() {
  Sesion.segundos = Math.round((Date.now() - Sesion.t0) / 1000);
  if (Sesion.tipo === 'leccion') {
    Sesion.premio = Juego.cerrarLeccion(Sesion.leccion.id, Sesion.ok, Sesion.resp, Sesion.segundos);
  } else {
    const xp = Sesion.ok * XP_ACIERTO + XP_TERMINAR;
    Juego.sumarXp(xp);
    Store.est.segundos += Sesion.segundos;
    Sesion.premio = {
      xp,
      tino: Sesion.resp ? Math.round(Sesion.ok / Sesion.resp * 100) : 0,
      medallas: Juego.revisarMedallas(),
      oro: false,
    };
    Store.guardar();
  }
  Sesion.paso = 'fin';
  pintarPantalla();
}

/* ---------- sin vidas ---------- */

function pasoSinVidas(caja) {
  caja.appendChild(el('header', { cls: 'leccion-tapa' }, botonCerrar()));
  caja.appendChild(el('div', { cls: 'leccion-cuerpo' },
    el('div', { cls: 'final' },
      el('div', { cls: 'final-medalla', txt: '\u{1F494}' }),
      el('h2', { cls: 'final-titulo', txt: 'Se acabaron las vidas' }),
      el('p', { estilo: { color: 'var(--tinta-2)', maxWidth: '34ch' },
        txt: 'Cinco errores en una vuelta. Volvé a leer la teoría y probá de nuevo: no se pierde nada de lo que ya tenías.' }),
      el('div', { cls: 'marcador' },
        loza('Aciertos', Sesion.ok + '/' + Sesion.resp, 'tino'),
        loza('XP', '0', 'xp'),
        loza('Tiempo', Math.round((Date.now() - Sesion.t0) / 1000) + 's', 'reloj')))));

  caja.appendChild(el('footer', { cls: 'pie', estilo: { display: 'grid', gap: '9px' } },
    el('button', {
      cls: 'btn btn-primario btn-ancho', type: 'button', txt: 'Volver a intentar',
      on: { click: () => { if (Sesion.tipo === 'leccion') abrirLeccion(Sesion.leccion.id); else cerrarPantalla(); } },
    }),
    Sesion.tipo === 'leccion' ? el('button', {
      cls: 'btn btn-fantasma btn-ancho', type: 'button', txt: 'Leer la teoría',
      on: { click: () => { Sesion.vidas = VIDAS_POR_INTENTO; Sesion.idx = 0; Sesion.ok = 0; Sesion.resp = 0; Sesion.repetidos = {}; Sesion.paso = 'teoria'; pintarPantalla(); } },
    }) : null,
    el('button', { cls: 'btn btn-fantasma btn-ancho', type: 'button', txt: 'Salir', on: { click: () => cerrarPantalla() } })));
}

/* ---------- fin ---------- */

function loza(cab, val, clase) {
  return el('div', { cls: 'marcador-item ' + (clase || '') },
    el('div', { cls: 'cab', txt: cab }),
    el('div', { cls: 'val', txt: val }));
}

function pasoFin(caja) {
  const pr = Sesion.premio;
  const perfecta = pr.tino === 100;

  caja.appendChild(el('header', { cls: 'leccion-tapa' }));
  const cuerpo = el('div', { cls: 'leccion-cuerpo' },
    el('div', { cls: 'final' },
      el('div', { cls: 'final-medalla', txt: pr.oro ? '\u{1F947}' : (perfecta ? '\u{1F4AF}' : '✨') }),
      el('h2', { cls: 'final-titulo', txt: pr.oro ? '¡Lección de oro!' : (perfecta ? '¡Impecable!' : '¡Lección terminada!') }),
      el('p', { estilo: { color: 'var(--tinta-2)' }, txt: Sesion.titulo }),
      el('div', { cls: 'marcador' },
        loza('XP', '+' + pr.xp, 'xp'),
        loza('Tino', pr.tino + '%', 'tino'),
        loza('Tiempo', Sesion.segundos + 's', 'reloj'))));

  if (pr.medallas && pr.medallas.length) {
    const m = el('div', { estilo: { marginTop: '18px' } },
      el('h3', { estilo: { marginBottom: '9px', fontSize: 'var(--t-md)' }, txt: pr.medallas.length === 1 ? 'Medalla nueva' : 'Medallas nuevas' }),
      el('div', { cls: 'medallas' }, pr.medallas.map((md) => el('div', { cls: 'medalla', 'data-ganada': '1' },
        el('div', { cls: 'icono', txt: md.icono }),
        el('div', { cls: 'nom', txt: md.nom }),
        el('div', { cls: 'desc', txt: md.desc })))));
    cuerpo.appendChild(m);
  }
  caja.appendChild(cuerpo);

  const sig = Juego.siguiente();
  caja.appendChild(el('footer', { cls: 'pie', estilo: { display: 'grid', gap: '9px' } },
    el('button', {
      cls: 'btn btn-primario btn-ancho', type: 'button',
      txt: Sesion.tipo === 'leccion' && sig.l.id !== Sesion.leccion.id ? 'Seguir con ' + sig.l.titulo : 'Volver al mapa',
      on: {
        click: () => {
          const irA = Sesion.tipo === 'leccion' && sig.l.id !== Sesion.leccion.id ? sig.l.id : null;
          cerrarPantalla();
          if (irA) abrirLeccion(irA);
        },
      },
    }),
    el('button', {
      cls: 'btn btn-fantasma btn-ancho', type: 'button', txt: 'Volver al mapa',
      on: { click: () => cerrarPantalla() },
    })));
}

/* -----------------------------------------------------------
   Repaso espaciado
   ----------------------------------------------------------- */

/** Todos los ejercicios que el alumno ya vio alguna vez. */
function todasLasTarjetas() {
  const out = [];
  for (const clave in Store.est.tarjetas) {
    const idL = clave.split('#')[0];
    const i = Number(clave.split('#')[1]);
    const ref = Juego.buscarLeccion(idL);
    if (!ref) continue;
    const ej = ref.l.ejercicios[i];
    if (ej) out.push({ ej, clave, leccion: ref.l, unidad: ref.u });
  }
  return out;
}

function pantallaPractica(v) {
  const pend = Juego.pendientesDeRepaso();
  v.appendChild(el('h1', { cls: 'titulo-pantalla', txt: 'Repaso' }));
  v.appendChild(el('p', { cls: 'bajada', txt: 'Los ejercicios vuelven justo antes de que te los olvides. Cuantas más veces los acertás, más tarde reaparecen.' }));

  if (!pend.length) {
    const vistos = Object.keys(Store.est.tarjetas).length;
    v.appendChild(el('div', { cls: 'tarjeta' },
      el('div', { cls: 'vacio' },
        el('div', { cls: 'glifo', txt: vistos ? '✓' : '∫' }),
        el('p', { txt: vistos ? 'Al día. No hay nada vencido para repasar.' : 'Todavía no hiciste ninguna lección.' }),
        el('p', { estilo: { fontSize: 'var(--t-xs)', marginTop: '6px' },
          txt: vistos ? 'Volvé mañana o repasá una unidad entera desde el mapa.' : 'Arrancá por el mapa y volvé acá cuando tengas ejercicios cargados.' }))));
    if (vistos) {
      v.appendChild(el('button', {
        cls: 'btn btn-fantasma btn-ancho', type: 'button', estilo: { marginTop: '12px' },
        txt: 'Repasar igual (14 al azar)',
        on: { click: () => abrirRepaso(mezclar(todasLasTarjetas()).slice(0, 14), 'Repaso libre') },
      }));
    }
    return;
  }

  v.appendChild(el('div', { cls: 'tarjeta' },
    el('div', { cls: 'mosaico', estilo: { marginBottom: '0' } },
      el('div', { cls: 'loza' },
        el('div', { cls: 'cifra', txt: String(pend.length) }),
        el('div', { cls: 'leyenda', txt: 'Vencidos hoy' })),
      el('div', { cls: 'loza' },
        el('div', { cls: 'cifra', txt: String(Object.keys(Store.est.tarjetas).length) }),
        el('div', { cls: 'leyenda', txt: 'En circulación' })))));

  v.appendChild(el('button', {
    cls: 'btn btn-primario btn-ancho', type: 'button', estilo: { marginTop: '12px' },
    txt: 'Repasar ' + Math.min(14, pend.length) + ' ejercicios',
    on: { click: () => abrirRepaso(pend.slice(0, 14), 'Repaso del día') },
  }));

  const porUnidad = {};
  for (const p of pend) {
    porUnidad[p.unidad.id] = porUnidad[p.unidad.id] || { u: p.unidad, n: 0 };
    porUnidad[p.unidad.id].n += 1;
  }
  v.appendChild(el('hr', { cls: 'regla' }));
  v.appendChild(el('h3', { estilo: { marginBottom: '10px', fontSize: 'var(--t-md)' }, txt: 'De dónde vienen' }));
  for (const k in porUnidad) {
    const { u, n } = porUnidad[k];
    v.appendChild(el('div', { cls: 'dominio-fila', estilo: { '--u': 'var(--' + u.id + ')' } },
      el('div', { cls: 'dominio-nombre' },
        el('span', { cls: 'dominio-glifo', txt: u.glifo }),
        el('span', { txt: u.titulo }),
        el('span', { cls: 'cinta', estilo: { marginLeft: 'auto' }, txt: n + ' ' + plural(n, 'ejercicio') }))));
  }
}
