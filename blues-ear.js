/* Blues Vocab: the Ear exercises and the ii–V chapters.
   Loaded after the page's main script and uses its helpers (schedule, drawPhrase, LIB, CHORUS_BY, fitsBB, homeOf…). */

/* ======================= Ear exercises ======================= */
// Ideas are semitones above the chord's root. Scale ideas are always in the key: over the IV it is still the key's blues scale.
const E_FAM = {
  triad: { name: 'Triad', tones: [0, 4, 7], home: [0, 4, 7, 12], ideas: [['b3', '+ ♭3', 3], ['2', '+ 2', 2], ['4', '+ 4', 5], ['b5', '+ ♭5', 6], ['6', '+ 6', 9], ['b7', '+ ♭7', 10]] },
  arp: { name: 'Arpeggio 1 3 5 ♭7', tones: [0, 4, 7, 10], home: [0, 4, 7, 10], ideas: [['b3', '+ ♭3', 3], ['9', '+ 9', 2], ['4', '+ 4', 5], ['b5', '+ ♭5', 6], ['6', '+ 6', 9]] },
  scale: { name: 'Scale', ideas: [['blues', 'Blues scale', [0, 3, 5, 6, 7, 10]], ['major', 'Major blues', [0, 2, 3, 4, 7, 9]]] },
};
// 1: one chord. 2: from the I into the IV. 3: from the IV back to the I. 4–6: the ii–Vs.
const E_EX = { 1: 'Opening statements', 2: 'I → IV', 3: 'IV → I' };
// which chord a lick starts on and which it arrives on, in semitones above the key
const E_FROM = { 1: 0, 2: 0, 3: 5 }, E_TO = { 2: 5, 3: 0 };
let eEx = store.get('bv.eEx', 1), eFam = store.get('bv.eFam', 'triad'), eIdea = store.get('bv.eIdea', 'all');
let eStart = store.get('bv.eStart', 'all'), eArrive = store.get('bv.eArrive', 'all');
// exercises 2–3: "two notes" (the skeleton: last note on one chord, first note on the next) or "with ideas"
let eMode = store.get('bv.eMode', 'skel');
const skelMode = () => (eEx === 2 || eEx === 3) && eMode === 'skel';
if (!store.get('bv.eEx2', false)) { if (eEx >= 2) eEx++; store.set('bv.eEx', eEx); store.set('bv.eEx2', true); }   // "I → IV" was added as exercise 2
if (!E_FAM[eFam]) eFam = 'triad';
let E_LICKS = null;   // {"ex|fam|idea": [licks]}
const ICT = [0, 4, 7, 10];   // chord tones of a dominant 7th

