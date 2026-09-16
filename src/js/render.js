/* ===========================================================
   render.js — teoría y ejercicios
   =========================================================== */

/* ---------------------------------------------------------
   Teoría. Cada bloque del contenido es un objeto de una sola
   clave: {p:…} {h:…} {def:[t,c]} {ej:[t,[pasos]]} {tabla:[cab,filas]}…
   --------------------------------------------------------- */

function bloqueTeoria(b) {
  const k = Object.keys(b)[0];
  const v = b[k];

  switch (k) {
    case 'p':
      return el('p', { html: tx(v) });

    case 'h':
      return el('h3', { html: tx(v) });

    case 'mat':
      return el('div', { html: M(v, true) });

    case 'lista':
      return el('ul', {}, v.map((x) => el('li', { html: tx(x) })));

    case 'num':
      return el('ol', {}, v.map((x) => el('li', { html: tx(x) })));

    case 'def':
      return el('div', { cls: 'bloque def' },
        el('div', { cls: 'bloque-titulo', txt: v[0] }),
        el('div', { html: tx(v[1]) }));

    case 'ojo':
      return el('div', { cls: 'bloque ojo' },
        el('div', { cls: 'bloque-titulo', txt: 'Ojo con esto' }),
        el('div', { html: tx(v) }));

    case 'truco':
      return el('div', { cls: 'bloque truco' },
        el('div', { cls: 'bloque-titulo', txt: 'Truco' }),
        el('div', { html: tx(v) }));

    case 'code':
      return el('div', { cls: 'bloque code' },
        el('div', { cls: 'bloque-titulo', txt: 'En código (' + v[0] + ')' }),
        el('pre', { txt: v[1] }));

    case 'ej':
      return el('div', { cls: 'ejemplo' },
        el('div', { cls: 'ejemplo-titulo', txt: v[0] }),
        el('ol', { cls: 'pasos' }, v[1].map((p) => el('li', {}, el('div', { html: tx(p) })))));

    case 'tabla': {
      const [cab, filas] = v;
      return el('div', { cls: 'tabla-caja' },
        el('table', { cls: 'datos' },
          el('thead', {}, el('tr', {}, cab.map((c) => el('th', { html: tx(c) })))),
          el('tbody', {}, filas.map((f) => el('tr', {}, f.map((c) => {
            const t = String(c).trim();
            const cls = t === 'V' ? 'v' : (t === 'F' ? 'f' : null);
            return el('td', { cls, html: tx(c) });
          }))))));
    }

    default:
      return el('p', { html: tx(String(v)) });
  }
}

function pintarTeoria(bloques) {
  return el('div', { cls: 'teoria' }, bloques.map(bloqueTeoria));
}

/* ---------------------------------------------------------
   Ejercicios
   Cada uno devuelve { nodo, listo(), evaluar(), marcar(ok),
   solucion() }.
   --------------------------------------------------------- */

const LETRAS = ['1', '2', '3', '4', '5', '6'];

function crearEjercicio(ej, alCambiar) {
  const avisar = alCambiar || function () {};
  switch (ej.t) {
    case 'mc':    return ejOpcionUnica(ej, avisar);
    case 'multi': return ejOpcionMultiple(ej, avisar);
    case 'vf':    return ejVerdaderoFalso(ej, avisar);
    case 'in':    return ejEscribir(ej, avisar);
    case 'ord':   return ejOrdenar(ej, avisar);
    case 'par':   return ejEmparejar(ej, avisar);
    case 'hue':   return ejHuecos(ej, avisar);
    default:      return ejOpcionUnica(ej, avisar);
  }
}

/* --- una sola opción correcta --- */
function ejOpcionUnica(ej, avisar) {
  const orden = ej.fijo ? ej.o.map((_, i) => i) : mezclar(ej.o.map((_, i) => i));
  let elegida = null;

  const botones = orden.map((iOrig, iVista) => {
    const b = el('button', {
      cls: 'opcion', type: 'button', 'aria-pressed': 'false', 'data-i': iOrig,
      on: { click: () => { if (b.disabled) return; elegida = iOrig; pintar(); avisar(); } },
    },
      el('span', { cls: 'tecla', txt: LETRAS[iVista] || '' }),
      el('span', { cls: 'cont', html: tx(ej.o[iOrig]) }));
    return b;
  });

  function pintar() {
    botones.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.i) === elegida)));
  }

  const cortas = ej.o.every((o) => String(o).length <= 14);
  const nodo = el('div', { cls: 'opciones' + (ej.o.length === 2 || (ej.o.length === 4 && cortas) ? ' dos' : '') }, botones);

  return {
    nodo,
    atajos: botones,
    listo: () => elegida !== null,
    evaluar: () => elegida === ej.r,
    marcar() {
      botones.forEach((b) => {
        b.disabled = true;
        const i = Number(b.dataset.i);
        if (i === ej.r) b.dataset.marca = 'bien';
        else if (i === elegida) b.dataset.marca = 'mal';
      });
    },
    solucion: () => tx(ej.o[ej.r]),
  };
}

