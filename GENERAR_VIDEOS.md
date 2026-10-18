# GENERAR_VIDEOS — instructivo para generar videos del canal de Kia

> **Para el modelo / agente que lee esto:** este archivo es una orden de trabajo completa. Seguilo paso a paso, en orden,
> sin saltear verificaciones. Sirve para cualquier herramienta (Claude Code, opencode, ChatGPT/Codex, Cursor, Aider…)
> y cualquier modelo. No asumas nada que no esté acá o en los archivos que se indican.

---

## Cómo usarlo (para el usuario): prompts de ejemplo

Abrí la herramienta en la carpeta `VideosKia/` y pegá uno de estos:

**Los próximos de la lista:**
```
Seguí GENERAR_VIDEOS.md. CANTIDAD: 2.
```

**Con prefijo (para comparar herramientas):**
```
Leé y seguí GENERAR_VIDEOS.md al pie de la letra.
CANTIDAD: 3
PREFIJO: OC
```

**Videos elegidos (clave o número del CHECKLIST):**
```
Seguí GENERAR_VIDEOS.md. VIDEOS: soy-rottweiler, 5
```

**Una idea nueva (del usuario o de su hijo):**
```
Seguí GENERAR_VIDEOS.md.
IDEA: Kia descubre la aspiradora y cree que es un monstruo. Que termine durmiendo arriba de la aspiradora.
FORMATOS: 9x16
```

**Solo fichas, para revisar antes de renderizar:**
```
Seguí GENERAR_VIDEOS.md. CANTIDAD: 3. SOLO_FICHAS: sí.
```

Consejos: con modelos chicos pedí pocos videos por vez (1–3). Si la herramienta no puede ver imágenes, va a usar solo
poses y escenas ya probadas y te lo va a avisar.

---

## 0. Parámetros

| Parámetro | Obligatorio | Default | Qué hace |
|---|---|---|---|
| `CANTIDAD` | sí (salvo que haya `VIDEOS` o `IDEA`) | — | cuántos videos nuevos |
| `VIDEOS` | no | los próximos del CHECKLIST | claves o números del CHECKLIST, en cualquier orden |
| `IDEA` | no | — | texto libre: armás la ficha y **agregás la fila al CSV** (estado `guion listo`) |
| `FORMATOS` | no | lo que diga la fila del CSV (o `16x9,9x16`) | `16x9`, `9x16` o los dos |
| `PREFIJO` | no | *(vacío)* | `salida/<PREF>_<slug>.….mp4`. **Si el usuario no lo dice, sin prefijo.** Nunca lo inventes |
| `SOLO_FICHAS` | no | no | todo menos `--render` |

El prefijo se pasa solo con `--prefijo=OC` (sin `_`). El script lo guarda en `videos/<slug>/.pipeline.json` y el
CHECKLIST lo encuentra. **No renombres ni muevas archivos de salida.**

---

## 1. Qué es este proyecto (contexto mínimo)

- Canal de YouTube de **Kia**, una bulldog francés que se cree humana. Lo hace un chico con ayuda de su papá.
  Público: chicos y familias. Humor tierno, ritmo rápido.
- **Kia narra en primera persona**, en **español rioplatense con voseo** ("¿vos sabés…?", "mirá", "suscribite").
- Videos animados: Kia en SVG (`plantilla/kia.mjs`) con poses, objetos y humanos genéricos. Dos formatos:
  **16:9** (1920×1080, el video "largo") y **9:16** (1080×1920, el Short ≤ 60 s).
- Motor: **HyperFrames 0.8.150** (`npx --prefer-offline`). Voz: **Piper** local, Daniela es_AR con tono 1,14 y velocidad
  1,12. Música: `plantilla/musica/ukelele.wav`. Todo local y gratis.

```
guiones/guiones.csv       lista maestra (";", UTF-8 con BOM): clave;titulo;tipo;formatos;descripcion;estado
guiones/<slug>.json       ficha del video (LO ÚNICO QUE SE ESCRIBE A MANO)
videos/<slug>/16x9|9x16/  proyectos HyperFrames generados (no editar)
salida/                   [PREF_]<slug>.16x9.mp4 · .short.mp4 · .miniatura.png · .short.miniatura.png · .youtube.txt
salida/subidos/           ya publicados: los mueve el usuario. NUNCA toques nada ahí
CHECKLIST.md              estado (autogenerado, no editar)
plantilla/README.md       ESPECIFICACIÓN COMPLETA de la ficha (kinds, poses, objetos, efectos, youtube)
plantilla/BITACORA.md     problemas ya resueltos
```

