// ================= MOTOR: utilidades, sprites, mapas, renderização =================
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms * (window.FAST || 1)));
const rnd = n => Math.floor(Math.random() * n);
const mod = v => Math.floor((v - 10) / 2);
const sgn = v => (v > 0 ? '+' : '') + v;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function parseDice(s, u) {
  // "2d6+3", "1d10+L" (nível), "2d8+M" (mod de conjuração)
  const m = s.match(/^(\d+)d(\d+)(?:\+(\d+|L|M))?$/); if (!m) return { n: 0, s: 0, b: +s || 0 };
  let b = m[3] ? (m[3] === 'L' ? (u ? u.level : 1) : m[3] === 'M' ? (u ? castMod(u) : 0) : +m[3]) : 0;
  return { n: +m[1], s: +m[2], b };
}
function rollDice(str, u, crit) { const d = parseDice(str, u); let t = d.b; const n = crit ? d.n * 2 : d.n; for (let i = 0; i < n; i++) t += 1 + rnd(d.s); return Math.max(0, t); }
function avgDice(str, u) { const d = parseDice(str, u); return d.n * (d.s + 1) / 2 + d.b; }
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------- Sprites ----------
const atlasImg = new Image();
const FR = {};
function frames(key) {
  if (FR[key]) return FR[key];
  const src = ATLAS[key] || ATLAS['skull'];
  FR[key] = src.map(([x, y, w, h]) => {
    const c = mk(w, h); c.getContext('2d').drawImage(atlasImg, x, y, w, h, 0, 0, w, h);
    const wc = mk(w, h); const g = wc.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    return { c, wc, w, h };
  });
  return FR[key];
}
function animKeys(base) {
  if (ATLAS[base + '_idle_anim']) return { idle: base + '_idle_anim', run: ATLAS[base + '_run_anim'] ? base + '_run_anim' : base + '_idle_anim' };
  return { idle: base + '_anim', run: base + '_anim' };
}
const PORT = {};
function portrait(base, size = 64) {
  if (isRec(base)) return lpcPortrait(base, size);
  const k = base + size; if (PORT[k]) return PORT[k];
  const f = frames(animKeys(base).idle)[0]; const d = f.c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, f.w, f.h).data;
  let x0 = f.w, y0 = f.h, x1 = 0, y1 = 0; for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (d[(y * f.w + x) * 4 + 3] > 10) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1; const side = Math.min(Math.max(bw, 12), bh); const cx = x0 + bw / 2;
  const c = mk(size, size); const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const sx = Math.round(cx - side / 2); const sc = size / side * 0.92;
  g.drawImage(f.c, sx, y0, side, side, (size - side * sc) / 2, size - side * sc, side * sc, side * sc);
  PORT[k] = c.toDataURL(); return PORT[k];
}
// canvases animados de prévia (menus)
const PREVIEWS = [];
function spriteCanvas(base, scale = 3, weapon) {
  if (isRec(base)) { lpcComp(base); const c = mk(48 * scale, 58 * scale); c.className = 'spr'; c._rec = base; c._s = scale; PREVIEWS.push(c); return c; }
  const k = animKeys(base); const f0 = frames(k.idle)[0];
  const c = mk(Math.max(f0.w, 20) * scale + 8, f0.h * scale + 4); c.className = 'spr'; c._base = base; c._k = k; c._s = scale; c._w = weapon;
  PREVIEWS.push(c); return c;
}
function drawPreviews(t) {
  for (let i = PREVIEWS.length - 1; i >= 0; i--) {
    const c = PREVIEWS[i]; if (!c.isConnected) { if (c._seen) PREVIEWS.splice(i, 1); continue; } c._seen = 1;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height);
    if (c._rec) { const s = c._s; const f = lpcFrame(c._rec, 'walk', 2, 1 + Math.floor(t / 110) % 8); g.fillStyle = 'rgba(60,30,10,.25)'; g.beginPath(); g.ellipse(c.width / 2, c.height - 3 * s, 9 * s, 3 * s, 0, 0, 7); g.fill(); if (f) g.drawImage(f.c, f.sx + 8, f.sy + 4, 48, 58, 0, 0, 48 * s, 58 * s); continue; }
    const fr = frames(c._k.idle); const f = fr[Math.floor(t / 140) % fr.length]; const s = c._s;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(c.width / 2, c.height - 4, f.w * s * 0.35, 3 * s * 0.5, 0, 0, 7); g.fill();
    const x = (c.width - f.w * s) / 2, y = c.height - f.h * s - 2;
    g.drawImage(f.c, x, y, f.w * s, f.h * s);
    if (c._w) drawWeapon(g, c._w, x + f.w * s * 0.75, y + f.h * s * 0.62, s, false, t);
  }
}
function drawWeapon(g, key, x, y, s, flip, t, swing = 0) {
  const f = frames(key)[0]; g.save(); g.translate(x, y); if (flip) g.scale(-1, 1);
  g.rotate(0.35 + Math.sin(t / 300) * 0.05 + swing); g.drawImage(f.c, -f.w * s / 2, -f.h * s * 0.8, f.w * s, f.h * s); g.restore();
}

