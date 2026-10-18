# CANAL_KIA — prompt inicial para armar el proyecto del canal de Kia

> **Cómo usarlo:** abrí Claude Code (u otra herramienta) **en la carpeta `C:\DATOS\DESARROLLOS\Hyperframes\VideosKia`**,
> poné este archivo ahí (o dejalo donde esté) y pegá:
>
> ```
> Leé CANAL_KIA.md y seguilo al pie de la letra. Arrancá por la Fase 0.
> ```
>
> Todo lo que sigue está escrito para el agente.

---

## 0. Qué te piden (resumen para el agente)

Vas a armar desde cero el proyecto de videos de un canal de YouTube de **Kia, una perra bulldog francés**, que hacen un
papá y su hijo. Al terminar tiene que haber:

1. Un **pipeline reutilizable** (una ficha JSON por video → un comando → video + miniatura + texto para YouTube),
   copiando y adaptando lo que ya funciona en los proyectos hermanos (ver punto 2).
2. Un **personaje animado de Kia** (SVG plano, igual al logo) con un set de poses/animaciones.
3. **`GENERAR_VIDEOS.md`** en la raíz: instructivo autosuficiente para que cualquier herramienta/modelo genere videos
   nuevos (mismo espíritu que `..\VidesoEjercicios\GENERAR_VIDEOS.md`: leelo entero antes de escribir el tuyo).
4. **`CHECKLIST.md`** autogenerado con el estado de cada video, más `plantilla/README.md` y `plantilla/BITACORA.md`.
5. El **primer video: la presentación del canal**, en dos formatos: **16:9 (tráiler del canal)** y **9:16 (Short)**,
   basado en el texto de `Presentacion/Presentacion.txt`.

No hace falta entrevistar al usuario con el flujo de "intent" de HyperFrames: las decisiones ya están tomadas (punto 3).
Preguntá solo dudas reales. Respondé siempre en **español rioplatense con voseo**, corto y concreto.

---

## 1. Lo que ya hay en `VideosKia/` (no lo borres ni lo muevas)

```
VideosKia/
  LogoBanner/Logo (800×800)@1x.png / @2x.png        logo: cara de Kia sobre círculo, fondo amarillo, "KIA"
  LogoBanner/Banner (2560×1440)@1x.png / @2x.png    banner: Kia de frente sentada, "KIA / La humana de cuatro patitas /
                                                    Videos reales y animados · Dormir es mi deporte", huellas, Zzz..., pelota azul
  Presentacion/Presentacion.txt                     texto de presentación (guion del primer video)
```

**Mirá las dos imágenes antes de diseñar nada.** El logo y el banner SON la identidad visual: el personaje, la paleta y
la tipografía del video tienen que parecer salidos del mismo lugar.

---

## 2. Proyectos hermanos de donde copiar (solo lectura: no los modifiques)

