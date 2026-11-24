// ================= INTERFACE =================
const G = { party: [], gold: 0, items: { pocao: 2, eter: 1, fenix: 0 }, chapter: 0, done: [], seen: {} };
const hero = () => G.party[0];
const fmt = s => s.replace(/\{N\}/g, hero() ? hero().name : 'Herói');
function h(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function btn(label, onClick, cls = '') { const b = h('button', 'btn ' + cls, label); b.onclick = e => { e.stopPropagation(); auInit(); sfx('select'); onClick(); }; return b; }
let PICK = null; // manipulador de toque no mapa

// ---------- Painel de ações ----------
function setActions(title, nodes) { const a = $('#actions'); $('#panel').classList.toggle('list', nodes.length > 4); a.innerHTML = ''; if (title) a.appendChild(h('div', 'atitle', title)); const grid = h('div', 'agrid'); nodes.forEach(n => grid.appendChild(n)); a.appendChild(grid); $('#panel').classList.remove('hidden'); }
function choose(opts, title) {
  return new Promise(res => {
    const nodes = opts.map(o => { const b = btn(o.label + (o.desc ? `<small>${o.desc}</small>` : ''), () => res(o.id), (o.cls || '') + (o.desc ? ' wide' : '')); if (o.disabled) b.disabled = true; return b; });
    setActions(title, nodes);
  });
}
function confirmUI(text) { return new Promise(res => setActions(text, [btn('✔ Confirmar', () => res(true), 'ok'), btn('✖ Cancelar', () => res(false), 'ghost')])); }
function pickTileUI(tiles, hint) {
  return new Promise(res => {
    HL = { tiles }; const done = v => { PICK = null; HL = null; $('#actions').innerHTML = ''; res(v); };
    setActions(hint, [btn('✖ Cancelar', () => done(null), 'ghost')]);
    PICK = p => { if (p && tiles.has(keyOf(p.x, p.y))) { sfx('select'); done(p); } else inspectAt(p); };
  });
}
function pickTargetUI(u, ab, tiles) {
  return new Promise(res => {
    HL = { tiles }; let sel = null;
    const done = v => { PICK = null; HL = null; $('#actions').innerHTML = ''; res(v); };
    const showPrev = () => {
      const pv = previewText(u, ab, sel.x, sel.y); const nodes = [h('div', 'prev', pv.html)];
      const okb = btn('✔ Confirmar', () => done(sel), 'ok'); if (!pv.ok) okb.disabled = true; nodes.push(okb, btn('✖ Cancelar', () => done(null), 'ghost'));
      setActions(ab.nome, nodes);
    };
    const choose = p => { sel = p; HL.sel = p; HL.area = ab.area ? new Set(areaTiles(ab.range === 0 ? u.x : p.x, ab.range === 0 ? u.y : p.y, ab.area).map(c => keyOf(c.x, c.y))) : null; showPrev(); };
    if (ab.range === 0) { choose({ x: u.x, y: u.y }); return; }
    setActions(ab.nome + ' — toque no alvo', [h('div', 'prev', ab.desc), btn('✖ Cancelar', () => done(null), 'ghost')]);
    PICK = p => { if (p && tiles.has(keyOf(p.x, p.y))) { sfx('blip'); choose(p); } else inspectAt(p); };
  });
}
async function itemMenu(u, X) {
  const opts = SHOP.filter(s => G.items[s.id] > 0).map(s => ({ id: s.id, label: `${s.nome} ×${G.items[s.id]}`, desc: s.desc })); opts.push({ id: 'back', label: '← Voltar', cls: 'ghost' });
  const id = await choose(opts, 'Itens (alcance: você ou aliado adjacente)'); if (id === 'back') return false;
  const tiles = new Map(); S.units.filter(o => o.team === 'A' && o.visible && dist(o, u) <= 1).forEach(o => { if (id === 'fenix' ? o.ko : !o.ko) tiles.set(keyOf(o.x, o.y), '#4fe08a'); });
  if (!tiles.size) { banner('Nenhum alvo válido', 'A'); return false; }
  const p = await pickTileUI(tiles, 'Toque no aliado'); if (!p) return false;
  return await X.item(id, p.x, p.y);
}
function bar(v, m, cls) { return `<div class="bar ${cls}"><i style="width:${Math.max(0, v) / m * 100}%"></i><span>${Math.max(0, v)}/${m}</span></div>`; }
function unitCardHTML(u) {
  const sub = u.team === 'A' ? `${RACES[u.race].nome} ${CLASSES[u.cls].nome} • Nv ${u.level}${u.insp ? ' • ✦+' + u.insp : ''}${u.acT ? ' • 🛡+2' : ''}` : (u.boss ? 'Chefe' : 'Monstro') + (u.undead ? ' • morto-vivo' : '');
  return `<img src="${portrait(u.spr, 48)}"><div class="cinfo"><b>${esc(u.name)}</b><small>${sub}</small>${bar(u.hp, u.maxhp, 'hp')}${u.maxmp ? bar(u.mp, u.maxmp, 'mp') : ''}<small>CA ${u.ac} • Mov ${u.move}${u.stopped ? ' • ⏸ congelado' : ''}${u.ko ? ' • caído' : ''}</small></div>`;
}
function showUnitCard(u) { const c = $('#card'); c.innerHTML = unitCardHTML(u); c.className = 'card win ' + (u.team === 'A' ? 'ally' : 'foe'); }
let inspT = 0;
function inspectAt(p) { if (!p) return; const u = S.units.find(o => o.visible && !o.dead && o.x === p.x && o.y === p.y && o.team !== 'N'); const e = $('#inspect'); if (!u) { e.classList.add('hidden'); return; } e.innerHTML = unitCardHTML(u); e.className = 'card win ' + (u.team === 'A' ? 'ally' : 'foe'); clearTimeout(inspT); inspT = setTimeout(() => e.classList.add('hidden'), 3500); sfx('blip'); }
function banner(text, team) { const b = $('#banner'); b.textContent = text; b.className = 'show ' + (team === 'E' ? 'foe' : ''); clearTimeout(b._t); b._t = setTimeout(() => b.className = '', 1500); }
function bigBanner(text, cls = '') { return new Promise(res => { const b = $('#big'); b.textContent = text; b.className = 'show ' + cls; setTimeout(() => { b.className = ''; res(); }, 1700 * (window.FAST || 1)); }); }
function updateOrder() {
  const o = $('#order'); if (!B.on) { o.innerHTML = ''; return; } o.innerHTML = `<span class="rnd">R${B.round}</span>`;
  B.order.filter(u => isActor(u)).forEach(u => { const i = h('img', 'oi ' + (u.team === 'A' ? 'a' : 'e') + (u === B.active ? ' cur' : '')); i.src = portrait(u.spr, 32); i.title = u.name; o.appendChild(i); });
}
// ---------- Dados ----------
function diceRoll({ d20, bonus, vs, vsLabel, ok, crit, notes, who, save }) {
  return new Promise(async res => {
    const d = $('#dice'); d.className = 'win show'; sfx('dice');
    const draw = (n, fin) => { d.innerHTML = `<div class="who">${esc(who)}</div><div class="d20 ${fin ? (n === 20 ? 'nat20' : n === 1 ? 'nat1' : '') : 'spin'}"><svg viewBox="0 0 100 100"><polygon points="50,3 93,27 93,73 50,97 7,73 7,27" /><polygon class="in" points="50,18 80,66 20,66"/></svg><span>${n}</span></div>` + (fin ? `<div class="math">${n} ${bonus >= 0 ? '+' : '−'} ${Math.abs(bonus)} = <b>${n + bonus}</b> vs ${vsLabel} ${vs}</div><div class="res ${ok ? 'g' : 'r'}">${crit ? 'CRÍTICO!' : save ? (ok ? 'FALHOU NA RESISTÊNCIA' : 'RESISTIU!') : ok ? (vsLabel === 'CD' ? 'SUCESSO!' : 'ACERTO!') : (vsLabel === 'CD' ? 'FALHA' : 'ERROU')}</div>${notes && notes.length ? `<div class="notes">${notes.join(' • ')}</div>` : ''}` : ''); };
    for (let i = 0; i < 7; i++) { draw(1 + rnd(20)); await sleep(45); }
    draw(d20, true); sfx(ok ? (crit ? 'level' : 'success') : 'fail');
    await sleep(crit ? 1100 : 800); d.className = 'win'; res();
  });
}
// ---------- Diálogos ----------
function speakerInfo(k) {
  if (!k) return { name: '', img: null };
  if (k === 'tip') return { name: 'Dica', img: null };
  if (k === 'hero') return { name: hero().name, img: portrait(memberRecipe(hero()), 64) };
  const m = G.party.find(p => p.key === k); if (m) return { name: m.name, img: portrait(memberRecipe(m), 64) };
  const s = SPEAKERS[k]; return { name: s ? s.name : k, img: s ? portrait(speakerRec(k) || s.spr, 64) : null };
}
function bounceSpeaker(k) { const u = S && S.units.find(o => o.visible && (o.key === k || (k === 'hero' && o.member === hero()) || (o.def && SPEAKERS[k] && o.def.spr === SPEAKERS[k].spr))); if (!u) return; V.focus = u; V.manual = false; (async () => { for (let i = 0; i <= 10; i++) { u.hop = Math.sin(i / 10 * Math.PI) * 4; await nextFrame(); } u.hop = 0; })(); }
function say(k, text) {
  return new Promise(res => {
    text = fmt(text); const d = $('#dlg'); const sp = speakerInfo(k); d.className = 'win show' + (k ? '' : ' narr') + (k === 'tip' ? ' tip' : '');
    d.innerHTML = (sp.img ? `<img class="por" src="${sp.img}">` : '') + `<div class="dtxt">${sp.name ? `<b>${esc(sp.name)}</b>` : ''}<p></p></div><div class="next">▼</div>`;
    const sseq = ++NET.seq; netFx('say', { kk: k, name: sp.name, rec: k && k !== 'tip' ? (k === 'hero' ? memberRecipe(hero()) : speakerRec(k)) : null, text, s: sseq }); narrate(k, text);
    const p = d.querySelector('p'); let i = 0, full = false; bounceSpeaker(k);
    const tick = () => { if (full) return; i += 1; p.textContent = text.slice(0, i); if (i % 3 === 0 && k !== null) sfx('text'); if (i >= text.length) { full = true; d.classList.add('done'); } else setTimeout(tick, window.FAST ? 0 : 22); };
    tick();
    d.onclick = () => { auInit(); if (!full) { full = true; p.textContent = text; d.classList.add('done'); return; } d.onclick = null; NET.onAdv = null; d.className = 'win'; sfx('blip'); netFx('sayEnd', {}); res(); };
    NET.onAdv = () => { if (d.onclick) { full = true; p.textContent = text; d.classList.add('done'); d.onclick(); } };
    if (window.AUTO) setTimeout(() => d.onclick && (full = true, d.onclick()), 30);
  });
}
function choiceUI(prompt, options) {
  return new Promise(res => {
    const d = $('#dlg'); d.className = 'win show narr choice'; d.onclick = null;
    d.innerHTML = `<div class="dtxt"><b>${fmt(prompt)}</b><div class="chs"></div></div>`; const box = d.querySelector('.chs');
    let done = false; const fin = (o, by, pad) => { if (done) return; done = true; NET.onPick = null; d.className = 'win'; netFx('choiceEnd', {}); res(Object.assign({}, o, { _by: by, _pad: pad })); };
    options.forEach(o => { const m = o.stat ? mod(hero().st[o.stat]) : 0; box.appendChild(btn(`${o.t}${o.stat ? ` <small>${STAT_NOME[o.stat]} ${sgn(m)} • CD ${o.dc}</small>` : ''}`, () => fin(o, isHost() ? myId() : null, INP.lastPad), 'choice')); });
    netFx('choice', { prompt: fmt(prompt), opts: options.map(o => ({ t: o.t, stat: o.stat, dc: o.dc })) }); NET.onPick = (i, by) => { if (options[i]) fin(options[i], by, null); };
    if (window.AUTO) setTimeout(() => { d.className = 'win'; res(options[0]); }, 30);
  });
}
// ---------- Telas ----------
function screen(html, cls = '') { const s = $('#screen'); s.className = 'show ' + cls; s.innerHTML = ''; const inner = h('div', 'sc-inner'); if (typeof html === 'string') inner.innerHTML = html; else inner.appendChild(html); s.appendChild(inner); s.scrollTop = 0; return inner; }
function hideScreen() { $('#screen').className = ''; $('#screen').innerHTML = ''; }
function hud(on) { $('#top').classList.toggle('hidden', !on); if (!on) { $('#panel').classList.add('hidden'); } }
function toast(t) { const e = $('#toast'); e.textContent = t; e.className = 'win show'; clearTimeout(e._t); e._t = setTimeout(() => e.className = 'win', 2200); }

// ---------- Salvar ----------
const SAVE_KEY = 'cronicas_relogio_v1';
function saveGame() { G.ver = 2; try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); toast('Jogo salvo ✔'); } catch (e) { toast('Não foi possível salvar neste navegador'); } saveTableDB(); }
function loadGame() { try { const s = localStorage.getItem(SAVE_KEY); if (!s) return false; Object.assign(G, JSON.parse(s)); migrateSave(); return true; } catch (e) { return false; } }
function migrateSave() { if (G.ver === 2) return; const map = [0, 1, 3, 16, 19]; G.done = (G.done || []).map(i => map[i]).filter(i => i != null); G.items.elixir = G.items.elixir || 0; G.ver = 2; }
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
