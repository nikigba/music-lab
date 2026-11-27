'use strict';
/* Baby: one exercise per screen, resume where you left off, audio in one tap, check-ins that Claude reads. */

/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const k in (props || {})) {
    const v = props[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
const today = () => new Date().toLocaleDateString('en-CA');
const pick = a => a[Math.floor(Math.random() * a.length)];
const NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

/* ================= audio ================= */
let ctx = null, master = null, noiseBuf = null, live = [];
const buffers = {}; let pianoLoad = null, droneBuf = null, droneStart = 0, droneLoad = null, drone = null;
const DRONE_LOOP = 24.2548125;
let droneLevel = 0.11;
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
function b64ToBuf(url) {
  const bin = atob(url.slice(url.indexOf(',') + 1)), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    master = ctx.createGain(); master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -8; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = 0.003; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  loadPiano(); loadDrone();
  return ctx;
}
function loadPiano() {
  if (pianoLoad) return pianoLoad;
  pianoLoad = Promise.all(Object.entries(PIANO).map(([m, url]) =>
    new Promise(res => { const p = ctx.decodeAudioData(b64ToBuf(url), b => { buffers[m] = b; res(); }, () => res()); if (p && p.catch) p.catch(() => res()); })));
  return pianoLoad;
}
function loadDrone() {
  if (droneLoad) return droneLoad;
  droneLoad = new Promise(res => {
    const p = ctx.decodeAudioData(b64ToBuf(DRONE_URL), b => {
      droneBuf = b;
      const d = b.getChannelData(0); let i = 0;
      while (i < d.length && Math.abs(d[i]) < 0.002) i++;
      droneStart = i / b.sampleRate; res();
    }, () => res());
    if (p && p.catch) p.catch(() => res());
  });
  return droneLoad;
}
let pianoVol = 0.7;
/* ---------- all keys: one shift applied to every pitched sound (piano, band, drone).
   Numbers are always counted from home, so an exercise reads the same in every key. ---------- */
const KNAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const CYCLE = [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7];   // round the cycle of fourths, like the tunes move
let allKeys = false, babyKey = 0;
try { const v = JSON.parse(localStorage.getItem('baby:keys') || 'null'); if (v) { allKeys = !!v.on; babyKey = (v.k | 0) % 12; } } catch (e) {}
const keyShift = () => allKeys ? (babyKey > 6 ? babyKey - 12 : babyKey) : 0;   // stay within a tritone of C, so registers stay comfortable
const keyName = () => KNAMES[allKeys ? babyKey : 0];
function keySave() { try { localStorage.setItem('baby:keys', JSON.stringify({ on: allKeys, k: babyKey })); } catch (e) {} }
function piano(m, t, dur, scale = 1) {
  m = m + keyShift();
  let buf = buffers[m], rate = 1;
  if (!buf) {
    const ks = Object.keys(buffers).map(Number);
    if (!ks.length) return synth(m, t, dur);
    const near = ks.reduce((a, b) => Math.abs(b - m) < Math.abs(a - m) ? b : a);
    buf = buffers[near]; rate = Math.pow(2, (m - near) / 12);
  }
  const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
  const g = ctx.createGain();
  const end = Math.max(t + 0.3, Math.min(t + dur, t + buf.duration / rate));
  const v = pianoVol * scale;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.004);
  g.gain.setValueAtTime(v, Math.max(t + 0.01, end - 0.25));
  g.gain.linearRampToValueAtTime(0.0001, end);
  src.connect(g); g.connect(master);
  src.start(t); src.stop(end + 0.02);
  live.push({ srcs: [src], g });
}
function synth(m, t, dur) {
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
  o1.type = 'triangle'; o2.type = 'sine';
  o1.frequency.value = hz(m); o2.frequency.value = hz(m) * 2;
  const g2 = ctx.createGain(); g2.gain.value = 0.18;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
  o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  live.push({ srcs: [o1, o2], g });
}
function hat(t, v = 1) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.38 * v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
  src.connect(hp); hp.connect(g); g.connect(master); src.start(t, Math.random() * 0.5); src.stop(t + 0.1);
  live.push({ srcs: [src], g });
}
function click(t, hi) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = hi ? 1500 : 1000;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.08);
  live.push({ srcs: [o], g });
}
function wood(t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(950, t); o.frequency.exponentialRampToValueAtTime(620, t + 0.06);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.13);
  live.push({ srcs: [o], g });
}
function silenceNotes() {
  if (!ctx) return;
  const now = ctx.currentTime;
  live.forEach(({ srcs, g }) => {
    try { g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, now + 0.03); srcs.forEach(o => o.stop(now + 0.05)); } catch (e) {}
  });
  live = [];
}
async function startDrone() {
  if (drone) return;
  audio();
  const g = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime);
  drone = { g, src: null };
  await loadDrone();
  if (!drone || drone.g !== g || !droneBuf) return;
  const src = ctx.createBufferSource(); src.buffer = droneBuf;
  src.loop = true; src.loopStart = droneStart; src.loopEnd = droneStart + DRONE_LOOP;
  src.playbackRate.value = Math.pow(2, keyShift() / 12);
  src.connect(g); g.connect(master);
  src.start(ctx.currentTime, droneStart);
  g.gain.linearRampToValueAtTime(droneLevel, ctx.currentTime + 1.2);
  drone.src = src;
}
function stopDrone() {
  if (!drone) return;
  const { g, src } = drone, t = ctx.currentTime;
  g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.4);
  if (src) src.stop(t + 0.45);
  drone = null;
}
function setDroneLevel(v) { droneLevel = v; if (drone && ctx) drone.g.gain.setTargetAtTime(v, ctx.currentTime, 0.05); }
/* play a few notes now: notes = [midi], spread = seconds between notes (0 = chord) */
async function playNow(notes, dur = 1.6, spread = 0, vel = 1) {
  audio(); await loadPiano();
  const t0 = ctx.currentTime + 0.03;
  notes.forEach((m, i) => piano(m, t0 + i * spread, dur, vel));
  return t0;
}

