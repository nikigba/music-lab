/* Blues Vocab: a step player for the looping trainers (Ear, Moves), so they can pause and go back or forward like Triad Home Base.
   A session is a function that makes the next round as a list of steps {ph, show, els, asPlayed, pad}. Steps are scheduled just in time. */
const ENG = { on: false, queue: [], played: [], nextT: 0, make: null, iv: null, ui: [], raf: null, paused: false, my: 0 };
function engSched(st, t) {
  ENG.played.push({ st, start: t });
  if (st.show) ENG.ui.push({ time: t - 0.03, fn: st.show });
  curAsPlayed = !!st.asPlayed;
  if (st.slow) TEMPO_SCALE = 1 / (+$('lickSpeed').value || 1);
  schedule(st.ph, t, st.els || (() => []), ENG.my);
  const dur = swingT(st.ph.len) * beat();
  TEMPO_SCALE = 1; curAsPlayed = false;
  return t + dur + (st.pad || 0) * beat();
}
function engTick() {
  if (!ENG.on || ENG.my !== token || ENG.paused) return;
  const now = ctx.currentTime;
  while (ENG.nextT < now + 0.3) {
    if (!ENG.queue.length) { const r = ENG.make(); if (!r || !r.length) { stopAll(); return; } ENG.queue.push(...r); }
    ENG.nextT = engSched(ENG.queue.shift(), ENG.nextT);
  }
}
function engLoop() {
  if (!ENG.on) return;
  const now = ctx.currentTime;
  while (ENG.ui.length && ENG.ui[0].time <= now) { const e = ENG.ui.shift(); if (ENG.my === token) e.fn(); }
  ENG.raf = requestAnimationFrame(engLoop);
}
function engNav() {
  const show = (tab === 'home' && !(typeof eEx !== 'undefined' && eEx >= 4)) || tab === 'moves' || tab === 'real' || tab === 'f14';
  ['prevBtn', 'stopBtn', 'nextBtn'].forEach(id => { $(id).hidden = !show; $(id).disabled = !ENG.on; });
}
const _setTab = setTab;
setTab = function (t) { _setTab(t); engNav(); };
// a round with room to breathe: rests after each step, real licks slower and (if chosen) twice
function engRound(steps) {
  const out = [];
  steps.forEach(st => { out.push(st); if (st.slow && $('lickTwice').checked) out.push(Object.assign({}, st, { again: true })); });
  return out;
}
function engStart(make) {
  ENG.on = true; ENG.queue = []; ENG.played = []; ENG.ui = []; ENG.make = make; ENG.paused = false; ENG.my = token;
  playing = true; $('playBtn').textContent = '❚❚ Pause';
  ENG.nextT = ctx.currentTime + 0.12; engTick();
  ENG.iv = setInterval(engTick, 80); ENG.raf = requestAnimationFrame(engLoop); engNav();
}
function engHalt() {
  if (!ENG.on) return;
  ENG.on = false; clearInterval(ENG.iv); cancelAnimationFrame(ENG.raf); ENG.ui = [];
  if (ENG.paused && ctx) ctx.resume(); ENG.paused = false; engNav();
}
// stopping anything also stops a step session
const _stopAll = stopAll;
stopAll = function () { engHalt(); _stopAll(); };
function engPause() { if (!ENG.on || ENG.paused) return; ENG.paused = true; ctx.suspend(); $('playBtn').textContent = '▶ Resume'; }
function engResume() { if (!ENG.paused) return; ENG.paused = false; ctx.resume(); $('playBtn').textContent = '❚❚ Pause'; }
// ← back to what you just heard (or the one before, if this one only just started); → skip ahead
function engStep(dir) {
  if (!ENG.on || !ENG.played.length) return;
  engResume();
  const now = ctx.currentTime; let i = 0;
  for (let k = 0; k < ENG.played.length; k++) { if (ENG.played[k].start <= now) i = k; else break; }
  const j = dir < 0 ? (now - ENG.played[i].start > 1 ? i : Math.max(0, i - 1)) : i + 1;
  // cut what is sounding, keep the session going
  live.forEach(({ src, g }) => { try { g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, now + 0.03); src.stop(now + 0.04); } catch (e) {} });
  live = []; timers.forEach(clearTimeout); timers = [];
  document.querySelectorAll('.n.on, .playing').forEach(e => e.classList.remove('on', 'playing'));
  ENG.queue = ENG.played.slice(j).map(p => p.st).concat(ENG.queue);
  ENG.played.length = Math.min(j, ENG.played.length);
  ENG.ui = []; ENG.nextT = now + 0.12; engTick();
}
document.addEventListener('click', e => {
  if (e.target.closest('#prevBtn')) engStep(-1);
  else if (e.target.closest('#nextBtn')) engStep(1);
  else if (e.target.closest('#stopBtn')) stopAll();
});
document.addEventListener('keydown', e => {
  if (!ENG.on || (e.target.matches && e.target.matches('select, input:not([type=range]):not([type=checkbox])'))) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); engStep(-1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); engStep(1); }
});
