# plantilla/ — referencia del pipeline del canal de Kia

Un video = **una ficha** `guiones/<slug>.json` (lo único que se escribe a mano). Todo lo demás lo genera
`node plantilla/make-video.mjs`. El procedimiento paso a paso está en `GENERAR_VIDEOS.md`; acá está la especificación
exacta de cada campo. Problemas ya resueltos: `BITACORA.md`.

## Archivos

| Archivo | Qué es |
|---|---|
| `make-video.mjs` | pipeline: voz → index.html por formato → check → snapshots → miniaturas → render → CHECKLIST + youtube.txt |
| `build-index.mjs` | ficha → `index.html` de HyperFrames para UN formato (escenas, Kia, objetos, audio) |
| `runtime.js` | timeline GSAP (seek-safe) y actores en el navegador; se inyecta en cada index.html |
| `kia.mjs` | Kia en SVG: rig, poses (`KIA_POSES`), anclas. Se inyecta con `toString()`: no puede usar nada de afuera |
| `humanos.mjs` | humanos genéricos (hermano, papa, mama), de la cintura para abajo, sin cara |
| `iconos.mjs` | íconos y objetos SVG (nada de emojis dentro del video). Ver todos: `--iconos` |
| `styles.css` · `identidad/kia.css` · `identidad/kia.frame.md` | layout de los dos formatos · colores y fuentes · guía visual |
| `pose-lab.mjs` | hoja de poses de Kia |
| `kit-demo.json` | ficha de demostración de todos los kinds (`--kit`) |
| `piper-tts.py` · `voces-piper/` · `pronunciacion.json` · `defaults.json` | voz de Kia (Piper + Daniela es_AR, local) |
| `musica/` · `sfx/` · `CREDITOS.md` | música (MusicGen local) y efectos CC0, con licencias |
| `youtube-cierre.txt` | bloque fijo del final de cada descripción |

## Comandos

```bash
node plantilla/make-video.mjs <slug> --info                     # fila del CSV
node plantilla/make-video.mjs <slug> [--formato=16x9|9x16|todos] # voz + index + check + contact sheets + miniaturas
node plantilla/make-video.mjs <slug> --render [--prefijo=XX]     # lo anterior + render a salida/
node plantilla/make-video.mjs <slug> --miniatura                 # solo miniaturas
node plantilla/make-video.mjs --checklist                        # CHECKLIST.md + todos los salida/*.youtube.txt
node plantilla/make-video.mjs --kit | --iconos | --voz-muestras | --pronunciacion [palabra]
node plantilla/pose-lab.mjs [POSE,POSE] [--formato=9x16]         # videos/_poselab/snapshots/contact-sheet.jpg
```
Flags: `--force-tts` (rehace la voz), `--no-check`, `--no-snapshot`. La voz se genera **una sola vez por ficha**
(`videos/<slug>/assets/voice/`) y se copia a cada formato. Solo se regenera si cambió el texto, `voSpeed` o la voz.

Salidas: `salida/[PREF_]<slug>.16x9.mp4`, `salida/[PREF_]<slug>.short.mp4`, `salida/<slug>.miniatura.png` (1280×720),
`salida/<slug>.short.miniatura.png` (1080×1920), `salida/<slug>.youtube.txt`. Proyectos: `videos/<slug>/16x9/` y `9x16/`
(con `snapshots/contact-sheet.jpg`). Estado: `videos/<slug>/.pipeline.json`.

## La ficha

```jsonc
{
  "slug": "presentacion-kia",          // = nombre del archivo = clave del CSV
  "titulo": "¡Hola! Soy Kia",
  "tipo": "animado",                   // animado | real | mixto (real/mixto: ver "Próximamente")
  "formatos": ["16x9", "9x16"],        // o uno solo
  "musica": "ukelele.wav",             // opcional (default: defaults.json). "music": false = sin música
  "musicVolume": 0.15, "duck": 0.4,    // opcionales: volumen y cuánto baja cuando habla Kia
  "voice": { "pitch": 1.14, "speed": 1.12 }, // opcional: pisa defaults.json (no cambiar sin pedido del usuario)
  "comida": true,                      // si aparece comida → el check de YouTube exige el aviso 🥕
  "revisado": false,                   // SIEMPRE false en fichas nuevas: solo el usuario aprueba
  "notas": "",
  "frames": [ /* escenas */ ],
  "miniatura": { /* ver abajo */ },
  "youtube": { "16x9": { "titulo", "descripcion", "tags" }, "9x16": { … } }
}
```

