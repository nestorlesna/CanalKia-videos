// Laboratorio de poses de Kia: dibuja TODAS las poses de plantilla/kia.mjs en una sola hoja para ajustarlas rápido.
//   node plantilla/pose-lab.mjs                 → videos/_poselab/snapshots/contact-sheet.jpg (una celda por pose)
//   node plantilla/pose-lab.mjs SALUDO,PANZA    → solo esas poses
//   node plantilla/pose-lab.mjs --formato=9x16  → en vertical (default 16:9)
// Sin voz ni música. El nombre de la pose sale en el cartel. Si la hoja sale vacía (sin Kia): error de JS en kia.mjs
// o una pose con un valor inválido. Para probar poses nuevas: sumarlas a KIA_POSES y correr esto.
import { rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndex } from "./build-index.mjs";
import { KIA_POSES } from "./kia.mjs";
import { bareProject, snapshots } from "./make-video.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const only = args.find((a) => !a.startsWith("--"));
const fmt = (args.find((a) => a.startsWith("--formato=")) || "--formato=16x9").split("=")[1];
const names = only ? only.split(",") : Object.keys(KIA_POSES);
const LAB = join(ROOT, "videos", "_poselab", fmt === "16x9" ? "" : fmt);
bareProject(LAB, "poselab");
rmSync(join(LAB, "audio_engine_meta.json"), { force: true });
const spec = { slug: "_poselab", music: false, formatos: [fmt], frames: [] };
const frames = names.map((n, i) => ({
  id: String(i + 1).padStart(2, "0"), kind: "escena", min: 1.2, cartel: { texto: n, chico: true, at: 0 },
  kia: { pose: n, x: KIA_POSES[n]?.v === 2 || KIA_POSES[n]?.v === 3 ? -20 : 0, y: 0, sc: 1 },
}));
const b = buildIndex({ dir: LAB, spec, fmt, frames });
b.warnings.filter((w) => !w.includes("sin voz")).forEach((w) => console.log(`  ⚠ ${w}`));
snapshots(LAB, b, b.frames.map((f) => (f.start + 0.9).toFixed(2)).join(","));
console.log(`· ${names.length} poses → videos/_poselab/${fmt === "16x9" ? "" : fmt + "/"}snapshots/contact-sheet.jpg`);
