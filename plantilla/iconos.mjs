// Íconos y objetos del canal de Kia: SVG planos con el contorno marrón grueso de la identidad (nada de emojis dentro
// del video: Chrome headless en Windows los dibuja mal). Ver todos: node plantilla/make-video.mjs --iconos
//
// Cada entrada: { vb: [ancho, alto], base: true|false, svg }. vb por defecto [120, 120].
//   base: true = el objeto se apoya en el piso (en el escenario, `pos` es el centro de su base); si no, `pos` es el centro.
// Colores: variables de la identidad (--line, --fur, --cream, --ball, --ocre…) con un valor de respaldo.
const L = "var(--line,#2B1D14)", FUR = "var(--fur,#D9965B)", BELLY = "var(--belly,#EDBE8C)", CREAM = "var(--cream,#FFE7A3)";
const BALL = "var(--ball,#2E7DD1)", OCRE = "var(--ocre,#F2B93B)", PAW = "var(--paw,#B08C38)", RED = "var(--red,#E2574C)";
const PINK = "var(--pink,#E86B7A)", WHITE = "#FFFFFF", GREEN = "var(--leaf,#5FB55B)", BLUE2 = "#68A1DE";
const s = (w = 6) => `stroke="${L}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

export const ICONOS = {
  huella: { svg: `<g fill="${PAW}"><ellipse cx="60" cy="78" rx="27" ry="23"/><ellipse cx="28" cy="48" rx="11" ry="14" transform="rotate(-20 28 48)"/><ellipse cx="48" cy="30" rx="11" ry="14" transform="rotate(-6 48 30)"/><ellipse cx="72" cy="30" rx="11" ry="14" transform="rotate(6 72 30)"/><ellipse cx="92" cy="48" rx="11" ry="14" transform="rotate(20 92 48)"/></g>` },
  "huella-osc": { svg: `<g fill="${L}"><ellipse cx="60" cy="78" rx="27" ry="23"/><ellipse cx="28" cy="48" rx="11" ry="14" transform="rotate(-20 28 48)"/><ellipse cx="48" cy="30" rx="11" ry="14" transform="rotate(-6 48 30)"/><ellipse cx="72" cy="30" rx="11" ry="14" transform="rotate(6 72 30)"/><ellipse cx="92" cy="48" rx="11" ry="14" transform="rotate(20 92 48)"/></g>` },
  pelota: { svg: `<circle cx="60" cy="60" r="50" fill="${BALL}" ${s(7)}/><path d="M 18 42 Q 60 62 102 42 M 18 78 Q 60 58 102 78" fill="none" stroke="${WHITE}" stroke-width="6" stroke-linecap="round"/>` },
  hueso: { svg: `<path d="M 30 44 C 14 28 34 14 42 30 L 78 30 C 86 14 106 28 90 44 C 106 60 86 74 78 58 L 42 58 C 34 74 14 60 30 44 Z" fill="${WHITE}" ${s()} transform="translate(0,16)"/>` },
  corazon: { svg: `<path d="M 60 102 C 18 74 8 52 14 36 C 22 14 50 14 60 36 C 70 14 98 14 106 36 C 112 52 102 74 60 102 Z" fill="${PINK}" ${s()}/><ellipse cx="34" cy="38" rx="8" ry="5" fill="${WHITE}" opacity="0.6" transform="rotate(-30 34 38)"/>` },
  aro: { vb: [240, 160], svg: `<ellipse cx="120" cy="80" rx="108" ry="68" fill="none" stroke="${WHITE}" stroke-width="12" stroke-dasharray="26 18" stroke-linecap="round" opacity="0.95"/><ellipse cx="120" cy="80" rx="108" ry="68" fill="none" stroke="${PINK}" stroke-width="5" stroke-dasharray="26 18" stroke-linecap="round"/><path d="M 214 14 l 6 14 l 14 6 l -14 6 l -6 14 l -6 -14 l -14 -6 l 14 -6 Z M 26 116 l 4 10 l 10 4 l -10 4 l -4 10 l -4 -10 l -10 -4 l 10 -4 Z" fill="${WHITE}" ${s(4)}/>` },
  zzz: { vb: [150, 110], svg: `<g fill="${PAW}" font-family="var(--font-display,'Fredoka')" font-weight="700"><text x="4" y="104" font-size="64">Z</text><text x="52" y="70" font-size="48">z</text><text x="94" y="40" font-size="36">z</text></g>` },
  "z-letra": { svg: `<text x="60" y="96" text-anchor="middle" font-size="100" fill="${PAW}" font-family="var(--font-display,'Fredoka')" font-weight="700">Z</text>` },
  pregunta: { svg: `<circle cx="60" cy="60" r="50" fill="${WHITE}" ${s()}/><text x="60" y="88" text-anchor="middle" font-size="80" fill="${L}" font-family="var(--font-display,'Fredoka')" font-weight="700">?</text>` },
  exclamacion: { svg: `<circle cx="60" cy="60" r="50" fill="${OCRE}" ${s()}/><text x="60" y="88" text-anchor="middle" font-size="80" fill="${L}" font-family="var(--font-display,'Fredoka')" font-weight="700">!</text>` },
  flecha: { vb: [160, 80], svg: `<path d="M 10 40 L 120 40 M 92 12 L 128 40 L 92 68" fill="none" ${s(12)}/>` },
  velocidad: { vb: [160, 120], svg: `<g ${s(9)}><path d="M 150 20 L 40 20"/><path d="M 130 60 L 10 60"/><path d="M 150 100 L 50 100"/></g>` },
  gota: { svg: `<path d="M 60 14 C 74 40 92 58 92 76 C 92 96 76 106 60 106 C 44 106 28 96 28 76 C 28 58 46 40 60 14 Z" fill="#9FD3F2" ${s()}/>` },
  estrella: { svg: `<path d="M 60 10 L 74 44 L 110 46 L 82 70 L 92 106 L 60 86 L 28 106 L 38 70 L 10 46 L 46 44 Z" fill="${OCRE}" ${s()}/>` },
  mochila: { svg: `<path d="M 40 30 C 40 10 80 10 80 30" fill="none" ${s(7)}/><rect x="22" y="28" width="76" height="82" rx="20" fill="${RED}" ${s()}/><rect x="36" y="64" width="48" height="30" rx="8" fill="#F08A80" ${s(5)}/>` },
  cuchara: { svg: `<ellipse cx="60" cy="30" rx="18" ry="24" fill="#C9CED6" ${s()}/><path d="M 60 54 L 60 110" ${s(10)}/>` },
  olla: { vb: [160, 120], base: true, svg: `<path d="M 6 46 L 30 46 M 130 46 L 154 46" ${s(10)}/><path d="M 24 36 L 136 36 L 128 108 C 126 116 120 118 112 118 L 48 118 C 40 118 34 116 32 108 Z" fill="#8A93A0" ${s()}/><rect x="18" y="26" width="124" height="16" rx="8" fill="#A8B0BB" ${s()}/><path d="M 60 18 Q 66 6 60 -4 M 90 18 Q 96 6 90 -4" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.8"/>` },
  zanahoria: { svg: `<path d="M 30 40 C 50 30 74 34 88 48 L 30 108 C 20 112 12 104 16 94 Z" fill="#F08A2C" ${s()}/><path d="M 84 44 C 86 26 96 16 108 14 M 86 46 C 100 38 112 40 116 48 M 82 42 C 76 28 78 16 86 8" fill="none" stroke="${GREEN}" stroke-width="8" stroke-linecap="round"/><path d="M 42 62 L 52 66 M 34 78 L 44 82" stroke="${L}" stroke-width="4" stroke-linecap="round"/>` },
  pollo: { svg: `<path d="M 44 24 C 74 14 102 36 98 64 C 94 88 70 98 52 92 C 30 86 18 64 26 44 C 30 34 36 28 44 24 Z" fill="#E8B76A" ${s()}/><path d="M 40 50 Q 56 44 66 54 M 48 70 Q 62 64 74 72" fill="none" stroke="#C98A3C" stroke-width="5" stroke-linecap="round"/>` },
  manzana: { svg: `<path d="M 60 34 C 40 20 14 30 14 60 C 14 90 38 112 60 102 C 82 112 106 90 106 60 C 106 30 80 20 60 34 Z" fill="${RED}" ${s()}/><path d="M 60 34 C 60 22 64 14 70 8" fill="none" ${s(6)}/><path d="M 66 24 C 76 10 94 12 96 18 C 88 26 76 28 66 24 Z" fill="${GREEN}" ${s(4)}/>` },
  puerta: { vb: [220, 420], base: true, svg: `<rect x="10" y="10" width="200" height="404" rx="10" fill="#B7794A" ${s(8)}/><rect x="34" y="40" width="152" height="150" rx="8" fill="#C98A58" ${s(5)}/><rect x="34" y="224" width="152" height="160" rx="8" fill="#C98A58" ${s(5)}/><circle cx="176" cy="220" r="12" fill="${OCRE}" ${s(5)}/>` },
  sombra: { vb: [600, 640], base: true, svg: `<g fill="#2B1D14" opacity="0.22"><path d="M 150 640 C 110 520 120 380 180 320 L 420 320 C 480 380 490 520 450 640 Z"/><path d="M 140 210 C 120 110 200 40 300 40 C 400 40 480 110 460 210 C 450 280 400 340 300 340 C 200 340 150 280 140 210 Z"/><path d="M 150 120 C 90 120 60 190 92 250 C 112 240 140 200 160 160 Z"/><path d="M 450 120 C 510 120 540 190 508 250 C 488 240 460 200 440 160 Z"/><path d="M 210 250 C 230 330 370 330 390 250 C 380 300 220 300 210 250 Z"/></g><g fill="#2B1D14" opacity="0.30"><path d="M 170 330 L 430 330 L 420 362 L 180 362 Z"/><path d="M 200 330 L 214 300 L 228 330 Z M 260 330 L 274 300 L 288 330 Z M 320 330 L 334 300 L 348 330 Z M 380 330 L 394 300 L 408 330 Z"/></g>` },
  pantalla: { vb: [340, 260], base: true, svg: `<rect x="10" y="10" width="320" height="200" rx="18" fill="#2F3440" ${s(8)}/><rect x="30" y="30" width="280" height="160" rx="8" fill="#5FC3B4"/><g font-family="var(--font-display,'Fredoka')" font-weight="700" fill="#1E4F48" font-size="34"><text x="48" y="72">01#@%</text><text x="60" y="118">{ ;) }</text><text x="160" y="164">x=?</text></g><path d="M 150 210 L 140 246 L 200 246 L 190 210 Z" fill="#2F3440" ${s(6)}/><rect x="110" y="240" width="120" height="16" rx="8" fill="#2F3440" ${s(6)}/>` },
  joystick: { vb: [200, 120], svg: `<path d="M 30 40 C 10 40 4 70 10 92 C 16 112 40 112 52 94 L 148 94 C 160 112 184 112 190 92 C 196 70 190 40 170 40 Z" fill="#59606E" ${s()}/><circle cx="56" cy="66" r="12" fill="#2F3440"/><circle cx="140" cy="58" r="9" fill="${RED}"/><circle cx="158" cy="74" r="9" fill="${BALL}"/>` },
  marco: { vb: [300, 340], svg: `<rect x="10" y="10" width="280" height="320" rx="16" fill="${WHITE}" ${s(8)} transform="rotate(-4 150 170)"/><rect x="34" y="34" width="232" height="210" rx="8" fill="#9FD3F2" transform="rotate(-4 150 170)"/><g transform="rotate(-4 150 170)"><path d="M 34 244 L 110 150 L 160 210 L 200 170 L 266 244 Z" fill="${GREEN}"/><circle cx="220" cy="80" r="24" fill="${OCRE}"/></g>` },
  camara: { vb: [160, 120], svg: `<rect x="10" y="30" width="140" height="84" rx="16" fill="#59606E" ${s()}/><path d="M 50 30 L 60 12 L 100 12 L 110 30 Z" fill="#59606E" ${s()}/><circle cx="80" cy="72" r="28" fill="#2F3440" ${s(5)}/><circle cx="80" cy="72" r="12" fill="#9FD3F2"/>` },
  lapiz: { vb: [160, 60], svg: `<path d="M 10 30 L 34 14 L 140 14 L 150 30 L 140 46 L 34 46 Z" fill="${OCRE}" ${s()}/><path d="M 10 30 L 34 14 L 34 46 Z" fill="${BELLY}" ${s(5)}/>` },
  suscribite: { vb: [440, 120], svg: `<rect x="8" y="8" width="424" height="104" rx="52" fill="${RED}" ${s(8)}/><text x="220" y="80" text-anchor="middle" font-size="58" fill="${WHITE}" font-family="var(--font-display,'Fredoka')" font-weight="700" letter-spacing="2">SUSCRIBITE</text>` },
  campana: { svg: `<path d="M 60 12 C 36 12 26 32 26 52 L 26 74 L 14 92 L 106 92 L 94 74 L 94 52 C 94 32 84 12 60 12 Z" fill="${OCRE}" ${s()}/><circle cx="60" cy="102" r="12" fill="${OCRE}" ${s()}/><path d="M 12 30 Q 6 46 12 62 M 108 30 Q 114 46 108 62" fill="none" ${s(5)}/>` },
  guau: { vb: [300, 190], svg: `<path d="M 30 20 L 270 20 Q 290 20 290 40 L 290 130 Q 290 150 270 150 L 120 150 L 70 184 L 80 150 L 30 150 Q 10 150 10 130 L 10 40 Q 10 20 30 20 Z" fill="${WHITE}" ${s(7)}/><text x="150" y="112" text-anchor="middle" font-size="76" fill="${L}" font-family="var(--font-display,'Fredoka')" font-weight="700">¡GUAU!</text>` },
  mesada: { vb: [520, 300], base: true, svg: `<rect x="10" y="10" width="500" height="40" rx="10" fill="#F5F0E4" ${s(7)}/><rect x="24" y="50" width="472" height="246" rx="6" fill="#C98A58" ${s(7)}/><rect x="48" y="74" width="196" height="196" rx="8" fill="#D9A06C" ${s(5)}/><rect x="276" y="74" width="196" height="196" rx="8" fill="#D9A06C" ${s(5)}/><circle cx="226" cy="172" r="9" fill="${OCRE}" ${s(4)}/><circle cx="294" cy="172" r="9" fill="${OCRE}" ${s(4)}/>` },
  almohadon: { vb: [360, 120], base: true, svg: `<path d="M 30 40 C 30 14 330 14 330 40 L 344 96 C 348 114 12 114 16 96 Z" fill="#8FB3E8" ${s(7)}/><path d="M 60 50 Q 180 66 300 50" fill="none" stroke="#6E93CC" stroke-width="6" stroke-linecap="round"/>` },
  nube: { vb: [200, 110], svg: `<path d="M 40 96 C 10 96 6 60 34 54 C 34 24 74 14 92 36 C 106 12 150 16 154 46 C 186 46 194 92 162 96 Z" fill="${WHITE}" ${s()} opacity="0.95"/>` },
  polvo: { vb: [160, 90], base: true, svg: `<g fill="#E8D3A6" ${s(5)}><circle cx="34" cy="62" r="24"/><circle cx="74" cy="50" r="32"/><circle cx="118" cy="62" r="24"/></g>` },
  ranking: { vb: [120, 120], svg: `<rect x="14" y="60" width="28" height="50" rx="4" fill="${BELLY}" ${s(5)}/><rect x="46" y="30" width="28" height="80" rx="4" fill="${OCRE}" ${s(5)}/><rect x="78" y="76" width="28" height="34" rx="4" fill="${BELLY}" ${s(5)}/><path d="M 60 6 L 64 16 L 74 16 L 66 22 L 69 32 L 60 26 L 51 32 L 54 22 L 46 16 L 56 16 Z" fill="${OCRE}" ${s(3)}/>` },
  logo: { svg: `<circle cx="60" cy="60" r="56" fill="${CREAM}" ${s(5)}/><g transform="translate(60,66) scale(0.27)"><path d="M -92 -50 C -101 -112 -90 -160 -70 -167 C -54 -172 -30 -126 -6 -86 Z M 92 -50 C 101 -112 90 -160 70 -167 C 54 -172 30 -126 6 -86 Z" fill="#3B2A22" stroke="${L}" stroke-width="10"/><path d="M -101 -8 C -103 -78 -62 -97 0 -97 C 62 -97 103 -78 101 -8 C 104 52 78 96 0 96 C -78 96 -104 52 -101 -8 Z" fill="${FUR}" stroke="${L}" stroke-width="10"/><ellipse cx="-47" cy="-7" rx="34" ry="26" fill="#5A3A28"/><ellipse cx="47" cy="-7" rx="34" ry="26" fill="#5A3A28"/><circle cx="-44" cy="-6" r="17" fill="#1C120E"/><circle cx="44" cy="-6" r="17" fill="#1C120E"/><circle cx="-37" cy="-13" r="6" fill="#FFF"/><circle cx="51" cy="-13" r="6" fill="#FFF"/><path d="M -140 55 C -140 10 -80 -2 0 -2 C 80 -2 140 10 140 55 C 140 90 92 99 0 99 C -92 99 -140 90 -140 55 Z" fill="#3A2E2B" stroke="${L}" stroke-width="8"/><path d="M -23 15 C -23 5 23 5 23 15 C 23 30 7 39 0 39 C -7 39 -23 30 -23 15 Z" fill="#141010"/></g>` },
  check: { svg: `<circle cx="60" cy="60" r="50" fill="${GREEN}" ${s()}/><path d="M 36 62 L 54 80 L 86 42" fill="none" stroke="${WHITE}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>` },
  cruz: { svg: `<circle cx="60" cy="60" r="50" fill="${RED}" ${s()}/><path d="M 40 40 L 80 80 M 80 40 L 40 80" stroke="${WHITE}" stroke-width="12" stroke-linecap="round"/>` },
  nota: { svg: `<path d="M 44 92 L 44 22 L 96 12 L 96 80" fill="none" ${s(8)}/><ellipse cx="34" cy="92" rx="16" ry="12" fill="${L}"/><ellipse cx="86" cy="82" rx="16" ry="12" fill="${L}"/>` },
};
export const ICON_NAMES = Object.keys(ICONOS);
const vbOf = (n) => (ICONOS[n] && ICONOS[n].vb) || [120, 120];

// <svg> suelto (HTML: carteles, barra superior, hoja de íconos)
export function icono(name, cls = "ico") {
  const ic = ICONOS[name];
  if (!ic) return "";
  const [w, h] = vbOf(name);
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${ic.svg}</svg>`;
}
// Contenido para meter dentro del escenario SVG: centrado en (0,0) o apoyado en la base, con ancho `size` px.
export function iconoG(name, size) {
  const ic = ICONOS[name];
  if (!ic) return { svg: "", w: 0, h: 0 };
  const [w, h] = vbOf(name), k = size / w;
  const dy = ic.base ? -h : -h / 2;
  return { svg: `<g transform="scale(${+k.toFixed(4)}) translate(${-w / 2},${dy})">${ic.svg}</g>`, w: size, h: h * k, base: !!ic.base };
}