**Overrides por formato:** cualquier objeto (la escena, `kia`, cada prop, efecto, globo, cartel, la miniatura) acepta
`"16x9": {…}` y `"9x16": {…}` que pisan sus claves en ese formato. Ej.: `"kia": { "x": 0, "9x16": { "sc": 0.85 } }`.

### Escena (`frames[]`)

| Campo | Qué hace |
|---|---|
| `id` | "01", "02"… (si falta, se numera sola). Nombra la voz y los snapshots |
| `kind` | `hook` · `escena` (default) · `ranking` · `dormir` · `cierre` |
| `vo` | lo que dice Kia (primera persona, voseo). Es también el subtítulo: **≤ ~120 caracteres (3 líneas)** |
| `sub` | subtítulo distinto de la voz (opcional) |
| `voSpeed` | multiplica la velocidad de la voz en esta escena (ej. 0.88 = más lento) |
| `min` | duración mínima (s). Duración = máx(`min`, 0,25 + voz + 0,55, última animación + 0,45) |
| `short` | `true` = va en el Short. **Si la ficha tiene los dos formatos, el 9:16 usa solo las `short: true`** (objetivo ≤ 60 s). Con un solo formato 9:16, entran todas salvo `short: false` |
| `solo` | `"9x16"` = escena solo para el Short |
| `cartel` | texto arriba: `"TEXTO"` o `{ texto, numero, icono, chico, at, cue, out }` (o una lista). Una línea, se achica sola |
| `kia` | Kia (ver abajo). `false` = sin Kia |
| `props` | objetos del escenario y humanos (ver abajo) |
| `efectos` | efectos pegados a Kia (ver abajo) |
| `globos` | globos de diálogo `{ texto, at, cue, out, pos, tam, lado, sacude }` |
| `sfx` | efectos de sonido: `"ladrido"` o `{ id, at, cue, vol }` (archivos de `sfx/`) |
| `piso` | velocidad (px/s) del piso que se desplaza (caminar/correr en el lugar): 260 caminar, 380 apurada |

Tiempos: todo `at` es en segundos **desde el comienzo de la escena**. `cue: "palabra"` (en props, efectos, globos, carteles,
sfx) ubica el momento aproximado en que Kia dice esa palabra (proporcional al largo del texto). Los moves de Kia usan
solo `at`: después de la primera generación mirá las duraciones en `videos/<slug>/audio_engine_meta.json` y ajustá.

Kinds:
- **`hook`**: `titulo: { texto, bajada, linea, mini, top }`. 16:9: texto a la derecha (Kia a la izquierda, `x ≈ -330`);
  9:16: texto centrado arriba (Kia `x 0`). `texto` gigante (~6 caracteres máx.).
- **`escena`**: lo normal: cartel opcional + Kia + objetos.
- **`ranking`**: tarjeta "EN ORDEN DE IMPORTANCIA" (`titulo` la cambia), `items: ["…" | {text, at}]` que entran de a uno,
  `vacios: N` puestos vacíos. En 16:9 poné a Kia a la derecha (`x 560`); en 9:16 abajo (`sc 0.8`).
- **`dormir`**: cartel oscuro "huella + DORMIR" con `numero`, Zzz y ronquido automáticos (`ronquido: false` lo saca).
  Pose default `DORMIDA`. Pensada para escenas cortas (`min ~1.9`).
- **`cierre`**: igual que escena (para el botón SUSCRIBITE + campanita).

### Kia (`kia`)

```jsonc
"kia": { "pose": "SENTADA", "x": 0, "y": 0, "sc": 1, "fx": 1, "set": { "lx": -1 },
         "entra": "salto", "sombra": true, "moves": [ … ] }
```
- Escenario: unidades = px a escala 1, **piso y = 0**, x = 0 centro; se escala ×1,2 en 16:9 y ×1,35 en 9:16.
  Borde visible: 16:9 `x ±750`; 9:16 `x −326…+326` (el 0 del 9:16 está corrido a la izquierda, por los botones de Shorts).
  Kia sentada mide ~400 de alto (tope de las orejas en y ≈ −400).
