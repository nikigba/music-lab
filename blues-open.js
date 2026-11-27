/* Blues Vocab: Opening statements (Ear exercise 1). The first phrase of every blues chorus:
   from its first note (a pickup in bar 12 counts) to the first breath of a beat or more. */
let OPENS = null, opStart = store.get('bv.opStart', 'all'), opLen = store.get('bv.opLen', 'all'), opPos = store.get('bv.opPos', 'all'), opSel = -1, opShown = 40, opEls = [];
const OP_MAX = 24;   // phrases are cut after 6 bars
const OP_LEN = [['all', 'any length'], ['s', 'under a bar'], ['m', '1–2 bars'], ['l', '2–4 bars'], ['x', 'longer']];
const OP_POS = [['all', 'anywhere'], ['pickup', 'pickup (bar 12)'], ['one', 'on beat 1'], ['bar1', 'later in bar 1'], ['later', 'after bar 1']];
const opLenOf = O => O.bars4 < 1 ? 's' : O.bars4 <= 2 ? 'm' : O.bars4 <= 4 ? 'l' : 'x';
function opFindAll() {
  const out = []; if (!LIB) return out;
  for (const c of LIB.choruses) {
    if (c.minor) continue;
    const N = c.notes.map(x => ({ t: x[0], d: x[1], m: x[2] })).sort((a, b) => a.t - b.t);
    let i = N.findIndex(n => n.t >= -2); if (i < 0) continue;
    // the phrase ends at the first breath: a rest of half a beat, a held note with a little space after it, or two beats between notes
    // or a held note (a beat or more, twice as long as the notes before it) that closes a run of at least four notes:
    // many transcriptions write no rest there, but you hear the line stop
    const breath = (j, s) => { const n = N[j], nx = N[j + 1], rest = nx.t - (n.t + n.d);
      if (rest >= 0.5 || (n.d >= 1 && rest >= 0.25) || nx.t - n.t >= 2) return true;
      if (j - s >= 4 && n.d >= 1) { const prev = N.slice(j - 4, j), avg = prev.reduce((a, x) => a + x.d, 0) / 4; if (n.d >= 2 * avg) return true; }
      return false; };
    const phraseEnd = s => { let j = s; while (j + 1 < N.length && !breath(j, s)) j++; return j; };
    let j = phraseEnd(i);
    if (N[j].t + N[j].d < 0.5) { i = j + 1; if (i >= N.length) continue; j = phraseEnd(i); }   // a pickup that stops before bar 1 is not the opening
    if (N[i].t > 8) continue;   // nothing in the first two bars: no opening statement here
    let long = false; while (j > i && N[j].t >= N[i].t + OP_MAX) { j--; long = true; }
    const ph = N.slice(i, j + 1), t0 = Math.floor(ph[0].t + 1e-6), end = ph[ph.length - 1].t + ph[ph.length - 1].d;
    const chords = [];
    for (let bar = 1; bar <= Math.min(12, Math.floor((end - 1e-6) / 4) + 1); bar++) (c.bars[bar - 1] || []).forEach(x => chords.push({ at: (bar - 1) * 4 + x.t - t0, pc: x.r, q: x.q }));
    if (!chords.length) chords.push({ at: -t0, pc: c.K, q: 'dom' });
    const f = ph[0].t, pos = f < -0.01 ? 'pickup' : Math.abs(f) < 0.1 ? 'one' : f < 4 ? 'bar1' : 'later';
    out.push({ notes: ph.map((n, k) => ({ t: Math.round((n.t - t0) * 1e4) / 1e4, d: Math.round(n.d * 1e4) / 1e4, m: n.m, kind: k === 0 ? 'tone' : '' })),
      chords, K: c.K, soloId: c.soloId, src: `${c.name}${c.of > 1 ? ' · chorus ' + c.no : ''}`, asPlayed: AS_PLAYED.has(c.soloId),
      start: mod(ph[0].m - c.K, 12), pos, long, bars4: (end - f) / 4, bar: Math.max(1, Math.floor(f / 4) + 1), bars: [Math.max(1, Math.floor(f / 4) + 1), Math.floor((ph[ph.length - 1].t) / 4) + 1] });
  }
  const seen = new Set();
  return out.filter(O => { const s = O.notes.map(n => mod(n.m - O.K, 12) + '@' + Math.round(n.t * 4)).join(','); if (seen.has(s)) return false; seen.add(s); return true; });
}
const opAll = () => (OPENS || (OPENS = opFindAll()));
const opList = () => opAll().filter(O => (opStart === 'all' || O.start === opStart) && (opLen === 'all' || opLenOf(O) === opLen) && (opPos === 'all' || O.pos === opPos));
function renderOpen() {
  const all = opAll(), okL = O => opLen === 'all' || opLenOf(O) === opLen, okP = O => opPos === 'all' || O.pos === opPos, okS = O => opStart === 'all' || O.start === opStart;
  const sc = {}; all.filter(O => okL(O) && okP(O)).forEach(O => sc[O.start] = (sc[O.start] || 0) + 1);
  if (opStart !== 'all' && !sc[opStart]) opStart = 'all';
  $('opStartRow').innerHTML = `<span class="rl">Starts on</span><button class="chip" data-s="all" aria-pressed="${opStart === 'all'}">any note <small>${all.filter(O => okL(O) && okP(O)).length}</small></button>` +
    toneOrder(sc).map(st => `<button class="chip" data-s="${st}" aria-pressed="${st === opStart}">${esc(KT[st])} <small>${sc[st]}</small></button>`).join('');
  $('opLenRow').innerHTML = `<span class="rl">Length</span>` + OP_LEN.map(([k, n]) => `<button class="chip" data-l="${k}" aria-pressed="${k === opLen}">${n} <small>${all.filter(O => okS(O) && okP(O) && (k === 'all' || opLenOf(O) === k)).length}</small></button>`).join('');
  $('opPosRow').innerHTML = `<span class="rl">Comes in</span>` + OP_POS.map(([k, n]) => `<button class="chip" data-p="${k}" aria-pressed="${k === opPos}">${n} <small>${all.filter(O => okS(O) && okL(O) && (k === 'all' || O.pos === k)).length}</small></button>`).join('');
  const list = opList(), v = $('opView'); if (v.parentElement === $('opList')) $('opList').before(v);
  $('opList').innerHTML = list.slice(0, opShown).map(O => {
    const k = all.indexOf(O), ph = ePhrase({ lick: O, chords: O.chords }), f = lickFav(O, '');
    const toks = ph.notes.map(n => degOf(ph.K, n.ch, n.midi, numMode)).join(' ');
    return `<div class="cell${k === opSel ? ' sel' : ''}" data-k="${k}"><div class="tk">${toks}${O.long ? ' …' : ''}</div><div class="btns"><button class="mini fv${favOn(f) ? ' saved' : ''}" data-a="fav">${favOn(f) ? '★' : '☆'}</button><button class="mini" data-a="play">▶</button></div>
      <div class="meta"><span class="tag">starts on ${esc(KT[O.start])}</span><span class="tag">${esc(OP_POS.find(p => p[0] === O.pos)[1])}</span><b>${esc(O.src)}</b> · ${O.bars4 < 1 ? 'under a bar' : '~' + Math.round(O.bars4 * 2) / 2 + ' bars'}${O.long ? ' (keeps going)' : ''} · played in ${keyOf(O.K)[0]}</div></div>`;
  }).join('') || '<p class="note">No opening statements with these settings.</p>';
  $('opMore').hidden = list.length <= opShown; $('opMore').textContent = `Show more (${list.length - opShown})`;
  if (opSel >= 0 && all[opSel] && !v.hidden && list.includes(all[opSel])) opShow(opSel, false); else v.hidden = true;
}
function opTitle(O) { return `Opening · starts on ${KT[O.start]}`; }
function opShow(k, scroll) {
  const O = opAll()[k], ph = ePhrase({ lick: O, chords: O.chords }), v = $('opView');
  v.hidden = false;
  const cell = $('opList').querySelector(`.cell[data-k="${k}"]`); if (cell && cell.previousElementSibling !== v) { const top = cell.getBoundingClientRect().top; cell.before(v); window.scrollBy(0, cell.getBoundingClientRect().top - top); }
  if (scroll) v.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  $('opTitle').textContent = `${opTitle(O)} · in ${keyOf(ph.K)[0]}`; $('opSub').textContent = O.src;
  opEls = drawPhrase($('opSvg'), ph);
  return ph;
}
// one opening, once (tapped in the list)
async function playOpen(k) {
  stopAll(); await audio();
  const O = opAll()[k]; if (!O) return; opSel = k;
  document.querySelectorAll('#opList .cell').forEach(x => x.classList.toggle('sel', +x.dataset.k === k));
  const ph = opShow(k, true), my = token; playing = true; $('playBtn').textContent = '■ Stop';
  curAsPlayed = O.asPlayed; TEMPO_SCALE = 1 / (+$('lickSpeed').value || 1);
  const end = schedule(ph, ctx.currentTime + 0.08, () => opEls, my);
  TEMPO_SCALE = 1; curAsPlayed = false;
  at(end, () => { if (my !== token) return; playing = false; $('playBtn').textContent = '▶ Play'; });
  readout(`<b>${esc(O.src)}</b>: how it opens.`);
}
// Play: one opening after another, each with time to sing it back
async function playOpens() {
  stopAll(); await audio();
  const pool = opList(); if (!pool.length) return;
  let last = null;
  const round = () => {
    const solos = [...new Set(pool.map(O => O.soloId))];
    let s = solos[Math.floor(Math.random() * solos.length)]; if (solos.length > 1) while (s === last) s = solos[Math.floor(Math.random() * solos.length)];
    last = s; const mine = pool.filter(O => O.soloId === s), O = mine[Math.floor(Math.random() * mine.length)], K = homeOf();
    const ph = ePhrase({ lick: O, chords: O.chords }), sl = 1 / (+$('lickSpeed').value || 1);
    const steps = [
      { ph: ePhrase({ notes: eHome('triad', 'all', 0), chords: eChords(K, [[0, 0]]) }), pad: 2, els: () => opEls, show: () => { $('opView').hidden = false; $('opList').before($('opView')); $('opTitle').textContent = 'Home'; $('opSub').textContent = `${keyOf(K)[0]}7 · then an opening`; opEls = drawPhrase($('opSvg'), ePhrase({ notes: eHome('triad', 'all', 0), chords: eChords(K, [[0, 0]]) })); favButton($('opFav'), null); readout('<b>Home</b>, then how a chorus opens.'); } },
      { ph, slow: true, asPlayed: O.asPlayed, pad: 2, els: () => opEls, show: () => { $('opTitle').textContent = opTitle(O); $('opSub').textContent = `${O.src}${O.long ? ' · keeps going after this' : ''}`; opEls = drawPhrase($('opSvg'), ph); favButton($('opFav'), O, `Opening · ${O.src.split(' · ')[0]}`); readout(`How <b>${esc(O.src)}</b> opens.`); } },
    ];
    if ($('homeGap').checked) steps.push({ ph: { notes: [], chords: ph.chords.map(c => Object.assign({}, c, { at: c.at * sl })), len: Math.ceil(ph.len * sl / 4) * 4, K, minor: false, homeAt: null }, els: () => [], show: () => { $('opTitle').textContent = 'Your turn'; $('opSub').textContent = 'sing it back, or answer it'; readout('<b>Your turn</b>: sing it back, or answer it.'); } });
    return engRound(steps);
  };
  engStart(round);
}
document.addEventListener('click', e => {
  const s = e.target.closest('#opStartRow .chip'); if (s) { opStart = s.dataset.s === 'all' ? 'all' : +s.dataset.s; store.set('bv.opStart', opStart); opSel = -1; opShown = 40; stopAll(); renderOpen(); return; }
  const l = e.target.closest('#opLenRow .chip'); if (l) { opLen = l.dataset.l; store.set('bv.opLen', opLen); opSel = -1; opShown = 40; stopAll(); renderOpen(); return; }
  const p = e.target.closest('#opPosRow .chip'); if (p) { opPos = p.dataset.p; store.set('bv.opPos', opPos); opSel = -1; opShown = 40; stopAll(); renderOpen(); return; }
  if (e.target.closest('#opMore')) { opShown += 60; renderOpen(); return; }
  const cell = e.target.closest('#opList .cell'); if (!cell) return;
  const k = +cell.dataset.k;
  if (e.target.closest('[data-a="fav"]')) { const O = opAll()[k], f = lickFav(O, `Opening · ${O.src.split(' · ')[0]}`); if (window.MusicLab && MusicLab.favs) { MusicLab.favs.toggle(f); const b = e.target.closest('[data-a="fav"]'), on = favOn(f); b.classList.toggle('saved', on); b.textContent = on ? '★' : '☆'; } return; }
  playOpen(k);
});
window.addEventListener('load', () => { if (window.MusicLab && MusicLab.onChange) MusicLab.onChange(() => { OPENS = null; }); });
renderAll();
