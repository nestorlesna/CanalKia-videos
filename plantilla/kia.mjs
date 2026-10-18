// Kia animada: rig SVG plano calcado del logo y del banner (contorno marrón grueso, esquinas redondeadas).
//
// Se usa desde Node (build-index, pose-lab: lista de poses y normalización) y desde el navegador: kiaRig() se inyecta
// en el index.html con Function.prototype.toString(), así que NO puede usar nada de afuera de su propio cuerpo.
//
// Espacio del rig: unidades = px a escala 1, el piso es y = 0, x = 0 es el centro de Kia, y negativa = arriba.
// Sentada de frente mide ~400 de alto (punta de las orejas en y ≈ −400).
//
// Vistas (clave `v`, no se interpola: entre vistas distintas el builder hace un `cut`):
//   0 frente  — sentada como el banner (SENTADA, SALUDO, CONFUNDIDA, RUDA, COME, MIRA, DORMIDA_SENTADA)
//   1 perfil  — parada mirando a la derecha (CAMINA, CORRE, PELOTA, LADRA, DORMIDA_SPLOOT)   fx −1 = mira a la izquierda
//   2 panza   — acostada panza arriba con las patas para arriba (PANZA, DORMIDA_PANZA_ARRIBA)
//   3 bollito — hecha bollito durmiendo, de perfil (DORMIDA)
//
// Claves (todas numéricas, se interpolan):
//   globales  x, y (posición en el escenario) · sc escala · fx 1/−1 (espejo) · rot giro (grados, alrededor de (0,−80))
//             jy salto (negativo = arriba, se suma a y) · sq aplastar/estirar (escala vertical desde el piso)
//   cara      eo ojos abiertos 0..1 · lx, ly mirada (−1..1) · mo boca abierta 0..1 · tg lengua afuera 0..1
//             br ceño fruncido 0..1 · bl cachetes 0..1 · el, er orejas (grados; + = caída hacia afuera / atrás)
//   frente    ht cabeza ladeada (grados) · hx, hy corrimiento de la cabeza · pl, pr levantar pata izq./der. 0..1
//             pw saludo (grados que gira la pata levantada) · ch pecho inflado 0..1
//   perfil    ha cabeza (grados, + = hacia abajo) · l1 l2 l3 l4 patas (del. cercana, del. lejana, tras. cercana,
//             tras. lejana; grados desde la vertical, + = hacia adelante) · bt inclinación del cuerpo · tw cola
//   panza     l1..l4 patas para arriba (grados desde la vertical hacia arriba, + = hacia la cabeza) · ha giro de la cabeza
//   vida      bf respiración (Hz) · ba amplitud (0 = quieta) · bk parpadeo automático (1/0) · ew orejitas que se
//             mueven solas (1/0). La "vida" se calcula con el reloj de la escena (clk): determinista, sin Math.random.

export const KIA_COLORS = {
  fur: "#D9965B", furFar: "#C07E46", belly: "#EDBE8C", line: "#2B1D14", mask: "#5A3A28", eye: "#1C120E",
  earOut: "#3B2A22", earIn: "#7A4E48", muzzle: "#3A2E2B", nose: "#141010", noseHi: "#5A5555", wrinkle: "#A9683A",
  cheek: "#E28C64", tongue: "#E86B7A", dots: "#9A948E", mouth: "#5B1F22",
};

export const KIA_KEYS = ["v", "x", "y", "sc", "fx", "rot", "jy", "sq", "eo", "lx", "ly", "mo", "tg", "br", "bl", "el", "er",
  "ht", "hx", "hy", "pl", "pr", "pw", "ch", "ha", "l1", "l2", "l3", "l4", "bt", "tw", "bf", "ba", "bk", "ew"];
// Claves de posición: las pone la escena (kia.x/y/sc/fx), las poses no las pisan.
export const KIA_POS_KEYS = ["x", "y", "sc", "fx"];

export const KIA_DEFAULT = {
  v: 0, x: 0, y: 0, sc: 1, fx: 1, rot: 0, jy: 0, sq: 1, eo: 1, lx: 0, ly: 0, mo: 0, tg: 0, br: 0, bl: 0.85, el: 0, er: 0,
  ht: 0, hx: 0, hy: 0, pl: 0, pr: 0, pw: 0, ch: 0, ha: 0, l1: 0, l2: 0, l3: 0, l4: 0, bt: 0, tw: 0,
  bf: 0.45, ba: 1, bk: 1, ew: 1,
};