| Proyecto | Qué tomar |
|---|---|
| `..\VideosCripto\` | **Base principal.** `plantilla/make-video.mjs` (pipeline: voz → index.html → check → snapshots → miniatura → render → CHECKLIST + youtube.txt), `build-index.mjs`, `runtime.js`, `styles.css`, sistema de `identidad/` (css + frame.md + `activa.txt`), `iconos.mjs`, `kit-demo.json` (`--kit`), `pronunciacion.json` + `--pronunciacion`, `piper-tts.py`, `voces-piper/`, README y BITACORA. Lista maestra `temas/temas.csv` + fichas `temas/<slug>.json`. |
| `..\VidesoEjercicios\` | **El personaje con poses**: `plantilla/runtime.js` (rig SVG con poses por ángulos, `cut`/`to`/`seq`/`loop`, `until: "end"`), `pose-lab.mjs` (contact sheet de poses para iterar rápido), miniatura con el personaje agrandado, `--prefijo`, y el instructivo `GENERAR_VIDEOS.md` como modelo de estructura. |

Leé, en este orden: `..\VideosCripto\plantilla\README.md` → `..\VideosCripto\plantilla\BITACORA.md` →
`..\VidesoEjercicios\GENERAR_VIDEOS.md` → `..\VidesoEjercicios\plantilla\BITACORA.md`.
**No copies contenido de esos canales** (CrossFit, cripto, sus deslindes, su música si no encaja): copiá la mecánica.

---

## 3. Decisiones ya tomadas (no las vuelvas a preguntar)

| Tema | Decisión |
|---|---|
| Idioma | Español **rioplatense con voseo** en voz, subtítulos, textos en pantalla y YouTube. |
| Narradora | **Kia habla en primera persona** (como en el texto de presentación). Tono: tierno, canchero, humor de que se cree humana / rottweiler. |
| Voz | **Piper + Daniela es_AR** (local, gratis), **un poco más aguda y un poco más rápida** para que suene a personaje (ver 5.3). No propongas voces pagas ni de la nube. |
| Formatos | Cada video puede salir en **16:9 (1920×1080)** y/o **9:16 (1080×1920, Short)** desde la **misma ficha**. La presentación sale en los dos. |
| Material | La presentación es **100 % animada** (sin fotos ni videos reales). El pipeline debe quedar preparado para videos reales más adelante (punto 9), pero no lo construyas completo ahora. |
| Estilo | **Flat / vector, contorno marrón oscuro grueso, esquinas redondeadas**, como el logo y el banner. Fondo amarillo con círculos crema, piso ocre, huellas, pelota azul, "Zzz...". |
| Motor | **HyperFrames** fijado a la misma versión que los hermanos (`hyperframes@0.8.150`, llamado con `npx --prefer-offline`). Todo local y gratis, sin login de HeyGen. |
| Git | Hacé `git init` y un `.gitignore` como el de los hermanos (sin `*.mp4`, sin `voces-piper/*.onnx`, sin `.claude/skills`, sin carpetas generadas de `videos/`). **No hagas commit ni push salvo que el usuario lo pida.** |

---

## 4. Reglas fijas (no negociables)

1. **Privacidad de la familia** (canal hecho con un menor): nunca nombres reales del hermano, papá ni mamá (se dicen
   "mi hermano", "papá", "mamá"); nada de colegio identificable (nombre, escudo, uniforme), dirección, calle, barrio,
   patentes ni caras reconocibles. Los humanos animados son **genéricos y planos** (siluetas simpáticas, sin parecido real).
2. Contenido apto para toda la familia: nada de peligro para perros (no mostrar a Kia comiendo chocolate, uvas, cebolla,
   huesos cocidos, etc.). Si el guion lo roza ("me como lo que se cae"), lo que cae es **comida segura** (zanahoria,
   pedacito de pollo, manzana sin semillas) y en la descripción de YouTube va una línea de aviso suave (ver 7.3).
3. Una ficha JSON por video es lo único que se escribe a mano; `videos/<slug>/index.html` y `CHECKLIST.md` se regeneran.
4. No toques `salida/subidos/` (el usuario mueve ahí lo publicado). No muevas ni renombres archivos de salida.
5. Toda ficha nueva lleva `"revisado": false`. Solo el usuario aprueba.
6. Un video **no está terminado** sin: ficha + voz + check + render (en cada formato pedido) + bloque `youtube` + miniatura.
7. Cada problema resuelto → fila en `plantilla/BITACORA.md` (`| MM-DD | slug | Problema | Solución / regla |`).
8. **No uses emojis dentro del video** (Chrome headless en Windows los dibuja mal o vacíos): las huellas 🐾, la pelota,
   el corazón, los Zzz van como **SVG propios** en `iconos.mjs`. Los emojis sí van en la descripción de YouTube.
9. Música y efectos: solo **generados localmente** o con licencia **CC0 / CC BY** registrada (archivo, autor, licencia,
   URL) en `plantilla/CREDITOS.md`; los CC BY se agregan solos al final del `youtube.txt` (como el crédito de la voz).

---

## 5. Fase 0 — Arranque (hacé todo esto antes del primer video)

### 5.1 Entorno

```bash
node -v                                   # Node 20+
python -c "import piper; print('ok')"     # si falla: python -m pip install piper-tts
ffmpeg -version && ffprobe -version
```

- Copiá `..\VideosCripto\plantilla\voces-piper\` (modelo `es_AR-daniela-high.onnx` + `.onnx.json`). Si no está, bajalo de
  `https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx` (y `.onnx.json`).
- Copiá `skills-lock.json` de un hermano y corré `npx skills add heygen-com/hyperframes` (o copiá `.claude/skills/`).
- La primera llamada a `npx hyperframes` descarga paquetes: hacela **sola**, no en paralelo (si no: `npm ECOMPROMISED`).

### 5.2 Estructura del proyecto

```
VideosKia/
  CANAL_KIA.md                este archivo
  GENERAR_VIDEOS.md           instructivo para generar videos nuevos (lo escribís vos, punto 8)
  CHECKLIST.md                estado de todos los videos (autogenerado, no editar a mano)
  LogoBanner/  Presentacion/  (ya existen)
  guiones/guiones.csv         lista maestra (";", UTF-8 con BOM): clave;titulo;tipo;formatos;descripcion;estado
  guiones/<slug>.json         ficha de cada video
  material/<slug>/            (futuro) fotos y clips reales de Kia — vacío por ahora
  plantilla/
    README.md                 especificación completa de la ficha, kinds, poses de Kia, comandos
    BITACORA.md               problemas y soluciones
    CREDITOS.md               voz, música y efectos con su licencia
    make-video.mjs            pipeline (adaptado de VideosCripto)
    build-index.mjs  runtime.js  styles.css  iconos.mjs
    kia.mjs                   personaje de Kia (rig SVG + poses + animaciones) — ver 5.4
    pose-lab.mjs              contact sheet de poses de Kia (adaptado de VidesoEjercicios)
    identidad/kia.css + kia.frame.md + activa.txt
    piper-tts.py  voces-piper/  pronunciacion.json
    musica/  sfx/
    youtube-cierre.txt        bloque fijo del final de cada descripción (7.3)
  videos/<slug>/              proyectos HyperFrames generados
  salida/<slug>.16x9.mp4  salida/<slug>.short.mp4
  salida/<slug>.miniatura.png (1280×720)  salida/<slug>.short.miniatura.png (1080×1920)
  salida/<slug>.youtube.txt   salida/subidos/
```

Comandos que tiene que tener `make-video.mjs` (mismos nombres y flags que VideosCripto, más el formato):

| Comando | Qué hace |
|---|---|
| `node plantilla/make-video.mjs <slug> --info` | fila del CSV |
| `node plantilla/make-video.mjs <slug> [--formato=16x9\|9x16\|todos]` | voz → index.html por formato → check → snapshots → miniaturas. Default: los `formatos` de la ficha |
| `… <slug> --render [--formato=…] [--prefijo=XX]` | lo anterior + render a `salida/` |
| `… <slug> --miniatura` | solo miniaturas |
| `… --checklist` | regenera `CHECKLIST.md` y todos los `salida/*.youtube.txt` |
| `… --kit` / `… --iconos` / `… --pronunciacion [palabra]` / `… --voz-muestras` | hojas de prueba (ver 5.3–5.5) |
| `node plantilla/pose-lab.mjs [POSE,POSE]` | contact sheet de poses/animaciones de Kia |

Flags: `--force-tts`, `--no-check`, `--no-snapshot`. La voz se genera **una sola vez por ficha** y se comparte entre formatos.

### 5.3 Voz de Kia (más aguda y más rápida)

Piper no tiene "pitch": agregá a `piper-tts.py` un post-proceso con ffmpeg que suba el tono sin cambiar la velocidad,
y la velocidad por `length_scale`:

```
ffmpeg -i in.wav -af "asetrate=22050*P,aresample=22050,atempo=1/P" out.wav     # P = factor de tono
```

Parámetros en la ficha: `"voice": { "pitch": P, "speed": S }`, con default global en `plantilla/` (no hardcodear).
Hacé `--voz-muestras`: genera en `videos/_voz/` la frase *"¡Hola! Soy Kia. Mi hermano dice que soy una perra bulldog
francés, pero yo no lo entiendo."* con **P ∈ {1.06, 1.10, 1.14} × S ∈ {1.05, 1.12}** (6 wav, nombre = valores) + `todas.wav`
con un pip entre cada una. **El usuario elige de oído** (checkpoint, 5.7). Ojo: el meta de duración se mide **después** del
post-proceso. El crédito CC BY-SA de Daniela va solo en el `youtube.txt` (igual que en los hermanos).

`pronunciacion.json` (solo afecta la voz): probá al menos `bulldog` → "buldog", `rottweiler` → "rotváiler",
`pitbull` → "pitbul", `Kia`, `Shorts` → "shorts". Generá las muestras "tal cual / ajustada" para que el usuario elija.

### 5.4 El personaje: Kia animada (lo más importante)

Construí a Kia en SVG en `plantilla/kia.mjs`, **calcada del logo y del banner** (sampleá los colores exactos de los PNG
con Python/PIL; aproximados: pelaje `#D9965A`, panza `#EDC293`, máscara/orejas `#3A2A23`, interior oreja `#7A4F48`,
hocico `#352B28`, contorno `#2A1D17`, cachetes `#E38B6A`, lengua `#E8708A`, fondo `#FFCE4E`, círculo crema `#FFE49B`,
piso `#F2B83B`, pelota `#2F80D6`). Rasgos que no pueden faltar: **orejas de murciélago paradas**, máscara oscura en los
ojos, arruga de la frente, hocico oscuro con lengüita, **panza redonda clara**, patitas cortas.

- **Dos vistas**: **frente** (sentada, como el banner: la principal) y **perfil** mirando a la derecha (para caminar,
  correr, perseguir). Espejado con `fx -1` como en VidesoEjercicios.
- **Rig por partes** (cabeza, orejas ×2, ojos/párpados, boca, cola, cuerpo, patas ×4) con parámetros animables, igual
  que el atleta de VidesoEjercicios: poses = diccionario de valores; moves `cut` / `to` / `seq` / `loop` / `until: "end"`.
- **Animaciones "vivas" siempre activas** (deterministas, sin `Math.random` ni tiempo real — ver hyperframes-core):
  respiración (la panza sube y baja), parpadeo cada ~3 s, movimiento de orejas ocasional.
- **Set mínimo de poses/animaciones** (cada una en el pose-lab):

| Clave | Qué es |
|---|---|
| `SENTADA` | de frente, como el banner (pose base) |
| `SALUDO` | sentada, levanta una pata + cabeza ladeada |
| `CONFUNDIDA` | cabeza ladeada, una oreja caída, signo "?" |
| `PANZA` | patas arriba mostrando la panza (para "vuelve loco a todo el mundo") |
| `DORMIDA` | hecha bollito, ojos cerrados, Zzz que suben, respiración lenta |
| `DORMIDA_PANZA_ARRIBA` | variante cómica para el chiste repetido de "dormir" |
| `CAMINA` (perfil, loop) | paseo con correa (la correa sale de cuadro o la sostiene un humano genérico) |
| `CORRE` (perfil, loop) | "como una flecha", con líneas de velocidad |
| `LADRA` | de frente o perfil, boca abierta, globo "¡GUAU!" (SVG, no emoji) |
| `RUDA` | se cree rottweiler: ceño fruncido, pecho inflado; su **sombra en la pared es de un perro enorme** |
| `COME` | atrapa en el aire algo que cae |
| `PELOTA` | perfil, persigue/trae la pelota azul |
| `MIRA` | sentada mirando al costado sin entender nada (con globo de "?" o símbolos de compu) |

- Humanos de apoyo (`plantilla/humanos.mjs` o dentro de kia.mjs): **hermano** (chico con mochila), **papá**, **mamá**:
  planos, sin rasgos, se ven de la cintura para abajo o en silueta. Regla 4.1.
- `pose-lab.mjs` genera `videos/_poselab/snapshots/contact-sheet.jpg` (una celda por pose). Iterá hasta que se vea como
  el logo. Si la hoja sale vacía: error de JS en `kia.mjs` o pose inválida.

### 5.5 Identidad visual (`identidad/kia.css` + `kia.frame.md`)

- Tipografía redondeada y gorda como el banner (probá **Fredoka** o **Baloo 2** de Google Fonts en el kit y elegí la más
  parecida al "KIA" del logo); cuerpo de texto con la misma familia en peso medio.
- Subtítulos grandes, blanco con contorno marrón oscuro o caja crema; máx. **3 líneas** por escena.
- Barra superior chica con el logo redondo + "KIA". Barra de progreso en ocre.
- Decorado: círculos crema, huellas, piso ocre (`--floor`). Íconos SVG en `iconos.mjs`: huella, pelota, hueso, corazón,
  Zzz, globo "¡GUAU!", "?", flecha de velocidad, mochila, cuchara/olla, botón "SUSCRIBITE", campanita.
- `--kit` debe mostrar todos los `kind` en **los dos formatos** (16:9 y 9:16).

**Zonas seguras** (aprendidas en los otros canales + UI de YouTube):
- 9:16: subtítulo desde y≈1600; ningún texto entre el área visual y el subtítulo; **nada importante en los 140 px de la
  derecha ni en los ~380 px de abajo por debajo del subtítulo** (botones y título de Shorts). Margen lateral ≥ 60 px.
- 16:9: subtítulo en la franja inferior (y ≥ 900), nada importante a menos de 60 px de los bordes.
- El `hyperframes check` marca texto cortado/superpuesto: corregí en la ficha, no a mano en el html.

### 5.6 Música y efectos

- Música: cama alegre y suave (ukelele / pizzicato / glockenspiel, ~100 BPM, sin voces), **generada localmente** como
  `bgm-base.wav` de VidesoEjercicios (MusicGen local) o resuelta con la skill `media-use` solo si la licencia es CC0/CC BY.
  Volumen bajo (~0.15), fade in/out, **ducking** bajo la voz (skill `hyperframes-audio`). Generá 2–3 opciones en
  `plantilla/musica/` para que el usuario elija.
- SFX (`plantilla/sfx/`): ladrido corto, ronquido suave, "boing" de pelota, "whoosh" de flecha, pop. CC0 (Openverse vía
  `media-use --type sfx`) y registrados en `CREDITOS.md`. Los ladridos, a volumen moderado (gente con auriculares).

### 5.7 Checkpoint con el usuario (frená acá)

Antes de escribir la ficha de la presentación mostrale al usuario y esperá su OK:
1. `videos/_poselab/snapshots/contact-sheet.jpg` (Kia en todas las poses) — ¿se parece al logo?
2. `videos/_kit/snapshots/` en 16:9 y 9:16.
3. `videos/_voz/todas.wav` → que elija pitch/velocidad; y las muestras de pronunciación.
4. Las opciones de música.

Anotá lo elegido en `plantilla/BITACORA.md` y como default en `plantilla/`.

---

## 6. Fase 1 — Video 1: presentación del canal (`presentacion-kia`)

- `guiones/guiones.csv`, primera fila: `presentacion-kia;¡Hola! Soy Kia;animado;16x9,9x16;Presentación del canal;guion listo`.
- La voz dice el texto de `Presentacion/Presentacion.txt` **casi literal** (es el texto del canal: no lo reescribas;
  solo partilo en escenas de ≤ ~120 caracteres y sacá los emojis de la voz).
- **Chiste central:** "Dormir" aparece 4 veces + el remate final. Cada "Dormir" es una escena **corta (~1,6–2 s)** con
  la tarjeta "🐾 DORMIR" (huella SVG) y Kia durmiendo **cada vez en una postura más ridícula**, con ronquido. Que el
  ritmo haga el chiste: las escenas largas y la de dormir se alternan.
- La lista de hobbies se va armando como un **ranking numerado en pantalla** ("EN ORDEN DE IMPORTANCIA").

Guion por escenas (punto de partida; ajustá tiempos en el contact sheet):

| # | Voz (Kia) | En pantalla / animación | Short |
|---|---|---|---|
| 1 | "¡Hola! Soy Kia." | Kia entra de un salto, `SALUDO`; título "KIA" grande (como el banner) | sí |
| 2 | "Mi hermano dice que soy una perra bulldog francés, pero yo no lo entiendo." | `CONFUNDIDA`, cartel "¿BULLDOG FRANCÉS?" | sí |
| 3 | "Soy una humana de cuatro patitas, con una panza redondita que vuelve loco a todo el mundo." | `PANZA`, aro sobre la panza, corazones que salen | sí |
| 4 | "Mis hobbies, en orden de importancia:" | tarjeta de ranking vacía | sí |
| 5 | "Dormir." | `DORMIDA` + "1 · DORMIR" | sí |
| 6 | "Acompañar a mi hermano al colegio todas las mañanas," | `CAMINA` con chico de mochila (genérico), piso que se desplaza | no |
| 7 | "y después sacar a pasear a su papá, que necesita caminar." | `CAMINA` tirando de la correa, papá genérico jadeando | no |
| 8 | "Dormir." | `DORMIDA_PANZA_ARRIBA` | sí |
| 9 | "Salir disparada como una flecha cuando escucho a alguien en el pasillo, ladrando como si me lo fuera a comer." | `CORRE` + líneas de velocidad → `LADRA` "¡GUAU!" a una puerta | sí |
| 10 | "Entre nosotros: no creo ser bulldog francés. Para mí soy rottweiler. O pitbull." | `RUDA`, sombra gigante en la pared; cartel "ROTTWEILER (?)" | sí |
| 11 | "Dormir." | dormida en otra postura | no |
| 12 | "Comerme todo lo que a mamá se le cae cuando cocina." | `COME`: cae una zanahoria / pedacito de pollo, la atrapa | sí |
| 13 | "Dormir." | dormida en otra postura | no |
| 14 | "Perseguir a cualquier humano de la casa hasta que me tire la pelota." | `PELOTA`, pelota azul que rebota | sí |
| 15 | "Ah… creo que me olvidé de poner dormir." | se duerme de golpe en el medio de la frase; Zzz | sí |
| 16 | "Acá van a ver videos míos de verdad y otros animados." | marco de "foto" vacío/estilizado + Kia animada (sin fotos reales) | no |
| 17 | "Mi hermano es el que sabe de tecnología; yo solo lo miro cuando juega y no entiendo nada de lo que dice." | `MIRA` junto a una pantalla con símbolos raros; globos "?" | no |
| 18 | "Si tarda en subir videos, ya saben a quién reclamarle." | Kia señala con el hocico hacia un costado (al hermano, fuera de cuadro) | sí |
| 19 | "¡Suscribite, que ladrar es gratis!" | botón "SUSCRIBITE" que Kia aprieta con la pata + campanita + ladrido | sí |

- Cada escena tiene `"short": true|false`: el 16:9 usa todas (≈ 80–100 s); el 9:16 **solo las marcadas** (objetivo
  **≤ 60 s**). Agregá ese campo al builder (y documentalo en el README) para que sirva en todos los videos.
- Escena 15: la voz puede ir con `voSpeed` un poco más lento y bostezo al final (SFX).
- Miniaturas: 16:9 1280×720 con Kia `SALUDO` grande + "¡HOLA! SOY KIA"; Short 1080×1920 igual al hook sin subtítulo.
- Hacé `make-video` sin render, revisá los contact sheets de **los dos formatos**, corregí, y después `--render` en
  segundo plano (máx. 2–3 procesos de navegador a la vez: más, falla con `Browser process did not exit`).

---

## 7. Bloque `youtube` (obligatorio en cada ficha)

Uno por formato: `"youtube": { "16x9": {titulo, descripcion, tags}, "9x16": {titulo, descripcion, tags} }`.
`salida/<slug>.youtube.txt` lleva las dos secciones separadas.

### 7.1 Título
- 16:9: ≤ 100 caracteres, ideal ~55. Ej.: `¡Hola! Soy Kia 🐶 la bulldog francés que se cree humana (y rottweiler)`.
- Short: corto + `#Shorts`. Ej.: `Soy Kia y mi hobby favorito es… 😴 #Shorts`.

### 7.2 Descripción (rioplatense, voz de Kia, con emojis, **sin `<` ni `>`**)

```
🐶 <gancho en una línea, en primera persona de Kia>

<2–4 líneas de lo que pasa en el video, con humor>

🐾 <bloque propio del video: para la presentación, la lista de hobbies del texto original con 🐾>

<línea de aviso si corresponde (7.3)>

<contenido de plantilla/youtube-cierre.txt TAL CUAL>

#Kia #BulldogFrances #Frenchie #<tema> #Perros
```

### 7.3 Textos fijos
- `plantilla/youtube-cierre.txt`: "¡Suscribite, que ladrar es gratis! 🐶" + "Acá hay videos míos de verdad y otros
  animados. Si mi hermano tarda en subirlos, ya saben a quién reclamarle." (el usuario puede editarlo).
- Si aparece comida: "🥕 Ojo: no todo lo que comen los humanos es sano para los perros. Si dudás, preguntale a tu veterinario."
- Los créditos (voz Daniela CC BY-SA, música/SFX CC BY) los agrega el script solo, antes de los hashtags.
- Tags: 10–15 (kia, bulldog francés, french bulldog, frenchie, perro gracioso, perros graciosos, mascotas, perra que se
  cree humana, videos de perros, animación de perro, …) ≤ 500 caracteres.
- En el `youtube.txt` agregá una línea de recordatorio para el usuario: `AUDIENCIA: elegir en YouTube Studio si es "hecho
  para niños"` (no lo decidas vos).

---

## 8. `GENERAR_VIDEOS.md` (escribilo al final de la Fase 1, con lo aprendido)

Misma estructura que `..\VidesoEjercicios\GENERAR_VIDEOS.md`, adaptada a Kia:
- Prompts de ejemplo para el usuario (Claude Code, opencode, Codex, Cursor) con parámetros:
  `CANTIDAD`, `VIDEOS` (claves o números del CHECKLIST), `IDEA` (texto libre del usuario/hijo → el agente arma la ficha y
  agrega la fila al CSV), `FORMATOS` (default de la ficha), `PREFIJO` (opcional; si no lo dicen, **sin prefijo**),
  `SOLO_FICHAS`.
- Contexto mínimo, reglas fijas (punto 4), verificar entorno, elegir videos, procedimiento por video (pensar → poses en
  pose-lab si hacen falta nuevas → ficha → make-video → revisar contact sheets 16:9 y 9:16 → render), cómo escribir la
  ficha (esqueleto completo + kinds + poses de Kia + overlays + zonas seguras + `short`), pronunciación, bloque youtube,
  miniaturas, tabla de errores conocidos (de las dos BITÁCORAS + la nueva), paralelismo/tiempos, reporte final.
- Sección "Si la herramienta no puede ver imágenes": usar solo poses y kinds ya probados y avisarlo en el reporte.

Además, cargá en `guiones/guiones.csv` **10–12 ideas propuestas** (estado `propuesto`) sacadas de la personalidad de Kia,
para que el usuario y su hijo elijan. Ejemplos: ranking de lugares para dormir, "soy rottweiler" (el pasillo), lo que se
le cae a mamá, la pelota infinita, el paseo al colegio, un día en mi vida (90 % dormir), mi panza, "cosas que no entiendo
de mi hermano", Kia reacciona al timbre. Marcá cuáles sirven como Short.

---

## 9. Preparado para videos reales (solo dejar la base, no construir todo)

- `material/<slug>/` para clips y fotos del celular. Ficha con `"tipo": "real"` o `"mixto"`: escenas con
  `{ "clip": "material/<slug>/x.mp4", "desde": s, "hasta": s }` o `{ "foto": … }` + voz de Kia + subtítulos + stickers SVG.
- Recorte automático a 9:16 / 16:9 (cover + punto de interés en la ficha) y volumen del audio original bajo la voz.
- Regla de privacidad 4.1 también para el material real (revisar caras, uniformes, carteles, patentes) y **preguntar al
  usuario** antes de publicar algo dudoso.
- Documentalo en README como "próximamente" con el formato previsto.

---

## 10. Checklist de entrega (verificalo antes de avisar que terminaste)

- [ ] Entorno OK (node, piper, ffmpeg, voz Daniela, skills de HyperFrames, versión fijada).
- [ ] Estructura del punto 5.2 creada; `git init` + `.gitignore` (sin commit).
- [ ] `kia.mjs` + `pose-lab` con todas las poses de 5.4; contact sheet aprobado por el usuario.
- [ ] Identidad `kia` + `iconos.mjs` + `--kit` en 16:9 y 9:16 sin errores del check.
- [ ] Voz elegida (pitch/velocidad) y pronunciaciones aprobadas; música elegida; SFX con licencia en `CREDITOS.md`.
- [ ] `guiones/guiones.csv` con la presentación + 10–12 ideas propuestas.
- [ ] `guiones/presentacion-kia.json` con `revisado: false`, `youtube` (2 formatos) y miniaturas.
- [ ] `salida/presentacion-kia.16x9.mp4` y `salida/presentacion-kia.short.mp4` (≤ 60 s) renderizados.
- [ ] `salida/presentacion-kia.miniatura.png`, `.short.miniatura.png` y `.youtube.txt`.
- [ ] `CHECKLIST.md` regenerado con la presentación en ✅ (columnas por formato) y las ideas en ⬜.
- [ ] `plantilla/README.md`, `plantilla/BITACORA.md` (con todo lo resuelto) y `GENERAR_VIDEOS.md` escritos.
- [ ] Reporte final corto al usuario:

```
Canal Kia listo.
- Presentación → salida/presentacion-kia.16x9.mp4 (<dur> s) y .short.mp4 (<dur> s)
- Voz: Daniela pitch <P> speed <S> · Música: <archivo>
- Para revisar: <dudas, checks que fallaron, cosas que decidiste vos>
- Próximos sugeridos: <3 ideas del CSV>
Para generar más: "Seguí GENERAR_VIDEOS.md. CANTIDAD: 2."
```
