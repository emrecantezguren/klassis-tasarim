(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const norm = s => (s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');

  /* ───── üst bar ───── */
  const mast = $('#masthead');
  const hero = $('#hero');
  let hoverSolid = false;
  const setHeader = () => {
    const y = scrollY;
    const pastHero = hero ? y > hero.offsetHeight - 90 : true;
    mast.classList.toggle('is-solid', pastHero || hoverSolid || !mast.dataset.transparent);
    mast.classList.toggle('is-scrolled', y > 40);
  };
  $$('[data-mega]').forEach(item => {
    const on = () => { hoverSolid = true; setHeader(); };
    const off = () => { hoverSolid = false; setHeader(); };
    item.addEventListener('mouseenter', on);
    item.addEventListener('mouseleave', off);
    item.addEventListener('focusin', on);
    item.addEventListener('focusout', off);
  });
  addEventListener('scroll', setHeader, { passive: true });
  setHeader();

  /* ───── ana sayfa slider ───── */
  if (hero) {
    const slides = $$('.slide', hero);
    const tabs = $$('.hero__tab', hero);
    const cur = $('[data-hero-current]');
    const DURATION = 7000;
    hero.style.setProperty('--slide-ms', DURATION + 'ms');
    let idx = 0, timer;
    const schedule = () => { clearTimeout(timer); if (!reduce && !document.hidden) timer = setTimeout(() => go(idx + 1), DURATION); };
    const go = (n) => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      tabs.forEach((t, i) => {
        t.classList.remove('is-active'); t.setAttribute('aria-selected', i === idx);
        if (i === idx) { void t.offsetWidth; t.classList.add('is-active'); }
      });
      slides[idx].querySelectorAll('img[loading="lazy"]').forEach(img => img.loading = 'eager');
      if (cur) cur.textContent = String(idx + 1).padStart(2, '0');
      schedule();
    };
    tabs.forEach(t => t.addEventListener('click', () => go(+t.dataset.go)));
    document.addEventListener('visibilitychange', () => document.hidden ? clearTimeout(timer) : go(idx));
    let sx = 0;
    hero.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    hero.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1)); });
    schedule();
  }

  /* ───── öne çıkan proje galerisi ───── */
  const fmain = $('[data-feature-main]');
  if (fmain) $$('.feature__thumbs button').forEach(b => b.addEventListener('click', () => {
    $$('.feature__thumbs button').forEach(x => x.classList.toggle('is-active', x === b));
    fmain.style.opacity = 0;
    setTimeout(() => { fmain.src = b.dataset.src; fmain.style.opacity = 1; }, 180);
  }));

  /* ───── yatay kaydırmalı proje şeridi (ana sayfa) ───── */
  $$('[data-carousel]').forEach(root => {
    const track = $('[data-track]', root);
    const cards = $$('.pcard', track);
    const prev = $('[data-track-prev]', root), next = $('[data-track-next]', root);
    const count = $('[data-count]', root), empty = $('[data-empty]', root);
    const brandSel = $('[data-brand-filter]', root);
    let sector = 'all';
    const update = () => {
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    const apply = () => {
      const brand = brandSel ? brandSel.value : 'all';
      let n = 0;
      cards.forEach(c => {
        const ok = (sector === 'all' || c.dataset.sector === sector) && (brand === 'all' || c.dataset.brands.split(' ').includes(brand));
        c.hidden = !ok; if (ok) n++;
      });
      if (count) count.textContent = n;
      if (empty) empty.hidden = n > 0;
      track.scrollTo({ left: 0, behavior: 'instant' });
      update();
    };
    $$('.fchip', root).forEach(b => b.addEventListener('click', () => {
      sector = b.dataset.sector;
      $$('.fchip', root).forEach(x => x.setAttribute('aria-pressed', x === b));
      apply();
    }));
    if (brandSel) brandSel.addEventListener('change', apply);
    const step = () => { const c = cards.find(c => !c.hidden); return c ? c.offsetWidth + 16 : 300; };
    prev.addEventListener('click', () => track.scrollBy({ left: -step() * 2 }));
    next.addEventListener('click', () => track.scrollBy({ left: step() * 2 }));
    track.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  });

  /* ───── listeleme filtreleri (ürünler, projeler, blog) ─────
     [data-listing] > [data-item data-k-*]; kontroller: [data-f=key][data-v=..], select[data-fsel=key], input[data-fsearch] */
  $$('[data-listing]').forEach(root => {
    const items = $$('[data-item]', root);
    const page = +root.dataset.page || 0;
    const countEl = $('[data-listing-count]', root);
    const emptyEl = $('[data-listing-empty]', root);
    const moreBtn = $('[data-listing-more]', root);
    const state = {};
    let q = '', limit = page;
    const params = new URLSearchParams(location.search);
    const apply = () => {
      let n = 0, shown = 0;
      const nq = norm(q);
      items.forEach(it => {
        let ok = Object.entries(state).every(([k, v]) => v === 'all' || (it.dataset['k' + k[0].toUpperCase() + k.slice(1)] || '').split(' ').includes(v));
        if (ok && nq) ok = norm(it.dataset.search || it.textContent).includes(nq);
        if (ok) n++;
        const vis = ok && (!limit || n <= limit);
        it.hidden = !vis; if (vis) shown++;
      });
      if (countEl) countEl.textContent = n;
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
    $$('[data-f]', root).forEach(b => {
      if (params.get(b.dataset.f) === b.dataset.v) b.click();
    });
    const si = $('[data-fsearch]', root);
    if (si) {
      if (params.get('q')) si.value = q = params.get('q');
      si.addEventListener('input', () => { q = si.value; limit = page; apply(); });
    }
    if (moreBtn) moreBtn.addEventListener('click', () => { limit += page; apply(); });
    apply();
  });

  /* ───── lightbox ───── */
  const lb = $('#lightbox');
  let lbList = [], lbIdx = 0;
  const lbShow = () => {
    $('img', lb).src = lbList[lbIdx];
    $('.lightbox__count', lb).textContent = (lbIdx + 1) + ' / ' + lbList.length;
    $$('.lightbox__nav', lb).forEach(n => n.hidden = lbList.length < 2);
  };
  const lbOpen = (list, i) => { lbList = list; lbIdx = i; lbShow(); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
  const lbClose = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
  if (lb) {
    $('.lightbox__close', lb).addEventListener('click', lbClose);
    $('.lightbox__nav--prev', lb).addEventListener('click', () => { lbIdx = (lbIdx - 1 + lbList.length) % lbList.length; lbShow(); });
    $('.lightbox__nav--next', lb).addEventListener('click', () => { lbIdx = (lbIdx + 1) % lbList.length; lbShow(); });
    lb.addEventListener('click', e => { if (e.target === lb) lbClose(); });
    addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'ArrowRight') $('.lightbox__nav--next', lb).click();
      if (e.key === 'ArrowLeft') $('.lightbox__nav--prev', lb).click();
    });
    $$('[data-gallery]').forEach(g => {
      const btns = $$('[data-full]', g);
      const list = btns.map(b => b.dataset.full);
      btns.forEach((b, i) => b.addEventListener('click', () => lbOpen(list, i)));
    });
  }

  /* ───── ürün detayı: galeri + renkler ───── */
  const pd = $('[data-pd]');
  if (pd) {
    const main = $('.pd__main img', pd);
    const thumbs = $$('.pd__thumbs button', pd);
    const imgs = thumbs.length ? thumbs.map(t => t.dataset.src) : [main.src];
    let cur = 0;
    thumbs.forEach((t, i) => t.addEventListener('click', () => {
      cur = i;
      thumbs.forEach(x => x.classList.toggle('is-active', x === t));
      main.style.opacity = 0;
      setTimeout(() => { main.src = t.dataset.src; main.style.opacity = 1; }, 150);
    }));
    $('.pd__main', pd).addEventListener('click', () => lb && lbOpen(imgs, cur));
    const sw = $$('.swatch', pd);
    const label = $('[data-color-name]', pd);
    const prev = $('[data-color-preview]', pd);
    const quote = $$('[data-quote-link]', pd);
    sw.forEach(s => s.addEventListener('click', () => {
      sw.forEach(x => x.setAttribute('aria-pressed', x === s));
      const name = s.dataset.color;
      if (label) label.textContent = name;
      if (prev) {
        prev.hidden = false;
        const im = $('img', prev);
        if (s.dataset.img) { im.src = s.dataset.img; im.hidden = false; } else im.hidden = true;
        $('b', prev).textContent = name;
      }
      quote.forEach(a => { const u = new URL(a.href, location.href); u.searchParams.set('renk', name); a.href = u.href; });
    }));
    const more = $('[data-swatch-more]', pd);
    if (more) more.addEventListener('click', () => { $('.swatches', pd).classList.remove('is-collapsed'); more.remove(); });
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

  /* ───── paylaş ───── */
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
    navigator.clipboard && navigator.clipboard.writeText(location.href).then(() => { b.textContent = 'Bağlantı kopyalandı'; });
  }));

  /* ───── mobil menü ───── */
  const drawer = $('#drawer');
  const openBtn = $('[data-open-drawer]');
  const setDrawer = (open) => {
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', !open);
    openBtn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  openBtn.addEventListener('click', () => setDrawer(true));
  $('[data-close-drawer]').addEventListener('click', () => setDrawer(false));
  $$('.drawer a').forEach(a => a.addEventListener('click', () => setDrawer(false)));
  $$('.acc > button').forEach(b => b.addEventListener('click', () => b.parentElement.classList.toggle('is-open')));

  /* ───── arama katmanı ───── */
  const search = $('#search');
  const setSearch = (open) => {
    search.classList.toggle('is-open', open);
    search.setAttribute('aria-hidden', !open);
    if (open) setTimeout(() => $('input', search).focus(), 50);
  };
  $$('[data-open-search]').forEach(b => b.addEventListener('click', () => setSearch(true)));
  $('[data-close-search]').addEventListener('click', () => setSearch(false));
  search.addEventListener('click', e => { if (e.target === search) setSearch(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { setSearch(false); setDrawer(false); lb && lbClose(); } });

  /* ───── arama sayfası ───── */
  const results = $('[data-results]');
  if (results && window.KLASSIS_INDEX) {
    const input = $('[data-search-input]');
    const root = results.dataset.root || '';
    const groups = { urun: 'Ürünler', proje: 'Projeler', marka: 'Markalar', kategori: 'Ürün grupları', blog: 'Blog ve rehber' };
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const render = () => {
      const q = norm(input.value.trim());
      history.replaceState(null, '', q ? '?q=' + encodeURIComponent(input.value.trim()) : location.pathname);
      if (q.length < 2) { results.innerHTML = '<p class="note">En az iki harf yazın. Örnek: karo halı, Steelcase, Ziraat, akustik.</p>'; return; }
      const words = q.split(/\s+/);
      const hits = window.KLASSIS_INDEX.filter(d => words.every(w => d.s.includes(w)));
      if (!hits.length) { results.innerHTML = '<p class="note">“' + esc(input.value) + '” için sonuç bulunamadı. Farklı bir kelime deneyin ya da <a href="' + root + 'teklif.html" style="text-decoration:underline">bize sorun</a>.</p>'; return; }
      let html = '<p class="note">' + hits.length + ' sonuç</p>';
      Object.keys(groups).forEach(g => {
        const list = hits.filter(h => h.t === g).slice(0, 30);
        if (!list.length) return;
        html += '<h2>' + groups[g] + ' (' + hits.filter(h => h.t === g).length + ')</h2><ul>' + list.map(h =>
          '<li><a href="' + root + h.u + '"><img src="' + root + h.i + '" alt="" loading="lazy"><span><b>' + esc(h.n) + '</b><small>' + esc(h.d) + '</small></span><svg width="16" height="16"><use href="#i-arrow"/></svg></a></li>').join('') + '</ul>';
      });
      results.innerHTML = html;
    };
    const q0 = new URLSearchParams(location.search).get('q');
    if (q0) input.value = q0;
    input.addEventListener('input', render);
    render();
  }

  /* ───── çerez bildirimi ───── */
  const cookie = $('#cookie');
  if (cookie) {
    if (!store.get('klassis-cookie')) setTimeout(() => cookie.classList.remove('is-hidden'), 600);
    $$('[data-cookie]', cookie).forEach(b => b.addEventListener('click', () => { store.set('klassis-cookie', b.dataset.cookie); cookie.classList.add('is-hidden'); }));
  }

  /* ───── e-bülten ───── */
  $$('[data-newsletter]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); $('button span', f).textContent = 'Kaydedildi'; }));

  /* ───── görünürken beliren öğeler ───── */
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -6% 0px', threshold: .06 });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-in'));
  }
})();
