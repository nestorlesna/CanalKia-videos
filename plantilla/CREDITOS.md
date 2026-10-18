# Créditos de voz, música y efectos

Regla: solo audio **generado localmente** o con licencia **CC0 / CC BY** (archivo, autor, licencia, URL).
Los que son **CC BY** (o CC BY-SA) se agregan solos al final de cada `salida/<slug>.youtube.txt`
(`make-video.mjs` lee la tabla de abajo: columna Licencia que empiece con "CC BY").
Nada de la librería que trae la skill `media-use` (licencia Pixabay: no es CC0 ni CC BY).

## Voz

| Archivo | Autor | Licencia | URL |
|---|---|---|---|
| voces-piper/es_AR-daniela-high.onnx | Daniela (Piper TTS, rhasspy/piper-voices; datos de Google OpenSLR 61) | CC BY-SA 4.0 | https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_AR/daniela/high |

## Música

| Archivo | Autor | Licencia | URL |
|---|---|---|---|
| musica/*.wav | generada localmente con MusicGen small (plantilla/musica/generar-musica.py) | propia (generada) | — |

## Efectos (`sfx/`)

Bajados de Freesound vía Openverse (filtro `license=cc0`), recortados y normalizados con ffmpeg. Originales en `sfx/_orig/`.

| Archivo | Original | Autor | Licencia | URL |
|---|---|---|---|---|
| sfx/ladrido.wav | Small dog bark | giddster | CC0 | https://freesound.org/s/484297/ |
| sfx/ladrido-doble.wav | Small Dog Barking | michorvath | CC0 | https://freesound.org/s/270586/ |
| sfx/ronquido.wav | dog snoring | nielstii | CC0 | https://freesound.org/s/346319/ |
| sfx/boing.wav | Funny Boing | se2001 | CC0 | https://freesound.org/s/543641/ |
| sfx/pop.wav | Pop 2 | greenvwbeetle | CC0 | https://freesound.org/s/244654/ |
| sfx/whoosh.wav | Swosh swoosh whoosh air sound | qubodup | CC0 | https://freesound.org/s/60026/ |
| sfx/bostezo.wav | fangsie yawn | jinxycat49 | CC0 | https://freesound.org/s/490164/ |
| sfx/campanita.wav | Soft-Notifications - Bell - Ding-Dong | LegitCheese | CC0 | https://freesound.org/s/571513/ |
| sfx/mordisco.wav | carrotnom | j1987 | CC0 | https://freesound.org/s/106392/ |
