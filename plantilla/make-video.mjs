// Un comando por video: guiones/<slug>.json → videos/<slug>/<formato>/ → salida/<slug>.16x9.mp4 / .short.mp4
//                       + miniaturas + .youtube.txt + CHECKLIST.md
//
//   node plantilla/make-video.mjs <slug>                 voz (una sola vez, compartida) → index.html por formato → check → snapshots → miniaturas
//   node plantilla/make-video.mjs <slug> --render        lo anterior + render → salida/ (correrlo en segundo plano)
//   node plantilla/make-video.mjs <slug> --miniatura     solo las miniaturas (rápido)
//   node plantilla/make-video.mjs <slug> --info          fila de guiones/guiones.csv
//   node plantilla/make-video.mjs --checklist            regenera CHECKLIST.md y todos los salida/*.youtube.txt
//   node plantilla/make-video.mjs --kit                  demo de todos los kinds en 16:9 y 9:16 → videos/_kit/<formato>/snapshots/
//   node plantilla/make-video.mjs --iconos               hoja con todos los íconos → videos/_iconos/snapshots/
//   node plantilla/make-video.mjs --pronunciacion [palabra]   audios "tal cual / ajustada" → videos/_pronunciacion/
//   node plantilla/make-video.mjs --voz-muestras         la misma frase con 6 combinaciones de tono/velocidad → videos/_voz/
//
// Flags: --formato=16x9|9x16|todos (default: los "formatos" de la ficha) · --prefijo=XX (salida/XX_<slug>…)
//        --force-tts · --no-check · --no-snapshot
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FORMATOS, buildIndex, defaults, framesFor, identidadActiva, plain } from "./build-index.mjs";
import { ICON_NAMES, icono } from "./iconos.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
export const HF = "npx --prefer-offline --yes hyperframes@0.8.150"; // misma versión que VideosCripto y VidesoEjercicios
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const optEq = (f) => { const a = args.find((x) => x.startsWith(`${f}=`)); return a ? a.slice(f.length + 1) : null; };
const slug = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--pronunciacion");
const FMT_FILE = { "16x9": "16x9", "9x16": "short" }; // salida/<slug>.16x9.mp4 · salida/<slug>.short.mp4

const sh = (cmd, cwd, inherit = true) => {
  console.log(`$ ${cmd}`);
  return spawnSync(cmd, { cwd, shell: true, stdio: inherit ? "inherit" : "pipe", encoding: "utf8" });
};
const statusPath = (dir) => join(dir, ".pipeline.json");
const readStatus = (dir) => (existsSync(statusPath(dir)) ? JSON.parse(readFileSync(statusPath(dir), "utf8")) : {});
const writeStatus = (dir, patch) => { mkdirSync(dir, { recursive: true }); writeFileSync(statusPath(dir), JSON.stringify({ ...readStatus(dir), ...patch }, null, 2)); };
const writeFmtStatus = (dir, fmt, patch) => writeStatus(dir, { [fmt]: { ...(readStatus(dir)[fmt] || {}), ...patch } });
const today = () => new Date().toISOString().slice(0, 10);
const rel = (f) => f.slice(ROOT.length + 1).replace(/\\/g, "/");

// Lista maestra: guiones/guiones.csv — clave;titulo;tipo;formatos;descripcion;estado (";" con comillas opcionales, UTF-8 con BOM).
export function readCsv() {
  const file = join(ROOT, "guiones", "guiones.csv");
  if (!existsSync(file)) return [];
  const t = readFileSync(file, "utf8").replace(/^﻿/, "");
  const rows = [];
  let row = [], f = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
    } else if (c === '"') q = true;
    else if (c === ";") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f.replace(/\r$/, "")); rows.push(row); row = []; f = ""; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [head, ...data] = rows;
  return data.filter((r) => r.length > 1 && r[0]).map((r) => Object.fromEntries(head.map((k, i) => [k.trim(), (r[i] || "").trim()])));
}

