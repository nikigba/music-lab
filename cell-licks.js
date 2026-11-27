/* Cells: the cell of the week as lines for Triad Home Base's own player (the ♪ Cells tab).
   Built lines are written for the cell; real lines are mined from the solo library (cell-library.js) and moved to C.
   To add a week's cell: push one entry onto CELLS. `ix` is the cell's index in Today's Practice's list.
   Notes are [midi, beats]; midi null = rest; C4 = 60. lickList() returns lines in Home Base's own lick format. */
(function () {
  if (window.CellsPlayer) return;
  const DAY = 864e5;
  const thisWeek = () => Math.floor(Date.now() / (7 * DAY)) % 8;
  const CELLS = [
    { ix: 7, deg: "♭3 · 3 · 5", pcs: [3, 4, 7], week: "16 Nov 2026", lib: "b3-3-5",
      d: "The blue rub resolved upward into the chord. Say it slow, then fast.",
      licks: [
        { t: "Say it plain", n: "The cell on the beat, then up to high home. Just the shape.", l: [[63, 1], [64, 1], [67, 1], [72, 3]] },
        { t: "Start from home", n: "1, then the cell, then 6 5 3 1 back down.", l: [[60, .5], [63, .5], [64, .5], [67, .5], [69, .5], [67, .5], [64, 1], [60, 2]] },
        { t: "Up the cell, down the scale", n: "The cell pushes up; the major scale walks you back home.", l: [[63, .5], [64, .5], [67, .5], [72, .5], [71, .5], [69, .5], [67, .5], [65, .5], [64, .5], [62, .5], [60, 2]] },
        { t: "Off the beat", n: "Same three notes, but they start on the and of 2. Feels like a different lick.", l: [[null, 1.5], [63, .5], [64, .5], [67, 1], [64, .5], [60, 2]] },
        { t: "Cell into the triad", n: "Low cell, then it keeps climbing the C triad to high home.", l: [[51, .5], [52, .5], [55, .5], [60, .5], [64, .5], [67, .5], [72, 2]] },
        { t: "Neighbours around the 3", n: "5 3 ♭3 3 5 3 1: the cell is the end of a little wiggle around the 3.", l: [[67, .5], [64, .5], [63, .5], [64, .5], [67, .5], [64, .5], [60, 2]] },
        { t: "Call and answer", n: "The cell, a breath, then the cell an octave up, then home.", l: [[63, .5], [64, .5], [67, 1], [null, 1], [75, .5], [76, .5], [79, 1], [null, .5], [72, 2]] },
        { t: "Past the 5 to the 7", n: "The cell keeps going to the 7 and leans into home.", l: [[60, 1], [63, .5], [64, .5], [67, .5], [71, .5], [72, 2]] },
        { t: "Slide in from the 2", n: "2 ♭3 3 5: the cell with a step in front, then 3 and home.", l: [[62, .5], [63, .5], [64, .5], [67, 1], [64, .5], [60, 2]] }
      ] },
    { ix: 0, deg: "1 · 2 · 3", pcs: [0, 2, 4], week: "19 Nov 2026", lib: "1-2-3",
      d: "The first steps away from home and back. Every nursery rhyme owns these; so did Armstrong.",
      licks: [
        { t: "Say it plain", n: "The cell on the beat, then up to high home. Just the shape.", l: [[60, 1], [62, 1], [64, 1], [72, 3]] },
        { t: "Up and back down", n: "1 2 3 and straight back: 3 2 1. Like a nursery rhyme.", l: [[60, .5], [62, .5], [64, 1], [62, .5], [60, 2.5]] },
        { t: "Cell, then the 5", n: "The cell, a hop to the 5, then step back down home.", l: [[60, .5], [62, .5], [64, .5], [67, .5], [64, .5], [62, .5], [60, 2]] },
        { t: "From the 5 below", n: "Start under home on 5, then the cell lifts you up.", l: [[55, 1], [60, .5], [62, .5], [64, 1], [62, .5], [60, 1.5]] },
        { t: "Off the beat", n: "Same three notes, but they start on the and of 2. Feels like a different lick.", l: [[null, 1.5], [60, .5], [62, .5], [64, 1], [62, .5], [60, 2]] },
        { t: "Cell into the triad", n: "Low cell, then it keeps climbing the C triad to high home.", l: [[48, .5], [50, .5], [52, .5], [55, .5], [60, .5], [64, .5], [67, .5], [72, 2]] },
        { t: "Turn around the 3", n: "5 3 1 then the cell 1 2 3, then back down: the cell inside a little wiggle.", l: [[67, .5], [64, .5], [60, .5], [62, .5], [64, .5], [62, .5], [60, 2]] },
        { t: "Call and answer", n: "The cell, a breath, then the cell an octave up, then home.", l: [[60, .5], [62, .5], [64, 1], [null, 1], [72, .5], [74, .5], [76, 1], [null, .5], [72, 2]] },
        { t: "Walk up the scale", n: "The cell keeps going: the major scale all the way to high home.", l: [[60, .5], [62, .5], [64, .5], [65, .5], [67, .5], [69, .5], [71, .5], [72, 2]] },
        { t: "Step in from the 7", n: "7 1 2 3: the leading note lands on home, the cell takes off from there.", l: [[59, .5], [60, .5], [62, .5], [64, 1], [62, .5], [60, 2]] }
      ] },
    { ix: 1, deg: "1 · ♭3 · 3", pcs: [0, 3, 4], week: "26 Nov 2026", lib: "1-b3-3",
      d: "The blues rub. Lean on the ♭3, let it melt into 3. The oldest trick in the music.",
      licks: [
        { t: "Say it plain", n: "The cell on the beat, then up to the 5. Just the shape.", l: [[60, 1], [63, 1], [64, 1], [67, 3]] },
        { t: "Up, then home", n: "The cell, the 5, then 3 and 1 back down.", l: [[60, 0.5], [63, 0.5], [64, 1], [67, 0.5], [64, 0.5], [60, 2]] },
        { t: "Blue rub twice", n: "The same rub two times in a row, then up to the 5.", l: [[60, 0.5], [63, 0.5], [64, 0.5], [60, 0.5], [63, 0.5], [64, 0.5], [67, 2]] },
        { t: "Off the beat", n: "Same three notes, but they start on the and of 2. Feels like a different lick.", l: [[null, 1.5], [60, 0.5], [63, 0.5], [64, 1], [62, 0.5], [60, 2]] },
        { t: "From the 5 below", n: "Start under home on the 5, then the rub lifts you up.", l: [[55, 0.5], [60, 0.5], [63, 0.5], [64, 1], [67, 0.5], [72, 2]] },
        { t: "Cell into the triad", n: "The rub, then the C triad up to high home and back.", l: [[60, 0.5], [63, 0.5], [64, 0.5], [67, 0.5], [72, 0.5], [67, 0.5], [64, 0.5], [60, 2]] },
        { t: "Cell, then scale down", n: "The rub pushes up; the major scale walks you back home.", l: [[60, 0.5], [63, 0.5], [64, 0.5], [67, 0.5], [65, 0.5], [64, 0.5], [62, 0.5], [60, 2]] },
        { t: "Call and answer", n: "The cell, a breath, then the cell an octave up, then home.", l: [[60, 0.5], [63, 0.5], [64, 1], [null, 1], [72, 0.5], [75, 0.5], [76, 1], [null, 0.5], [72, 2]] },
        { t: "Step in from the 2", n: "2 1 ♭3 3 5 3 1: a step in front, then the rub.", l: [[62, 0.5], [60, 0.5], [63, 0.5], [64, 1], [67, 0.5], [64, 0.5], [60, 2]] },
        { t: "Fall, then rub", n: "5 3 1, then the rub, then settle: the cell as the answer to a fall.", l: [[67, 0.5], [64, 0.5], [60, 0.5], [63, 0.5], [64, 1], [62, 0.5], [60, 2]] }
      ] },
    { ix: 2, deg: "3 · 5 · 6", pcs: [4, 7, 9], week: "3 Dec 2026", lib: "3-5-6",
      d: "The bright middle of the triad with the sun note. Pure 1920s: listen for it in your early solos.",
      licks: [
        { t: "Say it plain", n: "The cell on the beat, then up to high home. Just the shape.", l: [[64, 1], [67, 1], [69, 1], [72, 3]] },
        { t: "Up and home", n: "The cell, then back down 5 3 and home.", l: [[64, 0.5], [67, 0.5], [69, 1], [67, 0.5], [64, 0.5], [60, 2]] },
        { t: "Start from home", n: "1 3 5 6 and back down the scale: the cell sits inside the climb.", l: [[60, 0.5], [64, 0.5], [67, 0.5], [69, 0.5], [67, 0.5], [64, 0.5], [62, 0.5], [60, 2]] },
        { t: "Off the beat", n: "Same three notes, but they start on the and of 2.", l: [[null, 1.5], [64, 0.5], [67, 0.5], [69, 1], [67, 0.5], [64, 0.5], [60, 1.5]] },
        { t: "Past the 6 to home", n: "The cell, then over the top to high home and back.", l: [[64, 0.5], [67, 0.5], [69, 0.5], [72, 1], [69, 0.5], [67, 0.5], [64, 0.5], [60, 1.5]] },
        { t: "Sun note leans on 7", n: "3 5 6 7 1: the 6 leans on the 7, the 7 on home.", l: [[64, 0.5], [67, 0.5], [69, 0.5], [71, 0.5], [72, 2]] },
        { t: "Low cell, high home", n: "The cell low, then the triad climbs to high home.", l: [[52, 0.5], [55, 0.5], [57, 0.5], [60, 0.5], [64, 0.5], [67, 0.5], [72, 2]] },
        { t: "Call and answer", n: "The cell, a breath, then the cell an octave up, then home.", l: [[64, 0.5], [67, 0.5], [69, 1], [null, 1], [76, 0.5], [79, 0.5], [81, 1], [null, 0.5], [72, 2]] },
        { t: "Neighbours", n: "5 3 5 6 5 3 1: the cell hides inside a little wiggle around the 5.", l: [[67, 0.5], [64, 0.5], [67, 0.5], [69, 0.5], [67, 0.5], [64, 0.5], [60, 2]] },
        { t: "Step in from the 2", n: "2 3 5 6 5 3 1: a step in front, then the cell.", l: [[62, 0.5], [64, 0.5], [67, 0.5], [69, 1], [67, 0.5], [64, 0.5], [60, 1.5]] }
      ] },
    { ix: 3, deg: "5 · 6 · 1", pcs: [7, 9, 0], week: "10 Dec 2026", lib: "5-6-1",
      d: "The pentatonic turn home from above. Sing it before you play it.",
      licks: [
        { t: "Say it plain", n: "The cell, landing on high home and staying there.", l: [[67, 1], [69, 1], [72, 4]] },
        { t: "From below", n: "1 3 5 6 1: the cell comes out of the triad, then 5 3 1 back.", l: [[60, 0.5], [64, 0.5], [67, 0.5], [69, 0.5], [72, 1], [67, 0.5], [64, 0.5], [60, 1.5]] },
        { t: "Pentatonic turn", n: "The cell, then straight back down the pentatonic scale.", l: [[67, 0.5], [69, 0.5], [72, 0.5], [69, 0.5], [67, 0.5], [64, 0.5], [62, 0.5], [60, 2]] },
        { t: "Off the beat", n: "Same three notes, but they start on the and of 2.", l: [[null, 1.5], [67, 0.5], [69, 0.5], [72, 1], [69, 0.5], [67, 0.5], [60, 2]] },
        { t: "Cell, then climb", n: "The cell keeps going up the scale to the 5 and high home.", l: [[67, 0.5], [69, 0.5], [72, 0.5], [74, 0.5], [76, 0.5], [79, 1], [72, 2]] },
        { t: "Fall, then turn home", n: "Come down from the 3 and turn: 5 6 1 at the bottom of the fall.", l: [[76, 0.5], [74, 0.5], [72, 0.5], [69, 0.5], [67, 0.5], [69, 0.5], [72, 2]] },
        { t: "Low cell", n: "The cell low, then the triad up to high home.", l: [[55, 0.5], [57, 0.5], [60, 0.5], [64, 0.5], [67, 0.5], [72, 2]] },
        { t: "Call and answer", n: "The cell, a breath, then the cell an octave up, then home.", l: [[67, 0.5], [69, 0.5], [72, 1], [null, 1], [79, 0.5], [81, 0.5], [84, 1], [null, 0.5], [72, 2]] },
        { t: "Neighbour wiggle", n: "3 5 3 5 6 1: wiggle on the 3 and 5 first, then the cell.", l: [[64, 0.5], [67, 0.5], [64, 0.5], [67, 0.5], [69, 0.5], [72, 1], [69, 0.5], [67, 0.5], [64, 0.5], [60, 2]] },
        { t: "Step in from the 4", n: "4 5 6 1: a step in front, then the cell, then home.", l: [[65, 0.5], [67, 0.5], [69, 0.5], [72, 1], [69, 0.5], [67, 0.5], [64, 0.5], [60, 1.5]] }
      ] },
    { ix: 4, deg: "5 · ♭7 · 1", pcs: [7, 10, 0], week: "17 Dec 2026", lib: "5-b7-1",
      d: "The dominant backdoor into home. Darker; makes every arrival feel earned.",
      licks: [
        { t: "Say it plain", n: "The cell, landing on high home and staying there.", l: [[67, 1], [70, 1], [72, 4]] },
        { t: "Back through the 6", n: "The cell, then 6 5 3 1 back down.", l: [[67, 0.5], [70, 0.5], [72, 1], [69, 0.5], [67, 0.5], [64, 0.5], [60, 1.5]] },
        { t: "From home up", n: "1 3 5 ♭7 1: the cell comes out of the triad, then back down.", l: [[60, 0.5], [64, 0.5], [67, 0.5], [70, 0.5], [72, 1], [67, 0.5], [64, 0.5], [60, 1.5]] },
        { t: "Off the beat", n: "Same three notes, but they start on the and of 2.", l: [[null, 1.5], [67, 0.5], [70, 0.5], [72, 1], [69, 0.5], [67, 0.5], [60, 1.5]] },
        { t: "Round the top", n: "The cell, over the 2 and back down to home.", l: [[67, 0.5], [70, 0.5], [72, 0.5], [74, 0.5], [72, 0.5], [70, 0.5], [67, 0.5], [64, 0.5], [60, 2]] },
        { t: "Climb the dominant", n: "2 4 5 ♭7 1: up the dominant chord to home.", l: [[62, 0.5], [65, 0.5], [67, 0.5], [70, 0.5], [72, 2]] },
        { t: "Low cell, high home", n: "The cell low, then the triad climbs to high home.", l: [[55, 0.5], [58, 0.5], [60, 0.5], [64, 0.5], [67, 0.5], [72, 2]] },
        { t: "Call and answer", n: "The cell, a breath, then the cell an octave up, then home.", l: [[67, 0.5], [70, 0.5], [72, 1], [null, 1], [79, 0.5], [82, 0.5], [84, 1], [null, 0.5], [72, 2]] },
        { t: "Arpeggio of the dominant", n: "3 5 ♭7 1 and back: the cell inside the whole dominant arpeggio.", l: [[64, 0.5], [67, 0.5], [70, 0.5], [72, 0.5], [70, 0.5], [67, 0.5], [64, 0.5], [60, 2]] },
        { t: "Step in from the 4", n: "4 5 ♭7 1: a step in front, then the cell.", l: [[65, 0.5], [67, 0.5], [70, 0.5], [72, 1], [70, 0.5], [67, 0.5], [60, 2]] }
      ] },
    { ix: 5, deg: "7 · 1 · 2", pcs: [11, 0, 2], week: "24 Dec 2026", lib: "7-1-2",
      d: "The leaning notes around home. 7 pulls up, 2 falls down: home from both sides.",
      licks: [
        { t: "Say it plain", n: "The cell on the beat, then on up to the 3.", l: [[59, 1], [60, 1], [62, 1], [64, 3]] },
        { t: "Around home", n: "7 1 2 1 7 1: home with a lean on each side.", l: [[59, 0.5], [60, 0.5], [62, 0.5], [60, 0.5], [59, 0.5], [60, 2]] },
        { t: "From the 5 below", n: "5 7 1 2 3 1: the leaning notes inside a climb.", l: [[55, 0.5], [59, 0.5], [60, 0.5], [62, 0.5], [64, 1], [60, 2]] },
        { t: "Off the beat", n: "Same three notes, but they start on the and of 2.", l: [[null, 1.5], [59, 0.5], [60, 0.5], [62, 1], [64, 0.5], [60, 2]] },
        { t: "Cell into the triad", n: "The cell, then the triad up to high home.", l: [[59, 0.5], [60, 0.5], [62, 0.5], [64, 0.5], [67, 0.5], [72, 2]] },
        { t: "Leaning both ways", n: "2 7 1 2 3 2 1: home from both sides.", l: [[62, 0.5], [59, 0.5], [60, 0.5], [62, 0.5], [64, 0.5], [62, 0.5], [60, 2]] },
        { t: "Low cell", n: "The cell low, then the triad up to home.", l: [[47, 0.5], [48, 0.5], [50, 0.5], [52, 0.5], [55, 0.5], [60, 2]] },
        { t: "Call and answer", n: "The cell, a breath, then the cell an octave up, then home.", l: [[59, 0.5], [60, 0.5], [62, 1], [null, 1], [71, 0.5], [72, 0.5], [74, 1], [null, 0.5], [72, 2]] },
        { t: "Scale after the cell", n: "The cell, then up the scale and back down to home.", l: [[59, 0.5], [60, 0.5], [62, 0.5], [64, 0.5], [65, 0.5], [67, 0.5], [65, 0.5], [64, 0.5], [62, 0.5], [60, 2]] },
        { t: "Dip from the 3", n: "3 2 7 1 2 3 1: dip below home, then the cell lifts you out.", l: [[64, 0.5], [62, 0.5], [59, 0.5], [60, 0.5], [62, 0.5], [64, 1], [60, 2]] }
      ] },
    { ix: 6, deg: "1 · 6 · 5", pcs: [0, 9, 7], week: "31 Dec 2026", lib: "1-6-5",
      d: "Falling home through the sun note. The sound of early-jazz endings.",
      licks: [
        { t: "Say it plain", n: "The cell falling from high home, then 3 and 1 to finish.", l: [[72, 1], [69, 1], [67, 1], [64, 1], [60, 2]] },
        { t: "Early-jazz ending", n: "1 6 5 3 2 1: the classic fall home.", l: [[72, 0.5], [69, 0.5], [67, 1], [64, 0.5], [62, 0.5], [60, 2]] },
        { t: "From the 3", n: "3 1 6 5 3 5 1: come down onto the cell, then turn.", l: [[76, 0.5], [72, 0.5], [69, 0.5], [67, 0.5], [64, 0.5], [67, 0.5], [60, 2]] },
        { t: "Off the beat", n: "Same three notes, but they start on the and of 2.", l: [[null, 1.5], [72, 0.5], [69, 0.5], [67, 1], [64, 0.5], [60, 2]] },
        { t: "Fall through the triad", n: "The cell, then on down the triad to low 5 and home.", l: [[72, 0.5], [69, 0.5], [67, 0.5], [64, 0.5], [60, 0.5], [55, 0.5], [60, 2]] },
        { t: "Low version", n: "The same fall, an octave down.", l: [[60, 0.5], [57, 0.5], [55, 0.5], [52, 0.5], [48, 2]] },
        { t: "Up first, then fall", n: "Climb the triad, then fall back through the sun note.", l: [[60, 0.5], [64, 0.5], [67, 0.5], [72, 0.5], [69, 0.5], [67, 0.5], [64, 0.5], [60, 2]] },
        { t: "Call and answer", n: "The cell, a breath, then the cell an octave up, then home.", l: [[72, 0.5], [69, 0.5], [67, 1], [null, 1], [84, 0.5], [81, 0.5], [79, 1], [null, 0.5], [72, 2]] },
        { t: "Neighbour pull", n: "2 1 6 5 6 5 3 1: a lean on home, the cell, then a wiggle.", l: [[74, 0.5], [72, 0.5], [69, 0.5], [67, 0.5], [69, 0.5], [67, 0.5], [64, 0.5], [60, 2]] },
        { t: "Hand-off", n: "5 1 6 5 3 2 1: jump up to home, then fall through the cell.", l: [[67, 0.5], [72, 0.5], [69, 0.5], [67, 1], [64, 0.5], [62, 0.5], [60, 2]] }
      ] }
  ];

  /* Home Base's own piano samples (piano.js → window.PIANO), decoded once; the synth below is only a fallback */
  const pbuf = {}; let pkeys = [], pload = false, pp = null, dp = null, droneLvl = 1;
  const b64 = url => { const bin = atob(url.slice(url.indexOf(",") + 1)), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8.buffer; };
  function loadPiano(a) {
    const PI = typeof PIANO !== "undefined" ? PIANO : window.PIANO;   // piano.js declares it as a plain global const, so window.PIANO is empty
    if (pload || !PI) return; pload = true;
    pp = Promise.all(Object.entries(PI).map(([m, url]) => new Promise(res => a.decodeAudioData(b64(url), b => { pbuf[m] = b; pkeys = Object.keys(pbuf).map(Number).sort((x, y) => x - y); res(); }, () => res()))));
  }


  const isTone = m => [0, 4, 7].includes(((m % 12) + 12) % 12);   // the C triad, as everywhere in Home Base
  function mask(cell, l) {
    const idx = l.map(x => x[0]), mk = l.map(() => false);
    for (let i = 0; i + 2 < idx.length; i++)
      if (idx[i] != null && idx[i + 1] != null && idx[i + 2] != null && idx.slice(i, i + 3).every((m, j) => ((m % 12) + 12) % 12 === cell.pcs[j])) mk[i] = mk[i + 1] = mk[i + 2] = true;
    return mk;
  }
  function toL(cell, title, l, src, real, era0, bar) {
    const mk = mask(cell, l); let pos = 0, k = 0; const notes = [];
    l.forEach(([m, d], j) => { if (m != null) notes.push({ midi: m, t: +pos.toFixed(3), d, tone: isTone(m), cell: mk[j] }); pos += d; });
    return { r: 60, notes, skel: notes.filter(n => n.tone).map(n => n.midi), concept: "cell", ideas: [title], solo: real ? src : "", src, real, era0, bar };
  }
  /* every line for a cell, in Home Base's lick format; src is "all" | "real" | "built" */
  function lickList(ix, src) {
    const cell = CELLS[ix]; if (!cell) return [];
    if (!cell._all) {
      cell._all = cell.licks.map(x => toL(cell, x.t, x.l, "Cells · " + cell.deg + " · built line: " + x.t, false, false, 0))
        .concat(((window.CELL_LIB && window.CELL_LIB[cell.lib]) || []).map(r =>
          toL(cell, cell.deg + " cell · bar " + r.bar + " over " + r.ch, r.l, r.src.replace(" (unproofed)", "") + " · bar " + r.bar, true, r.era === 0, r.bar)));
    }
    return cell._all.filter(x => src === "real" ? x.real : src === "built" ? !x.real : true);
  }
  window.CellsPlayer = { cells: CELLS, thisWeek, lickList };
})();
