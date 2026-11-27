/* Blues vocab analyzer for Music Lab.
   Finds 12-bar blues choruses in any solo by its chords (the title only helps), then picks each chorus apart into
   concepts: blues scale and blue notes, triads, scale runs, ii–V–Is, call and response, and moves at fixed places
   in the form (bar 4 into the IV, bar 6 back home, bar 8 to the ii, bar 10 to the I, bar 12 turnaround).
   Needs processor.js (SoloProcessor.parse). Exposes window.BluesVocab. */
(function () {
  const md = (a, n) => ((a % n) + n) % n, EPS = 1e-6;
  const QQ = q => ({ maj6: 'maj', min6: 'min', minmaj: 'min', sus: 'dom', aug: 'dom' }[q] || q);
  const KT = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'];
  const ROM = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
  const TONES = { maj: [0, 4, 7, 11, 9], min: [0, 3, 7, 10, 9], dom: [0, 4, 7, 10], hd: [0, 3, 6, 10], dim: [0, 3, 6, 9] };
  const SCALE = { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 9, 10], dom: [0, 2, 4, 5, 7, 9, 10], hd: [0, 1, 3, 5, 6, 8, 10], dim: [0, 2, 3, 5, 6, 8, 9, 11] };
  // a chord as a roman numeral in the key: lowercase for minor, ø half-diminished, ° diminished, 7 dominant
  function roman(rel, q) {
    q = QQ(q); const r = ROM[md(rel, 12)];
    if (q === 'maj' && (md(rel, 12) === 0 || md(rel, 12) === 5)) q = 'dom';
    if (q === 'min') return r.toLowerCase();
    if (q === 'hd') return r.toLowerCase() + 'ø';
    if (q === 'dim') return r.toLowerCase() + '°';
    if (q === 'dom') return r + '7';
    return r;
  }
  const TITLE = /blues|blue monk|now'?s the time|billie'?s bounce|tenor madness|straight,? no chaser|sonnymoon|bag'?s'? groove|c jam|au privave|bessie'?s|mr\.? ?p\.? ?c|cool blues|camarillo|freddie freeloader|chi chi|bloomdido|barbados|cheryl|blue seven|vierd|sandu|walkin'?|bluesology|birk'?s works|blue trane|one for daddy|buzzy|relaxin|blues head|blue in green/i;

  /* ---------- the 12-bar templates: what each bar may hold, relative to the key ---------- */
  const A = '*';
  const MAJOR = [
    [3, [[0, 'dom maj']]],                                                        // 1  I
    [1, [[0, A], [5, 'dom min'], [11, 'hd min'], [4, 'dom'], [2, 'min'], [7, 'dom'], [6, 'dim']]],  // 2  I or quick IV
    [1, [[0, A], [9, 'min dom'], [4, 'min dom'], [3, 'min dom'], [2, 'min']]],    // 3  I
    [1.5, [[0, 'dom'], [7, 'min'], [0, A], [10, 'min dom']]],                     // 4  I7 or v–I7 (ii–V to IV)
    [3, [[5, 'dom maj']]],                                                        // 5  IV
    [1, [[5, A], [6, 'dim'], [10, 'dom'], [5, 'min']]],                           // 6  IV, ♯iv°, iv–♭VII7
    [2, [[0, A], [4, 'min hd'], [11, 'hd']]],                                     // 7  I or iii
    [1, [[9, A], [4, A], [3, A], [8, 'dom'], [0, A], [6, A]]],                    // 8  VI7, iii–VI7, ♭iii–♭VI7, I
    [3, [[2, 'min hd dom'], [7, 'dom']]],                                         // 9  ii or V
    [2, [[7, 'dom'], [5, 'dom'], [2, 'min'], [1, 'dom']]],                        // 10 V or IV
    [2, [[0, A], [4, 'min'], [9, A]]],                                            // 11 I
    [0.5, [[0, A], [7, A], [2, A], [9, A], [1, A], [3, A], [8, A]]],              // 12 turnaround
  ];
  const MINOR = [
    [3, [[0, 'min']]], [1, [[0, A], [5, 'min']]], [1, [[0, A]]], [1, [[0, A], [7, A], [2, A]]],
    [3, [[5, 'min']]], [1, [[5, A], [10, A]]], [2, [[0, A]]], [1, [[0, A], [9, A], [8, A], [7, A], [2, A]]],
    [3, [[8, 'dom maj'], [2, 'hd min'], [7, 'dom']]], [2, [[7, 'dom'], [1, 'dom']]], [2, [[0, A]]], [0.5, [[0, A], [7, A], [8, A], [2, A], [1, A]]],
  ];
  const ANCHORS = [0, 4, 6, 8];
  const fits = (pat, c, K) => pat.some(([rel, qs]) => md(c.root - K, 12) === rel && (qs === A || qs.split(' ').includes(QQ(c.q))));

  /* ---------- reading one solo ---------- */
  function readSolo(so) {
    const P = window.SoloProcessor;
    const S = P.parse(so.xml);
    if (S.chords.length < 6) return null;
    const conc = so.pitch != null ? (so.pitch === 'bb' ? -2 : 0) : (S.transpose === -2 || S.transpose === -9 ? S.transpose : 0);
    // where each bar starts, in beats (bars with no notes are filled in at the same length as their neighbours)
    const nb = S.bars, start = new Array(nb + 2).fill(null);
    for (const n of S.notes) if (start[n.bar] == null) start[n.bar] = n.t - n.beat;
    for (const c of S.chords) if (start[c.bar] == null && Number.isInteger(c.t)) { /* only a guess, refined below */ }
    let last = null, lastB = 0;
    for (let b = 1; b <= nb + 1; b++) {
      if (start[b] != null) {
        if (last != null && b - lastB > 1) { const step = (start[b] - last) / (b - lastB); for (let k = lastB + 1; k < b; k++) start[k] = last + step * (k - lastB); }
        last = start[b]; lastB = b;
      }
    }
    if (start[1] == null) start[1] = 0;
    for (let b = 1; b <= nb + 1; b++) if (start[b] == null) start[b] = start[b - 1] + 4;
    // chords that sound in each bar: the one carried in at the downbeat, then any changes inside it
    const active = t => { let c = null; for (const x of S.chords) { if (x.t <= t + 0.001) c = x; else break; } return c; };
    const barChords = [];
    for (let b = 1; b <= nb; b++) {
      const a = active(start[b] + 0.01), inside = S.chords.filter(x => x.t > start[b] + 0.01 && x.t < start[b + 1] - 0.01);
      barChords[b] = (a ? [a] : []).concat(inside);
    }
    return { S, conc, start, barChords, active, nb };
  }

  /* ---------- finding the choruses ---------- */
  function findChoruses(R, titled) {
    const out = [], { nb, barChords } = R, need = titled ? 14 : 16;
    let s = 1;
    while (s + 11 <= nb) {
      const first = barChords[s][0];
      let best = null;
      if (first) for (const [type, T] of [['major', MAJOR], ['minor', MINOR]]) {
        const K = first.root; let score = 0, ok = true;
        for (let i = 0; i < 12; i++) {
          const cs = barChords[s + i], [w, pats] = T[i];
          const hit = cs.length && cs.some(c => fits(pats, c, K));
          if (hit) score += w; else if (ANCHORS.includes(i)) { ok = false; break; }
        }
        if (ok && score >= need && (!best || score > best.score)) best = { b0: s, K, type, score };
      }
      if (best) { out.push(best); s += 12; } else s++;
    }
    return out;
  }

  /* ---------- picking a chorus apart ---------- */
  function analyzeSolo(so) {
    const P = window.SoloProcessor;
    let R; try { R = readSolo(so); } catch (e) { return null; }
    if (!R) return null;
    const titled = TITLE.test(so.name || '');
    const chs = findChoruses(R, titled);
    if (!chs.length) return { choruses: [], items: [], titled };
    const { S, conc, start, active } = R;
    const name = so.name || 'Your solo';
    const multi = chs.length > 1;
    const posOf = new Map();   // bar → [chorus index, form bar 1–12]
    chs.forEach((c, k) => { for (let i = 0; i < 12; i++) posOf.set(c.b0 + i, [k, i + 1]); });
    const items = [];
    const choruses = chs.map((c, k) => ({
      id: so.id + '#' + k, soloId: so.id, name, player: so.player || '', no: k + 1, of: chs.length, K: md(c.K + conc, 12), minor: c.type === 'minor',
      b0: c.b0, score: c.score,
      bars: Array.from({ length: 12 }, (_, i) => R.barChords[c.b0 + i].map(x => ({ r: md(x.root + conc, 12), q: QQ(x.q), name: x.name, t: Math.max(0, x.t - start[c.b0 + i]) }))),
      notes: S.notes.filter(n => (n.bar >= c.b0 && n.bar < c.b0 + 12) || (n.bar === c.b0 - 1 && !posOf.has(c.b0 - 1) && n.t >= start[c.b0] - 2))
        .map(n => [Math.round((n.t - start[c.b0]) * 1e4) / 1e4, Math.round(n.dur * 1e4) / 1e4, n.p + conc]),
    }));
    const rel = (n, K) => md(n.p - K, 12);
    const crel = n => n.chord ? md(n.p - n.chord.root, 12) : null;
    const isCt = n => n.chord && TONES[QQ(n.chord.q)] && TONES[QQ(n.chord.q)].includes(crel(n));
    const inScale = n => n.chord && SCALE[QQ(n.chord.q)] && SCALE[QQ(n.chord.q)].includes(crel(n));

    // one example: the notes as played (concert pitch), the chords under them, where it sits in the form
    function item(c, s, ns, extra = {}) {
      if (!ns.length) return;
      const p0 = posOf.get(ns[0].bar), p1 = posOf.get(ns[ns.length - 1].bar) || p0;
      if (!p0) return;
      const ch = chs[p0[0]], K = ch.K;
      const t0 = Math.floor(ns[0].t + EPS), tEnd = ns[ns.length - 1].t + ns[ns.length - 1].dur;
      const cs = []; const a = active(ns[0].t + 0.001); if (a) cs.push(a);
      for (const x of S.chords) if (x.t > ns[0].t + 0.001 && x.t < tEnd - 0.01 && x !== a) cs.push(x);
      const fa = p0[1], fb = p0[0] === p1[0] ? p1[1] : p1[1] + 12;
      items.push(Object.assign({
        c, s, K: md(K + conc, 12), minor: ch.type === 'minor',
        n: ns.map(n => [Math.round((n.t - t0) * 1e4) / 1e4, Math.round(n.dur * 1e4) / 1e4, n.p + conc, Math.max(0, cs.indexOf(n.chord))]),
        ch: cs.map(x => ({ t: Math.max(0, Math.round((x.t - t0) * 1e4) / 1e4), r: md(x.root + conc, 12), q: QQ(x.q), name: x.name })),
        bars: [fa, fb > 12 ? fb - 12 : fb], src: name, soloId: so.id, player: so.player || '', chorus: p0[0] + 1, multi,
        lastRel: md((cs.length ? cs[cs.length - 1].root : K) - K, 12), lastQ: cs.length ? QQ(cs[cs.length - 1].q) : 'dom',
      }, extra));
    }
    const inChorus = n => posOf.has(n.bar);
    const phrases = P._ex.phrases(S.notes).map(ph => ph.filter(inChorus)).filter(ph => ph.length >= 3);

    for (const ph of phrases) {
      const L = ph.length, K = chs[posOf.get(ph[0].bar)[0]].K;
      const used = new Set();
      /* Blues scale: five or more notes all from the blues scale of the key, using its blue note */
      for (const [sub, set, need] of [['Blues scale', [0, 3, 5, 6, 7, 10], [3, 6]], ['Major blues (♭3–3)', [0, 2, 3, 4, 7, 9], [3]]]) {
        let i = 0;
        while (i < L) {
          let j = i;
          while (j < L && set.includes(rel(ph[j], K)) && (j === i || Math.abs(ph[j].p - ph[j - 1].p) <= 5) && !used.has(j)) j++;
          const win = ph.slice(i, j), rs = win.map(n => rel(n, K));
          const okMaj = sub[0] !== 'M' || rs.some((r, z) => r === 3 && win[z + 1] && win[z + 1].p - win[z].p === 1);
          if (j - i >= 5 && rs.some(r => need.includes(r)) && new Set(rs).size >= 4 && okMaj) {
            item('blues', sub, win, { hl: win.map((_, z) => z) }); for (let z = i; z < j; z++) used.add(z); i = j;
          } else i++;
        }
      }
      for (let i = 0; i < L; i++) {
        const n = ph[i], r = rel(n, K), nx = ph[i + 1], cr = n.chord ? md(n.chord.root - K, 12) : null;
        /* blue notes */
        if (r === 3 && nx && nx.p - n.p === 1) item('blue', '♭3 → 3', ph.slice(Math.max(0, i - 1), Math.min(L, i + 3)), { hl: [i - Math.max(0, i - 1), i + 1 - Math.max(0, i - 1)] });
        if (r === 6 && nx && Math.abs(nx.p - n.p) === 1) item('blue', '♭5 slipping to 4 or 5', ph.slice(Math.max(0, i - 2), Math.min(L, i + 3)), { hl: [i - Math.max(0, i - 2)] });
        if (r === 3 && cr === 5 && (n.dur >= 0.5 - EPS || md(n.beat, 1) < EPS)) item('blue', '♭3 over the IV', ph.slice(Math.max(0, i - 2), Math.min(L, i + 2)), { hl: [i - Math.max(0, i - 2)] });
        if (r === 10 && cr === 0 && n.dur >= 1 - EPS) item('blue', '♭7 held over the I', ph.slice(Math.max(0, i - 2), Math.min(L, i + 2)), { hl: [i - Math.max(0, i - 2)] });
      }
      /* triads (major or minor) arpeggiated on one chord, with at most a passing note between triad notes */
      const cands = [];
      for (let a = 0; a < L; a++) for (let b = a + 2; b < L && b - a < 6; b++) {
        const win = ph.slice(a, b + 1), ch = win[0].chord;
        if (!ch || win.some(n => n.chord !== ch)) break;
        const pcs = new Set(win.map(n => md(n.p, 12)));
        for (const rt of pcs) for (const [mi, sh] of [[0, [0, 4, 7]], [1, [0, 3, 7]]]) {
          if (!sh.every(x => pcs.has(md(rt + x, 12)))) continue;
          const isT = n => sh.includes(md(n.p - rt, 12));
          if (!isT(win[0]) || !isT(win[win.length - 1])) continue;
          if (Math.max(...win.map(n => n.p)) - Math.min(...win.map(n => n.p)) > 14) continue;
          let ok = true, pass = 0;
          win.forEach((n, k) => { if (isT(n)) return; const p0 = win[k - 1], p1 = win[k + 1]; if (p0 && p1 && isT(p0) && isT(p1) && Math.abs(n.p - p0.p) <= 2 && Math.abs(p1.p - n.p) <= 2) pass++; else ok = false; });
          if (!ok || pass > Math.floor((win.length - pass) / 2)) continue;
          // an arpeggio moves: no more than one repeated note
          let rep = 0; win.forEach((n, k) => { if (k && n.p === win[k - 1].p) rep++; }); if (rep > 1) continue;
          cands.push({ a, b, rt, mi, win, ch, score: (win.length - pass) * 10 - pass * 12 - mi });
        }
      }
      cands.sort((x, y) => y.score - x.score || x.a - y.a);
      const tUsed = new Set();
      for (const c of cands) {
        let clash = false; for (let z = c.a; z <= c.b; z++) if (tUsed.has(z)) clash = true;
        if (clash) continue; for (let z = c.a; z <= c.b; z++) tUsed.add(z);
        const tri = (c.mi ? ROM[md(c.rt - K, 12)].toLowerCase() : ROM[md(c.rt - K, 12)]);
        const sh = c.mi ? [0, 3, 7] : [0, 4, 7];
        item('triad', `${tri} over ${roman(c.ch.root - K, c.ch.q)}`, c.win, { tri: { r: md(c.rt + conc, 12), m: c.mi }, hl: c.win.map((n, z) => sh.includes(md(n.p - c.rt, 12)) ? z : -1).filter(z => z >= 0) });
      }
      /* scale runs: five or more notes by step in one direction */
      let i = 0;
      while (i < L - 1) {
        const d = Math.sign(ph[i + 1].p - ph[i].p); let j = i + 1;
        while (j < L && d && Math.sign(ph[j].p - ph[j - 1].p) === d && Math.abs(ph[j].p - ph[j - 1].p) <= 2) j++;
        if (j - i >= 5) {
          const win = ph.slice(i, j), chrom = win.some((n, z) => z > 0 && z < win.length - 1 && !inScale(n) && Math.abs(n.p - win[z - 1].p) === 1);
          item('scale', chrom ? 'With chromatic passing notes' : (d > 0 ? 'Scale up' : 'Scale down'), win, { hl: [] });
          i = j - 1;
        } else i++;
      }
    }

    /* ii–Vs, wherever they fall in the form */
    chs.forEach((c, k) => {
      const seq = S.chords.filter(x => x.t >= start[c.b0] - 0.01 && x.t < start[Math.min(c.b0 + 13, R.nb + 1)] - 0.01);
      for (let i = 0; i + 1 < seq.length; i++) {
        const x = seq[i], y = seq[i + 1], z = seq[i + 2];
        if (!(['min', 'hd'].includes(QQ(x.q)) && QQ(y.q) === 'dom' && md(y.root - x.root, 12) === 5)) continue;
        const toI = z && md(z.root - y.root, 12) === 5;
        const tEnd = toI ? z.t + 2 : y.t + Math.max(2, (seq[i + 2] ? seq[i + 2].t : y.t + 4) - y.t);
        const ns = S.notes.filter(n => n.t >= x.t - 0.5 && n.t < tEnd - 0.01 && inChorus(n));
        if (ns.length < 4 || !ns.some(n => n.chord === x || n.t < y.t) || !ns.some(n => n.chord === y)) continue;
        const fb = posOf.get(x.bar) ? posOf.get(x.bar)[1] : null;
        const tgt = md(y.root + 5 - c.K, 12);
        const where = tgt === 0 ? (fb >= 11 ? 'Turnaround ii–V' : 'ii–V–I home') : tgt === 5 ? 'ii–V to the IV' : tgt === 2 ? 'ii–V to the ii' : 'ii–V elsewhere';
        item('251', where, ns, { hl: [] });
      }
    });

    /* call and response */
    chs.forEach((c, k) => {
      // AAB: the riff of bars 1–2 comes back over the IV in bars 5–6
      const inBars = (a, b) => S.notes.filter(n => n.bar >= c.b0 + a - 1 && n.bar <= c.b0 + b - 1);
      const A1 = inBars(1, 2), A2 = inBars(5, 6);
      if (A1.length >= 4 && A2.length >= 4) {
        let same = 0; while (same < Math.min(A1.length, A2.length) && A1[same].p - A2[same].p === A1[0].p - A2[0].p && Math.abs((A1[same].t - start[c.b0]) - (A2[same].t - start[c.b0 + 4])) < 0.26) same++;
        if (same >= 4) {
          // show both statements, with bars 3–4 cut down to a breath
          const gap = (start[c.b0 + 4] - start[c.b0 + 2]) - 1;
          const ns = A1.concat(A2.map(n => Object.assign({}, n, { t: n.t - gap })));
          const sub = A1[0].p === A2[0].p ? 'Same riff over I and IV' : 'Riff moved up to the IV';
          const before = items.length; item('qa', sub, ns, { hl: A1.map((_, z) => z), aab: true });
          if (items.length > before) { const it = items[items.length - 1]; it.ch = [{ t: 0, r: md(c.K + conc, 12), q: 'dom', name: '' }, { t: Math.floor(A2[0].t - gap - Math.floor(A1[0].t)), r: md(c.K + 5 + conc, 12), q: 'dom', name: '' }];
            it.n.forEach((x, z) => x[3] = z < A1.length ? 0 : 1); it.bars = [1, 6]; it.lastRel = 5; it.lastQ = 'dom'; }
        }
      }
      // a phrase, then one that answers it: same rhythm or the same opening move, ending somewhere new
      const phs = P._ex.phrases(S.notes).filter(ph => ph.length >= 3 && posOf.has(ph[0].bar) && posOf.get(ph[0].bar)[0] === k);
      let found = 0;
      for (let z = 0; z + 1 < phs.length && found < 2; z++) {
        const a = phs[z], b = phs[z + 1];
        if (a.length > 14 || b.length > 14) continue;
        const aEnd = a[a.length - 1].t + a[a.length - 1].dur, aLen = aEnd - a[0].t, bLen = b[b.length - 1].t + b[b.length - 1].dur - b[0].t;
        if (b[0].t - aEnd > 2.5 || aLen > 8 || bLen > 8) continue;
        const on = ph => new Set(ph.map(n => Math.round(md(n.t - Math.floor(ph[0].t), 4) * 4)));
        const ra = on(a), rb = on(b); let inter = 0; ra.forEach(x => { if (rb.has(x)) inter++; });
        const jac = inter / (ra.size + rb.size - inter);
        const iv = ph => ph.slice(0, 4).map((n, q, arr) => q ? n.p - arr[q - 1].p : null).slice(1).join(',');
        const echo = a.length >= 4 && b.length >= 4 && iv(a) === iv(b);
        if (!(echo || jac >= 0.6) || (a.map(n => n.p).join() === b.map(n => n.p).join())) continue;
        item('qa', echo ? 'Echo: same motif, new ending' : 'Same rhythm, new notes', a.concat(b), { hl: a.map((_, q) => q) });
        found++; z++;
      }
    });

    /* moves at fixed places in the form */
    const MOVES = { 4: 'into the IV', 6: 'back home', 8: 'to the ii', 10: 'to the I', 12: 'turnaround' };
    chs.forEach((c, k) => {
      for (const N of [4, 6, 8, 10, 12]) {
        const b = c.b0 + N - 1; if (b + 1 > R.nb) continue;
        const ns = S.notes.filter(n => n.t >= start[b] - EPS && n.t < start[b + 1] + 2 - 0.01);
        if (ns.length < 3 || !ns.some(n => n.bar === b) || !ns.some(n => n.bar === b + 1)) continue;
        const nextFirst = R.barChords[b + 1][0];
        const variant = R.barChords[b].map(x => roman(x.root - c.K, x.q)).filter((v, q, arr) => !q || v !== arr[q - 1]).join(' ') + ' → ' + (nextFirst ? roman(nextFirst.root - c.K, nextFirst.q) : '?');
        const land = ns.find(n => n.bar === b + 1);
        const before = items.length;
        item('bar', `Bar ${N} · ${variant}`, ns, { bar: N, move: MOVES[N], hl: [ns.indexOf(land)] });
        if (items.length > before) { const it = items[items.length - 1]; it.bars = [N, N === 12 ? 1 : N + 1]; }
      }
    });
    return { choruses, items, titled };
  }

  /* ---------- the whole library ---------- */
  function analyze(solos) {
    const out = { choruses: [], items: [], solos: [], titledNoForm: [] };
    for (const so of solos) {
      const r = analyzeSolo(so);
      if (!r) continue;
      if (r.choruses.length) { out.choruses.push(...r.choruses); out.items.push(...r.items); out.solos.push({ id: so.id, name: so.name, choruses: r.choruses.length }); }
      else if (r.titled) out.titledNoForm.push(so.name);
    }
    return out;
  }
  window.BluesVocab = { analyze, analyzeSolo, roman, KT, ROM, TITLE, _find: (so) => { const R = readSolo(so); return R ? findChoruses(R, TITLE.test(so.name || '')) : []; } };
})();