// Huella de lo que se ve/escucha: cambiar youtube, miniatura, notas o revisado NO marca el video como desactualizado.
export function contentHash(spec) {
  const { youtube, miniatura, notas, revisado, ...rest } = spec;
  return createHash("sha1").update(JSON.stringify(rest)).digest("hex").slice(0, 12);
}
const renderHash = (spec) => `${contentHash(spec)}:${identidadActiva().id}`;

const SUBIDOS = join(ROOT, "salida", "subidos");
const subidoPath = (file) => (existsSync(join(SUBIDOS, file)) ? join(SUBIDOS, file) : null);
const outPath = (file) => subidoPath(file) || join(ROOT, "salida", file);
const mp4Name = (slug, fmt, pref) => `${pref ? `${pref}_` : ""}${slug}.${FMT_FILE[fmt]}.mp4`;
const thumbName = (slug, fmt) => (fmt === "16x9" ? `${slug}.miniatura.png` : `${slug}.short.miniatura.png`);
const specFormats = (spec) => spec.formatos || ["16x9"];

// ── YouTube ──────────────────────────────────────────────────────────────────────────────────────────────────────
const VOICE_CREDIT = "🎙️ Voz: Daniela (Piper TTS, rhasspy/piper-voices), datos de Google OpenSLR 61, licencia CC BY-SA 4.0.";
const CIERRE = () => readFileSync(join(HERE, "youtube-cierre.txt"), "utf8").trim();
const AVISO_COMIDA = "🥕 Ojo: no todo lo que comen los humanos es sano para los perros. Si dudás, preguntale a tu veterinario.";
// Créditos CC BY de plantilla/CREDITOS.md para los audios que usa la ficha (música y efectos).
function ccByCredits(spec) {
  const md = existsSync(join(HERE, "CREDITOS.md")) ? readFileSync(join(HERE, "CREDITOS.md"), "utf8") : "";
  const used = new Set([`musica/${spec.musica ?? defaults().musica}`]);
  spec.frames.forEach((f) => { (f.sfx || []).forEach((s) => used.add(`sfx/${typeof s === "string" ? s : s.id}.wav`)); if (f.kind === "dormir" && f.ronquido !== false) used.add("sfx/ronquido.wav"); });
  const out = [];
  for (const line of md.split("\n")) {
    const c = line.split("|").map((x) => x.trim());
    if (c.length < 6 || !used.has(c[1])) continue;
    const lic = c[c.length - 3], autor = c[c.length - 4], url = c[c.length - 2];
    if (/^CC BY/i.test(lic)) out.push(`🔊 ${c[2] || c[1]} — ${autor} (${lic}) ${url}`);
  }
  return out;
}
function youtubeSection(spec, fmt, warns) {
  const yt = spec.youtube?.[fmt];
  if (!yt?.descripcion) { warns.push(`${fmt}: falta youtube.${fmt}`); return null; }
  let desc = yt.descripcion.replace("{{CIERRE}}", CIERRE());
  if (!desc.includes(CIERRE())) warns.push(`${fmt}: falta el cierre ({{CIERRE}})`);
  if (spec.comida && !desc.includes("🥕 Ojo")) warns.push(`${fmt}: aparece comida y falta el aviso 🥕`);
  const credits = [VOICE_CREDIT, ...ccByCredits(spec)].filter((c) => !desc.includes(c));
  if (credits.length) {
    const lines = desc.split("\n"), tags = lines.pop();
    desc = [...lines, ...credits, "", tags].join("\n");
  }
  const tags = yt.tags || [], tit = yt.titulo || "";
  if ([...tit].length > 100) warns.push(`${fmt}: título de ${[...tit].length} caracteres (máx. 100)`);
  if (fmt === "9x16" && !tit.includes("#Shorts")) warns.push("9x16: el título no tiene #Shorts");
  if (tags.length < 10 || tags.length > 15) warns.push(`${fmt}: ${tags.length} tags (10–15)`);
  if (tags.join(", ").length > 500) warns.push(`${fmt}: tags de ${tags.join(", ").length} caracteres (máx. 500)`);
  if ([...desc].length > 5000) warns.push(`${fmt}: descripción de ${[...desc].length} caracteres (máx. 5000)`);
  if (/[<>]/.test(desc) || /[<>]/.test(tit)) warns.push(`${fmt}: hay < o > (YouTube los rechaza)`);
  const nombre = fmt === "16x9" ? "VIDEO 16:9" : "SHORT 9:16";
  return [`══════ ${nombre} ══════`, "", "TÍTULO", tit, "", "DESCRIPCIÓN", desc, "", "TAGS", tags.join(", "), ""].join("\n");
}
export function exportYoutube(spec) {
  if (!spec.youtube) return null;
  const warns = [], parts = [];
  for (const fmt of specFormats(spec)) { const s = youtubeSection(spec, fmt, warns); if (s) parts.push(s); }
  if (!parts.length) return warns;
  mkdirSync(join(ROOT, "salida"), { recursive: true });
  const head = `AUDIENCIA: elegir en YouTube Studio si es "hecho para niños" (lo decide el dueño del canal).\n\n`;
  writeFileSync(outPath(`${spec.slug}.youtube.txt`), head + parts.join("\n"));
  return warns;
}

