/* ===========================================================
   plan.js — plan de estudio hasta el parcial
   Una hora por día. Cada día abre las lecciones que tocan.
   =========================================================== */

const PLAN = {
  examen: '2026-10-07',
  horas: 1,
  dias: [
    { n: 1, fase: 'Primer orden', u: 'u4', titulo: 'Homogéneas, de punta a punta', lecciones: ['u4l1', 'u4l2', 'u4l3'],
      nota: 'Tres lecciones pero es un solo método: reconocer por el grado, sustituir $y=u\\cdot x$, separar, volver a la $y$. Ojo con $dy = x\\,du + u\\,dx$: es derivada del producto y olvidarse un término es el error número uno de esta unidad.' },
    { n: 2, fase: 'Primer orden', u: 'u2', titulo: 'Cerrar primer orden: reconocer el método', lecciones: ['u1l3'], repaso: true,
      nota: 'Sin tema nuevo. Volvé al árbol de decisión y hacé dos tandas de Repaso mezclando separables, lineales, Bernoulli y homogéneas. El objetivo es concreto: mirar una ecuación cualquiera y saber en 5 segundos con qué atacarla. Si algo de lineales o Bernoulli quedó flojo, este es el día para taparlo.' },

    { n: 3, fase: 'Segundo orden', u: 'u5', titulo: 'Ecuación característica y raíces reales', lecciones: ['u5l1', 'u5l2'],
      nota: 'Se vuelve mecánico rápido: armás la característica, sacás el discriminante y eso te dice en qué caso estás. Después de integrales esto se siente fácil.' },
    { n: 4, fase: 'Segundo orden', u: 'u5', titulo: 'Raíces complejas y solución particular', lecciones: ['u5l3', 'u5l4'],
      nota: 'Acordate de derivar la solución general **antes** de meter la segunda condición inicial. Con las condiciones en $x=0$ las exponenciales valen 1 y el sistema queda con puros números.' },

    { n: 5, fase: 'Laplace', u: 'u6', titulo: 'Definición y tabla', lecciones: ['u6l1', 'u6l2'],
      nota: 'La tabla hay que saberla. Truco: el seno lleva $k$ arriba, el coseno lleva $s$. Y practicá $\\mathcal{L}(t)$ por definición, que la piden explícitamente en la Práctica 3.' },
    { n: 6, fase: 'Laplace', u: 'u6', titulo: 'Transformada inversa', lecciones: ['u6l3'],
      nota: 'Día corto y el que más te rinde: la inversa es fracciones simples otra vez. Lo que estudiaste al principio vuelve entero acá, así que ya lo tenés medio ganado.' },
    { n: 7, fase: 'Laplace', u: 'u6', titulo: 'Derivadas y resolver una EDO con Laplace', lecciones: ['u6l4', 'u6l5'],
      nota: 'El corazón del tema. Las condiciones iniciales entran solas al transformar: esa es toda la gracia del método, no hay que buscar $C_1$ ni $C_2$ al final.' },
    { n: 8, fase: 'Laplace', u: 'u6', titulo: 'Traslación y tabla completa', lecciones: ['u6l6'], repaso: true,
      nota: 'Cerrás Laplace y hacés una tanda de Repaso de la unidad. Si la traslación te marea, fijate siempre qué reemplaza a qué: $s \\to s-a$.' },

    { n: 9, fase: 'Fourier', u: 'u7', titulo: 'Series de Fourier, toda la unidad', lecciones: ['u7l1', 'u7l2', 'u7l3', 'u7l4'],
      nota: 'Cuatro lecciones en un día porque es el tema más mecánico de todos: son tres integrales y listo. Fijate primero si la función es par o impar, que te ahorra la mitad del trabajo.' },

    { n: 10, fase: 'Variable compleja', u: 'u8', titulo: 'Repaso de complejos, forma trigonométrica y raíces', lecciones: ['u8l1', 'u8l2'],
      nota: 'La primera es repaso de Álgebra y vuela. Prestale atención a **radicación**: en el pizarrón hicieron $\\sqrt{3+4i}$ y $\\sqrt[3]{8i}$, así que la fórmula de $w_k$ hay que tenerla escrita y practicada.' },
    { n: 11, fase: 'Variable compleja', u: 'u8', titulo: 'Regiones, funciones y límites', lecciones: ['u8l3', 'u8l4', 'u8l5'],
      nota: 'En los límites acordate de probar **varias trayectorias**, no sólo los ejes: si dos dan distinto, el límite no existe y con eso ya contestaste.' },
    { n: 12, fase: 'Variable compleja', u: 'u8', titulo: 'Exponencial, logaritmo, continuidad y derivada', lecciones: ['u8l6', 'u8l7'],
      nota: 'Para continuidad el método es siempre el mismo: calculás el límite, calculás la imagen y comparás. Si no coinciden, es discontinua y listo.' },

    { n: 13, fase: 'Cierre', u: 'u8', titulo: 'Cauchy-Riemann y repaso final', lecciones: ['u8l8'], repaso: true,
      nota: 'Lo último que vieron en clase, así que es lo más probable que tomen. Cerrá con una tanda de Repaso y una leída al Formulario. Después dormí bien. **Las funciones armónicas no entran**: no pierdas tiempo ahí.' },
  ],
};

