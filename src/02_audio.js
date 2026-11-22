/* =====================================================================
   audio: procedural sound design + positional voices (Web Audio)
   ===================================================================== */
const A = { ctx: null, ready: false, voices: {}, muted: false };
function audioInit() {
  if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
  try { A.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  const c = A.ctx;
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.25;
  A.master = c.createGain(); A.master.gain.value = store.get('vol', 0.9);
  A.master.connect(comp); comp.connect(c.destination);
  const bus = v => { const g = c.createGain(); g.gain.value = v; g.connect(A.master); return g; };
  A.amb = bus(1); A.sfx = bus(1); A.mus = bus(0.85); A.body = bus(0.9); A.vox = bus(1.25);
  // ambience low-pass (muffled during hide/slowmo)
  A.ambF = c.createBiquadFilter(); A.ambF.type = 'lowpass'; A.ambF.frequency.value = 20000;
  A.amb.disconnect(); A.amb.connect(A.ambF); A.ambF.connect(A.master);
  // noise buffers
  const sr = c.sampleRate;
  A.white = c.createBuffer(1, sr * 3, sr); { const d = A.white.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  A.brown = c.createBuffer(1, sr * 4, sr); { const d = A.brown.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.4; } }
  A.pink = c.createBuffer(1, sr * 3, sr); { const d = A.pink.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * .1848) * .2; } }
  // reverb
  A.rev = c.createConvolver(); A.rev.buffer = makeIR(2.6, 2.4); A.revG = c.createGain(); A.revG.gain.value = 0.35; A.rev.connect(A.revG); A.revG.connect(A.master);
  buildAmbience();
  A.ready = true;
  decodeVoices();
}
function makeIR(sec, decay) { const c = A.ctx, n = c.sampleRate * sec, b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); } return b; }
function loopSrc(buf, rate = 1) { const s = A.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate; s.start(0, Math.random() * 2); return s; }
function env(g, t, a, d, p) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, p), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function tone(dest, t, type, f0, f1, dur, p, a = 0.005) { const c = A.ctx, o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur); const g = c.createGain(); o.connect(g); g.connect(dest); env(g, t, a, dur, p); o.start(t); o.stop(t + a + dur + 0.05); return o; }
function noise(dest, t, dur, type, f, q, p, a = 0.004, sweep, buf) { const c = A.ctx, s = c.createBufferSource(); s.buffer = buf || A.white; s.playbackRate.value = rnd(0.85, 1.15); const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (sweep) fl.frequency.exponentialRampToValueAtTime(sweep, t + dur); fl.Q.value = q; const g = c.createGain(); s.connect(fl); fl.connect(g); g.connect(dest); env(g, t, a, dur, p); s.start(t, Math.random() * 2); s.stop(t + a + dur + 0.05); }
function panner(x, y, z, ref = 1.2, roll = 1.3) { const p = A.ctx.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = ref; p.rolloffFactor = roll; p.maxDistance = 80; setPos(p, x, y, z); return p; }
function setPos(p, x, y, z) { if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; } else p.setPosition(x, y, z); }
/* one-shot at world position, with honest occlusion */
function at(x, z, build, vol = 1, y = 1.2) {
  if (!A.ready) return;
  const c = A.ctx, t = c.currentTime, p = panner(x, y, z);
  const see = World.los ? World.los(Player.pos.x, Player.pos.z, x, z) : true;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = see ? 18000 : 900;
  const g = c.createGain(); g.gain.value = vol * (see ? 1 : 0.6);
  g.connect(lp); lp.connect(p); p.connect(A.sfx); const r = c.createGain(); r.gain.value = 0.55; p.connect(r); r.connect(A.rev);
  build(g, t);
  setTimeout(() => { try { p.disconnect(); r.disconnect(); } catch (e) { } }, 5000);
}
/* ---------- ambience beds ---------- */
function buildAmbience() {
  const c = A.ctx;
  // fluorescent hum: 120Hz + harmonics, slightly buzzy
  A.humG = c.createGain(); A.humG.gain.value = 0; A.humG.connect(A.amb);
  const hf = c.createBiquadFilter(); hf.type = 'bandpass'; hf.frequency.value = 240; hf.Q.value = 0.8; hf.connect(A.humG);
  for (const [f, v] of [[120, .5], [240, .35], [360, .18], [480, .1], [1440, .03]]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f + rnd(-.3, .3); const g = c.createGain(); g.gain.value = v * 0.05; o.connect(g); g.connect(hf); o.start(); }
  const hn = c.createBiquadFilter(); hn.type = 'highpass'; hn.frequency.value = 3500; const hng = c.createGain(); hng.gain.value = 0.012; loopSrc(A.white).connect(hn); hn.connect(hng); hng.connect(A.humG);
  // flicker modulation node (driven by game)
  A.humMod = hng;
  // low drone (36Hz beating) + brown rumble
  A.droneG = c.createGain(); A.droneG.gain.value = 0; A.droneG.connect(A.amb);
  const dl = c.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 95; dl.connect(A.droneG);
  for (const f of [36, 36.7]) { const o = c.createOscillator(); o.frequency.value = f; const g = c.createGain(); g.gain.value = 0.25; o.connect(g); g.connect(dl); o.start(); }
  const oct = c.createOscillator(); oct.frequency.value = 72; const ws = c.createWaveShaper(); const cu = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; cu[i] = Math.tanh(x * 3); } ws.curve = cu; const og = c.createGain(); og.gain.value = 0.06; oct.connect(ws); ws.connect(og); og.connect(A.droneG); oct.start();
  loopSrc(A.brown).connect(dl);
  const lfo = c.createOscillator(); lfo.frequency.value = 0.07; const lg = c.createGain(); lg.gain.value = 30; lfo.connect(lg); lg.connect(dl.frequency); lfo.start();
  // machine room / pipes bed (level 2)
  A.pipeG = c.createGain(); A.pipeG.gain.value = 0; A.pipeG.connect(A.amb);
  const pf = c.createBiquadFilter(); pf.type = 'bandpass'; pf.frequency.value = 180; pf.Q.value = 1.4; loopSrc(A.brown, 0.7).connect(pf); pf.connect(A.pipeG);
  const po = c.createOscillator(); po.type = 'triangle'; po.frequency.value = 49; const pog = c.createGain(); pog.gain.value = 0.08; po.connect(pog); pog.connect(A.pipeG); po.start();
  // concrete garage wind + drips bed (level 1)
  A.windG = c.createGain(); A.windG.gain.value = 0; A.windG.connect(A.amb);
  const wf = c.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 380; wf.Q.value = 0.6; loopSrc(A.pink).connect(wf); wf.connect(A.windG);
  const wl = c.createOscillator(); wl.frequency.value = 0.09; const wlg = c.createGain(); wlg.gain.value = 160; wl.connect(wlg); wlg.connect(wf.frequency); wl.start();
  // chase music: dissonant pulse cluster
  A.chaseG = c.createGain(); A.chaseG.gain.value = 0; A.chaseG.connect(A.mus);
  A.chaseF = c.createBiquadFilter(); A.chaseF.type = 'lowpass'; A.chaseF.frequency.value = 600; A.chaseF.connect(A.chaseG);
  for (const f of [55, 58.27, 77.78, 110 * 1.4142]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = rnd(-14, 14); const g = c.createGain(); g.gain.value = 0.07; o.connect(g); g.connect(A.chaseF); o.start(); }
  const tr = c.createOscillator(); tr.frequency.value = 7.3; const tg = c.createGain(); tg.gain.value = 0.4; tr.connect(tg); tg.connect(A.chaseG.gain); tr.start();
  // heartbeat / breathing driven per frame
  A.hbT = 0; A.brT = 0;
  A.brG = c.createGain(); A.brG.gain.value = 0; const bf = c.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 1100; bf.Q.value = 0.9; loopSrc(A.pink).connect(bf); bf.connect(A.brG); A.brG.connect(A.body);
  // party music (level 2 FUN troll + ending)
  A.partyG = c.createGain(); A.partyG.gain.value = 0; A.partyG.connect(A.mus);
}
function setBed(name, v, tc = 1.2) { if (!A.ready) return; const g = { hum: A.humG, drone: A.droneG, pipe: A.pipeG, wind: A.windG }[name]; if (g) g.gain.setTargetAtTime(v, A.ctx.currentTime, tc); }
function muffle(on) { if (!A.ready) return; A.ambF.frequency.setTargetAtTime(on ? 380 : 20000, A.ctx.currentTime, on ? 0.15 : 0.8); }
/* ---------- party music (simple sequencer) ---------- */
const Party = { on: false, step: 0, next: 0, detune: 0, rate: 1 };
function partyTick() {
  if (!A.ready || !Party.on) return; const c = A.ctx;
  while (Party.next < c.currentTime + 0.2) {
    const t = Party.next, s = Party.step % 16, d = Party.detune;
    const bass = [55, 55, 82.4, 55, 73.4, 73.4, 98, 73.4][(s >> 1) % 8];
    if (s % 4 === 0) { tone(A.partyG, t, 'sine', 150 * (1 - d * .3), 40, 0.18, 0.7); }
    if (s % 4 === 2) noise(A.partyG, t, 0.06, 'highpass', 7000, 0.7, 0.18);
    if (s % 2 === 0) { const o = tone(A.partyG, t, 'square', bass * (1 - d * .06), 0, 0.12, 0.08); o.detune.value = -d * 300; }
    if (s % 8 === 4) noise(A.partyG, t, 0.12, 'bandpass', 1800, 1, 0.22);
    if ([0, 3, 6, 10, 12].includes(s)) { const o = tone(A.partyG, t, 'triangle', [523, 659, 784, 659, 880][[0, 3, 6, 10, 12].indexOf(s)] * (1 - d * .08), 0, 0.14, 0.05); o.detune.value = -d * 500 + rnd(-d * 80, d * 80); }
    Party.step++; Party.next += 0.125 / Party.rate;
  }
}
function partyStart() { if (!A.ready) return; Party.on = true; Party.next = A.ctx.currentTime + 0.05; Party.detune = 0; Party.rate = 1; A.partyG.gain.setTargetAtTime(0.9, A.ctx.currentTime, 0.4); }
function partyStop(fast) { if (!A.ready) return; A.partyG.gain.setTargetAtTime(0, A.ctx.currentTime, fast ? 0.05 : 0.6); setTimeout(() => Party.on = false, fast ? 300 : 2500); }

