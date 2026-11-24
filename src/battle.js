// ================= REGRAS E BATALHA TÁTICA =================
const nextFrame = () => new Promise(r => requestAnimationFrame(r));
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const keyOf = (x, y) => x + ',' + y;
function castMod(u) { if (u.team === 'E') return 3; const c = CLASSES[u.cls]; return c.cast ? mod(u.st[c.cast]) : mod(u.st.CON); }
function newMember(key, name, race, cls, gender, st) {
  const cl = CLASSES[cls]; const m = { key, name, race, cls, gender, spr: heroSprite(race, cls, gender), st: { ...st }, level: 1, xp: 0 };
  m.hpMax = cl.hd + 4 + mod(st.CON) + (race === 'anao' ? 1 : 0); m.mpMax = cl.mp + (cl.cast ? Math.max(0, mod(st[cl.cast])) : 0); return m;
}
function levelUp(m) {
  const cl = CLASSES[m.cls]; m.level++; const r = 1 + rnd(cl.hd); const gain = Math.max(1, r + mod(m.st.CON) + (m.race === 'anao' ? 1 : 0));
  m.hpMax += gain; m.mpMax += cl.mpLv; const notes = [`PV +${gain} (d${cl.hd}: ${r})`, `PM +${cl.mpLv}`];
  if (m.level === 4 || m.level === 8 || m.level === 12) { const s = m.level === 8 ? cl.prio[1] : cl.prio[0]; m.st[s] = Math.min(20, m.st[s] + 2); notes.push(`${s} +2`); }
  cl.abil.forEach(([a, l]) => { if (l === m.level) notes.push('Nova habilidade: ' + AB[a].nome); });
  if (m.level === 5) notes.push(m.cls === 'guerreiro' ? 'Ataque Extra! Proficiência +3' : 'Proficiência +3, truques mais fortes');
  if (m.level === 9) notes.push('Proficiência +4');
  if (m.level === 11) notes.push('Truques ainda mais fortes');
  return notes;
}
function baseUnit(o) { return Object.assign({ id: UID++, fx: -1, fy: 0, px: 0, py: 0, ph: 0, alpha: 1, visible: true, seed: rnd(100), used: {}, flash: 0 }, o); }
function makeHeroUnit(m) {
  const cl = CLASSES[m.cls]; const u = baseUnit({ key: m.key, name: m.name, team: 'A', member: m, cls: m.cls, race: m.race, level: m.level, st: m.st, k: animKeys(m.spr), spr: m.spr, weapon: cl.weapon });
  u.maxhp = m.hpMax; u.hp = m.hpMax; u.maxmp = m.mpMax; u.mp = u.maxmp; u.ac = cl.ac(u); u.move = cl.move + RACES[m.race].move; u.jump = cl.jump;
  u.rec = memberRecipe(m); u.spr = u.rec; u.weapon = null;
  u.prof = m.level >= 9 ? 4 : m.level >= 5 ? 3 : 2; u.atkStat = cl.atk; u.dmg = cl.dmg; u.range = cl.range; u.initMod = mod(m.st.DES);
  u.abil = ['atacar', ...cl.abil.filter(([, l]) => m.level >= l).map(a => a[0])]; const ra = RACES[m.race]; if (ra.ab) u.abil.push(ra.ab); if (ra.fly) { u.fly = 1; u.jump = 9; } u.abil.push('dupla');
  return u;
}
function makeShadow(m) {
  const h = makeHeroUnit(m); const d = { nome: 'Sombra de ' + m.name, fx: h.range > 1 ? 'arrow' : 'slash', dex: mod(m.st.DES), lv: m.level, xp: 300 + m.level * 60 };
  const u = baseUnit({ key: 'shadow', name: 'Sombra de ' + m.name, team: 'E', def: d, k: h.k, spr: h.rec + '|#dark', rec: h.rec + '|#dark', fx: 1 });
  Object.assign(u, { maxhp: Math.round(h.maxhp * .9), ac: h.ac, hit: h.prof + mod(m.st[h.atkStat]) + 1, dmg: dmgExpr(h, abInfo(h, 'atacar')), dmgB: 2, range: h.range, move: h.move, jump: h.jump, fly: h.fly, initMod: h.initMod, xp: d.xp, dc: 14, aura: '#6020a0' });
  u.hp = u.maxhp; return u;
}
function makeEnemy(id, boost) {
  const d = MON[id]; const u = baseUnit({ key: id, name: d.nome, team: 'E', def: d, k: animKeys(d.spr), spr: d.spr, fx: 1 });
  boost = Math.max(-2, boost); u.maxhp = Math.max(4, Math.round(d.hp * (1 + .22 * boost))); u.hp = u.maxhp; u.ac = d.ac + Math.floor(Math.max(0, boost) / 3); u.hit = d.hit + Math.floor(boost / 2); u.dmg = d.dmg; u.dmgB = Math.max(0, boost); u.ghost = d.ghost; u.dc = (d.dc || 12) + Math.floor(Math.max(0, boost) / 2); u.range = d.range || 1; u.move = d.move; u.jump = d.jump; u.fly = d.fly;
  u.initMod = d.dex; u.scale = d.scale || 1; { const r = LPC['m_' + id] ? 'm_' + id : LPC['m_' + d.spr] ? 'm_' + d.spr : null; if (r) { u.rec = r; u.spr = r; u.scale = d.scale && d.scale >= 2 ? d.scale : 1; } } u.aura = d.aura; u.boss = d.boss; u.undead = d.undead; u.xp = Math.round(d.xp * (1 + .25 * Math.max(0, boost)));
  return u;
}
const unitAt = (x, y) => S.units.find(u => u.visible && !u.dead && u.x === x && u.y === y);
const isActor = u => u.visible && !u.dead && !u.ko && (u.team === 'A' || u.team === 'E');
const foesOf = u => S.units.filter(o => isActor(o) && o.team !== u.team);
const alliesOf = u => S.units.filter(o => o.visible && !o.dead && o.team === u.team);
function place(u, c) { u.x = c.x; u.y = c.y; u.px = c.x; u.py = c.y; u.ph = tH(c.x, c.y); }
function nearestFree(x, y) {
  const all = S.map.g.flat().filter(c => walkable(S.map, c.x, c.y) && !unitAt(c.x, c.y)); all.sort((a, b) => (Math.abs(a.x - x) + Math.abs(a.y - y)) - (Math.abs(b.x - x) + Math.abs(b.y - y))); return all[0];
}
function face(u, x, y) { const dx = x - u.x, dy = y - u.y; if (!dx && !dy) return; if (Math.abs(dx) >= Math.abs(dy)) { u.fx = Math.sign(dx); u.fy = 0; } else { u.fx = 0; u.fy = Math.sign(dy); } }
const tH = (x, y) => { const c = tile(S.map, x, y); return c ? c.h : 0; };

