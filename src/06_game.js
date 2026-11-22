/* =====================================================================
   player + game loop + shared systems (notes, hiding, death, transitions)
   ===================================================================== */
const Player = {
  battery: 1, sanity: 1,
  pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0, vy: 0, onGround: true, crouch: 0, stamina: 1, exhausted: false,
  light: false, hidden: false, hideT: -99, hiddenUnderTable: false, bob: 0, bobPh: 0, stepAcc: 0, r: 0.27, sway: 0, swayV: 0, safe: false, frozen: false, moveAmt: 0, peek: false, lastGround: 0,
  eyeY() { if (this.hidden && this.hidden.type === 'table') return this.pos.y + 0.46; const e = this.pos.y + 1.62 - this.crouch * 0.72; return this.under ? Math.min(e, this.pos.y + 0.6) : e; },
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
  held: 'phone',
  slots() { return ['phone'].concat(Object.keys(this.inv).filter(k => this.inv[k] && k !== 'phone')); },
  updateInv() {
    const sl = this.slots(); if (!sl.includes(this.held)) this.held = 'phone';
    $('inv').innerHTML = sl.map((k, i) => `<span class="item${k === this.held ? ' sel' : ''}" data-k="${k}" title="${INV_NAMES[k] || k}"><b>${i + 1}</b>${INV_ICONS[k] || '•'}</span>`).join('');
    $('inv').querySelectorAll('.item').forEach(el => el.onpointerdown = e => { e.stopPropagation(); this.hold(el.dataset.k); });
    if ($('bag').classList.contains('on')) renderBag();
    updateHeldModel();
  },
  hold(k) { if (!this.slots().includes(k)) return; this.held = k; SFX.click(); this.updateInv(); if (k !== 'phone') UI.msg('بيدك الحين: <b>' + (INV_NAMES[k] || k) + '</b>', 1400); }
};
const INV_NAMES = { phone: 'الكشاف', redkey: 'مفتاح قاعة الاختبار', k1: 'مفتاح البوابة ١', k2: 'مفتاح البوابة ٢', k3: 'مفتاح البوابة ٣', k4: 'مفتاح البوابة ٤', ladder: 'قطع السلّم' };
const INV_DESC = { phone: 'اضغط زر الكشاف عشان تشغّله. البطارية تخلص، والنور يبيّنك للدكاترة.', redkey: 'مفتاح أحمر مكتوب عليه «قاعة الاختبار». امسكه بيدك وافتح الباب.', k1: 'واحد من أربعة مفاتيح للوحة البوابة.', k2: 'واحد من أربعة مفاتيح للوحة البوابة.', k3: 'واحد من أربعة مفاتيح للوحة البوابة.', k4: 'واحد من أربعة مفاتيح للوحة البوابة.', ladder: 'تحتاج ٤ قطع عشان تركّب السلّم عند رف المكتبة.' };
const INV_ICONS = { phone: '🔦', redkey: '🔴', k1: '🗝️', k2: '🗝️', k3: '🗝️', k4: '🗝️', ladder: '🪜' };
function renderBag() {
  const sl = Game.slots();
  $('bagGrid').innerHTML = sl.map((k, i) => `<button class="bagItem${k === Game.held ? ' sel' : ''}" data-k="${k}"><span class="bi">${INV_ICONS[k] || '•'}</span><span class="bn">${i + 1} · ${INV_NAMES[k] || k}${k === 'ladder' ? ' ×' + ar(Game.flags.pieces || 0) : (Game.inv[k] > 1 ? ' ×' + ar(Game.inv[k]) : '')}</span><span class="bd">${INV_DESC[k] || ''}</span></button>`).join('');
  $('bagGrid').querySelectorAll('.bagItem').forEach(b => b.onclick = () => { Game.hold(b.dataset.k); });
}
function toggleBag(on) {
  if (on === undefined) on = !$('bag').classList.contains('on');
  if (on) { if (Game.state !== 'play') return; Game.state = 'bag'; unlockPointer(); renderBag(); UI.show('bag', true); SFX.paper(); }
  else { UI.show('bag', false); if (Game.state === 'bag') { Game.state = 'play'; lockPointer(); } }
}
let heldModel = null;
function updateHeldModel() {
  if (!Player.phone) return;
  if (!heldModel) { heldModel = new THREE.Group(); const gold = new THREE.MeshStandardMaterial({ color: 0xc8a040, metalness: 0.9, roughness: 0.3 }); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 16), gold); const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.07, 0.006), gold); shaft.position.y = -0.05; const bit = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.006), gold); bit.position.set(0.01, -0.078, 0); heldModel.add(ring, shaft, bit); heldModel.tag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.004), new THREE.MeshStandardMaterial({ color: 0xc01818 })); heldModel.tag.position.set(0, 0.03, 0); heldModel.add(heldModel.tag); heldModel.position.set(-0.16, -0.17, -0.34); heldModel.rotation.set(0.3, 0.4, 0.5); heldModel.traverse(o => { if (o.isMesh) o.renderOrder = 10; }); R.camera.add(heldModel); }
  const k = Game.held; heldModel.visible = k !== 'phone' && k !== 'ladder'; heldModel.tag.visible = k === 'redkey';
}