/* --- varias correctas --- */
function ejOpcionMultiple(ej, avisar) {
  const elegidas = new Set();
  const orden = ej.fijo ? ej.o.map((_, i) => i) : mezclar(ej.o.map((_, i) => i));

  const botones = orden.map((iOrig, iVista) => {
    const b = el('button', {
      cls: 'opcion', type: 'button', 'aria-pressed': 'false', 'data-i': iOrig,
      on: {
        click: () => {
          if (b.disabled) return;
          if (elegidas.has(iOrig)) elegidas.delete(iOrig); else elegidas.add(iOrig);
          b.setAttribute('aria-pressed', String(elegidas.has(iOrig)));
          avisar();
        },
      },
    },
      el('span', { cls: 'tecla', txt: LETRAS[iVista] || '' }),
      el('span', { cls: 'cont', html: tx(ej.o[iOrig]) }));
    return b;
  });

  return {
    nodo: el('div', { cls: 'opciones' }, botones),
    atajos: botones,
    listo: () => elegidas.size > 0,
    evaluar: () => ej.r.length === elegidas.size && ej.r.every((i) => elegidas.has(i)),
    marcar() {
      botones.forEach((b) => {
        b.disabled = true;
        const i = Number(b.dataset.i);
        if (ej.r.includes(i)) b.dataset.marca = 'bien';
        else if (elegidas.has(i)) b.dataset.marca = 'mal';
      });
    },
    solucion: () => ej.r.map((i) => tx(ej.o[i])).join(' · '),
  };
}

/* --- verdadero o falso --- */
function ejVerdaderoFalso(ej, avisar) {
  let elegida = null;
  const mk = (txt, val) => {
    const b = el('button', {
      cls: 'opcion', type: 'button', 'aria-pressed': 'false', 'data-v': String(val),
      on: { click: () => { if (b.disabled) return; elegida = val; a.setAttribute('aria-pressed', String(elegida === true)); z.setAttribute('aria-pressed', String(elegida === false)); avisar(); } },
    }, el('span', { cls: 'cont', txt }));
    return b;
  };
  const a = mk('Verdadero', true);
  const z = mk('Falso', false);

  return {
    nodo: el('div', { cls: 'opciones dos' }, a, z),
    atajos: [a, z],
    listo: () => elegida !== null,
    evaluar: () => elegida === ej.r,
    marcar() {
      [a, z].forEach((b) => {
        b.disabled = true;
        const v = b.dataset.v === 'true';
        if (v === ej.r) b.dataset.marca = 'bien';
        else if (v === elegida) b.dataset.marca = 'mal';
      });
    },
    solucion: () => (ej.r ? 'Verdadero' : 'Falso'),
  };
}

/* --- escribir la respuesta --- */
function ejEscribir(ej, avisar) {
  const campo = el('input', {
    cls: 'campo', type: 'text', id: 'campo-respuesta',
    autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    placeholder: ej.ph || 'Tu respuesta',
    inputmode: ej.texto ? 'text' : 'text',
    on: { input: avisar },
  });

  const hijos = [campo];
  if (ej.teclas && ej.teclas.length) {
    hijos.push(el('div', { cls: 'teclas' }, ej.teclas.map((t) => el('button', {
      cls: 'tecla-mat', type: 'button', txt: t,
      on: {
        click: () => {
          if (campo.disabled) return;
          const p = campo.selectionStart == null ? campo.value.length : campo.selectionStart;
          campo.value = campo.value.slice(0, p) + t + campo.value.slice(campo.selectionEnd == null ? p : campo.selectionEnd);
          campo.focus();
          campo.setSelectionRange(p + t.length, p + t.length);
          avisar();
        },
      },
    }))));
  }
  if (ej.ayuda) hijos.push(el('p', { cls: 'ayuda-campo', html: tx(ej.ayuda) }));

  return {
    nodo: el('div', {}, hijos),
    foco: campo,
    listo: () => campo.value.trim().length > 0,
    evaluar: () => coincide(campo.value, ej.r, { tol: ej.tol }),
    marcar(ok) { campo.disabled = true; campo.dataset.marca = ok ? 'bien' : 'mal'; },
    solucion: () => tx(String(ej.r[0])),
  };
}