// licks from every blues chorus: the piece that uses the idea, in its real rhythm.
// Exercise 2 pieces sit on the I and run into their first note on the IV; exercise 3 pieces sit on the IV and are cut at their first chord tone of the I.
function eFindAll() {
  const out = {}; const push = (k, L) => (out[k] = out[k] || []).push(L);
  if (!LIB) return out;
  for (const c of LIB.choruses) {
    if (c.minor) continue;
    const N = c.notes.map(x => ({ t: x[0], d: x[1], m: x[2] })).sort((a, b) => a.t - b.t);
    const isI = i => c.bars[i - 1] && c.bars[i - 1].length && c.bars[i - 1].every(x => mod(x.r - c.K, 12) === 0);
    const isIV = i => c.bars[i - 1] && c.bars[i - 1].length && c.bars[i - 1].every(x => mod(x.r - c.K, 12) === 5);
    const regions = [];
    // bar 4 (and 12) lead somewhere else, so they don't count as home
    const home = i => isI(i) && i !== 4 && i !== 12;
    for (let i = 1; i <= 12; i++) if (home(i)) { let j = i; while (j + 1 <= 12 && home(j + 1)) j++; regions.push({ ex: 1, a: (i - 1) * 4, z: j * 4, root: 0 }); i = j; }
    if (isI(1) && isIV(2)) regions.push({ ex: 2, a: 0, z: 4, root: 0, land: 4 });
    if (isIV(2) && isI(3)) regions.push({ ex: 3, a: 4, z: 8, root: 5, land: 8 });
    if (isIV(5) && isIV(6) && isI(7)) regions.push({ ex: 3, a: 16, z: 24, root: 5, land: 24 });
    // the skeleton: a line that starts on one chord and runs without a breath into the next.
    // What counts is where it starts on the first chord and its first note on the next one.
    for (const [ex, b1, b2, land, from] of [[2, 1, 2, 4, 0], [3, 2, 3, 8, 4], [3, 6, 7, 24, 16]]) {   // bar 4 → 5 is the ii–V into the IV: exercise 4
      const fr = E_FROM[ex], to = E_TO[ex];
      const okFrom = ex === 2 ? isI(b1) : isIV(b1) && (b1 !== 6 || isIV(5)), okTo = ex === 2 ? isIV(b2) : isI(b2);
      if (!okFrom || !okTo) continue;
      const k = N.findIndex(n => n.t >= land - 0.5 - 1e-6 && n.t < land + 1); if (k < 1) continue;
      const B = N[k]; if (B.t - (N[k - 1].t + N[k - 1].d) > 0.55 || N[k - 1].t < from - 0.5) continue;
      // back to where the line starts on the first chord (no rest longer than half a beat)
      let a = k - 1; while (a > 0 && N[a - 1].t >= from - 0.5 && N[a].t - (N[a - 1].t + N[a - 1].d) <= 0.55) a--;
      const A = N[a], t0 = Math.floor(A.t + 1e-6), frPc = mod(c.K + fr, 12), toPc = mod(c.K + to, 12);
      push(`${ex}|skel|pair`, { bars: [Math.max(1, Math.floor(A.t / 4) + 1), b2], start: mod(A.m - frPc, 12), arrive: mod(B.m - toPc, 12),
        notes: N.slice(a, k + 1).map((n, j, arr) => ({ t: Math.round((n.t - t0) * 1e4) / 1e4, d: Math.round(n.d * 1e4) / 1e4, m: n.m, kind: j === arr.length - 1 ? 'home' : j === 0 ? 'tone' : '' })),
        chords: [{ at: 0, pc: frPc, q: 'dom' }, { at: Math.max(0, land - t0), pc: toPc, q: 'dom' }], K: c.K, soloId: c.soloId,
        src: `${c.name}${c.of > 1 ? ' · chorus ' + c.no : ''}`, bar: Math.max(1, Math.floor(A.t / 4) + 1), asPlayed: AS_PLAYED.has(c.soloId), antic: B.t < land - 0.01 });
    }
    for (const R of regions) {
      const idx = []; N.forEach((n, k) => { if (n.t >= R.a - 1e-6 && n.t < R.z - 1e-6) idx.push(k); });
      if (idx.length < 4) continue;
      const rootPc = mod(c.K + R.root, 12), relC = n => mod(n.m - rootPc, 12), relK = n => mod(n.m - c.K, 12);
      const toPc = R.ex === 1 ? null : mod(c.K + E_TO[R.ex], 12);
      const runs = []; let cur = [];
      idx.forEach(k => { const p = cur.length ? N[cur[cur.length - 1]] : null; if (p && N[k].t - (p.t + p.d) > 0.55) { runs.push(cur); cur = []; } cur.push(k); });
      if (cur.length) runs.push(cur);
      const finish = (ks, fam, idea, isAdded) => {
        let list = ks.slice();
        if (R.ex !== 1) {   // carry on into the next chord: the first note there (ex 2) or the first chord tone of the I (ex 3)
          let k = list[list.length - 1], extra = 0, land = null;
          while (extra <= 4) {
            k++; const n = N[k]; if (!n) break;
            const p = N[k - 1]; if (n.t - (p.t + p.d) > 0.55) break;
            if (n.t >= R.land - 0.5 && n.t < R.land + 2 && (R.ex === 2 || ICT.includes(relK(n)))) { land = k; break; }
            if (n.t >= R.land + 2) break;
            extra++;
          }
          if (land == null) return;
          for (let j = list[list.length - 1] + 1; j <= land; j++) list.push(j);
        }
        const t0 = Math.floor(N[list[0]].t + 1e-6), last = N[list[list.length - 1]];
        const notes = list.map((k, j) => { const n = N[k], end = R.ex !== 1 && j === list.length - 1;
          return { t: Math.round((n.t - t0) * 1e4) / 1e4, d: Math.round(n.d * 1e4) / 1e4, m: n.m, kind: end ? 'home' : isAdded(n) ? 'tone' : '' }; });
        const chords = [{ at: 0, pc: rootPc, q: 'dom' }];
        if (R.ex !== 1) chords.push({ at: Math.max(0, R.land - t0), pc: toPc, q: 'dom', bassOnly: true });
        push(`${R.ex}|${fam}|${idea}`, { bars: [Math.max(1, Math.floor(N[list[0]].t / 4) + 1), Math.floor(last.t / 4) + 1], start: relC(N[list[0]]), arrive: R.ex === 1 ? null : mod(last.m - toPc, 12), notes, chords, K: c.K, soloId: c.soloId,
          src: `${c.name}${c.of > 1 ? ' · chorus ' + c.no : ''}`, bar: Math.max(1, Math.floor(N[list[0]].t / 4) + 1), asPlayed: AS_PLAYED.has(c.soloId) });
      };
      for (const run of runs) {
        if (run.length < 4) continue;
        for (const fam of ['triad', 'arp']) {
          const F = E_FAM[fam];
          for (const [id, , iv] of F.ideas) {
            const allowed = new Set([...F.tones, iv]); let k = 0;
            while (k < run.length) {
              if (!allowed.has(relC(N[run[k]]))) { k++; continue; }
              let e = k; while (e + 1 < run.length && allowed.has(relC(N[run[e + 1]]))) e++;
              const seg = run.slice(k, e + 1); k = e + 1;
              if (seg.length < 4) continue;
              let best = null;
              for (let a = 0; a < seg.length; a++) for (let b = a + 3; b < seg.length && b - a < 8; b++) {
                const w = seg.slice(a, b + 1), rs = new Set(w.map(x => relC(N[x])));
                if (!F.tones.every(x => fam === 'arp' && x === 7 ? true : rs.has(x)) || !rs.has(iv)) continue;
                if (relC(N[w[0]]) === iv || relC(N[w[w.length - 1]]) === iv) continue;
                // going into the next chord, prefer the piece that ends closest to it
                const better = !best || (R.ex === 2 ? (w[w.length - 1] > best[best.length - 1] || (w[w.length - 1] === best[best.length - 1] && w.length < best.length)) : w.length < best.length);
                if (better) best = w;
              }
              if (!best) continue;
              const heard = best.some((x, j) => j && relC(N[x]) !== iv && relC(N[best[j - 1]]) !== iv && Math.abs(N[x].m - N[best[j - 1]].m) >= 3);
              if (!heard) continue;
              finish(best, fam, id, n => relC(n) === iv);
            }
          }
        }
        for (const [id, , sc] of E_FAM.scale.ideas) {
          let k = 0;
          while (k < run.length) {
            if (!sc.includes(relK(N[run[k]]))) { k++; continue; }
            let e = k; while (e + 1 < run.length && sc.includes(relK(N[run[e + 1]])) && Math.abs(N[run[e + 1]].m - N[run[e]].m) <= 3) e++;
            let seg = run.slice(k, e + 1); k = e + 1;
            if (R.ex === 1) while (seg.length && !ICT.includes(relK(N[seg[seg.length - 1]]))) seg.pop();
            if (seg.length < 5) continue;
            if (seg.length > 10) seg = seg.slice(seg.length - 10);
            const pcs = new Set(seg.map(x => relK(N[x])));
            if (id === 'blues' && !((pcs.has(6) || pcs.has(5)) && (pcs.has(3) || pcs.has(10)))) continue;
            if (id === 'major' && !((pcs.has(2) || pcs.has(9)) && pcs.has(3) && pcs.has(4))) continue;
            finish(seg, 'scale', id, n => [3, 6].includes(relK(n)));
          }
        }
      }
    }
  }
  for (const key in out) { const seen = new Set(); out[key] = out[key].filter(L => { const s = L.notes.map(n => mod(n.m - L.K, 12) + '@' + Math.round(n.t * 4)).join(','); if (seen.has(s)) return false; seen.add(s); return true; }); }
  return out;
}
const eLicksAll = (ex, fam, idea) => { if (!E_LICKS) E_LICKS = eFindAll(); return E_LICKS[`${ex}|${fam}|${idea}`] || []; };
// licks for an idea that start (and arrive) on the chosen notes, each measured from its own chord's root
const eLicks = (ex, fam, idea) => eLicksAll(ex, fam, idea).filter(L => (eStart === 'all' || L.start === eStart) && (eArrive === 'all' || L.arrive === eArrive));
const chordWord = rel => rel === 5 ? 'IV' : 'I';
const eToneName = (st, rel) => `${KT[st]}${eEx === 1 ? '' : ' of the ' + chordWord(rel)}${rel ? ' (' + KT[mod(st + rel, 12)] + ' of the key)' : ''}`;

