/* Solo processor: finds the techniques Solo Ear Lessons drills (enclosures, approach notes, triads on other roots,
   pentatonics, guide tones, altered tensions, patterns, and up-and-down shapes) in one MusicXML solo.
   A JavaScript port of the scan used to build Solo Ear's tabs (mx.py, scan.py, ex.py, ex2.py), checked against it. */
(function () {
  const STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const S = a => new Set(a);
  const TONES = { maj: S([0, 4, 7, 11]), maj6: S([0, 4, 7, 9]), min: S([0, 3, 7, 10]), min6: S([0, 3, 7, 9]), minmaj: S([0, 3, 7, 11]),
    dom: S([0, 4, 7, 10]), hd: S([0, 3, 6, 10]), dim: S([0, 3, 6, 9]), aug: S([0, 4, 8]), sus: S([0, 5, 7, 10]) };
  const SCALE = { maj: S([0, 2, 4, 5, 7, 9, 11]), maj6: S([0, 2, 4, 5, 7, 9, 11]), min: S([0, 2, 3, 5, 7, 9, 10]), min6: S([0, 2, 3, 5, 7, 9, 11]),
    minmaj: S([0, 2, 3, 5, 7, 9, 11]), dom: S([0, 2, 4, 5, 7, 9, 10]), hd: S([0, 1, 3, 5, 6, 8, 10]), dim: S([0, 2, 3, 5, 6, 8, 9, 11]),
    aug: S([0, 2, 4, 6, 8, 10]), sus: S([0, 2, 4, 5, 7, 9, 10]) };
  const EPS = 1e-6, mod = (a, n) => ((a % n) + n) % n;
  const r4 = x => Math.round(x * 10000) / 10000;

  function quality(k, t) {
    t = (t || '').trim(); k = (k || '').trim(); const tl = t.toLowerCase();
    if (['major-seventh', 'major-ninth', 'major-13th'].includes(k)) return 'maj';
    if (k === 'major-sixth') return 'maj6';
    if (['minor-seventh', 'minor-ninth', 'minor-11th', 'minor-13th'].includes(k)) return 'min';
    if (k === 'minor-sixth') return 'min6';
    if (k === 'major-minor') return 'minmaj';
    if (['dominant', 'dominant-ninth', 'dominant-11th', 'dominant-13th'].includes(k)) return 'dom';
    if (k === 'half-diminished') return 'hd';
    if (['diminished', 'diminished-seventh'].includes(k)) return 'dim';
    if (['augmented', 'augmented-seventh'].includes(k)) return 'aug';
    if (['suspended-fourth', 'suspended-second'].includes(k)) return 'sus';
    if (k === 'minor') return 'min';
    if (k === 'major' && !t) return 'maj6';
    if (t.includes('ø') || /(m|mi|min|-)7?\s*\(?(♭|b|-)5/.test(tl)) return 'hd';
    if (t.includes('°') || tl.startsWith('dim') || tl.startsWith('o7')) return 'dim';
    if (tl.includes('sus')) return 'sus';
    if (t.includes('Δ') || tl.startsWith('maj') || tl.startsWith('ma') || tl.startsWith('m7+') || tl === 'major')
      return tl.includes('6') && !tl.includes('7') ? 'maj6' : 'maj';
    if (tl.startsWith('-') || tl.startsWith('mi') || (tl.startsWith('m') && !tl.startsWith('maj')))
      return tl.includes('6') && !tl.includes('7') ? 'min6' : 'min';
    if (t.startsWith('+') || tl.includes('aug')) return 'aug';
    if (/7|9|13|11/.test(tl)) return 'dom';
    return 'maj6';
  }
  const kid = (el, path) => { let x = el; for (const p of path.split('/')) { x = x && [...x.children].find(c => c.nodeName === p); } return x || null; };
  const txt = (el, path) => { const x = kid(el, path); return x ? x.textContent : null; };

  function parse(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const root = doc.documentElement;
    const part = [...root.children].find(c => c.nodeName === 'part');
    const notes = [], chords = []; let t = 0, div = 1, fifths = null, transpose = 0, bars = 0;
    [...part.children].filter(c => c.nodeName === 'measure').forEach((m, mi) => {
      bars++; let pos = 0, mlen = 0;
      for (const el of m.children) {
        const tag = el.nodeName;
        if (tag === 'attributes') {
          const d = txt(el, 'divisions'); if (d) div = parseInt(d);
          const f = txt(el, 'key/fifths'); if (f != null && fifths == null) fifths = parseInt(f);
          const tr = txt(el, 'transpose/chromatic'); if (tr != null) transpose = parseInt(tr);
        } else if (tag === 'harmony') {
          const rs = txt(el, 'root/root-step'); if (rs == null) continue;
          const ra = Math.trunc(parseFloat(txt(el, 'root/root-alter') || 0));
          const kind = kid(el, 'kind'), off = txt(el, 'offset');
          const at = t + pos + (off ? parseInt(off) / div : 0);
          const ktext = kind ? (kind.getAttribute('text') || '') : '';
          const q = quality(kind ? kind.textContent : '', kind ? kind.getAttribute('text') : '');
          const name = rs + ({ '-1': '♭', '1': '♯', '-2': '𝄫', '2': '𝄪' }[ra] || '') + ktext;
          chords.push({ t: at, root: mod(STEP[rs] + ra, 12), q, name, bar: mi + 1 });
        } else if (tag === 'backup') pos -= parseInt(txt(el, 'duration')) / div;
        else if (tag === 'forward') pos += parseInt(txt(el, 'duration')) / div;
        else if (tag === 'note') {
          if (kid(el, 'grace')) continue;
          const dur = parseInt(txt(el, 'duration') || 0) / div;
          const p = kid(el, 'pitch');
          const midiOf = p => 12 * (parseInt(txt(p, 'octave')) + 1) + STEP[txt(p, 'step')] + Math.trunc(parseFloat(txt(p, 'alter') || 0));
          if (kid(el, 'chord')) {
            const last = notes[notes.length - 1];
            if (p && last && Math.abs(last.t - (t + pos - last.dur)) < EPS) { const mid = midiOf(p); if (mid > last.p) last.p = mid; }
            continue;
          }
          const ties = [...el.children].filter(c => c.nodeName === 'tie').map(x => x.getAttribute('type'));
          if (p) {
            const mid = midiOf(p), last = notes[notes.length - 1];
            if (ties.includes('stop') && last && last.p === mid && Math.abs(last.t + last.dur - (t + pos)) < EPS) last.dur += dur;
            else notes.push({ t: t + pos, dur, p: mid, bar: mi + 1, beat: pos, step: txt(p, 'step'), alter: Math.trunc(parseFloat(txt(p, 'alter') || 0)) });
          }
          pos += dur; mlen = Math.max(mlen, pos);
        }
      }
      t += mlen > 0 ? mlen : 4;
    });
    chords.sort((a, b) => a.t - b.t);
    let ci = -1;
    for (const n of notes) {
      while (ci + 1 < chords.length && chords[ci + 1].t <= n.t + 0.001 + EPS) ci++;
      n.chord = ci >= 0 ? chords[ci] : null; n.ci = ci;
    }
    return { notes, chords, bars, fifths, transpose };
  }
  function degName(semi, q) {
    const s = mod(semi, 12);
    if (s === 3 && q === 'dom') return '♯9';
    if (s === 6 && (q === 'hd' || q === 'dim')) return '♭5';
    if (s === 8 && q === 'aug') return '♯5';
    if (s === 9 && q === 'dim') return '°7';
    return { 0: '1', 1: '♭9', 2: '9', 3: '♭3', 4: '3', 5: '11', 6: '♯11', 7: '5', 8: '♭13', 9: '13', 10: '♭7', 11: '7' }[s];
  }
  const nameOf = n => n.step + ({ '-1': '♭', '1': '♯', '-2': '𝄫', '2': '𝄪', '0': '' }[n.alter] || '');
  const rel = n => n.chord ? mod(n.p - n.chord.root, 12) : null;
  const isCt = (n, ext) => { if (!n.chord) return false; const r = rel(n); return TONES[n.chord.q].has(r) || (ext && r === 2); };
  const inScale = n => !!n.chord && SCALE[n.chord.q].has(rel(n));

  function phrases(notes) {
    const out = []; let cur = [];
    notes.forEach(n => {
      if (cur.length) { const prev = cur[cur.length - 1], gap = n.t - (prev.t + prev.dur); if (gap >= 0.5 - EPS || prev.dur >= 1.5 - EPS) { out.push(cur); cur = []; } }
      cur.push(n);
    });
    if (cur.length) out.push(cur);
    return out;
  }
  function segments(ph) {
    const segs = []; if (ph.length < 3) return segs;
    let i = 0; const n = ph.length;
    while (i < n - 1) {
      const d0 = ph[i + 1].p - ph[i].p;
      if (d0 === 0) { i++; continue; }
      const s = d0 > 0 ? 1 : -1; let j = i + 1; const orn = [];
      while (j < n - 1) {
        const d = ph[j + 1].p - ph[j].p;
        if (d === 0) break;
        if (d * s > 0) { j++; continue; }
        if (Math.abs(d) <= 2 && j + 2 < n) {
          const d2 = ph[j + 2].p - ph[j + 1].p;
          if (d2 * s > 0 && (ph[j + 2].p - ph[j].p) * s > 0) { orn.push(j + 1); j += 2; continue; }
        }
        break;
      }
      if (j - i >= 2) segs.push({ a: i, b: j, dir: s, notes: ph.slice(i, j + 1), orn });
      i = j;
    }
    return segs;
  }
  const maxRun = (ivs, v) => { let best = 0, cur = 0; for (const x of ivs) { cur = x === v ? cur + 1 : 0; best = Math.max(best, cur); } return best; };
  const squeeze = s => { let o = ''; for (const c of s) if (!o || o[o.length - 1] !== c) o += c; return o; };
  function passingTones(ns) {
    const out = [];
    for (let k = 1; k < ns.length - 1; k++) {
      const x = ns[k]; if (!x.chord || inScale(x)) continue;
      const a = ns[k - 1], b = ns[k + 1];
      if (Math.abs(a.p - x.p) === 1 && Math.abs(b.p - x.p) === 1 && (a.p - x.p) * (b.p - x.p) < 0) {
        const q = x.chord.q, r = rel(x);
        const bebop = (q === 'dom' && r === 11) || ((q === 'maj' || q === 'maj6') && r === 8) || ((q === 'min' || q === 'min6') && r === 4) || (q === 'hd' && r === 11);
        out.push([k, bebop ? 'bebop' : 'other']);
      } else out.push([k, 'other']);
    }
    return out;
  }
  function classify(seg) {
    const ns = seg.notes, ivs = []; for (let k = 0; k < ns.length - 1; k++) ivs.push(Math.abs(ns[k + 1].p - ns[k].p));
    const kinds = ivs.map(v => v <= 2 ? 's' : v <= 5 ? 'a' : 'L').join('');
    const nct = ns.filter(x => x.chord).length, ctShare = ns.filter(x => isCt(x, true)).length / Math.max(1, nct);
    const chrom = maxRun(ivs, 1), kset = new Set(kinds);
    if (ivs.every(v => v === 1) && ivs.length >= 3) return 'chromatic run';
    if ([...kset].every(c => c === 'a') && ivs.length >= 2) {
      if (ivs.every(v => v === 5)) return 'fourths';
      return ctShare >= 0.75 ? 'arpeggio' : 'arpeggio (upper structure)';
    }
    if ([...kset].every(c => c === 's')) {
      if (chrom >= 3) return 'scale + chromatic run';
      const pas = passingTones(ns); if (!pas.length) return 'scale';
      const kp = new Set(pas.map(p => p[1]));
      if (kp.size === 1 && kp.has('bebop')) return 'bebop scale';
      return 'scale + chromatic passing';
    }
    const k2 = squeeze(kinds.replace(/L/g, 'a'));
    if ((k2 === 'as' || k2 === 'asa') && kinds.startsWith('a')) return 'arpeggio → scale';
    if ((k2 === 'sa' || k2 === 'sas') && kinds.startsWith('s')) return 'scale → arpeggio';
    if (kinds.includes('L') && (kinds.match(/L/g) || []).length >= kinds.length / 2) return 'wide leaps';
    return 'mixed steps & skips';
  }

  // ---------- up and down shapes (ex.py, with the later true-bebop rule) ----------
  const base = k => k.replace(' (upper structure)', '');
  function hasEnclosure(ns) {
    for (let i = 0; i < ns.length - 2; i++) {
      const a = ns[i], b = ns[i + 1], T = ns[i + 2], da = a.p - T.p, db = b.p - T.p;
      if (da * db < 0 && Math.abs(da) >= 1 && Math.abs(da) <= 2 && Math.abs(db) >= 1 && Math.abs(db) <= 2 && isCt(T, true) && (Math.abs(db) === 1 || Math.abs(da) === 1)) return true;
    }
    return false;
  }
  function family(k1, k2, kind, down) {
    const u = base(k1), d = base(k2);
    if (kind === 'valley') return d.startsWith('scale') && u === 'arpeggio' ? 'valley' : null;
    if (u === 'arpeggio' && hasEnclosure(down)) return 'arp-encl';
    if (u === 'arpeggio' && d === 'scale') return 'arp-scale';
    if (u === 'arpeggio' && (d === 'bebop scale' || d === 'scale + chromatic passing'))
      return passingTones(down).some(p => p[1] === 'bebop') ? 'arp-bebop' : null;
    if (u === 'scale' && d === 'arpeggio') return 'scale-arp';
    if (['scale + chromatic passing', 'scale + chromatic run', 'chromatic'].includes(u) && d === 'arpeggio') return 'chrom-arp';
    if (u === 'arpeggio' && d === 'arpeggio') return 'arp-triad';
    if (u.startsWith('scale') && (d === 'scale + chromatic run' || d === 'chromatic')) return 'scale-chrom';
    if (u === 'leap' && (d.startsWith('scale') || d === 'arpeggio')) return 'leap';
    return null;
  }
  function packWindow(ns, maxBeats = 8) {
    if (ns.some(n => !n.chord)) return null;
    const chords = []; for (const n of ns) if (!chords.length || chords[chords.length - 1] !== n.chord) chords.push(n.chord);
    if (chords.length > 3) return null;
    const t0 = ns[0].t; if (ns[ns.length - 1].t + ns[ns.length - 1].dur - t0 > maxBeats + EPS) return null;
    return {
      bar: ns[0].bar,
      n: ns.map(n => [r4(n.t - t0), r4(n.dur), n.p, chords.indexOf(n.chord)]),
      beat0: r4(mod(ns[0].beat, 1)),
      ch: chords.map(c => ({ r: c.root, q: c.q, name: c.name, t: r4(Math.max(c.t, t0) - t0) })),
      nm: ns.map(nameOf), dg: ns.map(n => degName(rel(n), n.chord.q)),
    };
  }
  function upDown(Sx, found) {
    for (const ph of phrases(Sx.notes)) {
      const cls = segments(ph).map(sg => [sg, classify(sg)]);
      for (let z = 0; z + 1 < cls.length; z++) {
        const [s1, k1] = cls[z], [s2, k2] = cls[z + 1];
        if (s1.b !== s2.a) continue;
        // any falling run with a real bebop passing note, the line before it included
        if (s2.dir < 0 && passingTones(s2.notes).some(p => p[1] === 'bebop') && (s1.dir <= 0 || base(k1) !== 'arpeggio')) {
          const ns0 = s1.notes.slice(-3).concat(s2.notes.slice(1));
          if (ns0.length >= 6 && ns0.length <= 13) { const w = packWindow(ns0); if (w) { w.peak = Math.min(2, s1.notes.length - 1); (found['arp-bebop-any'] = found['arp-bebop-any'] || []).push(w); } }
        }
        let kind;
        if (s1.dir > 0 && s2.dir < 0) kind = 'peak'; else if (s1.dir < 0 && s2.dir > 0) kind = 'valley'; else continue;
        let ns = s1.notes.concat(s2.notes.slice(1));
        const j = s2.b + 1;
        if (j < ph.length && Math.abs(ph[j].p - ns[ns.length - 1].p) <= 2) ns = ns.concat([ph[j]]);
        const f = family(k1, k2, kind, s2.notes.concat(ns.slice(s1.notes.length + s2.notes.length - 1)));
        if (!f || !(ns.length >= 6 && ns.length <= 13)) continue;
        const w = packWindow(ns); if (!w) continue;
        w.peak = s1.notes.length - 1;
        (found[f] = found[f] || []).push(w);
      }
    }
    if (found['arp-bebop-any']) { found['arp-bebop'] = (found['arp-bebop'] || []).concat(found['arp-bebop-any']); delete found['arp-bebop-any']; }
  }

  // ---------- note-level techniques (ex2.py) ----------
  const QMAP = { maj6: 'maj', min6: 'min' }, ASCII = { '♭9': 'b9', '♯9': 's9', '♭13': 'b13', '♯11': 's11' };
  function devices(Sx, found) {
    const add = (fid, ph, i, j, hl) => {
      const a = Math.max(0, i - 3), b = Math.min(ph.length - 1, j + 3);
      const w = packWindow(ph.slice(a, b + 1)); if (!w) return;
      w.hl = hl.map(k => k - a);
      (found[fid] = found[fid] || []).push(w);
    };
    for (const ph of phrases(Sx.notes)) {
      const L = ph.length;
      for (let i = 0; i < L; i++) {
        if (i + 2 < L) {
          const a = ph[i], b = ph[i + 1], T = ph[i + 2], da = a.p - T.p, db = b.p - T.p;
          if (da * db < 0 && Math.abs(da) >= 1 && Math.abs(da) <= 2 && Math.abs(db) >= 1 && Math.abs(db) <= 2 && isCt(T, true)) {
            const ca = Math.abs(da) === 1 && !inScale(a), cb = Math.abs(db) === 1 && !inScale(b);
            let fid;
            if (!(da > 0)) fid = 'enc-below-first'; else if (ca && cb) fid = 'enc-cc'; else if (cb) fid = 'enc-sa-cb'; else if (!ca) fid = 'enc-diat'; else fid = 'enc-ca-sb';
            add(fid, ph, i, i + 2, [i, i + 1, i + 2]);
            if (a.chord !== T.chord) add('enc-next', ph, i, i + 2, [i, i + 1, i + 2]);
          }
        }
        if (i + 3 < L) {
          const [a, b, c, T] = ph.slice(i, i + 4), ds = [a.p - T.p, b.p - T.p, c.p - T.p];
          if (isCt(T, true) && ds[0] * ds[2] < 0 && Math.abs(ds[2]) === 1 && Math.abs(ds[1] - ds[0]) === 1 && Math.abs(ds[0]) <= 3 && ds[0] * ds[1] > 0)
            add('enc-4', ph, i, i + 3, [i, i + 1, i + 2, i + 3]);
        }
        if (i + 2 < L) {
          const x = ph[i], y = ph[i + 1], T = ph[i + 2];
          if (y.p - x.p === T.p - y.p && Math.abs(T.p - y.p) === 1 && isCt(T) && !isCt(y) && !isCt(x))
            add('app-double-' + (T.p > y.p ? 'below' : 'above'), ph, i, i + 2, [i, i + 1, i + 2]);
        }
        if (i + 1 < L) {
          const x = ph[i], T = ph[i + 1];
          if (Math.abs(T.p - x.p) === 1 && isCt(T) && x.chord && !inScale(x)) add('app-' + (T.p > x.p ? 'below' : 'above'), ph, i, i + 1, [i, i + 1]);
          if ((Math.abs(T.p - x.p) === 1 || Math.abs(T.p - x.p) === 2) && T.p < x.p && isCt(T) && x.chord && inScale(x) && !isCt(x)) add('app-scale-above', ph, i, i + 1, [i, i + 1]);
        }
        if (i + 3 < L) {
          const w = ph.slice(i, i + 4);
          if ([0, 1, 2].every(k => w[k].p - w[k + 1].p === 1) && isCt(w[3])) add('app-run3', ph, i, i + 3, [i, i + 1, i + 2, i + 3]);
        }
        if (i + 2 < L && ph[i].chord && ph.slice(i, i + 3).every(z => z.chord === ph[i].chord)) {
          const tri = ph.slice(i, i + 3), ps = tri.map(z => z.p).sort((a, b) => a - b);
          if (new Set(tri.map(z => mod(z.p, 12))).size === 3 && ps[2] - ps[0] <= 12) {
            const c = ph[i].chord;
            for (let rt = 0; rt < 12; rt++) {
              const st = new Set(tri.map(z => mod(z.p - rt, 12)));
              for (const [tq, sh] of [['major', [0, 4, 7]], ['minor', [0, 3, 7]]]) {
                if (sh.every(v => st.has(v)) && mod(rt - c.root, 12) !== 0) {
                  const q = QMAP[c.q] || c.q; if (!['dom', 'maj', 'min'].includes(q)) continue;
                  add(`tri|${tq}|${mod(rt - c.root, 12)}|${q}`, ph, i, i + 2, [i, i + 1, i + 2]);
                }
              }
            }
          }
        }
        if (ph[i].chord && ph[i].chord.q === 'dom' && i + 1 < L) {
          const r = rel(ph[i]);
          if ([1, 3, 8, 6].includes(r) && Math.abs(ph[i + 1].p - ph[i].p) <= 2) add('alt-' + ASCII[degName(r, 'dom')], ph, i, i + 1, [i, i + 1]);
        }
        if (i + 1 < L && ph[i].chord && ['dom', 'maj', 'maj6'].includes(ph[i].chord.q))
          if (rel(ph[i]) === 3 && rel(ph[i + 1]) === 4 && ph[i + 1].p - ph[i].p === 1) add('blues', ph, i, i + 1, [i, i + 1]);
        if (i + 3 < L && ph[i].chord && ph.slice(i, i + 4).every(z => z.chord === ph[i].chord)) {
          const r = ph.slice(i, i + 4).map(rel).join(','), iv = [0, 1, 2].map(k => ph[i + k + 1].p - ph[i + k].p);
          if ((r === '0,2,4,7' || r === '0,2,3,7') && iv.every(v => v > 0)) add('dig', ph, i, i + 3, [i, i + 1, i + 2, i + 3]);
          if ((r === '7,4,2,0' || r === '7,3,2,0') && iv.every(v => v < 0)) add('dig', ph, i, i + 3, [i, i + 1, i + 2, i + 3]);
        }
        if (i + 3 < L) {
          const [a, T1, b, T2] = ph.slice(i, i + 4);
          if (T1.p === T2.p && a.p - T1.p >= 1 && a.p - T1.p <= 2 && T1.p - b.p >= 1 && T1.p - b.p <= 2 && isCt(T1, true)) add('turn', ph, i, i + 3, [i, i + 1, i + 2, i + 3]);
        }
      }
      // pentatonic fragments
      let k = 0;
      while (k + 4 <= L) {
        const win = ph.slice(k, k + 4), ivw = [0, 1, 2].map(m => Math.abs(win[m + 1].p - win[m].p)); let hit = null;
        if (ivw.every(v => v === 2 || v === 3) && ivw.includes(3) && new Set(win.map(z => mod(z.p, 12))).size === 4) {
          for (let rt = 0; rt < 12; rt++) if (win.every(z => [0, 2, 4, 7, 9].includes(mod(z.p - rt, 12)))) { hit = rt; break; }
        }
        if (hit !== null && win[0].chord) {
          let e = k + 4;
          while (e < L && [2, 3, 5].includes(Math.abs(ph[e].p - ph[e - 1].p)) && [0, 2, 4, 7, 9].includes(mod(ph[e].p - hit, 12))) e++;
          const c = win[0].chord, q = QMAP[c.q] || c.q;
          if (['dom', 'maj', 'min'].includes(q)) { const hl = []; for (let z = k; z < e; z++) hl.push(z); add(`pent|${mod(hit - c.root, 12)}|${q}`, ph, k, e - 1, hl); }
          k = e;
        } else k++;
      }
      // sequences
      const ivs = []; for (let m = 0; m < L - 1; m++) ivs.push(ph[m + 1].p - ph[m].p);
      k = 0;
      while (k + 7 <= ivs.length) {
        if (ivs[k] === ivs[k + 4] && ivs[k + 1] === ivs[k + 5] && ivs[k + 2] === ivs[k + 6] && ph[k].p !== ph[k + 4].p) {
          add('seq', ph, k, k + 7, [k, k + 1, k + 2, k + 3, k + 4, k + 5, k + 6, k + 7]); k += 4;
        } else k++;
      }
      // blues scales: 5+ notes all in one blues scale (major blues on m = minor blues on m+9) using its blue note (m+3)
      // by a half or whole step. Keyed by where the major-blues root sits above the chord root.
      { const MAJB = [0, 2, 3, 4, 7, 9]; let kk = 0;
        while (kk < L) {
          const c = ph[kk].chord; if (!c) { kk++; continue; }
          const q = QMAP[c.q] || c.q; let best = null;
          for (let off = 0; off < 12; off++) {
            const m = mod(c.root + off, 12); let e = kk;
            while (e < L && ph[e].chord && MAJB.includes(mod(ph[e].p - m, 12)) && (e === kk || (Math.abs(ph[e].p - ph[e - 1].p) >= 1 && Math.abs(ph[e].p - ph[e - 1].p) <= 5))) e++;
            if (e - kk < 5) continue;
            const rs = []; for (let z = kk; z < e; z++) rs.push(mod(ph[z].p - m, 12));
            if (new Set(rs).size < 4 || !rs.includes(3)) continue;
            const blue = rs.some((v, z) => v === 3 && ((z > 0 && Math.abs(ph[kk + z].p - ph[kk + z - 1].p) <= 2) || (z + 1 < rs.length && Math.abs(ph[kk + z + 1].p - ph[kk + z].p) <= 2)));
            if (!blue) continue;
            if (!best || e > best[1]) best = [off, e];
          }
          if (best && ['dom', 'maj', 'min'].includes(q)) { const hl = []; for (let z = kk; z < best[1]; z++) hl.push(z); add(`bls|${best[0]}|${q}`, ph, kk, best[1] - 1, hl); kk = best[1]; }
          else kk++;
        } }
      // guide tones across chord changes
      for (let m = 0; m < L - 1; m++) {
        const x = ph[m], y = ph[m + 1];
        if (x.chord && y.chord && x.chord !== y.chord && Math.abs(y.p - x.p) <= 2 && [3, 4, 10, 11].includes(rel(x)) && [3, 4, 10, 11].includes(rel(y)))
          add('guide', ph, m, m + 1, [m, m + 1]);
      }
    }
  }

  // ---------- ii–V moves (Sonny Rollins' Pent-Up House workbook) and Melodic Power cells, arpeggios, chromatic lines ----------
  const QQ = q => ({ maj6: 'maj', min6: 'min' }[q] || q);
  const CELLS = { maj: [['3567', [4, 7, 9, 11]], ['2356', [2, 4, 7, 9]]], dom: [['2367', [2, 4, 9, 10]], ['5712', [7, 10, 0, 2]]],
    min: [['3467', [3, 5, 9, 10]], ['2356', [2, 3, 7, 9]]], hd: [['1457', [0, 5, 6, 10]], ['3567', [3, 6, 8, 10]]] };
  const ARP7 = { maj: [['iii', [4, 7, 11, 2]], ['vi', [9, 0, 4, 7]]], dom: [['vi', [9, 0, 4, 7]], ['iii', [4, 7, 10, 2]]],
    min: [['III', [3, 7, 10, 2]], ['v', [7, 10, 2, 5]]], hd: [['iii', [3, 6, 10, 2]], ['VI', [8, 0, 3, 6]]] };
  const CHROM = { maj: [['3-1', 4, 0], ['7-5', 11, 7]], dom: [['3-1', 4, 0], ['9-7', 2, 10]], min: [['9-7', 2, 10], ['5-3', 7, 3]], hd: [['7-5', 10, 6]] };
  const sameSet = (a, b) => a.length === b.length && b.every(x => a.includes(x));
  function moves(Sx, found) {
    // a tighter window than add(): just the move, one note either side, so long ii–V–Is still fit
    const add = (fid, ph, i, j, hl) => {
      for (const pad of [1, 0]) {
        const a = Math.max(0, i - pad), b = Math.min(ph.length - 1, j + pad);
        const w = packWindow(ph.slice(a, b + 1), 12); if (!w) continue;
        w.hl = hl.map(k => k - a); (found[fid] = found[fid] || []).push(w); return;
      }
    };
    // across phrase breaks: the 9–♭13–9 line and the root walkdown are slow guide-tone moves, often split by rests
    { const ph = Sx.notes, L = ph.length; const runs = [];
      for (let i = 0; i < L; i++) { const c = ph[i].chord; if (!c) continue;
        if (runs.length && runs[runs.length - 1].c === c && runs[runs.length - 1].b === i - 1) runs[runs.length - 1].b = i; else runs.push({ c, a: i, b: i }); }
      for (let z = 1; z < runs.length; z++) {
        const A = runs[z - 1], B = runs[z], C = runs[z + 1];
        if (!(B.c.q === 'dom' && A.b === B.a - 1 && QQ(A.c.q) === 'min' && mod(B.c.root - A.c.root, 12) === 5)) continue;
        const toI = C && C.a === B.b + 1 && ['maj', 'min', 'dom'].includes(QQ(C.c.q)) && mod(C.c.root - B.c.root, 12) === 5;
        // 9 of the ii → ♭13 of the V (sometimes already on the ii) → 9 of the I, each a half step down
        if (toI) { let done = false;
          for (let i = A.a; i <= A.b && !done; i++) if (rel(ph[i]) === 2)
            for (let j = i + 1; j <= B.b && !done; j++) if (ph[j].p === ph[i].p - 1)
              for (let k = C.a; k <= C.b && k <= C.a + 3 && !done; k++) if (ph[k].p === ph[j].p - 1 && ph[k].t - ph[i].t <= 11) { add('iiv-9b13', ph, i, k, [i, j, k]); done = true; } }
        // root walkdown: root of the ii, its major 7th, ♭7, then the 3rd of the V, by half steps (other notes may sit in between)
        { let done = false;
          for (let i = A.a; i <= A.b && !done; i++) if (rel(ph[i]) === 0) {
            const pick = [i]; let last = i;
            for (const d of [1, 2, 3]) { let f = -1; for (let k = last + 1; k <= Math.min(L - 1, last + 3); k++) if (ph[k].p === ph[i].p - d) { f = k; break; } if (f < 0) break; pick.push(f); last = f; }
            if (pick.length === 4 && ph[last].chord === B.c && rel(ph[last]) === 4 && ph[last].t - ph[i].t <= 8) { add('iiv-walk', ph, i, last, pick); done = true; }
          } }
      } }
    for (const ph of phrases(Sx.notes)) {
      const L = ph.length;
      // runs of notes on one chord
      const runs = []; for (let i = 0; i < L; i++) { const c = ph[i].chord; if (!c) continue;
        if (runs.length && runs[runs.length - 1].c === c && runs[runs.length - 1].b === i - 1) runs[runs.length - 1].b = i; else runs.push({ c, a: i, b: i }); }
      for (let z = 0; z < runs.length; z++) {
        const B = runs[z], A = runs[z - 1], C = runs[z + 1];
        const isV = B.c.q === 'dom';
        const iiV = isV && A && A.b === B.a - 1 && QQ(A.c.q) === 'min' && mod(B.c.root - A.c.root, 12) === 5;
        const toI = isV && C && C.a === B.b + 1 && ['maj', 'min', 'dom'].includes(QQ(C.c.q)) && mod(C.c.root - B.c.root, 12) === 5;
        if (isV) {
          const rs = []; for (let k = B.a; k <= B.b; k++) rs.push(rel(ph[k]));
          // ii minor over the V: the ii chord's tones (5 ♭7 9 11 of the V), often its major 7th (the ♯11), no 3rd of the V
          // until the line lands; a chromatic passing note here and there is fine
          { let e = B.b; while (e > B.a && rel(ph[e]) === 4 && B.b - e < 2) e--;
            const idx = []; for (let k = B.a; k <= e; k++) idx.push(k);
            const II = [7, 9, 10, 0, 2, 5, 6];
            const passing = k => k > B.a && k < e && Math.abs(ph[k].p - ph[k - 1].p) <= 2 && Math.abs(ph[k + 1].p - ph[k].p) <= 2;
            const out = idx.filter(k => !II.includes(rel(ph[k])));
            const r2 = idx.map(k => rel(ph[k]));
            if (idx.length >= 4 && !r2.includes(4) && out.every(passing) && out.length * 4 <= idx.length &&
                (r2.includes(6) || (r2.includes(5) && new Set(r2.filter(r => [7, 10, 2, 5].includes(r))).size >= 3)))
              add('iiv-ii', ph, B.a, Math.min(B.b, e + 1), idx); }
          // the tonic over the V: the I chord's triad (11, 13, root of the V) before the I arrives
          if (toI && rs.length >= 3 && rs.every(r => [0, 2, 4, 5, 7, 9, 10].includes(r)) && rs.includes(5) && rs.includes(9) && rs.filter(r => [5, 9, 0].includes(r)).length / rs.length >= 0.6)
            add('iiv-tonic', ph, B.a, B.b, rs.map((_, k) => B.a + k));
          // augmented triad on the V
          for (let k = B.a; k + 2 <= B.b; k++) { const t = [k, k + 1, k + 2].map(x => rel(ph[x])); if (sameSet(t, [0, 4, 8])) { add('iiv-aug', ph, k, k + 2, [k, k + 1, k + 2]); break; } }
        }
        // cells and 7th-chord arpeggios from other chord tones: four notes on one chord, inside an octave or so
        const q = QQ(B.c.q);
        for (let k = B.a; k + 3 <= B.b; k++) {
          const w = [k, k + 1, k + 2, k + 3], rr = w.map(x => rel(ph[x])), ps = w.map(x => ph[x].p);
          if (new Set(rr).size < 4 || Math.max(...ps) - Math.min(...ps) > 14) continue;
          for (const [nm, set] of (CELLS[q] || [])) if (sameSet(rr, set)) add(`cell|${nm}|${q}`, ph, k, k + 3, w);
          const leaps = [0, 1, 2].every(m => [3, 4].includes(Math.abs(ps[m + 1] - ps[m])));
          if (leaps) for (const [nm, set] of (ARP7[q] || [])) if (sameSet(rr, set)) add(`arp7|${nm}|${q}`, ph, k, k + 3, w);
        }
        // chromatic lines: a chord tone down by half steps to the next chord tone (3→1, 7→5, 9→7, 5→3)
        for (const [nm, from, to] of (CHROM[q] || [])) {
          const n = mod(from - to, 12) + 1;
          for (let k = B.a; k + n - 1 <= B.b; k++) {
            if (rel(ph[k]) !== from) continue;
            let ok = true; for (let m = 1; m < n; m++) if (ph[k + m].p !== ph[k].p - m) { ok = false; break; }
            if (ok) { const hl = []; for (let m = 0; m < n; m++) hl.push(k + m); add(`chr|${nm}|${q}`, ph, k, k + n - 1, hl); break; }
          }
        }
      }
    }
  }

  // ---------- one solo in, examples out ----------
  const FL = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const bad = t => t.includes('𝄪') || t.includes('𝄫') || /^(B♯|E♯|C♭|F♭)/.test(t);
  function processSolo(xml, meta) {
    meta = meta || {};
    const Sx = parse(xml);
    const found = {};
    if (Sx.chords.length < 4) return { found, totals: {}, chords: Sx.chords.length };
    upDown(Sx, found); devices(Sx, found); moves(Sx, found);
    // concert pitch: a part written for a B♭ or E♭ horn says so in <transpose>
    const sh = meta.pitch != null ? (meta.pitch === 'bb' ? -2 : 0) : (Sx.transpose === -2 || Sx.transpose === -9 ? Sx.transpose : 0);
    const tonic = Sx.fifths != null ? mod(Sx.fifths * 7 + sh, 12) : null;
    for (const fid in found) for (const e of found[fid]) {
      e.solo = meta.title || 'Your solo'; e.id = meta.id || ''; e.player = meta.player || ''; e.tune = meta.tune || meta.title || 'Your solo';
      e.concert = sh !== 0;
      if (sh) for (const n of e.n) n[2] += sh;
      for (const c of e.ch) {
        c.r = mod(c.r + sh, 12);
        if (sh || bad(c.name)) { let suf = c.name.slice(1); while (['♭', '♯', '𝄪', '𝄫'].includes(suf[0])) suf = suf.slice(1); c.name = FL[c.r] + suf; }
      }
      if (sh || e.nm.some(bad)) e.nm = e.n.map(n => FL[mod(n[2], 12)]);
      if (tonic != null) e.tonic = tonic;
    }
    const totals = {}; for (const k in found) totals[k] = found[k].length;
    return { found, totals, chords: Sx.chords.length };
  }
  // A few examples per technique to show in the tabs: spread through the solo, about 8 notes long
  function pickExamples(list, n) {
    const sorted = list.slice().sort((a, b) => Math.abs(a.n.length - 8) - Math.abs(b.n.length - 8) || a.bar - b.bar);
    const out = [];
    for (const e of sorted) { if (out.some(p => Math.abs(p.bar - e.bar) <= 1)) continue; out.push(e); if (out.length >= n) break; }
    return out;
  }
  window.SoloProcessor = { parse, processSolo, pickExamples, _ex: { phrases, segments, classify, upDown, devices } };
})();