// Poses: solo las claves que cambian respecto de KIA_DEFAULT. Las "_B" son la otra fase de un loop.
export const KIA_POSES = {
  SENTADA: {},
  SALUDO: { pr: 1, pw: -18, ht: -10, el: 4, er: -4, mo: 0.15 },
  SALUDO_B: { pr: 1, pw: 22, ht: -10, el: 4, er: -4, mo: 0.15 },
  CONFUNDIDA: { ht: 20, hx: 8, el: 38, er: -6, lx: 0.5, ly: -0.6, bk: 1 },
  PANZA: { v: 2, l1: 28, l2: 12, l3: -26, l4: -10, tg: 0.6, ha: 100, ba: 1.3 },
  PANZA_B: { v: 2, l1: 8, l2: 30, l3: -8, l4: -30, tg: 0.6, ha: 106, ba: 1.3 },
  DORMIDA: { v: 3, eo: 0, el: 32, er: 32, ha: 16, bf: 0.25, ba: 2.2, bk: 0, ew: 0, bl: 0.5 },
  DORMIDA_PANZA_ARRIBA: { v: 2, eo: 0, tg: 1, mo: 0.15, l1: 40, l2: 20, l3: -40, l4: -18, ha: 112, bf: 0.25, ba: 2.2, bk: 0, ew: 0 },
  DORMIDA_SENTADA: { eo: 0, ht: 24, hx: 10, hy: 14, el: 26, er: 30, tg: 0.7, bf: 0.25, ba: 2, bk: 0, ew: 0 },
  DORMIDA_SPLOOT: { v: 1, jy: 44, eo: 0, ha: 28, l1: 86, l2: 80, l3: -88, l4: -82, el: 30, tg: 0.8, bf: 0.25, ba: 2, bk: 0, ew: 0, tw: -20 },
  DORMIDA_PLOP: { eo: 0, rot: -84, jy: -40, ht: 6, el: 30, er: 30, tg: 1, mo: 0.1, bf: 0.25, ba: 2, bk: 0, ew: 0 },
  PARADA: { v: 1 },
  CAMINA_A: { v: 1, l1: 24, l2: -20, l3: -22, l4: 20, jy: 0, ha: -2, tw: 18 },
  CAMINA_B: { v: 1, l1: -20, l2: 24, l3: 20, l4: -22, jy: -6, ha: 2, tw: -18 },
  CORRE_A: { v: 1, l1: 52, l2: 40, l3: -48, l4: -38, jy: -34, bt: -4, ha: -6, el: 30, tw: 30 },
  CORRE_B: { v: 1, l1: -36, l2: -26, l3: 40, l4: 30, jy: 0, bt: 5, ha: 4, el: 22, tw: -10 },
  LADRA: { v: 1, mo: 1, ha: -16, el: -6, l1: 14, l2: 10, l3: -8, l4: -6, bt: -3, tw: 20 },
  LADRA_B: { v: 1, mo: 0.2, ha: -8, el: -2, l1: 14, l2: 10, l3: -8, l4: -6, bt: -2, tw: -10 },
  LADRA_FRENTE: { mo: 1, ht: -4, el: -6, er: -6, hy: -6, sq: 1.04 },
  RUDA: { br: 1, ch: 1, eo: 0.62, el: -8, er: -8, hy: -14, sq: 1.06, bl: 0.2, mo: 0 },
  COME: { ly: -1, mo: 0.8, hy: -12, ht: -4, el: 8, er: 8 },
  COME_B: { mo: 0, hy: 0, ht: 4, eo: 0.2, el: 10, er: 10, tg: 0.5, jy: -30, sq: 1.05 },
  MASTICA: { mo: 0.25, eo: 0.25, el: 10, er: 10, ht: 6 },
  PELOTA: { v: 1, ha: -8, l1: 30, l2: 18, l3: -24, l4: -14, mo: 0.5, tg: 0.7, tw: 30 },
  MIRA: { lx: 1, ly: -0.2, ht: 12, el: 18, er: -4, eo: 0.95 },
  MIRA_B: { lx: 1, ly: -0.2, ht: -8, el: -4, er: 22, eo: 0.95 },
  SEÑALA: { lx: -1, ht: -18, hx: -14, el: -4, er: 6, mo: 0.2 },
  APRIETA: { pr: 0.5, pw: 50, ly: 0.6, lx: 0.5, ht: 6, mo: 0.2 },
  CONTENTA: { mo: 0.45, tg: 0.9, eo: 0.85, el: 6, er: 6, sq: 1.02 },
};