// ---------- Movimento ----------
function reachable(u) {
  const res = new Map(); const start = { x: u.x, y: u.y, cost: 0, prev: null }; const q = [start]; const seen = new Map([[keyOf(u.x, u.y), start]]);
  while (q.length) {
    const c = q.shift(); if (c.cost >= u.move) continue;
    for (const [dx, dy] of DIRS) {
      const nx = c.x + dx, ny = c.y + dy, k = keyOf(nx, ny); if (seen.has(k)) continue; const t = tile(S.map, nx, ny); if (!t || !t.t) continue;
      const pass = walkable(S.map, nx, ny) || (u.fly && t.t); if (!pass) continue;
      if (!u.fly && Math.abs(t.h - tH(c.x, c.y)) > u.jump) continue;
      const o = unitAt(nx, ny); if (o && o.team !== u.team && !o.ko) continue;
      const n = { x: nx, y: ny, cost: c.cost + 1, prev: c }; seen.set(k, n); q.push(n);
      if (walkable(S.map, nx, ny) && !o) res.set(k, n);
    }
  }
  return res;
}
async function walkPath(u, node) {
  const path = []; for (let n = node; n; n = n.prev) path.unshift(n);
  u.moving = true;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i]; face(u, b.x, b.y); u.tx = b.x; u.ty = b.y; const ha = tH(a.x, a.y), hb = tH(b.x, b.y); const steps = 9;
    sfx('step');
    for (let s = 1; s <= steps; s++) { const k = s / steps; u.px = a.x + (b.x - a.x) * k; u.py = a.y + (b.y - a.y) * k; u.ph = ha + (hb - ha) * k; u.hop = Math.sin(k * Math.PI) * (Math.abs(hb - ha) * 5 + (u.fly ? 3 : 2)); await nextFrame(); }
    u.x = b.x; u.y = b.y;
  }
  u.hop = 0; u.moving = false; u.tx = u.ty = undefined; u.px = u.x; u.py = u.y; u.ph = tH(u.x, u.y);
}
function teleport(u, x, y) { u.x = x; u.y = y; u.px = x; u.py = y; u.ph = tH(x, y); }

