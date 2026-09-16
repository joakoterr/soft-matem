# Cuaderno de Análisis III

Entrenador de práctica para **Análisis Matemático III** — Ingeniería en Informática,
2.º año, Universidad de Belgrano (cátedra Prof. Karina Di Fazio).

Funciona como Duolingo: un sendero de unidades que se van abriendo, lecciones cortas
con teoría y ejercicios de opción múltiple, arrastrar, completar y emparejar, vidas,
racha diaria, XP y repaso espaciado.

El contenido cubre el cuadernillo **hasta la página 20**, que es lo que se dictó
hasta el 10/09/2026, y está armado a partir de las fotos del pizarrón de las siete
clases, la Guía Teórica y las Prácticas del cuadernillo, y el machete de
fórmulas de la cátedra.

## Contenido

| Unidad | Tema | Lecciones |
|---|---|---|
| 0 | Repaso de integrales: sustitución, partes, fracciones simples | 5 |
| 1 | Qué es una ecuación diferencial: orden, grado, soluciones | 3 |
| 2 | Variables separables | 4 |
| 3 | Lineales con factor de integración y Bernoulli | 4 |
| 4 | Homogéneas con la sustitución `y = u·x` | 3 |
| 5 | Segundo orden: ecuación característica y los tres casos | 4 |
| 6 | Transformada de Laplace: tabla, derivadas, inversa, traslación, EDO | 6 |
| 7 | Series de Fourier: coeficientes, pares e impares | 4 |
| 8 | Complejos, variable compleja, límites, Euler y logaritmo | 6 |

**39 lecciones · 389 ejercicios · 140 fórmulas de referencia.**

Los ejemplos resueltos son los mismos que la profesora desarrolló en el pizarrón,
así que lo que se practica acá es exactamente lo que se pide en el parcial.

## Cómo está armado

Una sola página HTML autocontenida, sin dependencias en tiempo de ejecución. KaTeX
va incrustado (CSS y fuentes woff2 como data-URI) porque el CSP de los Artifacts
no admite hojas de estilo externas.

```
src/
  shell.html        plantilla de la página
  styles.css        sistema de diseño (claro = cuaderno, oscuro = pizarrón)
  js/
    util.js         DOM, texto enriquecido y matemática con KaTeX
    store.js        progreso en localStorage, sincronizado con el almacén `db`
    mate.js         comparación de respuestas ("0,5", "1/2" y ".5" son lo mismo)
    engine.js       reglas del juego: apertura, XP, medallas, repaso espaciado
    render.js       bloques de teoría y los 7 tipos de ejercicio
    screens.js      mapa de unidades y reproductor de lecciones
    paneles.js      fórmulas, progreso y el profe con IA
    app.js          arranque y atajos de teclado
  content/
    u0.js … u8.js   una unidad por archivo
    curso.js        metadatos de la materia
vendor/             KaTeX (js, css y fuentes woff2)
tools/
  build.mjs         ensambla dist/index.html
  validar.mjs       revisa el contenido antes de publicar
```

## Comandos

```sh
node tools/build.mjs      # genera dist/index.html
node tools/validar.mjs    # valida el contenido del curso
```

El validador chequea ids repetidos, índices de respuesta fuera de rango, huecos que
no coinciden con el template, bloques de teoría mal formados y signos `$` sin cerrar.
Conviene correrlo después de tocar cualquier archivo de `src/content/`.

## Agregar contenido

Cada unidad exporta un objeto con sus lecciones. Un ejercicio es un objeto chico:

```js
{ t: 'mc', p: '¿Cuánto vale $\\mathcal{L}\\{1\\}$?',
  o: ['$\\frac{1}{s}$', '$s$', '$1$'], r: 0,
  x: 'Sale de la definición, con la condición $s>0$.' }
```

Tipos disponibles: `mc` (una correcta), `multi` (varias), `vf` (verdadero o falso),
`in` (escribir), `ord` (ordenar pasos), `par` (emparejar) y `hue` (completar huecos).
La matemática se escribe entre `$…$` y se tipografía con KaTeX.

## Modo exploración

Viene activado: todas las lecciones están abiertas desde el arranque, así se puede
hojear la materia entera y leer cualquier teoría sin tener que ir en orden. Se apaga
con el interruptor de la pantalla **Progreso** y ahí las lecciones vuelven a abrirse
de a una, a medida que se termina la anterior.

La preferencia se guarda con el resto del progreso. Al fundir dos estados no se
"maximiza" como los contadores: gana la del estado más reciente, porque es una
elección del alumno y no un avance.

## Progreso

Se guarda siempre en `localStorage` y, cuando el visor lo permite, además en el
almacén `db` del Artifact, así la racha y las lecciones hechas se ven igual en el
celular y en la computadora. Al fundir los dos estados gana siempre el valor más
alto de cada cosa, para no perder avance nunca.
