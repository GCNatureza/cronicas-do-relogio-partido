// ================= FLUXO DO JOGO =================
const MAIN = CHAPTERS.map((c, i) => i).filter(i => !CHAPTERS[i].side);
const mainNum = i => MAIN.indexOf(i) + 1;
const avgLevel = () => Math.max(1, Math.round(G.party.reduce((a, m) => a + m.level, 0) / Math.max(1, G.party.length)));
function nextMain() { return MAIN.find(i => !G.done.includes(i)); }
function isOpen(i) { const C = CHAPTERS[i]; if (C.side) return G.done.includes(C.after); const k = MAIN.indexOf(i); return k === 0 || G.done.includes(MAIN[k - 1]); }
const gpos = (x, y) => { const M = S.map.M || 0, P = S.map.P || S.map.N; return [M + Math.round(x * (P - 1) / 9), M + Math.round(y * (P - 1) / 9)]; };
function sceneFor(ch, mode) {
  const C = CHAPTERS[ch]; const map = genMap(C.theme, C.seed); S = { map, units: [], ch, lv: C.lv, mapSeed: C.seed }; V.panX = V.panY = 0; V.focus = null; P.length = 0;
  const lvl = mode === 'train' ? Math.max(C.lv, avgLevel()) : C.lv;
  G.party.forEach((m, i) => { const u = makeHeroUnit(m); place(u, map.pz[i] || nearestFree(map.pc[0], map.pc[1])); u.fx = -1; u.fy = 0; S.units.push(u); });
  if (mode !== 'train') for (const k in C.npcs) { if (G.party.some(m => m.key === k)) continue; const [x0, y0, hid] = C.npcs[k]; const [x, y] = gpos(x0, y0); const u = npcUnit(k); u.fx = 1; u.fy = 0; const c = nearestFree(x, y); if (c) { place(u, c); u.visible = !hid; S.units.push(u); } }
  const list = []; if (C.boss) list.push(C.boss);
  C.enemies.forEach(([id, n]) => { if (id === 'shadow') { G.party.slice(0, 5).forEach(m => list.push({ shadow: m })); return; } for (let i = 0; i < n; i++) list.push(id); });
  const extra = Math.max(0, G.party.length - 4); const firstMob = C.enemies.find(([id]) => id !== 'shadow'); for (let i = 0; i < extra && firstMob; i++) list.push(firstMob[0]);
  list.forEach((id, i) => {
    const u = typeof id === 'object' ? makeShadow(id.shadow) : makeEnemy(id, lvl - (MON[id].lv || 1));
    if (u.boss && extra) { u.maxhp = Math.round(u.maxhp * (1 + .15 * extra)); u.hp = u.maxhp; }
    const c = map.ez[i] || nearestFree(map.ec[0], map.ec[1]); const spot = unitAt(c.x, c.y) ? nearestFree(c.x, c.y) : c; place(u, spot); u.fx = 1; u.fy = 0; u.visible = mode === 'train' || !!u.boss; S.units.push(u);
  });
  V.focus = S.units.find(u => u.team === 'A') || null; V.manual = false; if (S.units.some(u => (u.scale || 1) >= 2)) V.panY = 34;
  netScene(ch, mode);
  return S;
}
function npcUnit(k) { const sp = SPEAKERS[k]; const rec = speakerRec(k); return baseUnit({ key: k, name: sp.name, team: 'N', k: animKeys(sp.spr), spr: rec || sp.spr, rec, fx: -1, fy: 0 }); }
function joinCompanion(k) {
  const npc = S.units.find(u => u.key === k && u.team === 'N');
  if (!G.party.some(m => m.key === k)) { const c = COMPANIONS[k]; const m = newMember(k, c.name, c.race, c.cls, c.gender, c.st); const target = avgLevel(); while (m.level < target) levelUp(m); m.xp = XP_LV[m.level]; G.party.push(m); }
  const m = G.party.find(p => p.key === k); if (S.units.some(u => u.member === m)) return; const u = makeHeroUnit(m); const pos = npc || nearestFree(S.map.pc[0], S.map.pc[1]); place(u, pos); u.fx = -1;
  if (npc) S.units.splice(S.units.indexOf(npc), 1); S.units.push(u); if (isHost()) emitT('unit', unitStatic(u));
  const [sx, sy] = unitScreen(u); emit(sx, sy - 10, 30, { c: '#80c0ff', sp: 1.2, life: 40, s: 2 }); sfx('level'); toast(`${m.name} entrou para o grupo!`);
}
const PRE = {};
async function runScript(cmds) {
  for (const c of cmds) {
    const [op, a, b] = c;
    if (op === 'n') await say(null, a);
    else if (op === 's') await say(a, b);
    else if (op === 'tip') await say('tip', a);
    else if (op === 'music') { if (a) playSong(a); else stopSong(); }
    else if (op === 'fx') {
      if (a === 'flash') { V.flash = 20; netFx('flash', { v: 20 }); sfx('boom'); await sleep(500); }
      if (a === 'shake') { V.shake = 16; netFx('shake', { v: 16 }); sfx('boom'); await sleep(400); }
      if (a === 'bell') { sfx('bell'); V.flash = 8; netFx('flash', { v: 8 }); await sleep(900); }
      if (a === 'portal') { const u = S.units.find(o => o.key === b); const [sx, sy] = u ? unitScreen(u) : [V.bw / 2, V.bh / 2]; sfx('portal'); for (let i = 0; i < 40; i++) { const an = i / 40 * 6.28; emit(sx + Math.cos(an) * 14, sy - 12 + Math.sin(an) * 8, 1, { c: i % 2 ? '#b070ff' : '#60d0ff', sp: .3, life: 60, s: 2 }); } if (u) burst(sx, sy - 12, 'dual'); V.flash = 6; netFx('flash', { v: 6 }); await sleep(700); }
    }
    else if (op === 'show') {
      const us = a === 'enemies' ? S.units.filter(u => u.team === 'E' && !u.visible && !u.dead) : S.units.filter(u => u.key === a);
      us.forEach(u => { u.visible = true; u.alpha = 0; const [sx, sy] = unitScreen(u); emit(sx, sy - 8, 16, { c: u.team === 'E' ? '#c040ff' : '#80c0ff', sp: 1, life: 30, s: 2 }); });
      for (let i = 0; i <= 15; i++) { us.forEach(u => u.alpha = i / 15); await nextFrame(); }
    }
    else if (op === 'hide') { const u = S.units.find(o => o.key === a); if (u) { for (let i = 15; i >= 0; i--) { u.alpha = i / 15; await nextFrame(); } u.visible = false; } }
    else if (op === 'join') joinCompanion(a);
    else if (op === 'choice') {
      const o = await choiceUI(a, b); const who = (o._by && G.party.find(m => m.owner === o._by)) || (o._pad != null && G.party.find(m => m.pad === o._pad)) || hero();
      if (o.stat) { const m = mod(who.st[o.stat]); const d20 = 1 + rnd(20); const ok = d20 + m >= o.dc; await diceRoll({ d20, bonus: m, vs: o.dc, vsLabel: 'CD', ok, crit: d20 === 20, who: `Teste de ${STAT_NOME[o.stat]} — ${who.name}` }); await runScript(ok ? o.ok : o.no); }
      else await runScript(o.ok);
    }
    else if (op === 'eff') await effect(a);
    else if (op === 'map') { sceneFor(0, 'train'); S.units = S.units.filter(u => u.team === 'A'); (b || []).forEach(k => { const u = npcUnit(k); const [gx, gy] = gpos(4, 4); place(u, nearestFree(gx, gy)); u.fx = 1; S.units.push(u); }); netScene(0, 'ending'); V.flash = 20; netFx('flash', { v: 20 }); await sleep(600); }
    else if (op === 'credits') { netFx('credits', {}); await credits(); }
  }
}
async function effect(k) {
  if (k === 'removeEnemy') { const e = S.units.filter(u => u.team === 'E' && !u.boss && !u.dead && !u.removed).pop(); if (e) { e.removed = true; e.dead = true; if (e.visible) { const [sx, sy] = unitScreen(e); emit(sx, sy - 8, 20, { c: '#fff', sp: 1, life: 30, s: 2 }); for (let i = 15; i >= 0; i--) { e.alpha = i / 15; await nextFrame(); } } e.visible = false; toast('Um inimigo a menos!'); } }
  if (k === 'init') PRE.init = 3;
  if (k === 'potions') { G.items.pocao += 2; toast('+2 Poções de Cura'); sfx('coin'); }
  if (k === 'chest') { G.items.pocao++; G.items.eter++; toast('+1 Poção, +1 Éter'); sfx('coin'); }
  if (k === 'gold') { G.gold += 150; toast('+150 peças de ouro'); sfx('coin'); }
  if (k === 'bossWeak') { const bo = S.units.find(u => u.boss); if (bo) { bo.hp = Math.round(bo.maxhp * .7); const [sx, sy] = unitScreen(bo); floatText(sx, sy - 40, '-30% PV', '#ffd040', true); bo.flash = 20; sfx('crit'); } }
  if (k === 'eldrinBless') { sfx('holy'); for (const u of S.units.filter(o => o.team === 'A')) { u.maxhp += 20; u.hp = u.maxhp; u.mp = u.maxmp; u.insp = 4; const [sx, sy] = unitScreen(u); burst(sx, sy - 10, 'holy'); floatText(sx, sy - 40, '+20 PV máx', '#ffe14a'); } await sleep(600); }
}
async function runBattle() {
  B = { on: true, xp: 0, round: 1, order: [], active: null, ai: false };
  hud(true); S.units.forEach(u => { if (u.team === 'E' && !u.dead) { u.visible = true; u.alpha = 1; } });
  await bigBanner('BATALHA!');
  while (true) {
    const act = S.units.filter(isActor); act.forEach(u => u.init = 1 + rnd(20) + u.initMod + (u.team === 'A' ? (PRE.init || 0) : 0) + Math.random() * .1);
    B.order = act.sort((a, b) => b.init - a.init);
    for (const u of B.order) {
      if (!isActor(u)) continue; B.active = u; V.focus = u; V.manual = false; updateOrder(); showUnitCard(u); u.sneakUsed = false; if (u.acT) { u.acT--; if (!u.acT) { u.ac -= u.acB; u.acB = 0; } }
      if (u.stopped) { u.stopped = 0; const [sx, sy] = unitScreen(u); floatText(sx, sy - 30, 'Congelado…', '#c8a8ff'); await sleep(900); continue; }
      try { if (u.team === 'A') await playerTurn(u); else { setActions(`Turno de ${esc(u.name)}…`, []); await aiTurn(u); } } catch (err) { console.warn('turno', err); B.ai = false; HL = null; PICK = null; u.moving = false; u.hop = 0; }
      const r = checkEnd(); if (r) { B.on = false; B.active = null; HL = null; PICK = null; updateOrder(); $('#panel').classList.add('hidden'); return r; }
    }
    B.round++;
  }
}
function checkEnd() {
  const foes = S.units.filter(u => u.team === 'E' && isActor(u)); const boss = S.units.find(u => u.team === 'E' && u.boss);
  if (!foes.length || (boss && boss.dead)) return 'win';
  if (!S.units.some(u => u.team === 'A' && isActor(u))) return 'lose';
  return null;
}
function chapTitle(i) { const C = CHAPTERS[i]; const small = C.side ? 'Missão secundária' : `Capítulo ${mainNum(i)} • ${ERAS.find(e => e.id === C.era).nome}`; $('#chap').innerHTML = `<small>${small}</small>${C.nome}`; $('#chap').className = 'show'; netFx('chap', { small, t: C.nome }); }
async function playChapter(i, train) {
  hideScreen(); hud(false); for (const k in PRE) delete PRE[k]; const C = CHAPTERS[i];
  sceneFor(i, train ? 'train' : 'story'); await prepSprites([...S.units.map(u => u.rec), ...Object.keys(SPEAKERS).map(speakerRec), ...G.party.map(memberRecipe), ...Object.keys(COMPANIONS).map(k => memberRecipe(COMPANIONS[k]))]);
  playSong(C.song); chapTitle(i); await sleep(2200); $('#chap').className = '';
  if (!train) await runScript(C.intro); else playSong(C.bsong);
  if (AU.songName !== C.bsong && AU.songName !== 'boss') playSong(C.bsong);
  await battleLoop(i, train);
}
async function battleLoop(i, train) {
  const C = CHAPTERS[i]; const r = await runBattle();
  if (r === 'lose') { playSong('crypt'); await bigBanner('DERROTA…', 'lose'); hud(false); return defeat(i, train); }
  playSong('victory'); await bigBanner('VITÓRIA!', 'win'); hud(false);
  await results(i, train, B.xp);
  if (!train) { await runScript(C.outro); if (!G.done.includes(i)) G.done.push(i); G.chapter = G.done.length; }
  saveGame(); worldMap();
}
async function results(i, train, xp) {
  const C = CHAPTERS[i]; const catchUp = 1 + .5 * Math.max(0, C.lv - avgLevel()); const each = Math.max(10, Math.floor(xp * catchUp / Math.max(1, Math.min(G.party.length, 5))));
  const gold = train ? 20 + Math.floor(C.gold * .3) : C.gold + 20; G.gold += gold;
  const lines = []; netMenu('Vitória! O grupo recebe experiência e ouro.');
  await prepSprites(G.party.map(memberRecipe)); G.party.forEach(m => { m.xp += each; const lv = []; while (m.level < MAXLV && m.xp >= XP_LV[m.level + 1]) lv.push(...levelUp(m)); lines.push(`<div class="res-row"><img src="${portrait(memberRecipe(m), 40)}"><div><b>${esc(m.name)}</b> +${each} XP ${lv.length ? `<span class="lv">NÍVEL ${m.level}!</span><small>${lv.join(' • ')}</small>` : `<small>Nv ${m.level} • ${m.xp}/${XP_LV[m.level + 1]} XP</small>`}</div></div>`); });
  if (lines.some(l => l.includes('NÍVEL'))) sfx('level');
  if (isHost()) netMenu('Vitória! ' + G.party.map(m => `${m.name} Nv ${m.level}`).join(' • '));
  return new Promise(res => { const s = screen(`<h2 class="gold">Vitória!</h2><p>${C.nome}${train ? ' (treino)' : ''}</p>${lines.join('')}<p class="gold">+${gold} peças de ouro</p>`, 'panel-sc'); s.appendChild(btn('Continuar ▶', () => { hideScreen(); if (isHost() && S.units.length) netScene(i, 'outro'); res(); }, 'ok big')); });
}
function defeat(i, train) {
  netMenu('Derrota… o líder vai decidir se tentamos de novo.');
  const s = screen(`<h2 class="red">Derrota</h2><p>O tempo ainda não acabou. Toda linha do tempo tem outra chance.</p>`, 'panel-sc');
  s.appendChild(btn('↻ Tentar a batalha de novo', () => retry(i, train), 'ok big')); s.appendChild(btn('Voltar ao mapa', () => worldMap(), 'ghost'));
}
async function retry(i, train) { hideScreen(); for (const k in PRE) delete PRE[k]; sceneFor(i, 'train'); await prepSprites(S.units.map(u => u.rec)); playSong(CHAPTERS[i].bsong); await battleLoop(i, train); }