// ---------- Cálculos de ataque ----------
function situ(a, t, ab) {
  let b = 0; const notes = []; const dh = tH(a.x, a.y) - tH(t.x, t.y);
  if (dh >= 1) { const v = dh >= 3 ? 2 : 1; b += v; notes.push('altura +' + v); }
  const dx = Math.sign(a.x - t.x), dy = Math.sign(a.y - t.y); const dot = dx * t.fx + dy * t.fy;
  if (dot < 0) { b += 2; notes.push('pelas costas +2'); } else if (dot === 0 && (dx || dy)) { b += 1; notes.push('flanco +1'); }
  return { b, notes, back: dot < 0 };
}
function abInfo(u, abKey) {
  // devolve definição efetiva da habilidade para a unidade
  const ab = { ...AB[abKey], key: abKey };
  if (abKey === 'atacar') { ab.range = u.range; ab.fx = u.team === 'E' ? (u.def.fx || (u.range > 1 ? 'dark' : 'slash')) : (u.range > 1 ? 'arrow' : 'slash'); }
  if (ab.range == null) ab.range = u.range;
  if (u.team === 'A' && ab.type === 'attack' && !ab.spell && ab.range > 1 && abKey !== 'giro') ab.range = Math.max(ab.range, u.range);
  return ab;
}
function hitBonus(u, ab) {
  if (u.team === 'E') return u.hit + (ab.hitMod || 0);
  const st = ab.spell ? CLASSES[u.cls].cast : u.atkStat; return u.prof + mod(u.st[st]) + (ab.hitMod || 0);
}
function dmgExpr(u, ab, target) {
  if (u.team === 'E') return u.dmg;
  const L5 = u.level >= 5, L11 = u.level >= 11;
  if (ab.key === 'raio') return L11 ? '3d10' : L5 ? '2d10' : '1d10';
  if (ab.key === 'rajada') return (L11 ? '3d10' : L5 ? '2d10' : '1d10') + (u.level >= 2 ? '+' + Math.max(0, castMod(u)) : '');
  if (ab.key === 'chamad') return L11 ? '3d8' : L5 ? '2d8' : '1d8';
  if (ab.key === 'zombaria') return L11 ? '3d6' : L5 ? '2d6' : '1d6';
  if (ab.key === 'chama') return L11 ? '3d8' : L5 ? '2d8' : '1d8';
  if (ab.key === 'chama') return (L5 ? '2d8' : '1d8') + (target && target.undead ? '' : '');
  if (ab.dmg) return ab.dmg + (ab.key === 'sopro' && u.level >= 3 ? '' : '');
  const d = parseDice(u.dmg); return `${d.n}d${d.s}+${Math.max(0, mod(u.st[u.atkStat]))}`;
}
function saveDC(u, ab) { if (u.team === 'E') return u.dc; return 8 + u.prof + (ab.key === 'sopro' ? mod(u.st.CON) : castMod(u)); }
function saveMod(t, stat) { if (t.team === 'E') return stat === 'DES' ? t.def.dex : t.boss ? 4 : 1; return mod(t.st[stat]); }
const friendly = ab => ab.type === 'heal' || ab.type === 'buff';
const hitChance = (bonus, ac) => clamp((21 - (ac - bonus)) / 20, .05, .95);
function sneakOK(u, t) { if (u.cls !== 'ladino' || u.sneakUsed) return false; const s = situ(u, t); if (s.back) return true; return S.units.some(o => isActor(o) && o.team === u.team && o !== u && dist(o, t) === 1); }
function areaTiles(x, y, r) { const out = []; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.abs(dx) + Math.abs(dy) <= r) { const c = tile(S.map, x + dx, y + dy); if (c && c.t) out.push(c); } return out; }
function targetsFor(u, ab, x, y) {
  if (ab.type === 'selfheal') return [u];
  if (ab.area) { const ts = areaTiles(ab.range === 0 ? u.x : x, ab.range === 0 ? u.y : y, ab.area).map(c => S.units.find(o => o.visible && !o.dead && o.team !== 'N' && o.x === c.x && o.y === c.y)).filter(Boolean);
    if (friendly(ab)) return ts.filter(o => o.team === u.team && (ab.type === 'heal' || !o.ko)); if (ab.key === 'giro') return ts.filter(o => o.team !== u.team && !o.ko); return ts.filter(o => o !== u && !o.ko); }
  const o = S.units.find(o => o.visible && !o.dead && o.team !== 'N' && o.x === x && o.y === y); if (!o) return [];
  if (friendly(ab)) return o.team === u.team && (ab.type === 'heal' || !o.ko) ? [o] : [];
  return o.team !== u.team && !o.ko ? [o] : [];
}
function rangeTiles(u, ab) {
  const out = new Map(); if (ab.range === 0 || ab.type === 'selfheal') { out.set(keyOf(u.x, u.y), '#ffcf40'); return out; }
  let R = ab.range; if (R > 1 && tH(u.x, u.y) >= 3) R++;
  const col = friendly(ab) ? '#4fe08a' : '#ff5050';
  S.map.g.flat().forEach(c => { if (!c.t) return; const d = Math.abs(c.x - u.x) + Math.abs(c.y - u.y); if (d >= (friendly(ab) ? 0 : 1) && d <= R) { if (R === 1 && Math.abs(c.h - tH(u.x, u.y)) > 3) return; out.set(keyOf(c.x, c.y), col); } });
  return out;
}
function partnerFor(u) { return S.units.filter(o => isActor(o) && o.team === 'A' && o !== u && dist(o, u) === 1).sort((a, b) => avgDice(dmgExpr(b, abInfo(b, 'atacar'))) - avgDice(dmgExpr(a, abInfo(a, 'atacar'))))[0]; }
function canUse(u, k) { const ab = AB[k]; if (u.mp < ab.mp) return false; if (ab.once && u.used[k]) return false; if (k === 'dupla' && !partnerFor(u)) return false; return true; }
function dualName(a, b) { const k = [a.cls, b.cls].sort().join('+'); return DUAL_NAMES[k] || DUAL_NAMES[[b.cls, a.cls].join('+')] || 'Ataque Sincronizado'; }

// ---------- Efeitos visuais de habilidades ----------
async function lunge(u, t) { playAnim(u, 'slash', 3); const [ax, ay] = unitScreen(u), [bx, by] = unitScreenOrTile(t); const dx = (bx - ax), dy = (by - ay); const L = Math.hypot(dx, dy) || 1;
  for (let i = 0; i <= 8; i++) { const k = Math.sin(i / 8 * Math.PI); u.ox = dx / L * 8 * k; u.oy = dy / L * 5 * k; u.swing = -k * 1.6; await nextFrame(); } u.ox = u.oy = 0; u.swing = 0; }
function burst(x, y, kind) {
  const c = { fire: '#ff7a30', fireball: '#ff6020', dark: '#a050ff', holy: '#fff2a0', missile: '#70e8ff', heal: '#7cffa0', slash: '#ffffff', arrow: '#ffe0a0', dual: '#ffffff' }[kind] || '#fff';
  if (kind === 'fireball') { emit(x, y, 60, { c: '#ff8030', sp: 2.2, life: 35, s: 2.5, ry: 6 }); emit(x, y, 30, { c: '#ffe070', sp: 1.2, life: 25, s: 2 }); emit(x, y, 20, { c: '#552222', sp: .8, vy: -.5, life: 50, s: 3, glow: 0 }); V.shake = 10; }
  else if (kind === 'holy') { for (let i = 0; i < 26; i++) emit(x + (Math.random() - .5) * 10, y - Math.random() * 50, 1, { c, sp: .2, vy: .5, life: 30, s: 2 }); emit(x, y, 20, { c, sp: 1.4, life: 25, s: 2 }); }
  else if (kind === 'heal') emit(x, y, 26, { c, sp: .5, vy: -.8, life: 40, s: 2, rx: 14, ry: 4 });
  else if (kind === 'dual') { emit(x, y, 50, { c: '#ffffff', sp: 2.5, life: 30, s: 2 }); emit(x, y, 40, { c: '#ffd040', sp: 1.6, life: 40, s: 2 }); emit(x, y, 30, { c: '#60c0ff', sp: 1.2, life: 40, s: 2 }); V.shake = 12; V.flash = 6; }
  else emit(x, y, kind === 'slash' ? 14 : 18, { c, sp: 1.6, life: 20, s: 1.8 });
}
async function castFx(u, t, kind) {
  if (kind === 'slash') { await lunge(u, t); sfx('slash'); return; }
  if (kind === 'arrow') { if (u.rec) { playAnim(u, 'shoot', 3); await sleep(300); } sfx('bow'); await projectile(u, t, 'arrow'); return; }
  if (u.rec) { playAnim(u, 'cast', 3); await sleep(180); }
  if (kind === 'heal' && t === u) { sfx('heal'); return; }
  sfx(kind === 'fire' || kind === 'fireball' ? 'fire' : kind === 'dark' ? 'dark' : kind === 'holy' ? 'holy' : kind === 'heal' ? 'heal' : 'magic');
  u.hop = 4; await sleep(120); u.hop = 0;
  if (kind === 'holy') return; await projectile(u, t, kind === 'missile' ? 'missile' : kind);
}

