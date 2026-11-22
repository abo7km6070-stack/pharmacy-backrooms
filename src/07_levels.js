/* =====================================================================
   levels: 0 (الردهة), 0B (القبو), 1 (موقف الكلية), 2 (ممرات الأنابيب), END
   ===================================================================== */
const LEVEL_TIPS = {
  L0: ['اكسر خط النظر ولف بالزوايا، د. مجاهد يبطّئ عند المنعطفات.', 'سكّر الباب وراك… يحتاج وقت عشان يكسره.', 'انحنِ تحت طاولات القاعة (C) عشان تتخبى.', 'الركض يسمعه من بعيد. امشِ إذا ما يلاحقك.'],
  L0B: ['اتبع الأسهم السودا على الجدران.', 'هنا هو أسرع… لا توقف.'],
  L1: ['د. منهاج ما يقدر يفتح الأبواب: ادخل غرفة وسكّرها.', 'لا تقرب من أي أحد يأشر لك من بعيد.', 'لف المفاتيح الأربعة خلال ٥ ثواني.'],
  L2: ['إذا طفى النور: اثبت ولا تشغل الكشاف.', 'الفحيح يعني البخار بينفجر. انتظر أو انحنِ.', 'لا توقف وهي وراك… أبداً.']
};
const NOTES = {
  L0: { head: 'ورقة مطوية على الجدار', sig: '— طالب سنة رابعة', text: 'إذا لقيت هالورقة… فأنت علقت مثلي في ردهة الكلية.<br>• المخرج ورا باب <b>«قاعة الاختبار»</b> الأحمر، ومفتاحه فوق <b>رف المكتبة العالي</b>.<br>• تحتاج سلّم… قطعه متفرقة بالممرات <b>(٤ قطع)</b>.<br>• إذا سمعت <b>طرق</b>… د. مجاهد قريب. اكسر خط النظر ولف بالزوايا.<br>• تقدر تتخبى <b>تحت طاولات القاعة</b> أو في <b>الخزائن</b>، وسكّر الأبواب وراك.' },
  L0B: { head: 'مكتوبة بقلم على الجدار', sig: '— نفس الطالب', text: 'سقطت للقبو؟ أنا بعد.<br>• اتبع <b>الأسهم السودا</b> على الجدران… توديك للدرج.<br>• هنا الإضاءة خربانة، و<b>هو أسرع</b>. لا توقف.' },
  L1: { head: 'ورقة على عمود الموقف', sig: '— ؟', text: 'موقف الكلية.<br>• رمز المصعد = <b>ألوان السيارات</b> اللي ورا الباب أبو شباك، <b>من اليسار لليمين</b>.<br>• تحت فيه <b>٤ مفاتيح</b> في خزائن المعاطف. ركّبها باللوحة و<b>لفّها كلها خلال ٥ ثواني</b>.<br>• د. منهاج <b>يقلّد الأصوات</b>… إذا شفت أحد يأشر لك من بعيد، لا تقرب.<br>• ما يقدر يفتح الأبواب. <b>الغرفة المسكّرة أمان</b>.' },
  L2: { head: 'ورقة مبلولة', sig: '— فني الصيانة', text: 'ممرات الأنابيب تحت المعامل.<br>• النور يطفي كل شوي. إذا طفى: <b>اثبت مكانك ولا تشغّل الكشاف</b>. د. أمل تشوف اللي يتحرك.<br>• <b>البخار يحرق</b>. اسمع الفحيح قبل الانفجار، وانحنِ تحت الأنابيب الواطية.<br>• كلمة سر البوابة في <b>غرفة الصيانة</b>.<br>• إذا شفت لوحة <b>«المرح»</b>… لا تصدّق.' },
  pw: { head: 'تذكير للفنيين', sig: '— إدارة الكلية', text: 'كلمة سر بوابة المعامل:<br><b>أول دواء نبدأ فيه لمريض السكري النوع الثاني</b><br>(اكتبه بالإنجليزي، بدون مسافات)<br><br><i>ملاحظة: لا تنسون البوث التوعوي يوم الأحد 🙂</i>' },
  fake: { head: 'ورقة داخل الغرفة', sig: '— د. م', text: '<b>مو هنا 😂</b><br><br>المخرج الحقيقي ما عليه لوحة خضرا.' }
};
const LEVELS = {};
function later(fn, ms) { const seq = Game.seq; return setTimeout(() => { if (Game.seq === seq && Game.level) fn(); }, ms); }
function hasWall(G, cx, cy, sd) { const e = sd === 'n' ? G.h[G.hi(cx, cy)] : sd === 's' ? G.h[G.hi(cx, cy + 1)] : sd === 'w' ? G.v[G.vi(cx, cy)] : G.v[G.vi(cx + 1, cy)]; return e === 1; }
function wallSide(G, cx, cy, pref) { const order = [pref, 'n', 'e', 's', 'w']; for (const sd of order) if (hasWall(G, cx, cy, sd)) return sd; return null; }
const style = {};
function mkStyles() {
  const wpB = bumpFrom(TEX.wallpaper);
  style.L0 = {
    wall: stdMat({ map: TEX.wallpaper, bumpMap: wpB, bumpScale: 0.012, roughness: 0.92 }),
    floor: stdMat({ map: TEX.carpet, bumpMap: bumpFrom(TEX.carpet), bumpScale: 0.02, roughness: 1 }),
    ceil: stdMat({ map: TEX.ceiling, roughness: 0.95 })
  };
  style.L0B = {
    wall: stdMat({ map: TEX.wallpaper, color: 0x8a7e64, bumpMap: wpB, bumpScale: 0.015, roughness: 0.95 }),
    floor: stdMat({ map: TEX.carpet, color: 0x6b6458, roughness: 1 }),
    ceil: stdMat({ map: TEX.ceiling, color: 0x8a8678, roughness: 1 })
  };
  style.L1 = {
    wall: stdMat({ map: TEX.concrete, bumpMap: bumpFrom(TEX.concrete), bumpScale: 0.02, roughness: 0.95 }),
    floor: stdMat({ map: TEX.concreteFloor, roughness: 0.85, metalness: 0.05 }),
    ceil: stdMat({ map: TEX.concrete, color: 0x9a9a96, roughness: 1 })
  };
  style.L2 = {
    wall: stdMat({ map: TEX.tunnel, bumpMap: bumpFrom(TEX.tunnel), bumpScale: 0.03, roughness: 0.9 }),
    floor: stdMat({ map: TEX.grate, roughness: 0.6, metalness: 0.5 }),
    ceil: stdMat({ map: TEX.concrete, color: 0x55524e, roughness: 1 })
  };
  ['L0', 'L0B', 'L1', 'L2'].forEach(k => { [style[k].wall, style[k].floor, style[k].ceil].forEach(m => { if (m.map) { m.map.repeat.set(1, 1); } }); });
}
/* shared level setup */
function setupEnv(o) {
  R.scene.fog = new THREE.FogExp2(o.fog, o.fogD);
  R.renderer.setClearColor(o.fog, 1);
  if (World.hemi) R.scene.remove(World.hemi);
  World.hemi = new THREE.HemisphereLight(o.sky, o.ground, o.amb * 0.38); R.scene.add(World.hemi);
  R.P.exposure.value = o.exposure || 1; R.bloom.strength = (o.bloom ?? 0.6) * 0.6; R.bloom.threshold = (o.bloomT ?? 0.82) + 0.32;
  R.P.tint.value.set(...(o.tint || [1, 1, 1])); R.P.grain.value = o.grain ?? 0.07;
  World.lightMul = 1; World.blackout = false; World.alwaysLit = !!o.alwaysLit;
  setBed('hum', o.hum ?? 0); setBed('drone', o.drone ?? 0.3); setBed('pipe', o.pipe ?? 0); setBed('wind', o.wind ?? 0);
}
function startLevel(id) {
  const L = LEVELS[id]; Game.seq = (Game.seq || 0) + 1; Game.level = L; Game.scare = null; Game.monsters.forEach(m => m.deactivate()); Game.monsters = [];
  worldReset(); World.baseFloor = 0; World.killY = -50; World.grid = null;
  Player.pos.set(0, 0, 0); Player.vel.set(0, 0, 0); Player.vy = 0; Player.onGround = true; Player.hidden = false; Player.stamina = 1; Player.exhausted = false; Player.onBeam = false; Player.frozen = false; Player.safe = false; Player.light = false;
  Game.flags = {}; Game.hp = 2; Game.glitch = 0; R.P.dark.value = 0; R.P.wobble.value = 0; partyStop(true);
  $('slats').classList.remove('on');
  L.build(); Game.state = 'play'; Game.levelT = 0;
  store.set('reached', Math.max(store.get('reached', 0), L.order));
  UI.card(L.card[0], L.card[1], L.card[2]);
  lockPointer();
}
function fixturesGrid(G, every = 2, offset = 0, pred) {
  const list = []; for (let y = 0; y < G.H; y++) for (let x = 0; x < G.W; x++) { if (!G.floor[y * G.W + x]) continue; if ((x + y * 3 + offset) % every !== 0) continue; if (pred && !pred(x, y)) continue; list.push({ x: G.cx(x), z: G.cz(y), flick: Math.random() < 0.12 ? rnd(0.1, 0.5) : 0, on: Math.random() > 0.06 }); }
  return list;
}
function noteOnWall(G, cx, cy, side, note, after) {
  const p = onWall(G, cx, cy, side, 1.5, 0);
  const m = poster(signTex({ w: 256, h: 320, bg: '#ece3cc', age: true, lines: [{ t: '✎', y: 70, s: 60, c: '#555' }, { t: '— — — —', y: 150, s: 30, c: '#777' }, { t: '— — —', y: 200, s: 30, c: '#777' }, { t: '— — — —', y: 250, s: 30, c: '#777' }] }), p.x, 1.45, p.z, p.ry, 0.3, 0.38);
  m.rotation.z = rnd(-0.08, 0.08);
  return addInteract({ pos: { x: p.x, y: 1.45, z: p.z }, r: 2, label: 'اقرأ الورقة', use: () => openNote(Object.assign({}, note, { after })) });
}
function pickupItem(mesh, x, y, z, label, fn) { mesh.position.set(x, y, z); World.group.add(mesh); const it = addInteract({ pos: { x, y, z }, r: 1.9, label, use: () => { World.group.remove(mesh); it.done = true; SFX.pick(); fn(); } }); World.updaters.push(dt => { if (!it.done) { mesh.rotation.y += dt * 0.8; } }); return it; }
function lockerMesh(x, z, ry, color = 0x6c7a80) {
  const g = new THREE.Group(); const m = stdMat({ color, metalness: 0.55, roughness: 0.45, map: TEX.metal });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.95, 0.5), m); body.position.y = 0.975; g.add(body);
  const slat = stdMat({ color: 0x1a1d20 }); for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.01), slat); s.position.set(0, 1.55 + i * 0.06, 0.255); g.add(s); }
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), stdMat({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.3 })); h.position.set(0.22, 1.05, 0.27); g.add(h);
  g.position.set(x, 0, z); g.rotation.y = ry; World.group.add(g);
  const c = Math.cos(ry), s = Math.sin(ry); const ex = Math.abs(c * 0.3) + Math.abs(s * 0.25), ez = Math.abs(s * 0.3) + Math.abs(c * 0.25); addBoxCollider(x - ex, z - ez, x + ex, z + ez, 0, 2);
  const fx = Math.sin(ry), fz = Math.cos(ry);
  return { mesh: g, x, z, front: { x: x + fx * 0.75, z: z + fz * 0.75 }, yaw: Math.atan2(fx, fz) + Math.PI };
}
function addLockerHide(x, z, ry, color) {
  const L = lockerMesh(x, z, ry, color);
  const spot = { type: 'locker', x: L.x, z: L.z, yaw: Math.atan2(-Math.sin(ry), -Math.cos(ry)) + Math.PI, out: L.front };
  // camera inside looks outward through slats: player yaw such that forward = locker front
  spot.yaw = Math.atan2(-Math.sin(ry), -Math.cos(ry)); spot.yaw = ry; // camera forward = (-sin yaw,-cos yaw) → need = (sin ry, cos ry) → yaw = ry+π
  spot.yaw = ry + Math.PI;
  World.hides.push(spot);
  addInteract({ pos: { x: L.front.x, y: 1.2, z: L.front.z }, r: 1.6, label: 'اختبئ في الخزانة', use: () => hideIn(spot) });
  return L;
}
function deskMesh(x, z, ry = 0) {
  const g = new THREE.Group(); const top = stdMat({ color: 0xb79a6a, roughness: 0.55 }), leg = stdMat({ color: 0x303236, metalness: 0.7, roughness: 0.4 });
  const t = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.7), top); t.position.y = 0.76; g.add(t);
  for (const [a, b] of [[-0.75, -0.3], [0.75, -0.3], [-0.75, 0.3], [0.75, 0.3]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.76, 0.04), leg); l.position.set(a, 0.38, b); g.add(l); }
  const modesty = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.02), top); modesty.position.set(0, 0.52, -0.33); g.add(modesty);
  g.position.set(x, 0, z); g.rotation.y = ry; World.group.add(g);
  World.hides.push({ type: 'table', x, z, hw: ry ? 0.45 : 0.8, hd: ry ? 0.8 : 0.45 });
  // top is a low ceiling (can't stand under), legs block lightly
  return g;
}
function shelfMesh(x, z, ry, h = 2.6, w = 2.2) {
  const g = new THREE.Group(); const wood = stdMat({ color: 0x6d4c30, roughness: 0.7 });
  const sideG = new THREE.BoxGeometry(0.05, h, 0.45); for (const s of [-1, 1]) { const m = new THREE.Mesh(sideG, wood); m.position.set(s * w / 2, h / 2, 0); g.add(m); }
  const bookCols = [0x8a2b2b, 0x2b4a8a, 0x2b6a3e, 0xb08a3a, 0x5a3a6a, 0x9a9a9a];
  for (let i = 0; i <= 5; i++) { const sh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.45), wood); sh.position.set(0, 0.1 + i * (h - 0.15) / 5, 0); g.add(sh);
    if (i < 5) { let bx = -w / 2 + 0.06; while (bx < w / 2 - 0.1) { const bw = rnd(0.04, 0.09), bh = rnd(0.25, 0.38); const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, rnd(0.25, 0.32)), stdMat({ color: pick(bookCols), roughness: 0.8 })); b.position.set(bx + bw / 2, 0.12 + i * (h - 0.15) / 5 + bh / 2, 0.02); b.rotation.z = Math.random() < 0.08 ? 0.2 : 0; g.add(b); bx += bw + 0.005; } } }
  g.position.set(x, 0, z); g.rotation.y = ry; World.group.add(g);
  const c = Math.cos(ry), s = Math.sin(ry); const ex = Math.abs(c * w / 2) + Math.abs(s * 0.23), ez = Math.abs(s * w / 2) + Math.abs(c * 0.23); addBoxCollider(x - ex, z - ez, x + ex, z + ez, 0, h);
  return g;
}