/* ================= the band: plays a head with chords, bass, melody and pulse ================= */
const swingMap = (x, s) => { const w = Math.floor(x), f = x - w; return w + (f <= 0.5 ? f * (s / 0.5) : s + (f - 0.5) * ((1 - s) / 0.5)); };
const DEG = ['1', '♭2', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7'];
const rootName = c => DEG[((c.root % 12) + 12) % 12];
function voicing(ch) {
  const base = 55 + ((((ch.root + ch.iv[0]) - 55) % 12) + 12) % 12;
  return ch.iv.map(x => base + (x - ch.iv[0]));
}
/* Chord cards in numbers, coloured the same way as the Triad Color Map:
   the root is counted from home (1 = C), and the colour shows how far the chord's triad is from home
   (steps round the cycle of fifths, plus half a step for each note outside the major scale; warm = sharp side, green/blue = flat side). */
const CM_MAJOR = [0, 2, 4, 5, 7, 9, 11];
const cmAcc = n => n === 0 ? '' : n > 0 ? '♯'.repeat(n) : '♭'.repeat(-n);
function chordNum(c) {
  const m = /^([A-G])([♭♯b#]?)(.*)$/.exec(c.sym || '');
  if (!m) return rootName(c);
  const li = 'CDEFGAB'.indexOf(m[1]);
  let a = ((c.root - CM_MAJOR[li]) % 12 + 12) % 12; if (a > 6) a -= 12;
  const q = m[3].replace(/^o/, '°').replace(/b/g, '♭').replace(/#/g, '♯');
  return { r: cmAcc(a) + (li + 1), q };
}
// a card label: big root number with the chord quality raised, so 5⁷ never reads as fifty-seven
const chordEl = c => { const p = chordNum(c); return typeof p === 'string' ? h('span', { text: p }) : h('span', { class: 'cn' }, h('b', { text: p.r }), p.q ? h('sup', { text: p.q }) : null); };
function chordTriad(c) {
  const q = (/^[A-G][♭♯b#]?(.*)$/.exec(c.sym || '') || [, ''])[1];
  const sh = /^(ø|o|°|m7b5|dim)/.test(q) ? [0, 3, 6] : /^(m(?!aj)|-)/.test(q) ? [0, 3, 7] : /^(\+|aug)/.test(q) ? [0, 4, 8] : [0, 4, 7];
  return sh.map(x => (c.root + x) % 12);
}
const CM_RAMP = { sharp: ['#EED27A','#F1B56C','#EA937A','#CB8DB1','#958FD2','#6F86C8'], flat: ['#EED27A','#D2D879','#A2CC8C','#7DC0AF','#7DA7D0','#6F86C8'] };
function chordColor(c) {
  const r = ((c.root % 12) + 12) % 12, f = (r * 7) % 12, fifths = f > 6 ? f - 12 : f;
  const out = chordTriad(c).filter(p => !CM_MAJOR.includes(p)).length;
  const d = Math.abs(fifths) + 0.5 * out, stops = CM_RAMP[fifths < 0 ? 'flat' : 'sharp'];
  const x = Math.min(d, 6) / 6 * (stops.length - 1), i = Math.min(Math.floor(x), stops.length - 2), t = x - i;
  const hx = s => [1, 3, 5].map(k => parseInt(s.slice(k, k + 2), 16)), A = hx(stops[i]), B = hx(stops[i + 1]);
  return `rgb(${A.map((v, j) => Math.round(v + (B[j] - v) * t)).join(' ')})`;
}
const bassMidi = root => 40 + (((root - 4) % 12) + 12) % 12;
function scheduleBar(bar, bt, beat, s) {
  const L = s.layers, sw = s.swing;
  if (L.pulse) { hat(bt + beat, 1); hat(bt + 3 * beat, 0.9); }
  bar.c.forEach((ch, k) => {
    const next = bar.c[k + 1] ? bar.c[k + 1].t : 4, len = next - ch.t, at = bt + ch.t * beat;
    if (L.bass) {
      piano(bassMidi(ch.root), at, Math.min(len, 2) * beat * 0.97, 1.0);
      if (len >= 3) piano(bassMidi(ch.root), at + 2 * beat, (len - 2) * beat * 0.97, 0.8);
    }
    if (L.chd) {
      voicing(ch).forEach(m => piano(m, at, len * beat * 0.95, 0.42));
      if (len >= 4) voicing(ch).forEach(m => piano(m, bt + swingMap(2.5, sw) * beat, beat * 0.8, 0.26));
    }
  });
  if (L.mel) bar.m.forEach(n => {
    const a = swingMap(n.t, sw), b = swingMap(n.t + n.d, sw);
    piano(n.m, bt + a * beat, (b - a) * beat * 0.95 + 0.04, 0.95);
  });
}
const Play = {
  tok: 0, timer: null, timers: [], cfg: null,
  async start(cfg) {
    this.stop(); audio();
    const tok = ++this.tok; this.cfg = cfg;
    await loadPiano(); if (tok !== this.tok) return;
    const cur = { tune: cfg.tune, lo: cfg.lo, hi: cfg.hi, i: cfg.start != null ? cfg.start : cfg.lo };
    let bt = ctx.currentTime + 0.12, played = 0;
    const first = cfg.get();
    if (cfg.countIn) { const b = 60 / first.tempo; for (let k = 0; k < 4; k++) click(bt + k * b, k === 0); bt += 4 * b; }
    cfg.onStart && cfg.onStart();
    const sched = () => {
      if (tok !== Play.tok) return;
      while (bt < ctx.currentTime + 0.4) {
        const s = cfg.get(), beat = 60 / s.tempo, T = BABY_TUNES[cur.tune], bar = T.bars[cur.i];
        const dp = s.dropout, span = dp ? dp.play + dp.silent : 0;
        const silent = dp ? (played % span) >= dp.play : false;
        const back = !!dp && !silent && played > 0 && (played % span) === 0;
        if (!silent) scheduleBar(bar, bt, beat, s);
        const info = { i: cur.i, tune: cur.tune, silent, back, played };
        this.timers.push(setTimeout(() => { if (tok === Play.tok) cfg.onBar && cfg.onBar(info); }, Math.max(0, (bt - ctx.currentTime) * 1000)));
        bt += 4 * beat; played++; cur.i++;
        if (cur.i > cur.hi) { cur.i = cur.lo; if (cfg.onWrap) cfg.onWrap(cur); }
      }
    };
    this.timer = setInterval(sched, 40); sched();
  },
  stop() {
    this.tok++;
    clearInterval(this.timer); this.timer = null;
    this.timers.forEach(clearTimeout); this.timers = [];
    silenceNotes();
    const c = this.cfg; this.cfg = null;
    if (c && c.onStop) c.onStop();
  },
  get playing() { return !!this.cfg; }
};
function stopEverything() { Play.stop(); stopDrone(); stopSimple(); }
/* little loops used by the small widgets */
let simpleTimers = [];
function later(fn, ms) { const id = setTimeout(fn, ms); simpleTimers.push(id); return id; }
function stopSimple() { simpleTimers.forEach(clearTimeout); simpleTimers = []; if (window.__c7) { clearInterval(window.__c7); window.__c7 = null; } silenceNotes(); }

/* ================= saved state ================= */
const LS = 'baby:state';
let state = (() => { try { const v = JSON.parse(localStorage.getItem(LS) || 'null'); if (v && v.v === 1) return v; } catch (e) {} return { v: 1, at: 0, done: {}, checks: {}, repeats: {}, notes: {}, checkins: {}, log: [], opener: {}, bank: {}, last: null, welcomed: false, coachApplied: 0, coachSeen: 0, coach: null }; })();
let cloud = { baby: null, stateCol: null, checkCol: null, coachCol: null, ok: false };
let pushTimer = null;
function saveState() {
  state.at = Date.now();
  try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {}
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushState, 700);
}
async function pushState() {
  if (!cloud.stateCol) return;
  try { await cloud.stateCol.doc('main').set({ v: JSON.stringify(state), at: state.at }); } catch (e) {}
}
async function cloudInit() {
  try {
    if (!window.claude || !claude.use) return;
    const timeout = new Promise(r => setTimeout(() => r(null), 10000));
    const go = (async () => {
      const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
      const uid = user ? await user.id() : null;
      if (!db || !uid) return null;
      const baby = db.doc('data/users/' + uid + '/baby');
      return { baby, stateCol: baby.collection('state'), checkCol: baby.collection('checkins'), coachCol: baby.collection('coach'), uid };
    })().catch(() => null);
    const c = await Promise.race([go, timeout]);
    if (!c) return;
    Object.assign(cloud, c, { ok: true });
    // account copy vs this browser's copy: the newer one wins
    try {
      const snap = await cloud.stateCol.get();
      for (const d of snap.docs) if (d.id === 'main') {
        const v = d.data() || {}; let remote = null;
        try { remote = JSON.parse(v.v); } catch (e) {}
        if (remote && remote.v === 1 && (remote.at || 0) > (state.at || 0)) { state = remote; try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {} }
        else if (state.at > (remote ? remote.at || 0 : 0)) pushState();
      }
      if (!snap.docs.some(d => d.id === 'main') && state.at) pushState();
    } catch (e) {}
    await readCoach();
    render();
  } catch (e) {}
}
async function readCoach() {
  if (!cloud.coachCol) return;
  try {
    const snap = await cloud.coachCol.get();
    for (const d of snap.docs) if (d.id === 'now') {
      const v = d.data() || {}, at = +v.at || 0;
      if (at > (state.coachApplied || 0)) {
        let redo = v.redo; if (typeof redo === 'string') redo = redo.split(/[\s,]+/).filter(Boolean);
        redo = (Array.isArray(redo) ? redo : []).filter(id => BABY_PATH.byId[id]);
        redo.forEach(id => { delete state.done[id]; delete state.checks[id]; });
        state.coach = { note: String(v.note || ''), redo, at };
        state.coachApplied = at; state.coachSeen = 0;
        saveState();
      }
    }
  } catch (e) {}
}

/* ================= path logic ================= */
const ALL = BABY_PATH.all;
const stageOf = id => BABY_PATH.stages.find(s => s.id === BABY_PATH.byId[id].stage);
const isDone = id => !!state.done[id];
function stageComplete(sid) { return BABY_PATH.stages.find(s => s.id === sid).exercises.every(e => isDone(e.id)); }
function needsCheckin(sid) { return stageComplete(sid) && !state.checkins[sid]; }
/* the next thing to do: an exercise id, or {checkin: stageId}, or null when the slice is finished */
function nextStep() {
  for (const s of BABY_PATH.stages) {
    for (const e of s.exercises) if (!isDone(e.id)) return { ex: e.id };
    if (!state.checkins[s.id]) return { checkin: s.id };
  }
  return null;
}
function unlocked(id) {
  if (isDone(id)) return true;
  const n = nextStep();
  if (!n || n.checkin != null) return false;
  const idx = ALL.findIndex(e => e.id === id), cur = ALL.findIndex(e => e.id === n.ex);
  return idx <= cur;
}
function doneCount() { return ALL.filter(e => isDone(e.id)).length; }

/* ================= screens ================= */
const app = $('#app');
let view = { name: 'home' };
function go(v) { stopEverything(); view = v; window.scrollTo(0, 0); render(); }
function render() {
  app.replaceChildren();
  if (!state.welcomed) return app.append(welcome());
  if (view.name === 'ex') return app.append(exercise(view.id));
  if (view.name === 'checkin') return app.append(checkin(view.stage));
  if (view.name === 'bank') return app.append(bankScreen());
  app.append(home());
}

function welcome() {
  return h('div', { class: 'wrap' },
    h('h1', { text: 'Baby' }),
    h('p', { class: 'muted', text: 'You learn to speak three tunes the way a baby learns a language: listen a lot, copy, babble, and speak.' }),
    h('div', { class: 'card' },
      h('h2', { text: 'How it works' }),
      h('ol', { class: 'steps' },
        h('li', { text: 'One small exercise per screen. Press play, do the thing, answer the yes/no questions.' }),
        h('li', { text: 'Sing it before you play it. If you cannot sing it, you do not hear it yet.' }),
        h('li', { text: 'Wrong notes cost nothing. If a question is a “no”, repeat tomorrow.' }),
        h('li', { text: 'Listen to the three recordings all week. Hearing a lot is how babies do it.' }),
        h('li', { text: 'After each stage there is a check-in. Claude reads it and adjusts your path.' }))),
    h('button', { class: 'btn primary big', text: 'Start', onclick: () => { state.welcomed = true; saveState(); go({ name: 'home' }); } }));
}

function home() {
  const w = h('div', { class: 'wrap' });
  const n = nextStep(), total = ALL.length;
  w.append(h('div', { class: 'top' }, h('h1', { text: 'Baby' }), h('span', { class: 'badge', text: doneCount() + ' of ' + total + ' done' })));
  w.append(h('div', { class: 'progress' }, h('i', { style: 'width:' + Math.round(doneCount() / total * 100) + '%' })));

  if (state.coach && state.coach.at > (state.coachSeen || 0)) {
    const c = state.coach;
    w.append(h('div', { class: 'banner claude' },
      h('h3', { text: 'From Claude' }),
      h('p', { text: c.note || 'I looked at your check-in.' }),
      c.redo.length ? h('p', { class: 'small muted', text: 'Do again: ' + c.redo.map(id => id + ' ' + BABY_PATH.byId[id].title).join(', ') }) : null,
      h('button', { class: 'link', text: 'Got it', onclick: () => { state.coachSeen = c.at; saveState(); render(); } })));
  }

  // where you left off
  let cont;
  if (!n) {
    cont = h('div', { class: 'card gold' }, h('h2', { text: 'Stages 0 to ' + BABY_PATH.stages[BABY_PATH.stages.length - 1].id + ' are done' }), h('p', { class: 'muted', text: 'Tell Claude “check-in” and the next stages get built from what you answered.' }));
  } else if (n.checkin != null) {
    const s = BABY_PATH.stages.find(x => x.id === n.checkin);
    cont = h('div', { class: 'card gold' },
      h('h3', { text: 'Check-in time' }),
      h('h2', { text: 'Stage ' + s.id + ' (' + s.title + ') is finished' }),
      h('p', { class: 'muted', text: 'Two minutes of questions. The next stage opens after you save it.' }),
      h('button', { class: 'btn primary big', text: 'Do the check-in', onclick: () => go({ name: 'checkin', stage: s.id }) }));
  } else {
    const id = (state.last && !isDone(state.last) && unlocked(state.last)) ? state.last : n.ex, e = BABY_PATH.byId[id];
    cont = h('div', { class: 'card gold' },
      h('h3', { text: 'Where you left off' }),
      h('div', { class: 'row spread' }, h('h2', { text: e.id + '  ' + e.title }), h('span', { class: 'badge ' + (e.work ? 'work' : 'inst'), text: (e.work ? 'No instrument' : 'Instrument') + ' · ' + e.mins + ' min' })),
      state.repeats[e.id] ? h('p', { class: 'small muted', text: 'You are repeating this one. That is normal.' }) : null,
      h('button', { class: 'btn primary big', text: 'Continue', onclick: () => go({ name: 'ex', id }) }));
  }
  w.append(cont);

  // daily opener
  const openerDone = !!state.opener[today()];
  w.append(h('div', { class: 'card' },
    h('div', { class: 'row spread' }, h('h2', { text: 'Daily opener' }), h('span', { class: 'badge', text: openerDone ? 'done today' : '2 min' })),
    h('p', { class: 'muted', text: 'Same every day. Turn on the drone and hum 1 for 10 seconds. Then hear the home chord, and hum 1 again.' }),
    openerWidget()));

  // listening bank
  const mins = Math.round(state.bank[today()] || 0);
  w.append(h('div', { class: 'card' },
    h('div', { class: 'row spread' }, h('h2', { text: 'Listening bank' }), h('span', { class: 'badge', text: mins + ' min today' })),
    h('p', { class: 'muted', text: 'The three tunes on a loop. No task. Let it play while you work. Babies hear thousands of hours before they speak.' }),
    h('button', { class: 'btn', text: 'Open the listening bank', onclick: () => go({ name: 'bank' }) })));

  // stage map
  BABY_PATH.stages.forEach(s => {
    const box = h('div', { class: 'card stage' }, h('div', { class: 'row spread' }, h('h2', { text: 'Stage ' + s.id + ' · ' + s.title }), state.checkins[s.id] ? h('span', { class: 'badge work', text: 'check-in saved' }) : null), h('p', { class: 'small muted', text: s.blurb }));
    const chips = h('div', { class: 'chips' });
    s.exercises.forEach(e => {
      const ok = unlocked(e.id), cur = n && n.ex === e.id;
      chips.append(h('button', { class: 'chip ' + (isDone(e.id) ? 'done' : cur ? 'cur' : ok ? '' : 'lock'), text: (isDone(e.id) ? '✓ ' : '') + e.id, title: e.title, disabled: !ok || null, onclick: () => ok && go({ name: 'ex', id: e.id }) }));
    });
    box.append(chips);
    w.append(box);
  });
  w.append(h('p', { class: 'small dim', text: 'Stages ' + (BABY_PATH.stages.length) + ' to 11 (hearing the chord tones, answering, babbling, conversation, other keys) are built after you finish these.' }));
  return w;
}

function openerWidget() {
  const wrap = h('div', { class: 'row' });
  const dr = h('button', { class: 'tog gold', 'aria-pressed': 'false', text: 'Drone', onclick: () => {
    if (drone) { stopDrone(); dr.setAttribute('aria-pressed', 'false'); dr.textContent = 'Drone'; }
    else { startDrone(); dr.setAttribute('aria-pressed', 'true'); dr.textContent = 'Drone on'; }
  } });
  const chord = h('button', { class: 'btn sm', text: 'Hear 1 3 5', onclick: () => playNow([60, 64, 67], 3) });
  const done = h('button', { class: 'btn sm primary', text: state.opener[today()] ? 'Done today ✓' : 'I did it', onclick: () => { state.opener[today()] = true; saveState(); done.textContent = 'Done today ✓'; } });
  wrap.append(dr, chord, done);
  return wrap;
}

/* ---------- exercise screen ---------- */
/* All keys toggle on every lesson: same exercise, same numbers, a new key each time you press Next key */
function keyBar() {
  const changed = () => { stopEverything(); render(); };
  const bar = h('div', { class: 'keybar' });
  bar.append(h('button', { class: 'tog gold', 'aria-pressed': String(allKeys), text: allKeys ? 'All keys: on' : 'All keys',
    onclick: () => { allKeys = !allKeys; if (!allKeys) babyKey = 0; keySave(); changed(); } }));
  if (allKeys) {
    const i = CYCLE.indexOf(babyKey);
    bar.append(h('span', { class: 'keyname', text: 'Key: ' + keyName() }), h('span', { class: 'small muted', text: (i + 1) + ' of 12' }),
      h('button', { class: 'btn sm', text: 'Next key →', onclick: () => { babyKey = CYCLE[(i + 1) % 12]; keySave(); changed(); } }));
    bar.append(h('p', { class: 'small muted keyhint', text: 'Everything you hear moves to the new key. The numbers stay the same: 1 is always home.' }));
  }
  return bar;
}
/* previous / next lesson, so you do not have to go Home to move around. Next only opens lessons that are already unlocked. */
function lessonNav(id) {
  const i = ALL.findIndex(e => e.id === id), pv = ALL[i - 1], nx = ALL[i + 1];
  const mk = (txt, e, locked) => h('button', { class: 'btn ghost', text: txt, disabled: !e || locked || null,
    title: !e ? '' : locked ? 'Finish this lesson first to unlock ' + e.id : e.id + '  ' + e.title,
    onclick: () => e && !locked && go({ name: 'ex', id: e.id }) });
  return h('div', { class: 'row lessonnav' }, mk('← Previous' + (pv ? ': ' + pv.id : ''), pv, false), mk('Next' + (nx ? ': ' + nx.id : '') + ' →', nx, nx && !unlocked(nx.id)));
}
function exercise(id) {
  const e = BABY_PATH.byId[id], st = stageOf(id);
  state.last = id; saveState();
  const w = h('div', { class: 'wrap' });
  w.append(h('div', { class: 'top' }, h('button', { class: 'back', text: '← Home', onclick: () => go({ name: 'home' }) }), h('span', { class: 'badge', text: 'Stage ' + st.id + ' · ' + st.title })));
  w.append(lessonNav(id));
  w.append(h('div', { class: 'row spread' }, h('h1', { text: e.id + '  ' + e.title }), h('span', { class: 'badge ' + (e.work ? 'work' : 'inst'), text: (e.work ? 'No instrument' : 'Instrument') + ' · ' + e.mins + ' min' })));
  if (state.repeats[id] && !isDone(id)) w.append(h('p', { class: 'small muted', text: 'Round ' + (state.repeats[id] + 1) + '. Repeating is how it works.' }));
  w.append(h('div', { class: 'card' }, h('h3', { text: 'Do' }), h('ol', { class: 'steps' }, e.do.map(t => h('li', { text: t })))));
  w.append(keyBar());
  const wd = widget(e); if (wd) w.append(wd);
  w.append(h('div', { class: 'goal' }, h('b', { text: 'Goal: ' }), e.goal));
  if (e.real) {
    w.append(h('div', { class: 'row' }, h('span', { class: 'small muted', text: 'Hear it played for real:' }), e.real.map(k => h('a', { class: 'small', href: ytUrl(k), target: '_blank', rel: 'noopener', text: BABY_TUNES[k].name + ' ↗' }))));
  }
  // checks
  const checks = state.checks[id] || (state.checks[id] = e.checks.map(() => false));
  const doneBtn = h('button', { class: 'btn primary big', text: 'All yes: done', onclick: finish });
  const upd = () => { doneBtn.disabled = !checks.every(Boolean); };
  const box = h('div', { class: 'checks' }, e.checks.map((t, i) => {
    const b = h('button', { class: 'chk', 'aria-pressed': String(!!checks[i]), onclick: () => { checks[i] = !checks[i]; b.setAttribute('aria-pressed', String(checks[i])); saveState(); upd(); } },
      h('span', { class: 'box', text: '✓' }), h('span', { text: t }));
    return b;
  }));
  w.append(h('div', { class: 'card' }, h('h3', { text: 'Check yourself' }), h('p', { class: 'small muted', text: 'Be honest. A “no” is useful: it tells the next step what to do.' }), box));
  if (st.expect) w.append(h('div', { class: 'card' }, h('h3', { text: 'At this point you should be able to' }), h('ul', { class: 'small' }, st.expect.map(t => h('li', { text: t }))), st.notyet ? h('p', { class: 'small muted', text: 'Not yet expected: ' + st.notyet }) : null));
  const note = h('input', { type: 'text', placeholder: 'Anything Claude should know? (optional)', value: state.notes[id] || '' });
  note.addEventListener('change', () => { state.notes[id] = note.value.trim(); saveState(); });
  w.append(note);
  upd();
  w.append(h('div', { class: 'row' }, doneBtn, h('button', { class: 'btn ghost', text: 'Not yet: repeat tomorrow', onclick: notYet })));
  w.append(lessonNav(id));
  function finish() {
    state.notes[id] = note.value.trim();
    state.done[id] = { at: Date.now(), n: (state.repeats[id] || 0) + 1 };
    state.log.push({ id, at: Date.now(), n: state.done[id].n }); if (state.log.length > 80) state.log.shift();
    state.last = null; saveState();
    const n = nextStep();
    go(n && n.ex ? { name: 'ex', id: n.ex } : n && n.checkin != null ? { name: 'checkin', stage: n.checkin } : { name: 'home' });
  }
  function notYet() {
    state.repeats[id] = (state.repeats[id] || 0) + 1;
    state.notes[id] = note.value.trim();
    state.checks[id] = e.checks.map(() => false);
    state.last = null; saveState(); go({ name: 'home' });
  }
  return w;
}
const ytUrl = k => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(BABY_TUNES[k].yt);

/* ---------- check-in ---------- */
function checkin(sid) {
  const s = BABY_PATH.stages.find(x => x.id === sid);
  const a = { days: null, mins: null, hardest: 'none', stageQ: s.checkin.map(() => null), listen: null, text: '' };
  const w = h('div', { class: 'wrap' });
  w.append(h('div', { class: 'top' }, h('button', { class: 'back', text: '← Home', onclick: () => go({ name: 'home' }) }), h('span', { class: 'badge', text: 'Check-in · Stage ' + s.id })));
  w.append(h('h1', { text: 'Check-in: ' + s.title }));
  w.append(h('p', { class: 'muted', text: 'Honest answers only. This is how Claude knows what to give you next.' }));
  const submit = h('button', { class: 'btn primary big', text: 'Save check-in', disabled: true, onclick: save });
  const ready = () => { submit.disabled = !(a.days != null && a.mins != null && a.listen != null && a.stageQ.every(x => x != null)); };
  const choice = (label, opts, key) => {
    const row = h('div', { class: 'seg' });
    opts.forEach(([val, txt]) => { const b = h('button', { 'aria-pressed': 'false', text: txt, onclick: () => { a[key] = val; row.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); ready(); } }); row.append(b); });
    return h('div', { class: 'card' }, h('p', { text: label }), row);
  };
  w.append(choice('How many days did you practise since the last check-in?', [0, 1, 2, 3, 4, 5, 6, 7].map(n => [n, String(n)]), 'days'));
  w.append(choice('About how many minutes on a normal day?', [[15, '15'], [30, '30'], [60, '60'], [90, '90+']], 'mins'));
  w.append(choice('Did you listen to the three recordings outside this app?', [['barely', 'Barely'], ['some', 'Some days'], ['daily', 'Every day']], 'listen'));
  const sel = h('select', {}, h('option', { value: 'none', text: 'None, all felt fine' }), s.exercises.map(e => h('option', { value: e.id, text: e.id + ' ' + e.title })));
  sel.addEventListener('change', () => { a.hardest = sel.value; });
  w.append(h('div', { class: 'card' }, h('p', { text: 'Which exercise felt hardest?' }), sel));
  s.checkin.forEach((q, i) => {
    const row = h('div', { class: 'seg' });
    [['yes', 'Yes'], ['mostly', 'Mostly'], ['no', 'No']].forEach(([v, t]) => { const b = h('button', { 'aria-pressed': 'false', text: t, onclick: () => { a.stageQ[i] = v; row.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); ready(); } }); row.append(b); });
    w.append(h('div', { class: 'card' }, h('p', { text: q }), row));
  });
  const ta = h('textarea', { placeholder: 'Anything confusing, boring or too hard? Anything you loved?' });
  ta.addEventListener('input', () => { a.text = ta.value; });
  w.append(h('div', { class: 'card' }, h('p', { text: 'In your own words (optional)' }), ta));
  w.append(submit);
  async function save() {
    submit.disabled = true;
    const at = Date.now();
    const doneIds = s.exercises.map(e => ({ id: e.id, repeats: state.repeats[e.id] || 0, note: state.notes[e.id] || '' }));
    const rec = { at, stage: s.id, stageTitle: s.title, days: a.days, minutesPerDay: a.mins, listened: a.listen, hardest: a.hardest, answers: s.checkin.map((q, i) => ({ q, a: a.stageQ[i] })), text: a.text, exercises: doneIds, bankMinutesToday: Math.round(state.bank[today()] || 0) };
    state.checkins[s.id] = at;
    state.log.push({ checkin: s.id, at }); if (state.log.length > 80) state.log.shift();
    saveState();
    let sent = false;
    if (cloud.checkCol) { try { await cloud.checkCol.doc('c' + at).set({ at, stage: s.id, v: JSON.stringify(rec) }); sent = true; } catch (e) {} }
    app.replaceChildren(h('div', { class: 'wrap' },
      h('h1', { text: 'Saved' }),
      h('div', { class: 'card gold' },
        h('p', { text: sent ? 'Your check-in is saved to your account.' : 'Saved in this browser. It will reach your account when you open the Lab signed in.' }),
        h('p', { text: 'Now tell Claude: “check-in”. Claude reads your answers and may add exercises or ask you to redo some.' })),
      h('button', { class: 'btn primary big', text: 'Back to the path', onclick: () => go({ name: 'home' }) })));
    if (!sent && cloud.ok === false) cloudInit();
  }
  return w;
}

/* ---------- listening bank ---------- */
function bankScreen() {
  const w = h('div', { class: 'wrap' });
  w.append(h('div', { class: 'top' }, h('button', { class: 'back', text: '← Home', onclick: () => go({ name: 'home' }) }), h('span', { class: 'badge', text: 'Listening bank' })));
  w.append(h('h1', { text: 'Listening bank' }), h('p', { class: 'muted', text: 'The three heads, one after another, with chords, bass and pulse. Nothing to do. Hum along if you feel like it.' }));
  const order = ['pent', 'bounce', 'twnbay']; let idx = 0, secs = 0, shown = 0, tick = null;
  const status = h('div', { class: 'status', text: 'Press play.' }), clock = h('span', { class: 'badge', text: '0:00' });
  const mel = h('button', { class: 'tog', 'aria-pressed': 'true', text: 'Melody', onclick: () => mel.setAttribute('aria-pressed', String(mel.getAttribute('aria-pressed') !== 'true')) });
  const playBtn = h('button', { class: 'btn primary big', text: '\u25B6 Play', onclick: toggle });
  const get = () => ({ tempo: BABY_TUNES[order[idx]].tempo, swing: 0.667, layers: { mel: mel.getAttribute('aria-pressed') === 'true', chd: true, bass: true, pulse: true } });
  function show() { const t = BABY_TUNES[order[idx]]; status.textContent = 'Now playing: ' + t.name + ' (' + t.who + ' recorded it; this is our version)'; }
  function flush() { if (secs) { state.bank[today()] = (state.bank[today()] || 0) + secs / 60; secs = 0; saveState(); } }
  function toggle() {
    if (Play.playing) { Play.stop(); return; }
    Play.start({
      tune: order[idx], lo: 0, hi: BABY_TUNES[order[idx]].bars.length - 1, countIn: false, get,
      onStart: () => {
        playBtn.textContent = '\u25A0 Stop'; show(); clearInterval(tick);
        tick = setInterval(() => { secs++; shown++; clock.textContent = Math.floor(shown / 60) + ':' + String(shown % 60).padStart(2, '0'); if (secs >= 30) flush(); }, 1000);
      },
      onWrap: cur => { idx = (idx + 1) % order.length; cur.tune = order[idx]; cur.lo = 0; cur.hi = BABY_TUNES[order[idx]].bars.length - 1; cur.i = 0; show(); },
      onStop: () => { playBtn.textContent = '\u25B6 Play'; clearInterval(tick); flush(); status.textContent = 'Stopped.'; }
    });
  }
  w.append(h('div', { class: 'widget' }, h('div', { class: 'row spread' }, playBtn, clock), status, h('div', { class: 'row' }, mel)));
  w.append(h('p', { class: 'small muted', text: 'Tip: the real recordings are better for the daily loop. Use this one when you want to hear the chords clearly.' }));
  return w;
}

/* ================= widgets ================= */
function widget(e) {
  const w = e.widget; if (!w) return null;
  const fn = { recs: recsWidget, tune: tuneWidget, rhythm: rhythmWidget, homenote: homeNoteWidget, triad: triadWidget, away: awayWidget, homeaway: homeAwayWidget, blue: blueWidget, words: wordsWidget }[w.k];
  return fn ? fn(w) : null;
}
function tog(label, on, fn, cls = '') {
  const b = h('button', { class: 'tog ' + cls, 'aria-pressed': String(!!on), text: label });
  b.addEventListener('click', () => { const v = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(v)); fn(v); });
  return b;
}
function segment(opts, val, fn) {
  const row = h('div', { class: 'seg' });
  opts.forEach(([v, t]) => { const b = h('button', { 'aria-pressed': String(v === val), text: t, onclick: () => { row.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); fn(v); } }); row.append(b); });
  return row;
}
function tally(total) {
  const dots = h('div', { class: 'dots' }), label = h('span', { class: 'small muted', text: '' });
  const res = [];
  const draw = () => { dots.replaceChildren(...res.slice(-total).map(r => h('i', { class: r ? 'y' : 'n' }))); const last = res.slice(-total); label.textContent = last.length ? last.filter(Boolean).length + ' of ' + last.length : ''; };
  return { el: h('div', { class: 'row' }, dots, label), add(ok) { res.push(ok); draw(); }, reset() { res.length = 0; draw(); } };
}

/* --- recordings (0.0) --- */
function recsWidget() {
  const box = h('div', { class: 'widget' });
  ['pent', 'bounce', 'twnbay'].forEach(k => {
    const T = BABY_TUNES[k];
    const play = h('button', { class: 'btn sm', text: '▶ Our version', onclick: () => {
      if (play.dataset.on) { Play.stop(); return; }
      Play.start({ tune: k, lo: 0, hi: T.bars.length - 1, countIn: false, get: () => ({ tempo: T.tempo, swing: 0.667, layers: { mel: true, chd: true, bass: true, pulse: true } }),
        onStart: () => { play.dataset.on = '1'; play.textContent = '■ Stop'; }, onStop: () => { delete play.dataset.on; play.textContent = '▶ Our version'; } });
    } });
    box.append(h('div', { class: 'rec' }, h('div', {}, h('b', { text: T.name }), h('div', { class: 'small muted', text: T.who })), h('div', { class: 'row' }, play, h('a', { class: 'small', href: ytUrl(k), target: '_blank', rel: 'noopener', text: 'Find a recording ↗' }))));
  });
  return box;
}

/* --- the band with a bar chart --- */
function tuneWidget(cfg) {
  let key = cfg.tune, range = cfg.range ? cfg.range.slice() : null;
  let tempo = BABY_TUNES[key].tempo;
  const layers = Object.assign({}, cfg.layers);
  let dropout = false, groups = !!cfg.groups, hideChart = false;
  const root = h('div', { class: 'widget' });
  const status = h('div', { class: 'status muted', text: 'Tap a bar to start there.' });
  const chart = h('div', { class: 'chart' });
  const playBtn = h('button', { class: 'btn primary big', text: '▶ Play' });
  const tempoOut = h('output', { text: String(tempo) });
  const slider = h('input', { type: 'range', min: 60, max: 220, value: tempo });
  slider.addEventListener('input', () => { tempo = +slider.value; tempoOut.textContent = tempo; });
  const T = () => BABY_TUNES[key];
  const lo = () => range ? range[0] - 1 : 0, hi = () => range ? range[1] - 1 : T().bars.length - 1;
  let cells = [];
  function drawChart() {
    chart.replaceChildren(); cells = [];
    const t = T();
    for (let i = lo(); i <= hi(); i++) {
      const bar = t.bars[i];
      const shown = bar.c.filter(c => !c.held);
      const txt = cfg.chart === 'roots' ? bar.c.map(c => rootName(c)).join(' ') : shown.length ? null : '%';
      const hidden = cfg.chart === 'roots' && hideChart;
      const cols = bar.c.map(chordColor), n = cols.length;
      const strip = n === 1 ? cols[0] : `linear-gradient(90deg, ${cols.map((c, k) => `${c} ${k / n * 100}% ${(k + 1) / n * 100}%`).join(', ')})`;
      const cell = h('button', { class: 'bar' + (hidden ? ' hid' : '') + (groups && (i - lo()) % 4 === 0 ? ' g' : ''), 'aria-label': 'Bar ' + (i + 1), onclick: () => start(i) },
        hidden ? null : h('span', { class: 'strip', style: 'background:' + strip }),
        h('span', { class: 'n', text: String(i + 1) }),
        txt != null ? h('span', { class: 'c', text: txt }) : h('span', { class: 'c' }, ...shown.map(chordEl)));
      cells.push(cell); chart.append(cell);
    }
  }
  function start(from) {
    if (from == null) from = lo();
    audio();
    Play.start({
      tune: key, lo: lo(), hi: hi(), start: from, countIn: false,
      get: () => ({ tempo, swing: 0.667, layers, dropout: dropout ? { play: 8, silent: 4 } : null }),
      onStart: () => { playBtn.textContent = '■ Stop'; status.textContent = 'Playing: ' + T().name; },
      onBar: info => {
        cells.forEach(c => c.classList.remove('now', 'quiet'));
        const c = cells[info.i - lo()]; if (!c) return;
        c.querySelectorAll('.flash').forEach(x => x.remove());
        if (info.silent) { c.classList.add('quiet', 'now'); status.textContent = 'Silent. Keep going in your head.'; }
        else {
          c.classList.add('now');
          if (info.back) { status.textContent = 'Back in. Did you land together?'; }
          else if (!dropout) status.textContent = 'Playing: ' + T().name;
          if (groups && (info.i - lo()) % 4 === 0) { c.append(h('span', { class: 'flash', text: 'NEW' })); }
        }
      },
      onStop: () => { playBtn.textContent = '▶ Play'; cells.forEach(c => { c.classList.remove('now', 'quiet'); c.querySelectorAll('.flash').forEach(x => x.remove()); }); status.textContent = 'Stopped. Tap a bar to start there.'; }
    });
  }
  playBtn.addEventListener('click', () => { if (Play.playing) Play.stop(); else start(); });
  const top = h('div', { class: 'row' }, playBtn);
  root.append(top);
  const ctl = cfg.controls || [];
  if (cfg.pick === true) root.append(segment(['pent', 'bounce', 'twnbay'].map(k => [k, BABY_TUNES[k].name === 'There Will Never Be Another You' ? 'There Will Never' : BABY_TUNES[k].name]), key, k => {
    const was = Play.playing; Play.stop(); key = k; tempo = BABY_TUNES[k].tempo; slider.value = tempo; tempoOut.textContent = tempo; drawChart(); if (was) start(); }));
  if (cfg.pick === 'sections' || ctl.includes('sections')) root.append(segment(T().sections.map(s => [s[0], s[0]]), T().sections.find(s => range && s[1] === range[0])[0], v => {
    const s = T().sections.find(x => x[0] === v); const was = Play.playing; Play.stop(); range = [s[1], s[2]]; drawChart(); if (was) start(); }));
  root.append(h('label', { class: 'slider' }, 'Tempo', slider, tempoOut, h('span', { text: 'bpm' })));
  const opts = h('div', { class: 'row' });
  if (ctl.includes('dropout')) opts.append(tog('Drop out (4 silent bars)', false, v => { dropout = v; }, 'gold'));
  if (ctl.includes('groups')) opts.append(tog('Show group markers', groups, v => { groups = v; drawChart(); }));
  if (ctl.includes('reveal')) opts.append(tog('Hide the chart (eyes closed)', false, v => { hideChart = v; drawChart(); }, 'gold'));
  if (opts.children.length) root.append(opts);
  root.append(status, chart);
  root.append(h('details', {}, h('summary', { text: 'Mix: what you hear' }), h('div', { class: 'row', style: 'margin-top:10px' },
    tog('Melody', layers.mel, v => { layers.mel = v; }), tog('Chords', layers.chd, v => { layers.chd = v; }), tog('Bass', layers.bass, v => { layers.bass = v; }), tog('Pulse (2 and 4)', layers.pulse, v => { layers.pulse = v; }))));
  drawChart();
  return root;
}

/* --- speak the rhythm (0.3) --- */
const RHYTHMS = {
  pent: { name: 'Pent-Up House riff', bars: 1, hits: [0, 0.5, 1.5, 2, 3, 3.5], say: 'da da, rest, da da, rest, da da' },
  bounce: { name: 'Billie’s Bounce opening', bars: 1, hits: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], say: 'da da da da da da da da' },
  twnbay: { name: 'There Will Never opening', bars: 2, hits: [3, 4, 5, 6, 7], say: 'da (pickup), then da da da da' }
};
function rhythmWidget() {
  let key = 'pent', tempo = 110, sound = true, pulse = true;
  const root = h('div', { class: 'widget' });
  const slotsBox = h('div', {}), status = h('div', { class: 'status muted', text: 'Say it on “da”. Swung.' });
  const playBtn = h('button', { class: 'btn primary big', text: '▶ Play' });
  const tempoOut = h('output', { text: String(tempo) }), slider = h('input', { type: 'range', min: 60, max: 180, value: tempo });
  slider.addEventListener('input', () => { tempo = +slider.value; tempoOut.textContent = tempo; });
  let slotEls = [];
  function draw() {
    const R = RHYTHMS[key]; slotsBox.replaceChildren(); slotEls = [];
    for (let b = 0; b < R.bars; b++) {
      const row = h('div', { class: 'slots', style: b ? 'margin-top:8px' : '' });
      for (let i = 0; i < 8; i++) {
        const pos = b * 4 + i / 2, hit = R.hits.includes(pos);
        const s = h('div', { class: 'slot' + (hit ? ' hit' : '') + (i % 2 === 0 ? ' beat' : ''), text: hit ? 'da' : '·' });
        slotEls[b * 8 + i] = s; row.append(s);
      }
      slotsBox.append(row);
    }
    status.textContent = R.say;
  }
  function start() {
    audio();
    const R = RHYTHMS[key], loopBeats = R.bars * 4;
    Play.stop();
    const tok = ++Play.tok; Play.cfg = { onStop: () => { playBtn.textContent = '▶ Play'; slotEls.forEach(s => s.classList.remove('on')); } };
    playBtn.textContent = '■ Stop';
    const beat0 = 60 / tempo; let bt = ctx.currentTime + 0.12;
    for (let k = 0; k < 4; k++) click(bt + k * beat0, k === 0); bt += 4 * beat0;
    const sched = () => {
      if (tok !== Play.tok) return;
      while (bt < ctx.currentTime + 0.4) {
        const beat = 60 / tempo;
        for (let b = 0; b < R.bars; b++) { if (pulse) { hat(bt + (b * 4 + 1) * beat, 1); hat(bt + (b * 4 + 3) * beat, 0.9); } }
        R.hits.forEach(p => {
          const t = bt + swingMap(p, 0.667) * beat;
          if (sound) wood(t);
          const idx = Math.round(p * 2);
          Play.timers.push(setTimeout(() => { if (tok !== Play.tok) return; slotEls.forEach(s => s.classList.remove('on')); if (slotEls[idx]) slotEls[idx].classList.add('on'); }, Math.max(0, (t - ctx.currentTime) * 1000)));
        });
        bt += loopBeats * beat;
      }
    };
    Play.timer = setInterval(sched, 40); sched();
  }
  playBtn.addEventListener('click', () => { if (Play.playing) Play.stop(); else start(); });
  root.append(segment(Object.keys(RHYTHMS).map(k => [k, RHYTHMS[k].name]), key, k => { const was = Play.playing; Play.stop(); key = k; draw(); if (was) start(); }));
  root.append(playBtn, slotsBox, status);
  root.append(h('label', { class: 'slider' }, 'Tempo', slider, tempoOut, h('span', { text: 'bpm' })));
  root.append(h('div', { class: 'row' }, tog('Hear the “da”s”', true, v => { sound = v; }), tog('Pulse (2 and 4)', true, v => { pulse = v; })));
  draw();
  return root;
}