// ---------- Resolução ----------
async function damage(t, amt, crit, color) {
  t.hp -= amt; t.flash = 14; if (t.rec && t.hp > 0) playAnim(t, 'hurt', 3); const [sx, sy] = unitScreen(t); floatText(sx, sy - (t._h || 20), String(amt), crit ? '#ffd23a' : color || '#fff', crit);
  sfx(crit ? 'crit' : 'hit', t); if (crit) { V.shake = 10; V.flash = 4; }
  if (t.hp <= 0 && t.race === 'meioorc' && !t.used.implacavel) { t.used.implacavel = 1; t.hp = 1; floatText(sx, sy - 40, 'Implacável!', '#ff9a40', true); return; }
  if (t.hp <= 0) await down(t);
}
async function down(t) {
  t.hp = 0; const [sx, sy] = unitScreen(t);
  if (t.team === 'A') { t.ko = true; floatText(sx, sy - 34, 'Caído!', '#ff8080'); sfx('death', t); return; }
  t.dead = true; sfx('death', t); B.xp += t.xp || 0; emit(sx, sy - 10, 30, { c: '#bba', sp: 1, life: 40, s: 2, glow: 0 }); emit(sx, sy - 10, 14, { c: t.boss ? '#ffd040' : '#ff5050', sp: 1.3, life: 30, s: 2 });
  for (let i = 0; i < 20; i++) { t.alpha = 1 - i / 20; t.hop = i * .6; await nextFrame(); } t.visible = false;
  if (t.boss) { floatText(sx, sy - 30, 'DERROTADO!', '#ffd040', true); }
}
async function heal(t, amt) { if (t.ko) { t.ko = false; t.hp = 0; } t.hp = Math.min(t.maxhp, t.hp + amt); const [sx, sy] = unitScreen(t); floatText(sx, sy - (t._h || 20), '+' + amt, '#6dff9a'); burst(sx, sy - 6, 'heal'); }
async function useAbility(u, abKey, x, y) {
  if (abKey === 'dupla' && !partnerFor(u)) abKey = 'atacar';
  const ab = abInfo(u, abKey); const tile0 = { x, y };
  u.mp -= ab.mp || 0; if (ab.once) u.used[abKey] = 1;
  if (!(ab.range === 0 || ab.type === 'selfheal')) face(u, x, y);
  let partner = null; let title = ab.nome;
  if (abKey === 'dupla') { partner = partnerFor(u); title = '★ ' + dualName(u, partner) + ' ★'; face(partner, x, y); }
  if (abKey !== 'atacar') banner(title, u.team);
  const targets = targetsFor(u, ab, x, y);
  // animação de lançamento
  const fxKind = ab.fx || 'slash';
  if (abKey === 'dupla') { sfx('magic'); playAnim(u, 'cast', 3); playAnim(partner, 'cast', 3); partner.hop = 6; u.hop = 6; await sleep(160); partner.hop = 0; u.hop = 0; await Promise.all([projectile(u, tile0, 'dual'), projectile(partner, tile0, 'dual')]); }
  else if (ab.area && fxKind === 'fireball') { await castFx(u, tile0, 'fireball'); }
  else if (ab.key === 'giro') { sfx('slash'); const f0 = u.fx, f1 = u.fy; for (let i = 0; i < 4; i++) { [u.fx, u.fy] = [[1, 0], [0, 1], [-1, 0], [0, -1]][i]; await playAnim(u, 'slash', 2); } u.fx = f0; u.fy = f1; }
  else if (friendly(ab) && ab.area) { playAnim(u, 'cast', 3); sfx(ab.type === 'buff' ? 'holy' : 'heal'); await sleep(250); }
  else if (ab.type === 'buff') { playAnim(u, 'cast', 3); sfx('magic'); await sleep(250); }
  else if (targets[0] || ab.area) await castFx(u, targets[0] || tile0, fxKind === 'slash' && ab.range > 1 ? 'arrow' : fxKind);
  if (ab.area) { const ct = ab.range === 0 ? u : tile0; const [sx, sy] = unitScreenOrTile(ct); if (fxKind === 'fireball') { sfx('boom'); burst(sx, sy, 'fireball'); } else if (!friendly(ab)) areaTiles(ct.x, ct.y, ab.area).forEach(c => { const [a, b] = toScreen(c.x, c.y, c.h); burst(a, b - 4, fxKind); }); }
  if (!targets.length) { if (!ab.area) { const [sx, sy] = unitScreenOrTile(tile0); floatText(sx, sy - 10, 'Nada!', '#aaa'); } await sleep(300); return; }
  const single = targets.length === 1;
  for (const t of targets) {
    const [sx, sy] = unitScreen(t);
    if (ab.type === 'heal' || ab.type === 'selfheal') { sfx('heal'); await heal(t, rollDice(ab.heal, u)); continue; }
    if (ab.type === 'buff') {
      if (ab.key === 'inspirar') { t.insp = rollDice('1d6'); floatText(sx, sy - (t._h || 20), 'Inspirado +' + t.insp, '#ffe14a'); }
      if (ab.key === 'aura') { if (!t.acT) { t.acB = 2; t.ac += 2; } t.acT = 2; floatText(sx, sy - (t._h || 20), 'CA +2', '#9fd4ff'); }
      emit(sx, sy - 12, 18, { c: '#ffe9a0', sp: .6, vy: -.6, life: 40, s: 2 }); await sleep(250); continue;
    }
    if (ab.type === 'attack') {
      const nh = ab.hits || 1;
      for (let hi = 0; hi < nh; hi++) {
        if (t.dead || t.ko) break;
        if (hi > 0) { await castFx(u, t, fxKind === 'slash' && ab.range > 1 ? 'arrow' : fxKind); }
        const sit = situ(u, t, ab); let bonus = hitBonus(u, ab) + sit.b; const notes = sit.notes.slice();
        if (u.insp) { bonus += u.insp; notes.push('inspiração +' + u.insp); u.insp = 0; }
        if (u.dis) { bonus -= u.dis; notes.push('zombado −' + u.dis); u.dis = 0; }
        const d20 = 1 + rnd(20);
        const total = d20 + bonus; const hit = d20 === 20 || (d20 !== 1 && total >= t.ac); const crit = d20 === 20;
        if (single) await diceRoll({ d20, bonus, vs: t.ac, vsLabel: 'CA', ok: hit, crit, notes, who: u.name + ' → ' + t.name + (nh > 1 ? ` (${hi + 1}/${nh})` : '') });
        if (!hit) { floatText(sx, sy - (t._h || 20), 'Errou', '#b8c4ff'); sfx('miss'); t.ox = 4; await sleep(120); t.ox = 0; continue; }
        burst(sx, sy - 10, fxKind);
        let amt = rollDice(dmgExpr(u, ab, t), u, crit); if (ab.extra) amt += rollDice(ab.extra, u, crit); if (ab.undeadExtra && t.undead) amt += rollDice(ab.undeadExtra, u, crit);
        if (sneakOK(u, t)) { const n = Math.ceil(u.level / 2) + 1; amt += rollDice(n + 'd6', u, crit); u.sneakUsed = true; floatText(sx, sy - 44, 'Ataque Furtivo!', '#ffb0ff'); }
        if (u.cls === 'guerreiro' && u.level >= 5 && abKey === 'atacar') amt += rollDice(dmgExpr(u, ab, t), u);
        await damage(t, amt, crit);
        if (ab.drain && amt > 0) await heal(u, Math.ceil(amt / 2));
        if (ab.stun && !t.dead && !t.ko) { const ok = 1 + rnd(20) + saveMod(t, ab.stun) >= saveDC(u, ab); if (!ok) { t.stopped = 1; floatText(sx, sy - 46, 'Atordoado!', '#ffe14a'); sfx('crit'); } else floatText(sx, sy - 46, 'Resistiu', '#b8c4ff'); }
        await sleep(nh > 1 ? 150 : 0);
      }
    } else if (ab.type === 'save') {
      const dc = saveDC(u, ab); const d20 = 1 + rnd(20); const sm = saveMod(t, ab.save); const ok = d20 + sm >= dc;
      if (single) await diceRoll({ d20, bonus: sm, vs: dc, vsLabel: 'CD', ok: !ok, save: true, who: t.name + ' resiste (' + ab.save + ')' });
      burst(sx, sy - 10, fxKind);
      if (ab.stop) { if (!ok) { t.stopped = 1; floatText(sx, sy - 34, 'Hipnotizado!', '#d0a8ff'); } else floatText(sx, sy - 34, 'Resistiu', '#b8c4ff'); continue; }
      if (ab.debuff && !ok) { t.dis = ab.debuff; floatText(sx, sy - 46, '−' + ab.debuff + ' no ataque', '#d0a8ff'); }
      let amt = rollDice(dmgExpr(u, ab, t), u); if (ab.key === 'chama' && t.undead) amt += rollDice(u.level >= 5 ? '2d8' : '1d8'); if (ab.key === 'sopro') amt += rollDice(Math.floor(u.level / 2) + 'd6');
      if (ok) { amt = Math.floor(amt / 2); floatText(sx, sy - 40, 'Resistiu', '#b8c4ff'); }
      await damage(t, amt, false, '#ffb070');
    } else if (ab.type === 'auto') {
      burst(sx, sy - 10, fxKind); let amt = abKey === 'dupla' ? rollDice(dmgExpr(u, abInfo(u, 'atacar')), u) + rollDice(dmgExpr(partner, abInfo(partner, 'atacar')), partner) + rollDice('1d8') : rollDice(ab.dmg, u);
      await damage(t, amt, abKey === 'dupla');
    }
    await sleep(single ? 200 : 90);
  }
  await sleep(250);
}
// habilidades especiais de inimigos
async function enemyAttack(u, t) {
  face(u, t.x, t.y); const kind = u.def.fx || (u.range > 1 ? 'dark' : 'slash');
  await castFx(u, t, kind);
  const sit = situ(u, t); let bonus = u.hit + sit.b; if (u.dis) { bonus -= u.dis; sit.notes.push('zombado −' + u.dis); u.dis = 0; } const d20 = 1 + rnd(20); const total = d20 + bonus; const hit = d20 === 20 || (d20 !== 1 && total >= t.ac); const crit = d20 === 20;
  await diceRoll({ d20, bonus, vs: t.ac, vsLabel: 'CA', ok: hit, crit, notes: sit.notes, who: u.name + ' → ' + t.name, enemy: true });
  const [sx, sy] = unitScreen(t);
  if (!hit) { floatText(sx, sy - (t._h || 20), 'Errou', '#b8c4ff'); sfx('miss'); return; }
  burst(sx, sy - 10, kind); const amt = rollDice(u.dmg, u, crit) + (u.dmgB || 0); await damage(t, amt, crit, '#ff9090'); if (u.def.drain) await heal(u, Math.ceil(amt / 2));
}
async function enemySave(u, cx, cy, r, dmg, dc, name, kind) {
  banner(name, 'E'); face(u, cx, cy); await castFx(u, { x: cx, y: cy }, kind === 'fireball' ? 'fireball' : 'dark'); const [bx, by] = unitScreenOrTile({ x: cx, y: cy }); sfx('boom'); burst(bx, by, 'fireball');
  if (kind !== 'fireball') areaTiles(cx, cy, r).forEach(c => { const [a, b] = toScreen(c.x, c.y, c.h); emit(a, b - 4, 10, { c: '#b070ff', sp: 1, life: 30, s: 2 }); });
  const ts = areaTiles(cx, cy, r).map(c => S.units.find(o => isActor(o) && o.team === 'A' && o.x === c.x && o.y === c.y)).filter(Boolean);
  for (const t of ts) { const ok = 1 + rnd(20) + mod(t.st.DES) >= dc; let a = rollDice(dmg) + (u.dmgB || 0); if (ok) a = Math.floor(a / 2); const [sx, sy] = unitScreen(t); if (ok) floatText(sx, sy - 40, 'Resistiu', '#b8c4ff'); await damage(t, a, false, '#ffb070'); await sleep(80); }
  await sleep(300);
}
function bestArea(u, r, range) {
  let best = null; S.map.g.flat().forEach(c => { if (!c.t || dist(c, u) > range) return; const tiles = areaTiles(c.x, c.y, r); let n = 0, bad = 0; tiles.forEach(tc => { const o = S.units.find(o => isActor(o) && o.x === tc.x && o.y === tc.y); if (o) { if (o.team === 'A') n++; else bad++; } }); const sc = n - bad * 1.5; if (n && (!best || sc > best.sc)) best = { x: c.x, y: c.y, sc, n }; }); return best;
}
async function bossSpecial(u) {
  const d = u.def;
  if (d.raise && u.hp < u.maxhp / 2 && !u.used.raise) { u.used.raise = 1; banner('Erguer os Mortos', 'E'); sfx('dark'); for (let i = 0; i < 2; i++) { const c = nearestFree(u.x + (i ? 1 : -1), u.y + 1); if (!c) break; const s = makeEnemy(typeof d.raise === 'string' ? d.raise : 'esq', Math.max(0, (S.lv || 1) - (MON[typeof d.raise === 'string' ? d.raise : 'esq'].lv || 1))); s.xp = 30; place(s, c); s.alpha = 0; S.units.push(s); const [sx, sy] = toScreen(c.x, c.y, c.h); emit(sx, sy, 30, { c: '#a050ff', sp: 1, vy: -.6, life: 40, s: 2 }); for (let k = 0; k < 15; k++) { s.alpha = k / 15; await nextFrame(); } s.alpha = 1; } await sleep(400); return true; }
  if (d.breath && (u.used.cool || 0) <= 0) { const b = bestArea(u, 1, 3); if (b && b.n >= 2) { u.used.cool = 2; await enemySave(u, b.x, b.y, 1, d.breath, u.dc, d.fx === 'fire' ? 'Torrente de Chamas' : 'Sopro Devastador', 'fireball'); return true; } }
  if (d.rewind && u.hp < u.maxhp * .4 && !u.used.rewind) { u.used.rewind = 1; banner('Rebobinar o Tempo', 'E'); sfx('portal'); const [sx, sy] = unitScreen(u); emit(sx, sy - 14, 50, { c: '#f2c94c', sp: 1.5, life: 50, s: 2 }); await heal(u, 30); await sleep(500); return true; }
  if (d.warp && (u.used.cool || 0) <= 0) { const b = bestArea(u, 1, 5); if (b && b.n >= 2) { u.used.cool = 2; await enemySave(u, b.x, b.y, 1, d.warp, u.dc, 'Distorção Temporal', 'dark'); return true; } }
  if (d.stop && (u.used.stopc || 0) <= 0) { const ts = foesOf(u).filter(t => dist(t, u) <= 5 && !t.stopped); if (ts.length) { const t = ts[rnd(ts.length)]; u.used.stopc = 3; banner(d.boss && u.key === 'valdrek' ? 'Olhar Hipnótico' : d.boss && u.key === 'drowp' ? 'Teia de Sombras' : 'Parar o Tempo', 'E'); sfx('portal'); face(u, t.x, t.y); await projectile(u, t, 'dark'); const d20 = 1 + rnd(20), sm = mod(t.st.SAB); const ok = d20 + sm >= u.dc; await diceRoll({ d20, bonus: sm, vs: u.dc, vsLabel: 'CD', ok, who: t.name + ' resiste (SAB)' }); const [sx, sy] = unitScreen(t); if (!ok) { t.stopped = 1; floatText(sx, sy - 34, 'Congelado no tempo!', '#c8a8ff'); } else floatText(sx, sy - 34, 'Resistiu!', '#b8c4ff'); return false; } }
  return false;
}
function distMap(u) { // distância a partir dos heróis
  const dm = new Map(); const q = []; foesOf(u).forEach(f => { dm.set(keyOf(f.x, f.y), 0); q.push(f); });
  while (q.length) { const c = q.shift(); const cd = dm.get(keyOf(c.x, c.y)); for (const [dx, dy] of DIRS) { const nx = c.x + dx, ny = c.y + dy, k = keyOf(nx, ny); if (dm.has(k)) continue; const t = tile(S.map, nx, ny); if (!t || !t.t) continue; if (!(walkable(S.map, nx, ny) || u.fly)) continue; if (!u.fly && Math.abs(t.h - tH(c.x, c.y)) > u.jump) continue; dm.set(k, cd + 1); q.push({ x: nx, y: ny }); } }
  return dm;
}
async function aiTurn(u) {
  B.ai = true; await sleep(300);
  if (u.used.cool > 0) u.used.cool--; if (u.used.stopc > 0) u.used.stopc--;
  const acted0 = await bossSpecial(u); if (acted0) { B.ai = false; return; }
  const reach = reachable(u); const opts = [{ x: u.x, y: u.y, node: null }, ...[...reach.values()].map(n => ({ x: n.x, y: n.y, node: n }))];
  // curandeiro
  if (u.def.healer && !u.used.heal) { const hurt = alliesOf(u).filter(o => isActor(o) && o.hp < o.maxhp * .5).sort((a, b) => a.hp / a.maxhp - b.hp / b.maxhp)[0]; if (hurt) { const spot = opts.filter(o => dist(o, hurt) <= 3).sort((a, b) => dist(a, u) - dist(b, u))[0]; if (spot) { if (spot.node) await walkPath(u, spot.node); u.used.heal = 1; banner('Cura Tribal', 'E'); face(u, hurt.x, hurt.y); sfx('heal'); await heal(hurt, rollDice(u.def.healer)); await sleep(400); B.ai = false; return; } } }
  let best = null;
  for (const o of opts) for (const f of foesOf(u)) {
    const d = Math.abs(o.x - f.x) + Math.abs(o.y - f.y); if (d < 1 || d > u.range) continue; if (u.range === 1 && Math.abs(tH(o.x, o.y) - tH(f.x, f.y)) > 3) continue;
    const sit = situ(o, f); const p = hitChance(u.hit + sit.b, f.ac); const ex = p * avgDice(u.dmg); let sc = ex + (avgDice(u.dmg) >= f.hp ? 12 * p : 0) + (1 - f.hp / f.maxhp) * 4 + (u.range > 1 ? d * .4 : 0) - (o.node ? o.node.cost * .05 : 0);
    if (!best || sc > best.sc) best = { o, f, sc };
  }
  if (best) { if (best.o.node) await walkPath(u, best.o.node); await enemyAttack(u, best.f); }
  else { const dm = distMap(u); let bo = null, bd = 1e9; for (const o of opts) { const v = dm.get(keyOf(o.x, o.y)); if (v != null && v < bd) { bd = v; bo = o; } } if (bo && bo.node) await walkPath(u, bo.node); else if (!bo) { const nearest = foesOf(u).sort((a, b) => dist(a, u) - dist(b, u))[0]; const o2 = opts.sort((a, b) => dist(a, nearest) - dist(b, nearest))[0]; if (o2 && o2.node) await walkPath(u, o2.node); } if (foesOf(u)[0]) { const n = foesOf(u).sort((a, b) => dist(a, u) - dist(b, u))[0]; face(u, n.x, n.y); } }
  await sleep(200); B.ai = false;
}

