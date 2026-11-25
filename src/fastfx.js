// ================= DESEMPENHO: efeitos em baixa resolução + cache de objetos parados =================
// Luz, brilho, névoa, desfoque e vinheta são suaves: calculá-los na resolução do pixel art (≈640×360)
// e só ampliar no fim custa uma fração do que custava em tela cheia (Full HD / 4K).
const fxA = mk(10, 10), fxa = fxA.getContext('2d'); // escuridão + tinta + vinheta
const fxB = mk(10, 10), fxb = fxB.getContext('2d'); // brilhos somados (luzes, raios, névoa, bloom)
function fxSize(c, w, h) { if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } }
function postFX() {
  if (V._lq !== V.q) { V._lq = V.q; document.body.classList.toggle('lowq', V.q === 0); }
  const A = (VIS[S.map.theme] || VIS.village).atmos; const W = cv.width, H = cv.height, t = V.t, w = V.bw, h = V.bh; const L = lightList();
  fxSize(fxA, w, h); fxSize(fxB, w, h);
  // camada A: escuridão com "furos" de luz, tinta da cena e vinheta
  fxa.globalCompositeOperation = 'source-over'; fxa.clearRect(0, 0, w, h); fxa.fillStyle = `rgba(4,2,16,${A.dark})`; fxa.fillRect(0, 0, w, h);
  fxa.globalCompositeOperation = 'destination-out';
  for (const [x, y, r] of L) { const fl = r * (0.95 + Math.sin(t / 5 + x) * .05); const gr = fxa.createRadialGradient(x, y, 0, x, y, fl); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); fxa.fillStyle = gr; fxa.fillRect(x - fl, y - fl, fl * 2, fl * 2); }
  fxa.globalCompositeOperation = 'source-over'; fxa.fillStyle = A.tint; fxa.fillRect(0, 0, w, h);
  if (!V._vig || V._vig.w !== w || V._vig.h !== h) { const vg = fxa.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); V._vig = { w, h, g: vg }; }
  fxa.fillStyle = V._vig.g; fxa.fillRect(0, 0, w, h);
  // camada B: brilhos coloridos, raios de luz, névoa e bloom (tudo somado)
  fxb.globalCompositeOperation = 'source-over'; fxb.clearRect(0, 0, w, h); fxb.globalCompositeOperation = 'lighter';
  for (const [x, y, r, col] of L) { if (!col) continue; const R = r * (r === 10 ? .5 : .9); const gr = fxb.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, col + (r === 10 ? '30' : '48')); gr.addColorStop(1, col + '00'); fxb.fillStyle = gr; fxb.fillRect(x - R, y - R, R * 2, R * 2); }
  if (V.q >= 1) {
    if (A.rays) for (let i = 0; i < 5; i++) { const x0 = w * (.15 + i * .2) + Math.sin(t / 300 + i) * w * .03, rw = w * (.04 + .03 * Math.sin(t / 170 + i * 2) ** 2), sk = w * .35;
      const gr = fxb.createLinearGradient(0, 0, 0, h * .9); const al = .05 + .03 * Math.sin(t / 90 + i * 1.7); gr.addColorStop(0, `rgba(${A.rays},${al})`); gr.addColorStop(1, `rgba(${A.rays},0)`);
      fxb.fillStyle = gr; fxb.beginPath(); fxb.moveTo(x0, 0); fxb.lineTo(x0 + rw, 0); fxb.lineTo(x0 + rw - sk, h * .9); fxb.lineTo(x0 - sk - rw, h * .9); fxb.fill(); }
    if (A.fog) for (let i = 0; i < 4; i++) { const x = ((t * (.15 + i * .05) / V.scale + i * w * .4) % (w * 1.6)) - w * .3, y = h * (.55 + i * .08), r = w * .35;
      const gr = fxb.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${A.fog},.07)`); gr.addColorStop(1, `rgba(${A.fog},0)`); fxb.fillStyle = gr; fxb.save(); fxb.translate(x, y); fxb.scale(1, .35); fxb.translate(-x, -y); fxb.fillRect(x - r, y - r, r * 2, r * 2); fxb.restore(); }
    if (FILTER_OK) { const bw = Math.ceil(w / 3), bh = Math.ceil(h / 3); fxSize(bloomC, bw, bh);
      bloomX.filter = 'brightness(.42) contrast(4.5) saturate(1.2) blur(1.5px)'; bloomX.clearRect(0, 0, bw, bh); bloomX.drawImage(buf, 0, 0, bw, bh); bloomX.filter = 'none';
      fxb.globalAlpha = V.q >= 2 ? .3 : .22; fxb.drawImage(bloomC, 0, 0, w, h); fxb.globalAlpha = 1; }
  }
  fxb.globalCompositeOperation = 'source-over';
  // qualidade média/baixa: luz aplicada direto no pixel art e uma única ampliação em tela cheia
  if (V.q <= 1) { bctx.drawImage(fxA, 0, 0); bctx.globalCompositeOperation = 'lighter'; bctx.drawImage(fxB, 0, 0); bctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = false; ctx.drawImage(buf, 0, 0, W, H); if (V.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${V.flash / 20})`; ctx.fillRect(0, 0, W, H); V.flash--; } return; }
  // qualidade alta: camadas suaves ampliadas por cima
  ctx.imageSmoothingEnabled = true; ctx.drawImage(fxA, 0, 0, W, H);
  if (V.q >= 2 && FILTER_OK) { // profundidade de campo (tilt-shift), já com a escuridão aplicada
    const dw = Math.ceil(w / 2), dh = Math.ceil(h / 2); fxSize(dofC, dw, dh);
    dofX.globalCompositeOperation = 'source-over'; dofX.filter = 'blur(1.2px)'; dofX.clearRect(0, 0, dw, dh); dofX.drawImage(buf, 0, 0, dw, dh); dofX.filter = 'none'; dofX.drawImage(fxA, 0, 0, dw, dh);
    dofX.globalCompositeOperation = 'destination-in'; const top = (V.topUI * V.uiZ * V.dpr / V.scale) / 2, bot = dh - (V.botUI * V.uiZ * V.dpr / V.scale) / 2;
    const gr = dofX.createLinearGradient(0, 0, 0, dh); const a = clamp(top / dh, 0, .4), b = clamp(bot / dh, .6, 1);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(a + .05, 'rgba(0,0,0,.6)'); gr.addColorStop(a + .22, 'rgba(0,0,0,0)'); gr.addColorStop(b - .2, 'rgba(0,0,0,0)'); gr.addColorStop(b, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    dofX.fillStyle = gr; dofX.fillRect(0, 0, dw, dh); ctx.drawImage(dofC, 0, 0, W, H);
  }
  ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(fxB, 0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  if (V.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${V.flash / 20})`; ctx.fillRect(0, 0, W, H); V.flash--; }
  ctx.imageSmoothingEnabled = false;
}
// lista de luzes fixas do mapa calculada uma vez (antes: o mapa inteiro era percorrido a cada quadro)
function lightList() {
  const th = S.map.theme; const L = []; const map = S.map;
  const lk = map.g.length + ':' + V.rot + ':' + Math.floor(V.t / 45); if (map._lightKey !== lk || map._lightDirty) { map._lightKey = lk; map._lightDirty = 0; map._lights = map.g.flat().filter(c => c.light && c.t && !(c.wall && !wallSide(c).face)); }
  for (const c of map._lights) { if (!c.light) continue; const [sx, sy0] = toScreen(c.x, c.y, c.h); const sy = c.wall ? sy0 + Math.max(4, c.h * 8 + 6 - 34) + 22 : sy0; if (sx > -60 && sx < V.bw + 60 && sy > -60 && sy < V.bh + 80) L.push([sx, sy - 14, c.obj ? 52 : 34, hex6(c.light)]); }
  S.units.forEach(u => { if (u.visible && u.alpha > 0 && !u.ko && u._sx != null) L.push([u._sx, u._sy - 10, th === 'crypt' ? 34 : 26, u.aura ? hex6(u.aura) : null]); });
  let n = 0; for (const p of P) { if (p.glow && p.s > 1.5 && n++ < 60) L.push([p.x, p.y, 10, hex6(p.c)]); }
  return L.filter(l => isFinite(l[0]) && isFinite(l[1]));
}
// objetos que não se mexem viram imagens prontas (desenhadas uma vez só)
const OBJ_CACHE = new Map();
const STATIC_OBJ = new Set(['tree', 'pine', 'deadtree', 'rock', 'house', 'crate', 'pillar', 'ruin', 'snowpine', 'statue', 'grave', 'barrel', 'tent', 'stall', 'palm', 'spike', 'bush', 'log', 'stump', 'hay', 'well', 'sarcophagus', 'urn', 'throne', 'bookshelf', 'rack', 'chest', 'bonepile', 'chair']);
function drawObjFast(g, c, sx, sy, k) {
  if (!STATIC_OBJ.has(c.obj)) return false;
  const vr = Math.floor(hash(c.x, c.y, 77) * 3); const key = c.obj + '|' + vr + '|' + k; let im = OBJ_CACHE.get(key);
  if (!im) { im = mk(112, 128); const cg = im.getContext('2d'); cg.imageSmoothingEnabled = false; cg.translate(56, 112); if (k !== 1) cg.scale(k, k);
    const fake = { obj: c.obj, x: vr * 7 + 1, y: vr * 3 + 2, deco: null, light: null }; drawObj(cg, fake, 0, 0); OBJ_CACHE.set(key, im); }
  g.drawImage(im, Math.round(sx) - 56, Math.round(sy) - 112); return true;
}
