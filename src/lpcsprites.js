// ================= SPRITES 16-BIT (LPC) — composição em tempo real =================
const LPCC = new Map(); const LPC_FI = {};
LPC_META.frames.forEach(([n, d], i) => { LPC_FI[n] = LPC_FI[n] || {}; (LPC_FI[n][d] = LPC_FI[n][d] || []).push(i); });
const isRec = x => typeof x === 'string' && (x.includes('|') || /^m_/.test(x));
function memberRecipe(m) { const g = m.gender || 'm'; return [`r_${m.race}_${g}_back`, `c_${m.cls}_${g}_back`, `r_${m.race}_${g}_body`, `c_${m.cls}_${g}_mid`, `r_${m.race}_${g}_up`, `c_${m.cls}_${g}_top`].filter(k => LPC[k]).join('|'); }
const SPK_REC = { eldrin: 'm_eldrin', malakar: 'm_malakar', vorgath: 'm_vorgath', ignaroth: 'm_ignaroth', goblin: 'm_goblin', orc: 'm_orcm' };
function speakerRec(k) { const m = G.party.find(p => p.key === k); if (m) return memberRecipe(m); if (COMPANIONS[k]) return memberRecipe(COMPANIONS[k]); return (SPEAKERS[k] && SPEAKERS[k].rec) || SPK_REC[k] || null; }
function loadImg(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); }
function lpcComp(rec) {
  let e = LPCC.get(rec); if (e) { e.t = performance.now(); return e.ready ? e.c : null; }
  e = { ready: false, t: performance.now() }; LPCC.set(rec, e);
  e.p = (async () => { const imgs = await Promise.all(rec.split('|').filter(k => k[0] !== '#').map(k => LPC[k] ? loadImg(LPC[k]) : null));
    const c = mk(LPC_META.cols * 64, Math.ceil(LPC_META.frames.length / LPC_META.cols) * 64); const g = c.getContext('2d'); imgs.forEach(i => i && g.drawImage(i, 0, 0));
    if (rec.includes('#dark')) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(25,0,50,.72)'; g.fillRect(0, 0, c.width, c.height); g.globalCompositeOperation = 'source-over'; }
    e.c = c; e.ready = true; lpcTrim(); return c; })();
  return null;
}
function lpcTrim() { if (LPCC.size <= 40) return; const arr = [...LPCC.entries()].filter(([, e]) => e.ready).sort((a, b) => a[1].t - b[1].t); while (LPCC.size > 40 && arr.length) LPCC.delete(arr.shift()[0]); }
function prepSprites(recs) { recs = [...new Set(recs.filter(Boolean))]; recs.forEach(r => lpcComp(r)); return Promise.all(recs.map(r => LPCC.get(r) && LPCC.get(r).p)); }
function lpcFrame(rec, anim, dir, k) {
  const c = lpcComp(rec); if (!c) return null; const A = LPC_FI[anim] || LPC_FI.walk; const fi = A[dir] || A[2] || LPC_FI.walk[dir];
  const i = fi[Math.max(0, Math.min(k, fi.length - 1))]; return { c, sx: (i % LPC_META.cols) * 64, sy: Math.floor(i / LPC_META.cols) * 64 };
}
const LPC_PORT = {};
function lpcPortrait(rec, size) {
  const key = rec + '#' + size; if (LPC_PORT[key]) return LPC_PORT[key];
  const f = lpcFrame(rec, 'walk', 2, 0); if (!f) return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  const c = mk(size, size); const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(f.c, f.sx + 14, f.sy + 6, 36, 36, 0, 0, size, size);
  return (LPC_PORT[key] = c.toDataURL());
}
function lpcDir(u) { const [rx, ry] = rotV(u.fx, u.fy); if (rx > 0) return 3; if (ry > 0) return 1; return 0; } // ↘ perfil direito, ↙ perfil esquerdo, ↖↗ costas
const ANIM_LEN = { slash: 6, cast: 7, shoot: 8, hurt: 6 };
function animState(u) {
  const d = lpcDir(u);
  if (u.ko) return ['hurt', 2, 5];
  if (u.anim) { const k = Math.floor((V.t - u.af) / u.aspd); if (k < ANIM_LEN[u.anim]) return [u.anim, u.anim === 'hurt' ? 2 : d, k]; u.anim = null; }
  if (u.moving) return ['walk', d, 1 + Math.floor(V.t / 4) % 8];
  return ['walk', d, 0];
}
function playAnim(u, name, spd = 4) { if (!u || !u.rec) return Promise.resolve(); u.anim = name; u.af = V.t; u.aspd = spd; const n = ANIM_LEN[name] * spd; return (async () => { for (let i = 0; i < n; i++) await nextFrame(); })(); }
function drawLPCUnit(g, u, sx, sy) {
  const [an, d, k] = animState(u); const f = lpcFrame(u.rec, an, d, k); const t = V.t;
  g.globalAlpha = u.alpha * .45; g.fillStyle = '#000'; g.beginPath(); g.ellipse(sx, sy + 1, u.boss ? 12 : 9, u.boss ? 4 : 3, 0, 0, 7); g.fill(); g.globalAlpha = u.alpha;
  if (u.team !== 'N' && B && B.on) { g.fillStyle = u.team === 'A' ? 'rgba(80,170,255,.6)' : 'rgba(255,80,80,.6)'; g.beginPath(); g.ellipse(sx, sy + 1, 10, 4, 0, 0, 7); g.lineWidth = 1; g.strokeStyle = g.fillStyle; g.stroke(); }
  if (u.aura) { const r = 22 + Math.sin(t / 10) * 3; const gr = g.createRadialGradient(sx, sy - 24, 2, sx, sy - 24, r); gr.addColorStop(0, u.aura + '88'); gr.addColorStop(1, u.aura + '00'); g.fillStyle = gr; g.fillRect(sx - r, sy - 24 - r, r * 2, r * 2); }
  u._sx = sx; u._sy = sy - (u.hop || 0); u._h = 50;
  if (!f) { g.globalAlpha = 1; return; }
  const bob = (!u.moving && !u.anim && !u.ko && Math.floor((t + u.seed * 7) / 32) % 2) ? 1 : 0; const K = u.scale || 1;
  if (u.ghost) g.globalAlpha = u.alpha * (.55 + Math.sin(t / 15) * .1);
  const gh = u.ghost ? Math.sin(t / 20 + u.seed) * 2 - 3 : 0;
  const x = Math.round(sx - 32 * K), y = Math.round(sy - 61 * K - (u.hop || 0) + bob + (u.ko ? 6 : 0) + gh);
  if (K !== 1) u._h = 50 * K;
  g.drawImage(f.c, f.sx, f.sy, 64, 64, x, y, 64 * K, 64 * K);
  if (u.flash > 0) { if (Math.floor(u.flash / 2) % 2 === 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = u.alpha * .8; g.drawImage(f.c, f.sx, f.sy, 64, 64, x, y, 64 * K, 64 * K); g.drawImage(f.c, f.sx, f.sy, 64, 64, x, y, 64 * K, 64 * K); g.globalCompositeOperation = 'source-over'; } u.flash--; }
  g.globalAlpha = 1;
}
