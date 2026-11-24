// ================= MULTIJOGADOR: mesa online (sala em tempo real), sofá e rádio de voz =================
const NET = { mode: 'solo', avail: false, room: null, tab: null, code: null, me: null, user: null, db: null, dict: null, tts: null,
  hostPeer: null, lastSt: 0, unitRR: 0, seq: 0, waiting: new Map(), pending: [], onAdv: null, onPick: null, peers: [], cmdQ: [], cmdWait: null, chat: [], voice: false, narr: false, lastSceneEmit: 0, sceneKey: null };
let UID = 1; const UNIT_BY_ID = () => new Map(S ? S.units.map(u => [u.id, u]) : []);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isHost = () => NET.mode === 'host', isGuest = () => NET.mode === 'guest';
function myId() { if (NET.me) return NET.me; try { let v = localStorage.getItem('cronicas_pid'); if (!v) { v = 'p' + Math.random().toString(36).slice(2, 10); localStorage.setItem('cronicas_pid', v); } NET.me = v; } catch (e) { NET.me = 'p' + Math.random().toString(36).slice(2, 10); } return NET.me; }
async function netInit() {
  try { NET.narr = localStorage.getItem('cronicas_narr') === '1'; NET.voice = localStorage.getItem('cronicas_voz') !== '0'; } catch (e) {}
  const api = window.claude && window.claude.use ? window.claude : window.FBNET; if (!api) return; NET.web = api === window.FBNET;
  try { const [room, user, db, dict, tts] = await Promise.all(['room', 'user', 'db', 'dictation', 'tts'].map(n => api.use(n).catch(() => null)));
    NET.room = room; NET.user = user; NET.db = db; NET.dict = dict; NET.tts = tts; NET.avail = !!room;
    if (user) { try { const id = await user.id(); if (id) NET.me = id; } catch (e) {} }
    if (dict) { dict.onFinal(({ text }) => { if (text && text.trim()) sendChat(text.trim()); }); dict.onState(({ state }) => { const b = NET.web ? $('#chatmic') : $('#mic'); if (b) b.classList.toggle('on', state === 'listening'); }); }
  } catch (e) { console.warn('net', e); }
}
// ---------- envio ----------
function emitT(topic, data) { if (!NET.tab) return; NET.tab.emit(topic, data).catch(() => {}); }
function netFx(k, d) { if (isHost()) emitT('fx', Object.assign({ k }, d || {})); }
function refOf(o) { if (!o) return null; if (o.id != null && o.px != null) return { u: o.id }; return { x: o.x, y: o.y }; }
function nearestUnitRef(sx, sy) { let best = null, bd = 40; S && S.units.forEach(u => { if (u._sx == null || !u.visible) return; const d = Math.hypot(u._sx - sx, (u._sy - (u._h || 40) / 2) - sy); if (d < bd) { bd = d; best = u; } }); return best ? { u: best.id, dy: sy - best._sy } : null; }
function refScreen(r) { if (!r || !S) return null; if (r.u != null) { const u = UNIT_BY_ID().get(r.u); if (!u) return null; const [sx, sy] = unitScreen(u); return [sx, sy + (r.dy || 0)]; } const c = tile(S.map, r.x, r.y); return toScreen(r.x, r.y, c ? c.h : 0); }
// ---------- envoltórios: tudo que o líder mostra, os outros veem ----------
function wrapPresentation() {
  const W = (name, fn) => { const orig = window[name]; window[name] = fn(orig); };
  W('banner', o => (t, team) => { netFx('banner', { t, team }); return o(t, team); });
  W('bigBanner', o => (t, cls) => { netFx('big', { t, cls }); return o(t, cls); });
  W('toast', o => t => { netFx('toast', { t }); return o(t); });
  W('floatText', o => (x, y, text, color, big) => { if (isHost()) { const r = nearestUnitRef(x, y); if (r) netFx('float', { r, text, color, big }); } return o(x, y, text, color, big); });
  W('burst', o => (x, y, kind) => { if (isHost()) { const r = nearestUnitRef(x, y); if (r) netFx('burst', { r, kind }); } return o(x, y, kind); });
  W('projectile', o => (a, b, kind) => { netFx('proj', { a: refOf(a), b: refOf(b), kind }); return o(a, b, kind); });
  W('sfx', o => (n, u) => { if (isHost() && !['text', 'blip', 'step', 'select', 'cancel'].includes(n)) netFx('sfx', { n, u: u && u.id != null ? u.id : undefined }); return o(n, u); });
  W('playSong', o => n => { netFx('song', { n }); return o(n); });
  W('stopSong', o => () => { netFx('song', { n: null }); return o(); });
  W('diceRoll', o => a => { netFx('dice', { a }); return o(a); });
}
// ---------- estado (líder → todos) ----------
const U_STATIC = ['key', 'name', 'team', 'rec', 'spr', 'maxhp', 'maxmp', 'ac', 'move', 'jump', 'fly', 'abil', 'range', 'cls', 'race', 'level', 'st', 'prof', 'atkStat', 'dmg', 'boss', 'undead', 'aura', 'scale', 'ghost', 'hit', 'initMod', 'owner', 'pad'];
function unitStatic(u) { const o = { id: u.id }; U_STATIC.forEach(k => { if (u[k] !== undefined) o[k] = u[k]; }); if (u.member) { o.owner = u.member.owner || null; o.pad = u.member.pad; } if (u.def) o.def = { fx: u.def.fx, dex: u.def.dex, healer: u.def.healer }; return o; }
const r2 = v => Math.round((v || 0) * 100) / 100;
function unitDyn(u) { return [u.id, u.x, u.y, r2(u.px), r2(u.py), r2(u.ph), r2(u.hop), u.fx, u.fy, u.hp, u.mp || 0, r2(u.alpha), u.visible ? 1 : 0, u.dead ? 1 : 0, u.ko ? 1 : 0, u.anim || 0, u.anim ? V.t - u.af : 0, u.aspd || 4, u.moving ? 1 : 0, u.flash || 0, u.stopped ? 1 : 0, u.acT || 0, u.insp || 0, r2(u.ox), r2(u.oy), u.tx ?? -1, u.ty ?? -1, JSON.stringify(u.used || {})]; }
function hostTick() {
  if (!isHost() || !NET.tab) return; const now = performance.now();
  if (now - NET.lastSceneEmit > 2500 && NET.sceneDesc) { NET.lastSceneEmit = now; emitT('scene', NET.sceneDesc); }
  if (!S || !S.units || NET.sceneDesc && NET.sceneDesc.menu) return;
  if (now - NET.lastSt > (NET.web ? 200 : 110)) { NET.lastSt = now; const b = B && B.on ? { on: 1, r: B.round, a: B.active ? B.active.id : null, o: (B.order || []).filter(isActor).map(u => u.id), ai: B.ai ? 1 : 0 } : { on: 0 };
    emitT('st', { s: NET.sceneDesc ? NET.sceneDesc.key : null, u: S.units.map(unitDyn), b, it: G.items, rot: null }); }
  if (S.units.length && now - (NET.lastUnit || 0) > (NET.web ? 450 : 220)) { NET.lastUnit = now; const u = S.units[NET.unitRR++ % S.units.length]; if (u) emitT('unit', unitStatic(u)); }
}
function sceneDesc(desc) { if (!isHost()) return; NET.sceneDesc = desc; NET.lastSceneEmit = performance.now(); emitT('scene', desc); if (S && S.units) S.units.forEach(u => emitT('unit', unitStatic(u))); }
function netScene(ch, mode, extra) { sceneDesc(Object.assign({ key: 's' + (++NET.seq), theme: S.map.theme, seed: S.mapSeed, ch, mode }, extra || {})); }
function netMenu(label) { sceneDesc({ key: 'm' + (++NET.seq), menu: 1, label, party: G.party.map(m => ({ name: m.name, race: m.race, cls: m.cls, level: m.level, owner: m.owner || null, rec: memberRecipe(m) })) }); }
// ---------- convidado: reconstrói a cena ----------
function guestScene(d) {
  if (NET.sceneKey === d.key) return; NET.sceneKey = d.key;
  if (d.menu) { S = { map: genMap('village', 11), units: [] }; B = { on: false }; hud(false); $('#dlg').className = 'win'; return guestWait(d); }
  hideScreen(); S = { map: genMap(d.theme, d.seed), units: [], mapSeed: d.seed }; B = { on: false }; P.length = 0; V.panX = V.panY = 0; hud(false);
}
function guestWait(d) {
  const s = screen(`<h2>Mesa ${esc(NET.code || '')}</h2><p>${esc(d.label || 'Aguardando o líder…')}</p><h3>Grupo</h3>`, 'panel-sc');
  (d.party || []).forEach(m => { const r = h('div', 'res-row'); const im = h('img'); im.src = portrait(m.rec, 40); r.appendChild(im); const t = h('div'); const b = h('b'); b.textContent = m.name; t.appendChild(b); t.appendChild(h('small', '', `${esc(RACES[m.race] ? RACES[m.race].nome : '')} ${esc(CLASSES[m.cls] ? CLASSES[m.cls].nome : '')} • Nv ${+m.level || 1}${m.owner === myId() ? ' • você' : m.owner ? '' : ' • líder/companheiro'}`)); r.appendChild(t); s.appendChild(r); });
  s.appendChild(h('p', 'hint', 'O líder escolhe os capítulos e cuida da loja. A história e as batalhas aparecem aqui para todos.'));
  s.appendChild(btn('Sair da mesa', leaveTable, 'ghost'));
}
function guestUnit(d) {
  if (!S || !S.units || NET.sceneDesc && NET.sceneDesc.menu) return; let u = S.units.find(o => o.id === d.id);
  if (!u) { u = baseUnit({ id: d.id }); S.units.push(u); u.k = animKeys(d.spr && !isRec(d.spr) ? d.spr : 'goblin'); }
  U_STATIC.forEach(k => { if (d[k] !== undefined) u[k] = d[k]; }); u.def = d.def || {}; if (d.team === 'A') u.member = { owner: d.owner, pad: d.pad };
  if (u.rec) lpcComp(u.rec);
}
function guestState(d) {
  if (!S || !S.units) return; const byId = UNIT_BY_ID();
  d.u.forEach(a => { const u = byId.get(a[0]); if (!u) return; [, u.x, u.y, u.px, u.py, u.ph, u.hop, u.fx, u.fy, u.hp, u.mp] = a; u.alpha = a[11]; u.visible = !!a[12]; u.dead = !!a[13]; u.ko = !!a[14];
    const an = a[15] || null; if (an && (u.anim !== an || Math.abs((V.t - u.af) - a[16]) > 8)) { u.anim = an; u.af = V.t - a[16]; u.aspd = a[17]; } if (!an) u.anim = null;
    u.moving = !!a[18]; if (a[19] > u.flash) u.flash = a[19]; u.stopped = !!a[20]; u.acT = a[21]; u.insp = a[22]; u.ox = a[23]; u.oy = a[24]; u.tx = a[25] < 0 ? undefined : a[25]; u.ty = a[26] < 0 ? undefined : a[26]; try { u.used = JSON.parse(a[27]); } catch (e) {} });
  S.units = S.units.filter(u => byId.has(u.id) && d.u.some(a => a[0] === u.id));
  const wasOn = B.on; B.on = !!d.b.on; B.round = d.b.r; B.active = d.b.a != null ? byId.get(d.b.a) : null; B.order = (d.b.o || []).map(id => byId.get(id)).filter(Boolean); B.ai = !!d.b.ai;
  if (B.on) { hud(true); updateOrder(); if (B.active && !NET.myTurn) { showUnitCard(B.active); const own = B.active.member && B.active.member.owner; setActions(B.active.team === 'E' ? `Turno de ${B.active.name}…` : own === myId() ? 'Sua vez!' : `Vez de ${B.active.name}…`, []); } if (B.active && !NET.manualCam) V.focus = B.active; }
  else if (wasOn) hud(false);
  if (d.it) G.items = d.it;
}
function guestFx(d) {
  switch (d.k) {
    case 'banner': return banner(d.t, d.team);
    case 'big': return bigBanner(d.t, d.cls);
    case 'toast': return toast(d.t);
    case 'float': { const p = refScreen(d.r); if (p) floatText(p[0], p[1], d.text, d.color, d.big); return; }
    case 'burst': { const p = refScreen(d.r); if (p) burst(p[0], p[1], d.kind); return; }
    case 'proj': { const a = guestRef(d.a), b = guestRef(d.b); if (a && b) projectile(a, b, d.kind); return; }
    case 'sfx': return sfx(d.n, d.u != null ? UNIT_BY_ID().get(d.u) : undefined);
    case 'song': return d.n ? playSong(d.n) : stopSong();
    case 'dice': return diceRoll(d.a);
    case 'say': return guestSay(d);
    case 'sayEnd': { const dl = $('#dlg'); if (dl.classList.contains('show') && !dl.classList.contains('choice')) dl.className = 'win'; return; }
    case 'choice': return guestChoice(d);
    case 'choiceEnd': { const dl = $('#dlg'); if (dl.classList.contains('choice')) dl.className = 'win'; return; }
    case 'chap': { const c = $('#chap'); c.innerHTML = `<small>${esc(d.small)}</small>${esc(d.t)}`; c.className = 'show'; setTimeout(() => c.className = '', 2200); return; }
    case 'shake': V.shake = d.v; return;
    case 'flash': V.flash = d.v; return;
    case 'turn': return guestTurn(d);
    case 'turnEnd': NET.myTurn = false; HL = null; PICK = null; return;
    case 'credits': return credits();
  }
}
function guestRef(r) { if (!r) return null; if (r.u != null) return UNIT_BY_ID().get(r.u) || null; return { x: r.x, y: r.y }; }
function guestSay(d) {
  const dl = $('#dlg'); const sp = { name: d.name, img: d.rec ? portrait(d.rec, 64) : null };
  dl.className = 'win show done' + (d.kk ? '' : ' narr') + (d.kk === 'tip' ? ' tip' : ''); dl.innerHTML = (sp.img ? `<img class="por" src="${sp.img}">` : '') + `<div class="dtxt">${sp.name ? `<b></b>` : ''}<p></p></div><div class="next">▼</div>`;
  if (sp.name) dl.querySelector('b').textContent = sp.name; dl.querySelector('p').textContent = d.text;
  dl.onclick = () => { emitT('cmd', { t: 'adv', s: d.s, by: myId() }); sfx('blip'); };
  narrate(d.kk, d.text);
}
function guestChoice(d) {
  const dl = $('#dlg'); dl.className = 'win show narr choice'; dl.onclick = null; dl.innerHTML = `<div class="dtxt"><b></b><div class="chs"></div></div>`; dl.querySelector('b').textContent = d.prompt;
  const box = dl.querySelector('.chs'); d.opts.forEach((o, i) => { const b = btn(`${esc(o.t)}${o.stat ? ` <small>${STAT_NOME[o.stat]} • CD ${+o.dc}</small>` : ''}`, () => { emitT('cmd', { t: 'pick', i, s: d.s, by: myId() }); box.querySelectorAll('button').forEach(x => x.disabled = true); }, 'choice'); box.appendChild(b); });
}
// ---------- turno remoto ----------
async function guestTurn(d) {
  if (d.owner !== myId()) return; const u = UNIT_BY_ID().get(d.id); if (!u || (NET.myTurn && NET.turnId === d.id)) return; NET.myTurn = true; NET.turnId = d.id; sfx('select'); toast('Sua vez, ' + u.name + '!');
  const send = (cmd) => new Promise(res => { const seq = ++NET.seq; cmd.q = seq; cmd.by = myId(); cmd.u = u.id; NET.waiting.set(seq, res); emitT('cmd', cmd); const rt = setInterval(() => { if (!NET.waiting.has(seq)) return clearInterval(rt); emitT('cmd', cmd); }, 1800); setTimeout(() => { if (NET.waiting.has(seq)) { NET.waiting.delete(seq); clearInterval(rt); res({ ok: false }); } }, 30000); });
  await playerTurn(u, {
    move: async n => { setActions('…', []); const r = await send({ t: 'move', x: n.x, y: n.y }); await sleep(200); return r.ok; },
    undo: async () => (await send({ t: 'undo' })).ok,
    act: async (k, x, y) => { setActions('…', []); const r = await send({ t: 'act', ab: k, x, y }); return r.ok; },
    item: async (id, x, y) => (await send({ t: 'item', id, x, y })).ok,
    end: async () => { await send({ t: 'end' }); },
  });
  NET.myTurn = false; HL = null; PICK = null;
}
function ownerPresent(owner) { if (!NET.tab) return false; return NET.tab.peers().some(p => (p.by || (p.presence && p.presence.pid)) === owner); }
async function remoteTurn(u) {
  const owner = u.member.owner; netFx('turn', { id: u.id, owner }); let moved = false, acted = false; const origin = { x: u.x, y: u.y, fx: u.fx, fy: u.fy };
  setActions(`Vez de ${u.name} (outro jogador)…`, [btn('Assumir o turno', () => { NET.takeover = u.id; }, 'ghost')]); showUnitCard(u);
  const done = new Set(); let absent = 0, ping = performance.now();
  while (true) {
    if (NET.takeover === u.id) { NET.takeover = null; netFx('turnEnd', { id: u.id }); return 'local'; }
    const c = NET.cmdQ.shift();
    if (!c) { await sleep(100); if (!done.size && performance.now() - ping > 4000) { ping = performance.now(); netFx('turn', { id: u.id, owner }); } if (!ownerPresent(owner)) { if (++absent > 60) { toast(u.name + ' saiu — o líder assume o turno'); netFx('turnEnd', { id: u.id }); return 'local'; } } else absent = 0; continue; }
    if (c.by !== owner || c.u !== u.id) continue;
    if (done.has(c.q)) { emitT('ack', { q: c.q, ok: true, to: owner }); continue; } done.add(c.q);
    let ok = false;
    try {
      if (c.t === 'move' && !moved) { const r = reachable(u); const n = r.get(keyOf(c.x, c.y)); if (n) { await walkPath(u, n); moved = true; ok = true; } }
      else if (c.t === 'undo' && moved && !acted) { teleport(u, origin.x, origin.y); u.fx = origin.fx; u.fy = origin.fy; moved = false; ok = true; }
      else if (c.t === 'act' && !acted && u.abil.includes(c.ab) && canUse(u, c.ab)) { const ab = abInfo(u, c.ab); if (ab.type === 'selfheal' || ab.range === 0 || rangeTiles(u, ab).has(keyOf(c.x, c.y))) { await useAbility(u, c.ab, c.x, c.y); acted = true; ok = true; } }
      else if (c.t === 'item' && !acted && G.items[c.id] > 0) { const t = S.units.find(o => o.team === 'A' && o.x === c.x && o.y === c.y && dist(o, u) <= 1); if (t) { await useItem(t, c.id); acted = true; ok = true; } }
      else if (c.t === 'end') { emitT('ack', { q: c.q, ok: true, to: owner }); break; }
    } catch (e) { console.warn(e); }
    NET.lastSt = 0; hostTick(); await sleep(60); emitT('ack', { q: c.q, ok, to: owner });
    if (moved && acted) break; if (checkEnd()) break;
  }
  netFx('turnEnd', { id: u.id }); return 'done';
}
// ---------- mesa: criar, entrar, sair ----------
function randCode() { const L = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 4; i++) s += L[rnd(L.length)]; return s; }
async function joinRoom(code) {
  NET.code = code.toUpperCase(); NET.tab = await NET.room.join('mesa-' + NET.code.toLowerCase());
  NET.tab.presence({ pid: myId(), name: hero() ? hero().name : '', host: isHost() ? 1 : 0 }).catch(() => {});
  ['st', 'unit', 'fx', 'scene'].forEach(tp => NET.tab.on(tp, m => { if (!isGuest() || m.sameTab) return; if (NET.hostPeer && m.peer !== NET.hostPeer) return; if (!NET.hostPeer) NET.hostPeer = m.peer; const d = m.data || {}; try { if (tp === 'st') guestState(d); else if (tp === 'unit') guestUnit(d); else if (tp === 'fx') guestFx(d); else guestScene(d); } catch (e) { console.warn(e); } }));
  NET.tab.on('cmd', m => { if (!isHost() || m.sameTab) return; const d = m.data || {}; d.by = m.by || d.by; if (d.t === 'adv') { if (NET.onAdv) NET.onAdv(); return; } if (d.t === 'pick') { if (NET.onPick) NET.onPick(d.i, d.by); return; } NET.cmdQ.push(d); });
  NET.tab.on('ack', m => { if (!isGuest()) return; const d = m.data || {}; if (d.to !== myId()) return; const r = NET.waiting.get(d.q); if (r) { NET.waiting.delete(d.q); r(d); } });
  NET.tab.on('chat', m => { const d = m.data || {}; if (typeof d.text !== 'string') return; gotChat(String(d.name || 'Alguém').slice(0, 20), d.text.slice(0, 300), d.by || m.by, m.sameTab); });
  NET.tab.on('lobby', m => { const d = m.data || {}; try { lobbyMsg(d, m); } catch (e) { console.warn(e); } });
  NET.tab.onPeers(ch => { NET.peers = ch.peers; if (NET.lobbyDraw) NET.lobbyDraw(); if (isHost() && ch.joined.length) { NET.lastSceneEmit = 0; } });
  $('#chatbtn').classList.remove('hidden'); $('#mic').classList.toggle('hidden', !(NET.dict || NET.web)); if (NET.web) VOICE.ui();
}
async function leaveTable() { if (NET.web) VOICE.stop(); try { if (NET.tab) await NET.tab.leave(); } catch (e) {} NET.tab = null; NET.mode = 'solo'; NET.code = null; NET.hostPeer = null; NET.sceneKey = null; $('#chatbtn').classList.add('hidden'); $('#mic').classList.add('hidden'); $('#chat').classList.add('hidden'); titleScreen(); }
function lobbyMsg(d, m) {
  if (isHost()) {
    if (d.t === 'hero' && d.member) { const mm = sanitizeMember(d.member, m.by || d.by); if (!mm) return; const ex = G.party.find(p => p.owner === mm.owner); if (ex) { emitT('lobby', { t: 'have', to: mm.owner }); return; } if (!NET.pending.some(p => p.owner === mm.owner)) NET.pending.push(mm); if (NET.lobbyDraw) NET.lobbyDraw(); if (NET.started) addPending(); }
    if (d.t === 'hello') { const owner = m.by || d.by; if (G.party.some(p => p.owner === owner)) emitT('lobby', { t: 'have', to: owner }); NET.lastSceneEmit = 0; }
  } else if (isGuest()) {
    if (d.t === 'have' && d.to === myId()) { NET.haveHero = true; if (NET.lobbyDraw) NET.lobbyDraw(); }
    if (d.t === 'start') { NET.started = true; if (NET.lobbyDraw) NET.lobbyDraw(); }
  }
}
function sanitizeMember(m, owner) {
  if (!m || !RACES[m.race] || !CLASSES[m.cls] || !owner) return null; const st = {}; for (const k of STATS) { const v = +((m.st || {})[k]); if (!(v >= 3 && v <= 20)) return null; st[k] = v; }
  const name = String(m.name || 'Herói').replace(/[<>]/g, '').slice(0, 14) || 'Herói'; const mm = newMember('p_' + String(owner).slice(0, 24).replace(/[^a-zA-Z0-9_-]/g, ''), name, m.race, m.cls, m.gender === 'f' ? 'f' : 'm', st); mm.owner = owner; return mm;
}
function addPending() { while (NET.pending.length) { const mm = NET.pending.shift(); const target = Math.max(1, Math.round(G.party.reduce((a, p) => a + p.level, 0) / G.party.length)); while (mm.level < target) levelUp(mm); mm.xp = XP_LV[mm.level]; G.party.splice(1, 0, mm); toast(mm.name + ' entrou na mesa!'); } }
function groupScreen() {
  const s = screen(`<h2>Jogar em grupo</h2><p>Escolha como o grupo vai jogar junto.</p>`, 'panel-sc');
  s.appendChild(btn('🛋 No sofá — vários controles nesta tela<small>Cada jogador cria um herói e usa o próprio controle na sua vez.</small>', couchInfo, 'wide'));
  if (NET.avail) {
    s.appendChild(btn('🌐 Criar mesa online<small>Você é o líder: a partida roda no seu aparelho e os outros entram com um código.</small>', () => hostSetup(), 'ok wide'));
    s.appendChild(btn('🔑 Entrar numa mesa online<small>Digite o código que o líder mostrar.</small>', () => joinSetup(), 'wide'));
  } else s.appendChild(h('p', 'hint', NET.web ? 'Não foi possível conectar ao servidor da mesa online. Verifique a internet e recarregue a página.' : 'A mesa online só funciona com o jogo aberto pelo link do Claude, com a conta conectada e permissão de interação no artefato.'));
  s.appendChild(btn('← Voltar', titleScreen, 'ghost'));
}
function couchInfo() {
  const s = screen(`<h2>Jogo no sofá</h2><ul class="how"><li>Comece ou continue uma campanha normalmente.</li><li>No <b>Acampamento → Jogadores</b>, adicione até 5 heróis extras e escolha qual controle comanda cada um (🎮1, 🎮2…).</li><li>Na vez de cada herói, só o controle dele responde (o teclado e o toque sempre funcionam).</li><li>Nas escolhas da história, qualquer jogador pode escolher — e o teste usa o atributo de quem apertou primeiro.</li></ul>`, 'panel-sc');
  if (hasSave()) s.appendChild(btn('Continuar campanha', () => { loadGame(); camp('jogadores'); }, 'ok'));
  s.appendChild(btn('Nova campanha', () => createScreen(), '')); s.appendChild(btn('← Voltar', groupScreen, 'ghost'));
}
async function hostSetup() {
  const s = screen(`<h2>Criar mesa online</h2><p>Você será o líder. Escolha a campanha:</p>`, 'panel-sc');
  if (hasSave()) s.appendChild(btn('Continuar minha campanha salva', () => { loadGame(); hostLobby(); }, 'ok'));
  s.appendChild(btn('Nova campanha (criar meu herói)', () => createScreen('host'), ''));
  if (NET.db) { const row = h('div', 'row'); const inp = h('input'); inp.placeholder = 'Código antigo'; inp.maxLength = 4; row.appendChild(inp); row.appendChild(btn('Reabrir mesa salva', async () => { const ok = await loadTableDB(inp.value.trim().toUpperCase()); if (ok) hostLobby(inp.value.trim().toUpperCase()); else toast('Mesa não encontrada'); }, '')); s.appendChild(row); }
  s.appendChild(btn('← Voltar', groupScreen, 'ghost'));
}
async function hostLobby(code) {
  NET.mode = 'host'; NET.started = false; NET.pending = []; if (!NET.tab) { try { await joinRoom(code || randCode()); } catch (e) { toast('Não foi possível abrir a sala'); NET.mode = 'solo'; return groupScreen(); } }
  G.party.forEach((m, i) => { if (i === 0) m.owner = myId(); }); wrapOnce();
  const draw = () => { if (NET.started) return; const s = screen(`<h2>Mesa <span class="code">${esc(NET.code)}</span></h2><p>Peça para os amigos abrirem o jogo, tocarem em <b>Jogar em grupo → Entrar numa mesa</b> e digitarem o código <b>${esc(NET.code)}</b>.</p><h3>Na mesa agora</h3>`, 'panel-sc');
    const peers = NET.tab ? NET.tab.peers() : []; const list = h('div');
    peers.forEach(p => { const r = h('div', 'res-row'); const nm = h('b'); nm.textContent = (p.presence && p.presence.name) || (p.isMe ? hero().name : 'Jogador'); r.appendChild(nm); r.appendChild(h('small', '', p.isMe ? ' • líder (você)' : (G.party.some(m => m.owner === (p.by || (p.presence || {}).pid)) ? ' • herói pronto' : NET.pending.some(m => m.owner === (p.by || (p.presence || {}).pid)) ? ' • herói criado' : ' • criando herói…'))); list.appendChild(r); });
    s.appendChild(list); s.appendChild(btn('▶ Começar a aventura', () => { NET.started = true; addPending(); emitT('lobby', { t: 'start' }); saveGame(); if (G.done.length === 0 && G.party.length) playChapter(0, false); else worldMap(); }, 'ok big'));
    s.appendChild(btn('Cancelar mesa', leaveTable, 'ghost')); };
  NET.lobbyDraw = draw; draw();
}
function joinSetup() {
  const s = screen(`<h2>Entrar numa mesa</h2><p>Digite o código de 4 letras mostrado na tela do líder.</p>`, 'panel-sc');
  const inp = h('input'); inp.maxLength = 4; inp.style.textTransform = 'uppercase'; inp.style.fontSize = '28px'; inp.style.width = '160px'; s.appendChild(inp);
  s.appendChild(btn('Entrar', async () => { const c = inp.value.trim().toUpperCase(); if (c.length !== 4) return toast('O código tem 4 letras'); NET.mode = 'guest'; try { await joinRoom(c); } catch (e) { NET.mode = 'solo'; return toast('Não foi possível entrar'); } wrapOnce(); emitT('lobby', { t: 'hello', by: myId() }); guestLobby(); }, 'ok'));
  s.appendChild(btn('← Voltar', groupScreen, 'ghost'));
}
function guestLobby() {
  const draw = () => { if (NET.sceneKey) return; const s = screen(`<h2>Mesa ${esc(NET.code)}</h2>`, 'panel-sc');
    if (NET.haveHero) s.appendChild(h('p', '', 'Seu herói já está no grupo. Aguardando o líder começar…'));
    else if (NET.sentHero) s.appendChild(h('p', '', 'Herói enviado! Aguardando o líder…'));
    else { s.appendChild(h('p', '', 'Crie o seu herói para entrar no grupo.')); s.appendChild(btn('Criar meu herói', () => createScreen('guest'), 'ok big')); }
    if (NET.started) s.appendChild(h('p', 'hint', 'A aventura começou! A tela muda assim que o líder abrir o próximo capítulo.'));
    s.appendChild(btn('Sair da mesa', leaveTable, 'ghost')); };
  NET.lobbyDraw = draw; draw();
}
function guestSendHero(m) { NET.sentHero = true; NET.myName = m.name; if (NET.tab) NET.tab.presence({ name: m.name }).catch(() => {}); emitT('lobby', { t: 'hero', member: { name: m.name, race: m.race, cls: m.cls, gender: m.gender, st: m.st }, by: myId() }); guestLobby(); }
let WRAPPED = false; function wrapOnce() { if (!WRAPPED) { WRAPPED = true; wrapPresentation(); } }
// ---------- salvamento compartilhado (db) ----------
async function saveTableDB() { if (!isHost() || !NET.db || !NET.code) return; try { await NET.db.doc('mesas/' + NET.code).set({ g: JSON.stringify(G), at: Date.now() }); } catch (e) { console.warn('db', e); } }
async function loadTableDB(code) { if (!NET.db || code.length !== 4) return false; try { const snap = await NET.db.doc('mesas/' + code).get(); const d = snap && (snap.data ? snap.data() : snap); if (!d || !d.g) return false; Object.assign(G, JSON.parse(d.g)); return true; } catch (e) { return false; } }
// ---------- chat e rádio de voz ----------
function sendChat(text) { if (!NET.tab) return; const name = NET.myName || (G.party.find(m => m.owner === myId()) || hero() || {}).name || 'Jogador'; emitT('chat', { text: text.slice(0, 300), name, by: myId() }); }
function gotChat(name, text, by, mine) {
  NET.chat.push({ name, text }); if (NET.chat.length > 30) NET.chat.shift(); drawChat();
  const u = S && S.units && S.units.find(o => o.member && o.member.owner === by); if (u) showBubble(u, text);
  if (!mine && NET.voice && NET.tts) { const voices = ['buttery', 'airy', 'glassy', 'rounded']; let hsh = 0; for (const c of String(by)) hsh = (hsh * 31 + c.charCodeAt(0)) | 0; NET.tts.speak(`${name}: ${text}`, { voice: voices[Math.abs(hsh) % 4] }).catch(() => {}); }
  if (!mine) sfx('blip');
}
function drawChat() { const log = $('#chatlog'); if (!log) return; log.innerHTML = ''; NET.chat.slice(-8).forEach(c => { const p = h('p'); const b = h('b'); b.textContent = c.name + ': '; p.appendChild(b); p.appendChild(document.createTextNode(c.text)); log.appendChild(p); }); log.scrollTop = 1e6; }
const BUBBLES = []; function showBubble(u, text) { BUBBLES.push({ u, text: text.slice(0, 80), t: 0 }); }
function drawBubbles() { const s = V.scale, d = Math.max(V.dpr, V.scale / 2.4); for (let i = BUBBLES.length - 1; i >= 0; i--) { const b = BUBBLES[i]; b.t++; if (b.t > 300 || !b.u._sx) { BUBBLES.splice(i, 1); continue; } const x = b.u._sx * s, y = (b.u._sy - b.u._h - 12) * s; ctx.font = `600 ${13 * d}px Alegreya,Georgia,serif`; const w = Math.min(ctx.measureText(b.text).width + 16 * d, 320 * d); ctx.fillStyle = 'rgba(250,240,215,.95)'; ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2 * d; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - 26 * d, w, 22 * d, 8 * d) : ctx.rect(x - w / 2, y - 26 * d, w, 22 * d); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#3a2412'; ctx.textAlign = 'center'; ctx.fillText(b.text.length > 46 ? b.text.slice(0, 44) + '…' : b.text, x, y - 10 * d, w - 8 * d); } }
function toggleChat() { const c = $('#chat'); c.classList.toggle('hidden'); drawChat(); }
function micClick(chat) { if (NET.web && !chat) return VOICE.toggle(); if (!NET.dict) return toast('Ditado indisponível neste navegador'); if ($('#mic').classList.contains('on')) { NET.dict.stop().catch(() => {}); return; } NET.dict.start().catch(e => toast(e && e.code === 'not_granted' ? 'Microfone não autorizado' : 'Não foi possível ouvir agora')); }
// ---------- narração por voz (TTS) ----------
const SPK_VOICE = { borin: 'rounded', lyra: 'airy', mirela: 'glassy', eldrin: 'rounded', malakar: 'rounded', rei: 'rounded' };
function narrate(k, text) { if (!NET.narr || !NET.tts) return; const v = k ? SPK_VOICE[k] || ['buttery', 'airy', 'glassy', 'rounded'][(k.length * 7) % 4] : 'buttery'; NET.tts.speak(text, { voice: v, language: 'pt-BR' }).catch(() => {}); }
// ---------- vários controles no sofá ----------
function padOwnerOfTurn() { if (!B || !B.on || !B.active || !B.active.member) return null; const p = B.active.member.pad; return p == null ? null : p; }