**Lectura obligatoria antes de empezar** (en este orden): este archivo → `plantilla/README.md` → `plantilla/BITACORA.md`.
Ejemplo completo para copiar: **`guiones/presentacion-kia.json`** (todos los kinds, humanos, correa, objetos que caen,
globos, carteles numerados, overrides por formato, youtube de los dos formatos y miniaturas).

---

## 2. Reglas fijas (no negociables)

1. **Idioma**: rioplatense con voseo en voz, subtítulos, carteles y descripción de YouTube. Kia habla en primera persona.
2. **Voz**: Piper + Daniela, la configuración de `plantilla/defaults.json`. No propongas voces pagas ni en la nube.
3. **Privacidad** (lo hace un menor): nunca nombres reales del hermano, papá o mamá; nada de colegio, dirección,
   patentes ni caras reconocibles. Humanos genéricos de la cintura para abajo (`humano` en props).
4. **Contenido familiar**: en pantalla solo comida apta para perros (zanahoria, pollo, manzana sin semillas).
   Si aparece comida: `"comida": true` y el aviso 🥕 en la descripción.
5. **No edites** `videos/**/index.html` ni `CHECKLIST.md`: se regeneran. Los cambios van en la ficha.
6. No toques `salida/subidos/` ni muevas/renombres archivos de salida.
7. **No hagas `git commit` ni `git push`** salvo que el usuario lo pida.
8. Toda ficha nueva lleva `"revisado": false`. Solo el usuario aprueba.
9. Un video **no está terminado** sin: ficha + voz + check + render (cada formato) + `youtube` + miniaturas.
10. Nada de emojis dentro del video (carteles, globos): usá íconos de `iconos.mjs`. En YouTube sí van emojis.
11. Audio nuevo: solo generado local o CC0 / CC BY, registrado en `plantilla/CREDITOS.md`.
12. Si cambiás algo de `plantilla/` (poses, íconos, builder): documentalo en `plantilla/README.md` y en la BITÁCORA.
13. Cada problema nuevo que resuelvas: fila en `plantilla/BITACORA.md` (`| MM-DD | slug | Problema | Solución / regla |`).

---

## 3. Verificar el entorno (una vez, al principio)

```bash
node -v                                       # Node 20+
python -c "import piper; print('ok')"         # si falla: python -m pip install piper-tts
ffmpeg -version && ffprobe -version
ls plantilla/voces-piper                      # es_AR-daniela-high.onnx y .onnx.json
ls plantilla/musica/ukelele.wav plantilla/sfx
ls .claude/skills/hyperframes                 # si falta: npx skills add heygen-com/hyperframes
```
Si falta el modelo de voz (114 MB, no está en git), bajalo a `plantilla/voces-piper/`:
`https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx` (y `.onnx.json`).
Si algo falla y no lo podés arreglar, frená y avisá qué falta.

---

## 4. Elegir los videos

1. `node plantilla/make-video.mjs --checklist` y abrí `CHECKLIST.md`.
2. Si hay `VIDEOS`, esos. Si hay `IDEA`, inventá una clave corta en kebab-case, agregá la fila al final de
   `guiones/guiones.csv` (`clave;titulo;animado;<formatos>;<idea resumida>;guion listo`, UTF-8 con BOM) y seguí.
   Si no, los primeros `CANTIDAD` con Ficha ⬜ (la línea "**Próximo:**" dice cuál es el primero).
3. `node plantilla/make-video.mjs <slug> --info` para ver título, formatos y descripción.
4. Salteá los de `tipo: real | mixto` (el formato real todavía no está construido: README, "Próximamente") y avisalo.

---

## 5. Procedimiento por video

### 5.1 Pensar el guion (antes de escribir nada)

En 6–10 líneas para vos: el chiste central, 6–14 escenas (frases de Kia ≤ ~120 caracteres), qué hace Kia en cada una
(pose + objetos), cuál es la imagen para la miniatura y qué escenas van al Short (`short: true`, total ≤ 60 s).
Ritmo: alterná escenas largas con remates cortos (~1,8–2 s). Kia siempre grande y en el centro de la acción.
Personalidad de Kia: se cree humana, duerme todo el día, cree que es rottweiler, ama la pelota azul y lo que se le cae
a mamá, acompaña al hermano al colegio y "pasea" al papá, no entiende la tecnología del hermano.