/* --- 1.1 home note --- */
function homeNoteWidget() {
  const root = h('div', { class: 'widget' });
  const status = h('div', { class: 'status', text: 'Turn on the drone, then sing 1.' });
  const t = tally(5);
  const dr = h('button', { class: 'tog gold', 'aria-pressed': 'false', text: 'Drone' });
  dr.addEventListener('click', () => { if (drone) { stopDrone(); dr.setAttribute('aria-pressed', 'false'); dr.textContent = 'Drone'; } else { startDrone(); dr.setAttribute('aria-pressed', 'true'); dr.textContent = 'Drone on'; } });
  const vol = h('input', { type: 'range', min: 2, max: 40, value: Math.round(droneLevel * 100) });
  vol.addEventListener('input', () => setDroneLevel(vol.value / 100));
  root.append(h('div', { class: 'row' }, dr, h('button', { class: 'btn sm', text: 'Hear 1', onclick: () => playNow([60], 4) }), h('button', { class: 'btn sm', text: 'Hear low 1', onclick: () => playNow([48], 4) })),
    h('label', { class: 'slider' }, 'Drone volume', vol));
  // test me
  const test = h('button', { class: 'btn primary', text: 'Test me' }), check = h('button', { class: 'btn', text: 'Check', disabled: true });
  const got = h('button', { class: 'btn sm', text: 'Got it', disabled: true }), missed = h('button', { class: 'btn sm', text: 'Missed', disabled: true });
  test.addEventListener('click', async () => {
    stopDrone(); dr.setAttribute('aria-pressed', 'false'); dr.textContent = 'Drone';
    const r = pick([1, 2, 3, 4, 5, 6, 8, 9, 10, 11]);
    const base = 55 + ((r - 7 + 12) % 12), q = pick([[0, 4, 7], [0, 3, 7]]);
    await playNow(q.map(i => base + i), 2.6);
    status.textContent = 'Now sing 1 from memory. Hold it. Then press Check.';
    check.disabled = false; got.disabled = true; missed.disabled = true;
  });
  check.addEventListener('click', async () => { await playNow([60], 3.5); status.textContent = 'That was 1. Were you within a half step?'; check.disabled = true; got.disabled = false; missed.disabled = false; });
  const score = ok => () => { t.add(ok); got.disabled = missed.disabled = true; status.textContent = ok ? 'Good.' : 'No problem. Again.'; };
  got.addEventListener('click', score(true)); missed.addEventListener('click', score(false));
  root.append(h('div', { class: 'row' }, test, check, got, missed), t.el);
  root.append(h('div', { class: 'row' }, h('button', { class: 'btn sm', text: 'Play the 5⁷ chord, then hum 1', onclick: async () => { stopDrone(); await playNow([43, 53, 59, 65], 6); status.textContent = 'Hum 1 over the 5⁷. Feel it want to go home.'; } })));
  root.append(status);
  return root;
}

