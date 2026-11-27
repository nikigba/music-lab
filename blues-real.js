/* Blues Vocab: Real moves. The two notes that matter: where a line starts on one chord (gold)
   and its first note on the next chord (green), taken from the solos and ranked by how often players use them.
   Under each line, cards say what it is made of: a triad, the arpeggio, the blues scale, a run, an approach note… */
const RL_DIR = { up: { fr: 0, to: 5, name: 'I → IV', spots: [[1, 2, 0, 4]] }, down: { fr: 5, to: 0, name: 'IV → I', spots: [[2, 3, 4, 8], [6, 7, 16, 24]] } };
let rlDir = store.get('bv.rlDir', 'up'), rlPair = null, rlSel = -1, rlShown = 30, rlEls = [], RL = null, rlRare = false;
function rlFindAll() {
  const out = { up: [], down: [] }; if (!LIB) return out;
  for (const c of LIB.choruses) {
    if (c.minor) continue;
    const N = c.notes.map(x => ({ t: x[0], d: x[1], m: x[2] })).sort((a, b) => a.t - b.t);
    const isC = (i, rel) => c.bars[i - 1] && c.bars[i - 1].length && c.bars[i - 1].every(x => mod(x.r - c.K, 12) === rel);
    for (const dir of ['up', 'down']) {
      const D = RL_DIR[dir];
      for (const [b1, b2, from, land] of D.spots) {
        if (!isC(b1, D.fr) || !isC(b2, D.to) || (b1 === 6 && !isC(5, 5))) continue;
        const k = N.findIndex(n => n.t >= land - 0.5 - 1e-6 && n.t < land + 1); if (k < 1) continue;
        const B = N[k]; if (B.t - (N[k - 1].t + N[k - 1].d) > 0.55 || N[k - 1].t < from - 0.5) continue;
        const linked = j => N[j].t - (N[j - 1].t + N[j - 1].d) <= 0.55;
        let a = k - 1; while (a > 0 && N[a - 1].t >= from - 0.5 && linked(a)) a--;
        // notes before the chord that lead into it (up to two beats), shown for context
        let p = a; while (p > 0 && N[p - 1].t >= from - 2.5 && linked(p)) p--;
        const A = N[a], t0 = Math.floor(N[p].t + 1e-6), frPc = mod(c.K + D.fr, 12), toPc = mod(c.K + D.to, 12);
        const chords = [{ at: Math.max(0, from - t0), pc: frPc, q: 'dom' }, { at: land - t0, pc: toPc, q: 'dom' }];
        if (from - t0 > 0) chords.unshift({ at: 0, pc: mod(c.K + (b1 === 1 ? 7 : 0), 12), q: 'dom' });   // before bar 1: the V of the turnaround; before the IV: the I
        out[dir].push({ A: mod(A.m - frPc, 12), B: mod(B.m - toPc, 12), lead: a - p, K: c.K, soloId: c.soloId, chords, from: from - t0, land: land - t0,
          notes: N.slice(p, k + 1).map((n, j) => ({ t: Math.round((n.t - t0) * 1e4) / 1e4, d: Math.round(n.d * 1e4) / 1e4, m: n.m, kind: j === a - p ? 'tone' : j === k - p ? 'home' : '' })),
          src: `${c.name}${c.of > 1 ? ' · chorus ' + c.no : ''}`, asPlayed: AS_PLAYED.has(c.soloId), bar: Math.max(1, Math.floor(N[p].t / 4) + 1), bars: [Math.max(1, Math.floor(N[p].t / 4) + 1), b2], antic: B.t < land - 0.01 });
      }
    }
  }
  for (const d in out) { const seen = new Set(); out[d] = out[d].filter(L => { const s = L.notes.map(n => mod(n.m - L.K, 12) + '@' + Math.round(n.t * 4)).join(','); if (seen.has(s)) return false; seen.add(s); return true; }); }
  return out;
}
const rlAll = () => (RL || (RL = rlFindAll()))[rlDir];
const rlKey = L => `${L.A}|${L.B}`;
const rlPairName = (A, B) => { const D = RL_DIR[rlDir]; return `${KT[A]} of the ${chordWord(D.fr)} → ${KT[B]} of the ${chordWord(D.to)}`; };
const rlInKey = (x, rel) => KT[mod(x + rel, 12)];