### 5.2 Poses nuevas (solo si hacen falta)

Primero intentá con las poses que ya existen (tabla en el README; `node plantilla/pose-lab.mjs` muestra todas).
Si falta una: sumala a `KIA_POSES` en `plantilla/kia.mjs` (claves en el README), mirala con
`node plantilla/pose-lab.mjs POSE_NUEVA,SENTADA` → `videos/_poselab/snapshots/contact-sheet.jpg`, iterá, y anotala en
el README. Objetos nuevos: en `plantilla/iconos.mjs` (mismo estilo: contorno `${L}` grueso, colores de la identidad),
ver con `--iconos`.

### 5.3 Escribir la ficha

`guiones/<slug>.json`, copiando la estructura de `guiones/presentacion-kia.json` (ver 6). Conviene escribirla con la
herramienta de escritura de archivos o con un script Python guardado en un archivo (no heredocs largos en bash).

### 5.4 Generar y revisar

```bash
node plantilla/make-video.mjs <slug>
```
Hace voz → index.html de cada formato → `hyperframes check` → contact sheets → miniaturas (~3–5 min).

1. Leé la salida: `✓ 16x9: … Xs`, `✓ 9x16: … Ys`, y los `⚠` (avisos del builder: cue no encontrado, subtítulo largo,
   Short > 60 s…). Los avisos `nested_structure_needs_subcomposition`, `timeline_track_too_dense` y
   `composition_file_too_large` son de estilo: ignoralos.
2. **Ajustá los tiempos de Kia a la voz real**: `videos/<slug>/audio_engine_meta.json` tiene la duración de cada frase.
   Los moves de Kia usan `at` fijos (la voz de Kia es rápida: ~20 caracteres por segundo).
3. Mirá **los dos** contact sheets: `videos/<slug>/16x9/snapshots/contact-sheet.jpg` y `…/9x16/…`, y las miniaturas
   `salida/<slug>.miniatura.png` / `.short.miniatura.png`. Lo más común: globos o Zzz que pisan el cartel, objetos fuera
   del borde en 9:16, Kia tapada por un objeto. Corregí en la ficha (overrides por formato) y volvé a correr
   (con `--formato=16x9` rehacés uno solo).
4. El check tiene que decir `Check passed` en los dos formatos.

### 5.5 Renderizar

```bash
node plantilla/make-video.mjs <slug> --render              # sin prefijo
node plantilla/make-video.mjs <slug> --render --prefijo=OC  # si el usuario lo pidió
```
Renderiza los dos formatos uno detrás del otro (~5–8 min en total). Corrélo en segundo plano y mientras tanto avanzá
con el siguiente video. **Máximo 2–3 procesos de navegador a la vez** (render o make-video): más, y falla con
`Browser process did not exit`.

### 5.6 Cerrar el video

- Que existan los `.mp4` en `salida/` y que el CHECKLIST los muestre con ✅ (16:9 y Short), YouTube ✅ y miniaturas ✅.
- Si la columna YouTube muestra ⚠️, leé la nota y corregí el bloque `youtube` (después `--checklist`).
- Problemas nuevos → fila en la BITÁCORA.

---

## 6. Cómo escribir la ficha

### 6.1 Esqueleto

```jsonc
{
  "slug": "soy-rottweiler", "titulo": "Soy rottweiler (el pasillo)", "tipo": "animado",
  "formatos": ["16x9", "9x16"], "musica": "ukelele.wav", "comida": false, "revisado": false, "notas": "",
  "frames": [
    { "id": "01", "kind": "hook", "min": 3.2, "short": true,
      "titulo": { "texto": "KIA", "bajada": "…", "linea": "…" },
      "kia": { "pose": "SENTADA", "entra": "salto", "16x9": { "x": -330, "sc": 1.15 }, "9x16": { "x": 0 } },
      "vo": "…" },
    { "id": "02", "kind": "escena", "short": true, "cartel": { "texto": "…", "at": 0.4 },
      "kia": { "pose": "…", "moves": [ … ] }, "props": [ … ], "efectos": [ … ], "sfx": [ … ], "vo": "…" },
    { "id": "03", "kind": "dormir", "numero": 1, "min": 1.9, "short": true, "kia": { "pose": "DORMIDA" }, "vo": "Dormir." },
    { "id": "NN", "kind": "cierre", "min": 3.6, "short": true, … "vo": "¡Suscribite, que ladrar es gratis!" }
  ],
  "miniatura": { "escena": "hook", "kia": { "pose": "SALUDO", "16x9": { "x": -400, "sc": 1.35 } } },
  "youtube": { "16x9": { … }, "9x16": { … } }
}
```

