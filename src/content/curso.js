/* curso.js — arma el curso a partir de las unidades cargadas antes. */
const CURSO = {
  materia: 'Análisis Matemático III',
  carrera: 'Ingeniería en Informática · 2.º año',
  catedra: 'Prof. Karina Di Fazio · Universidad de Belgrano',
  alcance: 'Cuadernillo hasta la página 20',
  aviso: 'Material de estudio no oficial, escrito a partir de las clases. '
    + 'No reemplaza al cuadernillo ni a la cátedra.',
  bibliografia: [
    'Ecuaciones diferenciales — Dennis Zill (Cengage)',
    'Matemáticas avanzadas para la ingeniería — Zill & Wright',
    'Matemáticas avanzadas para la ingeniería — Peter O’Neil (Cengage)',
  ],
  unidades: (window.__UNIDADES || []).slice().sort((a, b) => a.n - b.n),
};