/* --- 1.2 home triad --- */
function triadWidget() {
  const root = h('div', { class: 'widget' });
  const status = h('div', { class: 'status', text: 'Play the chord first. Then sing.' });
  const notes = [[60, '1', 'root'], [64, '3', '3rd'], [67, '5', '5th']];
  const keys = h('div', { class: 'big-keys' }, notes.map(([m, n, d]) => {
    const b = h('button', { class: 'key', onclick: () => { playNow([m], 1.8); b.classList.add('lit'); later(() => b.classList.remove('lit'), 500); } }, n, h('small', { text: d }));
    return b;
  }));
  root.append(keys, h('div', { class: 'row' },
    h('button', { class: 'btn', text: 'Chord', onclick: () => playNow([60, 64, 67], 3) }),
    h('button', { class: 'btn', text: 'Up', onclick: () => playNow([60, 64, 67], 1.2, 0.6) }),
    h('button', { class: 'btn', text: 'Up and down', onclick: () => playNow([60, 64, 67, 64, 60], 1.2, 0.6) })));
  // random note quiz
  const t = tally(10); let answer = null;
  const ans = h('div', { class: 'row' }, [['1', 0], ['3', 1], ['5', 2]].map(([lab, i]) => h('button', { class: 'btn', text: lab, onclick: () => {
    if (answer == null) return;
    const ok = answer === i; t.add(ok);
    status.innerHTML = ''; status.append(h('span', { class: ok ? 'good' : 'bad', text: ok ? 'Yes: ' : 'It was ' }), notes[answer][1] + ' (' + notes[answer][2] + ')');
    answer = null;
  } })));
  root.append(h('div', { class: 'row' }, h('button', { class: 'btn primary', text: 'Random note', onclick: async () => {
    answer = Math.floor(Math.random() * 3);
    await playNow([60, 64, 67], 1.6); later(() => playNow([notes[answer][0]], 2.2), 1900);
    status.textContent = 'Sing it. Which one: 1, 3 or 5?';
  } }), t.el), ans, status);
  return root;
}

