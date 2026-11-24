/* =====================================================================
   the building's soundscape (Backrooms-style): no music on the floors,
   only the hum, a dissonant dread pad that swells when he is near, and
   distant "wrong" events placed out of sight, mostly behind you
   ===================================================================== */
const Dread = { next: 20, last: '', rev: {}, padG: null };
function dreadInit() {
  if (Dread.padG || !A.ready) return; const c = A.ctx;
  Dread.padG = c.createGain(); Dread.padG.gain.value = 0; Dread.padG.connect(A.amb);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480; lp.Q.value = 0.7; lp.connect(Dread.padG); Dread.padLP = lp;
  const drift = c.createOscillator(); drift.frequency.value = 0.035; const dg = c.createGain(); dg.gain.value = 22; drift.connect(dg); drift.start();
  for (const [f, v] of [[55, 0.22], [77.78, 0.16], [58.27, 0.14], [110 * 1.4142, 0.06], [233.08, 0.035]]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = rnd(-12, 12); dg.connect(o.detune); const g = c.createGain(); g.gain.value = v * 0.35; o.connect(g); g.connect(lp); o.start(); }
  // a thin high whine that beats against itself: the sound of a fluorescent tube about to die
  Dread.whineG = c.createGain(); Dread.whineG.gain.value = 0; Dread.whineG.connect(A.amb);
  for (const f of [7820, 7826.5]) { const o = c.createOscillator(); o.frequency.value = f; const g = c.createGain(); g.gain.value = 0.004; o.connect(g); g.connect(Dread.whineG); o.start(); }
}
function revBuf(id) { if (Dread.rev[id]) return Dread.rev[id]; const b = A.voices[id]; if (!b) return null; const r = A.ctx.createBuffer(b.numberOfChannels, b.length, b.sampleRate); for (let ch = 0; ch < b.numberOfChannels; ch++) { const s = b.getChannelData(ch), d = r.getChannelData(ch); for (let i = 0, n = s.length; i < n; i++) d[i] = s[n - 1 - i]; } return (Dread.rev[id] = r); }
function playBuf(buf, x, z, o = {}) {
  if (!buf) return; const c = A.ctx, s = c.createBufferSource(); s.buffer = buf; s.playbackRate.value = o.rate || 1;
  const g = c.createGain(); g.gain.value = o.vol || 0.5; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp || 1200;
  const p = panner(x, 1.5, z, 3, 1); s.connect(g); g.connect(lp); lp.connect(p); p.connect(A.sfx); const r = c.createGain(); r.gain.value = 0.7; p.connect(r); r.connect(A.rev); s.start();
}
/* a point 12–30 m away, out of sight, preferably behind the player */
function dreadPoint(min = 12, max = 30) {
  const G = World.grid, P = Player.pos; if (!G) return { x: P.x + 15, z: P.z };
  for (let i = 0; i < 40; i++) {
    const a = Player.yaw + (i < 25 ? rnd(-1.3, 1.3) : rnd(-3.1, 3.1)), d = rnd(min, max), x = P.x + Math.sin(a) * d, z = P.z + Math.cos(a) * d; // yaw 0 looks along -z, so +sin/+cos is behind
    const [cx, cy] = G.cell(x, z); if (!G.inside(cx, cy) || !G.floor[cy * G.W + cx]) continue;
    if (losCheck(P.x, P.z, x, z)) continue; return { x, z };
  }
  return { x: P.x - Math.sin(Player.yaw) * -20, z: P.z - Math.cos(Player.yaw) * -20 };
}
const DREAD_EVENTS = {
  steps: { w: 3, fn() { const p = dreadPoint(14, 26), a = rnd(0, 6.28), n = 4 + (Math.random() * 6 | 0); for (let i = 0; i < n; i++) setTimeout(() => SFX.mstep(p.x + Math.sin(a) * i * 0.7, p.z + Math.cos(a) * i * 0.7, true, false), i * rnd(520, 640)); } },
  slam: { w: 2, fn() { const p = dreadPoint(16, 32); SFX.doorShut(p.x, p.z); } },
  revvoice: { w: 2, fn() { const t = Game.monsters[0]?.type || 'mujahid', L = VOICE_LINES[t]; const id = pick([].concat(L.idle || [], L.chase || [])); const p = dreadPoint(10, 22); playBuf(revBuf(id), p.x, p.z, { rate: rnd(0.75, 0.9), vol: 0.55, lp: 1100 }); } },
  farvoice: { w: 2, fn() { const t = Game.monsters[0]; if (!t || t.state !== 'off') return; const L = VOICE_LINES[t.type]; const p = dreadPoint(22, 34); playBuf(A.voices[pick(L.idle || [L.taunt1])], p.x, p.z, { rate: rnd(0.8, 0.88), vol: 0.5, lp: 700 }); } },
  buzz: { w: 3, fn() { const P = Player.pos; const f = (World.fixtures || []).filter(f => f.base && f.d2 !== undefined && f.d2 < 200).sort(() => Math.random() - 0.5)[0]; const x = f ? f.x : P.x, z = f ? f.z : P.z; at(x, z, (g, t) => { const o = A.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 120; const am = A.ctx.createOscillator(); am.frequency.value = 60; const amg = A.ctx.createGain(); amg.gain.value = 0.5; am.connect(amg); const bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 1.2; const gg = A.ctx.createGain(); amg.connect(gg.gain); o.connect(bp); bp.connect(gg); gg.connect(g); env(gg, t, 0.02, rnd(0.5, 1.1), 0.5); o.start(t); am.start(t); o.stop(t + 1.3); am.stop(t + 1.3); }, 1, 3.6); if (f) { const was = f.flick; f.flick = 0.8; setTimeout(() => { f.flick = was; }, 1400); } } },
  scrape: { w: 2, fn() { const p = dreadPoint(10, 24); at(p.x, p.z, (g, t) => noise(g, t, rnd(0.6, 1.2), 'bandpass', 900, 6, 0.6, 0.05, 280), 1, 0.4); } },
  phone: { w: 1, fn() { const p = dreadPoint(8, 18); at(p.x, p.z, (g, t) => { for (let k = 0; k < 2; k++) for (let i = 0; i < 3; i++) tone(g, t + k * 1.4 + i * 0.18, 'square', 165, 160, 0.13, 0.12); }, 0.8, 0.8); } },
  scream: { w: 1, min: 120, fn() { const t = Game.monsters[0]?.type || 'mujahid'; const p = dreadPoint(26, 40); playBuf(A.voices[SCREAM_OF[t]], p.x, p.z, { rate: rnd(0.62, 0.75), vol: 0.32, lp: 900 }); } },
  whisper: { w: 1, fn() { if (Player.sanity > 0.7) return; sample('sfx_whisp', 0, 0, { flat: true, vol: 0.45, rate: rnd(0.8, 1) }); } },
  groan: { w: 2, fn() { const p = dreadPoint(12, 28); at(p.x, p.z, (g, t) => { const o = A.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(rnd(58, 70), t); o.frequency.linearRampToValueAtTime(rnd(38, 46), t + 2.6); const bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 320; bp.Q.value = 7; const gg = A.ctx.createGain(); o.connect(bp); bp.connect(gg); gg.connect(g); env(gg, t, 0.6, 2.2, 0.5); o.start(t); o.stop(t + 3.2); }, 1, 2); } },
  knock: { w: 1, fn() { const p = dreadPoint(14, 26); SFX.knock(p.x, p.z, 3); } },
  laugh: { w: 1, min: 60, fn() { const t = Game.monsters[0]?.type || 'mujahid'; const p = dreadPoint(18, 30); SFX.laughSynth(p.x, p.z, (t === 'amal' ? 1.5 : t === 'minhaj' ? 0.85 : 0.72) * 0.85); } }
};
function dreadFrame(dt) {
  if (!A.ready) return; dreadInit(); const c = A.ctx, now = c.currentTime;
  const L = Game.level, playing = (Game.state === 'play' || Game.state === 'bag') && L && L.id !== 'END';
  const stress = clamp(Game.stress, 0, 1), chase = clamp(Game.chase, 0, 1);
  const pad = playing ? (0.03 + 0.5 * clamp((stress - 0.12) / 0.55, 0, 1)) * (1 - chase * 0.85) : 0;
  Dread.padG.gain.setTargetAtTime(pad, now, 1.6); Dread.padLP.frequency.setTargetAtTime(380 + 900 * stress, now, 1.2);
  Dread.whineG.gain.setTargetAtTime(playing ? 0.6 + 0.4 * Math.sin(now * 0.13) : 0, now, 2);
  if (!playing || chase > 0.3) { Dread.next = Math.max(Dread.next, Game.t + 6); return; }
  if (Game.t < Dread.next) return;
  Dread.next = Game.t + rnd(9, 24) * (stress > 0.4 ? 1.6 : 1);
  const lt = Game.t - (Game.flags?.t0 || 0); const keys = Object.keys(DREAD_EVENTS).filter(k => k !== Dread.last && lt >= (DREAD_EVENTS[k].min || 12));
  let tot = keys.reduce((s, k) => s + DREAD_EVENTS[k].w, 0), r = Math.random() * tot;
  for (const k of keys) { r -= DREAD_EVENTS[k].w; if (r <= 0) { Dread.last = k; try { DREAD_EVENTS[k].fn(); } catch (e) { } break; } }
}
/* recorded room-tone beds (CC BY 4.0 "Old Locations" by Canvas Coven), crossfaded so the loop never clicks */
const Bed = { id: '', srcs: [], next: 0, g: null };
function bedFrame() {
  if (!A.ready) return; if (!Bed.g) { Bed.g = A.ctx.createGain(); Bed.g.gain.value = 0; Bed.g.connect(A.amb); }
  const L = Game.level, want = L && ({ L0: 'amb_l0', L1: 'amb_l1', L2: 'amb_l2' })[L.id], playing = Game.state === 'play' || Game.state === 'bag' || Game.state === 'note' || Game.state === 'ui';
  const now = A.ctx.currentTime;
  Bed.g.gain.setTargetAtTime(want && playing ? ({ L0: 0.55, L1: 0.6, L2: 0.6 })[L.id] * (1 - clamp(Game.chase, 0, 1) * 0.6) : 0, now, 1.2);
  if (want !== Bed.id) { Bed.srcs.forEach(s => { try { s.g.gain.setTargetAtTime(0, now, 1); s.s.stop(now + 5); } catch (e) { } }); Bed.srcs = []; Bed.id = want; Bed.next = 0; }
  const buf = want && A.voices[want]; if (!buf) return;
  if (now >= Bed.next - 0.05) { // start a new copy that fades in while the old one fades out
    const s = A.ctx.createBufferSource(); s.buffer = buf; const g = A.ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(1, now + 4); s.connect(g); g.connect(Bed.g);
    const off = Bed.srcs.length ? 0 : Math.random() * buf.duration * 0.6, len = buf.duration - off; s.start(now, off);
    g.gain.setValueAtTime(1, now + len - 4); g.gain.linearRampToValueAtTime(0, now + len); s.stop(now + len + 0.1);
    Bed.srcs.push({ s, g }); if (Bed.srcs.length > 3) Bed.srcs.shift(); Bed.next = now + len - 4;
  }
}
/* the doctors' "wrong" presence: distorted entity sounds ("Entity sounds by juanjo_sound") */
function entitySound(x, z, o = {}) { const id = 'ent' + (1 + (Math.random() * 10 | 0)); const b = A.voices[id]; if (!b) return; playBuf(b, x, z, { rate: o.rate || rnd(0.85, 1.05), vol: o.vol || 0.7, lp: o.lp || 6000 }); }
DREAD_EVENTS.entity = { w: 3, min: 25, fn() { const p = dreadPoint(16, 30); entitySound(p.x, p.z, { vol: 0.45, lp: 1400, rate: rnd(0.7, 0.9) }); } };