/* --- ordenar los pasos --- */
function ejOrdenar(ej, avisar) {
  const n = ej.o.length;
  const colocadas = new Array(n).fill(null);   // índice original en cada ranura
  const banco = mezclar(ej.o.map((_, i) => i));

  const zona = el('div', { cls: 'orden-zona' });
  const bancoNodo = el('div', { cls: 'orden-banco' });

  const fichas = banco.map((iOrig) => el('button', {
    cls: 'ficha', type: 'button', 'data-i': iOrig,
    html: tx(ej.o[iOrig]),
    on: { click: function () { if (this.classList.contains('usada')) return; poner(iOrig); } },
  }));

  function poner(iOrig) {
    const libre = colocadas.indexOf(null);
    if (libre < 0) return;
    colocadas[libre] = iOrig;
    dibujar();
    avisar();
  }

  function sacar(ranura) {
    if (colocadas[ranura] === null) return;
    colocadas[ranura] = null;
    dibujar();
    avisar();
  }

  function dibujar() {
    zona.textContent = '';
    for (let i = 0; i < n; i++) {
      const iOrig = colocadas[i];
      zona.appendChild(el('div', {
        cls: 'orden-slot' + (iOrig !== null ? ' llena' : ''),
        role: 'button', tabindex: '0',
        on: {
          click: () => sacar(i),
          keydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sacar(i); } },
        },
      },
        el('span', { cls: 'pos', txt: String(i + 1) }),
        el('span', { html: iOrig !== null ? tx(ej.o[iOrig]) : '' })));
    }
    fichas.forEach((f) => f.classList.toggle('usada', colocadas.includes(Number(f.dataset.i))));
  }

  dibujar();
  bancoNodo.append(...fichas);

  return {
    nodo: el('div', {}, zona, bancoNodo),
    listo: () => colocadas.every((x) => x !== null),
    evaluar: () => colocadas.every((x, i) => x === i),
    marcar(ok) {
      zona.dataset.marca = ok ? 'bien' : 'mal';
      $$('.orden-slot', zona).forEach((s) => { s.removeAttribute('tabindex'); s.removeAttribute('role'); });
      fichas.forEach((f) => { f.disabled = true; });
    },
    solucion: () => ej.o.map((x, i) => (i + 1) + '. ' + x).map(tx).join('<br>'),
  };
}

/* --- emparejar dos columnas --- */
function ejEmparejar(ej, avisar) {
  const izq = ej.o.map((p, i) => ({ txt: p[0], i }));
  const der = mezclar(ej.o.map((p, i) => ({ txt: p[1], i })));
  let sel = null;       // {lado, i, nodo}
  let ligados = 0;
  let fallos = 0;

  function armar(lado, items) {
    return items.map((it) => {
      const b = el('button', {
        cls: 'par-item', type: 'button', 'aria-pressed': 'false', 'data-i': it.i,
        on: { click: () => tocar(lado, it.i, b) },
      }, el('span', { html: tx(it.txt) }));
      return b;
    });
  }

  function tocar(lado, i, nodo) {
    if (nodo.hasAttribute('data-ligado') || nodo.disabled) return;
    if (!sel) { sel = { lado, i, nodo }; nodo.setAttribute('aria-pressed', 'true'); return; }
    if (sel.lado === lado) {
      sel.nodo.setAttribute('aria-pressed', 'false');
      sel = { lado, i, nodo };
      nodo.setAttribute('aria-pressed', 'true');
      return;
    }
    sel.nodo.setAttribute('aria-pressed', 'false');
    if (sel.i === i) {
      const sello = String(++ligados);
      [sel.nodo, nodo].forEach((x) => {
        x.setAttribute('data-ligado', sello);
        x.setAttribute('aria-pressed', 'false');
        x.prepend(el('span', { cls: 'par-sello', txt: sello }));
      });
      sel = null;
      avisar();
    } else {
      fallos++;
      const malo = nodo;
      malo.dataset.marca = 'mal';
      sel.nodo.dataset.marca = 'mal';
      const previo = sel.nodo;
      setTimeout(() => { delete malo.dataset.marca; delete previo.dataset.marca; }, 420);
      sel = null;
      avisar();
    }
  }

  const colIzq = armar('i', izq);
  const colDer = armar('d', der);

  return {
    nodo: el('div', { cls: 'pares' },
      el('div', { cls: 'par-col' }, colIzq),
      el('div', { cls: 'par-col' }, colDer)),
    listo: () => ligados === ej.o.length,
    evaluar: () => fallos === 0,
    marcar() { [...colIzq, ...colDer].forEach((b) => { b.disabled = true; }); },
    solucion: () => ej.o.map((p) => tx(p[0]) + ' → ' + tx(p[1])).join('<br>'),
  };
}

/* --- completar huecos --- */
function ejHuecos(ej, avisar) {
  const trozos = ej.tpl.split('___');
  const campos = [];
  const cont = el('div', { cls: 'huecos' });

  trozos.forEach((t, i) => {
    cont.appendChild(el('span', { html: tx(t) }));
    if (i < trozos.length - 1) {
      const c = el('input', {
        cls: 'hueco', type: 'text', autocomplete: 'off', spellcheck: 'false',
        id: 'hueco-' + i, 'aria-label': 'Hueco ' + (i + 1),
        size: String(Math.max(3, String(ej.r[i][0]).length + 1)),
        on: { input: avisar },
      });
      campos.push(c);
      cont.appendChild(c);
    }
  });

  return {
    nodo: cont,
    foco: campos[0],
    listo: () => campos.every((c) => c.value.trim().length > 0),
    evaluar: () => campos.every((c, i) => coincide(c.value, ej.r[i], { tol: ej.tol })),
    marcar() {
      campos.forEach((c, i) => {
        c.disabled = true;
        c.dataset.marca = coincide(c.value, ej.r[i], { tol: ej.tol }) ? 'bien' : 'mal';
      });
    },
    solucion: () => ej.r.map((v) => tx(String(v[0]))).join(' · '),
  };
}
