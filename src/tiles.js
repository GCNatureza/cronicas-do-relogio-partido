// ================= CENÁRIOS RICOS: texturas pintadas, paredes com decoração e mobília =================
Object.assign(TT, {
  rock: { top: ['#5d5a66', '#55525e'], l: '#45424e', r: '#36343e', det: '#8a8796', walk: 1, crack: 1 },
  cobble: { top: ['#8a8278', '#80786e'], l: '#5f574e', r: '#4b443c', det: '#aaa298', walk: 1 },
});
const rgbOf = hex => { const n = parseInt(hex6(hex).slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const lit = (c, k) => k >= 0 ? c.map(v => v + (255 - v) * k) : c.map(v => v * (1 + k));
function vn2(x, y, s, sd) { const X = Math.floor(x / s), Y = Math.floor(y / s), fx = x / s - X, fy = y / s - Y; const a = hash(X, Y, sd), b = hash(X + 1, Y, sd), c = hash(X, Y + 1, sd), d = hash(X + 1, Y + 1, sd); const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return a * (1 - sx) * (1 - sy) + b * sx * (1 - sy) + c * (1 - sx) * sy + d * sx * sy; }
const fbm = (x, y, sd) => vn2(x, y, 6, sd) * .55 + vn2(x, y, 3, sd + 3) * .3 + vn2(x, y, 1.5, sd + 7) * .15;

// ---------- textura do topo (losango 33×17) ----------
const TOPGEN = {
  grass(b, u, v, x, y, s) { let k = (fbm(x, y, s) - .5) * .28; const h = hash(x, y, s + 1); if (h < .1) k += .22; else if (h < .17) k -= .2; if (hash(x >> 1, y, s + 2) < .03) k += .3; return lit(b, k); },
  moss(b, u, v, x, y, s) { let k = (fbm(x, y, s) - .5) * .34; const h = hash(x, y, s + 1); if (h < .08) k += .2; else if (h < .2) k -= .18; return lit(b, k); },
  dirt(b, u, v, x, y, s) { let k = (fbm(x, y, s) - .5) * .22; const p = hash(x >> 1, y >> 1, s + 4); if (p < .035) k += .28; else if (p < .05) k -= .22; if (hash(x, y, s + 5) < .06) k -= .1; return lit(b, k); },
  sand(b, u, v, x, y, s) { let k = (fbm(x, y, s) - .5) * .12; const r = Math.sin(x * .45 + y * 1.25 + fbm(x, y, s + 9) * 5); if (r > .82) k += .12; else if (r < -.9) k -= .08; if (hash(x, y, s + 3) < .03) k -= .15; return lit(b, k); },
  snow(b, u, v, x, y, s) { let k = (fbm(x, y, s) - .5) * .1; let c = lit(b, k); if (fbm(x + 40, y, s) < .38) c = [c[0] - 14, c[1] - 6, c[2]]; if (hash(x, y, s + 2) < .03) c = [255, 255, 255]; return c; },
  stone(b, u, v, x, y, s) { // uma laje por casa (às vezes dividida), rejunte nas bordas e chanfro suave
    const id = hash(Math.floor(x / 33), Math.floor(y / 17), s); const split = id < .35; const su = split ? (u < .5 ? u * 2 : (u - .5) * 2) : u; const sid = split ? hash(u < .5 ? 1 : 2, Math.floor(x / 33), s + 4) : id;
    if (u < .045 || v < .045 || (split && Math.abs(u - .5) < .025)) return lit(b, -.3);
    let k = (sid - .5) * .12 + (fbm(x, y, s) - .5) * .09; if (su < .1 || v < .1) k += .07; if (su > .93 || v > .93) k -= .07;
    if (sid < .22 && Math.abs(su - .35 - v * .45) < .025) k -= .22; if (hash(x, y, s + 6) < .03) k -= .08; return lit(b, k); },
  cobble(b, u, v, x, y, s) { // pedras redondas irregulares
    const cx = u * 5, cy = v * 5; let best = 9, second = 9, bid = 0; for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) { const gx = Math.floor(cx) + a, gy = Math.floor(cy) + c; const px = gx + hash(gx, gy, s), py = gy + hash(gy, gx, s + 1); const d = Math.hypot(cx - px, cy - py); if (d < best) { second = best; best = d; bid = hash(gx, gy, s + 2); } else if (d < second) second = d; }
    if (second - best < .12) return lit(b, -.45); let k = (bid - .5) * .24 + (best < .3 ? .1 : -best * .1); return lit(b, k); },
  marble(b, u, v, x, y, s) { const vein = Math.abs(Math.sin(u * 6 + v * 2.5 + fbm(x, y, s) * 6)); let k = (fbm(x, y, s + 2) - .5) * .08; if (vein < .07) k -= .22; if (u < .03 || v < .03) k -= .2; return lit(b, k); },
  wood(b, u, v, x, y, s) { const p = Math.floor(v * 3), fp = v * 3 - p, ph = hash(p, 7, s); if (fp < .08) return lit(b, -.26);
    const end = (u + ph) % 1; if (end < .03) return lit(b, -.24); let k = (ph - .5) * .14 + Math.sin(u * 22 + ph * 20 + fbm(x, y, s) * 4) * .03; if (fp < .18) k += .05; if (Math.abs(end - .06) < .02 && Math.abs(fp - .5) < .12) k = -.5; return lit(b, k); },
  carpet(b, u, v, x, y, s) { const e = Math.min(u, 1 - u, v, 1 - v), dm = Math.abs(u - .5) + Math.abs(v - .5); const gold = rgbOf('#d8a040');
    if (e < .06) return lit(b, -.35); if (e < .12) return (Math.floor((u + v) * 14) % 2) ? gold : lit(b, -.2); if (Math.abs(dm - .28) < .045) return gold; if (dm < .12) return lit(gold, -.25); return lit(b, (fbm(x, y, s) - .5) * .1); },
  metal(b, u, v, x, y, s) { if (u < .04 || v < .04) return lit(b, -.4); const r = [[.15, .15], [.85, .15], [.15, .85], [.85, .85]].some(([a, c]) => Math.abs(u - a) < .045 && Math.abs(v - c) < .045); if (r) return lit(b, .35);
    return lit(b, (hash(0, y, s) - .5) * .12 + (fbm(x, y, s) - .5) * .1); },
  obsidian(b, u, v, x, y, s) { const id = hash(Math.floor(x / 5), Math.floor(y / 3), s); let c = lit(b, (id - .5) * .3); if (hash(x, y, s + 4) < .025) c = rgbOf('#b080d0'); return c; },
  ash(b, u, v, x, y, s) { let k = (fbm(x, y, s) - .5) * .3; if (hash(x, y, s + 1) < .015) return rgbOf('#ff8a3a'); if (Math.abs(Math.sin(x * .3 + y * .8 + fbm(x, y, s) * 4)) < .05) k -= .25; return lit(b, k); },
  gold(b, u, v, x, y, s) { const fu = (u * 2) % 1, fv = (v * 2) % 1; if (fu < .06 || fv < .06) return lit(b, -.35); let k = .25 - (fu + fv) * .22 + (fbm(x, y, s) - .5) * .1; return lit(b, k); },
  rock(b, u, v, x, y, s) { let k = (fbm(x, y, s) - .5) * .4; if (Math.abs(Math.sin(x * .5 - y * .9 + fbm(x, y, s + 2) * 6)) < .06) k -= .3; return lit(b, k); },
};
TOPGEN.bridge = TOPGEN.wood;
function topTex(t, variant, alt) {
  const key = t + '|' + variant + '|' + alt; let c = TEX.get(key); if (c) return c;
  c = mk(33, 17); const g = c.getContext('2d'); const id = g.createImageData(33, 17); const tt = TT[t]; const base = rgbOf(tt.top[alt]); const gen = TOPGEN[t]; const sd = variant * 31 + 5;
  for (let y = 0; y < 17; y++) for (let x = 0; x < 33; x++) {
    if (Math.abs(x - 16) / 16.5 + Math.abs(y - 8) / 8.5 > 1) continue;
    const u = Math.min(1, Math.max(0, (x - 16) / 32 + (y - 8) / 16 + .5)), v = Math.min(1, Math.max(0, (y - 8) / 16 - (x - 16) / 32 + .5));
    const col = gen ? gen(base, u, v, x + variant * 33, y + variant * 17, sd) : lit(base, (fbm(x, y, sd) - .5) * .15); const o = (y * 33 + x) * 4;
    id.data[o] = col[0]; id.data[o + 1] = col[1]; id.data[o + 2] = col[2]; id.data[o + 3] = 255;
  }
  g.putImageData(id, 0, 0); TEX.set(key, c); return c;
}
const TEX = new Map();
// ---------- textura das laterais ----------
const FACECAT = { grass: 'soil', moss: 'soil', dirt: 'soil', sand: 'soil', snow: 'soil', stone: 'brick', marble: 'brick', metal: 'plate', gold: 'brick', obsidian: 'rock', ash: 'rock', rock: 'rock', cobble: 'brick', carpet: 'brick', wood: 'plank', bridge: 'plank' };
function faceTex(t, side, d) {
  const key = t + '|' + side + '|' + d; let c = TEX.get(key); if (c) return c;
  c = mk(16, 9 + d); const g = c.getContext('2d'); const id = g.createImageData(16, 9 + d); const tt = TT[t];
  const base = rgbOf(side === 'l' ? tt.l : tt.r), topc = rgbOf(tt.top[0]); const cat = FACECAT[t] || 'soil'; const sd = side === 'l' ? 11 : 23;
  for (let i = 0; i < 16; i++) { const y0 = side === 'l' ? i / 2 : 8 - i / 2;
    for (let y = Math.ceil(y0); y <= Math.floor(y0 + d) + 1 && y < 9 + d; y++) { const r = y - y0; let col;
      if (cat === 'soil') {
        const lip = t === 'grass' || t === 'moss' ? 2 + (hash(i, 0, sd) < .45 ? 1 : 0) + (hash(i, 1, sd) < .15 ? 2 : 0) : t === 'snow' ? 3 + (hash(i, 2, sd) < .4 ? 1 : 0) : 0;
        if (r < lip) col = lit(topc, side === 'l' ? -.1 : -.22);
        else { const band = Math.floor((r + hash(i, 3, sd) * 2) / 6) % 2; let k = (fbm(i, y, sd) - .5) * .3 - r / (d + 8) * .25 + (band ? -.05 : .03); col = lit(base, k);
          const p = hash(i >> 1, y >> 1, sd + 5); if (p < .05) col = lit([140, 132, 120], (hash(i, y, 3) - .5) * .4); }
      } else if (cat === 'brick' || cat === 'plate') {
        const ch = cat === 'plate' ? 8 : 4, course = Math.floor(r / ch), rr = r - course * ch; const off = (course % 2) * 4;
        if (rr >= ch - 1 || (cat === 'brick' && (i + off) % 8 === 0)) col = lit(base, -.35);
        else { let k = (hash(Math.floor((i + off) / 8), course, sd) - .5) * .22 + (fbm(i, y, sd) - .5) * .1; if (rr === 0) k += .12; if (cat === 'plate' && (i === 2 || i === 13) && rr === 2) k = .45; col = lit(base, k); }
      } else if (cat === 'plank') { const course = Math.floor(r / 3); col = r % 3 === 2 ? lit(base, -.35) : lit(base, (hash(course, i >> 3, sd) - .5) * .2 + Math.sin(i * 1.7 + course) * .04); }
      else { let k = (fbm(i * 1.3, y, sd) - .5) * .45; if (Math.abs(Math.sin(i * .6 + y * .35 + fbm(i, y, sd + 2) * 5)) < .08) k -= .3; col = lit(base, k); }
      const o = (y * 16 + i) * 4; id.data[o] = col[0]; id.data[o + 1] = col[1]; id.data[o + 2] = col[2]; id.data[o + 3] = 255; } }
  g.putImageData(id, 0, 0); TEX.set(key, c); return c;
}

// ---------- desenho do piso ----------
const isGrassy = t => t === 'grass' || t === 'moss';
function edgeTufts(g, c, sx, sy) { // grama avança sobre pisos vizinhos (transição suave)
  if (!c.t || isGrassy(c.t) || TT[c.t].liquid || c.wall) return; const [rx, ry] = rotP(c.x, c.y);
  const E = [[1, 0, [16, 0], [0, 8]], [-1, 0, [-16, 0], [0, -8]], [0, 1, [-16, 0], [0, 8]], [0, -1, [0, -8], [16, 0]]];
  for (const [dx, dy, a, b] of E) { const [wx, wy] = unrotP(rx + dx, ry + dy); const n = tile(S.map, wx, wy); if (!n || !isGrassy(n.t) || n.h !== c.h) continue;
    const col = TT[n.t].top; for (let k = 0; k < 7; k++) { const f = .1 + k * .12 + (hash(c.x, c.y, k + dx * 3 + dy * 7) - .5) * .06; const px = sx + a[0] + (b[0] - a[0]) * f, py = sy + a[1] + (b[1] - a[1]) * f;
      const inx = (sx - px) * .14, iny = (sy - py) * .14; g.fillStyle = col[k % 2]; g.fillRect(Math.round(px + inx), Math.round(py + iny), 2, 1); if (hash(c.x + k, c.y, dx + 5) < .5) { g.fillStyle = TT[n.t].det; g.fillRect(Math.round(px + inx * 2), Math.round(py + iny * 2) - 1, 1, 2); } } }
}
function drawTile(g, c, sx, sy) {
  const tt = TT[c.t]; if (!tt) return; const d = c.h * 8 + 6; const t = V.t;
  if (tt.liquid) return drawTileClassic(g, c, sx, sy);
  const alt = ((c.x + c.y) % 2 + 2) % 2, variant = Math.floor(hash(c.x, c.y, 41) * 4);
  g.drawImage(faceTex(c.t, 'l', d), sx - 16, sy); g.drawImage(faceTex(c.t, 'r', d), sx, sy);
  g.drawImage(topTex(c.t, variant, alt), sx - 16, sy - 8);
  if (c.wall && !c.stub) wallDeco(g, c, sx, sy, d);
  if (V.q >= 1) {
    const [rx, ry] = rotP(c.x, c.y);
    [[-1, 0, 0], [0, -1, 1]].forEach(([dx, dy, side]) => { const [wx, wy] = unrotP(rx + dx, ry + dy); const n = tile(S.map, wx, wy); if (!n || !n.t || n.stubNow || n.h <= c.h) return; const k = Math.min(2, n.h - c.h);
      g.fillStyle = `rgba(0,0,0,${.16 * k})`; g.beginPath(); if (side === 0) { g.moveTo(sx - 16, sy); g.lineTo(sx, sy - 8); g.lineTo(sx, sy - 3); g.lineTo(sx - 10, sy + 2); } else { g.moveTo(sx, sy - 8); g.lineTo(sx + 16, sy); g.lineTo(sx + 10, sy + 2); g.lineTo(sx, sy - 3); } g.fill(); });
    const lg = g.createLinearGradient(0, sy, 0, sy + 8 + d); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,0,0,.3)'); g.fillStyle = lg;
    g.beginPath(); g.moveTo(sx - 16, sy); g.lineTo(sx, sy + 8); g.lineTo(sx + 16, sy); g.lineTo(sx + 16, sy + d); g.lineTo(sx, sy + 8 + d); g.lineTo(sx - 16, sy + d); g.fill();
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(sx - 15, sy - 1, 15, 1);
    edgeTufts(g, c, sx, sy);
    if (isGrassy(c.t) && !c.obj) { g.fillStyle = tt.det; for (let i = 0; i < 4; i++) { const bx = sx + Math.round((hash(c.x, c.y, i + 20) - .5) * 20), by = sy + Math.round((hash(c.y, c.x, i + 30) - .5) * 7); const sw = Math.round(Math.sin(t / 25 + c.x * .8 + c.y * .5 + i) * 1.2); g.fillRect(bx, by - 2, 1, 2); g.fillRect(bx + sw, by - 4, 1, 2); } }
  }
  if (tt.gold) { g.strokeStyle = 'rgba(255,220,120,.35)'; g.lineWidth = 1; drawDiamond(g, sx, sy); g.stroke(); }
  drawDeco(g, c, sx, sy);
}
function drawDeco(g, c, sx, sy) {
  const dc = c.deco; if (!dc) return; const hsh = k => hash(c.x, c.y, k);
  if (dc === 'flower') { for (let i = 0; i < 5; i++) { const x = sx + Math.round((hsh(i) - .5) * 18), y = sy + Math.round((hsh(i + 9) - .5) * 7); g.fillStyle = '#2f7a3a'; g.fillRect(x, y, 1, 2); g.fillStyle = ['#ff6b8a', '#ffd84a', '#ffffff', '#b98aff'][Math.floor(hsh(i + 3) * 4)]; g.fillRect(x - 1, y - 1, 3, 1); g.fillRect(x, y - 2, 1, 3); } }
  else if (dc === 'mush') { g.fillStyle = '#e8dcc0'; g.fillRect(sx + 4, sy - 1, 1, 3); g.fillStyle = '#e04848'; g.fillRect(sx + 2, sy - 3, 5, 2); g.fillStyle = '#fff'; g.fillRect(sx + 3, sy - 3, 1, 1); g.fillStyle = '#c03a3a'; g.fillRect(sx - 6, sy + 1, 3, 2); }
  else if (dc === 'bones') { g.fillStyle = '#ddd6c0'; g.fillRect(sx - 6, sy, 7, 1); g.fillRect(sx - 7, sy - 1, 1, 3); g.fillRect(sx + 1, sy - 1, 1, 3); g.fillRect(sx + 3, sy + 2, 5, 1); }
  else if (dc === 'skull') { const f = frames('skull')[0]; g.drawImage(f.c, sx - 5, sy - 8, 10, 10); g.fillStyle = '#ddd6c0'; g.fillRect(sx + 4, sy + 1, 5, 1); }
  else if (dc === 'tuft' || dc === 'fern') { const col = dc === 'fern' ? ['#2d7a3c', '#3f9a4a', '#5cbc5c'] : ['#3f8a3a', '#5aae46', '#7fd060']; for (let i = 0; i < 7; i++) { g.fillStyle = col[i % 3]; const a = (i - 3) * .4; g.fillRect(Math.round(sx + Math.sin(a) * 5), Math.round(sy - 1 - Math.cos(a) * 3), 1, 3); if (dc === 'fern') g.fillRect(Math.round(sx + Math.sin(a) * 8), Math.round(sy - Math.cos(a) * 4), 2, 1); } }
  else if (dc === 'pebbles') { for (let i = 0; i < 4; i++) { const x = sx + Math.round((hsh(i) - .5) * 18), y = sy + Math.round((hsh(i + 5) - .5) * 6); g.fillStyle = '#8a8478'; g.fillRect(x, y, 2, 1); g.fillStyle = '#c0b8a8'; g.fillRect(x, y - 1, 2, 1); } }
  else if (dc === 'leaves') { for (let i = 0; i < 6; i++) { g.fillStyle = ['#c06a2a', '#a8462a', '#d8a040'][i % 3]; g.fillRect(sx + Math.round((hsh(i) - .5) * 20), sy + Math.round((hsh(i + 7) - .5) * 7), 2, 1); } }
  else if (dc === 'candles') { for (let i = 0; i < 3; i++) { const x = sx - 5 + i * 4, hh = 3 + Math.floor(hsh(i) * 4); g.fillStyle = '#efe6cc'; g.fillRect(x, sy - hh, 2, hh); const fl = Math.sin(V.t / 5 + i * 2) > 0; g.fillStyle = fl ? '#ffe070' : '#ff9a30'; g.fillRect(x, sy - hh - 2, 2, 2); } c.light = c.light || '#ffb050'; }
  else if (dc === 'rug') { const col = c.rugc || '#7a2a4a'; g.globalAlpha = .92; g.save(); g.beginPath(); g.moveTo(sx - 14, sy); g.lineTo(sx, sy - 7); g.lineTo(sx + 14, sy); g.lineTo(sx, sy + 7); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = '#e0b050'; g.lineWidth = 1; g.stroke(); g.beginPath(); g.moveTo(sx - 6, sy); g.lineTo(sx, sy - 3); g.lineTo(sx + 6, sy); g.lineTo(sx, sy + 3); g.closePath(); g.fillStyle = '#e0b050'; g.fill(); g.restore(); g.globalAlpha = 1; }
  else if (dc === 'puddle') { g.fillStyle = 'rgba(90,140,200,.55)'; g.beginPath(); g.ellipse(sx + 2, sy + 1, 7, 3, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(sx, sy, 3, 1); }
  else if (dc === 'blood') { g.fillStyle = 'rgba(110,20,20,.6)'; g.beginPath(); g.ellipse(sx - 2, sy + 1, 5, 2, 0, 0, 7); g.fill(); g.fillRect(sx + 4, sy - 1, 2, 1); }
}

// ---------- paredes: só as do fundo aparecem inteiras (corte estilo FFT) ----------
function wallSide(c) { const M = S.map.M, P = S.map.P; const [rx, ry] = rotP(c.x, c.y); return { back: rx < M || ry < M, front: rx > M + P - 1 || ry > M + P - 1, face: rx < M && ry >= M ? 'r' : ry < M && rx >= M ? 'l' : null }; }
function faceXform(g, face, sx, sy, d, fn) { g.save(); if (face === 'r') { g.translate(sx, sy + 8); g.transform(1, -.5, 0, 1, 0, 0); } else { g.translate(sx - 16, sy); g.transform(1, .5, 0, 1, 0, 0); } fn(d); g.restore(); }
function wallDeco(g, c, sx, sy, d) {
  const ws = wallSide(c); if (!ws.face) return; const T = THEMES[S.map.theme]; const list = (T.walls && T.walls.deco) || ['plain']; const kind = list[Math.floor(hash(c.x, c.y, 5) * list.length)]; const t = V.t;
  faceXform(g, ws.face, sx, sy, d, () => {
    const y0 = Math.max(4, d - 34);
    if (kind === 'torch') { g.fillStyle = '#3a2a1a'; g.fillRect(7, y0 + 12, 3, 6); g.fillStyle = '#6a5040'; g.fillRect(6, y0 + 11, 5, 2); const f = Math.sin(t / 4 + c.x) * 1.5; g.fillStyle = '#ff6a20'; g.fillRect(6, y0 + 5 - f, 5, 6 + f); g.fillStyle = '#ffd060'; g.fillRect(7, y0 + 7 - f, 3, 4 + f); if (t % 5 === 0) emit(sx, sy + y0, 1, { c: '#ffa040', vy: -.5, sp: .2, life: 24, s: 1 }); }
    else if (kind === 'window') { g.fillStyle = '#2a2436'; g.fillRect(4, y0 + 3, 9, 16); g.beginPath(); g.arc(8.5, y0 + 3, 4.5, Math.PI, 0); g.fill(); const gl = .55 + Math.sin(t / 40) * .1; g.fillStyle = `rgba(150,190,255,${gl})`; g.fillRect(5, y0 + 3, 7, 15); g.beginPath(); g.arc(8.5, y0 + 3, 3.5, Math.PI, 0); g.fill(); g.fillStyle = '#2a2436'; g.fillRect(8, y0, 1, 18); g.fillRect(5, y0 + 9, 7, 1); }
    else if (kind === 'barred') { g.fillStyle = '#141018'; g.fillRect(4, y0 + 4, 9, 9); g.fillStyle = '#6a6a74'; for (let i = 0; i < 4; i++) g.fillRect(5 + i * 2, y0 + 4, 1, 9); }
    else if (kind === 'banner') { const col = (T.walls && T.walls.banner) || '#a02020'; g.fillStyle = '#5a3a22'; g.fillRect(2, y0 + 1, 13, 2); g.fillStyle = col; g.beginPath(); g.moveTo(3, y0 + 3); g.lineTo(14, y0 + 3); g.lineTo(14, y0 + 24); g.lineTo(8.5, y0 + 20); g.lineTo(3, y0 + 24); g.fill(); g.fillStyle = '#e8c050'; g.fillRect(6, y0 + 8, 5, 5); g.fillRect(8, y0 + 6, 1, 9); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(11, y0 + 3, 3, 19); }
    else if (kind === 'shelf') { g.fillStyle = '#4a2e18'; g.fillRect(1, y0, 15, 26); g.fillStyle = '#2a1a0e'; g.fillRect(2, y0 + 1, 13, 24); for (let r = 0; r < 3; r++) { for (let i = 0; i < 6; i++) { const bh = 5 + Math.floor(hash(c.x + i, c.y + r, 3) * 2); g.fillStyle = ['#8a2a2a', '#2a5a8a', '#3a7a3a', '#c8a050', '#6a3a7a'][Math.floor(hash(i, r + c.x, c.y) * 5)]; g.fillRect(3 + i * 2, y0 + 1 + r * 8 + (7 - bh), 2, bh); } g.fillStyle = '#5a3a22'; g.fillRect(2, y0 + 8 + r * 8, 13, 1); } }
    else if (kind === 'painting') { g.fillStyle = '#c8a040'; g.fillRect(3, y0 + 4, 11, 9); g.fillStyle = '#5a8ac0'; g.fillRect(4, y0 + 5, 9, 4); g.fillStyle = '#4a8a4a'; g.fillRect(4, y0 + 9, 9, 3); g.fillStyle = '#f0e0a0'; g.fillRect(10, y0 + 6, 2, 2); }
    else if (kind === 'fireplace') { g.fillStyle = '#6a625a'; g.fillRect(1, d - 16, 15, 16); g.fillStyle = '#1a1210'; g.fillRect(3, d - 12, 11, 12); const f = Math.sin(t / 3) * 1.5; g.fillStyle = '#ff6a20'; g.fillRect(4, d - 7 - f, 9, 7 + f); g.fillStyle = '#ffd060'; g.fillRect(6, d - 5 - f, 5, 5 + f); g.fillStyle = '#8a827a'; g.fillRect(0, d - 17, 17, 2); if (t % 4 === 0) emit(sx, sy + d - 10, 1, { c: '#ff9030', vy: -.4, sp: .3, life: 20, s: 1 }); }
    else if (kind === 'web') { g.strokeStyle = 'rgba(230,230,240,.5)'; g.lineWidth = .6; g.beginPath(); for (let i = 0; i < 5; i++) { g.moveTo(0, y0 - 4); g.lineTo(i * 3.5, y0 + 10 - i * 2); } for (let r = 1; r < 4; r++) { g.moveTo(0, y0 - 4 + r * 4); g.quadraticCurveTo(r * 3, y0 + r * 2, r * 4, y0 - 4); } g.stroke(); }
    else if (kind === 'niche') { g.fillStyle = '#141018'; g.fillRect(4, y0 + 6, 9, 10); g.beginPath(); g.arc(8.5, y0 + 6, 4.5, Math.PI, 0); g.fill(); const f = frames('skull')[0]; g.drawImage(f.c, 5, y0 + 8, 7, 7); }
    else if (kind === 'chain') { g.fillStyle = '#7a7a84'; for (let i = 0; i < 6; i++) g.fillRect(i % 2 ? 7 : 8, y0 + 4 + i * 3, i % 2 ? 3 : 1, 2); g.fillRect(5, y0 + 22, 7, 2); g.fillRect(5, y0 + 20, 1, 3); g.fillRect(11, y0 + 20, 1, 3); }
    else if (kind === 'pipe') { g.fillStyle = '#6a7480'; g.fillRect(6, 0, 4, d); g.fillStyle = '#9aa6b4'; g.fillRect(6, 0, 1, d); g.fillStyle = '#c04030'; g.beginPath(); g.arc(8, y0 + 12, 3, 0, 7); g.fill(); if (t % 30 === 0) emit(sx, sy + y0, 3, { c: '#e0e8f0', vy: -.4, sp: .4, life: 30, s: 2, glow: 0 }); }
    else if (kind === 'gearw') { const a = t / 40; g.fillStyle = '#b08a3a'; g.save(); g.translate(8.5, y0 + 12); g.rotate(a); for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.fillRect(-1, -7, 2, 3); } g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fill(); g.fillStyle = '#5a4520'; g.beginPath(); g.arc(0, 0, 2, 0, 7); g.fill(); g.restore(); }
    else if (kind === 'crystalw') { g.fillStyle = '#40d0ff'; g.beginPath(); g.moveTo(8, y0 + 2); g.lineTo(12, y0 + 12); g.lineTo(8, y0 + 18); g.lineTo(5, y0 + 10); g.fill(); g.fillStyle = '#c0f4ff'; g.fillRect(8, y0 + 5, 1, 8); }
    else if (kind === 'mossw') { g.fillStyle = 'rgba(70,140,70,.75)'; for (let i = 0; i < 12; i++) g.fillRect(Math.floor(hash(c.x, i, 2) * 14), Math.floor(hash(c.y, i, 3) * (d - 4)), 3, 2); }
    else if (kind === 'relief') { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(3, y0 + 4, 11, 14); g.fillStyle = '#d8b050'; g.beginPath(); g.arc(8.5, y0 + 10, 4, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(8.5, y0 + 10, 2, 0, 7); g.fill(); g.fillRect(8, y0 + 14, 1, 4); }
  });
}

// ---------- mobília e objetos novos ----------
function cyl(g, x, y, rx, h, top, side) { g.fillStyle = side; g.fillRect(x - rx, y - h, rx * 2, h); g.beginPath(); g.ellipse(x, y, rx, rx / 2, 0, 0, Math.PI); g.fill(); g.fillStyle = top; g.beginPath(); g.ellipse(x, y - h, rx, rx / 2, 0, 0, 7); g.fill(); }
function drawObj3(g, c, sx, sy) {
  const o = c.obj, t = V.t;
  switch (o) {
    case 'throne': box(g, sx, sy, 10, 4, '#9a7a3a', '#7a5a20', '#5a4010'); g.fillStyle = '#c9a030'; g.beginPath(); g.moveTo(sx - 9, sy - 6); g.lineTo(sx - 9, sy - 30); g.lineTo(sx - 4, sy - 36); g.lineTo(sx, sy - 32); g.lineTo(sx + 4, sy - 36); g.lineTo(sx + 9, sy - 30); g.lineTo(sx + 9, sy - 6); g.fill();
      g.fillStyle = '#8a1c2a'; g.fillRect(sx - 6, sy - 28, 12, 18); g.fillStyle = '#a82a38'; g.fillRect(sx - 8, sy - 12, 16, 6); g.fillStyle = '#ffe080'; g.fillRect(sx - 1, sy - 34, 2, 3); g.fillStyle = '#40a0ff'; g.fillRect(sx - 1, sy - 24, 2, 2); return true;
    case 'table': g.fillStyle = '#4a2e18'; [[-8, 1], [8, 1], [0, -3], [0, 5]].forEach(([x, y]) => g.fillRect(sx + x - 1, sy + y - 9, 2, 9)); box(g, sx, sy - 8, 11, 2, '#9a6a3a', '#7a4e2a', '#6a4020');
      g.fillStyle = '#efe6cc'; g.fillRect(sx - 4, sy - 17, 2, 5); g.fillStyle = Math.sin(t / 5 + c.x) > 0 ? '#ffe070' : '#ff9a30'; g.fillRect(sx - 4, sy - 19, 2, 2); g.fillStyle = '#c8c0a8'; g.beginPath(); g.ellipse(sx + 4, sy - 11, 3, 1.5, 0, 0, 7); g.fill(); g.fillStyle = '#c8a040'; g.fillRect(sx + 1, sy - 14, 2, 3); c.light = c.light || '#ffb050'; return true;
    case 'chair': g.fillStyle = '#4a2e18'; g.fillRect(sx - 4, sy - 6, 1, 6); g.fillRect(sx + 3, sy - 6, 1, 6); box(g, sx, sy - 5, 5, 1, '#8a5a32', '#6a4224', '#5a361c'); g.fillStyle = '#6a4224'; g.fillRect(sx - 4, sy - 16, 8, 10); g.fillStyle = '#8a1c2a'; g.fillRect(sx - 3, sy - 15, 6, 7); return true;
    case 'bookshelf': box(g, sx, sy, 9, 28, '#5a3a22', '#4a2e18', '#3a2412'); faceXform(g, 'l', sx + 7, sy - 28 + 4, 0, () => { for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) { g.fillStyle = ['#8a2a2a', '#2a5a8a', '#3a7a3a', '#c8a050', '#6a3a7a'][Math.floor(hash(c.x + i, c.y + r, 3) * 5)]; g.fillRect(1 + i * 2, 1 + r * 6, 2, 5); } }); return true;
    case 'sarcophagus': box(g, sx, sy, 11, 6, '#8e8b9e', '#646175', '#4f4c62'); box(g, sx, sy - 6, 10, 2, '#b0adc0', '#7a7790', '#6a6780'); g.fillStyle = '#4f4c62'; g.fillRect(sx - 1, sy - 15, 2, 7); g.fillRect(sx - 3, sy - 13, 6, 2); return true;
    case 'urn': g.fillStyle = '#8a5a3a'; g.beginPath(); g.ellipse(sx, sy - 6, 5, 6, 0, 0, 7); g.fill(); g.fillStyle = '#a8784a'; g.fillRect(sx - 3, sy - 14, 6, 3); g.fillStyle = '#d8a040'; g.fillRect(sx - 5, sy - 7, 10, 1); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(sx - 3, sy - 10, 1, 6); return true;
    case 'altar': box(g, sx, sy, 11, 8, '#d9d3ee', '#9e98c0', '#837ca8'); g.fillStyle = '#a02040'; g.fillRect(sx - 6, sy - 12, 12, 5); g.fillStyle = '#e8c050'; g.fillRect(sx - 1, sy - 12, 2, 5);
      for (let i = 0; i < 2; i++) { g.fillStyle = '#efe6cc'; g.fillRect(sx - 8 + i * 15, sy - 18, 2, 6); g.fillStyle = Math.sin(t / 5 + i * 2) > 0 ? '#ffe070' : '#ff9a30'; g.fillRect(sx - 8 + i * 15, sy - 20, 2, 2); } c.light = c.light || '#ffd070'; return true;
    case 'rack': g.fillStyle = '#5a3a22'; g.fillRect(sx - 9, sy - 18, 2, 18); g.fillRect(sx + 7, sy - 18, 2, 18); g.fillRect(sx - 9, sy - 16, 18, 2); g.fillRect(sx - 9, sy - 4, 18, 2);
      ['weapon_regular_sword', 'weapon_axe', 'weapon_spear'].forEach((k, i) => { const f = frames(k)[0]; if (f) g.drawImage(f.c, sx - 7 + i * 5, sy - 19, Math.min(6, f.w), Math.min(18, f.h)); }); return true;
    case 'chest': { const f = frames('chest_full_open_anim')[0]; if (f) g.drawImage(f.c, sx - 8, sy - 14, 16, 16); return true; }
    case 'well': cyl(g, sx, sy - 1, 9, 8, '#4a5a7a', '#7a7480'); g.fillStyle = '#2a3a5a'; g.beginPath(); g.ellipse(sx, sy - 9, 6, 3, 0, 0, 7); g.fill(); g.fillStyle = '#5a3a22'; g.fillRect(sx - 9, sy - 26, 2, 18); g.fillRect(sx + 7, sy - 26, 2, 18);
      g.fillStyle = '#9a3a2a'; g.beginPath(); g.moveTo(sx - 12, sy - 24); g.lineTo(sx, sy - 32); g.lineTo(sx + 12, sy - 24); g.fill(); g.fillStyle = '#7a7480'; g.fillRect(sx - 1, sy - 24, 1, 8); return true;
    case 'bush': [[-5, -5, 6, '#2f6a32'], [4, -6, 6, '#3a7e3c'], [0, -9, 6, '#4c9a46'], [-2, -11, 3, '#6cba5a']].forEach(([x, y, r, col]) => { g.fillStyle = col; g.beginPath(); g.arc(sx + x, sy + y, r, 0, 7); g.fill(); }); if (hash(c.x, c.y, 2) < .5) { g.fillStyle = '#d83a4a'; g.fillRect(sx - 3, sy - 9, 2, 2); g.fillRect(sx + 4, sy - 7, 2, 2); } return true;
    case 'log': g.fillStyle = '#5a3a22'; g.save(); g.translate(sx, sy - 3); g.rotate(-.45); g.fillRect(-11, -3, 22, 6); g.fillStyle = '#c8a070'; g.beginPath(); g.ellipse(11, 0, 2, 3, 0, 0, 7); g.fill(); g.fillStyle = '#7a5230'; g.fillRect(-11, -3, 22, 1); g.restore(); g.fillStyle = '#3a8a3a'; g.fillRect(sx - 4, sy - 7, 3, 1); return true;
    case 'stump': cyl(g, sx, sy, 6, 6, '#c8a070', '#5a3a22'); g.strokeStyle = '#8a6a40'; g.lineWidth = .7; g.beginPath(); g.ellipse(sx, sy - 6, 3, 1.5, 0, 0, 7); g.stroke(); return true;
    case 'hay': cyl(g, sx, sy, 8, 7, '#e8c860', '#c8a040'); g.fillStyle = '#a8802a'; g.fillRect(sx - 8, sy - 4, 16, 1); return true;
    case 'candelabra': g.fillStyle = '#c8a040'; g.fillRect(sx - 1, sy - 22, 2, 22); g.fillRect(sx - 4, sy - 1, 8, 2); g.fillRect(sx - 7, sy - 22, 14, 2); for (let i = -1; i <= 1; i++) { g.fillStyle = '#efe6cc'; g.fillRect(sx + i * 6 - 1, sy - 27, 2, 5); g.fillStyle = Math.sin(t / 4 + i) > 0 ? '#ffe070' : '#ff9a30'; g.fillRect(sx + i * 6 - 1, sy - 30, 2, 3); } c.light = c.light || '#ffc060'; return true;
    case 'clock': box(g, sx, sy, 6, 30, '#6a4020', '#5a361c', '#4a2c14'); faceXform(g, 'l', sx + 5, sy - 30 + 3, 0, () => { g.fillStyle = '#f0e6c8'; g.beginPath(); g.arc(3, 4, 3, 0, 7); g.fill(); g.strokeStyle = '#222'; g.lineWidth = .6; g.beginPath(); g.moveTo(3, 4); g.lineTo(3 + Math.cos(t / 30) * 2.5, 4 + Math.sin(t / 30) * 2.5); g.stroke(); g.fillStyle = '#c8a040'; g.fillRect(2.5, 12 + Math.sin(t / 12) * 2, 1, 6); }); return true;
    case 'cauldron': cyl(g, sx, sy, 7, 7, '#3a3a40', '#2a2a30'); g.fillStyle = '#60e070'; g.beginPath(); g.ellipse(sx, sy - 7, 5, 2.5, 0, 0, 7); g.fill(); if (t % 6 === 0) emit(sx, sy - 9, 1, { c: '#90ff90', vy: -.5, sp: .3, life: 28, s: 2 }); c.light = c.light || '#60ff80'; return true;
    case 'pipes': g.fillStyle = '#6a7480'; g.fillRect(sx - 8, sy - 26, 4, 26); g.fillRect(sx + 3, sy - 18, 4, 18); g.fillRect(sx - 8, sy - 26, 15, 4); g.fillStyle = '#9aa6b4'; g.fillRect(sx - 8, sy - 26, 1, 26); g.fillStyle = '#c04030'; g.beginPath(); g.arc(sx + 5, sy - 10, 2.5, 0, 7); g.fill(); if (t % 25 === 0) emit(sx + 5, sy - 22, 3, { c: '#e0e8f0', vy: -.5, sp: .5, life: 30, s: 2, glow: 0 }); return true;
    case 'bonepile': g.fillStyle = '#ddd6c0'; for (let i = 0; i < 7; i++) { const a = hash(c.x, c.y, i) * 6; g.save(); g.translate(sx + Math.cos(a) * 5, sy - 2 + Math.sin(a) * 2 - i * .6); g.rotate(a); g.fillRect(-4, 0, 8, 1); g.fillRect(-5, -1, 1, 3); g.fillRect(4, -1, 1, 3); g.restore(); } const f = frames('skull')[0]; g.drawImage(f.c, sx - 4, sy - 12, 9, 9); return true;
  }
  return false;
}

