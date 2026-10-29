// =============================================================
//  ZAMAN ÇUBUĞU
//  Olay işaretleri eşit aralıklıdır (yakın tarihli olaylara da kolayca
//  dokunulabilsin diye). Yıl çizgileri tarihe göre arada bir yere konur.
//  Sürükleme, işarete dokunma, oynat/durdur ve ileri/geri burada.
// =============================================================
const Timeline = (() => {
  const DWELL = 9000; // oynatırken her olayda kaç milisaniye durulacak

  let n = 0, index = 0, playing = false, frame = 0, playStart = 0;
  let onSelect = () => {};
  let track, handle, fill, marks, playBtn;

  const pct = (p) => (n > 1 ? (p / (n - 1)) * 100 : 0) + "%";
  const toDate = (s) => new Date(s + "T12:00:00");

  function init(opts) {
    onSelect = opts.onSelect;
    n = EVENTS.length;
    track = document.getElementById("tl-track");
    handle = document.getElementById("tl-handle");
    fill = document.getElementById("tl-fill");
    marks = document.getElementById("tl-marks");
    playBtn = document.getElementById("tl-play");
    track.setAttribute("aria-valuemax", n);

    // Olay işaretleri
    EVENTS.forEach((ev, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tl-mark cat-" + ev.cat;
      if (i < 2) b.classList.add("edge-l"); // kenardaki işaretlerin yazısı ekrandan taşmasın
      if (i > EVENTS.length - 4) b.classList.add("edge-r");
      b.style.left = pct(i);
      b.addEventListener("click", (e) => { e.stopPropagation(); select(i); });
      b.addEventListener("pointerdown", (e) => e.stopPropagation());
      marks.appendChild(b);
    });

    // Yıl çizgileri: 1 Ocak'ın iki olay arasında nereye düştüğünü hesapla
    const years = document.getElementById("tl-years");
    years.innerHTML = `<span style="left:0%">1919</span>`;
    for (let y = 1920; y <= 1923; y++) {
      const jan1 = toDate(`${y}-01-01`);
      for (let i = 0; i < n - 1; i++) {
        const a = toDate(EVENTS[i].date), b = toDate(EVENTS[i + 1].date);
        if (a <= jan1 && jan1 < b) {
          years.innerHTML += `<span class="tick" style="left:${pct(i + (jan1 - a) / (b - a))}">${y}</span>`;
          break;
        }
      }
    }

    // Sürükleme
    track.addEventListener("pointerdown", (e) => {
      stop();
      track.setPointerCapture(e.pointerId);
      track.classList.add("dragging");
      dragTo(e);
    });
    track.addEventListener("pointermove", (e) => { if (track.hasPointerCapture(e.pointerId)) dragTo(e); });
    const endDrag = (e) => {
      if (!track.hasPointerCapture(e.pointerId)) return;
      track.releasePointerCapture(e.pointerId);
      track.classList.remove("dragging");
      setPos(index);
    };
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);

    // Düğmeler ve klavye
    document.getElementById("tl-prev").addEventListener("click", () => { stop(); select(index - 1); });
    document.getElementById("tl-next").addEventListener("click", () => { stop(); select(index + 1); });
    playBtn.addEventListener("click", () => (playing ? stop() : play()));
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { stop(); select(index - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { stop(); select(index + 1); e.preventDefault(); }
    });
  }

  function dragTo(e) {
    const r = track.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (n - 1);
    setPos(p);
    const nearest = Math.round(p);
    if (nearest !== index) select(nearest, { keepHandle: true });
  }

  function setPos(p) {
    handle.style.left = pct(p);
    fill.style.width = pct(p);
  }

  // i. olaya geç
  function select(i, opts = {}) {
    if (i < 0 || i >= n) return;
    index = i;
    if (!opts.keepHandle) setPos(i);
    [...marks.children].forEach((m, j) => {
      m.classList.toggle("active", j === i);
      m.classList.toggle("past", j < i);
    });
    track.setAttribute("aria-valuenow", i + 1);
    onSelect(i);
    if (playing) playStart = performance.now();
  }

  // Oynat: çubuk zamanla bir sonraki olaya doğru akar
  function play() {
    if (index >= n - 1) select(0);
    playing = true;
    playBtn.classList.add("on");
    playStart = performance.now();
    const step = (now) => {
      if (!playing) return;
      const t = (now - playStart) / DWELL;
      if (t >= 1) {
        if (index >= n - 1) { stop(); return; }
        select(index + 1);
      } else {
        // son olayda çubuk ilerlemez
        setPos(index + (index < n - 1 ? Math.max(0, t - 0.6) / 0.4 : 0));
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    setLabels();
  }

  function stop() {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(frame);
    playBtn.classList.remove("on");
    setPos(index);
    setLabels();
  }

  // Düğme ve işaret yazılarını seçili dile göre ayarla
  function setLabels() {
    const lang = document.documentElement.lang;
    const u = UI[lang];
    playBtn.setAttribute("aria-label", playing ? u.pause : u.play);
    playBtn.title = playing ? u.pause : u.play;
    document.getElementById("tl-prev").setAttribute("aria-label", u.prev);
    document.getElementById("tl-prev").title = u.prev;
    document.getElementById("tl-next").setAttribute("aria-label", u.next);
    document.getElementById("tl-next").title = u.next;
    [...marks.children].forEach((m, i) => {
      m.dataset.title = EVENTS[i].title[lang];
      m.setAttribute("aria-label", EVENTS[i].title[lang]);
    });
  }

  return { init, select, play, stop, setLabels, isPlaying: () => playing, current: () => index };
})();
