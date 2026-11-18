/* 18.11: заставка загорается сама, как только пришла картинка логотипа, — не ждёт остальных скриптов.
   Отдельный файл: встроенный в страницу код запрещён защитой сайта (CSP). */
(() => {
  const it = document.getElementById('intro'), img = it && it.querySelector('img'); if (!img) return;
  const lit = () => { if (it.classList.contains('is-lit')) return; window.__litT = performance.now(); it.classList.add('is-lit'); };
  if (img.complete && img.naturalWidth) lit(); else img.addEventListener('load', lit, { once: true });
})();
