/* Tasarım değiştirici: aynı sayfayı diğer tasarım önerilerinde açar, ana sayfa bölüm numaralarını gösterir. */
(() => {
  const AVAILABLE = [1, 2, 3, 4];
  const me = document.currentScript;
  const design = +me.dataset.design;
  const path = me.dataset.path || 'index.html';
  const root = me.dataset.root || '../';
  const store = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const box = document.createElement('nav');
  box.className = 'kx-switch';
  box.setAttribute('aria-label', 'Tasarım önerileri');
  let html = '<span class="kx-l">Tasarım</span>';
  [1, 2, 3, 4].forEach(n => {
    const on = n === design, ok = AVAILABLE.includes(n);
    const lab = n === 4 ? 'Alternatif' : '0' + n;  // 4. öneri, üç tasarıma ek alternatif yön
    html += `<a href="${root}tasarim-${n}/${path}${location.search}" class="${on ? 'is-on' : ''} ${ok ? '' : 'is-off'}" title="${n === 4 ? 'Alternatif tasarım' : 'Tasarım ' + n}">${lab}</a>`;
  });
  const hasSections = document.querySelector('main [data-section]');
  if (hasSections) html += '<button type="button" aria-pressed="false" data-kx-sec title="Bölüm numaralarını göster">Bölümler</button>';
  html += `<a href="${root}index.html" title="Tüm tasarım önerileri">Tümü</a>`;
  html += '<button type="button" class="kx-x" aria-label="Küçült" data-kx-min>✕</button><button type="button" class="kx-open" data-kx-max>' + (design === 4 ? 'Alternatif tasarım' : 'Tasarım 0' + design) + '</button>';
  box.innerHTML = html;
  document.body.appendChild(box);
  const sec = box.querySelector('[data-kx-sec]');
  const setSec = on => { document.documentElement.classList.toggle('kx-sections', on); if (sec) sec.setAttribute('aria-pressed', on); store.set('kx-sec', on ? '1' : ''); };
  if (sec) { sec.addEventListener('click', () => setSec(sec.getAttribute('aria-pressed') !== 'true')); if (store.get('kx-sec')) setSec(true); }
  if (store.get('kx-min')) box.classList.add('is-min');
  box.querySelector('[data-kx-min]').addEventListener('click', () => { box.classList.add('is-min'); store.set('kx-min', '1'); });
  box.querySelector('[data-kx-max]').addEventListener('click', () => { box.classList.remove('is-min'); store.set('kx-min', ''); });

  // Canlı önizleme: geliştirme sunucusundaki sürüm dosyası değişince sayfayı aynı kaydırma konumunda yeniler.
  // Yalnızca yerel ağda çalışır; yayındaki sitede hiç istek atmaz.
  const posKey = 'kx-pos:' + location.pathname;
  const saved = store.get(posKey);
  if (saved) { store.set(posKey, ''); addEventListener('load', () => scrollTo(0, +saved)); }
  let ver = null;
  const poll = () => fetch(root + '_surum.txt', { cache: 'no-store' }).then(r => r.ok ? r.text() : Promise.reject()).then(v => {
    if (ver !== null && v !== ver) { store.set(posKey, String(scrollY)); location.reload(); return; }
    ver = v; setTimeout(poll, 1000);
  }).catch(() => {});
  const local = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);
  if (location.protocol.startsWith('http') && local && !store.get('kx-noreload')) poll();
})();
