/* 139: телефон с приложением — экраны листаются сами, карточка рядом подсвечивается; нажатие на карточку открывает её экран.
   «Стадия дела» и «Платежи» проигрываются по шагам каждый раз, когда экран открывается (Игорь, 18.11) */
(() => {
  const box = document.querySelector('.appx'); if (!box) return;
  const calls = [...box.querySelectorAll('.appx__call')];
  const scrs = [...box.querySelectorAll('.ph-scr')];
  const sec = box.closest('section');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOLD = [6200, 6200, 4200, 5200];   // сколько стоит каждый экран, мс
  let cur = 0, timer = null, manual = false, visible = false, plays = [];

  const later = (fn, ms) => plays.push(setTimeout(fn, ms));
  const stop = () => { plays.forEach(clearTimeout); plays = []; };
  const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const count = (el, from, to, ms = 420) => {
    const t0 = performance.now();
    const f = t => { const k = Math.min(1, (t - t0) / ms); el.textContent = fmt(from + (to - from) * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };

  /* ---- Стадия дела: этап 1 → 2 → 3, срок уменьшается ---- */
  const S = scrs[0];
  const dots = [...S.querySelectorAll('.ph-steps .d')], lns = [...S.querySelectorAll('.ph-steps .ln')], lbls = [...S.querySelectorAll('.ph-steplbl i')];
  const nm = S.querySelector('.ph-stname'), no = S.querySelector('.ph-stno'), mo = S.querySelector('.ph-months');
  dots.forEach((d, i) => { if (d.querySelector('svg')) d.insertAdjacentHTML('beforeend', `<b class="num">${i + 1}</b>`); });
  const NAMES = ['Сбор документов', 'Подача заявления в суд', 'Принятие заявления судом'];
  const MONTHS = ['≈ 10 месяцев', '≈ 9 месяцев', '≈ 8 месяцев'];
  const swap = (el, txt) => { el.classList.add('is-swap'); later(() => { el.textContent = txt; el.classList.remove('is-swap'); }, 200); };
  const stageAt = (k, anim) => {
    dots.forEach((d, i) => { d.classList.toggle('is-done', i < k); d.classList.toggle('is-cur', i === k); });
    lns.forEach((l, i) => l.classList.toggle('is-done', i < k));
    lbls.forEach((l, i) => l.classList.toggle('is-cur', i === k));
    const set = anim ? swap : (el, t) => { el.textContent = t; };
    set(nm, NAMES[k]); set(no, `Этап ${k + 1} из 5`); set(mo, MONTHS[k]);
  };
  const playStage = () => {
    S.classList.add('is-play'); S.classList.remove('is-end');
    stageAt(0, false);
    later(() => stageAt(1, true), 1100);
    later(() => stageAt(2, true), 2200);
    later(() => S.classList.add('is-end'), 2900);
  };

  /* ---- Платежи: строки появляются по одной, сумма растёт ---- */
  const P = scrs[1];
  const rows = [...P.querySelectorAll('.ph-pay')], paid = P.querySelector('.ph-paid'), bar = P.querySelector('.ph-paybar');
  const SUMS = [30000, 45000, 60000, 75000];
  const playPay = () => {
    P.classList.add('is-play'); P.classList.remove('is-end');
    rows.forEach(r => r.classList.remove('is-in', 'is-mark'));
    paid.textContent = '0'; bar.style.width = '0%';
    let sum = 0;
    rows.forEach((r, i) => {
      const t = 500 + i * 650;
      later(() => r.classList.add('is-in'), t);
      later(() => {
        r.classList.add('is-mark');
        if (i < SUMS.length) { count(paid, sum, SUMS[i]); sum = SUMS[i]; bar.style.width = (sum / 1500) + '%'; }
      }, t + 320);
    });
    later(() => P.classList.add('is-end'), 500 + rows.length * 650 + 200);
  };

  const play = i => { stop(); if (still) return; if (i === 0) playStage(); if (i === 1) playPay(); };

  const show = i => {
    if (i === cur) { play(i); return; }
    scrs.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-out', k === cur && k !== i); });
    const prev = cur; cur = i;
    setTimeout(() => scrs[prev] !== scrs[cur] && scrs[prev].classList.remove('is-out'), 750);
    calls.forEach(c => c.classList.toggle('is-on', +c.dataset.s === i));
    play(i);
  };
  const tick = () => { clearTimeout(timer); if (!visible) return; timer = setTimeout(() => { show((cur + 1) % scrs.length); tick(); }, manual ? Math.max(9000, HOLD[cur]) : HOLD[cur]); };

  calls.forEach(c => c.addEventListener('click', () => { manual = true; show(+c.dataset.s); tick(); }));

  const start = () => {
    if (sec && sec.hasAttribute('data-hold')) return setTimeout(start, 120);
    box.classList.add('is-in'); play(cur); tick();
  };
  new IntersectionObserver(es => es.forEach(e => {
    visible = e.isIntersecting;
    if (visible) { box.classList.contains('is-in') ? tick() : start(); } else clearTimeout(timer);
  }), { threshold: .3 }).observe(box);
})();
