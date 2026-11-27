/* Music Lab sidebar: a menu of every app plus the shared Solo Library.
   It sits on top of each app in its own shadow DOM, so the app underneath is untouched.
   Solos live in this artifact's database (the same place Solo Ear Lessons keeps them),
   with a copy in this browser, so every app in Music Lab sees the same list. */
(function () {
  if (window.__musicLab) return; window.__musicLab = true;

  const APPS = [
    { group: 'Saved', items: [
      ['favorites.html', '★ Favorite licks'],
    ]},
    { group: 'Tools', items: [
      ['metronome.html', 'Metronome'],
    ]},
    { group: 'Baby', items: [
      ['baby-solfege.html', '👶 Baby Solfege'],
      ['baby.html', '👶 Baby: the three tunes'],
    ]},
    { group: 'Practice', items: [
      ['practice.html', '📅 Today’s Practice'],
      ['home-base.html', '🏠 Triad Home Base'],
      ['solo-ear.html', '🎹 Solo Ear Lessons'],
      ['blues.html?focus=14', '1 → 4'],
      ['blues.html', 'Blues Vocab'],
      ['triad-trainer.html', 'Major Triad Trainer'],
      ['ii-v-i.html', 'ii–V–I Ear Lessons'],
      ['home-away.html', 'Home & Away ii–V–I'],
      ['iiv-trips.html', 'ii–V Triad Trips'],
    ]},
    { group: 'Triads', items: [
      ['triad-glow.html', '✨ Home Glow: bebop licks'],
      ['tune-journey.html', '🪐 Tune Journey (prototype)'],
      ['triads-by-chord.html', 'Triads by Chord'],
      ['stitt-licks.html', 'Stitt Lick Triads'],
      ['color-map.html', '🎨 Triad Color Map'],
      ['triad-palette.html', 'Triad Palette over C'],
      ['triad-pairs.html', '2–5 Triad Pairs'],
      ['melody-blocks.html', 'Melody Triad Blocks'],
    ]},
    { group: 'Pentatonics', items: [
      ['https://claude.ai/artifact/TRzLwJmGsU9EX5T69hK5FE', 'Pentatonic Piano ↗'],
      ['https://claude.ai/artifact/BNURxHXyBaYjwmwYbBvSMo', 'Pentatonic Homework ↗'],
    ]},
  ];
  const here = (location.pathname.split('/').pop() || 'index.html') + (/[?&]focus=14\b/.test(location.search) ? '?focus=14' : '');
  try { localStorage.setItem('lab:last', here); } catch (e) {}
  // this tab's own app: kept for this tab and in the address, so when an update reloads every open tab, each one comes back to its app
  try { sessionStorage.setItem('lab:here', here); } catch (e) {}
  try { const tag = here === 'blues.html?focus=14' ? 'blues-14' : here.replace(/\.html$/, '');
    if (/^[a-z0-9-]+$/.test(tag) && location.hash !== '#' + tag) history.replaceState(history.state, '', location.pathname + location.search + '#' + tag); } catch (e) {}

  /* ---------- storage: same shape as Solo Ear Lessons ---------- */
  const LS_KEY = 'solo-ear:lib';
  // This browser's copy keeps each solo gzipped (as `gz`), like your account does: raw MusicXML filled the
  // browser's ~5 MB of storage. Unpacked scores are kept in memory while the page is open.
  const lsGet = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; } };
  const tidyXml = x => x.replace(/<!DOCTYPE[^>]*>/, '').replace(/>\s+</g, '><').trim();
  const xmlMem = new Map();
  async function lsSet(v) {
    try {
      for (const e of v) { if (e.xml) xmlMem.set(e.id, e.xml); if (!e.gz && e.xml) e.gz = await gz(tidyXml(e.xml)); }
      localStorage.setItem(LS_KEY, JSON.stringify(v.map(({ xml, ...rest }) => rest))); return true;
    } catch (e) { return false; }
  }
  async function withXml(list) {
    for (const e of list) {
      if (e.xml) { xmlMem.set(e.id, e.xml); continue; }
      if (xmlMem.has(e.id)) { e.xml = xmlMem.get(e.id); continue; }
      if (e.gz) { try { e.xml = await gunz(e.gz); xmlMem.set(e.id, e.xml); } catch (err) {} }
    }
    return list.filter(e => e.xml);
  }
  let cloud = null, cloudTried = null, favCol = null, prefCol = null;
  async function gz(text) {
    const buf = await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
    const u8 = new Uint8Array(buf); let bin = '';
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  async function gunz(b64) {
    const bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  }
  function connect() {
    if (cloudTried) return cloudTried;
    cloudTried = (async () => {
      if (!window.claude || !claude.use || typeof CompressionStream === 'undefined') return null;
      const timeout = new Promise(r => setTimeout(() => r(null), 10000));
      const go = (async () => {
        const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
        const uid = user ? await user.id() : null;
        if (!db || !uid) return null;
        const lib = db.doc('data/users/' + uid + '/lib');
        favCol = lib.collection('favs');
        prefCol = lib.collection('prefs');
        return lib.collection('solos');
      })().catch(() => null);
      cloud = await Promise.race([go, timeout]);
      if (!cloud) { favCol = null; prefCol = null; }
      return cloud;
    })();
    return cloudTried;
  }
  // Everything in the library: account copy merged with this browser's copy
  const cloudProcessed = new Set();
  let migrated = false;
  async function allSolos() {
    const local = lsGet();
    // an older copy with raw MusicXML in it: pack it once, which frees most of the browser's storage
    if (!migrated) { migrated = true; if (local.some(x => x.xml && !x.gz)) await lsSet(local); }
    const col = await connect();
    if (!col) return { list: await withXml(local), synced: false };
    try {
      const snap = await col.get(), have = new Set(local.map(x => x.id));
      let changed = false;
      for (const d of snap.docs) {
        const v = d.data();
        // removed by Claude from chat: drop this browser's copy and its processed examples too
        if (v && v.removed) {
          const i = local.findIndex(x => x.id === d.id); if (i >= 0) { local.splice(i, 1); changed = true; }
          const pr = procGet(); if (pr[d.id]) { delete pr[d.id]; procSet(pr); }
          continue;
        }
        if (v && v.processed) cloudProcessed.add(d.id);
        const nm = String(v.name || 'Untitled solo'), pl = String(v.player || ''), pt = v.pitch || null;
        if (have.has(d.id)) {
          // renamed or filed under a player from chat: take the new name, and redo its examples so they carry it
          const e = local.find(x => x.id === d.id);
          // renamed, refiled, or the score itself changed (chords added from chat, say): take it and redo its examples
          if (e && (e.name !== nm || (e.player || '') !== pl || (e.pitch || null) !== pt || (v.gz && e.gz && v.gz !== e.gz))) {
            if (v.gz && v.gz !== e.gz) { e.gz = v.gz; delete e.xml; xmlMem.delete(d.id); }
            e.name = nm; e.player = pl; e.pitch = pt; changed = true;
            const pr = procGet(); if (pr[d.id]) { delete pr[d.id]; procSet(pr); }
          }
          continue;
        }
        if (v && v.gz) { local.push({ id: d.id, name: nm, player: pl, pitch: pt, gz: v.gz, added: v.added }); changed = true; }
      }
      local.sort((a, b) => (a.added || 0) - (b.added || 0));
      if (changed) await lsSet(local);
      return { list: await withXml(local), synced: true };
    } catch (e) { return { list: await withXml(local), synced: false }; }
  }
  async function saveSolo(e) {
    const list = lsGet(); list.push(e); const okLocal = await lsSet(list);
    const col = await connect(); let okCloud = false;
    if (col) {
      try {
        const x = e.xml.replace(/<!DOCTYPE[^>]*>/, '').replace(/>\s+</g, '><').trim(), z = await gz(x);
        if (z.length <= 250000) { await col.doc(e.id).set({ name: e.name, gz: z, added: e.added }); okCloud = true; }
      } catch (err) {}
    }
    return okLocal || okCloud;
  }
  /* ---------- processing: find the techniques Solo Ear's tabs drill ---------- */
  const PROC_KEY = 'lab:proc';
  const procGet = () => { try { return JSON.parse(localStorage.getItem(PROC_KEY) || '{}'); } catch (e) { return {}; } };
  const procSet = v => { try { localStorage.setItem(PROC_KEY, JSON.stringify(v)); return true; } catch (e) { return false; } };
  let procLoad = null;
  function processor() {
    if (window.SoloProcessor) return Promise.resolve(window.SoloProcessor);
    if (!procLoad) procLoad = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'processor.js'; sc.onload = () => res(window.SoloProcessor); sc.onerror = () => rej(new Error("couldn't load the processor")); document.head.appendChild(sc); });
    return procLoad;
  }
  const PROC_V = 2;   // bump when the processor learns new techniques, so processed uploads are redone quietly
  async function processSolos(solos, opts) {
    const P = await processor(), all = procGet(); let done = 0, techniques = 0;
    for (const so of solos) {
      const r = P.processSolo(so.xml, { title: so.name, id: so.id, pitch: so.pitch || undefined, player: so.player || 'your upload', tune: so.player ? so.name.replace(' · ' + so.player, '') : so.name });
      const picks = {}; let count = 0;
      for (const k in r.found) { picks[k] = P.pickExamples(r.found[k], 3); count += r.found[k].length; }
      all[so.id] = { v: PROC_V, name: so.name, at: Date.now(), totals: r.totals, picks, count, kinds: Object.keys(r.found).length, chords: r.chords };
      done++; techniques += Object.keys(r.found).length;
      // mark it processed in your account, so your other devices keep it out of the list too
      if (!(opts && opts.local)) { const col = await connect(); if (col) { try { await col.doc(so.id).update({ processed: Date.now() }); cloudProcessed.add(so.id); } catch (e) {} } }
    }
    if (!procSet(all)) throw new Error("couldn't save the results in this browser");
    return { done, techniques };
  }
  /* Built-in solos whose file Claude updated (e.g. chords added) get processed quietly once in each browser,
     so their examples reach Solo Ear's tabs like an upload's. Bump an id's number to redo it. */
  const BUILTIN_REDO = { 'umvwut8hdtq1a': 2 };   // Autumn Leaves · Chet Baker: chords added (1), F♭ respelled as E (2)
  async function processBuiltinUpdates() {
    try {
      const pr = procGet(), bi = await builtins();
      const due = bi.filter(b => BUILTIN_REDO[b.id] && (!pr[b.id] || (pr[b.id].redo || 0) < BUILTIN_REDO[b.id]));
      if (!due.length) return;
      const solos = [];
      for (const b of due) { try { solos.push({ id: b.id, name: b.name, player: b.player || '', pitch: b.pitch, xml: await gunz(b.gz) }); } catch (e) {} }
      if (!solos.length) return;
      await processSolos(solos, { local: true });
      const all = procGet(); solos.forEach(s => { if (all[s.id]) all[s.id].redo = BUILTIN_REDO[s.id]; }); procSet(all);
      // Solo Ear reads processed examples when it loads, so reload it once to show them now
      const saved = procGet(), ok = solos.every(x => saved[x.id] && saved[x.id].redo === BUILTIN_REDO[x.id]);
      let once = false; try { once = sessionStorage.getItem('lab:redo-reload') === '2'; sessionStorage.setItem('lab:redo-reload', '2'); } catch (e) { once = true; }
      if (here === 'solo-ear.html' && ok && !once) setTimeout(() => location.reload(), 300);
    } catch (e) {}
  }
  /* the Blues app reads the whole library itself; here we only count what an upload gives it */
  let bluesLoad = null;
  function bluesVocab() {
    if (window.BluesVocab) return Promise.resolve(window.BluesVocab);
    if (!bluesLoad) bluesLoad = new Promise(res => { const sc = document.createElement('script'); sc.src = 'blues.js'; sc.onload = () => res(window.BluesVocab || null); sc.onerror = () => res(null); document.head.appendChild(sc); });
    return bluesLoad;
  }
  async function bluesNote(solos) {
    try {
      await processor(); const B = await bluesVocab(); if (!B) return '';
      const r = B.analyze(solos), n = r.choruses.length;
      return n ? ` ${n} blues chorus${n === 1 ? '' : 'es'} went to Blues Vocab.` : '';
    } catch (e) { return ''; }
  }
  async function runProcess(solos) {
    if (!solos.length) return;
    msg(solos.length === 1 ? `Processing ${solos[0].name}…` : `Processing ${solos.length} solos…`);
    try {
      await processSolos(solos);
      const bn = await bluesNote(solos);
      if (here === 'solo-ear.html') { msg('Done.' + bn + ' Reloading Solo Ear to add them to its tabs…'); setTimeout(() => location.reload(), 1400); }
      else msg((solos.length === 1 ? 'Processed. Its examples are now in Solo Ear\'s tabs, Triad Trainer and Home Base.' : `Processed ${solos.length} solos. Their examples are now in Solo Ear's tabs, Triad Trainer and Home Base.`) + bn);
      if (here === 'blues.html') changed();
    } catch (e) { msg('Processing failed: ' + e.message, true); }
    refresh();
  }

  async function removeSolo(id) {
    const pr = procGet(); if (pr[id]) { delete pr[id]; procSet(pr); }
    await lsSet(lsGet().filter(x => x.id !== id));
    const col = await connect(); if (col) { try { await col.doc(id).delete(); } catch (e) {} }
  }

  /* ---------- reading files ---------- */
  async function unzipMxl(buf) {
    const dv = new DataView(buf), u8 = new Uint8Array(buf);
    let e = buf.byteLength - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error("that .mxl file isn't a readable zip");
    const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
    const files = {}, dec = new TextDecoder();
    for (let i = 0; i < n; i++) {
      const comp = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true),
        xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      files[dec.decode(u8.subarray(p + 46, p + 46 + nl))] = { comp, csize, off };
      p += 46 + nl + xl + cl;
    }
    const read = async f => {
      const a = f.off + 30 + dv.getUint16(f.off + 26, true) + dv.getUint16(f.off + 28, true), data = u8.subarray(a, a + f.csize);
      if (f.comp === 0) return dec.decode(data);
      return await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    };
    let target = null;
    if (files['META-INF/container.xml']) { const m = (await read(files['META-INF/container.xml'])).match(/full-path="([^"]+)"/); if (m && files[m[1]]) target = m[1]; }
    if (!target) target = Object.keys(files).find(k => /\.(xml|musicxml)$/i.test(k) && !k.startsWith('META-INF'));
    if (!target) throw new Error('no score inside that .mxl file');
    return read(files[target]);
  }
  function cleanName(file) {
    return file.replace(/\.(xml|musicxml|mxl)$/i, '').replace(/^[0-9a-f]{6,}-/i, '').replace(/^\d{5,}-/, '')
      .replace(/-s-/g, "'s ").replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  async function fileToSolo(f) {
    const text = /\.mxl$/i.test(f.name) ? await unzipMxl(await f.arrayBuffer()) : await f.text();
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error("isn't readable XML");
    if (doc.documentElement.nodeName !== 'score-partwise') throw new Error("doesn't look like a MusicXML score");
    if (!doc.getElementsByTagName('pitch').length) throw new Error('has no notes');
    const title = (doc.querySelector('work > work-title')?.textContent || doc.querySelector('movement-title')?.textContent || '').trim();
    const name = (title && !/^untitled/i.test(title) ? title : cleanName(f.name)) || 'Untitled solo';
    return { id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, xml: text, added: Date.now() };
  }

  /* ---------- built-in solos (the ones that ship with Solo Ear Lessons) ---------- */
  let builtinLoad = null;
  function builtins() {
    if (!builtinLoad) builtinLoad = fetch('solos-builtin.json').then(r => r.ok ? r.json() : []).catch(() => []);
    return builtinLoad;
  }

  /* ---------- testing group: Weimar Jazz Database conversions ----------
     Kept in their own files (solos-wjd.json, plus solos-wjd-ex.json for Solo Ear's tab examples) so the whole group
     can be removed in one step. Every app reads the library live and nothing about them is saved in the browser,
     so deleting the files removes them everywhere. */
  let testLoad = null;
  function testGroup() {
    if (!testLoad) testLoad = fetch('solos-wjd.json').then(r => r.ok ? r.json() : []).catch(() => []);
    return testLoad;
  }

  /* ---------- Charlie Parker Omnibook group ----------
     The 50 Omnibook solos (MusicXML by Déguernel, Vincent & Assayag, CC BY-NC-SA: personal, non-commercial use) plus
     the Kendrick transcription of Now's the Time, in their own file (solos-omnibook.json) so the group can be removed
     at once. Unlike the Weimar group these are written straight, so apps swing them as usual (test: false). */
  let omniLoad = null;
  function omniGroup() {
    if (!omniLoad) omniLoad = fetch('solos-omnibook.json').then(r => r.ok ? r.json() : []).catch(() => []);
    return omniLoad;
  }

  /* ---------- Thelonious Monk Jazz Piano Collection group ----------
     The 15 tunes of the Shinko Music Monk Jazz Piano Collection, read by optical recognition, as the right hand only
     (top note of each chord) so the apps can find licks in them. Own file (solos-monk.json) so the group can be removed
     at once. Written straight, like the Omnibook group. */
  /* ---------- Louis Armstrong Solo Transcriptions group (J. Gilbert) ----------
     Trumpet in B♭, written pitch (pitch 'bb' so the apps sound it at concert pitch). Own file (solos-armstrong.json) so the
     group can be removed at once. */
  let armLoad = null;
  function armstrongGroup() {
    if (!armLoad) armLoad = fetch('solos-armstrong.json').then(r => r.ok ? r.json() : []).catch(() => []);
    return armLoad;
  }
  let monkLoad = null;
  function monkGroup() {
    if (!monkLoad) monkLoad = fetch('solos-monk.json').then(r => r.ok ? r.json() : []).catch(() => []);
    return monkLoad;
  }

  /* ---------- favorite licks, shared by every app ----------
     A favorite is {id, app, added, title, src, ...}: app is 'home' (Triad Home Base) or 'blues' (Blues Vocab),
     and the rest is whatever that app needs to play it again. Kept in this browser and in your account. */
  const FAV_KEY = 'lab:favs';
  const favListeners = [];
  let favs = (() => { try { const v = JSON.parse(localStorage.getItem(FAV_KEY) || 'null'); if (Array.isArray(v)) return v; } catch (e) {} return null; })();
  if (!favs) {   // first run: bring over Triad Home Base's own list from before favorites were shared
    favs = []; try { const old = JSON.parse(localStorage.getItem('thb.favs') || '[]'); if (Array.isArray(old)) old.forEach(f => favs.push(Object.assign({ app: 'home' }, f))); } catch (e) {}
  }
  const favSave = () => { try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) {} };
  const favEmit = () => { favSave(); favListeners.forEach(fn => { try { fn(favs.slice()); } catch (e) {} }); };
  const favFromDoc = v => { try { if (v.fav) return JSON.parse(v.fav); if (v.lick) return Object.assign({ app: 'home' }, JSON.parse(v.lick)); } catch (e) {} return null; };
  let favSynced = null;
  function favSync() {
    if (favSynced) return favSynced;
    favSynced = (async () => {
      await connect(); if (!favCol) return;
      try {
        const snap = await favCol.get(), cloudIds = new Set(), have = new Set(favs.map(f => f.id));
        for (const d of snap.docs) {
          const v = d.data() || {}; cloudIds.add(d.id);
          if (v.removed) { favs = favs.filter(f => f.id !== d.id); continue; }
          const f = favFromDoc(v); if (f && !have.has(d.id)) favs.push(Object.assign(f, { id: d.id, added: f.added || v.added || 0 }));
        }
        for (const f of favs) if (!cloudIds.has(f.id)) favCol.doc(f.id).set({ fav: JSON.stringify(f), app: f.app, added: f.added || Date.now() }).catch(() => {});
        favs.sort((a, b) => (a.added || 0) - (b.added || 0));
        favEmit();
      } catch (e) {}
    })();
    return favSynced;
  }
  const FAVS = {
    list: app => favs.filter(f => !app || f.app === app),
    has: id => favs.some(f => f.id === id),
    add(f) {
      if (!f || !f.id || FAVS.has(f.id)) return;
      f = Object.assign({ added: Date.now() }, f); favs.push(f); favEmit();
      if (favCol) favCol.doc(f.id).set({ fav: JSON.stringify(f), app: f.app, added: f.added }).catch(() => {});
    },
    remove(id) {
      if (!FAVS.has(id)) return;
      favs = favs.filter(f => f.id !== id); favEmit();
      if (favCol) favCol.doc(id).set({ removed: true }).catch(() => {});
    },
    toggle(f) { if (FAVS.has(f.id)) { FAVS.remove(f.id); return false; } FAVS.add(f); return true; },
    onChange(fn) { favListeners.push(fn); },
    ready: () => favSync(),
  };
  // another tab of Music Lab changed them
  window.addEventListener('storage', e => { if (e.key !== FAV_KEY) return; try { favs = JSON.parse(e.newValue || '[]'); } catch (err) {} favListeners.forEach(fn => { try { fn(favs.slice()); } catch (er) {} }); });
  // a short id from any text
  const hashId = (pre, k) => { let h = 2166136261; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); } return pre + (h >>> 0).toString(36); };

  /* ---------- focus tunes ----------
     Pick the tunes you are learning and every app leans toward them: licks, rhythms and examples that come from
     solos on those tunes are served first, about 70% of the time, and everything else fills the other 30%.
     A solo counts as "on a tune" when its title (or the source line an app shows for it) names the tune.
     Everything stays over C like the rest of the Lab; real keys come later. Kept in this browser and in your account. */
  const TUNES = [
    { id: 'pent', name: 'Pent-Up House', re: /pent[\s-]*up[\s-]*house/i },
    { id: 'another', name: "There'll Never Be Another You", re: /never\s+be\s+another\s+you/i },
    { id: 'billie', name: "Billie's Bounce", re: /billie.?s\s*bounce/i },
  ];
  const FOCUS_KEY = 'lab:focus', FOCUS_SHARE = 0.7;
  const focusDefault = () => ({ on: true, sel: TUNES.map(t => t.id), custom: [], at: 0 });
  const focusRead = raw => { try { const v = JSON.parse(raw || 'null'); if (v && Array.isArray(v.sel)) return { on: v.on !== false, sel: v.sel.filter(x => TUNES.some(t => t.id === x)), custom: (Array.isArray(v.custom) ? v.custom : []).filter(c => c && c.name).map(c => ({ name: String(c.name).slice(0, 60), on: c.on !== false })), at: +v.at || 0 }; } catch (e) {} return null; };
  let focusState = focusRead(localStorage.getItem(FOCUS_KEY)) || focusDefault();
  let focusRes = [];
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function focusBuild() {
    focusRes = [];
    if (!focusState.on) return;
    TUNES.forEach(t => { if (focusState.sel.includes(t.id)) focusRes.push(t.re); });
    focusState.custom.forEach(c => { if (c.on) { const w = c.name.trim().split(/[\s'’-]+/).filter(Boolean).map(reEsc); if (w.length) focusRes.push(new RegExp(w.join('.{0,3}'), 'i')); } });
  }
  focusBuild();
  const focusListeners = [];
  const focusEmit = () => { focusListeners.forEach(fn => { try { fn(); } catch (e) {} }); window.dispatchEvent(new CustomEvent('musiclab:focus')); };
  function focusSave() {
    focusState.at = Date.now();
    try { localStorage.setItem(FOCUS_KEY, JSON.stringify(focusState)); } catch (e) {}
    if (prefCol) prefCol.doc('focus').set({ v: JSON.stringify(focusState), at: focusState.at }).catch(() => {});
    focusBuild(); focusEmit();
  }
  let focusSynced = null;
  function focusSync() {
    if (focusSynced) return focusSynced;
    focusSynced = (async () => {
      await connect(); if (!prefCol) return;
      try {
        const snap = await prefCol.get(); let theirs = null;
        for (const d of snap.docs) if (d.id === 'focus') { const v = d.data() || {}; theirs = focusRead(v.v); if (theirs) theirs.at = +v.at || theirs.at; }
        if (theirs && theirs.at > focusState.at) { focusState = theirs; try { localStorage.setItem(FOCUS_KEY, JSON.stringify(focusState)); } catch (e) {} focusBuild(); focusEmit(); }
        else if (!theirs && focusState.at) prefCol.doc('focus').set({ v: JSON.stringify(focusState), at: focusState.at }).catch(() => {});
      } catch (e) {}
    })();
    return focusSynced;
  }
  window.addEventListener('storage', e => { if (e.key !== FOCUS_KEY) return; const v = focusRead(e.newValue); if (v) { focusState = v; focusBuild(); focusEmit(); } });
  const isFocus = text => focusRes.length > 0 && focusRes.some(re => re.test(String(text == null ? '' : text)));
  const shuffled = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const split = (list, key) => { const f = [], r = []; for (const x of list) (isFocus(key ? key(x) : x) ? f : r).push(x); return [f, r]; };
  const FOCUS = {
    active: () => focusRes.length > 0,
    share: FOCUS_SHARE,
    is: isFocus,
    // For one random pick: returns the part of the pool to draw from: the focus part 70% of the time, the rest 30%.
    // If either part is empty the whole pool is used, so a drill never starves.
    prefer(pool, key) {
      if (!pool || pool.length < 2 || !focusRes.length) return pool;
      const [f, r] = split(pool, key); if (!f.length || !r.length) return pool;
      return Math.random() < FOCUS_SHARE ? f : r;
    },
    // A shuffled order for a list worked through one by one: each slot comes from the focus part with 70% chance.
    mix(list, key) {
      if (!focusRes.length) return shuffled(list);
      const [f0, r0] = split(list, key), f = shuffled(f0), r = shuffled(r0), out = [];
      while (f.length || r.length) out.push(f.length && (!r.length || Math.random() < FOCUS_SHARE) ? f.shift() : r.shift());
      return out;
    },
    // A fixed order for lists you read top to bottom: focus items first, everything else keeps its order.
    front(list, key) { if (!focusRes.length || !list || list.length < 2) return list; const [f, r] = split(list, key); return f.concat(r); },
    tunes: () => TUNES.map(t => ({ id: t.id, name: t.name })),
    onChange: fn => focusListeners.push(fn),
  };

  /* ---------- public API for apps ----------
     MusicLab.solos() → every solo: built-in ones first, then your uploads.
     Each is {id, name, player, xml, builtin, added}. */
  const listeners = [];
  window.MusicLab = {
    solos: async (opts) => {
      const [bi, { list }] = await Promise.all([builtins(), allSolos()]);
      const ids = new Set(bi.map(b => b.id));
      const out = [];
      for (const b of bi) { try { out.push({ id: b.id, name: b.name, player: b.player || '', xml: await gunz(b.gz), builtin: true, pitch: b.pitch, tonic: b.tonic }); } catch (e) {} }
      list.filter(x => !ids.has(x.id)).forEach(({ id, name, player, pitch, xml, added }) => out.push({ id, name, player: player || '', pitch: pitch || undefined, xml, builtin: false, added }));
      if (!(opts && opts.testing === false)) for (const t of await testGroup()) { try { out.push({ id: t.id, name: t.name, player: t.player, pitch: t.pitch, xml: await gunz(t.gz), builtin: false, test: true, group: t.group, year: t.year }); } catch (e) {} }
      if (!(opts && opts.omnibook === false)) for (const t of await omniGroup()) { try { out.push({ id: t.id, name: t.name, player: t.player, pitch: t.pitch, xml: await gunz(t.gz), builtin: false, test: false, omni: true, group: t.group, form: t.form, quick: !!t.quick }); } catch (e) {} }
      if (!(opts && opts.monk === false)) for (const t of await monkGroup()) { try { out.push({ id: t.id, name: t.name, player: t.player, pitch: t.pitch, xml: await gunz(t.gz), builtin: false, test: false, monk: true, group: t.group, form: t.form, quick: !!t.quick }); } catch (e) {} }
      if (!(opts && opts.armstrong === false)) for (const t of await armstrongGroup()) { try { out.push({ id: t.id, name: t.name, player: t.player, pitch: t.pitch, xml: await gunz(t.gz), builtin: false, test: false, armstrong: true, group: t.group, form: t.form, quick: !!t.quick }); } catch (e) {} }
      return out;
    },
    onChange: fn => listeners.push(fn),
    favs: FAVS,
    focus: FOCUS,
    hashId,
  };
  favSync(); focusSync();
  const changed = () => { listeners.forEach(fn => { try { fn(); } catch (e) {} }); window.dispatchEvent(new CustomEvent('musiclab:solos')); };

  /* ---------- UI ---------- */
  const host = document.createElement('div');
  host.id = 'music-lab';
  const root = host.attachShadow({ mode: 'open' });
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* ---------- pinned apps: a Pinned group at the top of the menu ----------
     The pin icon shows only on the row of the app you're in right now; tapping it pins or unpins that app. */
  const PIN_KEY = 'lab:pins';
  const pinsGet = () => { try { const v = JSON.parse(localStorage.getItem(PIN_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  const pinsSet = v => { try { localStorage.setItem(PIN_KEY, JSON.stringify(v)); } catch (e) {} };
  const PIN_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"></path></svg>';
  const isActive = f => f === here || (here === 'index.html' && f === 'home-base.html');
  const appName = f => { for (const g of APPS) for (const [h, n] of g.items) if (h === f) return n; return null; };
  const appLink = (f, n) => { const on = isActive(f), pinned = pinsGet().includes(f);
    return `<a href="${f}"${/^https:/.test(f) ? ' target="_blank" rel="noopener"' : ''}${on ? ' class="on" aria-current="page"' : ''}><span class="lbl">${esc(n)}</span>${on ? `<button class="pin${pinned ? ' pon' : ''}" data-f="${esc(f)}" title="${pinned ? 'Unpin from the top of the menu' : 'Pin to the top of the menu'}" aria-label="${pinned ? 'Unpin this app' : 'Pin this app'}" aria-pressed="${pinned}">${PIN_SVG}</button>` : ''}</a>`; };
  const navHtml = () => { const pins = pinsGet().filter(f => appName(f));
    return (pins.length ? '<div class="grp">Pinned</div>' + pins.map(f => appLink(f, appName(f))).join('') : '') +
      APPS.map(g => `<div class="grp">${g.group}</div>` + g.items.map(([f, n]) => appLink(f, n)).join('')).join(''); };
  const appLinks = navHtml();
  root.innerHTML = `
<style>
  :host{all:initial}
  *{box-sizing:border-box;font-family:Inter,system-ui,-apple-system,sans-serif}
  .tog{position:fixed;top:12px;left:12px;right:auto;z-index:2147483000;width:42px;height:42px;border-radius:11px;border:1px solid #3a322c;background:rgba(24,21,18,.88);color:#c9bcaf;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:0 2px 10px rgba(0,0,0,.35)}
  .tog:hover{color:#e9b96e;border-color:#5a4a33}
  @media (min-width:900px){.tog{left:8px;right:auto;top:8px;width:36px;height:36px;border-radius:10px}}
  .scrim{position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .2s}
  aside{position:fixed;top:0;left:0;bottom:0;z-index:2147483002;width:min(300px,86vw);background:#0f0d0b;color:#f3ece4;border-right:1px solid #2e2824;transform:translateX(-102%);transition:transform .22s ease;display:flex;flex-direction:column;overflow:hidden}
  :host(.open) aside{transform:none}
  :host(.open) .tog{visibility:hidden}
  .head .title{order:1}
  .head .x{order:2;margin-left:auto;flex:none}
  :host(.open) .scrim{opacity:1;pointer-events:auto}
  .head{display:flex;justify-content:space-between;align-items:center;padding:14px 14px 8px}
  .drn{display:flex;align-items:center;gap:10px;padding:2px 14px 10px;border-bottom:1px solid #2e2824}
  .dbtn{flex:none;height:40px;padding:0 14px;border-radius:10px;border:1px solid #3a322c;background:#181512;color:#d8cdc1;font-size:13.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px}
  .dbtn:hover{border-color:#5a4a33}
  .dbtn[aria-pressed=true]{background:#2a2219;border-color:#e9b96e;color:#e9b96e}
  .dic{font-size:11px;width:12px;text-align:center}
  .drn input[type=range]{flex:1;min-width:0;accent-color:#e9b96e}
  .tog.dron::after{content:"";position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:#e9b96e;box-shadow:0 0 6px #e9b96e}
  .title{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:20px;color:#f3ece4}
  .x{width:44px;height:44px;border-radius:10px;border:1px solid #2e2824;background:#181512;color:#a3978b;font-size:20px;cursor:pointer}
  .scroll{overflow-y:auto;padding:0 14px 18px;flex:1}
  .grp{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#a3978b;margin:14px 0 4px}
  a{display:block;padding:9px 10px;border-radius:8px;color:#d8cdc1;text-decoration:none;font-size:14px}
  a:hover{background:#1d1916;color:#f3ece4}
  a.on{background:#2a2219;color:#e9b96e;font-weight:600}
  nav a{display:flex;align-items:center;gap:8px}
  nav a .lbl{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pin{border:0;background:none;color:#8a7a62;cursor:pointer;padding:4px;margin:-4px 0;border-radius:6px;display:flex;align-items:center;flex:none}
  .pin:hover{color:#e9b96e;background:#3a2f21}
  .pin.pon{color:#e9b96e}
  .rule{height:1px;background:#2e2824;margin:16px 0 4px}
  .add{width:100%;margin-top:6px;border:1.5px dashed #5a4a33;background:#1d1916;border-radius:12px;padding:12px;display:flex;align-items:center;gap:10px;color:#f3ece4;font-size:13.5px;font-weight:600;cursor:pointer;text-align:left}
  .add.over{border-color:#e9b96e;background:#2a2219}
  .msg{font-size:12.5px;line-height:1.45;color:#a3978b;margin:8px 2px 0;min-height:1em}
  .msg.err{color:#e0715a}
  ul{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:2px}
  li{display:flex;align-items:center;gap:6px;padding:6px 4px 6px 10px;border-radius:8px;font-size:13px;color:#d8cdc1}
  li:hover{background:#1d1916}
  li .nm{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
  li span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  li em{font-style:normal;font-size:11px;color:#6d635a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  li em.ok{color:#8fc4a4} li em.todo{color:#e9b96e}
  li button.proc{color:#e9b96e} li button.proc:hover{color:#f3d39e;background:#2a2219}
  .all{width:100%;margin-top:8px;border:1px solid #5a4a33;background:#2a2219;color:#e9b96e;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer}
  .all:hover{border-color:#e9b96e}
  li button{border:0;background:none;color:#6d635a;font-size:12px;cursor:pointer;padding:6px;border-radius:6px;white-space:nowrap}
  li button:hover{color:#e0715a}
  li button.arm{color:#e0715a}
  .empty{font-size:12.5px;color:#6d635a;margin:8px 2px 0}
  input[type=file]{display:none}
  .focnote{font-size:12px;line-height:1.45;color:#a3978b;margin:2px 2px 8px}
  .fchips{display:flex;flex-wrap:wrap;gap:6px}
  .fchip{border:1px solid #3a322c;background:#181512;color:#d8cdc1;border-radius:999px;padding:8px 12px;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;min-height:36px}
  .fchip small{font-size:11px;color:#6d635a}
  .fchip[aria-pressed=true]{background:#2a2219;border-color:#e9b96e;color:#e9b96e;font-weight:600}
  .fchip[aria-pressed=true] small{color:#b99a68}
  .fchip .x2{color:#6d635a;margin-left:2px;padding:0 2px}
  .fchip .x2:hover{color:#e0715a}
  .fonrow{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:2px 2px 8px;font-size:13px;color:#d8cdc1}
  .sw{border:1px solid #3a322c;background:#181512;color:#a3978b;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer}
  .sw[aria-pressed=true]{background:#2a2219;border-color:#e9b96e;color:#e9b96e}
  .fadd{display:flex;gap:6px;margin-top:8px}
  .fadd input{flex:1;min-width:0;background:#181512;border:1px solid #3a322c;border-radius:8px;color:#f3ece4;padding:8px 10px;font-size:13px}
  .fadd input:focus{outline:none;border-color:#e9b96e}
  .fadd button{border:1px solid #5a4a33;background:#2a2219;color:#e9b96e;border-radius:8px;padding:8px 12px;font-size:13px;font-weight:600;cursor:pointer}
</style>
<button class="tog" aria-label="Open Music Lab menu" title="Music Lab (M)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16"></path><path d="M4 12h16"></path><path d="M4 17h16"></path></svg></button>
<div class="scrim"></div>
<aside aria-label="Music Lab">
  <div class="head"><span class="title">Music Lab</span><button class="x" aria-label="Close menu">×</button></div>
  <div class="drn"><button class="dbtn" id="dbtn" aria-pressed="false"><span class="dic">▶</span> C drone</button><input type="range" id="dvol" min="0" max="100" value="5" aria-label="Drone volume"></div>
  <div class="scroll">
    <nav>${appLinks}</nav>
    <div class="rule"></div>
    <div class="grp">Focus tunes</div>
    <div class="fonrow"><span>Lean toward my tunes</span><button class="sw" id="fon" aria-pressed="true">On</button></div>
    <div class="fchips" id="fchips"></div>
    <form class="fadd" id="fadd"><input type="text" id="fname" placeholder="Add another tune…" maxlength="60" autocomplete="off" aria-label="Add another tune by name"><button type="submit">Add</button></form>
    <div class="focnote" id="focnote"></div>
    <div class="rule"></div>
    <div class="grp">Solo Library</div>
    <button class="add"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e9b96e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"></path><path d="M7 9l5-5 5 5"></path><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"></path></svg>Add a solo (MusicXML)</button>
    <input type="file" accept=".xml,.musicxml,.mxl" multiple>
    <div class="msg" role="status"></div>
    <button class="all" hidden>Process all new</button>
    <ul></ul>
    <div class="empty done"></div>
    <div class="empty bi"></div>
    <div class="empty test"></div>
  </div>
</aside>`;
  const $ = s => root.querySelector(s);
  const open = () => { host.classList.add('open'); refresh(); setTimeout(() => $('.x').focus(), 50); };
  const close = () => { host.classList.remove('open'); };
  $('.tog').onclick = open; $('.x').onclick = close; $('.scrim').onclick = close;
  /* ---------- sidebar drone: the same tanpura-style C drone the apps use, on its own audio engine ----------
     Loads drone.js only when first pressed (or reuses it if the page already has it). Audio stops when you leave
     the page, so the button remembers it was on and the next app offers it again with one tap. */
  const DKEY = 'lab:drone';
  let dctx = null, dgain = null, dsrc = null, dbuf = null, dload = null;
  const dprefs = (() => { try { return JSON.parse(localStorage.getItem(DKEY) || '{}'); } catch (e) { return {}; } })();
  if (typeof dprefs.vol === 'number') $('#dvol').value = dprefs.vol;
  const dsave = () => { try { localStorage.setItem(DKEY, JSON.stringify(dprefs)); } catch (e) {} };
  function droneData() {
    // drone.js declares DRONE_URL with const; reuse it if the page loaded it, otherwise add the script once
    try { if (typeof DRONE_URL !== 'undefined') return Promise.resolve(DRONE_URL); } catch (e) {}
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'drone.js';
      s.onload = () => { try { res(DRONE_URL); } catch (e) { rej(e); } }; s.onerror = rej; document.head.appendChild(s); });
  }
  function droneBuffer() {
    if (dload) return dload;
    dload = (async () => {
      const url = await droneData(), bin = atob(url.slice(url.indexOf(',') + 1)), u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const b = await new Promise((res, rej) => dctx.decodeAudioData(u8.buffer, res, rej));
      // skip the decoded file's tiny opening glitch and crossfade the tail into the head, so the loop has no click
      const sr = b.sampleRate, skip = Math.floor(sr * .03), X = Math.floor(sr * .4), L = b.length - skip - X;
      const out = dctx.createBuffer(b.numberOfChannels, L, sr);
      for (let c = 0; c < b.numberOfChannels; c++) { const s = b.getChannelData(c), d = out.getChannelData(c);
        for (let i = 0; i < L; i++) d[i] = s[skip + i];
        for (let i = 0; i < X; i++) { const f = i / X; d[i] = s[skip + i] * Math.sin(f * Math.PI / 2) + s[skip + L + i] * Math.cos(f * Math.PI / 2); } }
      return out;
    })();
    return dload;
  }
  const dlevel = () => (+$('#dvol').value / 100) * .9;
  function dUI(on, txt) {
    $('#dbtn').setAttribute('aria-pressed', String(on));
    $('#dbtn').innerHTML = `<span class="dic">${on ? '■' : '▶'}</span> ${txt || 'C drone'}`;
    $('.tog').classList.toggle('dron', on);
  }
  async function droneOn() {
    if (!dctx) { dctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'playback' }); dgain = dctx.createGain(); dgain.gain.value = 0; dgain.connect(dctx.destination); }
    if (dctx.state === 'suspended') await dctx.resume();
    dUI(true, 'Loading…');
    try { dbuf = await droneBuffer(); } catch (e) { dUI(false, 'Drone unavailable'); dload = null; return; }
    if (dsrc) return;
    dsrc = dctx.createBufferSource(); dsrc.buffer = dbuf; dsrc.loop = true; dsrc.connect(dgain); dsrc.start();
    const t = dctx.currentTime; dgain.gain.cancelScheduledValues(t); dgain.gain.setValueAtTime(0, t); dgain.gain.linearRampToValueAtTime(dlevel(), t + 2);
    dUI(true); dprefs.on = true; dsave();
  }
  function droneOff() {
    if (dsrc && dctx) { const t = dctx.currentTime, s = dsrc;
      dgain.gain.cancelScheduledValues(t); dgain.gain.setValueAtTime(dgain.gain.value, t); dgain.gain.linearRampToValueAtTime(0, t + 1.2);
      s.stop(t + 1.3); }
    dsrc = null; dUI(false); dprefs.on = false; dsave();
  }
  $('#dbtn').onclick = () => { if (dsrc) droneOff(); else droneOn(); };
  $('#dvol').addEventListener('input', () => { dprefs.vol = +$('#dvol').value; dsave();
    if (dsrc && dctx) dgain.gain.setTargetAtTime(dlevel(), dctx.currentTime, .08); });
  // it was on in the last app: browsers need a tap before sound, so show it ready to resume
  if (dprefs.on) { dprefs.on = false; dsave(); $('#dbtn').innerHTML = '<span class="dic">▶</span> Resume drone'; }

  $('nav').addEventListener('click', e => {
    const p = e.target.closest ? e.target.closest('.pin') : null; if (!p) return;
    e.preventDefault(); e.stopPropagation();
    const f = p.dataset.f, pins = pinsGet(), i = pins.indexOf(f);
    if (i >= 0) pins.splice(i, 1); else pins.unshift(f);
    pinsSet(pins); $('nav').innerHTML = navHtml();
  });
  root.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(); $('.tog').focus(); } });
  // M opens and closes the menu from anywhere, except while typing in a field
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && host.classList.contains('open')) { close(); return; }
    if ((e.key !== 'm' && e.key !== 'M') || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
    e.preventDefault();
    host.classList.contains('open') ? close() : open();
  });
  // typing a tune name: keep the keys here, so the app underneath (and the M shortcut) never sees them
  root.addEventListener('keydown', e => { if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') { if (e.key === 'Escape') { close(); $('.tog').focus(); } e.stopPropagation(); } });
  root.addEventListener('keydown', e => { if (e.target && e.target.tagName === 'INPUT') return; if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); e.stopPropagation(); close(); } });
  const msg = (t, err) => { const m = $('.msg'); m.textContent = t || ''; m.classList.toggle('err', !!err); };

  /* ---------- focus tunes panel ---------- */
  let focNames = null;
  async function focusNames() {
    if (focNames) return focNames;
    const names = [];
    try { (await builtins()).forEach(b => names.push(b.name)); } catch (e) {}
    try { (await testGroup()).forEach(b => names.push(b.name)); } catch (e) {}
    try { (await omniGroup()).forEach(b => names.push(b.name)); } catch (e) {}
    try { (await monkGroup()).forEach(b => names.push(b.name)); } catch (e) {}
    try { (await armstrongGroup()).forEach(b => names.push(b.name)); } catch (e) {}
    focNames = names; return names;
  }
  const customRe = c => { const w = c.name.trim().split(/[\s'’-]+/).filter(Boolean).map(reEsc); return new RegExp(w.join('.{0,3}'), 'i'); };
  async function drawFocus() {
    const names = (await focusNames()).concat(lsGet().map(x => x.name));
    const count = re => names.filter(n => re.test(String(n))).length;
    const sw = $('#fon'); sw.textContent = focusState.on ? 'On' : 'Off'; sw.setAttribute('aria-pressed', String(focusState.on));
    const chip = (kind, id, label, n, on) => `<button class="fchip" data-k="${kind}" data-id="${esc(id)}" aria-pressed="${on}">${esc(label)} <small>${n} solo${n === 1 ? '' : 's'}</small>${kind === 'c' ? '<span class="x2" data-rm="1" title="Remove" aria-label="Remove">×</span>' : ''}</button>`;
    $('#fchips').innerHTML = TUNES.map(t => chip('t', t.id, t.name, count(t.re), focusState.sel.includes(t.id))).join('') +
      focusState.custom.map((c, i) => chip('c', String(i), c.name, count(customRe(c)), c.on)).join('');
    $('#focnote').textContent = focusState.on
      ? 'About 70% of the licks, rhythms and examples in each app come from solos on these tunes; the other 30% is everything else. Everything stays over C. A tune with no solos in the library has nothing to lean on yet.'
      : 'Off: every app draws from the whole library as before.';
  }
  $('#fon').onclick = () => { focusState.on = !focusState.on; focusSave(); drawFocus(); };
  $('#fchips').onclick = e => {
    const b = e.target.closest('.fchip'); if (!b) return;
    if (b.dataset.k === 't') { const i = focusState.sel.indexOf(b.dataset.id); if (i >= 0) focusState.sel.splice(i, 1); else focusState.sel.push(b.dataset.id); }
    else { const i = +b.dataset.id; if (e.target.closest('[data-rm]')) focusState.custom.splice(i, 1); else if (focusState.custom[i]) focusState.custom[i].on = !focusState.custom[i].on; }
    focusSave(); drawFocus();
  };
  $('#fadd').onsubmit = e => {
    e.preventDefault(); const inp = $('#fname'), name = inp.value.trim(); if (!name) return;
    if (!focusState.custom.some(c => c.name.toLowerCase() === name.toLowerCase())) focusState.custom.push({ name, on: true });
    inp.value = ''; focusSave(); drawFocus();
  };
  focusListeners.push(() => { if (host.classList.contains('open')) drawFocus(); });

  let armed = null;
  async function refresh() {
    drawFocus();
    const [bi, { list: all, synced }] = await Promise.all([builtins(), allSolos()]);
    const biIds = new Set(bi.map(b => b.id)), list = all.filter(x => !biIds.has(x.id));
    const ul = $('ul');
    $('.bi').textContent = bi.length ? `Plus ${bi.length} built-in solos (Hargrove, Parker, Stitt, Baker and more).` : '';
    Promise.all([testGroup(), omniGroup(), monkGroup(), armstrongGroup()]).then(([t, o, mk, ar]) => { $('.test').textContent = [t.length ? `Testing group: ${t.length} Weimar Jazz Database solos.` : '', o.length ? `Omnibook group: ${o.length} Charlie Parker solos.` : '', mk.length ? `Monk group: ${mk.length} Thelonious Monk tunes.` : '', ar.length ? `Armstrong group: ${ar.length} Louis Armstrong solos.` : '', (t.length || o.length || mk.length || ar.length) ? 'They feed every app and are listed separately in Solo Ear; ask Claude to remove a whole group at once.' : ''].filter(Boolean).join(' '); });
    if (!list.length) { ul.innerHTML = ''; if (!$('.msg').textContent) msg('Your uploads will show here. Add a MusicXML file and every app can use it.'); }
    else {
      // the list is an inbox: only uploads that haven't been processed yet. Processed solos stay in the library
      // (every app uses them) but leave this list; ask Claude in chat to remove one.
      let pr = procGet();
      // processed on another device: build this browser's examples quietly, without listing it again
      const quiet = list.filter(s => (!pr[s.id] && cloudProcessed.has(s.id)) || (pr[s.id] && (pr[s.id].v || 1) < PROC_V));
      if (quiet.length) { try { await processSolos(quiet); pr = procGet(); } catch (e) {} }
      const todo = list.filter(s => !pr[s.id]), doneN = list.length - todo.length;
      ul.innerHTML = todo.slice().reverse().map(s => `<li><div class="nm"><span title="${esc(s.name)}">${esc(s.name)}</span><em class="todo">Not processed yet</em></div>` +
        `<button class="proc" data-id="${esc(s.id)}">Process</button><button class="rm" data-id="${esc(s.id)}">Remove</button></li>`).join('');
      $('.all').hidden = todo.length < 2;
      $('.all').textContent = `Process all (${todo.length})`;
      $('.all').onclick = () => runProcess(todo);
      ul.querySelectorAll('button.proc').forEach(b => b.onclick = () => runProcess(todo.filter(s => s.id === b.dataset.id)));
      $('.done').textContent = doneN ? `${doneN} processed upload${doneN === 1 ? '' : 's'} in your library.` : '';
      if (!todo.length && !$('.msg').textContent) msg('Nothing waiting. New uploads show here until you process them.');
    }
    if (!list.length) $('.all').hidden = true;
    ul.querySelectorAll('button.rm').forEach(b => b.onclick = async () => {
      if (armed !== b.dataset.id) { armed = b.dataset.id; ul.querySelectorAll('button.rm').forEach(x => { x.classList.remove('arm'); x.textContent = 'Remove'; }); b.classList.add('arm'); b.textContent = 'Tap again'; return; }
      armed = null; const id = b.dataset.id; await removeSolo(id);
      if (here === 'solo-ear.html') { try { if (typeof lib !== 'undefined' && Array.isArray(lib)) { const i = lib.findIndex(x => x.id === id); if (i >= 0) lib.splice(i, 1); if (typeof renderLib === 'function') renderLib(); } } catch (e) {} }
      msg('Removed.'); changed(); refresh();
    });
    if (!synced && list.length && !$('.msg').textContent) msg('Saved in this browser only right now.');
  }

  async function addFiles(files) {
    msg('');
    const errs = []; let n = 0, last = null;
    for (const f of files) {
      try { const s = await fileToSolo(f); if (await saveSolo(s)) { n++; last = s; } else errs.push(`${f.name}: couldn't be saved`); }
      catch (e) { errs.push(`${f.name}: ${e.message}`); }
    }
    // On Solo Ear Lessons, put it in the open app's list and open it straight away
    if (last && here === 'solo-ear.html') {
      try {
        if (typeof lib !== 'undefined' && Array.isArray(lib) && typeof renderLib === 'function' && typeof loadSolo === 'function') {
          (await withXml(lsGet())).forEach(s => { if (!lib.some(x => x.id === s.id)) lib.push(s); });
          renderLib(last.id); loadSolo(last.id); close();
        }
      } catch (e) {}
    }
    if (errs.length) msg(errs.join(' · '), true);
    else msg(n === 1 ? 'Added. Press Process to add its examples to Solo Ear\'s tabs.' : `Added ${n} solos. Press Process all to add their examples to Solo Ear's tabs.`);
    if (n) {
      changed();
      refresh();
    }
  }
  const input = $('input');
  $('.add').onclick = () => input.click();
  input.onchange = () => { const fs = [...input.files]; input.value = ''; if (fs.length) addFiles(fs); };
  const add = $('.add');
  ['dragenter', 'dragover'].forEach(t => add.addEventListener(t, e => { e.preventDefault(); e.stopPropagation(); add.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => add.addEventListener(t, e => { e.preventDefault(); e.stopPropagation(); add.classList.remove('over'); }));
  add.addEventListener('drop', e => { const fs = [...(e.dataTransfer?.files || [])]; if (fs.length) addFiles(fs); });

  /* ---------- Tap a chord name: hear its bass note ----------
     Chord symbols in the apps that show them; Solo Ear Lessons handles its own (it knows the transposition). */
  const CHORD_SEL = '.track.chords .chord, .lvchords > div, .pl text.ch, .colhead b, svg.phrase text.zl';
  (function chordTaps() {
    const SAMPLES = typeof PIANO !== 'undefined' ? PIANO : window.PIANO; if (!SAMPLES) return;
    const st = document.createElement('style'); st.textContent = CHORD_SEL + '{cursor:pointer}'; document.head.appendChild(st);
    const LET = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }, KEYS = Object.keys(SAMPLES).map(Number);
    let actx = null; const bufs = {};
    const pcOf = (l, a) => (LET[l] + (/[♭b]/.test(a || '') ? -1 : /[♯#]/.test(a || '') ? 1 : 0) + 12) % 12;
    function bassPc(text) {        // the slash bass if there is one, else the root
      const t = String(text).trim(), sl = t.match(/\/([A-G])([♭♯#b]?)/), r = t.match(/^([A-G])([♭♯#b]?)/);
      const m = sl || r; return m ? pcOf(m[1], m[2]) : null;
    }
    async function play(pc) {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      let midi = 36 + pc; if (midi < 40) midi += 12;
      const k = KEYS.reduce((b, x) => Math.abs(x - midi) < Math.abs(b - midi) ? x : b, KEYS[0]);
      if (!bufs[k]) { const url = SAMPLES[k], bin = atob(url.slice(url.indexOf(',') + 1)), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        bufs[k] = await new Promise((res, rej) => actx.decodeAudioData(u8.buffer, res, rej)); }
      const src = actx.createBufferSource(), g = actx.createGain(), t = actx.currentTime + 0.02, rate = Math.pow(2, (midi - k) / 12);
      src.buffer = bufs[k]; src.playbackRate.value = rate;
      const end = Math.min(t + 1.8, t + bufs[k].duration / rate);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.8, t + 0.005); g.gain.setValueAtTime(0.8, end - 0.25); g.gain.linearRampToValueAtTime(0.0001, end);
      src.connect(g); g.connect(actx.destination); src.start(t); src.stop(end + 0.02);
      window.__labLastBass = midi;
    }
    document.addEventListener('click', e => {
      const el = e.target && e.target.closest ? e.target.closest(CHORD_SEL) : null; if (!el) return;
      const pc = bassPc(el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild.textContent : el.textContent);
      if (pc != null) play(pc).catch(() => {});
    });
  })();

  const mount = () => { document.body.appendChild(host); connect(); setTimeout(processBuiltinUpdates, 400); };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