// ── Voz ──────────────────────────────────────────────────────────────────────────────────────────────────────────
// Piper + Daniela es_AR con tono y velocidad de Kia (plantilla/defaults.json → voz, o "voice" en la ficha).
// El subtítulo muestra el texto tal cual; a la voz se le aplica plantilla/pronunciacion.json y se le sacan ** y emojis.
function vozText(s) {
  const map = JSON.parse(readFileSync(join(HERE, "pronunciacion.json"), "utf8"));
  let out = plain(s).replace(/[\p{Extended_Pictographic}️]/gu, "");
  for (const [k, v] of Object.entries(map)) if (!k.startsWith("_")) out = out.replace(new RegExp(`(?<![\\p{L}])${k}(?![\\p{L}])`, "gu"), v);
  return out.trim();
}
const vozCfg = (spec = {}) => ({ ...defaults().voz, ...(spec.voice || {}) });
function piper(dir, request) {
  writeFileSync(join(dir, "audio_request.json"), JSON.stringify(request, null, 2));
  return sh(`python "${join(HERE, "piper-tts.py")}" audio_request.json audio_engine_meta.json`, dir, false);
}
function tts(dir, spec) {
  const v = vozCfg(spec);
  const lines = spec.frames.map((f, i) => ({ f, id: f.id || String(i + 1).padStart(2, "0") })).filter(({ f }) => f.vo)
    .map(({ f, id }) => ({ id, text: vozText(f.vo), ...(f.voSpeed ? { speed: f.voSpeed } : {}) }));
  const request = { provider: "piper", voice: v.voice, pitch: v.pitch, speed: v.speed, lines };
  const reqPath = join(dir, "audio_request.json");
  const next = JSON.stringify(request, null, 2);
  if (existsSync(reqPath) && readFileSync(reqPath, "utf8") === next && existsSync(join(dir, "audio_engine_meta.json")) && !has("--force-tts")) {
    console.log("· voz: sin cambios, se reutiliza");
    return true;
  }
  const r = piper(dir, request);
  if (r.status !== 0) console.error(r.stderr || r.stdout);
  return r.status === 0;
}

// Proyecto HyperFrames mínimo (los mismos archivos que deja init).
export function bareProject(dir, name) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "hyperframes.json"), JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", registry: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry", paths: { blocks: "compositions", components: "compositions/components", assets: "assets" }, media: { autoProxy: true } }, null, 2));
  writeFileSync(join(dir, "meta.json"), JSON.stringify({ id: name, name, createdAt: new Date().toISOString() }, null, 2));
  const v = HF.split("@").pop();
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name, private: true, type: "module", scripts: { dev: `npx --yes hyperframes@${v} preview`, check: `npx --yes hyperframes@${v} check`, render: `npx --yes hyperframes@${v} render` } }, null, 2));
}

