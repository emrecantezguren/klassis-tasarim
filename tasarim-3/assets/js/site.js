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

  /* ───── ada menü ───── */
  const isle = $('.isle');
  addEventListener('scroll', () => isle.classList.toggle('is-scrolled', scrollY > 20), { passive: true });

  /* ───── mobil menü ───── */
  const sheet = $('#sheet');
  const setSheet = open => { sheet.classList.toggle('is-open', open); sheet.setAttribute('aria-hidden', !open); lock(open); };
  $$('[data-sheet-open]').forEach(b => b.addEventListener('click', () => setSheet(true)));
  $$('[data-sheet-close]').forEach(b => b.addEventListener('click', () => setSheet(false)));
  sheet.addEventListener('click', e => { if (e.target === sheet) setSheet(false); });
  $$('#sheet a').forEach(a => a.addEventListener('click', () => setSheet(false)));

  /* ───── arama ───── */
  const sbox = $('#sbox');
  const setSearch = open => { sbox.classList.toggle('is-open', open); sbox.setAttribute('aria-hidden', !open); if (open) setTimeout(() => $('input', sbox).focus(), 60); };
  $$('[data-search-open]').forEach(b => b.addEventListener('click', () => setSearch(true)));
  sbox.addEventListener('click', e => { if (e.target === sbox) setSearch(false); });

  /* ───── yatay şeritler ───── */
  $$('[data-rail]').forEach(root => {
    const r = $('.rail', root);
    const step = () => { const c = r.firstElementChild; return c ? c.offsetWidth + 14 : 300; };
    const p = $('[data-rail-prev]', root), n = $('[data-rail-next]', root);
    if (p) p.addEventListener('click', () => r.scrollBy({ left: -step() * 2, behavior: 'smooth' }));
    if (n) n.addEventListener('click', () => r.scrollBy({ left: step() * 2, behavior: 'smooth' }));
  });

  /* ───── öne çıkan proje görselleri ───── */
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

  /* ───── ürün: renkler ───── */
  const pd = $('[data-pd]');
  if (pd) {
    const sw = $$('.swatch', pd);
    const name = $('[data-color-name]', pd);
    const box = $('[data-color-box]', pd);
    const quote = $$('[data-quote-link]', pd);
    sw.forEach(s => s.addEventListener('click', () => {
      sw.forEach(x => x.setAttribute('aria-pressed', x === s));
      const c = s.dataset.color;
      if (box) { box.hidden = false; const im = $('img', box); if (s.dataset.img) { im.src = s.dataset.img; im.hidden = false; } else im.hidden = true; }
      if (name) name.textContent = c;
      quote.forEach(a => { const u = new URL(a.href, location.href); u.searchParams.set('renk', c); a.href = u.href; });
    }));
    const more = $('[data-swatch-more]', pd);
    if (more) more.addEventListener('click', () => { $('.sw3', pd).classList.remove('is-collapsed'); more.remove(); });
  }

  /* ───── teklif sihirbazı ───── */
  $$('[data-quote-form]').forEach(form => {
    const wrap = form.closest('[data-form-wrap]');
    const panes = $$('[data-step]', form);
    const steps = $$('.wz-steps li', wrap);
    const err = $('.wz-err', form);
    let cur = 0;
    const show = i => {
      cur = i;
      panes.forEach((p, k) => p.hidden = k !== i);
      steps.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-done', k < i); });
      err.hidden = true;
    };
    const valid = () => {
      const pane = panes[cur];
      const radios = $$('input[type="radio"][required]', pane);
      if (radios.length && !radios.some(r => r.checked)) { err.textContent = 'Lütfen bir ürün grubu seçin.'; err.hidden = false; return false; }
      for (const f of $$('input,select,textarea', pane)) {
        if (f.type === 'radio') continue;
        if (!f.checkValidity()) { f.reportValidity(); return false; }
      }
      return true;
    };
    $$('[data-next]', form).forEach(b => b.addEventListener('click', () => { if (valid()) show(cur + 1); }));
    $$('[data-back]', form).forEach(b => b.addEventListener('click', () => show(cur - 1)));
    $$('[data-unit]', form).forEach(b => b.addEventListener('click', () => $$('[data-unit]', form).forEach(x => x.setAttribute('aria-pressed', x === b))));
    const p = new URLSearchParams(location.search);
    const prod = p.get('urun'), color = p.get('renk'), grp = p.get('grup');
    if (grp) { const rs = $$('input[name="product"]', form); const r = rs.find(x => x.value === grp) || rs.find(x => (x.dataset.alias || '').split('|').includes(grp)); if (r) r.checked = true; }
    const pf = $('[data-prefill]', form), msg = $('textarea[name="message"]', form);
    if (prod && pf) {
      pf.hidden = false;
      $('b', pf).textContent = prod + (color ? ' · ' + color : '');
      if (msg && !msg.value) msg.value = prod + (color ? ' (' + color + ')' : '') + ' için teklif almak istiyorum.';
    }
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!valid()) return;
      wrap.classList.add('is-sent');
    });
    show(0);
  });
  $$('[data-demo-form]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    const b = $('button[type="submit"]', f); if (b) b.firstChild.textContent = 'Gönderildi (önizleme) ';
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
    const groups = { urun: 'Ürünler', kategori: 'Ürün grupları', marka: 'Markalar', proje: 'Projeler', blog: 'Rehber ve blog' };
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const render = () => {
      const raw = input.value.trim(), q = norm(raw);
      history.replaceState(null, '', q ? '?q=' + encodeURIComponent(raw) : location.pathname);
      if (q.length < 2) { results.innerHTML = '<p class="note">En az iki harf yazın. Örnek: karo halı, Steelcase, Ziraat, akustik.</p>'; return; }
      const words = q.split(/\s+/);
      const hits = window.KLASSIS_INDEX.filter(d => words.every(w => d.s.includes(w)));
      if (!hits.length) { results.innerHTML = '<p class="note">“' + esc(raw) + '” için sonuç yok. <a href="teklif.html" style="text-decoration:underline">Bize sorun</a>.</p>'; return; }
      let html = '<p class="note">' + hits.length + ' sonuç</p>';
      Object.keys(groups).forEach(g => {
        const all = hits.filter(h => h.t === g);
        if (!all.length) return;
        html += '<h2>' + groups[g] + ' · ' + all.length + '</h2><ul>' + all.slice(0, 30).map(h =>
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
  const toast = $('#cookie');
  if (toast) {
    if (!store.get('klassis-cookie')) setTimeout(() => toast.classList.remove('is-hidden'), 700);
    $$('[data-cookie]', toast).forEach(b => b.addEventListener('click', () => { store.set('klassis-cookie', b.dataset.cookie); toast.classList.add('is-hidden'); }));
  }

  addEventListener('keydown', e => {
    if (e.key === 'Escape') { setSheet(false); setSearch(false); lbClose(); }
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'ArrowRight') $('.lightbox__nav--next', lb).click();
    if (e.key === 'ArrowLeft') $('.lightbox__nav--prev', lb).click();
  });

  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: .06 });
    $$('.reveal').forEach(el => io.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('is-in'));
})();