/* flashlight */
let torch;
function initTorch() {
  torch = new THREE.SpotLight(0xffeccc, 0, 17, 0.42, 0.65, 1.6); torch.position.set(0.18, -0.12, 0.05);
  R.camera.add(torch); torch.target.position.set(0, -0.1, -2); R.camera.add(torch.target);
  // a real torch held in the right hand (viewmodel), pointing forward
  const fl = new THREE.Group(), metal = new THREE.MeshStandardMaterial({ color: 0x1b1d21, roughness: 0.35, metalness: 0.75 }), grip = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.85, metalness: 0.2 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.15, 18), grip); tube.rotation.x = Math.PI / 2; fl.add(tube);
  for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.0175, 0.0018, 6, 18), metal); r.position.z = -0.04 + i * 0.018; fl.add(r); }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.018, 0.04, 20), metal); neck.rotation.x = Math.PI / 2; neck.position.z = -0.095; fl.add(neck);
  const headM = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.03, 20), metal); headM.rotation.x = Math.PI / 2; headM.position.z = -0.13; fl.add(headM);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.023, 20), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xfff2d8, emissiveIntensity: 0.2 })); lens.position.z = -0.1455; lens.rotation.y = Math.PI; fl.add(lens);
  const btn = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.006, 0.014), new THREE.MeshStandardMaterial({ color: 0x8a1a12, roughness: 0.5 })); btn.position.set(0, 0.018, 0.01); fl.add(btn);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 16), metal); cap.rotation.x = Math.PI / 2; cap.position.z = 0.08; fl.add(cap);
  const skin = new THREE.MeshStandardMaterial({ color: 0xc68e62, roughness: 0.65 });
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.033, 14, 10), skin); hand.scale.set(1.05, 0.85, 1.5); hand.position.set(0.004, -0.006, 0.02); fl.add(hand);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.0075, 0.02, 4, 6), skin); f.rotation.z = Math.PI / 2; f.position.set(-0.016, -0.004 - i * 0.0005, -0.01 + i * 0.014); fl.add(f); }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0075, 0.022, 4, 6), skin); thumb.rotation.x = Math.PI / 2; thumb.position.set(0.006, 0.018, 0.0); fl.add(thumb);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.22, 12), new THREE.MeshStandardMaterial({ color: 0xe9e6de, roughness: 0.9 })); sleeve.rotation.x = Math.PI / 2 - 0.25; sleeve.position.set(0.02, -0.03, 0.15); fl.add(sleeve);
  fl.position.set(0.17, -0.17, -0.36); fl.rotation.set(0.06, 0.08, 0); R.camera.add(fl); Player.phone = fl; Player.phoneScr = lens;
  fl.traverse(o => { if (o.isMesh) o.renderOrder = 10; });
}
/* ---------------- interaction ---------------- */
function findInteract() {
  if (Player.hidden) { if (Player.hidden.type === 'table') { const u = World.interact.find(o => o.underOK && !o.done && Math.hypot(o.pos.x - Player.pos.x, o.pos.z - Player.pos.z) < (o.r || 1.6)); if (u) return u; } return { label: 'اطلع', use: () => unhide() }; }
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
Game.onHide = function () { // decided once, at the moment you hide: did any doctor actually watch you do it?
  for (const m of Game.monsters) {
    if (m.state === 'off' || !m.root.visible) { m.sawHide = false; continue; }
    const dx = Player.pos.x - m.pos.x, dz = Player.pos.z - m.pos.z, d = Math.hypot(dx, dz), dot = (dx * Math.sin(m.yaw) + dz * Math.cos(m.yaw)) / (d || 1);
    const los = losCheck(m.pos.x, m.pos.z, Player.pos.x, Player.pos.z);
    m.sawHide = los && ((m.state === 'chase' && d < 8 && dot > 0.35) || d < 2.2);
    if (!m.sawHide && m.state === 'chase') { m.state = 'search'; m.searchT = Game.t + rnd(7, 11); m.goto(Player.pos.x + rnd(-3, 3), Player.pos.z + rnd(-3, 3)); }
  }
};
function hideIn(spot) {
  Player.hidden = spot; Player.hideT = Game.t; Player.preHide = { x: Player.pos.x, z: Player.pos.z }; Game.onHide();
  Player.pos.x = spot.x; Player.pos.z = spot.z; if (spot.yaw !== undefined) { Player.yaw = spot.yaw; Player.pitch = 0; }
  if (spot.type === 'table') { Player.pitch = 0.05; spot.out = { x: Player.preHide.x, z: Player.preHide.z }; const dx = Player.preHide.x - spot.x, dz = Player.preHide.z - spot.z; Player.yaw = Math.atan2(-dx, -dz); }
  Player.light = false; if (spot.type === 'table') SFX.step('carpet', false, true); else SFX.doorOpen(spot.x, spot.z); muffle(true);
  $('slats').classList.toggle('on', spot.type === 'locker');
  UI.prompt('');
}
function unhide() {
  const s = Player.hidden; Player.hidden = false; muffle(false); $('slats').classList.remove('on');
  Player.pos.x = s.out.x; Player.pos.z = s.out.z; if (s.type === 'table') { Player.crouch = 1; } else SFX.doorShut(s.x, s.z); Game.noise(s.x, s.z, 3);
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
    if (A.voices && A.voices[SCREAM_OF[mon.type]]) sample(SCREAM_OF[mon.type], 0, 0, { flat: true, vol: 1.3 }); else SFX.scream(true); setTimeout(() => voice(VOICE_LINES[mon.type].caught, mon.pos.x, mon.pos.z, { force: true, flat: true }), 350);
  } else SFX.fall();
  this.shake(1.4);
  setTimeout(() => { this.state = 'dead'; UI.show('dead', true); setTimeout(() => $('retryBtn').focus(), 50); }, mon ? 1900 : 1200);
};
function respawn() {
  UI.show('dead', false); Game.state = 'play'; Player.sanity = Math.max(Player.sanity, 0.75); Player.battery = Math.max(Player.battery, 0.6); Player.boostT = 0; Game.scare = null; R.P.glitch.value = 0; Game.glitch = 0; Player.pos.y = 0; Player.vy = 0; Player.onGround = true; Player.pitch = 0; Player.light = false;
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
let lastT = performance.now(); const dtHist = [];
function frame(now) {
  requestAnimationFrame(frame);
  const raw = Math.min(0.1, (now - lastT) / 1000); lastT = now; dtHist.push(raw); if (dtHist.length > 5) dtHist.shift();
  const dt = Math.min(0.05, dtHist.reduce((a, b) => a + b, 0) / dtHist.length);
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
  if (P.hidden) { P.vel.set(0, 0, 0); P.crouch = lerp(P.crouch, P.hidden.type === 'table' ? 1 : 0.15, dt * 8); P.moveAmt = 0; if (P.hidden.type === 'locker') P.yaw = clamp(P.yaw, P.hidden.yaw - 0.6, P.hidden.yaw + 0.6); if (P.hidden.type === 'table') P.pitch = clamp(P.pitch, -0.5, 0.25); return; }
  if (P.script) { P.vel.set(0, 0, 0); P.moveAmt = 0; if (P.script(dt) === true) P.script = null; return; }
  if (P.frozen) { P.vel.set(0, 0, 0); P.moveAmt = 0; return; }
  let f = 0, s = 0;
  if (down('fwd')) f += 1; if (down('back')) f -= 1; if (down('right')) s += 1; if (down('left')) s -= 1;
  f -= I.joy.y; s += I.joy.x;
  const mag = Math.min(1, Math.hypot(f, s));
  const crouchWant = down('crouch') || I.tCrouch;
  // can't stand up under a table
  let ceilingLow = false; for (const h of World.hides) if ((h.type === 'table' || h.type === 'hole') && Math.abs(P.pos.x - h.x) < h.hw && Math.abs(P.pos.z - h.z) < h.hd) ceilingLow = true; P.under = ceilingLow;
  P.crouch = lerp(P.crouch, crouchWant || ceilingLow ? 1 : 0, dt * 9);
  const chasing = Game.chase > 0.6;
  const wantRun = (down('run') || I.tRun) && mag > 0.3 && P.crouch < 0.5;
  if (P.exhausted && P.stamina > 0.35) P.exhausted = false;
  const boosted = Game.t < (P.boostT || 0); const run = wantRun && (!P.exhausted || boosted);
  if (run && !chasing && !boosted && !Game.level.unlimitedStamina) { P.stamina -= dt / 6.5; if (P.stamina <= 0) { P.stamina = 0; P.exhausted = true; } }
  else P.stamina = Math.min(1, P.stamina + dt * (P.exhausted ? 0.12 : 0.2) * (run ? 0.3 : 1));
  const spd = (run ? 4.5 : P.crouch > 0.5 ? 1.45 : 2.7) * (Game.level.speedMul || 1) * (boosted ? 1.22 : 1) * (P.sanity < 0.25 ? 0.9 : 1);
  const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  let vx = (-sy * f + cy * s), vz = (-cy * f - sy * s); const l = Math.hypot(vx, vz) || 1; vx = vx / l * spd * mag; vz = vz / l * spd * mag;
  // balance sway on beams
  if (P.onBeam) { P.swayV += (Math.random() - 0.5) * dt * 2.6 + Math.sign(P.sway || 0.01) * dt * 0.55; P.swayV *= 0.985; P.sway += P.swayV * dt; vx += cy * P.sway * 1.6; vz += -sy * P.sway * 1.6; }
  else { P.sway *= 0.9; P.swayV *= 0.9; }
  const speeding = vx * vx + vz * vz > P.vel.x * P.vel.x + P.vel.z * P.vel.z; const acc = P.onGround ? (speeding ? 9 : 13) : 2.5; const kAcc = 1 - Math.exp(-acc * dt); P.vel.x += (vx - P.vel.x) * kAcc; P.vel.z += (vz - P.vel.z) * kAcc;
  P.strafe = lerp(P.strafe || 0, P.vel.x * cy - P.vel.z * sy, 1 - Math.exp(-8 * dt)); P.running = run && mag > 0.3;
  // sub-stepped so a slow frame can never carry you through a wall
  const travel = Math.hypot(P.vel.x, P.vel.z) * dt, nSub = Math.min(8, Math.max(1, Math.ceil(travel / 0.07)));
  for (let i = 0; i < nSub; i++) { P.pos.x += P.vel.x * dt / nSub; P.pos.z += P.vel.z * dt / nSub; collide(P.pos, P.r, P.pos.y + 0.3, P.pos.y + 1.7 - P.crouch * 0.7); }
  // vertical
  const g = groundAt(P.pos.x, P.pos.z, P.pos.y);
  if (P.onGround && P.pos.y - g > 0.05) P.onGround = false;
  if (!P.onGround) { P.vy -= 18 * dt; P.pos.y += P.vy * dt; if (P.pos.y <= g) { if (P.vy < -3) { P.landDip = Math.min(0.12, -P.vy * 0.012); SFX.land(); } if (P.vy < -7) Game.shake(0.3); P.pos.y = g; P.vy = 0; P.onGround = true; } }
  else P.pos.y = lerp(P.pos.y, g, Math.min(1, dt * 14));
  if (P.pos.y < (World.killY ?? -50)) { if (Game.level.onFall) Game.level.onFall(); }
  const sp = Math.hypot(P.vel.x, P.vel.z); P.moveAmt = sp;
  // steps + noise
  if (sp > 0.4 && P.onGround) {
    P.bobPh += dt * (2.2 + sp * 1.55); P.stepAcc += sp * dt; const stride = run ? 1.25 : 0.95;
    if (P.stepAcc > stride) { P.stepAcc = 0; SFX.step(Game.level.surfaceAt ? Game.level.surfaceAt(P.pos) : Game.level.surface, run, P.crouch > 0.5); if (run) Game.noise(P.pos.x, P.pos.z, 13); else if (P.crouch < 0.5) Game.noise(P.pos.x, P.pos.z, 3.2); }
  }
  P.bobAmp = lerp(P.bobAmp || 0, P.onGround ? Math.min(1, sp / 3) : 0, 1 - Math.exp(-6 * dt)); P.bob = Math.sin(P.bobPh) * P.bobAmp;
  const wasUnder = P.hiddenUnderTable, wasHole = P.inHole; P.hiddenUnderTable = false; P.inHole = false;
  for (const h of World.hides) if (h.type === 'table' && P.crouch > 0.6 && Math.abs(P.pos.x - h.x) < h.hw + 0.08 && Math.abs(P.pos.z - h.z) < h.hd + 0.08) P.hiddenUnderTable = true;
  for (const h of World.hides) if (h.type === 'hole' && Math.abs(P.pos.x - h.x) < h.hw && Math.abs(P.pos.z - h.z) < h.hd) P.inHole = true;
  if (P.inHole && !wasHole) { for (const m of Game.monsters) { m.sawHide = false; if (m.state === 'chase') { m.state = 'search'; m.searchT = Game.t + rnd(6, 9); m.goto(P.pos.x + rnd(-2, 2), P.pos.z + rnd(-2, 2)); } } muffle(true); SFX.step('concrete', false, true); }
  if (!P.inHole && wasHole) muffle(false);
  if (P.hiddenUnderTable && !wasUnder) Game.onHide();
  updateSurvival(dt);
}
function updateCamera(dt) {
  const P = Player, c = R.camera;
  Game.shakeAmt *= Math.pow(0.02, dt);
  const sh = reduceMotion ? 0 : Game.shakeAmt * 0.05;
  const breathe = Math.sin(Game.t * 1.4) * 0.006;
  P.landDip = (P.landDip || 0) * Math.exp(-7 * dt);
  P.eyeS = P.eyeS === undefined ? P.eyeY() : lerp(P.eyeS, P.eyeY(), 1 - Math.exp(-14 * dt));
  const bobY = (Math.abs(Math.sin(P.bobPh)) - 0.5) * 0.05 * (P.bobAmp || 0) * (P.running ? 1.5 : 1), bobX = Math.cos(P.bobPh) * 0.022 * (P.bobAmp || 0);
  const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
  c.position.set(P.pos.x + rx * bobX + (Math.random() - 0.5) * sh, P.eyeS + bobY + breathe - P.landDip + (Math.random() - 0.5) * sh, P.pos.z + rz * bobX + (Math.random() - 0.5) * sh);
  c.rotation.order = 'YXZ'; c.rotation.y = P.yaw; c.rotation.x = P.pitch + bobY * 0.15; c.rotation.z = (P.sway || 0) * -0.35 - (P.strafe || 0) * 0.011 + Math.cos(P.bobPh) * 0.003 * (P.bobAmp || 0);
  const fovT = 74 + (P.running ? 7 : 0) + clamp(Game.chase, 0, 1) * 3 - (P.hidden ? 6 : 0); if (Math.abs(c.fov - fovT) > 0.05) { c.fov = lerp(c.fov, fovT, 1 - Math.exp(-5 * dt)); c.updateProjectionMatrix(); }
  const lowBat = P.battery < 0.15 && Math.random() < 0.25 * (1 - P.battery / 0.15); const targetI = P.light && !P.hidden && !lowBat ? 17 * (0.55 + 0.45 * Math.min(1, P.battery * 3)) : 0; torch.intensity = lerp(torch.intensity, targetI * (Game.torchFlicker ? (Math.random() < 0.3 ? 0.2 : 1) : 1), Math.min(1, dt * 18));
  Player.phone.position.y = lerp(Player.phone.position.y, -0.17 + bobY * 0.35 - (P.hidden ? 0.3 : 0) - (P.running ? 0.03 : 0), 1 - Math.exp(-12 * dt)); Player.phone.position.x = 0.17 + bobX * 0.4; Player.phone.rotation.z = (P.strafe || 0) * 0.02; Player.phone.rotation.x = 0.06 + bobY * 0.4;
  Player.phoneScr.material.emissiveIntensity = torch.intensity > 0.5 ? 2.5 : 0.05;
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
  $('hidden').classList.toggle('on', !!P.hidden || P.hiddenUnderTable || P.inHole); $('batF').style.width = (P.battery * 100) + '%'; $('bat').classList.toggle('low', P.battery < 0.2); $('sanF').style.width = (P.sanity * 100) + '%'; $('san').classList.toggle('low', P.sanity < 0.3); $('undert').classList.toggle('on', (P.hidden && P.hidden.type === 'table') || P.hiddenUnderTable || P.inHole);
}
/* ---------------- key handling ---------------- */
Game.onKey = function (code) {
  const a = actionOf(code);
  if (Game.state === 'play') {
    if (a === 'use') doInteract();
    else if (a === 'light') { if (!Player.hidden) { if (!Player.light && Player.battery <= 0.01) { SFX.click(); UI.msg('البطارية خلصت… دوّر على <b>باور بانك</b> 🔋', 2200); return; } Player.light = !Player.light; SFX.click(); if (Player.light) Game.noise(Player.pos.x, Player.pos.z, 2); } }
    else if (a === 'item') useHeld();
    else if (a === 'jump') { if (Player.onGround && !Player.hidden && Player.crouch < 0.5) { Player.vy = 5.6; Player.onGround = false; Player.pos.y += 0.02; } }
    else if (a === 'bag') toggleBag(true);
    else if (a === 'peek' && Player.hidden) Player.peek = !Player.peek;
    else if (code === 'Escape' || code === 'KeyP') Game.pause(true);
    else if (/^Digit[1-9]$/.test(code)) { const sl = Game.slots(), i = +code.slice(5) - 1; if (sl[i]) Game.hold(sl[i]); }
  } else if (Game.state === 'bag') { if (a === 'bag' || code === 'Escape') toggleBag(false); else if (/^Digit[1-9]$/.test(code)) { const sl = Game.slots(), i = +code.slice(5) - 1; if (sl[i]) Game.hold(sl[i]); } }
  else if (Game.state === 'note') { if (a === 'use' || code === 'Escape' || code === 'Space') closeNote(); }
  else if (Game.state === 'ui') { if (code === 'Escape') { if (Game.keypad) closeKeypad(); if (Game.term) closeTerminal(); } else if (code === 'Enter' && Game.term) termSubmit(); }
  else if (Game.state === 'paused' && code === 'Escape') Game.pause(false);
  else if (Game.state === 'dead' && (code === 'Space' || code === 'Enter')) respawn();
};
Game.pause = function (on) {
  if (on) { if (Game.state !== 'play') return; Game.state = 'paused'; UI.show('pause', true); unlockPointer(); if (A.ctx) A.ctx.suspend(); }
  else { UI.show('pause', false); Game.state = 'play'; if (A.ctx) A.ctx.resume(); lockPointer(); }
};

/* ---------------- battery, sanity, consumables ---------------- */
const ITEMS = {
  battery: { name: 'باور بانك', icon: '🔋', desc: 'يشحن الكشاف للآخر. امسكه واضغط زر «استخدم».', use() { Player.battery = 1; SFX.beep(1400); UI.msg('الكشاف انشحن 🔋', 1600); return true; } },
  vitc: { name: 'فوّار فيتامين C', icon: '💊', desc: 'يرجّع لك تركيزك (العقل). إذا نزل عقلك تبدأ تشوف أشياء مو موجودة.', use() { Player.sanity = Math.min(1, Player.sanity + 0.6); SFX.steam(Player.pos.x, Player.pos.z, 0.4); UI.msg('فششش… رجع لك تركيزك 💊', 1800); return true; } },
  energy: { name: 'عصير طاقة', icon: '🧃', desc: 'يخليك أسرع ويفتح لك الركض بدون تعب لمدة ١٥ ثانية.', use() { Player.boostT = Game.t + 15; Player.stamina = 1; Player.exhausted = false; SFX.success(); UI.msg('⚡ طاقة! أنت أسرع لمدة ١٥ ثانية', 2000); return true; } },
  redjuice: { name: 'عصير أحمر', icon: '🧉', desc: 'مكتوب عليه بخط اليد: «اشربني».', use() { SFX.steam(Player.pos.x, Player.pos.z, 0.3); UI.msg('…طعمه غريب', 1400); Game.glitch = 0.4; R.P.red.value = 0.6; later(() => { UI.msg('ما تقدر تتنفس…', 1400); Game.shake(1); Game.glitch = 0.9; }, 1300); later(() => { Game.glitch = 0; Game.die(null, 'العصير الأحمر كان فخ. لا تشرب أي شي ما تعرف وش هو… حتى لو كان حاطينه لك تحت النور.'); }, 2800); return true; } }
};
Object.keys(ITEMS).forEach(k => { INV_NAMES[k] = ITEMS[k].name; INV_ICONS[k] = ITEMS[k].icon; INV_DESC[k] = ITEMS[k].desc; });
function useHeld() {
  const k = Game.held, it = ITEMS[k]; if (!it) { if (k === 'phone') { Game.onKey(Input.binds.light); } return; }
  if (it.use()) { Game.inv[k] = (Game.inv[k] | 0) - 1; if (Game.inv[k] <= 0) delete Game.inv[k]; Game.updateInv(); }
}
function itemMesh(kind) {
  const g = new THREE.Group();
  if (kind === 'battery') { const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.13, 0.02), stdMat({ color: 0x1b1d22, roughness: 0.4, metalness: 0.4 })); const led = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.004), new THREE.MeshStandardMaterial({ color: 0, emissive: 0x30ff70, emissiveIntensity: 2 })); led.position.set(0, 0.04, 0.012); b.add(led); b.rotation.x = -Math.PI / 2; g.add(b); }
  else if (kind === 'vitc') { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.15, 14), stdMat({ color: 0xf2f2f2, roughness: 0.3 })); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.03, 14), stdMat({ color: 0xff8a00 })); cap.position.y = 0.09; t.add(cap); t.position.y = 0.075; g.add(t); }
  else if (kind === 'energy') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.12, 16), new THREE.MeshStandardMaterial({ color: 0x1a8cff, metalness: 0.8, roughness: 0.25, emissive: 0x061a33 })); c.position.y = 0.06; g.add(c); }
  else if (kind === 'redjuice') { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.17, 14), new THREE.MeshStandardMaterial({ color: 0xb0101a, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.85, emissive: 0x300004 })); b.position.y = 0.085; const n = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.05, 10), b.material); n.position.y = 0.19; g.add(b, n); }
  return g;
}
function spawnItem(kind, x, z, y = 0) {
  const m = itemMesh(kind); m.position.set(x, y, z); World.group.add(m);
  const glow = new THREE.PointLight(kind === 'redjuice' ? 0xff3030 : kind === 'battery' ? 0x50ff90 : 0xffd080, kind === 'redjuice' ? 0.9 : 0.35, 2.2); glow.position.set(x, y + 0.4, z); World.group.add(glow);
  const it = addInteract({ pos: { x, y: y + 0.2, z }, r: 1.8, label: 'خذ ' + ITEMS[kind].name, use: () => { World.group.remove(m); World.group.remove(glow); it.done = true; SFX.pick(); Game.inv[kind] = (Game.inv[kind] | 0) + 1; Game.updateInv(); UI.msg(`أخذت <b>${ITEMS[kind].name}</b> ${ITEMS[kind].icon} — امسكه برقمه واضغط <b>${keyLabel(Input.binds.item)}</b>`, 3000); } });
  World.updaters.push(dt => { if (!it.done) m.rotation.y += dt * 0.6; });
  return it;
}
function updateSurvival(dt) {
  const P = Player;
  if (P.light && !P.hidden) { P.battery = Math.max(0, P.battery - dt / 95); if (P.battery <= 0) { P.light = false; SFX.click(); UI.msg('البطارية خلصت 🔋', 2000); } }
  // sanity: darkness and doctors wear you down, light and hiding with the door shut calm you
  const lit = P.inLight(), near = Game.stress;
  let ds = 0; if (!lit && !P.light) ds -= dt / 330; if (near > 0.3) ds -= dt * near / 120; if (lit || P.light) ds += dt / 220; if (P.inHole) ds += dt / 90;
  if (Game.level && Game.level.id === 'END') ds = dt;
  P.sanity = clamp(P.sanity + ds, 0, 1);
  R.P.wobble.value = Math.max(R.P.wobble.value * 0.95, P.sanity < 0.3 ? (0.3 - P.sanity) * 2.2 : 0);
  if (P.sanity < 0.35 && Game.t > (P.hallT || 0)) { P.hallT = Game.t + rnd(6, 12); hallucinate(); }
  if (P.sanity <= 0 && Game.state === 'play') Game.die(null, 'عقلك ما تحمّل الظلمة. اشرب فوّار فيتامين C وابقَ قريب من النور.');
}
function hallucinate() {
  const r = Math.random(), P = Player, a = P.yaw + Math.PI + rnd(-0.8, 0.8);
  if (r < 0.3) { SFX.whisper(); UI.sub('<i>…أنت ما راح تتخرج…</i>', 2000); }
  else if (r < 0.55) { for (let i = 0; i < 5; i++) later(() => SFX.mstep(P.pos.x + Math.sin(a) * 4, P.pos.z + Math.cos(a) * 4, true, true), i * 260); }
  else if (r < 0.8) { const d = Game.monsters[0]; if (d && d.state === 'off') return; const L = VOICE_LINES[d ? d.type : 'mujahid']; voice(pick(L.idle || [L.taunt1]), P.pos.x + Math.sin(a) * 3, P.pos.z + Math.cos(a) * 3, { force: true, rate: 0.8 }); }
  else { // a phantom doctor at the far end of your view that vanishes when you get close or blink
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); const x = P.pos.x + fx * 9, z = P.pos.z + fz * 9; if (!losCheck(P.pos.x, P.pos.z, x, z)) return;
    const ph = makeDoctor((Game.monsters[0] && Game.monsters[0].type) || 'mujahid'); ph.root.position.set(x, 0, z); ph.root.rotation.y = Math.atan2(-fx, -fz); ph.horror = true; ph.faceM.emissiveIntensity = 2; World.group.add(ph.root);
    let t = 0; World.updaters.push(function f(dt) { t += dt; const d = Math.hypot(P.pos.x - x, P.pos.z - z); if (t > 1.6 || d < 5) { World.group.remove(ph.root); SFX.stinger(); Game.glitch = 0.5; later(() => Game.glitch = 0, 250); const i = World.updaters.indexOf(f); if (i >= 0) World.updaters.splice(i, 1); } });
  }
}