// hyperframes 0.8 puede dejar los snapshots en .hyperframes/artifacts/snapshots/<id>/: se copian a <dir>/snapshots/.
export function collectShots(dir) {
  const out = join(dir, "snapshots");
  const base = join(dir, ".hyperframes", "artifacts", "snapshots");
  if (existsSync(out) && readdirSync(out).length) return out;
  if (!existsSync(base)) return out;
  const runs = readdirSync(base).map((d) => join(base, d)).filter((d) => statSync(d).isDirectory());
  if (!runs.length) return out;
  const last = runs.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
  mkdirSync(out, { recursive: true });
  for (const f of readdirSync(last)) copyFileSync(join(last, f), join(out, f));
  return out;
}
export function snapshots(dir, b, times) {
  // un cuadro por escena, cuando ya apareció todo (antes del fundido de salida)
  const at = times || b.frames.map((f) => Math.min(f.start + f.dur - 0.3, f.start + Math.max(f.dur * 0.6, f.ready + 0.25)).toFixed(2)).join(",");
  rmSync(join(dir, "snapshots"), { recursive: true, force: true });
  sh(`${HF} snapshot . --at ${at} --no-end --describe false`, dir);
  const out = collectShots(dir);
  contactSheet(out);
  return out;
}
// Una sola hoja con todos los cuadros (hyperframes la parte en contact-sheet-1..N): snapshots/contact-sheet.jpg
export function contactSheet(shots) {
  if (!existsSync(shots)) return;
  const pngs = readdirSync(shots).filter((f) => /^frame-.*\.png$/.test(f)).sort();
  if (!pngs.length) return;
  const vertical = (() => { const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0", join(shots, pngs[0])], { encoding: "utf8" }); const [w, h] = r.stdout.trim().split(",").map(Number); return h > w; })();
  const cols = vertical ? Math.min(6, pngs.length) : Math.min(4, pngs.length), rows = Math.ceil(pngs.length / cols);
  writeFileSync(join(shots, "_lista.txt"), pngs.map((f) => `file '${f}'\nduration 1`).join("\n"));
  spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "_lista.txt", "-vf", `scale=${vertical ? 300 : 480}:-1,tile=${cols}x${rows}:padding=8:margin=8:color=0x1a1a1a`, "-frames:v", "1", "-q:v", "3", "contact-sheet.jpg"], { cwd: shots });
  rmSync(join(shots, "_lista.txt"), { force: true });
}

// Miniatura: una escena quieta (spec.miniatura, con overrides por formato) sin subtítulo, barra ni audio.
function miniatura(slugDir, spec, fmt) {
  const dir = join(slugDir, `miniatura-${fmt}`);
  bareProject(dir, `${spec.slug}-miniatura-${fmt}`);
  const b = buildIndex({ dir, spec, fmt, thumb: true });
  b.warnings.forEach((w) => console.log(`  ⚠ miniatura ${fmt}: ${w}`));
  rmSync(join(dir, "snapshots"), { recursive: true, force: true });
  const r = sh(`${HF} snapshot . --at ${b.thumbAt} --no-end --describe false`, dir);
  const shots = collectShots(dir);
  const png = existsSync(shots) && readdirSync(shots).find((f) => f.endsWith(".png"));
  if (r.status !== 0 || !png) return false;
  const out = outPath(thumbName(spec.slug, fmt));
  mkdirSync(dirname(out), { recursive: true });
  if (fmt === "16x9") spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", join(shots, png), "-vf", "scale=1280:720:flags=lanczos", out]);
  else copyFileSync(join(shots, png), out);
  console.log(`✓ ${rel(out)}`);
  return true;
}

function mp4Duration(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  return r.status === 0 ? Number(r.stdout.trim()) : null;
}