// Puntos de referencia por vista (rig): dónde salen los Zzz, los globos, la correa. Copia en kiaRig (ANCH).
export const KIA_ANCHORS = {
  0: { cabeza: { x: 0, y: -400 }, boca: { x: 0, y: -180 }, collar: { x: 0, y: -150 }, pata: { x: 34, y: -12 } },
  1: { cabeza: { x: 130, y: -360 }, boca: { x: 225, y: -165 }, collar: { x: 88, y: -150 }, pata: { x: 70, y: 0 } },
  2: { cabeza: { x: 160, y: -200 }, boca: { x: 200, y: -60 }, collar: { x: 120, y: -60 }, pata: { x: 70, y: -170 } },
  3: { cabeza: { x: 90, y: -230 }, boca: { x: 190, y: -80 }, collar: { x: 70, y: -80 }, pata: { x: 116, y: -12 } },
};
// Mismo cálculo que toStage() del navegador: punto del rig → escenario.
export function kiaAnchor(st, name) {
  const v = Math.round(st.v) || 0, p = (KIA_ANCHORS[v] || KIA_ANCHORS[0])[name] || KIA_ANCHORS[0].cabeza;
  const r = (st.rot * Math.PI) / 180, cy = -80;
  const qx = p.x * Math.cos(r) - (p.y * st.sq - cy) * Math.sin(r);
  const qy = p.x * Math.sin(r) + (p.y * st.sq - cy) * Math.cos(r) + cy;
  return { x: st.x + st.fx * st.sc * qx, y: st.y + st.jy * st.sc + st.sc * qy };
}

// Pose (nombre u objeto) → estado completo. Un objeto puede traer "base": "POSE" + claves sueltas.
export function kiaPose(p, warn = () => {}) {
  if (typeof p === "string") {
    if (!KIA_POSES[p]) { warn(`pose de Kia desconocida "${p}" (ver --poses en pose-lab)`); return { ...KIA_DEFAULT }; }
    return { ...KIA_DEFAULT, ...KIA_POSES[p] };
  }
  const { base, ...rest } = p || {};
  return { ...kiaPose(base || "SENTADA", warn), ...rest };
}

