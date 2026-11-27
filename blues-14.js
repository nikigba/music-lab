/* 1 → 4: a focused app (blues.html?focus=14). One drill at a time, like Triad Home Base:
   a destination (where the line starts on the I → its first note on the IV) and a path (how it gets there),
   ranked by how often the players in your library do it. Built examples, then real licks, then your turn, then home. */
const F14 = new URLSearchParams(location.search).get('focus') === '14';
const PATH_SETS = {   // semitones above the key, for the built examples
  'Triad: I': [0, 4, 7], 'Triad: vi': [9, 0, 4], 'Triad: vi°': [9, 0, 3], 'Triad: IV': [5, 9, 0], 'Triad: ii': [2, 5, 9],
  'Arpeggio: I7': [0, 4, 7, 10], 'Blues scale': [0, 3, 5, 6, 7, 10], 'Major blues / pentatonic': [0, 2, 3, 4, 7, 9], 'Scale run': [0, 2, 4, 5, 7, 9, 10],
};
let f14Sel = store.get('bv.f14Sel', null), f14Drills = null, f14Els = [];
// the main path of a line: its longest card (triad, arpeggio, scale, approach note, riff)
function f14PathOf(L) {
  const cards = rlCards(L).filter(c => c.kind !== 'other' || c.title.startsWith('Riff'));
  if (!cards.length) return null;
  const c = cards.sort((a, b) => (b.j - b.i) - (a.j - a.i) || (a.kind === 'triad' ? -1 : 1))[0];
  if (c.kind === 'triad' || c.kind === 'arp') return c.title;
  if (c.kind === 'pent') return 'Major blues / pentatonic';
  if (c.kind === 'other') return 'Riff';
  return c.title;   // Blues scale, Scale run, Approach note
}
function f14Build() {
  const all = (RL || (RL = rlFindAll())).up, map = new Map();
  all.forEach(L => { const p = f14PathOf(L); if (!p) return; const k = `${L.A}|${L.B}|${p}`; if (!map.has(k)) map.set(k, { A: L.A, B: L.B, path: p, lines: [] }); map.get(k).lines.push(L); });
  return [...map.values()].sort((a, b) => b.lines.length - a.lines.length);
}
const f14Key = d => `${d.A}|${d.B}|${d.path}`;
const f14Name = d => `${KT[d.A]} of the I → ${KT[d.B]} of the IV`;
const f14InKey = d => `${KT[d.A]} → ${KT[mod(d.B + 5, 12)]} in the key`;
// a built line from the starting note to the arrival, travelling on the path
function f14Line(d, variant) {
  const a0 = d.A, bPc = mod(d.B + 5, 12);
  let a = a0 > 9 ? a0 - 12 : a0;
  const near = (pc, from, dir) => { let best = null; for (let m = from - 9; m <= from + 9; m++) if (mod(m, 12) === pc && (!dir || Math.sign(m - from) === dir || m === from)) if (best == null || Math.abs(m - from) < Math.abs(best - from)) best = m; return best; };
  let b = near(bPc, a);
  const path = [a];
  if (d.path === 'Approach note') {
    if (variant % 2 && b !== a) path.push(b + 1, b - 1); else path.push(b - 1 === a ? b + 1 : b - 1);
  } else if (d.path === 'Riff') {
    const n = variant % 2 ? a + 2 : a - (mod(a, 12) === 0 ? 2 : 1);
    path.push(n, a, n);
  } else {
    const set = PATH_SETS[d.path] || PATH_SETS['Scale run'], inSet = m => set.includes(mod(m, 12));
    const scaleLike = ['Blues scale', 'Major blues / pentatonic', 'Scale run'].includes(d.path);
    // go away from the arrival first when start and arrival are the same note (or variant asks), then come back to it
    let dir = b === a || variant % 2 ? (variant % 2 ? -1 : 1) : Math.sign(b - a), cur = a, turned = false;
    for (let n = 0; n < 7; n++) {
      let nx = null; for (let m = cur + dir; Math.abs(m - cur) <= 7; m += dir) if (inSet(m)) { nx = m; break; }
      if (nx == null) break;
      path.push(nx); cur = nx;
      const away = Math.abs(cur - a) >= (scaleLike ? 4 : 7);
      if (!turned && (b === a || variant % 2) && away) { dir = -dir; turned = true; continue; }
      if ((turned || !(b === a || variant % 2)) && Math.abs(cur - b) <= (scaleLike ? 2 : 4) && n >= 1) break;
    }
    b = near(bPc, cur);
  }
  // eighth notes that end on beat 4 of the I bar; the arrival on beat 1 of the IV, or early on the "and" of 4
  const early = variant >= 2, k = path.length, start = Math.max(0, 4 - k * 0.5 - (early ? 0.5 : 0));
  const notes = path.map((s, j) => ({ t: start + j * 0.5, d: 0.5, s, kind: j === 0 ? 'tone' : '' }));
  notes.push({ t: start + k * 0.5, d: 2, s: b, kind: 'home', land: true });
  return { notes, early };
}
function renderF14() {
  if (!LIB) return;
  if (!f14Drills) f14Drills = f14Build();
  if (f14Sel && !f14Drills.some(d => f14Key(d) === f14Sel)) f14Sel = null;
  if (!f14Sel && f14Drills.length) f14Sel = f14Key(f14Drills[0]);
  const top = f14Drills.slice(0, 24);
  $('f14List').innerHTML = top.map((d, x) => `<button class="f14d${f14Key(d) === f14Sel ? ' on' : ''}" data-k="${esc(f14Key(d))}"><span class="n">${x + 1}</span><span class="tx"><b>${esc(f14Name(d))}</b> <i>via ${esc(d.path.replace(/^Triad: /, 'the ').replace(/^Arpeggio: /, 'the ') + (d.path.startsWith('Triad') ? ' triad' : d.path.startsWith('Arpeggio') ? ' arpeggio' : ''))}</i><small>${esc(f14InKey(d))}</small></span><span class="c">${d.lines.length}</span></button>`).join('');
  const d = f14Drills.find(x => f14Key(x) === f14Sel);
  if (d && !playing) { const ln = f14Line(d, 0); f14Els = drawPhrase($('f14Svg'), ePhrase({ notes: ln.notes, chords: eChords(homeOf(), [[0, 0], [4, 5]]) })); $('f14Title').textContent = f14Name(d); $('f14Sub').textContent = `via ${d.path} · ${d.lines.length} real line${d.lines.length === 1 ? '' : 's'} in your solos`; }
}
async function playF14() {
  stopAll(); await audio();
  const d = f14Drills && f14Drills.find(x => f14Key(x) === f14Sel); if (!d) return;
  const K = homeOf(); let round = 0, li = 0;
  // focus tunes (Music Lab sidebar): each real line is drawn from solos on them 70% of the time
  const lines = (window.MusicLab && MusicLab.focus) ? MusicLab.focus.mix(d.lines, L => L.src) : d.lines.slice().sort(() => Math.random() - 0.5);
  const make = () => {
    const variant = round++ % 4, ln = f14Line(d, variant), L = lines[li++ % lines.length];
    const home = ePhrase({ notes: eHome('triad', 'all', 0), chords: eChords(K, [[0, 0]]) });
    const iv = ePhrase({ notes: eHome('triad', 'all', 5), chords: eChords(K, [[0, 5]]) });
    let aS = d.A > 9 ? d.A - 12 : d.A, bS = null; for (let m = aS - 7; m <= aS + 7; m++) if (mod(m - d.B - 5, 12) === 0) if (bS == null || Math.abs(m - aS) < Math.abs(bS - aS)) bS = m;
    const two = ePhrase({ notes: [{ t: 0, d: 2, s: aS, kind: 'tone' }, { t: 2, d: 2, s: bS, kind: 'home' }], chords: eChords(K, [[0, 0], [2, 5]]) });
    const built = ePhrase({ notes: ln.notes, chords: eChords(K, [[0, 0], [4, 5]]) });
    const real = ePhrase({ lick: L, chords: L.chords }), sl = 1 / (+$('lickSpeed').value || 1);
    const show = (ph, title, sub, fav) => () => { $('f14Title').textContent = title; $('f14Sub').textContent = sub; f14Els = drawPhrase($('f14Svg'), ph); favButton($('f14Fav'), fav || null, fav ? `${f14Name(d)} via ${d.path} · 1 → 4` : ''); readout(`<b>${esc(title)}</b>${sub ? ' · ' + esc(sub) : ''}`); };
    const steps = [
      { ph: home, els: () => f14Els, show: show(home, 'Home', `${keyOf(K)[0]}7`) },
      { ph: iv, pad: 2, els: () => f14Els, show: show(iv, 'The IV', `${chordName(K, { pc: mod(K + 5, 12), q: 'dom' })}: where you're going`) },
      { ph: two, pad: 2, els: () => f14Els, show: show(two, 'The two notes', `${f14Name(d)} (${f14InKey(d)})`) },
      { ph: built, pad: 2, els: () => f14Els, show: show(built, `Via ${d.path}`, ln.early ? 'arriving early, on the "and" of 4' : 'arriving on beat 1') },
      { ph: real, slow: true, asPlayed: L.asPlayed, pad: 2, els: () => f14Els, show: show(real, 'In a real line', `${L.src} · bar ${L.bar}`, L) },
    ];
    if ($('homeGap').checked) steps.push({ ph: { notes: [], chords: real.chords.map(c => Object.assign({}, c, { at: c.at * sl })), len: Math.ceil(real.len * sl / 4) * 4, K, minor: false, homeAt: null }, els: () => [], show: () => { $('f14Title').textContent = 'Your turn'; $('f14Sub').textContent = 'the two notes, then a line of your own on the same path'; readout('<b>Your turn</b>'); } });
    return engRound(steps);
  };
  engStart(make);
}
document.addEventListener('click', e => {
  const b = e.target.closest('#f14List .f14d'); if (b) { f14Sel = b.dataset.k; store.set('bv.f14Sel', f14Sel); stopAll(); renderF14(); }
});
document.addEventListener('click', e => {
  const b = e.target.closest('#f14Fav'); if (!b || !b._f || !window.MusicLab || !MusicLab.favs) return;
  MusicLab.favs.toggle(b._f); const on = favOn(b._f); b.classList.toggle('saved', on); b.textContent = on ? '★ Saved' : '☆ Save lick';
});
window.addEventListener('load', () => { if (window.MusicLab && MusicLab.onChange) MusicLab.onChange(() => { f14Drills = null; }); });
if (F14) {
  document.body.classList.add('focus14'); document.title = '1 → 4';
  document.querySelector('.wrap > h1').textContent = '1 → 4';
  document.querySelector('.wrap > .sub').textContent = 'From the I to the IV, one drill at a time. Each drill is two notes, where the line starts on the I and its first note on the IV, and the path between them. The most common ones in your solos come first.';
  tab = 'f14'; setTab('f14');
}