// ── CHECKLIST ────────────────────────────────────────────────────────────────────────────────────────────────────
export function checklist() {
  const csv = readCsv();
  const gdir = join(ROOT, "guiones");
  const specs = Object.fromEntries(
    (existsSync(gdir) ? readdirSync(gdir) : []).filter((f) => f.endsWith(".json") && !f.startsWith("_")).map((f) => {
      const spec = JSON.parse(readFileSync(join(gdir, f), "utf8"));
      return [spec.slug, spec];
    }),
  );
  const inCsv = new Set(csv.map((r) => r.clave));
  const items = [...Object.keys(specs).filter((k) => !inCsv.has(k)).sort().map((k) => ({ slug: k, n: "—" })), ...csv.map((r, i) => ({ slug: r.clave, n: String(i + 1), row: r }))];
  const ok = (b) => (b ? "✅" : "⬜");
  let done = 0, fichas = 0, subidos = 0, next = null;
  const rows = items.map(({ slug, n, row }) => {
    const spec = specs[slug];
    const titulo = spec?.titulo || row?.titulo || slug, tipo = spec?.tipo || row?.tipo || "";
    const fmts = spec ? specFormats(spec) : (row?.formatos || "16x9").split(",").map((x) => x.trim());
    if (!spec) {
      next ??= `${n} · ${titulo}`;
      return `| ${n} | ${titulo} | ${tipo} | ${fmts.join(", ")} | ⬜ | ⬜ | — | — | ⬜ | ⬜ | — | ⬜ | ⬜ | ${row?.estado || ""} |`;
    }
    fichas++;
    const dir = join(ROOT, "videos", slug), st = readStatus(dir);
    const cell = (fmt) => {
      if (!fmts.includes(fmt)) return "—";
      const s = st[fmt] || {};
      const file = s.archivo || mp4Name(slug, fmt), out = outPath(file);
      if (existsSync(out)) {
        const stale = s.renderHash && s.renderHash !== renderHash(spec);
        return `${stale ? "⚠️" : "✅"} [${mp4Duration(out)?.toFixed(1)} s](${rel(out)})`;
      }
      if (s.check === false) return "❌ check";
      return s.duracion ? `⬜ (${s.duracion.toFixed(1)} s)` : "⬜";
    };
    const rendered = fmts.every((fmt) => existsSync(outPath((st[fmt] || {}).archivo || mp4Name(slug, fmt))));
    const subido = fmts.some((fmt) => subidoPath((st[fmt] || {}).archivo || mp4Name(slug, fmt)));
    if (rendered) done++;
    if (subido) subidos++;
    const ytWarns = exportYoutube(spec);
    const minis = fmts.map((fmt) => { const m = outPath(thumbName(slug, fmt)); return existsSync(m) ? `[✅](${rel(m)})` : "⬜"; }).join(" ");
    const checks = fmts.map((fmt) => (st[fmt]?.check == null ? "⬜" : st[fmt].check ? "✅" : "❌")).join(" ");
    const notas = [spec.notas, ...(ytWarns || []).map((w) => `⚠️ YouTube ${w}`)].filter(Boolean).join(" · ");
    const yt = ytWarns ? `[${ytWarns.length ? "⚠️" : "✅"}](${rel(outPath(`${slug}.youtube.txt`))})` : "⬜";
    return `| ${n} | ${titulo} | ${tipo} | ${fmts.join(", ")} | ✅ | ${ok(st.voz)} | ${cell("16x9")} | ${cell("9x16")} | ${checks} | ${yt} | ${minis} | ${ok(spec.revisado)} | ${ok(subido)} | ${notas} |`;
  });
  const md = `# Checklist — Kia, la humana de cuatro patitas

Generado automáticamente por \`node plantilla/make-video.mjs --checklist\` (no editar a mano).
La lista y su orden salen de \`guiones/guiones.csv\`; el estado, de \`guiones/<clave>.json\`, \`videos/<clave>/.pipeline.json\` y \`salida/\`.
Para aprobar un video: \`"revisado": true\` en su ficha. Subido = el .mp4 está en \`salida/subidos/\` (lo mueve el dueño del canal).
Identidad visual activa: \`${identidadActiva().id}\`.

**Terminados:** ${done} / ${items.length} · **Fichas:** ${fichas} · **Subidos:** ${subidos}${next ? ` · **Próximo:** ${next}` : ""}

| # | Video | Tipo | Formatos | Ficha | Voz | 16:9 | Short 9:16 | Check | YouTube | Miniaturas | Revisado | Subido | Notas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
${rows.join("\n")}

Leyenda: ✅ listo · ⬜ pendiente · ❌ falló · ⚠️ desactualizado (la ficha cambió después del render: volver a renderizar) · — no aplica · Duración entre paréntesis = estimada (sin render).
`;
  writeFileSync(join(ROOT, "CHECKLIST.md"), md);
  console.log(`✓ CHECKLIST.md (${done}/${items.length} terminados, ${fichas} fichas)`);
}

