// ================= MESA ONLINE FORA DO CLAUDE: Firebase Realtime Database + voz ao vivo (WebRTC) =================
// Implementa a mesma interface usada em net.js (room / db / dictation / tts), para o jogo rodar igual em qualquer página.
const FB_CFG = {
  apiKey: 'AIzaSyCVp6JDPsO8pPpchUdOcqTHgKd3AKMzVwY',
  authDomain: 'cronicas-do-relogio-partido.firebaseapp.com',
  databaseURL: 'https://cronicas-do-relogio-partido-default-rtdb.firebaseio.com',
  projectId: 'cronicas-do-relogio-partido',
  storageBucket: 'cronicas-do-relogio-partido.firebasestorage.app',
  messagingSenderId: '285689423513',
  appId: '1:285689423513:web:071c3e2dd56d54d28cba08'
};
const FB_VER = '10.12.2';
let FBP = null;
function fbLoad() {
  if (!FBP) FBP = (async () => {
    const A = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app.js`);
    const D = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-database.js`);
    const app = A.initializeApp(FB_CFG); const db = D.getDatabase(app);
    let off = 0; D.onValue(D.ref(db, '.info/serverTimeOffset'), s => { off = s.val() || 0; });
    return { D, db, now: () => Date.now() + off };
  })();
  return FBP;
}
const FB_ID = () => 'k' + Math.random().toString(36).slice(2, 10);

// ---------- sala em tempo real ----------
async function fbJoin(name) {
  const { D, db, now } = await fbLoad();
  const safe = String(name).toLowerCase().replace(/[^a-z0-9-]/g, '');
  const base = 'salas/' + safe, me = FB_ID();
  const evRef = D.ref(db, base + '/ev'), peersRef = D.ref(db, base + '/peers'), meRef = D.ref(db, base + '/peers/' + me);
  const listeners = {}, peerCbs = []; let pres = {}, list = [], unsub = [];
  await D.set(meRef, { by: myId(), presence: pres, at: D.serverTimestamp() });
  D.onDisconnect(meRef).remove();
  const start = now() - 500;
  unsub.push(D.onChildAdded(D.query(evRef, D.orderByChild('ts'), D.startAt(start)), snap => {
    const m = snap.val(); if (!m || !m.t) return; let data = null; try { data = JSON.parse(m.d); } catch (e) {}
    const self = m.peer === me;
    (listeners[m.t] || []).forEach(f => { try { f({ topic: m.t, data, peer: m.peer, by: m.by, isMe: self, sameTab: self, kind: 'viewer', guest: false }); } catch (e) { console.warn(e); } });
  }));
  unsub.push(D.onValue(peersRef, snap => {
    const v = snap.val() || {}; const prev = new Set(list.map(p => p.peer));
    list = Object.keys(v).map(k => ({ peer: k, by: v[k].by, presence: v[k].presence || {}, isMe: k === me, sameTab: k === me, kind: 'viewer', updatedAt: v[k].at }));
    const cur = new Set(list.map(p => p.peer));
    const ch = { peers: list, joined: list.filter(p => !prev.has(p.peer)), left: [...prev].filter(k => !cur.has(k)).map(k => ({ peer: k })), updated: list };
    peerCbs.forEach(f => { try { f(ch); } catch (e) { console.warn(e); } });
    if (typeof VOICE !== 'undefined') VOICE.sync();
  }));
  // limpeza: quem lidera a mesa apaga mensagens com mais de 40 s (a sala não cresce sem parar)
  const clean = setInterval(async () => {
    if (typeof isHost === 'function' && !isHost()) return;
    try { const old = await D.get(D.query(evRef, D.orderByChild('ts'), D.endAt(now() - 40000))); const upd = {}; old.forEach(c => { upd[c.key] = null; }); if (Object.keys(upd).length) await D.update(evRef, upd); } catch (e) {}
  }, 15000);
  const tab = {
    name: safe,
    emit(t, d) { return D.push(evRef, { t, d: JSON.stringify(d === undefined ? null : d), peer: me, by: myId(), ts: D.serverTimestamp() }); },
    on(t, f) { (listeners[t] = listeners[t] || []).push(f); return () => { listeners[t] = listeners[t].filter(x => x !== f); }; },
    presence(p) { pres = Object.assign({}, pres, p); return D.update(meRef, { presence: pres, by: myId() }); },
    peers() { return list; },
    onPeers(f) { peerCbs.push(f); return () => {}; },
    connected() { return true; }, onConnection() { return () => {}; },
    async leave() { VOICE.stop(); clearInterval(clean); unsub.forEach(u => { try { u(); } catch (e) {} }); try { await D.remove(meRef); } catch (e) {} },
    _fb: { D, db, base, me }
  };
  return tab;
}
const FB_ROOM = { join: fbJoin };

