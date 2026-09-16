/* ===========================================================
   paneles.js — Fórmulas, Progreso y Profe
   =========================================================== */

let filtroFormulas = '';

/* -----------------------------------------------------------
   Fórmulas: el machete de toda la materia
   ----------------------------------------------------------- */

function pantallaFormulas(v) {
  v.appendChild(el('h1', { cls: 'titulo-pantalla', txt: 'Fórmulas' }));
  v.appendChild(el('p', { cls: 'bajada', txt: 'Todo lo que conviene tener a mano, ordenado por unidad. Buscá por tema o por nombre.' }));

  const caja = el('div');
  const buscador = el('input', {
    cls: 'buscador', type: 'search', id: 'buscar-formula',
    placeholder: 'Buscar: Laplace, factor, raíces, Fourier…',
    value: filtroFormulas,
    on: {
      input: (e) => { filtroFormulas = e.target.value; listarFormulas(caja); },
    },
  });
  v.appendChild(buscador);
  v.appendChild(caja);
  listarFormulas(caja);
}

function listarFormulas(caja) {
  caja.textContent = '';
  const q = normTexto(filtroFormulas);
  let encontradas = 0;

  for (const u of CURSO.unidades) {
    const items = [];
    for (const l of u.lecciones) {
      for (const f of (l.formulas || [])) {
        const heno = normTexto(u.titulo + ' ' + l.titulo + ' ' + f[0] + ' ' + f[1]);
        if (q && heno.indexOf(q) === -1) continue;
        items.push({ l, f });
      }
    }
    if (!items.length) continue;
    encontradas += items.length;

    const grupo = el('div', { cls: 'formula-grupo', estilo: { '--u': 'var(--' + u.id + ')' } },
      el('h3', {},
        el('span', { cls: 'dominio-glifo', txt: u.glifo }),
        el('span', { txt: 'Unidad ' + u.n + ' · ' + u.titulo })));

    let ultima = null;
    for (const it of items) {
      if (it.l.titulo !== ultima) {
        ultima = it.l.titulo;
        grupo.appendChild(el('p', {
          estilo: { fontSize: 'var(--t-xs)', color: 'var(--tinta-3)', fontWeight: '700', margin: '12px 0 6px', textTransform: 'uppercase', letterSpacing: '.07em' },
          txt: it.l.titulo,
        }));
      }
      grupo.appendChild(el('div', { cls: 'formula' },
        it.f[0] ? el('div', { cls: 'que', html: tx(it.f[0]) }) : null,
        el('div', { cls: 'expr', html: M(it.f[1], true) })));
    }
    caja.appendChild(grupo);
  }

  if (!encontradas) {
    caja.appendChild(el('div', { cls: 'vacio' },
      el('div', { cls: 'glifo', txt: '?' }),
      el('p', { txt: 'Nada con “' + filtroFormulas + '”.' }),
      el('p', { estilo: { fontSize: 'var(--t-xs)' }, txt: 'Probá con: separables, integrante, característica, transformada, Fourier, módulo.' })));
  }
}

/* -----------------------------------------------------------
   Progreso
   ----------------------------------------------------------- */

function nivelDia(xp) {
  if (!xp) return 0;
  if (xp < 10) return 1;
  if (xp < 25) return 2;
  if (xp < 50) return 3;
  return 4;
}

