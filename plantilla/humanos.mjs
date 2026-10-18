// Humanos de apoyo: GENÉRICOS y planos, de perfil, sin cara ni rasgos (regla de privacidad: el canal lo hace un menor).
// El torso sigue para arriba hasta salir del cuadro: nunca se ve una cabeza.
// Igual que kiaRig, humanoRig() se inyecta en el navegador con toString(): no usa nada de afuera de su cuerpo.
//
// Tipos (`quien`): hermano (chico con mochila) · papa · mama (con delantal).
// Estado: x, y (pies en el escenario; el piso es y = 0) · fx 1/−1 (mira a la derecha / izquierda) · wp fase de la
// caminata (1 = un paso completo; la anima el builder) · ma brazo (0 = colgando, 1 = adelante sosteniendo la correa).
export const HUMANOS = {
  hermano: { hip: 640, shoulder: 1180, w: 190, pants: "#3F4E8C", shirt: "#2FA79A", shoe: "#2B2F3A", mochila: "#E2574C" },
  papa: { hip: 880, shoulder: 1520, w: 240, pants: "#4A6FA5", shirt: "#8C6BB1", shoe: "#3A2E2B" },
  mama: { hip: 840, shoulder: 1460, w: 220, pants: "#B5546A", shirt: "#F2EFE6", shoe: "#3A2E2B", delantal: "#FFFFFF" },
};

export function humanoRig(parent, D, COL) {
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, p) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    (p || root).appendChild(n);
    return n;
  };
  const f2 = (v) => (+v).toFixed(2);
  const LINE = COL.line, LW = 6, SKIN = "#E3A979";
  const root = el("g", { class: "humano" }, parent);
  const mkLeg = (shade) => {
    const g = el("g", {});
    el("line", { x1: 0, y1: -D.hip, x2: 0, y2: -26, stroke: LINE, "stroke-width": D.w * 0.42 + LW * 2, "stroke-linecap": "round" }, g);
    el("line", { x1: 0, y1: -D.hip, x2: 0, y2: -26, stroke: shade, "stroke-width": D.w * 0.42, "stroke-linecap": "round" }, g);
    el("path", { d: "M -26 -6 C -28 -34 -6 -40 14 -36 C 40 -32 64 -24 66 -6 Z", fill: D.shoe, stroke: LINE, "stroke-width": 5, "stroke-linejoin": "round" }, g);
    el("rect", { x: -30, y: -10, width: 100, height: 10, rx: 5, fill: "#F4F4F4", stroke: LINE, "stroke-width": 3 }, g);
    return g;
  };
  const dark = (hex) => {
    const n = parseInt(hex.slice(1), 16), k = 0.82;
    return `rgb(${Math.round((n >> 16) * k)},${Math.round(((n >> 8) & 255) * k)},${Math.round((n & 255) * k)})`;
  };
  const body = el("g", {});
  const legFar = mkLeg(dark(D.pants));
  body.appendChild(legFar);
  const armFar = el("line", { stroke: dark(D.shirt), "stroke-width": 50, "stroke-linecap": "round" }, body);
  if (D.mochila) el("rect", { x: -D.w / 2 - 70, y: -D.shoulder + 40, width: 110, height: D.shoulder - D.hip + 40, rx: 30, fill: D.mochila, stroke: LINE, "stroke-width": LW }, body);
  el("rect", { x: -D.w / 2, y: -D.shoulder - 400, width: D.w, height: D.shoulder + 400 - D.hip + 40, rx: 40, fill: D.shirt, stroke: LINE, "stroke-width": LW }, body);
  el("rect", { x: -D.w / 2, y: -D.hip - 30, width: D.w, height: 70, rx: 30, fill: D.pants, stroke: LINE, "stroke-width": LW }, body);
  if (D.delantal) el("path", { d: `M ${D.w / 2 - 10} ${-D.hip - 120} L ${D.w / 2 + 14} ${-D.hip + 230} L ${D.w / 2 - 70} ${-D.hip + 230} L ${D.w / 2 - 60} ${-D.hip - 120} Z`, fill: D.delantal, stroke: LINE, "stroke-width": 5, "stroke-linejoin": "round" }, body);
  const legNear = mkLeg(D.pants);
  body.appendChild(legNear);
  const armNear = el("line", { stroke: D.shirt, "stroke-width": 52, "stroke-linecap": "round" }, body);
  const armNearO = el("line", { stroke: LINE, "stroke-width": 64, "stroke-linecap": "round" }, body);
  body.insertBefore(armNearO, armNear);
  const hand = el("circle", { r: 22, fill: SKIN, stroke: LINE, "stroke-width": 5 }, body);
  const st = { x: 0, y: 0, fx: 1, wp: 0, ma: 0 };

  function handPos() {
    const sh = { x: 10, y: -D.shoulder + 70 }, len = D.shoulder - D.hip + 40;
    const a = (-8 + 62 * st.ma) * Math.PI / 180;
    return { x: sh.x + Math.sin(a) * len, y: sh.y + Math.cos(a) * len, sh };
  }
  function anchor() {
    const h = handPos();
    return { x: st.x + st.fx * h.x, y: st.y + h.y };
  }
  function draw() {
    const ph = Math.sin(st.wp * 2 * Math.PI), sw = 24 * ph;
    root.setAttribute("transform", `translate(${f2(st.x)},${f2(st.y)}) scale(${f2(st.fx)},1)`);
    const lift = (a) => Math.max(0, -a) * 0.6; // el pie de atrás se despega un poco
    legNear.setAttribute("transform", `rotate(${f2(sw)} 0 ${-D.hip}) translate(0,${f2(-lift(sw))})`);
    legFar.setAttribute("transform", `translate(-14,-4) rotate(${f2(-sw)} 0 ${-D.hip}) translate(0,${f2(-lift(-sw))})`);
    const h = handPos(), swing = st.ma > 0.5 ? 0 : -14 * ph;
    const hx = h.sh.x + (h.x - h.sh.x) * Math.cos(swing * Math.PI / 180) - (h.y - h.sh.y) * Math.sin(swing * Math.PI / 180);
    const hy = h.sh.y + (h.x - h.sh.x) * Math.sin(swing * Math.PI / 180) + (h.y - h.sh.y) * Math.cos(swing * Math.PI / 180);
    for (const n of [armNear, armNearO]) { n.setAttribute("x1", f2(h.sh.x)); n.setAttribute("y1", f2(h.sh.y)); n.setAttribute("x2", f2(hx)); n.setAttribute("y2", f2(hy)); }
    hand.setAttribute("cx", f2(hx)); hand.setAttribute("cy", f2(hy));
    armFar.setAttribute("x1", f2(h.sh.x - 16)); armFar.setAttribute("y1", f2(h.sh.y));
    armFar.setAttribute("x2", f2(h.sh.x - 16 + 60 * ph)); armFar.setAttribute("y2", f2(h.sh.y + D.shoulder - D.hip - 20));
  }
  return { st, draw, anchor, root };
}
