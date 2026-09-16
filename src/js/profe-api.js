/* ===========================================================
   profe-api.js — el profe con IA usando la clave de quien usa
   la página. Sólo hace falta cuando la app corre fuera de
   claude.ai; adentro se usa la capacidad `sample`.

   La clave queda en el navegador de cada persona y viaja
   únicamente a api.anthropic.com.
   =========================================================== */

const API_URL = 'https://api.anthropic.com/v1/messages';
const CLAVE_LS = 'cuaderno-de-mate/clave';
const MODELO_LS = 'cuaderno-de-mate/modelo';
const TOPE_RESPUESTA = 2000;

const MODELOS = [
  { id: 'claude-opus-5', nom: 'Opus 5', desc: 'El más capaz. Recomendado para que no se equivoque en las cuentas.' },
  { id: 'claude-sonnet-5', nom: 'Sonnet 5', desc: 'Intermedio, bastante más barato.' },
  { id: 'claude-haiku-4-5', nom: 'Haiku 4.5', desc: 'El más económico y rápido.' },
];

function leerLS(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
function escribirLS(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { /* modo privado */ } }

function leerClave() { return leerLS(CLAVE_LS); }
function guardarClave(v) { escribirLS(CLAVE_LS, v.trim()); }
function leerModelo() { return leerLS(MODELO_LS) || MODELOS[0].id; }

/**
 * Pide una respuesta a Claude y la va entregando a medida que llega.
 * @param {{turnos: object[], sistema: string, onText: function}} op
 * @returns {Promise<string>} la respuesta completa
 */
async function llamarClaude(op) {
  const clave = leerClave();
  if (!clave) throw { code: 'sin_clave', message: 'Falta cargar la clave.' };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': clave,
      'anthropic-version': '2023-06-01',
      // Sin este header la API rechaza el pedido hecho desde un navegador.
      'anthropic-dangerous-direct-browser-access': 'true',
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    body: JSON.stringify({
      model: leerModelo(),
      max_tokens: TOPE_RESPUESTA,
      stream: true,
      fallbacks: 'default',
      system: op.sistema,
      messages: op.turnos,
    }),
  });

  if (!res.ok) {
    let tipo = String(res.status);
    let msg = 'La API respondió ' + res.status + '.';
    try {
      const j = await res.json();
      if (j && j.error) { tipo = j.error.type || tipo; msg = j.error.message || msg; }
    } catch (e) { /* respuesta sin json */ }
    throw { code: tipo, message: msg, status: res.status };
  }

  const lector = res.body.getReader();
  const dec = new TextDecoder();
  let pendiente = '';
  let texto = '';

  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    pendiente += dec.decode(value, { stream: true });
    const bloques = pendiente.split('\n\n');
    pendiente = bloques.pop();

    for (const bloque of bloques) {
      const linea = bloque.split('\n').find((l) => l.indexOf('data:') === 0);
      if (!linea) continue;
      let ev;
      try { ev = JSON.parse(linea.slice(5).trim()); } catch (e) { continue; }

      if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') {
        texto += ev.delta.text;
        if (op.onText) op.onText(texto);
      } else if (ev.type === 'error') {
        throw { code: (ev.error && ev.error.type) || 'error', message: (ev.error && ev.error.message) || 'Se cortó la respuesta.', text: texto };
      } else if (ev.type === 'message_delta' && ev.delta && ev.delta.stop_reason === 'refusal') {
        throw { code: 'refusal', message: 'El modelo declinó responder esta consulta.', text: texto };
      }
    }
  }
  return texto;
}

/* -----------------------------------------------------------
   Pantalla para cargar la clave
   ----------------------------------------------------------- */

function panelClave(alGuardar) {
  const campo = el('input', {
    cls: 'campo', type: 'password', id: 'clave-api',
    placeholder: 'sk-ant-...', autocomplete: 'off', spellcheck: 'false',
    estilo: { textAlign: 'left', fontSize: 'var(--t-md)' },
  });

  const elegido = leerModelo();
  const selector = el('div', { cls: 'opciones', estilo: { marginTop: '10px' } },
    MODELOS.map((m) => {
      const b = el('button', {
        cls: 'opcion', type: 'button', 'aria-pressed': String(m.id === elegido), 'data-m': m.id,
        on: {
          click: () => {
            escribirLS(MODELO_LS, m.id);
            $$('.opcion', selector).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.m === m.id)));
          },
        },
      },
        el('span', { cls: 'cont' },
          el('strong', { txt: m.nom }),
          el('span', { estilo: { display: 'block', fontSize: 'var(--t-xs)', color: 'var(--tinta-2)' }, txt: m.desc })));
      return b;
    }));

  function guardar() {
    const v = campo.value.trim();
    if (!v) { brindis('Pegá la clave primero'); campo.focus(); return; }
    if (v.indexOf('sk-ant-') !== 0) { brindis('Esa no parece una clave de Anthropic'); return; }
    guardarClave(v);
    brindis('Listo, ya podés preguntar');
    if (alGuardar) alGuardar();
  }

  return el('div', {},
    el('div', { cls: 'tarjeta' },
      el('h3', { estilo: { fontSize: 'var(--t-lg)', marginBottom: '8px' }, txt: 'Activá el profe con tu clave' }),
      el('p', { estilo: { fontSize: 'var(--t-sm)', color: 'var(--tinta-2)', lineHeight: '1.6' },
        html: tx('El profe responde con **Claude**. Para que funcione en esta página hace falta una clave de la API de Anthropic. **Cada persona usa la suya** y paga solamente lo que consume.') }),
      el('ol', { cls: 'pasos', estilo: { marginTop: '14px' } },
        el('li', {}, el('div', {},
          // tx() escapa el HTML, así que el enlace se arma como nodo.
          el('span', { txt: 'Entrá a ' }),
          el('a', {
            href: 'https://console.anthropic.com/settings/keys',
            target: '_blank', rel: 'noopener noreferrer',
            txt: 'console.anthropic.com',
          }),
          el('span', { txt: ' y creá tu clave.' }))),
        el('li', {}, el('div', { html: tx('Conviene ponerle un **límite de gasto** desde la consola, por las dudas.') })),
        el('li', {}, el('div', { html: tx('Pegala acá abajo. Queda guardada en **este navegador** nada más.') }))),
      el('div', { estilo: { marginTop: '14px' } }, campo),
      el('p', { cls: 'ayuda-campo', estilo: { textAlign: 'left' },
        txt: 'Se guarda en tu navegador y viaja únicamente a api.anthropic.com. No pasa por ningún otro servidor.' }),
      el('button', {
        cls: 'btn btn-primario btn-ancho', type: 'button', txt: 'Guardar y empezar',
        estilo: { marginTop: '12px' },
        on: { click: guardar },
      })),

    el('div', { cls: 'tarjeta' },
      el('h3', { estilo: { fontSize: 'var(--t-md)', marginBottom: '8px' }, txt: 'Qué modelo usar' }),
      selector),

    el('div', { cls: 'bloque ojo', estilo: { marginTop: '12px' } },
      el('div', { cls: 'bloque-titulo', txt: 'Ojo con esto' }),
      el('div', { html: tx('No cargues tu clave en una computadora compartida: cualquiera con acceso a ese navegador podría leerla. Y si sos quien publicó la página, **no pongas tu propia clave en el código** para que la use todo el mundo: te la pueden sacar y gastar.') })));
}
