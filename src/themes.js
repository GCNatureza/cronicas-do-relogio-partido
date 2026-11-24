// ================= TEMAS DE MAPA (gerador genérico + visual) =================
Object.assign(TT, {
  carpet: { top: ['#9b2a2a', '#8a2424'], l: '#5a4a5a', r: '#463a48', det: '#d8a040', walk: 1 },
  wood: { top: ['#9a6a3a', '#8c5f33'], l: '#5e3e22', r: '#4a301a', det: '#c08a52', walk: 1, plank: 1 },
  sand: { top: ['#e2c787', '#d8bb78'], l: '#a8834c', r: '#8c6a3a', det: '#f3dca4', walk: 1 },
  gold: { top: ['#e8b93a', '#d9a82c'], l: '#9a7418', r: '#7a5a10', det: '#fff0a0', walk: 1, gold: 1 },
  snow: { top: ['#eef4fb', '#e2ebf5'], l: '#9fb2c8', r: '#8498b0', det: '#ffffff', walk: 1 },
  ice: { top: ['#a8dcf5', '#98d0ee'], l: '#5f9ec2', r: '#4a86aa', det: '#e6f8ff', walk: 1, liquid: 1 },
  metal: { top: ['#7c8794', '#717b88'], l: '#4c5560', r: '#3c434c', det: '#aab6c4', walk: 1, crack: 1 },
  obsidian: { top: ['#3a2c3e', '#332637'], l: '#221a26', r: '#1a141e', det: '#7a4a8a', walk: 1, crack: 1 },
});
const THEMES = {
  village: { base: ['grass'], path: 'dirt', maxH: 2, liquid: ['water', 2], objs: [['house', 4], ['tree', 9], ['lantern', 8], ['crate', 3]], ring: [['tree', .2], ['house', .05], ['rock', .03], ['lantern', .02]], deco: [['flower', .06]] },
  forest: { base: ['grass', 'moss'], maxH: 3, river: 1, objs: [['pine', 14], ['rock', 3]], ring: [['pine', .38], ['rock', .04]], deco: [['mush', .06]] },
  crypt: { base: ['stone'], maxH: 1, dais: 1, grid: 'pillar', objs: [['brazier', 5]], ring: [['pillar', .07], ['grave', .05], ['brazier', .02]], deco: [['bones', .06], ['skull', .03]] },
  future: { base: ['ash'], maxH: 3, liquid: ['lava', 3], objs: [['ruin', 6], ['deadtree', 5]], ring: [['ruin', .12], ['deadtree', .08]], deco: [['skull', .06]] },
  tower: { shape: 'circle', base: ['marble'], maxH: 2, terrace: 1, objs: [['crystal', 6]] },
  fogvillage: { base: ['grass', 'moss'], path: 'dirt', maxH: 2, objs: [['house', 5], ['deadtree', 6], ['lantern', 5], ['grave', 5]], ring: [['deadtree', .12], ['house', .05], ['grave', .05]], deco: [['flower', .02], ['bones', .02]] },
  castle: { base: ['stone'], path: 'carpet', maxH: 1, grid: 'pillar', objs: [['banner', 8], ['brazier', 4], ['statue', 2]], ring: [['banner', .05], ['statue', .03], ['brazier', .02]] },
  gothic: { base: ['ash', 'grass'], maxH: 3, objs: [['deadtree', 9], ['grave', 9], ['lantern', 3], ['rock', 3]], ring: [['deadtree', .18], ['grave', .08]], deco: [['skull', .03], ['bones', .04]] },
  manor: { base: ['wood'], path: 'carpet', maxH: 1, grid: 'pillar', objs: [['brazier', 5], ['crate', 3], ['barrel', 3], ['grave', 1]], ring: [['crate', .05], ['barrel', .05], ['brazier', .02]] },
  jungle: { base: ['moss', 'grass'], maxH: 3, liquid: ['water', 3], objs: [['palm', 16], ['pine', 4], ['rock', 3]], ring: [['palm', .32], ['pine', .06]], deco: [['mush', .05], ['flower', .06]] },
  goldcity: { base: ['sand'], path: 'gold', maxH: 3, objs: [['statue', 8], ['pillar', 5], ['palm', 3]], ring: [['statue', .06], ['palm', .08], ['pillar', .05]] },
  temple: { base: ['stone'], path: 'gold', maxH: 2, liquid: ['lava', 2], grid: 'pillar', objs: [['statue', 4], ['brazier', 6]], ring: [['statue', .05], ['brazier', .03]], fire: '#60ff80' },
  sky: { shape: 'ship', base: ['wood'], maxH: 1, objs: [['mast', 3], ['barrel', 5], ['crate', 4]] },
  arena: { shape: 'circle', base: ['sand'], maxH: 1, stands: 1, objs: [['brazier', 4]] },
  elemental: { base: ['obsidian'], maxH: 3, liquid: ['lava', 5], objs: [['rock', 6], ['crystal', 3]], ring: [['rock', .1], ['crystal', .03]] },
  underdark: { base: ['stone'], maxH: 2, liquid: ['water', 2], objs: [['gmush', 12], ['rock', 5], ['pillar', 2]], ring: [['gmush', .12], ['rock', .08]], deco: [['bones', .04]] },
  abyss: { base: ['obsidian', 'ash'], maxH: 3, liquid: ['lava', 4], objs: [['spike', 10], ['deadtree', 3]], ring: [['spike', .15]], deco: [['skull', .05]] },
  clockcity: { base: ['metal'], maxH: 2, grid: 'gear', objs: [['pillar', 4], ['crate', 3]], ring: [['gear', .12], ['pillar', .05]] },
  timewar: { shape: 'islands', base: ['marble'], maxH: 2, objs: [['crystal', 6], ['portal', 3]] },
  devour: { shape: 'circle', base: ['obsidian'], maxH: 2, terrace: 1, objs: [['crystal', 6], ['portal', 3]] },
  carnival: { base: ['grass'], path: 'dirt', maxH: 1, objs: [['tent', 7], ['lantern', 8], ['barrel', 3]], ring: [['tent', .06], ['lantern', .06], ['tree', .1]], deco: [['flower', .06]] },
  market: { base: ['stone'], path: 'dirt', maxH: 1, objs: [['stall', 9], ['crate', 5], ['barrel', 4], ['lantern', 3]], ring: [['stall', .08], ['crate', .05], ['barrel', .04], ['house', .05]] },
  coast: { base: ['sand'], maxH: 2, sea: 1, objs: [['barrel', 5], ['crate', 3], ['palm', 5], ['rock', 3]], ring: [['palm', .12], ['rock', .05]] },
  snow: { base: ['snow'], maxH: 3, liquid: ['ice', 2], objs: [['snowpine', 12], ['rock', 4]], ring: [['snowpine', .3], ['rock', .05]] },
  dungeon: { base: ['stone'], maxH: 2, grid: 'pillar', objs: [['portal', 3], ['brazier', 5], ['crate', 2]], ring: [['pillar', .1], ['brazier', .03]], deco: [['skull', .04], ['bones', .05]] },
};
const OBJ_LIGHT = { lantern: '#ffb050', brazier: '#ff9040', gmush: '#40e0ff', crystal: '#a080ff', portal: '#c060ff', banner: null };
const MAP_P = 14, MAP_M = 6; // área jogável 14×14 + anel de cenário de 4 casas
function genGeneric(theme, seed) {
  const T = THEMES[theme]; const P = T.size || MAP_P, M = T.shape ? 2 : MAP_M, F = P + 2 * M, m = (F - 1) / 2;
  for (let att = 0; att < 60; att++) {
    const R = mulberry(seed * 1000 + att * 7919);
    const cs = 6, gv = []; for (let i = 0; i <= cs; i++) { gv.push([]); for (let j = 0; j <= cs; j++) gv[i].push(R()); }
    const g = [];
    for (let y = 0; y < F; y++) { g.push([]); for (let x = 0; x < F; x++) {
      const fx = x / (F - 1) * cs, fy = y / (F - 1) * cs, ix = Math.min(cs - 1, Math.floor(fx)), iy = Math.min(cs - 1, Math.floor(fy)), tx = fx - ix, ty = fy - iy;
      const v = gv[iy][ix] * (1 - tx) * (1 - ty) + gv[iy][ix + 1] * tx * (1 - ty) + gv[iy + 1][ix] * (1 - tx) * ty + gv[iy + 1][ix + 1] * tx * ty;
      const b = T.base[T.base.length > 1 && R() < .45 ? 1 : 0]; const out = x < M || y < M || x >= M + P || y >= M + P;
      g[y].push({ x, y, h: Math.round(v * T.maxH * 1.25), t: b, obj: null, deco: null, light: null, out });
    } }
    const all = g.flat(); const tl = (x, y) => g[y] && g[y][x];
    if (T.shape === 'circle') { const r = P / 2; all.forEach(c => { const d = Math.hypot(c.x - m, c.y - m); c.out = d > r - .2;
      if (T.stands) { if (d > r + 2.6) c.t = null; else if (c.out) { c.t = 'stone'; c.h = 3 + (d > r + 1.2 ? 1 : 0); } else c.h = Math.min(c.h, 1); }
      else { if (c.out) c.t = null; else if (T.terrace) c.h = d < r * .3 ? 2 : d < r * .65 ? 1 : 0; } }); }
    if (T.shape === 'ship') all.forEach(c => { const w = Math.abs(c.y - m); const lx = c.x - M; const lim = lx < 0 || lx >= P ? -1 : lx < 2 ? 1.5 : lx < 4 ? 3 : 4.5; c.out = false; if (w > lim) c.t = null; else c.h = lx >= P - 3 ? 2 : 1; });
    if (T.shape === 'islands') { all.forEach(c => { if (c.out) c.t = null; }); for (let i = 0; i < 9; i++) { const cx = M + 2 + Math.floor(R() * (P - 4)), cy = M + 2 + Math.floor(R() * (P - 4)); if (Math.abs(cx - cy) < 2) continue; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([dx, dy]) => { const c = tl(cx + dx, cy + dy); if (c && R() < .8) c.t = null; }); } }
    if (T.path) all.forEach(c => { if (c.t && (c.x === c.y || c.x - c.y === 1)) c.t = T.path; });
    if (T.river) { for (let y = 0; y < F; y++) { const x0 = Math.round(m + 1 + Math.sin(y * .35) * 2.5); [x0, x0 + 1].forEach(x => { const c = tl(x, y); if (c && c.t) { c.t = 'water'; c.h = 0; } }); } [M + 3, M + P - 4, Math.round(m)].forEach(by => { for (let x = 0; x < F; x++) { const c = tl(x, by); if (c && c.t === 'water') { c.t = 'bridge'; c.h = 1; } } }); }
    if (T.sea) all.forEach(c => { if (c.t && c.x <= M + 1) { c.t = 'water'; c.h = 0; } if (c.t && c.x >= M - 1 && c.x <= M + 4 && (c.y === Math.floor(m) || c.y === Math.ceil(m) + 2)) { c.t = 'wood'; c.h = 1; } });
    if (T.dais) all.forEach(c => { if (!c.out && Math.hypot(c.x - (M + 3), c.y - (M + 3)) < 3.2) c.h = 2; else if (!c.out) c.h = Math.min(c.h, 1); });
    if (T.liquid) { const [lt, n] = T.liquid; for (let i = 0; i < n * 2; i++) { const cx = 1 + Math.floor(R() * (F - 2)), cy = 1 + Math.floor(R() * (F - 2)); if (Math.abs(cx - cy) < 3) continue; const rr = 1.2 + R() * 1.2; all.forEach(c => { if (c.t && Math.hypot(c.x - cx, c.y - cy) < rr) { c.t = lt; c.h = 0; if (lt === 'lava') c.light = '#ff6020'; } }); } }
    (T.deco || []).forEach(([d, p]) => all.forEach(c => { if (c.t && TT[c.t].walk && !c.deco && R() < p) c.deco = d; }));
    const lightOf = o => o === 'brazier' && T.fire ? T.fire : OBJ_LIGHT[o];
    if (T.grid) all.forEach(c => { if (!c.out && c.t && TT[c.t].walk && (c.x - M) % 4 === 2 && (c.y - M) % 4 === 2 && Math.abs(c.x - c.y) > 1) { c.obj = T.grid; const L = lightOf(T.grid); if (L) c.light = L; } });
    const inner = () => all.filter(c => !c.out && c.t && TT[c.t].walk && !TT[c.t].liquid && !c.obj && Math.abs(c.x - c.y) > 1);
    (T.objs || []).forEach(([o, n]) => { for (let i = 0; i < Math.round(n * P * P / 140); i++) { const f = inner(); if (!f.length) break; const c = f[Math.floor(R() * f.length)]; c.obj = o; const L = lightOf(o); if (L) c.light = L; } });
    (T.ring || []).forEach(([o, p]) => all.forEach(c => { if (c.out && c.t && TT[c.t].walk && !TT[c.t].liquid && !c.obj && Math.abs(c.x - c.y) > 1 && R() < p) { c.obj = o; const L = lightOf(o); if (L) c.light = L; } }));
    for (let k = 0; k < 5; k++) all.forEach(c => { [[1, 0], [0, 1]].forEach(([dx, dy]) => { const n = tl(c.x + dx, c.y + dy); if (n && c.t && n.t && !(T.stands && (c.out || n.out)) && Math.abs(n.h - c.h) > 2) n.h = c.h + Math.sign(n.h - c.h) * 2; }); });
    const base0 = T.base[0];
    const clean = c => { if (c.t && !TT[c.t].walk) c.t = base0; if (c.t && TT[c.t].liquid && c.t !== 'ice') { c.t = base0; } c.obj = null; c.light = null; };
    const play = all.filter(c => c.t && !c.out);
    let pc, ec; if (T.shape === 'circle') { const k = P * .3; pc = [m + k, m + k]; ec = [m - k, m - k]; } else if (T.shape === 'ship') { pc = [M + P - 3, m]; ec = [M + 3, m]; } else { pc = [M + P - 4, M + P - 4]; ec = [M + 3, M + 3]; }
    const dd = (c, p) => Math.abs(c.x - p[0]) + Math.abs(c.y - p[1]);
    const pzs = play.slice().sort((a, b) => dd(a, pc) - dd(b, pc)).slice(0, 8); pzs.forEach(clean);
    const ezs = play.slice().sort((a, b) => dd(a, ec) - dd(b, ec)).slice(0, 10); ezs.forEach(clean);
    const map = { N: F, g, theme, pz: pzs, ez: ezs, M, P, pc, ec };
    const seen = bfsAll(map, pzs[0], 2); if (ezs.every(c => seen.has(c.x + ',' + c.y)) && pzs.every(c => seen.has(c.x + ',' + c.y))) return map;
  }
  throw new Error('mapa ' + theme);
}
// objetos novos (desenho procedural)
function drawObj2(g, c, sx, sy) {
  const t = V.t, o = c.obj;
  if (o === 'grave') { g.fillStyle = '#6d6a7a'; g.beginPath(); g.moveTo(sx - 5, sy); g.lineTo(sx - 5, sy - 11); g.arc(sx, sy - 11, 5, Math.PI, 0); g.lineTo(sx + 5, sy); g.fill(); g.fillStyle = '#4a4858'; g.fillRect(sx - 1, sy - 12, 2, 7); g.fillRect(sx - 3, sy - 10, 6, 2); return true; }
  if (o === 'banner') { g.fillStyle = '#5a3a22'; g.fillRect(sx - 1, sy - 30, 2, 30); const w = Math.sin(t / 15 + c.x) * 1.5; g.fillStyle = '#a02020'; g.beginPath(); g.moveTo(sx + 1, sy - 29); g.lineTo(sx + 11 + w, sy - 27); g.lineTo(sx + 11 + w, sy - 15); g.lineTo(sx + 6, sy - 18); g.lineTo(sx + 1, sy - 15); g.fill(); g.fillStyle = '#e8c040'; g.fillRect(sx + 4, sy - 25, 4, 4); return true; }
  if (o === 'palm') { g.strokeStyle = '#7a5a30'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + 4, sy - 14, sx + 2, sy - 28); g.stroke(); g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + Math.sin(t / 40) * .08; g.fillStyle = i % 2 ? '#2f8a3a' : '#3ea84a'; g.beginPath(); g.moveTo(sx + 2, sy - 28); g.quadraticCurveTo(sx + 2 + Math.cos(a) * 9, sy - 34 + Math.sin(a) * 4, sx + 2 + Math.cos(a) * 14, sy - 24 + Math.sin(a) * 6); g.lineTo(sx + 2 + Math.cos(a) * 10, sy - 26 + Math.sin(a) * 4); g.fill(); } return true; }
  if (o === 'statue') { box(g, sx, sy, 7, 6, '#c9a030', '#9a7418', '#7a5a10'); g.fillStyle = '#e8b93a'; g.fillRect(sx - 4, sy - 22, 8, 16); g.beginPath(); g.arc(sx, sy - 25, 4, 0, 7); g.fill(); g.fillStyle = '#fff0a0'; g.fillRect(sx - 3, sy - 21, 2, 12); g.fillStyle = '#7a5a10'; g.fillRect(sx - 1, sy - 26, 1, 1); g.fillRect(sx + 1, sy - 26, 1, 1); return true; }
  if (o === 'mast') { g.fillStyle = '#5a3a1e'; g.fillRect(sx - 2, sy - 46, 4, 46); const w = Math.sin(t / 30) * 2; g.fillStyle = '#efe6cf'; g.beginPath(); g.moveTo(sx - 12, sy - 42); g.quadraticCurveTo(sx + w, sy - 36, sx + 12, sy - 42); g.lineTo(sx + 12, sy - 22); g.quadraticCurveTo(sx + w, sy - 16, sx - 12, sy - 22); g.fill(); g.fillStyle = '#b03030'; g.fillRect(sx - 1, sy - 52, 8, 4); return true; }
  if (o === 'barrel') { g.fillStyle = '#7a4a22'; g.beginPath(); g.ellipse(sx, sy - 6, 6, 8, 0, 0, 7); g.fill(); g.fillStyle = '#4a2c14'; g.fillRect(sx - 6, sy - 9, 12, 1); g.fillRect(sx - 6, sy - 3, 12, 1); g.fillStyle = '#9a6a3a'; g.beginPath(); g.ellipse(sx, sy - 13, 5, 2, 0, 0, 7); g.fill(); return true; }
  if (o === 'tent') { const cols = ['#d83a3a', '#f0e6d0']; for (let i = 0; i < 6; i++) { g.fillStyle = cols[i % 2]; g.beginPath(); g.moveTo(sx, sy - 30); g.lineTo(sx - 14 + i * 4.7, sy - 4); g.lineTo(sx - 14 + (i + 1) * 4.7, sy - 4); g.fill(); } g.fillStyle = '#3a2010'; g.fillRect(sx - 3, sy - 10, 6, 6); g.fillStyle = '#ffd040'; g.fillRect(sx - 1, sy - 34, 2, 4); return true; }
  if (o === 'stall') { g.fillStyle = '#7a4a22'; g.fillRect(sx - 11, sy - 10, 22, 8); g.fillRect(sx - 11, sy - 22, 2, 14); g.fillRect(sx + 9, sy - 22, 2, 14); for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#f0e6d0' : '#3a7ad8'; g.fillRect(sx - 12 + i * 5, sy - 26, 5, 5); } g.fillStyle = '#e04040'; g.fillRect(sx - 8, sy - 13, 3, 3); g.fillStyle = '#ffd040'; g.fillRect(sx - 2, sy - 13, 3, 3); g.fillStyle = '#60c040'; g.fillRect(sx + 4, sy - 13, 3, 3); return true; }
  if (o === 'gmush') { const p = .8 + Math.sin(t / 20 + c.x) * .2; g.fillStyle = '#d8e8f0'; g.fillRect(sx - 1, sy - 12, 3, 12); g.fillStyle = `rgba(60,220,255,${p})`; g.beginPath(); g.ellipse(sx, sy - 13, 8, 4, 0, Math.PI, 0); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(sx - 4, sy - 15, 2, 1); g.fillRect(sx + 2, sy - 14, 2, 1); return true; }
  if (o === 'spike') { g.fillStyle = '#2a1a22'; g.beginPath(); g.moveTo(sx - 6, sy); g.lineTo(sx - 1, sy - 26); g.lineTo(sx + 5, sy); g.fill(); g.fillStyle = '#7a2030'; g.beginPath(); g.moveTo(sx - 1, sy - 26); g.lineTo(sx + 5, sy); g.lineTo(sx + 1, sy); g.fill(); return true; }
  if (o === 'gear') { g.save(); g.translate(sx, sy - 14); g.rotate(t / 60 * (c.x % 2 ? 1 : -1)); g.fillStyle = '#8a7a5a'; for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.fillRect(-2, -13, 4, 5); } g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill(); g.fillStyle = '#5a4a30'; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); g.restore(); return true; }
  if (o === 'portal') { const r = 9 + Math.sin(t / 10) * 1; g.strokeStyle = '#c060ff'; g.lineWidth = 2; g.beginPath(); g.ellipse(sx, sy - 16, r * .7, r * 1.3, 0, 0, 7); g.stroke(); g.fillStyle = 'rgba(120,40,200,.5)'; g.fill(); g.lineWidth = 1; if (t % 6 === 0) emit(sx, sy - 16, 1, { c: '#d090ff', sp: .3, life: 30, s: 1.5 }); return true; }
  if (o === 'snowpine') { g.fillStyle = '#4a321e'; g.fillRect(sx - 2, sy - 8, 4, 8); [[0, '#2a5a48', 13, 0], [1, '#336a54', 10, -8], [2, '#3e7a60', 7, -16]].forEach(([i, col, w, y]) => { g.fillStyle = col; g.beginPath(); g.moveTo(sx, sy - 22 + y); g.lineTo(sx + w, sy - 4 + y); g.lineTo(sx - w, sy - 4 + y); g.fill(); g.fillStyle = '#f4f8ff'; g.beginPath(); g.moveTo(sx, sy - 22 + y); g.lineTo(sx + w * .5, sy - 13 + y); g.lineTo(sx - w * .5, sy - 13 + y); g.fill(); }); return true; }
  return false;
}
// ---------- visual por tema: céu, silhuetas, atmosfera, partículas ----------
const VIS = {
  village: { sky: ['#1e1838', '#5a3a6e', '#e07a52'], stars: 1, moon: 1, layers: [['#3a2a50', .55, 18, .3], ['#2a2040', .65, 12, .5]], atmos: { dark: .36, tint: 'rgba(255,130,60,.07)', rays: '255,200,140', fog: 0 }, amb: 'lanterns' },
  forest: { sky: ['#0a1a20', '#123a3a', '#2e6a52'], layers: [['#0e2a26', .45, 30, .2, 'trees'], ['#08201c', .6, 22, .4, 'trees']], atmos: { dark: .44, tint: 'rgba(40,120,140,.08)', rays: '150,230,255', fog: '190,240,230' }, amb: 'fireflies' },
  crypt: { sky: ['#050308', '#120a1c', '#1e1428'], layers: [['#0c0812', .5, 10, .2]], atmos: { dark: .7, tint: 'rgba(90,40,140,.08)', rays: 0, fog: '150,110,200' }, amb: 'wisps' },
  future: { sky: ['#120404', '#4a0e08', '#a8301a'], stars: 2, layers: [['#2a0806', .55, 26, .3, 'city'], ['#1a0403', .66, 18, .5, 'city']], atmos: { dark: .28, tint: 'rgba(255,40,0,.09)', rays: '255,120,60', fog: '120,60,50' }, amb: 'ash' },
  tower: { sky: ['#04030e', '#140c34', '#2a1a5a'], stars: 1, clock: 1, layers: [], atmos: { dark: .22, tint: 'rgba(120,80,255,.07)', rays: '200,180,255', fog: 0 }, amb: 'gold' },
  fogvillage: { sky: ['#1a1e26', '#3a4250', '#6a7484'], layers: [['#2a3038', .55, 16, .3, 'trees'], ['#20262e', .65, 12, .5]], atmos: { dark: .42, tint: 'rgba(120,140,170,.1)', rays: 0, fog: '210,220,235' }, amb: 'fog' },
  castle: { sky: ['#1a1030', '#4a2a5a', '#d07a50'], stars: 1, layers: [['#2a1a3a', .52, 30, .3, 'city'], ['#1e1430', .64, 14, .5]], atmos: { dark: .3, tint: 'rgba(255,150,80,.06)', rays: '255,200,150', fog: 0 }, amb: 'lanterns' },
  gothic: { sky: ['#0a0408', '#2a0a14', '#5a1420'], moon: 2, layers: [['#1a0810', .5, 24, .3, 'spikes'], ['#120408', .62, 16, .5, 'trees']], atmos: { dark: .5, tint: 'rgba(160,20,40,.08)', rays: 0, fog: '160,120,140' }, amb: 'fog' },
  manor: { sky: ['#0a0608', '#1c1014', '#2a1820'], layers: [], atmos: { dark: .62, tint: 'rgba(160,90,40,.08)', rays: 0, fog: '140,110,130' }, amb: 'wisps' },
  jungle: { sky: ['#0a2a1a', '#1e5a32', '#7ab060'], layers: [['#123a22', .45, 34, .2, 'trees'], ['#0c2a18', .58, 26, .4, 'trees']], atmos: { dark: .26, tint: 'rgba(60,160,60,.08)', rays: '230,255,180', fog: '200,240,200' }, amb: 'spores' },
  goldcity: { sky: ['#3a1a30', '#b05a40', '#f0c070'], layers: [['#7a4a30', .55, 30, .3, 'pyramids'], ['#5a3420', .66, 18, .5]], atmos: { dark: .1, tint: 'rgba(255,190,80,.08)', rays: '255,220,140', fog: 0 }, amb: 'gold' },
  temple: { sky: ['#040a06', '#0a1a10', '#123020'], layers: [['#081a0e', .5, 12, .2]], atmos: { dark: .66, tint: 'rgba(60,200,90,.08)', rays: 0, fog: '120,200,140' }, amb: 'wisps' },
  sky: { sky: ['#2a5ab0', '#6aa0e0', '#d8ecff'], layers: [['#ffffff', .78, 14, .2, 'clouds'], ['#e8f2ff', .86, 10, .4, 'clouds']], atmos: { dark: .04, tint: 'rgba(255,255,255,.03)', rays: '255,255,230', fog: 0 }, amb: 'clouds' },
  arena: { sky: ['#3a6ac0', '#8ab4e8', '#f0e0c0'], layers: [['#c8b8a0', .6, 26, .3, 'city'], ['#a89880', .7, 12, .5]], atmos: { dark: .05, tint: 'rgba(255,220,150,.05)', rays: '255,240,200', fog: 0 }, amb: 'confetti' },
  elemental: { sky: ['#200402', '#701808', '#f06020'], layers: [['#3a0a04', .55, 30, .3, 'spikes'], ['#2a0602', .66, 18, .5]], atmos: { dark: .22, tint: 'rgba(255,80,0,.1)', rays: '255,140,60', fog: 0 }, amb: 'embers' },
  underdark: { sky: ['#020206', '#06060e', '#0a0a18'], layers: [['#06060c', .4, 30, .2, 'spikes']], atmos: { dark: .74, tint: 'rgba(40,120,200,.06)', rays: 0, fog: '80,120,200' }, amb: 'spores' },
  abyss: { sky: ['#0a0004', '#3a0418', '#8a1020'], stars: 2, layers: [['#1a0208', .55, 34, .3, 'spikes'], ['#120004', .66, 20, .5, 'spikes']], atmos: { dark: .3, tint: 'rgba(200,0,40,.1)', rays: '255,60,60', fog: '120,30,40' }, amb: 'embers' },
  clockcity: { sky: ['#1a0a06', '#5a2a10', '#c06a30'], stars: 2, layers: [['#2a1408', .55, 26, .3, 'city'], ['#1e0e06', .66, 16, .5, 'city']], atmos: { dark: .3, tint: 'rgba(255,140,60,.07)', rays: '255,180,100', fog: '140,100,80' }, amb: 'ash' },
  timewar: { sky: ['#04030e', '#1a0c40', '#5a2a8a'], stars: 1, clock: 1, layers: [], atmos: { dark: .2, tint: 'rgba(140,80,255,.08)', rays: '220,180,255', fog: '160,120,255' }, amb: 'gold' },
  devour: { sky: ['#000000', '#140428', '#3a0a40'], stars: 1, layers: [['#0a0214', .6, 40, .3, 'spikes']], atmos: { dark: .32, tint: 'rgba(120,20,180,.1)', rays: '200,80,255', fog: '120,40,160' }, amb: 'void' },
  carnival: { sky: ['#12082a', '#3a1a5a', '#8a3a7a'], stars: 1, moon: 1, layers: [['#20123a', .58, 14, .3], ['#160c2a', .66, 10, .5]], atmos: { dark: .32, tint: 'rgba(255,80,200,.06)', rays: 0, fog: 0 }, amb: 'confetti' },
  market: { sky: ['#3a6ac0', '#8ab4e8', '#f8e0b0'], layers: [['#a07a60', .5, 30, .3, 'city'], ['#7a5a48', .62, 18, .5, 'city']], atmos: { dark: .06, tint: 'rgba(255,200,120,.05)', rays: '255,240,200', fog: 0 }, amb: 'none' },
  coast: { sky: ['#4a7ac8', '#9ac0e8', '#f0e0c8'], layers: [['#3a70b0', .6, 4, .2], ['#2a5a98', .7, 3, .4]], atmos: { dark: .06, tint: 'rgba(120,200,255,.05)', rays: '255,250,220', fog: '230,240,255' }, amb: 'none' },
  snow: { sky: ['#4a5a7a', '#8a9ab8', '#d8e2f0'], layers: [['#a8b8d0', .5, 34, .3, 'spikes'], ['#8898b4', .62, 20, .5, 'trees']], atmos: { dark: .14, tint: 'rgba(200,220,255,.08)', rays: 0, fog: '240,245,255' }, amb: 'snow' },
  dungeon: { sky: ['#040306', '#0e0a14', '#18121e'], layers: [], atmos: { dark: .68, tint: 'rgba(200,120,60,.06)', rays: 0, fog: '120,100,140' }, amb: 'wisps' },
};
function drawSky(g) {
  const th = S.map.theme, W = V.bw, H = V.bh, t = V.t; const vi = VIS[th] || VIS.village;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, vi.sky[0]); gr.addColorStop(.55, vi.sky[1]); gr.addColorStop(1, vi.sky[2]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (vi.stars) for (let i = 0; i < 90; i++) { const x = hash(i, 1) * W, y = hash(i, 2) * H * (vi.clock ? 1 : .5); const tw = .5 + .5 * Math.sin(t / 20 + i); g.fillStyle = vi.stars === 2 ? `rgba(255,120,80,${tw * .3})` : `rgba(255,255,255,${tw * .8})`; g.fillRect(x, y, hash(i, 3) > .9 ? 2 : 1, 1); }
  if (vi.clock) { const cx = W / 2 + V.panX * .3, cy = H * .38, R = Math.min(W, H) * .42; g.strokeStyle = 'rgba(160,130,255,.18)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke(); g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R * .8, 0, 7); g.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillStyle = 'rgba(200,180,255,.25)'; g.fillRect(cx + Math.cos(a) * R * .9 - 2, cy + Math.sin(a) * R * .9 - 2, 4, 4); }
    const a1 = t / 400, a2 = t / 40; g.strokeStyle = 'rgba(242,201,76,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a1) * R * .5, cy + Math.sin(a1) * R * .5); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a2) * R * .75, cy + Math.sin(a2) * R * .75); g.stroke(); g.lineWidth = 1;
    const neb = g.createRadialGradient(W * .2, H * .7, 0, W * .2, H * .7, W * .5); neb.addColorStop(0, 'rgba(160,60,200,.18)'); neb.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = neb; g.fillRect(0, 0, W, H); }
  if (vi.moon) { const mx = W * .8 - V.panX * .1, my = H * .22; const col = vi.moon === 2 ? '255,90,80' : '255,225,180'; const mg = g.createRadialGradient(mx, my, 4, mx, my, 44); mg.addColorStop(0, `rgba(${col},.35)`); mg.addColorStop(1, `rgba(${col},0)`); g.fillStyle = mg; g.fillRect(mx - 44, my - 44, 88, 88); g.fillStyle = vi.moon === 2 ? '#e04848' : '#ffe9c4'; g.beginPath(); g.arc(mx, my, vi.moon === 2 ? 16 : 11, 0, 7); g.fill(); }
  (vi.layers || []).forEach(([col, base, amp, par, style], li) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 3) { const xx = x - V.panX * par - (style === 'clouds' ? t * .1 * (li + 1) : 0); let y = H * base - (Math.sin(xx * .02 + li * 3) * .5 + Math.sin(xx * .055 + li) * .3 + Math.sin(xx * .13) * .2) * amp;
      if (style === 'trees') y -= hash(Math.floor(xx / 8), li) * 14; if (style === 'city' && hash(Math.floor(xx / 14), li) > .5) y -= 22 * hash(Math.floor(xx / 14), li + 5);
      if (style === 'spikes') y -= (Math.floor(xx / 10) % 2 ? 1 : 0) * hash(Math.floor(xx / 10), li) * 26; if (style === 'pyramids') y -= Math.max(0, 30 - Math.abs((xx % 90) - 45)) * .9;
      if (style === 'clouds') y = H * base - Math.abs(Math.sin(xx * .03 + li)) * amp - Math.abs(Math.sin(xx * .011)) * amp;
      g.lineTo(x, y); }
    g.lineTo(W, H); g.fill(); });
}
function ambient2() {
  const vi = VIS[S.map.theme] || {}; const t = V.t, W = V.bw, H = V.bh;
  switch (vi.amb) {
    case 'fireflies': if (t % 6 === 0) emit(Math.random() * W, Math.random() * H * .8, 1, { c: '#d8ff70', sp: .15, life: 140, s: 1.6, fr: 1 }); break;
    case 'ash': if (t % 2 === 0) emit(Math.random() * W, -4, 1, { c: Math.random() < .3 ? '#ff7040' : '#8a7a7a', sp: .2, vy: .5, life: 300, s: 1, glow: 0, fr: 1 }); break;
    case 'gold': if (t % 5 === 0) emit(Math.random() * W, H + 4, 1, { c: '#f2c94c', sp: .1, vy: -.4, life: 260, s: 1.2, fr: 1 }); break;
    case 'lanterns': if (t % 9 === 0) emit(Math.random() * W, H * (.3 + Math.random() * .5), 1, { c: '#ffcf80', sp: .1, vy: -.15, life: 160, s: 1.3, fr: 1 }); break;
    case 'wisps': if (t % 7 === 0) emit(Math.random() * W, H * Math.random(), 1, { c: '#9070c0', sp: .1, life: 200, s: 1, fr: 1 }); break;
    case 'fog': if (t % 5 === 0) emit(Math.random() * W, H * (.4 + Math.random() * .5), 1, { c: '#c8d0dc', sp: .15, life: 220, s: 2.5, glow: 0, fr: 1 }); break;
    case 'spores': if (t % 4 === 0) emit(Math.random() * W, H * Math.random(), 1, { c: Math.random() < .5 ? '#70ffd0' : '#c0ff80', sp: .12, vy: -.12, life: 200, s: 1.3, fr: 1 }); break;
    case 'embers': if (t % 2 === 0) emit(Math.random() * W, H + 2, 1, { c: Math.random() < .5 ? '#ff9030' : '#ffd060', sp: .3, vy: -.7, life: 200, s: 1.4, fr: 1 }); break;
    case 'snow': if (t % 1 === 0) emit(Math.random() * W, -4, 1, { c: '#ffffff', sp: .25, vy: .45, life: 400, s: 1.3, glow: 0, fr: 1 }); break;
    case 'confetti': if (t % 3 === 0) emit(Math.random() * W, -4, 1, { c: ['#ff4060', '#40c0ff', '#ffd040', '#60e060', '#e060ff'][rnd(5)], sp: .3, vy: .6, life: 300, s: 1.6, glow: 0, fr: 1 }); break;
    case 'clouds': if (t % 10 === 0) emit(-6, H * (.55 + Math.random() * .4), 1, { c: '#ffffff', sp: 0, vy: 0, life: 500, s: 3, glow: 0, fr: 1, ang: 0, spread: 0 }); P.forEach(p => { if (p.c === '#ffffff' && p.s === 3) p.vx = .5; }); break;
    case 'void': if (t % 3 === 0) emit(Math.random() * W, Math.random() * H, 1, { c: Math.random() < .5 ? '#a040ff' : '#ff40a0', sp: .2, life: 120, s: 1.5, fr: 1 }); break;
  }
  S.map.g.flat().forEach(c => { if (c.t === 'lava' && Math.random() < .02) { const [sx, sy] = toScreen(c.x, c.y, 0); emit(sx, sy, 1, { c: '#ffb040', vy: -.8, sp: .3, life: 40, s: 1.5 }); } });
}
