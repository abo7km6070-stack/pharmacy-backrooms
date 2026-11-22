/* =====================================================================
   player + game loop + shared systems (notes, hiding, death, transitions)
   ===================================================================== */
const Player = {
  pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0, vy: 0, onGround: true, crouch: 0, stamina: 1, exhausted: false,
  light: false, hidden: false, hideT: -99, hiddenUnderTable: false, bob: 0, bobPh: 0, stepAcc: 0, r: 0.27, sway: 0, swayV: 0, safe: false, frozen: false, moveAmt: 0, peek: false, lastGround: 0,
  eyeY() { return this.pos.y + 1.62 - this.crouch * 0.72; },
  inLight() { // near a lit ceiling fixture?
    if (World.blackout) return false;
    for (const f of World.fixtures) if (f.base * f.level > 0.25 && f.d2 !== undefined && f.d2 < 14) return true;
    return !!World.alwaysLit;
  }
};
const Game = {
  state: 'title', t: 0, level: null, inv: {}, noises: [], chase: 0, stress: 0, monsters: [], subs: store.get('subs', true), shakeAmt: 0, deaths: 0, startT: 0, notesRead: 0, flags: {},
  noise(x, z, r) { this.noises.push({ x, z, r, t: this.t }); },
  shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); },
  updateInv() { const el = $('inv'); el.innerHTML = Object.keys(this.inv).filter(k => this.inv[k]).map(k => `<span class="item" title="${INV_NAMES[k] || k}">${INV_ICONS[k] || '•'}</span>`).join(''); }
};
const INV_NAMES = { redkey: 'مفتاح قاعة الاختبار', k1: 'مفتاح ١', k2: 'مفتاح ٢', k3: 'مفتاح ٣', k4: 'مفتاح ٤', ladder: 'أجزاء السلّم' };
const INV_ICONS = { redkey: '🔴', k1: '🗝️', k2: '🗝️', k3: '🗝️', k4: '🗝️' };