// ── Navegador ──────────────────────────────────────────────────────────────────────────────────────────────────────
// kiaRig(parent, COL) arma a Kia dentro del <g> parent y devuelve { st, draw(clk), anchor(name) }.
// st es el estado vivo (lo mueven los tweens de GSAP); draw(clk) dibuja con el reloj de la escena (vida).
export function kiaRig(parent, COL) {
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, p) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    (p || root).appendChild(n);
    return n;
  };
  const g = (p, attrs) => el("g", attrs || {}, p);
  const LW = 6; // contorno
  const f2 = (v) => (+v).toFixed(2);
  const root = g(parent, { class: "kia" });

  // ── Cabeza de frente (centro de la cabeza en el origen) — la usan la vista 0 y la 2 ──
  function frontHead(p) {
    const H = g(p);
    const ear = (side) => {
      const s = side, eg = g(H);
      el("path", { d: `M ${-92 * s} -50 C ${-101 * s} -112 ${-90 * s} -160 ${-70 * s} -167 C ${-54 * s} -172 ${-30 * s} -126 ${-6 * s} -86 Z`, fill: COL.earOut, stroke: COL.line, "stroke-width": LW, "stroke-linejoin": "round" }, eg);
      el("path", { d: `M ${-80 * s} -72 C ${-86 * s} -116 ${-80 * s} -146 ${-68 * s} -151 C ${-58 * s} -152 ${-42 * s} -120 ${-26 * s} -92 Z`, fill: COL.earIn }, eg);
      return eg;
    };
    const eL = ear(1), eR = ear(-1);
    el("path", { d: "M -101 -8 C -103 -78 -62 -97 0 -97 C 62 -97 103 -78 101 -8 C 104 52 78 96 0 96 C -78 96 -104 52 -101 -8 Z", fill: COL.fur, stroke: COL.line, "stroke-width": LW, "stroke-linejoin": "round" }, H);
    el("path", { d: "M -35 -66 Q 0 -79 35 -68 M -24 -49 Q 0 -57 25 -50 M -3 -57 Q -6 -36 -3 -18", fill: "none", stroke: COL.wrinkle, "stroke-width": 6, "stroke-linecap": "round" }, H);
    const cheeks = g(H);
    el("ellipse", { cx: -80, cy: 40, rx: 19, ry: 12, fill: COL.cheek }, cheeks);
    el("ellipse", { cx: 80, cy: 40, rx: 19, ry: 12, fill: COL.cheek }, cheeks);
    const eyes = [-1, 1].map((s) => {
      el("ellipse", { cx: 47 * s, cy: -7, rx: 34, ry: 26, fill: COL.mask }, H);
      const eg = g(H, { transform: `translate(${44 * s},-6)` });
      const look = g(eg);
      const ball = el("ellipse", { cx: 0, cy: 0, rx: 17, ry: 17, fill: COL.eye }, look);
      const hi = el("circle", { cx: 7, cy: -7, r: 5.5, fill: "#FFFFFF" }, look);
      const shut = el("path", { d: "M -16 -1 Q 0 10 16 -1", fill: "none", stroke: COL.eye, "stroke-width": 5, "stroke-linecap": "round", opacity: 0 }, eg);
      return { look, ball, hi, shut };
    });
    const brows = el("path", { d: "M -74 -42 L -24 -26 M 74 -42 L 24 -26", stroke: COL.line, "stroke-width": 9, "stroke-linecap": "round", opacity: 0 }, H);
    el("path", { d: "M -72 42 C -72 8 -40 -1 0 -1 C 40 -1 72 8 72 42 C 72 80 50 99 0 99 C -50 99 -72 80 -72 42 Z", fill: COL.muzzle, stroke: COL.line, "stroke-width": 5 }, H);
    for (const [x, y] of [[-48, 56], [-57, 69], [-38, 73]]) {
      el("circle", { cx: x, cy: y, r: 3.6, fill: COL.dots }, H);
      el("circle", { cx: -x, cy: y, r: 3.6, fill: COL.dots }, H);
    }
    const openM = el("ellipse", { cx: 0, cy: 58, rx: 24, ry: 2, fill: COL.mouth, opacity: 0 }, H);
    const tongue = el("path", { d: "", fill: COL.tongue, stroke: COL.line, "stroke-width": 2.5 }, H);
    const smile = el("path", { d: "M 0 38 L 0 50 M -27 49 Q -14 64 0 51 Q 14 64 27 49", fill: "none", stroke: COL.eye, "stroke-width": 5, "stroke-linecap": "round", "stroke-linejoin": "round" }, H);
    el("path", { d: "M -23 15 C -23 5 23 5 23 15 C 23 30 7 39 0 39 C -7 39 -23 30 -23 15 Z", fill: COL.nose }, H);
    el("ellipse", { cx: -8, cy: 12, rx: 7, ry: 3.5, fill: COL.noseHi }, H);
    return { H, eL, eR, eyes, brows, openM, tongue, smile, cheeks };
  }
  function setFrontFace(h, st, eo, earL, earR) {
    h.eL.setAttribute("transform", `rotate(${f2(-earL)} -50 -84)`);
    h.eR.setAttribute("transform", `rotate(${f2(earR)} 50 -84)`);
    const open = Math.max(0, Math.min(1, eo));
    h.eyes.forEach((e) => {
      e.look.setAttribute("transform", `translate(${f2(st.lx * 8)},${f2(st.ly * 6)})`);
      e.ball.setAttribute("ry", f2(Math.max(1.5, 17 * open)));
      e.ball.setAttribute("opacity", open < 0.18 ? 0 : 1);
      e.hi.setAttribute("opacity", open < 0.45 ? 0 : 1);
      e.shut.setAttribute("opacity", open < 0.18 ? 1 : 0);
    });
    h.brows.setAttribute("opacity", f2(st.br));
    h.cheeks.setAttribute("opacity", f2(st.bl));
    const mo = Math.max(0, st.mo);
    h.openM.setAttribute("opacity", mo > 0.12 ? 1 : 0);
    h.openM.setAttribute("ry", f2(4 + 24 * mo));
    h.openM.setAttribute("cy", f2(54 + 10 * mo));
    h.smile.setAttribute("opacity", mo > 0.12 ? 0 : 1);
    // lengüita: chica siempre (como el logo); tg la saca más
    const ty = mo > 0.12 ? 58 + 20 * mo : 53, tl = 13 + 22 * st.tg;
    h.tongue.setAttribute("d", `M -9 ${f2(ty)} C -11 ${f2(ty + tl)} 11 ${f2(ty + tl)} 9 ${f2(ty)} Z`);
  }

  // ── Cabeza de perfil (mira a la derecha, centro en el origen) — la usan la vista 1 y la 3 ──
  function sideHead(p) {
    const H = g(p);
    const far = g(H);
    el("path", { d: "M -24 -46 C -30 -104 -20 -140 -4 -146 C 8 -148 22 -108 34 -60 Z", fill: COL.earOut, stroke: COL.line, "stroke-width": LW, "stroke-linejoin": "round" }, far);
    const ear = g(H);
    el("path", { d: "M -54 -36 C -64 -98 -56 -140 -40 -148 C -26 -152 -8 -110 10 -60 Z", fill: COL.earOut, stroke: COL.line, "stroke-width": LW, "stroke-linejoin": "round" }, ear);
    el("path", { d: "M -44 -50 C -50 -96 -44 -124 -36 -130 C -27 -128 -16 -100 -4 -66 Z", fill: COL.earIn }, ear);
    el("path", { d: "M -72 4 C -74 -54 -32 -82 10 -80 C 52 -78 76 -50 76 -10 L 74 38 C 52 72 -40 76 -64 42 C -72 30 -72 16 -72 4 Z", fill: COL.fur, stroke: COL.line, "stroke-width": LW, "stroke-linejoin": "round" }, H);
    el("path", { d: "M -8 -62 Q 22 -70 48 -54 M 8 -46 Q 26 -50 42 -42", fill: "none", stroke: COL.wrinkle, "stroke-width": 5, "stroke-linecap": "round" }, H);
    const cheek = el("ellipse", { cx: 8, cy: 32, rx: 17, ry: 10, fill: COL.cheek }, H);
    el("ellipse", { cx: 36, cy: -12, rx: 27, ry: 22, fill: COL.mask }, H);
    const look = g(H, { transform: "translate(40,-12)" });
    const ball = el("ellipse", { cx: 0, cy: 0, rx: 12, ry: 12, fill: COL.eye }, look);
    const hi = el("circle", { cx: 4, cy: -4, r: 4, fill: "#FFFFFF" }, look);
    const shut = el("path", { d: "M 28 -12 Q 40 -4 52 -12", fill: "none", stroke: COL.eye, "stroke-width": 4.5, "stroke-linecap": "round", opacity: 0 }, H);
    const jaw = el("path", { d: "", fill: COL.mouth, stroke: COL.line, "stroke-width": 4, "stroke-linejoin": "round" }, H);
    const tongue = el("path", { d: "", fill: COL.tongue, stroke: COL.line, "stroke-width": 2.5 }, H);
    el("path", { d: "M 40 -4 C 72 -10 104 0 106 28 C 108 56 84 70 50 68 C 32 66 26 50 30 30 C 32 14 32 2 40 -4 Z", fill: COL.muzzle, stroke: COL.line, "stroke-width": 5, "stroke-linejoin": "round" }, H);
    for (const [x, y] of [[58, 38], [68, 30], [66, 50]]) el("circle", { cx: x, cy: y, r: 3.2, fill: COL.dots }, H);
    const smile = el("path", { d: "M 64 54 Q 84 62 102 50", fill: "none", stroke: COL.eye, "stroke-width": 4.5, "stroke-linecap": "round" }, H);
    el("ellipse", { cx: 100, cy: 12, rx: 13, ry: 10, fill: COL.nose }, H);
    el("ellipse", { cx: 97, cy: 8, rx: 5, ry: 2.5, fill: COL.noseHi }, H);
    const brow = el("path", { d: "M 14 -40 L 58 -30", stroke: COL.line, "stroke-width": 8, "stroke-linecap": "round", opacity: 0 }, H);
    return { H, ear, far, look, ball, hi, shut, jaw, tongue, smile, cheek, brow };
  }
  function setSideFace(h, st, eo, earA) {
    h.ear.setAttribute("transform", `rotate(${f2(-earA)} -22 -50)`);
    h.far.setAttribute("transform", `rotate(${f2(-earA * 0.8)} 8 -50)`);
    const open = Math.max(0, Math.min(1, eo));
    h.look.setAttribute("transform", `translate(${f2(40 + st.lx * 3)},${f2(-12 + st.ly * 4)})`);
    h.ball.setAttribute("ry", f2(Math.max(1.5, 12 * open)));
    h.ball.setAttribute("opacity", open < 0.18 ? 0 : 1);
    h.hi.setAttribute("opacity", open < 0.45 ? 0 : 1);
    h.shut.setAttribute("opacity", open < 0.18 ? 1 : 0);
    h.brow.setAttribute("opacity", f2(st.br));
    h.cheek.setAttribute("opacity", f2(st.bl));
    const mo = Math.max(0, st.mo);
    h.jaw.setAttribute("opacity", mo > 0.08 ? 1 : 0);
    h.jaw.setAttribute("d", `M 44 46 L 104 42 C 104 ${f2(52 + 40 * mo)} 88 ${f2(64 + 46 * mo)} 62 ${f2(60 + 40 * mo)} C 50 ${f2(58 + 30 * mo)} 44 54 44 46 Z`);
    h.smile.setAttribute("opacity", mo > 0.08 ? 0 : 1);
    const tx = 82, ty = mo > 0.08 ? 54 + 30 * mo : 56, tl = 10 + 24 * st.tg;
    h.tongue.setAttribute("opacity", mo > 0.08 || st.tg > 0.05 ? 1 : 0);
    h.tongue.setAttribute("d", `M ${tx - 9} ${f2(ty)} C ${tx - 11} ${f2(ty + tl)} ${tx + 9} ${f2(ty + tl)} ${tx + 8} ${f2(ty)} Z`);
  }

  // patita: "salchicha" con contorno + almohadilla clara
  function leg(p, color, w) {
    const lg = g(p);
    const o = el("line", { stroke: COL.line, "stroke-width": w + LW * 2, "stroke-linecap": "round" }, lg);
    const f = el("line", { stroke: color, "stroke-width": w, "stroke-linecap": "round" }, lg);
    const pad = el("ellipse", { rx: 21, ry: 11, fill: COL.belly, stroke: COL.line, "stroke-width": 4 }, lg);
    return { o, f, pad };
  }
  function setLeg(L, x1, y1, ang, len, up) {
    const r = (ang * Math.PI) / 180, dir = up ? -1 : 1;
    const x2 = x1 + Math.sin(r) * len, y2 = y1 + Math.cos(r) * len * dir;
    for (const n of [L.o, L.f]) { n.setAttribute("x1", f2(x1)); n.setAttribute("y1", f2(y1)); n.setAttribute("x2", f2(x2)); n.setAttribute("y2", f2(y2)); }
    L.pad.setAttribute("cx", f2(x2 + (up ? 0 : 6)));
    L.pad.setAttribute("cy", f2(y2 + (up ? -4 : 4)));
    L.pad.setAttribute("transform", `rotate(${f2(up ? ang : ang * 0.6)} ${f2(x2)} ${f2(y2)})`);
    return { x: x2, y: y2 };
  }

  // ── Vista 0: frente sentada ──
  const V0 = g(root);
  const f0legL = leg(V0, COL.fur, 32), f0legR = leg(V0, COL.fur, 32);
  const f0body = g(V0);
  el("path", { d: "M -112 -78 C -116 -150 -66 -176 0 -176 C 66 -176 116 -150 112 -78 C 110 -20 64 -2 0 -2 C -64 -2 -110 -20 -112 -78 Z", fill: COL.fur, stroke: COL.line, "stroke-width": LW, "stroke-linejoin": "round" }, f0body);
  el("ellipse", { cx: 0, cy: -72, rx: 62, ry: 56, fill: COL.belly }, f0body);
  const f0headG = g(V0);
  const f0head = frontHead(f0headG);
  const pawL = el("ellipse", { rx: 27, ry: 13, fill: COL.belly, stroke: COL.line, "stroke-width": 4.5 }, V0);
  const pawR = el("ellipse", { rx: 27, ry: 13, fill: COL.belly, stroke: COL.line, "stroke-width": 4.5 }, V0);

  // ── Vista 1: perfil parada ──
  const V1 = g(root);
  const s1legs = [leg(V1, COL.furFar, 40), leg(V1, COL.furFar, 40), leg(V1, COL.fur, 44), leg(V1, COL.fur, 44)]; // l2 l4 (lejanas) l1 l3
  const s1tail = el("path", { d: "M -104 -132 C -132 -150 -150 -128 -134 -114 C -126 -108 -114 -114 -106 -118 Z", fill: COL.fur, stroke: COL.line, "stroke-width": LW, "stroke-linejoin": "round" }, V1);
  const s1body = g(V1);
  el("path", { d: "M -116 -114 C -116 -162 -60 -180 6 -178 C 72 -176 118 -154 120 -112 C 122 -72 92 -54 38 -55 C -12 -56 -52 -56 -86 -62 C -108 -68 -116 -90 -116 -114 Z", fill: COL.fur, stroke: COL.line, "stroke-width": LW, "stroke-linejoin": "round" }, s1body);
  el("ellipse", { cx: 74, cy: -88, rx: 36, ry: 28, fill: COL.belly }, s1body);
  const s1headG = g(V1);
  const s1head = sideHead(s1headG);

  // ── Vista 2: panza arriba ──
  const V2 = g(root);
  const b2legs = [leg(V2, COL.furFar, 38), leg(V2, COL.furFar, 38), leg(V2, COL.fur, 40), leg(V2, COL.fur, 40)];
  const b2tail = el("ellipse", { cx: -140, cy: -40, rx: 16, ry: 11, fill: COL.fur, stroke: COL.line, "stroke-width": LW }, V2);
  const b2body = g(V2);
  el("path", { d: "M -138 -56 C -138 -104 -70 -122 0 -122 C 70 -122 140 -104 140 -58 C 140 -14 80 0 0 0 C -80 0 -138 -14 -138 -56 Z", fill: COL.fur, stroke: COL.line, "stroke-width": LW, "stroke-linejoin": "round" }, b2body);
  el("ellipse", { cx: -4, cy: -80, rx: 98, ry: 34, fill: COL.belly }, b2body);
  el("circle", { cx: -4, cy: -84, r: 4, fill: COL.wrinkle }, b2body); // ombligo
  const b2headG = g(V2);
  const b2head = frontHead(b2headG);

  // ── Vista 3: bollito ──
  const V3 = g(root);
  const c3tail = el("path", { d: "M -128 -60 C -158 -74 -170 -44 -150 -30 C -140 -24 -130 -32 -124 -38 Z", fill: COL.fur, stroke: COL.line, "stroke-width": LW, "stroke-linejoin": "round" }, V3);
  const c3body = g(V3);
  el("path", { d: "M -140 -56 C -140 -110 -70 -124 0 -122 C 70 -120 132 -100 134 -56 C 136 -12 80 0 0 0 C -80 0 -140 -12 -140 -56 Z", fill: COL.fur, stroke: COL.line, "stroke-width": LW, "stroke-linejoin": "round" }, c3body);
  el("path", { d: "M -128 -40 C -126 -98 -36 -104 -24 -50 C -20 -24 -50 -8 -84 -8", fill: "none", stroke: COL.line, "stroke-width": 5, "stroke-linecap": "round" }, c3body);
  el("ellipse", { cx: -30, cy: -12, rx: 26, ry: 11, fill: COL.belly, stroke: COL.line, "stroke-width": 4 }, c3body);
  el("ellipse", { cx: 116, cy: -12, rx: 26, ry: 11, fill: COL.belly, stroke: COL.line, "stroke-width": 4 }, V3);
  const c3headG = g(V3);
  const c3head = sideHead(c3headG);
  el("ellipse", { cx: 150, cy: -11, rx: 26, ry: 11, fill: COL.belly, stroke: COL.line, "stroke-width": 4 }, V3);

  const VIEWS = [V0, V1, V2, V3];
  const st = {};

  // vida: respiración, parpadeo y orejitas, todo función del reloj de la escena
  function life(clk) {
    const breath = Math.sin(2 * Math.PI * clk * st.bf) * st.ba;
    let blink = 1;
    if (st.bk > 0.5) {
      const ph = (clk + 0.9) % 3.2;
      if (ph < 0.16) blink = Math.abs(ph - 0.08) / 0.08;
    }
    let twL = 0, twR = 0;
    if (st.ew > 0.5) {
      const a = (clk + 1.7) % 4.6, b = (clk + 0.3) % 5.9;
      if (a < 0.3) twL = Math.sin((a / 0.3) * Math.PI) * 10;
      if (b < 0.3) twR = Math.sin((b / 0.3) * Math.PI) * 9;
    }
    return { breath, blink, twL, twR };
  }

  // punto del rig → coordenadas del escenario (para la correa, los Zzz, los globos)
  function toStage(p) {
    const r = (st.rot * Math.PI) / 180, cy = -80;
    const qx = p.x * Math.cos(r) - (p.y * st.sq - cy) * Math.sin(r);
    const qy = p.x * Math.sin(r) + (p.y * st.sq - cy) * Math.cos(r) + cy;
    return { x: st.x + st.fx * st.sc * qx, y: st.y + st.jy * st.sc + st.sc * qy };
  }
  // misma tabla que KIA_ANCHORS (acá adentro porque esta función se inyecta sola en el navegador)
  const ANCH = {
    0: { cabeza: { x: 0, y: -400 }, boca: { x: 0, y: -180 }, collar: { x: 0, y: -150 }, pata: { x: 34, y: -12 } },
    1: { cabeza: { x: 130, y: -360 }, boca: { x: 225, y: -165 }, collar: { x: 88, y: -150 }, pata: { x: 70, y: 0 } },
    2: { cabeza: { x: 160, y: -200 }, boca: { x: 200, y: -60 }, collar: { x: 120, y: -60 }, pata: { x: 70, y: -170 } },
    3: { cabeza: { x: 90, y: -230 }, boca: { x: 190, y: -80 }, collar: { x: 70, y: -80 }, pata: { x: 116, y: -12 } },
  };
  function anchor(name) {
    const v = Math.round(st.v) || 0;
    return toStage((ANCH[v] || ANCH[0])[name] || ANCH[0].cabeza);
  }

  function draw(clk) {
    const L = life(clk || 0), v = Math.round(st.v) || 0;
    VIEWS.forEach((n, i) => n.setAttribute("display", i === v ? "inline" : "none"));
    const eo = st.eo * L.blink, b = L.breath;
    root.setAttribute("transform", `translate(${f2(st.x)},${f2(st.y + st.jy * st.sc)}) scale(${f2(st.fx * st.sc)},${f2(st.sc)}) rotate(${f2(st.rot)} 0 -80) scale(1,${f2(st.sq)})`);
    if (v === 0) {
      const sx = 1 + 0.012 * b + 0.16 * st.ch, sy = 1 + 0.022 * b + 0.1 * st.ch;
      f0body.setAttribute("transform", `scale(${f2(sx)},${f2(sy)})`);
      const shY = -118 * sy;
      // patas delanteras: apoyadas (ocultas detrás de la panza) o levantadas (saludo, apretar)
      const paw = (side, raise, node, legN) => {
        const s = side, rest = { x: 34 * s, y: -12 }, sh = { x: 58 * s, y: shY };
        const up = { x: 148 * s, y: -178 }, w = ((st.pw || 0) * s * Math.PI) / 180;
        let px = rest.x + (up.x - rest.x) * raise, py = rest.y + (up.y - rest.y) * raise;
        if (raise > 0) { // girar la pata alrededor del hombro (saludo)
          const dx = px - sh.x, dy = py - sh.y;
          px = sh.x + dx * Math.cos(w * raise) - dy * Math.sin(w * raise);
          py = sh.y + dx * Math.sin(w * raise) + dy * Math.cos(w * raise);
        }
        node.setAttribute("cx", f2(px)); node.setAttribute("cy", f2(py));
        node.setAttribute("transform", `rotate(${f2(raise * 70 * s)} ${f2(px)} ${f2(py)})`);
        const vis = raise > 0.04 ? "inline" : "none";
        for (const n of [legN.o, legN.f]) {
          n.setAttribute("display", vis);
          n.setAttribute("x1", f2(sh.x)); n.setAttribute("y1", f2(sh.y)); n.setAttribute("x2", f2(px)); n.setAttribute("y2", f2(py));
        }
        legN.pad.setAttribute("display", "none");
      };
      paw(-1, st.pl, pawL, f0legL);
      paw(1, st.pr, pawR, f0legR);
      f0headG.setAttribute("transform", `translate(${f2(st.hx)},${f2(st.hy - 3 * b - 20 * st.ch)}) rotate(${f2(st.ht)} 0 -150) translate(0,-236)`);
      setFrontFace(f0head, st, eo, st.el + L.twL, st.er + L.twR);
    } else if (v === 1) {
      const by = -1.5 * b;
      V1.setAttribute("transform", `rotate(${f2(st.bt)} 0 -100)`);
      s1body.setAttribute("transform", `translate(0,${f2(by)}) scale(1,${f2(1 + 0.015 * b)})`);
      setLeg(s1legs[0], 84, -84, st.l2, 64);
      setLeg(s1legs[1], -58, -84, st.l4, 64);
      setLeg(s1legs[2], 68, -80, st.l1, 64);
      setLeg(s1legs[3], -74, -80, st.l3, 64);
      s1tail.setAttribute("transform", `rotate(${f2(st.tw)} -108 -124)`);
      s1headG.setAttribute("transform", `translate(0,${f2(by * 1.5)}) rotate(${f2(st.ha)} 96 -160) translate(132,-205) scale(1.08)`);
      setSideFace(s1head, st, eo, st.el + L.twL);
    } else if (v === 2) {
      b2body.setAttribute("transform", `translate(0,${f2(-1 * b)}) scale(1,${f2(1 + 0.03 * b)})`);
      setLeg(b2legs[0], 96, -92, st.l2, 80, true);
      setLeg(b2legs[1], -54, -92, st.l4, 80, true);
      setLeg(b2legs[2], 70, -100, st.l1, 80, true);
      setLeg(b2legs[3], -80, -100, st.l3, 80, true);
      b2tail.setAttribute("transform", `rotate(${f2(st.tw)} -130 -40)`);
      b2headG.setAttribute("transform", `translate(176,-58) rotate(${f2(st.ha)}) scale(0.82)`);
      setFrontFace(b2head, st, eo, st.el + L.twL, st.er + L.twR);
    } else {
      c3body.setAttribute("transform", `translate(0,${f2(-1.5 * b)}) scale(1,${f2(1 + 0.03 * b)})`);
      c3tail.setAttribute("transform", `rotate(${f2(st.tw)} -126 -40)`);
      c3headG.setAttribute("transform", `translate(${f2(0)},${f2(-1 * b)}) rotate(${f2(st.ha)} 70 -60) translate(104,-92) scale(0.9)`);
      setSideFace(c3head, st, eo, st.el);
    }
  }
  return { st, draw, anchor, root };
}
