// ================= ÁUDIO (sintetizado com WebAudio) =================
const AU = { ctx: null, on: true, song: null, songName: null, step: 0, next: 0 };
function auInit() {
  try {
    if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const c = new C(); AU.ctx = c;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    AU.master = c.createGain(); AU.master.gain.value = 0.9; AU.master.connect(comp); comp.connect(c.destination);
    AU.music = c.createGain(); AU.music.gain.value = 0.32;
    AU.sfx = c.createGain(); AU.sfx.gain.value = 0.55;
    // reverberação
    const len = c.sampleRate * 2.4, ib = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ib.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const rev = c.createConvolver(); rev.buffer = ib; const rg = c.createGain(); rg.gain.value = 0.32; rev.connect(rg); rg.connect(AU.master);
    // eco
    const dl = c.createDelay(); dl.delayTime.value = 0.27; const fb = c.createGain(); fb.gain.value = 0.28;
    dl.connect(fb); fb.connect(dl); const dg = c.createGain(); dg.gain.value = 0.22; dl.connect(dg); dg.connect(AU.master); AU.delay = dl;
    AU.music.connect(AU.master); AU.music.connect(rev); AU.sfx.connect(AU.master); AU.sfx.connect(rev);
    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate); const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; AU.noiseBuf = nb;
    setInterval(schedule, 25);
    if (AU.pending) { const p = AU.pending; AU.pending = null; playSong(p); }
  } catch (e) { console.warn(e); }
}
function tone(t, f, d, o = {}) {
  const c = AU.ctx; const osc = c.createOscillator(); osc.type = o.type || 'square';
  osc.frequency.setValueAtTime(f, t); if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t + d);
  if (o.detune) osc.detune.value = o.detune;
  const g = c.createGain(); const v = o.vol ?? 0.2, a = o.a ?? 0.005, r = Math.min(o.r ?? 0.08, d * 0.8);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a);
  g.gain.setValueAtTime(v, t + Math.max(a, d - r)); g.gain.linearRampToValueAtTime(0.0001, t + d);
  let n = osc;
  if (o.lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; fl.Q.value = o.q || 0.8; osc.connect(fl); n = fl; }
  n.connect(g); g.connect(o.dest || AU.music); if (o.send) g.connect(AU.delay);
  if (o.vib) { const l = c.createOscillator(); l.frequency.value = 5.2; const lg = c.createGain(); lg.gain.value = o.vib; l.connect(lg); lg.connect(osc.frequency); l.start(t + 0.12); l.stop(t + d + 0.05); }
  osc.start(t); osc.stop(t + d + 0.05);
}
function noise(t, d, o = {}) {
  const c = AU.ctx; const s = c.createBufferSource(); s.buffer = AU.noiseBuf;
  const fl = c.createBiquadFilter(); fl.type = o.ft || 'highpass'; fl.frequency.setValueAtTime(o.f || 6000, t); fl.Q.value = o.q || 0.8;
  if (o.fEnd) fl.frequency.exponentialRampToValueAtTime(o.fEnd, t + d);
  const g = c.createGain(); const v = o.vol ?? 0.2; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
  s.connect(fl); fl.connect(g); g.connect(o.dest || AU.music); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
}
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(n) { const m = n.match(/^([A-G])([#b]?)(-?\d)$/); if (!m) return null; return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); }
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
function chordNotes(name) {
  const m = name.match(/^([A-G])([#b]?)(m|dim)?/); let r = 48 + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  if (r > 54) r -= 12;
  return m[3] === 'm' ? [r, r + 3, r + 7] : m[3] === 'dim' ? [r, r + 3, r + 6] : [r, r + 4, r + 7];
}
const SONGS = {
  title: { bpm: 82, lead: 'square', chords: 'Am F C G Am F G E', drums: 'k.......s.......', bass: 'x.......x...f...', arp: 1,
    mel: 'A4 - - B4 C5 - E5 -|F5 - - E5 D5 - C5 -|E5 - - D5 C5 - G4 -|B4 - - - G4 - - .|A4 - - B4 C5 - E5 -|A5 - - G5 F5 - E5 -|D5 - E5 - F5 - D5 -|E5 - - - - - - .' },
  town: { bpm: 112, lead: 'square', chords: 'C G Am F C G F G', drums: 'k...h...s...h.h.', bass: 'x...o...x...o...', arp: 0,
    mel: 'E5 - G5 - C6 - B5 A5|G5 - - - D5 - - .|C5 - E5 - A5 - G5 F5|E5 - - - C5 - - .|E5 - G5 - C6 - D6 C6|B5 - G5 - D5 - . .|A5 - G5 - F5 - E5 D5|D5 - - - G5 - - .' },
  forest: { bpm: 96, lead: 'triangle', chords: 'Dm Bb C Am Dm Bb Gm A', drums: 'k.....h.....s...', bass: 'x.....x...f.....', arp: 1,
    mel: 'D5 - - E5 F5 - A5 -|G5 - F5 - D5 - - .|E5 - - F5 G5 - E5 -|C5 - - - A4 - - .|D5 - - E5 F5 - A5 -|D6 - C6 - A5 - - .|G5 - F5 - E5 - D5 -|C#5 - - - - - - .' },
  crypt: { bpm: 70, lead: 'triangle', chords: 'Em C Em B Em Am B Em', drums: 'k.........k.....', bass: 'x.......x.......', arp: 1,
    mel: 'E5 - - - G5 - F#5 -|E5 - - - - - . .|B4 - - - C5 - B4 -|A#4 - - - B4 - - .|E5 - - - G5 - B5 -|A5 - - - C6 - - .|B5 - A5 - G5 - F#5 -|E5 - - - - - - .' },
  battle: { bpm: 150, lead: 'square', chords: 'Am Am F G Am Am F E', drums: 'k.h.s.h.k.kks.hs', bass: 'x.x.o.x.x.x.o.xo', arp: 1,
    mel: 'A5 - E5 A5 B5 - C6 B5|A5 - E5 - C5 - E5 -|F5 - A5 C6 B5 - A5 G5|G5 - B5 - D6 - B5 -|A5 - E5 A5 B5 - C6 D6|E6 - D6 C6 B5 - A5 -|F5 - G5 A5 G5 - F5 E5|G#5 - - - B5 - - -' },
  boss: { bpm: 160, lead: 'sawtooth', chords: 'Dm Dm Bb C Dm Dm Bb A', drums: 'k.hks.h.k.hks.ss', bass: 'x.x.x.o.x.x.x.o.', arp: 1,
    mel: 'D5 - D5 F5 A5 - G5 F5|E5 - F5 - D5 - - .|Bb5 - A5 G5 F5 - G5 A5|G5 - - - E5 - C5 -|D5 - D5 F5 A5 - D6 C6|A5 - C6 - D6 - - .|F6 - E6 D6 D6 - C6 Bb5|C#6 - - - A5 - - -' },
  future: { bpm: 100, lead: 'sawtooth', chords: 'Cm Ab Eb Bb Cm Ab Fm G', drums: 'k...s...k.k.s...', bass: 'x.o.x.o.x.o.x.o.', arp: 1,
    mel: 'C5 - - Eb5 G5 - - Bb5|Ab5 - G5 - Eb5 - - .|G5 - - F5 Eb5 - - D5|D5 - - - Bb4 - - .|C5 - - Eb5 G5 - C6 -|Ab5 - - - F5 - - .|F5 - G5 - Ab5 - F5 -|G5 - - - - - - .' },
  victory: { bpm: 128, lead: 'square', chords: 'C C F G C Am F G', drums: 'k.h.s.h.k.h.s.h.', bass: 'x...o...x...o...', arp: 1,
    mel: 'G5 G5 G5 - E5 - G5 -|C6 - - - - - - .|A5 - C6 - B5 - A5 -|G5 - - - - - - .|E5 - G5 - C6 - E6 -|D6 - C6 - A5 - - .|F5 - A5 - C6 - B5 -|C6 - - - - - - .' },
  ending: { bpm: 76, lead: 'triangle', chords: 'F C Dm Bb F C Bb C', drums: 'k.......s.......', bass: 'x.......f.......', arp: 1,
    mel: 'A5 - - G5 F5 - C5 -|E5 - - D5 C5 - - .|D5 - E5 - F5 - A5 -|G5 - - - - - - .|A5 - - C6 Bb5 - A5 -|G5 - - F5 E5 - C5 -|D5 - F5 - Bb5 - A5 -|G5 - - - F5 - - .' },
};
for (const k in SONGS) { const s = SONGS[k]; s.ch = s.chords.split(' ').map(chordNotes); s.m = s.mel.split('|').map(b => b.trim().split(/\s+/)); }
function playSong(name) {
  if (!AU.ctx) { AU.pending = name; AU.songName = name; return; }
  if (AU.songName === name && AU.song) return;
  AU.songName = name; AU.song = SONGS[name] || null; AU.step = 0; AU.next = AU.ctx.currentTime + 0.08;
  AU.music.gain.cancelScheduledValues(AU.ctx.currentTime);
  AU.music.gain.setValueAtTime(0.0, AU.ctx.currentTime); AU.music.gain.linearRampToValueAtTime(AU.on ? 0.32 : 0, AU.ctx.currentTime + 0.6);
}
function stopSong() { AU.song = null; AU.songName = null; }
function schedule() {
  if (!AU.ctx || !AU.song) return; const s = AU.song; const spb = 60 / s.bpm / 4;
  while (AU.next < AU.ctx.currentTime + 0.15) { try { playStep(s, AU.step, AU.next, spb); } catch (e) {} AU.next += spb; AU.step = (AU.step + 1) % (s.ch.length * 16); }
}
function playStep(s, step, t, spb) {
  const bar = Math.floor(step / 16), st = step % 16, ch = s.ch[bar % s.ch.length];
  if (st === 0) ch.forEach((n, i) => { tone(t, hz(n + 12), spb * 16, { type: 'sawtooth', vol: 0.028, a: 0.4, r: 0.6, lp: 1100, detune: i % 2 ? 8 : -8 }); });
  const bc = s.bass[st];
  if (bc && bc !== '.') { const n = bc === 'o' ? ch[0] - 12 + 12 : bc === 'f' ? ch[2] - 12 : ch[0] - 12; tone(t, hz(n), spb * 1.8, { type: 'triangle', vol: 0.22, r: 0.05 }); }
  if (s.arp) { const seq = [0, 1, 2, 1]; const n = ch[seq[st % 4]] + 24; tone(t, hz(n), spb * 0.8, { type: 'square', vol: 0.025, lp: 2600, send: 1 }); }
  const dc = s.drums[st];
  if (dc === 'k') tone(t, 140, 0.18, { type: 'sine', glide: 40, vol: 0.5, r: 0.12 });
  if (dc === 's') { noise(t, 0.16, { ft: 'bandpass', f: 1800, vol: 0.22 }); tone(t, 220, 0.08, { type: 'triangle', glide: 120, vol: 0.1 }); }
  if (dc === 'h' || dc === 's' && st % 4 === 2) noise(t, 0.04, { f: 8000, vol: 0.06 });
  if (st % 2 === 0) {
    const bar8 = s.m[bar % s.m.length], idx = st / 2, tok = bar8[idx];
    if (tok && tok !== '-' && tok !== '.') {
      let len = 1; for (let j = idx + 1; j < 8 && bar8[j] === '-'; j++) len++;
      const m = midi(tok); if (m) tone(t, hz(m), spb * 2 * len * 0.95, { type: s.lead, vol: s.lead === 'sawtooth' ? 0.05 : s.lead === 'triangle' ? 0.14 : 0.07, lp: 3200, vib: 4, send: 1, a: 0.01, r: 0.1 });
    }
  }
}
function sfx(name) {
  if (!AU.ctx || !AU.on) return; const t = AU.ctx.currentTime + 0.01, D = AU.sfx;
  switch (name) {
    case 'blip': tone(t, 880, 0.05, { vol: 0.08, dest: D }); break;
    case 'text': tone(t, 600 + Math.random() * 120, 0.025, { vol: 0.035, dest: D }); break;
    case 'select': tone(t, 660, 0.06, { vol: 0.1, dest: D }); tone(t + 0.06, 990, 0.08, { vol: 0.1, dest: D }); break;
    case 'cancel': tone(t, 500, 0.06, { vol: 0.1, dest: D }); tone(t + 0.06, 330, 0.08, { vol: 0.1, dest: D }); break;
    case 'step': noise(t, 0.04, { ft: 'lowpass', f: 900, vol: 0.12, dest: D }); break;
    case 'slash': noise(t, 0.18, { ft: 'bandpass', f: 3000, fEnd: 600, q: 2, vol: 0.4, dest: D }); break;
    case 'hit': tone(t, 180, 0.15, { type: 'square', glide: 60, vol: 0.2, lp: 900, dest: D }); noise(t, 0.12, { ft: 'lowpass', f: 2000, vol: 0.35, dest: D }); break;
    case 'crit': sfx('hit'); tone(t, 1320, 0.25, { type: 'square', vol: 0.08, dest: D }); tone(t + 0.07, 1760, 0.3, { type: 'square', vol: 0.07, dest: D }); break;
    case 'miss': noise(t, 0.25, { ft: 'bandpass', f: 1200, fEnd: 4000, q: 3, vol: 0.25, dest: D }); break;
    case 'bow': tone(t, 300, 0.12, { type: 'triangle', glide: 900, vol: 0.2, dest: D }); noise(t, 0.1, { f: 4000, vol: 0.1, dest: D }); break;
    case 'magic': for (let i = 0; i < 6; i++) tone(t + i * 0.04, hz(72 + i * 4), 0.2, { type: 'sine', vol: 0.08, dest: D, send: 1 }); break;
    case 'fire': noise(t, 0.7, { ft: 'lowpass', f: 1800, fEnd: 200, vol: 0.5, dest: D }); tone(t, 90, 0.6, { type: 'sawtooth', glide: 40, vol: 0.12, lp: 500, dest: D }); break;
    case 'dark': tone(t, 220, 0.5, { type: 'sawtooth', glide: 55, vol: 0.12, lp: 900, dest: D }); tone(t, 233, 0.5, { type: 'sawtooth', glide: 58, vol: 0.1, lp: 900, dest: D }); break;
    case 'holy': [76, 80, 83, 88].forEach((m, i) => tone(t + i * 0.06, hz(m), 0.5, { type: 'sine', vol: 0.09, dest: D, send: 1 })); break;
    case 'heal': [72, 76, 79, 84, 88].forEach((m, i) => tone(t + i * 0.07, hz(m), 0.35, { type: 'triangle', vol: 0.12, dest: D, send: 1 })); break;
    case 'dice': for (let i = 0; i < 5; i++) noise(t + i * 0.05 + Math.random() * 0.02, 0.03, { ft: 'bandpass', f: 2500 + Math.random() * 2000, q: 4, vol: 0.3, dest: D }); break;
    case 'success': [72, 76, 79, 84].forEach((m, i) => tone(t + i * 0.08, hz(m), 0.2, { vol: 0.08, dest: D })); break;
    case 'fail': [64, 61, 57].forEach((m, i) => tone(t + i * 0.12, hz(m), 0.2, { vol: 0.08, dest: D })); break;
    case 'level': [72, 76, 79, 84, 79, 84, 88].forEach((m, i) => tone(t + i * 0.09, hz(m), 0.18, { vol: 0.09, dest: D, send: 1 })); break;
    case 'death': tone(t, 400, 0.6, { type: 'square', glide: 60, vol: 0.1, lp: 1500, dest: D }); noise(t + 0.1, 0.5, { ft: 'lowpass', f: 800, vol: 0.2, dest: D }); break;
    case 'portal': for (let i = 0; i < 10; i++) tone(t + i * 0.05, hz(60 + (i * 7) % 24), 0.4, { type: 'sine', vol: 0.06, dest: D, send: 1 }); noise(t, 1.2, { ft: 'bandpass', f: 300, fEnd: 3000, vol: 0.15, dest: D }); break;
    case 'bell': [57, 69, 76].forEach(m => tone(t, hz(m), 2.5, { type: 'sine', vol: 0.15, r: 2, dest: D, send: 1 })); break;
    case 'boom': tone(t, 80, 0.8, { type: 'sine', glide: 30, vol: 0.5, dest: D }); noise(t, 0.8, { ft: 'lowpass', f: 1200, fEnd: 100, vol: 0.4, dest: D }); break;
    case 'coin': tone(t, 988, 0.06, { vol: 0.08, dest: D }); tone(t + 0.06, 1319, 0.2, { vol: 0.08, dest: D }); break;
  }
}
function toggleSound() { AU.on = !AU.on; if (AU.ctx) AU.music.gain.setTargetAtTime(AU.on ? 0.32 : 0, AU.ctx.currentTime, 0.1); return AU.on; }
