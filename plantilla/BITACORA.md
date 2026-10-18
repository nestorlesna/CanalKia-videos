# Bitácora de producción — canal de Kia

Problemas encontrados al generar videos, cómo se resolvieron y qué conviene hacer la próxima vez.
**Leer antes de arrancar un video nuevo y sumar una fila cada vez que algo falle o se mejore.**
Las bitácoras de `..\VideosCripto\plantilla\BITACORA.md` y `..\VidesoEjercicios\plantilla\BITACORA.md` siguen valiendo
para la mecánica común (heredoc, `contentHash`, `until: "end"`, `npx --prefer-offline`, `ECOMPROMISED`, navegador).

## Flujo que funciona

1. `node plantilla/make-video.mjs <slug> --info` → fila de `guiones/guiones.csv`.
2. Si hacen falta poses nuevas de Kia: sumarlas a `KIA_POSES` en `plantilla/kia.mjs` y mirar `node plantilla/pose-lab.mjs POSE,POSE`.
3. Escribir `guiones/<slug>.json` (con un script o la herramienta de escritura, no heredocs largos).
4. `make-video <slug>` → mirar `videos/<slug>/16x9/snapshots/contact-sheet.jpg` y `videos/<slug>/9x16/…` y los `⚠`.
5. `--render` en segundo plano (máx. 2–3 navegadores a la vez).

## Decisiones de la Fase 0 (2026-10-18)

- Tipografía: **Fredoka** (700 títulos, 600 subtítulos, 500 cuerpo). Comparada con Baloo 2 al lado del banner
  (`videos/_kit/tipografia/`): Fredoka es la del banner (la "a" de una panza, remates redondos).
- Colores sampleados de los PNG con PIL (ver `identidad/kia.css`): fondo `#FFCF4D`, crema `#FFE7A3`, piso `#F2B93B`,
  pelaje `#D9965B`, panza `#EDBE8C`, contorno `#2B1D14`, pelota `#2E7DD1`, huellas `#B59139`.
- Checkpoint 5.7 (elección del usuario, 2026-10-18):
  - Voz: **Daniela es_AR, pitch 1,14 · speed 1,12** (muestra 6 de `videos/_voz/`). Se probaron voces de varón de Piper
    (es_MX ald/claude, es_ES davefx/carlfm, Daniela con tono bajado): descartadas, no suenan bien y no hay varón es_AR.
  - Pronunciación: siempre la versión **ajustada** de `pronunciacion.json` (buldog, rotváiler, pitbul, Kía, shorts, frenchi).
  - Poses de Kia y kit de escenas (16:9 y 9:16): aprobados sin cambios.
  - Música: las tres aprobadas (ukelele, pizzicato, glockenspiel); default `ukelele.wav`, volumen 0,15.

## Problemas y soluciones