// built examples, in semitones above the key's 1
function eBuilt(ex, fam, idea) {
  const R = E_FROM[ex], out = [];
  if (fam === 'scale') {
    const runs = idea === 'blues' ? [[10, 7, 6, 5, 3], [0, 3, 5, 6, 7, 10, 7], [7, 6, 5, 3, 0]] : [[9, 7, 4, 3, 2], [0, 2, 3, 4, 7, 9, 7], [4, 3, 2, 0, -3]];
    let r = runs[Math.floor(Math.random() * runs.length)].slice();
    if (eStart !== 'all') { const sk = mod(eStart + R, 12), sc = E_FAM.scale.ideas.find(x => x[0] === idea)[2]; if (sc.includes(sk)) { const up = sc.filter(x => x > sk).slice(0, 4); r = [sk, ...up, ...up.slice(0, -1).reverse()]; } }
    r.forEach((s, j) => out.push({ t: j * 0.5, d: 0.5, s, kind: [3, 6].includes(mod(s, 12)) ? 'tone' : '' }));
  } else {
    const F = E_FAM[fam], iv = F.ideas.find(x => x[0] === idea)[2];
    const set = [...F.tones, iv].sort((a, b) => a - b);
    let line;
    if (eStart !== 'all' && set.includes(eStart) && eStart !== iv) { const i = set.indexOf(eStart); line = [...set.slice(i), ...set.slice(0, i).map(x => x + 12)]; line.push(line[0] + 12); }
    else { line = [...set]; if (!F.tones.includes(line[line.length - 1]) || line[line.length - 1] < 12) line.push(12); if (Math.random() < 0.5) line = line.reverse(); }
    line.forEach((x, j) => out.push({ t: j * 0.5, d: 0.5, s: R + x, kind: x === iv ? 'tone' : '' }));
  }
  const last = out[out.length - 1];
  if (ex === 1) { last.d = 1.5; return out; }
  // into the next chord: the chosen note there, or the nearest of its chord tones (by half step if there is one)
  const to = E_TO[ex], want = eArrive !== 'all' ? [eArrive] : ICT;
  let best = null; for (let m = last.s - 6; m <= last.s + 6; m++) if (want.includes(mod(m - to, 12)) && m !== last.s) if (best == null || Math.abs(m - last.s) < Math.abs(best - last.s)) best = m;
  if (best == null) best = last.s;
  out.push({ t: last.t + 0.5, d: 2, s: best, kind: 'home', land: true });
  return out;
}
const eHome = (fam, idea, R) => fam === 'scale'
  ? [...E_FAM.scale.ideas.find(x => x[0] === (idea === 'all' ? 'blues' : idea))[2], 12].map((s, j) => ({ t: j * 0.5, d: 0.5, s, kind: '' }))
  : E_FAM[fam].home.map((x, j) => ({ t: j, d: 1, s: R + x, kind: '' }));

function ePhrase(spec) {
  const K = homeOf(); let base = 60 + mod(K - 60, 12); if (base > 65) base -= 12;
  const chords = spec.chords.map(c => Object.assign({}, c));
  const chAt = q => { let r = chords[0]; for (const c of chords) if (c.at <= q + 1e-6) r = c; return r; };
  let notes;
  if (spec.lick) {
    const L = spec.lick; let d = mod(K - L.K, 12); if (d > 6) d -= 12;
    const avg = L.notes.reduce((a, n) => a + n.m + d, 0) / L.notes.length; if (avg > 79) d -= 12; if (avg < 55) d += 12;
    chords.forEach(c => c.pc = mod(c.pc + d, 12));
    notes = L.notes.map(n => ({ q: n.t, dur: n.d, midi: n.m + d, ch: null, kind: n.kind }));
  } else notes = spec.notes.map(n => ({ q: n.t, dur: n.d, midi: base + n.s, ch: null, kind: n.kind }));
  notes.forEach(n => n.ch = n.kind === 'home' && chords.length > 1 ? chords[chords.length - 1] : chAt(n.q));
  const end = Math.max(...notes.map(n => n.q + n.dur), 1);
  // whole bars, but a line that ends right on a bar line doesn't get an empty bar added
  let len = Math.max(4, Math.ceil(end / 4 - 1e-6) * 4);
  // a chord that starts at (or after) the end still gets heard: at least two beats of it, even when the line arrives early and stops
  const lastAt = Math.max(...chords.map(c => c.at));
  if (lastAt > len - 2) len = lastAt + 2;
  return { notes, chords, len, K, minor: false, homeAt: null };
}
const eChords = (K, list) => list.map(([at, rel, extra]) => Object.assign({ at, pc: mod(K + rel, 12), q: 'dom' }, extra || {}));