/* ---------- what a line is made of ---------- */
const CARD_COL = { triad: 'var(--home)', arp: '#e8a35c', blues: 'var(--blue)', pent: 'var(--good)', run: '#b9b9c0', appr: '#c58cf0', other: 'var(--dim)' };
function rlCards(L) {
  const ns = L.notes, cards = [];
  const chordOf = j => ns[j].ch ? ns[j].ch : ns[j].kind === 'home' || ns[j].t >= L.land - 1e-6 ? L.chords[L.chords.length - 1] : L.chords.filter(c => c.at <= ns[j].t + 1e-6).pop() || L.chords[0];
  const pcK = j => mod(ns[j].m - L.K, 12);
  const romOf = ch => BluesVocab.roman(mod(ch.pc - L.K, 12), ch.q || 'dom');   // the chord as a number of the key (I7, IV7, ii…)
  const TONES = { dom: [0, 4, 7, 10], maj: [0, 4, 7, 11], min: [0, 3, 7, 10], hd: [0, 3, 6, 10], dim: [0, 3, 6, 9] };
  const tonesOf = ch => TONES[ch.q] || TONES.dom, seventh = ch => (TONES[ch.q] || TONES.dom)[3];
  const grow = (i, ok, step) => { let j = i; while (j + 1 < ns.length && ok(j + 1) && (!step || Math.abs(ns[j + 1].m - ns[j].m) <= step)) j++; return j; };
  const tri = i => { let best = null;   // the longest stretch from one major or minor triad, with all three notes in it
    for (let r = 0; r < 12; r++) for (const q of [[0, 4, 7, 'maj'], [0, 3, 7, 'min'], [0, 3, 6, 'dim'], [0, 4, 8, 'aug']]) {
      const pcs = q.slice(0, 3).map(x => mod(L.K + r + x, 12)); if (!pcs.includes(mod(ns[i].m, 12))) continue;
      const j = grow(i, x => pcs.includes(mod(ns[x].m, 12)));
      const cov = new Set(ns.slice(i, j + 1).map(n => mod(n.m, 12)));
      if (j - i >= 2 && cov.size === 3 && (!best || j > best.j)) best = { j, r, q: q[3] };
    } return best; };
  const arp = i => { const ch = chordOf(i), pcs = tonesOf(ch).map(x => mod(ch.pc + x, 12)); if (!pcs.includes(mod(ns[i].m, 12))) return null;
    const j = grow(i, x => chordOf(x) === ch && pcs.includes(mod(ns[x].m, 12))); const cov = new Set(ns.slice(i, j + 1).map(n => mod(n.m - ch.pc, 12)));
    return j - i >= 2 && cov.has(seventh(ch)) && cov.size >= 3 ? { j, ch } : null; };
  const inSet = (set, i) => set.includes(pcK(i));
  const blues = i => { const set = [0, 3, 5, 6, 7, 10]; if (!inSet(set, i)) return null; const j = grow(i, x => inSet(set, x), 3);
    const cov = new Set(ns.slice(i, j + 1).map((n, x) => pcK(i + x))); return j - i >= 3 && (cov.has(3) || cov.has(6)) ? { j } : null; };
  const pent = i => { const set = [0, 2, 3, 4, 7, 9]; if (!inSet(set, i)) return null; const j = grow(i, x => inSet(set, x), 4);
    const cov = new Set(ns.slice(i, j + 1).map((n, x) => pcK(i + x))); return j - i >= 3 && (cov.has(2) || cov.has(9)) ? { j, mb: cov.has(3) } : null; };
  const run = i => { const j = grow(i, () => true, 2); return j - i >= 3 ? { j } : null; };
  const QN = { maj: 'major', min: 'minor', dim: 'diminished', aug: 'augmented' };
  const triCard = (i, t) => { let rom = BluesVocab.roman(t.r, 'maj').replace(/maj7?$/, '').replace(/m7$/, '').replace(/7$/, '');
    rom = t.q === 'min' ? rom.toLowerCase() : t.q === 'dim' ? rom.toLowerCase() + '°' : t.q === 'aug' ? rom + '+' : rom;
    return { kind: 'triad', i, j: t.j, title: `Triad: ${rom}`, sub: `${QN[t.q]} triad on ${KT[t.r]} of the key` }; };
  // 1) triads and arpeggios, even inside a blues or scale line
  const taken = new Array(ns.length).fill(false);
  for (let i = 0; i < ns.length;) {
    const a = arp(i), t = tri(i);
    const c = a && (!t || a.j > t.j) ? { kind: 'arp', i, j: a.j, title: `Arpeggio: ${romOf(a.ch)}`, sub: `${tonesOf(a.ch).map(x => cdeg(x, a.ch.q)).join(' ')} of the chord` } : t ? triCard(i, t) : null;
    if (c) { cards.push(c); for (let x = c.i; x <= c.j; x++) taken[x] = true; i = c.j + 1; } else i++;
  }
  // 2) the rest, between them: scales, runs, approach notes, riffs
  const free = (i, j) => { for (let x = i; x <= j; x++) if (taken[x]) return false; return true; };
  let i = 0, other = null;
  const flush = () => { if (other) { cards.push(other); other = null; } };
  while (i < ns.length) {
    if (taken[i]) { flush(); i++; continue; }
    const opts = [];
    const b = blues(i); if (b) opts.push({ kind: 'blues', j: b.j, title: 'Blues scale', sub: '1 ♭3 4 ♭5 5 ♭7 of the key' });
    const p = pent(i); if (p) opts.push({ kind: 'pent', j: p.j, title: p.mb ? 'Major blues' : 'Major pentatonic', sub: p.mb ? '1 2 ♭3 3 5 6 of the key' : '1 2 3 5 6 of the key' });
    const r = run(i); if (r) opts.push({ kind: 'run', j: r.j, title: 'Scale run', sub: 'by step' });
    // a scale card stops where a triad or arpeggio begins
    opts.forEach(o => { while (o.j > i && !free(i, o.j)) o.j--; });
    const okOpts = opts.filter(o => o.j - i >= (o.kind === 'run' || o.kind === 'blues' || o.kind === 'pent' ? 3 : 2));
    const order = ['blues', 'pent', 'run'];
    okOpts.sort((x, y) => (y.j - x.j) || order.indexOf(x.kind) - order.indexOf(y.kind));
    if (okOpts.length) { flush(); const o = okOpts[0]; cards.push(Object.assign(o, { i })); i = o.j + 1; continue; }
    if (i + 1 < ns.length && Math.abs(ns[i + 1].m - ns[i].m) === 1) { const ch = chordOf(i + 1); if (tonesOf(ch).includes(mod(ns[i + 1].m - ch.pc, 12))) { flush(); cards.push({ kind: 'appr', i, j: i, title: 'Approach note', sub: `half step ${ns[i + 1].m > ns[i].m ? 'up' : 'down'} into the ${cdeg(ns[i + 1].m - ch.pc, ch.q || 'dom')} of the ${romOf(ch)}` }); i++; continue; } }
    if (!other) other = { kind: 'other', i, j: i, title: 'Passing notes', sub: '' }; else other.j = i;
    i++;
  }
  flush();
  cards.sort((x, y) => x.i - y.i);
  // a stretch of three or more notes on only a few pitches is a little riff: name its notes
  cards.forEach(c => { if (c.kind !== 'other' || c.j - c.i < 2) return;
    const set = [...new Set(ns.slice(c.i, c.j + 1).map((n, x) => pcK(c.i + x)))].sort((a, b) => a - b);
    if (set.length <= 4) { c.title = `Riff on ${set.map(x => KT[x]).join(' ')}`; c.sub = 'a few notes of the key, turned around'; } });
  return cards;
}
// cards for any drawn phrase (every view in Blues Vocab shows them under its line)
function phraseCards(ph) {
  const ch0 = ph.chords[0] || { at: 0, pc: ph.K, q: 'dom' };
  return rlCards({ notes: ph.notes.map(n => ({ t: n.q, d: n.dur, m: n.midi, kind: n.kind, ch: n.ch || ch0 })), chords: ph.chords.length ? ph.chords : [ch0], K: ph.K, land: Infinity });
}
function drawCards(view, ph, svg) {
  let box = view.querySelector('.rcards'); if (!box) { box = document.createElement('div'); box.className = 'rcards'; view.appendChild(box); }
  if (!ph.notes.length) { box.innerHTML = ''; return; }
  const cards = phraseCards(ph), toks = j => degOf(ph.K, ph.notes[j].ch, ph.notes[j].midi, 'key');
  box.innerHTML = cards.map((c, x) => `<button class="rcard" data-x="${x}" style="--c:${CARD_COL[c.kind]}"><b>${esc(c.title)}</b><span class="rt">${ph.notes.slice(c.i, c.j + 1).map((n, y) => { const k = ph.notes[c.i + y].kind; return k === 'tone' || k === 'home' ? `<u>${toks(c.i + y)}</u>` : toks(c.i + y); }).join(' ')}</span><small>${esc(c.sub)}</small></button>`).join('');
  box._cards = cards; box._ph = ph; box._svg = svg;
}
function clearCards(view) { const box = view && view.querySelector('.rcards'); if (box) box.innerHTML = ''; }
function rlDrawCards() {}   // drawPhrase draws the cards now
function rlShowLine(L, scroll) {
  const ph = ePhrase({ lick: L, chords: L.chords }), v = $('rlView'); v.hidden = false;
  const k = rlAll().indexOf(L), cell = $('rlList').querySelector(`.cell[data-k="${k}"]`);
  if (cell && cell.previousElementSibling !== v) { const top = cell.getBoundingClientRect().top; cell.before(v); window.scrollBy(0, cell.getBoundingClientRect().top - top); }
  if (scroll) v.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  const D = RL_DIR[rlDir];
  $('rlTitle').textContent = rlPairName(L.A, L.B);
  $('rlSub').textContent = `${L.src} · bar ${L.bar}${L.lead ? ' · starts before the chord: the gold note is where it is on the ' + chordWord(D.fr) : ''}${L.antic ? ' · arrives early' : ''}`;
  rlEls = drawPhrase($('rlSvg'), ph); rlDrawCards(L, ph);
  favButton($('rlFav'), L, `${rlPairName(L.A, L.B)} · Real moves`);
  return ph;
}
function renderReal() {
  if (!LIB) return;
  setSeg('rlDirSeg', 'd', rlDir);
  const all = rlAll(), cnt = {}; all.forEach(L => cnt[rlKey(L)] = (cnt[rlKey(L)] || 0) + 1);
  const pairs = Object.entries(cnt).sort((a, b) => b[1] - a[1]), D = RL_DIR[rlDir];
  if (rlPair && !cnt[rlPair]) rlPair = null;
  const shownPairs = rlRare ? pairs : pairs.filter(([, n]) => n >= 3);
  $('rlPairs').innerHTML = `<button class="chip big" data-p="" aria-pressed="${!rlPair}">All moves <small>${all.length}</small></button>` +
    shownPairs.map(([k, n]) => { const [A, B] = k.split('|').map(Number); return `<button class="chip" data-p="${k}" aria-pressed="${k === rlPair}">${KT[A]} → ${KT[B]} <small>${n}</small></button>`; }).join('') +
    (pairs.length > shownPairs.length || rlRare ? `<button class="chip" data-rare="1">${rlRare ? 'hide the rare ones' : `+ ${pairs.length - shownPairs.length} rare moves`}</button>` : '');
  $('rlNote').innerHTML = `<b>Only two notes matter here:</b> where the line <b>starts on the ${chordWord(D.fr)}</b> (gold) and its <b>first note on the ${chordWord(D.to)}</b> (green). The moves are ranked by how often players make them in your solos, written as numbers of each chord (${KT[0]} of the ${chordWord(D.fr)} is ${rlInKey(0, D.fr)} of the key, ${KT[0]} of the ${chordWord(D.to)} is ${rlInKey(0, D.to)} of the key). Everything between the two notes is the road; the cards under a line show what the road is made of.${rlPair ? ` <b>${esc(rlPairName(...rlPair.split('|').map(Number)))}</b>: ${rlInKey(+rlPair.split('|')[0], D.fr)} → ${rlInKey(+rlPair.split('|')[1], D.to)} of the key.` : ''}`;
  const list = all.filter(L => !rlPair || rlKey(L) === rlPair), v = $('rlView');
  if (v.parentElement === $('rlList')) $('rlList').before(v);
  $('rlList').innerHTML = list.slice(0, rlShown).map(L => {
    const k = all.indexOf(L), ph = ePhrase({ lick: L, chords: L.chords }), f = lickFav(L, '');
    const toks = ph.notes.map(n => { const t = degOf(ph.K, n.ch, n.midi, 'key'); return n.kind === 'tone' ? `<b style="color:var(--home)">${t}</b>` : n.kind === 'home' ? `<b style="color:var(--good)">${t}</b>` : t; }).join(' ');
    return `<div class="cell${k === rlSel ? ' sel' : ''}" data-k="${k}"><div class="tk">${toks}</div><div class="btns"><button class="mini fv${favOn(f) ? ' saved' : ''}" data-a="fav">${favOn(f) ? '★' : '☆'}</button><button class="mini" data-a="play">▶</button></div>
      <div class="meta"><span class="tag">${KT[L.A]} → ${KT[L.B]}</span><b>${esc(L.src)}</b> · bar ${L.bar}${L.lead ? ' · picks up before the chord' : ''} · played in ${keyOf(L.K)[0]}</div></div>`;
  }).join('') || '<p class="note">No lines for this move.</p>';
  $('rlMore').hidden = list.length <= rlShown; $('rlMore').textContent = `Show more (${list.length - rlShown})`;
  if (rlSel >= 0 && all[rlSel] && list.includes(all[rlSel]) && !v.hidden) rlShowLine(all[rlSel], false); else { v.hidden = true; $('rlCards').innerHTML = ''; }
}
async function rlPlayOne(k) {
  stopAll(); await audio();
  const L = rlAll()[k]; if (!L) return; rlSel = k;
  document.querySelectorAll('#rlList .cell').forEach(x => x.classList.toggle('sel', +x.dataset.k === k));
  const ph = rlShowLine(L, true), my = token; playing = true; $('playBtn').textContent = '■ Stop';
  curAsPlayed = L.asPlayed; TEMPO_SCALE = 1 / (+$('lickSpeed').value || 1);
  const end = schedule(ph, ctx.currentTime + 0.08, () => rlEls, my); TEMPO_SCALE = 1; curAsPlayed = false;
  at(end, () => { if (my !== token) return; playing = false; $('playBtn').textContent = '▶ Play'; });
  readout(`<b>${esc(rlPairName(L.A, L.B))}</b> in ${esc(L.src)}.`);
}
// Play: the two notes, then a real line that makes the move, then your turn; the next move is picked by how common it is
async function playReal() {
  stopAll(); await audio();
  const pool0 = rlAll().filter(L => !rlPair || rlKey(L) === rlPair); if (!pool0.length) return;
  const foc = () => { try { return window.MusicLab && MusicLab.focus ? MusicLab.focus.prefer(pool0, L => L.src) : pool0; } catch (e) { return pool0; } };   // focus tunes: 70/30 toward solos on them
  let pool = foc();
  const K = homeOf(), D = RL_DIR[rlDir]; let last = null;
  const round = () => {
    pool = foc();
    let L = pool[Math.floor(Math.random() * pool.length)]; for (let n = 0; n < 6 && L.soloId === last && pool.length > 1; n++) L = pool[Math.floor(Math.random() * pool.length)];
    last = L.soloId;
    let aS = mod(D.fr + L.A, 12); if (aS > 9) aS -= 12;
    let bS = null; for (let m = aS - 7; m <= aS + 7; m++) if (mod(m - D.to - L.B, 12) === 0) if (bS == null || Math.abs(m - aS) < Math.abs(bS - aS)) bS = m;
    const name = rlPairName(L.A, L.B), ph = ePhrase({ lick: L, chords: L.chords }), sl = 1 / (+$('lickSpeed').value || 1);
    const two = ePhrase({ notes: [{ t: 0, d: 2, s: aS, kind: 'tone' }, { t: 2, d: 2, s: bS, kind: 'home' }], chords: eChords(K, [[0, D.fr], [2, D.to]]) });
    const home = ePhrase({ notes: eHome('triad', 'all', D.fr), chords: eChords(K, [[0, D.fr]]) });
    const v = $('rlView');
    const steps = [
      { ph: home, els: () => rlEls, show: () => { v.hidden = false; $('rlList').before(v); $('rlTitle').textContent = `The ${chordWord(D.fr)}`; $('rlSub').textContent = 'its triad'; rlEls = drawPhrase($('rlSvg'), home); $('rlCards').innerHTML = ''; favButton($('rlFav'), null); readout(`<b>The ${chordWord(D.fr)}</b>`); } },
      { ph: two, pad: 2, els: () => rlEls, show: () => { $('rlTitle').textContent = 'The two notes'; $('rlSub').textContent = `${name} (${rlInKey(L.A, D.fr)} → ${rlInKey(L.B, D.to)} of the key)`; rlEls = drawPhrase($('rlSvg'), two); readout(`<b>${esc(name)}</b>`); } },
      { ph, slow: true, asPlayed: L.asPlayed, pad: 2, els: () => rlEls, show: () => { $('rlTitle').textContent = name; $('rlSub').textContent = `in a real line · ${L.src} · bar ${L.bar}`; rlEls = drawPhrase($('rlSvg'), ph); rlDrawCards(L, ph); favButton($('rlFav'), L, `${name} · Real moves`); readout(`The same two notes in <b>${esc(L.src)}</b>.`); } },
    ];
    if ($('homeGap').checked) steps.push({ ph: { notes: [], chords: ph.chords.map(c => Object.assign({}, c, { at: c.at * sl })), len: Math.ceil(ph.len * sl / 4) * 4, K, minor: false, homeAt: null }, els: () => [], show: () => { $('rlTitle').textContent = 'Your turn'; $('rlSub').textContent = 'sing the two notes, then the line'; readout('<b>Your turn</b>'); } });
    return engRound(steps);
  };
  engStart(round);
}
document.addEventListener('click', e => {
  const d = e.target.closest('#rlDirSeg button'); if (d) { rlDir = d.dataset.d; store.set('bv.rlDir', rlDir); rlPair = null; rlSel = -1; rlShown = 30; stopAll(); renderReal(); return; }
  const p = e.target.closest('#rlPairs .chip'); if (p) { if (p.dataset.rare) rlRare = !rlRare; else { rlPair = p.dataset.p || null; rlSel = -1; rlShown = 30; stopAll(); } renderReal(); return; }
  if (e.target.closest('#rlMore')) { rlShown += 40; renderReal(); return; }
  const card = e.target.closest('.rcards .rcard'); if (card) {   // hear just that part of the line
    const box = card.closest('.rcards'), c = box._cards[+card.dataset.x], ph = box._ph, els = (box._svg && box._svg._els) || []; (async () => { stopAll(); await audio(); const sub = ph.notes.slice(c.i, c.j + 1).map(n => Object.assign({}, n, { q: n.q - ph.notes[c.i].q }));
      const b = beat() / (+$('lickSpeed').value || 1), t0 = ctx.currentTime + 0.05; sub.forEach((n, y) => { piano(n.midi, t0 + n.q * b, n.dur * b + 0.05, 0.85); const el = els[c.i + y]; if (el) { at(t0 + n.q * b, () => el.classList.add('on')); at(t0 + (n.q + n.dur) * b, () => el.classList.remove('on')); } }); })();
    return; }
  const cell = e.target.closest('#rlList .cell'); if (!cell) return;
  const k = +cell.dataset.k;
  if (e.target.closest('[data-a="fav"]')) { const L = rlAll()[k], f = lickFav(L, `${rlPairName(L.A, L.B)} · Real moves`); if (window.MusicLab && MusicLab.favs) { MusicLab.favs.toggle(f); const b = e.target.closest('[data-a="fav"]'), on = favOn(f); b.classList.toggle('saved', on); b.textContent = on ? '★' : '☆'; } return; }
  rlPlayOne(k);
});
window.addEventListener('load', () => { if (window.MusicLab && MusicLab.onChange) MusicLab.onChange(() => { RL = null; }); });
renderAll(); engNav();