/* flashlight (phone torch) */
let torch;
function initTorch() {
  torch = new THREE.SpotLight(0xfff4e0, 0, 22, 0.52, 0.55, 1.6); torch.position.set(0.18, -0.12, 0.05);
  R.camera.add(torch); torch.target.position.set(0, -0.1, -2); R.camera.add(torch.target);
  // phone held in hand (viewmodel)
  const phone = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.01), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.3, metalness: 0.6 }));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.138), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x1d2a44, emissiveIntensity: 0.6 }));
  scr.position.z = 0.0056; phone.add(body); phone.add(scr);
  const hand = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.08, 4, 8), new THREE.MeshStandardMaterial({ color: 0xc68e62, roughness: 0.6 })); hand.rotation.z = 1.3; hand.position.set(0.03, -0.06, -0.01); phone.add(hand);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.25, 10), new THREE.MeshStandardMaterial({ color: 0xe9e6de, roughness: 0.9 })); sleeve.rotation.x = 0.5; sleeve.rotation.z = 0.5; sleeve.position.set(0.06, -0.12, 0.02); sleeve.scale.set(0.8, 0.5, 0.8); phone.add(sleeve);
  phone.position.set(0.2, -0.2, -0.38); phone.rotation.set(-0.35, -0.35, 0.05); R.camera.add(phone); Player.phone = phone; Player.phoneScr = scr;
  phone.traverse(o => { if (o.isMesh) o.renderOrder = 10; });
}
/* ---------------- interaction ---------------- */
function findInteract() {
  if (Player.hidden) return { label: 'اطلع', use: () => unhide() };
  const ex = Player.pos.x, ez = Player.pos.z, fx = -Math.sin(Player.yaw), fz = -Math.cos(Player.yaw);
  let best = null, bs = 1e9;
  for (const o of World.interact) {
    if (o.done || (o.cond && !o.cond())) continue;
    const p = o.pos, dx = p.x - ex, dz = p.z - ez, d = Math.hypot(dx, dz); const r = o.r || 1.6;
    if (d > r) continue;
    const dot = d > 0.3 ? (dx * fx + dz * fz) / d : 1; if (dot < 0.55) continue;
    // vertical: look roughly at it
    const dy = (p.y ?? 1) - Player.eyeY(), pitchTo = Math.atan2(dy, Math.max(0.2, d)); if (Math.abs(pitchTo - Player.pitch) > 0.75 && d > 0.6) continue;
    if (!o.door && !losCheck(ex, ez, p.x, p.z)) continue;
    const score = d * (2 - dot); if (score < bs) { bs = score; best = o; }
  }
  return best;
}
function doInteract() { const o = findInteract(); if (!o) return; const r = o.use(o); if (o.once) o.done = true; }
/* ---------------- hiding ---------------- */
function hideIn(spot) {
  Player.hidden = spot; Player.hideT = Game.t; Player.preHide = { x: Player.pos.x, z: Player.pos.z };
  Player.pos.x = spot.x; Player.pos.z = spot.z; if (spot.yaw !== undefined) { Player.yaw = spot.yaw; Player.pitch = 0; }
  Player.light = false; SFX.doorOpen(spot.x, spot.z); muffle(true);
  $('slats').classList.toggle('on', spot.type === 'locker');
  UI.prompt('');
}
function unhide() {
  const s = Player.hidden; Player.hidden = false; muffle(false); $('slats').classList.remove('on');
  Player.pos.x = s.out.x; Player.pos.z = s.out.z; SFX.doorShut(s.x, s.z); Game.noise(s.x, s.z, 3);
}
/* ---------------- notes (paper UI) ---------------- */
function openNote(note) {
  Game.state = 'note'; unlockPointer(); SFX.paper();
  $('noteHead').textContent = note.head || 'ورقة';
  $('noteText').innerHTML = note.text;
  $('noteSig').textContent = note.sig || '';
  UI.show('note', true);
  Game.notesRead++;
  Game.noteCb = note.after;
}
function closeNote() { UI.show('note', false); SFX.paper(); Game.state = 'play'; lockPointer(); const cb = Game.noteCb; Game.noteCb = null; if (cb) cb(); }
/* ---------------- keypad / terminal ---------------- */
function openKeypad(opts) {
  Game.state = 'ui'; unlockPointer(); Game.keypad = { opts, entry: [] };
  $('kpTitle').textContent = opts.title; $('kpHint').textContent = opts.hint || '';
  const keys = $('kpKeys'); keys.innerHTML = '';
  opts.keys.forEach(k => { const b = document.createElement('button'); b.type = 'button'; b.className = 'kpk'; b.style.background = k.color; b.textContent = k.label || ''; b.title = k.name; b.onclick = () => { SFX.beep(900 + Game.keypad.entry.length * 120); Game.keypad.entry.push(k.id); renderKP(); if (Game.keypad.entry.length >= opts.len) setTimeout(checkKP, 250); }; keys.appendChild(b); });
  renderKP(); UI.show('keypad', true);
}
function renderKP() { const e = Game.keypad.entry, o = Game.keypad.opts; $('kpDisp').innerHTML = Array.from({ length: o.len }, (_, i) => { const k = o.keys.find(k => k.id === e[i]); return `<i style="background:${k ? k.color : 'transparent'}"></i>`; }).join(''); }
function checkKP() { const kp = Game.keypad; if (!kp) return; const ok = kp.entry.join(',') === kp.opts.code.join(','); if (ok) { SFX.success(); closeKeypad(); kp.opts.onOk(); } else { SFX.error(); $('kpDisp').classList.add('bad'); setTimeout(() => { $('kpDisp').classList.remove('bad'); kp.entry = []; renderKP(); }, 500); Game.noise(Player.pos.x, Player.pos.z, 8); } }
function closeKeypad() { UI.show('keypad', false); Game.keypad = null; Game.state = 'play'; lockPointer(); }
function openTerminal(opts) {
  Game.state = 'ui'; unlockPointer(); Game.term = opts; const inp = $('termIn'); inp.value = ''; $('termOut').innerHTML = opts.banner;
  UI.show('terminal', true); setTimeout(() => inp.focus(), 60);
  if (opts.creepy) setTimeout(() => { if (Game.term !== opts) return; $('termOut').innerHTML += '<br><span class="red">&gt; أنا سامعتك…</span>'; SFX.beep(300); }, 2600);
}
function termSubmit() {
  const o = Game.term; if (!o) return; const v = $('termIn').value.trim().toLowerCase().replace(/\s+/g, '');
  $('termIn').value = '';
  if (o.answers.includes(v)) { $('termOut').innerHTML += `<br>&gt; ${v}<br><span class="ok">✓ تم. ${o.okText}</span>`; SFX.success(); setTimeout(() => { closeTerminal(); o.onOk(); }, 1100); }
  else { $('termOut').innerHTML += `<br>&gt; ${v || '…'}<br><span class="red">✗ كلمة مرور خاطئة</span>`; SFX.error(); Game.noise(Player.pos.x, Player.pos.z, 7); }
}
function closeTerminal() { UI.show('terminal', false); Game.term = null; Game.state = 'play'; lockPointer(); }
/* ---------------- death / jumpscare ---------------- */
Game.die = function (mon, reason) {
  if (this.state !== 'play') return;
  this.state = 'dying'; this.deaths++; unlockPointer(); UI.prompt('');
  const tips = mon ? (LEVEL_TIPS[this.level.id] || []) : [];
  $('deadTip').textContent = reason || pick(tips.length ? tips : ['حاول مرة ثانية.']);
  $('deadWho').textContent = mon ? `${DOC_DEF[mon.type].name} مسكك` : 'سقطت';
  this.scare = { mon, t: 0 };
  if (mon) {
    mon.doc.horror = true; mon.doc.faceM.emissiveIntensity = mon.type === 'amal' ? 3 : 1.2;
    // put the doctor right in your face
    const fx = -Math.sin(Player.yaw), fz = -Math.cos(Player.yaw);
    mon.pos.set(Player.pos.x + fx * 0.55, 0, Player.pos.z + fz * 0.55); mon.yaw = Math.atan2(-fx, -fz); mon.root.position.copy(mon.pos); mon.root.rotation.y = mon.yaw; mon.root.visible = true;
    const headY = mon.doc.root.scale.y * (mon.doc.hipY + 0.56 * mon.doc.k * 1.02 + 0.32);
    Player.pitch = Math.atan2(headY - Player.eyeY(), 0.55);
    SFX.scream(true); setTimeout(() => voice(VOICE_LINES[mon.type].caught, mon.pos.x, mon.pos.z, { force: true, flat: true }), 350);
  } else SFX.fall();
  this.shake(1.4);
  setTimeout(() => { this.state = 'dead'; UI.show('dead', true); setTimeout(() => $('retryBtn').focus(), 50); }, mon ? 1900 : 1200);
};
function respawn() {
  UI.show('dead', false); Game.state = 'play'; Game.scare = null; R.P.glitch.value = 0; Game.glitch = 0; Player.pos.y = 0; Player.vy = 0; Player.onGround = true; Player.pitch = 0; Player.light = false;
  const L = Game.level; Player.hidden = false; $('slats').classList.remove('on'); muffle(false);
  Game.monsters.forEach(m => { m.doc.horror = false; m.doc.faceM.emissiveIntensity = 0; });
  if (L.respawn) L.respawn(); else startLevel(L.id);
  lockPointer();
}
/* ---------------- transitions (noclip) ---------------- */
function noclipTo(next, text) {
  if (Game.state === 'transition') return; Game.state = 'transition'; SFX.noclip(); muffle(true);
  Game.trans = { t: 0, next, text };
}
/* ---------------- main update ---------------- */
let lastT = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  Game.t += dt; R.P.time.value = Game.t;
  Game.chase *= Math.pow(0.4, dt); Game.stress *= Math.pow(0.5, dt);
  if (Game.state === 'play') {
    updatePlayer(dt);
    Game.monsters.forEach(m => m.update(dt));
    if (Game.level && Game.level.update) Game.level.update(dt);
    for (const tr of World.triggers) if (!tr.done && (tr.cond ? tr.cond() : true) && Math.abs(Player.pos.x - tr.x) < tr.w && Math.abs(Player.pos.z - tr.z) < tr.d) { tr.done = !tr.repeat; tr.fire(); }
    const it = findInteract(); UI.prompt(it ? (typeof it.label === 'function' ? it.label() : it.label) + (isTouch ? '' : '  [E]') : '');
  } else if (Game.state === 'dying') updateScare(dt);
  else if (Game.state === 'transition') updateTransition(dt);
  else if (Game.state === 'title' || Game.state === 'paused' || Game.state === 'ending') { if (Game.level && Game.level.idle) Game.level.idle(dt); }
  Game.noises = Game.noises.filter(n => Game.t - n.t < 0.6);
  updateDoors(dt);
  for (const u of World.updaters) u(dt);
  updateLightPool(dt);
  updateCamera(dt);
  audioFrame(dt);
  hudFrame();
  R.composer.render(dt);
}
function updatePlayer(dt) {
  const P = Player, I = Input;
  // look
  const sens = 0.0022 * I.sens;
  P.yaw -= I.lookX * sens; P.pitch -= I.lookY * sens; I.lookX = I.lookY = 0;
  P.pitch = clamp(P.pitch, -1.45, 1.45);
  if (I.keys.ArrowLeft) P.yaw += dt * 2.2; if (I.keys.ArrowRight) P.yaw -= dt * 2.2;
  if (P.hidden) { P.vel.set(0, 0, 0); P.crouch = lerp(P.crouch, P.hidden.type === 'table' ? 1 : 0.15, dt * 8); P.moveAmt = 0; if (P.hidden.type === 'locker') P.yaw = clamp(P.yaw, P.hidden.yaw - 0.6, P.hidden.yaw + 0.6); return; }
  if (P.frozen) { P.vel.set(0, 0, 0); P.moveAmt = 0; return; }
  let f = 0, s = 0;
  if (I.keys.KeyW || I.keys.ArrowUp) f += 1; if (I.keys.KeyS || I.keys.ArrowDown) f -= 1; if (I.keys.KeyD) s += 1; if (I.keys.KeyA) s -= 1;
  f -= I.joy.y; s += I.joy.x;
  const mag = Math.min(1, Math.hypot(f, s));
  const crouchWant = I.keys.ControlLeft || I.keys.KeyC || I.tCrouch;
  // can't stand up under a table
  let ceilingLow = false; for (const h of World.hides) if (h.type === 'table' && Math.abs(P.pos.x - h.x) < h.hw && Math.abs(P.pos.z - h.z) < h.hd) ceilingLow = true;
  P.crouch = lerp(P.crouch, crouchWant || ceilingLow ? 1 : 0, dt * 9);
  const chasing = Game.chase > 0.6;
  const wantRun = (I.keys.ShiftLeft || I.keys.ShiftRight || I.tRun) && mag > 0.3 && P.crouch < 0.5;
  if (P.exhausted && P.stamina > 0.35) P.exhausted = false;
  const run = wantRun && !P.exhausted;
  if (run && !chasing && !Game.level.unlimitedStamina) { P.stamina -= dt / 6.5; if (P.stamina <= 0) { P.stamina = 0; P.exhausted = true; } }
  else P.stamina = Math.min(1, P.stamina + dt * (P.exhausted ? 0.12 : 0.2) * (run ? 0.3 : 1));
  const spd = (run ? 5.5 : P.crouch > 0.5 ? 1.45 : 2.9) * (Game.level.speedMul || 1);
  const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  let vx = (-sy * f + cy * s), vz = (-cy * f - sy * s); const l = Math.hypot(vx, vz) || 1; vx = vx / l * spd * mag; vz = vz / l * spd * mag;
  // balance sway on beams
  if (P.onBeam) { P.swayV += (Math.random() - 0.5) * dt * 2.6 + Math.sign(P.sway || 0.01) * dt * 0.55; P.swayV *= 0.985; P.sway += P.swayV * dt; vx += cy * P.sway * 1.6; vz += -sy * P.sway * 1.6; }
  else { P.sway *= 0.9; P.swayV *= 0.9; }
  const acc = P.onGround ? 12 : 3; P.vel.x = lerp(P.vel.x, vx, Math.min(1, acc * dt)); P.vel.z = lerp(P.vel.z, vz, Math.min(1, acc * dt));
  P.pos.x += P.vel.x * dt; P.pos.z += P.vel.z * dt;
  collide(P.pos, P.r, P.pos.y + 0.3, P.pos.y + 1.7 - P.crouch * 0.7);
  // vertical
  const g = groundAt(P.pos.x, P.pos.z, P.pos.y);
  if (P.onGround && P.pos.y - g > 0.05) P.onGround = false;
  if (!P.onGround) { P.vy -= 18 * dt; P.pos.y += P.vy * dt; if (P.pos.y <= g) { if (P.vy < -7) { SFX.land(); Game.shake(0.3); } P.pos.y = g; P.vy = 0; P.onGround = true; } }
  else P.pos.y = lerp(P.pos.y, g, Math.min(1, dt * 14));
  if (P.pos.y < (World.killY ?? -50)) { if (Game.level.onFall) Game.level.onFall(); }
  const sp = Math.hypot(P.vel.x, P.vel.z); P.moveAmt = sp;
  // steps + noise
  if (sp > 0.4 && P.onGround) {
    P.bobPh += dt * sp * 2.4; P.stepAcc += sp * dt; const stride = run ? 1.25 : 0.95;
    if (P.stepAcc > stride) { P.stepAcc = 0; SFX.step(Game.level.surfaceAt ? Game.level.surfaceAt(P.pos) : Game.level.surface, run, P.crouch > 0.5); if (run) Game.noise(P.pos.x, P.pos.z, 13); else if (P.crouch < 0.5) Game.noise(P.pos.x, P.pos.z, 3.2); }
  }
  P.bob = Math.sin(P.bobPh) * Math.min(1, sp / 3);
  P.hiddenUnderTable = false;
  for (const h of World.hides) if (h.type === 'table' && P.crouch > 0.7 && Math.abs(P.pos.x - h.x) < h.hw - 0.1 && Math.abs(P.pos.z - h.z) < h.hd - 0.1) P.hiddenUnderTable = true;
}
function updateCamera(dt) {
  const P = Player, c = R.camera;
  Game.shakeAmt *= Math.pow(0.02, dt);
  const sh = reduceMotion ? 0 : Game.shakeAmt * 0.05;
  const breathe = Math.sin(Game.t * 1.4) * 0.006;
  c.position.set(P.pos.x + (Math.random() - 0.5) * sh, P.eyeY() + Math.abs(P.bob) * 0.045 + breathe + (Math.random() - 0.5) * sh, P.pos.z + (Math.random() - 0.5) * sh);
  c.rotation.order = 'YXZ'; c.rotation.y = P.yaw; c.rotation.x = P.pitch + Math.sin(P.bobPh * 0.5) * 0.006; c.rotation.z = (P.sway || 0) * -0.35 + Math.sin(P.bobPh * 0.5) * 0.004 * P.moveAmt;
  const targetI = P.light && !P.hidden ? 22 : 0; torch.intensity = lerp(torch.intensity, targetI * (Game.torchFlicker ? (Math.random() < 0.3 ? 0.2 : 1) : 1), Math.min(1, dt * 18));
  Player.phone.position.y = -0.2 + P.bob * 0.008 - (P.hidden ? 0.3 : 0); Player.phone.position.x = 0.2 + Math.cos(P.bobPh * 0.5) * 0.006;
  Player.phoneScr.material.emissiveIntensity = P.light ? 1.2 : 0.4;
  // post-fx response
  const U = R.P; const st = clamp(Game.stress, 0, 1);
  U.ca.value = 1 + st * 2.5 + (Game.scare ? 3 : 0); U.vig.value = (Game.level?.vig || 1) + st * 0.5 + (P.hidden ? 0.8 : 0);
  U.red.value = lerp(U.red.value, Game.state === 'dying' || Game.state === 'dead' ? 0.9 : st > 0.75 ? (st - 0.75) * 1.6 : 0, dt * 4);
  U.flash.value = Math.max(0, U.flash.value - dt * 2.2);
  U.glitch.value = Math.max(Game.glitch || 0, U.glitch.value - dt * 1.5);
  U.sat.value = lerp(U.sat.value, (Game.level?.sat ?? 1) * (1 - st * 0.3), dt * 2);
}
function updateScare(dt) {
  const s = Game.scare; s.t += dt; const m = s.mon;
  if (m) { m.root.position.x += Math.sin(Game.t * 40) * 0.004; animDoctor(m.doc, dt, 0, 'reach'); m.doc.P.head.rotation.z = Math.sin(Game.t * 30) * 0.15; Game.shake(0.8); }
  else { Player.pos.y -= dt * 6; }
  R.P.glitch.value = 0.3 + Math.random() * 0.4;
}
function updateTransition(dt) {
  const T = Game.trans; T.t += dt; const U = R.P;
  Game.glitch = clamp(T.t * 0.7, 0, 1); U.flash.value = smooth((T.t - 0.9) / 0.7); U.flashCol.value.set(1, 0.98, 0.9); U.wobble.value = T.t;
  Player.pos.y -= dt * T.t * 2; R.camera.rotation.z += dt * T.t * 0.3;
  if (T.t > 1.9 && !T.done) { T.done = true; Game.glitch = 0; U.wobble.value = 0; muffle(false); startLevel(T.next); U.flash.value = 1; }
}
function hudFrame() {
  const P = Player; $('stamF').style.width = (P.stamina * 100) + '%'; $('stam').classList.toggle('on', P.stamina < 0.98); $('stam').classList.toggle('ex', P.exhausted);
  $('hidden').classList.toggle('on', !!P.hidden || P.hiddenUnderTable);
}
/* ---------------- key handling ---------------- */
Game.onKey = function (code) {
  if (Game.state === 'play') {
    if (code === 'KeyE') doInteract();
    else if (code === 'KeyF') { if (!Player.hidden) { Player.light = !Player.light; SFX.click(); if (Player.light) Game.noise(Player.pos.x, Player.pos.z, 2); } }
    else if (code === 'Space') { if (Player.onGround && !Player.hidden && Player.crouch < 0.5) { Player.vy = 5.6; Player.onGround = false; Player.pos.y += 0.02; } }
    else if (code === 'Escape' || code === 'KeyP') Game.pause(true);
    else if (code === 'KeyQ' && Player.hidden) Player.peek = !Player.peek;
  } else if (Game.state === 'note') { if (code === 'KeyE' || code === 'Escape' || code === 'Space') closeNote(); }
  else if (Game.state === 'ui') { if (code === 'Escape') { if (Game.keypad) closeKeypad(); if (Game.term) closeTerminal(); } else if (code === 'Enter' && Game.term) termSubmit(); }
  else if (Game.state === 'paused' && code === 'Escape') Game.pause(false);
  else if (Game.state === 'dead' && (code === 'Space' || code === 'Enter')) respawn();
};
Game.pause = function (on) {
  if (on) { if (Game.state !== 'play') return; Game.state = 'paused'; UI.show('pause', true); unlockPointer(); if (A.ctx) A.ctx.suspend(); }
  else { UI.show('pause', false); Game.state = 'play'; if (A.ctx) A.ctx.resume(); lockPointer(); }
};