function pantallaProgreso(v) {
  const e = Store.est;
  const r = Juego.rango();
  const dom = Math.round(Juego.dominioCurso() * 100);

  v.appendChild(el('h1', { cls: 'titulo-pantalla', txt: 'Progreso' }));
  v.appendChild(el('p', { cls: 'bajada', txt: CURSO.materia + ' · ' + CURSO.alcance }));

  /* --- números principales --- */
  v.appendChild(el('div', { cls: 'mosaico' },
    el('div', { cls: 'loza racha' },
      el('div', { cls: 'cifra', txt: String(e.racha || 0) }),
      el('div', { cls: 'leyenda', txt: 'Días seguidos' })),
    el('div', { cls: 'loza xp' },
      el('div', { cls: 'cifra', txt: String(e.xp || 0) }),
      el('div', { cls: 'leyenda', txt: 'Experiencia' })),
    el('div', { cls: 'loza tino' },
      el('div', { cls: 'cifra', txt: Juego.tino() + '%' }),
      el('div', { cls: 'leyenda', txt: 'Respuestas bien' })),
    el('div', { cls: 'loza' },
      el('div', { cls: 'cifra', txt: dom + '%' }),
      el('div', { cls: 'leyenda', txt: 'Curso cubierto' }))));

  /* --- modo exploración --- */
  const perilla = el('button', {
    cls: 'perilla', type: 'button', role: 'switch',
    'aria-checked': Store.est.libre ? 'true' : 'false',
    'aria-label': 'Modo exploración',
  });
  perilla.addEventListener('click', () => {
    Store.est.libre = !Store.est.libre;
    Store.guardar();
    brindis(Store.est.libre ? 'Todas las lecciones abiertas' : 'Se abren de a una otra vez');
    dibujar();
  });
  v.appendChild(el('div', { cls: 'tarjeta' },
    el('div', { cls: 'fila-conf' },
      el('div', { cls: 'txt' },
        el('strong', { txt: 'Modo exploración' }),
        el('span', { txt: Store.est.libre
          ? 'Todas las lecciones están abiertas: podés entrar a cualquiera y mirar la teoría cuando quieras. Apagalo si preferís que se abran de a una, como Duolingo.'
          : 'Las lecciones se abren de a una, a medida que terminás la anterior. Prendelo para poder entrar a cualquiera y hojear todo.' })),
      perilla)));

  /* --- rango --- */
  const tarjRango = el('div', { cls: 'tarjeta', estilo: { '--u': 'var(--u3)' } },
    el('div', { cls: 'dominio-nombre', estilo: { marginBottom: '8px' } },
      el('span', { cls: 'dominio-glifo', txt: '★' }),
      el('span', { txt: r.nombre }),
      el('span', { cls: 'cinta', estilo: { marginLeft: 'auto' }, txt: e.xp + ' XP' })));
  if (r.hasta) {
    const p = Math.max(0, Math.min(1, (e.xp - r.desde) / (r.hasta - r.desde)));
    tarjRango.appendChild(el('div', { cls: 'riel' }, el('i', { estilo: { width: (p * 100).toFixed(1) + '%' } })));
    tarjRango.appendChild(el('p', { estilo: { fontSize: 'var(--t-xs)', color: 'var(--tinta-2)', marginTop: '7px' },
      txt: (r.hasta - e.xp) + ' XP para llegar a “' + r.siguiente + '”' }));
  } else {
    tarjRango.appendChild(el('p', { estilo: { fontSize: 'var(--t-xs)', color: 'var(--tinta-2)' }, txt: 'Último rango alcanzado. Sos de la cátedra ya.' }));
  }
  v.appendChild(tarjRango);

  /* --- dominio por unidad --- */
  v.appendChild(el('hr', { cls: 'regla' }));
  v.appendChild(el('h3', { estilo: { fontSize: 'var(--t-md)', marginBottom: '12px' }, txt: 'Dominio por unidad' }));
  for (const u of CURSO.unidades) {
    const p = Juego.dominioUnidad(u);
    v.appendChild(el('div', { cls: 'dominio-fila', estilo: { '--u': 'var(--' + u.id + ')' } },
      el('div', { cls: 'dominio-nombre' },
        el('span', { cls: 'dominio-glifo', txt: u.glifo }),
        el('span', { txt: u.titulo })),
      el('div', { cls: 'barra-dominio' },
        el('div', { cls: 'riel' }, el('i', { estilo: { width: (p * 100).toFixed(1) + '%' } })),
        el('span', { cls: 'dominio-pct', txt: Math.round(p * 100) + '%' }))));
  }

  /* --- actividad --- */
  v.appendChild(el('hr', { cls: 'regla' }));
  v.appendChild(el('h3', { estilo: { fontSize: 'var(--t-md)', marginBottom: '4px' }, txt: 'Actividad' }));

  const hoyD = new Date();
  const dow = (hoyD.getDay() + 6) % 7;            // 0 = lunes
  const inicio = new Date(hoyD);
  inicio.setDate(hoyD.getDate() - dow - 7 * 11);

  const cal = el('div', { cls: 'calendario', role: 'img' });
  let activos = 0;
  let totalXp = 0;
  for (let i = 0; i < 84; i++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    const clave = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const xp = e.dias[clave] || 0;
    if (xp > 0) { activos++; totalXp += xp; }
    cal.appendChild(el('span', {
      cls: 'dia', 'data-nivel': String(nivelDia(xp)),
      title: clave + (xp ? ' · ' + xp + ' XP' : ' · sin actividad'),
    }));
  }
  cal.setAttribute('aria-label', activos + ' días con actividad en las últimas 12 semanas, ' + totalXp + ' XP en total');
  v.appendChild(el('p', { estilo: { fontSize: 'var(--t-xs)', color: 'var(--tinta-2)', marginBottom: '9px' },
    txt: activos + ' ' + plural(activos, 'día', 'días') + ' con actividad en las últimas 12 semanas · ' + totalXp + ' XP' }));
  v.appendChild(cal);

  const leyenda = el('div', { cls: 'leyenda-cal' }, el('span', { txt: 'menos' }));
  for (let i = 0; i <= 4; i++) leyenda.appendChild(el('span', { cls: 'dia', 'data-nivel': String(i) }));
  leyenda.appendChild(el('span', { txt: 'más' }));
  v.appendChild(leyenda);

  /* --- medallas --- */
  v.appendChild(el('hr', { cls: 'regla' }));
  const ganadas = Juego.MEDALLAS.filter((m) => e.medallas[m.id]).length;
  v.appendChild(el('h3', { estilo: { fontSize: 'var(--t-md)', marginBottom: '10px' },
    txt: 'Medallas · ' + ganadas + '/' + Juego.MEDALLAS.length }));
  v.appendChild(el('div', { cls: 'medallas' }, Juego.MEDALLAS.map((m) => el('div', {
    cls: 'medalla', 'data-ganada': e.medallas[m.id] ? '1' : '0',
    title: e.medallas[m.id] ? 'Ganada el ' + e.medallas[m.id] : 'Todavía no',
  },
    el('div', { cls: 'icono', txt: m.icono }),
    el('div', { cls: 'nom', txt: m.nom }),
    el('div', { cls: 'desc', txt: m.desc })))));

  /* --- datos y borrado --- */
  v.appendChild(el('hr', { cls: 'regla' }));
  v.appendChild(el('p', { estilo: { fontSize: 'var(--t-xs)', color: 'var(--tinta-3)', marginBottom: '10px' },
    txt: Store.remoto
      ? 'Tu progreso se guarda en este navegador y además se sincroniza, así que lo tenés igual en el celular y en la compu.'
      : 'Tu progreso se guarda en este navegador.' }));
  v.appendChild(el('button', {
    cls: 'btn btn-fantasma btn-chico', type: 'button', txt: 'Borrar todo mi progreso',
    on: {
      click: () => {
        if (window.confirm('¿Seguro? Se borran la racha, la XP y todas las lecciones hechas. No se puede deshacer.')) {
          Store.borrarTodo();
          brindis('Progreso borrado');
          dibujar();
        }
      },
    },
  }));
}

