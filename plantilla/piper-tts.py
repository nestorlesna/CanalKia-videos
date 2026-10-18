# Voz en off con Piper (local, gratis). La llama make-video.mjs desde videos/<slug>/:
#   python plantilla/piper-tts.py audio_request.json audio_engine_meta.json
# Lee { voice, speed, pitch, lines: [{id, text, speed?}] } y escribe assets/voice/<id>.wav + el meta que usa build-index
# (voices[{id, path, duration_s, words}]).
# Voz de Kia: Daniela un poco más aguda y más rápida.
#   speed → length_scale de Piper (1 / speed).
#   pitch → post-proceso ffmpeg que sube el tono SIN cambiar la duración: asetrate=sr*P, aresample=sr, atempo=1/P.
# La duración del meta se mide DESPUÉS del post-proceso. Modelos en plantilla/voces-piper/<voice>.onnx (+ .onnx.json).
# Daniela (es_AR): CC BY-SA 4.0, ver README.
import json, os, subprocess, sys, wave
from piper import PiperVoice, SynthesisConfig

HERE = os.path.dirname(os.path.abspath(__file__))
req_path, out_path = sys.argv[1], sys.argv[2]
req = json.load(open(req_path, encoding="utf-8"))
model = os.path.join(HERE, "voces-piper", req["voice"] + ".onnx")
if not os.path.exists(model):
    sys.exit(f"falta el modelo {model} (ver plantilla/README.md, sección Voz)")
voice = PiperVoice.load(model)
pitch = float(req.get("pitch") or 1.0)
os.makedirs("assets/voice", exist_ok=True)


def shift(path, sr):
    if abs(pitch - 1.0) < 1e-3:
        return
    tmp = path + ".tmp.wav"
    os.replace(path, tmp)
    af = f"asetrate={sr}*{pitch},aresample={sr},atempo={1.0 / pitch:.6f}"
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-af", af, path])
    os.remove(tmp)
    if r.returncode != 0:
        sys.exit("ffmpeg falló al subir el tono")


voices, total = [], 0.0
for line in req["lines"]:
    path = f"assets/voice/{line['id']}.wav"
    speed = (req.get("speed") or 1.0) * (line.get("speed") or 1.0)
    cfg = SynthesisConfig(length_scale=1.0 / speed)
    with wave.open(path, "wb") as w:
        voice.synthesize_wav(line["text"], w, syn_config=cfg)
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
    shift(path, sr)
    with wave.open(path, "rb") as w:
        dur = round(w.getnframes() / w.getframerate(), 3)
    voices.append({"id": line["id"], "path": path, "duration_s": dur, "words": []})
    total += dur
    print(f"  {line['id']}: {dur:.2f} s")
json.dump({"tts_provider": "piper", "voice_id": req["voice"], "pitch": pitch, "speed": req.get("speed") or 1.0,
           "bgm": None, "voices": voices, "sfx": [], "total_duration_s": round(total, 3)},
          open(out_path, "w", encoding="utf-8"), indent=2)