// ── Hojas de prueba ──────────────────────────────────────────────────────────────────────────────────────────────
function iconSheet() {
  const dir = join(ROOT, "videos", "_iconos");
  bareProject(dir, "iconos");
  const ident = identidadActiva();
  const cells = ICON_NAMES.map((n) => `<div class="c"><div class="pl">${icono(n)}</div><span>${n}</span></div>`).join("");
  writeFileSync(join(dir, "index.html"), `<!doctype html><html><head><meta charset="UTF-8"><link href="${ident.fonts}" rel="stylesheet"><style>${ident.css}
*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;background:var(--bg);overflow:hidden}#root{width:1920px;height:1080px;position:relative}
.grid{position:absolute;inset:30px;display:flex;flex-wrap:wrap;gap:16px 12px;align-content:flex-start}.c{width:170px;display:flex;flex-direction:column;align-items:center;gap:6px;font:600 22px var(--font-body);color:var(--ink)}
.pl{width:150px;height:130px;display:flex;align-items:center;justify-content:center;background:var(--cream);border-radius:20px}.pl svg{max-width:130px;max-height:115px}</style></head>
<body><div id="root" data-composition-id="main" data-start="0" data-duration="1" data-width="1920" data-height="1080"><div class="clip grid" data-start="0" data-duration="1" data-track-index="1">${cells}</div></div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><script>window.__timelines=window.__timelines||{};window.__timelines.main=gsap.timeline({paused:true});</script></body></html>`);
  rmSync(join(dir, "snapshots"), { recursive: true, force: true });
  sh(`${HF} snapshot . --at 0.5 --no-end --describe false`, dir);
  collectShots(dir);
  console.log(`· íconos (${ICON_NAMES.length}): videos/_iconos/snapshots/`);
}

function concatWavs(dir, files, out, pip = true) {
  if (pip) spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=1320:duration=0.12", "-af", "volume=0.35,apad=pad_dur=0.45", "-ar", "22050", "-ac", "1", "pip.wav"], { cwd: dir });
  const list = files.flatMap((f, i) => (pip && i > 0 ? ["file 'pip.wav'", `file '${f}'`] : [`file '${f}'`]));
  writeFileSync(join(dir, "lista.txt"), list.join("\n"));
  spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "lista.txt", "-ar", "22050", "-ac", "1", out], { cwd: dir });
}

// Prueba de pronunciación con la voz de Kia: cada palabra de pronunciacion.json "tal cual" y "ajustada".
function pronunciacion() {
  const dir = join(ROOT, "videos", "_pronunciacion");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const map = JSON.parse(readFileSync(join(HERE, "pronunciacion.json"), "utf8"));
  const only = args[args.indexOf("--pronunciacion") + 1];
  const words = Object.keys(map).filter((k) => !k.startsWith("_") && (!only || only.startsWith("--") || k.toLowerCase() === only.toLowerCase()));
  const v = vozCfg();
  const lines = words.flatMap((w, i) => [
    { id: `${String(i).padStart(2, "0")}a`, text: `Tal cual: para mí soy ${w}.` },
    { id: `${String(i).padStart(2, "0")}b`, text: `Ajustada: para mí soy ${map[w]}.` },
  ]);
  if (piper(dir, { voice: v.voice, pitch: v.pitch, speed: v.speed, lines }).status !== 0) throw new Error("piper falló");
  const all = [];
  words.forEach((w, i) => {
    const n = String(i).padStart(2, "0"), out = `${w.replace(/[^\w]/g, "_")}.wav`;
    concatWavs(dir, [`assets/voice/${n}a.wav`, `assets/voice/${n}b.wav`], out);
    all.push(out);
  });
  concatWavs(dir, all, "todas.wav");
  console.log(`✓ videos/_pronunciacion/ — ${words.length} palabras (todas.wav + una por palabra: primero tal cual, después ajustada)`);
}

