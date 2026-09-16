/* ===========================================================
   app.js — arranque, atajos de teclado y reacomodo
   =========================================================== */

function atajos(e) {
  if (Sesion && e.key === 'Escape') { e.preventDefault(); confirmarSalida(); return; }
  if (!Sesion || Sesion.paso !== 'ejercicio') return;

  const activo = document.activeElement;
  const escribiendo = activo && (activo.tagName === 'INPUT' || activo.tagName === 'TEXTAREA');
  const cajon = $('#cajon');
  const abierto = cajon && cajon.dataset.abierto === '1';

  if (e.key === 'Enter') {
    if (abierto) { e.preventDefault(); siguiente(); }
    else if (Sesion.ctrl && Sesion.ctrl.listo()) { e.preventDefault(); comprobar(); }
    return;
  }
  if (escribiendo || abierto) return;
  if (/^[1-6]$/.test(e.key) && Sesion.ctrl && Sesion.ctrl.atajos) {
    const b = Sesion.ctrl.atajos[Number(e.key) - 1];
    if (b && !b.disabled) { e.preventDefault(); b.click(); }
  }
}

let timerResize = null;
function alRedimensionar() {
  clearTimeout(timerResize);
  timerResize = setTimeout(() => {
    if (Sesion || vistaActual !== 'mapa') return;
    $$('.sendero').forEach((s) => trazarSendero(s, $$('.nodo-fila', s).length));
  }, 160);
}

function arrancar(previo) {
  if (previo && previo.vista && SECCIONES.some((s) => s.id === previo.vista)) vistaActual = previo.vista;
  if (previo && Array.isArray(previo.chat)) CHAT.push.apply(CHAT, previo.chat);

  Store.arrancar();
  Store.alCambiar(() => { if (!Sesion) { pintarBarra(); pintarNav(); } });

  pintarNav();
  dibujar();

  document.addEventListener('keydown', atajos);
  window.addEventListener('resize', alRedimensionar);

  // El almacén remoto responde tarde: cuando llega, se repinta.
  setTimeout(() => { if (!Sesion) dibujar(); }, 1200);
}

/* Si la página se vuelve a publicar mientras alguien la está usando,
   el visor conserva lo que estaba haciendo. */
try {
  if (window.claude && claude.hot && claude.hot.snapshot) {
    claude.hot.snapshot(() => ({ vista: vistaActual, chat: CHAT.slice(-20) }));
  }
} catch (e) { /* sin hot reload */ }

try {
  if (window.claude && claude.hot && claude.hot.ready) claude.hot.ready(arrancar);
  else arrancar((window.claude && claude.hot && claude.hot.data) || {});
} catch (e) {
  arrancar({});
}
