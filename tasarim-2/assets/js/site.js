(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const norm = s => (s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  const lock = on => { document.body.style.overflow = on ? 'hidden' : ''; };

  /* ───── üst bar ───── */
  /* üst bar her zaman görünür kalır (kaydırmada gizlenmez) */

  /* ───── tam ekran menü ───── */
  const menu = $('#t2menu');
  const setMenu = open => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', !open);
    $$('[data-menu-open]').forEach(b => b.setAttribute('aria-expanded', open));
    lock(open);
  };
  $$('[data-menu-open]').forEach(b => b.addEventListener('click', () => setMenu(true)));
  $$('[data-menu-close]').forEach(b => b.addEventListener('click', () => setMenu(false)));
  $$('#t2menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ───── arama katmanı ───── */
  const search = $('#t2search');
  const setSearch = open => {
    search.classList.toggle('is-open', open);
    search.setAttribute('aria-hidden', !open);
    if (open) setTimeout(() => $('input', search).focus(), 60);
  };
  $$('[data-search-open]').forEach(b => b.addEventListener('click', () => setSearch(true)));
  $('[data-search-close]').addEventListener('click', () => setSearch(false));
  search.addEventListener('click', e => { if (e.target === search) setSearch(false); });

  /* ───── sekmeler ───── */
  $$('[data-tabs]').forEach(root => {
    const tabs = $$('[role="tab"]', root);
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => {
        const on = x === t;
        x.setAttribute('aria-selected', on);
        const p = document.getElementById(x.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
    }));
  });

  /* ───── imleçte görsel önizleme (indeks listeleri) ───── */
  const peek = $('.peek');
  if (peek && matchMedia('(hover: hover)').matches) {
    const im = $('img', peek);
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => { cx += (x - cx) * .18; cy += (y - cy) * .18; peek.style.left = cx + 'px'; peek.style.top = cy + 'px'; raf = requestAnimationFrame(loop); };
    $$('[data-peek]').forEach(row => {
      row.addEventListener('mouseenter', e => {
        im.src = row.dataset.peek; x = cx = e.clientX + 170; y = cy = e.clientY;
        peek.classList.add('is-on'); if (!raf) loop();
      });
      row.addEventListener('mousemove', e => { x = e.clientX + 170; y = e.clientY; });
      row.addEventListener('mouseleave', () => { peek.classList.remove('is-on'); cancelAnimationFrame(raf); raf = 0; });
    });
  }

  /* ───── öne çıkan proje görseli ───── */
  const fmain = $('[data-feature-main]');
  if (fmain) $$('[data-feature-thumbs] button').forEach(b => b.addEventListener('click', () => {
    $$('[data-feature-thumbs] button').forEach(x => x.classList.toggle('is-active', x === b));
    fmain.style.opacity = 0;
    setTimeout(() => { fmain.src = b.dataset.src; fmain.style.opacity = 1; }, 200);
  }));

  /* ───── listeleme filtreleri ───── */
  $$('[data-listing]').forEach(root => {
    const items = $$('[data-item]', root);
    const page = +root.dataset.page || 0;
    const countEl = $$('[data-listing-count]', root);
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
      countEl.forEach(c => c.textContent = n);
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
    if (innerWidth < 980) $$('.side details', root).forEach((d, i) => { if (i > 0) d.open = false; });
    apply();
  });

  /* ───── lightbox ───── */
  const lb = $('#lightbox');
  let lbList = [], lbIdx = 0;
  const lbShow = () => {
    $('img', lb).src = lbList[lbIdx];
    $('.lightbox__count', lb).textContent = String(lbIdx + 1).padStart(2, '0') + ' / ' + String(lbList.length).padStart(2, '0');
    $$('.lightbox__nav', lb).forEach(n => n.hidden = lbList.length < 2);
  };
  const lbOpen = (list, i) => { lbList = list; lbIdx = i; lbShow(); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); lock(true); };
  const lbClose = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); lock(false); };
  $('.lightbox__close', lb).addEventListener('click', lbClose);
  $('.lightbox__nav--prev', lb).addEventListener('click', () => { lbIdx = (lbIdx - 1 + lbList.length) % lbList.length; lbShow(); });
  $('.lightbox__nav--next', lb).addEventListener('click', () => { lbIdx = (lbIdx + 1) % lbList.length; lbShow(); });
  lb.addEventListener('click', e => { if (e.target === lb) lbClose(); });
  $$('[data-gallery]').forEach(g => {
    const btns = $$('[data-full]', g);
    const list = btns.map(b => b.dataset.full);
    btns.forEach((b, i) => b.addEventListener('click', () => lbOpen(list, i)));
  });

  /* ───── görsel şeridi oklar ───── */
  $$('.gstrip').forEach(s => {
    const t = $('.gstrip__track', s);
    const step = () => ($('button', t) || t).offsetWidth + 6;
    const p = $('[data-strip-prev]', s), n = $('[data-strip-next]', s);
    if (p) p.addEventListener('click', () => t.scrollBy({ left: -step(), behavior: 'smooth' }));
    if (n) n.addEventListener('click', () => t.scrollBy({ left: step(), behavior: 'smooth' }));
  });

  /* ───── ürün: renk seçimi ───── */
  const pd = $('[data-pd]');
  if (pd) {
    const sw = $$('.swatch', pd);
    const name = $('[data-color-name]', pd);
    const prev = $('[data-color-img]', pd);
    const quote = $$('[data-quote-link]', pd);
    sw.forEach(s => s.addEventListener('click', () => {
      sw.forEach(x => x.setAttribute('aria-pressed', x === s));
      const c = s.dataset.color;
      if (name) name.textContent = c;
      if (prev) { if (s.dataset.img) { prev.src = s.dataset.img; prev.hidden = false; } else prev.hidden = true; }
      quote.forEach(a => { const u = new URL(a.href, location.href); u.searchParams.set('renk', c); a.href = u.href; });
    }));
  }

  /* ───── teklif formu ───── */
  $$('[data-quote-form]').forEach(form => {
    const p = new URLSearchParams(location.search);
    const prod = p.get('urun'), color = p.get('renk'), grp = p.get('grup');
    const sel = $('select[name="product"]', form);
    if (grp && sel) [...sel.options].forEach(o => { if (o.text === grp) sel.value = o.value || o.text; });
    const msg = $('textarea[name="message"]', form);
    const pf = $('[data-prefill]', form);
    if (prod && pf) {
      pf.hidden = false;
      $('b', pf).textContent = prod + (color ? ' · ' + color : '');
      if (msg && !msg.value) msg.value = prod + (color ? ' (' + color + ')' : '') + ' için teklif almak istiyorum.';
    }
    $$('[data-unit]', form).forEach(b => b.addEventListener('click', () => $$('[data-unit]', form).forEach(x => x.setAttribute('aria-pressed', x === b))));
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      form.closest('[data-form-wrap]').classList.add('is-sent');
    });
  });
  $$('[data-demo-form]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    const b = $('button[type="submit"] span', f); if (b) b.textContent = 'Gönderildi (önizleme)';
  }));
  $$('[data-upload]').forEach(u => {
    const input = $('input[type="file"]', u);
    u.addEventListener('click', () => input.click());
    input.addEventListener('change', () => { if (input.files[0]) $('b', u).textContent = input.files[0].name; });
  });
  $$('[data-newsletter]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); $('button', f).textContent = 'Kaydedildi'; }));
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
    navigator.clipboard && navigator.clipboard.writeText(location.href).then(() => { b.textContent = 'Kopyalandı'; });
  }));

  /* ───── arama sayfası ───── */
  const results = $('[data-results]');
  if (results && window.KLASSIS_INDEX) {
    const input = $('[data-search-input]');
    const groups = { urun: 'Ürünler', kategori: 'Ürün grupları', marka: 'Markalar', proje: 'Projeler', blog: 'Blog ve rehber' };
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const render = () => {
      const raw = input.value.trim(), q = norm(raw);
      history.replaceState(null, '', q ? '?q=' + encodeURIComponent(raw) : location.pathname);
      if (q.length < 2) { results.innerHTML = '<p class="note">En az iki harf yazın. Örnek: karo halı, Steelcase, Ziraat, akustik.</p>'; return; }
      const words = q.split(/\s+/);
      const hits = window.KLASSIS_INDEX.filter(d => words.every(w => d.s.includes(w)));
      if (!hits.length) { results.innerHTML = '<p class="note">“' + esc(raw) + '” için sonuç yok. Farklı bir kelime deneyin ya da <a href="teklif.html" style="text-decoration:underline">bize sorun</a>.</p>'; return; }
      let html = '<p class="note">' + hits.length + ' sonuç</p>';
      Object.keys(groups).forEach(g => {
        const all = hits.filter(h => h.t === g);
        if (!all.length) return;
        html += '<h2>' + groups[g] + ' · ' + all.length + '</h2><ul>' + all.slice(0, 30).map(h =>
          '<li><a href="' + h.u + '"><img src="' + h.i + '" alt="" loading="lazy"><span><b>' + esc(h.n) + '</b><small>' + esc(h.d) + '</small></span><svg><use href="#i-arrow"/></svg></a></li>').join('') + '</ul>';
      });
      results.innerHTML = html;
    };
    const q0 = new URLSearchParams(location.search).get('q');
    if (q0) input.value = q0;
    input.addEventListener('input', render);
    render();
  }

  /* ───── çerez ───── */
  const cookie = $('#cookie');
  if (cookie) {
    if (!store.get('klassis-cookie')) setTimeout(() => cookie.classList.remove('is-hidden'), 600);
    $$('[data-cookie]', cookie).forEach(b => b.addEventListener('click', () => { store.set('klassis-cookie', b.dataset.cookie); cookie.classList.add('is-hidden'); }));
  }

  addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); setSearch(false); lbClose(); } });
  if (lb) addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'ArrowRight') $('.lightbox__nav--next', lb).click();
    if (e.key === 'ArrowLeft') $('.lightbox__nav--prev', lb).click();
  });

  /* ───── beliren öğeler ───── */
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: .06 });
    $$('.reveal').forEach(el => io.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('is-in'));
})();
