// Arma el index.html de un proyecto HyperFrames desde una ficha (guiones/<slug>.json) para UN formato.
//   buildIndex({ dir, spec, meta, fmt: "16x9" | "9x16", thumb, voiceDir })
// La llama make-video.mjs (un proyecto por formato: videos/<slug>/16x9/ y videos/<slug>/9x16/), pose-lab.mjs y --kit.
//
// Kit de escenas (frames[].kind): hook · escena · ranking · dormir · cierre (ver plantilla/README.md).
// Todo lo que se mueve tiene tiempos relativos a la escena (`at` en segundos o `cue` = palabra de la voz).
// Duración de la escena = máx(min, voz + VO_LEAD + TAIL, última animación + 0,45 s); los loops "until: end"
// (Kia caminando, la pelota que rebota, los Zzz) se expanden DESPUÉS de medir la voz: no alargan la escena.
// Cada ficha y cada objeto de la ficha aceptan claves "16x9": {…} y "9x16": {…} que pisan lo de arriba en ese formato.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { KIA_COLORS, KIA_POS_KEYS, kiaAnchor, kiaPose, kiaRig } from "./kia.mjs";
import { HUMANOS, humanoRig } from "./humanos.mjs";
import { ICONOS, icono, iconoG } from "./iconos.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const VO_LEAD = 0.25; // la voz arranca esto después de que abre la escena
const TAIL = 0.55; // aire después de la voz
export const KINDS = ["hook", "escena", "ranking", "dormir", "cierre"];

// Medidas por formato. Escenario: piso en y = floorY, x = 0 en sx; las unidades del escenario se escalan por ss.
export const FORMATOS = {
  "16x9": { W: 1920, H: 1080, floorY: 850, sx: 960, ss: 1.2, cx: 960, cartelTop: 128, cartelW: 1560, safeL: 60, safeR: 60 },
  "9x16": { W: 1080, H: 1920, floorY: 1440, sx: 500, ss: 1.35, cx: 500, cartelTop: 290, cartelW: 880, subTop: 1590, safeL: 60, safeR: 140 },
};
export const SFX_VOL = { ladrido: 0.4, "ladrido-doble": 0.4, ronquido: 0.35, boing: 0.45, pop: 0.45, whoosh: 0.4, bostezo: 0.5, campanita: 0.45, mordisco: 0.55 };