// chord tones of the chord first (1 3 5), then everything else by how often it comes up
const toneOrder = cnt => Object.keys(cnt).map(Number).sort((a, b) => ([0, 4, 7].indexOf(a) + 1 || 9) - ([0, 4, 7].indexOf(b) + 1 || 9) || cnt[b] - cnt[a]);
let eEls = [];
function renderEar() {
  if (typeof engNav === 'function') engNav();
  if (!LIB) return;
  if (!IIV_ITEMS) IIV_ITEMS = iivFindAll();
  if (!(eEx >= 1 && eEx <= 6)) eEx = 1;
  $('exSeg').innerHTML = [[1, `1 · Opening statements <small>${typeof opAll === 'function' ? opAll().length : ''}</small>`], [2, '2 · I → IV'], [3, '3 · IV → I'], ...IIV.map((c, i) => [i + 4, `${i + 4} · ${c.name} <small>${(IIV_ITEMS[c.id] || []).length}</small>`])]
    .map(([k, n]) => `<button class="chip big" data-ex="${k}" aria-pressed="${k === eEx}">${n}</button>`).join('');
  $('eTri').style.display = eEx >= 4 || eEx === 1 ? 'none' : 'contents'; $('eIIV').style.display = eEx >= 4 ? 'flex' : 'none'; $('eOpen').style.display = eEx === 1 ? 'flex' : 'none';
  if (eEx >= 4) { ivCh = IIV[eEx - 4].id; $('ivChaps').style.display = 'none'; renderIIV(); return; }
  if (eEx === 1) { if (typeof renderOpen === 'function') renderOpen(); return; }
  const sk = skelMode();
  const lg = (c, t) => `<span style="--c:var(--${c})">${t}</span>`;
  $('hLegend').innerHTML = sk ? lg('home', `where the line starts on the ${chordWord(E_FROM[eEx])}`) + lg('good', `its first note on the ${chordWord(E_TO[eEx])}`)
    : eEx === 1 ? lg('home', "the idea's note") : lg('home', "the idea's note") + lg('good', eEx === 2 ? 'arriving on the IV' : 'landing on the I');
  $('eModeSeg').innerHTML = eEx === 1 ? '' : [['skel', 'Two notes: the skeleton'], ['ideas', 'With ideas']].map(([k, n]) => `<button data-m="${k}" aria-pressed="${k === eMode}">${n}</button>`).join('');
  $('eModeSeg').style.display = eEx === 1 ? 'none' : '';
  // 1) the notes: where the line starts (and in 2–3, its first note on the next chord), "all" by default
  const every = sk ? eLicksAll(eEx, 'skel', 'pair').map(L => Object.assign({ fam: 'skel', idea: 'pair' }, L))
    : Object.entries(E_FAM).flatMap(([f, F]) => F.ideas.flatMap(([id]) => eLicksAll(eEx, f, id).map(L => Object.assign({ fam: f, idea: id }, L))));
  const okA = L => eArrive === 'all' || L.arrive === eArrive, okS = L => eStart === 'all' || L.start === eStart;
  const sc = {}; every.filter(okA).forEach(L => sc[L.start] = (sc[L.start] || 0) + 1);
  if (eStart !== 'all' && !sc[eStart]) eStart = 'all';
  const fromRel = E_FROM[eEx], toRel = E_TO[eEx];
  $('eStartChips').innerHTML = `<span class="rl">${eEx === 1 ? 'Starts on' : 'Starts on the ' + chordWord(fromRel)}</span><button class="chip" data-s="all" aria-pressed="${eStart === 'all'}">all <small>${every.filter(okA).length}</small></button>` +
    toneOrder(sc).map(st => `<button class="chip" data-s="${st}" aria-pressed="${st === eStart}">${esc(KT[st])} <small>${sc[st]}</small></button>`).join('');
  if (eEx === 1) { $('eArriveChips').innerHTML = ''; eArrive = 'all'; }
  else {
    const ac = {}; every.filter(okS).forEach(L => ac[L.arrive] = (ac[L.arrive] || 0) + 1);
    if (eArrive !== 'all' && !ac[eArrive]) eArrive = 'all';
    $('eArriveChips').innerHTML = `<span class="rl">${eEx === 2 ? 'First note on the IV' : sk ? 'First note on the I' : 'Lands on the I'}</span><button class="chip" data-a="all" aria-pressed="${eArrive === 'all'}">all <small>${every.filter(okS).length}</small></button>` +
      toneOrder(ac).map(st => `<button class="chip" data-a="${st}" aria-pressed="${st === eArrive}">${esc(KT[st])} <small>${ac[st]}</small></button>`).join('');
  }
  const sel = every.filter(L => okS(L) && okA(L)), filtered = eStart !== 'all' || eArrive !== 'all';
  if (sk) {
    $('eFamChips').innerHTML = ''; $('eIdeaChips').innerHTML = '';
    const ant = sel.filter(L => L.antic).length;
    $('eNote').innerHTML = `Before any idea: <b>where the line starts on the ${chordWord(fromRel)}, and its first note on the ${chordWord(toRel)}</b>. Each round plays those two notes over the two chords, then a real line from your solos that starts on the first (gold) and runs into the second (green), then your turn: sing the two notes, then sing the line. ${sel.length} crossings${filtered ? ' with these notes' : ''}; ${sel.length ? Math.round(100 * ant / sel.length) : 0}% of them arrive early, on the "and" of 4.`;
    if (!playing) { $('hTitle').textContent = `${E_EX[eEx]} · two notes`; $('hSub').textContent = `${sel.length} real crossings`; eEls = drawPhrase($('hSvg'), ePhrase({ notes: eHome('triad', 'all', 0), chords: eChords(homeOf(), [[0, 0]]) })); }
    return;
  }
  // 2) the ideas those licks use
  const famCnt = f => sel.filter(L => L.fam === f).length;
  if (filtered && !famCnt(eFam)) { const f = Object.keys(E_FAM).find(famCnt); if (f) { eFam = f; eIdea = 'all'; } }
  $('eFamChips').innerHTML = Object.entries(E_FAM).map(([k, f]) => `<button class="chip big" data-f="${k}" aria-pressed="${k === eFam}">${esc(f.name)} <small>${famCnt(k)}</small></button>`).join('');
  const F = E_FAM[eFam], cnt = id => sel.filter(L => L.fam === eFam && L.idea === id).length;
  if (eIdea !== 'all' && (!F.ideas.some(x => x[0] === eIdea) || (filtered && !cnt(eIdea)))) eIdea = 'all';
  const total = famCnt(eFam);
  $('eIdeaChips').innerHTML = `<button class="chip" data-i="all" aria-pressed="${eIdea === 'all'}">All <small>${total}</small></button>` +
    F.ideas.filter(([id]) => !filtered || cnt(id)).map(([id, n]) => `<button class="chip" data-i="${id}" aria-pressed="${id === eIdea}">${esc(n)} <small>${cnt(id)}</small></button>`).join('');
  $('eNote').innerHTML = eEx === 1
    ? `Home is the I7. <b>${eFam === 'scale' ? 'Home is the scale itself' : eFam === 'arp' ? 'Home is the I7 arpeggio, 1 3 5 ♭7' : 'Home is the I triad, 1 3 5'}</b>, played clean. Then the idea, then a real lick from your solos that uses it, then your turn, then home again.`
    : eEx === 2
    ? `The move from 1 to 4. Home on the I7, then the IV ${eFam === 'scale' ? 'with the same blues scale over it' : 'with its own ' + (eFam === 'arp' ? 'arpeggio' : 'triad')}, so you know where you're going. Then a line that <b>starts on the I</b> with the idea and <b>arrives on the IV</b> (only the IV's root under its first note), from bar 1 → 2 (bar 4 → 5 is really the ii–V into the IV: exercise 4). Then your turn, then home.`
    : `And back: home on the I7, then the IV. Then a line that starts on the IV with the idea and <b>lands on a chord tone of the I</b>, from bar 2 → 3 or bar 6 → 7, with only the I's root under it. Then your turn, then home.`;
  if (!playing) { $('hTitle').textContent = E_EX[eEx]; $('hSub').textContent = `${sel.length} real licks${filtered ? ' with these notes' : ''}`; eEls = drawPhrase($('hSvg'), ePhrase({ notes: eHome(eFam, eIdea, 0), chords: eChords(homeOf(), [[0, 0]]) })); }
}
document.addEventListener('click', e => {
  const s = e.target.closest('#exSeg button'); if (s) { const was = eEx; eEx = +s.dataset.ex; store.set('bv.eEx', eEx); if (eEx !== was) { ivPre = ivDom = 'all'; ivSel = -1; ivShown = 40; eStart = eArrive = 'all'; store.set('bv.eStart', 'all'); store.set('bv.eArrive', 'all'); } stopAll(); renderEar(); return; }
  const f = e.target.closest('#eFamChips .chip'); if (f) { eFam = f.dataset.f; eIdea = 'all'; store.set('bv.eFam', eFam); store.set('bv.eIdea', eIdea); stopAll(); renderEar(); return; }
  const i = e.target.closest('#eIdeaChips .chip'); if (i) { eIdea = i.dataset.i; store.set('bv.eIdea', eIdea); stopAll(); renderEar(); return; }
  const st = e.target.closest('#eStartChips .chip'); if (st) { eStart = st.dataset.s === 'all' ? 'all' : +st.dataset.s; store.set('bv.eStart', eStart); stopAll(); renderEar(); return; }
  const md = e.target.closest('#eModeSeg button'); if (md) { eMode = md.dataset.m; store.set('bv.eMode', eMode); eStart = eArrive = 'all'; store.set('bv.eStart', 'all'); store.set('bv.eArrive', 'all'); stopAll(); renderEar(); return; }
  const ar = e.target.closest('#eArriveChips .chip'); if (ar) { eArrive = ar.dataset.a === 'all' ? 'all' : +ar.dataset.a; store.set('bv.eArrive', eArrive); stopAll(); renderEar(); }
});
let eLastSolo = null;
function ePickLick(ex, fam, idea) {
  let pool = eLicks(ex, fam, idea); if (!pool.length) return null;
  try { if (window.MusicLab && MusicLab.focus) pool = MusicLab.focus.prefer(pool, L => L.src); } catch (e) {}   // focus tunes: 70/30 toward solos on them
  const solos = [...new Set(pool.map(L => L.soloId))];
  let s = solos[Math.floor(Math.random() * solos.length)]; if (solos.length > 1) while (s === eLastSolo) s = solos[Math.floor(Math.random() * solos.length)];
  eLastSolo = s; const mine = pool.filter(L => L.soloId === s); return mine[Math.floor(Math.random() * mine.length)];
}
function eShow(ph, title, sub, hide) {
  $('hTitle').textContent = title; $('hSub').textContent = sub;
  eEls = drawPhrase($('hSvg'), ph);
  if (hide && typeof clearCards === 'function') clearCards($('hView'));
  if (hide) ph.notes.forEach((n, j) => { if (n.kind === 'tone' && eEls[j]) { const t = eEls[j].querySelector('text'); if (t) t.textContent = '?'; const s = eEls[j].querySelector('text.t'); if (s) s.textContent = ''; const lw = eEls[j].querySelector('text.b'); if (lw) lw.textContent = ''; } });
}
async function playEar() {
  stopAll(); await audio();
  const my = token; playing = true; $('playBtn').textContent = '■ Stop';
  const K = homeOf(), I = [[0, 0]], fam = eFam, ex = eEx;
  if (skelMode()) return playSkel(my);
  const round = () => {
    let ideas = E_FAM[fam].ideas.map(x => x[0]); if (eStart !== 'all' || eArrive !== 'all') { const w = ideas.filter(id => eLicks(ex, fam, id).length); if (w.length) ideas = w; }
    const idea = eIdea === 'all' ? ideas[Math.floor(Math.random() * ideas.length)] : eIdea;
    const iName = E_FAM[fam].ideas.find(x => x[0] === idea)[1], hide = $('eHide').checked;
    const steps = [];
    steps.push({ ph: ePhrase({ notes: eHome(fam, idea, 0), chords: eChords(K, I) }), title: 'Home', sub: `${keyOf(K)[0]}7 · ${fam === 'scale' ? iName : fam === 'arp' ? '1 3 5 ♭7' : '1 3 5'}` });
    if (ex !== 1) steps.push({ ph: ePhrase({ notes: eHome(fam, idea, fam === 'scale' ? 0 : 5), chords: eChords(K, [[0, 5]]) }), title: 'The IV', sub: `${chordName(K, { pc: mod(K + 5, 12), q: 'dom' })} · ${fam === 'scale' ? 'the same scale over the IV' : 'its own ' + (fam === 'arp' ? 'arpeggio' : 'triad')}` });
    const built = eBuilt(ex, fam, idea), landAt = built.find(n => n.land);
    const bChords = ex === 1 ? eChords(K, I) : eChords(K, [[0, E_FROM[ex]], [landAt.t, E_TO[ex], { bassOnly: true }]]);
    steps.push({ ph: ePhrase({ notes: built, chords: bChords }), title: `The idea: ${iName}`, sub: ex === 1 ? 'on the I7' : ex === 2 ? 'on the I, into the IV' : 'on the IV, landing on the I', hide });
    const L = ePickLick(ex, fam, idea);
    if (L) steps.push({ ph: ePhrase({ lick: L, chords: L.chords }), title: `${iName} in a real lick`,
      sub: `${eToneName(L.start, E_FROM[ex])}${ex === 1 ? '' : ' → ' + eToneName(L.arrive, E_TO[ex])} · ${L.src} · bar ${L.bar}`, hide, lick: L });
    if ($('homeGap').checked) { const lastSt = steps[steps.length - 1], last = lastSt.ph, sl = lastSt.lick ? 1 / (+$('lickSpeed').value || 1) : 1; steps.push({ ph: { notes: [], chords: last.chords.map(c => Object.assign({}, c, { bassOnly: false, at: c.at * sl })), len: Math.ceil(last.len * sl / 4) * 4, K, minor: false, homeAt: null }, title: 'Your turn', sub: 'sing it or play it back', gap: true }); }
    steps.push({ ph: ePhrase({ notes: eHome(fam, idea, 0), chords: eChords(K, I) }), title: 'Home', sub: 'back where you started', reveal: true });
    return engRound(steps.map((st, si) => ({ ph: st.ph, asPlayed: !!(st.lick && st.lick.asPlayed), els: () => st.gap ? [] : eEls, slow: !!st.lick, pad: st.gap || (ex === 2 && si === 0) ? 0 : 2,
      show: () => { if (!st.gap) eShow(st.ph, st.title, st.sub, st.hide); else { $('hTitle').textContent = st.title; $('hSub').textContent = st.sub; }
        if (st.lick) favButton($('hFav'), st.lick, `${iName} · ${E_EX[ex]}`); else if (st.title === 'Home' && !st.reveal) favButton($('hFav'), null);
        readout(st.reveal && hide ? `It was <b>${esc(iName)}</b>.` : st.lick ? `<b>${esc(iName)}</b> from ${esc(st.lick.src)}, bar ${st.lick.bar}.` : `<b>${esc(st.title)}</b>`); } })));
  };
  engStart(round);
}

