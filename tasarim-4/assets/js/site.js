(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const norm = s => (s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  const lock = on => { document.documentElement.style.overflow = on ? 'hidden' : ''; };

  /* ───── üst menü: görselin üstünde şeffaf, kaydırınca buzlu cam ───── */
  const nav = $('.nav4');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ───── mobil menü ───── */
  const sheet = $('#sheet4');
  const setSheet = open => { sheet.classList.toggle('is-open', open); sheet.setAttribute('aria-hidden', !open); lock(open); };
  $$('[data-sheet-open]').forEach(b => b.addEventListener('click', () => setSheet(true)));
  $$('[data-sheet-close]').forEach(b => b.addEventListener('click', () => setSheet(false)));
  $$('#sheet4 a').forEach(a => a.addEventListener('click', () => setSheet(false)));

  /* ───── arama ───── */
  const sbox = $('#sbox4');
  const setSearch = open => { sbox.classList.toggle('is-open', open); sbox.setAttribute('aria-hidden', !open); lock(open); if (open) setTimeout(() => $('input', sbox).focus(), 50); };
  $$('[data-search-open]').forEach(b => b.addEventListener('click', () => setSearch(true)));
  $$('[data-search-close]').forEach(b => b.addEventListener('click', () => setSearch(false)));
  sbox.addEventListener('click', e => { if (e.target === sbox) setSearch(false); });

  /* ───── giriş slaydı ─────
     Süre çubuktaki CSS dolma animasyonuyla belirlenir; çubuk dolunca sıradaki slayta geçilir.
     Hareket azaltma tercihinde otomatik geçiş yoktur. */
  const hero = $('[data-hero]');
  if (hero) {
    const slides = $$('.hero4__slide', hero);
    const bars = $$('.hero4__bars button', hero);
    const pause = $('[data-hero-pause]', hero);
    let cur = 0;
    const go = i => {
      cur = (i + slides.length) % slides.length;
      slides.forEach((s, k) => { const on = k === cur; s.classList.toggle('is-on', on); s.toggleAttribute('inert', !on); on ? s.removeAttribute('aria-hidden') : s.setAttribute('aria-hidden', 'true'); });
      bars.forEach((b, k) => b.setAttribute('aria-current', k === cur ? 'true' : 'false'));
    };
    const setPaused = p => { hero.classList.toggle('is-paused', p); pause.setAttribute('aria-pressed', p); pause.textContent = p ? 'Oynat' : 'Durdur'; };
    bars.forEach((b, k) => b.addEventListener('click', () => go(k)));
    hero.addEventListener('animationend', e => { if (e.target.closest('.hero4__bars')) go(cur + 1); });
    pause.addEventListener('click', () => setPaused(!hero.classList.contains('is-paused')));
    document.addEventListener('visibilitychange', () => { if (document.hidden) hero.classList.add('is-paused'); else if (pause.getAttribute('aria-pressed') !== 'true') hero.classList.remove('is-paused'); });
    hero.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); });
    let x0 = null;
    hero.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); x0 = null; });
    if (reduce) setPaused(true);
    go(0);
  }

  /* ───── yatay şeritler ───── */
  $$('[data-rail]').forEach(root => {
    const t = $('.rail4__track', root);
    const p = $('[data-rail-prev]', root), n = $('[data-rail-next]', root);
    const upd = () => { p.disabled = t.scrollLeft < 4; n.disabled = t.scrollLeft + t.clientWidth > t.scrollWidth - 4; };
    p.addEventListener('click', () => t.scrollBy({ left: -t.clientWidth * .8, behavior: reduce ? 'auto' : 'smooth' }));
    n.addEventListener('click', () => t.scrollBy({ left: t.clientWidth * .8, behavior: reduce ? 'auto' : 'smooth' }));
    t.addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    upd();
  });

  /* ───── listeleme filtreleri ───── */
  $$('[data-listing]').forEach(root => {
    const items = $$('[data-item]', root);
    const page = +root.dataset.page || 0;
    const emptyEl = $('[data-listing-empty]', root);
    const moreBtn = $('[data-listing-more]', root);
    const state = {};
    let q = '', limit = page;
    const params = new URLSearchParams(location.search);
    const key = k => 'k' + k[0].toUpperCase() + k.slice(1);
    const apply = () => {
      let n = 0;
      const nq = norm(q);
      items.forEach(it => {
        let ok = Object.entries(state).every(([k, v]) => v === 'all' || (it.dataset[key(k)] || '').split(' ').includes(v));
        if (ok && nq) ok = norm(it.dataset.search || it.textContent).includes(nq);
        if (ok) n++;
        it.hidden = !(ok && (!limit || n <= limit));
      });
      if (emptyEl) emptyEl.hidden = n > 0;
      if (moreBtn) moreBtn.parentElement.hidden = !limit || n <= limit;
    };
    $$('[data-f]', root).forEach(b => {
      const k = b.dataset.f;
      if (b.getAttribute('aria-pressed') === 'true') state[k] = b.dataset.v;
      b.addEventListener('click', () => {
        state[k] = b.dataset.v;
        $$(`[data-f="${k}"]`, root).forEach(x => x.setAttribute('aria-pressed', x === b));
        limit = page; apply();
      });
    });
    $$('[data-fsel]', root).forEach(s => {
      const k = s.dataset.fsel;
      if (params.get(k)) s.value = params.get(k);
      state[k] = s.value;
      s.addEventListener('change', () => { state[k] = s.value; limit = page; apply(); });
    });
    $$('[data-f]', root).forEach(b => { if (params.get(b.dataset.f) === b.dataset.v) b.click(); });
    const si = $('[data-fsearch]', root);
    if (si) {
      if (params.get('q')) si.value = q = params.get('q');
      si.addEventListener('input', () => { q = si.value; limit = page; apply(); });
    }
    if (moreBtn) moreBtn.addEventListener('click', () => { limit += page; apply(); });
    apply();
  });

  /* ───── görsel büyütme ───── */
  const lb = $('#lightbox4');
  let lbList = [], lbIdx = 0;
  const lbShow = () => { $('img', lb).src = lbList[lbIdx]; $$('.lightbox4__nav', lb).forEach(n => n.hidden = lbList.length < 2); };
  const lbOpen = (list, i) => { lbList = list; lbIdx = i; lbShow(); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); lock(true); };
  const lbClose = () => { if (!lb.classList.contains('is-open')) return; lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); lock(false); };
  $('.lightbox4__close', lb).addEventListener('click', lbClose);
  $('.lightbox4__nav--prev', lb).addEventListener('click', () => { lbIdx = (lbIdx - 1 + lbList.length) % lbList.length; lbShow(); });
  $('.lightbox4__nav--next', lb).addEventListener('click', () => { lbIdx = (lbIdx + 1) % lbList.length; lbShow(); });
  lb.addEventListener('click', e => { if (e.target === lb) lbClose(); });
  $$('[data-gallery]').forEach(g => {
    const btns = $$('[data-full]', g);
    const list = btns.map(b => b.dataset.full);
    btns.forEach((b, i) => b.addEventListener('click', () => lbOpen(list, i)));
  });

  /* ───── ürün: galeri ve renkler ───── */
  const pd = $('[data-pd]');
  if (pd) {
    const main = $('.pd4__main', pd), mimg = main && $('img', main);
    const thumbs = $$('.pd4__thumbs button', pd);
    const list = thumbs.length ? thumbs.map(t => t.dataset.src) : (main ? [main.dataset.src] : []);
    let gi = 0;
    thumbs.forEach((t, i) => t.addEventListener('click', () => { gi = i; mimg.src = t.dataset.src; thumbs.forEach(x => x.setAttribute('aria-current', x === t)); }));
    if (main) main.addEventListener('click', () => lbOpen(list, gi));
    const sw = $$('.sw4', pd);
    const name = $('[data-color-name]', pd);
    const quote = $$('[data-quote-link]', pd);
    sw.forEach(s => s.addEventListener('click', () => {
      sw.forEach(x => x.setAttribute('aria-pressed', x === s));
      const c = s.dataset.color;
      if (name) { name.textContent = c; const line = $('[data-color-line]', pd); if (line) line.hidden = false; }
      if (s.dataset.img && mimg) { mimg.src = s.dataset.img; thumbs.forEach(x => x.setAttribute('aria-current', 'false')); }
      quote.forEach(a => { const u = new URL(a.href, location.href); u.searchParams.set('renk', c); a.href = u.href; });
    }));
    const more = $('[data-swatch-more]', pd);
    if (more) more.addEventListener('click', () => { $('.sw4s', pd).classList.remove('is-collapsed'); more.remove(); });
  }

  /* ───── teklif formu ───── */
  $$('[data-quote-form]').forEach(form => {
    const wrap = form.closest('[data-form-wrap]');
    const p = new URLSearchParams(location.search);
    const prod = p.get('urun'), color = p.get('renk'), grp = p.get('grup');
    const select = $('select[name="product"]', form);
    if (grp && select) {
      const opts = [...select.options];
      const o = opts.find(x => x.text === grp) || opts.find(x => (x.dataset.alias || '').split('|').includes(grp));
      if (o) select.value = o.value || o.text;
    }
    const pf = $('[data-prefill]', form), msg = $('textarea[name="message"]', form);
    if (prod && pf) {
      pf.hidden = false;
      $('b', pf).textContent = prod + (color ? ' · ' + color : '');
      if (msg && !msg.value) msg.value = prod + (color ? ' (' + color + ')' : '') + ' için teklif almak istiyorum.';
    }
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      wrap.classList.add('is-sent');
    });
  });
  $$('[data-demo-form]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    const b = $('button[type="submit"]', f); if (b) b.textContent = 'Gönderildi (önizleme)';
  }));
  $$('[data-upload]').forEach(u => {
    const input = $('input[type="file"]', u);
    u.addEventListener('click', e => { if (e.target !== input) input.click(); });
    input.addEventListener('change', () => { if (input.files[0]) $('b', u).textContent = input.files[0].name; });
  });
  $$('[data-newsletter]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); if (!f.checkValidity()) { f.reportValidity(); return; } $('button', f).textContent = 'Kaydedildi'; }));
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
    navigator.clipboard && navigator.clipboard.writeText(location.href).then(() => { b.textContent = 'Kopyalandı'; });
  }));

  /* ───── arama sayfası ───── */
  const results = $('[data-results]');
  if (results && window.KLASSIS_INDEX) {
    const input = $('[data-search-input]');
    const groups = { urun: 'Ürünler', kategori: 'Ürün grupları', marka: 'Markalar', proje: 'Projeler', blog: 'Rehber ve blog' };
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const render = () => {
      const raw = input.value.trim(), q = norm(raw);
      history.replaceState(null, '', q ? '?q=' + encodeURIComponent(raw) : location.pathname);
      if (q.length < 2) { results.innerHTML = '<p class="note4p">En az iki harf yazın. Örnek: karo halı, Steelcase, Ziraat, akustik.</p>'; return; }
      const words = q.split(/\s+/);
      const hits = window.KLASSIS_INDEX.filter(d => words.every(w => d.s.includes(w)));
      if (!hits.length) { results.innerHTML = '<p class="note4p">“' + esc(raw) + '” için sonuç bulunamadı. <a href="teklif.html" style="text-decoration:underline">Bize sorun</a>.</p>'; return; }
      let html = '';
      Object.keys(groups).forEach(g => {
        const all = hits.filter(h => h.t === g);
        if (!all.length) return;
        html += '<h2>' + groups[g] + '</h2><ul>' + all.slice(0, 30).map(h =>
          '<li><a href="' + h.u + '"><img src="' + h.i + '" alt="" loading="lazy"><span><b>' + esc(h.n) + '</b><small>' + esc(h.d) + '</small></span></a></li>').join('') + '</ul>';
      });
      results.innerHTML = html;
    };
    const q0 = new URLSearchParams(location.search).get('q');
    if (q0) input.value = q0;
    input.addEventListener('input', render);
    render();
  }

  /* ───── çerez ───── */
  const ck = $('#cookie4');
  if (ck) {
    if (!store.get('klassis-cookie')) ck.hidden = false;
    $$('[data-cookie]', ck).forEach(b => b.addEventListener('click', () => { store.set('klassis-cookie', b.dataset.cookie); ck.hidden = true; }));
  }

  addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (sheet.classList.contains('is-open')) setSheet(false); if (sbox.classList.contains('is-open')) setSearch(false); lbClose(); }
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'ArrowRight') $('.lightbox4__nav--next', lb).click();
    if (e.key === 'ArrowLeft') $('.lightbox4__nav--prev', lb).click();
  });
})();
