/* =====================================================================
   recorded SFX + music tracks (from VOICE_DATA: sfx_*, mus_*)
   procedural fallbacks keep the game working when a file is missing
   ===================================================================== */
const SAMPLE_FALLBACK = {
  sfx_pop: (x, z) => SFX.bulbPop(x, z),
  sfx_can: (x, z) => SFX.clank(x, z),
  sfx_vend: (x, z) => { SFX.clank(x, z); setTimeout(() => SFX.clank(x, z), 900); },
  sfx_bell: (x, z) => { if (!A.ready) return; at(x, z, (g, t) => { for (let i = 0; i < 14; i++) tone(g, t + i * 0.12, 'square', 1250, 1240, 0.1, 0.06, 0.002); }, 1.4, 3); },
  sfx_sting: () => SFX.stinger(),
  sfx_scream_m: () => SFX.scream(true), sfx_scream_f: () => SFX.scream(true), sfx_scream_n: () => SFX.scream(true),
  sfx_whisp: () => SFX.whisper(), sfx_run: (x, z) => SFX.mstep(x, z, false, true)
};
function sample(id, x, z, opts = {}) {
  if (!A.ready) return 0; const buf = A.voices[id];
  if (!buf) { const f = SAMPLE_FALLBACK[id]; if (f) f(x, z); return 0; }
  const c = A.ctx, s = c.createBufferSource(); s.buffer = buf; s.playbackRate.value = (opts.rate || 1) * (opts.vary === false ? 1 : rnd(0.94, 1.06));
  const g = c.createGain(); g.gain.value = opts.vol || 1;
  if (opts.flat || x === undefined) { s.connect(g); g.connect(opts.bus || A.sfx); }
  else { const p = panner(x, 1.4, z, 2.5, 1.0); const see = World.los ? World.los(Player.pos.x, Player.pos.z, x, z) : true; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = see ? 18000 : 1600; s.connect(g); g.connect(lp); lp.connect(p); p.connect(opts.bus || A.sfx); const r = c.createGain(); r.gain.value = 0.35; p.connect(r); r.connect(A.rev); }
  s.start(); return buf.duration;
}
/* music: two ambient beds per level + a chase layer that swells with Game.chase */
const Music = { cur: null, chase: null, curId: '', wantChase: 0 };
function musicTrack(id, vol) {
  if (!A.ready || !A.voices[id]) return null; const c = A.ctx, s = c.createBufferSource(); s.buffer = A.voices[id]; s.loop = true;
  const g = c.createGain(); g.gain.value = 0; s.connect(g); g.connect(A.mus); s.start(0, Math.random() * Math.max(0.1, A.voices[id].duration - 1)); return { s, g, vol, id };
}
function musicFade(tr, v, tc = 1.5) { if (tr) tr.g.gain.setTargetAtTime(v, A.ctx.currentTime, tc); }
function musicStop(tr, tc = 1.2) { if (!tr) return; musicFade(tr, 0, tc); setTimeout(() => { try { tr.s.stop(); } catch (e) { } }, tc * 5000); }
function musicLevel(id) {
  if (!A.ready || !A.voices.mus_amb1 || !A.voices.mus_party) return; if (Music.curId === id) return; Music.curId = id;
  musicStop(Music.cur); Music.cur = null;
  const map = { L0: ['mus_amb1', 0.32], L1: ['mus_amb2', 0.34], L2: ['mus_amb1', 0.3], END: ['mus_party', 0.55] };
  const m = map[id]; if (m) { Music.cur = musicTrack(m[0], m[1]); if (Music.cur) { musicFade(Music.cur, m[1], 2.5); if (id === 'L2') Music.cur.s.playbackRate.value = 0.85; } }
  if (!Music.chase) Music.chase = musicTrack('mus_chase', 0.6);
  Game.partyRecorded = id === 'END' && !!Music.cur; if (Game.partyRecorded && Party.on) partyStop(true);
}
function musicFrame(dt) {
  if (!A.ready) return;
  if (!Music.chase && A.voices.mus_chase) Music.chase = musicTrack('mus_chase', 0.6);
  if (Game.level && Game.state !== 'title' && Music.curId !== Game.level.id) musicLevel(Game.level.id);
  const want = Game.state === 'play' || Game.state === 'bag' ? clamp(Game.chase, 0, 1) : 0;
  if (Math.abs(want - Music.wantChase) > 0.05) { Music.wantChase = want; musicFade(Music.chase, want * Music.chase?.vol || 0, want > 0 ? 0.4 : 2.5); if (Music.cur) musicFade(Music.cur, Music.cur.vol * (1 - want * 0.75), 1); }
  if (Game.state === 'dead' || Game.state === 'title') { if (Music.cur && !Music.dimmed) { Music.dimmed = true; musicFade(Music.cur, 0.05, 0.6); } } else if (Music.dimmed) { Music.dimmed = false; if (Music.cur) musicFade(Music.cur, Music.cur.vol, 1.5); }
}
const SCREAM_OF = { mujahid: 'sfx_scream_m', minhaj: 'sfx_scream_n', amal: 'sfx_scream_f' };