/* ============================== LEVEL 0 ============================== */
LEVELS.L0 = {
  id: 'L0', order: 0, card: ['LEVEL 0', 'الردهة', 'كلية الصيدلة · جامعة القصيم'], surface: 'carpet', vig: 1.0, sat: 0.92,
  build() {
    const S = 2.8, W = 16, H = 16, WH = 2.95; World.wallH = WH; World.wallMat = style.L0.wall;
    const G = makeGrid(W, H, S); World.grid = G; const rand = mulberry(7319);
    backroomsMaze(G, rand, 0.36);
    // special rooms
    G.open(0, 0, 2, 2); G.room(0, 0, 2, 2); G.setEdge(2, 1, 3, 1, 0); G.setEdge(1, 2, 1, 3, 0); // spawn
    G.open(5, 9, 9, 13); G.room(5, 9, 9, 13); G.setEdge(7, 8, 7, 9, 0); // lecture hall (door added below)
    G.open(12, 12, 15, 15); G.room(12, 12, 15, 15); // library
    G.room(9, 2, 9, 2); // fake exit closet
    G.open(13, 6, 15, 8); G.room(13, 6, 15, 8); G.setEdge(14, 5, 14, 6, 0); // red-door antechamber
    G.locked = (x, y, nx, ny) => false;
    connectAll(G, rand);
    setupEnv({ fog: 0x8a7d4e, fogD: 0.034, sky: 0xfff2c0, ground: 0x6b5a32, amb: 0.85, exposure: 1.05, bloom: 0.75, bloomT: 0.78, hum: 0.55, drone: 0.18, tint: [1.02, 1, 0.92], grain: 0.07 });
    // doors
    const lecDoor = addDoor(G, 9, 11, 10, 11, { name: 'باب القاعة' }); G.setEdge(9, 11, 10, 11, 2);
    addDoor(G, 8, 13, 8, 14, {});
    const libDoor = addDoor(G, 12, 11, 12, 12, {}); addDoor(G, 11, 14, 12, 14, {});
    addDoor(G, 3, 1, 3, 2, {});
    const fake = addDoor(G, 9, 3, 9, 2, { fake: true });
    const red = addDoor(G, 15, 7, 16, 7, { tex: TEX.redDoor, locked: true, key: 'redkey', lockedMsg: 'مقفل. على الباب: «قاعة الاختبار»… يبيله مفتاح.', trim: 0x3a0a08 });
    connectAll(G, rand);
    buildGridWalls(G, style.L0.wall, WH);
    buildGridFloor(G, style.L0.floor, style.L0.ceil, WH, 2.4, { ceilUV: 1.2 });
    // pillars
    for (let i = 0; i < 26; i++) { const x = 1 + ((rand() * (W - 1)) | 0), y = 1 + ((rand() * (H - 1)) | 0); if (x > 11 && y > 11) continue; if (x <= 3 && y <= 3) continue; if (x >= 5 && x <= 10 && y >= 9 && y <= 14) continue; const px = x * S, pz = y * S; prop(boxGeo(0.5, WH, 0.5, 0, WH / 2, 0, 2, WH), style.L0.wall, px, 0, pz); }
    // fixtures
    const fx = fixturesGrid(G, 2, 0, (x, y) => !(x === 9 && y === 2));
    buildFixtures(fx, WH, { intensity: 2.4, power: 5.5, range: 8.5, lightColor: 0xfff0c0 });
    initLightPool(8);
    // posters / signage
    const logo = window.IMG_LOGO ? imgTex(window.IMG_LOGO) : null;
    if (logo) { const p = onWall(G, 1, 0, 'n', 1.7); const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.48), new THREE.MeshStandardMaterial({ map: logo, transparent: true, roughness: 0.6 })); plate.position.set(p.x, 2.05, p.z + 0.01); World.group.add(plate); }
    const pp = [
      [3, 5, 'w', signTex({ w: 384, h: 512, bg: '#1f4f6e', lines: [{ t: 'PHP 363', y: 120, s: 56, c: '#fff', f: 'Arial' }, { t: 'Endocrinology', y: 185, s: 40, c: '#cfe6f5', f: 'Arial' }, { t: 'الاختبار النهائي', y: 300, s: 44, c: '#ffd36b' }, { t: 'الأحد ٨:٠٠ ص', y: 370, s: 34, c: '#fff' }] })],
      [6, 3, 's', signTex({ w: 512, h: 384, bg: '#f4efe2', border: '#b11', bw: 16, lines: [{ t: '⚠', y: 120, s: 90, c: '#b11' }, { t: 'ممنوع الأكل والشرب', y: 230, s: 48, c: '#111' }, { t: 'داخل المعامل', y: 300, s: 40, c: '#333' }] })],
      [11, 1, 'n', signTex({ w: 512, h: 256, bg: '#0f5135', lines: [{ t: 'قسم علم الأدوية والسموم', y: 110, s: 42, c: '#fff' }, { t: 'Pharmacology & Toxicology', y: 180, s: 30, c: '#bfe8d0', f: 'Arial' }] })],
      [2, 9, 'e', signTex({ w: 384, h: 512, bg: '#f2e6c8', lines: [{ t: 'Metformin', y: 110, s: 50, c: '#1a3a7a', f: 'Arial' }, { t: '500 mg', y: 170, s: 40, c: '#333', f: 'Arial' }, { t: 'الخط الأول', y: 280, s: 42, c: '#8a1a1a' }, { t: 'للسكري النوع الثاني', y: 340, s: 34, c: '#333' }] })],
      [14, 4, 'w', signTex({ w: 512, h: 256, bg: '#3a2a6a', lines: [{ t: 'قسم الصيدلانيات', y: 110, s: 46, c: '#fff' }, { t: 'Pharmaceutics', y: 180, s: 32, c: '#d9ccff', f: 'Arial' }] })],
      [0, 7, 'e', signTex({ w: 512, h: 256, bg: '#f5f5f0', lines: [{ t: 'نادي طلاب كلية الصيدلة', y: 100, s: 40, c: '#0f5135' }, { t: 'بوث التوعية بالسكري ـ الأحد', y: 170, s: 32, c: '#333' }] })]
    ];
    pp.forEach(([cx, cy, side0, t]) => { const side = wallSide(G, cx, cy, side0); if (!side) return; const p = onWall(G, cx, cy, side, 1.6); poster(t, p.x, 1.6, p.z, p.ry, side === 'n' || side === 's' ? 1.1 : 0.75, side === 'n' || side === 's' ? 0.65 : 1); });
    // fake EXIT sign above the closet door
    const ex = signTex({ w: 256, h: 96, bg: '#0a8a3a', age: false, lines: [{ t: 'مخرج  EXIT', y: 64, s: 46, c: '#fff' }] });
    const exm = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.26), new THREE.MeshStandardMaterial({ map: ex, emissive: 0xffffff, emissiveMap: ex, emissiveIntensity: 1.6 })); exm.position.set(fake.ex, 2.45, fake.ez + 0.11); World.group.add(exm);
    noteOnWall(G, 9, 2, 'n', NOTES.fake, () => { if (!Game.flags.fakeLaugh) { Game.flags.fakeLaugh = 1; later(() => SFX.laughSynth(Player.pos.x + 8, Player.pos.z - 4, 0.75), 600); later(() => voice('m2', Player.pos.x + 10, Player.pos.z + 6), 1500); } });
    // lecture hall desks (hiding)
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) deskMesh(G.cx(5) + 1.4 + c * 4.6, G.cz(10) + r * 2.2, 0);
    const pod = prop(new THREE.BoxGeometry(1.2, 1.1, 0.6), stdMat({ color: 0x5a3e28 }), G.cx(7), 0.55, G.cz(13) + 0.6);
    const board = poster(signTex({ w: 1024, h: 512, bg: '#1d3b2e', age: false, lines: [{ t: 'Insulin vs Metformin', y: 120, s: 60, c: '#e8f0e0', f: 'Arial' }, { t: 'HbA1c < 7%', y: 230, s: 56, c: '#e8f0e0', f: 'Arial' }, { t: 'كويز مفاجئ بكرة 🙂', y: 360, s: 64, c: '#ffd36b' }, { t: '— د. مجاهد', y: 450, s: 40, c: '#cfd8c8' }] }), G.cx(7), 1.6, G.cz(13) + S / 2 - 0.12, Math.PI, 3.4, 1.7);
    // lockers (hiding) along a few walls
    [[4, 4, 'n'], [12, 2, 's'], [2, 12, 'e'], [10, 7, 'w'], [6, 15, 's'], [14, 10, 'n'], [1, 6, 'w'], [8, 1, 'n']].forEach(([cx, cy, s0]) => { const side = wallSide(G, cx, cy, s0); if (!side) return; const p = onWall(G, cx, cy, side, 0, 0); const ry = p.ry; addLockerHide(p.x + Math.sin(ry) * 0.25, p.z + Math.cos(ry) * 0.25, ry); });
    // library: tall shelf with the red key on top
    const shelfX = G.cx(13) + S / 2, shelfZ = G.cz(15) + S / 2 - 0.35;
    shelfMesh(shelfX, shelfZ, Math.PI, 3.1, 3);
    shelfMesh(G.cx(12) + 0.3, G.cz(13), Math.PI / 2, 2.4, 2.2);
    const keyM = new THREE.Group(); { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16), stdMat({ color: 0xc8a040, metalness: 0.9, roughness: 0.3 })); const tag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.01), stdMat({ color: 0xc01818, emissive: 0x400000 })); tag.position.y = -0.07; keyM.add(ring); keyM.add(tag); }
    keyM.position.set(shelfX, 3.17, shelfZ); World.group.add(keyM);
    const keyGlow = new THREE.PointLight(0xff3030, 0.6, 2.5); keyGlow.position.set(shelfX, 3.0, shelfZ - 0.3); World.group.add(keyGlow);
    Game.flags.pieces = 0;
    const ladder = new THREE.Group(); { const wood = stdMat({ color: 0x8a6a40, roughness: 0.7 }); for (const s of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.0, 0.06), wood); rail.position.set(s * 0.22, 1.5, 0); ladder.add(rail); } for (let i = 0; i < 9; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.05), wood); st.position.y = 0.3 + i * 0.32; ladder.add(st); } }
    ladder.position.set(shelfX, 0, shelfZ - 0.55); ladder.rotation.x = -0.18; ladder.visible = false; World.group.add(ladder);
    addInteract({ pos: { x: shelfX, y: 1.6, z: shelfZ - 0.4 }, r: 2.2, cond: () => !Game.flags.gotKey, label: () => Game.flags.pieces >= 4 ? (ladder.visible ? 'اطلع السلّم وخذ المفتاح' : 'ركّب السلّم') : `المفتاح فوق… تحتاج سلّم (${ar(Game.flags.pieces)}/٤)`, use: () => {
      if (Game.flags.pieces < 4) { UI.msg('عالي مرة. لازم تلقى كل قطع السلّم.', 2600); return; }
      if (!ladder.visible) { ladder.visible = true; SFX.clank(shelfX, shelfZ); Game.noise(shelfX, shelfZ, 9); UI.msg('ركّبت السلّم.', 1800); return; }
      Game.flags.gotKey = true; World.group.remove(keyM); keyGlow.intensity = 0; SFX.pick(); Game.inv.redkey = true; Game.updateInv();
      UI.objective('افتح باب «قاعة الاختبار» الأحمر', 'شرق الردهة'); UI.msg('أخذت <b>مفتاح قاعة الاختبار</b> 🔴', 3000); Game.shake(0.2);
      // the lights in the library die right after (troll)
      later(() => { World.fixtures.filter(f => Math.hypot(f.x - shelfX, f.z - shelfZ) < 9).forEach(f => f.dead = true); SFX.lightsOff(); if (Game.monsters[0].state === 'off') l0Spawn(); else Game.noise(shelfX, shelfZ, 30); }, 900);
    } });
    // ladder pieces: 4 from candidate cells
    const cands = [[1, 14], [4, 7], [8, 5], [11, 9], [15, 1], [3, 11], [13, 4], [7, 15], [10, 13], [5, 1], [14, 13], [0, 9]].filter(([x, y]) => !(x >= 12 && y >= 12));
    for (let i = cands.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[cands[i], cands[j]] = [cands[j], cands[i]]; }
    cands.slice(0, 4).forEach(([cx, cy]) => {
      const piece = new THREE.Group(); const wood = stdMat({ color: 0x9a7444, roughness: 0.7, emissive: 0x1a1006 }); const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.9), wood); const r2 = r1.clone(); r2.position.x = 0.36; const st = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.05), wood); st.position.x = 0.18; piece.add(r1); piece.add(r2); piece.add(st); piece.rotation.z = 0.1;
      pickupItem(piece, G.cx(cx) + rnd(-0.6, 0.6), 0.06, G.cz(cy) + rnd(-0.6, 0.6), 'خذ قطعة السلّم', () => {
        Game.flags.pieces++; UI.msg(`قطعة سلّم <b>${ar(Game.flags.pieces)}/٤</b>`, 2200); UI.objective(Game.flags.pieces < 4 ? `اجمع قطع السلّم (${ar(Game.flags.pieces)}/٤)` : 'روح لرف المكتبة العالي وركّب السلّم', Game.flags.pieces < 4 ? 'متفرقة بالممرات' : 'المكتبة · الزاوية الجنوبية الشرقية');
        if (Game.flags.pieces === 2 && Game.monsters[0].state === 'off') l0Spawn();
        if (Game.flags.pieces === 3) { const near = World.fixtures.filter(f => f.d2 < 30); near.slice(0, 2).forEach(f => { f.dead = true; SFX.bulbPop(f.x, f.z); }); Game.shake(0.3); }
      });
    });
    // red door → pit hall
    red.onUnlock = () => { UI.objective('اعبر الجسور… ولا تطيح', 'توازن بـ A و D، والقفزة بالمسافة'); };
    buildPitHall(G, S, WH);
    // spawn
    Player.pos.set(G.cx(1), 0, G.cz(1)); Player.yaw = Math.PI * 0.25;
    noteOnWall(G, 0, 1, 'w', NOTES.L0, () => { if (!Game.flags.obj0) { Game.flags.obj0 = 1; UI.objective('اجمع قطع السلّم (٠/٤)', 'متفرقة بالممرات'); } });
    Game.flags.l0start = Game.t;
    // the doctor
    const mj = new Monster('mujahid', { walk: 1.25, run: 5.75, sight: 18, sightDark: 5, doors: 'bang', catchR: 0.95 }); Game.monsters.push(mj);
    mj.place(G.cx(14), G.cz(2));
    LEVELS.L0.cp = null;
  },
  update(dt) {
    const t = Game.t - Game.flags.l0start, F = Game.flags;
    if (!F.toast1 && t > 22) { F.toast1 = 1; SFX.phone(); UI.toast('د. مجاهد', 'وينك يا عبدالملك؟ الكويز بدأ 🙂'); }
    if (!F.falseKnock && t > 48) { F.falseKnock = 1; const a = Player.yaw + Math.PI; SFX.knock(Player.pos.x + Math.sin(a) * 7, Player.pos.z + Math.cos(a) * 7, 3); }
    if (!F.spawned && t > 160) l0Spawn();
    if (F.spawned && !F.taunt1 && Game.t - F.spawnT > 25) { F.taunt1 = 1; const m = Game.monsters[0]; voice('m4', m.pos.x, m.pos.z); }
    updatePitHall(dt);
  },
  onFall() { if (Game.flags.falling) return; Game.flags.falling = true; SFX.fall(); Game.state = 'transition'; Game.trans = { t: 1.2, next: 'L0B' }; },
  respawn() {
    const F = Game.flags, G = World.grid; Game.state = 'play';
    if (F.gotKey) { Player.pos.set(G.cx(14), 0, G.cz(7)); Player.yaw = -Math.PI / 2; } else { Player.pos.set(G.cx(1), 0, G.cz(1)); Player.yaw = Math.PI * 0.25; }
    Player.vel.set(0, 0, 0); Player.vy = 0; Player.onGround = true; Player.stamina = 1; Player.exhausted = false; Player.pitch = 0;
    const m = Game.monsters[0]; m.path = []; m.bang = null; m.target = null; m.lastSeenPos = null; m.sawHide = false;
    if (F.spawned) { let best = null, bd = 0; for (let i = 0; i < 60; i++) { const x = (Math.random() * G.W) | 0, y = (Math.random() * G.H) | 0; const wx = G.cx(x), wz = G.cz(y); const d = Math.hypot(wx - Player.pos.x, wz - Player.pos.z); if (d > bd && !losCheck(wx, wz, Player.pos.x, Player.pos.z)) { bd = d; best = [wx, wz]; } } if (best) m.place(best[0], best[1]); m.state = 'wander'; m.root.visible = true; }
    UI.msg('…رجعت. بس هو ما زال هنا.', 2600);
  }
};
function l0Spawn() {
  const F = Game.flags; if (F.spawned) return; F.spawned = true; F.spawnT = Game.t; const m = Game.monsters[0];
  // spawn far from the player, out of sight
  const G = World.grid; let best = null, bd = 0; for (let i = 0; i < 60; i++) { const x = (Math.random() * G.W) | 0, y = (Math.random() * G.H) | 0; const wx = G.cx(x), wz = G.cz(y); const d = Math.hypot(wx - Player.pos.x, wz - Player.pos.z); if (d > bd && d < 30 && !losCheck(wx, wz, Player.pos.x, Player.pos.z)) { bd = d; best = [wx, wz]; } }
  if (best) m.place(best[0], best[1]);
  SFX.knock(m.pos.x, m.pos.z, 4); later(() => SFX.knock(m.pos.x, m.pos.z, 3), 1600);
  later(() => { m.activate('wander'); voice('m1', m.pos.x, m.pos.z, { force: true }); }, 2600);
  UI.msg('…<b>طق طق طق</b>', 2200);
}
/* the pitfalls: narrow beams over a dark drop, a jump, then the vent */
function buildPitHall(G, S, WH) {
  const x0 = G.W * S, z0 = G.cz(7), len = 20, half = 3.2;
  const mWall = style.L0.wall, dark = stdMat({ color: 0x1c1810, roughness: 1 });
  // walls & ceiling of the hall
  const geos = [boxGeo(len, WH + 16, 0.2, x0 + len / 2, (WH - 16) / 2, z0 - half, 2, WH), boxGeo(len, WH + 16, 0.2, x0 + len / 2, (WH - 16) / 2, z0 + half, 2, WH), boxGeo(0.2, WH + 16, half * 2, x0 + len, (WH - 16) / 2, z0, 2, WH)];
  addMerged(geos, mWall);
  addBoxCollider(x0, z0 - half - 0.1, x0 + len, z0 - half + 0.1, -20, 20); addBoxCollider(x0, z0 + half - 0.1, x0 + len, z0 + half + 0.1, -20, 20); addBoxCollider(x0 + len - 0.1, z0 - half, x0 + len + 0.1, z0 + half, -20, 20);
  addMerged([planeGeo(len, half * 2, x0 + len / 2, WH, z0, 1.2, true)], style.L0.ceil);
  // platforms (start 2m, end 3m) + pit floor far below
  const plat = stdMat({ map: TEX.carpet, roughness: 1 });
  addMerged([boxGeo(2.2, 0.3, half * 2, x0 + 1.1, -0.15, z0, 2), boxGeo(3.2, 0.3, half * 2, x0 + len - 1.6, -0.15, z0, 2)], plat);
  addMerged([planeGeo(len, half * 2, x0 + len / 2, -14, z0, 2, false)], new THREE.MeshBasicMaterial({ color: 0x000000, fog: false }));
  World.voids.push({ x0: x0 + 2.2, x1: x0 + len - 3.2, z0: z0 - half, z1: z0 + half, y: -14 });
  World.killY = -6;
  // beams: zig-zag, with a gap you must jump
  const beamM = stdMat({ color: 0x5a5852, metalness: 0.6, roughness: 0.5, map: TEX.metal });
  const B = [[x0 + 2.1, z0, x0 + 7.4, z0 - 1.6], [x0 + 7.4, z0 - 1.6, x0 + 11.2, z0 + 1.2], [x0 + 12.6, z0 + 1.2, x0 + 16.9, z0]];
  B.forEach(([ax, az, bx, bz]) => {
    const L = Math.hypot(bx - ax, bz - az), m = new THREE.Mesh(new THREE.BoxGeometry(L + 0.2, 0.22, 0.32), beamM); m.position.set((ax + bx) / 2, -0.11, (az + bz) / 2); m.rotation.y = -Math.atan2(bz - az, bx - ax); World.group.add(m);
    World.beams.push({ ax, az, bx, bz, hw: 0.2, y: 0 });
    for (let i = 0; i < 3; i++) { const sup = new THREE.Mesh(new THREE.BoxGeometry(0.12, 14, 0.12), dark); sup.position.set(lerp(ax, bx, (i + 0.5) / 3), -7.2, lerp(az, bz, (i + 0.5) / 3)); World.group.add(sup); }
  });
  // a few weak lights in the hall
  [x0 + 4, x0 + 10, x0 + 16].forEach((x, i) => World.fixtures.push({ x, z: z0, y: WH, base: 1, level: 1, flick: i === 1 ? 0.5 : 0.15, i: -1 }));
  // vent at the end wall
  const vent = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), stdMat({ map: TEX.grate, color: 0x777777, metalness: 0.6 })); vent.position.set(x0 + len - 0.12, 0.6, z0); vent.rotation.y = -Math.PI / 2; World.group.add(vent);
  const ventDark = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), stdMat({ color: 0x000000 })); ventDark.position.set(x0 + len - 0.13, 0.6, z0); ventDark.rotation.y = -Math.PI / 2; World.group.add(ventDark);
  addInteract({ pos: { x: x0 + len - 0.6, y: 0.6, z: z0 }, r: 2, label: 'ادخل فتحة التهوية', use: () => { Game.flags.done0 = true; UI.msg('…', 800); noclipTo('L1'); } });
  addTrigger({ x: x0 + 1, z: z0, w: 1, d: half, fire: () => { UI.msg('لا تطالع تحت…', 2200); } });
  World.pitHall = { x0, z0, len, half };
  // balance hint text on the wall
  const hint = signTex({ w: 512, h: 128, bg: '#c8b35a', age: true, lines: [{ t: 'خطوة خطوة… ولا تطالع تحت', y: 82, s: 44, c: '#3a2a10', f: 'Aref Ruqaa, serif' }] });
  poster(hint, x0 + 1.4, 2.2, z0 - half + 0.12, 0, 1.6, 0.4);
  // supports for the hall's light fixtures in the global list need instancing: rebuild fixtures mesh
  buildFixtures(World.fixtures, WH, { intensity: 2.4, power: 5.5, range: 8.5, lightColor: 0xfff0c0 });
}
function updatePitHall(dt) {
  const H = World.pitHall; if (!H) return; const P = Player.pos;
  Player.onBeam = P.x > H.x0 + 2.2 && P.x < H.x0 + H.len - 3.2 && Player.onGround && P.y > -0.2;
}

