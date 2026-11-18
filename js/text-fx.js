/* ================================================================
   АНИМАЦИИ ЗАГОЛОВКОВ (17.11.2026) — своя версия приёмов «дым» и «осколки»
   В — заголовок первого экрана собирается из дыма, один раз;
   А — заголовки глав собираются из осколков по очереди слева направо, один раз, когда до них долистали;
   Г — в блоке «Связаться» сменяются строки «ЗНАТОК ПРАВА / ЮРИДИЧЕСКИЙ ЦЕНТР / ОМСК · ПУШКИНА, 2».
   Буквы рисуются на холсте ровно по местам настоящего текста; когда анимация
   закончилась, холст убирается и остаётся обычный текст страницы.
   «Долги» не рассыпаются и не тают — только собираются (ст. 28.1).
================================================================ */
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = matchMedia('(pointer:coarse)').matches || innerWidth < 760;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const eOut = x => 1 - Math.pow(1 - x, 3), eIn = x => x * x;
  const VAPOR = [206, 168, 150];   // тёплая дымка в тон дыму первого экрана
  const DPR = () => Math.min(2, devicePixelRatio || 1);

  // золото берём из самого сайта (--gold-grad), чтобы холст совпадал с текстом
  let GOLD = null;
  function gold() {
    if (GOLD) return GOLD;
    const s = getComputedStyle(document.documentElement).getPropertyValue('--gold-grad');
    GOLD = [...s.matchAll(/(#[0-9a-f]{3,8})\s+([\d.]+)%/gi)].map(m => [m[1], +m[2] / 100]);
    if (GOLD.length < 2) GOLD = [['#FDF0D2', 0], ['#EBD09A', .3], ['#CAA362', .47], ['#6F4C22', .505], ['#C19B5C', .56], ['#EED8A6', .76], ['#A3804A', 1]];
    return GOLD;
  }
  const goldFill = (x, top, bot) => { const g = x.createLinearGradient(0, top, 0, bot); gold().forEach(([c, a]) => g.addColorStop(a, c)); return g; };
  const isGold = (p, root) => { for (let e = p; e && e !== root.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if ((cs.webkitBackgroundClip || cs.backgroundClip) === 'text') return e; } return null; };

  // рамка холста: элемент + запас вокруг (запас не вылезает за край экрана)
  function frame(el, padK) {
    const r = el.getBoundingClientRect(), fs = parseFloat(getComputedStyle(el).fontSize), pad = fs * padK;
    const vw = document.documentElement.clientWidth;
    const pl = Math.min(pad, Math.max(0, r.left)), pr = Math.min(pad, Math.max(0, vw - r.right));
    return { r, fs, pl, pt: pad, W: Math.ceil(r.width + pl + pr), H: Math.ceil(r.height + pad * 2) };
  }

  // перерисовать текст элемента на холст — слово в слово по его местам на странице
  function paint(el, f, dpr, shadow) {
    const c = document.createElement('canvas'); c.width = Math.round(f.W * dpr); c.height = Math.round(f.H * dpr);
    const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ox = f.r.left - f.pl, oy = f.r.top - f.pt, range = document.createRange();
    const ts = shadow ? getComputedStyle(el).textShadow : 'none';
    const sh = ts && ts !== 'none' ? ts.match(/(rgba?\([^)]+\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/) : null;
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) {
      const p = n.parentElement; if (!p || p.closest('canvas')) continue;
      const cs = getComputedStyle(p), g = isGold(p, el);
      x.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      if ('letterSpacing' in x) x.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
      const up = cs.textTransform === 'uppercase', re = /\S+/g;
      for (let m; (m = re.exec(n.textContent));) {
        range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length);
        const rr = range.getClientRects()[0]; if (!rr || !rr.width) continue;
        const word = up ? m[0].toUpperCase() : m[0], fm = x.measureText(word);
        const asc = fm.fontBoundingBoxAscent, des = fm.fontBoundingBoxDescent;
        const base = rr.top - oy + (rr.height - asc - des) / 2 + asc;
        if (g) { const gb = getComputedStyle(g).display === 'inline' ? rr : g.getBoundingClientRect(); x.fillStyle = goldFill(x, gb.top - oy, gb.bottom - oy); }
        else x.fillStyle = cs.color;
        if (sh) { x.shadowColor = sh[1]; x.shadowOffsetX = +sh[2]; x.shadowOffsetY = +sh[3]; x.shadowBlur = +sh[4]; }
        x.fillText(word, rr.left - ox, base);
      }
    }
    return c;
  }

  // холст поверх элемента; сам текст элемента прячем, пока идёт анимация
  function overlay(el, f) {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    const cv = document.createElement('canvas'); cv.className = 'fx'; cv.setAttribute('aria-hidden', 'true');
    const er = el.getBoundingClientRect();
    Object.assign(cv.style, { position: 'absolute', left: (f.r.left - er.left - f.pl) + 'px', top: (f.r.top - er.top - f.pt) + 'px', width: f.W + 'px', height: f.H + 'px', pointerEvents: 'none' });
    el.appendChild(cv);
    return cv;
  }
  // конец: показываем настоящий текст и плавно убираем холст
  function finish(el, cv) {
    el.classList.remove('fxh');
    cv.style.transition = 'opacity .45s ease'; cv.style.opacity = '0';
    setTimeout(() => cv.remove(), 500);
  }

  /* ---------------- А. ОСКОЛКИ: заголовок собирается из золотых осколков ----------------
     18.11 по замечанию Игоря: без пружины, вспышек и подмены в конце. Каждый осколок один раз
     плавно прилетает на место (буквы по очереди слева направо). Долетевший осколок сразу
     становится частью цельного текста, поэтому в конце ничего не «вздрагивает». */
  function shatterIn(el, o) {
    const dpr = DPR(), f = frame(el, o.pad), fs = f.fs, W = f.W, H = f.H;
    const img = paint(el, f, dpr, true), ictx = img.getContext('2d');
    const cv = overlay(el, f); cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext('2d');
    const iw = img.width, ih = img.height, data = ictx.getImageData(0, 0, iw, ih).data;
    // есть ли в треугольнике хоть кусочек буквы — проверяем все его точки с шагом 2 (иначе мелкие хвостики букв теряются)
    const touches = (p, q, r) => {
      const xs = [p[0], q[0], r[0]].map(v => v * dpr), ys = [p[1], q[1], r[1]].map(v => v * dpr);
      const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(iw - 1, Math.ceil(Math.max(...xs)));
      const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(ih - 1, Math.ceil(Math.max(...ys)));
      const [ax, bx, cx] = xs, [ay, by, cy] = ys, d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
      if (!d) return false;
      for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) {
        if (data[(y * iw + x) * 4 + 3] < 8) continue;
        const l1 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / d, l2 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / d;
        if (l1 >= -.05 && l2 >= -.05 && 1 - l1 - l2 >= -.05) return true;
      }
      return false;
    };
    let shards = [], s = fs * o.shard;
    for (let tries = 0; tries < 4; tries++) {   // слишком много осколков — режем крупнее (телефон не тянет тысячи)
      const nx = Math.ceil(W / s) + 1, ny = Math.ceil(H / s) + 1, P = [];
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const edge = i === 0 || j === 0 || i === nx - 1 || j === ny - 1;
        P.push([i * s + (edge ? 0 : rnd(-.38, .38) * s), j * s + (edge ? 0 : rnd(-.38, .38) * s)]);
      }
      shards = [];
      const add = (p, q, r) => { if (!touches(p, q, r)) return; const cx = (p[0] + q[0] + r[0]) / 3, cy = (p[1] + q[1] + r[1]) / 3; shards.push({ cx, cy, pts: [p, q, r], v: [p, q, r].map(t => [t[0] - cx, t[1] - cy]) }); };
      for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const p = P[j * nx + i], q = P[j * nx + i + 1], r = P[(j + 1) * nx + i], t = P[(j + 1) * nx + i + 1];
        if ((i + j) % 2) { add(p, q, t); add(p, t, r); } else { add(p, q, r); add(q, t, r); }
      }
      if (shards.length <= (phone ? o.capPhone : o.cap)) break;
      s *= Math.sqrt(shards.length / (phone ? o.capPhone : o.cap)) * 1.05;
    }
    // откуда и когда летит каждый осколок
    let minX = Infinity, maxX = -Infinity; for (const q of shards) { minX = Math.min(minX, q.cx); maxX = Math.max(maxX, q.cx); }
    const span = Math.max(1, maxX - minX);
    for (const q of shards) {
      const ang = rnd(-.5, .5) + (Math.random() < .5 ? -1 : 1) * Math.PI / 2 * rnd(.6, 1), dist = rnd(.4, 1) * fs * o.fly;
      q.dx = Math.cos(ang) * dist * .6 + fs * .25; q.dy = Math.sin(ang) * dist; q.r = rnd(-.5, .5);
      q.t0 = (q.cx - minX) / span * o.sweep + rnd(0, o.jitter); q.done = false;
    }
    // слой «уже на месте»: маска из долетевших осколков, сквозь неё — цельный текст (без швов)
    const mask = document.createElement('canvas'); mask.width = iw; mask.height = ih;
    const mctx = mask.getContext('2d'); mctx.setTransform(dpr, 0, 0, dpr, 0, 0); mctx.fillStyle = mctx.strokeStyle = '#fff'; mctx.lineWidth = 1.5; mctx.lineJoin = 'round';
    const solid = document.createElement('canvas'); solid.width = iw; solid.height = ih; const sctx = solid.getContext('2d');
    const ease = x => 1 - Math.pow(1 - x, 3);
    let t0 = 0, left = shards.length;
    const tick = ts => {
      if (!t0) t0 = ts;
      const t = (ts - t0) / 1000;
      let arrived = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const q of shards) {
        if (q.done) continue;
        const p = clamp((t - q.t0) / o.dur, 0, 1);
        if (p >= 1) {   // долетел — вписываем в цельный слой
          q.done = true; left--; arrived = true;
          mctx.beginPath(); mctx.moveTo(...q.pts[0]); mctx.lineTo(...q.pts[1]); mctx.lineTo(...q.pts[2]); mctx.closePath(); mctx.fill(); mctx.stroke();
          continue;
        }
        if (p <= 0) continue;
        const e = ease(p), k = 1 - e;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p * 2.2);
        ctx.translate(q.cx + q.dx * k, q.cy + q.dy * k); ctx.rotate(q.r * k);
        ctx.beginPath(); ctx.moveTo(q.v[0][0], q.v[0][1]); ctx.lineTo(q.v[1][0], q.v[1][1]); ctx.lineTo(q.v[2][0], q.v[2][1]); ctx.closePath();
        ctx.clip(); ctx.drawImage(img, -q.cx, -q.cy, W, H);
        ctx.restore();
      }
      if (arrived) {
        sctx.globalCompositeOperation = 'copy'; sctx.drawImage(mask, 0, 0);
        sctx.globalCompositeOperation = 'source-in'; sctx.drawImage(img, 0, 0);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(solid, 0, 0);
      if (left > 0) return requestAnimationFrame(tick);
      // всё на месте: холст = текст один в один, тихо меняем на настоящий текст в том же кадре
      el.classList.remove('fxh'); cv.remove();
    };
    requestAnimationFrame(tick);
  }

  /* ---------------- В и Г. ДЫМ: буквы собираются из тысяч пылинок ---------------- */
  function Vapor(host, o) {
    const cv = o.el ? null : document.createElement('canvas');
    let ctx, pc, pctx, W = 0, H = 0, dpr = 1, fs = 100, words = [], buf, u32, inst = [], raf = 0, t0 = 0, now = 0, mouse = null, mv = [0, 0], visible = !!o.el, started = false, idx = 0, nextAt = Infinity, el = o.el, ocv = null;
    if (cv) { host.appendChild(cv); ctx = cv.getContext('2d'); }

    function sizeTo(w, h) {
      const c = ocv || cv;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      pc = document.createElement('canvas'); pc.width = c.width; pc.height = c.height; pctx = pc.getContext('2d');
      buf = pctx.createImageData(pc.width, pc.height); u32 = new Uint32Array(buf.data.buffer);
    }
    function measure() {
      dpr = DPR();
      if (el) {   // режим «поверх настоящего заголовка»
        const f = frame(el, o.pad); W = f.W; H = f.H; fs = f.fs;
        ocv = overlay(el, f); ctx = ocv.getContext('2d'); sizeTo(W, H);
        words = [build(paint(el, f, dpr, false), paint(el, f, dpr, true))];
        return;
      }
      W = host.clientWidth;
      const tmp = document.createElement('canvas').getContext('2d');
      fs = 100; let widest = 0;
      for (const lines of o.words) for (const l of lines) {
        tmp.font = `${l.italic ? 'italic ' : ''}${l.weight} ${fs}px "Cormorant Garamond"`;
        widest = Math.max(widest, tmp.measureText(l.text).width);
      }
      fs = Math.min(o.max, W * o.fill / widest * 100);
      const rows = Math.max(...o.words.map(w => w.length)), pad = fs * o.pad;
      H = Math.ceil(fs * o.lh * rows + fs * .3 + pad * 2);
      sizeTo(W, H); cv.style.height = H + 'px';
      words = o.words.map(lines => {
        const img = document.createElement('canvas'); img.width = cv.width; img.height = cv.height;
        const c = img.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
        lines.forEach((l, i) => {
          c.font = `${l.italic ? 'italic ' : ''}${l.weight} ${fs}px "Cormorant Garamond"`;
          const w = c.measureText(l.text).width, y = pad + fs * o.lh * i + fs * .92;
          const x = o.align === 'center' ? (W - w) / 2 : 0;
          c.fillStyle = l.fill === 'gold' ? goldFill(c, y - fs * .8, y + fs * .1) : l.fill;
          c.fillText(l.text, x, y);
        });
        return build(img, img);
      });
    }

    // картинка -> набор пылинок
    function build(img, crisp) {
      const d = img.getContext('2d').getImageData(0, 0, img.width, img.height).data, iw = img.width, ih = img.height;
      let solid = 0; for (let k = 3; k < d.length; k += 4) if (d[k] > 110) solid++;
      const step = Math.max(1, Math.ceil(Math.sqrt(solid / (phone ? o.maxPhone : o.max_n))));
      let x0 = iw, x1 = 0;
      for (let y = 0; y < ih; y += step * 2) for (let x = 0; x < iw; x += step * 2) if (d[(y * iw + x) * 4 + 3] > 110) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
      const span = Math.max(1, x1 - x0), P = [];
      for (let y = 0; y < ih; y += step) for (let x = 0; x < iw; x += step) {
        const k = (y * iw + x) * 4; if (d[k + 3] < 110) continue;
        const nx = (x - x0) / span, sw = o.sweep === 'center' ? Math.abs(nx - .5) * 2 : nx;
        const a1 = rnd(-.6, .6) - Math.PI / 2 + .5, s1 = rnd(.5, 1.25) * fs * o.spread;   // откуда прилетает
        const a2 = rnd(-.9, .5) - Math.PI / 2 + .25, s2 = rnd(.6, 1.4) * fs * o.spread;   // куда улетает
        P.push({ x, y, r: d[k], g: d[k + 1], b: d[k + 2],
          sx: Math.cos(a1) * s1 * dpr, sy: Math.sin(a1) * s1 * dpr + fs * .2 * dpr,
          ex: Math.cos(a2) * s2 * dpr, ey: Math.sin(a2) * s2 * dpr,
          dc: sw * o.stagger * .55 + rnd(0, .22), dd: sw * o.stagger * .55 + rnd(0, .22),
          w: rnd(0, 6.28), wa: rnd(.08, .22) * fs * dpr, ox: 0, oy: 0, vx: 0, vy: 0 });
      }
      return { img: crisp, P, step };
    }

    function px(x, y, s, r, g, b, a) {
      if (a <= .02) return;
      x |= 0; y |= 0; const A = (a * 255) | 0, col = (A << 24) | (b << 16) | (g << 8) | r, w = pc.width, h = pc.height;
      for (let j = 0; j < s; j++) { const yy = y + j; if (yy < 0 || yy >= h) continue; const row = yy * w;
        for (let i = 0; i < s; i++) { const xx = x + i; if (xx < 0 || xx >= w) continue; u32[row + xx] = col; } }
    }
    function start(k, t) {
      inst.push({ k, ts: t, td: o.words && o.words.length > 1 ? t + o.condense + o.hold : Infinity, disturbed: 0, imgA: 0 });
      if (o.words && o.words.length > 1) nextAt = t + o.condense + o.hold + o.dissolve * (1 - o.overlap);
    }
    function advance(t) {
      const cur = inst[inst.length - 1]; if (!cur) return;
      if (cur.td > t) cur.td = t;
      nextAt = t + o.dissolve * (1 - o.overlap) * .6;
    }
    function replay() { inst = []; idx = 0; nextAt = Infinity; now = 0; t0 = performance.now(); start(0, 0); wake(); }
    function wake() { if (!raf && visible) raf = requestAnimationFrame(tick); }

    function tick(ts) {
      raf = 0;
      const t = (ts - t0) / 1000, dtm = Math.min(.033, Math.max(.001, t - now)); now = t;
      if (t >= nextAt) { idx = (idx + 1) % o.words.length; start(idx, t); }
      u32.fill(0);
      let anyParticles = false, crisp = null, crispA = 1;
      const C = o.condense, D = o.dissolve, R = fs * .8 * dpr;
      for (let n = inst.length - 1; n >= 0; n--) {
        const I = inst[n], w = words[I.k], s = w.step;
        const doneC = t - I.ts > C + .25, inD = t > I.td;
        if (inD && t - I.td > D + .4) { inst.splice(n, 1); continue; }
        // мышь «сдувает» буквы (только Г, только мышью — на телефоне нет)
        let dist = false;
        if (doneC && !inD && o.breath && mouse) {
          const mx = mouse[0] * dpr, my = mouse[1] * dpr, sp = Math.hypot(mv[0], mv[1]);
          if (sp > .2) for (const p of w.P) { const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy; if (d2 < R * R) { const f = (1 - Math.sqrt(d2) / R) * Math.min(3, sp) * 2.2; p.vx += mv[0] * f * .6 + rnd(-1, 1) * f; p.vy += mv[1] * f * .6 - rnd(.5, 2) * f; I.disturbed = 1; } }
        }
        if (I.disturbed) {
          let moving = 0; const k = 1 / 1.2;
          for (const p of w.P) { if (p.ox === 0 && p.oy === 0 && p.vx === 0 && p.vy === 0) continue;
            p.vx += (-p.ox * 18 * k - p.vx * 5 * k) * dtm * 3; p.vy += (-p.oy * 18 * k - p.vy * 5 * k) * dtm * 3;
            p.ox += p.vx * dtm * 18; p.oy += p.vy * dtm * 18;
            if (Math.abs(p.ox) < .3 && Math.abs(p.oy) < .3 && Math.abs(p.vx) < .05 && Math.abs(p.vy) < .05) { p.ox = p.oy = p.vx = p.vy = 0; } else moving++; }
          if (!moving) I.disturbed = 0; else dist = true;
        }
        if (doneC && !inD) { I.imgA = dist ? Math.max(0, I.imgA - dtm * 8) : Math.min(1, I.imgA + dtm * 3); crisp = w.img; crispA = I.imgA; if (I.imgA >= 1 && !dist) continue; }
        anyParticles = true;
        for (const p of w.P) {
          let x = p.x, y = p.y, a = 1, m = 0;
          const pc_ = clamp((t - I.ts - p.dc * C) / (C * .55), 0, 1);
          if (pc_ < 1) { const e = eOut(pc_), q = 1 - e; x += p.sx * q + Math.sin(p.w + q * 5) * p.wa * q; y += p.sy * q + Math.cos(p.w * 1.3 + q * 4) * p.wa * q * .6; a = Math.pow(pc_, .8); m = q; }
          if (inD) { const qd = clamp((t - I.td - p.dd * D) / (D * .6), 0, 1); if (qd > 0) { const e = eIn(qd); x += p.ex * e + Math.sin(p.w + qd * 6) * p.wa * qd * 1.4; y += p.ey * e + Math.cos(p.w + qd * 5) * p.wa * qd; a *= 1 - Math.pow(qd, 1.3); m = Math.max(m, Math.min(1, qd * 1.6)); } }
          if (p.ox || p.oy) { x += p.ox; y += p.oy; const dd = Math.min(1, Math.hypot(p.ox, p.oy) / (fs * dpr * .6)); m = Math.max(m, dd); a *= 1 - dd * .55; }
          const r = (p.r + (VAPOR[0] - p.r) * m) | 0, g = (p.g + (VAPOR[1] - p.g) * m) | 0, b = (p.b + (VAPOR[2] - p.b) * m) | 0;
          px(x, y, m > .3 ? Math.max(1, s - 1) : s, r, g, b, a * (m > .3 ? .75 : 1));
        }
      }
      const c = ocv || cv;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
      if (anyParticles) { pctx.putImageData(buf, 0, 0); ctx.drawImage(pc, 0, 0); }
      if (crisp && crispA > 0) { ctx.globalAlpha = crispA; ctx.drawImage(crisp, 0, 0); ctx.globalAlpha = 1; }
      mv[0] *= .8; mv[1] *= .8;
      // заголовок собрался и стоит — отдаём место настоящему тексту
      if (el && !anyParticles && crispA >= 1) { finish(el, ocv); return; }
      const busy = anyParticles || nextAt !== Infinity || mouse || inst.some(I => I.disturbed || I.imgA < 1 || I.td !== Infinity);
      if (busy && visible) raf = requestAnimationFrame(tick);
    }

    if (el) return { play() { measure(); replay(); } };

    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    host.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const p = pos(e); if (mouse) { mv[0] = (p[0] - mouse[0]) * .5 + mv[0] * .5; mv[1] = (p[1] - mouse[1]) * .5 + mv[1] * .5; } mouse = p; wake(); });
    host.addEventListener('pointerleave', () => { mouse = null; });
    host.addEventListener('pointerdown', () => { advance(now); wake(); });
    // крутится, только пока блок на экране
    // первый запуск — только когда заголовок над ним уже собрался (два эффекта сразу не идут)
    const go = () => { if (o.after && o.after.classList.contains('fxh')) return setTimeout(go, 150); replay(); };
    new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; if (visible && !started) { started = true; go(); } else if (visible) { t0 = performance.now() - now * 1000; wake(); } }), { threshold: .3 }).observe(host);
    let rw = 0; addEventListener('resize', () => { if (host.clientWidth === rw) return; rw = host.clientWidth; measure(); if (started) replay(); });
    rw = host.clientWidth; measure();
    return { replay };
  }

  /* ---------------- подключение к сайту ---------------- */
  const fonts = Promise.all([
    document.fonts.load('500 80px "Cormorant Garamond"', 'ДОЛГИ'),
    document.fonts.load('italic 600 80px "Cormorant Garamond"', 'ПРИСТАВЫ')
  ]).catch(() => {});
  const heroTitle = document.querySelector('.hero__title');
  const heads = [...document.querySelectorAll('.h2.split')];
  let heroDone = calm || !heroTitle;

  if (!calm) {
    if (heroTitle) heroTitle.classList.add('fxh');
    heads.forEach(h => { h.dataset.fx = 'shards'; h.classList.add('fxh'); });
  }

  // В: вызывается из заставки (main.js), когда логотип погас
  function hero() {
    if (heroDone) return; heroDone = true;
    fonts.then(() => Vapor(null, { el: heroTitle, pad: .55, condense: phone ? .95 : 1.15, stagger: .9, sweep: 'left', spread: 1.1, max_n: 16000, maxPhone: 6500 }).play());
  }
  // если заставка почему-то не позвала — через 6 секунд просто показать заголовок
  if (!heroDone) setTimeout(() => { if (!heroDone) { heroDone = true; heroTitle.classList.remove('fxh'); } }, 6000);

  // А: заголовки глав — когда до них долистали
  if (!calm) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      // дубль 115: глава ещё закрыта переходом (data-hold) — ждём, пока её станет видно
      // 18.11 (Игорь: «буквы появились, а через секунду вздрагивают»): глава ещё увеличивается переходом (CSS scale) —
      // снимок букв тогда получается мельче, и в конце настоящий текст «вставал на место». Ждём, пока масштаб станет 1.
      const scaled = el => { const w = el.offsetWidth; return w > 0 && Math.abs(el.getBoundingClientRect().width / w - 1) > .003; };
      const go = el => (el.closest('[data-hold]') || scaled(el)) ? setTimeout(() => go(el), 120) : fonts.then(() => shatterIn(el, { pad: .9, shard: .16, cap: 1100, capPhone: 520, fly: 1.3, sweep: .9, jitter: .18, dur: .75 }));
      go(e.target);
    }), { threshold: .35 });
    heads.forEach(h => io.observe(h));
  }

  // Г: строки в блоке «Связаться»
  const vb = document.querySelector('.vapor-brand');
  if (vb && !calm) fonts.then(() => Vapor(vb, { after: document.querySelector('#contacts .h2'), align: 'left', fill: .95, max: 58, lh: 1.02, pad: .45, condense: 2.0, hold: 2.6, dissolve: 2.2, overlap: .55, spread: 1.1, stagger: .9, sweep: 'left', breath: true, max_n: 12000, maxPhone: 5000,
    words: [[{ text: 'ЗНАТОК ПРАВА', weight: 500, fill: 'gold' }], [{ text: 'ЮРИДИЧЕСКИЙ ЦЕНТР', weight: 500, fill: 'gold' }], [{ text: 'ОМСК · ПУШКИНА, 2', weight: 500, fill: 'gold' }]] }));

  window.TextFX = { hero, _paint: paint, _frame: frame };   // _paint/_frame — для проверки совпадения с текстом
})();