- `fx: -1` la espeja (mira a la izquierda). `set`: claves sueltas de la pose inicial.
- `entra`: `salto` (desde la izquierda) · `salto-der` · `pop` · `abajo` · `izq` · `der`, o `{ tipo, at, dur, dist, alto }`.
- `moves`:
  - `{ "to": "POSE", "at": 1, "dur": 0.3, "ease": "…" }` transición (si cambia la vista, se hace un corte solo)
  - `{ "cut": "POSE", "at": 1 }` corte directo
  - `{ "set": { "x": 200 }, "at": 0.6, "dur": 2.6 }` claves sueltas (mover a Kia por el escenario)
  - `{ "seq": [["A", 0.3], ["B", 0.3]], "at": 1, "until": "end" | 3.2, "count": 2 }` secuencia
  - `{ "loop": ["CAMINA_B", "CAMINA_A"], "step": 0.28, "at": 0, "until": "end" }` alternar (caminar, correr)
  - una pose puede ser un objeto `{ "base": "PELOTA", "tw": -20 }` (pose + claves sueltas)

**Poses** (`KIA_POSES` en `kia.mjs`; ver todas con `pose-lab`):

| Vista | Poses |
|---|---|
| frente (sentada, la principal) | `SENTADA` `SALUDO` `SALUDO_B` `CONFUNDIDA` `LADRA_FRENTE` `RUDA` `COME` `COME_B` `MASTICA` `MIRA` `MIRA_B` `SEÑALA` `APRIETA` `CONTENTA` `DORMIDA_SENTADA` `DORMIDA_PLOP` |
| perfil (mira a la derecha) | `PARADA` `CAMINA_A/B` `CORRE_A/B` `LADRA` `LADRA_B` `PELOTA` `DORMIDA_SPLOOT` |
| panza arriba | `PANZA` `PANZA_B` `DORMIDA_PANZA_ARRIBA` |
| bollito | `DORMIDA` |

Claves (para `set` y poses nuevas): `eo` ojos 0..1 · `lx ly` mirada −1..1 · `mo` boca 0..1 · `tg` lengua · `br` ceño ·
`bl` cachetes · `el er` orejas (grados) · `ht` cabeza ladeada · `hx hy` corrimiento de cabeza · `pl pr` levantar pata ·
`pw` giro de la pata levantada · `ch` pecho inflado · perfil: `ha` cabeza, `l1..l4` patas, `bt` cuerpo, `tw` cola ·
generales: `rot` giro, `jy` salto, `sq` aplastar · vida: `bf ba` respiración, `bk` parpadeo, `ew` orejitas.
Poses nuevas: sumarlas a `KIA_POSES` y mirarlas en `pose-lab` antes de usarlas.

### Objetos (`props`)

```jsonc
{ "tipo": "pelota", "pos": [230, -45], "size": 90, "at": 2.1, "entra": "cae", "alto": 120, "loop": "rebota",
  "mov": [{ "at": 1, "pos": [0, -45], "rot": 0, "sc": 1, "dur": 0.6, "ease": "…" }], "out": 3, "z": "atras", "flip": true, "rot": 0 }
```
- `tipo`: cualquier ícono de `iconos.mjs` (`--iconos`): `puerta` `sombra` (el rottweiler) `mesada` `pantalla` `almohadon`
  `marco` `suscribite` `campana` `pelota` `hueso` `zanahoria` `pollo` `manzana` `olla` `cuchara` `mochila` `joystick`
  `camara` `flecha` `aro` `nube` `polvo` `guau` `estrella` `corazon` `logo` `check` `cruz` …
- `pos`: centro del objeto, o centro de su base si es de piso (puerta, mesada, pantalla, sombra…). En unidades del escenario.
- `entra` (si tiene `at`/`cue`): `pop` (default) · `cae` (desde `alto`) · `izq` · `der` · `sube` · `fade` · `nada`.
- `loop`: `rebota` · `flota` · `late` · `sacude` · `gira` · `parpadea` · `gotea` · `tiembla`.
- **Humano**: `{ "tipo": "humano", "quien": "hermano" | "papa" | "mama", "pos": [x, 0], "fx": 1, "ma": 0..1 (brazo adelante),
  "camina": pasos/s, "mov": [{ "at", "pos", "dur" }] }`. Siempre de la cintura para abajo, sin cara (privacidad).