/* ============================== LEVEL 0B (sublevel after a fall) ============================== */
LEVELS.L0B = {
  id: 'L0B', order: 0, card: ['LEVEL 0 · ‎B', 'القبو', 'طحت… بس ما زال فيه مخرج'], surface: 'carpet', vig: 1.35, sat: 0.7,
  build() {
    const S = 2.6, W = 11, H = 11, WH = 2.6; World.wallH = WH; World.wallMat = style.L0B.wall;
    const G = makeGrid(W, H, S); World.grid = G; const rand = mulberry(Math.random() * 1e9 | 0);
    // perfect maze (DFS) for long corridors
    for (let i = 0; i < G.h.length; i++) G.h[i] = 1; for (let i = 0; i < G.v.length; i++) G.v[i] = 1;
    const seen = new Uint8Array(W * H), st = [[0, 0]]; seen[0] = 1;
    while (st.length) { const [x, y] = st[st.length - 1]; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => G.inside(a, b) && !seen[b * W + a]); if (!nb.length) { st.pop(); continue; } const [nx, ny] = nb[(rand() * nb.length) | 0]; G.setEdge(x, y, nx, ny, 0); seen[ny * W + nx] = 1; st.push([nx, ny]); }
    for (let i = 0; i < 14; i++) { const x = (rand() * (W - 1)) | 0, y = (rand() * (H - 1)) | 0; G.setEdge(x, y, x + 1, y, 0); }
    G.border();
    setupEnv({ fog: 0x1a150b, fogD: 0.06, sky: 0x8a7a48, ground: 0x1a140c, amb: 0.75, exposure: 1.3, bloom: 0.7, hum: 0.25, drone: 0.55, tint: [1, 0.95, 0.85], grain: 0.1 });
    buildGridWalls(G, style.L0B.wall, WH);
    buildGridFloor(G, style.L0B.floor, style.L0B.ceil, WH, 2.4, { ceilUV: 1.2 });
    const fx = fixturesGrid(G, 2, 1).map(f => Object.assign(f, { flick: rnd(0.25, 0.6), on: Math.random() > 0.25 }));
    buildFixtures(fx, WH, { intensity: 1.8, power: 5, range: 7.5, lightColor: 0xffd8a0 }); initLightPool(8);
    // path from start to exit → arrows on walls
    const path = bfsPath(G, 0, 0, W - 1, H - 1, true) || [];
    const arrowTex = signTex({ w: 256, h: 256, bg: 'rgba(0,0,0,0)', age: false, extra: (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#0a0806'; g.beginPath(); g.moveTo(30, 100); g.lineTo(150, 100); g.lineTo(150, 50); g.lineTo(230, 128); g.lineTo(150, 206); g.lineTo(150, 156); g.lineTo(30, 156); g.fill(); } });
    const arrowM = new THREE.MeshStandardMaterial({ map: arrowTex, transparent: true, roughness: 1 });
    let prev = [G.cx(0), G.cz(0)];
    path.forEach((p, i) => { if (i % 2) { prev = p; return; } const dx = p[0] - prev[0], dz = p[1] - prev[1]; const [cx, cy] = G.cell(prev[0], prev[1]);
      // put arrow on a wall of the previous cell that is parallel to the movement
      const sides = Math.abs(dx) > Math.abs(dz) ? ['n', 's'] : ['w', 'e']; for (const sd of sides) { const blocked = sd === 'n' ? G.h[G.hi(cx, cy)] : sd === 's' ? G.h[G.hi(cx, cy + 1)] : sd === 'w' ? G.v[G.vi(cx, cy)] : G.v[G.vi(cx + 1, cy)]; if (blocked === 1) { const w = onWall(G, cx, cy, sd, 1.3); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), arrowM); m.position.set(w.x, 1.3, w.z); m.rotation.y = w.ry; // orient arrow along travel
          const fwd = new THREE.Vector3(dx, 0, dz).normalize(); const right = new THREE.Vector3(Math.cos(w.ry), 0, -Math.sin(w.ry)); m.rotation.z = fwd.dot(right) < 0 ? Math.PI : 0; World.group.add(m); break; } }
      prev = p; });
    // exit stairs + vent
    const ex = G.cx(W - 1), ez = G.cz(H - 1);
    const stairs = new THREE.Group(); const sm = stdMat({ color: 0x6a5f4a, roughness: 0.9 }); for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.32), sm); s.position.set(0, 0.09 + i * 0.18, -i * 0.3); stairs.add(s); } stairs.position.set(ex, 0, ez + 0.9); World.group.add(stairs);
    const glow = new THREE.PointLight(0xbfe0ff, 1.4, 6); glow.position.set(ex, 2, ez - 0.5); World.group.add(glow);
    addInteract({ pos: { x: ex, y: 1.4, z: ez }, r: 2.2, label: 'اطلع الدرج وادخل الفتحة', use: () => noclipTo('L1') });
    Player.pos.set(G.cx(0), 0, G.cz(0)); Player.yaw = Math.PI;
    noteOnWall(G, 0, 0, 'n', NOTES.L0B, () => UI.objective('اتبع الأسهم السودا', 'الدرج في آخر القبو'));
    UI.msg('…سقطت', 1800);
    const mj = new Monster('mujahid', { walk: 1.6, run: 6.0, sight: 14, sightDark: 7, doors: 'open', catchR: 0.95 }); Game.monsters.push(mj); mj.place(G.cx(W - 2), G.cz(2));
    Game.flags.l0bT = Game.t;
    // lockers to hide
    [[3, 3], [6, 7], [8, 2]].forEach(([cx, cy]) => { for (const sd of ['n', 's', 'w', 'e']) { const blocked = sd === 'n' ? G.h[G.hi(cx, cy)] : sd === 's' ? G.h[G.hi(cx, cy + 1)] : sd === 'w' ? G.v[G.vi(cx, cy)] : G.v[G.vi(cx + 1, cy)]; if (blocked === 1) { const p = onWall(G, cx, cy, sd, 0); addLockerHide(p.x + Math.sin(p.ry) * 0.25, p.z + Math.cos(p.ry) * 0.25, p.ry, 0x4a5458); break; } } });
  },
  update() { const F = Game.flags; if (!F.l0bSpawn && Game.t - F.l0bT > 14) { F.l0bSpawn = 1; const m = Game.monsters[0]; SFX.knock(m.pos.x, m.pos.z, 5); later(() => { m.activate('wander'); voice('m2', m.pos.x, m.pos.z, { force: true }); }, 1500); } },
  respawn() { startLevel('L0B'); }
};

