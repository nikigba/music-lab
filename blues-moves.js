/* Blues Vocab: the Moves tab. Predict, sing, check: one note on one chord, the arrival on the next.
   Uses helpers from the main script and blues-ear.js (ePhrase, eChords, eLicksAll, KT, schedule…). */
const MV_DIR = { up: { ex: 2, fr: 0, to: 5, name: 'I → IV' }, down: { ex: 3, fr: 5, to: 0, name: 'IV → I' } };
const MV_LEVELS = [
  [1, 'Keep the note', 'The note stays and the chord changes under it: hear its colour change.'],
  [2, 'Half steps', 'The strongest pulls: one semitone into a chord tone of the new chord.'],
  [3, 'Whole steps', 'A step into a chord tone of the new chord.'],
  [4, 'Leaps', 'A leap into a chord tone of the new chord. Hardest to hear ahead.'],
  [5, 'Free choice', 'No target. Sing whatever you hear on the new chord, then hear what the players chose most often from that note.'],
];
let mvDir = store.get('bv.mvDir', 'up'), mvLevel = store.get('bv.mvLevel', 1), mvOnly = null, mvSupport = store.get('bv.mvSupport', 'full');
let mvW = store.get('bv.mvW', {}), mvLabels = store.get('bv.mvLabels', {}), mvScore = store.get('bv.mvScore', {}), mvCur = null, mvEls = [];
const DOM7 = [0, 4, 7, 10];
const signed = d => { d = mod(d, 12); return d > 6 ? d - 12 : d; };
// every move of a level, as semitones above the key: from a chord tone of the first chord to (level 1) the same note or (2–4) a chord tone of the next
function mvPairs(dir, level) {
  const D = MV_DIR[dir], out = [];
  for (const a of DOM7) {
    const A = mod(D.fr + a, 12);
    if (level === 1) { out.push({ A, B: A, d: 0 }); continue; }
    if (level === 5) { out.push({ A, B: null, d: null }); continue; }
    for (const b of DOM7) {
      const B = mod(D.to + b, 12), d = signed(B - A), ad = Math.abs(d);
      if ((level === 2 && ad === 1) || (level === 3 && ad === 2) || (level === 4 && ad >= 3)) out.push({ A, B, d });
    }
  }
  return out;
}
const mvKey = (dir, p) => `${dir}|${p.A}|${p.B}`;
const relTo = (k, rel) => mod(k - rel, 12);
const mvName = (dir, p) => { const D = MV_DIR[dir]; return `${KT[relTo(p.A, D.fr)]} of the ${chordWord(D.fr)} → ${p.B == null ? '?' : KT[relTo(p.B, D.to)] + ' of the ' + chordWord(D.to)}`; };
// what the note becomes, for the "keep the note" level
const mvColour = (dir, p) => { const D = MV_DIR[dir]; return p.B == null ? '' : cdeg(p.B - D.to, 'dom'); };
const mvReal = (dir, p) => eLicksAll(MV_DIR[dir].ex, 'skel', 'pair').filter(L => L.start === relTo(p.A, MV_DIR[dir].fr) && (p.B == null || L.arrive === relTo(p.B, MV_DIR[dir].to)));
// for free choice: where the players went most often from this note
function mvTopArrival(dir, A) {
  const D = MV_DIR[dir], c = {}; mvReal(dir, { A, B: null }).forEach(L => c[L.arrive] = (c[L.arrive] || 0) + 1);
  const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
  return best ? { B: mod(+best[0] + D.to, 12), n: best[1], total: Object.values(c).reduce((x, y) => x + y, 0) } : null;
}
function mvPick() {
  let pairs = mvPairs(mvDir, mvLevel); if (mvOnly) pairs = pairs.filter(p => mvKey(mvDir, p) === mvOnly);
  if (!pairs.length) return null;
  // moves you missed come back more often
  const w = pairs.map(p => mvW[mvKey(mvDir, p)] || 1), tot = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * tot; for (let i = 0; i < pairs.length; i++) { r -= w[i]; if (r <= 0) return pairs[i]; }
  return pairs[pairs.length - 1];
}
function mvRate(ok) {
  if (!mvCur) return;
  const k = mvKey(mvDir, mvCur), w = mvW[k] || 1;
  mvW[k] = ok ? Math.max(0.3, w * 0.6) : Math.min(6, w + 1.5);
  const s = mvScore[k] || [0, 0]; s[ok ? 0 : 1]++; mvScore[k] = s;
  store.set('bv.mvW', mvW); store.set('bv.mvScore', mvScore);
  $('mvRated').textContent = ok ? '✓ noted: it will come up less' : '✗ noted: it will come up more';
  renderMovesList();
}
function renderMovesList() {
  const pairs = mvPairs(mvDir, mvLevel);
  if (mvOnly && !pairs.some(p => mvKey(mvDir, p) === mvOnly)) mvOnly = null;
  $('mvPairs').innerHTML = mvLevel === 5 ? '' : pairs.map(p => {
    const k = mvKey(mvDir, p), s = mvScore[k], n = mvReal(mvDir, p).length;
    return `<button class="chip" data-k="${k}" aria-pressed="${mvOnly === k}">${esc(mvName(mvDir, p))}${mvLevel === 1 && mvColour(mvDir, p) !== KT[relTo(p.B, MV_DIR[mvDir].to)] ? ` <small>= the ${esc(mvColour(mvDir, p))}</small>` : ''}${mvLabels[k] ? ` · <i>${esc(mvLabels[k])}</i>` : ''} <small>${n} real${s ? ` · ✓${s[0]} ✗${s[1]}` : ''}</small></button>`;
  }).join('');
}
function renderMoves() {
  if (!LIB) return;
  setSeg('mvDirSeg', 'd', mvDir); setSeg('mvSupSeg', 's', mvSupport);
  $('mvLevels').innerHTML = MV_LEVELS.map(([n, name]) => `<button class="chip big" data-l="${n}" aria-pressed="${n === mvLevel}">${n} · ${esc(name)}</button>`).join('');
  $('mvNote').innerHTML = `<b>${esc(MV_LEVELS[mvLevel - 1][2])}</b> Each round: the first chord with your starting note, then the target is named, then <b>the next chord plays with no melody: sing the arrival</b>. Then you hear it, then a real line from your solos that makes the same move. Rate it ✓ or ✗: moves you miss come back more often. Tap a move to practise only that one.`;
  renderMovesList();
  if (!playing) mvDraw(null, false);
}
function mvPlace(p, B) {
  // the starting note in a comfortable middle, the arrival as close to it as possible
  let a = p.A; if (a > 9) a -= 12;
  if (B == null) return { a, b: null };
  let b = null; for (let m = a - 7; m <= a + 7; m++) if (mod(m - B, 12) === 0) if (b == null || Math.abs(m - a) < Math.abs(b - a)) b = m;
  return { a, b };
}
function mvDraw(p, reveal, Bshown) {
  const D = MV_DIR[mvDir], K = homeOf();
  if (!p) { $('mvTitle').textContent = `${D.name} · level ${mvLevel}`; $('mvSub').textContent = 'press Play'; mvEls = drawPhrase($('mvSvg'), ePhrase({ notes: [{ t: 0, d: 2, s: 0, kind: '' }], chords: eChords(K, [[0, D.fr], [2, D.to]]) })); return; }
  const B = Bshown != null ? Bshown : p.B, pl = mvPlace(p, B);
  const notes = [{ t: 0, d: 2, s: pl.a, kind: 'tone' }];
  if (pl.b != null) notes.push({ t: 2, d: 2, s: pl.b, kind: 'home' });
  const ph = ePhrase({ notes, chords: eChords(K, [[0, D.fr], [2, D.to]]) });
  mvEls = drawPhrase($('mvSvg'), ph);
  if (!reveal && typeof clearCards === 'function') clearCards($('mvView'));
  if (!reveal && mvEls[1]) { const t = mvEls[1].querySelector('text'); if (t) t.textContent = '?'; const s = mvEls[1].querySelector('text.t'); if (s) s.textContent = ''; const lw = mvEls[1].querySelector('text.b'); if (lw) lw.textContent = ''; }
}
async function playMoves() {
  stopAll(); await audio();
  const my = token; playing = true; $('playBtn').textContent = '■ Stop';
  const K = homeOf(), dir = mvDir, D = MV_DIR[dir], b = beat();
  const round = () => {
    const p = mvPick(); if (!p) return null;
    let B = p.B, top = null; if (B == null) { top = mvTopArrival(dir, p.A); B = top ? top.B : mod(D.to + 7, 12); }
    const pl = mvPlace(p, B), name = p.B == null ? `${KT[relTo(p.A, D.fr)]} of the ${chordWord(D.fr)} → your choice` : mvName(dir, p);
    const sup = mvSupport === 'full' ? {} : mvSupport === 'bass' ? { bassOnly: true } : { silent: true };
    // 1) the first chord with the starting note, 2) the next chord with no melody (you sing), 3) the next chord with the arrival
    const ask = ePhrase({ notes: [{ t: 0, d: 2, s: pl.a, kind: 'tone' }], chords: eChords(K, [[0, D.fr], [2, D.to, sup]]) }); ask.len = 4;
    const ans = ePhrase({ notes: [{ t: 0, d: 2, s: pl.a, kind: 'tone' }, { t: 2, d: 2, s: pl.b, kind: 'home' }], chords: eChords(K, [[0, D.fr], [2, D.to]]) }); ans.len = 4;
    const real = mvReal(dir, { A: p.A, B }), L = real.length ? real[Math.floor(Math.random() * real.length)] : null;
    const steps = [{ ph: ask, kind: 'ask' }, { ph: ans, kind: 'ans' }];
    if ($('mvContrast').checked && p.B != null) {   // the same start with another arrival, to feel the difference
      const alt = mvPairs(dir, mvLevel === 1 ? 2 : 1).concat(mvPairs(dir, mvLevel === 2 ? 3 : 2)).filter(q => q.A === p.A && q.B !== p.B);
      if (alt.length) { const q = alt[Math.floor(Math.random() * alt.length)], ql = mvPlace(q, q.B);
        const ph = ePhrase({ notes: [{ t: 0, d: 2, s: ql.a, kind: 'tone' }, { t: 2, d: 2, s: ql.b, kind: 'home' }], chords: eChords(K, [[0, D.fr], [2, D.to]]) }); ph.len = 4;
        steps.push({ ph, kind: 'alt', q }); }
    }
    if (L) steps.push({ ph: ePhrase({ lick: L, chords: L.chords }), kind: 'real', L });
    return engRound(steps.map(st => ({ ph: st.ph, asPlayed: !!(st.L && st.L.asPlayed), els: () => mvEls, slow: st.kind === 'real', pad: st.kind === 'ask' ? 0 : 2,
      show: () => {
        if (st.kind === 'ask') { mvCur = p; favButton($('mvFav'), null); $('mvRated').textContent = ''; mvDraw(p, false, B); $('mvTitle').textContent = name; $('mvSub').textContent = p.B == null ? 'sing any note on the new chord' : 'sing the arrival when the chord changes';
          $('mvLabel').value = mvLabels[mvKey(dir, p)] || ''; $('mvLabel').placeholder = `Your word for ${mvName(dir, p)}`;
          readout(`Sing <b>${esc(p.B == null ? 'your own arrival' : KT[relTo(B, D.to)] + ' of the ' + chordWord(D.to))}</b> when the chord changes.`); }
        if (st.kind === 'ans') { mvDraw(p, true, B); $('mvSub').textContent = p.B == null ? (top ? `most often the players went to ${KT[relTo(B, D.to)]} of the ${chordWord(D.to)} (${top.n} of ${top.total})` : 'no examples yet') : `${D.to ? KT[relTo(B, D.to)] + ' of the IV is ' + KT[mod(B, 12)] + ' of the key · ' : ''}${mvLevel === 1 ? 'the same note, now the ' + mvColour(dir, p) + ' · ' : ''}did you hit it? ✓ or ✗`;
          readout(`<b>${esc(KT[relTo(B, D.to)])} of the ${chordWord(D.to)}</b>. Rate it: ✓ or ✗.`); }
        if (st.kind === 'alt') { mvEls = drawPhrase($('mvSvg'), st.ph); $('mvSub').textContent = `compare: ${mvName(dir, st.q)}`; readout(`Compare: <b>${esc(mvName(dir, st.q))}</b>`); }
        if (st.kind === 'real') { mvEls = drawPhrase($('mvSvg'), st.ph); favButton($('mvFav'), st.L, `${mvName(dir, { A: p.A, B })} · Moves`); $('mvSub').textContent = `in a real line, from the gold note to the green one: ${st.L.src} · bar ${st.L.bar}${st.L.antic ? ' · arrives early' : ''}`; readout(`The same move in <b>${esc(st.L.src)}</b>.`); }
      } })));
  };
  engStart(round);
}
document.addEventListener('click', e => {
  const d = e.target.closest('#mvDirSeg button'); if (d) { mvDir = d.dataset.d; store.set('bv.mvDir', mvDir); mvOnly = null; stopAll(); renderMoves(); return; }
  const s = e.target.closest('#mvSupSeg button'); if (s) { mvSupport = s.dataset.s; store.set('bv.mvSupport', mvSupport); setSeg('mvSupSeg', 's', mvSupport); return; }
  const l = e.target.closest('#mvLevels .chip'); if (l) { mvLevel = +l.dataset.l; store.set('bv.mvLevel', mvLevel); mvOnly = null; stopAll(); renderMoves(); return; }
  const p = e.target.closest('#mvPairs .chip'); if (p) { mvOnly = mvOnly === p.dataset.k ? null : p.dataset.k; renderMovesList(); return; }
  if (e.target.closest('#mvYes')) { mvRate(true); return; }
  if (e.target.closest('#mvNo')) { mvRate(false); return; }
});
document.addEventListener('input', e => { if (e.target.id === 'mvLabel' && mvCur) { const k = mvKey(mvDir, mvCur), v = e.target.value.trim(); if (v) mvLabels[k] = v; else delete mvLabels[k]; store.set('bv.mvLabels', mvLabels); renderMovesList(); } });
renderAll();
engNav();