// ---------- mesa salva ----------
const FB_DB = { doc(path) { return {
  async set(obj) { const { D, db } = await fbLoad(); return D.set(D.ref(db, path), obj); },
  async get() { const { D, db } = await fbLoad(); const s = await D.get(D.ref(db, path)); return s.exists() ? s.val() : null; }
}; } };

// ---------- ditado (fala → texto) com o reconhecimento de voz do navegador ----------
function makeDictation() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return null;
  let rec = null, finalCb = () => {}, stateCb = () => {};
  return {
    onFinal(f) { finalCb = f; }, onState(f) { stateCb = f; },
    start() { return new Promise((res, rej) => {
      try { rec = new SR(); rec.lang = 'pt-BR'; rec.interimResults = false; rec.maxAlternatives = 1;
        rec.onresult = e => { const r = e.results[e.results.length - 1]; if (r && r.isFinal) finalCb({ text: r[0].transcript }); };
        rec.onerror = e => { stateCb({ state: 'idle' }); if (e.error === 'not-allowed') rej({ code: 'not_granted' }); };
        rec.onend = () => stateCb({ state: 'idle' });
        rec.onstart = () => { stateCb({ state: 'listening' }); res(); };
        rec.start(); } catch (e) { rej(e); } }); },
    stop() { try { rec && rec.stop(); } catch (e) {} return Promise.resolve(); }
  };
}
// ---------- leitura em voz alta com as vozes do navegador ----------
function makeTTS() {
  if (!window.speechSynthesis) return null;
  const pick = () => { const vs = speechSynthesis.getVoices(); return vs.find(v => /pt-BR/i.test(v.lang)) || vs.find(v => /^pt/i.test(v.lang)) || null; };
  const tone = { buttery: [1, 1], airy: [1.25, 1.05], glassy: [1.45, 1], rounded: [.75, .95] };
  return { speak(text, o) { return new Promise(res => { const u = new SpeechSynthesisUtterance(text); const v = pick(); if (v) u.voice = v; u.lang = (o && o.language) || 'pt-BR';
    const t = tone[(o && o.voice) || 'buttery'] || tone.buttery; u.pitch = t[0]; u.rate = t[1]; u.onend = u.onerror = () => res(); speechSynthesis.speak(u); }); } };
}
window.FBNET = { use(n) {
  if (n === 'room') return fbLoad().then(() => FB_ROOM);
  if (n === 'db') return fbLoad().then(() => FB_DB);
  if (n === 'dictation') return Promise.resolve(makeDictation());
  if (n === 'tts') return Promise.resolve(makeTTS());
  return Promise.resolve(null);
} };

