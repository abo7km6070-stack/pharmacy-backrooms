/* =====================================================================
   levels: 0 (الردهة), 0B (القبو), 1 (موقف الكلية), 2 (ممرات الأنابيب), END
   ===================================================================== */
const LEVEL_TIPS = {
  L0: ['اكسر خط النظر ولف بالزوايا، د. مجاهد يبطّئ عند المنعطفات.', 'سكّر الباب وراك… يحتاج وقت عشان يكسره.', 'انحنِ تحت طاولات القاعة (C) عشان تتخبى.', 'الركض يسمعه من بعيد. امشِ إذا ما يلاحقك.'],
  L0B: ['اتبع الأسهم السودا على الجدران.', 'هنا هو أسرع… لا توقف.'],
  L1: ['د. منهاج ما يقدر يفتح الأبواب: ادخل غرفة وسكّرها.', 'لا تقرب من أي أحد يأشر لك من بعيد.', 'لف المفاتيح الأربعة خلال ٥ ثواني.'],
  L2: ['إذا طفى النور: لقّها بالكشاف وثبّت النور عليها لين يرجع النور.', 'خلّ معك باور بانك. بدون بطارية ما تقدر توقفها.', 'الفحيح يعني البخار بينفجر. انتظر أو انحنِ.', 'لا توقف وهي وراك… أبداً.']
};
const NOTES = {
  L0: { head: 'ورقة مطوية على الجدار', sig: '— طالب سنة رابعة', text: 'إذا لقيت هالورقة… فأنت علقت مثلي في ردهة الكلية.<br>• المخرج ورا باب <b>«قاعة الاختبار»</b> الأحمر، ومفتاحه فوق <b>رف المكتبة العالي</b>.<br>• تحتاج سلّم… قطعه متفرقة بالممرات <b>(٤ قطع)</b>.<br>• إذا سمعت <b>طرق</b>… د. مجاهد قريب. اكسر خط النظر ولف بالزوايا.<br>• تقدر تتخبى <b>تحت طاولات القاعة</b> أو في <b>الخزائن</b>، وسكّر الأبواب وراك.' },
  L0B: { head: 'مكتوبة بقلم على الجدار', sig: '— نفس الطالب', text: 'سقطت للقبو؟ أنا بعد.<br>• اتبع <b>الأسهم السودا</b> على الجدران… توديك للدرج.<br>• هنا الإضاءة خربانة، و<b>هو أسرع</b>. لا توقف.' },
  L1: { head: 'ورقة على عمود الموقف', sig: '— ؟', text: 'موقف الكلية.<br>• رمز المصعد مخبّى في <b>مواقف الدكاترة</b> ورا الباب أبو شباك. المكان <b>مظلم</b>… شغّل الكشاف.<br>• خذ ألوان السيارات اللي موقفها مكتوب عليه <b>«د.»</b> بس، <b>من الرقم الأصغر للأكبر</b>.<br>• تحت فيه <b>٤ مفاتيح</b> في خزائن المعاطف. ركّبها باللوحة و<b>لفّها كلها خلال ٥ ثواني</b>.<br>• د. منهاج <b>يقلّد الأصوات</b>… إذا شفت أحد يأشر لك من بعيد، لا تقرب.<br>• ما يقدر يفتح الأبواب. <b>الغرفة المسكّرة أمان</b>.' },
  L2: { head: 'ورقة مبلولة', sig: '— فني الصيانة', text: 'ممرات الأنابيب تحت المعامل.<br>• النور يطفي كل شوي، ود. أمل <b>تمشي في الظلام</b>.<br>• إذا طفى: <b>نوّر عليها بالكشاف ولا تشيله عنها</b>. النور يوقفها. إذا شالت عينك عنها… تقرب.<br>• وفّر البطارية، والباور بانك 🔋 متفرق بالممرات.<br>• <b>البخار يحرق</b>. اسمع الفحيح قبل الانفجار، وانحنِ تحت الأنابيب الواطية.<br>• كلمة سر البوابة في <b>غرفة الصيانة</b>.<br>• إذا شفت لوحة <b>«المرح»</b>… لا تصدّق.' },
  pw: { head: 'تذكير للفنيين', sig: '— إدارة الكلية', text: 'كلمة سر بوابة المعامل:<br><b>أول دواء نبدأ فيه لمريض السكري النوع الثاني</b><br>(اكتبه بالإنجليزي، بدون مسافات)<br><br><i>ملاحظة: لا تنسون البوث التوعوي يوم الأحد 🙂</i>' },
  fake: { head: 'ورقة داخل الغرفة', sig: '— د. م', text: '<b>مو هنا 😂</b><br><br>المخرج الحقيقي ما عليه لوحة خضرا.' }
};
const LORE = {
  l0a: { head: 'ورقة معلّقة بشريط لاصق', sig: '— ؟', text: 'يوم ١<br>كنت أذاكر <b>PHP 363</b> في الجلسة اللي تحت الدرج ونمت على الكنب الأزرق.<br>صحيت والكلية فاضية… والبالونات حقت يوم التخرج لسا معلقة.<br>سمعت أحد يقول «يا زول» من آخر الممر. ضحكت. ما كان فيه أحد.' },
  l0b: { head: 'ورقة في درج المكتب', sig: '— ؟', text: 'يوم ٤ (أظن)<br>لاحظت إن د. مجاهد <b>يبطّئ عند الزوايا</b>. وإذا سكّرت الباب يوقف يدقه.<br>وإذا فقعت بالونة… <b>يجي يركض</b>. استخدمها لصالحك.<br>عدّيت الخطوط على جدار القاعة: <b>٣٦</b>. مين كتبها؟' },
  l1a: { head: 'ورقة على باب المختبر', sig: '— ؟', text: 'د. منهاج يعرف إني هنا.<br>نادى «يا طالب» من قسم الطالبات… <b>بصوت زميلي اللي تخرّج من سنتين.</b><br>الأبواب هناك مقفلة من سنين. لا ترد على الصوت. لا ترد.' },
  l2a: { head: 'ورقة على مكتب إداري', sig: '— ؟', text: 'الخط صار يشبه خطي أكثر وأكثر.<br>إذا وصلت <b>قاعة M</b>… لا تجلس على الكرسي رقم ٣٧.' },
  l2b: { head: 'ورقة تحت الطاولة', sig: '— أنت', text: 'لا تزعل مني.<br>الأوراق كلها <b>بخطي</b>… وأنت تقرأها بخطك.<br><b>أنا أنت.</b> هذي المحاولة رقم <b>٣٧</b>.<br>الدكاترة ما كانوا يبون يسقطونك… كانوا يبونك تصحى.<br>المرة الجاية: <b>لا تنام في المحاضرة.</b>' }
};
function graffiti(G, cx, cy, pref, text, opt = {}) {
  const sd = wallSide(G, cx, cy, pref); if (!sd) return;
  const p = onWall(G, cx, cy, sd, 1.4, opt.off || 0);
  const t = signTex({ w: 512, h: 160, bg: 'rgba(0,0,0,0)', age: false, extra: (g, w, h) => { g.clearRect(0, 0, w, h); g.save(); g.translate(w / 2, h / 2); g.rotate(rnd(-0.06, 0.06)); g.font = `700 ${opt.size || 58}px "Aref Ruqaa", Tajawal, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; g.fillStyle = opt.color || 'rgba(120,10,8,0.85)'; g.shadowColor = g.fillStyle; g.shadowBlur = 6; g.fillText(text, 0, 0); for (let i = 0; i < 6; i++) { g.fillRect(rnd(-150, 150), rnd(10, 40), 3, rnd(10, 45)); } g.restore(); } });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.56), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.position.set(p.x, opt.y || 1.5, p.z); m.rotation.y = p.ry; World.group.add(m); return m;
}
function loreNote(G, cx, cy, pref, key, after) {
  const sd = wallSide(G, cx, cy, pref); if (!sd) return;
  return noteOnWall(G, cx, cy, sd, LORE[key], () => { Game.lore = Game.lore || {}; Game.lore[key] = 1; after && after(); });
}
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
  style.col = {
    wall: stdMat({ map: TEX.plaster, bumpMap: bumpFrom(TEX.plaster), bumpScale: 0.006, roughness: 0.82 }),
    floor: stdMat({ map: TEX.tile, roughness: 0.16, metalness: 0.08, envMapIntensity: 1 }),
    ceil: stdMat({ map: TEX.ceilGrid, roughness: 0.95 })
  };
  ['L0', 'L0B', 'L1', 'L2'].forEach(k => { [style[k].wall, style[k].floor, style[k].ceil].forEach(m => { if (m.map) { m.map.repeat.set(1, 1); } }); });
}
/* shared level setup */
function setupEnv(o) {
  R.scene.fog = new THREE.FogExp2(o.fog, o.fogD);
  R.renderer.setClearColor(o.fog, 1);
  if (World.hemi) R.scene.remove(World.hemi);
  World.hemi = new THREE.HemisphereLight(o.sky, o.ground, o.amb * 0.24); R.scene.add(World.hemi);
  R.P.exposure.value = o.exposure || 1; R.bloom.strength = (o.bloom ?? 0.6) * 0.6; R.bloom.threshold = (o.bloomT ?? 0.82) + 0.32;
  R.P.tint.value.set(...(o.tint || [1, 1, 1])); R.P.grain.value = o.grain ?? 0.07;
  World.lightMul = 1; World.blackout = false; World.alwaysLit = !!o.alwaysLit;
  setBed('hum', o.hum ?? 0); setBed('drone', o.drone ?? 0.3); setBed('pipe', o.pipe ?? 0); setBed('wind', o.wind ?? 0);
}
function startLevel(id) {
  const L = LEVELS[id]; Game.seq = (Game.seq || 0) + 1; Game.level = L; Game.scare = null; Game.monsters.forEach(m => m.deactivate()); Game.monsters = [];
  worldReset(); World.baseFloor = 0; World.killY = -50; World.grid = null;
  Player.sanity = Math.max(Player.sanity, 0.75); Player.pos.set(0, 0, 0); Player.vel.set(0, 0, 0); Player.vy = 0; Player.onGround = true; Player.hidden = false; Player.stamina = 1; Player.exhausted = false; Player.onBeam = false; Player.frozen = false; Player.safe = false; Player.light = false;
  Game.flags = {}; Game.hp = 2; Game.glitch = 0; R.P.dark.value = 0; R.P.wobble.value = 0; partyStop(true);
  $('slats').classList.remove('on');
  L.build(); Game.state = 'play'; Game.levelT = 0; musicLevel(id);
  store.set('reached', Math.max(store.get('reached', 0), L.order));
  UI.card(L.card[0], L.card[1], L.card[2]);
  lockPointer();
}
function darkZones(list, G, frac, seed = 1) { // whole patches of dead lights: you need the torch to cross them
  list.forEach(f => { const [cx, cy] = G.cell(f.x, f.z); const h = hash2(Math.floor(cx / 2), Math.floor(cy / 2), seed); if (h < frac) { f.on = false; f.flick = 0; } });
  return list;
}
function placeItems(G, kinds, avoid, seed) {
  const used = new Set(); kinds.forEach(k => { for (let tries = 0; tries < 80; tries++) { const x = (Math.random() * G.W) | 0, y = (Math.random() * G.H) | 0, key = x + ',' + y; if (!G.floor[y * G.W + x] || used.has(key)) continue; if (avoid && Math.hypot(G.cx(x) - avoid.x, G.cz(y) - avoid.z) < G.S * 3) continue; used.add(key); spawnItem(k, G.cx(x) + rnd(-0.8, 0.8), G.cz(y) + rnd(-0.8, 0.8)); break; } });
}
function protectRooms(G, rooms) { // connectAll may not knock holes in these room walls: doors are the way in
  const set = new Set(); rooms.forEach(([x0, y0, x1, y1]) => { for (let x = x0; x <= x1; x++) { set.add(edgeKey(x, y0 - 1, x, y0)); set.add(edgeKey(x, y1, x, y1 + 1)); } for (let y = y0; y <= y1; y++) { set.add(edgeKey(x0 - 1, y, x0, y)); set.add(edgeKey(x1, y, x1 + 1, y)); } });
  G.locked = (x, y, nx, ny) => set.has(edgeKey(x, y, nx, ny));
}
function doorUseful(G, x, y, nx, ny) { // a door is pointless if you can just walk round it in a few steps
  const old = G.edge(x, y, nx, ny); G.setEdge(x, y, nx, ny, 1);
  const p = bfsPath(G, x, y, nx, ny, true); G.setEdge(x, y, nx, ny, old);
  return !p || p.length > 7;
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
function addLockerHide(x, z, ry) { // a low crawl-hole in the wall: crouch and crawl in, no doctor can follow you
  const nx = Math.sin(ry), nz = Math.cos(ry), wx = x - nx * 0.25, wz = z - nz * 0.25;
  const D = 1.05, Wd = 1.15, Hh = 1.02, cx = wx + nx * D / 2, cz = wz + nz * D / 2;
  const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = ry; World.group.add(g);
  const shell = stdMat({ map: TEX.concrete, color: 0x9a9284, roughness: 0.95 }), dark = new THREE.MeshBasicMaterial({ color: 0x030202 });
  const side = new THREE.BoxGeometry(0.12, Hh + 0.16, D); for (const sd of [-1, 1]) { const m = new THREE.Mesh(side, shell); m.position.set(sd * (Wd / 2 + 0.06), (Hh + 0.16) / 2, 0); g.add(m); }
  const top = new THREE.Mesh(new THREE.BoxGeometry(Wd + 0.24, 0.16, D), shell); top.position.y = Hh + 0.08; g.add(top);
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Hh), dark); inner.position.set(0, Hh / 2, -D / 2 + 0.03); g.add(inner);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(Wd, D), dark); ceil.rotation.x = Math.PI / 2; ceil.position.y = Hh - 0.01; g.add(ceil);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(Wd + 0.24, 0.05, 0.06), stdMat({ color: 0x3a3630, metalness: 0.5 })); lip.position.set(0, Hh + 0.02, D / 2); g.add(lip);
  const ex = Math.abs(nx) > 0.5 ? D / 2 : Wd / 2 + 0.12, ez = Math.abs(nx) > 0.5 ? Wd / 2 + 0.12 : D / 2;
  // side walls (full height) + the low roof: standing up you bump your head, crouched you slide in
  if (Math.abs(nx) > 0.5) { addBoxCollider(cx - ex, cz - ez, cx + ex, cz - ez + 0.12, -1, 3); addBoxCollider(cx - ex, cz + ez - 0.12, cx + ex, cz + ez, -1, 3); }
  else { addBoxCollider(cx - ex, cz - ez, cx - ex + 0.12, cz + ez, -1, 3); addBoxCollider(cx + ex - 0.12, cz - ez, cx + ex, cz + ez, -1, 3); }
  addBoxCollider(cx - ex, cz - ez, cx + ex, cz + ez, Hh + 0.04, Hh + 0.3);
  const H = { type: 'hole', x: cx, z: cz, hw: Math.abs(nx) > 0.5 ? D / 2 - 0.05 : Wd / 2 - 0.05, hd: Math.abs(nx) > 0.5 ? Wd / 2 - 0.05 : D / 2 - 0.05 };
  World.hides.push(H);
  addTrigger({ x: cx + nx * (D / 2 + 0.5), z: cz + nz * (D / 2 + 0.5), w: 0.9, d: 0.9, repeat: true, cond: () => !Game.flags.holeHint, fire: () => { Game.flags.holeHint = 1; UI.msg(`فتحة في الجدار… انحنِ (<b>${keyLabel(Input.binds.crouch)}</b>) وادخل فيها. ما أحد يقدر يلحقك جوّا.`, 3600); } });
  return { mesh: g, x: cx, z: cz, front: { x: cx + nx * (D / 2 + 0.6), z: cz + nz * (D / 2 + 0.6) } };
}
function deskMesh(x, z, ry = 0) {
  const g = new THREE.Group(); const top = stdMat({ color: 0xb79a6a, roughness: 0.55 }), leg = stdMat({ color: 0x303236, metalness: 0.7, roughness: 0.4 });
  const t = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.7), top); t.position.y = 0.76; g.add(t);
  for (const [a, b] of [[-0.75, -0.3], [0.75, -0.3], [-0.75, 0.3], [0.75, 0.3]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.76, 0.04), leg); l.position.set(a, 0.38, b); g.add(l); }
  const modesty = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.02), top); modesty.position.set(0, 0.52, -0.33); g.add(modesty);
  g.position.set(x, 0, z); g.rotation.y = ry; g.userData.static = true; World.group.add(g);
  const H = { type: 'table', x, z, hw: ry ? 0.45 : 0.8, hd: ry ? 0.8 : 0.45 }; World.hides.push(H);
  World.mcol.push({ x0: x - H.hw, z0: z - H.hd, x1: x + H.hw, z1: z + H.hd, y0: -1, y1: 3 }); // doctors can't shove their bodies under desks
  addInteract({ pos: { x, y: 0.7, z }, r: 1.7, cond: () => !Player.hidden, label: 'ادخل تحت الطاولة', use: () => hideIn(H) });
  // top is a low ceiling (can't stand under), legs block lightly
  return g;
}
function shelfMesh(x, z, ry, h = 2.6, w = 2.2, kind = 'books') {
  const g = new THREE.Group(); const wood = kind === 'med' ? stdMat({ color: 0xeeeeea, roughness: 0.4 }) : stdMat({ color: 0x6d4c30, roughness: 0.7 });
  const sideG = new THREE.BoxGeometry(0.05, h, 0.45); for (const s of [-1, 1]) { const m = new THREE.Mesh(sideG, wood); m.position.set(s * w / 2, h / 2, 0); g.add(m); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), wood); back.position.set(0, h / 2, -0.21); g.add(back);
  const fill = stdMat({ map: kind === 'med' ? TEX.medBoxes : TEX.bookSpines, roughness: 0.75 });
  for (let i = 0; i <= 5; i++) { const sh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.45), wood); sh.position.set(0, 0.1 + i * (h - 0.15) / 5, 0); g.add(sh);
    if (i < 5) { const bh = kind === 'med' ? 0.26 : 0.34, row = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, bh, 0.3), fill); row.position.set(0, 0.12 + i * (h - 0.15) / 5 + bh / 2, 0.02); const uv = row.geometry.attributes.uv; const o = Math.random(); for (let k = 0; k < uv.count; k++) uv.setX(k, uv.getX(k) * (w / 1.2) + o); g.add(row); } }
  g.position.set(x, 0, z); g.rotation.y = ry; g.userData.static = true; World.group.add(g);
  const c = Math.cos(ry), s = Math.sin(ry); const ex = Math.abs(c * w / 2) + Math.abs(s * 0.23), ez = Math.abs(s * w / 2) + Math.abs(c * 0.23); addBoxCollider(x - ex, z - ez, x + ex, z + ez, 0, h);
  return g;
}

const CAR_COLORS = [{ id: 'red', name: 'أحمر', color: '#c62828', hex: 0xb81e1e }, { id: 'blue', name: 'أزرق', color: '#1e5bc6', hex: 0x1c4fb0 }, { id: 'white', name: 'أبيض', color: '#e8e8e8', hex: 0xdedede }, { id: 'yellow', name: 'أصفر', color: '#e0b21a', hex: 0xd4a514 }, { id: 'green', name: 'أخضر', color: '#2e8b3e', hex: 0x24803a }, { id: 'black', name: 'أسود', color: '#222', hex: 0x18181a }];
/* ============================== ENDING ============================== */
function makeStudent(female) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const skin = new THREE.MeshStandardMaterial({ color: pick([0xc69070, 0xa8724f, 0xe0b090, 0x8a5a3c]), roughness: 0.6 });
  const robe = new THREE.MeshStandardMaterial({ color: female ? 0x101014 : 0xf2f0ea, roughness: 0.85 });
  const gown = new THREE.MeshStandardMaterial({ color: 0x15233f, roughness: 0.7 }); // graduation gown over it
  const h = rnd(1.55, 1.85), k = h / 1.75;
  const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.17 * k, 0.26 * k, 1.35 * k, 14), robe); dress.position.y = 0.68 * k; body.add(dress);
  const cape = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * k, 0.28 * k, 0.9 * k, 14, 1, true, Math.PI * 0.15, Math.PI * 1.7), gown); cape.position.y = 1.0 * k; body.add(cape);
  const sash = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6 * k, 0.02), new THREE.MeshStandardMaterial({ color: 0x0f8a4a })); sash.position.set(0.07, 1.15 * k, 0.17 * k); sash.rotation.z = 0.3; body.add(sash);
  const head = new THREE.Group(); head.position.y = 1.52 * k; body.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), skin));
  if (female) { const hj = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 12, 0, TAU, 0, Math.PI * 0.75), robe); hj.position.y = 0.01; head.add(hj); const d = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.28, 14, 1, true), robe); d.position.y = -0.15; head.add(d); }
  else { const sh = new THREE.Mesh(new THREE.SphereGeometry(0.128, 16, 10, 0, TAU, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0xd8232a, roughness: 0.9 })); head.add(sh); const ig = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.016, 6, 16), new THREE.MeshStandardMaterial({ color: 0x111111 })); ig.rotation.x = Math.PI / 2; ig.position.y = 0.06; head.add(ig); }
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.3), gown); cap.position.y = 0.16; cap.rotation.y = 0.4; head.add(cap);
  const tassel = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.1, 0.01), new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0x332200 })); tassel.position.set(0.14, 0.12, 0); head.add(tassel);
  const arms = []; for (const sd of [-1, 1]) { const a = new THREE.Group(); a.position.set(sd * 0.2 * k, 1.32 * k, 0); const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.42 * k, 4, 8), gown); m.position.y = -0.22 * k; a.add(m); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), skin); hd.position.y = -0.47 * k; a.add(hd); body.add(a); arms.push(a); }
  return { g, body, head, arms, ph: Math.random() * 6, jump: Math.random() < 0.35 };
}
LEVELS.END = {
  id: 'END', order: 3, card: ['LEVEL ؟', 'حفل التخرج', 'كلية الصيدلة · قاعة الاحتفالات'], surface: 'carpet', vig: 0.8, sat: 1.1,
  build() {
    const S = 3.2, W = 7, H = 6, WH = 5; const G = makeGrid(W, H, S); World.grid = G; G.border(); World.wallH = WH;
    setupEnv({ fog: 0x1a0a2a, fogD: 0.02, sky: 0xfff0e0, ground: 0x332244, amb: 2.4, exposure: 1.1, bloom: 1.2, bloomT: 0.55, hum: 0, drone: 0, pipe: 0, wind: 0, tint: [1, 0.98, 1], grain: 0.04 });
    buildGridWalls(G, stdMat({ color: 0x2a1640, roughness: 0.6 }), WH); buildGridFloor(G, stdMat({ color: 0x3a2030, roughness: 0.35, metalness: 0.3 }), stdMat({ color: 0x0d0814 }), WH, 2);
    World.fixtures = []; buildFixtures([], WH); initLightPool(8);
    const cx = W * S / 2;
    // stage + banner + logo
    prop(new THREE.BoxGeometry(W * S - 2, 0.6, 3.2), stdMat({ color: 0x5a1f2a, roughness: 0.5 }), cx, 0.3, 1.8, 0, true); World.surfaces.push({ x0: 1, x1: W * S - 1, z0: 0.2, z1: 3.4, y: 0.6 });
    const ban = signTex({ w: 1024, h: 220, bg: '#0f5135', age: false, lines: [{ t: 'حفل تخرج كلية الصيدلة', y: 95, s: 74, c: '#fff' }, { t: 'مبروك يا دفعة 🎓', y: 175, s: 52, c: '#ffd36b' }] });
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.7), new THREE.MeshStandardMaterial({ map: ban, emissive: 0xffffff, emissiveMap: ban, emissiveIntensity: 0.7 })); bm.position.set(cx, 3.7, 0.14); World.group.add(bm);
    if (window.IMG_LOGO) { const lg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.8), new THREE.MeshStandardMaterial({ map: imgTex(window.IMG_LOGO), transparent: true, emissive: 0xffffff, emissiveIntensity: 0.2 })); lg.position.set(cx, 2.4, 0.15); World.group.add(lg); }
    // the three doctors on stage, clapping (or are they?)
    const docs = ['mujahid', 'minhaj', 'amal'].map((t, i) => { const d = makeDoctor(t); d.root.position.set(cx + (i - 1) * 2.2, 0.6, 2.2); d.root.rotation.y = 0; World.group.add(d.root); return d; });
    // the students
    const crowd = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) { if (Math.random() < 0.15) continue; const st = makeStudent(Math.random() < 0.45); st.g.position.set(2.2 + c * 2.6 + rnd(-0.4, 0.4), 0, 6.5 + r * 2.4 + rnd(-0.3, 0.3)); st.g.rotation.y = Math.PI + rnd(-0.3, 0.3); World.group.add(st.g); crowd.push(st); }
    // confetti + party lights
    const N = 700, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), C = new THREE.Color();
    for (let i = 0; i < N; i++) { pos[i * 3] = rnd(0, W * S); pos[i * 3 + 1] = rnd(0, WH); pos[i * 3 + 2] = rnd(0, H * S); C.setHSL(Math.random(), 0.9, 0.6); col.set([C.r, C.g, C.b], i * 3); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    World.group.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.07, vertexColors: true })));
    const ls = []; for (let i = 0; i < 5; i++) { const l = new THREE.SpotLight(0xffffff, 6, 26, 0.35, 0.5, 1); l.position.set(2 + i * 4.3, WH - 0.2, H * S - 1); l.target.position.set(cx + rnd(-6, 6), 0, rnd(2, 12)); World.group.add(l, l.target); ls.push(l); }
    const F = Game.flags; F.endT = Game.t;
    World.updaters.push(dt => {
      for (let i = 0; i < N; i++) { pos[i * 3 + 1] -= dt * (0.6 + (i % 7) * 0.08); pos[i * 3] += Math.sin(Game.t * 2 + i) * dt * 0.3; if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = WH; }
      geo.attributes.position.needsUpdate = true;
      ls.forEach((l, i) => { l.color.setHSL((Game.t * 0.15 + i * 0.2) % 1, 1, 0.6); l.target.position.x = cx + Math.sin(Game.t * 0.7 + i) * 7; });
      const t = Game.t - F.endT, creepy = t > 14;
      crowd.forEach(st => { const clap = Math.sin(Game.t * 9 + st.ph); st.arms[0].rotation.x = -1.2 + clap * 0.25; st.arms[1].rotation.x = -1.2 + clap * 0.25; st.arms[0].rotation.z = 0.5 - clap * 0.2; st.arms[1].rotation.z = -0.5 + clap * 0.2;
        if (st.jump && !creepy) st.g.position.y = Math.max(0, Math.sin(Game.t * 5 + st.ph)) * 0.18;
        if (creepy) { st.g.position.y = 0; const a = Math.atan2(Player.pos.x - st.g.position.x, Player.pos.z - st.g.position.z); st.g.rotation.y += (a - st.g.rotation.y) * dt * 3; st.arms[0].rotation.x = st.arms[1].rotation.x = 0; } });
      docs.forEach((d, i) => { animDoctor(d, dt, 0, ''); d.P.armL.rotation.x = d.P.armR.rotation.x = -1.2 + Math.sin(Game.t * 8 + i) * 0.2; });
      if (creepy && !F.silence) { F.silence = 1; partyStop(true); if (Music.cur) { Music.cur.s.playbackRate.setTargetAtTime(0.55, A.ctx.currentTime, 0.8); musicFade(Music.cur, 0.12, 1.5); } sample('sfx_sting', 0, 0, { flat: true }); World.lightMul = 0.2; SFX.lightsOff(); ls.forEach(l => l.intensity = 1.2); docs.forEach(d => { d.horror = true; d.faceM.emissiveIntensity = 2; }); later(() => voice('m5', cx, 2, { force: true }), 900); }
    });
    Player.pos.set(cx, 0, H * S - 1.6); Player.yaw = 0;
    if (!Game.partyRecorded) partyStart(); UI.objective('حفل التخرج 🎓', 'امشِ للمسرح واستلم شهادتك');
    addInteract({ pos: { x: cx, y: 1.2, z: 3.6 }, r: 2.6, label: 'استلم الشهادة', use: () => showEnding() });
    later(() => { if (Game.state === 'play') showEnding(); }, 24000);
  }
};
function showEnding() {
  Game.state = 'ending'; unlockPointer(); partyStop(); musicStop(Music.cur); Music.cur = null; Music.curId = ''; SFX.success();
  const secs = Math.floor(Game.t - Game.startT), mm = Math.floor(secs / 60), ss = secs % 60;
  $('endStats').textContent = `الوقت ${ar(mm)}:${ar(String(ss).padStart(2, '0'))} · الموتات ${ar(Game.deaths)} · الأوراق ${ar(Game.notesRead)}`;
  const knew = Game.lore && Game.lore.l2b;
  $('endTwist').innerHTML = knew ? 'بس قبل لا تفرح… الشهادة مكتوب عليها: <b>«المحاولة رقم ٣٧»</b>.' : 'لقيت ورقة في جيبك بخطك: <b>«المحاولة رقم ٣٧… لا تنام في المحاضرة»</b>.';
  UI.show('ending', true); store.set('won', true);
  later(() => { SFX.knock(Player.pos.x + 3, Player.pos.z, 3); $('endTwist').innerHTML += '<br><span style="color:#ff6a5a">…طق طق طق</span>'; R.P.glitch.value = 0.5; }, 6500);
}