const FASES = {
  'Primer orden': { u: 'u4', desc: 'Homogéneas y cierre de todo lo de primer orden' },
  'Segundo orden': { u: 'u5', desc: 'Ecuación característica y los tres casos' },
  'Laplace': { u: 'u6', desc: 'Tabla, inversa y resolución de ecuaciones' },
  'Fourier': { u: 'u7', desc: 'Coeficientes y desarrollo' },
  'Variable compleja': { u: 'u8', desc: 'Raíces, límites, derivada y analiticidad' },
  'Cierre': { u: 'u3', desc: 'Repaso general' },
};

/** Fecha del día n del plan: se cuenta hacia atrás desde el examen. */
function fechaDelDia(n) {
  return sumarDias(PLAN.examen, n - PLAN.dias.length - 1);
}

function diasParaElExamen() { return diasEntre(hoy(), PLAN.examen); }

function diaDeHoy() {
  for (const d of PLAN.dias) if (fechaDelDia(d.n) === hoy()) return d.n;
  return null;
}

function planHecho(n) { return !!(Store.est.plan && Store.est.plan[n]); }

function marcarDia(n, valor) {
  Store.est.plan = Store.est.plan || {};
  if (valor) Store.est.plan[n] = hoy(); else delete Store.est.plan[n];
  Store.guardar();
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function fechaCorta(iso) {
  const p = iso.split('-').map(Number);
  const d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  return SEMANA[d.getUTCDay()] + ' ' + p[2] + ' ' + MESES[p[1] - 1];
}

/* -----------------------------------------------------------
   Pantalla
   ----------------------------------------------------------- */

function pantallaPlan(v) {
  const faltan = diasParaElExamen();
  const hechos = PLAN.dias.filter((d) => planHecho(d.n)).length;
  const hoyN = diaDeHoy();

  v.appendChild(el('h1', { cls: 'titulo-pantalla', txt: 'Plan' }));
  v.appendChild(el('p', { cls: 'bajada',
    txt: PLAN.dias.length + ' días, una hora por día, hasta el parcial. Tocá cualquier día para abrir sus lecciones.' }));

  /* --- cuenta regresiva --- */
  v.appendChild(el('div', { cls: 'mosaico' },
    el('div', { cls: 'loza racha' },
      el('div', { cls: 'cifra', txt: faltan > 0 ? String(faltan) : (faltan === 0 ? '¡Hoy!' : '—') }),
      el('div', { cls: 'leyenda', txt: faltan > 0 ? plural(faltan, 'día para el parcial', 'días para el parcial') : (faltan === 0 ? 'Es el parcial' : 'Parcial pasado') })),
    el('div', { cls: 'loza tino' },
      el('div', { cls: 'cifra', txt: hechos + '/' + PLAN.dias.length }),
      el('div', { cls: 'leyenda', txt: 'Días completados' }))));

  const riel = el('div', { cls: 'riel', estilo: { '--u': 'var(--correcto)', marginBottom: '20px' } },
    el('i', { estilo: { width: (hechos / PLAN.dias.length * 100).toFixed(1) + '%' } }));
  v.appendChild(riel);

  /* --- días agrupados por fase --- */
  let faseActual = null;
  for (const d of PLAN.dias) {
    if (d.fase !== faseActual) {
      faseActual = d.fase;
      const f = FASES[d.fase] || { u: d.u, desc: '' };
      v.appendChild(el('div', { cls: 'plan-fase', estilo: { '--u': 'var(--' + f.u + ')' } },
        el('div', { cls: 'plan-fase-linea' }),
        el('div', {},
          el('div', { cls: 'rotulo-eyebrow', estilo: { color: 'var(--u)' }, txt: d.fase }),
          el('div', { estilo: { fontSize: 'var(--t-xs)', color: 'var(--tinta-2)' }, txt: f.desc }))));
    }
    v.appendChild(tarjetaDia(d, hoyN));
  }

  v.appendChild(el('hr', { cls: 'regla' }));
  v.appendChild(el('div', { cls: 'bloque truco' },
    el('div', { cls: 'bloque-titulo', txt: 'Si un día te lo saltás' }),
    el('div', { html: tx('No arrastres la culpa ni intentes hacer dos días juntos: hacé el día que toca según la fecha y recuperá el que falta en el **día 2** o en el **8**, que llevan Repaso. Perder un día no rompe el plan; abandonarlo sí.') })));
}

function tarjetaDia(d, hoyN) {
  const hecho = planHecho(d.n);
  const esHoy = d.n === hoyN;
  const fecha = fechaDelDia(d.n);

  const tilde = el('button', {
    cls: 'plan-tilde', type: 'button', role: 'checkbox',
    'aria-checked': hecho ? 'true' : 'false',
    'aria-label': 'Marcar el día ' + d.n + ' como hecho',
    html: hecho ? icono('tilde') : '',
    on: {
      click: (e) => {
        e.stopPropagation();
        marcarDia(d.n, !hecho);
        brindis(!hecho ? '¡Día ' + d.n + ' listo!' : 'Día ' + d.n + ' desmarcado');
        dibujar();
      },
    },
  });

  const cuerpo = el('div', { estilo: { flex: '1', minWidth: '0' } },
    el('div', { cls: 'plan-cab' },
      el('span', { cls: 'plan-num', txt: 'Día ' + d.n }),
      el('span', { cls: 'plan-fecha', txt: fechaCorta(fecha) }),
      esHoy ? el('span', { cls: 'cinta ok', txt: 'HOY' }) : null),
    el('div', { cls: 'plan-tit', txt: d.titulo }),
    el('p', { cls: 'plan-nota', html: tx(d.nota) }));

  const chips = el('div', { cls: 'plan-lecciones' });
  for (const id of d.lecciones) {
    const ref = Juego.buscarLeccion(id);
    if (!ref) continue;
    const listo = (Juego.datosLeccion(id).vueltas || 0) > 0;
    chips.appendChild(el('button', {
      cls: 'lec-chip' + (listo ? ' lista' : ''), type: 'button',
      estilo: { '--u': 'var(--' + ref.u.id + ')' },
      on: { click: () => abrirLeccion(id) },
    },
      el('span', { cls: 'lec-glifo', txt: listo ? '✓' : ref.u.glifo }),
      el('span', { txt: ref.l.titulo })));
  }
  if (d.repaso) {
    chips.appendChild(el('button', {
      cls: 'lec-chip', type: 'button', estilo: { '--u': 'var(--correcto)' },
      on: { click: () => ir('practica') },
    },
      el('span', { cls: 'lec-glifo', txt: '🔁' }),
      el('span', { txt: 'Ir a Repaso' })));
  }
  cuerpo.appendChild(chips);

  return el('div', { cls: 'plan-dia' + (hecho ? ' hecho' : '') + (esHoy ? ' hoy' : ''), estilo: { '--u': 'var(--' + d.u + ')' } },
    tilde, cuerpo);
}