### 6.2 Kinds y recetas probadas (copiar de `presentacion-kia.json`)

| Necesito… | Cómo | Escena de ejemplo |
|---|---|---|
| Portada con KIA gigante | `kind: hook` + Kia `entra: salto` + `seq SALUDO_B/SALUDO` | 01 |
| Cartel + Kia que reacciona | `cartel` + `to: CONFUNDIDA` + efecto `pregunta` con `cue` | 02 |
| Panza / ternura | `cut: PANZA` + `seq PANZA_B/PANZA` + prop `aro` + efecto `corazones` | 03 |
| Lista numerada | `kind: ranking` (`items` / `vacios`), y después carteles chicos con `numero` | 04, 06, 09… |
| Chiste "Dormir" | `kind: dormir` + `numero` + una pose de dormir distinta cada vez | 05, 08, 11, 13 |
| Paseo con humano | `loop CAMINA_B/CAMINA_A` + `humano` con `camina` + `correa` + `piso` 260–380 | 06, 07 |
| Correr hasta algo y ladrar | `cut CORRE_A` + `loop` con `until` + `set x` con `dur` + `to LADRA` + globo `¡GUAU!` | 09 |
| Se cree rottweiler | `to: RUDA` + prop `sombra` con `entra: fade` | 10 |
| Algo cae y lo atrapa | prop con `entra: cae` + `out`, Kia `COME` → `COME_B` → `MASTICA` + `mordisco` | 12 |
| Perseguir y pelota | `loop CORRE` + humano con `mov` + `pelota` `cae` con `loop: rebota` | 14 |
| Se duerme de golpe | `to: DORMIDA_SENTADA` (`dur 0.9`) + `zzz` + sfx `bostezo` y `ronquido` | 15 |
| Kia mira la compu | `MIRA` con `fx: -1` + `pantalla` + `joystick` `tiembla` + `pregunta` ×2 | 17 |
| Cierre | `APRIETA` + prop `suscribite` con `mov` (sc 0.9 → 1) + `campana` `sacude` + `campanita` + `ladrido` | 19 |

Poses de dormir de menos a más ridícula: `DORMIDA` → `DORMIDA_SENTADA` → `DORMIDA_PANZA_ARRIBA` → `DORMIDA_SPLOOT` → `DORMIDA_PLOP`.

### 6.3 Medidas y zonas seguras

- Escenario: piso y = 0; Kia sentada mide ~400 (orejas en y ≈ −400). Borde visible: 16:9 `x ±750`; 9:16 `x ±326`.
- Cartel arriba: no pongas globos ni efectos por encima de y ≈ −480 (16:9) / −760 (9:16).
- En 9:16 Kia más chica (`sc 0.85–0.95` si hay objetos al lado) y objetos más cerca del centro; nada importante a la
  derecha de x ≈ 300 (botones de Shorts).
- `vo` ≤ ~120 caracteres (3 líneas de subtítulo); el builder avisa si te pasás.
- Globos y efectos con `pos` en una escena donde Kia se desplaza: la posición se corre con Kia (restá el desplazamiento).

### 6.4 Pronunciación

`plantilla/pronunciacion.json` cambia palabras solo en la voz (siempre la versión ajustada: buldog, rotváiler, pitbul,
Kía…). Palabra nueva dudosa: `node plantilla/make-video.mjs --pronunciacion palabra` → `videos/_pronunciacion/`,
y si hace falta sumala al json.

### 6.5 Bloque `youtube` (obligatorio, uno por formato)