// two notes over two chords, then a real line that makes the same move
function playSkel(my) {
  const K = homeOf(), ex = eEx, fr = E_FROM[ex], to = E_TO[ex];
  const round = () => {
    const L = ePickLick(ex, 'skel', 'pair');
    const A = L ? L.start : eStart !== 'all' ? eStart : 4, B = L ? L.arrive : eArrive !== 'all' ? eArrive : ex === 2 ? 10 : 4;
    let aS = mod(fr + A, 12); if (aS > 9) aS -= 12;
    let bS = null; for (let m = aS - 7; m <= aS + 7; m++) if (mod(m - to, 12) === B) if (bS == null || Math.abs(m - aS) < Math.abs(bS - aS)) bS = m;
    const inKey = (x, rel) => rel ? ` (${KT[mod(x + rel, 12)]} of the key)` : '';
    const name = `starts on the ${chordWord(fr)}: ${KT[A]}${inKey(A, fr)} → first note on the ${chordWord(to)}: ${KT[B]}${inKey(B, to)}`;
    const steps = [];
    steps.push({ ph: ePhrase({ notes: eHome('triad', 'all', 0), chords: eChords(K, [[0, 0]]) }), title: 'Home', sub: `${keyOf(K)[0]}7`, nopad: ex === 2 });
    if (ex === 2) steps.push({ ph: ePhrase({ notes: eHome('triad', 'all', 5), chords: eChords(K, [[0, 5]]) }), title: 'The IV', sub: `${chordName(K, { pc: mod(K + 5, 12), q: 'dom' })} · its triad` });
    steps.push({ ph: ePhrase({ notes: [{ t: 0, d: 2, s: aS, kind: 'tone' }, { t: 2, d: 2, s: bS, kind: 'home' }], chords: eChords(K, [[0, fr], [2, to]]) }), title: 'The move', sub: name });
    if (L) steps.push({ ph: ePhrase({ lick: L, chords: L.chords }), title: 'In a real line', sub: `starts on ${KT[A]} (gold), first note on the ${chordWord(to)} ${KT[B]} (green) · ${L.src} · bar ${L.bar}${L.antic ? ' · arrives early' : ''}`, lick: L });
    if ($('homeGap').checked) { const lastSt = steps[steps.length - 1], last = lastSt.ph, sl = lastSt.lick ? 1 / (+$('lickSpeed').value || 1) : 1; steps.push({ ph: { notes: [], chords: last.chords.map(c => Object.assign({}, c, { at: c.at * sl })), len: Math.ceil(last.len * sl / 4) * 4, K, minor: false, homeAt: null }, title: 'Your turn', sub: 'sing the two notes, then the line', gap: true }); }
    steps.push({ ph: ePhrase({ notes: eHome('triad', 'all', 0), chords: eChords(K, [[0, 0]]) }), title: 'Home', sub: 'back where you started' });
    return engRound(steps.map(st => ({ ph: st.ph, asPlayed: !!(st.lick && st.lick.asPlayed), els: () => st.gap ? [] : eEls, slow: !!st.lick, pad: st.gap || st.nopad ? 0 : 2,
      show: () => { if (!st.gap) eShow(st.ph, st.title, st.sub, false); else { $('hTitle').textContent = st.title; $('hSub').textContent = st.sub; }
        if (st.lick) favButton($('hFav'), st.lick, `${KT[A]} → ${KT[B]} · ${E_EX[ex]}`); else if (st.title === 'Home' && st.sub !== 'back where you started') favButton($('hFav'), null);
        readout(st.lick ? `<b>${esc(name)}</b> in ${esc(st.lick.src)}.` : `<b>${esc(st.title)}</b>${st.title === 'The move' ? ': ' + esc(name) : ''}`); } })));
  };
  engStart(round);
}