// ---------- disposição planejada dos cenários ----------
function layoutMap(T, g, all, M, P, R) {
  const tl = (x, y) => g[y] && g[y][x]; const free = c => c && !c.out && c.t && TT[c.t].walk && !TT[c.t].liquid && !c.obj && Math.abs(c.x - c.y) > 1;
  const put = (x, y, o, L) => { const c = tl(x, y); if (free(c)) { c.obj = o; if (L) c.light = L; return true; } return false; };
  const deco = (x, y, d) => { const c = tl(x, y); if (c && !c.out && c.t && TT[c.t].walk && !TT[c.t].liquid && !c.obj && !c.deco) c.deco = d; };
  const lo = M, hi = M + P - 1, ri = n => Math.floor(R() * n);
  const rows = (o, every, off, L) => { for (let k = lo + 1; k <= hi - 1; k += every) { put(k + off, k, o, L); put(k, k + off, o, L); } };
  const rug = (x0, y0, w, h, col) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const c = tl(x, y); if (c && !c.out && c.t && !TT[c.t].liquid && !c.obj) { c.deco = 'rug'; c.rugc = col; } } };
  const near = (o, n, d) => { for (let i = 0; i < n * 4 && n > 0; i++) { const x = lo + ri(P), y = lo + ri(P); if (put(x, y, o)) n--; } };
  switch (T.layout) {
    case 'castle': rows('pillar', 3, 3); put(lo, lo, 'throne'); [[lo + 2, lo], [lo, lo + 2]].forEach(([x, y]) => put(x, y, 'brazier', '#ff9040')); [[lo + 1, lo], [lo, lo + 1]].forEach(([x, y]) => { const c = tl(x, y); if (c) c.h += 0; });
      put(hi - 2, lo + 1, 'table'); put(hi - 1, lo + 1, 'chair'); put(lo + 1, hi - 2, 'table'); put(lo + 1, hi - 1, 'chair'); near('statue', 2); near('chest', 1); near('candelabra', 2); break;
    case 'manor': rug(lo + 2, lo + 6, 3, 2, '#7a2a4a'); rug(lo + 8, lo + 2, 2, 3, '#2a4a7a'); rug(lo + 7, lo + 9, 3, 3, '#6a4a2a');
      put(lo + 3, lo + 9, 'table'); put(lo + 2, lo + 9, 'chair'); put(lo + 4, lo + 9, 'chair'); put(lo + 9, lo + 4, 'table'); put(lo + 9, lo + 3, 'chair');
      near('candelabra', 3); near('clock', 1); near('urn', 2); near('chest', 1); break;
    case 'crypt': for (let x = lo + 2; x <= hi - 1; x += 3) for (let y = lo + 6; y <= hi - 1; y += 4) put(x, y, 'sarcophagus'); for (let y = lo + 2; y <= lo + 5; y += 3) put(hi - 1, y, 'sarcophagus');
      near('urn', 3); near('bonepile', 2); for (let i = 0; i < 10; i++) deco(lo + ri(P), lo + ri(P), ['candles', 'bones', 'skull', 'blood'][i % 4]); break;
    case 'dungeon': near('rack', 2); near('barrel', 3); near('crate', 3); near('table', 1); near('bonepile', 2); near('chest', 1); for (let i = 0; i < 10; i++) deco(lo + ri(P), lo + ri(P), ['puddle', 'bones', 'blood', 'pebbles'][i % 4]); break;
    case 'temple': rows('statue', 4, 3); put(lo, lo, 'altar'); rows('brazier', 4, -3, '#60ff80'); near('urn', 3); for (let i = 0; i < 6; i++) deco(lo + ri(P), lo + ri(P), 'candles'); break;
    case 'clockcity': near('pipes', 4); near('crate', 2); near('rack', 1); break;
    case 'underdark': for (let i = 0; i < 8; i++) deco(lo + ri(P), lo + ri(P), ['puddle', 'pebbles'][i % 2]); break;
    case 'tavern': near('table', 4); near('chair', 6); near('barrel', 3); break;
  }
}
const LAYOUT_OF = { castle: 'castle', manor: 'manor', crypt: 'crypt', dungeon: 'dungeon', temple: 'temple', clockcity: 'clockcity', underdark: 'underdark' };
const WALLS_OF = {
  castle: { t: 'stone', h: 6, deco: ['window', 'torch', 'banner', 'plain', 'window', 'banner', 'torch'], banner: '#a02020' },
  manor: { t: 'wood', h: 6, deco: ['shelf', 'window', 'painting', 'torch', 'fireplace', 'plain', 'painting'] },
  crypt: { t: 'stone', h: 5, deco: ['torch', 'web', 'niche', 'plain', 'niche', 'mossw'] },
  dungeon: { t: 'stone', h: 5, deco: ['torch', 'chain', 'barred', 'web', 'plain', 'mossw'] },
  temple: { t: 'marble', h: 6, deco: ['torch', 'relief', 'plain', 'relief', 'banner'], banner: '#2a6a3a' },
  clockcity: { t: 'metal', h: 5, deco: ['pipe', 'gearw', 'plain', 'window', 'gearw'] },
  underdark: { t: 'rock', h: 5, deco: ['crystalw', 'plain', 'mossw', 'plain', 'crystalw'] },
};
// decoração extra nos cenários abertos (não bloqueia o caminho)
const EXTRA_DECO = { village: [['tuft', .1], ['pebbles', .04]], forest: [['fern', .12], ['leaves', .05], ['tuft', .08]], fogvillage: [['leaves', .08], ['tuft', .05]], gothic: [['leaves', .1]], jungle: [['fern', .16]], carnival: [['tuft', .08]], coast: [['pebbles', .06]], market: [['pebbles', .05]], snow: [['pebbles', .03]] };
const EXTRA_OBJ = { village: [['bush', 4], ['well', 1], ['hay', 2]], forest: [['bush', 5], ['log', 2], ['stump', 2]], fogvillage: [['bush', 2], ['stump', 2]], jungle: [['bush', 5]], carnival: [['hay', 3]], gothic: [['stump', 2]], market: [['hay', 1]] };
const EXTRA_RING = { village: [['bush', .05]], forest: [['bush', .06], ['stump', .02], ['log', .015]], jungle: [['bush', .08]], fogvillage: [['stump', .03]] };
for (const k in WALLS_OF) { THEMES[k].walls = WALLS_OF[k]; THEMES[k].layout = LAYOUT_OF[k]; }
for (const k of ['castle', 'manor', 'temple', 'crypt', 'dungeon']) { const T = THEMES[k]; T.objs = (T.objs || []).filter(([o]) => !['banner', 'statue'].includes(o)).map(([o, n]) => [o, Math.ceil(n / 2)]); delete T.grid; T.ring = []; }
THEMES.manor.objs = [['barrel', 2]]; THEMES.market.base = ['cobble']; THEMES.underdark.base = ['rock']; THEMES.castle.base = ['stone'];
for (const k in EXTRA_DECO) THEMES[k].deco = (THEMES[k].deco || []).concat(EXTRA_DECO[k]);
for (const k in EXTRA_OBJ) THEMES[k].objs = (THEMES[k].objs || []).concat(EXTRA_OBJ[k]);
for (const k in EXTRA_RING) THEMES[k].ring = (THEMES[k].ring || []).concat(EXTRA_RING[k]);
OBJ_LIGHT.table = '#ffb050'; OBJ_LIGHT.altar = '#ffd070'; OBJ_LIGHT.candelabra = '#ffc060'; OBJ_LIGHT.cauldron = '#60ff80';
// paredes: aplicadas depois de o terreno ser gerado
function applyWalls(T, g, all, M, P) {
  if (!T.walls || T.shape) return; const W = T.walls; let maxH = 0; all.forEach(c => { if (!c.out && c.t) maxH = Math.max(maxH, c.h); });
  all.forEach(c => { if (!c.out) return; const ring = c.x >= M - 1 && c.x <= M + P && c.y >= M - 1 && c.y <= M + P;
    if (ring) { const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => g[c.y + dy] && g[c.y + dy][c.x + dx]).filter(n => n && !n.out); c.hf = nb.length ? Math.max(...nb.map(n => n.h)) : 0;
      c.wall = 1; c.t = W.t; c.h = maxH + W.h; c.obj = null; c.deco = null; c.light = null;
      if (W.deco.includes('torch') && W.deco[Math.floor(hash(c.x, c.y, 5) * W.deco.length)] === 'torch') c.light = '#ff9a40';
      if (W.deco.includes('fireplace') && W.deco[Math.floor(hash(c.x, c.y, 5) * W.deco.length)] === 'fireplace') c.light = '#ff8030';
      if (W.deco.includes('crystalw') && W.deco[Math.floor(hash(c.x, c.y, 5) * W.deco.length)] === 'crystalw') c.light = '#40d0ff'; }
    else { c.t = null; c.obj = null; c.light = null; } });
}
