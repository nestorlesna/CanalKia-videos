/* Runtime del canal de Kia. window.__KIA_CONFIG lo inyecta plantilla/build-index.mjs:
 *   { W, H, total, thumb, frames[{id,start,dur,last}], anims[{sel,t,fx,dur,…}], scenes[{id,start,dur,kia,humanos,correas}] }
 * kiaRig / humanoRig / KIA_COL / HUM_DEF vienen de plantilla/kia.mjs y humanos.mjs (inyectados antes que este archivo).
 *
 * Todo es un único timeline GSAP pausado (seek-safe): cada animación es un fromTo con estado inicial explícito e
 * immediateRender:false. Los actores (Kia, humanos) tienen un proxy por escena: GSAP llama proxy.clave(v) y eso
 * redibuja la escena entera (Kia + humanos + correa + sombra). La "vida" de Kia (respirar, parpadear, orejitas)
 * sale del reloj de la escena (clave clk, un tween lineal de 0 a dur): determinista, sin Math.random ni Date.
 *
 * fx de anims: in/up · left/right · pop · fade · out · tween (from/to explícitos) · tick
 */
(function () {
  const C = window.__KIA_CONFIG;
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
  const IR = { immediateRender: false };
  const f2 = (v) => (+v).toFixed(2);
  const FX = {
    in: (a) => [{ opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: a.dur || 0.5, ease: "power3.out" }],
    up: (a) => [{ opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: a.dur || 0.5, ease: "power3.out" }],
    left: (a) => [{ opacity: 0, x: -80 }, { opacity: 1, x: 0, duration: a.dur || 0.5, ease: "power3.out" }],
    right: (a) => [{ opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: a.dur || 0.5, ease: "power3.out" }],
    pop: (a) => [{ opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: a.dur || 0.5, ease: "back.out(1.8)" }],
    fade: (a) => [{ opacity: 0 }, { opacity: 1, duration: a.dur || 0.4, ease: "power1.out" }],
    out: (a) => [{ opacity: 1 }, { opacity: 0, duration: a.dur || 0.3, ease: "power1.in" }],
    tick: (a) => [{ scale: 0 }, { scale: 1, duration: a.dur || 0.35, ease: "back.out(2)" }],
    tween: (a) => [Object.assign({}, a.from), Object.assign({}, a.to, { duration: a.dur || 0.6, ease: a.ease || "power2.inOut" })],
  };

  C.anims.forEach((a) => {
    const make = FX[a.fx] || FX.in;
    const [from, to] = make(a);
    if (a.fx !== "tween" && a.from) Object.assign(from, a.from);
    if (a.fx !== "tween" && a.to) Object.assign(to, a.to);
    const extra = {};
    // smoothOrigin: false — con el default de GSAP, el cambio de origen en un <g> SVG (medido mientras la escena está
    // oculta) se "compensa" corriendo el objeto: quedaba desplazado ~0,6 × medio tamaño hacia arriba a la izquierda.
    if (a.origin) { if (a.svg) extra.svgOrigin = a.origin; else { extra.transformOrigin = a.origin; from.transformOrigin = a.origin; } extra.smoothOrigin = false; from.smoothOrigin = false; }
    if (a.repeat) { extra.repeat = a.repeat; extra.yoyo = !!a.yoyo; }
    if (a.ease && a.fx !== "tween") extra.ease = a.ease;
    tl.fromTo(a.sel, Object.assign(from, a.svg && a.origin ? { svgOrigin: a.origin } : {}), Object.assign(to, extra, IR), a.t);
  });

  // ── Actores por escena ──
  const NS = "http://www.w3.org/2000/svg";
  (C.scenes || []).forEach((sc) => {
    const host = document.getElementById(`actors-${sc.id}`);
    if (!host) return;
    const S = { clk: 0 };
    const mk = (tag, attrs, p) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); p.appendChild(n); return n; };
    const shadowG = mk("g", {}, host);
    const humG = mk("g", {}, host);
    const kiaG = mk("g", { id: `kia-${sc.id}` }, host);
    const linkG = mk("g", {}, host);
    const humans = (sc.humanos || []).map((h) => {
      const r = humanoRig(humG, HUM_DEF[h.quien] || HUM_DEF.papa, KIA_COL);
      Object.assign(r.st, h.init);
      return r;
    });
    const kia = sc.kia ? kiaRig(kiaG, KIA_COL) : null;
    if (kia) Object.assign(kia.st, sc.kia.init);
    const shadow = kia && sc.kia.sombra !== false ? mk("ellipse", { cx: 0, cy: 6, rx: 120, ry: 15, fill: "rgba(43,29,20,0.16)" }, shadowG) : null;
    const links = (sc.correas || []).map((c) => mk("path", { fill: "none", stroke: c.color || "#D9473E", "stroke-width": 7, "stroke-linecap": "round" }, linkG));
    const fxg = document.getElementById(`kfx-${sc.id}`);
    const x0 = kia ? sc.kia.init.x : 0, y0 = kia ? sc.kia.init.y : 0;

    function drawAll() {
      humans.forEach((h) => h.draw(S.clk));
      if (kia) {
        kia.draw(S.clk);
        const st = kia.st, v = Math.round(st.v);
        if (shadow) {
          const lift = Math.min(0.6, Math.max(0, -st.jy) / 300);
          const w = (v === 0 ? 118 : 150) * st.sc * (1 - lift);
          shadow.setAttribute("cx", f2(st.x + (v === 0 ? 0 : st.fx * 10 * st.sc)));
          shadow.setAttribute("cy", f2(st.y + 6 * st.sc));
          shadow.setAttribute("rx", f2(w));
          shadow.setAttribute("ry", f2(15 * st.sc * (1 - lift)));
          shadow.setAttribute("opacity", Math.abs(st.rot) > 60 ? 0 : 1);
        }
        if (fxg) fxg.setAttribute("transform", `translate(${f2(st.x - x0)},${f2(st.y + st.jy * st.sc - y0)})`);
      }
      (sc.correas || []).forEach((c, i) => {
        if (!kia) return;
        const a = kia.anchor("collar");
        const b = typeof c.a === "number" && humans[c.a] ? humans[c.a].anchor() : { x: c.a[0], y: c.a[1] };
        const sag = c.sag ?? 60;
        const mx = (a.x + b.x) / 2, my = Math.max(a.y, b.y) + sag;
        links[i].setAttribute("d", `M ${f2(a.x)} ${f2(a.y)} Q ${f2(mx)} ${f2(my)} ${f2(b.x)} ${f2(b.y)}`);
      });
    }
    // proxy: clk + claves de Kia (k_<clave>) + de cada humano (h<i>_<clave>)
    const proxy = {};
    const def = (name, get, set) => { proxy[name] = function (v) { if (arguments.length === 0) return get(); set(v); drawAll(); }; };
    def("clk", () => S.clk, (v) => { S.clk = v; });
    if (kia) Object.keys(kia.st).forEach((k) => def(`k_${k}`, () => kia.st[k], (v) => { kia.st[k] = v; }));
    humans.forEach((h, i) => Object.keys(h.st).forEach((k) => def(`h${i}_${k}`, () => h.st[k], (v) => { h.st[k] = v; })));
    drawAll();

    tl.fromTo(proxy, { clk: 0 }, Object.assign({ clk: sc.dur, duration: sc.dur, ease: "none" }, IR), sc.start);
    const tweens = [];
    if (kia) sc.kia.tweens.forEach((m) => tweens.push({ m, p: "k_" }));
    (sc.humanos || []).forEach((h, i) => (h.tweens || []).forEach((m) => tweens.push({ m, p: `h${i}_` })));
    tweens.forEach(({ m, p }) => {
      const a = {}, b = {};
      Object.keys(m.to).forEach((k) => { a[p + k] = m.from[k]; b[p + k] = m.to[k]; });
      tl.fromTo(proxy, a, Object.assign(b, { duration: Math.max(0.01, m.dur), ease: m.ease || "sine.inOut" }, IR), sc.start + m.t);
    });
    // cortes: Kia desaparece un instante y aparece en la pose nueva (vistas distintas)
    if (kia) (sc.kia.cuts || []).forEach((t) => {
      tl.fromTo(kiaG, { opacity: 1 }, Object.assign({ opacity: 0, duration: 0.12, ease: "power1.in" }, IR), sc.start + t);
      tl.fromTo(kiaG, { opacity: 0 }, Object.assign({ opacity: 1, duration: 0.18, ease: "power1.out" }, IR), sc.start + t + 0.2);
    });
  });

  // Entradas/salidas de cada escena. La última queda quieta.
  C.frames.forEach((f) => {
    const sel = (s) => document.querySelector(s);
    const txt = `#txt-${f.id} .inner`, vis = `#vis-${f.id} .stage-in`, sub = `#sub-${f.id} .inner`;
    if (sel(txt)) tl.fromTo(txt, { opacity: 0 }, Object.assign({ opacity: 1, duration: 0.25 }, IR), f.start);
    tl.fromTo(vis, { opacity: 0 }, Object.assign({ opacity: 1, duration: 0.2 }, IR), f.start);
    if (!C.thumb && sel(sub)) tl.fromTo(sub, { opacity: 0, y: 14 }, Object.assign({ opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, IR), f.start + 0.12);
    if (!f.last) {
      if (sel(txt)) tl.to(txt, { opacity: 0, duration: 0.22, ease: "power1.in" }, f.start + f.dur - 0.24);
      tl.to(vis, { opacity: 0, duration: 0.2, ease: "power1.in" }, f.start + f.dur - 0.22);
      if (!C.thumb && sel(sub)) tl.to(sub, { opacity: 0, duration: 0.2 }, f.start + f.dur - 0.22);
    }
  });
  if (document.querySelector("#topbar")) tl.fromTo("#topbar .inner", { opacity: 0 }, Object.assign({ opacity: 1, duration: 0.4 }, IR), C.topbarAt || 0);
  if (document.querySelector("#progress-fill")) tl.fromTo("#progress-fill", { scaleX: 0 }, Object.assign({ scaleX: 1, duration: C.total, ease: "none" }, IR), 0);

  // Textos que no entran en su caja: se achican (no se cortan ni pisan nada).
  function fit() {
    document.querySelectorAll("[data-fit]").forEach((n) => {
      const max = +n.getAttribute("data-fit"), clip = n.closest(".clip"), prev = clip ? clip.style.display : "";
      if (clip) clip.style.display = "block";
      // se achica la letra (no con transform: así el layout real entra y el check no lo marca)
      if (!n.dataset.fs) n.dataset.fs = parseFloat(getComputedStyle(n).fontSize);
      let fs = +n.dataset.fs;
      n.style.fontSize = `${fs}px`;
      for (let i = 0; i < 12 && n.scrollWidth > max; i++) { fs *= Math.max(0.8, (max / n.scrollWidth) * 0.99); n.style.fontSize = `${fs.toFixed(1)}px`; }
      if (clip) clip.style.display = prev;
    });
  }
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  window.__timelines["main"] = tl;
  tl.seek(0);
})();
