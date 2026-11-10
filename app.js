/* ============================================================================
   PE BOOTH · "CONNECT YOUR VOICE" — ENGINE
   One touch screen. Modes (URL hash or ?view=):
     #screen   the booth screen, full window (event)
     (none)    review page: the same screen in a frame, with test buttons
   Flow: start → consent (+ signature) → details → country + choice → thank you.
   Records are kept on this device (IndexedDB + a localStorage copy) and exported
   from the staff panel (hold the top-left corner 2 s, PIN in content.js).
   ========================================================================== */
(() => {
  'use strict';
  const C = window.PE_CONTENT;
  const R = C.rules;
  const W = 1920, H = 1080;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => (k in o ? o[k] : ''));
  const now = () => Date.now();
  const pad2 = n => String(n).padStart(2, '0');
  const stamp = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}`;
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'r' + Math.random().toString(36).slice(2) + Date.now().toString(36));
  const MODE = (() => { const q = new URLSearchParams(location.search).get('view'); const h = location.hash.replace('#', ''); return (q || h) === 'screen' ? 'screen' : 'review'; })();
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ok */ } },
  };
  const DEVICE = (() => { let d = LS.get('pe-device'); if (!d) { d = 'D-' + Math.random().toString(36).slice(2, 7).toUpperCase(); LS.set('pe-device', d); } return d; })();

  /* =========================================================== storage */
  const Store = {
    db: null, mem: [],
    async open() {
      try {
        this.db = await new Promise((res, rej) => {
          const rq = indexedDB.open('pe-booth', 1);
          rq.onupgradeneeded = () => rq.result.createObjectStore('records', { keyPath: 'id' });
          rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
        });
      } catch (e) { this.db = null; }
    },
    tx(mode) { return this.db.transaction('records', mode).objectStore('records'); },
    async add(rec) {
      this.mem.push(rec);
      // light copy in localStorage (no signature) as a second safety net
      const lite = LS.get('pe-records-lite', []); const { signature, ...rest } = rec; lite.push(rest); LS.set('pe-records-lite', lite);
      if (this.db) await new Promise(res => { const r = this.tx('readwrite').put(rec); r.onsuccess = r.onerror = () => res(); });
    },
    async all() {
      let rows = [];
      if (this.db) rows = await new Promise(res => { const r = this.tx('readonly').getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); });
      const ids = new Set(rows.map(r => r.id));
      LS.get('pe-records-lite', []).forEach(r => { if (!ids.has(r.id)) { rows.push(r); ids.add(r.id); } });
      this.mem.forEach(r => { if (!ids.has(r.id)) { rows.push(r); ids.add(r.id); } });
      return rows.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    },
    async clear() {
      this.mem = []; LS.del('pe-records-lite');
      if (this.db) await new Promise(res => { const r = this.tx('readwrite').clear(); r.onsuccess = r.onerror = () => res(); });
    },
  };
  function sync(rec) {
    if (!C.sync || !C.sync.url) return;
    try { fetch(C.sync.url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ ...rec, signature: rec.signature ? 'png' : '' }) }).catch(() => {}); } catch (e) { /* ok */ }
  }

  /* =========================================================== exports */
  const COLS = [['Date', r => r.createdAt.slice(0, 10)], ['Time', r => new Date(r.createdAt).toTimeString().slice(0, 8)], ['Name', r => r.name], ['Email', r => r.email], ['Phone', r => r.phone],
    ['Country', r => r.country], ['Connect your voice', r => r.choice], ['Other (typed)', r => r.other], ['Consent', r => (r.consent ? 'Yes' : 'No')], ['Consent time', r => r.consentAt],
    ['Signed', r => (r.signature || r.signed ? 'Yes' : 'No')], ['Event', r => r.event], ['Device', r => r.device], ['Record ID', r => r.id]];
  const csvCell = v => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  async function exportCsv() {
    const rows = await Store.all();
    const text = '﻿' + [COLS.map(c => c[0]).join(','), ...rows.map(r => COLS.map(c => csvCell(c[1](r))).join(','))].join('\r\n');
    download(`PE-booth-data_${DEVICE}_${stamp(new Date())}.csv`, text, 'text/csv;charset=utf-8');
    LS.set('pe-last-export', new Date().toISOString());
  }
  async function exportJson() {
    const rows = await Store.all();
    download(`PE-booth-backup_${DEVICE}_${stamp(new Date())}.json`, JSON.stringify({ event: C.event, device: DEVICE, exportedAt: new Date().toISOString(), consentText: consentPlain(), records: rows }, null, 1), 'application/json');
    LS.set('pe-last-export', new Date().toISOString());
  }
  async function exportConsents() {
    const rows = await Store.all();
    const body = rows.map(r => `<section><h2>${esc(r.name)}</h2><p>${esc(r.email)}${r.phone ? ' · ' + esc(r.phone) : ''}<br>${esc(r.country)} · ${esc(r.choice)}${r.other ? ' (' + esc(r.other) + ')' : ''}<br>Consent given: ${esc(r.consentAt)} · Record ${esc(r.id)}</p>${r.signature ? `<img src="${r.signature}" alt="Signature of ${esc(r.name)}">` : '<p><i>No signature stored</i></p>'}</section>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>PE booth consents</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#111}h1{font-size:22px}section{border:1px solid #ccc;border-radius:8px;padding:14px 18px;margin:14px 0;page-break-inside:avoid}h2{margin:0 0 6px;font-size:18px}p{margin:4px 0;font-size:14px}img{max-width:520px;height:auto;border-bottom:1px solid #999;background:#fff}.c{font-size:12px;color:#333;white-space:pre-wrap;border:1px solid #ddd;padding:10px;border-radius:6px}</style></head><body><h1>PE booth · consent records · ${esc(C.event)}</h1><p>Device ${esc(DEVICE)} · exported ${esc(new Date().toISOString())} · ${rows.length} records</p><div class="c">${esc(consentPlain())}</div>${body}</body></html>`;
    download(`PE-booth-consents_${DEVICE}_${stamp(new Date())}.html`, html, 'text/html');
  }
  const consentPlain = () => [...C.consent.paragraphs, C.consent.declarationTitle, ...C.consent.declaration].join('\n\n');

  /* =========================================================== page */
  function buildPage() {
    const app = $('#app');
    const embedded = (() => { try { return window.top !== window.self; } catch (e) { return true; } })();
    if (MODE === 'review') {
      document.body.classList.add('review');
      app.innerHTML = `
        <header class="bar">
          <div class="brand"><b>PE BOOTH</b><span>Connect your voice · review</span></div>
          <div class="tools">
            <button type="button" id="btn-restart">Restart</button>
            <button type="button" id="btn-staff">Staff panel</button>
            ${embedded ? '' : '<a href="#screen" target="_blank" rel="noopener">Open booth screen</a>'}
          </div>
        </header>
        <div class="frame" id="frame"></div>
        <p class="note">Tap the screen to start and go through it as a visitor: consent with a finger signature, your details on the on-screen keyboard, then country and choice. <b>Staff panel</b> (PIN <kbd>${esc(R.staffPin)}</kbd>) shows the records and exports them as Excel (CSV), a full backup and the signed consent forms. On this review page the records stay in your own browser.</p>`;
    } else {
      document.body.classList.add('solo');
      app.innerHTML = '<div class="frame" id="frame"></div>';
    }
  }
  function mountStage(frame) {
    const st = document.createElement('div'); st.className = 'stage'; frame.appendChild(st);
    const fit = () => { const r = frame.getBoundingClientRect(); const s = Math.min(r.width / W, r.height / H) || 0.0001; st.style.transform = `translate(${(r.width - W * s) / 2}px, ${(r.height - H * s) / 2}px) scale(${s})`; st.dataset.scale = s; };
    new ResizeObserver(fit).observe(frame); window.addEventListener('resize', fit); fit();
    return st;
  }

  /* =========================================================== booth */
  function Booth(stage) {
    const field = (id, label, req) => `<label class="fld" data-f="${id}"><span class="lbl">${esc(label)} <em>${esc(req ? C.details.required : C.details.optional)}</em></span>
      <input id="f-${id}" class="inp" type="text" ${C.rules.keyboard === 'builtin' ? 'inputmode="none"' : ''} autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="${id === 'phone' ? 24 : 80}"><span class="err" id="e-${id}"></span></label>`;
    stage.innerHTML = `
      <div class="bg bg-dots"></div><div class="bg bg-map"></div>
      <div class="mapwrap dots"><img class="base" src="assets/map-dots.png" alt=""><img class="shine" src="assets/map-dots.png" alt=""></div>
      <svg class="arcs" viewBox="0 0 1920 1080" aria-hidden="true"></svg>

      <section class="scene sc-start" aria-label="Start">
        <h1 class="cta">${esc(C.start.cta)}</h1>
        <button type="button" class="pill go" data-act="start">${esc(C.start.button)}</button>
        <p class="event">${esc(C.event)}</p>
      </section>

      <section class="scene sc-consent" aria-label="Consent">
        <div class="panel">
          <h2>${esc(C.consent.title)}</h2>
          <div class="ctext" id="ctext">${C.consent.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}<p><b>${esc(C.consent.declarationTitle)}</b></p>${C.consent.declaration.map(p => `<p>${esc(p)}</p>`).join('')}</div>
          <label class="check"><input type="checkbox" id="c-ok"><span class="box"></span><span>${esc(C.consent.check)}</span></label>
          <div class="sigwrap ${R.requireSignature ? '' : 'off'}"><canvas id="sig" width="1400" height="230"></canvas><span class="sighint">${esc(C.consent.sign)}</span><button type="button" class="mini" data-act="sig-clear">${esc(C.consent.clear)}</button></div>
          <div class="row"><button type="button" class="pill ghost" data-act="home">${esc(C.consent.back)}</button><button type="button" class="pill go" data-act="agree" id="b-agree" disabled>${esc(C.consent.agree)}</button></div>
        </div>
      </section>

      <section class="scene sc-details" aria-label="Your details">
        <div class="panel thin">
          <h2>${esc(C.details.title)}</h2>
          ${field('name', C.details.name, true)}${field('email', C.details.email, true)}${field('phone', C.details.phone, false)}
          <div class="row"><button type="button" class="pill ghost" data-act="to-consent">${esc(C.consent.back)}</button><button type="button" class="pill go" data-act="to-choose">${esc(C.details.next)}</button></div>
        </div>
      </section>

      <section class="scene sc-choose" aria-label="Choose">
        <div class="chooser">
          <p class="q">${esc(C.choose.country)}</p>
          <button type="button" class="select" data-act="pick-country"><span id="ctry">${esc(C.choose.countryPlaceholder)}</span><i></i></button>
          <span class="err" id="e-country"></span>
          <p class="q">${esc(C.choose.where)}</p>
          <div class="opts">${C.choose.options.map(o => `<button type="button" class="pill opt" data-opt="${esc(o)}">${esc(o)}</button>`).join('')}</div>
          <span class="err" id="e-choice"></span>
        </div>
        <div class="bottomrow">
          <div class="other" id="otherBox" hidden><input id="f-other" class="inp" type="text" ${C.rules.keyboard === 'builtin' ? 'inputmode="none"' : ''} autocomplete="off" spellcheck="false" maxlength="80" placeholder="${esc(C.choose.otherPlaceholder)}"><span class="err" id="e-other"></span></div>
          <div class="btns"><button type="button" class="pill ghost" data-act="to-details">${esc(C.consent.back)}</button><button type="button" class="pill go" data-act="submit">${esc(C.choose.submit)}</button></div>
        </div>
      </section>

      <section class="scene sc-thanks" aria-label="Thank you">
        <div class="pulse"><i></i><i></i><i></i></div>
        <h1 class="ty" id="ty"></h1>
        <p class="tyl">${esc(C.thanks.line)}</p>
      </section>

      <div class="picker" id="picker" hidden>
        <div class="pk-head"><input id="f-search" class="inp" type="text" ${C.rules.keyboard === 'builtin' ? 'inputmode="none"' : ''} autocomplete="off" spellcheck="false" placeholder="${esc(C.choose.search)}"><button type="button" class="pill ghost" data-act="pick-close">✕</button></div>
        <div class="pk-list" id="pkList"></div>
      </div>

      <div class="kb" id="kb" hidden></div>

      <div class="staff-hot" aria-hidden="true"></div>
      <div class="staff" id="staff" hidden></div>`;

    const S = { scene: 'start', draft: null, sigDirty: false, sigLen: 0, focused: null, kbLang: 'en', shift: false, idleT: null, thanksT: null, staffOpen: false };
    const sc = name => $('.sc-' + name, stage);

    function setScene(name) {
      S.scene = name; stage.dataset.scene = name;
      $$('.scene', stage).forEach(s => s.classList.toggle('on', s.classList.contains('sc-' + name)));
      hideKb(); closePicker();
      if (name === 'start') arcs(true); else arcs(false);
    }
    function newDraft() { S.draft = { name: '', email: '', phone: '', country: '', choice: '', other: '', consentAt: '' }; }
    function resetAll() {
      clearTimeout(S.thanksT); newDraft();
      $('#c-ok', stage).checked = false; clearSig(); updateAgree();
      ['name', 'email', 'phone', 'other', 'search'].forEach(k => { const i = $('#f-' + k, stage); if (i) i.value = ''; });
      $$('.err', stage).forEach(e => (e.textContent = ''));
      $$('.fld', stage).forEach(f => f.classList.remove('bad'));
      $('#ctry', stage).textContent = C.choose.countryPlaceholder; $('.select', stage).classList.remove('set');
      $$('.opt', stage).forEach(b => b.classList.remove('sel')); $('#otherBox', stage).hidden = true;
      $('#ctext', stage).scrollTop = 0;
      setScene('start');
    }

    /* ---------- signature */
    const cv = $('#sig', stage), cx = cv.getContext('2d');
    function clearSig() { cx.clearRect(0, 0, cv.width, cv.height); S.sigLen = 0; S.sigDirty = false; $('.sigwrap', stage).classList.remove('inked'); updateAgree(); }
    let drawing = null;
    const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); drawing = pt(e); cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.lineWidth = 5; cx.strokeStyle = '#0b2f28'; cx.beginPath(); cx.arc(drawing[0], drawing[1], 2.5, 0, Math.PI * 2); cx.fillStyle = '#0b2f28'; cx.fill(); });
    cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pt(e); cx.beginPath(); cx.moveTo(drawing[0], drawing[1]); cx.lineTo(p[0], p[1]); cx.stroke(); S.sigLen += Math.hypot(p[0] - drawing[0], p[1] - drawing[1]); drawing = p; if (S.sigLen > 60) { S.sigDirty = true; $('.sigwrap', stage).classList.add('inked'); updateAgree(); } });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => cv.addEventListener(ev, () => { drawing = null; }));
    function sigImage() {
      // white background, trimmed to the ink
      const out = document.createElement('canvas'); out.width = cv.width; out.height = cv.height; const o = out.getContext('2d');
      o.fillStyle = '#fff'; o.fillRect(0, 0, out.width, out.height); o.drawImage(cv, 0, 0);
      return out.toDataURL('image/png');
    }
    function updateAgree() { $('#b-agree', stage).disabled = !($('#c-ok', stage).checked && (!R.requireSignature || S.sigDirty)); }
    $('#c-ok', stage).addEventListener('change', updateAgree);

    /* ---------- keyboard */
    const LAYOUT = {
      en: ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'],
      ar: ['١٢٣٤٥٦٧٨٩٠', 'ضصثقفغعهخحج', 'شسيبلاتنمكط', 'ئءؤرىةوزظد'],
      num: ['123', '456', '789', '+0'],
    };
    function kindOf(inp) { return inp.id === 'f-phone' ? 'num' : inp.id === 'f-email' ? 'email' : 'text'; }
    function renderKb() {
      const kb = $('#kb', stage), inp = S.focused; if (!inp) return;
      const kind = kindOf(inp);
      const key = (k, cls = '', label = k) => `<button type="button" class="k ${cls}" data-k="${esc(k)}">${esc(label)}</button>`;
      let html = '';
      if (kind === 'num') {
        html = LAYOUT.num.map(r => `<div class="kr">${[...r].map(c => key(c)).join('')}${r === '+0' ? key('back', 'w2', '⌫') : ''}</div>`).join('') + `<div class="kr">${key('done', 'w3 go', 'Done')}</div>`;
        kb.className = 'kb num';
      } else {
        const L = S.kbLang === 'ar' && kind === 'text' ? LAYOUT.ar : LAYOUT.en;
        const up = S.shift && S.kbLang === 'en';
        html = L.map((r, i) => `<div class="kr">${i === 3 && S.kbLang === 'en' ? key('shift', 'w15' + (S.shift ? ' on' : ''), '⇧') : ''}${[...r].map(c => key(up ? c.toUpperCase() : c)).join('')}${i === 3 ? key('back', 'w15', '⌫') : ''}</div>`).join('');
        const bottom = kind === 'email' ? [key('@'), key('.'), key('_'), key('-'), key(' ', 'w4', 'space'), key('.com', 'w15'), key('done', 'w2 go', 'Next')] :
          [kind === 'text' && inp.id === 'f-name' ? key('lang', 'w15', S.kbLang === 'ar' ? 'EN' : 'ع') : '', key('-'), key("'"), key(' ', 'w6', 'space'), key('.'), key('done', 'w2 go', inp.id === 'f-search' ? 'Close' : 'Next')];
        html += `<div class="kr">${bottom.join('')}</div>`;
        kb.className = 'kb' + (S.kbLang === 'ar' && kind === 'text' ? ' ar' : '');
      }
      kb.innerHTML = html;
    }
    function showKb(inp) {
      if (R.keyboard !== 'builtin') return;
      S.focused = inp;
      if (inp.id === 'f-name' && !inp.value) S.shift = true;
      renderKb(); $('#kb', stage).hidden = false; stage.classList.add('kb-on');
      stage.dataset.focus = inp.id;
    }
    function hideKb() { $('#kb', stage).hidden = true; stage.classList.remove('kb-on'); S.focused = null; delete stage.dataset.focus; }
    function insert(inp, text) {
      const max = +inp.maxLength > 0 ? +inp.maxLength : 999;
      if (inp.value.length + text.length > max) return;
      const s = inp.selectionStart ?? inp.value.length, e = inp.selectionEnd ?? inp.value.length;
      inp.setRangeText(text, s, e, 'end'); inp.dispatchEvent(new Event('input', { bubbles: true }));
    }
    function backspace(inp) {
      const s = inp.selectionStart ?? inp.value.length, e = inp.selectionEnd ?? inp.value.length;
      if (s !== e) inp.setRangeText('', s, e, 'end'); else if (s > 0) inp.setRangeText('', s - 1, s, 'end');
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const ORDER = { 'f-name': 'f-email', 'f-email': 'f-phone' };
    $('#kb', stage).addEventListener('pointerdown', e => {
      const b = e.target.closest('.k'); e.preventDefault(); if (!b || !S.focused) return;
      const inp = S.focused, k = b.dataset.k;
      b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 110);
      if (k === 'back') backspace(inp);
      else if (k === 'shift') { S.shift = !S.shift; renderKb(); }
      else if (k === 'lang') { S.kbLang = S.kbLang === 'ar' ? 'en' : 'ar'; renderKb(); }
      else if (k === 'done') { const nx = ORDER[inp.id]; if (nx && S.scene === 'details') $('#' + nx, stage).focus(); else { inp.blur(); hideKb(); } }
      else {
        insert(inp, k);
        if (S.shift) { S.shift = false; renderKb(); }
        if (inp.id === 'f-name' && k === ' ' && S.kbLang === 'en') { S.shift = true; renderKb(); }
      }
      if (inp.id === 'f-search') renderList();
    });
    stage.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('inp')) showKb(e.target); });
    stage.addEventListener('input', e => {
      if (e.target.id === 'f-search') renderList();
      const f = e.target.closest('.fld'); if (f) { f.classList.remove('bad'); const er = $('.err', f); if (er) er.textContent = ''; }
      if (e.target.id === 'f-other') $('#e-other', stage).textContent = '';
    });

    /* ---------- country picker */
    function renderList() {
      const q = ($('#f-search', stage).value || '').trim().toLowerCase();
      const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const match = c => !q || norm(c).includes(norm(q));
      const top = C.topCountries.filter(match), rest = C.countries.filter(c => match(c) && (q || !C.topCountries.includes(c)));
      const row = c => `<button type="button" class="pk-row${c === S.draft.country ? ' sel' : ''}" data-c="${esc(c)}">${esc(c)}</button>`;
      $('#pkList', stage).innerHTML = q ? [...new Set([...top, ...rest])].map(row).join('') || '<p class="pk-none">—</p>' : top.map(row).join('') + '<hr>' + rest.map(row).join('');
    }
    function openPicker() { $('#picker', stage).hidden = false; $('#f-search', stage).value = ''; renderList(); $('#pkList', stage).scrollTop = 0; }
    function closePicker() { const p = $('#picker', stage); if (p) p.hidden = true; if (S.focused && S.focused.id === 'f-search') hideKb(); }
    $('#pkList', stage).addEventListener('click', e => {
      const b = e.target.closest('.pk-row'); if (!b) return;
      S.draft.country = b.dataset.c; $('#ctry', stage).textContent = b.dataset.c; $('.select', stage).classList.add('set'); $('#e-country', stage).textContent = '';
      closePicker(); hideKb();
    });

    /* ---------- steps */
    function toDetails() {
      S.draft.consentAt = S.draft.consentAt || new Date().toISOString();
      setScene('details');
    }
    function validDetails() {
      const name = $('#f-name', stage).value.trim(), email = $('#f-email', stage).value.trim(), phone = $('#f-phone', stage).value.trim();
      let ok = true;
      const bad = (k, msg) => { ok = false; $('#e-' + k, stage).textContent = msg; $(`.fld[data-f="${k}"]`, stage).classList.add('bad'); };
      if (name.length < 2) bad('name', C.details.errName);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad('email', C.details.errEmail);
      if (ok) Object.assign(S.draft, { name, email, phone });
      return ok;
    }
    async function submit() {
      let ok = true;
      if (!S.draft.country) { ok = false; $('#e-country', stage).textContent = C.choose.errCountry; }
      if (!S.draft.choice) { ok = false; $('#e-choice', stage).textContent = C.choose.errChoice; }
      const other = $('#f-other', stage).value.trim();
      if (S.draft.choice === 'Others' && other.length < 2) { ok = false; $('#e-other', stage).textContent = C.choose.errOther; }
      if (!ok) return;
      S.draft.other = S.draft.choice === 'Others' ? other : '';
      const rec = { id: uid(), createdAt: new Date().toISOString(), event: C.event, device: DEVICE, consent: true, consentAt: S.draft.consentAt,
        name: S.draft.name, email: S.draft.email, phone: S.draft.phone, country: S.draft.country, choice: S.draft.choice, other: S.draft.other,
        signature: R.requireSignature && S.sigDirty ? S.signature : '' };
      rec.signed = !!rec.signature;
      await Store.add(rec); sync(rec);
      $('#ty', stage).textContent = fill(C.thanks.title, { name: rec.name.split(/\s+/)[0] });
      setScene('thanks');
      S.thanksT = setTimeout(resetAll, R.thankYouSeconds * 1000);
    }

    stage.addEventListener('click', async e => {
      const a = e.target.closest('[data-act]'); const o = e.target.closest('.opt');
      if (o) {
        S.draft.choice = o.dataset.opt; $$('.opt', stage).forEach(b => b.classList.toggle('sel', b === o)); $('#e-choice', stage).textContent = '';
        const isOther = S.draft.choice === 'Others'; $('#otherBox', stage).hidden = !isOther;
        if (isOther) setTimeout(() => $('#f-other', stage).focus(), 50); else hideKb();
        return;
      }
      if (!a) {
        if (S.focused && !e.target.closest('.inp') && !e.target.closest('.kb') && !e.target.closest('.picker')) { S.focused.blur(); hideKb(); }
        return;
      }
      switch (a.dataset.act) {
        case 'start': newDraft(); setScene('consent'); break;
        case 'home': resetAll(); break;
        case 'sig-clear': clearSig(); break;
        case 'agree': if (!a.disabled) { S.signature = R.requireSignature ? sigImage() : ''; toDetails(); } break;
        case 'to-consent': setScene('consent'); break;
        case 'to-choose': if (validDetails()) setScene('choose'); break;
        case 'to-details': setScene('details'); break;
        case 'pick-country': openPicker(); break;
        case 'pick-close': closePicker(); hideKb(); break;
        case 'submit': submit(); break;
      }
    });
    // tap anywhere on the start screen starts
    sc('start').addEventListener('click', e => { if (!e.target.closest('[data-act]') && S.scene === 'start') { newDraft(); setScene('consent'); } });

    /* ---------- idle */
    let last = now();
    const poke = () => { last = now(); };
    ['pointerdown', 'keydown', 'input'].forEach(ev => stage.addEventListener(ev, poke, true));
    window.addEventListener('keydown', poke, true);
    setInterval(() => {
      if (S.scene !== 'start' && S.scene !== 'thanks' && now() - last > R.idleResetSeconds * 1000) { closeStaff(); resetAll(); }
      if (S.staffOpen && now() - last > 120000) closeStaff();
    }, 1000);

    /* ---------- arcs on the start screen (voices connecting from Cairo) */
    const svg = $('.arcs', stage);
    const CAIRO = [1112, 322];
    const TARGETS = [[980, 210], [1185, 372], [1255, 385], [1370, 430], [1170, 505], [1010, 455], [1120, 640], [600, 255], [690, 610], [1530, 290], [1690, 660]];
    function arcs(on) {
      svg.classList.toggle('on', on);
      if (svg.childElementCount) return;
      svg.innerHTML = TARGETS.map(([x, y], i) => {
        const mx = (CAIRO[0] + x) / 2, my = Math.min(CAIRO[1], y) - 60 - Math.abs(x - CAIRO[0]) * 0.18;
        return `<path d="M${CAIRO[0]} ${CAIRO[1]} Q${mx} ${my} ${x} ${y}" style="--d:${(i * 0.55).toFixed(2)}s"/><circle cx="${x}" cy="${y}" r="7" style="--d:${(i * 0.55 + 1.1).toFixed(2)}s"/>`;
      }).join('') + `<circle class="hub" cx="${CAIRO[0]}" cy="${CAIRO[1]}" r="10"/>`;
    }

    /* ---------- staff panel */
    const hot = $('.staff-hot', stage); let holdT = null;
    hot.addEventListener('pointerdown', e => { e.stopPropagation(); holdT = setTimeout(openStaff, 2000); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => hot.addEventListener(ev, () => clearTimeout(holdT)));
    let pinBuf = '';
    function openStaff() {
      S.staffOpen = true; pinBuf = ''; hideKb();
      const st = $('#staff', stage); st.hidden = false;
      st.innerHTML = `<div class="spanel"><h3>STAFF</h3><p class="pin-dots" id="pinDots">····</p>
        <div class="pinpad">${'123456789'.split('').map(d => `<button type="button" data-pin="${d}">${d}</button>`).join('')}<button type="button" data-pin="x">✕</button><button type="button" data-pin="0">0</button><button type="button" data-pin="ok">OK</button></div>
        <p class="pin-err" id="pinErr"></p></div>`;
    }
    function closeStaff() { S.staffOpen = false; const st = $('#staff', stage); if (st) { st.hidden = true; st.innerHTML = ''; } }
    async function staffPanel() {
      const rows = await Store.all();
      const today = new Date().toISOString().slice(0, 10);
      const lastExp = LS.get('pe-last-export', '');
      const recent = rows.slice(-6).reverse().map(r => `<li><b>${esc(r.name)}</b> · ${esc(r.country)} · ${esc(r.choice)}${r.other ? ' (' + esc(r.other) + ')' : ''} · <span>${esc(new Date(r.createdAt).toLocaleTimeString())}</span></li>`).join('');
      $('#staff', stage).innerHTML = `<div class="spanel wide"><h3>STAFF</h3>
        <div class="stats"><div><b>${rows.length}</b><span>records on this device</span></div><div><b>${rows.filter(r => r.createdAt.slice(0, 10) === today).length}</b><span>today</span></div><div><b>${esc(DEVICE)}</b><span>device</span></div></div>
        <p class="sub">${lastExp ? 'Last export: ' + esc(new Date(lastExp).toLocaleString()) : 'Not exported yet'}</p>
        <div class="srow"><button type="button" data-staff="csv">Export Excel (CSV)</button><button type="button" data-staff="json">Export full backup</button><button type="button" data-staff="consents">Export consent forms</button></div>
        <ul class="recent">${recent || '<li>No records yet</li>'}</ul>
        <div class="srow"><button type="button" data-staff="full">Full screen</button><button type="button" data-staff="home">Back to start</button><button type="button" class="danger" data-staff="wipe">Delete all data</button><button type="button" data-staff="close">Close</button></div></div>`;
    }
    $('#staff', stage).addEventListener('click', async e => {
      const p = e.target.closest('[data-pin]'); const s = e.target.closest('[data-staff]');
      if (p) {
        const v = p.dataset.pin;
        if (v === 'x') pinBuf = ''; else if (v === 'ok') { if (pinBuf === String(R.staffPin)) { staffPanel(); return; } $('#pinErr', stage).textContent = 'Wrong PIN'; pinBuf = ''; } else if (pinBuf.length < 8) pinBuf += v;
        const d = $('#pinDots', stage); if (d) d.textContent = pinBuf ? '•'.repeat(pinBuf.length) : '····';
        return;
      }
      if (!s) return;
      const k = s.dataset.staff;
      if (k === 'csv') { await exportCsv(); staffPanel(); }
      else if (k === 'json') { await exportJson(); staffPanel(); }
      else if (k === 'consents') exportConsents();
      else if (k === 'full') toggleFullscreen();
      else if (k === 'home') { closeStaff(); resetAll(); }
      else if (k === 'close') closeStaff();
      else if (k === 'wipe') {
        if (s.dataset.armed) { await Store.clear(); staffPanel(); }
        else { s.dataset.armed = '1'; s.textContent = 'Tap again to delete everything'; setTimeout(() => { if (s.isConnected) { delete s.dataset.armed; s.textContent = 'Delete all data'; } }, 4000); }
      }
    });

    resetAll();
    return { resetAll, openStaff, get state() { return S; }, store: Store };
  }

  function toggleFullscreen() { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* ok */ } }

  async function boot() {
    buildPage();
    await Store.open();
    const booth = Booth(mountStage($('#frame')));
    const on = (id, fn) => { const b = $(id); if (b) b.addEventListener('click', fn); };
    on('#btn-restart', () => booth.resetAll());
    on('#btn-staff', () => booth.openStaff());
    window.addEventListener('keydown', e => { if (e.key === 'F11' || (e.ctrlKey && e.key.toLowerCase() === 'f')) { e.preventDefault(); toggleFullscreen(); } });
    window.addEventListener('contextmenu', e => e.preventDefault());
    if (MODE === 'screen') {
      let t = null; const wake = () => { document.body.classList.remove('hide-cursor'); clearTimeout(t); t = setTimeout(() => document.body.classList.add('hide-cursor'), 3000); };
      window.addEventListener('mousemove', wake); wake();
      try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* ok */ }
      try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* ok */ }
    }
    window.__pe = { mode: MODE, booth, device: DEVICE, exportCsv, exportJson };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