/* -----------------------------------------------------------
   Profe: tutor con IA
   ----------------------------------------------------------- */

const CHAT = [];
let sampleNs;              // undefined = sin probar, null = no disponible
let profeOcupado = false;

/**
 * ¿Mostrar la solapa del profe? Alcanza con que exista el runtime de
 * Claude: así aparece al instante en el Artifact, sin esperar la sonda.
 * Publicada como sitio estático no existe, y la solapa no se muestra.
 */
function hayProfe() {
  return sampleNs ? true : !!(window.claude && window.claude.use);
}

/**
 * El profe con IA sólo existe donde corre `claude.use`. Fuera de ahí
 * (por ejemplo publicado como sitio estático) la solapa ni se muestra.
 */
async function probarProfe() {
  if (sampleNs !== undefined) return sampleNs;
  try { sampleNs = (window.claude && claude.use) ? await claude.use('sample') : null; }
  catch (e) { sampleNs = null; }
  return sampleNs;
}

const PREAMBULO = [
  'Sos profesor particular de Análisis Matemático III (Ingeniería en Informática, 2.º año, Universidad de Belgrano, cátedra Karina Di Fazio).',
  'El alumno cursó hasta la página 20 del cuadernillo. Los temas vistos son, en orden:',
  '(0) repaso de integrales: sustitución, por partes y fracciones simples;',
  '(1) ecuaciones diferenciales: orden, grado, solución general y particular;',
  '(2) variables separables; (3) lineales con factor de integración y Bernoulli; (4) homogéneas con y=u·x;',
  '(5) segundo orden con coeficientes constantes: ecuación característica y los tres casos de raíces;',
  '(6) transformada de Laplace: definición, tabla, transformada de derivadas, inversa y resolución de ecuaciones;',
  '(7) series de Fourier: coeficientes, funciones pares e impares;',
  '(8) complejos y funciones de variable compleja: forma trigonométrica, raíces, regiones del plano, parte real e imaginaria, dominio y límites.',
  '',
  'Cómo respondés:',
  '- En castellano rioplatense, de vos, directo y sin vueltas. Nada de "¡Excelente pregunta!".',
  '- Breve: 3 a 8 renglones salvo que pidan un desarrollo completo.',
  '- La matemática siempre entre signos de peso: $x^2$ en línea, $$...$$ para una fórmula sola. Usá LaTeX.',
  '- Si el alumno pide resolver un ejercicio, mostrá los pasos numerados, no sólo el resultado.',
  '- Si la pregunta se va del programa de la materia, decilo en un renglón y respondé igual lo que puedas.',
  '- No inventes: si no estás seguro de un dato de la cátedra, decilo.',
].join('\n');