// ---------- Turno do jogador ----------
async function autoAlly(u) { // usado só em testes automáticos
  const reach = reachable(u); const opts = [{ x: u.x, y: u.y, node: null }, ...[...reach.values()].map(n => ({ x: n.x, y: n.y, node: n }))];
  const hurt = S.units.find(o => o.team === 'A' && o.visible && (o.ko || o.hp < o.maxhp * .4));
  if (hurt && u.abil.includes('palavra') && canUse(u, 'palavra')) { const o = opts.find(o => dist(o, hurt) <= 4); if (o) { if (o.node) await walkPath(u, o.node); return useAbility(u, hurt.ko ? 'palavra' : 'palavra', hurt.x, hurt.y); } }
  let best = null;
  for (const k of u.abil) { const ab = abInfo(u, k); if (!canUse(u, k) || ab.type === 'heal' || ab.type === 'selfheal' || ab.type === 'buff' || ab.stop || ab.range === 0 || ab.area) continue;
    for (const o of opts) for (const f of foesOf(u)) { const d = dist(o, f); if (d >= 1 && d <= ab.range) { const sc = avgDice(ab.type === 'auto' && ab.dmg ? ab.dmg : dmgExpr(u, ab, f), u) - (ab.mp || 0) * .5 - f.hp * .1; if (!best || sc > best.sc) best = { o, f, k, sc }; } } }
  if (best) { if (best.o.node) await walkPath(u, best.o.node); await useAbility(u, best.k, best.f.x, best.f.y); return; }
  const dm = distMap(u); let bo = null, bd = 1e9; for (const o of opts) { const v = dm.get(keyOf(o.x, o.y)); if (v != null && v < bd) { bd = v; bo = o; } } if (bo && bo.node) await walkPath(u, bo.node);
}
async function playerTurn(u, remote) {
  if (!remote && isHost() && u.member && u.member.owner && u.member.owner !== myId()) { const r = await remoteTurn(u); if (r === 'done') { HL = null; return; } }
  if (window.AUTOBATTLE && !remote) return autoAlly(u);
  // execução local (ou envio ao líder quando este aparelho é convidado)
  const X = remote || {
    move: async n => { await walkPath(u, n); return true; },
    undo: async () => true,
    act: async (k, x, y) => { await useAbility(u, k, x, y); return true; },
    item: async (id, x, y) => { const t = S.units.find(o => o.team === 'A' && o.x === x && o.y === y); if (!t) return false; await useItem(t, id); return true; },
    end: async () => {},
  };
  let moved = false, acted = false; const origin = { x: u.x, y: u.y, fx: u.fx, fy: u.fy };
  const pad = u.member && u.member.pad != null ? ` 🎮${u.member.pad + 1}` : '';
  while (!(moved && acted)) {
    showUnitCard(u);
    const opts = [];
    if (!moved) opts.push({ id: 'mover', label: '👣 Mover' }); else if (!acted) opts.push({ id: 'desfazer', label: '↶ Voltar' });
    if (!acted) { opts.push({ id: 'agir', label: '⚔ Agir' }); opts.push({ id: 'item', label: '🧪 Item', disabled: !Object.values(G.items).some(v => v > 0) }); }
    opts.push({ id: 'esperar', label: '⏳ Encerrar' });
    const ch = await choose(opts, esc(u.name) + pad + ' — o que fazer?');
    if (ch === 'esperar') { await X.end(); break; }
    if (ch === 'desfazer') { if (await X.undo()) { if (!remote) { teleport(u, origin.x, origin.y); u.fx = origin.fx; u.fy = origin.fy; } moved = false; sfx('cancel'); } continue; }
    if (ch === 'mover') {
      const r = reachable(u); const tiles = new Map(); r.forEach((n, k) => tiles.set(k, '#5cc0ff')); tiles.set(keyOf(u.x, u.y), '#5cc0ff');
      const p = await pickTileUI(tiles, 'Toque num quadrado azul para mover');
      if (p && !(p.x === u.x && p.y === u.y)) { if (await X.move(r.get(keyOf(p.x, p.y)))) moved = true; }
      continue;
    }
    if (ch === 'item') { const ok = await itemMenu(u, X); if (ok) acted = true; continue; }
    if (ch === 'agir') {
      const abOpts = u.abil.map(k => { const a = AB[k]; return { id: k, label: a.nome + (a.mp ? ` (${a.mp} PM)` : a.once ? ' (1x)' : ''), disabled: !canUse(u, k), desc: a.desc }; });
      abOpts.push({ id: 'back', label: '← Voltar', cls: 'ghost' });
      const k = await choose(abOpts, 'Escolha uma ação');
      if (k === 'back') continue;
      const ab = abInfo(u, k);
      if (ab.type === 'selfheal') { const c = await confirmUI(`${ab.nome}: ${ab.desc}`); if (c && await X.act(k, u.x, u.y)) acted = true; continue; }
      const tiles = rangeTiles(u, ab);
      const target = await pickTargetUI(u, ab, tiles);
      if (target && await X.act(k, target.x, target.y)) acted = true;
      continue;
    }
  }
  HL = null;
}
async function useItem(t, id) {
  G.items[id]--; banner(SHOP.find(s => s.id === id).nome, 'A'); sfx('heal');
  if (id === 'pocao') await heal(t, rollDice('2d4+4')); else if (id === 'elixir') await heal(t, rollDice('6d8+10')); else if (id === 'eter') { t.mp = Math.min(t.maxmp, t.mp + 4); const [sx, sy] = unitScreen(t); floatText(sx, sy - 24, '+4 PM', '#7fb4ff'); burst(sx, sy - 8, 'missile'); } else await heal(t, Math.ceil(t.maxhp / 2));
  await sleep(400);
}
function previewText(u, ab, x, y) {
  const ts = targetsFor(u, ab, x, y); const lines = [];
  if (!ts.length) return { html: ab.area ? '<i>Nenhum alvo na área</i>' : '<i>Escolha um alvo válido</i>', ok: !!ab.area && false };
  const friendlyHit = ts.filter(t => t.team === u.team && !friendly(ab));
  ts.slice(0, 4).forEach(t => {
    if (ab.type === 'heal') lines.push(`<b>${esc(t.name)}</b> PV ${t.hp}/${t.maxhp} → cura ${ab.heal.replace('M', castMod(u)).replace('L', u.level)}`);
    else if (ab.type === 'buff') lines.push(`<b>${esc(t.name)}</b> → ${ab.key === 'aura' ? 'CA +2 por 2 turnos' : '+1d6 no próximo ataque'}`);
    else if (ab.type === 'attack') { const s = situ(u, t); const b = hitBonus(u, ab) + s.b; const p = Math.round(hitChance(b, t.ac) * 100); lines.push(`<b>${esc(t.name)}</b> CA ${t.ac} • PV ${t.hp}/${t.maxhp}<br>d20${sgn(b)} → <b class="${p >= 60 ? 'g' : p >= 35 ? 'y' : 'r'}">${p}%</b> • dano ${dmgExpr(u, ab, t)}${ab.extra ? '+' + ab.extra : ''}${sneakOK(u, t) ? ' +furtivo' : ''}${s.notes.length ? '<br><small>' + s.notes.join(', ') + '</small>' : ''}`); }
    else if (ab.type === 'save') lines.push(`<b>${esc(t.name)}</b> PV ${t.hp}/${t.maxhp} • resiste ${ab.save} vs CD ${saveDC(u, ab)} • ${ab.stop ? 'perde o turno se falhar' : 'dano ' + dmgExpr(u, ab, t)}`);
    else if (ab.type === 'auto') { const p = ab.key === 'dupla' ? partnerFor(u) : null; lines.push(`<b>${esc(t.name)}</b> PV ${t.hp}/${t.maxhp} • acerto garantido${p ? `<br>com <b>${esc(p.name)}</b>: ${dualName(u, p)}` : ` • dano ${ab.dmg}`}`); }
  });
  if (ts.length > 4) lines.push(`+${ts.length - 4} alvos`);
  if (friendlyHit.length) lines.push('<b class="r">⚠ Atinge aliados!</b>');
  return { html: lines.join('<hr>'), ok: true };
}