/* ============================== LEVEL 1: parking ============================== */
const CAR_COLORS = [{ id: 'red', name: 'أحمر', color: '#c62828', hex: 0xb81e1e }, { id: 'blue', name: 'أزرق', color: '#1e5bc6', hex: 0x1c4fb0 }, { id: 'white', name: 'أبيض', color: '#e8e8e8', hex: 0xdedede }, { id: 'yellow', name: 'أصفر', color: '#e0b21a', hex: 0xd4a514 }, { id: 'green', name: 'أخضر', color: '#2e8b3e', hex: 0x24803a }, { id: 'black', name: 'أسود', color: '#222', hex: 0x18181a }];
function carMesh(color) {
  const g = new THREE.Group(); const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.35 }), glass = new THREE.MeshStandardMaterial({ color: 0x0c1218, metalness: 0.8, roughness: 0.1 }), tire = stdMat({ color: 0x0b0b0b, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.62, 4.4), paint); body.position.y = 0.55; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.52, 2.2), glass); cab.position.set(0, 1.1, -0.2); g.add(cab);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.06, 1.8), paint); roof.position.set(0, 1.38, -0.25); g.add(roof);
  for (const [x, z] of [[-0.85, 1.4], [0.85, 1.4], [-0.85, -1.4], [0.85, -1.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 16), tire); w.rotation.z = Math.PI / 2; w.position.set(x, 0.34, z); g.add(w); }
  const hl = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x222018 }); for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.05), hl); l.position.set(s * 0.6, 0.66, 2.21); g.add(l); }
  return g;
}
function elevatorCab(x, z, ry) { // returns {group, doorL, doorR, open(t)}
  const g = new THREE.Group(); const steel = stdMat({ color: 0x9aa0a6, metalness: 0.85, roughness: 0.28, map: TEX.metal });
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.1), steel); back.position.set(0, 1.4, -1.1); g.add(back);
  for (const s of [-1, 1]) { const side = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.8, 2.2), steel); side.position.set(s * 1.1, 1.4, 0); g.add(side); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 2.2), steel); roof.position.y = 2.8; g.add(roof);
  const fl = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 2.2), stdMat({ color: 0x2a2a2a, roughness: 0.6 })); fl.position.y = 0.02; g.add(fl);
  const lamp = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), new THREE.MeshStandardMaterial({ emissive: 0xfff2dd, emissiveIntensity: 2, color: 0 })); lamp.rotation.x = Math.PI / 2; lamp.position.y = 2.74; g.add(lamp);
  const frame = stdMat({ color: 0x5a5e62, metalness: 0.7, roughness: 0.4 });
  for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.8, 0.2), frame); f.position.set(s * 1.25, 1.4, 1.1); g.add(f); }
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.5, 0.2), frame); top.position.set(0, 2.55, 1.1); g.add(top);
  const doorL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.3, 0.06), steel), doorR = doorL.clone(); doorL.position.set(-0.55, 1.15, 1.12); doorR.position.set(0.55, 1.15, 1.12); g.add(doorL); g.add(doorR);
  const light = new THREE.PointLight(0xfff0d8, 2.2, 5); light.position.set(0, 2.4, 0); g.add(light);
  g.position.set(x, 0, z); g.rotation.y = ry; World.group.add(g);
  const E = { g, doorL, doorR, open: 0, target: 0, x, z, ry, light };
  World.updaters.push(dt => { E.open += clamp(E.target - E.open, -dt * 1.1, dt * 1.1); doorL.position.x = -0.55 - E.open * 1.0; doorR.position.x = 0.55 + E.open * 1.0; });
  // colliders: back and sides (world space)
  const c = Math.cos(ry), s = Math.sin(ry); const toW = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  const boxW = (lx0, lz0, lx1, lz1) => { const a = toW(lx0, lz0), b = toW(lx1, lz1); return addBoxCollider(a[0], a[1], b[0], b[1], 0, 3); };
  boxW(-1.15, -1.2, 1.15, -1.05); boxW(-1.2, -1.15, -1.05, 1.15); boxW(1.05, -1.15, 1.2, 1.15);
  E.doorCol = boxW(-1.1, 1.05, 1.1, 1.18); World.updaters.push(() => { E.doorCol.off = E.open > 0.7; });
  E.inside = () => { const dx = Player.pos.x - x, dz = Player.pos.z - z; const lx = dx * c - dz * s, lz = dx * s + dz * c; return Math.abs(lx) < 1 && lz > -1.05 && lz < 0.95; };
  E.center = toW(0, -0.2);
  return E;
}
LEVELS.L1 = {
  id: 'L1', order: 1, card: ['LEVEL 1', 'موقف الكلية', 'تحت المبنى… حيث ما أحد يسمعك'], surface: 'concrete', vig: 1.15, sat: 0.8,
  build() {
    const S = 4, W = 14, H = 10, WH = 3.4; World.wallH = WH; World.wallMat = style.L1.wall;
    const G = makeGrid(W, H, S); World.grid = G; const rand = mulberry(4417);
    G.border();
    // Zone A: x 0..3 (spawn hall y 0..3, car room y 5..8). Zone B: x 5..13 big garage with side rooms.
    // zone separators
    for (let y = 0; y < H; y++) G.v[G.vi(4, y)] = 1; for (let y = 0; y < H; y++) G.v[G.vi(5, y)] = 1;
    G.room(0, 0, 3, 3); G.room(0, 5, 3, 8); G.setEdge(1, 3, 1, 4, 0); G.setEdge(1, 4, 1, 5, 2); // corridor cell (x0..3,y4)
    G.room(0, 4, 3, 4); G.setEdge(1, 3, 1, 4, 0);
    for (let x = 0; x < 4; x++) G.floor[9 * W + x] = 0; for (let y = 0; y < H; y++) G.floor[y * W + 4] = 0;
    // zone B side rooms: along north (y=0) and south (y=9) walls
    const rooms = [[6, 0], [9, 0], [12, 0], [6, 9], [9, 9], [12, 9]];
    rooms.forEach(([x, y]) => { G.room(x, y, x + 1, y); });
    G.noMonster = new Uint8Array(W * H);
    setupEnv({ fog: 0x1a1d20, fogD: 0.045, sky: 0x8a96a2, ground: 0x15171a, amb: 0.32, exposure: 1.1, bloom: 0.6, hum: 0.25, drone: 0.4, wind: 0.5, tint: [0.95, 1, 1.03], grain: 0.08 });
    G.v[G.vi(W, 4)] = 0; // opening behind the exit gate (the cage sits outside the grid)
    const carDoor = addDoor(G, 1, 4, 1, 5, { tex: TEX.metalDoor, window: true, trim: 0x444444, width: 1.1 });
    const roomDoors = rooms.map(([x, y]) => addDoor(G, x, y, x, y === 0 ? 1 : 8, { tex: TEX.metalDoor, trim: 0x444444 }));
    buildGridWalls(G, style.L1.wall, WH, 0.3, 3);
    buildGridFloor(G, style.L1.floor, style.L1.ceil, WH, 3);
    // columns + parking lines in zone B
    const colM = stdMat({ map: TEX.concrete, color: 0xb0b0aa, roughness: 0.9 }), lineM = new THREE.MeshStandardMaterial({ color: 0xd8c44a, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1 });
    for (let x = 7; x <= 12; x += 2) for (let y = 3; y <= 7; y += 2) prop(new THREE.BoxGeometry(0.7, WH, 0.7), colM, x * S, WH / 2, y * S);
    for (let x = 5.6; x < 13.5; x += 0.65) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 4.2), lineM); l.rotation.x = -Math.PI / 2; l.position.set(x * S, 0.01, 2.6 * S); World.group.add(l); const l2 = l.clone(); l2.position.z = 7.4 * S; World.group.add(l2); }
    // fixtures: zone A brighter, zone B flickery tubes
    const fx = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!G.floor[y * W + x]) continue; if ((x + y) % 2) continue; fx.push({ x: G.cx(x), z: G.cz(y), flick: x > 4 ? rnd(0.1, 0.45) : 0.05, on: Math.random() > 0.1, zone: x > 4 ? 'B' : 'A' }); }
    buildFixtures(fx, WH, { intensity: 2.2, power: 6.5, range: 11, lightColor: 0xd8ecff, color: 0xeaf4ff, w: 1.6, d: 0.2 }); initLightPool(8);
    // cars in the car room (random color order) → code
    const order = CAR_COLORS.slice(0, 5).sort(() => Math.random() - 0.5).slice(0, 4); Game.flags.code = order.map(c => c.id);
    order.forEach((c, i) => { const car = carMesh(c.hex); car.position.set(12.2 - i * 3.0, 0, 7 * S); car.rotation.y = Math.PI; World.group.add(car); addBoxCollider(car.position.x - 0.95, car.position.z - 2.25, car.position.x + 0.95, car.position.z + 2.25, 0, 1.4); });
    poster(signTex({ w: 512, h: 160, bg: '#18324a', lines: [{ t: 'مواقف أعضاء هيئة التدريس', y: 70, s: 40, c: '#fff' }, { t: 'من اليسار لليمين ←', y: 130, s: 28, c: '#9fc6e8' }] }), 2 * S, 2.4, 5 * S + 0.25, 0, 2.2, 0.7);
    // spawn hall props
    poster(signTex({ w: 512, h: 160, bg: '#0f5135', lines: [{ t: 'كلية الصيدلة', y: 75, s: 52, c: '#fff' }, { t: 'College of Pharmacy · B1', y: 130, s: 30, c: '#bfe8d0', f: 'Arial' }] }), 2 * S, 2.6, 0.2, 0, 2.4, 0.75);
    // elevator A (zone A, east side of spawn hall facing west)
    const eA = elevatorCab(3.6 * S + 0.1, 1.5 * S, -Math.PI / 2); Game.flags.eA = eA;
    const eB = elevatorCab(5 * S + 1.4, 4.5 * S, Math.PI / 2); Game.flags.eB = eB; eB.target = 0;
    const kp = { x: 3.6 * S - 1.1, z: 1.5 * S + 1.6 };
    const kpm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.24), stdMat({ color: 0x222222, metalness: 0.6, emissive: 0x112211 })); kpm.position.set(eA.x - 1.22, 1.3, eA.z + 1.6); World.group.add(kpm);
    const kpl = new THREE.PointLight(0x40ff80, 0.6, 2.2); kpl.position.set(eA.x - 1.5, 1.4, eA.z + 1.6); World.group.add(kpl);
    addInteract({ pos: { x: eA.x - 1.25, y: 1.3, z: eA.z + 1.6 }, r: 2.2, cond: () => !Game.flags.codeOk, label: 'لوحة المصعد', use: () => {
      if (!Game.flags.trolled) { Game.flags.trolled = 1; elevatorTroll(eA); return; }
      openKeypad({ title: 'المصعد · B1 ← B3', hint: 'رمز الألوان (٤)', len: 4, code: Game.flags.code, keys: CAR_COLORS.map(c => ({ id: c.id, color: c.color, name: c.name })), onOk: () => { Game.flags.codeOk = 1; eA.target = 1; SFX.elevatorDing(); UI.objective('ادخل المصعد', ''); } });
    } });
    addTrigger({ x: eA.x - 0.2, z: eA.z, w: 0.8, d: 0.8, cond: () => Game.flags.codeOk && !Game.flags.ridden && eA.inside(), fire: () => rideElevator(eA, eB) });
    // keys panel in zone B (on the separator wall facing east) with 4 slots spaced apart
    Game.flags.keys = 0; Game.flags.slots = [0, 0, 0, 0]; Game.flags.turnT = 0;
    const slotX = 5 * S + 0.2, slotZs = [3.0 * S, 3.6 * S, 5.4 * S, 6.0 * S];
    const slotMs = slotZs.map((z, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.18), stdMat({ color: 0x333333, metalness: 0.7, emissive: 0x220000 })); m.position.set(slotX, 1.3, z); World.group.add(m); return m; });
    poster(signTex({ w: 512, h: 128, bg: '#2a2a2a', lines: [{ t: 'لوحة البوابة · ٤ مفاتيح', y: 80, s: 40, c: '#ffd36b' }] }), slotX + 0.02, 2.2, 3.3 * S, Math.PI / 2, 1.8, 0.45);
    slotZs.forEach((z, i) => addInteract({ pos: { x: slotX + 0.3, y: 1.3, z }, r: 1.8, cond: () => Game.flags.ridden && !Game.flags.gateOpen, label: () => Game.flags.slots[i] === 2 ? 'ملفوف ✓' : Game.flags.slots[i] === 1 ? 'لف المفتاح' : (Game.flags.keys > Game.flags.slots.filter(s => s).length ? 'ركّب مفتاح' : 'فتحة مفتاح فاضية'), use: () => keySlot(i, slotMs) }));
    // lockers in side rooms: 4 contain keys, 2 are hiding spots
    const keyRooms = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
    rooms.forEach(([x, y], ri) => {
      const north = y === 0; const zW = north ? G.oz + 0.35 : G.oz + H * S - 0.35, ry = north ? 0 : Math.PI;
      const L1x = G.cx(x) - 0.6, L2x = G.cx(x + 1) + 0.6;
      const hideL = addLockerHide(L1x, zW + (north ? 0.25 : -0.25), ry, 0x6a7a6e);
      const L = lockerMesh(L2x, zW + (north ? 0.25 : -0.25), ry, 0x7a6a5e);
      const hasKey = keyRooms.indexOf(ri) < 4;
      addInteract({ pos: { x: L.front.x, y: 1.2, z: L.front.z }, r: 1.7, once: true, label: 'فتّش خزانة المعاطف', use: () => { SFX.doorOpen(L.x, L.z); Game.noise(L.x, L.z, 5); if (hasKey) { Game.flags.keys++; SFX.pick(); const id = 'k' + Game.flags.keys; Game.inv[id] = true; Game.updateInv(); UI.msg(`لقيت <b>مفتاح ${ar(Game.flags.keys)}/٤</b> 🗝️`, 2400); UI.objective(Game.flags.keys < 4 ? `دوّر على المفاتيح (${ar(Game.flags.keys)}/٤)` : 'ركّب المفاتيح الأربعة في اللوحة', Game.flags.keys < 4 ? 'خزائن المعاطف في الغرف الجانبية' : 'الجدار الغربي'); if (Game.flags.keys === 2 && !Game.flags.alarm) carAlarmTroll(); } else UI.msg('معاطف مختبر… وريحة فورمالين. ما فيه شي.', 2200); } });
      // a desk in each room to hide under too
      deskMesh(G.cx(x) + S / 2, G.cz(y), 0);
    });
    // zone B cars (alarm troll) + the exit gate at far east
    const tc = carMesh(0x5a5f66); tc.position.set(9.5 * S, 0, 2.4 * S); World.group.add(tc); addBoxCollider(tc.position.x - 0.95, tc.position.z - 2.25, tc.position.x + 0.95, tc.position.z + 2.25, 0, 1.4); Game.flags.alarmCar = tc;
    const tc2 = carMesh(0x8a1a1a); tc2.position.set(11.5 * S, 0, 7.5 * S); World.group.add(tc2); addBoxCollider(tc2.position.x - 0.95, tc2.position.z - 2.25, tc2.position.x + 0.95, tc2.position.z + 2.25, 0, 1.4);
    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.2, WH, S), stdMat({ map: TEX.metal, color: 0x8a8a7a, metalness: 0.6, roughness: 0.5 })); gate.position.set(W * S - 0.1, WH / 2, 4.5 * S); World.group.add(gate); Game.flags.gate = gate;
    const exitCage = elevatorCab(W * S + 1.3, 4.5 * S, -Math.PI / 2); exitCage.target = 1; exitCage.light.color.set(0xff4040);
    Game.flags.gateCol = addBoxCollider(W * S - 0.3, 4 * S, W * S, 5 * S, 0, WH);
    const fillM = style.L1.wall; prop(new THREE.BoxGeometry(2.2, WH, 0.6), fillM, W * S + 1.2, WH / 2, 4 * S + 0.25, 0, false); prop(new THREE.BoxGeometry(2.2, WH, 0.6), fillM, W * S + 1.2, WH / 2, 5 * S - 0.25, 0, false);
    addTrigger({ x: exitCage.x + 0.2, z: exitCage.z, w: 0.9, d: 0.9, cond: () => Game.flags.gateOpen, fire: () => { exitCage.target = 0; SFX.elevatorDing(); later(() => { SFX.elevatorMotor(3); Game.shake(0.4); }, 900); later(() => noclipTo('L2'), 2600); } });
    // spawn
    Player.pos.set(1.5 * S, 0, 1.4 * S); Player.yaw = Math.PI;
    noteOnWall(G, 0, 1, 'w', NOTES.L1, () => { if (!Game.flags.o1) { Game.flags.o1 = 1; UI.objective('شغّل المصعد', 'الرمز = ألوان السيارات ورا الباب أبو شباك'); } });
    const mh = new Monster('minhaj', { walk: 1.5, run: 6.3, sight: 20, sightDark: 6, doors: 'none', catchR: 1.05, fov: 2.2 }); Game.monsters.push(mh); mh.place(12.5 * S, 4.5 * S, -Math.PI / 2); mh.customUpdate = () => mh.state === 'lure';
    LEVELS.L1.cpB = false;
  },
  update(dt) {
    const F = Game.flags, P = Player.pos, mh = Game.monsters[0];
    // the 5-second key turn window
    if (F.turnT && Game.t > F.turnT) { F.turnT = 0; if (F.slots.some(s => s === 2) && !F.gateOpen) { F.slots = F.slots.map(s => s ? 1 : 0); SFX.error(); UI.msg('ما لحقت… المفاتيح رجعت. لفّها كلها خلال ٥ ثواني!', 3000); F.slotMs && F.slotMs.forEach(m => m.material.emissive.set(0x220000)); } }
    if (F.turnT) $('timer').textContent = ar(Math.max(0, Math.ceil(F.turnT - Game.t))); $('timer').classList.toggle('on', !!F.turnT);
    // lure sequence: Minhaj pretends to be a student at the far end
    if (F.ridden && !F.lureDone && mh.state === 'lure') {
      const d = Math.hypot(P.x - mh.pos.x, P.z - mh.pos.z); mh.doc.P.armR.rotation.x = -2.6 + Math.sin(Game.t * 6) * 0.4;
      if (Game.t > (F.lureVoice || 0)) { F.lureVoice = Game.t + 6; voice('n1', mh.pos.x, mh.pos.z, { force: true }); }
      if (d < 13 || Game.t - F.lureT > 24) { F.lureDone = 1; mh.stretch = 1.38; SFX.stinger(); Game.shake(0.5); later(() => { mh.state = 'chase'; mh.lastSeen = Game.t; mh.lastSeenPos = { x: P.x, z: P.z }; voice('n2', mh.pos.x, mh.pos.z, { force: true }); }, 700); }
    }
    if (F.blackout && Game.t > F.alarmBlink) { F.alarmBlink = Game.t + 0.6; World.lightMul = World.lightMul > 0.5 ? 0 : 1; }
  },
  respawn() {
    const F = Game.flags; if (!F.ridden) { startLevel('L1'); return; }
    // checkpoint after the elevator ride
    Player.pos.set(5 * World.grid.S + 3.5, 0, 4.5 * World.grid.S); Player.yaw = -Math.PI / 2; Player.hidden = false;
    const mh = Game.monsters[0]; mh.place(12.5 * World.grid.S, 1 * World.grid.S); mh.state = 'wander'; mh.stretch = 1.38; mh.doc.stretch = 1.38; mh.root.visible = true; mh.path = []; mh.target = null; mh.bang = null; F.lureDone = 1; Player.pitch = 0; Player.vel.set(0, 0, 0);
    if (F.gateOpen) { mh.state = 'chase'; mh.lastSeen = Game.t; mh.lastSeenPos = { x: Player.pos.x, z: Player.pos.z }; mh.place(12.5 * World.grid.S, 8 * World.grid.S); }
    F.turnT = 0; Game.state = 'play';
  }
};
function elevatorTroll(eA) { // doors open by themselves: he's standing inside, staring. Doors slam. Empty.
  const mh = Game.monsters[0]; const [cx, cz] = eA.center; mh.place(cx, cz, Math.PI / 2); mh.root.visible = true; mh.state = 'script'; mh.path = []; mh.doc.horror = true; mh.doc.faceM.emissiveIntensity = 0.8;
  eA.target = 1; SFX.elevatorDing(); later(() => { SFX.stinger(); Game.shake(0.6); voice('n3', cx, cz, { force: true }); }, 700);
  later(() => { eA.target = 0; SFX.doorShut(eA.x, eA.z); }, 2100);
  later(() => { mh.root.visible = false; mh.doc.horror = false; mh.doc.faceM.emissiveIntensity = 0; mh.state = 'off'; UI.msg('…ما شفت شي. صح؟', 2400); }, 3200);
}
function rideElevator(eA, eB) {
  const F = Game.flags; F.ridden = 1; eA.target = 0; SFX.doorShut(eA.x, eA.z); Player.frozen = true;
  later(() => { SFX.elevatorMotor(5); Game.shake(0.3); }, 900);
  later(() => { R.P.dark.value = 1; }, 2400);
  later(() => { // move to elevator B
    const [bx, bz] = eB.center; Player.pos.set(bx, 0, bz); Player.yaw = Math.PI / 2 + Math.PI; R.P.dark.value = 0;
    World.fixtures.forEach(f => { if (f.zone === 'A') f.base = 0; }); World.blackoutChanged = true;
  }, 3400);
  later(() => { SFX.elevatorDing(); eB.target = 1; Player.frozen = false; UI.objective('دوّر على المفاتيح (٠/٤)', 'خزائن المعاطف في الغرف الجانبية'); const mh = Game.monsters[0]; mh.place(13 * World.grid.S - 1.5, 4.5 * World.grid.S, -Math.PI / 2); mh.root.visible = true; mh.state = 'lure'; mh.doc.horror = false; mh.stretch = 1; Game.flags.lureT = Game.t; }, 5400);
}
function carAlarmTroll() { const F = Game.flags; F.alarm = 1; const c = F.alarmCar.position; later(() => { SFX.carAlarm(c.x, c.z); Game.noise(c.x, c.z, 40); UI.msg('…سيارة؟! ليش انطلق إنذارها؟', 2400); }, 1200); }
function keySlot(i, slotMs) {
  const F = Game.flags; F.slotMs = slotMs; const placed = F.slots.filter(s => s).length;
  if (F.slots[i] === 0) { if (F.keys > placed) { F.slots[i] = 1; SFX.unlock(); slotMs[i].material.emissive.set(0x333300); delete Game.inv['k' + (placed + 1)]; Game.updateInv(); if (F.slots.every(s => s)) UI.objective('لف المفاتيح الأربعة خلال ٥ ثواني!', 'شغّل أول واحد… واركض للباقي'); } else { SFX.locked(); UI.msg('تحتاج مفتاح.', 1500); } return; }
  if (F.slots[i] === 1) {
    if (!F.slots.every(s => s)) { UI.msg('ركّب الأربعة أول.', 1800); return; }
    F.slots[i] = 2; SFX.clank(slotMs[i].position.x, slotMs[i].position.z); slotMs[i].material.emissive.set(0x00aa33); Game.noise(Player.pos.x, Player.pos.z, 10);
    if (!F.turnT) F.turnT = Game.t + 5;
    if (F.slots.every(s => s === 2)) { F.turnT = 0; F.gateOpen = 1; openGate(); }
  }
}
function openGate() {
  const F = Game.flags; SFX.success(); SFX.rumble(3); Game.shake(0.6); UI.objective('اهرب للمصعد ورا البوابة!', 'آخر الموقف · شرق');
  F.blackout = true; F.alarmBlink = Game.t; World.fixColor.set(0xff2a1a); World.fixtures.forEach(f => { f.flick = 0; });
  setBed('hum', 0); SFX.lightsOff(); R.P.tint.value.set(1.1, 0.85, 0.85);
  const g = F.gate; World.updaters.push(dt => { if (g.position.y < World.wallH * 1.5) g.position.y += dt * 0.9; }); later(() => { F.gateCol.off = true; }, 2600);
  const mh = Game.monsters[0]; mh.run = 6.6; later(() => { mh.state = 'chase'; mh.lastSeen = Game.t; mh.lastSeenPos = { x: Player.pos.x, z: Player.pos.z }; voice('n3', mh.pos.x, mh.pos.z, { force: true }); }, 1500);
}