const SUGERENCIAS = [
  '¿Cómo sé si una ecuación es homogénea o lineal?',
  'Explicame el factor de integración como si tuviera 12 años',
  'Resolvé paso a paso: $y\'\' - 6y\' + 13y = 0$',
  '¿Por qué en el caso de raíz doble aparece la $x$?',
  'Dame 3 ejercicios de Laplace para practicar',
  '¿Cuándo uso sustitución y cuándo por partes?',
];

function pantallaProfe(v) {
  v.appendChild(el('h1', { cls: 'titulo-pantalla', txt: 'Profe' }));
  v.appendChild(el('p', { cls: 'bajada', txt: 'Preguntale lo que no entendiste. Conoce el programa de la materia y hasta dónde llegaron.' }));

  const hilo = el('div', { cls: 'chat', id: 'hilo' });
  v.appendChild(hilo);
  pintarHilo(hilo);

  if (!CHAT.length) {
    const sug = el('div', { cls: 'sugerencias' });
    for (const s of SUGERENCIAS) {
      sug.appendChild(el('button', {
        cls: 'sugerencia', type: 'button', html: tx(s),
        on: { click: () => preguntar(s) },
      }));
    }
    v.appendChild(sug);
  }

  const caja = el('textarea', {
    id: 'pregunta', rows: '1', placeholder: 'Escribí tu pregunta…',
    on: {
      input: (e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(130, e.target.scrollHeight) + 'px'; },
      keydown: (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); preguntar(caja.value); }
      },
    },
  });
  v.appendChild(el('div', { cls: 'compositor' }, caja,
    el('button', {
      cls: 'btn btn-primario', type: 'button', 'aria-label': 'Enviar', html: icono('enviar'),
      on: { click: () => preguntar(caja.value) },
    })));

  if (CHAT.length) {
    v.appendChild(el('button', {
      cls: 'btn btn-fantasma btn-chico', type: 'button', estilo: { marginTop: '12px' }, txt: 'Empezar de nuevo',
      on: { click: () => { CHAT.length = 0; dibujar(); } },
    }));
  }
}