/* --- 1.3 away triad --- */
function awayWidget() {
  const root = h('div', { class: 'widget' });
  const status = h('div', { class: 'status', text: '5 is in both chords.' });
  const C = [60, 64, 67], G = [59, 62, 67];
  const keys = h('div', { class: 'big-keys' }, [[55, '5', 'G', true], [59, '7', 'B', false], [62, '2', 'D', false]].map(([m, n, d, common]) => {
    const b = h('button', { class: 'key' + (common ? ' common' : ''), onclick: () => { playNow([m], 1.8); b.classList.add('lit'); later(() => b.classList.remove('lit'), 500); } }, n, h('small', { text: d + (common ? ' (shared)' : '') }));
    return b;
  }));
  root.append(keys, h('div', { class: 'row' },
    h('button', { class: 'btn', text: '1 chord', onclick: () => { playNow(C, 3); status.textContent = 'Home.'; } }),
    h('button', { class: 'btn', text: '5 chord', onclick: () => { playNow(G, 3); status.textContent = 'Away.'; } }),
    h('button', { class: 'btn', text: 'Sing 5 7 2 (up)', onclick: () => playNow([55, 59, 62], 1.2, 0.7) }),
    h('button', { class: 'btn', text: 'Up and down', onclick: () => playNow([55, 59, 62, 59, 55], 1.2, 0.7) })));
  const loop = h('button', { class: 'btn primary', text: 'Back and forth (hold 5)' });
  loop.addEventListener('click', async () => {
    stopSimple(); audio(); await loadPiano();
    let t = 0;
    for (let k = 0; k < 6; k++) {
      const home = k % 2 === 0;
      later(() => { playNow(home ? C : G, 3.4); status.textContent = home ? 'Home (1 chord). Hold 5.' : 'Away (5 chord). Same 5. Feel the change.'; }, t);
      t += 3400;
    }
    later(() => { status.textContent = 'Did the same 5 feel different?'; }, t);
  });
  root.append(loop, status);
  return root;
}