/* ---------- saving a real lick to ★ Favorite licks (as a Blues Vocab favorite) ---------- */
function lickFav(L, title) {
  const sig = L.src + '|' + L.notes.map(n => mod(n.m - L.K, 12) + '@' + Math.round(n.t * 4)).join(',');
  let h = 2166136261; for (let i = 0; i < sig.length; i++) { h ^= sig.charCodeAt(i); h = Math.imul(h, 16777619); }
  const hl = []; L.notes.forEach((n, j) => { if (n.kind === 'tone' || n.kind === 'home') hl.push(j); });
  const last = L.notes[L.notes.length - 1];
  return { id: 'e' + (h >>> 0).toString(36), app: 'blues', title, src: L.src, asPlayed: !!L.asPlayed,
    item: { K: L.K, n: L.notes.map(n => [n.t, n.d, n.m, 0]), ch: L.chords.map(c => ({ t: c.at, r: c.pc, q: c.q })), hl, bars: L.bars || [L.bar, L.bar + Math.floor(last.t / 4)] } };
}
const favOn = f => !!(window.MusicLab && MusicLab.favs && MusicLab.favs.has(f.id));
function favButton(btn, L, title) {
  if (!L) { btn.hidden = true; btn._f = null; return; }
  btn._f = lickFav(L, title); btn.hidden = false;
  const on = favOn(btn._f); btn.classList.toggle('saved', on); btn.textContent = on ? '★ Saved' : '☆ Save lick';
}
document.addEventListener('click', e => {
  const b = e.target.closest('#hFav, #mvFav'); if (!b || !b._f || !window.MusicLab || !MusicLab.favs) return;
  MusicLab.favs.toggle(b._f); const on = favOn(b._f); b.classList.toggle('saved', on); b.textContent = on ? '★ Saved' : '☆ Save lick';
});

