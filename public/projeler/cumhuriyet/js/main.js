// =============================================================
//  ANA DOSYA
//  Parçaları birbirine bağlar: dil seçimi, bilgi kartı, kaynak listesi,
//  açılış ekranı. Zaman çubuğu bir olay seçince showEvent() çalışır.
// =============================================================
(() => {
  let lang = "tr";
  try { lang = localStorage.getItem("lang") === "en" ? "en" : "tr"; } catch (e) { /* tarayıcı izin vermezse Türkçe */ }

  const $ = (id) => document.getElementById(id);
  const u = () => UI[lang];

  // ---------------------------------------------------------
  //  Tarih yazımı: "19 Mayıs 1919", "4–11 Eylül 1919", "23 Temmuz – 7 Ağustos 1919"
  // ---------------------------------------------------------
  function formatDate(ev) {
    if (ev.dateLabel) return ev.dateLabel[lang];
    const m = u().months;
    const [y1, m1, d1] = ev.date.split("-").map(Number);
    if (!ev.end) return `${d1} ${m[m1 - 1]} ${y1}`;
    const [y2, m2, d2] = ev.end.split("-").map(Number);
    if (y1 !== y2) return `${d1} ${m[m1 - 1]} ${y1} – ${d2} ${m[m2 - 1]} ${y2}`;
    if (m1 !== m2) return `${d1} ${m[m1 - 1]} – ${d2} ${m[m2 - 1]} ${y2}`;
    return `${d1}–${d2} ${m[m2 - 1]} ${y2}`;
  }

  // ---------------------------------------------------------
  //  Kişi kartları: fotoğraf yerine el çizimi tarzı siluet
  // ---------------------------------------------------------
  const HATS = {
    kalpak: `<path class="p-hat" d="M22.5,22 L23.5,9 Q32,5.5 40.5,9 L41.5,22 Q32,19.5 22.5,22Z"/>
             <path class="p-hatch" d="M26,10 v10 M29,9 v10 M32,8.5 v10 M35,9 v10 M38,10 v10"/>`,
    fez: `<path class="p-hat" d="M23.5,20 L25,10 H39 L40.5,20 Q32,18 23.5,20Z"/><path class="p-tassel" d="M32,10 Q38,12 37,20"/>`,
    scarf: `<path class="p-hat" d="M20,31 C17,11 47,11 44,31 C46,42 41,48 32,48 C23,48 18,42 20,31Z M24,31 C24,40 40,40 40,31 C40,22 24,22 24,31Z" fill-rule="evenodd"/>`,
    none: `<path class="p-hat" d="M23,24 C22,13 42,13 41,24 C38,19 26,19 23,24Z"/>`,
  };

  function portrait(hat) {
    return `<svg viewBox="0 0 64 64" class="portrait" aria-hidden="true">
      <ellipse cx="32" cy="32" rx="29" ry="30" class="p-frame"/>
      <ellipse cx="32" cy="32" rx="25.5" ry="26.5" class="p-bg"/>
      <path class="p-body" d="M11,58 C12,47 21,43 32,42 C43,43 52,47 53,58 Q32,63 11,58Z"/>
      <rect x="28.5" y="34" width="7" height="9" class="p-body"/>
      <ellipse cx="32" cy="27" rx="9" ry="11" class="p-body"/>
      ${HATS[hat] || HATS.none}
    </svg>`;
  }

  function personCard(id) {
    const p = PEOPLE[id];
    return `<div class="person">${portrait(p.hat)}
      <div><p class="p-name">${p.name} <span>${p.alt}</span></p><p class="p-role">${p[lang]}</p></div></div>`;
  }

  // ---------------------------------------------------------
  //  Bilgi kartı
  // ---------------------------------------------------------
  function renderCard(i) {
    const ev = EVENTS[i];
    const img = ev.image && IMAGES[ev.image];
    const hasSurname = ev.people.some((id) => PEOPLE[id].alt);
    const last = i === EVENTS.length - 1;

    $("card").innerHTML = `
      <div class="card-inner">
        <p class="c-meta"><span class="c-cat cat-${ev.cat}">${u().categories[ev.cat]}</span>
          <span class="c-num">${i + 1} / ${EVENTS.length}</span></p>
        <p class="c-date">${formatDate(ev)}</p>
        <h2 class="c-title">${ev.title[lang]}</h2>
        <p class="c-place">${ev.place[lang]}</p>

        <figure class="c-scene">
          <div class="scene-box" id="scene-box"></div>
          <figcaption>
            <button type="button" class="replay" id="replay" title="${u().replay}" aria-label="${u().replay}">↻</button>
            <span>${ev.caption[lang]}</span>
          </figcaption>
        </figure>

        <p class="c-text">${ev.text[lang]}</p>

        ${ev.note ? `<aside class="c-note"><strong>${u().note}:</strong> ${ev.note[lang]}</aside>` : ""}

        ${ev.people.length ? `<h3 class="c-h3">${u().people}</h3>
          <div class="people">${ev.people.map(personCard).join("")}</div>
          ${hasSurname ? `<p class="c-small">${u().surnameNote}</p>` : ""}` : ""}

        ${img ? `<figure class="c-photo"><img src="${img.src}" alt="${img[lang]}" loading="lazy">
          <figcaption>${img[lang]}<br><span>${img.credit} · ${img.license[lang]}</span></figcaption></figure>` : ""}

        <p class="c-src">${u().src}: ${ev.sources.map((s) => `<a href="#src-${s}">[${s}]</a>`).join(" ")}</p>

        ${last ? `<div class="c-end"><p class="c-end-title">${u().endTitle}</p>
          <a href="#kaynaklar">${u().sources} ↓</a></div>` : ""}
      </div>`;

    Scenes.render($("scene-box"), ev, lang);
    $("replay").addEventListener("click", () => {
      Scenes.render($("scene-box"), ev, lang);
      MapView.showEvent(i, true);
    });
    $("card").scrollTop = 0;
  }

  function showEvent(i) {
    MapView.showEvent(i, true);
    renderCard(i);
    $("tl-date").textContent = formatDate(EVENTS[i]);
  }

  // ---------------------------------------------------------
  //  Kaynak listesi
  // ---------------------------------------------------------
  function renderSources() {
    const imgs = Object.values(IMAGES).map((im) =>
      `<li><a href="${im.url}" target="_blank" rel="noopener">${im[lang]}</a> — ${im.credit}. <em>${u().imageLicense}: ${im.license[lang]}</em></li>`).join("");
    $("sources").innerHTML = `
      <h2>${u().sourcesTitle}</h2>
      <p class="s-lead">${u().sourcesText}</p>
      <ol class="s-list">${SOURCES.map((s) => `<li id="src-${s.id}">${(lang === "en" && s.en) || s.text}</li>`).join("")}</ol>
      <h3>${u().imagesTitle}</h3>
      <ul class="s-imgs">${imgs}${OTHER_CREDITS.map((c) => `<li>${c[lang]}</li>`).join("")}</ul>
      <p><a href="#app" class="s-back">${u().backToMap}</a></p>`;
  }

  // Harita işaretleri açıklaması
  function renderLegend() {
    const L = u().legend;
    const row = (svg, text) => `<li><svg viewBox="0 0 40 14">${svg}</svg>${text}</li>`;
    $("legend").innerHTML = `<p>${u().legendTitle}</p><ul>
      ${row('<path d="M2,7 H32" class="lg route"/>', L.route)}
      ${row('<path d="M2,7 H30" class="lg side-tr"/><path d="M38,7 l-9,-5 v10z" class="lg-head side-tr"/>', L.tr)}
      ${row('<path d="M2,7 H30" class="lg side-gr"/><path d="M38,7 l-9,-5 v10z" class="lg-head side-gr"/>', L.gr)}
      ${row('<path d="M2,7 H30" class="lg side-en"/><path d="M38,7 l-9,-5 v10z" class="lg-head side-en"/>', L.en)}
      ${row('<path d="M2,7 H38" class="lg side-tr"/><path d="M2,7 H38" class="lg-teeth side-tr"/>', L.front)}
      ${row('<path d="M14,1 l12,12 M26,1 l-12,12" class="lg-x"/>', L.battle)}
    </ul>`;
  }

  // ---------------------------------------------------------
  //  Dil
  // ---------------------------------------------------------
  function setLang(next) {
    lang = next;
    try { localStorage.setItem("lang", lang); } catch (e) { /* önemli değil */ }
    document.documentElement.lang = lang;
    document.title = u().title;
    $("site-title").textContent = u().title;
    $("site-subtitle").textContent = u().subtitle;
    $("link-sources").textContent = u().sources;
    $("intro-kicker").textContent = u().introKicker;
    $("intro-title").textContent = u().title;
    $("intro-text").textContent = u().intro;
    $("intro-howto").textContent = u().howto;
    $("intro-start").textContent = u().start;
    $("legend-btn").title = u().legendTitle;
    for (const b of document.querySelectorAll(".lang button")) {
      b.setAttribute("aria-pressed", b.dataset.lang === lang);
    }
    MapView.setLang(lang);
    Timeline.setLabels();
    renderLegend();
    renderSources();
    const i = Timeline.current();
    renderCard(i);
    $("tl-date").textContent = formatDate(EVENTS[i]);
  }

  // ---------------------------------------------------------
  //  Başlat
  // ---------------------------------------------------------
  document.documentElement.lang = lang;
  MapView.init($("map"));
  Timeline.init({ onSelect: showEvent });
  setLang(lang);
  MapView.showEvent(0, false);

  for (const b of document.querySelectorAll(".lang button")) {
    b.addEventListener("click", () => setLang(b.dataset.lang));
  }

  $("legend-btn").addEventListener("click", () => {
    const open = $("legend").hidden;
    $("legend").hidden = !open;
    $("legend-btn").setAttribute("aria-expanded", open);
  });

  // Açılış ekranı
  const closeIntro = () => {
    if ($("intro").classList.contains("gone")) return;
    $("intro").classList.add("gone");
    Timeline.select(0);
    Timeline.play();
  };
  $("intro-start").addEventListener("click", closeIntro);

  // Klavye: boşluk = oynat/durdur, oklar = önceki/sonraki
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (!$("intro").classList.contains("gone")) {
      if (e.key === "Enter" || e.key === "Escape") closeIntro();
      return;
    }
    if (e.key === " " && !e.target.closest("button")) {
      e.preventDefault();
      Timeline.isPlaying() ? Timeline.stop() : Timeline.play();
    }
    if (e.target === $("tl-track")) return; // çubuk kendi okunu işler
    if (e.key === "ArrowRight") { Timeline.stop(); Timeline.select(Timeline.current() + 1); }
    if (e.key === "ArrowLeft") { Timeline.stop(); Timeline.select(Timeline.current() - 1); }
  });
})();
