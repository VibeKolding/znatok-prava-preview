/* ДУБЛЬ 113: глубина на первом экране — фигура и буквы чуть расходятся за мышкой.
   Дым и искры убраны 16.11 (Игорь: «удешевил вид»). */
(() => {
  const hero = document.getElementById('hero');
  if (!hero) return;
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) hero.addEventListener('pointermove', e => {
    hero.style.setProperty('--mx', (e.clientX / innerWidth - .5).toFixed(3));
    hero.style.setProperty('--my', (e.clientY / innerHeight - .5).toFixed(3));
  });

  /* 17.11: на компьютере буквы «ЗНАТОК / ЗНАТОК / ПРАВА» растянуты вширь — от текста слева («Долги, просрочки…»)
     почти до края экрана, Нурлан стоит посередине этой полосы; пустого поля между текстом и постером нет */
  const stage = hero.querySelector('.wk-stage'), copy = hero.querySelector('.hero__copy');
  const texts = [...hero.querySelectorAll('.wk-t')];
  const base = texts.map(t => ({ x: +t.getAttribute('x'), len: +t.getAttribute('textLength') }));
  const MID = base[0].x + base[0].len / 2;          // середина букв в единицах рисунка (580)
  // 17.11 (проверено на дубле 114): фон 16:9 на весь первый экран. Линия пола на картинке — 79,9 % её высоты,
  // у постера пол — 80,2 % высоты сцены. Фон масштабируем так, чтобы он закрывал весь экран,
  // а линия пола легла ровно под ноги, и центр красного света — за спиной Нурлана.
  const bg = hero.querySelector('.wk-bg169'), IW = 1672, IH = 941, HOR = .7992;
  function placeBg() {
    if (!bg || !stage) return;
    const box = bg.parentElement, W = box.clientWidth, H = box.clientHeight;
    const floorY = stage.offsetTop + stage.offsetHeight * .802, cx = stage.offsetLeft + stage.offsetWidth / 2;
    const s = Math.max(W / IW, floorY / (HOR * IH), (H - floorY) / ((1 - HOR) * IH));
    const w = IW * s, h = IH * s;
    const left = Math.min(0, Math.max(W - w, cx - w / 2));
    Object.assign(bg.style, { width: w + 'px', height: h + 'px', left: left + 'px', top: (floorY - HOR * h) + 'px' });
    const fogH = Math.round(floorY + h * .02);
    hero.style.setProperty('--wk-fogh', fogH + 'px');   // живой дым — до линии пола
    hero.style.setProperty('--wk-fogw', Math.round(Math.max(W, fogH * 2)) + 'px');
    hero.style.setProperty('--wk-floory', Math.round(floorY) + 'px');                 // для низового тумана у ног
    hero.style.setProperty('--wk-misth', Math.round(stage.offsetHeight * .2) + 'px');
  }
  function fit() { fitText(); placeBg(); }
  function fitText() {
    if (!stage || !copy) return;
    // 129: раньше «как было» стояло для всего ≤1100 px, и в узком окне (800×556, 900×600) подписи у кнопки и у цифр
    // заходили на контурные буквы. Теперь «как было» — только телефон и вертикальный планшет (там постер во весь экран),
    // а в узком горизонтальном окне постер, как на компьютере, встаёт по центру свободного места справа от текста
    if (innerWidth <= 760 || (innerWidth <= 1100 && innerHeight >= innerWidth)) {
      stage.style.right = ''; hero.style.removeProperty('--wk-dash');
      texts.forEach((t, i) => { t.setAttribute('x', base[i].x); t.setAttribute('textLength', base[i].len); });
      return;
    }
    // правый край самих букв текста слева (по строкам текста, а не по ширине блоков)
    let textR = 0;
    const tw = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) {
      if (!n.nodeValue.trim()) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const b of r.getClientRects()) if (b.width) textR = Math.max(textR, b.right);
    }
    const zoneL = textR + 48, zoneR = innerWidth - Math.max(32, innerWidth * .03);
    const sw = stage.offsetWidth, sh = stage.offsetHeight;
    const center = (zoneL + zoneR) / 2;
    stage.style.right = Math.max(0, innerWidth - center - sw / 2) + 'px';
    const k = Math.max(sw / 1116, sh / 2000);        // сколько пикселей в одной единице рисунка
    // 129: в узком окне (≤1100 px) места справа от текста меньше, чем ширина букв, — буквам можно сжаться до 82 %, чтобы не заходить на текст
    const wu = Math.min(base[0].len * 2.6, Math.max(base[0].len * (innerWidth <= 1100 ? .82 : 1), (zoneR - zoneL) / k));
    texts.forEach(t => { t.setAttribute('textLength', wu.toFixed(1)); t.setAttribute('x', (MID - wu / 2).toFixed(1)); });
    hero.style.setProperty('--wk-dash', Math.round(3600 * wu / base[0].len));   // контур рисуется целиком и у широких букв
  }
  fit();
  addEventListener('resize', fit);
  // дым стоит на паузе, когда первый экран ушёл из виду
  new IntersectionObserver(([e]) => hero.classList.toggle('wk-paused', !e.isIntersecting)).observe(hero);
  if (document.fonts) document.fonts.ready.then(fit);
  addEventListener('load', fit);


})();