// ---------- Mapas ----------
const TT = { // tipos de piso
  grass: { top: ['#5fae46', '#53a03d'], l: '#8b5a36', r: '#6d4427', det: '#7fd060', walk: 1 },
  dirt: { top: ['#c09060', '#b4834f'], l: '#8b5a36', r: '#6d4427', det: '#d8b07a', walk: 1 },
  moss: { top: ['#3e8f4f', '#367f45'], l: '#5c4630', r: '#46351f', det: '#5fc070', walk: 1 },
  water: { top: ['#3c8fe0', '#3482d0'], l: '#245c9a', r: '#1c4a80', det: '#bfe6ff', walk: 0, liquid: 1 },
  bridge: { top: ['#a8743f', '#94632f'], l: '#6d4427', r: '#55331b', det: '#d29a5e', walk: 1, plank: 1 },
  stone: { top: ['#8e8b9e', '#83809a'], l: '#646175', r: '#4f4c62', det: '#b0adc0', walk: 1, crack: 1 },
  ash: { top: ['#5e4c4c', '#544343'], l: '#3e3131', r: '#302525', det: '#8a6f6a', walk: 1, crack: 1 },
  lava: { top: ['#ff7a20', '#ff5a10'], l: '#8a2a10', r: '#6a1c08', det: '#ffe070', walk: 0, liquid: 1, glow: 1 },
  marble: { top: ['#d9d3ee', '#cbc4e3'], l: '#9e98c0', r: '#837ca8', det: '#f2c94c', walk: 1, gold: 1 },
};
function genMap(theme, seed) {
  return genGeneric(theme, seed);
  for (let att = 0; att < 40; att++) {
    const R = mulberry(seed * 1000 + att * 7919); const N = theme === 'tower' ? 11 : 10;
    const g = []; const cs = 4; const gv = []; for (let i = 0; i <= cs; i++) { gv.push([]); for (let j = 0; j <= cs; j++) gv[i].push(R()); }
    const maxH = { village: 2, forest: 3, crypt: 1, future: 3, tower: 2 }[theme];
    for (let y = 0; y < N; y++) { g.push([]); for (let x = 0; x < N; x++) {
      const fx = x / (N - 1) * cs, fy = y / (N - 1) * cs, ix = Math.min(cs - 1, Math.floor(fx)), iy = Math.min(cs - 1, Math.floor(fy)), tx = fx - ix, ty = fy - iy;
      const v = gv[iy][ix] * (1 - tx) * (1 - ty) + gv[iy][ix + 1] * tx * (1 - ty) + gv[iy + 1][ix] * (1 - tx) * ty + gv[iy + 1][ix + 1] * tx * ty;
      g[y].push({ x, y, h: Math.round(v * maxH * 1.2), t: 'grass', obj: null, deco: null, light: null });
    } }
    const T = (x, y) => g[y] && g[y][x];
    const all = g.flat();
    const pz = all.filter(c => c.x + c.y >= 2 * N - 5); // zona do grupo (frente)
    const ez = all.filter(c => c.x + c.y <= 4); // zona inimiga (fundo)
    if (theme === 'village') {
      all.forEach(c => { if (Math.abs(c.x - c.y) <= 0 || c.x - c.y === 1) c.t = 'dirt'; if (R() < .06 && c.t === 'grass') c.deco = 'flower'; });
      [[0, 9], [1, 9], [0, 8]].forEach(([x, y]) => { const c = T(x, y); c.t = 'water'; c.h = 0; });
      [[8, 1], [1, 3]].forEach(([x, y]) => { T(x, y).obj = 'house'; });
      for (let i = 0; i < 7; i++) { const c = T(rnd2(R, N), rnd2(R, N)); if (c.t === 'grass' && !c.obj) c.obj = 'tree'; }
      for (let i = 0; i < 4; i++) { const c = T(rnd2(R, N), rnd2(R, N)); if (c.t === 'grass' && !c.obj) c.obj = R() < .5 ? 'crate' : 'lantern'; }
      [[3, 2], [6, 5], [2, 6], [7, 7]].forEach(([x, y]) => { const c = T(x, y); if (!c.obj && c.t !== 'water') c.obj = 'lantern'; });
    } else if (theme === 'forest') {
      all.forEach(c => { c.t = R() < .5 ? 'moss' : 'grass'; if (R() < .08) c.deco = 'mush'; });
      const rx = 3 + Math.floor(R() * 3);
      for (let y = 0; y < N; y++) { const x = rx + Math.round(Math.sin(y * 0.7) * 1.2); [x, x + 1].forEach(xx => { const c = T(xx, y); if (c) { c.t = 'water'; c.h = 0; } }); }
      [2, 6].forEach(by => { for (let x = 0; x < N; x++) { const c = T(x, by); if (c.t === 'water') { c.t = 'bridge'; c.h = 1; } } });
      for (let i = 0; i < 16; i++) { const c = T(rnd2(R, N), rnd2(R, N)); if (c.t !== 'water' && c.t !== 'bridge' && !c.obj) c.obj = R() < .8 ? 'pine' : 'rock'; }
    } else if (theme === 'crypt') {
      all.forEach(c => { c.t = 'stone'; c.h = (c.x + c.y <= 5) ? 2 : c.h; if (R() < .07) c.deco = 'bones'; });
      [[2, 2], [2, 7], [7, 2], [7, 7], [4, 4]].forEach(([x, y]) => { const c = T(x, y); c.obj = 'pillar'; c.light = '#ffb050'; });
      [[0, 4], [4, 0]].forEach(([x, y]) => { const c = T(x, y); c.obj = 'brazier'; c.light = '#ff9040'; });
      for (let i = 0; i < 3; i++) { const c = T(rnd2(R, N), rnd2(R, N)); if (!c.obj) c.deco = 'skull'; }
    } else if (theme === 'future') {
      all.forEach(c => { c.t = 'ash'; if (R() < .1) c.deco = 'skull'; });
      for (let i = 0; i < 2; i++) { const cx = 2 + rnd2(R, N - 4), cy = 2 + rnd2(R, N - 4); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 0; dx++) { const c = T(cx + dx, cy + dy); if (c && R() < .8) { c.t = 'lava'; c.h = 0; c.light = '#ff6020'; } } }
      for (let i = 0; i < 6; i++) { const c = T(rnd2(R, N), rnd2(R, N)); if (c.t === 'ash' && !c.obj) c.obj = R() < .5 ? 'ruin' : 'deadtree'; }
    } else if (theme === 'tower') {
      const m = (N - 1) / 2;
      all.forEach(c => { const d = Math.hypot(c.x - m, c.y - m); c.t = 'marble'; c.h = d < 1.6 ? 2 : d < 3.2 ? 1 : 0; if (d > 5.3) c.t = null; });
      [[1, 5], [9, 5], [5, 1], [5, 9]].forEach(([x, y]) => { const c = T(x, y); if (c.t) { c.obj = 'crystal'; c.light = '#a080ff'; } });
    }
    // suavizar alturas (salto máximo 2)
    for (let k = 0; k < 4; k++) all.forEach(c => { [[1, 0], [0, 1]].forEach(([dx, dy]) => { const n = T(c.x + dx, c.y + dy); if (n && c.t && n.t && Math.abs(n.h - c.h) > 2) n.h = c.h + Math.sign(n.h - c.h) * 2; }); });
    // limpar zonas de entrada
    const clean = c => { if (c.t && !TT[c.t].walk) c.t = theme === 'future' ? 'ash' : theme === 'crypt' ? 'stone' : theme === 'tower' ? 'marble' : 'grass'; c.obj = null; c.light = null; };
    const pzs = pz.filter(c => c.t).sort((a, b) => (b.x + b.y) - (a.x + a.y)).slice(0, 8); pzs.forEach(clean);
    const ezs = ez.filter(c => c.t).sort((a, b) => (a.x + a.y) - (b.x + b.y)).slice(0, 9); ezs.forEach(clean);
    const map = { N, g, theme, pz: pzs, ez: ezs };
    // conectividade
    const seen = bfsAll(map, pzs[0], 2); if (ezs.every(c => seen.has(c.x + ',' + c.y)) && pzs.every(c => seen.has(c.x + ',' + c.y))) return map;
  }
  throw new Error('mapa');
}
function rnd2(R, N) { return Math.floor(R() * N); }
const walkable = (map, x, y) => { const c = map.g[y] && map.g[y][x]; return c && c.t && TT[c.t].walk && !c.obj && !c.out; };
const tile = (map, x, y) => map.g[y] && map.g[y][x];
function bfsAll(map, s, jump) {
  const seen = new Set([s.x + ',' + s.y]); const q = [s];
  while (q.length) { const c = q.shift(); for (const [dx, dy] of DIRS) { const n = tile(map, c.x + dx, c.y + dy); if (!n || seen.has(n.x + ',' + n.y) || !walkable(map, n.x, n.y) || Math.abs(n.h - c.h) > jump) continue; seen.add(n.x + ',' + n.y); q.push(n); } }
  return seen;
}
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ---------- Câmera / vista ----------
const V = { uiZ: 1, rot: 0, scale: 3, bw: 0, bh: 0, panX: 0, panY: 0, ox: 0, oy: 0, shake: 0, flash: 0, t: 0, topUI: 56, botUI: 190 };
let S = null; // cena atual {map, units, theme, fx...}
const cv = document.createElement('canvas'); const ctx = cv.getContext('2d');
const buf = mk(10, 10); const bctx = buf.getContext('2d');
const lightC = mk(10, 10); const lctx = lightC.getContext('2d');
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3); const W = innerWidth, H = innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
  V.uiZ = W >= 1100 ? clamp(Math.min(W / 1100, H / 720), 1, 3) : 1;
  const ui = document.getElementById('ui'); if (ui) { ui.style.width = W / V.uiZ + 'px'; ui.style.height = H / V.uiZ + 'px'; ui.style.transform = `scale(${V.uiZ})`; }
  const availH = (H - (V.topUI + V.botUI) * V.uiZ) * dpr;
  if (V.zoom == null) V.zoom = W < 640 ? 1.45 : 1;
  const fit = Math.min(cv.width / 345, availH / 230) * V.zoom;
  V.scale = Math.max(1, fit >= 4 ? Math.floor(fit) : Math.round(fit * 2) / 2);
  V.bw = Math.ceil(cv.width / V.scale); V.bh = Math.ceil(cv.height / V.scale);
  buf.width = V.bw; buf.height = V.bh; lightC.width = V.bw; lightC.height = V.bh; V.dpr = dpr;
}
function rotP(x, y) { const n = S.map.N - 1; switch (V.rot) { case 1: return [n - y, x]; case 2: return [n - x, n - y]; case 3: return [y, n - x]; default: return [x, y]; } }
function rotV(dx, dy) { switch (V.rot) { case 1: return [-dy, dx]; case 2: return [-dx, -dy]; case 3: return [dy, -dx]; default: return [dx, dy]; } }
function toScreen(x, y, h) { const [rx, ry] = rotP(x, y); return [V.ox + (rx - ry) * 16, V.oy + (rx + ry) * 8 - h * 8]; }
function camera() {
  const N = S.map.N; const topB = V.topUI * V.uiZ * V.dpr / V.scale, botB = V.botUI * V.uiZ * V.dpr / V.scale;
  const cy = topB + (V.bh - topB - botB) / 2;
  V.ox = Math.round(V.bw / 2 + V.panX); V.oy = Math.round(cy - (N - 1) * 8 + 14 + V.panY);
  const f = V.focus, L = N * 22; if (f && f.visible !== false && !V.manual) { const [fx, fy] = toScreen(f.px, f.py, f.ph); V.panX = clamp(V.panX + (V.bw / 2 - fx) * .08, -L, L); V.panY = clamp(V.panY + (cy - (fy - 16)) * .08, -L * .6, L * .6); }
}