/* ---------- SFX library ---------- */
const SFX = {
  step(surface, run, crouch) {
    if (!A.ready) return; const t = A.ctx.currentTime, d = A.body, v = crouch ? 0.35 : run ? 1.2 : 0.7;
    if (surface === 'carpet') { noise(d, t, 0.09, 'lowpass', 700, 0.7, 0.22 * v, 0.004, 0, A.pink); noise(d, t + 0.02, 0.06, 'bandpass', 2400, 1.2, 0.03 * v); }
    else if (surface === 'metal') { noise(d, t, 0.08, 'bandpass', 1400, 2, 0.25 * v); tone(d, t, 'square', rnd(180, 240), 0, 0.05, 0.03 * v); }
    else if (surface === 'water') { noise(d, t, 0.18, 'bandpass', 1100, 0.8, 0.25 * v, 0.01, 400); }
    else { noise(d, t, 0.07, 'lowpass', 1600, 0.8, 0.28 * v, 0.002); tone(d, t, 'sine', 110, 55, 0.07, 0.12 * v); noise(d, t, 0.03, 'highpass', 4000, 0.8, 0.05 * v); }
  },
  land() { if (!A.ready) return; const t = A.ctx.currentTime; tone(A.body, t, 'sine', 120, 40, 0.16, 0.5); noise(A.body, t, 0.12, 'lowpass', 900, 0.7, 0.4); },
  mstep(x, z, heavy, run) { at(x, z, (g, t) => { tone(g, t, 'sine', heavy ? 70 : 95, 35, 0.13, run ? 1.1 : 0.8); noise(g, t, 0.1, 'lowpass', heavy ? 300 : 600, 0.7, run ? 0.9 : 0.6); noise(g, t, 0.05, 'highpass', 3000, 0.6, 0.06); }, 1, 0.1); },
  knock(x, z, n = 3) { at(x, z, (g, t) => { for (let i = 0; i < n; i++) { const tt = t + i * rnd(0.22, 0.3); tone(g, tt, 'sine', 180, 90, 0.08, 1.0); noise(g, tt, 0.06, 'bandpass', 900, 1.5, 0.9, 0.001); } }, 1.6); },
  doorOpen(x, z) { at(x, z, (g, t) => { const o = A.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(160, t); for (let i = 1; i < 9; i++) o.frequency.linearRampToValueAtTime(rnd(140, 420), t + i * 0.09); const bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 9; const gg = A.ctx.createGain(); o.connect(bp); bp.connect(gg); gg.connect(g); env(gg, t, 0.05, 0.75, 0.32); o.start(t); o.stop(t + 0.9); noise(g, t, 0.1, 'lowpass', 400, 0.7, 0.4); }, 1); },
  doorShut(x, z) { at(x, z, (g, t) => { tone(g, t, 'sine', 95, 45, 0.25, 1); noise(g, t, 0.25, 'lowpass', 500, 0.7, 1, 0.002); noise(g, t, 0.04, 'bandpass', 2200, 1.5, 0.4, 0.001); }, 1.2); },
  bang(x, z) { at(x, z, (g, t) => { tone(g, t, 'sine', 80, 36, 0.3, 1.2); noise(g, t, 0.3, 'lowpass', 380, 0.7, 1.2, 0.002); }, 1.6); },
  locked() { if (!A.ready) return; const t = A.ctx.currentTime; for (let i = 0; i < 3; i++) noise(A.sfx, t + i * 0.08, 0.05, 'bandpass', 1900, 6, 0.4); },
  unlock() { if (!A.ready) return; const t = A.ctx.currentTime; noise(A.sfx, t, 0.05, 'bandpass', 2600, 5, 0.5); tone(A.sfx, t + 0.08, 'square', 900, 700, 0.05, 0.08); },
  pick() { if (!A.ready) return; const t = A.ctx.currentTime; tone(A.sfx, t, 'sine', 660, 0, 0.3, 0.16); tone(A.sfx, t + 0.09, 'sine', 990, 0, 0.45, 0.12); },
  paper() { if (!A.ready) return; const t = A.ctx.currentTime; noise(A.sfx, t, 0.28, 'highpass', 2400, 0.6, 0.22, 0.02); noise(A.sfx, t + 0.12, 0.15, 'bandpass', 4000, 1, 0.1, 0.01); },
  click() { if (!A.ready) return; const t = A.ctx.currentTime; noise(A.sfx, t, 0.015, 'highpass', 3000, 1, 0.3, 0.001); tone(A.sfx, t, 'square', 2200, 0, 0.01, 0.03); },
  beep(f = 1200) { if (!A.ready) return; tone(A.sfx, A.ctx.currentTime, 'square', f, 0, 0.07, 0.05); },
  error() { if (!A.ready) return; const t = A.ctx.currentTime; tone(A.sfx, t, 'square', 180, 0, 0.18, 0.08); tone(A.sfx, t + 0.2, 'square', 140, 0, 0.25, 0.08); },
  success() { if (!A.ready) return; const t = A.ctx.currentTime; [660, 880, 1320].forEach((f, i) => tone(A.sfx, t + i * 0.09, 'sine', f, 0, 0.25, 0.1)); },
  lightsOff() { if (!A.ready) return; const t = A.ctx.currentTime; tone(A.sfx, t, 'sine', 70, 30, 0.35, 0.9); noise(A.sfx, t, 0.15, 'lowpass', 600, 0.7, 0.7, 0.002); noise(A.sfx, t, 0.05, 'highpass', 5000, 1, 0.2, 0.001); },
  lightsOn() { if (!A.ready) return; const t = A.ctx.currentTime; for (let i = 0; i < 3; i++) { noise(A.sfx, t + i * 0.07, 0.03, 'bandpass', 3200, 3, 0.25, 0.001); } tone(A.sfx, t + 0.2, 'sine', 120, 0, 0.4, 0.15); },
  bulbPop(x, z) { at(x, z, (g, t) => { noise(g, t, 0.2, 'highpass', 2500, 0.7, 1.1, 0.001); tone(g, t, 'square', 3000, 400, 0.06, 0.2); for (let i = 0; i < 8; i++) noise(g, t + 0.05 + i * rnd(0.02, 0.06), 0.02, 'bandpass', rnd(3000, 7000), 4, 0.25, 0.001); }, 1.3, 2.7); },
  steam(x, z, dur = 1.6) { at(x, z, (g, t) => { noise(g, t, dur, 'highpass', 1800, 0.6, 1.1, 0.03); noise(g, t, 0.12, 'lowpass', 300, 0.7, 0.9, 0.002); }, 1.2, 1.4); },
  hiss(x, z) { at(x, z, (g, t) => { noise(g, t, 0.6, 'bandpass', 4500, 3, 0.25, 0.2); }, 0.8, 1.6); },
  clank(x, z) { at(x, z, (g, t) => { [410, 643, 911].forEach(f => tone(g, t, 'square', f, f * 0.97, 0.8, 0.05, 0.002)); noise(g, t, 0.9, 'bandpass', 2600, 9, 0.2, 0.002); }, 1, 2); },
  creak(x, z) { at(x, z, (g, t) => { const o = A.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(rnd(260, 480), t); o.frequency.linearRampToValueAtTime(rnd(180, 360), t + 0.6); const bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 11; const gg = A.ctx.createGain(); o.connect(bp); bp.connect(gg); gg.connect(g); env(gg, t, 0.1, 0.55, 0.14); o.start(t); o.stop(t + 0.8); }, 0.7); },
  drip(x, z) { at(x, z, (g, t) => { const f = rnd(900, 1600); tone(g, t, 'sine', f, f * 2.2, 0.06, 0.25); }, 0.6, 2.4); },
  whisper() { if (!A.ready) return; const c = A.ctx, t = c.currentTime, a = Player.yaw + Math.PI + rnd(-1, 1); const p = panner(Player.pos.x + Math.sin(a) * 0.5, 1.6, Player.pos.z + Math.cos(a) * 0.5, 0.5, 1); p.connect(A.body); for (let i = 0; i < 6; i++) noise(p, t + i * 0.15 + rnd(0, 0.06), 0.13, 'bandpass', rnd(2600, 4800), 3, 0.18, 0.03); },
  stinger() { if (!A.ready) return; const t = A.ctx.currentTime; noise(A.mus, t, 1.1, 'bandpass', 3200, 1.4, 0.55, 0.004, 280); for (const f of [110, 116.5, 155.6, 233]) tone(A.mus, t, 'sawtooth', f, f * 0.97, 1.2, 0.09); tone(A.mus, t, 'sine', 80, 30, 0.2, 0.9); },
  scream(big) {
    if (!A.ready) return; const c = A.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(big ? 980 : 760, t); o.frequency.exponentialRampToValueAtTime(big ? 240 : 320, t + (big ? 1.2 : 0.8));
    const am = c.createOscillator(); am.frequency.value = 62; const amg = c.createGain(); amg.gain.value = 0.6; am.connect(amg);
    const g = c.createGain(); amg.connect(g.gain);
    const ws = c.createWaveShaper(); const cu = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; cu[i] = Math.tanh(x * 5); } ws.curve = cu;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3400; o.connect(ws); ws.connect(lp); lp.connect(g);
    const og = c.createGain(); g.connect(og); og.connect(A.sfx); og.connect(A.rev); env(og, t, 0.01, big ? 1.3 : 0.9, big ? 1 : 0.6);
    o.start(t); am.start(t); o.stop(t + 1.5); am.stop(t + 1.5);
    noise(A.sfx, t, big ? 1.2 : 0.8, 'bandpass', 3000, 2, big ? 1 : 0.55, 0.004, 300); tone(A.sfx, t, 'sine', 90, 30, 0.25, big ? 1.2 : 0.7);
  },
  heart(k) { if (!A.ready) return; const t = A.ctx.currentTime; tone(A.body, t, 'sine', 58, 40, 0.13, 0.55 * k); tone(A.body, t + 0.19, 'sine', 47, 33, 0.14, 0.42 * k); },
  breath(k) { if (!A.ready) return; env(A.brG, A.ctx.currentTime, 0.22, 0.45, 0.15 * k); },
  elevatorDing() { if (!A.ready) return; const t = A.ctx.currentTime; tone(A.sfx, t, 'sine', 1318, 0, 1.4, 0.15); tone(A.sfx, t + 0.25, 'sine', 1046, 0, 1.6, 0.13); },
  elevatorMotor(dur = 5) { if (!A.ready) return; const c = A.ctx, t = c.currentTime; const s = c.createBufferSource(); s.buffer = A.brown; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220; const g = c.createGain(); s.connect(f); f.connect(g); g.connect(A.sfx); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.8); g.gain.setValueAtTime(0.9, t + dur - 1); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.start(t); s.stop(t + dur + 0.1); tone(A.sfx, t, 'triangle', 92, 96, dur, 0.06, 0.6); },
  rumble(dur = 2) { if (!A.ready) return; const t = A.ctx.currentTime; noise(A.sfx, t, dur, 'lowpass', 160, 0.7, 1, 0.3, 0, A.brown); tone(A.sfx, t, 'sine', 45, 30, dur, 0.6, 0.3); },
  fall() { if (!A.ready) return; const t = A.ctx.currentTime; noise(A.sfx, t, 1.8, 'bandpass', 500, 0.7, 0.8, 0.2, 2500); tone(A.sfx, t, 'sine', 300, 60, 1.6, 0.25, 0.1); },
  noclip() { if (!A.ready) return; const t = A.ctx.currentTime; for (let i = 0; i < 14; i++) tone(A.sfx, t + i * 0.05, 'square', rnd(80, 1600), rnd(80, 1600), 0.05, 0.08, 0.002); noise(A.sfx, t, 2.2, 'bandpass', 900, 0.5, 0.6, 0.3, 120); tone(A.sfx, t + 0.3, 'sine', 220, 30, 2, 0.4, 0.2); },
  phone() { if (!A.ready) return; const t = A.ctx.currentTime; for (let i = 0; i < 3; i++) { tone(A.body, t + i * 0.45, 'sine', 180, 0, 0.32, 0.4, 0.01); noise(A.body, t + i * 0.45, 0.32, 'lowpass', 250, 1, 0.25, 0.01); } tone(A.sfx, t, 'sine', 1568, 0, 0.12, 0.08); tone(A.sfx, t + 0.13, 'sine', 2093, 0, 0.2, 0.08); },
  carAlarm(x, z) { at(x, z, (g, t) => { for (let i = 0; i < 16; i++) { tone(g, t + i * 0.25, 'square', i % 2 ? 1400 : 950, 0, 0.22, 0.12, 0.01); } }, 1.4); },
  pipeBang(x, z) { at(x, z, (g, t) => { tone(g, t, 'sine', 60, 38, 0.5, 1); [233, 377, 611].forEach(f => tone(g, t, 'square', f, f * 0.95, 1.2, 0.04, 0.002)); noise(g, t, 0.4, 'lowpass', 500, 0.7, 0.8, 0.002); }, 1.4); },
  radioStatic(on) { if (!A.ready) return; if (!A.statG) { A.statG = A.ctx.createGain(); A.statG.gain.value = 0; const f = A.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 1.1; loopSrc(A.white).connect(f); f.connect(A.statG); A.statG.connect(A.body); } A.statG.gain.setTargetAtTime(on, A.ctx.currentTime, 0.05); },
  laughSynth(x, z, pitch = 1) { // fallback creepy laugh when no voice file
    at(x, z, (g, t) => {
      for (let i = 0; i < 6; i++) {
        const tt = t + i * 0.19; const c = A.ctx, o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(170 * pitch * (1 - i * 0.03), tt); o.frequency.exponentialRampToValueAtTime(120 * pitch, tt + 0.14);
        const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 750 * pitch; f1.Q.value = 6; const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1250 * pitch; f2.Q.value = 7;
        const gg = c.createGain(); o.connect(f1); o.connect(f2); f1.connect(gg); f2.connect(gg); gg.connect(g); env(gg, tt, 0.02, 0.13, 0.9); o.start(tt); o.stop(tt + 0.2);
        noise(g, tt, 0.06, 'bandpass', 2200, 2, 0.25, 0.005);
      }
    }, 1.4, 1.6);
  }
};
/* ---------- voice lines (ElevenLabs mp3s embedded as base64) ---------- */
const VOICE_LINES = {
  mujahid: { taunt1: 'm1', taunt2: 'm2', caught: 'm3', quiz: 'm4', idle: ['m5', 'm6', 'm7'], chase: ['m8', 'm1', 'm2'] },
  minhaj: { lure: 'n1', taunt1: 'n2', taunt2: 'n3', caught: 'n4', idle: ['n5', 'n3'], chase: ['n6', 'n2'] },
  amal: { taunt1: 'a1', dark: 'a2', taunt2: 'a3', caught: 'a4', idle: ['a5', 'a1'], chase: ['a6', 'a3'] }
};
const SUBS = {
  m1: 'د. مجاهد: <b>يا زُول! إنتَ ماشي وين يا زُول؟ الامتحان لِسّه ما خَلَص!</b>',
  m2: 'د. مجاهد: <b>مالَك يا زُول؟ جاري مالَك كِدا؟ تَعال تَعال… ما في عَوجة. سُؤال واحِد بَس.</b>',
  m3: 'د. مجاهد: <b>هُوي! لِحِقتَك يا زُول! خَلاص… المادّة دي بِتعيدها مَعاي السَّنة الجايّة.</b>',
  m4: 'د. مجاهد: <b>يا جَماعة الخِير… كويز مُفاجِئ! زُول ما بيَطلَع مِن هِنا قَبُل ما يِحِل، سِمِعتو؟</b>',
  m5: 'د. مجاهد: <b>الطَّلَبة دِيل مَشو وين؟ أنا عارِف إنّو في زُول هِنا… بَشِمّ ريحتو.</b>',
  m6: 'د. مجاهد: <b>يا زُول، الحاجة دي ساهلة خالِص… مالَك خايِف؟ أطلَع بَس.</b>',
  m7: 'د. مجاهد: <b>أمم… الميتفورمين… خُمُسْمِيّة مِلّي… الزُّول البيعرِف الجُرعة بيَطلَع.</b>',
  m8: 'د. مجاهد: <b>أَجري أَجري يا زُول! أنا جايّك هَسّي!</b>',
  n1: 'د. منهاج: <b><bdi dir="ltr">Hello?… Abdulmalik? Is that you, my friend? Come here…</bdi></b>',
  n2: 'د. منهاج: <b><bdi dir="ltr">Where are you going, my dear? Submission is closed!</bdi></b>',
  n3: 'د. منهاج: <b><bdi dir="ltr">You cannot hide from attendance… I am counting.</bdi></b>',
  n4: 'د. منهاج: <b><bdi dir="ltr">Zero marks! Zero!</bdi></b>',
  n5: 'د. منهاج: <b><bdi dir="ltr">Where is everybody, yaar? Roll number thirty-seven… absent. Absent again.</bdi></b>',
  n6: 'د. منهاج: <b><bdi dir="ltr">Run, run, my dear! I am very tall, I can see you everywhere!</bdi></b>',
  a1: 'د. أمل: <b>يا حَبيبي… فين رايِح؟ تَعال، ما راح أسَوّي لَك شي.</b>',
  a2: 'د. أمل: <b>النّور طِفي… وأنا مَرّة أحِبّ الضَّلْمة.</b>',
  a3: 'د. أمل: <b>تَعال وَرّيني الرّيبورت حَقّك يا قَلبي… لا تِخاف.</b>',
  a4: 'د. أمل: <b>خَلاص يا قَلبي… شِلت المادّة!</b>',
  a5: 'د. أمل: <b>يا حِلوين… فينَكُم؟ أنا مَرّة أحِبّ الطُّلاب اللي يِستَخبّون.</b>',
  a6: 'د. أمل: <b>لا تِجري يا قَلبي… كِده تِتعِب نَفسَك، تَعال بَس!</b>'
};
async function decodeVoices() {
  const src = window.VOICE_DATA || {};
  for (const k of Object.keys(src)) {
    try {
      const bin = atob(src[k]); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      A.voices[k] = await A.ctx.decodeAudioData(u8.buffer);
    } catch (e) { }
  }
}
let lastVoiceT = 0;
function voice(id, x, z, opts = {}) {
  if (!A.ready) return 0;
  const now = A.ctx.currentTime;
  if (!opts.force && now - lastVoiceT < 3.5) return 0;
  lastVoiceT = now;
  const dist = opts.flat ? 0 : Math.hypot(x - Player.pos.x, z - Player.pos.z);
  if (SUBS[id] && Game.subs && dist < 22) UI.sub(SUBS[id], 4200);
  const buf = A.voices[id];
  if (!buf) { SFX.laughSynth(x, z, id[0] === 'a' ? 1.5 : id[0] === 'n' ? 0.85 : 0.75); return 1.5; }
  const c = A.ctx, s = c.createBufferSource(); s.buffer = buf; s.playbackRate.value = opts.rate || 1;
  const g = c.createGain(); g.gain.value = opts.vol || 1;
  if (opts.flat) { s.connect(g); g.connect(A.vox); }
  else {
    const p = panner(x, 1.6, z, 2.2, 1.0); const see = World.los ? World.los(Player.pos.x, Player.pos.z, x, z) : true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = see ? 18000 : 1400;
    s.connect(g); g.connect(lp); lp.connect(p); p.connect(A.vox); const r = c.createGain(); r.gain.value = 0.4; p.connect(r); r.connect(A.rev);
  }
  s.start(); return buf.duration;
}
function audioFrame(dt) {
  if (!A.ready) return;
  const L = A.ctx.listener, p = Player.pos, fx = Math.sin(Player.yaw), fz = Math.cos(Player.yaw);
  // note: our camera looks along -z at yaw 0 → forward = (-sin(yaw), -cos(yaw))
  if (L.positionX) { L.positionX.value = p.x; L.positionY.value = Player.eyeY(); L.positionZ.value = p.z; L.forwardX.value = -fx; L.forwardY.value = 0; L.forwardZ.value = -fz; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
  else { L.setPosition(p.x, Player.eyeY(), p.z); L.setOrientation(-fx, 0, -fz, 0, 1, 0); }
  const stress = Game.stress;
  A.hbT -= dt; if (stress > 0.25 && A.hbT <= 0) { SFX.heart(clamp(stress, 0.3, 1)); A.hbT = 60 / (62 + 95 * stress); }
  A.brT -= dt; if ((Player.exhausted || Player.stamina < 0.3) && A.brT <= 0) { SFX.breath(1); A.brT = 0.85; }
  const chase = Game.chase;
  A.chaseG.gain.setTargetAtTime(chase * 0.5, A.ctx.currentTime, chase > 0 ? 0.25 : 2.2);
  A.chaseF.frequency.setTargetAtTime(400 + 2800 * chase * clamp(stress, 0, 1), A.ctx.currentTime, 0.3);
  partyTick();
}