/* --- 1.4 home or away --- */
function homeAwayWidget() {
  const root = h('div', { class: 'widget' });
  const status = h('div', { class: 'status', text: 'Press Next.' });
  const t = tally(10); let cur = null, pace = 0.45;
  const HOME = [0, 4, 7], AWAY = [7, 11, 2];
  function voicingOf(kind) {
    const pcs = (kind === 'home' ? HOME : AWAY).slice(), inv = Math.floor(Math.random() * 3);
    for (let i = 0; i < inv; i++) pcs.push(pcs.shift());
    const out = []; let m = 55 + Math.floor(Math.random() * 7);
    pcs.forEach(pc => { while ((m % 12) !== pc || (out.length && m <= out[out.length - 1])) m++; out.push(m); });
    return out;
  }
  function playCur() { if (!cur) return; const arp = Math.random() < 0.5; playNow(cur.notes, 2.2, arp ? pace : 0); }
  const nextBtn = h('button', { class: 'btn primary', text: 'Next', onclick: () => {
    cur = { kind: Math.random() < 0.5 ? 'home' : 'away' }; cur.notes = voicingOf(cur.kind); cur.open = true;
    playCur(); status.textContent = 'Say it out loud: home or away? Then sing it back.';
  } });
  const answer = k => h('button', { class: 'btn', text: k === 'home' ? 'Home' : 'Away', onclick: () => {
    if (!cur || !cur.open) return; cur.open = false;
    const ok = cur.kind === k; t.add(ok);
    status.replaceChildren(h('span', { class: ok ? 'good' : 'bad', text: ok ? 'Yes. ' : 'No. ' }), 'It was ' + cur.kind + '. Sing it back, then press Next.');
  } });
  root.append(h('div', { class: 'row' }, nextBtn, h('button', { class: 'btn', text: 'Hear again', onclick: playCur }), t.el), h('div', { class: 'row' }, answer('home'), answer('away')));
  root.append(h('div', { class: 'row' }, h('span', { class: 'small muted', text: 'Pace' }), segment([[0.7, 'Slow'], [0.45, 'Medium'], [0.2, 'Fast']], 0.45, v => { pace = v; })));
  root.append(status, h('p', { class: 'small muted' }, 'Want more rounds? ', h('a', { href: 'home-base.html', text: 'Triad Home Base' }), ' has them.'));
  return root;
}

