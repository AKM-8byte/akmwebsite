// =============================================================
//  SAHNELER
//  Bilgi kartındaki küçük animasyonlar. Her sahne bir SVG çizimidir;
//  hareketleri css/style.css → "Sahne animasyonları" bölümündeki
//  sınıflar (draw, fade, pop, stamp...) yapar.
//  --d: animasyonun kaç saniye sonra başlayacağı.
// =============================================================
const Scenes = (() => {
  let timer = 0; // sayaç gibi JS ile çalışan sahneler için

  const D = (s) => `style="--d:${s}s"`;
  const W = 320, H = 180;

  // Tekrarlayan küçük çizimler
  const waves = (y, cls = "") =>
    `<path class="wave ${cls}" d="M-40,${y} ${Array.from({ length: 20 }, () => "q10,-5 20,0").join(" ")}"/>`;
  const lines = (x, y, w, n, gap, d0, step) =>
    Array.from({ length: n }, (_, i) =>
      `<path class="draw ink-line" pathLength="1" ${D(d0 + i * step)} d="M${x},${y + i * gap} q${w / 4},-3 ${w / 2},0 t${w / 2},0"/>`
    ).join("");
  const stamp = (x, y, text, d, rot = -8) =>
    `<g transform="translate(${x} ${y}) rotate(${rot})"><g class="stamp" ${D(d)}>
       <rect x="-62" y="-15" width="124" height="30" rx="3" class="stamp-box"/>
       <text class="stamp-text" text-anchor="middle" y="6">${text}</text></g></g>`;

  // ---------------------------------------------------------
  const scenes = {
    // Bandırma Vapuru Samsun'a yanaşıyor
    ship(ev, t) {
      const puffs = [0, 1, 2, 3].map((i) =>
        `<circle class="puff" cx="0" cy="0" r="${5 + i}" style="--d:${i * 0.6}s"/>`).join("");
      return `
        <rect width="${W}" height="${H}" class="bg-sky"/>
        <path class="hill" d="M228,122 C246,104 262,94 286,90 C302,88 312,82 320,80 L320,180 L228,180Z"/>
        <g class="town fade" ${D(3.2)}>
          <rect x="270" y="74" width="12" height="16"/><rect x="286" y="70" width="14" height="20"/>
          <path d="M304,90 v-26 l2,-5 2,5 v26z"/><rect x="258" y="80" width="10" height="10"/>
        </g>
        <path class="pier" d="M236,122 H262"/>
        <text x="288" y="58" class="sc-label fade" text-anchor="middle" ${D(3.4)}>SAMSUN</text>
        ${waves(146, "w1")}${waves(158, "w2")}
        <g class="sail">
          <g transform="translate(176 92)">${puffs}</g>
          <path class="ink-fill" d="M118,128 L224,128 L216,141 L128,141Z"/>
          <rect class="ink-fill" x="150" y="117" width="52" height="11"/>
          <rect class="paper-fill" x="154" y="120" width="44" height="4"/>
          <rect class="ink-fill" x="171" y="98" width="10" height="20"/>
          <rect class="red-fill" x="171" y="101" width="10" height="3"/>
          <path class="ink" d="M138,128 V90 M212,128 V94 M138,90 L212,94 M138,94 L120,128 M212,98 L226,128"/>
        </g>
        ${waves(170, "w3")}
        ${stamp(70, 40, "19 · V · 1919", 5)}`;
    },

    // Telgraf hatları: bir şehirden ötekilere haber gidiyor
    telegraph(ev, t, lang) {
      const from = CITIES[ev.sceneFrom][lang];
      const targets = ev.sceneTo.map((id, i) => ({ name: CITIES[id][lang], y: 26 + i * 32 }));
      const wires = targets.map((p, i) => {
        const d = `M74,90 C150,90 170,${p.y} 252,${p.y}`;
        return `<path class="draw wire" pathLength="1" ${D(0.5 + i * 0.25)} d="${d}"/>
          <circle r="3.2" class="spark fade" style="--d:${1.2 + i * 0.25}s"><animateMotion dur="1.6s" begin="${1.2 + i * 0.25}s" repeatCount="indefinite" path="${d}"/></circle>
          <g class="pop" ${D(1.3 + i * 0.25)}><circle cx="258" cy="${p.y}" r="5" class="node"/></g>
          <text x="268" y="${p.y + 4}" class="sc-small fade" ${D(1.4 + i * 0.25)}>${p.name}</text>`;
      }).join("");
      return `
        <rect width="${W}" height="${H}" class="bg-paper"/>
        ${wires}
        <g transform="translate(18 72)">
          <rect width="56" height="36" rx="3" class="box"/>
          <path class="ink" d="M10,26 H46 M18,26 V18 H40 M28,18 l6,-8"/><circle cx="35" cy="9" r="3" class="ink-fill"/>
        </g>
        <text x="46" y="126" text-anchor="middle" class="sc-label">${from}</text>
        <text x="46" y="142" text-anchor="middle" class="sc-morse">· – – ·  · –  · · ·</text>`;
    },

    // Kongre salonu: koltuklar doluyor, karar belgesi açılıyor
    congress(ev, t, lang) {
      let seats = "", n = 0;
      [44, 62, 80, 98].forEach((r, row) => {
        const count = 7 + row * 2;
        for (let i = 0; i < count; i++) {
          const a = Math.PI + (Math.PI * (i + 0.5)) / count;
          const x = 160 + Math.cos(a) * r * 1.35, y = 176 + Math.sin(a) * r * 0.82;
          seats += `<g class="pop" ${D(0.3 + n++ * 0.045)}><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" class="seat"/></g>`;
        }
      });
      const txt = ev.sceneText[lang].map((l, i) =>
        `<text x="160" y="${36 + i * 15}" text-anchor="middle" class="sc-doc fade ${i === 2 ? "em" : ""}" ${D(3.2 + i * 0.4)}>${l}</text>`).join("");
      return `
        <rect width="${W}" height="${H}" class="bg-paper"/>
        ${seats}
        <rect x="150" y="160" width="20" height="16" class="ink-fill"/>
        <g class="unroll" ${D(2.6)}><rect x="62" y="16" width="196" height="62" rx="2" class="scroll"/>
          <rect x="56" y="12" width="8" height="70" rx="3" class="ink-fill"/><rect x="256" y="12" width="8" height="70" rx="3" class="ink-fill"/></g>
        ${txt}`;
    },

    // Sivas: bölgesel cemiyetler tek çatı altında birleşiyor
    converge(ev, t, lang) {
      const names = lang === "tr"
        ? ["Trakya", "İzmir", "Bursa", "Trabzon", "Erzurum", "Adana", "Konya", "Kastamonu"]
        : ["Thrace", "İzmir", "Bursa", "Trabzon", "Erzurum", "Adana", "Konya", "Kastamonu"];
      const groups = names.map((nm, i) => {
        const a = (i / names.length) * Math.PI * 2 - Math.PI / 2;
        const x = 160 + Math.cos(a) * 120, y = 88 + Math.sin(a) * 66;
        return `<g class="merge" style="--d:${1.6 + i * 0.12}s;--tx:${(160 - x).toFixed(0)}px;--ty:${(88 - y).toFixed(0)}px">
          <g class="pop" ${D(0.2 + i * 0.1)}><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="12" class="node-big"/>
          <text x="${x.toFixed(0)}" y="${(y + 24).toFixed(0)}" text-anchor="middle" class="sc-small">${nm}</text></g></g>`;
      }).join("");
      return `
        <rect width="${W}" height="${H}" class="bg-paper"/>
        ${groups}
        <g class="pop" ${D(3)}><circle cx="160" cy="88" r="30" class="seal-big"/>
          <circle cx="160" cy="88" r="24" class="seal-ring"/>
          <text x="160" y="85" text-anchor="middle" class="seal-text">${t("TEK", "ONE")}</text>
          <text x="160" y="99" text-anchor="middle" class="seal-text">${t("ÇATI", "UNION")}</text></g>
        <text x="160" y="170" text-anchor="middle" class="sc-small fade" ${D(3.6)}>${t("Anadolu ve Rumeli Müdafaa-i Hukuk Cemiyeti", "Society for the Defence of the Rights of Anatolia and Rumelia")}</text>`;
    },

    // Karlı yollardan Ankara Kalesi'ne
    arrive(ev, t) {
      const road = "M-10,160 C60,150 70,128 120,126 S190,120 214,104";
      const snow = Array.from({ length: 28 }, (_, i) =>
        `<circle class="snow" cx="${(i * 37) % 320}" cy="-6" r="${1 + (i % 3) * 0.6}" style="--d:${(i * 0.29) % 4}s;--dx:${(i % 5) * 4 - 8}px"/>`).join("");
      return `
        <rect width="${W}" height="${H}" class="bg-sky"/>
        <path class="hill" d="M0,150 C60,130 110,120 160,124 C200,90 230,62 262,60 C290,58 306,80 320,86 L320,180 L0,180Z"/>
        <path class="hill-back" d="M0,120 C40,104 90,108 120,116 L120,124 L0,140Z"/>
        <g class="castle">
          <path d="M226,62 v-14 h6 v5 h6 v-5 h6 v5 h6 v-5 h6 v5 h6 v-5 h6 v14z M244,48 v-12 h6 v4 h4 v-4 h6 v12"/>
        </g>
        <path class="draw road" pathLength="1" style="--d:.3s;--dur:3s" d="${road}"/>
        <g class="cart fade" style="--d:.4s"><animateMotion dur="4s" begin="0.4s" fill="freeze" path="${road}"/>
          <rect x="-8" y="-11" width="14" height="8" rx="1" class="ink-fill"/><circle cx="-5" cy="-2" r="2.5" class="ink"/><circle cx="4" cy="-2" r="2.5" class="ink"/>
          <path class="ink" d="M7,-6 h7 M13,-6 l3,-5 2,1 v5 M14,-6 v5 M17,-6 v5"/></g>
        ${snow}
        <text x="252" y="26" text-anchor="middle" class="sc-label fade" ${D(3.8)}>ANKARA</text>
        ${stamp(74, 44, "27 · XII · 1919", 4.3)}`;
    },

    // Misak-ı Millî: altı madde ve mühür
    pact(ev, t) {
      const nums = ["I", "II", "III", "IV", "V", "VI"].map((r, i) =>
        `<text x="96" y="${58 + i * 17}" text-anchor="end" class="sc-doc fade" ${D(0.6 + i * 0.5)}>${r}</text>`).join("");
      return `
        <rect width="${W}" height="${H}" class="bg-dark"/>
        <rect x="70" y="10" width="180" height="162" class="parchment"/>
        <text x="160" y="34" text-anchor="middle" class="sc-title">MİSAK-I MİLLÎ</text>
        <path class="ink" d="M110,41 H210"/>
        ${nums}
        ${lines(104, 54, 120, 6, 17, 0.7, 0.5)}
        <g class="pop" ${D(4)}><circle cx="226" cy="150" r="17" class="seal-big"/><circle cx="226" cy="150" r="12" class="seal-ring"/></g>
        <text x="226" y="154" text-anchor="middle" class="seal-text sm fade" ${D(4.2)}>1920</text>`;
    },

    // İstanbul'un işgali: gemiler Boğaz'a giriyor
    occupation(ev, t) {
      const ship = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
        <path class="gray-fill" d="M-30,0 H30 L24,9 H-26Z M-14,0 v-8 h22 v8 M-6,-8 v-9 h6 v9 M14,-2 v-4 h10"/>
        <path class="gray" d="M-20,0 V-20 M20,0 V-16"/></g>`;
      return `
        <rect width="${W}" height="${H}" class="bg-sky"/>
        <path class="skyline" d="M150,92 V78 h8 v-8 a14,14 0 0 1 28,0 v8 h8 V92Z M160,70 v-22 l2,-6 2,6 v22 M188,70 v-24 l2,-6 2,6 v24
          M210,92 V82 a12,12 0 0 1 24,0 V92Z M240,92 V60 l2,-6 2,6 V92 M256,92 V80 h30 V92Z M262,80 a9,9 0 0 1 18,0 M296,92 V66 l2,-6 2,6 V92"/>
        <rect x="0" y="92" width="320" height="88" class="water"/>
        ${waves(110)}${waves(140, "w2")}
        <g class="slide" ${D(0.4)}>${ship(80, 118, 1)}</g>
        <g class="slide" ${D(1.1)}>${ship(40, 150, 0.8)}</g>
        <g class="slide" ${D(1.8)}>${ship(130, 160, 0.7)}</g>
        <path id="esc" class="draw escape" pathLength="1" style="--d:2.8s;--dur:2s" d="M232,96 C260,110 286,124 330,128"/>
        ${[0, 1, 2, 3].map((i) => `<circle r="2.6" class="walker fade" style="--d:${3 + i * 0.5}s"><animateMotion dur="3s" begin="${3 + i * 0.5}s" repeatCount="indefinite" path="M232,96 C260,110 286,124 330,128"/></circle>`).join("")}
        <text x="300" y="150" text-anchor="end" class="sc-small fade" ${D(3.2)}>${t("→ Anadolu'ya", "→ to Anatolia")}</text>
        ${stamp(80, 40, "16 · III · 1920", 4.4)}`;
    },

    // Ankara'daki ilk meclis binası
    assembly(ev, t) {
      const wins = [0, 1, 2, 3, 4, 5].map((i) =>
        `<path class="window" style="--d:${1.8 + i * 0.2}s" d="M${104 + i * 20 + (i > 2 ? 12 : 0)},140 v-16 a5,5 0 0 1 10,0 v16z"/>`).join("");
      const people = [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const fromLeft = i % 2 === 0;
        return `<g class="walk" style="--d:${2.4 + i * 0.3}s;--from:${fromLeft ? -150 : 150}px">
          <circle cx="${150 + (i - 3) * 6}" cy="160" r="3.2" class="ink-fill"/><rect x="${147 + (i - 3) * 6}" y="163" width="6" height="9" rx="2" class="ink-fill"/></g>`;
      }).join("");
      return `
        <rect width="${W}" height="${H}" class="bg-sky"/>
        <path class="ground" d="M0,152 H320 V180 H0Z"/>
        <rect x="92" y="114" width="136" height="38" class="wall"/>
        <rect x="92" y="146" width="136" height="6" class="ink-fill"/>
        <path class="roof" d="M84,114 L114,94 H206 L236,114Z"/>
        ${wins}
        <path class="ink-fill" d="M155,152 v-18 a5,5 0 0 1 10,0 v18z"/>
        <path class="ink" d="M160,94 V36"/>
        <g class="flag" ${D(0.6)}><rect x="161" y="37" width="30" height="20" class="red-fill"/>
          <circle cx="172" cy="47" r="5.5" fill="#fff"/><circle cx="173.8" cy="47" r="4.4" class="red-fill"/>
          <path fill="#fff" d="M180.5,44 l.9,2.2 2.3,0 -1.9,1.4 .7,2.2 -2,-1.3 -1.9,1.3 .7,-2.2 -1.9,-1.4 2.3,0z"/></g>
        ${people}
        ${stamp(74, 42, "23 · IV · 1920", 4.4)}`;
    },

    // Sevr: antlaşma kâğıdı parçalanıyor
    torn(ev, t) {
      const piece = (d, tx, ty, rot, content) =>
        `<g class="tear" style="--tx:${tx}px;--ty:${ty}px;--r:${rot}deg"><path class="parchment" d="${d}"/>${content}</g>`;
      return `
        <rect width="${W}" height="${H}" class="bg-dark"/>
        ${piece("M100,14 H162 L156,40 166,62 158,88 H100Z", -46, -8, -9,
          `<text x="146" y="38" text-anchor="end" class="sc-title">SEVR</text>${lines(108, 56, 44, 2, 13, 0, 0)}`)}
        ${piece("M162,14 H222 V84 H158 L166,62 156,40Z", 44, -10, 8,
          `<text x="170" y="38" class="sc-title">1920</text>${lines(170, 56, 44, 2, 13, 0, 0)}`)}
        ${piece("M100,88 H158 L150,112 162,134 154,166 H100Z", -40, 12, 7, lines(108, 104, 40, 4, 15, 0, 0))}
        ${piece("M158,88 H222 V166 H154 L162,134 150,112Z", 48, 10, -6, lines(166, 104, 46, 4, 15, 0, 0))}
        ${stamp(160, 92, t("TANINMADI", "NOT RECOGNISED"), 3, -12)}`;
    },

    // İstiklal Marşı: "Korkma!" yazılıyor
    quill(ev, t) {
      return `
        <rect width="${W}" height="${H}" class="bg-paper"/>
        ${[60, 90, 120, 150].map((y) => `<path class="rule" d="M30,${y} H290"/>`).join("")}
        <clipPath id="write-clip"><rect class="reveal" x="40" y="40" width="240" height="90"/></clipPath>
        <text x="52" y="112" class="script" clip-path="url(#write-clip)">Korkma!</text>
        <g class="quill">
          <path class="quill-feather" d="M0,0 C10,-30 40,-60 70,-74 C56,-50 34,-22 6,-2Z"/>
          <path class="ink" d="M0,0 L48,-56"/>
        </g>
        <text x="160" y="166" text-anchor="middle" class="sc-small fade" ${D(3.2)}>${t("İstiklal Marşı · 12 Mart 1921", "The National Anthem · 12 March 1921")}</text>`;
    },

    // Sakarya: 22 gün sayacı ve şematik cephe
    days(ev, t) {
      return `
        <rect width="${W}" height="${H}" class="bg-paper"/>
        <rect x="22" y="26" width="96" height="116" rx="4" class="box"/>
        <rect x="22" y="26" width="96" height="24" rx="4" class="red-fill"/>
        <text x="70" y="42" text-anchor="middle" class="cal-head">1921</text>
        <text x="70" y="108" text-anchor="middle" class="cal-num" id="days-num">1</text>
        <text x="70" y="130" text-anchor="middle" class="sc-small">${t("gün", "days")}</text>
        <text x="70" y="160" text-anchor="middle" class="sc-small">${t("23 Ağustos → 13 Eylül", "23 August → 13 September")}</text>
        <path class="river-line" d="M222,10 C214,40 232,70 220,100 S228,150 220,180"/>
        <text x="214" y="22" text-anchor="end" class="sc-small it">Sakarya</text>
        <path class="draw front-line" pathLength="1" style="--d:.4s;--dur:1s" d="M250,24 C244,60 246,110 254,160"/>
        <path class="draw blue-arrow" pathLength="1" style="--d:.8s;--dur:1.6s" d="M140,96 C180,94 210,92 238,92"/>
        <path class="blue-fill fade" ${D(2.3)} d="M244,92 l-10,-6 v12z"/>
        <path class="blue-arrow dash fade" style="--d:3.6s" d="M226,110 C200,114 176,116 150,118"/>
        <path class="blue-fill fade" ${D(4.7)} d="M144,118 l10,-6 v12z"/>
        <text x="282" y="96" text-anchor="middle" class="sc-small red">${t("Ankara →", "Ankara →")}</text>`;
    },

    // Kars ve Ankara antlaşmaları
    twodocs(ev, t) {
      const doc = (x, title, date, cls, sealX, d) => `
        <g class="${cls}" ${D(d)}>
          <rect x="${x}" y="22" width="96" height="112" class="parchment"/>
          <text x="${x + 48}" y="44" text-anchor="middle" class="sc-title sm">${title}</text>
          <text x="${x + 48}" y="58" text-anchor="middle" class="sc-small">${date}</text>
          ${lines(x + 12, 74, 70, 3, 14, d + 0.5, 0.25)}
          <g class="pop" ${D(d + 1.3)}><circle cx="${sealX}" cy="120" r="11" class="seal-big"/></g>
        </g>`;
      return `
        <rect width="${W}" height="${H}" class="bg-dark"/>
        ${doc(36, "KARS", "13 · X · 1921", "from-left", 116, 0.2)}
        ${doc(188, "ANKARA", "20 · X · 1921", "from-right", 268, 1.2)}
        <text x="84" y="160" text-anchor="middle" class="sc-small light fade" ${D(2.8)}>${t("Doğu sınırı kesinleşti", "Eastern border settled")}</text>
        <text x="236" y="160" text-anchor="middle" class="sc-small light fade" ${D(3.2)}>${t("Güneyde savaş bitti", "War in the south ends")}</text>`;
    },

    // Büyük Taarruz: günler ve "Ordular!" emri
    offensive(ev, t) {
      const days = [26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const key = { 0: t("Kocatepe", "Kocatepe"), 4: "Dumlupınar", 14: t("İzmir", "İzmir") };
      const cells = days.map((n, i) => {
        const x = 12 + i * 19.7;
        return `<g class="cell" style="--d:${0.3 + i * 0.16}s"><rect x="${x}" y="20" width="17" height="24" rx="2"/>
          <text x="${x + 8.5}" y="37" text-anchor="middle">${n}</text></g>
          ${key[i] ? `<text x="${x + 8.5}" y="60" text-anchor="middle" class="sc-small fade" style="--d:${0.5 + i * 0.16}s">${key[i]}</text>` : ""}`;
      }).join("");
      return `
        <rect width="${W}" height="${H}" class="bg-paper"/>
        <text x="12" y="14" class="sc-small">${t("Ağustos – Eylül 1922", "August – September 1922")}</text>
        ${cells}
        <path class="draw red-arrow" pathLength="1" style="--d:.6s;--dur:2.6s" d="M300,92 C230,80 150,96 40,90"/>
        <path class="red-fill fade" ${D(3.1)} d="M32,90 l12,-7 v14z"/>
        ${waves(104, "w1 sea")}
        <clipPath id="type-clip"><rect class="reveal slow" x="0" y="112" width="320" height="60"/></clipPath>
        <g clip-path="url(#type-clip)">
          <text x="160" y="134" text-anchor="middle" class="typewriter">${t("“Ordular! İlk hedefiniz", "“Armies! Your first objective")}</text>
          <text x="160" y="156" text-anchor="middle" class="typewriter">${t("Akdeniz'dir. İleri!”", "is the Mediterranean. Forward!”")}</text>
        </g>`;
    },

    // Mudanya: masa ve imza
    table(ev, t) {
      const chairs = [[110, 52], [160, 48], [210, 52], [110, 140], [160, 144], [210, 140], [64, 96], [256, 96]]
        .map(([x, y], i) => `<g class="pop" ${D(0.2 + i * 0.1)}><circle cx="${x}" cy="${y}" r="9" class="seat"/></g>`).join("");
      return `
        <rect width="${W}" height="${H}" class="bg-paper"/>
        ${chairs}
        <rect x="78" y="62" width="164" height="68" rx="8" class="tabletop"/>
        <g class="fade" ${D(1)}><rect x="98" y="74" width="30" height="40" class="paper-sheet"/><rect x="192" y="74" width="30" height="40" class="paper-sheet"/></g>
        <g class="fade" ${D(1.4)}><rect x="140" y="70" width="40" height="52" class="paper-sheet"/>
          ${lines(146, 80, 28, 3, 8, 1.6, 0.2)}</g>
        <path class="draw signature" pathLength="1" style="--d:2.6s;--dur:1.4s" d="M146,112 c4,-8 6,4 10,-4 s4,6 8,-2 s6,4 10,-1"/>
        <text x="160" y="172" text-anchor="middle" class="sc-small fade" ${D(3.6)}>${t("Mudanya · 11 Ekim 1922", "Mudanya · 11 October 1922")}</text>`;
    },

    // Saltanatın kaldırılması: taç dağılıyor, gemi uzaklaşıyor
    crown(ev, t) {
      const dust = Array.from({ length: 14 }, (_, i) =>
        `<circle class="dust" cx="${126 + i * 5}" cy="${70 + (i % 3) * 6}" r="1.6" style="--d:${2.6 + (i % 5) * 0.1}s;--dx:${(i % 7) * 4 - 12}px"/>`).join("");
      return `
        <rect width="${W}" height="${H}" class="bg-paper"/>
        <g class="crumble" ${D(2.6)}>
          <path class="draw crown-line" pathLength="1" style="--d:.2s;--dur:1.8s" d="M120,96 L112,44 L136,66 L160,34 L184,66 L208,44 L200,96Z M120,96 H200 M122,86 H198"/>
          <g class="pop" ${D(1.6)}><circle cx="160" cy="76" r="4" class="red-fill"/></g>
          <g class="pop" ${D(1.75)}><circle cx="138" cy="80" r="3" class="red-fill"/></g>
          <g class="pop" ${D(1.9)}><circle cx="182" cy="80" r="3" class="red-fill"/></g>
        </g>
        ${dust}
        <text x="160" y="124" text-anchor="middle" class="sc-title sm fade" ${D(3)}>${t("1 Kasım 1922", "1 November 1922")}</text>
        <rect y="140" width="${W}" height="40" class="water"/>${waves(150)}
        <g class="sail-away" ${D(3.8)}><path class="gray-fill" d="M0,150 H34 L28,160 H4Z M10,150 v-7 h14 v7 M16,143 v-8"/></g>
        <text x="300" y="172" text-anchor="end" class="sc-small fade" ${D(4.6)}>${t("17 Kasım: son padişah ayrılıyor", "17 November: the last sultan leaves")}</text>`;
    },

    // Lozan Konferansı: masa ve iki görüşme dönemi
    conference(ev, t) {
      const names = t("Türkiye|İngiltere|Fransa|İtalya|Japonya|Yunanistan", "Turkey|Britain|France|Italy|Japan|Greece").split("|");
      const plates = names.map((n, i) => {
        const x = 26 + i * 46;
        return `<g class="pop" ${D(0.3 + i * 0.15)}>
          <circle cx="${x + 20}" cy="50" r="8" class="ink-fill soft"/><path class="ink-fill soft" d="M${x + 8},74 q12,-18 24,0z"/>
          <rect x="${x}" y="76" width="40" height="14" class="${i === 0 ? "plate tr" : "plate"}"/>
          <text x="${x + 20}" y="86" text-anchor="middle" class="plate-text">${n}</text></g>`;
      }).join("");
      return `
        <rect width="${W}" height="${H}" class="bg-paper"/>
        <rect x="16" y="74" width="288" height="6" class="ink-fill"/><path class="ink" d="M30,80 V100 M290,80 V100"/>
        ${plates}
        <path class="draw phase" pathLength="1" style="--d:1.4s;--dur:1s" d="M30,128 H110"/>
        <path class="gap-line fade" ${D(2.3)} d="M112,128 H190"/>
        <path class="draw phase" pathLength="1" style="--d:2.8s;--dur:1.2s" d="M192,128 H290"/>
        <text x="30" y="148" class="sc-small fade" ${D(1.4)}>20.XI.1922</text>
        <text x="110" y="118" text-anchor="middle" class="sc-small fade" ${D(2.2)}>4.II.1923</text>
        <text x="151" y="148" text-anchor="middle" class="sc-small it fade" ${D(2.4)}>${t("ara", "break")}</text>
        <text x="192" y="118" text-anchor="middle" class="sc-small fade" ${D(2.8)}>23.IV.1923</text>
        <text x="290" y="148" text-anchor="end" class="sc-small fade" ${D(3.8)}>24.VII.1923</text>`;
    },

    // Lozan Antlaşması: terazi dengeleniyor, imza atılıyor
    scales(ev, t) {
      return `
        <rect width="${W}" height="${H}" class="bg-paper"/>
        <path class="ink-fill" d="M90,160 h60 l-6,-8 h-48z"/>
        <path class="ink thick" d="M120,152 V40"/>
        <circle cx="120" cy="38" r="5" class="ink-fill"/>
        <g class="balance">
          <path class="ink thick" d="M60,44 H180"/>
          <path class="ink" d="M60,44 L44,92 M60,44 L76,92 M180,44 L164,92 M180,44 L196,92"/>
          <path class="pan" d="M40,92 H80 a20,10 0 0 1 -40,0z"/>
          <path class="pan" d="M160,92 H200 a20,10 0 0 1 -40,0z"/>
        </g>
        <g class="fade" ${D(2.6)}><rect x="214" y="30" width="86" height="120" class="parchment"/>
          <text x="257" y="52" text-anchor="middle" class="sc-title sm">${t("LOZAN", "LAUSANNE")}</text>
          ${lines(224, 66, 66, 3, 12, 2.8, 0.2)}</g>
        <path class="draw signature" pathLength="1" style="--d:3.6s;--dur:1.2s" d="M226,124 c5,-10 8,5 12,-4 s6,8 10,-2 s8,5 14,-2 s6,4 12,0"/>
        ${stamp(70, 22, "24 · VII · 1923", 4.6, -4)}`;
    },

    // İstanbul'a giriş: gemiler ayrılıyor, birlikler giriyor
    liberation(ev, t) {
      const ship = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
        <path class="gray-fill" d="M-30,0 H30 L24,9 H-26Z M-14,0 v-8 h22 v8 M-6,-8 v-9 h6 v9 M14,-2 v-4 h10"/>
        <path class="gray" d="M-20,0 V-20 M20,0 V-16"/></g>`;
      const troops = Array.from({ length: 9 }, (_, i) =>
        `<g class="walk" style="--d:${1.8 + i * 0.18}s;--from:-170px">
          <circle cx="${70 + i * 10}" cy="78" r="2.8" class="ink-fill"/><rect x="${67.5 + i * 10}" y="81" width="5" height="9" rx="1.5" class="ink-fill"/></g>`).join("");
      return `
        <rect width="${W}" height="${H}" class="bg-sky"/>
        <path class="skyline" d="M150,92 V78 h8 v-8 a14,14 0 0 1 28,0 v8 h8 V92Z M160,70 v-22 l2,-6 2,6 v22 M188,70 v-24 l2,-6 2,6 v24
          M210,92 V82 a12,12 0 0 1 24,0 V92Z M240,92 V60 l2,-6 2,6 V92 M256,92 V80 h30 V92Z M262,80 a9,9 0 0 1 18,0 M296,92 V66 l2,-6 2,6 V92"/>
        <rect x="0" y="92" width="320" height="88" class="water"/>
        ${waves(110)}${waves(140, "w2")}
        <g class="leave" ${D(0.3)}>${ship(80, 118, 1)}</g>
        <g class="leave" ${D(0.7)}>${ship(40, 150, 0.8)}</g>
        <g class="leave" ${D(1.1)}>${ship(130, 160, 0.7)}</g>
        ${troops}
        <path class="ink" d="M268,80 V30"/>
        <g class="flag" ${D(3.6)}><rect x="269" y="31" width="30" height="20" class="red-fill"/>
          <circle cx="280" cy="41" r="5.5" fill="#fff"/><circle cx="281.8" cy="41" r="4.4" class="red-fill"/>
          <path fill="#fff" d="M288.5,38 l.9,2.2 2.3,0 -1.9,1.4 .7,2.2 -2,-1.3 -1.9,1.3 .7,-2.2 -1.9,-1.4 2.3,0z"/></g>
        ${stamp(80, 40, "6 · X · 1923", 4.6)}`;
    },

    // Ankara başkent oluyor
    capital(ev, t) {
      return `
        <rect width="${W}" height="${H}" class="bg-paper"/>
        <path class="skyline" d="M24,130 V118 h6 v-6 a10,10 0 0 1 20,0 v6 h6 V130Z M32,112 v-16 l2,-5 2,5 v16 M60,130 V108 l2,-5 2,5 V130 M68,130 V120 a8,8 0 0 1 16,0 V130Z"/>
        <text x="54" y="150" text-anchor="middle" class="sc-small">${t("İstanbul", "Istanbul")}</text>
        <path class="hill" d="M180,180 C200,140 230,112 256,110 C282,108 300,128 320,140 V180Z"/>
        <g class="castle"><path d="M226,112 v-14 h6 v5 h6 v-5 h6 v5 h6 v-5 h6 v5 h6 v-5 h6 v14z M244,98 v-12 h6 v4 h4 v-4 h6 v12"/></g>
        <text x="256" y="168" text-anchor="middle" class="sc-label">ANKARA</text>
        <path class="draw escape" pathLength="1" style="--d:.5s;--dur:1.8s" d="M90,108 C130,40 190,30 236,74"/>
        <path class="red-fill fade" ${D(2.2)} d="M240,80 l-2,-13 -9,8z"/>
        <g class="pop" ${D(2.6)}><circle cx="258" cy="46" r="30" class="seal-big"/>
          <circle cx="258" cy="46" r="24" class="seal-ring"/>
          <text x="258" y="50" text-anchor="middle" class="seal-text" style="font-size:10.5px">${t("BAŞKENT", "CAPITAL")}</text></g>
        ${stamp(84, 30, "13 · X · 1923", 3.6)}`;
    },

    // Cumhuriyet: meclis binası üstünde kutlama
    republic(ev, t) {
      const bursts = [[60, 40, 0], [262, 34, 0.7], [110, 22, 1.4], [212, 58, 2.1], [160, 30, 2.8]].map(([x, y, d], n) =>
        `<g transform="translate(${x} ${y})"><g class="burst${n % 2 ? " alt" : ""}" style="--d:${1 + d}s">
          ${Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return `<path d="M${(Math.cos(a) * 5).toFixed(1)},${(Math.sin(a) * 5).toFixed(1)} L${(Math.cos(a) * 18).toFixed(1)},${(Math.sin(a) * 18).toFixed(1)}"/>`;
          }).join("")}</g></g>`).join("");
      const stars = Array.from({ length: 22 }, (_, i) =>
        `<circle class="night-star" cx="${(i * 53) % 320}" cy="${(i * 29) % 70 + 4}" r="${0.6 + (i % 3) * 0.4}" style="--d:${(i % 7) * 0.4}s"/>`).join("");
      const wins = [0, 1, 2, 3, 4, 5].map((i) =>
        `<path class="window" style="--d:${0.4 + i * 0.15}s" d="M${104 + i * 20 + (i > 2 ? 12 : 0)},158 v-12 a5,5 0 0 1 10,0 v12z"/>`).join("");
      return `
        <rect width="${W}" height="${H}" class="bg-night"/>
        ${stars}${bursts}
        <rect x="92" y="136" width="136" height="30" class="wall"/>
        <rect x="92" y="164" width="136" height="6" class="ink-fill"/>
        <path class="roof" d="M84,136 L114,120 H206 L236,136Z"/>
        ${wins}
        <path class="ink-fill" d="M155,170 v-14 a5,5 0 0 1 10,0 v14z"/>
        <rect y="170" width="${W}" height="10" class="ink-fill"/>
        <text x="160" y="92" text-anchor="middle" class="gold-text fade" ${D(1.6)}>${t("CUMHURİYET", "THE REPUBLIC")}</text>
        <text x="160" y="110" text-anchor="middle" class="gold-small fade" ${D(2.4)}>${t("29 Ekim 1923", "29 October 1923")}</text>`;
    },

    // Yalnızca haritada anlatılan olaylar için işaret açıklaması
    legend(ev, t) {
      const L = UI[document.documentElement.lang].legend;
      return `
        <rect width="${W}" height="${H}" class="bg-paper"/>
        <path class="draw red-arrow" pathLength="1" style="--d:.2s;--dur:1s" d="M24,30 C60,24 90,26 116,30"/><path class="red-fill fade" ${D(1.1)} d="M124,30 l-12,-7 v14z"/>
        <text x="138" y="34" class="sc-small">${L.tr}</text>
        <path class="draw blue-arrow" pathLength="1" style="--d:.6s;--dur:1s" d="M24,64 C60,58 90,60 116,64"/><path class="blue-fill fade" ${D(1.5)} d="M124,64 l-12,-7 v14z"/>
        <text x="138" y="68" class="sc-small">${L.gr}</text>
        <path class="blue-arrow dash fade" style="--d:1s" d="M116,96 C90,92 60,94 32,98"/><path class="blue-fill fade" ${D(1.9)} d="M24,98 l12,-7 v14z"/>
        <text x="138" y="102" class="sc-small">${t("Kesik ok: geri çekilme", "Dashed arrow: withdrawal")}</text>
        <path class="draw front-line" pathLength="1" style="--d:1.4s;--dur:.8s" d="M24,132 H124"/>
        <path class="front-teeth-sc fade" ${D(1.9)} d="M24,132 H124"/>
        <text x="138" y="136" class="sc-small">${L.front}</text>
        <g class="pop" ${D(2.2)}><path class="ink thick" d="M66,154 l14,14 M80,154 l-14,14"/></g>
        <text x="138" y="166" class="sc-small">${L.battle}</text>`;
    },
  };

  // Sahneyi kutuya çizer
  function render(box, ev, lang) {
    clearInterval(timer);
    const t = (tr, en) => (lang === "tr" ? tr : en);
    const make = scenes[ev.scene] || scenes.legend;
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="sc sc-${ev.scene}" role="img" aria-label="${ev.caption[lang]}">${make(ev, t, lang)}</svg>`;

    // Sakarya sayacı: 22 güne kadar sayar
    const num = box.querySelector("#days-num");
    if (num) {
      let n = 1;
      timer = setInterval(() => {
        num.textContent = ++n;
        if (n >= 22) clearInterval(timer);
      }, 210);
    }
  }

  return { render };
})();