/* ======================= ii–V chapters ======================= */
// where each ii–V sits in the form; pre = the minor chord (or where it would be), dom = the dominant, then the landing
const IIV = [
  { id: 'iv4', name: 'Bar 4 → 5 · into the IV', short: 'Bar 4 → 5', pre: { rel: 7, q: 'min', rom: 'v' }, dom: { rel: 0, q: 'dom', rom: 'I7' }, target: { rel: 5, q: 'dom', rom: 'IV7' }, start: 12, land: 16, need: [4, 5],
    note: 'Home turns into the V of the IV. Most charts just write I7 in bar 4, so the v is often only implied by the notes: listen for the ♭7 of the key and how the line falls a half step into the IV’s 3.' },
  { id: 'iv8', name: 'Bar 8 → 9 · into the ii', short: 'Bar 8 → 9', pre: { rel: 4, q: 'min', rom: 'iii' }, dom: { rel: 9, q: 'dom', rom: 'VI7' }, target: { rel: 2, q: 'min', rom: 'ii' }, start: 28, land: 32, need: [8, 9],
    note: 'iii–VI7 → ii: a little ii–V into the ii. The VI7’s 3rd (♯5 of the key) is the note that pulls up into the ii.' },
  { id: 'iv9', name: 'Bars 9–10 → 11 · ii–V–I', short: 'Bars 9–10 → 11', pre: { rel: 2, q: 'min', rom: 'ii' }, dom: { rel: 7, q: 'dom', rom: 'V7' }, target: { rel: 0, q: 'dom', rom: 'I7' }, start: 32, land: 40, need: [9, 10, 11],
    note: 'The big one: a bar of ii, a bar of V, home in bar 11. Guide tones: the ii’s 7th (1 of the key) slides down to the V’s 3rd (7 of the key), which rises back to 1.' },
];
const PRE_CAT = { triad: 'm triad', arp7: 'm7 arpeggio', '3579': '3-5-7-9', scale: 'scale', other: 'other', few: 'few notes' };
const DOM_CAT = { tt: 'tritone sub', alt: 'altered', b9: '♭9 / diminished', bebop: 'bebop scale', arp: 'arpeggio', triad: 'triad', scale: 'scale', other: 'other', few: 'few notes' };
const stepShare = ns => { if (ns.length < 2) return 0; let s = 0; for (let i = 1; i < ns.length; i++) if (Math.abs(ns[i].m - ns[i - 1].m) <= 2) s++; return s / (ns.length - 1); };
function catMinor(ns, root) {
  if (ns.length < 2) return 'few';
  const r = ns.map(n => mod(n.m - root, 12)), S = new Set(r), out = (set) => r.filter(x => !set.includes(x)).length / r.length;
  if ([3, 7, 10, 2].filter(x => S.has(x)).length >= 3 && S.has(2) && S.has(10) && r.filter(x => x === 0).length <= 1) return '3579';
  if ([0, 3, 7, 10].filter(x => S.has(x)).length >= 3 && S.has(10) && out([0, 3, 7, 10]) <= 1 / 3) return 'arp7';
  if ([0, 3, 7].every(x => S.has(x)) && out([0, 3, 7]) <= 1 / 3) return 'triad';
  if (stepShare(ns) >= 0.6) return 'scale';
  return 'other';
}
function catDom(ns, root) {
  if (ns.length < 2) return 'few';
  const r = ns.map(n => mod(n.m - root, 12)), S = new Set(r), out = (set) => r.filter(x => !set.includes(x)).length / r.length;
  if ([1, 5, 8, 11].filter(x => S.has(x)).length >= 3 && S.has(1) && S.has(5)) return 'tt';
  // altered only when two different altered notes are on a beat or held, not passing notes
  const strong = new Set(); ns.forEach((n, j) => { const x = r[j]; if ([1, 3, 6, 8].includes(x) && (Math.abs(n.t - Math.round(n.t)) < 0.05 || n.d >= 0.5)) strong.add(x); });
  if (strong.size >= 2) return 'alt';
  if (S.has(1) && [4, 7, 10, 1].filter(x => S.has(x)).length >= 3) return 'b9';
  if (ns.length >= 5 && S.has(11) && S.has(10) && stepShare(ns) >= 0.7) return 'bebop';
  if ([0, 4, 7, 10].filter(x => S.has(x)).length >= 3 && S.has(10) && out([0, 4, 7, 10]) <= 1 / 3) return 'arp';
  if ([0, 4, 7].every(x => S.has(x)) && out([0, 4, 7]) <= 1 / 3) return 'triad';
  if (stepShare(ns) >= 0.6) return 'scale';
  return 'other';
}
let IIV_ITEMS = null;
function iivFindAll() {
  const out = { iv4: [], iv8: [], iv9: [] };
  if (!LIB) return out;
  for (const c of LIB.choruses) {
    if (c.minor) continue;
    const N = c.notes.map(x => ({ t: x[0], d: x[1], m: x[2] })).sort((a, b) => a.t - b.t);
    for (const ch of IIV) {
      if (!ch.need.every(i => fitsBB(c, i))) continue;
      // where the dominant starts: from the chart if it splits the bar, otherwise halfway (the minor chord is implied)
      let split;
      if (ch.id === 'iv9') split = 36;
      else { const bi = ch.start / 4, bs = c.bars[bi] || [], dom = bs.find(x => mod(x.r - c.K, 12) === ch.dom.rel && x.t > 0.01); split = ch.start + (dom ? Math.min(3, dom.t) : 2); if (bs.length === 1 && mod(bs[0].r - c.K, 12) === ch.pre.rel) continue; }
      const implied = ch.id !== 'iv9' && !(c.bars[ch.start / 4] || []).some(x => mod(x.r - c.K, 12) === ch.pre.rel);
      const body = N.filter(n => n.t >= ch.start - 0.5 && n.t < ch.land - 0.5);
      if (body.length < 4) continue;
      const land = N.find(n => n.t >= ch.land - 0.5 && n.t < ch.land + 1.5);
      const preN = body.filter(n => n.t < split - 0.25), domN = body.filter(n => n.t >= split - 0.25);
      const preRoot = mod(c.K + ch.pre.rel, 12), domRoot = mod(c.K + ch.dom.rel, 12);
      const notes = land ? [...body, land] : body, t0 = Math.floor(notes[0].t + 1e-6);
      out[ch.id].push({
        ch: ch.id, pre: catMinor(preN, preRoot), dom: catDom(domN, domRoot), implied,
        notes: notes.map(n => ({ t: Math.round((n.t - t0) * 1e4) / 1e4, d: Math.round(n.d * 1e4) / 1e4, m: n.m, kind: n === land ? 'home' : '' })),
        chords: [{ at: Math.max(0, ch.start - t0), pc: preRoot, q: 'min' }, { at: split - t0, pc: domRoot, q: 'dom' }, { at: ch.land - t0, pc: mod(c.K + ch.target.rel, 12), q: ch.target.q }],
        K: c.K, soloId: c.soloId, src: `${c.name}${c.of > 1 ? ' · chorus ' + c.no : ''}`, asPlayed: AS_PLAYED.has(c.soloId), bars: [ch.need[0], ch.need[ch.need.length - 1]],
      });
    }
  }
  for (const k in out) { const seen = new Set(); out[k] = out[k].filter(L => { const s = L.notes.map(n => mod(n.m - L.K, 12) + '@' + Math.round(n.t * 4)).join(','); if (seen.has(s)) return false; seen.add(s); return true; }); }
  return out;
}
let ivCh = store.get('bv.ivCh', 'iv9'), ivPre = 'all', ivDom = 'all', ivSel = -1, ivShown = 40, ivEls = [];
const ivItems = () => { if (!IIV_ITEMS) IIV_ITEMS = iivFindAll(); return IIV_ITEMS[ivCh] || []; };
function ivPhrase(L) { return ePhrase({ lick: L, chords: L.chords }); }
function renderIIV() {
  if (!LIB) return;
  if (!IIV.some(c => c.id === ivCh)) ivCh = 'iv9';
  if (!IIV_ITEMS) IIV_ITEMS = iivFindAll();
  const ch = IIV.find(c => c.id === ivCh), all = ivItems(), K = homeOf();
  $('ivChaps').innerHTML = IIV.map(c => `<button class="chip big" data-c="${c.id}" aria-pressed="${c.id === ivCh}">${esc(c.name)} <small>${(IIV_ITEMS[c.id] || []).length}</small></button>`).join('');
  const preName = `${ch.pre.rom}${ch.id !== 'iv9' ? ' (often implied)' : ''}`;
  $('ivNote').innerHTML = `${ch.note} <span style="color:var(--dim)">The labels are worked out from the notes, so some will be off: tap ▶ and trust your ears.</span>`;
  const rowCount = (key, val, other, oval) => all.filter(L => (val === 'all' || L[key] === val) && (oval === 'all' || L[other] === oval)).length;
  const order = (cats, key) => Object.keys(cats).filter(k => all.some(L => L[key] === k)).sort((a, b) => all.filter(L => L[key] === b).length - all.filter(L => L[key] === a).length);
  if (ivPre !== 'all' && !all.some(L => L.pre === ivPre)) ivPre = 'all';
  if (ivDom !== 'all' && !all.some(L => L.dom === ivDom)) ivDom = 'all';
  $('ivPreRow').innerHTML = `<span class="rl">On the ${esc(preName)}</span>` + [['all', 'all'], ...order(PRE_CAT, 'pre').map(k => [k, PRE_CAT[k]])].map(([k, n]) => `<button class="chip" data-p="${k}" aria-pressed="${k === ivPre}">${esc(n)} <small>${rowCount('pre', k, 'dom', ivDom)}</small></button>`).join('');
  $('ivDomRow').innerHTML = `<span class="rl">On the ${esc(ch.dom.rom)}</span>` + [['all', 'all'], ...order(DOM_CAT, 'dom').map(k => [k, DOM_CAT[k]])].map(([k, n]) => `<button class="chip" data-d="${k}" aria-pressed="${k === ivDom}">${esc(n)} <small>${rowCount('dom', k, 'pre', ivPre)}</small></button>`).join('');
  const list = all.filter(L => (ivPre === 'all' || L.pre === ivPre) && (ivDom === 'all' || L.dom === ivDom));
  const v = $('ivView'); if (v.parentElement === $('ivList')) $('ivList').before(v);
  $('ivList').innerHTML = list.slice(0, ivShown).map(L => {
    const k = all.indexOf(L), ph = ivPhrase(L);
    const toks = ph.notes.map(n => degOf(ph.K, n.ch, n.midi, numMode)).join(' ');
    return `<div class="cell${k === ivSel ? ' sel' : ''}" data-k="${k}"><div class="tk">${toks}</div><div class="btns"><button class="mini fv${favOn(lickFav(L, '')) ? ' saved' : ''}" data-a="fav">${favOn(lickFav(L, '')) ? '★' : '☆'}</button><button class="mini" data-a="play">▶</button></div>
      <div class="meta"><span class="tag">${esc(ch.pre.rom)}: ${esc(PRE_CAT[L.pre])}</span><span class="tag">${esc(ch.dom.rom)}: ${esc(DOM_CAT[L.dom])}</span><b>${esc(L.src)}</b> · played in ${keyOf(L.K)[0]}${L.implied ? ` · ${esc(ch.pre.rom)} implied` : ''}</div></div>`;
  }).join('') || '<p class="note">No licks with this pair yet.</p>';
  $('ivMore').hidden = list.length <= ivShown; $('ivMore').textContent = `Show more (${list.length - ivShown})`;
  if (ivSel >= 0 && all[ivSel] && !v.hidden) ivShow(ivSel, false); else v.hidden = true;
}
function ivShow(k, scroll) {
  const L = ivItems()[k], ch = IIV.find(c => c.id === ivCh), ph = ivPhrase(L), v = $('ivView');
  v.hidden = false;
  const cell = $('ivList').querySelector(`.cell[data-k="${k}"]`); if (cell && cell.previousElementSibling !== v) { const top = cell.getBoundingClientRect().top; cell.before(v); window.scrollBy(0, cell.getBoundingClientRect().top - top); }
  if (scroll) v.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  $('ivTitle').textContent = `${ch.pre.rom}: ${PRE_CAT[L.pre]} · ${ch.dom.rom}: ${DOM_CAT[L.dom]} · in ${keyOf(ph.K)[0]}`;
  $('ivSub').textContent = L.src;
  ivEls = drawPhrase($('ivSvg'), ph);
  return ph;
}
async function playIIV(k) {
  stopAll(); await audio();
  const all = ivItems(); if (k == null) { k = ivSel >= 0 ? ivSel : all.indexOf(all.filter(L => (ivPre === 'all' || L.pre === ivPre) && (ivDom === 'all' || L.dom === ivDom))[0]); }
  if (k < 0 || !all[k]) return;
  ivSel = k; document.querySelectorAll('#ivList .cell').forEach(x => x.classList.toggle('sel', +x.dataset.k === k));
  const L = all[k], ph = ivShow(k, true), my = token;
  playing = true; $('playBtn').textContent = '■ Stop';
  curAsPlayed = L.asPlayed; const end = schedule(ph, ctx.currentTime + 0.08, () => ivEls, my); curAsPlayed = false;
  at(end, () => { if (my !== token) return; if ($('loop').checked) { playIIV(k); return; } playing = false; $('playBtn').textContent = '▶ Play'; });
  readout(`<b>${esc(L.src)}</b>, in ${keyOf(ph.K)[0]}.`);
}
document.addEventListener('click', e => {
  const c = e.target.closest('#ivChaps .chip'); if (c) { ivCh = c.dataset.c; store.set('bv.ivCh', ivCh); ivPre = ivDom = 'all'; ivSel = -1; ivShown = 40; stopAll(); renderIIV(); return; }
  const p = e.target.closest('#ivPreRow .chip'); if (p) { ivPre = p.dataset.p; ivSel = -1; ivShown = 40; stopAll(); renderIIV(); return; }
  const d = e.target.closest('#ivDomRow .chip'); if (d) { ivDom = d.dataset.d; ivSel = -1; ivShown = 40; stopAll(); renderIIV(); return; }
  if (e.target.closest('#ivMore')) { ivShown += 60; renderIIV(); return; }
  const cell = e.target.closest('#ivList .cell'); if (!cell) return;
  if (e.target.closest('[data-a="fav"]')) { const L = ivItems()[+cell.dataset.k], ch = IIV.find(c => c.id === ivCh), f = lickFav(L, `${ch.short} · ${ch.pre.rom}: ${PRE_CAT[L.pre]} · ${ch.dom.rom}: ${DOM_CAT[L.dom]}`);
    if (window.MusicLab && MusicLab.favs) { MusicLab.favs.toggle(f); const b = e.target.closest('[data-a="fav"]'), on = favOn(f); b.classList.toggle('saved', on); b.textContent = on ? '★' : '☆'; } return; }
  playIIV(+cell.dataset.k);
});
// a new library: find everything again
window.addEventListener('load', () => { if (window.MusicLab && MusicLab.onChange) MusicLab.onChange(() => { E_LICKS = null; IIV_ITEMS = null; }); });
renderAll();