/* ============================== LEVEL 2: pipe dreams ============================== */
LEVELS.L2 = {
  id: 'L2', order: 2, card: ['LEVEL 2', 'ممرات الأنابيب', 'تحت المعامل… والنور ما يدوم'], surface: 'metal', vig: 1.25, sat: 0.85,
  build() {
    const S = 2.6, W = 14, H = 9, WH = 2.7; World.wallH = WH; World.wallMat = style.L2.wall;
    const G = makeGrid(W, H, S); World.grid = G; const rand = mulberry(9001);
    for (let i = 0; i < G.h.length; i++) G.h[i] = 1; for (let i = 0; i < G.v.length; i++) G.v[i] = 1;
    // hand-carved route: start (0,4) → junction (2,4) sign. FUN → north branch to party room (2..4, 0..1). STATION → south & east maze → maintenance room (6..7,7..8) → gate at (9,4) → final straight (9..13, 4) → party door at east end.
    const carve = cells => { for (let i = 1; i < cells.length; i++) G.setEdge(cells[i - 1][0], cells[i - 1][1], cells[i][0], cells[i][1], 0); };
    carve([[0, 4], [1, 4], [2, 4]]);
    carve([[2, 4], [2, 3], [2, 2], [3, 2], [4, 2], [4, 1]]); G.open(3, 0, 5, 1); // FUN room
    carve([[2, 4], [2, 5], [2, 6], [3, 6], [4, 6], [4, 5], [4, 4], [5, 4], [6, 4], [6, 3], [6, 2], [7, 2], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [7, 6], [6, 6], [6, 7]]);
    G.open(5, 7, 7, 8); // maintenance room
    carve([[4, 6], [4, 7], [4, 8], [3, 8], [2, 8], [1, 8], [1, 7], [0, 7], [0, 6]]); // side loop (steam + hiding)
    carve([[8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4]]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => G.inside(x + dx, y + dy) && G.edge(x, y, x + dx, y + dy) !== 1); G.floor[y * W + x] = n ? 1 : 0; }
    G.border();
    setupEnv({ fog: 0x0b0706, fogD: 0.07, sky: 0x6a3a28, ground: 0x0a0605, amb: 0.2, exposure: 1.25, bloom: 0.85, bloomT: 0.72, hum: 0.08, drone: 0.5, pipe: 0.7, tint: [1.05, 0.92, 0.85], grain: 0.1 });
    const gateDoor = addDoor(G, 8, 4, 9, 4, { tex: TEX.metalDoor, locked: true, trim: 0x333333, lockedMsg: 'البوابة تبي كلمة سر من الجهاز اللي جنبها.' });
    addDoor(G, 6, 6, 6, 7, { tex: TEX.metalDoor, trim: 0x333333 });
    buildGridWalls(G, style.L2.wall, WH, 0.2, 2.6);
    buildGridFloor(G, style.L2.floor, style.L2.ceil, WH, 1.3, { ceilUV: 2.6 });
    // pipes along corridor walls (instanced cylinders)
    const pipeM = new THREE.MeshStandardMaterial({ color: 0x6a5a4a, metalness: 0.75, roughness: 0.42, map: TEX.metal });
    const pipeG = new THREE.CylinderGeometry(0.09, 0.09, 1, 10); const runs = [];
    for (let y = 0; y <= H; y++) for (let x = 0; x < W; x++) if (G.h[G.hi(x, y)] === 1 && ((y > 0 && G.floor[(y - 1) * W + x]) || (y < H && G.floor[y * W + x]))) runs.push({ x: G.ox + (x + 0.5) * S, z: G.oz + y * S, rot: 'x', side: y < H && G.floor[y * W + x] ? 1 : -1 });
    for (let x = 0; x <= W; x++) for (let y = 0; y < H; y++) if (G.v[G.vi(x, y)] === 1 && ((x > 0 && G.floor[y * W + x - 1]) || (x < W && G.floor[y * W + x]))) runs.push({ x: G.ox + x * S, z: G.oz + (y + 0.5) * S, rot: 'z', side: x < W && G.floor[y * W + x] ? 1 : -1 });
    const im = new THREE.InstancedMesh(pipeG, pipeM, runs.length * 3); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, S, 1), pv = new THREE.Vector3(); let k = 0;
    runs.forEach(r => { for (let j = 0; j < 3; j++) { const off = 0.22 * r.side, yy = [2.35, 2.12, 0.42][j], rad = [1, 0.7, 1.2][j]; if (r.rot === 'x') { q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2); pv.set(r.x, yy, r.z + off); } else { q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2); pv.set(r.x + off, yy, r.z); } sc.set(rad, S, rad); m4.compose(pv, q, sc); im.setMatrixAt(k++, m4); } });
    im.count = k; World.group.add(im);
    // red/amber cage lamps
    const fx = fixturesGrid(G, 2, 1).map(f => Object.assign(f, { flick: rnd(0.05, 0.25), on: true }));
    buildFixtures(fx, WH, { intensity: 3.2, power: 4.8, range: 7.5, lightColor: 0xff8a4a, color: 0xffa060, w: 0.35, d: 0.35 }); initLightPool(8);
    // sign at the junction
    const sign = signTex({ w: 512, h: 300, bg: '#e9e4d6', border: '#222', bw: 10, lines: [{ t: '← المرح', y: 115, s: 64, c: '#c21' }, { t: 'المحطة →', y: 225, s: 64, c: '#123' }] });
    const sp = onWall(G, 2, 4, 'e', 1.6); poster(sign, sp.x, 1.7, sp.z, sp.ry, 1.0, 0.6);
    // FUN room: balloons, banner, disco lights (troll)
    const fun = { x: G.cx(4), z: G.cz(0) + S / 2 };
    const ban = signTex({ w: 1024, h: 200, bg: '#ffeb6b', age: false, lines: [{ t: '🎓 مبروك التخرج يا عبدالملك! 🎓', y: 130, s: 76, c: '#d01c6c' }] });
    poster(ban, fun.x, 2.2, G.oz + 0.12, 0, 3.6, 0.7);
    const balloonCols = [0xff3b6b, 0x3bb0ff, 0xffd23b, 0x6bff8a, 0xc06bff];
    for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), new THREE.MeshStandardMaterial({ color: pick(balloonCols), roughness: 0.25, metalness: 0.1 })); b.scale.y = 1.2; const bx = G.cx(3) + rnd(-1, 6.5), bz = G.cz(0) + rnd(-1, 2.5); b.position.set(bx, rnd(1.6, 2.4), bz); World.group.add(b); const ph = rnd(0, 6); World.updaters.push(() => { b.position.y += Math.sin(Game.t * 1.3 + ph) * 0.0015; }); }
    const disco = []; for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(pick(balloonCols), 0, 7); l.position.set(G.cx(3 + i), 2.2, G.cz(0) + 1); World.group.add(l); disco.push(l); }
    Game.flags.disco = disco;
    addTrigger({ x: fun.x, z: G.cz(1), w: S * 1.5, d: S * 0.5, fire: () => funTroll() });
    addTrigger({ x: G.cx(3), z: G.cz(2), w: S * 0.5, d: S * 0.5, fire: () => { partyStart(); disco.forEach(l => l.intensity = 2.5); } });
    // maintenance room: note with the password + terminal near gate + a desk to hide under
    noteOnWall(G, 6, 8, 's', NOTES.pw, () => (Game.flags.gotPw = 1) && UI.objective('افتح البوابة من الجهاز', 'كلمة السر = أول علاج للسكري النوع الثاني'));
    deskMesh(G.cx(5) + 1, G.cz(7) + 0.4, 0);
    addLockerHide(G.cx(7) + 0.6, G.oz + 8 * S + S - 0.6, Math.PI);
    const termP = onWall(G, 8, 3, 'e', 1.3); const tm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.08), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x0a3a1a, emissiveIntensity: 1.5 })); tm.position.set(termP.x, 1.35, termP.z); tm.rotation.y = termP.ry; World.group.add(tm);
    addInteract({ pos: { x: termP.x, y: 1.35, z: termP.z }, r: 2, cond: () => gateDoor.locked, label: 'استخدم الجهاز', use: () => openTerminal({ banner: 'QU-PHARM GATE CONTROL v2.4<br>&gt; أدخل كلمة السر:', answers: ['metformin', 'ميتفورمين', 'متفورمين', 'glucophage', 'جلوكوفاج'], okText: 'البوابة انفتحت.', creepy: true, onOk: () => { gateDoor.locked = false; gateDoor.target = 1; SFX.doorOpen(gateDoor.ex, gateDoor.ez); finalChase(); } }) });
    // steam vents (some low: crouch under; some timed)
    Game.flags.vents = [];
    const ventCells = [[4, 5, 'z', 'timed'], [6, 3, 'z', 'low'], [8, 5, 'z', 'timed'], [2, 8, 'x', 'timed'], [1, 7, 'z', 'low']];
    ventCells.forEach(([cx, cy, ax, kind], i) => addVent(G.cx(cx), G.cz(cy), ax, kind, i * 0.9));
    // spawn
    Player.pos.set(G.cx(0), 0, G.cz(4)); Player.yaw = -Math.PI / 2;
    noteOnWall(G, 0, 4, 'n', NOTES.L2, () => { if (!Game.flags.o2) { Game.flags.o2 = 1; UI.objective('لقّ غرفة الصيانة', 'اتبع لوحة «المحطة»'); } });
    const am = new Monster('amal', { walk: 1.3, run: 6.1, sight: 9, sightDark: 9, doors: 'open', catchR: 1.0 }); Game.monsters.push(am); am.place(-50, -50);
    am.customUpdate = (dt, d) => amalUpdate(am, dt, d);
    Game.flags.cycle = Game.t + 12; Game.flags.dark = false; World.killY = -50;
  },
  update(dt) {
    const F = Game.flags;
    if (!F.chase) lightCycle(dt);
    F.vents.forEach(v => v.update(dt));
    if (F.disco) F.disco.forEach((l, i) => { if (l.intensity > 0) l.color.setHSL((Game.t * 0.3 + i * 0.33) % 1, 1, 0.55); });
  },
  respawn() {
    const F = Game.flags, G = World.grid; if (F.chaseCP) { startFinal(true); return; }
    Game.state = 'play'; Game.hp = 2; F.dark = false; F.strikes = 0; World.blackout = false; World.blackoutChanged = true; setBed('pipe', 0.7);
    const am = Game.monsters[0]; am.state = 'off'; am.root.visible = false; am.doc.horror = false;
    const back = F.gotPw ? [8, 3] : [0, 4]; Player.pos.set(G.cx(back[0]) - (F.gotPw ? 0.6 : 0), 0, G.cz(back[1])); Player.yaw = F.gotPw ? Math.PI : -Math.PI / 2; Player.pitch = 0; Player.vel.set(0, 0, 0);
    F.cycle = Game.t + 9;
  }
};
function addVent(x, z, ax, kind, phase) {
  const g = new THREE.Group(); const m = stdMat({ color: 0x4a4038, metalness: 0.7, roughness: 0.4, map: TEX.metal });
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 12), m); pipe.rotation.z = Math.PI / 2; if (ax === 'x') pipe.rotation.set(Math.PI / 2, 0, 0); pipe.position.y = kind === 'low' ? 1.35 : 2.25; g.add(pipe);
  const valve = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 14), stdMat({ color: 0xaa2222, metalness: 0.6 })); valve.position.y = pipe.position.y + 0.16; valve.rotation.x = Math.PI / 2; g.add(valve);
  g.position.set(x, 0, z); World.group.add(g);
  // steam particles
  const N = 90, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), vel = []; for (let i = 0; i < N; i++) { vel.push(new THREE.Vector3()); pos[i * 3 + 1] = -99; }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xe8e8e8, size: 0.45, transparent: true, opacity: 0.35, depthWrite: false, sizeAttenuation: true })); World.group.add(pts);
  const V = { x, z, kind, t: phase, on: false, hissed: false, low: kind === 'low', y: pipe.position.y };
  V.update = dt => {
    V.t += dt; const cyc = V.low ? 1 : 4.2, ph = V.low ? 0 : V.t % cyc;
    const wasOn = V.on; V.on = V.low ? true : ph > 2.2 && ph < 3.9;
    if (!V.low && ph > 1.5 && ph < 2.2 && !V.hissed) { V.hissed = true; SFX.hiss(x, z); }
    if (!V.on) V.hissed = ph > 1.5 && ph < 2.2 ? V.hissed : false;
    if (V.on && !wasOn && !V.low) SFX.steam(x, z, 1.7);
    for (let i = 0; i < N; i++) { const p = i * 3; if (pos[p + 1] < -50 && V.on && Math.random() < 0.6) { pos[p] = x + rnd(-0.1, 0.1); pos[p + 1] = V.y - 0.1; pos[p + 2] = z + rnd(-0.1, 0.1); vel[i].set(rnd(-1, 1), -rnd(0.5, 2.6) * (V.low ? 0.25 : 1), rnd(-1, 1)); }
      if (pos[p + 1] > -50) { pos[p] += vel[i].x * dt; pos[p + 1] += vel[i].y * dt; pos[p + 2] += vel[i].z * dt; vel[i].multiplyScalar(0.96); vel[i].y += dt * 0.6; if (pos[p + 1] < 0 || Math.random() < dt * 0.9) pos[p + 1] = -99; } }
    geo.attributes.position.needsUpdate = true;
    // damage
    const P = Player.pos, d = Math.hypot(P.x - x, P.z - z);
    if (Game.state === 'play' && d < 1.0) {
      const headY = Player.eyeY(); const hit = V.low ? headY > 1.05 : V.on;
      if (hit && Game.t > (Game.flags.burnT || 0)) { Game.flags.burnT = Game.t + 1.2; Game.hp--; R.P.flash.value = 0.5; R.P.flashCol.value.set(1, 0.4, 0.3); SFX.steam(x, z, 0.6); Game.shake(0.5); Player.vel.x *= -2; Player.vel.z *= -2;
        if (Game.hp <= 0) Game.die(null, 'البخار حرقك. اسمع الفحيح… وانحنِ تحت الأنابيب الواطية.'); else UI.msg(V.low ? 'انحنِ (C) تحت الأنبوب!' : 'آخ! انتظر البخار يوقف.', 2200); }
    }
  };
  Game.flags.vents.push(V);
}
function lightCycle(dt) {
  const F = Game.flags;
  if (!F.dark && Game.t > F.cycle) {
    // sometimes a fake double-flicker that doesn't go dark (troll), sometimes no warning at all
    const r = Math.random();
    if (r < 0.25 && !F.fakeFlick) { F.fakeFlick = 1; flick(3); F.cycle = Game.t + rnd(6, 9); return; }
    F.fakeFlick = 0; if (r < 0.75) flick(2);
    later(() => goDark(), r < 0.75 ? 650 : 50);
    F.cycle = Game.t + 99;
  }
}
function flick(n) { for (let i = 0; i < n; i++) { later(() => { World.blackout = true; World.blackoutChanged = true; SFX.lightsOff(); }, i * 220); later(() => { World.blackout = false; World.blackoutChanged = true; }, i * 220 + 110); } }
function goDark() {
  const F = Game.flags; if (Game.level.id !== 'L2') return; if (F.chase || Game.state !== 'play') { F.cycle = Game.t + 8; return; }
  F.dark = true; World.blackout = true; World.blackoutChanged = true; SFX.lightsOff(); setBed('pipe', 0.25);
  const am = Game.monsters[0]; F.darkT = Game.t;
  // place her somewhere in front or behind, within a few cells, reachable
  const G = World.grid, P = Player.pos; let best = null;
  for (let i = 0; i < 40; i++) { const x = (Math.random() * G.W) | 0, y = (Math.random() * G.H) | 0; if (!G.floor[y * G.W + x]) continue; const wx = G.cx(x), wz = G.cz(y), d = Math.hypot(wx - P.x, wz - P.z); if (d > 3.5 && d < 7.5 && losCheck(wx, wz, P.x, P.z)) { best = [wx, wz]; break; } }
  if (best) { am.place(best[0], best[1], Math.atan2(P.x - best[0], P.z - best[1])); am.root.visible = true; am.state = 'dark'; am.doc.horror = true; am.doc.faceM.emissiveIntensity = 3.2; later(() => voice('a2', am.pos.x, am.pos.z, { force: true, vol: 0.9 }), 900); }
  const dur = rnd(4, 5.5); F.lightOnAt = Game.t + dur;
  later(() => lightsBack(), dur * 1000);
}
function lightsBack() { const F = Game.flags; if (!F.dark) return; F.dark = false; World.blackout = false; World.blackoutChanged = true; SFX.lightsOn(); setBed('pipe', 0.7); const am = Game.monsters[0]; if (am.state === 'dark') { am.root.visible = false; am.state = 'off'; } F.cycle = Game.t + rnd(7, 11); }
function amalUpdate(am, dt, d) {
  const F = Game.flags, P = Player.pos;
  if (am.state === 'dark') {
    // she watches. If you move (faster than a careful crouch) or use the torch, she comes.
    am.yaw = Math.atan2(P.x - am.pos.x, P.z - am.pos.z); am.speed = 0;
    if (Player.light || Player.moveAmt > 1.7) { F.strikes = (F.strikes || 0) + dt * (Player.light ? 3 : 1.6); } else F.strikes = Math.max(0, (F.strikes || 0) - dt * 0.4);
    if (F.strikes > 0.45) { am.state = 'lunge'; SFX.scream(false); }
    am.doc.P.head.rotation.z = Math.sin(Game.t * 2) * 0.25;
    Game.stress = Math.max(Game.stress, clamp(1 - d / 9, 0.3, 1));
    return true;
  }
  if (am.state === 'lunge') {
    const v = 7.5 * dt; const dx = P.x - am.pos.x, dz = P.z - am.pos.z, L = Math.hypot(dx, dz) || 1; am.pos.x += dx / L * v; am.pos.z += dz / L * v; am.yaw = Math.atan2(dx, dz); am.speed = 7.5;
    if (d < 1.1) { Game.die(am); return true; }
    if (!F.dark) { am.state = 'off'; am.root.visible = false; }
    Game.chase = 1; return true;
  }
  if (am.state === 'troll') { am.speed = 0; return true; }
  return false; // normal chase AI for the final run
}
function funTroll() {
  const F = Game.flags; if (F.funDone) return; F.funDone = 1; F.cycle = Game.t + 99;
  UI.msg('…حفلة؟ هنا؟', 2000);
  later(() => { Party.detune = 0.4; Party.rate = 0.7; }, 1800);
  later(() => { Party.detune = 1; Party.rate = 0.45; }, 3200);
  later(() => { partyStop(true); F.disco.forEach(l => l.intensity = 0); World.blackout = true; World.blackoutChanged = true; SFX.lightsOff();
    const am = Game.monsters[0], P = Player.pos, fx = -Math.sin(Player.yaw), fz = -Math.cos(Player.yaw); am.place(P.x + fx * 2.2, P.z + fz * 2.2, Math.atan2(-fx, -fz)); am.root.visible = true; am.state = 'troll'; am.doc.horror = true; am.doc.faceM.emissiveIntensity = 3.4;
    later(() => { voice('a1', am.pos.x, am.pos.z, { force: true }); }, 400);
  }, 4600);
  later(() => { const am = Game.monsters[0]; am.root.visible = false; am.state = 'off'; World.blackout = false; World.blackoutChanged = true; SFX.lightsOn(); UI.msg('<b>«المرح» مو المخرج…</b> ارجع للمحطة.', 3000); F.cycle = Game.t + 9; }, 8200);
}
function finalChase() {
  const F = Game.flags; F.chase = true; World.blackout = false; World.blackoutChanged = true; lightsBack(); F.dark = false;
  UI.objective('اركض! لا توقف ولا تلتفت', 'الباب الملوّن في آخر الممر'); startFinal(false);
}
function startFinal(fromCP) {
  const F = Game.flags, G = World.grid; F.chaseCP = true; F.chase = true; Game.state = 'play';
  if (fromCP) { Player.pos.set(G.cx(8) - 0.8, 0, G.cz(4)); Player.yaw = -Math.PI / 2; Player.hidden = false; }
  World.fixColor.set(0xff2020); Game.level.unlimitedStamina = true;
  const am = Game.monsters[0]; am.doc.horror = false; am.doc.faceM.emissiveIntensity = 0.6; am.place(G.cx(6), G.cz(3), Math.PI / 2); am.root.visible = true; am.state = 'chase'; am.lastSeen = Game.t; am.lastSeenPos = { x: Player.pos.x, z: Player.pos.z }; am.run = 5.25; am.sight = 40; am.lose = 99;
  later(() => { voice('a3', am.pos.x, am.pos.z, { force: true }); SFX.stinger(); }, 600);
  // she gets faster if you slow down
  am.customUpdate = (dt, d) => { am.run = Player.moveAmt < 4 ? 6.6 : 5.25; return false; };
  // obstacles in the straight: crates
  if (!F.crates) { F.crates = 1; [[10, -0.6], [11, 0.7], [12, -0.4]].forEach(([cx, off]) => prop(new THREE.BoxGeometry(0.9, 0.9, 0.9), stdMat({ color: 0x6a4a2a, map: TEX.door }), G.cx(cx), 0.45, G.cz(4) + off)); }
  // the party door at the end
  if (!F.endDoor) {
    F.endDoor = 1; const ex = G.ox + G.W * G.S - 0.15, ez = G.cz(4);
    const tex = signTex({ w: 512, h: 1024, bg: '#111', age: false, extra: (g, w, h) => { for (let i = 0; i < 7; i++) { g.fillStyle = `hsl(${i * 50},90%,55%)`; g.fillRect(0, i * h / 7, w, h / 7); } g.fillStyle = '#fff'; g.font = '700 70px Tajawal, sans-serif'; g.textAlign = 'center'; g.fillText('حفل التخرج', w / 2, h / 2); } });
    const dm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.1 })); dm.position.set(ex, 1.1, ez); dm.rotation.y = -Math.PI / 2; World.group.add(dm);
    const rl = new THREE.PointLight(0xff44cc, 3, 9); rl.position.set(ex - 1, 2, ez); World.group.add(rl); World.updaters.push(() => rl.color.setHSL((Game.t * 0.5) % 1, 1, 0.6));
    addTrigger({ x: ex - 0.7, z: ez, w: 0.8, d: 1.3, fire: () => { Game.monsters[0].deactivate(); noclipTo('END'); } });
  }
}

