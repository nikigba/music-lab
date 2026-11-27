// Music Lab offline: saves every file on first visit, then works without internet.
const VERSION = 'lab-88f3ce0f8d';
const FILES = ["baby-app.js", "baby-path.js", "baby-solfege.html", "baby-tunes.js", "baby.html", "blues-14.js", "blues-ear.js", "blues-moves.js", "blues-open.js", "blues-real.js", "blues-steps.js", "blues.html", "blues.js", "cell-library.js", "cell-licks.js", "color-map.html", "drone.js", "favorites.html", "home-away.html", "home-base.html", "icon-192.png", "icon-512.png", "ii-v-i.html", "iiv-trips.html", "index.html", "lab.js", "manifest.json", "melody-blocks.html", "metronome.html", "piano.js", "practice.html", "processor.js", "solo-ear.html", "solos-armstrong-ex.json", "solos-armstrong-standards.json", "solos-armstrong.json", "solos-builtin.json", "solos-monk-ex.json", "solos-monk.json", "solos-omnibook.json", "solos-wjd-ex.json", "solos-wjd.json", "stitt-licks.html", "sw-reg.js", "tj-builtin.json", "tj-index.json", "tj-omnibook.json", "tj-wjd.json", "triad-glow.html", "triad-pairs.html", "triad-palette.html", "triad-trainer.html", "triads-by-chord.html", "tune-journey.html"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(['./', ...FILES])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== 'fonts').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname.endsWith('fonts.googleapis.com') || u.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.open('fonts').then(c => c.match(e.request).then(r => r || fetch(e.request).then(res => { c.put(e.request, res.clone()); return res; }).catch(() => new Response('', {status: 503})))));
    return;
  }
  if (u.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(r => r || fetch(e.request)));
});