| Fecha | Video | Problema | Solución / regla |
|---|---|---|---|
| 10-18 | (sfx) | La librería que trae la skill `media-use` es licencia Pixabay (no CC0 ni CC BY) | SFX desde Openverse con `license=cc0` (Freesound), recortados con ffmpeg, registrados en `CREDITOS.md` |
| 10-18 | (música) | `generar-musica.py` cortaba con `UnicodeEncodeError` al imprimir "✓" en la consola de Windows (cp1252) | prints sin caracteres especiales (o `PYTHONIOENCODING=utf-8`) |
| 10-18 | (kia) | Primer dibujo: el hocico de frente salía al doble de ancho que en el logo (mezclé px del logo con unidades del rig) | rig = px del logo ÷ 2 con el centro de la cabeza en el origen; hocico ±72, cabeza ±101 (70 %, como el logo) |
| 10-18 | (kia) | La pata del saludo quedaba tapada por la cabeza | las patas delanteras se dibujan después de la cabeza; levantada en (148, −178), al costado de la cara |
| 10-18 | (kia) | De perfil parecía un corgi (cuerpo largo, patas finitas) | cuerpo compacto (±118), patas de 40–44 de grosor y 64 de largo, mancha clara en el pecho |
| 10-18 | (humanos) | Con escala 1,35 en 9:16 se veía todo el torso del humano y el brazo llegaba al piso | humanos más altos (la cabeza siempre fuera de cuadro), torso ancho (190–240), brazo = torso + 40 |
| 10-18 | (kit) | `hyperframes snapshot` parte la hoja en `contact-sheet-1..N.jpg` | `contactSheet()` arma una sola `snapshots/contact-sheet.jpg` con ffmpeg (tile 4 col. en 16:9, 6 en 9:16) |
| 10-18 | (kit) | Cartel ancho en 9:16 ("¿BULLDOG FRANCÉS?"): el ajuste en el navegador corre antes de que carguen las fuentes y el check marca `container_overflow` | el builder estima el tamaño de letra (Fredoka 700 ≈ 0,64 em por carácter) y lo pone inline; el ajuste del navegador queda de respaldo y achica `font-size`, no `transform` |
| 10-18 | (kit) | Check: los círculos del fondo salen del cuadro (`panel_out_of_canvas`) | son decorado intencional: `data-layout-allow-overflow` |
| 10-18 | (check) | Avisos `nested_structure_needs_subcomposition` / `timeline_track_too_dense` en todas las escenas | son de estilo (recomiendan sub-composiciones); los hermanos los tienen igual. No bloquean el check |
| 10-18 | presentacion-kia | Faltaba `identidad/kia.frame.md`: make-video lo copia a cada formato y cortaba antes del build | escrito `kia.frame.md` (tokens, tipografía, layout de los dos formatos, do/don't) |
| 10-18 | presentacion-kia | La voz de Kia (pitch 1,14 · speed 1,12) es rápida: ~20 caracteres/s, el 16:9 dio 70 s (no 80–100) | primera pasada con `--no-check --no-snapshot`, leer `audio_engine_meta.json` y recién ahí fijar los `at` de Kia |
| 10-18 | presentacion-kia | Globo "¡GUAU!" con `pos` fijo salió cortado contra el borde | efectos y globos se mueven con Kia (`kfx` sigue su x): `pos` = posición final − desplazamiento de Kia |
| 10-18 | presentacion-kia | Zzz de la escena 15 subían hasta el cartel (`content_overlap` en el check) | cartel con `out` antes de que arranquen los Zzz |
| 10-18 | presentacion-kia | Cierre en 9:16: el botón SUSCRIBITE quedaba chiquito y a los pies de Kia | override 9:16: Kia `x −150, sc 0.95`, botón `[130, −90]` tamaño 330, campana arriba del botón |
| 10-18 | presentacion-kia | Mamá en 9:16 se salía del margen izquierdo | humanos en 9:16 con x entre −220 y 220 |
| 10-18 | presentacion-kia | Numeración del ranking: el Short saltea escenas y los números quedaban 1, 3, 4… | `numero` con override `"9x16": { "numero": n }` según las escenas del Short |
| 10-18 | presentacion-kia | "Aro sobre la panza" no tenía ícono | ícono `aro` (elipse punteada blanca/rosa con brillos) en `iconos.mjs` |
| 10-18 | presentacion-kia | Avisos `content_overlap` de las letras Z entre sí (nivel info) | intencional (los Zzz se cruzan al subir): ignorar |
| 10-18 | presentacion-kia | Objetos con `cue` (sin `at`) se veían desde el principio de la escena (el aro antes de que Kia se dé vuelta, la sombra antes de "rottweiler") | builder: un prop está oculto hasta su entrada si tiene `at` **o** `cue` |
| 10-18 | presentacion-kia | Objetos SVG con pop/loop (`transformOrigin` 50% 50%) quedaban corridos hacia arriba a la izquierda ~0,6 × su medio tamaño (el aro fuera de la panza) | GSAP `smoothOrigin` compensaba el cambio de origen medido con la escena oculta: `runtime.js` pone `smoothOrigin: false`. Ahora `pos` es exacto (las fichas ajustadas a ojo antes de este arreglo pueden moverse) |

## Pendientes / ideas

- Videos reales (`tipo: real | mixto`): formato previsto en `plantilla/README.md` (sección "Próximamente").