export function identidadActiva(override) {
  const id = override || process.env.IDENTIDAD || readFileSync(join(HERE, "identidad", "activa.txt"), "utf8").trim();
  const file = join(HERE, "identidad", `${id}.css`);
  if (!existsSync(file)) throw new Error(`identidad desconocida "${id}" (ver plantilla/identidad/)`);
  const css = readFileSync(file, "utf8");
  return { id, css, fonts: (css.match(/fonts:\s*(\S+)/) || [])[1] };
}
export const defaults = () => JSON.parse(readFileSync(join(HERE, "defaults.json"), "utf8"));

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
export const plain = (s) => String(s ?? "").replace(/\*\*/g, "");
const norm = (s) => plain(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const r3 = (v) => +(+v).toFixed(3);

// Objeto con overrides por formato → objeto del formato pedido.
export function pick(o, fmt) {
  if (!o || typeof o !== "object" || Array.isArray(o)) return o;
  const { "16x9": a, "9x16": b, ...rest } = o;
  return { ...rest, ...((fmt === "16x9" ? a : b) || {}) };
}
// Escenas que van en cada formato: si la ficha sale en los dos, el 9:16 usa solo las "short": true.
export function framesFor(spec, fmt) {
  const fmts = spec.formatos || ["16x9"];
  const all = spec.frames.map((f, i) => ({ ...f, id: f.id || String(i + 1).padStart(2, "0") }));
  if (fmt !== "9x16") return all.filter((f) => f.solo !== "9x16");
  return fmts.includes("16x9") ? all.filter((f) => f.short === true) : all.filter((f) => f.short !== false);
}

// ── Kia: moves de la ficha → tweens explícitos ────────────────────────────────────────────────────────────────────
// { to: "POSE", at, dur, ease, set }  transición · { cut: "POSE", at, set } corte (o vista distinta)
// { set: {x: 200}, at, dur } solo claves sueltas · { seq: [["A", 0.3], ["B", 0.3]], at, until: "end" | t, count }
// { loop: ["A", "B"], step, at, until, count } · entra: "salto" | "salto-der" | "pop" | "abajo" (en kia.entra)
function expandSeqs(moves, frameDur) {
  const out = [];
  for (const m of moves) {
    if (m.seq || m.loop) {
      if (m.until === "end" && frameDur == null) continue; // todavía sin duración: no alarga la escena
      const seq = m.seq || m.loop.map((k) => [k, m.step || 0.35]);
      const end = m.until === "end" ? frameDur - 0.1 : m.until ?? Infinity, count = m.count ?? (m.until == null ? 1 : Infinity);
      let t = m.at || 0, i = 0, n = 0;
      while (n < count) {
        const [pose, dur] = seq[i % seq.length];
        if (t + dur > end + 1e-6) break;
        out.push({ pose, at: r3(t), dur, ease: m.ease || "sine.inOut", set: m.set });
        t += dur; i++;
        if (i % seq.length === 0) n++;
        if (i > 2000) break;
      }
    } else out.push({ ...m, pose: m.to || m.cut, cut: !!m.cut });
  }
  return out;
}
function entrance(k, init) {
  const e = typeof k.entra === "string" ? { tipo: k.entra } : k.entra;
  if (!e) return [];
  const at = e.at ?? 0.05, dur = e.dur ?? 0.7, t = e.tipo;
  if (t === "pop") { const sc = init.sc; init.sc = 0.01; return [{ set: { sc }, at, dur: 0.5, ease: "back.out(1.8)" }]; }
  if (t === "abajo") { const y = init.y; init.y = y + 500; return [{ set: { y }, at, dur, ease: "back.out(1.4)" }]; }
  if (t === "salto" || t === "salto-der" || t === "salto-izq") {
    const dir = t === "salto-der" ? 1 : -1, x = init.x;
    init.x = x + dir * (e.dist ?? 900);
    return [
      { set: { x }, at, dur, ease: "power1.out" },
      { set: { jy: -(e.alto ?? 170) }, at, dur: dur / 2, ease: "power2.out" },
      { set: { jy: 0 }, at: r3(at + dur / 2), dur: dur / 2, ease: "power2.in" },
      { set: { sq: 0.84 }, at: r3(at + dur), dur: 0.09, ease: "power1.out" },
      { set: { sq: 1 }, at: r3(at + dur + 0.09), dur: 0.3, ease: "back.out(3)" },
    ];
  }
  if (t === "izq" || t === "der") { const x = init.x; init.x = x + (t === "der" ? 900 : -900); return [{ set: { x }, at, dur, ease: "power2.out" }]; }
  return [];
}
function kiaTweens(init, simple, warn) {
  const cur = { ...init }, tweens = [], cuts = [];
  const list = [...simple].sort((a, b) => (a.at || 0) - (b.at || 0));
  for (const m of list) {
    const tgt = {};
    if (m.pose) {
      const p = kiaPose(m.pose, warn);
      for (const k in p) if (!KIA_POS_KEYS.includes(k)) tgt[k] = p[k];
    }
    Object.assign(tgt, m.set || {});
    const isCut = m.cut || (tgt.v != null && Math.round(tgt.v) !== Math.round(cur.v));
    const from = {}, to = {};
    for (const k in tgt) if (tgt[k] !== cur[k]) { from[k] = cur[k]; to[k] = tgt[k]; cur[k] = tgt[k]; }
    if (isCut) cuts.push(r3(m.at || 0));
    if (Object.keys(to).length) tweens.push({ t: r3(isCut ? (m.at || 0) + 0.12 : m.at || 0), dur: isCut ? 0.01 : m.dur ?? 0.4, ease: isCut ? "none" : m.ease, from, to });
  }
  return { tweens, cuts, final: cur };
}
// Estado de Kia en el instante t (para ubicar Zzz, globos…): init + todos los tweens que ya empezaron.
function kiaStateAt(init, tweens, t) {
  const s = { ...init };
  for (const m of tweens) if (m.t <= t + 1e-6) Object.assign(s, m.to);
  return s;
}

// ── Tipos de objetos del escenario ───────────────────────────────────────────────────────────────────────────────
const PROP_DEF = {
  puerta: { size: 230, z: "atras" }, sombra: { size: 620, z: "atras" }, mesada: { size: 560, z: "atras" }, pantalla: { size: 340, z: "atras" },
  almohadon: { size: 380, z: "atras" }, marco: { size: 300 }, suscribite: { size: 460 }, guau: { size: 300 }, olla: { size: 160, z: "atras" },
  pelota: { size: 90 }, polvo: { size: 160 }, camara: { size: 150 }, joystick: { size: 180 }, nube: { size: 200 }, velocidad: { size: 160 },
};

// ── Una escena: HTML del texto, escenario SVG, animaciones ────────────────────────────────────────────────────────
function scene(f, ctx) {
  const { fmt, F, warn } = ctx;
  const anims = [], loops = [], sfx = [];
  let n = 0;
  const uid = (p) => `${p}-${f.id}-${n++}`;
  const v = ctx.voice;
  const at = (item, def) => {
    if (item && typeof item === "object") {
      if (item.at != null) return item.at;
      if (item.cue) {
        const i = norm(f.vo).indexOf(norm(item.cue));
        if (i < 0) warn(`escena ${f.id}: cue "${item.cue}" no aparece en la voz`);
        else if (v) return r3(VO_LEAD + (v.duration_s * i) / norm(f.vo).length - 0.1);
      }
    }
    return def;
  };
  const push = (sel, t, fx, extra = {}) => anims.push({ sel, at: r3(t), fx, ...extra });
  const visL = (-F.sx + F.safeL) / F.ss, visR = (F.W - F.sx - F.safeR) / F.ss; // borde visible del escenario (unidades)

  // ── Kia ──
  let kia = null, kiaInit = null, kiaSimple = [];
  const kspec = f.kia === false ? null : pick(f.kia || {}, fmt);
  if (kspec) {
    const basePose = kspec.pose || (f.kind === "dormir" ? "DORMIDA" : "SENTADA");
    kiaInit = { ...kiaPose(basePose, (w) => warn(`escena ${f.id}: ${w}`)), ...(kspec.set || {}), x: kspec.x ?? 0, y: kspec.y ?? 0, sc: kspec.sc ?? 1, fx: kspec.fx ?? 1 };
    const ent = entrance(kspec, kiaInit);
    kiaSimple = [...ent, ...(kspec.moves || []).map((m) => pick(m, fmt))];
    kia = { spec: kspec };
  }

  // ── objetos (props) ──
  const back = [], front = [], humanos = [], correas = [];
  const props = (f.props || []).map((p) => pick(p, fmt));
  props.forEach((p) => {
    if (p.tipo === "humano") {
      const D = HUMANOS[p.quien];
      if (!D) warn(`escena ${f.id}: humano desconocido "${p.quien}" (hermano, papa, mama)`);
      const init = { x: (p.pos || [0, 0])[0], y: (p.pos || [0, 0])[1], fx: p.fx ?? 1, wp: 0, ma: p.ma ?? 0 };
      const moves = [];
      let cx = init.x, cy = init.y;
      (p.mov || []).forEach((m) => { moves.push({ t: m.at || 0, dur: m.dur ?? 1, ease: m.ease || "power1.inOut", from: { x: cx, y: cy }, to: { x: m.pos[0], y: m.pos[1] } }); cx = m.pos[0]; cy = m.pos[1]; });
      humanos.push({ quien: p.quien, init, tweens: moves, camina: p.camina, id: humanos.length });
      return;
    }
    if (p.tipo === "correa") { correas.push({ a: p.a, sag: p.sag, color: p.color }); return; }
    if (!ICONOS[p.tipo]) { warn(`escena ${f.id}: objeto desconocido "${p.tipo}" (ver --iconos)`); return; }
    const def = PROP_DEF[p.tipo] || {};
    const size = p.size ?? def.size ?? 120;
    const ic = iconoG(p.tipo, size);
    const pos = p.pos || [0, -200];
    const pid = uid("p"), mid = `${pid}m`;
    const origin = ic.base ? "50% 100%" : "50% 50%";
    const hidden = p.at != null && p.entra !== "nada";
    const tr = `translate(${pos[0]},${pos[1]})${p.rot ? ` rotate(${p.rot})` : ""}${p.flip ? " scale(-1,1)" : ""}${p.op != null ? "" : ""}`;
    const g = `<g transform="${tr}"${p.op != null ? ` opacity="${p.op}"` : ""}><g id="${mid}"><g id="${pid}"${hidden ? ' class="a-in"' : ""}>${ic.svg}</g></g></g>`;
    (p.z || def.z) === "atras" ? back.push(g) : front.push(g);
    if (hidden) {
      const t0 = at(p, 0.3), e = p.entra || "pop";
      if (e === "cae") push(`#${pid}`, t0, "tween", { from: { y: -(p.alto ?? 900), opacity: 1 }, to: { y: 0, opacity: 1 }, dur: p.dur ?? 0.8, ease: "bounce.out" });
      else if (e === "izq" || e === "der") push(`#${pid}`, t0, "tween", { from: { x: e === "izq" ? -1100 : 1100, opacity: 1 }, to: { x: 0, opacity: 1 }, dur: p.dur ?? 0.6, ease: "power2.out" });
      else if (e === "sube") push(`#${pid}`, t0, "up");
      else if (e === "fade") push(`#${pid}`, t0, "fade");
      else push(`#${pid}`, t0, "pop", { origin });
    }
    let cx = 0, cy = 0, cr = 0, cs = 1;
    (p.mov || []).forEach((m) => {
      const to = {}, from = {};
      if (m.pos) { from.x = cx; from.y = cy; to.x = m.pos[0] - pos[0]; to.y = m.pos[1] - pos[1]; cx = to.x; cy = to.y; }
      if (m.rot != null) { from.rotation = cr; to.rotation = m.rot; cr = m.rot; }
      if (m.sc != null) { from.scale = cs; to.scale = m.sc; cs = m.sc; }
      push(`#${mid}`, at(m, 0), "tween", { from, to, dur: m.dur ?? 0.6, ease: m.ease || "power1.inOut", origin });
    });
    if (p.out != null) push(`#${mid}`, p.out, "out", { dur: 0.25 });
    if (p.loop) loops.push({ sel: `#${pid}`, at: p.loopAt ?? (hidden ? at(p, 0.3) + 0.6 : 0.2), fx: p.loop, origin, alto: p.alto });
  });

  // ── Kia: tweens provisorios (sin loops "until end") para saber dónde está en cada momento ──
  let kt = kia ? kiaTweens(kiaInit, expandSeqs(kiaSimple, null), warn) : null;

  // ── efectos pegados a Kia (siguen sus x/y) y globos de diálogo ──
  const kfx = [];
  const anchorAt = (t, name) => {
    if (!kia) return { x: 0, y: -300 };
    const s = kiaStateAt(kiaInit, kt.tweens, t);
    return kiaAnchor({ ...s, x: kiaInit.x, y: kiaInit.y }, name);
  };
  (f.efectos || []).map((e) => pick(typeof e === "string" ? { tipo: e } : e, fmt)).forEach((e) => {
    const t0 = at(e, 0.3);
    const fxDir = kia ? kiaStateAt(kiaInit, kt.tweens, t0).fx : 1;
    const ah = anchorAt(t0, "cabeza");
    const base = e.pos || (e.tipo === "velocidad" ? [ah.x - fxDir * 260, (kiaInit?.y ?? 0) - 150] : [ah.x + (e.dx ?? 0), ah.y + (e.dy ?? 0)]);
    const gid = uid("fx");
    if (e.tipo === "zzz" || e.tipo === "corazones" || e.tipo === "notas") {
      const name = e.tipo === "zzz" ? "z-letra" : e.tipo === "corazones" ? "corazon" : "nota";
      const cnt = e.n ?? 3, size = e.size ?? (e.tipo === "zzz" ? 70 : 64);
      let html = "";
      for (let i = 0; i < cnt; i++) {
        const id = `${gid}-${i}`;
        html += `<g transform="translate(${base[0] + (e.tipo === "zzz" ? 30 : (i - 1) * 50)},${base[1]})"><g id="${id}" class="a-in">${iconoG(name, size * (e.tipo === "zzz" ? 1 - i * 0.15 : 1)).svg}</g></g>`;
        loops.push({ sel: `#${id}`, at: t0 + i * (e.periodo ?? 1.5) / cnt, fx: "sube", periodo: e.periodo ?? 1.5, dx: e.tipo === "zzz" ? 70 : (i - 1) * 20, alto: e.alto ?? 170 });
      }
      kfx.push(`<g id="${gid}">${html}</g>`);
    } else if (e.tipo === "velocidad") {
      kfx.push(`<g transform="translate(${base[0]},${base[1]})${fxDir < 0 ? " scale(-1,1)" : ""}"><g id="${gid}" class="a-in">${iconoG("velocidad", e.size ?? 200).svg}</g></g>`);
      push(`#${gid}`, t0, "fade", { dur: 0.15 });
      loops.push({ sel: `#${gid}`, at: t0 + 0.2, fx: "parpadea" });
      if (e.out != null) push(`#${gid}`, e.out, "out");
    } else if (e.tipo === "estrellas") {
      let html = "";
      [[-1, -1], [1, -1], [-1.3, 0.2], [1.3, 0.2]].forEach(([dx, dy], i) => {
        const id = `${gid}-${i}`;
        html += `<g transform="translate(${base[0]},${base[1] + 60})"><g id="${id}" class="a-in">${iconoG("estrella", 54).svg}</g></g>`;
        push(`#${id}`, t0, "tween", { from: { x: 0, y: 0, opacity: 1, scale: 0.3 }, to: { x: dx * 130, y: dy * 110, opacity: 1, scale: 1 }, dur: 0.45, ease: "power2.out", origin: "50% 50%" });
        push(`#${id}`, t0 + 0.75, "out", { dur: 0.3 });
      });
      kfx.push(html);
    } else {
      const name = { pregunta: "pregunta", exclamacion: "exclamacion", sudor: "gota", corazon: "corazon", idea: "estrella" }[e.tipo] || e.tipo;
      if (!ICONOS[name]) { warn(`escena ${f.id}: efecto desconocido "${e.tipo}"`); return; }
      const p0 = e.pos || (e.tipo === "sudor" ? [ah.x - fxDir * 70, ah.y + 70] : [ah.x + fxDir * (e.dx ?? 60), ah.y + (e.dy ?? -20)]);
      kfx.push(`<g transform="translate(${p0[0]},${p0[1]})"><g id="${gid}" class="a-in">${iconoG(name, e.size ?? 90).svg}</g></g>`);
      push(`#${gid}`, t0, "pop", { origin: "50% 50%" });
      loops.push({ sel: `#${gid}`, at: t0 + 0.55, fx: e.tipo === "sudor" ? "gotea" : "flota" });
      if (e.out != null) push(`#${gid}`, e.out, "out");
    }
  });
  (f.globos || []).map((g0) => pick(typeof g0 === "string" ? { texto: g0 } : g0, fmt)).forEach((g0) => {
    const t0 = at(g0, 0.4), st = kia ? kiaStateAt(kiaInit, kt.tweens, t0) : { fx: 1 };
    const fs = g0.tam ?? 70, txt = String(g0.texto), w = Math.round(70 + fs * 0.62 * [...txt].length), h = Math.round(fs * 1.7);
    const ab = anchorAt(t0, "boca");
    let side = g0.lado ?? (st.fx >= 0 ? 1 : -1);
    let cx = g0.pos ? g0.pos[0] : ab.x + side * (w / 2 + 60);
    const cy = g0.pos ? g0.pos[1] : ab.y - h / 2 - 150;
    if (cx + w / 2 > visR) cx = visR - w / 2;
    if (cx - w / 2 < visL) cx = visL + w / 2;
    const tailX = Math.max(-w / 2 + 40, Math.min(w / 2 - 40, ab.x - cx)) * 0.6;
    const gid = uid("globo");
    const path = `M ${-w / 2 + 30} ${-h / 2} L ${w / 2 - 30} ${-h / 2} Q ${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 30} L ${w / 2} ${h / 2 - 30} Q ${w / 2} ${h / 2} ${w / 2 - 30} ${h / 2} L ${tailX + 24} ${h / 2} L ${tailX - 6} ${h / 2 + 44} L ${tailX - 22} ${h / 2} L ${-w / 2 + 30} ${h / 2} Q ${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 30} L ${-w / 2} ${-h / 2 + 30} Q ${-w / 2} ${-h / 2} ${-w / 2 + 30} ${-h / 2} Z`;
    kfx.push(`<g transform="translate(${r3(cx)},${r3(cy)})"><g id="${gid}" class="a-in"><path d="${path}" fill="#FFFFFF" stroke="${KIA_COLORS.line}" stroke-width="7" stroke-linejoin="round"/><text x="0" y="${r3(fs * 0.36)}" text-anchor="middle" font-size="${fs}" font-family="var(--font-display)" font-weight="700" fill="${KIA_COLORS.line}">${esc(txt)}</text></g></g>`);
    push(`#${gid}`, t0, "pop", { origin: "50% 100%", dur: 0.35 });
    if (g0.sacude) loops.push({ sel: `#${gid}`, at: t0 + 0.4, fx: "sacude", origin: "50% 100%" });
    if (g0.out != null) push(`#${gid}`, g0.out, "out", { dur: 0.2 });
  });

  // ── texto (HTML) ──
  let text = "";
  const cartel = (c, cls = "") => {
    c = pick(typeof c === "string" ? { texto: c } : c, fmt);
    const id = uid("cartel");
    push(`#${id}`, at(c, f.kind === "dormir" ? 0.05 : 0.3), "pop", { origin: "50% 50%", dur: 0.4 });
    if (c.out != null) push(`#${id}`, c.out, "out", { dur: 0.2 });
    const num = c.numero != null ? `<span class="num">${esc(c.numero)}</span>` : "";
    const ic = c.icono ? icono(c.icono) : "";
    // tamaño de letra estimado para que entre en una línea (Fredoka 700 ≈ 0,64 em por carácter en mayúsculas)
    const base = c.chico ? 60 : fmt === "16x9" ? 92 : 84, chars = [...plain(c.texto)].length;
    const extra = (num ? 1.6 : 0) + (ic ? 1.3 : 0);
    const fs = Math.min(base, Math.floor((F.cartelW - 120) / (0.64 * chars + extra)));
    return `<div id="${id}" class="cartel a-in ${cls} ${c.chico ? "chico" : ""}" style="font-size:${fs}px" data-fit="${F.cartelW}">${num}${ic}<span>${rich(c.texto)}</span></div>`;
  };
  if (f.kind === "hook") {
    const t = pick(f.titulo || {}, fmt);
    const ids = [uid("tt"), uid("tb"), uid("tl")];
    push(`#${ids[0]}`, at(t, 0.5), "pop", { origin: fmt === "16x9" ? "0% 60%" : "50% 60%", dur: 0.55 });
    push(`#${ids[1]}`, at({ at: t.bajadaAt }, 1.0), "up");
    push(`#${ids[2]}`, at({ at: t.lineaAt }, 1.4), "up");
    const fitW = fmt === "16x9" ? 960 : 880, org = fmt === "16x9" ? "0 0" : "50% 0";
    text += `<div class="titulo ${t.mini ? "mini" : ""}"${t.top != null ? ` style="top:${t.top}px"` : ""}><div id="${ids[0]}" class="t a-in">${esc(t.texto ?? "KIA")}</div>${t.bajada ? `<div id="${ids[1]}" class="b a-in" data-fit="${fitW}" data-fit-origin="${org}">${rich(t.bajada)}</div>` : ""}${t.linea ? `<div id="${ids[2]}" class="l a-in" data-fit="${fitW}" data-fit-origin="${org}">${rich(t.linea)}</div>` : ""}</div>`;
  }
  if (f.kind === "ranking") {
    const rid = uid("rank");
    push(`#${rid}`, at(f.rankingAt != null ? { at: f.rankingAt } : null, 0.3), "pop", { origin: "50% 0%" });
    const items = f.items || [];
    const nVac = f.vacios ?? Math.max(0, 3 - items.length);
    const rows = items.map((it, i) => {
      const iid = uid("ri");
      push(`#${iid}`, at(it, 1.0 + i * 0.6), "left");
      return `<div id="${iid}" class="it a-in"><span class="num">${i + 1}</span><span>${rich(typeof it === "object" ? it.text : it)}</span></div>`;
    }).concat(Array.from({ length: nVac }, (_, j) => `<div class="it"><span class="num">${items.length + j + 1}</span><span class="ph"></span></div>`));
    text += `<div class="cartel-wrap"><div id="${rid}" class="ranking a-in"><div class="hd">${esc(f.titulo ?? "EN ORDEN DE IMPORTANCIA")}</div>${rows.join("")}</div></div>`;
  }
  const carteles = [];
  if (f.kind === "dormir") carteles.push(cartel({ texto: "DORMIR", icono: "huella", numero: f.numero, ...(typeof f.cartel === "object" ? f.cartel : {}) }, "dormir"));
  else if (f.cartel) (Array.isArray(f.cartel) ? f.cartel : [f.cartel]).forEach((c) => carteles.push(cartel(c)));
  if (carteles.length) text += `<div class="cartel-wrap">${carteles.join("")}</div>`;

  // ── defaults de cada kind ──
  if (f.kind === "dormir" && !(f.efectos || []).length) {
    const ah = anchorAt(0.3, "cabeza");
    const gid = uid("fx");
    let html = "";
    for (let i = 0; i < 3; i++) {
      const id = `${gid}-${i}`;
      html += `<g transform="translate(${ah.x + 30},${ah.y})"><g id="${id}" class="a-in">${iconoG("z-letra", 70 * (1 - i * 0.15)).svg}</g></g>`;
      loops.push({ sel: `#${id}`, at: 0.25 + i * 0.4, fx: "sube", periodo: 1.2, dx: 70, alto: 170 });
    }
    kfx.push(html);
  }
  if (f.kind === "dormir" && f.ronquido !== false) sfx.push({ id: "ronquido", at: 0.3 });
  (f.sfx || []).forEach((s) => sfx.push(typeof s === "string" ? { id: s, at: 0.3 } : { ...s, at: at(s, 0.3) }));

  return { text, back, front, kfx, anims, loops, sfx, kia, kiaInit, kiaSimple, kt, humanos, correas };
}

// loops de objetos/efectos, ya con la duración de la escena
function expandLoops(loops, dur) {
  const out = [];
  for (const l of loops) {
    const end = dur - 0.15, t0 = l.at;
    if (t0 >= end) continue;
    if (l.fx === "rebota") {
      const hgt = l.alto ?? 160, half = 0.32;
      for (let t = t0; t + 2 * half <= end; t += 2 * half) {
        out.push({ sel: l.sel, at: r3(t), fx: "tween", from: { y: 0 }, to: { y: -hgt }, dur: half, ease: "power2.out" });
        out.push({ sel: l.sel, at: r3(t + half), fx: "tween", from: { y: -hgt }, to: { y: 0 }, dur: half, ease: "power2.in" });
      }
    } else if (l.fx === "sube") {
      const P = l.periodo ?? 1.5;
      for (let t = t0; t + P <= end + 0.3; t += P) {
        out.push({ sel: l.sel, at: r3(t), fx: "tween", from: { x: 0, y: 0, opacity: 0, scale: 0.5 }, to: { x: l.dx * 0.5, y: -l.alto * 0.5, opacity: 1, scale: 0.85 }, dur: P / 2, ease: "sine.out", origin: "50% 50%" });
        out.push({ sel: l.sel, at: r3(t + P / 2), fx: "tween", from: { x: l.dx * 0.5, y: -l.alto * 0.5, opacity: 1, scale: 0.85 }, to: { x: l.dx, y: -l.alto, opacity: 0, scale: 1.1 }, dur: P / 2, ease: "sine.in", origin: "50% 50%" });
      }
    } else {
      const spec = {
        flota: { from: { y: 0 }, to: { y: -16 }, half: 0.9, ease: "sine.inOut" },
        late: { from: { scale: 1 }, to: { scale: 1.12 }, half: 0.32, ease: "sine.inOut" },
        sacude: { from: { rotation: -7 }, to: { rotation: 7 }, half: 0.12, ease: "sine.inOut" },
        gira: { from: { rotation: 0 }, to: { rotation: 360 }, half: 1.0, ease: "none", noyoyo: true },
        parpadea: { from: { opacity: 1 }, to: { opacity: 0.35 }, half: 0.14, ease: "none" },
        gotea: { from: { y: 0, opacity: 1 }, to: { y: 50, opacity: 0 }, half: 0.8, ease: "power1.in", noyoyo: true },
        tiembla: { from: { x: -4 }, to: { x: 4 }, half: 0.06, ease: "none" },
      }[l.fx];
      if (!spec) continue;
      const reps = Math.floor((end - t0) / spec.half) - 1;
      if (reps < 1) continue;
      out.push({ sel: l.sel, at: r3(t0), fx: "tween", from: spec.from, to: spec.to, dur: spec.half, ease: spec.ease, repeat: reps, yoyo: !spec.noyoyo, origin: l.origin || "50% 50%" });
    }
  }
  return out;
}

export const THUMB_MIN = 2.6;

export function buildIndex({ dir, spec, meta, fmt = "16x9", thumb = false, identidad, frames: framesIn }) {
  const P = resolve(dir);
  const F = FORMATOS[fmt];
  if (!F) throw new Error(`formato desconocido "${fmt}" (16x9 | 9x16)`);
  const voice = Object.fromEntries(((meta || {}).voices || []).map((x) => [x.id, x]));
  const warnings = [];
  const warn = (w) => { if (!warnings.includes(w)) warnings.push(w); };
  const ident = identidadActiva(identidad);
  const D = defaults();

  let frames = (framesIn || framesFor(spec, fmt)).map((f) => ({ ...pick(f, fmt), kind: f.kind || "escena" }));
  frames.forEach((f) => { if (!KINDS.includes(f.kind)) throw new Error(`escena ${f.id}: kind desconocido "${f.kind}" (${KINDS.join(", ")})`); });
  if (thumb) {
    const mini = pick(spec.miniatura || {}, fmt);
    const e = mini.escena;
    const base = typeof e === "number" ? frames.find((f) => f.id === String(e).padStart(2, "0")) || frames[0] : frames.find((f) => f.id === e || f.kind === (e || "hook")) || frames[0];
    const { escena, ...over } = mini;
    frames = [{ ...base, ...over, id: "mini", min: Math.max(THUMB_MIN, over.min ?? 0), sfx: [], ronquido: false }];
  }

  // 1) escenas  2) duraciones  3) loops "until end"
  let t = 0;
  for (const f of frames) {
    const v = thumb ? undefined : voice[f.id];
    if (!v && !thumb && f.vo) warn(`escena ${f.id}: sin voz generada`);
    if (!thumb && plain(f.sub ?? f.vo).length > 120) warn(`escena ${f.id}: el subtítulo tiene ${plain(f.sub ?? f.vo).length} caracteres (ideal ≤ 120): revisá que no pase de 3 líneas`);
    const s = scene(f, { fmt, F, warn, voice: v });
    Object.assign(f, { s });
    const ends = [...s.anims.map((a) => a.at + (a.dur ?? 0.5)), ...(s.kt ? s.kt.tweens.map((m) => m.t + m.dur) : [])];
    const lastAct = ends.length ? Math.max(...ends) : 0;
    const need = thumb ? Math.max(f.min, lastAct + 0.6) : Math.max(f.min || 2.5, v ? VO_LEAD + v.duration_s + TAIL : 0, lastAct + 0.45);
    f.start = r3(t);
    f.dur = r3(need);
    f.ready = r3(lastAct);
    t += f.dur;
  }
  const total = r3(t);
  frames.forEach((f) => {
    const s = f.s;
    s.anims.push(...expandLoops(s.loops, f.dur));
    if (s.kia) s.kt = kiaTweens(s.kiaInit, expandSeqs(s.kiaSimple, f.dur), warn);
    s.humanos.forEach((h) => {
      if (h.camina) h.tweens.push({ t: 0, dur: f.dur, ease: "none", from: { wp: 0 }, to: { wp: r3(f.dur * (h.camina === true ? 1.5 : h.camina)) } });
    });
  });
  const last = frames[frames.length - 1];

  const anims = [];
  frames.forEach((f) => f.s.anims.forEach((a) => anims.push({ ...a, t: r3(f.start + a.at), at: undefined })));
  anims.sort((a, b) => a.t - b.t);

  const clip = (id, f, cls, inner, track, style = "") =>
    `<div id="${id}" class="clip ${cls}" data-start="${f.start}" data-duration="${f.dur}" data-track-index="${track}"${style ? ` style="${style}"` : ""}><div class="inner">${inner}</div></div>`;

  const textBlocks = frames.filter((f) => f.s.text).map((f) => clip(`txt-${f.id}`, f, "scene-text", f.s.text, 3));
  const visuals = frames.map((f) => {
    const s = f.s;
    let piso = "";
    if (f.piso) {
      const speed = f.piso, dist = speed * f.dur, xs = [];
      for (let x = -1600; x < 1600 + Math.abs(dist); x += 240) xs.push(x);
      const pid = `piso-${f.id}`;
      piso = `<g id="${pid}">${xs.map((x) => `<rect x="${x}" y="40" width="90" height="12" rx="6" fill="rgba(43,29,20,0.13)"/><rect x="${x + 120}" y="110" width="60" height="10" rx="5" fill="rgba(43,29,20,0.10)"/>`).join("")}</g>`;
      anims.push({ sel: `#${pid}`, t: f.start, fx: "tween", from: { x: 0 }, to: { x: -dist }, dur: f.dur, ease: "none" });
    }
    const stage = `<g transform="translate(${F.sx},${F.floorY}) scale(${F.ss})">${piso}${s.back.join("")}<g id="actors-${f.id}"></g>${s.front.join("")}<g id="kfx-${f.id}">${s.kfx.join("")}</g></g>`;
    return `<div id="vis-${f.id}" class="clip visual" data-start="${f.start}" data-duration="${f.dur}" data-track-index="2" style="width:${F.W}px;height:${F.H}px"><div class="stage-in"><svg width="${F.W}" height="${F.H}" viewBox="0 0 ${F.W} ${F.H}" xmlns="http://www.w3.org/2000/svg">${stage}</svg></div></div>`;
  });
  const subs = thumb ? [] : frames.filter((f) => f.vo || f.sub).map((f) => clip(`sub-${f.id}`, f, "subtitle", `<p>${esc(plain(f.sub ?? f.vo))}</p>`, 5));

  // ── audio: voz, música con ducking, efectos ──
  const audio = [];
  if (!thumb) frames.filter((f) => voice[f.id]).forEach((f) => audio.push(`<audio id="vo-${f.id}" src="${voice[f.id].path}" data-start="${r3(f.start + VO_LEAD)}" data-duration="${voice[f.id].duration_s}" data-track-index="10" data-volume="1"></audio>`));
  let bgm = "";
  const musFile = spec.musica ?? D.musica;
  const bed = musFile ? join(HERE, "musica", musFile) : null;
  if (!thumb && spec.music !== false && bed && existsSync(bed)) {
    mkdirSync(join(P, "assets", "bgm"), { recursive: true });
    const out = join(P, "assets", "bgm", "cama.wav");
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", bed, "-t", String(total + 1), out]);
    if (r.status === 0) {
      const vol = spec.musicVolume ?? D.musicVolume ?? 0.15, low = r3(vol * (spec.duck ?? 0.4));
      // ducking: la música baja mientras habla Kia (tramos de voz unidos si están a menos de 0,6 s)
      const segs = [];
      frames.filter((f) => voice[f.id]).forEach((f) => {
        const a = f.start + VO_LEAD, b = a + voice[f.id].duration_s;
        if (segs.length && a - segs[segs.length - 1][1] < 0.6) segs[segs.length - 1][1] = b; else segs.push([a, b]);
      });
      const pts = [{ t: 0, v: 0 }, { t: 1.2, v: vol }];
      segs.forEach(([a, b]) => {
        const a0 = Math.max(a - 0.2, pts[pts.length - 1].t + 0.01);
        pts.push({ t: r3(a0), v: vol }, { t: r3(Math.max(a, a0 + 0.05)), v: low }, { t: r3(b), v: low }, { t: r3(b + 0.35), v: vol });
      });
      const endT = Math.max(total - 1.8, pts[pts.length - 1].t + 0.05);
      pts.push({ t: r3(endT), v: pts[pts.length - 1].v }, { t: total, v: 0 });
      const lane = { version: 1, lanes: [{ target: "volume", points: pts.filter((p, i) => i === 0 || p.t > pts[i - 1].t) }] };
      bgm = `<audio id="bgm" src="assets/bgm/cama.wav" data-start="0" data-duration="${total}" data-track-index="11" data-volume="1" data-automation='${JSON.stringify(lane)}'></audio>`;
    } else warn("ffmpeg falló al preparar la música");
  } else if (!thumb && spec.music !== false) warn(`no está la música "${musFile}" en plantilla/musica/`);
  let sfxN = 0;
  if (!thumb) frames.forEach((f) => f.s.sfx.forEach((s) => {
    const src = join(HERE, "sfx", `${s.id}.wav`);
    if (!existsSync(src)) return warn(`escena ${f.id}: efecto de sonido desconocido "${s.id}" (ver plantilla/sfx/)`);
    mkdirSync(join(P, "assets", "sfx"), { recursive: true });
    writeFileSync(join(P, "assets", "sfx", `${s.id}.wav`), readFileSync(src));
    const d = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], { encoding: "utf8" });
    const dur = Math.min(+d.stdout.trim() || 1, f.start + f.dur + 1.5 - (f.start + s.at), total - (f.start + s.at));
    if (dur <= 0.05) return;
    audio.push(`<audio id="sfx-${sfxN}" src="assets/sfx/${s.id}.wav" data-start="${r3(f.start + s.at)}" data-duration="${r3(dur)}" data-track-index="${12 + (sfxN % 6)}" data-volume="${s.vol ?? SFX_VOL[s.id] ?? 0.45}"></audio>`);
    sfxN++;
  }));

  const scenes = frames.map((f) => {
    const s = f.s;
    return {
      id: f.id, start: f.start, dur: f.dur,
      kia: s.kia ? { init: s.kiaInit, tweens: s.kt.tweens, cuts: s.kt.cuts, sombra: s.kia.spec.sombra } : null,
      humanos: s.humanos.map((h) => ({ quien: h.quien, init: h.init, tweens: h.tweens })),
      correas: s.correas.map((c) => ({ ...c, a: typeof c.a === "string" ? s.humanos.findIndex((h) => h.quien === c.a) : c.a })),
    };
  });
  const config = { W: F.W, H: F.H, total, thumb, topbarAt: frames[1] ? frames[1].start : 0, frames: frames.map((f) => ({ id: f.id, start: f.start, dur: f.dur, last: f === last })), anims, scenes };

  // fondo como el banner
  const BG = fmt === "16x9"
    ? { circ: [[150, 110, 300], [1840, 900, 360]], paws: [[1740, 150, 92, 18], [200, 880, 96, -14], [330, 1000, 70, 10]] }
    : { circ: [[110, 330, 330], [1010, 1430, 300]], paws: [[880, 1080, 86, 18], [120, 1480, 80, -14]] };
  const bgHtml = BG.circ.map(([x, y, r]) => `<div class="circ" data-layout-allow-overflow style="left:${x - r}px;top:${y - r}px;width:${2 * r}px;height:${2 * r}px"></div>`).join("")
    + `<div class="floor"></div>` + BG.paws.map(([x, y, s, r]) => `<div class="paw" data-layout-allow-overflow style="left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;transform:rotate(${r}deg)">${icono("huella")}</div>`).join("");

  const runtime = readFileSync(join(HERE, "runtime.js"), "utf8");
  const css = readFileSync(join(HERE, "styles.css"), "utf8");
  const vars = `--floor-y:${F.floorY}px;--cx:${F.cx}px;--cartel-top:${F.cartelTop}px;--cartel-w:${F.cartelW}px;--sub-top:${F.subTop || 0}px`;
  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${F.W}, height=${F.H}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="${ident.fonts}" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