/* --- 1.5 blue third --- */
function blueWidget() {
  const root = h('div', { class: 'widget' });
  const status = h('div', { class: 'status', text: 'Bright is 3. Blue is ♭3.' });
  const dr = h('button', { class: 'tog gold', 'aria-pressed': 'false', text: 'Drone' });
  dr.addEventListener('click', () => { if (drone) { stopDrone(); dr.setAttribute('aria-pressed', 'false'); dr.textContent = 'Drone'; } else { startDrone(); dr.setAttribute('aria-pressed', 'true'); dr.textContent = 'Drone on'; } });
  const C7 = [36, 48, 55, 58, 64];
  const c7btn = h('button', { class: 'tog gold', 'aria-pressed': 'false', text: '1⁷ chord' });
  c7btn.addEventListener('click', () => {
    if (window.__c7) { clearInterval(window.__c7); window.__c7 = null; silenceNotes(); c7btn.setAttribute('aria-pressed', 'false'); return; }
    c7btn.setAttribute('aria-pressed', 'true'); playNow(C7, 4.2, 0, 0.7); window.__c7 = setInterval(() => playNow(C7, 4.2, 0, 0.7), 4000);
  });
  const note = (m, label, cls = '') => h('button', { class: 'btn ' + cls, text: label, onclick: () => playNow([m], 2.4) });
  root.append(h('div', { class: 'row' }, dr, c7btn),
    h('div', { class: 'row' }, note(64, '3 (bright)'), note(63, '♭3 (blue)'),
      h('button', { class: 'btn', text: 'Slide ♭3 → 3', onclick: async () => { audio(); await loadPiano(); const t = ctx.currentTime + 0.03; piano(63, t, 1.6); piano(64, t + 1.0, 1.8); } }),
      h('button', { class: 'btn', text: 'Riff shape: 5 3, 5 ♭3, 5 3', onclick: async () => { audio(); await loadPiano(); const t = ctx.currentTime + 0.03, b = 0.42; [[67, 0], [64, 1], [67, 2.5], [63, 3.5], [67, 5], [64, 6]].forEach(([m, k]) => piano(m, t + k * b, b * 1.2)); } })));
  // which one is blue?
  const t = tally(10); let ans = null;
  const status2 = h('div', { class: 'status muted', text: '' });
  const pickBtn = n => h('button', { class: 'btn', text: n === 1 ? 'First is blue' : 'Second is blue', onclick: () => {
    if (ans == null) return; const ok = ans === n; t.add(ok);
    status2.replaceChildren(h('span', { class: ok ? 'good' : 'bad', text: ok ? 'Yes. ' : 'No. ' }), 'The ' + (ans === 1 ? 'first' : 'second') + ' one was ♭3.'); ans = null;
  } });
  root.append(h('div', { class: 'row' }, h('button', { class: 'btn primary', text: 'Which one is blue?', onclick: async () => {
    ans = Math.random() < 0.5 ? 1 : 2; audio(); await loadPiano();
    const seq = ans === 1 ? [63, 64] : [64, 63]; const t0 = ctx.currentTime + 0.03; seq.forEach((m, i) => piano(m, t0 + i * 1.3, 1.5));
    status2.textContent = 'Which note was the blue one, the first or the second?';
  } }), t.el), h('div', { class: 'row' }, pickBtn(1), pickBtn(2)), status2, status);
  return root;
}