// ---------- Partículas / efeitos ----------
const P = []; const FLOAT = []; const PROJ = [];
function emit(x, y, n, o = {}) {
  for (let i = 0; i < n; i++) { const a = o.ang != null ? o.ang + (Math.random() - .5) * (o.spread || 1) : Math.random() * 6.283; const sp = (o.sp || 1) * (0.4 + Math.random());
    P.push({ x: x + (Math.random() - .5) * (o.rx || 0), y: y + (Math.random() - .5) * (o.ry || 0), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp + (o.vy || 0), life: 0, max: (o.life || 40) * (0.6 + Math.random() * .8), c: o.c || '#fff', s: o.s || 1.5, g: o.g || 0, glow: o.glow ?? 1, fr: o.fr ?? .98 }); }
}
function floatText(x, y, text, color = '#fff', big) { FLOAT.push({ x, y, text, color, t: 0, big }); }
function unitScreen(u) { const [sx, sy] = toScreen(u.px, u.py, u.ph); return [sx + (u.ox || 0), sy + (u.oy || 0)]; }
function projectile(a, b, kind) {
  return new Promise(res => { const [x1, y1] = unitScreenOrTile(a); const [x2, y2] = unitScreenOrTile(b); PROJ.push({ x1, y1: y1 - 14, x2, y2: y2 - 12, t: 0, dur: kind === 'arrow' ? 18 : 26, kind, res }); });
}
function unitScreenOrTile(o) { if (o.px != null) return unitScreen(o); const c = tile(S.map, o.x, o.y); return toScreen(o.x, o.y, c ? c.h : 0); }