function pintarHilo(hilo) {
  hilo.textContent = '';
  if (!CHAT.length) {
    hilo.appendChild(el('div', { cls: 'burbuja profe' },
      el('p', { html: tx('Hola. Soy tu profe de **Análisis III**. Preguntame cualquier cosa de lo que vieron: integrales, ecuaciones diferenciales, Laplace, Fourier o variable compleja.') }),
      el('p', { html: tx('También te puedo armar ejercicios nuevos para practicar, o explicarte un tema de otra forma si no te cerró en clase.') })));
    return;
  }
  for (const m of CHAT) {
    const b = el('div', { cls: 'burbuja ' + (m.rol === 'user' ? 'vos' : 'profe') });
    if (m.pensando) {
      b.appendChild(el('span', { cls: 'puntitos' }, el('i'), el('i'), el('i')));
    } else {
      for (const par of String(m.texto).split(/\n{2,}/)) {
        b.appendChild(el('p', { html: tx(par) }));
      }
    }
    hilo.appendChild(b);
  }
}

function refrescarHilo() {
  const hilo = $('#hilo');
  if (hilo) { pintarHilo(hilo); hilo.lastChild.scrollIntoView({ block: 'nearest' }); }
}

async function preguntar(texto) {
  const q = String(texto || '').trim();
  if (!q || profeOcupado) return;

  await probarProfe();

  CHAT.push({ rol: 'user', texto: q });
  const caja = $('#pregunta');
  if (caja) { caja.value = ''; caja.style.height = 'auto'; }

  if (!sampleNs) {
    CHAT.push({ rol: 'profe', texto: 'No puedo responder desde acá: el profe con IA sólo funciona en la versión publicada de la página, y hay que darle permiso la primera vez. Mientras tanto tenés toda la teoría en cada lección y el machete completo en **Fórmulas**.' });
    dibujar();
    return;
  }

  const burbuja = { rol: 'profe', texto: '', pensando: true };
  CHAT.push(burbuja);
  profeOcupado = true;
  dibujar();

  const turnos = CHAT.filter((m) => !m.pensando).map((m, i) => ({
    role: m.rol === 'user' ? 'user' : 'assistant',
    content: (i === 0 ? PREAMBULO + '\n\n---\n\n' : '') + m.texto,
  }));

  try {
    const res = await sampleNs(turnos, {
      modelTier: 'default',
      onText: ({ text }) => { burbuja.texto = text; burbuja.pensando = false; refrescarHilo(); },
    });
    burbuja.texto = (res && res.text) || burbuja.texto || 'No me salió la respuesta. Probá de nuevo.';
    burbuja.pensando = false;
  } catch (err) {
    burbuja.pensando = false;
    const code = err && err.code;
    burbuja.texto = code === 'rate_limited'
      ? 'Frenemos un toque: llegaste al límite de consultas. Probá en unos minutos.'
      : (code === 'not_granted'
        ? 'Hace falta que permitas la consulta para que pueda responderte.'
        : 'Se cortó la respuesta. Probá de nuevo.');
  }
  profeOcupado = false;
  dibujar();
}