/* --- 3.4 which word is which --- */
const WORDS = { pent: { bars: [1, 2], pick: null }, bounce: { bars: [1, 1], pick: null }, twnbay: { bars: [1, 2], pick: 55 } };
function wordEvents(k) {
  const w = WORDS[k], t = BABY_TUNES[k], ev = [];
  if (w.pick) ev.push([w.pick, 0]);
  const off = w.pick ? 1 : 0;
  for (let b = w.bars[0] - 1; b <= w.bars[1] - 1; b++) t.bars[b].m.forEach(n => ev.push([n.m, off + (b - (w.bars[0] - 1)) * 4 + swingMap(n.t, 0.667)]));
  return ev;
}
function playWord(k, spb) {
  audio();
  return loadPiano().then(() => { const t0 = ctx.currentTime + 0.05; wordEvents(k).forEach(([m, x]) => piano(m, t0 + x * spb, spb * 0.9)); return wordEvents(k).slice(-1)[0][1] * spb + 1; });
}
function wordsWidget() {
  const root = h('div', { class: 'widget' });
  const status = h('div', { class: 'status', text: 'Press “Play a word”.' });
  const t = tally(10); let ans = null, spb = 0.36;
  const names = { pent: 'Pent-Up House', bounce: 'Billie’s Bounce', twnbay: 'There Will Never' };
  const slider = h('input', { type: 'range', min: 25, max: 60, value: Math.round(spb * 100) });
  const lab = h('output', { text: Math.round(60 / spb) + ' bpm' });
  slider.addEventListener('input', () => { spb = slider.value / 100; lab.textContent = Math.round(60 / spb) + ' bpm'; });
  const answers = ['pent', 'bounce', 'twnbay'].map(k => h('button', { class: 'btn', text: names[k], onclick: () => {
    if (!ans) return; const ok = ans === k; t.add(ok);
    status.replaceChildren(h('span', { class: ok ? 'good' : 'bad', text: ok ? 'Yes. ' : 'No. ' }), 'It was ' + names[ans] + '.'); ans = null;
  } }));
  root.append(h('div', { class: 'row' }, h('button', { class: 'btn primary', text: 'Play a word', onclick: async () => {
    ans = pick(['pent', 'bounce', 'twnbay']); await playWord(ans, spb); status.textContent = 'Which tune?';
  } }), t.el), h('div', { class: 'row' }, answers),
    h('div', { class: 'row' }, ['pent', 'bounce', 'twnbay'].map(k => h('button', { class: 'btn sm', text: 'Hear: ' + names[k], onclick: () => playWord(k, spb) }))),
    h('label', { class: 'slider' }, 'Tempo', slider, lab), status);
  return root;
}

/* ================= start ================= */
render();
cloudInit();
