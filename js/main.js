/* Знаток права — «пурпур и золото». Анимации компьютерной версии. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.remove('no-js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // телефон и планшет (16.11): без ленты через страницу, без наклона карточек за пальцем, фон легче
  const phone = () => innerWidth <= 760;
  const touch = !matchMedia('(pointer:fine)').matches;
  /* 18.11 ЛЁГКИЙ РЕЖИМ: сайт сам меряет, успевает ли устройство рисовать кадры. Если два отрезка подряд по ~1,5 с
     кадры заметно опаздывают (слабый телефон, Safari, старый ноутбук) — включаем html.lite: без размытия под стеклом,
     фон и лента рисуются реже, ряды не гнутся. На мощных устройствах всё как было. Проверка вручную: ?lite=1 */
  const LITE = { on: false, cb: [] };
  const goLite = () => { if (LITE.on) return; LITE.on = true; root.classList.add('lite'); LITE.cb.forEach(f => f()); };
  window.__lite = LITE;
  if (/[?&]lite=1/.test(location.search)) goLite();
  else if (!/[?&]lite=0/.test(location.search)) (() => {
    let fr = [], prev = 0, bad = 0;
    const f = t => {
      if (LITE.on) return;
      if (prev && !document.hidden) { const d = t - prev; if (d < 250) fr.push(d); }
      prev = t;
      if (fr.length >= 90) {
        fr.sort((a, b) => a - b);
        bad = fr[72] > 24 ? bad + 1 : 0;      // 80 % кадров дольше 24 мс — меньше ~40 кадров в секунду
        fr = [];
        if (bad >= 2) return goLite();
      }
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  })();

  /* ---------- меню-бургер на телефоне ---------- */
  const burger = document.getElementById('burger'), mnav = document.getElementById('mnav');
  if (burger && mnav) {
    // 129: при открытом меню останавливаем и Lenis — иначе колесо/палец прокручивали страницу за меню
    const setMenu = on => { root.classList.toggle('menu-open', on); burger.setAttribute('aria-expanded', on); if (window.__lenis) on ? window.__lenis.stop() : window.__lenis.start(); };
    burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
    mnav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- плавная прокрутка ---------- */
  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop(); window.__lenis = lenis;

  // 129: главы в переходах закреплены без отступа (pinSpacing:false): глава B после перехода стоит на экран ниже своего
  // места в разметке, а последний экран главы A закрыт переходом. Прежний lenis.scrollTo(элемент) брал место по разметке
  // и останавливался посреди перехода («Ситуации», «Через МФЦ», «Цена»). Теперь цель считается от точек переходов.
  const offIn = (el, box) => { let y = 0; for (let x = el; x !== box; x = x.offsetParent) { if (!x || !x.offsetParent) return null; y += x.offsetTop; if (x.offsetParent !== box && !box.contains(x.offsetParent)) return null; } return y; };
  const scrollTarget = t => {
    const head = t.matches('section, .tx-wrap, footer') ? 0 : (phone() ? 70 : 90);
    const pins = ScrollTrigger.getAll().filter(s => s.pin);
    const B = t.closest('.tx-b'), A = t.closest('.tx-a');
    if (B) { const s = pins.find(s => s.trigger === B && s.vars.scrub), o = offIn(t, B); if (s && o !== null) return s.end + o - head; }
    if (A) { const s = pins.find(s => s.trigger === A && !s.vars.scrub), o = offIn(t, A); if (s && o !== null) return Math.min(s.start + root.clientHeight - A.offsetHeight + o - head, s.start); }
    if (t.closest('footer')) return document.documentElement.scrollHeight;   // подвал выезжает из-под «Связаться» — его место это конец страницы
    return t.getBoundingClientRect().top + scrollY - head;
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) { e.preventDefault(); lenis.scrollTo(0); return; }
    const t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    lenis.scrollTo(Math.max(0, Math.round(scrollTarget(t))), { duration: 1.6 });
  });

  /* ---------- шапка ---------- */
  const hdr = document.getElementById('hdr');
  ScrollTrigger.create({ start: 60, onUpdate: s => hdr.classList.toggle('is-solid', s.scroll() > 60) });

  /* ---------- заставка: логотип загорается ---------- */
  const intro = document.getElementById('intro');
  // для проверки на телефонах: ?y=1500 — после заставки страница сама прокрутится на 1500 точек вниз
  const testY = +new URLSearchParams(location.search).get('y') || 0;
  const tlIntro = gsap.timeline({ onComplete: () => { root.classList.add('is-ready'); lenis.start(); if (testY) lenis.scrollTo(testY, { immediate: true }); } });
  tlIntro
    .to('.intro__logo', { opacity: 1, scale: 1, duration: 1.1, ease: 'power2.out' })
    .to('.intro__shine', { backgroundPosition: '-50% 0', duration: 1.2, ease: 'power1.inOut' }, '-=.3')
    .to('.intro__logo', { scale: 1.06, opacity: 0, filter: 'blur(6px)', duration: .7, ease: 'power2.in' }, '+=.1')
    .to(intro, { opacity: 0, duration: .6, ease: 'power1.out', onComplete: () => intro.remove() }, '-=.25')
    .from('.hero__bg', { scale: 1.08, opacity: 0, duration: 2.2, ease: 'power3.out' }, '-=.6')
    // 17.11: заголовок собирается из дыма (js/text-fx.js); без него — прежний выезд строк снизу
    .add(() => window.TextFX ? TextFX.hero() : gsap.from('.hero__title .line > span', { yPercent: 110, duration: 1.2, stagger: .12, ease: 'power4.out' }), '-=1.9')
    .to('.hero .reveal', { opacity: 1, y: 0, duration: 1, stagger: .1, ease: 'power3.out' }, '-=1.0')
    // 17.11: конечная точка задана явно — с .from плитки так и оставались сдвинутыми на 40 точек вниз и низ обрезался
    .to({}, { duration: 1 }, '-=.8')   // 137: плиток на первом экране нет; пауза держит прежний ритм заставки
    .add(() => document.getElementById('hero').classList.add('wk-in'), '-=1.6');
  if (phone()) tlIntro.timeScale(1.7);   // на телефоне заставка короче: ~1,8 с вместо 3 с
  if (reduce) tlIntro.progress(1);

  /* ================================================================
     ПОЛЁТ КАМЕРЫ НА ПЕРВОМ ЭКРАНЕ
     Экран стоит, при прокрутке текст уходит, камера пролетает мимо Нурлана
     к весам на столе, над ними собираются буквы «ЗНАТОК ПРАВА».
     Кадры полёта: img/flight/ + frames.json. Пока кадров нет — тот же
     сценарий на одном фото (камера «наезжает» на весы).
  ================================================================ */
  const hero = document.getElementById('hero');
  const seqCv = document.getElementById('heroSeq');
  const seqCtx = seqCv.getContext('2d');
  const seq = { n: 0, frames: [], cur: -1, p: 0, w: 0, h: 0 };

  function sizeSeq() {
    const d = Math.min(2, devicePixelRatio || 1);
    seqCv.width = hero.offsetWidth * d; seqCv.height = hero.offsetHeight * d;
    seq.cur = -1; drawSeq();
  }
  function drawSeq() {
    if (!seq.n) return;
    let i = Math.round(seq.p * (seq.n - 1));
    // ближайший загруженный кадр
    let j = i; while (j > 0 && !(seq.frames[j] && seq.frames[j].complete && seq.frames[j].naturalWidth)) j--;
    const img = seq.frames[j];
    if (!img || !img.naturalWidth || j === seq.cur) return;
    seq.cur = j;
    const W = seqCv.width, H = seqCv.height, iw = img.naturalWidth, ih = img.naturalHeight;
    const k = Math.max(W / iw, H / ih), dw = iw * k, dh = ih * k;
    // как object-position: 70% 25%
    seqCtx.drawImage(img, (W - dw) * .7, (H - dh) * .25, dw, dh);
  }
  // 16.11: первый экран теперь постер, кадров полёта нет — лишний запрос (ошибка 404) не делаем
  (window.FLIGHT ? fetch('img/flight/frames.json', { cache: 'no-store' }) : Promise.resolve({ ok: false })).then(r => r.ok ? r.json() : null).then(m => {
    if (!m || !m.count) return;
    seq.n = m.count;
    const name = i => `img/flight/${m.prefix || 'f_'}${String(i + 1).padStart(4, '0')}.${m.ext || 'webp'}`;
    // сначала каждый 8-й кадр, потом остальные — полёт работает сразу, плавность догружается
    const order = [];
    for (let st of [8, 4, 2, 1]) for (let i = 0; i < seq.n; i += st) if (!order.includes(i)) order.push(i);
    order.forEach(i => { const im = new Image(); im.decoding = 'async'; im.onload = () => { if (i === 0) { hero.classList.add('has-seq'); sizeSeq(); } else { seq.cur = -1; drawSeq(); } }; im.src = name(i); seq.frames[i] = im; });
    addEventListener('resize', sizeSeq);
  }).catch(() => {});

  // буквы «ЗНАТОК ПРАВА» — каждую в свой span
  const bwLine = document.querySelector('.brandword__line');
  bwLine.innerHTML = [...bwLine.textContent].map(c => c === ' ' ? '<span class="sp"></span>' : `<span class="ch">${c}</span>`).join('');
  const chars = bwLine.querySelectorAll('.ch');
  const rnd = (a, b) => a + Math.random() * (b - a);
  chars.forEach(c => gsap.set(c, {
    x: rnd(-520, 520), y: rnd(-320, 320), rotation: rnd(-50, 50), scale: rnd(.5, 1.7), opacity: 0, filter: 'blur(12px)'
  }));

  /* Первый экран — постер (утверждён 16.11, перенесён из дубля 113). При прокрутке текст уходит вверх, постер чуть отстаёт (глубина). */
  gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__in', { y: -120, autoAlpha: .2 }, 0)
    .to('.wk-scene', { yPercent: 8 }, 0);

  /* ---------- свет за курсором на плитках ---------- */
  document.querySelectorAll('.tile').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
  document.querySelectorAll('.card').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--lx', ((e.clientX - r.left) / r.width * 100) + '%');
      el.style.setProperty('--ly', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* ---------- появление блоков ---------- */
  gsap.utils.toArray('.sec__head, .proof__copy > .eyebrow, .proof__copy > .h2, .quotes > .eyebrow, .quotes > .h2, .contact__info > .eyebrow, .contact__info > .h2').forEach(el => {
    gsap.from(el, { opacity: 0, y: 24, duration: .9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  const batchIn = (sel, opts = {}) => ScrollTrigger.batch(sel, {
    start: 'top 88%', once: true,
    onEnter: els => gsap.fromTo(els, { opacity: 0, y: opts.y ?? 50, rotateX: opts.rx ?? 0 },
      { opacity: 1, y: 0, rotateX: 0, duration: 1.1, stagger: .1, ease: 'power3.out', overwrite: true })
  });
  gsap.set('.card,.warn--big,.note,.fears__list li,.fit__card,.doubt,.step,.app__item,.case,.rating,.quote,.acc details,.contact__list li,.formbox,.arch:not(.tx-own)', { opacity: 0 });
  batchIn('.card', { y: 70, rx: 12 });
  batchIn('.warn--big', { y: 30 });
  batchIn('.note'); batchIn('.fears__list li'); batchIn('.fit__card');
  batchIn('.doubt'); batchIn('.step'); batchIn('.app__item'); batchIn('.case');
  batchIn('.rating'); batchIn('.quote'); batchIn('.acc details', { y: 20 });
  batchIn('.contact__list li', { y: 20 }); batchIn('.formbox'); batchIn('.arch:not(.tx-own)', { y: 60 });   // дубль 118: портрет в «Кто ведёт дело» показывает сам переход-арка

  /* «Как идёт дело»: карточки наезжают — прошлая уходит вглубь и темнеет */
  const scards = gsap.utils.toArray('.scard');
  scards.forEach((c, i) => {
    const next = scards[i + 1];
    if (!next) return;
    gsap.to(c, { scale: .93, '--cover': .55, ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: `top ${120 + (i + 1) * 26}px`, scrub: true } });
  });
  gsap.from(scards, { opacity: 0, y: 80, duration: 1.1, stagger: .05, ease: 'power3.out',
    scrollTrigger: { trigger: '#stack', start: 'top 85%' } });

  /* ================================================================
     ЛЕНТА «ЗНАТОК ПРАВА» ЧЕРЕЗ ВСЮ СТРАНИЦУ
     Холст во весь экран; путь строится по секциям, лента ведёт от блока
     к блоку, на переходах делает поворот (видна изнанка), конец ленты —
     золотая печать с гербом.
  ================================================================ */
  const cv = document.getElementById('ribbon');
  const ctx = cv.getContext('2d');
  const seal = document.getElementById('seal');
  const STEP = 4;                    // шаг точек ленты, px
  let RW = 40, FONT = 15;            // ширина ленты и кегль надписи (на телефоне меньше)
  const TXT = 'ЗНАТОК ПРАВА  ✦  ';
  let atlas = {};
  let S = [], glyphs = [], twists = [], dpr = 1, vw = 0, vh = 0, reveal = 0, total = 0;

  function catmull(pts, step = STEP) {
    // центростремительный Catmull-Rom → точки через каждые ~step px
    const dense = [];
    const P = [pts[0], ...pts, pts[pts.length - 1]];
    for (let i = 1; i < P.length - 2; i++) {
      const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      const n = Math.max(8, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 4));
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        dense.push({
          x: .5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: .5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
        });
      }
    }
    dense.push(pts[pts.length - 1]);
    // равномерный шаг по длине — точно через каждые step px
    // (17.11: раньше шаг выходил ~4,3 px вместо 3, и надпись считалась в одних единицах, а рисовалась в других —
    //  буквы пропадали на больших участках ленты, особенно на телефоне)
    const out = [{ ...dense[0], s: 0 }];
    let acc = 0, next = step;
    for (let i = 1; i < dense.length; i++) {
      const a = dense[i - 1], b = dense[i], d = Math.hypot(b.x - a.x, b.y - a.y);
      while (d > 0 && acc + d >= next) { const t = (next - acc) / d; out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, s: next }); next += step; }
      acc += d;
    }
    for (let i = 0; i < out.length; i++) {
      const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)];
      const tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
      out[i].tx = tx / l; out[i].ty = ty / l; out[i].nx = -ty / l; out[i].ny = tx / l;
    }
    return out;
  }

  const ribbonOff = () => getComputedStyle(cv).display === 'none';
  function buildRibbon() {
    if (ribbonOff()) { S = []; return; }
    vw = innerWidth; vh = innerHeight;
    dpr = Math.min(vw <= 760 ? 1.5 : 2, window.devicePixelRatio || 1);   // на телефоне холст ленты чуть мягче — точек вдвое меньше
    cv.width = vw * dpr; cv.height = vh * dpr;
    const wrapW = Math.min(1200, vw - 200);
    let margin = (vw - wrapW) / 2;
    // 17.11 телефон и планшет: полей по бокам почти нет — лента узкая, идёт по самому краю экрана
    // за карточками и переходит на другую сторону в промежутках между главами
    const edge = vw <= 1100;
    if (edge) margin = (vw - (document.querySelector('main .wrap') || { offsetWidth: vw - 36 }).offsetWidth) / 2;
    RW = edge ? (vw <= 760 ? 22 : 28) : 40; FONT = edge ? (vw <= 760 ? 10 : 12) : 15;
    const xL = edge ? Math.max(13, margin / 2) : margin / 2, xR = vw - xL;
    const secs = [...document.querySelectorAll('[data-rib]')];
    const sy = window.scrollY;
    const pts = [];
    const crossAt = [];
    // 129: главы в переходах стоят не там, где лежат в разметке: глава B подтянута на экран вверх и встаёт на место только
    // после перехода, глава A перед переходом закреплена. Раньше место бралось «как сейчас на экране», и лента делала петлю
    // через последний экран главы A (шла прямо по тексту «Через МФЦ — 30 000 ₽»). Берём места «как после перехода».
    const pins = ScrollTrigger.getAll().filter(s => s.pin);
    const docTop = sec => {
      const B = sec.closest('.tx-b'), A = sec.closest('.tx-a');
      if (B) { const s = pins.find(s => s.trigger === B && s.vars.scrub), o = B === sec ? 0 : offIn(sec, B); if (s && o !== null && isFinite(s.end)) return s.end + o; }
      if (A) { const s = pins.find(s => s.trigger === A && !s.vars.scrub), o = A === sec ? 0 : offIn(sec, A); if (s && o !== null && isFinite(s.start)) return s.start + root.clientHeight - A.offsetHeight + o; }
      return sec.getBoundingClientRect().top + sy;
    };
    secs.forEach((sec, i) => {
      const top = docTop(sec), h = sec.offsetHeight, bot = top + h;
      const x = sec.dataset.rib === 'left' ? xL : xR;
      const sway = (sec.dataset.rib === 'left' ? 14 : -14) * (edge ? .3 : 1);
      if (i === 0) { pts.push({ x: vw / 2, y: top - 230 }); pts.push({ x: (vw / 2 + x) / 2, y: top - 40 }); pts.push({ x, y: top + 80 }); }
      else pts.push({ x, y: top + Math.min(110, h * .2) });
      pts.push({ x: x + sway, y: top + h * .5 });
      pts.push({ x, y: bot - Math.min(110, h * .2) });
      const next = secs[i + 1];
      if (next && next.dataset.rib !== sec.dataset.rib) {
        const nx = next.dataset.rib === 'left' ? xL : xR;
        pts.push({ x: (x + nx) / 2, y: bot });
        crossAt.push(pts.length - 1);
      }
    });
    S = catmull(pts);
    total = S.length ? S[S.length - 1].s : 0;
    // повороты ленты на переходах: ищем ближайшие к точкам перехода отсчёты
    twists = crossAt.map(pi => {
      const p = pts[pi]; let best = 0, bd = 1e9;
      for (let i = 0; i < S.length; i++) { const d = Math.abs(S[i].y - p.y) + Math.abs(S[i].x - p.x) * .2; if (d < bd) { bd = d; best = i; } }
      return S[best].s;
    });
    // надпись вдоль ленты: только целыми фразами «ЗНАТОК ПРАВА ✦» и только там, где лента лицом.
    // Где лента идёт справа налево, фразу кладём в обратном порядке и переворачиваем буквы,
    // чтобы она читалась слева направо, а не вверх ногами задом наперёд (ошибка 16.11).
    ctx.font = `500 ${FONT}px "Cormorant Garamond", serif`;
    glyphs = [];
    const PHR = 'ЗНАТОК ПРАВА  ✦  ';
    const cw = [...PHR].map(ch => (ctx.measureText(ch).width + FONT * .21) * 1.43);   // разрядка как была на компьютере
    const pw = cw.reduce((a, b) => a + b, 0);
    let s = 60;
    while (s + pw < total - 40) {
      let ok = true;
      const a0 = Math.atan2(S[idxAt(s)].ty, S[idxAt(s)].tx);
      for (let t = s; t <= s + pw; t += 6) {
        if (Math.abs(twistAt(t)) > 0.001) { ok = false; break; }
        // на крутом изгибе фразу не кладём: буквы там слипаются и разъезжаются
        let da = Math.atan2(S[idxAt(t)].ty, S[idxAt(t)].tx) - a0;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) > 0.45) { ok = false; break; }
      }
      if (!ok) { s += 12; continue; }
      const m = S[idxAt(s + pw / 2)];
      const flip = m.tx < -0.05;            // лента идёт влево
      const chars = flip ? [...PHR].reverse() : [...PHR];
      const ws = flip ? [...cw].reverse() : cw;
      let x = s;
      chars.forEach((ch, j) => { if (ch.trim()) glyphs.push({ s: x + ws[j] / 2, ch, flip }); x += ws[j]; });
      s += pw;
    }
    // 17.11 ускорение: каждая буква заранее отрисована картинкой в двух оттенках золота (тусклом и ярком);
    // в кадре их только копируем и смешиваем — это в разы дешевле, чем набирать шрифт заново 60 раз в секунду
    atlas = {};
    for (const ch of new Set(PHR)) {
      if (!ch.trim()) continue;
      const w = Math.ceil(ctx.measureText(ch).width + 6), h = Math.ceil(FONT * 1.7);
      const mk = col => {
        const c = document.createElement('canvas'); c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
        const x = c.getContext('2d'); x.scale(dpr, dpr);
        x.font = ctx.font; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillStyle = 'rgba(0,0,0,.45)'; x.fillText(ch, w / 2, h / 2 + 1);
        x.fillStyle = col; x.fillText(ch, w / 2, h / 2);
        return c;
      };
      atlas[ch] = { lo: mk('rgb(205,165,95)'), hi: mk('rgb(255,235,185)'), w, h };
    }
    draw();
  }

  // угол поворота ленты (0 — лицом, π — изнанкой), полный оборот на каждом переходе
  function twistAt(s) {
    const span = 260;
    for (const c of twists) {
      const d = s - c;
      if (d > -span && d < span) { const t = (d + span) / (2 * span); return Math.PI * 2 * (t * t * (3 - 2 * t)); }
    }
    return 0;
  }
  const idxAt = s => Math.max(0, Math.min(S.length - 1, Math.round(s / STEP)));

  let time = 0;
  function draw() {
    if (!S.length) return;
    const sy = window.scrollY;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    // докуда лента «проложена»: чуть ниже середины экрана
    const targetY = sy + vh * .74;
    let ti = 0;
    for (let i = 0; i < S.length; i++) { if (S[i].y <= targetY) ti = i; else if (S[i].y > targetY + 400) break; }
    const targetS = S[ti].s;
    reveal += (targetS - reveal) * .12;
    if (Math.abs(targetS - reveal) < .5) reveal = targetS;
    const endI = idxAt(reveal);

    // видимый диапазон
    let i0 = 0; while (i0 < endI && S[i0].y < sy - 60) i0++;
    i0 = Math.max(0, i0 - 2);
    let i1 = endI; while (i1 > i0 && S[i1].y > sy + vh + 60) i1--;
    if (i1 - i0 < 2) { seal.style.opacity = 0; return; }

    ctx.save();
    ctx.translate(0, -sy);
    const sd = RW / 40 * 9;   // смещение тени

    // мягкая тень под лентой
    // (16.11 ускорение: тень двумя полупрозрачными штрихами вместо дорогого shadowBlur)
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(S[i0].x, S[i0].y + sd);
    for (let i = i0 + 1; i <= i1; i += 2) ctx.lineTo(S[i].x, S[i].y + sd);
    ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = RW * 1.5; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.24)'; ctx.lineWidth = RW * 1.05; ctx.stroke();
    ctx.restore();

    // полотно ленты — сегменты с объёмом и рубчиком (репс)
    const st = RW < 40 ? 2 : 1, rib = [];    // на телефоне лента узкая — сегменты вдвое длиннее, глазу не видно
    for (let i = i0; i < i1; i += st) {
      const p = S[i], q = S[Math.min(i1, i + st)];
      const fp = Math.cos(twistAt(p.s)), fq = Math.cos(twistAt(q.s));
      const wp = RW / 2 * Math.max(.06, Math.abs(fp)), wq = RW / 2 * Math.max(.06, Math.abs(fq));
      const back = fp < 0;
      // свет: ребро поворота темнее, плюс медленный перелив вдоль ленты
      const sheen = .5 + .5 * Math.sin(p.s / 140 - time * .6);
      let L = .5 + .5 * Math.abs(fp) + .18 * sheen * Math.abs(fp);
      const RB = (window.PAL && PAL.rib) || [[100, 18, 30], [172, 52, 62], [42, 8, 12], [78, 20, 26]];
      const c = back ? RB[2] : RB[0];
      const hi = back ? RB[3] : RB[1];
      const r = (c[0] + (hi[0] - c[0]) * sheen * .6) * L, g = (c[1] + (hi[1] - c[1]) * sheen * .6) * L, b = (c[2] + (hi[2] - c[2]) * sheen * .6) * L;
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.beginPath();
      ctx.moveTo(p.x + p.nx * wp, p.y + p.ny * wp);
      ctx.lineTo(q.x + q.nx * wq, q.y + q.ny * wq);
      ctx.lineTo(q.x - q.nx * wq, q.y - q.ny * wq);
      ctx.lineTo(p.x - p.nx * wp, p.y - p.ny * wp);
      ctx.closePath(); ctx.fill();
      rib.push(p.x + p.nx * wp, p.y + p.ny * wp, p.x - p.nx * wp, p.y - p.ny * wp);
    }
    // рубчик — все поперечные штрихи одним проходом (17.11 ускорение)
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = .9; ctx.beginPath();
    for (let k = 0; k < rib.length; k += 4) { ctx.moveTo(rib[k], rib[k + 1]); ctx.lineTo(rib[k + 2], rib[k + 3]); }
    ctx.stroke();
    // кромки и строчка
    const edge = (k, style, width, dash) => {
      ctx.save(); ctx.strokeStyle = style; ctx.lineWidth = width; ctx.setLineDash(dash || []);
      ctx.beginPath();
      for (let i = i0; i <= i1; i++) {
        const p = S[i], f = Math.cos(twistAt(p.s)), w = RW / 2 * Math.abs(f) * k;
        const x = p.x + p.nx * w, y = p.y + p.ny * w;
        if (i === i0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.restore();
    };
    edge(1, 'rgba(8,2,4,.85)', 1.2); edge(-1, 'rgba(8,2,4,.85)', 1.2);
    edge(.78, 'rgba(240,210,160,.32)', .8, [4, 3]); edge(-.78, 'rgba(240,210,160,.32)', .8, [4, 3]);
    // глянцевая полоса по центру
    const gloss = (w, style, off) => {
      ctx.save(); ctx.strokeStyle = style; ctx.lineWidth = w; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = i0; i <= i1; i += 2) {
        const p = S[i], f = Math.cos(twistAt(p.s)), o = off * RW / 2 * Math.abs(f);
        if (i === i0) ctx.moveTo(p.x - p.nx * o, p.y - p.ny * o); else ctx.lineTo(p.x - p.nx * o, p.y - p.ny * o);
      }
      ctx.stroke(); ctx.restore();
    };
    gloss(RW * .3, 'rgba(255,200,190,.06)', .2);     // мягкий перелив атласа
    gloss(1.4, 'rgba(255,236,214,.22)', .3);         // тонкий резкий блик

    // золотое тиснение «ЗНАТОК ПРАВА»
    ctx.font = `500 ${FONT}px "Cormorant Garamond", serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const sMin = S[i0].s, sMax = reveal - 24;
    for (const gl of glyphs) {
      if (gl.s < sMin || gl.s > sMax) continue;
      const A = atlas[gl.ch]; if (!A) continue;
      const p = S[idxAt(gl.s)];
      const sh = .5 + .5 * Math.sin(gl.s / 90 - time * 1.2);      // бегущий перелив золота
      const a = Math.atan2(p.ty, p.tx) + (gl.flip ? Math.PI : 0), cs = Math.cos(a) * dpr, sn = Math.sin(a) * dpr;
      ctx.setTransform(cs, sn, -sn, cs, p.x * dpr, (p.y - sy) * dpr);
      ctx.globalAlpha = 1; ctx.drawImage(A.lo, -A.w / 2, -A.h / 2, A.w, A.h);
      ctx.globalAlpha = sh; ctx.drawImage(A.hi, -A.w / 2, -A.h / 2, A.w, A.h);
    }
    ctx.globalAlpha = 1;
    // срез конца ленты «ласточкин хвост» под печатью не виден — печать сверху
    ctx.restore();

    const tip = S[endI];
    const visible = tip.y > sy - 40 && tip.y < sy + vh + 40;
    seal.style.opacity = visible ? 1 : 0;
    seal.style.transform = `translate(${tip.x}px,${tip.y - sy}px) rotate(${Math.atan2(tip.ty, tip.tx) * 180 / Math.PI - 90}deg)`;
  }

  // 17.11: на телефоне лента рисуется 30 раз в секунду вместо 60 — движение то же, нагрузка вдвое меньше
  let rbTick = 0;
  gsap.ticker.add((t) => { time = t; rbTick++; if (rbTick % (LITE.on ? 3 : RW < 40 ? 2 : 1)) return; draw(); });   // 18.11: в лёгком режиме 20 раз в секунду
  let rbT;
  const rebuild = () => { clearTimeout(rbT); rbT = setTimeout(buildRibbon, 120); };
  addEventListener('resize', rebuild);
  new ResizeObserver(rebuild).observe(document.querySelector('main'));
  ScrollTrigger.addEventListener('refresh', rebuild);
  document.fonts.ready.then(buildRibbon);
  addEventListener('load', () => { ScrollTrigger.refresh(); buildRibbon(); });

  /* ================================================================
     ДЫМ ИЗ ПЕПЛА (16.11): плашка цены «проявляется» снизу вверх, как будто
     догорает лист: по краю тлеет огненная кромка, с неё поднимается
     настоящий клубящийся дым (шумовая текстура), летят угольки и пепел.
     Плашка видна целиком за ~0,9 с, дым ещё 3–4 с тает вверх.
     Холст — только над блоком плашек, а не на всю секцию (было тяжело).
  ================================================================ */
  const smoke = document.getElementById('smoke');
  const sctx = smoke.getContext('2d');
  const plaquesBox = document.querySelector('.plaques');
  // клуб дыма: шум в несколько слоёв + мягкий край → рваные завитки, а не ровный круг
  function noiseSprite(seed) {
    const N = 128, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), img = x.createImageData(N, N);
    let sd = seed * 9301 + 49297;
    const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    const grids = [4, 8, 16, 32].map(g => { const a = []; for (let i = 0; i < (g + 1) * (g + 1); i++) a.push(rnd()); return { g, a }; });
    const val = (gr, u, v) => {
      const g = gr.g, X = u * g, Y = v * g, xi = Math.floor(X), yi = Math.floor(Y), fx = X - xi, fy = Y - yi;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), A = gr.a, w = g + 1;
      const i00 = A[yi * w + xi], i10 = A[yi * w + xi + 1], i01 = A[(yi + 1) * w + xi], i11 = A[(yi + 1) * w + xi + 1];
      return (i00 + (i10 - i00) * sx) + ((i01 + (i11 - i01) * sx) - (i00 + (i10 - i00) * sx)) * sy;
    };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const u = i / N, v = j / N;
      let n = 0, amp = .5; for (const gr of grids) { n += val(gr, u, v) * amp; amp *= .5; }
      const d = Math.hypot(u - .5, v - .5) * 2;
      const fall = Math.max(0, 1 - d); 
      const a = Math.max(0, (n - .38) * 2.4) * fall * fall;
      const k = (j * N + i) * 4;
      img.data[k] = 214; img.data[k + 1] = 204; img.data[k + 2] = 200; img.data[k + 3] = Math.min(255, a * 255);
    }
    x.putImageData(img, 0, 0);
    return c;
  }
  let sprites = null;   // текстуры дыма считаем только когда дым впервые понадобится, а не при загрузке страницы
  // свечение уголька рисуем один раз заранее (shadowBlur на каждый кадр тормозил)
  const emberSpr = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,236,190,1)'); g.addColorStop(.18, 'rgba(255,170,70,.95)'); g.addColorStop(.45, 'rgba(255,90,20,.35)'); g.addColorStop(1, 'rgba(255,60,10,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32); return c; })();
  const SSC = .5;
  let parts = [], burns = [], smokeRun = false, sw = 0, shh = 0, offY = 0, offX = 0;
  function sizeSmoke() {
    const sec = smoke.parentElement.getBoundingClientRect(), b = plaquesBox.getBoundingClientRect();
    offX = 0; offY = Math.max(0, b.top - sec.top - 320);
    sw = Math.round(sec.width); shh = Math.round(b.bottom - sec.top + 120 - offY);
    smoke.style.top = offY + 'px'; smoke.style.height = shh + 'px';
    smoke.width = Math.round(sw * SSC); smoke.height = Math.round(shh * SSC);   // дым мягкий: половины точек хватает
  }
  sizeSmoke(); addEventListener('resize', sizeSmoke);
  ScrollTrigger.addEventListener('refresh', sizeSmoke);

  function local(el) {
    const sec = smoke.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - sec.left, y: r.top - sec.top, w: r.width, h: r.height };
  }
  function addSmoke(x, y, big) {
    parts.push({ k: 's', x, y, vx: (Math.random() - .5) * 18, vy: -(26 + Math.random() * 40),
      size: ((big ? 120 : 70) + Math.random() * 60) * (phone() ? .62 : 1), grow: 2.2 + Math.random() * 1.6, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .6,
      ph: Math.random() * 6.28, life: 0, max: 2.6 + Math.random() * 2, a: .16 + Math.random() * .12, spr: sprites[(Math.random() * 4) | 0] });
  }
  function addEmber(x, y) {
    parts.push({ k: 'e', x, y, vx: (Math.random() - .5) * 30, vy: -(40 + Math.random() * 70), ph: Math.random() * 6.28,
      r: .8 + Math.random() * 1.4, life: 0, max: .8 + Math.random() * 1.2 });
  }
  function addAsh(x, y) {
    parts.push({ k: 'a', x, y, vx: (Math.random() - .5) * 24, vy: -(18 + Math.random() * 30), ph: Math.random() * 6.28,
      r: 1 + Math.random() * 1.8, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 4, life: 0, max: 1.8 + Math.random() * 1.6 });
  }
  function burnIn(el) {
    if (!sprites) sprites = [1, 2, 3, 4].map(noiseSprite);
    const st = { b: 0, el, done: false };
    burns.push(st);
    el.classList.add('is-burning');
    gsap.set(el, { opacity: 1, '--burn': 0 });
    gsap.to(st, { b: 1, duration: .9, ease: 'power1.inOut',
      onUpdate: () => el.style.setProperty('--burn', st.b),
      onComplete: () => { st.done = true; el.classList.remove('is-burning'); el.style.removeProperty('--burn');
        const r = local(el); for (let i = 0, n = phone() ? 4 : 10; i < n; i++) addSmoke(r.x + Math.random() * r.w, r.y + Math.random() * 30, true); } });
    if (!smokeRun) { smokeRun = true; last = performance.now(); requestAnimationFrame(stepSmoke); }
  }
  let last = 0;
  function stepSmoke(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    sctx.setTransform(SSC, 0, 0, SSC, 0, 0);
    sctx.clearRect(0, 0, sw, shh);
    // огненная кромка и новые частицы с неё
    burns = burns.filter(st => !st.done);
    for (const st of burns) {
      const r = local(st.el), ey = r.y + r.h * (1 - st.b), x0 = r.x + 14, x1 = r.x + r.w - 14;
      for (let i = 0, n = phone() ? 1 : 3; i < n; i++) addSmoke(x0 + Math.random() * (x1 - x0), ey, false);   // на телефоне клубов меньше и они мельче — плашки там вдвое уже
      if (Math.random() < .9) addEmber(x0 + Math.random() * (x1 - x0), ey);
      if (Math.random() < .5) addAsh(x0 + Math.random() * (x1 - x0), ey);
      sctx.save(); sctx.globalCompositeOperation = 'lighter';
      for (let pass = 0; pass < 2; pass++) {
        sctx.beginPath();
        for (let x = x0; x <= x1; x += 6) {
          const y = ey + Math.sin(x * .09 + now * .006) * 2.5 + Math.sin(x * .23 - now * .004) * 1.5;
          x === x0 ? sctx.moveTo(x, y) : sctx.lineTo(x, y);
        }
        sctx.lineCap = 'round';
        if (pass) { sctx.lineWidth = 2; sctx.strokeStyle = 'rgba(255,214,150,.95)'; sctx.stroke(); }
        else { sctx.lineWidth = 16; sctx.strokeStyle = 'rgba(255,80,20,.10)'; sctx.stroke();
               sctx.lineWidth = 7; sctx.strokeStyle = 'rgba(255,110,30,.22)'; sctx.stroke(); }
      }
      sctx.restore();
    }
    parts = parts.filter(p => p.life < p.max);
    // дым: обычное наложение, светлый на тёмном
    for (const p of parts) {
      p.life += dt; const k = p.life / p.max;
      if (p.k === 's') {
        p.vx += Math.sin(p.ph + p.life * 1.3) * 10 * dt; p.vy *= .992;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        const al = (k < .15 ? k / .15 : 1 - (k - .15) / .85) * p.a;
        const s = p.size * (1 + (p.grow - 1) * Math.sqrt(k));
        sctx.save(); sctx.globalAlpha = Math.max(0, al);
        sctx.translate(p.x, p.y); sctx.rotate(p.rot); sctx.scale(1, 1.25);
        sctx.drawImage(p.spr, -s / 2, -s / 2, s, s); sctx.restore();
      } else if (p.k === 'a') {
        p.x += (p.vx + Math.sin(p.ph + p.life * 3) * 14) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        sctx.save(); sctx.globalAlpha = Math.max(0, 1 - k) * .7; sctx.fillStyle = 'rgb(150,140,136)';
        sctx.translate(p.x, p.y); sctx.rotate(p.rot); sctx.fillRect(-p.r, -p.r * .5, p.r * 2, p.r); sctx.restore();
      }
    }
    // угольки поверх, с подсветкой
    sctx.save(); sctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      if (p.k !== 'e') continue;
      const k = p.life / p.max;
      p.x += (p.vx + Math.sin(p.ph + p.life * 6) * 20) * dt; p.y += p.vy * dt; p.vy *= .99;
      const fl = .6 + .4 * Math.sin(p.ph + p.life * 25);
      const al = Math.max(0, 1 - k) * fl;
      const es = p.r * (1 - k * .5) * 7;
      sctx.globalAlpha = al; sctx.drawImage(emberSpr, p.x - es / 2, p.y - es / 2, es, es);
    }
    sctx.restore(); sctx.globalAlpha = 1;
    if (parts.length || burns.length) requestAnimationFrame(stepSmoke); else { smokeRun = false; sctx.clearRect(0, 0, sw, shh); }
  }

  gsap.utils.toArray('.plaque').forEach((el, i) => {
    if (reduce) { gsap.set(el, { opacity: 1 }); return; }
    gsap.set(el, { opacity: 0 });
    ScrollTrigger.create({
      trigger: el, start: 'top 80%', once: true,
      // 18.11 (Игорь: «карточки всплывают раньше, чем открылась сцена»): ждём, пока уйдёт дым перехода (data-hold у «Цены»)
      onEnter: () => {
        const sec = el.closest('[data-hold]') ? el.closest('section') : null;
        const run = () => {
          if (sec && sec.hasAttribute('data-hold')) return setTimeout(run, 100);
          const d = (i % 2) * .15;
          gsap.delayedCall(d, () => burnIn(el));
          gsap.from(el.querySelector('.band'), { scaleX: .6, opacity: 0, duration: .7, delay: d + .5, ease: 'power3.out' });
        };
        run();
      }
    });
  });

  /* ================================================================
     ТЕСТ (тексты — файл 107, блок 4)
  ================================================================ */
  const Q = [
    // 18.11 — вопросы утверждены Игорем (файл «ПРАВКИ — глава 08»); третий элемент — подсказка под вопросом
    ['Сколько всего вы должны?', ['До 400&nbsp;000&nbsp;₽', 'От 400&nbsp;000 до 1&nbsp;000&nbsp;000&nbsp;₽', 'Больше 1&nbsp;000&nbsp;000&nbsp;₽', 'Не знаю точно'], 'Кредиты, займы, налоги, ЖКХ — всё вместе'],
    ['Приставы уже взыскивают долг?', ['Да, удерживают с зарплаты или карты', 'Были, но закрыли дело: взыскать было нечего', 'Пока нет', 'Не знаю']],
    ['Что у вас есть из имущества?', ['Ничего или только жильё, в котором живёте', 'Квартира в ипотеке', 'Машина', 'Ещё одна квартира, дача или доля', 'Продавали или дарили что-то за последние 3 года'], 'Если вы в браке, учитывайте и то, что купили в браке'],
  ];
  const body = document.getElementById('qBody'), qNum = document.getElementById('qNum'), qBar = document.getElementById('qBar');
  let step = 0, busy = false; const ans = [];   // 129: busy — двойное нажатие перескакивало вопрос и записывало чужой ответ
  body.setAttribute('aria-live', 'polite');

  function result() {
    // 18.11: итоги ещё обсуждаем с Игорем (воронка отложена). Пока: «не нужно» убрано (Игорь: тест должен вести к Нурлану),
    // цены — как в главе «Сколько стоит банкротство». МФЦ: долг до 1 000 000, приставы закрыли дело, имущества нет.
    // 18.11 (Игорь, временно «для виду»): долг до 400 000 → может подойти МФЦ; условия МФЦ уточним при разборе воронки
    if (ans[0] === 0) return { k: 'Итог', t: 'Может подойти путь через МФЦ', p: '30 000 ₽ под ключ', n: 'Через МФЦ проходит не каждый: точно скажем на консультации, проверим условия закона по вашим документам.' };
    if (ans[2] === 0) return { k: 'Итог', t: 'Похоже на путь через суд', p: '150 000 ₽', n: 'В рассрочку до 12 месяцев: первый взнос 30 000 ₽, дальше 10 000–15 000 ₽ в месяц. Точно скажем на консультации.' };
    return { k: 'Итог', t: 'Похоже на путь через суд', p: 'от 150 000 ₽', n: 'С имуществом цена выше, обычно до 300 000 ₽. Что можно сохранить, скажем на консультации.' };
  }

  function render() {
    const out = () => gsap.to(body, { opacity: 0, y: -14, duration: .25, ease: 'power1.in' });
    const inn = () => gsap.fromTo(body, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' });
    const hadFocus = body.contains(document.activeElement); busy = true;
    out().then(() => {
      if (step < Q.length) {
        const [q, opts, hint] = Q[step];
        qNum.textContent = String(step + 1).padStart(2, '0');
        qBar.style.width = ((step + 1) / Q.length * 100) + '%';
        body.innerHTML = `<h3 class="quiz__q">${q}</h3>${hint ? `<p class="quiz__hint">${hint}</p>` : ''}<div class="quiz__opts">${opts.map((o, i) => `<button class="opt" type="button" data-i="${i}">${o}</button>`).join('')}</div>${step ? '<button class="quiz__back" type="button">← Назад</button>' : ''}`;
      } else {
        const r = result();
        qNum.textContent = String(Q.length).padStart(2, '0'); qBar.style.width = '100%';
        body.innerHTML = `<div class="res">
          <p class="res__kicker">${r.k}</p>
          <h3 class="res__title">${r.t}</h3>
          <p class="res__price gold-text">${r.p}</p>
          <p class="res__note">${r.n}</p>
          <h4 class="res__formtitle">Бесплатная консультация с Нурланом, 30 минут</h4>
          <p class="res__or">Выберите, как удобнее:</p>
          <div class="ways">
            <div class="way way--call">
              <p class="way__k">Позвонить самому</p>
              <a class="way__phone" href="tel:+70000000000">+7 (000) 000-00-00</a>
              <p class="way__hours">Пн–Пт 10:00–18:00</p>
              <a class="btn btn--brass way__max" href="#contacts"><span>Написать в&nbsp;MAX</span></a>
              <p class="way__addr">Омск, ул. Пушкина, 2</p>
            </div>
            <div class="way way--form">
              <p class="way__k">Оставить заявку</p>
              <p class="way__sub">Нурлан сам свяжется с вами</p>
              <form class="lead" data-lead method="post">
                <label class="fld"><span>Имя</span><input name="name" required autocomplete="given-name"></label>
                <label class="fld"><span>Телефон</span><input name="phone" required type="tel" inputmode="tel" autocomplete="tel" placeholder="+7" pattern="[0-9+\\(\\)\\s\\-]{10,20}" title="Номер телефона, например +7 999 123-45-67"></label>
                <fieldset class="how"><legend>Как удобнее связаться</legend>
                  <label><input type="radio" name="how" value="call" checked><span>Позвонить</span></label>
                  <label><input type="radio" name="how" value="max"><span>Ответить в MAX</span></label>
                </fieldset>
                <label class="agree"><input type="checkbox" name="agree" required><span>Даю согласие на обработку персональных данных согласно <a href="#politika">политике</a></span></label>
                <button class="btn btn--gold" type="submit"><span>Отправить заявку</span></button>
                <p class="lead__msg" role="status"></p>
              </form>
            </div>
          </div>
          <button class="quiz__back" type="button">← Пройти заново</button>
        </div>`;
        bindForms();
      }
      busy = false;
      if (hadFocus) { const h = body.querySelector('.quiz__q, .res__title'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
      inn();
    });
  }
  body.addEventListener('click', e => {
    if (busy) return;
    const o = e.target.closest('.opt');
    if (o) { ans[step] = +o.dataset.i; step++; render(); return; }
    if (e.target.closest('.quiz__back')) { step = step >= Q.length ? 0 : Math.max(0, step - 1); if (step === 0) ans.length = 0; render(); }
  });
  render();


  /* ================================================================
     ЖИВОЙ ФОН (как на grail-app.com): плывущая пурпурная дымка с
     золотыми отсветами за всей страницей; у каждой главы свои цвета
     (атрибут data-bg у секции), при прокрутке они плавно перетекают.
  ================================================================ */
  (() => {
    const cv = document.getElementById('livebg');
    const gl = cv.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) return;                       // без WebGL остаётся обычный градиент
    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fs = `precision highp float;
      uniform vec2 uR; uniform float uT; uniform vec3 uBase,uA,uB; uniform float uDrift,uZoom,uVig,uGain,uHi;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return v;}
      /* рельеф «жидкого шёлка»: плавные складки, по которым бегут блики */
      float H(vec2 p,vec2 q){return fbm(p*.9+q*1.6)+.35*sin(p.x*2.2+p.y*1.3+q.x*5.);}
      void main(){
        vec2 uv=gl_FragCoord.xy/uR; vec2 p=uv; p.x*=uR.x/uR.y; p*=uZoom;
        float t=uT*.045;
        p.y+=uDrift;
        vec2 q=vec2(fbm(p*.7+vec2(t,-t*.6)),fbm(p*.7+vec2(5.2-t*.5,1.3+t*.4)));
        float e=.0025;
        float h0=H(p,q), hx=H(p+vec2(e,0.),q), hy=H(p+vec2(0.,e),q);
        vec3 N=normalize(vec3((h0-hx)/e*.09,(h0-hy)/e*.09,1.));
        vec3 R=reflect(vec3(0.,0.,-1.),N);
        /* студийное окружение для хрома: резкий горизонт + узкий софтбокс */
        float hor=R.y+.25*sin(R.x*2.4+t*2.);
        float env=smoothstep(-.015,.015,hor)*.22+exp(-pow((hor-.32)*11.,2.))*.95+exp(-pow((hor+.4)*7.,2.))*.25;
        float spec=pow(max(dot(N,normalize(vec3(.35,.55,1.))),0.),90.);
        float mask=smoothstep(.2,.58,fbm(p*.55+vec2(-t*.4,t*.25)+3.1));   /* где складки, а где ровная глубина */
        vec3 c=uBase;
        c=mix(c,uA*1.7,(.3+.7*mask)*smoothstep(.1,.95,h0));
        c+=uB*(env*.62+spec*.8)*mask*uHi;   /* uHi — сила бликов: на телефоне слабее, там на фоне лежит текст */
        float v=smoothstep(1.3,.2,length((uv-.5)*vec2(1.25,1.05)));
        c*=mix(uVig,1.,v);      /* затемнение к краям: на компьютере .5, на телефоне слабее */
        c*=uGain;               /* на телефоне фон чуть ярче и сочнее */
        c+=(h(gl_FragCoord.xy+fract(uT*7.)*113.)-.5)*.006;   /* тонкое зерно против полос на переходах */
        gl_FragColor=vec4(c,1.);
      }`;
    const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = k => gl.getUniformLocation(pr, k);
    const uR = U('uR'), uT = U('uT'), uBase = U('uBase'), uA = U('uA'), uB = U('uB'), uDrift = U('uDrift'), uZoom = U('uZoom'), uVig = U('uVig'), uGain = U('uGain'), uHi = U('uHi');
    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
    const secs = [...document.querySelectorAll('[data-bg]')].map(el => ({ el, c: el.dataset.bg.split(',').map(hex) }));
    let cur = secs[0].c.map(a => a.slice());
    // 16.11 ускорение: дымка мягкая, считать её в полном разрешении незачем — четверть точек, растягивает браузер
    const size = () => { const k = LITE.on ? .4 : phone() ? .55 : .7; cv.width = Math.round(innerWidth * k); cv.height = Math.round(innerHeight * k); gl.viewport(0, 0, cv.width, cv.height); };
    size(); addEventListener('resize', size);
    cv.classList.add('is-on');
    const heroEl = document.getElementById('hero');
    let tick = 0, mc = 0, tops = null, heroB = 0;
    LITE.cb.push(size);
    gsap.ticker.add(t => {
      // 16.11 ускорение: 30 кадров в секунду вместо 60 и ничего не считаем, пока первый экран закрывает весь фон
      if ((tick++ % (LITE.on ? 4 : 2)) || document.hidden) return;   // 18.11: 30 кадров в секунду, в лёгком режиме 15
      // глава, которая сейчас в середине экрана
      // 18.11 ускорение: положение глав меряем 3 раза в секунду, а не каждый кадр — на телефоне замер каждый кадр
      // заставлял пересчитывать раскладку всей страницы и давал рывки при прокрутке
      if (!(mc++ % 10) || !tops) { tops = secs.map(s => s.el.getBoundingClientRect().top + scrollY); heroB = heroEl ? heroEl.getBoundingClientRect().bottom + scrollY : 0; }
      const mid = innerHeight * .5 + scrollY;
      let target = secs[0].c;
      secs.forEach((s, i) => { if (tops[i] <= mid) target = s.c; });
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cur[i][j] += (target[i][j] - cur[i][j]) * .07;
      // дубль 118: цвета главы под первым экраном подтягиваем заранее, рисуем — только когда первый экран её открывает (шторка)
      // у границы первого экрана меряем точно каждый кадр, чтобы фон не опоздал открыться
      if (heroEl && scrollY < heroB + 200) heroB = heroEl.getBoundingClientRect().bottom + scrollY;
      if (heroEl && heroB - scrollY >= innerHeight && !document.documentElement.classList.contains('tx-hero')) return;
      gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, t);
      gl.uniform1f(uDrift, window.scrollY * .00035);
      // 17.11: на узком вертикальном экране в кадр попадала одна большая складка — берём узор мельче, как на компьютере
      gl.uniform1f(uZoom, innerHeight > innerWidth ? 1.7 : 1);
      // 17.11 тест: на телефоне фон виден только полосками у краёв — там его не затемняем и добавляем яркости
      // 129: на телефоне фон за текстом виден целиком (цены, «Кто ведёт дело», отзывы, вопросы), а не полосками —
      // с яркостью 1,3 и без затемнения светлый текст на бликах не читался (контраст 1–2 при норме 4,5). Яркость как на компьютере.
      gl.uniform1f(uVig, phone() ? .62 : .5); gl.uniform1f(uGain, 1); gl.uniform1f(uHi, phone() ? .42 : .6);   // на компьютере блики тоже мягче: золотые слова заголовков и подписи терялись на светлых складках       // дымка смещается вместе с прокруткой
      gl.uniform3fv(uBase, cur[0]); gl.uniform3fv(uA, cur[1]); gl.uniform3fv(uB, cur[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  })();

  /* светлая глава-лист наезжает на тёмную */
  const sheet = document.querySelector('.sheet');
  // дубль 118: лист «Что я потеряю?» открывается переходом «слова раздвигаются» — свой наезд с масштабом ему не нужен
  if (sheet && !sheet.classList.contains('tx-b')) {
    gsap.fromTo(sheet, { scale: .9, borderRadius: 90 }, { scale: 1, borderRadius: 44, ease: 'none',
      scrollTrigger: { trigger: sheet, start: 'top bottom', end: 'top 25%', scrub: true } });
    // тёмную главу под листом не гасим: там предупреждение по ст. 28.1, оно должно читаться полностью
  }


  /* ================================================================
     БУКВЕННЫЕ ЭФФЕКТЫ (по образцам Игоря, переписаны без React)
  ================================================================ */
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // разбить текст на буквы, не трогая вложенные теги (em, span) и не разрывая слова
  function splitChars(el, make) {
    const chars = [];
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/([ \n\t]+)/).forEach(part => {
            if (!part) return;
            if (/^[ \n\t]+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'sw'; w.setAttribute('aria-hidden', 'true');
            for (const ch of part) { const c = make(ch, chars.length); chars.push(c); w.appendChild(c); }
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !/^(svg|br|img)$/i.test(n.tagName)) { walk(n); n.classList.add('is-split'); }
      });
    };
    walk(el);
    // 129: aria-label на простом span диктор не читает — имя ставим ближайшему заголовку, вопросу или ссылке
    const named = el.closest('h1,h2,h3,h4,summary,a,button') || el;
    if (!named.hasAttribute('aria-label')) named.setAttribute('aria-label', named === el ? label : named.innerText.replace(/\s+/g, ' ').trim() || label);
    return chars;
  }
  const order = (n, from) => from === 'last' ? 'end' : from === 'center' ? 'center' : 'start';

  /* 1. Заголовки глав: буквы выезжают снизу из-под края, строки — с разных сторон */
  // 17.11: заголовки с осколками (data-fx, js/text-fx.js) по буквам не режем
  document.querySelectorAll('.h2:not([data-fx])').forEach(h => {
    const lines = h.querySelectorAll('.l');
    const sets = [...lines].map(l => splitChars(l, ch => {
      const o = document.createElement('span'); o.className = 'vc';
      const i = document.createElement('span'); i.className = 'vc__i'; i.textContent = ch; o.appendChild(i); return o;
    }).map(o => o.firstChild));
    if (calm) return;
    sets.forEach(set => gsap.set(set, { yPercent: 115 }));
    ScrollTrigger.create({ trigger: h, start: 'top 86%', once: true, onEnter: () => {
      const froms = ['start', 'end', 'center'];
      sets.forEach((set, k) => gsap.to(set, { yPercent: 0, duration: .95, ease: 'back.out(1.25)',
        delay: k * .22, stagger: { each: .028, from: froms[k % 3] } }));
    } });
  });

  /* 2. Буквы-кубики: кнопки и меню — при наведении, цены — когда плашка вышла из дыма и при наведении */
  function cube(el) {
    splitChars(el, (ch, i) => {
      const o = document.createElement('span'); o.className = 'l3';
      o.innerHTML = '<span class="l3__b" style="--i:' + i + '"><span class="l3__f"></span><span class="l3__s"></span></span>';
      o.querySelector('.l3__f').textContent = ch; o.querySelector('.l3__s').textContent = ch;
      return o;
    });
  }
  document.querySelectorAll('.btn > span:not(.sr), .nav a, .hdr__addr').forEach(el => {
    cube(el);
    const host = el.closest('a,button') || el;
    host.addEventListener('mouseenter', () => el.classList.add('is-flip'));
    host.addEventListener('mouseleave', () => el.classList.remove('is-flip'));
  });
  document.querySelectorAll('.plaque__val').forEach(el => {
    cube(el);
    const pl = el.closest('.plaque');
    pl.addEventListener('mouseenter', () => el.classList.toggle('is-flip'));
    ScrollTrigger.create({ trigger: pl, start: 'top 70%', once: true,
      onEnter: () => gsap.delayedCall(1.1, () => el.classList.toggle('is-flip')) });
  });

  /* 3. Жирнение по буквам при наведении: вопросы и ссылки подвала */
  document.querySelectorAll('.acc summary, .vf').forEach((el, n) => {
    const host = el;
    const target = el.tagName === 'SUMMARY' ? (() => { const s = document.createElement('span'); s.textContent = el.textContent.trim(); el.textContent = ''; el.appendChild(s); return s; })() : el;
    const chars = splitChars(target, ch => { const c = document.createElement('span'); c.className = 'vfc'; c.textContent = ch; return c; });
    const from = ['start', 'end', 'center'][n % 3];
    if (touch) return;   // 129: на сенсорном экране «наведение» срабатывает от нажатия и не снимается — вопрос оставался жирным и наклонённым
    host.addEventListener('mouseenter', () => gsap.to(chars, { fontWeight: 800, skewX: -8, duration: .5, ease: 'power2.out', stagger: { each: .025, from }, overwrite: true }));
    host.addEventListener('mouseleave', () => gsap.to(chars, { fontWeight: 300, skewX: 0, duration: .6, ease: 'power2.out', stagger: { each: .02, from }, overwrite: true }));
  });
  gsap.set('.vf .vfc', { fontWeight: 300 });

  /* 4. Дышащие буквы: подписи глав и подпись под буквами «Знаток права» */
  document.querySelectorAll('.chap > span:last-child, .brandword__sub').forEach(el => {
    const chars = splitChars(el, ch => { const c = document.createElement('span'); c.className = 'brc'; c.textContent = ch; return c; });
    if (calm) return;
    const tw = gsap.fromTo(chars, { fontWeight: 200 }, { fontWeight: 800, duration: 1.1, ease: 'sine.inOut', paused: true,
      stagger: { each: .08, repeat: -1, yoyo: true } });
    ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: st => st.isActive ? tw.play() : tw.pause() });
  });

  /* ================================================================
     ЖИВЫЕ КАРТОЧКИ: покачиваются, наклоняются за курсором, по ним бежит блик
  ================================================================ */
  if (!calm) {
    // на телефоне покачиваются только карточки, которые сейчас на экране (остальные стоят и не тратят батарею)
    const floatIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('in-view', e.isIntersecting)));
    const live = gsap.utils.toArray('.card, .plaque, .fit__card, .case, .quote, .rating, .tile, .doubt, .formbox, .quiz');
    live.forEach((el, i) => {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      const g = document.createElement('div'); g.className = 'glare'; el.appendChild(g);
      const big = el.offsetWidth > 560;
      if (!big && !el.matches('.formbox,.quiz')) {
        el.classList.add('float');
        el.style.setProperty('--fd', (6 + (i % 5) * .9) + 's');
        el.style.setProperty('--fdl', (-(i * 1.37) % 7) + 's');
        el.style.setProperty('--fr', ((i % 2 ? -1 : 1) * (.2 + (i % 3) * .12)) + 'deg');
      }
      // 17.11: на телефоне мыши нет — блик сам пробегает по карточке, когда она въезжает в экран
      if (touch) {
        if (el.classList.contains('float')) floatIO.observe(el);
        ScrollTrigger.create({ trigger: el, start: 'top 78%', end: 'bottom 22%',
          onEnter: () => sweep(el), onEnterBack: () => sweep(el) });
        return;
      }
      const max = el.matches('.tile') ? 14 : big ? 3 : 9;   // 17.11: плитки первого экрана наклоняются сильнее (вариант 6)
      const rx = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3.out' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3.out' });
      const tz = gsap.quickTo(el, 'z', { duration: .6, ease: 'power3.out' });
      gsap.set(el, { transformPerspective: 1000 });
      el.addEventListener('pointerenter', () => { el.classList.add('is-hot'); tz(big ? 10 : 34); });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        rx((.5 - py) * max); ry((px - .5) * max);
        el.style.setProperty('--gx', px * 100 + '%'); el.style.setProperty('--gy', py * 100 + '%');
        el.style.setProperty('--gs', (px * 70 + py * 30) + '%');
      });
      el.addEventListener('pointerleave', () => { el.classList.remove('is-hot'); rx(0); ry(0); tz(0); });
    });

    function sweep(el) {
      gsap.killTweensOf(el, '--gs');
      el.classList.add('is-hot');
      gsap.fromTo(el, { '--gs': '-20%' }, { '--gs': '125%', duration: 1.5, ease: 'power2.inOut',
        onComplete: () => el.classList.remove('is-hot') });
    }

    // при быстрой прокрутке ряды карточек чуть «гнутся» и пружинят обратно
    // (ряды, которые двигает GSAP — плитки первого экрана, — не трогаем)
    const rows = [...new Set(live.filter(el => el.classList.contains('float')).map(el => el.parentElement))]
      .filter(r => !r.closest('.hero__tiles'))    // 17.11: раньше промахивалось — ряд плиток первого экрана гнулся при прокрутке
      // 129: ряд «Отзывов» (оценка 5,0 и цитаты) в переходе к «Вопросам» сдвигает влево сам переход. Изгиб писал в тот же
      // transform и перебивал сдвиг — «5,0» дёргался. Этот ряд не гнём.
      .filter(r => !r.matches('.reviews__grid'));
    let skew = 0, last = 0, lastY = scrollY;
    // 18.11 ускорение: на телефоне ряды не гнём — каждый кадр двигать ряды при прокрутке пальцем слишком дорого
    if (!touch) gsap.ticker.add(() => {
      if (LITE.on) { if (last) { last = 0; skew = 0; rows.forEach(r => { r.style.transform = ''; }); } return; }
      // на телефоне прокрутка родная, скорость считаем по сдвигу страницы
      const vel = lenis.velocity || (scrollY - lastY); lastY = scrollY;
      const v = gsap.utils.clamp(-3.2, 3.2, -vel * .09);
      skew += (v - skew) * .12;
      if (Math.abs(skew) < .01) skew = 0;
      const k = Math.round(skew * 1000) / 1000;
      if (k === last) return;
      last = k;
      rows.forEach(r => { r.style.transform = k ? `skewY(${k}deg)` : ''; });
    });

    // кнопки чуть тянутся к курсору
    if (!touch) document.querySelectorAll('.btn').forEach(b => {
      const mx = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3.out' }), my = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3.out' });
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .22); my((e.clientY - r.top - r.height / 2) * .3); });
      b.addEventListener('pointerleave', () => { gsap.to(b, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.4)' }); });
    });

    // золотое кольцо-курсор, растёт над кнопками и карточками
    if (matchMedia('(pointer:fine)').matches) {
      const ring = document.createElement('div'); ring.className = 'cursor';
      const dot = document.createElement('div'); dot.className = 'cursor__dot';
      document.body.append(ring, dot);
      const cx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3.out' }), cy = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3.out' });
      // 129: пока мышь не двинули (и когда она ушла за окно), кольцо висело в левом верхнем углу экрана
      let shown = false; gsap.set([ring, dot], { autoAlpha: 0 });
      const show = on => { if (on !== shown) { shown = on; gsap.to([ring, dot], { autoAlpha: on ? 1 : 0, duration: .25, overwrite: 'auto' }); } };
      addEventListener('pointermove', e => { if (!shown) { gsap.set(ring, { x: e.clientX, y: e.clientY }); show(true); } cx(e.clientX); cy(e.clientY); gsap.set(dot, { x: e.clientX, y: e.clientY }); });
      document.documentElement.addEventListener('mouseleave', () => show(false));
      document.addEventListener('pointerover', e => ring.classList.toggle('is-big', !!e.target.closest('a,button,summary,label,.card,.plaque,.tile')));
    }
  }

  /* подвал: огромные буквы «ЗНАТОК ПРАВА» поднимаются, пока последняя глава уезжает */
  gsap.fromTo('.ftr__giant', { yPercent: 75 }, { yPercent: 28, ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'bottom bottom', end: () => '+=' + document.querySelector('.ftr').offsetHeight, scrub: true } });

  /* ---------- формы (макет: отправка подключается в рабочем сайте) ---------- */
  function bindForms() {
    document.querySelectorAll('form[data-lead]:not([data-bound])').forEach(f => {
      f.dataset.bound = 1;
      f.addEventListener('submit', e => {
        e.preventDefault();
        f.querySelector('.lead__msg').textContent = 'Это макет дизайна: отправку заявки подключим в рабочем сайте.';
      });
    });
  }
  bindForms();
})();