// ---------- Renderização ----------
function drawDiamond(g, x, y, fill) { g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 16, y); g.lineTo(x, y + 8); g.lineTo(x - 16, y); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } }
function vnoise(x, y, sd) { const X = Math.floor(x / 5), Y = Math.floor(y / 5), fx = x / 5 - X, fy = y / 5 - Y; const a = hash(X, Y, sd), b = hash(X + 1, Y, sd), c = hash(X, Y + 1, sd), d = hash(X + 1, Y + 1, sd); return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy; }
function vtile(x, y) {
  const vc = S.vcache || (S.vcache = new Map()); const k = x * 4096 + y; let c = vc.get(k); if (c) return c;
  const T = THEMES[S.map.theme]; const sd = (S.mapSeed || 7) % 997; const onPath = T.path && (x === y || x - y === 1);
  c = { x, y, h: Math.round(vnoise(x, y, sd) * T.maxH * 1.25), t: T.base[T.base.length > 1 && hash(x, y, 7) < .45 ? 1 : 0], out: true, virt: true, obj: null, deco: null, light: null };
  if (onPath) c.t = T.path; if (T.sea && x <= S.map.M + 1) { c.t = 'water'; c.h = 0; }
  if (T.river) { const x0 = Math.round((S.map.N - 1) / 2 + 1 + Math.sin(y * .35) * 2.5); if (x === x0 || x === x0 + 1) { c.t = 'water'; c.h = 0; } }
  if (T.liquid && vnoise(x + 300, y + 300, sd) > .78) { c.t = T.liquid[0]; c.h = 0; }
  if (!TT[c.t].liquid && !onPath) { let r = hash(x, y, 11); for (const [o, p] of (T.ring || [])) { if (r < p) { c.obj = o; break; } r -= p; } if (!c.obj && T.deco) { const dd = T.deco[Math.floor(hash(x, y, 13) * T.deco.length)]; if (hash(x, y, 17) < dd[1]) c.deco = dd[0]; } }
  if (vc.size > 6000) vc.clear(); vc.set(k, c); return c;
}
function unrotP(rx, ry) { const n = S.map.N - 1; switch (V.rot) { case 1: return [ry, n - rx]; case 2: return [n - rx, n - ry]; case 3: return [n - ry, rx]; default: return [rx, ry]; } }
function drawTile(g, c, sx, sy) {
  const tt = TT[c.t]; const d = c.h * 8 + 6; const t = V.t;
  // laterais
  g.fillStyle = tt.l; g.beginPath(); g.moveTo(sx - 16, sy); g.lineTo(sx, sy + 8); g.lineTo(sx, sy + 8 + d); g.lineTo(sx - 16, sy + d); g.fill();
  g.fillStyle = tt.r; g.beginPath(); g.moveTo(sx, sy + 8); g.lineTo(sx + 16, sy); g.lineTo(sx + 16, sy + d); g.lineTo(sx, sy + 8 + d); g.fill();
  g.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 1; k <= c.h; k++) { g.fillRect(sx - 16, sy + k * 8 - 1 + 2, 16, 1); g.fillRect(sx, sy + k * 8 + 2, 16, 1); }
  if (c.t === 'grass' || c.t === 'moss') { g.fillStyle = tt.top[1]; g.fillRect(sx - 16, sy, 16, 2); g.fillRect(sx, sy + 6, 1, 3); g.fillRect(sx + 1, sy + 6, 15, 2); }
  // topo
  let top = tt.top[(c.x + c.y) % 2];
  if (tt.liquid) { const w = Math.sin(t / 30 + c.x * 1.3 + c.y * .7); top = tt.glow ? `hsl(${18 + w * 6},100%,${52 + w * 6}%)` : `hsl(210,70%,${54 + w * 5}%)`; }
  drawDiamond(g, sx, sy, top);
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(sx - 15, sy - 1, 15, 1);
  // detalhes
  g.fillStyle = tt.det;
  for (let i = 0; i < 4; i++) { const hx = hash(c.x, c.y, i), hy = hash(c.y, c.x, i + 9); const px = Math.round((hx - .5) * 20), py = Math.round((hy - .5) * 8); if (Math.abs(px) / 16 + Math.abs(py) / 8 > .8) continue;
    if (tt.liquid) { if ((Math.floor(t / 20) + i) % 4 === 0) g.fillRect(sx + px, sy + py, 3, 1); }
    else if (tt.crack) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(sx + px, sy + py, 3, 1); g.fillRect(sx + px + 2, sy + py + 1, 1, 1); g.fillStyle = tt.det; }
    else if (tt.plank) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(sx - 12 + i * 6, sy - 4 + i * 2, 1, 6); g.fillStyle = tt.det; }
    else { g.fillRect(sx + px, sy + py, 1, 2); g.fillRect(sx + px + 1, sy + py + 1, 1, 1); } }
  if (V.q >= 1) {
    // oclusão ambiente: vizinhos de trás mais altos escurecem a borda
    const [rx, ry] = rotP(c.x, c.y);
    [[-1, 0, 0], [0, -1, 1]].forEach(([dx, dy, side]) => { const [wx, wy] = unrotP(rx + dx, ry + dy); const n = tile(S.map, wx, wy); if (!n || !n.t || n.h <= c.h) return; const k = Math.min(2, n.h - c.h);
      g.fillStyle = `rgba(0,0,0,${.16 * k})`; g.beginPath(); if (side === 0) { g.moveTo(sx - 16, sy); g.lineTo(sx, sy - 8); g.lineTo(sx, sy - 3); g.lineTo(sx - 10, sy + 2); } else { g.moveTo(sx, sy - 8); g.lineTo(sx + 16, sy); g.lineTo(sx + 10, sy + 2); g.lineTo(sx, sy - 3); } g.fill(); });
    g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(sx - 16, sy, 1, 1); g.fillRect(sx, sy + 7, 1, 1);
    if ((c.t === 'grass' || c.t === 'moss') && !c.obj) { g.fillStyle = tt.det; for (let i = 0; i < 3; i++) { const bx = sx + Math.round((hash(c.x, c.y, i + 20) - .5) * 18), by = sy + Math.round((hash(c.y, c.x, i + 30) - .5) * 6); const sw = Math.round(Math.sin(t / 25 + c.x * .8 + c.y * .5 + i) * 1.2); g.fillRect(bx, by - 2, 1, 2); g.fillRect(bx + sw, by - 4, 1, 2); } }
    // lado com gradiente vertical
    const lg = g.createLinearGradient(0, sy, 0, sy + 8 + d); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = lg;
    g.beginPath(); g.moveTo(sx - 16, sy); g.lineTo(sx, sy + 8); g.lineTo(sx + 16, sy); g.lineTo(sx + 16, sy + d); g.lineTo(sx, sy + 8 + d); g.lineTo(sx - 16, sy + d); g.fill();
    if (tt.liquid && !tt.glow) { g.fillStyle = 'rgba(255,255,255,.18)'; const k = (t / 3 + c.x * 7 + c.y * 3) % 32; g.fillRect(sx - 16 + k, sy - 1 + Math.abs(k - 16) * 0, 4, 1); }
  }
  if (tt.gold) { g.strokeStyle = 'rgba(242,201,76,.7)'; g.lineWidth = 1; drawDiamond(g, sx, sy); g.stroke(); }
  if (c.deco === 'flower') { g.fillStyle = ['#ff6b8a', '#ffd84a', '#ffffff'][Math.floor(hash(c.x, c.y) * 3)]; g.fillRect(sx - 4, sy - 1, 2, 2); g.fillRect(sx + 5, sy + 2, 2, 2); }
  if (c.deco === 'mush') { g.fillStyle = '#e04848'; g.fillRect(sx + 3, sy - 2, 4, 2); g.fillStyle = '#fff'; g.fillRect(sx + 4, sy, 2, 2); }
  if (c.deco === 'bones') { g.fillStyle = '#ddd6c0'; g.fillRect(sx - 5, sy, 6, 1); g.fillRect(sx - 6, sy - 1, 1, 3); g.fillRect(sx + 1, sy - 1, 1, 3); }
  if (c.deco === 'skull') { const f = frames('skull')[0]; g.drawImage(f.c, sx - 5, sy - 8, 10, 10); }
}
function drawHighlight(g, sx, sy, col, a) { g.globalAlpha = a; drawDiamond(g, sx, sy, col); g.globalAlpha = Math.min(1, a + .35); g.strokeStyle = col; g.lineWidth = 1; drawDiamond(g, sx, sy); g.stroke(); g.globalAlpha = 1; }
function drawObj(g, c, sx, sy) {
  const t = V.t, o = c.obj;
  if (drawObj2(g, c, sx, sy)) return;
  if (o === 'tree') {
    g.fillStyle = '#5a3a22'; g.fillRect(sx - 2, sy - 14, 4, 14);
    [[0, -26, 11, '#2f7a3a'], [-4, -22, 8, '#3c9446'], [4, -28, 7, '#4caa52'], [-2, -31, 5, '#7fd06a']].forEach(([x, y, r, col]) => { g.fillStyle = col; g.beginPath(); g.arc(sx + x, sy + y, r, 0, 7); g.fill(); });
  } else if (o === 'pine') {
    g.fillStyle = '#4a321e'; g.fillRect(sx - 2, sy - 8, 4, 8);
    [[0, '#1f5e3a', 13, 0], [1, '#287048', 10, -8], [2, '#348656', 7, -16]].forEach(([i, col, w, y]) => { g.fillStyle = col; g.beginPath(); g.moveTo(sx, sy - 22 + y); g.lineTo(sx + w, sy - 4 + y); g.lineTo(sx - w, sy - 4 + y); g.fill(); });
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(sx - 1, sy - 36, 2, 20);
  } else if (o === 'deadtree') {
    g.strokeStyle = '#2a1e1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx, sy - 20); g.lineTo(sx - 7, sy - 28); g.moveTo(sx, sy - 14); g.lineTo(sx + 8, sy - 22); g.stroke();
  } else if (o === 'rock') {
    g.fillStyle = '#6f6d7a'; g.beginPath(); g.ellipse(sx, sy - 3, 9, 6, 0, 0, 7); g.fill(); g.fillStyle = '#9a98a8'; g.beginPath(); g.ellipse(sx - 2, sy - 5, 5, 3, 0, 0, 7); g.fill();
  } else if (o === 'house') {
    box(g, sx, sy, 12, 14, '#e8d8b0', '#c9b48a', '#b39d74');
    g.fillStyle = '#b4412f'; g.beginPath(); g.moveTo(sx - 15, sy - 14); g.lineTo(sx - 2, sy - 30); g.lineTo(sx, sy - 22); g.lineTo(sx, sy - 6); g.fill();
    g.fillStyle = '#8c2f21'; g.beginPath(); g.moveTo(sx, sy - 6); g.lineTo(sx, sy - 22); g.lineTo(sx + 2, sy - 30); g.lineTo(sx + 15, sy - 14); g.fill();
    g.fillStyle = '#ffd27a'; g.fillRect(sx - 9, sy - 12, 3, 4); g.fillRect(sx + 5, sy - 12, 3, 4); g.fillStyle = '#5a3a22'; g.fillRect(sx - 2, sy - 6, 4, 6);
  } else if (o === 'crate') { const f = frames('crate')[0]; g.drawImage(f.c, sx - 8, sy - 18, 16, 22); }
  else if (o === 'lantern') {
    g.fillStyle = '#3a2a1a'; g.fillRect(sx - 1, sy - 18, 2, 18); g.fillRect(sx - 4, sy - 19, 8, 1);
    const fl = 0.8 + Math.sin(t / 6 + c.x) * .2; g.fillStyle = `rgba(255,200,90,${fl})`; g.fillRect(sx - 3, sy - 24, 6, 5);
    c.light = '#ffb050';
  } else if (o === 'pillar' || o === 'ruin') { const f = frames(o === 'ruin' ? 'column' : 'column')[0]; const hh = o === 'ruin' ? f.h * .6 : f.h; g.drawImage(f.c, 0, f.h - hh, f.w, hh, sx - 8, sy - hh + 4, 16, hh); if (o === 'ruin') { g.fillStyle = 'rgba(80,20,20,.3)'; g.fillRect(sx - 8, sy - hh + 4, 16, hh); } }
  else if (o === 'brazier') {
    box(g, sx, sy, 7, 8, '#5a5566', '#46425a', '#35324a');
    for (let i = 0; i < 3; i++) { const fh = 6 + Math.sin(t / 4 + i * 2) * 3; g.fillStyle = ['#ff4020', '#ff9030', '#ffe060'][i]; g.fillRect(sx - 4 + i * 3, sy - 12 - fh, 3, fh); }
    if (t % 4 === 0) emit(sx, sy - 18, 1, { c: '#ffa040', vy: -.6, sp: .2, life: 30, s: 1 });
  } else if (o === 'crystal') {
    const b = Math.sin(t / 20 + c.x) * 2; g.fillStyle = '#7a5cff'; g.beginPath(); g.moveTo(sx, sy - 30 + b); g.lineTo(sx + 6, sy - 14 + b); g.lineTo(sx, sy - 4 + b); g.lineTo(sx - 6, sy - 14 + b); g.fill();
    g.fillStyle = '#c8b8ff'; g.beginPath(); g.moveTo(sx, sy - 30 + b); g.lineTo(sx - 6, sy - 14 + b); g.lineTo(sx, sy - 12 + b); g.fill();
  }
}
function box(g, sx, sy, w, h, top, l, r) {
  g.fillStyle = l; g.beginPath(); g.moveTo(sx - w, sy - h); g.lineTo(sx, sy - h + w / 2); g.lineTo(sx, sy + w / 2); g.lineTo(sx - w, sy); g.fill();
  g.fillStyle = r; g.beginPath(); g.moveTo(sx, sy - h + w / 2); g.lineTo(sx + w, sy - h); g.lineTo(sx + w, sy); g.lineTo(sx, sy + w / 2); g.fill();
  g.fillStyle = top; g.beginPath(); g.moveTo(sx - w, sy - h); g.lineTo(sx, sy - h - w / 2); g.lineTo(sx + w, sy - h); g.lineTo(sx, sy - h + w / 2); g.fill();
}
function drawUnit(g, u) {
  if (!u.visible || u.alpha <= 0) return;
  const [sx, sy] = unitScreen(u); const t = V.t; const sc = u.scale || 1;
  if (u.rec) return drawLPCUnit(g, u, sx, sy);
  const fr = frames(u.moving ? u.k.run : u.k.idle); const f = fr[Math.floor((t + u.seed) / 9) % fr.length];
  g.globalAlpha = u.alpha * .45; g.fillStyle = '#000'; g.beginPath(); g.ellipse(sx, sy + 1 - (u.oy || 0) * 0 , 7 * sc, 3 * sc, 0, 0, 7); g.fill(); g.globalAlpha = u.alpha;
  if (u.team !== 'N' && B && B.on) { g.fillStyle = u.team === 'A' ? 'rgba(80,170,255,.55)' : 'rgba(255,80,80,.55)'; g.fillRect(sx - 6 * sc, sy + 2, 12 * sc, 1); }
  if (u.aura) { const r = 14 * sc + Math.sin(t / 10) * 2; const gr = g.createRadialGradient(sx, sy - f.h * sc / 2, 2, sx, sy - f.h * sc / 2, r); gr.addColorStop(0, u.aura + '88'); gr.addColorStop(1, u.aura + '00'); g.fillStyle = gr; g.fillRect(sx - r, sy - f.h * sc / 2 - r, r * 2, r * 2); }
  const [fx] = rotV(u.fx, u.fy); if (fx !== 0) u.flip = fx < 0; else { const [, fy] = rotV(u.fx, u.fy); if (fy !== 0) u.flip = fy > 0 ? true : false; }
  const w = f.w * sc, h = f.h * sc; const bob = u.ko ? 0 : 0;
  g.save(); g.translate(Math.round(sx), Math.round(sy - (u.hop || 0) + bob)); if (u.flip) g.scale(-1, 1);
  if (u.ko) { g.rotate(Math.PI / 2 * (u.flip ? -1 : 1) * 0.9); g.globalAlpha = u.alpha * .7; }
  g.drawImage(u.flash > 0 && Math.floor(u.flash / 2) % 2 === 0 ? f.wc : f.c, -w / 2, -h + 2, w, h);
  if (u.weapon && !u.ko) drawWeapon(g, u.weapon, w * 0.25, -h * 0.38, 1, false, t, u.swing || 0);
  g.restore(); g.globalAlpha = 1;
  if (u.flash > 0) u.flash--;
  u._sx = sx; u._sy = sy - (u.hop || 0); u._h = h;
}
function drawBackground(g) { drawSky(g); }
// ---------- Pós-processamento "HD-2D" (alta resolução) ----------
const bloomC = mk(10, 10), bloomX = bloomC.getContext('2d'); const dofC = mk(10, 10), dofX = dofC.getContext('2d');
const FILTER_OK = (() => { try { const t = mk(2, 2).getContext('2d'); t.filter = 'blur(1px)'; return t.filter === 'blur(1px)'; } catch (e) { return false; } })();
V.q = (() => { try { const v = localStorage.getItem('cronicas_q'); if (v != null) return +v; } catch (e) {} return /SmartTV|Tizen|Web0S|webOS|BRAVIA|AFT|CrKey|Android TV/i.test(navigator.userAgent) ? 1 : innerWidth < 640 ? 1 : 2; })();
const ATMOS = { village: { dark: .36, tint: 'rgba(255,130,60,.07)', rays: '255,200,140', fog: 0 }, forest: { dark: .44, tint: 'rgba(40,120,140,.08)', rays: '150,230,255', fog: '190,240,230' },
  crypt: { dark: .7, tint: 'rgba(90,40,140,.08)', rays: 0, fog: '150,110,200' }, future: { dark: .28, tint: 'rgba(255,40,0,.09)', rays: '255,120,60', fog: '120,60,50' }, tower: { dark: .22, tint: 'rgba(120,80,255,.07)', rays: '200,180,255', fog: 0 } };