// ---------- Telas principais ----------
function titleScreen() {
  S = { map: genMap('tower', 53), units: [] }; HL = null; hud(false); playSong('title');
  const s = screen(`<div class="logo"><small>✦ um RPG tático ✦</small><h1>Crônicas do<br>Relógio Partido</h1></div>`, 'title-sc');
  const box = h('div', 'menu'); box.appendChild(btn('Novo Jogo', () => createScreen(), 'ok big'));
  if (hasSave()) box.appendChild(btn('Continuar', () => { loadGame(); worldMap(); }, 'big'));
  box.appendChild(btn('👥 Jogar em grupo', groupScreen, 'big'));
  box.appendChild(btn('Como jogar', howTo, 'ghost')); box.appendChild(btn('⚙ Opções', options, 'ghost')); box.appendChild(btn('⛶ Tela cheia', toggleFull, 'ghost')); box.appendChild(btn('Créditos', () => credits().then(titleScreen), 'ghost'));
  s.appendChild(box); s.appendChild(h('p', 'hint', '🎮 Controle, teclado e controle remoto da TV suportados • toque ou aperte um botão para ativar o som'));
}
function options() {
  const names = ['Baixa (TVs e celulares simples)', 'Média', 'Alta (HD-2D completo)'];
  const s = screen(`<h2>Opções</h2><h3>Qualidade gráfica</h3><p class="hint">A qualidade Alta liga brilho (bloom), profundidade de campo, raios de luz e névoa. O jogo reduz sozinho se ficar lento.</p>`, 'panel-sc');
  names.forEach((n, i) => s.appendChild(btn(n, () => { V.q = i; try { localStorage.setItem('cronicas_q', i); } catch (e) {} options(); }, V.q === i ? 'ok' : '')));
  s.appendChild(h('h3', '', 'Voz'));
  if (NET.tts) {
    s.appendChild(btn(`🗣 Narração por voz: ${NET.narr ? 'LIGADA' : 'desligada'}<small>Uma voz lê os diálogos da história.</small>`, () => { NET.narr = !NET.narr; try { localStorage.setItem('cronicas_narr', NET.narr ? '1' : '0'); } catch (e) {} options(); }, NET.narr ? 'on wide' : 'wide'));
    s.appendChild(btn(`📻 Ouvir mensagens do rádio em voz: ${NET.voice ? 'LIGADO' : 'desligado'}<small>Nas mesas online, as mensagens dos amigos são lidas em voz alta.</small>`, () => { NET.voice = !NET.voice; try { localStorage.setItem('cronicas_voz', NET.voice ? '1' : '0'); } catch (e) {} options(); }, NET.voice ? 'on wide' : 'wide'));
  } else s.appendChild(h('p', 'hint', 'A narração por voz aparece quando o jogo é aberto pelo link do Claude num navegador compatível (Chrome, Edge).'));
  s.appendChild(btn('← Voltar', titleScreen, 'ghost'));
}
function howTo() {
  const s = screen(`<h2>Como jogar</h2><ul class="how">
  <li><b>Turnos por iniciativa</b> (d20 + DES). A ordem aparece no topo.</li>
  <li>No seu turno: <b>Mover</b> uma vez e <b>Agir</b> uma vez, em qualquer ordem. Dá para <b>Voltar</b> o movimento antes de agir.</li>
  <li><b>Ataques</b>: d20 + bônus ≥ CA do alvo acerta. 20 natural = <b>crítico</b> (dados dobrados).</li>
  <li><b>Posição importa</b>: pelas costas +2, pelo flanco +1, de terreno mais alto +1/+2.</li>
  <li><b>Magias de área</b> atingem aliados também — veja o aviso antes de confirmar.</li>
  <li><b>Técnica Dupla</b>: com um aliado adjacente, combinem o dano num golpe que nunca erra.</li>
  <li>Novas habilidades nos níveis 3, 6 e 9. Nível máximo: 12.</li>
  <li>A saga tem <b>21 capítulos em 7 eras</b>, mais <b>5 missões secundárias</b> (★) que abrem no mapa.</li>
  <li><b>Jogar em grupo</b>: no sofá (vários controles) ou numa mesa online com código. Na mesa online há chat e rádio de voz.</li>
  <li><b>Controle:</b> direcional move o cursor, Ⓐ confirma, Ⓑ volta, LB/RB giram a câmera, Ⓨ zoom, Ⓧ acelera. <b>Teclado/controle remoto:</b> setas, Enter, Esc/Voltar, Q/E giram.</li></ul>`, 'panel-sc');
  s.appendChild(btn('Voltar', titleScreen, 'ok'));
}
function rollStats() { return Array.from({ length: 6 }, () => { const r = [0, 0, 0, 0].map(() => 1 + rnd(6)).sort((a, b) => a - b); return { v: r[1] + r[2] + r[3], r }; }); }
function createScreen(mode) {
  const st = { name: NAMES[rnd(NAMES.length)], gender: 'm', race: 'humano', cls: 'guerreiro', rolls: rollStats(), base: null, swap: null };
  const assign = () => { const vals = st.rolls.map(r => r.v).sort((a, b) => b - a); st.base = {}; CLASSES[st.cls].prio.forEach((s, i) => st.base[s] = vals[i]); };
  assign();
  const draw = () => {
    const wrap = h('div', 'create');
    wrap.innerHTML = `<h2>${mode === 'add' ? 'Novo Jogador' : mode === 'guest' ? 'Seu Herói na Mesa' : 'Criação de Personagem'}</h2>`;
    const nm = h('div', 'row'); nm.innerHTML = `<label>Nome</label>`; const inp = h('input'); inp.value = st.name; inp.maxLength = 14; inp.oninput = () => st.name = inp.value; nm.appendChild(inp); nm.appendChild(btn('🎲 Nome', () => { st.name = NAMES[rnd(NAMES.length)]; draw(); }, ''));
    const gb = h('div', 'seg'); [['m', 'Masculino'], ['f', 'Feminino']].forEach(([k, l]) => { gb.appendChild(btn(l, () => { st.gender = k; draw(); }, st.gender === k ? 'on' : '')); }); nm.appendChild(gb); wrap.appendChild(nm);
    wrap.appendChild(h('h3', '', 'Raça'));
    const rg = h('div', 'cards'); for (const k in RACES) { const c = h('div', 'pick' + (st.race === k ? ' on' : '')); c.appendChild(spriteCanvas(memberRecipe({ race: k, cls: st.cls, gender: st.gender }), 1.5)); c.appendChild(h('div', '', `<b>${RACES[k].nome}</b><small>${RACES[k].desc}</small>`)); c.onclick = () => { auInit(); sfx('select'); st.race = k; draw(); }; rg.appendChild(c); } wrap.appendChild(rg);
    wrap.appendChild(h('h3', '', 'Classe'));
    const cg = h('div', 'cards'); for (const k in CLASSES) { const C = CLASSES[k]; const c = h('div', 'pick' + (st.cls === k ? ' on' : '')); c.appendChild(spriteCanvas(memberRecipe({ race: st.race, cls: k, gender: st.gender }), 1.5)); c.appendChild(h('div', '', `<b>${C.nome}</b><small>${C.desc}<br>d${C.hd} PV • ${C.abil.filter(a => a[1] <= 3).map(a => AB[a[0]].nome).join(', ')}</small>`)); c.onclick = () => { auInit(); sfx('select'); st.cls = k; assign(); draw(); }; cg.appendChild(c); } wrap.appendChild(cg);
    wrap.appendChild(h('h3', '', 'Atributos <small>(4d6, descarta o menor — toque em dois para trocar)</small>'));
    const ag = h('div', 'stats'); const rb = RACES[st.race].bonus;
    STATS.forEach(s => { const tot = st.base[s] + (rb[s] || 0); const c = h('div', 'stat' + (st.swap === s ? ' on' : ''), `<small>${s}</small><b>${tot}</b><i>${sgn(mod(tot))}</i>${rb[s] ? `<em>+${rb[s]} raça</em>` : ''}`); c.onclick = () => { sfx('blip'); if (!st.swap) st.swap = s; else { const t = st.base[s]; st.base[s] = st.base[st.swap]; st.base[st.swap] = t; st.swap = null; } draw(); }; ag.appendChild(c); });
    wrap.appendChild(ag);
    wrap.appendChild(btn('🎲 Rolar de novo', () => { sfx('dice'); st.rolls = rollStats(); assign(); draw(); }, ''));
    const fin = {}; STATS.forEach(s => fin[s] = st.base[s] + (rb[s] || 0)); const m = newMember('hero', st.name || 'Herói', st.race, st.cls, st.gender, fin); const tmp = makeHeroUnit(m);
    wrap.appendChild(h('div', 'summary', `PV <b>${m.hpMax}</b> • PM <b>${m.mpMax}</b> • CA <b>${tmp.ac}</b> • Deslocamento <b>${tmp.move}</b>`));
    const label = mode === 'add' ? 'Adicionar ao grupo ▶' : mode === 'guest' ? 'Enviar herói para a mesa ▶' : mode === 'host' ? 'Abrir a mesa ▶' : 'Começar a aventura ▶';
    wrap.appendChild(btn(label, () => {
      m.name = (st.name || 'Herói').replace(/[<>]/g, '').trim().slice(0, 14) || 'Herói';
      if (mode === 'guest') return guestSendHero(m);
      if (mode === 'add') { m.key = 'p_' + Date.now().toString(36); m.pad = null; const target = avgLevel(); while (m.level < target) levelUp(m); m.xp = XP_LV[m.level]; G.party.splice(1, 0, m); saveGame(); return camp('jogadores'); }
      Object.assign(G, { ver: 2, party: [], gold: 50, items: { pocao: 2, eter: 1, fenix: 0, elixir: 0 }, chapter: 0, done: [] });
      G.party.push(m); const b = COMPANIONS.borin; G.party.push(newMember('borin', b.name, b.race, b.cls, b.gender, b.st));
      saveGame(); if (mode === 'host') return hostLobby(); playChapter(0, false);
    }, 'ok big'));
    wrap.appendChild(btn('← Voltar', mode === 'add' ? () => camp('jogadores') : mode === 'guest' ? guestLobby : mode === 'host' ? hostSetup : titleScreen, 'ghost'));
    const y = $('#screen').scrollTop; screen(wrap, 'panel-sc wide'); $('#screen').scrollTop = y;
  };
  draw();
}
let MAP_ERA = null;
function worldMap(eraId) {
  if (isGuest()) return; hud(false); HL = null; playSong('title');
  const nx = nextMain(); const curEra = eraId || MAP_ERA || (nx != null ? CHAPTERS[nx].era : 'fim'); MAP_ERA = curEra;
  const eraChs = CHAPTERS.map((c, i) => i).filter(i => CHAPTERS[i].era === curEra);
  const first = CHAPTERS[eraChs.find(i => isOpen(i)) ?? eraChs[0]]; S = { map: genMap(first.theme, first.seed), units: [], mapSeed: first.seed };
  netMenu('O líder está no mapa do mundo escolhendo o próximo destino.');
  const frag = Math.min(7, [0, 1, 3, 7, 10, 13, 16].filter(i => G.done.includes(i)).length);
  const wrap = h('div', 'world'); wrap.innerHTML = `<h2>Crônica das Eras</h2><div class="gold-line">💰 ${G.gold} po • 🧪 ${G.items.pocao} • 🔷 ${G.items.eter} • 🪶 ${G.items.fenix} • 💚 ${G.items.elixir || 0} • ✦ Fragmentos ${frag}/7</div>`;
  const tabs = h('div', 'eras');
  ERAS.forEach(e => { const any = CHAPTERS.some((c, i) => c.era === e.id && isOpen(i)); const b = btn(`${e.nome}<small>${e.sub}</small>`, () => { if (any) worldMap(e.id); }, (e.id === curEra ? 'on ' : '') + (any ? '' : 'lockedera')); if (!any) b.disabled = true; tabs.appendChild(b); });
  wrap.appendChild(tabs);
  const mp = h('div', 'parch'); mp.style.setProperty('--era', ERAS.find(e => e.id === curEra).cor);
  const mains = eraChs.filter(i => !CHAPTERS[i].side); let svg = '<svg viewBox="0 0 100 100" preserveAspectRatio="none">';
  for (let k = 0; k < mains.length - 1; k++) { const a = CHAPTERS[mains[k]].mapPos, b = CHAPTERS[mains[k + 1]].mapPos; svg += `<path d="M${a[0]} ${a[1]} Q ${(a[0] + b[0]) / 2 + 6} ${(a[1] + b[1]) / 2 + 6} ${b[0]} ${b[1]}" class="${G.done.includes(mains[k]) ? 'done' : ''}"/>`; }
  svg += '</svg>'; mp.innerHTML = svg + `<div class="era-title">${ERAS.find(e => e.id === curEra).nome}</div>`;
  const info = h('div', 'cinfo-box');
  const showNode = i => { const C = CHAPTERS[i]; const done = G.done.includes(i); info.innerHTML = `<b>${C.side ? '★ ' : 'Capítulo ' + mainNum(i) + ': '}${C.nome}</b><small>${C.sub} • nível sugerido ${C.lv} (grupo: ${avgLevel()})</small>`;
    if (!done) info.appendChild(btn('Partir ▶', () => playChapter(i, false), 'ok')); else { info.appendChild(btn('Rever a história', () => playChapter(i, false), '')); info.appendChild(btn('Treinar (só batalha)', () => playChapter(i, true), 'ok')); } };
  eraChs.forEach(i => { const C = CHAPTERS[i]; const open = isOpen(i); const n = h('div', 'node' + (C.side ? ' side' : '') + (G.done.includes(i) ? ' done' : '') + (open ? '' : ' locked') + (i === nx ? ' cur' : ''), G.done.includes(i) ? '✓' : C.side ? '★' : String(mainNum(i)));
    n.style.left = C.mapPos[0] + '%'; n.style.top = C.mapPos[1] + '%'; n.onclick = () => { if (!open) { sfx('cancel'); return; } sfx('select'); showNode(i); }; mp.appendChild(n); });
  wrap.appendChild(mp); wrap.appendChild(info);
  const pick = eraChs.find(i => i === nx) ?? eraChs.find(i => isOpen(i) && !G.done.includes(i)) ?? eraChs.find(i => isOpen(i));
  if (nx == null && !eraChs.some(i => isOpen(i) && !G.done.includes(i))) info.innerHTML = '<b>Você completou a saga!</b><small>Revisite capítulos para treinar e cumprir as missões secundárias.</small>'; else if (pick != null) showNode(pick);
  const row = h('div', 'row-btns'); row.appendChild(btn('⛺ Acampamento', () => camp())); row.appendChild(btn('💾 Salvar', saveGame)); row.appendChild(btn(isHost() ? 'Sair da mesa' : 'Título', isHost() ? leaveTable : titleScreen, 'ghost')); wrap.appendChild(row);
  if (isHost()) { const r2 = h('div', 'hint'); r2.textContent = `Mesa ${NET.code} • ${G.party.filter(m => m.owner && m.owner !== myId()).length} amigo(s) no grupo. Novos jogadores podem entrar com o código agora.`; wrap.appendChild(r2); addPending(); }
  screen(wrap, 'panel-sc wide');
}
function camp(tab = 'grupo') {
  if (isGuest()) return; netMenu('O grupo está acampando.');
  const wrap = h('div', 'camp'); wrap.innerHTML = `<h2>⛺ Acampamento</h2>`;
  const tabs = h('div', 'seg'); [['grupo', 'Grupo'], ['jogadores', 'Jogadores'], ['loja', 'Loja']].forEach(([k, l]) => tabs.appendChild(btn(l, () => camp(k), tab === k ? 'on' : ''))); wrap.appendChild(tabs);
  if (tab === 'grupo') G.party.forEach(m => {
    const u = makeHeroUnit(m); const c = h('div', 'member');
    c.appendChild(spriteCanvas(memberRecipe(m), 1.5));
    c.appendChild(h('div', 'minfo', `<b>${esc(m.name)}</b> <small>${RACES[m.race].nome} ${CLASSES[m.cls].nome} • Nv ${m.level}</small>
      ${bar(m.xp - XP_LV[m.level], XP_LV[Math.min(MAXLV, m.level + 1)] - XP_LV[m.level] || 1, 'xp')}
      <div class="mini">PV ${m.hpMax} • PM ${m.mpMax} • CA ${u.ac} • Mov ${u.move}</div>
      <div class="mini">${STATS.map(s => `${s} ${m.st[s]}(${sgn(mod(m.st[s]))})`).join(' · ')}</div>
      <div class="abl">${u.abil.map(a => `<span>${AB[a].nome}</span>`).join('')}</div>`));
    wrap.appendChild(c);
  });
  else if (tab === 'jogadores') {
    wrap.appendChild(h('p', '', 'Jogar no sofá: adicione heróis para os amigos e escolha qual controle comanda cada um. "Qualquer" = todos os controles, o teclado e o toque.'));
    G.party.forEach((m, idx) => { const r = h('div', 'member'); r.appendChild(spriteCanvas(memberRecipe(m), 1)); const info = h('div', 'minfo'); const b = h('b'); b.textContent = m.name; info.appendChild(b); info.appendChild(h('small', '', `${RACES[m.race].nome} ${CLASSES[m.cls].nome} • Nv ${m.level}${m.owner && m.owner !== myId() ? ' • jogador online' : ''}`)); r.appendChild(info);
      if (!m.owner || m.owner === myId()) r.appendChild(btn(m.pad == null ? '🎮 Qualquer' : `🎮 ${m.pad + 1}`, () => { m.pad = m.pad == null ? 0 : m.pad >= 3 ? null : m.pad + 1; saveGame(); camp('jogadores'); }, m.pad == null ? '' : 'on'));
      if (idx > 0 && !COMPANIONS[m.key]) r.appendChild(btn('Remover', () => { G.party.splice(idx, 1); saveGame(); camp('jogadores'); }, 'ghost'));
      wrap.appendChild(r); });
    if (G.party.length < 8) wrap.appendChild(btn('➕ Adicionar herói (novo jogador)', () => createScreen('add'), 'ok'));
  }
  else { wrap.appendChild(h('div', 'gold-line', `💰 ${G.gold} peças de ouro`)); SHOP.forEach(it => { const r = h('div', 'shop'); const f = frames(it.icon)[0]; const cv2 = mk(32, 32); const g = cv2.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(f.c, 0, 0, 32, 32); r.appendChild(cv2); r.appendChild(h('div', '', `<b>${it.nome}</b> <small>×${G.items[it.id] || 0} • ${it.desc}</small>`)); const b = btn(`${it.preco} po`, () => { if (G.gold < it.preco) { toast('Ouro insuficiente'); return; } G.gold -= it.preco; G.items[it.id] = (G.items[it.id] || 0) + 1; sfx('coin'); camp('loja'); }, 'ok'); if (G.gold < it.preco) b.disabled = true; r.appendChild(b); wrap.appendChild(r); }); }
  wrap.appendChild(btn('← Voltar ao mapa', () => worldMap(), 'ghost'));
  screen(wrap, 'panel-sc');
}
function credits() {
  return new Promise(res => {
    playSong('ending');
    const s = screen(`<h2>Crônicas do Relógio Partido</h2><p>Um RPG tático em homenagem a Final Fantasy Tactics e Chrono Trigger, com regras inspiradas em Dungeons &amp; Dragons 5ª edição. Eras e missões inspiradas em ideias clássicas de campanhas de RPG de mesa.</p>
    <h3>Créditos</h3><p>História, código, mapas, música e efeitos sonoros: criados para este jogo (música e sons sintetizados em tempo real).</p>
    <p>Personagens e monstros em 16 bits: <b>Liberated Pixel Cup (LPC)</b> e <b>Universal LPC Spritesheet Character Generator</b> — licenças CC-BY-SA 3.0 / GPL 3.0 / OGA-BY 3.0. Artistas: Benjamin K. Smith (BenCreating), Carlo Enrico Victoria (Nemisys), Daniel Eddeland (daneeklu), Durrani, Eliza Wyatt (ElizaWy), Evert, JaidynReiman, Joe White, Johannes Sjölund (wulax), LordNeo, Luke Mehl, Manuel Riecke (MrBeast), Marcel van de Steeg (MadMarcel), Matthew Krohn (makrohn), Michael Whitlock (bigbeargames), MuffinElZangano, Nila122, Pierre Vigier (pvigier), Sander Frenken (castelonia), Shaun Williams, Stephen Challener (Redshrike), Thane Brimhall (pennomi), TheraHedwig, Tuomo Untinen (reemax), William.Thompsonj, Zi Ye, bluecarrot16, gr3yh47, laetissima, tskaufma. Mais detalhes: github.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator.</p>
    <p>Itens e cenário: <b>16x16 DungeonTileset II</b>, por <b>0x72 (Robert)</b> — domínio público (CC0).</p>
    <p>Nenhum material original de Square Enix ou Wizards of the Coast foi usado.</p>`, 'panel-sc');
    s.appendChild(btn('Fechar', () => { hideScreen(); res(); }, 'ok'));
  });
}