- **Correa**: `{ "tipo": "correa", "a": "hermano", "sag": 60 }` (del collar de Kia a la mano del humano).

### Efectos pegados a Kia (`efectos`)

`zzz` · `corazones` · `notas` · `velocidad` (líneas atrás de Kia) · `estrellas` · `pregunta` · `exclamacion` · `sudor`,
con `{ tipo, at, cue, out, pos, dx, dy, size, n }`. Salen de la cabeza de Kia en ese momento y **acompañan su
desplazamiento**: si Kia se mueve (`set x`), un `pos` fijo de un efecto o globo se corre igual que ella. Para globos con
`pos` en una escena donde Kia corre, restá el desplazamiento (ver BITÁCORA, escena 9 de la presentación).

### Miniatura

```jsonc
"miniatura": { "escena": "hook" | "03" | 3, "titulo": { … }, "kia": { "pose": "SALUDO", … }, "9x16": { … } }
```
Toma esa escena (default el hook), le pisa los campos que pongas, la deja quieta y saca subtítulo, barra y audio.
16:9 se exporta a 1280×720; el Short a 1080×1920.

### YouTube

Uno por formato: `"youtube": { "16x9": { titulo, descripcion, tags }, "9x16": { … } }`.
- `descripcion` termina con `{{CIERRE}}` (se reemplaza por `youtube-cierre.txt`), una línea vacía y los **hashtags como
  última línea**. El script agrega antes de los hashtags el crédito de la voz y los créditos CC BY que use la ficha.
- Validaciones (aparecen en CHECKLIST como ⚠️): título ≤ 100, Short con `#Shorts`, 10–15 tags ≤ 500 caracteres,
  sin `<` ni `>`, aviso 🥕 si `comida: true`.
- `salida/<slug>.youtube.txt` empieza con el recordatorio de AUDIENCIA ("hecho para niños"): lo decide el dueño del canal.

## Voz, música y efectos

- Voz: Piper + `es_AR-daniela-high`, **pitch 1,14 · speed 1,12** (`defaults.json`, elegida por el usuario). El pitch se
  sube con ffmpeg sin cambiar la duración. Muestras: `--voz-muestras` → `videos/_voz/`.
- `pronunciacion.json`: solo para la voz (el subtítulo muestra el texto original). Siempre la versión ajustada
  (buldog, rotváiler, pitbul, Kía, shorts, frenchi). Probar palabras nuevas con `--pronunciacion palabra`.
- Música: `musica/ukelele.wav` (default), `pizzicato.wav`, `glockenspiel.wav` (MusicGen local, ~210 s). Se recorta al
  largo del video y baja (ducking) mientras habla Kia.
- SFX (CC0): `ladrido` `ladrido-doble` `ronquido` `boing` `pop` `whoosh` `bostezo` `campanita` `mordisco`.
  Audio nuevo: solo local o CC0 / CC BY, registrado en `CREDITOS.md`.

## Zonas seguras

- 9:16: subtítulo desde y ≈ 1590; nada importante en los 140 px de la derecha ni debajo del subtítulo; márgenes ≥ 60 px.
  La barra de progreso va arriba.
- 16:9: subtítulo abajo (bottom 30), nada importante a menos de 60 px de los bordes.
- `hyperframes check` marca textos superpuestos o cortados: se corrige en la ficha, nunca en el html.

## Próximamente: videos reales (`tipo: "real" | "mixto"`)

Base prevista (todavía no implementada en el builder):
- Material en `material/<slug>/` (clips y fotos del celular; no va a git).
- Escenas con `{ "clip": "material/<slug>/x.mp4", "desde": 3.2, "hasta": 7.5 }` o `{ "foto": "material/<slug>/x.jpg" }`,
  más la voz de Kia, subtítulos y stickers SVG (`iconos.mjs`) encima.
- Recorte automático a 16:9 / 9:16 (cover) con un punto de interés en la ficha (`"foco": [x, y]` en 0..1) y el audio
  original del clip bajo la voz (`"volOriginal": 0.3`).
- `mixto`: escenas reales y animadas en la misma ficha.
- Privacidad también para el material real: revisar caras, uniformes, carteles, patentes y **preguntar al usuario**
  antes de publicar algo dudoso.
