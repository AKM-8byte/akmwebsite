// =============================================================
//  HARİTA
//  Kâğıt görünümlü SVG harita çizer, kamerayı (görüş alanını) hareket
//  ettirir ve her olayın oklarını, hatlarını ve sembollerini çizer.
//  Animasyonlar CSS ile yapılır (css/style.css → "Harita animasyonları").
// =============================================================
const MapView = (() => {
  const NS = "http://www.w3.org/2000/svg";

  // tools/build_map.py ile aynı projeksiyon. Birini değiştirirsen ötekini de değiştir.
  const KY = 40;
  const KX = KY * Math.cos((41 * Math.PI) / 180);
  const LON0 = -2;
  const LAT_TOP = 52;

  // Yakın şehirlerin yazıları üst üste binmesin diye yazının yönü (varsayılan sağ)
  const LABEL_SIDE = {
    havza: "l", inonu: "l", kutahya: "l", dumlupinar: "l", mudanya: "l", hacibektas: "l",
    kocatepe: "b", polatli: "b", sarikamis: "b", tokat: "b", usak: "b", bursa: "t",
    kars: "t", amasya: "b", lausanne: "t",
  };

  let svg, trailG, activeG, cityG;
  let cam = { x: 0, y: 0, w: MAP_DATA.width, h: MAP_DATA.height };
  let lastBox = VIEWS.anatolia;
  let camFrame = 0;
  let uid = 0;

  // [boylam, enlem] → harita koordinatı
  const project = ([lon, lat]) => [(lon - LON0) * KX, (LAT_TOP - lat) * KY];
  // Şehir adı ya da [boylam, enlem] kabul eder
  const xy = (p) => project(typeof p === "string" ? CITIES[p].c : p);

  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs || {}) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  // Ekranda sabit boyutta kalan sembol (şehir noktası, ok ucu, mühür...).
  // Kamera yaklaşıp uzaklaştıkça updateSymbols() ölçeğini düzeltir.
  function symbol(parent, p, cls, rot) {
    const [x, y] = p.isXY ? p : xy(p); // isXY: zaten harita koordinatı
    const g = el("g", { class: "sym " + (cls || "") }, parent);
    g.dataset.x = x;
    g.dataset.y = y;
    if (rot) g.dataset.rot = rot;
    return el("g", { class: "sym-in" }, g); // içteki grup animasyon için
  }

  function xyPoint(x, y) {
    const a = [x, y];
    a.isXY = true;
    return a;
  }

  // Noktalardan yumuşak bir eğri (Catmull-Rom → Bezier)
  function smoothPath(pts, closed) {
    if (pts.length < 3 && !closed) return "M" + pts.map((p) => p.join(",")).join("L");
    const n = pts.length;
    const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    let d = "M" + pts[0].join(",");
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1.join(",")} ${c2.join(",")} ${p2.join(",")}`;
    }
    return d + (closed ? "Z" : "");
  }

  // ---------------------------------------------------------
  //  Sabit harita (bir kez çizilir)
  // ---------------------------------------------------------
  function init(svgNode) {
    svg = svgNode;
    const W = MAP_DATA.width, H = MAP_DATA.height;
    const defs = el("defs", {}, svg);

    // Sevr bölgeleri için çapraz tarama desenleri
    for (const side of ["tr", "gr", "en", "it", "fr", "am", "ku"]) {
      const pat = el("pattern", { id: "hatch-" + side, width: 7, height: 7,
        patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
      el("line", { x1: 0, y1: 0, x2: 0, y2: 7, class: "hatch side-" + side }, pat);
    }

    el("rect", { x: -3000, y: -3000, width: W + 6000, height: H + 6000, class: "sea" }, svg);

    // Enlem-boylam çizgileri (5 derecede bir)
    const grat = el("g", { class: "grat" }, svg);
    for (let lon = 0; lon <= 50; lon += 5) {
      const [x] = project([lon, 0]);
      el("line", { x1: x, y1: 0, x2: x, y2: H }, grat);
    }
    for (let lat = 30; lat <= 50; lat += 5) {
      const [, y] = project([0, lat]);
      el("line", { x1: 0, y1: y, x2: W, y2: y }, grat);
    }

    // Kıyı çizgisi etrafındaki eski harita usulü dalga çizgileri
    for (const c of ["coast c1", "coast c2", "coast c3", "coast c4"]) {
      el("path", { d: MAP_DATA.land, class: c }, svg);
    }
    el("path", { d: MAP_DATA.land, class: "land" }, svg);
    el("path", { d: MAP_DATA.rivers, class: "river" }, svg);
    el("path", { d: MAP_DATA.lakes, class: "lake" }, svg);

    // Deniz ve nehir adları
    const labels = el("g", { class: "map-labels" }, svg);
    for (const l of MAP_LABELS) {
      const g = symbol(labels, l.c, "maplabel " + l.kind);
      el("text", { "text-anchor": "middle", "data-tr": l.tr, "data-en": l.en }, g);
    }

    trailG = el("g", { class: "trail still" }, svg);
    activeG = el("g", { class: "active" }, svg);

    // Şehirler
    cityG = el("g", { class: "cities" }, svg);
    for (const id in CITIES) {
      const c = CITIES[id];
      const g = symbol(cityG, id, "city" + (c.base ? " base" : ""));
      g.parentNode.dataset.id = id;
      el("circle", { r: 3.2, class: "dot" }, g);
      const side = LABEL_SIDE[id] || "r";
      const pos = { r: [6, 4, "start"], l: [-6, 4, "end"], t: [0, -7, "middle"], b: [0, 15, "middle"] }[side];
      el("text", { x: pos[0], y: pos[1], "text-anchor": pos[2], "data-tr": c.tr, "data-en": c.en }, g);
    }

    window.addEventListener("resize", () => moveTo(lastBox, { instant: true }));
  }

  // ---------------------------------------------------------
  //  Kamera
  // ---------------------------------------------------------
  // Coğrafi kutuyu, ekran oranına uyan bir görüş alanına çevirir
  function boxToCam(box) {
    let [x1, y1] = project([box[0], box[3]]);
    const [x2, y2] = project([box[2], box[1]]);
    let w = x2 - x1, h = y2 - y1;
    const ratio = (svg.clientWidth || 1) / (svg.clientHeight || 1);
    if (w / h < ratio) { const nw = h * ratio; x1 -= (nw - w) / 2; w = nw; }
    else { const nh = w / ratio; y1 -= (nh - h) / 2; h = nh; }
    return { x: x1, y: y1, w, h };
  }

  function applyCam() {
    svg.setAttribute("viewBox", `${cam.x} ${cam.y} ${cam.w} ${cam.h}`);
    const k = cam.w / (svg.clientWidth || 1); // 1 ekran pikseli kaç harita birimi
    svg.style.setProperty("--k", k);
    for (const s of svg.querySelectorAll(".sym")) {
      const rot = s.dataset.rot ? ` rotate(${s.dataset.rot})` : "";
      s.setAttribute("transform", `translate(${s.dataset.x} ${s.dataset.y}) scale(${k})${rot}`);
    }
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // Kamerayı bir coğrafi kutuya götürür. from verilirse önce oradan başlar.
  function moveTo(box, opts = {}) {
    lastBox = box;
    svg.classList.toggle("far", box[2] - box[0] > 30); // Avrupa görünümünde küçük şehir adlarını gizle
    cancelAnimationFrame(camFrame);
    const end = boxToCam(box);
    if (opts.instant) { cam = end; applyCam(); return; }
    let start = { ...cam };
    let hold = 0;
    if (opts.from) { start = boxToCam(opts.from); cam = start; applyCam(); hold = 1300; }
    const dur = opts.from ? 2200 : 1300;
    // Merkez doğrusal, genişlik logaritmik değişsin: yakınlaşma daha doğal görünür
    const sc = [start.x + start.w / 2, start.y + start.h / 2];
    const ec = [end.x + end.w / 2, end.y + end.h / 2];
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.max(0, Math.min(1, (now - t0 - hold) / dur));
      const e = ease(t);
      const w = Math.exp(Math.log(start.w) + (Math.log(end.w) - Math.log(start.w)) * e);
      const h = w * (end.h / end.w);
      const cx = sc[0] + (ec[0] - sc[0]) * e, cy = sc[1] + (ec[1] - sc[1]) * e;
      cam = { x: cx - w / 2, y: cy - h / 2, w, h };
      applyCam();
      if (t < 1) camFrame = requestAnimationFrame(step);
    };
    camFrame = requestAnimationFrame(step);
  }

  // ---------------------------------------------------------
  //  Olay katmanları
  // ---------------------------------------------------------
  function timing(node, layer, dur) {
    node.style.setProperty("--t0", (layer.t0 || 0) + "s");
    if (dur) node.style.setProperty("--dur", dur + "s");
  }

  // Kesik çizgili bir yolu "çizilerek" göstermek için maske kullanılır
  function drawable(parent, d, cls, layer, dur, dashed) {
    const path = el("path", { d, class: cls }, parent);
    if (!dashed) {
      path.setAttribute("pathLength", 1);
      path.classList.add("draw");
      timing(path, layer, dur);
      return path;
    }
    const id = "m" + ++uid;
    const defs = el("defs", {}, parent);
    const mask = el("mask", { id, maskUnits: "userSpaceOnUse", x: -3000, y: -3000, width: 9000, height: 9000 }, defs);
    const m = el("path", { d, class: "mask-stroke draw", pathLength: 1 }, mask);
    timing(m, layer, dur);
    path.setAttribute("mask", `url(#${id})`);
    path.classList.add("dashed");
    return path;
  }

  function arrowHead(parent, tip, from, side, layer, dur) {
    const angle = (Math.atan2(tip[1] - from[1], tip[0] - from[0]) * 180) / Math.PI;
    const g = symbol(parent, xyPoint(tip[0], tip[1]), "head fade side-" + side, angle);
    timing(g.parentNode, { t0: (layer.t0 || 0) + dur * 0.85 });
    el("path", { d: "M3,0 L-13,-8.5 L-8,0 L-13,8.5Z" }, g);
  }

  const draw = {
    route(parent, L, still) {
      const pts = L.pts.map(xy);
      drawable(parent, smoothPath(pts), "route " + L.kind, L, L.dur || 2, L.kind === "sea");
      if (!still) for (const p of L.pts) if (typeof p === "string") hot.add(p);
      for (const p of L.pts) if (typeof p === "string") seen.add(p);
    },

    arrow(parent, L) {
      const a = xy(L.from), b = xy(L.to);
      let d, before;
      if (L.via) {
        const pts = [a, ...L.via.map(xy), b];
        d = smoothPath(pts);
        before = pts[pts.length - 2];
      } else {
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const bend = L.bend || 0;
        before = [mx - dy * bend, my + dx * bend];
        d = `M${a.join(",")}Q${before.join(",")} ${b.join(",")}`;
      }
      const dur = L.dur || 1.5;
      drawable(parent, d, "arrow side-" + L.side, L, dur, L.dashed);
      arrowHead(parent, b, before, L.side, L, dur);
      for (const p of [L.from, L.to]) if (typeof p === "string") hot.add(p);
    },

    front(parent, L) {
      const d = smoothPath(L.pts.map(xy));
      drawable(parent, d, "front side-" + L.side, L, 1.2);
      const teeth = el("path", { d, class: "front-teeth fade side-" + L.side }, parent);
      timing(teeth, { t0: (L.t0 || 0) + 0.8 });
    },

    zone(parent, L) {
      const pts = L.pts.map(xy);
      const poly = el("path", { d: smoothPath(pts, true), class: "zone fade side-" + L.side,
        fill: `url(#hatch-${L.side})` }, parent);
      timing(poly, L);
      if (L.label) {
        // lp verilmişse yazı oraya, yoksa bölgenin ortasına konur
        const [cx, cy] = L.lp ? xy(L.lp)
          : [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
        const g = symbol(parent, xyPoint(cx, cy), "zone-label fade side-" + L.side);
        timing(g.parentNode, { t0: (L.t0 || 0) + 0.3 });
        el("text", { "text-anchor": "middle", y: 4, "data-tr": L.label.tr, "data-en": L.label.en }, g);
      }
    },

    pulse(parent, L) {
      const g = symbol(parent, L.p, "pulse pop" + (L.big ? " big" : ""));
      timing(g.parentNode, L);
      el("circle", { r: 13, class: "ring" }, g);
      el("circle", { r: 13, class: "ring r2" }, g);
      el("circle", { r: 5, class: "core" }, g);
      if (typeof L.p === "string") hot.add(L.p);
    },

    battle(parent, L) {
      const g = symbol(parent, L.p, "battle pop");
      timing(g.parentNode, L);
      el("circle", { r: 13, class: "burst" }, g);
      el("path", { d: "M-9,-9 L9,9 M9,-9 L-9,9 M-11,-5 L-5,-11 M11,-5 L5,-11", class: "swords" }, g);
      if (typeof L.p === "string") hot.add(L.p);
    },

    seal(parent, L) {
      const g = symbol(parent, L.p, "seal pop");
      timing(g.parentNode, L);
      el("circle", { r: 11, cx: 14, cy: -14, class: "wax" }, g);
      el("circle", { r: 7, cx: 14, cy: -14, class: "wax-ring" }, g);
      el("path", { d: "M14,-19 l1.5,3.2 3.5,.4 -2.6,2.4 .7,3.4 -3.1,-1.7 -3.1,1.7 .7,-3.4 -2.6,-2.4 3.5,-.4z", class: "wax-star" }, g);
      if (typeof L.p === "string") hot.add(L.p);
    },

    star(parent, L) {
      // Ay-yıldız: Ankara'daki yeni meclisin simgesi
      const g = symbol(parent, L.p, "crescent pop");
      timing(g.parentNode, L);
      el("path", { d: "M-2,-30 a12,12 0 1,0 0,22 a9.6,9.6 0 1,1 0,-22z", class: "c-moon" }, g);
      el("path", { d: "M8,-19 l1.6,4.6 4.8,0 -3.9,2.8 1.5,4.6 -4,-2.8 -4,2.8 1.5,-4.6 -3.9,-2.8 4.8,0z", class: "c-moon" }, g);
    },

    ships(parent, L) {
      const g = symbol(parent, L.p, "ships pop");
      timing(g.parentNode, L);
      const hull = (x, y) => `M${x - 9},${y} L${x + 9},${y} L${x + 6},${y + 4} L${x - 7},${y + 4}Z M${x - 3},${y} v-4 h6 v4 M${x},${y - 4} v-5`;
      el("path", { d: hull(-12, 0) + hull(10, -6) + hull(4, 10), class: "ship side-en" }, g);
    },

    rays(parent, L) {
      const c = xy(L.from);
      L.to.forEach((t, i) => {
        const p = xy(t);
        const [a, b] = L.inward ? [p, c] : [c, p];
        const sub = { t0: (L.t0 || 0) + i * 0.18 };
        drawable(parent, `M${a.join(",")}L${b.join(",")}`, "ray", sub, 0.9);
        const dot = symbol(parent, t, "ray-dot pop");
        timing(dot.parentNode, { t0: sub.t0 + (L.inward ? 0 : 0.8) });
        el("circle", { r: 3 }, dot);
        hot.add(t);
      });
      hot.add(L.from);
    },
  };

  let hot = new Set();  // şu anki olayda vurgulanan şehirler
  let seen = new Set(); // önceki olaylarda yolu geçen şehirler

  // index'teki olayı haritada göster. animate=false ise son hâlini anında çizer.
  function showEvent(index, animate) {
    const ev = EVENTS[index];
    hot = new Set();
    seen = new Set();
    trailG.replaceChildren();
    activeG.replaceChildren();
    activeG.classList.toggle("still", !animate);

    // Önceki olaylardan kalan izler (Mustafa Kemal'in yolu gibi)
    for (let i = 0; i < index; i++) {
      for (const L of EVENTS[i].layers) if (L.keep) draw[L.type](trailG, L, true);
    }
    for (const L of ev.layers) draw[L.type](activeG, L, false);

    for (const g of cityG.querySelectorAll(".sym")) {
      g.classList.toggle("hot", hot.has(g.dataset.id));
      g.classList.toggle("seen", seen.has(g.dataset.id));
    }
    setLang(document.documentElement.lang);
    applyCam(); // yeni sembollerin ölçeği hemen doğru olsun

    if (animate) moveTo(ev.view, { from: ev.from });
    else moveTo(ev.view, { instant: true });
  }

  // Haritadaki bütün yazıları seçili dile çevirir
  function setLang(lang) {
    for (const t of svg.querySelectorAll("text[data-tr]")) t.textContent = t.dataset[lang];
  }

  return { init, showEvent, setLang };
})();