- **Título** 16:9 ≤ 100 caracteres (ideal ~55), con un emoji; Short corto + `#Shorts`.
- **Descripción** (rioplatense, voz de Kia, emojis, **sin `<` ni `>`**):
```
🐶 <gancho en una línea, en primera persona de Kia>

<2–4 líneas de lo que pasa en el video, con humor>

🐾 <bloque propio del video (lista, ranking, datos)>

<🥕 aviso de comida, si comida: true>

{{CIERRE}}

#Kia #BulldogFrances #Frenchie #<Tema> #Perros
```
- `{{CIERRE}}` se reemplaza por `plantilla/youtube-cierre.txt`; los créditos (voz, CC BY) los agrega el script antes de
  los hashtags, que **tienen que ser la última línea**.
- **Tags**: 10–15, ≤ 500 caracteres (kia, bulldog francés, french bulldog, frenchie, perro gracioso, perros graciosos,
  mascotas, perra que se cree humana, videos de perros, animación de perro + 2–3 del tema).
- AUDIENCIA ("hecho para niños") **no la decidís vos**: el youtube.txt trae el recordatorio para el usuario.

### 6.6 Miniaturas (obligatorias)

`miniatura` toma una escena (default el hook) y le pisa campos: Kia grande en su pose más expresiva + 1–3 palabras
gigantes (`titulo.texto`). Revisá que se lea en chico y que en 9:16 no quede nada en la franja derecha.

---

## 7. Errores conocidos y su solución

| Síntoma | Solución |
|---|---|
| Globo o Zzz pisan el cartel | bajar el globo (`pos`), o `out` del cartel antes de los Zzz |
| Globo cortado contra el borde cuando Kia corre | el `pos` se mueve con Kia: restá su desplazamiento |
| Cartel desborda en 9:16 | textos cortos; el builder estima el tamaño (Fredoka 0,64 em/carácter) y achica |
| Short > 60 s | sacar `short: true` de escenas que no son esenciales |
| Kia hace algo antes/después de que lo diga | ajustar `at` con `audio_engine_meta.json` (la voz es rápida) |
| `cue "…" no aparece en la voz` | el cue tiene que estar literal en `vo` (sin importar tildes ni mayúsculas) |
| Botón/objeto tapa a Kia en 9:16 | override `"9x16": { "pos", "size" }` y Kia `x` más a la izquierda |
| Humano se sale del borde en 9:16 | `pos` x entre −220 y 220 |
| Contact sheet sin Kia | error de JS en `kia.mjs` o pose inexistente (el builder avisa `pose desconocida`) |
| `npx hyperframes` tarda o `ECOMPROMISED` | ya se usa `--prefer-offline`; correr uno solo primero |
| `Browser process did not exit` / timeout | no es de contenido: menos procesos a la vez y repetir |
| Heredoc de bash se corta | escribir el script en un archivo y ejecutarlo |
| Consola de Windows: `UnicodeEncodeError` en Python | prints sin caracteres especiales o `PYTHONIOENCODING=utf-8` |

Más detalles: `plantilla/BITACORA.md` y las de `..\VideosCripto` y `..\VidesoEjercicios` (mecánica común).

---

## 8. Paralelismo y tiempos

- `pose-lab`: hasta 4 a la vez. `make-video` y `--render`: **2–3 procesos de navegador en total**.
- Tiempos aprox.: `make-video` 3–5 min (dos formatos), `--render` 5–8 min (dos formatos).
- Con varios videos: fichas de todos → `make-video` de a 2 → revisar → `--render` en segundo plano de a 2.

---

## 9. Si la herramienta no puede ver imágenes

Igual corré `make-video` (el check detecta superposiciones y textos cortados). Usá solo poses, kinds y recetas ya
probadas de `presentacion-kia.json`, con posiciones parecidas, y avisá en el reporte que los contact sheets no se
revisaron a ojo.

---

## 10. Al terminar todos

1. `node plantilla/make-video.mjs --checklist`
2. Verificá en `CHECKLIST.md` que cada video nuevo tiene ✅ en Ficha, Voz, 16:9, Short, Check, YouTube y Miniaturas.
3. BITÁCORA (y README si cambiaste `plantilla/`).
4. **No hagas commit** (salvo pedido explícito).
5. Reporte corto, en rioplatense:

```
Videos generados (N):
- <titulo> → salida/<slug>.16x9.mp4 (<dur> s) + .short.mp4 (<dur> s) — <nota si hay algo para revisar>
Ideas nuevas en el CSV: <clave>          ← solo si hubo IDEA
Salteados: <clave> (<motivo>)            ← solo si hubo
Para revisar: <decisiones tuyas, poses nuevas, checks que fallaron, contact sheets no revisados>
```