/* ============================== ENDING ============================== */
LEVELS.END = {
  id: 'END', order: 3, card: ['LEVEL ؟', 'حفل التخرج', ''], surface: 'carpet', vig: 0.8, sat: 1.1,
  build() {
    const S = 3, G = makeGrid(4, 4, S); World.grid = G; G.border(); World.wallH = 3.2;
    setupEnv({ fog: 0x1a0a2a, fogD: 0.04, sky: 0xffffff, ground: 0x332244, amb: 0.9, exposure: 1.1, bloom: 1.1, bloomT: 0.6, hum: 0, drone: 0, pipe: 0, wind: 0, tint: [1, 1, 1], grain: 0.05 });
    buildGridWalls(G, stdMat({ color: 0x24123a, roughness: 0.6 }), 3.2); buildGridFloor(G, stdMat({ color: 0x2a1a3a, roughness: 0.3, metalness: 0.4 }), stdMat({ color: 0x120a1a }), 3.2, 2);
    World.fixtures = []; buildFixtures([], 3.2); initLightPool(8);
    const ls = []; for (let i = 0; i < 5; i++) { const l = new THREE.PointLight(0xffffff, 3, 10); l.position.set(rnd(1, 11), 2.6, rnd(1, 11)); World.group.add(l); ls.push(l); }
    World.updaters.push(() => ls.forEach((l, i) => l.color.setHSL((Game.t * 0.25 + i * 0.2) % 1, 1, 0.6)));
    Player.pos.set(6, 0, 10); Player.yaw = 0;
    partyStart(); later(() => showEnding(), 3500);
  }
};
function showEnding() {
  Game.state = 'ending'; unlockPointer(); partyStop(); SFX.success();
  const secs = Math.floor(Game.t - Game.startT), mm = Math.floor(secs / 60), ss = secs % 60;
  $('endStats').textContent = `الوقت ${ar(mm)}:${ar(String(ss).padStart(2, '0'))} · الموتات ${ar(Game.deaths)} · الأوراق ${ar(Game.notesRead)}`;
  UI.show('ending', true); store.set('won', true);
}