// ---------- voz ao vivo (WebRTC, de navegador para navegador) ----------
const VOICE = { on: false, stream: null, pcs: new Map(), unsub: null, early: {},
  ice: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
  fb() { return NET.tab && NET.tab._fb; },
  async start() {
    const fb = this.fb(); if (!fb) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('Este navegador não permite microfone'); return; }
    try { this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch (e) { toast('Microfone não autorizado'); return; }
    this.on = true; this.ui();
    const { D, db, base, me } = fb; const inbox = D.ref(db, base + '/rtc/' + me);
    await D.remove(inbox).catch(() => {});
    this.unsub = D.onChildAdded(inbox, s => { const m = s.val(); D.remove(s.ref).catch(() => {}); if (m) this.signal(m).catch(e => console.warn('rtc', e)); });
    await NET.tab.presence({ voz: 1 }); toast('🎧 Voz ao vivo ligada'); this.sync();
  },
  stop() {
    if (!this.on && !this.stream) return; this.on = false;
    this.pcs.forEach(p => { try { p.pc.close(); } catch (e) {} if (p.audio) p.audio.remove(); }); this.pcs.clear();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop()); this.stream = null;
    if (this.unsub) { try { this.unsub(); } catch (e) {} this.unsub = null; }
    if (NET.tab) NET.tab.presence({ voz: 0 }).catch(() => {}); this.ui();
  },
  toggle() { if (this.on) { this.stop(); toast('Voz ao vivo desligada'); } else this.start(); },
  muteToggle() { if (!this.stream) return; const t = this.stream.getAudioTracks()[0]; if (t) t.enabled = !t.enabled; this.ui(); },
  ui() { const b = $('#mic'); if (!b) return; b.classList.toggle('on', this.on); b.textContent = this.on ? '🎧' : '🎙'; b.title = this.on ? 'Voz ao vivo ligada (clique para desligar)' : 'Ligar voz ao vivo'; },
  send(to, m) { const fb = this.fb(); if (!fb) return; const { D, db, base, me } = fb; D.push(D.ref(db, base + '/rtc/' + to), Object.assign({ from: me }, m)).catch(() => {}); },
  make(peer) {
    const pc = new RTCPeerConnection({ iceServers: this.ice }); const rec = { pc, audio: null };
    this.stream.getTracks().forEach(t => pc.addTrack(t, this.stream));
    pc.onicecandidate = e => { if (e.candidate) this.send(peer, { type: 'cand', c: JSON.stringify(e.candidate) }); };
    pc.ontrack = e => { if (!rec.audio) { rec.audio = document.createElement('audio'); rec.audio.autoplay = true; rec.audio.playsInline = true; rec.audio.style.display = 'none'; document.body.appendChild(rec.audio); } rec.audio.srcObject = e.streams[0]; rec.audio.play().catch(() => {}); };
    pc.onconnectionstatechange = () => { if (['failed', 'closed'].includes(pc.connectionState)) this.drop(peer); };
    this.pcs.set(peer, rec); return rec;
  },
  drop(peer) { const r = this.pcs.get(peer); if (!r) return; try { r.pc.close(); } catch (e) {} if (r.audio) r.audio.remove(); this.pcs.delete(peer); },
  async sync() {
    if (!this.on || !NET.tab) return; const me = this.fb().me; const live = NET.tab.peers().filter(p => !p.isMe && p.presence && p.presence.voz);
    const ids = new Set(live.map(p => p.peer)); [...this.pcs.keys()].forEach(k => { if (!ids.has(k)) this.drop(k); });
    for (const p of live) if (!this.pcs.has(p.peer) && me < p.peer) { const { pc } = this.make(p.peer); const off = await pc.createOffer(); await pc.setLocalDescription(off); this.send(p.peer, { type: 'offer', sdp: off.sdp }); }
  },
  async signal(m) {
    if (!this.on) return; let r = this.pcs.get(m.from);
    if (m.type === 'offer') { if (r) this.drop(m.from); r = this.make(m.from); await r.pc.setRemoteDescription({ type: 'offer', sdp: m.sdp }); const ans = await r.pc.createAnswer(); await r.pc.setLocalDescription(ans); this.send(m.from, { type: 'answer', sdp: ans.sdp }); (r.q || []).concat(this.early[m.from] || []).forEach(c => r.pc.addIceCandidate(c).catch(() => {})); r.q = null; delete this.early[m.from]; }
    else if (m.type === 'answer' && r) { await r.pc.setRemoteDescription({ type: 'answer', sdp: m.sdp }); (r.q || []).forEach(c => r.pc.addIceCandidate(c).catch(() => {})); r.q = null; }
    else if (m.type === 'cand') { const c = JSON.parse(m.c); if (!r) { (this.early[m.from] = this.early[m.from] || []).push(c); return; } if (r.pc.remoteDescription) r.pc.addIceCandidate(c).catch(() => {}); else (r.q = r.q || []).push(c); }
  }
};
