/* ================================================================
   ПЕРЕХОДЫ МЕЖДУ ГЛАВАМИ — дубль 118 (17.11.2026): то, что Игорь выбрал из проб 115–117
     1. (убрано 17.11)    — первый экран → «Разборы»: шторку заменили обычной прокруткой с глубиной, как в 111;
     2. ДЫМНАЯ ВОЛНА      — тест → «Наша цена»: стена дыма проходит снизу вверх и открывает цену (из 117);
                            страницу не останавливает — дым просто закрывает стык глав;
     3. СЛОВА РАЗДВИГАЮТСЯ — «Наша цена» → «Что я потеряю?»: «ГЛАВА 04 · Честно», щель между словами
                            вырастает в главу (из 116);
     4. ДВЕРЬ-АРКА        — «Что чаще всего мешает» → «Кто ведёт дело», варианты (адрес ?door=1|2|3|4; без номера — 4, выбор Игоря 17.11):
                            1 — арка с портретом поднимается и встаёт на место портрета в главе;
                            2 — двустворчатая арочная дверь распахивается, проходим в неё;
                            3 — арка, в которую входим: она растёт на нас, свет внутри гаснет;
                            4 — 1 и 2 вместе: двери распахиваются, в проёме уже Нурлан, рама уходит на нас, портрет влетает на место;
     5. СДВИГ ВБОК        — «Словами клиентов» → «Вопросы и ответы»: прошлая глава уезжает в полосу у левого края (из 115).
   Правила стыков: новая глава скрыта, пока её не открыл переход; прошлая к концу перехода скрыта целиком
   (сквозь новую не просвечивает); главы в переходе не ниже экрана (иначе соседняя наползает).
================================================================ */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // анимации внутри «замершей» главы должны знать, что она стоит, иначе срабатывают раньше, чем их видно
  const init0 = ScrollTrigger.prototype.init;
  ScrollTrigger.prototype.init = function (vars, anim) {
    if (vars && !vars.pin && !vars.pinnedContainer && vars.trigger) {
      const t = typeof vars.trigger === 'string' ? document.querySelector(vars.trigger) : vars.trigger;
      const pc = t && t.closest && t.closest('.tx-a, .tx-b');
      if (pc && pc !== t) vars.pinnedContainer = pc;
    }
    return init0.call(this, vars, anim);
  };

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const phone = matchMedia('(pointer:coarse)').matches || innerWidth < 760;
  const root = document.documentElement;
  // высота экрана — та же, по которой ScrollTrigger считает остановки (на телефоне innerHeight бывает больше на полосу адреса)
  const VH = () => root.clientHeight || innerHeight;
  const setVh = () => root.style.setProperty('--txvh', VH() + 'px');
  setVh(); ScrollTrigger.addEventListener('refreshInit', setVh);
  // тест дорисовывается после загрузки (вопросы, потом итог с формой) — его высота меняется, места остановок пересчитываем
  const quiz = document.getElementById('quiz');
  if (quiz && window.ResizeObserver) { let h = 0, t; new ResizeObserver(([e]) => { const nh = Math.round(e.contentRect.height); if (h && nh !== h) { clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 150); } h = nh; }).observe(quiz); }
  // 129: ответы в «Вопросах и ответах» раскрываются внутри главы, которая стоит в переходе: её высоту ScrollTrigger
  // запомнил, и раскрытые ответы вылезали вниз под главу «Связаться» (их не было видно). После раскрытия пересчитываем.
  // 19.11 (Игорь: «нажимаешь на вопрос — сайт дёргается, меняется прям картинкой»): ответ открывался сразу, а пересчёт шёл
  // через 60 мс — несколько кадров ответ налезал на нижние вопросы, потом дым перехода к «Цене» прыгал на новое место.
  // Теперь открываем ответ сами и пересчитываем в том же кадре: ответ, сдвиг ниже и дым меняются одновременно; текст ответа проявляется.
  let synced = null;
  document.addEventListener('click', e => {
    const s = e.target.closest && e.target.closest('summary'), d = s && s.parentElement;
    if (!d || d.tagName !== 'DETAILS' || !d.closest('.tx-a, .tx-b')) return;
    e.preventDefault();
    // дым к «Цене» едет в ~5 раз быстрее прокрутки: сдвиг на высоту ответа уносил его скачком. Старый дым тает, новый проявляется
    const fog = document.querySelector('.tx-smoke');
    const ghost = fog && getComputedStyle(fog).visibility !== 'hidden' ? fog.cloneNode(true) : null;
    if (ghost) fog.after(ghost);
    synced = d; d.open = !d.open; ScrollTrigger.refresh();
    if (ghost) {
      gsap.to(ghost, { opacity: 0, duration: .5, ease: 'power1.out', onComplete: () => ghost.remove() });
      gsap.from(fog.children, { opacity: 0, duration: .5, ease: 'power1.out', clearProps: 'opacity' });
    }
    const p = d.open && d.querySelector('p');
    if (p) gsap.fromTo(p, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: .35, ease: 'power2.out', clearProps: 'transform,opacity' });
  }, true);
  // открыли не нажатием (поиск по странице и т. п.) — пересчитываем как раньше
  { let t; document.addEventListener('toggle', e => { if (e.target === synced) { synced = null; return; } if (e.target.closest && e.target.closest('.tx-a, .tx-b')) { clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 60); } }, true); }
  const H = () => VH(), W = () => innerWidth;
  // 18.11 (Игорь: «на телефоне переходы дёргаются, на компьютере плавные»): на компьютере прокрутку сглаживает Lenis,
  // а на iPhone прокручивает сам телефон и шлёт положение неровно — сцена прыгала шагами. На сенсорном экране сцена
  // догоняет прокрутку за ~0,35 с, плавно (сцены закреплены на экране, отставание не видно). ?sc=0 — выключить для сравнения.
  const scQ = new URLSearchParams(location.search).get('sc');
  const SCRUB = scQ === '0' ? true : scQ ? +scQ : (matchMedia('(pointer:fine)').matches ? true : .35);

  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const bgOf = sec => { const c = sec.dataset.bg.split(','); return `radial-gradient(110% 80% at 72% 26%, ${rgba(c[1], .85)}, transparent 64%), radial-gradient(70% 55% at 16% 96%, ${rgba(c[2], .1)}, transparent 70%), ${c[0]}`; };
  function backdrop(sec, from = sec) {
    const d = document.createElement('div'); d.className = 'tx-back'; d.setAttribute('aria-hidden', 'true');
    d.style.background = bgOf(from); sec.prepend(d); return d;
  }
  const el = (tag, cls, host, html) => { const d = document.createElement(tag); d.className = cls; d.setAttribute('aria-hidden', 'true'); if (html) d.innerHTML = html; host.appendChild(d); return d; };
  const hold = (B, at) => s => { s.progress >= at ? B.removeAttribute('data-hold') : B.setAttribute('data-hold', ''); };
  const clip = (e, v) => { e.style.clipPath = v; e.style.webkitClipPath = v; };

  // общая часть: A замирает последним экраном, B — первым, на одну высоту экрана прокрутки
  function pair(A, B, zTop) {
    A.classList.add('tx-a'); B.classList.add('tx-b');
    (zTop === 'A' ? A : B).style.zIndex = 6;
    const pull = document.createElement('div'); pull.className = 'tx-pull'; pull.setAttribute('aria-hidden', 'true'); B.before(pull);
    const space = document.createElement('div'); space.className = 'tx-space'; space.setAttribute('aria-hidden', 'true'); B.after(space);
    ScrollTrigger.create({ trigger: A, start: 'bottom bottom', end: () => '+=' + H(), pin: true, pinSpacing: false, refreshPriority: 10 });
    // после остановки глава B сдвинута на экран вниз — закреплённые при прокрутке блоки внутри (.fit, заголовок «Вопросов»)
    // считают своё место на экран ниже; класс tx-past включает поправку в стилях
    return st => ({ trigger: B, start: 'top top', end: () => '+=' + H(), pin: true, pinSpacing: false, scrub: SCRUB, refreshPriority: 9, anticipatePin: 1, ...st,
      onLeave: s => { B.classList.add('tx-past'); st.onLeave && st.onLeave(s); },
      onEnterBack: s => { B.classList.remove('tx-past'); st.onEnterBack && st.onEnterBack(s); } });
  }
  const veilOf = B => { const v = el('div', 'tx-veil', document.body); v.style.background = bgOf(B); return v; };

  /* ---------- 1. ПЕРВЫЙ ЭКРАН → «Разборы»: как в 111 (Игорь, 17.11.2026: шторку убрать, взять переход из 111) ----------
     Шторки больше нет: первый экран просто уезжает вверх, текст уходит и гаснет, постер чуть отстаёт (глубина).
     Это делает main.js (блок «Первый экран — постер»), здесь ничего не нужно. */

  /* ---------- 2. ДЫМНАЯ ВОЛНА: → «Наша цена» (без остановки страницы). 137: «Цена» стоит после «Вопросов», дым срабатывает от самой «Цены» ---------- */
  // дым поднимается, пока верх «Цены» идёт снизу экрана вверх; в середине пути стык глав целиком под дымом
  const a2 = document.getElementById('test'), b2 = document.getElementById('price');
  if (a2 && b2) {
    const fog = el('div', 'tx-smoke', document.body, '<i class="tx-smoke__core"></i><i class="tx-smoke__d"></i><i class="tx-smoke__a"></i><i class="tx-smoke__b"></i><i class="tx-smoke__c"></i>');
    const [, fd, fa, fb, fc] = fog.children;
    const drift = { k: 0 }, moveFog = () => { const w = W(); fa.style.setProperty('--mx', -w * .35 * drift.k + 'px'); fd.style.setProperty('--mx', w * .2 * drift.k + 'px'); fb.style.setProperty('--mx', w * .28 * drift.k + 'px'); fc.style.setProperty('--mx', -w * .18 * drift.k + 'px'); };
    gsap.set(fog, { autoAlpha: 0 });
    b2.setAttribute('data-hold', '');   // заголовок «Наша цена» собирается, когда дым уже ушёл
    gsap.timeline({ scrollTrigger: { trigger: b2, start: 'top bottom', end: 'top top', scrub: SCRUB,
      onUpdate: hold(b2, .74), onLeave: () => b2.removeAttribute('data-hold'), onLeaveBack: () => b2.setAttribute('data-hold', '') } })
      .fromTo(fog, { autoAlpha: 0 }, { autoAlpha: 1, duration: .01, ease: 'none' }, 0)
      // 18.11 (Игорь: «дым чересчур затяжной»): дым тот же, но стоит на стыке вдвое короче и уходит раньше
      .fromTo(fog, { y: () => H() }, { y: () => -H() * .7, ease: 'power1.out', duration: .34 }, 0)
      .to(fog, { y: () => -H() * 2.45, ease: 'power1.in', duration: .34 }, .42)
      .set(fog, { autoAlpha: 0 }, .999)
      .to(drift, { k: 1, ease: 'none', duration: 1, onUpdate: moveFog }, 0);
  }

  /* ---------- 3. СЛОВА РАЗДВИГАЮТСЯ: «Узнаёте себя?» → «Какие последствия?» ---------- */
  // 137: «Цена» перенесена в конец — рамка теперь растёт из «Узнаёте себя?» в «Какие последствия?»
  const a3 = document.querySelector('.sec.pains'), b3 = document.querySelector('.sec.fears');
  if (a3 && b3) {
    const cfg = pair(a3, b3, 'B');
    // светлый лист непрозрачный сам по себе — подложка ему не нужна
    const back = b3.classList.contains('sheet') ? null : backdrop(b3), veil = veilOf(b3);
    const chap = b3.querySelectorAll('.chap span');   // «Честно» · «Глава 04» — слова берём из самой главы
    // 137 (Игорь, 17.11): у главы «Последствия» в переходе одно слово, без «Глава 02» (атрибут data-tx-one).
    // Слово стоит выше середины, рамка растёт из-под него, слово уходит вверх.
    const one = b3.hasAttribute('data-tx-one');
    const words = one
      ? el('div', 'tx-words tx-words--one', document.body, `<span class="tx-w tx-w--l"><em>${chap[0].textContent}</em></span>`)
      : el('div', 'tx-words tx-words--row', document.body, `<span class="tx-w tx-w--l">${chap[1].textContent}</span><span class="tx-w tx-w--r"><em>${chap[0].textContent}</em></span>`);
    const [wl, wr] = words.children;
    // 129 (из 135, 17.11): рамка больше не вырезает кусок страницы в полный размер. В рамке сразу вся глава целиком, уменьшенная
    // (первый экран главы), и при прокрутке она вырастает до полного экрана вместе с рамкой. Рамка — точная граница
    // уменьшенной главы, поэтому ни одно слово не обрезано.
    const frame = el('i', 'tx-frame tx-frame--fixed', document.body);
    const stack = one || matchMedia('(max-width:760px)').matches;
    // середина щели между словами: отсюда маленькая глава начинает расти
    const gapAt = () => one ? (wl.offsetTop + wl.offsetHeight + H() * .1) / H() : stack ? (wl.offsetTop + wl.offsetHeight + wr.offsetTop) / 2 / H() : (wl.offsetLeft + wl.offsetWidth + wr.offsetLeft) / 2 / W();
    let g = .5; const setFrom = () => { g = gapAt(); };
    setFrom();
    const ax = stack ? 'y' : 'x', D = () => stack ? H() : W();
    const S0 = .06;                       // стартовый размер главы: 6 % экрана
    const st = { p: 0 };
    // уменьшение не должно попадать в замеры ScrollTrigger (иначе он запоминает главу маленькой и не на своём месте):
    // на время пересчёта его снимаем, после — возвращаем
    let live = false;
    // уменьшение пишем в отдельные свойства translate и scale: свойство transform занято ScrollTrigger — после остановки он
    // сдвигает им главу на экран вниз, чтобы она ехала дальше плавно (раньше мы его стирали, и глава прыгала на экран вверх)
    const unscale = () => { b3.style.translate = ''; b3.style.scale = ''; };
    ScrollTrigger.addEventListener('refreshInit', () => { live = false; unscale(); });
    const apply = () => {
      const vw = W(), vh = H(), hB = b3.offsetHeight, p = st.p;
      const s = S0 + (1 - S0) * p;
      const cx0 = stack ? vw / 2 : vw * g, cy0 = stack ? vh * g : vh / 2;
      const cx = cx0 + (vw / 2 - cx0) * p, cy = cy0 + (vh / 2 - cy0) * p;
      const x = cx - vw * s / 2, y = cy - vh * s / 2, k = 14 * (1 - p);
      b3.style.transformOrigin = '0 0';
      if (live) { b3.style.translate = `${x}px ${y}px`; b3.style.scale = String(s); } else unscale();
      clip(b3, `inset(0px 0px ${Math.max(0, hB - vh)}px 0px round ${k / s}px)`);
      Object.assign(frame.style, { left: x + 'px', top: y + 'px', width: vw * s + 'px', height: vh * s + 'px', borderRadius: k + 'px' });
    };
    apply(); ScrollTrigger.addEventListener('refresh', () => { live = true; setFrom(); if (!b3.classList.contains('tx-open')) apply(); });
    gsap.set([veil, words, b3, frame], { autoAlpha: 0 });   // рамка видна только во время перехода
    b3.setAttribute('data-hold', '');
    const tl = gsap.timeline({ scrollTrigger: cfg({
      onUpdate: hold(b3, .75),
      onLeave: () => { if (back) gsap.to(back, { opacity: 0, duration: .9, ease: 'power1.out' }); b3.classList.add('tx-open'); clip(b3, 'none'); unscale(); },
      onEnterBack: () => { if (back) gsap.to(back, { opacity: 1, duration: .2 }); b3.classList.remove('tx-open'); apply(); } }) });
    tl.to(veil, { autoAlpha: 1, ease: 'none', duration: .12 }, 0)
      .fromTo(words, { autoAlpha: 0 }, { autoAlpha: 1, duration: .02, ease: 'none' }, 0)
      .fromTo(wl, { [ax]: () => -D() * .3, opacity: 0 }, { [ax]: 0, opacity: 1, ease: 'power2.out', duration: .16 }, .12)
      .set([b3, frame], { autoAlpha: 1 }, .26)
      // 18.11 (Игорь: «Последствия вылезают заторможенно, как будто зависает»): рост главы шёл с очень медленного разгона —
      // первые полэкрана прокрутки маленькая глава почти стояла на месте. Теперь разгон мягче и рост заметен сразу.
      .to(st, { p: 1, ease: 'power1.inOut', duration: .62, onUpdate: apply }, .26)
      .to(wl, { [ax]: () => -D() * .62, ease: 'power1.inOut', duration: .62 }, .26)
      .to(frame, { autoAlpha: 0, duration: .08 }, .86)
      .set(a3, { autoAlpha: 0 }, .99)                       // глава A под листом больше не нужна — не просвечивает по краям листа
      .set([veil, words], { autoAlpha: 0 }, .995);
    if (wr) tl.fromTo(wr, { [ax]: () => D() * .3, opacity: 0 }, { [ax]: 0, opacity: 1, ease: 'power2.out', duration: .16 }, .12)
              .to(wr, { [ax]: () => D() * .62, ease: 'power1.inOut', duration: .62 }, .26);
    live = true; if (!b3.classList.contains('tx-open')) apply();
  }

  /* ---------- 4. ДВЕРЬ-АРКА: «Что чаще всего мешает» → «Кто ведёт дело» ---------- */
  const a4 = document.querySelector('.sec.doubts'), b4 = document.querySelector('.sec.proof');
  if (a4 && b4) {
    const variant = Math.min(4, Math.max(1, +new URLSearchParams(location.search).get('door') || 4));   // 17.11: Игорь выбрал дверь 4
    const cfg = pair(a4, b4, 'B');
    const back = backdrop(b4), veil = veilOf(b4);
    const fig = b4.querySelector('.arch'); if (fig) fig.classList.add('tx-own');   // портрет главы показывает сам переход
    const NS = 'http://www.w3.org/2000/svg', ARC = 'Знаток права · юридический центр · Омск · ул. Пушкина, 2';
    // арка: левый край, правый край, верх, низ; верх — полукруг
    const archPath = (l, r, t, b) => { const rad = (r - l) / 2; return `M${l},${b} L${l},${t + rad} A${rad},${rad} 0 0 1 ${r},${t + rad} L${r},${b} Z`; };
    // надпись по дуге над аркой
    const arcText = host => {
      const d = el('div', 'tx-arc', host, `<svg xmlns="${NS}" width="100%" height="100%"><defs><path id="txArc${variant}" d=""/></defs>
        <text class="tx-arc__text"><textPath href="#txArc${variant}" startOffset="50%" text-anchor="middle">${ARC}</textPath></text></svg>`);
      const p = d.querySelector('path'), txt = d.querySelector('text');
      // 17.11: надпись длиннее дуги обрезалась с краёв («АТОК ПРАВА … ПУШКИНА,»). Теперь разрядка, а если мало — и кегль
      // подбираются так, чтобы вся фраза занимала 90 % дуги; пересчёт при смене размера дуги и после загрузки шрифтов.
      let lastRad = 0;
      const fit = rad => {
        const L = Math.PI * rad * .9, fs0 = phone ? 9 : 12, n = ARC.length;
        txt.style.fontSize = fs0 + 'px'; txt.style.letterSpacing = '0px';
        const n0 = txt.getComputedTextLength(); if (!n0) return false;
        let ls = Math.min(fs0 * .42, (L - n0) / n);
        if (ls < fs0 * .08) { const k = L / (n0 + fs0 * .08 * n); txt.style.fontSize = (fs0 * k).toFixed(2) + 'px'; ls = fs0 * .08 * k; }
        txt.style.letterSpacing = ls.toFixed(2) + 'px'; return true;
      };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (lastRad) fit(lastRad); });
      return { el: d, set: (l, r, t) => { const g = phone ? 14 : 20, rad = (r - l) / 2 + g; p.setAttribute('d', `M${l - g},${t + rad - g} A${rad},${rad} 0 0 1 ${r + g},${t + rad - g}`);
        if (Math.abs(rad - lastRad) > .5 && fit(rad)) lastRad = rad; } };
    };
    gsap.set([veil, b4], { autoAlpha: 0 });
    b4.setAttribute('data-hold', '');
    const common = { onLeave: () => gsap.to(back, { opacity: 0, duration: .9, ease: 'power1.out' }), onEnterBack: () => gsap.to(back, { opacity: 1, duration: .2 }) };

    if (variant === 1) {
      /* 1 — АРКА С ПОРТРЕТОМ: поднимается снизу в центр, затем плывёт и встаёт ровно на место портрета в главе;
             вокруг неё проявляется глава, арка подменяется настоящим портретом без шва */
      const ov = el('div', 'tx-door1', document.body);
      const card = fig.cloneNode(true); card.className = 'tx-door1__arch'; card.removeAttribute('aria-hidden'); ov.appendChild(card);
      [...card.querySelectorAll('img'), ...fig.querySelectorAll('img')].forEach(i => { i.loading = 'eager'; });   // портрет должен быть загружен до перехода
      const arc = arcText(document.body);
      const st = { rise: 0, move: 0 };
      const apply = () => {
        const vw = W(), vh = H(), fr = fig.getBoundingClientRect(), br = b4.getBoundingClientRect();
        const T = { x: fr.left, y: fr.top - br.top, w: fr.width, h: fr.height };       // где портрет будет, когда глава встанет
        const h0 = Math.min(vh * (phone ? .58 : .64), T.h * 1.12), w0 = h0 * T.w / T.h;
        const x0 = (vw - w0) / 2, yC = (vh - h0) / 2 + vh * .04, y0 = yC + (vh - yC) * (1 - st.rise) + 40 * (1 - st.rise);
        const m = st.move, x = x0 + (T.x - x0) * m, y = y0 + (T.y - y0) * m, w = w0 + (T.w - w0) * m, h = h0 + (T.h - h0) * m;
        const k = Math.min(1, T.w / 440) * (w / T.w);
        Object.assign(card.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', borderRadius: `${w / 2}px ${w / 2}px ${18 * k}px ${18 * k}px` });
        arc.set(x, x + w, y);
      };
      apply(); ScrollTrigger.addEventListener('refresh', apply);
      gsap.set([ov, arc.el], { autoAlpha: 0 });
      const tl = gsap.timeline({ scrollTrigger: cfg({ ...common, onUpdate: hold(b4, .86) }) });
      tl.to(veil, { autoAlpha: 1, ease: 'none', duration: .12 }, 0)
        .fromTo(ov, { autoAlpha: 0 }, { autoAlpha: 1, duration: .02, ease: 'none' }, .12)
        .to(st, { rise: 1, ease: 'power3.out', duration: .32, onUpdate: apply }, .12)
        .fromTo(arc.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, .22)
        .to(arc.el, { autoAlpha: 0, duration: .08 }, .5)
        .to(st, { move: 1, ease: 'power2.inOut', duration: .32, onUpdate: apply }, .5)
        .fromTo(fig, { visibility: 'hidden' }, { visibility: 'hidden', duration: .01 }, 0)
        .fromTo(b4, { autoAlpha: 0 }, { autoAlpha: 1, ease: 'power1.inOut', duration: .26 }, .56)
        .set(fig, { visibility: 'visible' }, .83)
        .set(ov, { autoAlpha: 0 }, .835)
        .set(a4, { autoAlpha: 0 }, .99)
        .set(veil, { autoAlpha: 0 }, .995);
    }

    if (variant === 2) {
      /* 2 — ДВЕРЬ РАСПАХИВАЕТСЯ: арочная двустворчатая дверь, створки открываются внутрь,
             за ними тёплый свет (обрезков главы в проёме не видно); затем проходим в дверной проём — он вырастает на весь экран */
      const glow = el('div', 'tx-glow', document.body);
      const doors = el('div', 'tx-door2', document.body, '<div class="tx-door2__ring"></div><div class="tx-door2__leaf tx-door2__leaf--l"><i></i></div><div class="tx-door2__leaf tx-door2__leaf--r"><i></i></div>');
      const [ring, lL, lR] = doors.children;
      const st = { s: 1 };
      const geo = () => { const vw = W(), vh = H(), w = Math.min(vw * (phone ? .64 : .3), vh * .5), h = w * 1.5; return { vw, vh, w, h, cx: vw / 2, cy: vh * .53 }; };
      const place = () => { const g = geo(); Object.assign(doors.style, { transformOrigin: `${g.cx}px ${g.cy}px` });
        for (const e of [ring, lL, lR]) Object.assign(e.style, { top: g.cy - g.h / 2 + 'px', height: g.h + 'px' });
        Object.assign(ring.style, { left: g.cx - g.w / 2 + 'px', width: g.w + 'px', borderRadius: `${g.w / 2}px ${g.w / 2}px 0 0` });
        Object.assign(lL.style, { left: g.cx - g.w / 2 + 'px', width: g.w / 2 + 'px', borderTopLeftRadius: `${g.w / 2}px` });
        Object.assign(lR.style, { left: g.cx + 'px', width: g.w / 2 + 'px', borderTopRightRadius: `${g.w / 2}px` }); };
      const apply = () => { const g = geo(), s = st.s, l = g.cx - g.w / 2 * s, r = g.cx + g.w / 2 * s, t = g.cy - g.h / 2 * s, b = g.cy + g.h / 2 * s;
        const p = `path('${archPath(l, r, t, b)}')`; if (!b4.classList.contains('tx-open')) clip(b4, p); clip(glow, p); gsap.set(doors, { scale: s }); };
      place(); apply(); ScrollTrigger.addEventListener('refresh', () => { place(); apply(); });
      gsap.set([glow, doors], { autoAlpha: 0 });
      const tl = gsap.timeline({ scrollTrigger: cfg({ onUpdate: hold(b4, .93),
        onLeave: () => { common.onLeave(); b4.classList.add('tx-open'); clip(b4, 'none'); },
        onEnterBack: () => { common.onEnterBack(); b4.classList.remove('tx-open'); apply(); } }) });
      tl.to(veil, { autoAlpha: 1, ease: 'none', duration: .12 }, 0)
        .fromTo(doors, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: .14 }, .12)
        .set([b4, glow], { autoAlpha: 1 }, .24)
        .fromTo(lL, { rotateY: 0 }, { rotateY: -112, ease: 'power2.inOut', duration: .28 }, .26)
        .fromTo(lR, { rotateY: 0 }, { rotateY: 112, ease: 'power2.inOut', duration: .28 }, .26)
        .to(st, { s: () => Math.max(W(), H()) / Math.min(geo().w, geo().h) * 3.2, ease: 'power2.in', duration: .4, onUpdate: apply }, .54)
        .to(glow, { opacity: 0, ease: 'power1.inOut', duration: .14 }, .79)   // свет гаснет, когда проём уже на весь экран
        .to([lL, lR], { opacity: 0, duration: .08 }, .56)
        .to(ring, { opacity: 0, duration: .12 }, .62)
        .set(doors, { autoAlpha: 0 }, .95)
        .set(a4, { autoAlpha: 0 }, .99)
        .set([veil, glow], { autoAlpha: 0 }, .995);
    }

    if (variant === 3) {
      /* 3 — ВХОД В АРКУ: арка с латунной каймой и надписью по дуге поднимается снизу, внутри — тёплый свет
             (обрезков главы не видно); арка растёт на нас, свет гаснет, мы внутри главы */
      const glow = el('div', 'tx-glow', document.body);
      const outl = el('div', 'tx-door3', document.body, `<svg xmlns="${NS}" width="100%" height="100%"><path class="tx-door3__o" d="" fill="none"/><path class="tx-door3__i" d="" fill="none"/></svg>`);
      const [po, pi] = outl.querySelectorAll('path');
      const arc = arcText(document.body);
      const st = { rise: 0, s: 1 };
      const apply = () => {
        const vw = W(), vh = H(), w = Math.min(vw * (phone ? .62 : .28), vh * .48), h = w * 1.55, cx = vw / 2, cy = vh * .54;
        const lift = (vh - (cy - h / 2) + 40) * (1 - st.rise), s = st.s;
        const l = cx - w / 2 * s, r = cx + w / 2 * s, t = cy - h / 2 * s + lift, b = cy + h / 2 * s + lift + vh * (1 - st.rise);
        const p = `path('${archPath(l, r, t, b)}')`; if (!b4.classList.contains('tx-open')) clip(b4, p); clip(glow, p);
        po.setAttribute('d', archPath(l, r, t, b).replace(' Z', '')); pi.setAttribute('d', archPath(l + 9, r - 9, t + 9, b).replace(' Z', ''));
        arc.set(l, r, t);
      };
      apply(); ScrollTrigger.addEventListener('refresh', apply);
      gsap.set([glow, outl, arc.el], { autoAlpha: 0 });
      const tl = gsap.timeline({ scrollTrigger: cfg({ onUpdate: hold(b4, .93),
        onLeave: () => { common.onLeave(); b4.classList.add('tx-open'); clip(b4, 'none'); },
        onEnterBack: () => { common.onEnterBack(); b4.classList.remove('tx-open'); apply(); } }) });
      tl.to(veil, { autoAlpha: 1, ease: 'none', duration: .12 }, 0)
        .set([b4, glow, outl], { autoAlpha: 1 }, .12)
        .to(st, { rise: 1, ease: 'power3.out', duration: .32, onUpdate: apply }, .12)
        .fromTo(arc.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, .26)
        .to(arc.el, { autoAlpha: 0, duration: .08 }, .48)
        .to(st, { s: () => Math.max(W(), H()) / Math.min(W(), H()) * 7, ease: 'power2.in', duration: .44, onUpdate: apply }, .5)
        .to(glow, { opacity: 0, ease: 'power1.inOut', duration: .14 }, .79)
        .to(outl, { autoAlpha: 0, duration: .1 }, .78)
        .set(a4, { autoAlpha: 0 }, .99)
        .set([veil, glow], { autoAlpha: 0 }, .995);
    }
    if (variant === 4) {
      /* 4 — ДВЕРИ + ПОРТРЕТ (варианты 1 и 2 вместе): арочная двустворчатая дверь поднимается, створки распахиваются —
             в проёме уже портрет Нурлана; рама двери уходит на нас (проходим в дверь), портрет летит к нам
             и встаёт ровно на своё место в главе, глава проявляется вокруг него, портрет подменяется настоящим без шва */
      const ov = el('div', 'tx-door1', document.body);
      const card = fig.cloneNode(true); card.className = 'tx-door1__arch'; card.removeAttribute('aria-hidden'); ov.appendChild(card);
      // портрет должен быть загружен до перехода; 18.11: но не в первые секунды — грузим после всей страницы, чтобы не отнимать скорость у заставки
      const eager = () => [...card.querySelectorAll('img'), ...fig.querySelectorAll('img')].forEach(i => { i.loading = 'eager'; });
      document.readyState === 'complete' ? eager() : addEventListener('load', eager, { once: true });
      const doors = el('div', 'tx-door2', document.body, '<div class="tx-door2__ring tx-door4__ring"></div><div class="tx-door2__leaf tx-door2__leaf--l"><i></i></div><div class="tx-door2__leaf tx-door2__leaf--r"><i></i></div>');
      const [ring, lL, lR] = doors.children;
      const arc = arcText(document.body);
      const st = { move: 0 };
      const target = () => { const fr = fig.getBoundingClientRect(), br = b4.getBoundingClientRect(); return { x: fr.left, y: fr.top - br.top, w: fr.width, h: fr.height }; };
      // проём двери меньше портрета в главе — портрет потом растёт к нам, как будто мы входим
      const door = T => { const vw = W(), vh = H(), h = Math.min(vh * (phone ? .46 : .5), T.h * .82), w = h * T.w / T.h; return { x: (vw - w) / 2, y: (vh - h) / 2 + vh * .03, w, h }; };
      const rad = (T, w) => [w / 2, 18 * Math.min(1, T.w / 440) * (w / T.w)];
      const place = () => {
        const T = target(), D = door(T), [r, b] = rad(T, D.w);
        Object.assign(ring.style, { left: D.x + 'px', top: D.y + 'px', width: D.w + 'px', height: D.h + 'px', borderRadius: `${r}px ${r}px ${b}px ${b}px` });
        Object.assign(lL.style, { left: D.x + 'px', top: D.y + 'px', width: D.w / 2 + 'px', height: D.h + 'px', borderRadius: `${r}px 0 0 ${b}px` });
        Object.assign(lR.style, { left: D.x + D.w / 2 + 'px', top: D.y + 'px', width: D.w / 2 + 'px', height: D.h + 'px', borderRadius: `0 ${r}px ${b}px 0` });
        arc.set(D.x, D.x + D.w, D.y);
      };
      // 18.11 (Игорь: «переход деревянный и прерывистый»): раньше портрет летел, меняя left/top/width/height — браузер каждый кадр
      // заново раскладывал и перерисовывал карточку с фото и тенью. Теперь карточка один раз ставится на место портрета в главе,
      // а полёт — только сдвиг и масштаб (transform): их считает видеокарта, кадры не теряются. Проём той же формы, что портрет,
      // поэтому масштаб одинаковый по ширине и высоте, и скругления уменьшаются вместе с карточкой ровно как раньше.
      let T0 = null, D0 = null;
      const box = () => { T0 = target(); D0 = door(T0); const [r, b] = rad(T0, T0.w);
        Object.assign(card.style, { left: T0.x + 'px', top: T0.y + 'px', width: T0.w + 'px', height: T0.h + 'px', borderRadius: `${r}px ${r}px ${b}px ${b}px`, transformOrigin: '0 0' }); };
      const apply = () => {
        if (!T0) box();
        const m = st.move, s = 1 + (D0.w / T0.w - 1) * (1 - m);
        const x = (D0.x - T0.x) * (1 - m), y = (D0.y - T0.y) * (1 - m);
        card.style.transform = `translate3d(${x}px,${y}px,0) scale(${s})`;
      };
      place(); box(); apply(); ScrollTrigger.addEventListener('refresh', () => { place(); box(); apply(); });
      gsap.set([ov, doors, arc.el], { autoAlpha: 0 });
      // 18.11: подложка главы (ровный тёмный фон) раньше гасла по времени после конца перехода, а покрывало под ней исчезало
      // в последний миг — живой фон и лента «выскакивали». Теперь подложка тает вместе с прокруткой в конце перехода
      // и так же возвращается при прокрутке назад.
      const tl = gsap.timeline({ scrollTrigger: cfg({ onUpdate: hold(b4, .88) }) });
      tl.to(veil, { autoAlpha: 1, ease: 'none', duration: .12 }, 0)                       // сначала прошлая глава закрыта
        .fromTo(doors, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: .14 }, .12)
        .fromTo(arc.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, .2)
        .fromTo(ov, { autoAlpha: 0 }, { autoAlpha: 1, duration: .03, ease: 'none' }, .26)    // портрет за закрытыми створками
        .fromTo(lL, { rotateY: 0 }, { rotateY: -112, ease: 'power2.inOut', duration: .24 }, .3)
        .fromTo(lR, { rotateY: 0 }, { rotateY: 112, ease: 'power2.inOut', duration: .24 }, .3)
        .to([lL, lR], { opacity: 0, duration: .06 }, .5)
        .to(arc.el, { autoAlpha: 0, duration: .06 }, .5)
        .fromTo(ring, { scale: 1, opacity: 1 }, { scale: 3.4, opacity: 0, ease: 'power2.in', duration: .12 }, .55)   // рама уходит на нас
        .to(st, { move: 1, ease: 'power2.inOut', duration: .31, onUpdate: apply }, .55)
        .fromTo(fig, { visibility: 'hidden' }, { visibility: 'hidden', duration: .01 }, 0)
        .fromTo(b4, { autoAlpha: 0 }, { autoAlpha: 1, ease: 'power1.inOut', duration: .12 }, .74)   // глава проявляется, когда портрет уже ушёл с её текста
        .set(fig, { visibility: 'visible' }, .86)
        .set(ov, { autoAlpha: 0 }, .865)
        .set(doors, { autoAlpha: 0 }, .87)
        // глава уже видна целиком, её подложка закрывает экран: прошлая глава и покрывало под ней больше не нужны (их не видно),
        // убираем их мгновенно, а тает только подложка. Покрывало не гасим плавно: два плавных изменения одного покрывала
        // при прокрутке назад путались, и сквозь двери просвечивала прошлая глава.
        .set(a4, { autoAlpha: 0 }, .865)
        .set(veil, { autoAlpha: 0 }, .87)
        .fromTo(back, { opacity: 1 }, { opacity: 0, ease: 'power1.inOut', duration: .13, immediateRender: false }, .87);
    }
  }

  /* ---------- 5. СДВИГ ВБОК: «Словами клиентов» → «Вопросы и ответы» ---------- */
  const a5 = document.querySelector('.sec.reviews'), b5 = document.querySelector('.sec.faq');
  if (a5 && b5) {
    const cfg = pair(a5, b5, 'A');
    const back = backdrop(a5), vedge = el('i', 'tx-vedge', b5);
    gsap.set(back, { opacity: 0 }); gsap.set(b5, { autoAlpha: 0 });
    b5.setAttribute('data-hold', '');
    const tl = gsap.timeline({ scrollTrigger: cfg({ onUpdate: hold(b5, .97) }) });   // заголовок собирается, когда полоса уже ушла
    tl.to(back, { opacity: 1, duration: .12, ease: 'none' }, 0)
      .set(b5, { autoAlpha: 1 }, .12)
      .fromTo(a5, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 91% 0% 0%)', ease: 'power2.inOut', duration: .7 }, .12)
      .fromTo(vedge, { left: '100%', opacity: 1 }, { left: '9%', ease: 'power2.inOut', duration: .7 }, .12)
      .fromTo(a5.querySelector('.wrap:not(.chap)'), { x: 0 }, { x: () => -innerWidth * .12, ease: 'power2.inOut', duration: .7 }, .12)
      .to(a5, { clipPath: 'inset(0% 100% 0% 0%)', ease: 'power1.in', duration: .18 }, .82)
      .to(vedge, { left: '0%', opacity: 0, ease: 'power1.in', duration: .18 }, .82);
  }
})();