${ident.css}
${css}
html, body { width: ${F.W}px; height: ${F.H}px; }
#root { width: ${F.W}px; height: ${F.H}px; }
    </style>
  </head>
  <body>
    <!-- GENERADO por plantilla/build-index.mjs desde la ficha (formato ${fmt}, identidad ${ident.id}) — no editar a mano -->
    <div id="root" class="f${fmt}" style="${vars}" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${F.W}" data-height="${F.H}">
      <div id="bg" class="clip" data-start="0" data-duration="${total}" data-track-index="0">${bgHtml}</div>
      ${thumb || !frames[1] ? "" : `<div id="topbar" class="clip" data-start="${frames[1].start}" data-duration="${r3(total - frames[1].start)}" data-track-index="4"><div class="inner">${icono("logo")}<span>KIA</span></div></div>`}
      ${visuals.join("\n      ")}
      ${textBlocks.join("\n      ")}
      ${subs.join("\n      ")}
      ${thumb ? "" : `<div id="progress" class="clip" data-start="0" data-duration="${total}" data-track-index="6"><div id="progress-fill"></div></div>`}
      ${audio.join("\n      ")}
      ${bgm}
    </div>
    <script>
      window.__KIA_CONFIG = ${JSON.stringify(config)};
      const KIA_COL = ${JSON.stringify(KIA_COLORS)};
      const HUM_DEF = ${JSON.stringify(HUMANOS)};
      ${kiaRig.toString()}
      ${humanoRig.toString()}
${runtime}
    </script>
  </body>
</html>
`;
  mkdirSync(P, { recursive: true });
  writeFileSync(join(P, "index.html"), html);
  return {
    dir: P, total, warnings, identidad: ident.id, voices: Object.keys(voice).length, music: !!bgm, sfx: sfxN,
    frames: frames.map((f) => ({ id: f.id, kind: f.kind, start: f.start, dur: f.dur, ready: f.ready })),
    thumbAt: r3(total - 0.3),
  };
}