// Muestras de voz para elegir tono (P) y velocidad (S) de oído.
function vozMuestras() {
  const dir = join(ROOT, "videos", "_voz");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const frase = "¡Hola! Soy Kia. Mi hermano dice que soy una perra bulldog francés, pero yo no lo entiendo.";
  const files = [];
  for (const P of [1.06, 1.10, 1.14]) for (const S of [1.05, 1.12]) {
    const sub = join(dir, `p${P}-s${S}`);
    mkdirSync(sub, { recursive: true });
    if (piper(sub, { voice: vozCfg().voice, pitch: P, speed: S, lines: [{ id: "m", text: vozText(frase) }] }).status !== 0) throw new Error("piper falló");
    const name = `pitch-${P.toFixed(2)}_speed-${S.toFixed(2)}.wav`;
    copyFileSync(join(sub, "assets", "voice", "m.wav"), join(dir, name));
    rmSync(sub, { recursive: true, force: true });
    files.push(name);
  }
  concatWavs(dir, files, "todas.wav");
  writeFileSync(join(dir, "ORDEN.txt"), `todas.wav = estas 6, en este orden, separadas por un pip:\n${files.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n`);
  console.log(`✓ videos/_voz/ — ${files.length} muestras + todas.wav (orden en ORDEN.txt)`);
}

// Demo de todos los kinds, en los dos formatos (sin voz: duración = min).
function kit() {
  const spec = JSON.parse(readFileSync(join(HERE, "kit-demo.json"), "utf8"));
  for (const fmt of ["16x9", "9x16"]) {
    const dir = join(ROOT, "videos", "_kit", fmt);
    bareProject(dir, `kit-${fmt}`);
    const b = buildIndex({ dir, spec, fmt });
    console.log(`✓ kit ${fmt} — ${b.frames.length} escenas (${b.frames.map((f) => f.kind).join(", ")}), ${b.total}s`);
    b.warnings.filter((w) => !w.includes("sin voz")).forEach((w) => console.log(`  ⚠ ${w}`));
    if (!has("--no-check")) sh(`${HF} check`, dir);
    snapshots(dir, b);
    console.log(`· contact sheet: videos/_kit/${fmt}/snapshots/contact-sheet.jpg`);
  }
}

