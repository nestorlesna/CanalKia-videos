# Genera las camas musicales del canal con MusicGen small (local, sin licencias de terceros).
#   python plantilla/musica/generar-musica.py            → las 3 opciones de OPCIONES
#   python plantilla/musica/generar-musica.py ukelele    → solo esa
# Cada opción: ~28 s generados → se repite con crossfade hasta ~200 s → plantilla/musica/<nombre>.wav (44,1 kHz, -20 LUFS aprox.)
# El modelo (facebook/musicgen-small) se baja una vez a la caché de Hugging Face.
import os, subprocess, sys
import numpy as np
import soundfile as sf
import torch
from transformers import AutoProcessor, MusicgenForConditionalGeneration

HERE = os.path.dirname(os.path.abspath(__file__))
OPCIONES = {
    "ukelele": "cheerful soft ukulele and light hand claps, cute playful children's cartoon background music, 100 bpm, no vocals, simple and warm",
    "pizzicato": "playful pizzicato strings and bassoon, sneaky funny cartoon puppy theme, light and bouncy, 100 bpm, no vocals",
    "glockenspiel": "gentle glockenspiel and marimba with soft acoustic guitar, happy lullaby-like cartoon background music, 95 bpm, no vocals",
}
SEED = 7
torch.manual_seed(SEED)
only = sys.argv[1:] or list(OPCIONES)
proc = AutoProcessor.from_pretrained("facebook/musicgen-small")
model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
sr = model.config.audio_encoder.sampling_rate
for name in only:
    torch.manual_seed(SEED)
    inputs = proc(text=[OPCIONES[name]], padding=True, return_tensors="pt")
    with torch.no_grad():
        audio = model.generate(**inputs, do_sample=True, guidance_scale=3.0, max_new_tokens=1400)
    x = audio[0, 0].numpy().astype(np.float32)
    x = x[: int(len(x) - sr * 0.3)]  # el final de MusicGen suele cortar feo
    raw = os.path.join(HERE, f"_{name}-raw.wav")
    sf.write(raw, x, sr)
    # repetir con crossfade de 1,5 s hasta ~200 s, normalizar y pasar a 44,1 kHz estéreo
    seg = len(x) / sr
    n = int(200 // (seg - 1.5)) + 1
    ins, chain, last = [], [], "[0:a]"
    for i in range(n):
        ins += ["-i", raw]
    for i in range(1, n):
        out = f"[a{i}]"
        chain.append(f"{last}[{i}:a]acrossfade=d=1.5:c1=tri:c2=tri{out}")
        last = out
    chain.append(f"{last}loudnorm=I=-20:TP=-2,aresample=44100[o]")
    dst = os.path.join(HERE, f"{name}.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", ";".join(chain), "-map", "[o]", "-ac", "2", dst], check=True)
    print(f"ok {dst} (segmento {seg:.1f} s × {n})", flush=True)