// ---------- Entrada ----------
function setupInput() {
  let down = null;
  cv.addEventListener('pointerdown', e => { auInit(); down = { x: e.clientX, y: e.clientY, px: V.panX, py: V.panY, drag: false }; });
  cv.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.hypot(dx, dy) > 10) down.drag = true; if (down.drag) { V.manual = true; V.panX = clamp(down.px + dx * V.dpr / V.scale, -200, 200); V.panY = clamp(down.py + dy * V.dpr / V.scale, -150, 150); } });
  cv.addEventListener('pointerup', e => { if (!down) return; const wasDrag = down.drag; down = null; if (wasDrag || !S) return; const p = pickTile(e.clientX, e.clientY); if (PICK) PICK(p); else inspectAt(p); });
  $('#zoom').onclick = e => { e.stopPropagation(); V.zoom = V.zoom > 1 ? 1 : (innerWidth < 640 ? 1.45 : 1.6); V.panX = V.panY = 0; V.manual = false; resize(); sfx('blip'); };
  $('#fs').onclick = e => { e.stopPropagation(); toggleFull(); };
  $('#rot').onclick = e => { e.stopPropagation(); V.rot = (V.rot + 1) % 4; sfx('blip'); };
  $('#snd').onclick = e => { e.stopPropagation(); auInit(); const on = toggleSound(); $('#snd').textContent = on ? '🔊' : '🔇'; };
  $('#spd').onclick = e => { e.stopPropagation(); window.FAST = window.FAST === .45 ? 1 : .45; $('#spd').classList.toggle('on', window.FAST !== 1); sfx('blip'); };
  $('#chatbtn').onclick = e => { e.stopPropagation(); toggleChat(); };
  $('#mic').onclick = e => { e.stopPropagation(); micClick(); };
  $('#chatsend').onclick = e => { e.stopPropagation(); const i = $('#chatin'); if (i.value.trim()) { sendChat(i.value.trim()); i.value = ''; } };
  $('#chatin').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#chatsend').click(); } e.stopPropagation(); });
  $('#chatmic').onclick = e => { e.stopPropagation(); micClick(true); };
  addEventListener('resize', resize);
}
function loop(t) { try { pollPads(); render(); drawBubbles(); drawPreviews(t); hostTick(); } catch (e) { console.error(e); } requestAnimationFrame(loop); }
async function boot() {
  atlasImg.src = ATLAS_SRC; await new Promise(r => { if (atlasImg.complete) r(); else atlasImg.onload = r; });
  $('#app').prepend(cv); resize(); setupInput(); titleScreen(); requestAnimationFrame(loop);
  netInit().then(() => { if (NET.avail && $('#screen').classList.contains('title-sc')) titleScreen(); });
}
boot();