// ── Video ────────────────────────────────────────────────────────────────────────────────────────────────────────
function main() {
  if (has("--checklist") && !slug) return checklist();
  if (has("--pronunciacion")) return pronunciacion();
  if (has("--voz-muestras")) return vozMuestras();
  if (has("--iconos")) return iconSheet();
  if (has("--kit")) return kit();
  if (!slug) {
    console.error("uso: node plantilla/make-video.mjs <slug> [--render | --miniatura | --info] [--formato=16x9|9x16|todos] | --checklist | --kit | --iconos | --pronunciacion | --voz-muestras");
    process.exit(1);
  }
  if (has("--info")) {
    const row = readCsv().find((r) => r.clave === slug);
    if (!row) throw new Error(`${slug} no está en guiones/guiones.csv`);
    const specPath = join(ROOT, "guiones", `${slug}.json`);
    return console.log(JSON.stringify({ ...row, ficha: existsSync(specPath) ? `guiones/${slug}.json` : null }, null, 2));
  }
  const specPath = join(ROOT, "guiones", `${slug}.json`);
  if (!existsSync(specPath)) throw new Error(`no existe ${specPath}`);
  const spec = JSON.parse(readFileSync(specPath, "utf8"));
  if (spec.slug !== slug) throw new Error(`la ficha dice slug "${spec.slug}" y el archivo es ${slug}.json`);
  const dir = join(ROOT, "videos", slug);
  mkdirSync(dir, { recursive: true });
  const fArg = optEq("--formato");
  const fmts = !fArg ? specFormats(spec) : fArg === "todos" ? ["16x9", "9x16"] : [fArg];
  fmts.forEach((f) => { if (!FORMATOS[f]) throw new Error(`formato desconocido "${f}"`); });
  const pref = optEq("--prefijo");

  if (has("--miniatura")) {
    for (const fmt of fmts) writeFmtStatus(dir, fmt, { miniatura: miniatura(dir, spec, fmt) });
    return checklist();
  }
  writeFileSync(join(dir, "ficha.json"), JSON.stringify(spec, null, 2));
  const vozOk = tts(dir, spec);
  writeStatus(dir, { voz: vozOk });
  if (!vozOk) throw new Error("la generación de voz falló");
  const meta = JSON.parse(readFileSync(join(dir, "audio_engine_meta.json"), "utf8"));
  writeFileSync(join(dir, "SCRIPT.md"), `# SCRIPT — ${spec.slug}\n\n**Voz:** ${meta.voice_id} · pitch ${meta.pitch} · speed ${meta.speed} (Kia, primera persona, rioplatense)\n${spec.frames.filter((f) => f.vo).map((f, i) => `\n## ${f.id || String(i + 1).padStart(2, "0")} — ${f.kind || "escena"}${f.short ? " · short" : ""}\n\n    ${f.vo}\n`).join("")}`);

  for (const fmt of fmts) {
    const pdir = join(dir, fmt);
    if (!existsSync(join(pdir, "hyperframes.json"))) bareProject(pdir, `${slug}-${fmt}`);
    copyFileSync(join(HERE, "identidad", `${identidadActiva().id}.frame.md`), join(pdir, "frame.md"));
    // la voz se genera una sola vez y se copia a cada formato (cada proyecto HyperFrames es autónomo)
    rmSync(join(pdir, "assets", "voice"), { recursive: true, force: true });
    cpSync(join(dir, "assets", "voice"), join(pdir, "assets", "voice"), { recursive: true });
    const b = buildIndex({ dir: pdir, spec, meta, fmt });
    const ids = framesFor(spec, fmt).map((f) => f.id);
    console.log(`✓ ${fmt}: index.html — ${b.frames.length} escenas (${ids.join(" ")}), ${b.total}s, voces ${b.voices}, música ${b.music ? "sí" : "no"}, sfx ${b.sfx}`);
    if (fmt === "9x16" && b.total > 60) console.log(`  ⚠ el Short dura ${b.total}s (objetivo ≤ 60 s): sacá escenas o acortalas`);
    b.warnings.forEach((w) => console.log(`  ⚠ ${w}`));
    writeFmtStatus(dir, fmt, { composicion: true, duracion: b.total });
    if (!has("--no-check")) writeFmtStatus(dir, fmt, { check: sh(`${HF} check`, pdir).status === 0 });
    if (!has("--no-snapshot")) { snapshots(pdir, b); console.log(`· contact sheet: videos/${slug}/${fmt}/snapshots/contact-sheet.jpg`); }
    writeFmtStatus(dir, fmt, { miniatura: miniatura(dir, spec, fmt) });
    if (has("--render")) {
      const r = sh(`${HF} render --quality high --output renders/video.mp4`, pdir);
      if (r.status !== 0) throw new Error(`render ${fmt} falló`);
      const file = mp4Name(slug, fmt, pref);
      mkdirSync(join(ROOT, "salida"), { recursive: true });
      copyFileSync(join(pdir, "renders", "video.mp4"), outPath(file));
      writeFmtStatus(dir, fmt, { renderizado: today(), renderHash: renderHash(spec), archivo: file });
      console.log(`✓ ${rel(outPath(file))}`);
    }
  }
  checklist();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
