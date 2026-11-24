// ================= CONTROLE / TECLADO / CONTROLE REMOTO DA TV =================
const INP = { pad: false, focus: null, fkey: null, prev: {}, held: {}, cursor: null };
function setPadMode(on) { if (INP.pad === on) return; INP.pad = on; document.body.classList.toggle('padmode', on); if (!on) { document.querySelectorAll('.gfocus').forEach(e => e.classList.remove('gfocus')); if (HL) HL.cur = null; } }
const vis = e => e && e.isConnected && e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden';
function curLayer() {
  if ($('#dice').classList.contains('show')) return null;
  const d = $('#dlg'); if (d.classList.contains('show')) return { type: d.classList.contains('choice') ? 'list' : 'dialog', el: d };
  const sc = $('#screen'); if (sc.classList.contains('show')) return { type: 'list', el: sc };
  if (PICK && S) return { type: 'map', el: $('#actions') };
  if (!$('#panel').classList.contains('hidden') && $('#actions').querySelector('button')) return { type: 'list', el: $('#actions') };
  return null;
}
const focusables = el => [...el.querySelectorAll('button:not(:disabled), .pick, .stat, .node:not(.locked), input')].filter(vis);
const fkey = e => (e.className.split(' ')[0] || e.tagName) + '|' + (e.textContent || e.value || '').trim().slice(0, 24);
function setFocus(e) { document.querySelectorAll('.gfocus').forEach(x => x !== e && x.classList.remove('gfocus')); INP.focus = e; if (!e) return; INP.fkey = fkey(e); if (INP.pad) { e.classList.add('gfocus'); e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } }
function ensureFocus(L) {
  if (!L || L.type === 'map' || L.type === 'dialog') { setFocus(null); return; }
  const f = INP.focus; if (f && L.el.contains(f) && vis(f) && !f.disabled) { if (INP.pad && !f.classList.contains('gfocus')) f.classList.add('gfocus'); return; }
  const list = focusables(L.el); if (!list.length) return;
  const same = INP.fkey && list.find(e => fkey(e) === INP.fkey);
  setFocus(same || list.find(e => e.classList.contains('pick') && e.classList.contains('on')) || list.find(e => e.classList.contains('ok') && e.tagName === 'BUTTON') || list.find(e => e.tagName !== 'INPUT') || list[0]);
}
function moveFocus(L, dir) {
  const list = focusables(L.el); const f = INP.focus; if (!f) { ensureFocus(L); return; }
  const r = f.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let best = null, bs = 1e9;
  for (const e of list) { if (e === f) continue; const q = e.getBoundingClientRect(), x = q.left + q.width / 2 - cx, y = q.top + q.height / 2 - cy;
    let main, side; if (dir === 'up') { main = -y; side = x; } else if (dir === 'down') { main = y; side = x; } else if (dir === 'left') { main = -x; side = y; } else { main = x; side = y; }
    if (main <= 4) continue; const sc = main + Math.abs(side) * 2.2; if (sc < bs) { bs = sc; best = e; } }
  if (best) { setFocus(best); sfx('blip'); }
}
function activate(e) { if (!e) return; if (e.tagName === 'INPUT') { e.focus(); return; } e.click(); }
function clickBack(el) { const b = [...el.querySelectorAll('button:not(:disabled)')].filter(vis).find(b => /Cancelar|Voltar|Fechar|← /.test(b.textContent)); if (b) { b.click(); return true; } return false; }
// cursor no mapa
function cursorStart() { const a = (HL && HL.sel) || (B && B.active) || { x: 0, y: 0 }; INP.cursor = { x: a.x, y: a.y }; if (HL) HL.cur = INP.cursor; }
function cursorMove(dir) {
  if (!INP.cursor) cursorStart();
  let [a, b] = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] }[dir]; // direções na tela (diagonais isométricas)
  const inv = [[a, b], [b, -a], [-a, -b], [-b, a]][V.rot]; let { x, y } = INP.cursor;
  for (let k = 0; k < 3; k++) { x += inv[0]; y += inv[1]; const c = tile(S.map, x, y); if (!c) return; if (c.t) { INP.cursor = { x, y }; break; } }
  HL.cur = INP.cursor; V.focus = { px: x, py: y, ph: tH(x, y), visible: true }; V.manual = false; sfx('blip');
  if (S.units.some(u => u.visible && !u.dead && u.x === x && u.y === y && u.team !== 'N')) inspectAt(INP.cursor); else $('#inspect').classList.add('hidden');
}
function nav(act, src) {
  auInit(); setPadMode(true); if (src && src.startsWith('pad')) INP.lastPad = +src.slice(3); else INP.lastPad = null;
  { const p = padOwnerOfTurn(); const L0 = curLayer(); if (p != null && src && src.startsWith('pad') && src !== 'pad' + p && L0 && (L0.type === 'map' || L0.el === $('#actions'))) { toast(`Vez do 🎮${p + 1}`); return; } }
  if (act === 'rotL' || act === 'rotR') { V.rot = (V.rot + (act === 'rotR' ? 1 : 3)) % 4; sfx('blip'); return; }
  if (act === 'zoom') { $('#zoom').click(); return; }
  if (act === 'speed') { $('#spd').click(); return; }
  if (act === 'full') { toggleFull(); return; }
  const L = curLayer(); if (!L) return;
  if (L.type === 'dialog') { if ((act === 'ok' || act === 'back') && L.el.onclick) L.el.onclick(); return; }
  if (L.type === 'map') {
    if (!HL) return; if (!HL.cur) cursorStart();
    if (['up', 'down', 'left', 'right'].includes(act)) return cursorMove(act);
    if (act === 'ok') { const c = INP.cursor; if (HL.sel && HL.sel.x === c.x && HL.sel.y === c.y) { const ok = [...$('#actions').querySelectorAll('.btn.ok')].find(b => !b.disabled); if (ok) { ok.click(); return; } } PICK({ x: c.x, y: c.y }); return; }
    if (act === 'back') { clickBack(L.el); return; }
    return;
  }
  const had = INP.focus && INP.focus.classList.contains('gfocus') && L.el.contains(INP.focus); ensureFocus(L); if (!had && act !== 'back') return;
  if (['up', 'down', 'left', 'right'].includes(act)) return moveFocus(L, act);
  if (act === 'ok') return activate(INP.focus);
  if (act === 'back') { if (!clickBack(L.el)) sfx('cancel'); }
}
function toggleFull() { try { if (!document.fullscreenElement) { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => toast('Tela cheia bloqueada aqui — use a tela cheia do navegador (F11)')); } else document.exitFullscreen(); } catch (e) { toast('Tela cheia indisponível neste navegador'); } }
// teclado e controle remoto
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'ok', ' ': 'ok', NumpadEnter: 'ok', Escape: 'back', Backspace: 'back', GoBack: 'back', BrowserBack: 'back', q: 'rotL', Q: 'rotL', e: 'rotR', E: 'rotR', z: 'zoom', Z: 'zoom', f: 'speed', F: 'speed', w: 'up', a: 'left', s: 'down', d: 'right' };
addEventListener('keydown', ev => {
  let act = KEYMAP[ev.key]; if (ev.keyCode === 461 || ev.keyCode === 10009) act = 'back';
  if (ev.target && ev.target.tagName === 'INPUT') { if (ev.key === 'Enter' || ev.key === 'Escape' || ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.target.blur(); if (ev.key === 'Enter' || ev.key === 'Escape') act = null; } else return; }
  if (!act) return; ev.preventDefault(); if (ev.repeat && !['up', 'down', 'left', 'right'].includes(act)) return; nav(act, 'kb');
});
addEventListener('pointerdown', () => { setPadMode(false); INP.lastPad = null; }, true);
// gamepad (mapeamento padrão: A=0 B=1 X=2 Y=3 LB=4 RB=5 Select=8 Start=9 D-pad=12..15)
const PADB = { 0: 'ok', 1: 'back', 2: 'speed', 3: 'zoom', 4: 'rotL', 5: 'rotR', 8: 'full', 9: 'ok', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
addEventListener('gamepadconnected', e => { toast('🎮 Controle conectado: ' + (e.gamepad.id || '').split('(')[0].slice(0, 30)); setPadMode(true); });
function pollPads() {
  let pads; try { pads = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { return; }
  const now = performance.now();
  for (const gp of pads) { if (!gp) continue;
    const st = {}; for (const k in PADB) st[k] = gp.buttons[k] && gp.buttons[k].pressed;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0; if (ay < -.6) st.su = 1; if (ay > .6) st.sd = 1; if (ax < -.6) st.sl = 1; if (ax > .6) st.sr = 1;
    const map = { ...PADB, su: 'up', sd: 'down', sl: 'left', sr: 'right' };
    for (const k in map) { const key = gp.index + ':' + k; if (st[k]) { const h = INP.held[key]; if (!h) { INP.held[key] = now + 380; nav(map[k], 'pad' + gp.index); } else if (['up', 'down', 'left', 'right'].includes(map[k]) && now > h) { INP.held[key] = now + 130; nav(map[k], 'pad' + gp.index); } } else delete INP.held[key]; }
    const rx = gp.axes[2] || 0, ry = gp.axes[3] || 0; if (Math.abs(rx) > .25 || Math.abs(ry) > .25) { V.manual = true; V.panX = clamp(V.panX - rx * 4, -260, 260); V.panY = clamp(V.panY - ry * 4, -200, 200); }
  }
  if (INP.pad) { const L = curLayer(); if (L && L.type === 'list') ensureFocus(L); if (L && L.type === 'map' && HL && !HL.cur) cursorStart(); }
}