const hex6 = c => /^#[0-9a-f]{3}$/i.test(c) ? '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : /^#[0-9a-f]{6}$/i.test(c) ? c : null;
function lightList() {
  const th = S.map.theme; const L = [];
  S.map.g.flat().forEach(c => { if (c.light && c.t) { const [sx, sy] = toScreen(c.x, c.y, c.h); if (sx > -60 && sx < V.bw + 60 && sy > -60 && sy < V.bh + 80) L.push([sx, sy - 14, c.obj ? 52 : 34, hex6(c.light)]); } });
  S.units.forEach(u => { if (u.visible && u.alpha > 0 && !u.ko && u._sx != null) L.push([u._sx, u._sy - 10, th === 'crypt' ? 34 : 26, u.aura ? hex6(u.aura) : null]); });
  let n = 0; for (const p of P) { if (p.glow && p.s > 1.5 && n++ < 60) L.push([p.x, p.y, 10, hex6(p.c)]); }
  return L.filter(l => isFinite(l[0]) && isFinite(l[1]));
}
function postFX() {
  if (V._lq !== V.q) { V._lq = V.q; document.body.classList.toggle('lowq', V.q === 0); }
  const A = (VIS[S.map.theme] || VIS.village).atmos; const s = V.scale, W = cv.width, H = cv.height, t = V.t; const L = lightList();
  // escuridão suave (máscara em baixa resolução ampliada com suavização)
  lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, V.bw, V.bh); lctx.fillStyle = `rgba(4,2,16,${A.dark})`; lctx.fillRect(0, 0, V.bw, V.bh);
  lctx.globalCompositeOperation = 'destination-out';
  for (const [x, y, r] of L) { const fl = r * (0.95 + Math.sin(t / 5 + x) * .05); const gr = lctx.createRadialGradient(x, y, 0, x, y, fl); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); lctx.fillStyle = gr; lctx.fillRect(x - fl, y - fl, fl * 2, fl * 2); }
  ctx.imageSmoothingEnabled = true; ctx.drawImage(lightC, 0, 0, W, H);
  // brilho colorido em alta resolução
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, r, col] of L) { if (!col) continue; const R = r * s * (col.length === 7 && r === 10 ? .5 : .9); const gr = ctx.createRadialGradient(x * s, y * s, 0, x * s, y * s, R); gr.addColorStop(0, col + (r === 10 ? '30' : '48')); gr.addColorStop(1, col + '00'); ctx.fillStyle = gr; ctx.fillRect(x * s - R, y * s - R, R * 2, R * 2); }
  ctx.globalCompositeOperation = 'source-over';
  if (V.q >= 1) atmosphere(A, W, H, t);
  // profundidade de campo (tilt-shift)
  if (V.q >= 2 && FILTER_OK) {
    const w = Math.ceil(V.bw / 2), h = Math.ceil(V.bh / 2); if (dofC.width !== w || dofC.height !== h) { dofC.width = w; dofC.height = h; }
    dofX.globalCompositeOperation = 'source-over'; dofX.filter = 'blur(1.6px)'; dofX.clearRect(0, 0, w, h); dofX.drawImage(cv, 0, 0, w, h); dofX.filter = 'none';
    dofX.globalCompositeOperation = 'destination-in'; const top = (V.topUI * V.uiZ * V.dpr / V.scale) / 2, bot = h - (V.botUI * V.uiZ * V.dpr / V.scale) / 2;
    const gr = dofX.createLinearGradient(0, 0, 0, h); const a = clamp(top / h, 0, .4), b = clamp(bot / h, .6, 1);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(a + .05, 'rgba(0,0,0,.6)'); gr.addColorStop(a + .22, 'rgba(0,0,0,0)'); gr.addColorStop(b - .2, 'rgba(0,0,0,0)'); gr.addColorStop(b, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    dofX.fillStyle = gr; dofX.fillRect(0, 0, w, h); ctx.drawImage(dofC, 0, 0, W, H);
  }
  // bloom
  if (V.q >= 1 && FILTER_OK) {
    const w = Math.ceil(V.bw / 3), h = Math.ceil(V.bh / 3); if (bloomC.width !== w || bloomC.height !== h) { bloomC.width = w; bloomC.height = h; }
    bloomX.filter = 'brightness(.5) contrast(4.5) saturate(1.2) blur(2.5px)'; bloomX.clearRect(0, 0, w, h); bloomX.drawImage(cv, 0, 0, w, h); bloomX.filter = 'none';
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = V.q >= 2 ? .32 : .24; ctx.drawImage(bloomC, 0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  ctx.fillStyle = A.tint; ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (V.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${V.flash / 20})`; ctx.fillRect(0, 0, W, H); V.flash--; }
  ctx.imageSmoothingEnabled = false;
}
function atmosphere(A, W, H, t) {
  ctx.globalCompositeOperation = 'lighter';
  if (A.rays) for (let i = 0; i < 5; i++) { // raios de luz (god rays)
    const x0 = W * (.15 + i * .2) + Math.sin(t / 300 + i) * W * .03, w = W * (.04 + .03 * Math.sin(t / 170 + i * 2) ** 2), sk = W * .35;
    const gr = ctx.createLinearGradient(0, 0, 0, H * .9); const al = .05 + .03 * Math.sin(t / 90 + i * 1.7); gr.addColorStop(0, `rgba(${A.rays},${al})`); gr.addColorStop(1, `rgba(${A.rays},0)`);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + w, 0); ctx.lineTo(x0 + w - sk, H * .9); ctx.lineTo(x0 - sk - w, H * .9); ctx.fill();
  }
  ctx.globalCompositeOperation = 'screen';
  if (A.fog) for (let i = 0; i < 4; i++) { // névoa baixa
    const x = ((t * (.15 + i * .05) + i * W * .4) % (W * 1.6)) - W * .3, y = H * (.55 + i * .08), r = W * .35;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${A.fog},.09)`); gr.addColorStop(1, `rgba(${A.fog},0)`); ctx.fillStyle = gr; ctx.save(); ctx.translate(x, y); ctx.scale(1, .35); ctx.translate(-x, -y); ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
}
function ambient() { ambient2(); }
const PERF = { last: 0, acc: 0, n: 0 };
function perfWatch() { const now = performance.now(); if (PERF.last) { PERF.acc += now - PERF.last; PERF.n++; } PERF.last = now; if (PERF.n >= 150) { const avg = PERF.acc / PERF.n; PERF.acc = 0; PERF.n = 0; if (avg > 40 && V.q > 0 && !document.hidden) { V.q--; if (typeof toast === 'function') toast('Qualidade gráfica ajustada para manter a fluidez'); } } }
document.addEventListener('visibilitychange', () => { PERF.last = 0; PERF.acc = 0; PERF.n = 0; });
let HL = null; let B = { on: false }; // destaque {tiles:Map key->color, sel:{x,y}, area:Set}
function render() {
  V.t++; if (!S) return; camera(); const g = bctx; g.imageSmoothingEnabled = false;
  drawBackground(g); ambient();
  const sh = V.shake > 0 ? (V.shake--, [(Math.random() - .5) * V.shake * .8, (Math.random() - .5) * V.shake * .8]) : [0, 0];
  g.save(); g.translate(Math.round(sh[0]), Math.round(sh[1]));
  const map = S.map, N = map.N; const order = [];
  const TH = THEMES[map.theme] || {}; const virt = !TH.shape && map.M;
  { const A = (V.bw / 2 - V.ox) / 16, Bv = (V.bh / 2 - V.oy) / 8; const RX = (A + Bv) / 2, RY = (Bv - A) / 2; const span = Math.ceil(V.bw / 32 + V.bh / 16) + 5;
    for (let rx = Math.floor(RX - span); rx <= RX + span; rx++) for (let ry = Math.floor(RY - span); ry <= RY + span; ry++) {
      const [x, y] = unrotP(rx, ry); const inG = x >= 0 && y >= 0 && x < N && y < N; const c = inG ? map.g[y][x] : virt ? vtile(x, y) : null; if (!c || !c.t) continue; order.push([rx + ry, rx, c]); } }
  order.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const byTile = new Map();
  S.units.forEach(u => { if (!u.visible) return; let d; const [rx, ry] = rotP(Math.round(u.px), Math.round(u.py)); d = rx + ry; if (u.moving) { const [ax, ay] = rotP(u.tx ?? u.x, u.ty ?? u.y); d = Math.max(d, ax + ay); } const k = d; if (!byTile.has(k)) byTile.set(k, []); byTile.get(k).push(u); });
  const pulse = .42 + Math.sin(V.t / 8) * .12;
  let lastD = -1;
  const flushUnits = (d) => { const arr = byTile.get(d); if (arr) { arr.sort((a, b) => { const [ax, ay] = rotP(a.px, a.py), [bx, by] = rotP(b.px, b.py); return (ax + ay) - (bx + by); }); arr.forEach(u => drawUnit(g, u)); } };
  for (let i = 0; i < order.length; i++) {
    const [d, , c] = order[i]; if (d !== lastD) { if (lastD >= 0) flushUnits(lastD); lastD = d; }
    const [sx, sy] = toScreen(c.x, c.y, c.h); if (sx < -60 || sx > V.bw + 60 || sy < -90 || sy > V.bh + 140) continue;
    drawTile(g, c, sx, sy); if (c.out) { const d = S.map.M ? Math.max(S.map.M - c.x, S.map.M - c.y, c.x - (S.map.M + S.map.P - 1), c.y - (S.map.M + S.map.P - 1), 1) : 1; g.globalAlpha = Math.min(.68, .12 + d * .07); g.fillStyle = '#0a0814'; g.beginPath(); g.moveTo(sx - 16, sy); g.lineTo(sx, sy - 8); g.lineTo(sx + 16, sy); g.lineTo(sx + 16, sy + c.h * 8 + 6); g.lineTo(sx, sy + 14 + c.h * 8); g.lineTo(sx - 16, sy + c.h * 8 + 6); g.fill(); g.globalAlpha = 1; }
    if (HL) { const k = c.x + ',' + c.y; if (HL.tiles && HL.tiles.has(k)) drawHighlight(g, sx, sy, HL.tiles.get(k), pulse); if (HL.area && HL.area.has(k)) drawHighlight(g, sx, sy, '#ffcf40', .45); if (HL.sel && HL.sel.x === c.x && HL.sel.y === c.y) { g.strokeStyle = '#fff'; drawDiamond(g, sx, sy); g.stroke(); } if (HL.cur && HL.cur.x === c.x && HL.cur.y === c.y) { drawHighlight(g, sx, sy, '#ffffff', .25 + Math.sin(V.t / 5) * .12); g.strokeStyle = '#ffe14a'; g.lineWidth = 1; drawDiamond(g, sx, sy); g.stroke(); } }
    if (c.obj) { const k = { tree: 1.5, pine: 1.45, deadtree: 1.45, house: 1.45, crystal: 1.35, pillar: 1.3, ruin: 1.3, lantern: 1.35, rock: 1.2, crate: 1.15, palm: 1.4, mast: 1.3, statue: 1.3, tent: 1.4, stall: 1.3, gmush: 1.3, spike: 1.3, gear: 1.2, grave: 1.2, banner: 1.3, snowpine: 1.45, barrel: 1.1, portal: 1.3 }[c.obj] || 1; if (k !== 1) { g.save(); g.translate(sx, sy); g.scale(k, k); drawObj(g, c, 0, 0); g.restore(); } else drawObj(g, c, sx, sy); }
  }
  if (lastD >= 0) flushUnits(lastD);
  // seta sobre a unidade ativa
  if (B && B.on && B.active && B.active.visible && !B.ai) { const u = B.active; const [sx, sy] = unitScreen(u); const y = sy - u._h - 6 + Math.sin(V.t / 6) * 2; g.fillStyle = '#ffe14a'; g.beginPath(); g.moveTo(sx - 4, y - 4); g.lineTo(sx + 4, y - 4); g.lineTo(sx, y + 1); g.fill(); }
  if (HL && HL.cur) { const c = tile(S.map, HL.cur.x, HL.cur.y); if (c) { const [sx, sy] = toScreen(c.x, c.y, c.h); const y = sy - 30 + Math.sin(V.t / 6) * 3; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(sx - 5, y - 6); g.lineTo(sx + 5, y - 6); g.lineTo(sx, y); g.fill(); g.fillStyle = '#ffe14a'; g.beginPath(); g.moveTo(sx - 3, y - 5); g.lineTo(sx + 3, y - 5); g.lineTo(sx, y - 1); g.fill(); } }
  // projéteis
  for (let i = PROJ.length - 1; i >= 0; i--) { const p = PROJ[i]; p.t++; const k = p.t / p.dur; const x = p.x1 + (p.x2 - p.x1) * k, y = p.y1 + (p.y2 - p.y1) * k - Math.sin(k * Math.PI) * (p.kind === 'arrow' ? 14 : 8);
    if (p.kind === 'arrow') { const f = frames('weapon_arrow')[0]; g.save(); g.translate(x, y); g.rotate(Math.atan2(p.y2 - p.y1 - Math.cos(k * Math.PI) * 14 * 3, p.x2 - p.x1) + Math.PI / 2); g.drawImage(f.c, -f.w / 2, -f.h / 2); g.restore(); }
    else { const col = { fire: '#ff8030', fireball: '#ff6020', dark: '#a050ff', holy: '#fff0a0', missile: '#60e0ff', dual: '#ffffff', heal: '#80ffa0' }[p.kind] || '#fff'; emit(x, y, 2, { c: col, sp: .3, life: 16, s: 2 }); g.fillStyle = col; g.beginPath(); g.arc(x, y, p.kind === 'fireball' ? 4 : 2.5, 0, 7); g.fill(); }
    if (p.t >= p.dur) { PROJ.splice(i, 1); p.res(); } }
  // partículas
  g.globalCompositeOperation = 'lighter';
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.life++; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= p.fr; p.vy *= p.fr; const a = 1 - p.life / p.max; if (a <= 0) { P.splice(i, 1); continue; }
    if (!p.glow) g.globalCompositeOperation = 'source-over'; g.globalAlpha = a; g.fillStyle = p.c; g.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); if (!p.glow) g.globalCompositeOperation = 'lighter'; }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.restore();
  // composição final
  ctx.imageSmoothingEnabled = false; ctx.drawImage(buf, 0, 0, V.bw * V.scale, V.bh * V.scale);
  postFX();
  overlayHiRes();
  perfWatch();
}
function overlayHiRes() {
  const s = V.scale, d = Math.max(V.dpr, V.scale / 2.4);
  if (B && B.on) S.units.forEach(u => { if (!u.visible || u.alpha < 1 || u.team === 'N' || u._sx == null) return; const w = Math.max(22 * V.dpr, 9 * s), bh = Math.max(3 * V.dpr, s * .9), x = u._sx * s - w / 2, y = (u._sy - u._h - 2) * s - bh * 2;
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(x - 1, y - 1, w + 2, bh * (u.maxmp ? 1.7 : 1) + 2); ctx.fillStyle = u.team === 'A' ? '#4fd17a' : '#ff5a5a'; ctx.fillRect(x, y, w * Math.max(0, u.hp) / u.maxhp, bh);
    if (u.maxmp) { ctx.fillStyle = '#5aa0ff'; ctx.fillRect(x, y + bh, w * u.mp / u.maxmp, bh * .7); } });
  ctx.textAlign = 'center';
  for (let i = FLOAT.length - 1; i >= 0; i--) { const f = FLOAT[i]; f.t++; const k = f.t / 70; if (k >= 1) { FLOAT.splice(i, 1); continue; }
    const y = (f.y - 18 - Math.min(f.t, 16) * 0.9) * s - (k > .7 ? 0 : 0); const sz = (f.big ? 20 : 15) * d * (f.t < 6 ? 1 + (6 - f.t) * .08 : 1);
    ctx.font = `900 ${sz}px "Trebuchet MS",system-ui,sans-serif`; ctx.globalAlpha = k > .75 ? (1 - k) * 4 : 1; ctx.lineWidth = 4 * d; ctx.strokeStyle = '#140a1e'; ctx.strokeText(f.text, f.x * s, y); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x * s, y); ctx.globalAlpha = 1; }
}
// ---------- Seleção por toque ----------
function pickTile(cx, cy) {
  const bx = cx * V.dpr / V.scale, by = cy * V.dpr / V.scale; const map = S.map, N = map.N;
  // unidades primeiro
  const us = S.units.filter(u => u.visible && !u.ko && u._sx != null).sort((a, b) => b._sy - a._sy);
  for (const u of us) { if (Math.abs(bx - u._sx) < (u.rec ? 12 : 8 * (u.scale || 1)) && by < u._sy + 2 && by > u._sy - u._h) return { x: u.x, y: u.y }; }
  const order = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = map.g[y][x]; if (!c.t) continue; const [rx, ry] = rotP(x, y); order.push([rx + ry, c]); }
  order.sort((a, b) => b[0] - a[0]);
  for (const [, c] of order) { const [sx, sy] = toScreen(c.x, c.y, c.h); if (Math.abs(bx - sx) / 16 + Math.abs(by - sy) / 8 <= 1.05) return { x: c.x, y: c.y }; }
  return null;
}
