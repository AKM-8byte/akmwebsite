// Film ve oyun sayfalarının ortak motoru: liste, filtre, kart etkileşimi ve detay sahnesi.
import { getList } from './api.js';
import { esc, icons, imgFallbacks, extractTone, prefersReducedMotion } from './util.js';

const supportsVT = () => typeof document.startViewTransition === 'function' && !prefersReducedMotion();

/**
 * @param {object} cfg
 *  type        'films' | 'games'
 *  param       URL parametresi ('film' | 'oyun')
 *  els         { grid, toolbar?, stats?, result?, ambient?, sceneRoot, extra? }
 *  card(item, i)         → kart HTML'i
 *  filters               → { read(): state, match(item, state): bool }
 *  sort(items, state)    → sıralanmış dizi
 *  stats(items)          → HTML
 *  scene(item, ctx)      → sahne HTML'i
 *  afterScene(el, item, ctx)
 *  ambientUrl(item)
 *  toneUrl(item)
 *  beforeGrid(visible, all) → ızgara üstü HTML (ör. "şu an oynuyorum" vitrini)
 */
export function createArchive(cfg) {
  let all = [];
  let visible = [];
  let current = null;
  let lastFocus = null;

  const { grid, stats, result, ambient, sceneRoot, extra } = cfg.els;

  // ---------- Liste ----------
  function apply() {
    const state = cfg.filters.read();
    visible = cfg.sort(all.filter((it) => cfg.filters.match(it, state)), state);
    if (extra && cfg.beforeGrid) extra.innerHTML = cfg.beforeGrid(visible, all, state);
    if (result) result.textContent = `${visible.length} / ${all.length} kayıt`;

    if (!all.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><b>Arşiv henüz boş</b>Yönetim panelinden ilk kaydı ekleyince burada görünecek.</div>`;
      return;
    }
    if (!visible.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><b>Eşleşen yok</b>Filtreleri gevşetmeyi dene.</div>`;
      return;
    }
    grid.innerHTML = visible.map((it, i) => cfg.card(it, i)).join('');
    imgFallbacks(grid);
    if (extra) imgFallbacks(extra);
  }

  function setData(items) {
    all = items;
    if (stats && cfg.stats) stats.innerHTML = cfg.stats(all);
    cfg.onData?.(all);
    apply();
    const id = new URLSearchParams(location.search).get(cfg.param);
    if (id && !current) open(id, { push: false });
  }

  // ---------- Kart etkileşimi: 3D eğim, parıltı, ortam ışığı, uzun basma ----------
  function bindCards(root) {
    let ambientTimer;
    root.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const card = e.target.closest('.card');
      if (!card) return;
      const media = card.querySelector('.card__media');
      const r = media.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      if (!prefersReducedMotion()) {
        media.style.setProperty('--ry', `${(x - 0.5) * 14}deg`);
        media.style.setProperty('--rx', `${(0.5 - y) * 14}deg`);
      }
      media.style.setProperty('--gx', `${x * 100}%`);
      media.style.setProperty('--gy', `${y * 100}%`);
    });
    root.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const card = e.target.closest('.card');
      if (!card || card.classList.contains('is-hover')) return;
      card.classList.add('is-hover');
      if (ambient && cfg.ambientUrl) {
        clearTimeout(ambientTimer);
        ambientTimer = setTimeout(() => setAmbient(cfg.ambientUrl(find(card.dataset.id))), 180);
      }
    });
    root.addEventListener('pointerout', (e) => {
      const card = e.target.closest('.card');
      if (!card || card.contains(e.relatedTarget)) return;
      card.classList.remove('is-hover');
      const media = card.querySelector('.card__media');
      media.style.removeProperty('--rx');
      media.style.removeProperty('--ry');
    });

    // Dokunmatik: uzun bas → bilet koçanını göster; kısa dokun → detay.
    let pressTimer;
    let peeked = false;
    root.addEventListener('touchstart', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;
      peeked = false;
      pressTimer = setTimeout(() => {
        root.querySelectorAll('.card.is-peek').forEach((c) => c.classList.remove('is-peek'));
        card.classList.add('is-peek');
        peeked = true;
        navigator.vibrate?.(8);
      }, 420);
    }, { passive: true });
    ['touchend', 'touchmove', 'touchcancel'].forEach((t) =>
      root.addEventListener(t, () => clearTimeout(pressTimer), { passive: true }),
    );
    root.addEventListener('contextmenu', (e) => { if (e.target.closest('.card')) e.preventDefault(); });

    root.addEventListener('click', (e) => {
      const hit = e.target.closest('[data-open]');
      if (!hit) return;
      if (peeked) { peeked = false; e.preventDefault(); return; }
      e.preventDefault();
      open(hit.dataset.open, { from: hit.closest('.card, .spot') });
    });
  }

  function setAmbient(url) {
    if (!url) return;
    const prev = ambient.querySelector('.ambient__img.is-on');
    if (prev?.dataset.src === url) return;
    const img = new Image();
    img.className = 'ambient__img';
    img.alt = '';
    img.dataset.src = url;
    img.onload = () => {
      ambient.appendChild(img);
      requestAnimationFrame(() => img.classList.add('is-on'));
      ambient.querySelectorAll('.ambient__img').forEach((el) => {
        if (el !== img) { el.classList.remove('is-on'); setTimeout(() => el.remove(), 1200); }
      });
    };
    img.src = url;
  }

  const find = (id) => all.find((it) => String(it.id) === String(id));

  // ---------- Detay sahnesi ----------
  function ctx(item) {
    const list = visible.some((v) => v.id === item.id) ? visible : all;
    const index = list.findIndex((v) => v.id === item.id);
    return {
      all, list, index,
      prev: list[index - 1] || null,
      next: list[index + 1] || null,
      position: `${String(index + 1).padStart(3, '0')} / ${String(list.length).padStart(3, '0')}`,
    };
  }

  function renderScene(item) {
    const c = ctx(item);
    sceneRoot.innerHTML = cfg.scene(item, c);
    const el = sceneRoot.firstElementChild;
    imgFallbacks(el);
    el.querySelector('.scene__bg img')?.addEventListener('load', (e) => e.target.classList.add('is-loaded'));
    cfg.afterScene?.(el, item, c, { open: (id) => open(id, { swap: true }) });
    extractTone(cfg.toneUrl?.(item)).then((rgb) => {
      if (rgb && current?.id === item.id) el.style.setProperty('--tone', rgb.join(' '));
    });
    return el;
  }

  function open(id, { from = null, push = true, swap = false } = {}) {
    const item = find(id);
    if (!item) return;
    if (!current) lastFocus = document.activeElement;
    current = item;

    if (push) {
      const url = new URL(location.href);
      url.searchParams.set(cfg.param, item.id);
      history[swap ? 'replaceState' : 'pushState']({ [cfg.param]: item.id }, '', url);
    }

    const media = from?.querySelector('.card__media, .spot__media');
    const show = () => {
      if (media) media.style.viewTransitionName = '';
      const el = renderScene(item);
      document.documentElement.classList.add('has-scene');
      el.scrollTop = 0;
      el.querySelector('[data-close]')?.focus({ preventScroll: true });
    };

    if (media && supportsVT()) {
      media.style.viewTransitionName = 'akm-hero';
      document.startViewTransition(show);
    } else {
      show();
    }
  }

  function close({ push = true } = {}) {
    if (!current) return;
    const el = sceneRoot.firstElementChild;
    const id = current.id;
    current = null;
    if (push) {
      const url = new URL(location.href);
      url.searchParams.delete(cfg.param);
      history.pushState({}, '', url);
    }
    const card = grid.querySelector(`.card[data-id="${CSS.escape(String(id))}"] .card__media`);
    const finish = () => {
      sceneRoot.innerHTML = '';
      document.documentElement.classList.remove('has-scene');
      if (card) card.style.viewTransitionName = '';
    };
    if (card && supportsVT() && isInView(card)) {
      el?.querySelector('[data-hero]')?.style.setProperty('view-transition-name', 'akm-hero');
      document.startViewTransition(() => {
        finish();
        card.style.viewTransitionName = 'akm-hero';
      }).finished.finally(() => { card.style.viewTransitionName = ''; });
    } else if (el) {
      el.classList.add('is-closing');
      setTimeout(finish, 300);
    }
    (card?.closest('.card')?.querySelector('.card__hit') || lastFocus)?.focus?.({ preventScroll: true });
  }

  const isInView = (el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  };

  function step(dir) {
    if (!current) return;
    const c = ctx(current);
    const target = dir < 0 ? c.prev : c.next;
    if (target) open(target.id, { swap: true });
  }

  sceneRoot.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) return close();
    if (e.target.closest('[data-prev]')) return step(-1);
    if (e.target.closest('[data-next]')) return step(1);
    const go = e.target.closest('[data-go]');
    if (go) open(go.dataset.go, { swap: true });
  });

  addEventListener('keydown', (e) => {
    if (!current) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        const s = document.querySelector('.search input');
        if (s) { e.preventDefault(); s.focus(); }
      }
      return;
    }
    if (sceneRoot.querySelector('.trailer, .lightbox')) {
      if (e.key === 'Escape') sceneRoot.querySelector('.trailer, .lightbox')?.remove();
      return;
    }
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  addEventListener('popstate', () => {
    const id = new URLSearchParams(location.search).get(cfg.param);
    if (id) open(id, { push: false });
    else close({ push: false });
  });

  // ---------- Başlat ----------
  bindCards(grid);
  if (extra) bindCards(extra);
  cfg.els.toolbar?.addEventListener('input', apply);
  cfg.els.toolbar?.addEventListener('change', apply);
  cfg.els.toolbar?.addEventListener('click', (e) => {
    const t = e.target.closest('[aria-pressed], [role="tab"]');
    if (!t) return;
    if (t.getAttribute('role') === 'tab') {
      t.parentElement.querySelectorAll('[role="tab"]').forEach((x) => x.setAttribute('aria-selected', String(x === t)));
    } else {
      t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true'));
    }
    apply();
  });

  grid.innerHTML = Array.from({ length: 12 }, () => `<div class="skeleton" style="aspect-ratio:2/3"></div>`).join('');

  getList(cfg.type, { onUpdate: setData })
    .then(setData)
    .catch((err) => {
      console.error(err);
      grid.innerHTML = `<div class="error-box" style="grid-column:1/-1"><b>Arşive ulaşılamadı</b>Bağlantını kontrol edip sayfayı yenile.</div>`;
    });

  return { refresh: apply, open, close };
}

// Kartlar için ortak parçalar
export function favBadge(item) {
  return item.favorite ? `<span class="card__fav" title="Favori">${icons.heart}</span>` : '';
}

export function fallbackArt(title, year, hue) {
  return `<div class="fallback" style="--h:${hue}"><small>AKM · ${esc(year ?? '')}</small><b>${esc(title)}</b></div>`;
}
