/* =====================================================================
   كلية الصيدلة — the real building: 3 floors built from the floor plan
   x = east (right when you walk in), y = south (towards the entrance)
   ===================================================================== */
const CS = 2.6, CW = 31, CH = 24, CWH = 3.8;
function collegeGrid() { World.wallH = CWH; World.wallMat = style.col.wall; const G = makeGrid(CW, CH, CS); G.h.fill(1); G.v.fill(1); G.floor.fill(0); G.rooms = []; G.void = new Uint8Array(CW * CH); return G; }
function carve(G, x0, y0, x1, y1) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) G.floor[y * G.W + x] = 1;
  for (let x = x0; x <= x1; x++) for (let y = y0 + 1; y <= y1; y++) G.h[G.hi(x, y)] = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0 + 1; x <= x1; x++) G.v[G.vi(x, y)] = 0;
}
const joinV = (G, x, y0, y1) => { for (let y = y0; y <= y1; y++) G.v[G.vi(x, y)] = 0; };
const joinH = (G, y, x0, x1) => { for (let x = x0; x <= x1; x++) G.h[G.hi(x, y)] = 0; };
const roomW = r => ({ x0: r.x0 * CS, x1: (r.x1 + 1) * CS, z0: r.y0 * CS, z1: (r.y1 + 1) * CS, cx: (r.x0 + r.x1 + 1) / 2 * CS, cz: (r.y0 + r.y1 + 1) / 2 * CS });
function room(G, name, x0, y0, x1, y1, kind, opt = {}) { carve(G, x0, y0, x1, y1); const r = Object.assign({ name, x0, y0, x1, y1, kind }, opt); G.rooms.push(r); return r; }
/* ---------------- the shared floor plan ---------------- */
function planFloor(G, floorN, names) {
  carve(G, 13, 3, 17, 21);                      // main corridor / atrium
  carve(G, 14, 0, 16, 2); joinH(G, 3, 14, 16);  // stair bay at the far end
  carve(G, 3, 8, 27, 9); carve(G, 3, 15, 27, 16); // the two cross corridors with halls on both sides
  carve(G, 2, 1, 2, 21); joinV(G, 3, 8, 9); joinV(G, 3, 15, 16); // west longitudinal corridor
  carve(G, 28, 1, 28, 21); joinV(G, 28, 8, 9); joinV(G, 28, 15, 16); // east longitudinal corridor
  if (floorN === 1) { carve(G, 14, 22, 16, 22); joinH(G, 22, 14, 16); } // entrance lobby
  carve(G, 17, 1, 24, 1); joinV(G, 17, 1, 1); // passage past the stairs → health sciences
  const H = [[3, 3, 7, 7], [8, 3, 12, 7], [3, 10, 7, 14], [8, 10, 12, 14], [3, 17, 7, 21], [8, 17, 12, 21], [18, 3, 22, 7], [23, 3, 27, 7], [18, 10, 22, 14], [23, 10, 27, 14], [18, 17, 22, 21], [23, 17, 27, 21]];
  G.halls = H.map((h, i) => { const n = names[i] || { name: 'قاعة', kind: 'hall' }; if (n.merge) return null; return room(G, n.name, ...(n.rect || h), n.kind, n); }).filter(Boolean);
  G.offices = [];
  for (let y = 2; y <= 20; y += 2) { G.offices.push(room(G, 'مكتب', 0, y, 1, y + 1, 'office', { side: 'w' })); G.offices.push(room(G, 'مكتب', 29, y, 30, y + 1, 'office', { side: 'e' })); }
  G.elec = room(G, 'غرفة الكهرباء', 0, 0, 1, 1, 'elec');
  G.wc = [room(G, 'دورة مياه', 3, 1, 4, 2, 'wc'), room(G, 'دورة مياه', 26, 1, 27, 2, 'wc')];
  G.hs = room(G, 'العلوم الطبية التطبيقية', 25, 1, 25, 1, 'hs');
  carve(G, 2, 0, 2, 0); carve(G, 28, 0, 28, 0); joinH(G, 1, 2, 2); joinH(G, 1, 28, 28); // side stairwells
}
/* doors: from a room cell to the neighbouring corridor cell */
function hallDoors(G, r, opts = {}) {
  const ds = [], mx = Math.floor((r.x0 + r.x1) / 2);
  if (r.y0 === 3 || r.y0 === 17 && r.x0 >= 3) {} // handled below
  const tryDoor = (x, y, nx, ny) => { if (G.inside(nx, ny) && G.floor[ny * G.W + nx]) ds.push(addDoor(G, x, y, nx, ny, Object.assign({ tex: TEX.woodDoor, trim: 0x8a8f94, width: 1.15, height: 2.3 }, opts))); };
  if (r.y1 === 7) tryDoor(mx, 7, mx, 8);
  if (r.y0 === 10) tryDoor(mx, 10, mx, 9);
  if (r.y1 === 14 && !r.oneDoor) tryDoor(mx, 14, mx, 15);
  if (r.y0 === 17) tryDoor(mx, 17, mx, 16);
  return ds;
}
function officeDoor(G, r, opts = {}) { const x = r.side === 'w' ? 1 : 29, nx = r.side === 'w' ? 2 : 28; return addDoor(G, x, r.y0, nx, r.y0, Object.assign({ tex: TEX.woodDoor, trim: 0x8a8f94, width: 1.0, height: 2.25 }, opts)); }
/* signs over doors (Arabic + room code) */
function doorSign(d, text, code, color = '#0f5135') {
  const t = signTex({ w: 512, h: 128, bg: color, age: false, lines: [{ t: text, y: 62, s: 44, c: '#fff' }, { t: code || '', y: 108, s: 26, c: '#bfe8d0', f: 'Arial' }] });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.31), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }));
  const off = 0.11, y = 2.6; if (d.horiz) { m.position.set(d.ex, y, d.ez); const m2 = m.clone(); m.position.z += off; m2.position.z -= off; m2.rotation.y = Math.PI; World.group.add(m, m2); }
  else { m.position.set(d.ex, y, d.ez); m.rotation.y = Math.PI / 2; const m2 = m.clone(); m.position.x += off; m2.position.x -= off; m2.rotation.y = -Math.PI / 2; World.group.add(m, m2); }
}
/* ---------------- shell: walls, floors, ceilings, columns, skylights ---------------- */
function buildShell(G, o = {}) {
  World.wallH = CWH; World.wallMat = style.col.wall;
  buildGridWalls(G, style.col.wall, CWH, 0.22, 3);
  buildGridFloor(G, style.col.floor, style.col.ceil, CWH, 2.4, { ceilUV: 2.4, skipCeil: o.skipCeil });
  // central marble strip + blue/gold inlay stripes down the main corridor (like the real lobby floor)
  const segs = o.void ? [[3, 6], [19, 22]] : [[3, G.floor[22 * G.W + 15] ? 23 : 22]];
  for (const [a, b] of segs) { const L = (b - a) * CS, zc = (a + b) / 2 * CS;
    addMerged([planeGeo(2.4, L, 15.5 * CS, 0.006, zc, 2.4, false)], stdMat({ map: TEX.marble, roughness: 0.25, metalness: 0.05 }));
    for (const [dx, c] of [[-1.7, 0x2a4fa8], [1.7, 0x2a4fa8], [-2.0, 0xc89a3a], [2.0, 0xc89a3a]]) addMerged([planeGeo(0.14, L, 15.5 * CS + dx, 0.007, zc, 1, false)], stdMat({ color: c, roughness: 0.3 })); }
  const xsegs = o.void ? [[3, 14], [17, 28]] : [[3, 28]];
  for (const zc of [8.5, 15.5]) for (const [a, b] of xsegs) for (const [dz, c] of [[-0.55, 0x2a4fa8], [0.55, 0xc89a3a]]) addMerged([planeGeo((b - a) * CS, 0.12, (a + b) / 2 * CS, 0.007, zc * CS + dz, 1, false)], stdMat({ color: c, roughness: 0.3 }));
  if (o.void) { // the atrium well: walls going down to the lobby, with the lobby floor far below
    const vx0 = 14 * CS, vx1 = 17 * CS, vz0 = 6 * CS, vz1 = 19 * CS, wm = style.col.wall;
    addMerged([boxGeo(vx1 - vx0, CWH, 0.2, (vx0 + vx1) / 2, -CWH / 2, vz0, 3, CWH), boxGeo(vx1 - vx0, CWH, 0.2, (vx0 + vx1) / 2, -CWH / 2, vz1, 3, CWH), boxGeo(0.2, CWH, vz1 - vz0, vx0, -CWH / 2, (vz0 + vz1) / 2, 3, CWH), boxGeo(0.2, CWH, vz1 - vz0, vx1, -CWH / 2, (vz0 + vz1) / 2, 3, CWH)], wm);
    addMerged([boxGeo(vx1 - vx0 + 0.4, 0.3, 0.3, (vx0 + vx1) / 2, -0.15, vz0, 1, 1), boxGeo(vx1 - vx0 + 0.4, 0.3, 0.3, (vx0 + vx1) / 2, -0.15, vz1, 1, 1), boxGeo(0.3, 0.3, vz1 - vz0, vx0, -0.15, (vz0 + vz1) / 2, 1, 1), boxGeo(0.3, 0.3, vz1 - vz0, vx1, -0.15, (vz0 + vz1) / 2, 1, 1)], stdMat({ color: 0xdedad2, roughness: 0.5 }));
    const pit = new THREE.Mesh(new THREE.PlaneGeometry(vx1 - vx0, vz1 - vz0), stdMat({ map: TEX.tile, color: 0x60646a, roughness: 0.25 })); pit.rotation.x = -Math.PI / 2; pit.position.set((vx0 + vx1) / 2, -CWH * o.void, (vz0 + vz1) / 2); World.group.add(pit);
    const strip2 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, vz1 - vz0), stdMat({ map: TEX.marble, color: 0x808080, roughness: 0.25 })); strip2.rotation.x = -Math.PI / 2; strip2.position.set(15.5 * CS, -CWH * o.void + 0.01, (vz0 + vz1) / 2); World.group.add(strip2);
    if (o.void > 1) addMerged([boxGeo(vx1 - vx0, CWH, 0.2, (vx0 + vx1) / 2, -CWH * 1.5, vz0, 3, CWH), boxGeo(vx1 - vx0, CWH, 0.2, (vx0 + vx1) / 2, -CWH * 1.5, vz1, 3, CWH), boxGeo(0.2, CWH, vz1 - vz0, vx0, -CWH * 1.5, (vz0 + vz1) / 2, 3, CWH), boxGeo(0.2, CWH, vz1 - vz0, vx1, -CWH * 1.5, (vz0 + vz1) / 2, 3, CWH)], wm);
    const L = new THREE.PointLight(0x8aa0c8, 0.5, 14); L.position.set(15.5 * CS, -CWH * o.void + 1.5, 12.5 * CS); World.group.add(L);
  }
  // white columns along the main corridor
  const colM = stdMat({ color: 0xeeebe4, roughness: 0.35 });
  for (let y = 4; y <= 20; y += 3) for (const x of [13.15, 17.85]) { if (y >= 7 && y <= 10 || y >= 14 && y <= 17) continue; prop(new THREE.CylinderGeometry(0.32, 0.32, CWH, 18), colM, x * CS, CWH / 2, (y + 0.5) * CS, 0, true); }
  // skylight panels in the atrium ceiling (dead at night: a cold moonlight glow)
  if (o.skylight) { const sk = new THREE.MeshStandardMaterial({ color: 0x0b1018, emissive: 0x5a7090, emissiveIntensity: 0.35, roughness: 0.2 }); for (let y = 4; y <= 20; y += 2) { const m = new THREE.Mesh(new THREE.PlaneGeometry(CS * 2.4, CS * 1.4), sk); m.rotation.x = Math.PI / 2; m.position.set(15.5 * CS, CWH - 0.02, (y + 0.5) * CS); World.group.add(m); } }
  // skirting along every wall run is part of the plaster texture
}
/* ---------------- furniture ---------------- */
function sofa(x, z, ry, color = 0x1f5f6e) {
  const g = new THREE.Group(), m = stdMat({ color, roughness: 0.75 }), leg = stdMat({ color: 0x222222, metalness: 0.6 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.8), m); seat.position.y = 0.42; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.2), m); back.position.set(0, 0.85, -0.32); g.add(back);
  for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.8), m); arm.position.set(s * 0.9, 0.62, 0); g.add(arm); }
  for (const [a, b] of [[-0.8, -0.3], [0.8, -0.3], [-0.8, 0.3], [0.8, 0.3]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 6), leg); l.position.set(a, 0.11, b); g.add(l); }
  g.position.set(x, 0, z); g.rotation.y = ry; g.userData.static = true; World.group.add(g);
  const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)); addBoxCollider(x - 0.9 * c - 0.4 * s, z - 0.9 * s - 0.4 * c, x + 0.9 * c + 0.4 * s, z + 0.9 * s + 0.4 * c, 0, 1.1);
  return g;
}
function plant(x, z) { const g = new THREE.Group(); const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 14), stdMat({ color: 0xd8d4cc, roughness: 0.4 })); pot.position.y = 0.25; g.add(pot); const lm = stdMat({ color: 0x2e6a2a, roughness: 0.8 }); for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.18, 0.3), 8, 6), lm); l.position.set(rnd(-0.25, 0.25), rnd(0.7, 1.5), rnd(-0.25, 0.25)); g.add(l); } g.position.set(x, 0, z); g.userData.static = true; World.group.add(g); addBoxCollider(x - 0.28, z - 0.28, x + 0.28, z + 0.28, 0, 1.6); }
function reception(x, z, ry) { const g = new THREE.Group(); const wood = stdMat({ color: 0x8a5a34, roughness: 0.5 }), top = stdMat({ color: 0xe8e4dc, roughness: 0.3 }); const b = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 0.8), wood); b.position.y = 0.55; g.add(b); const t = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.06, 0.95), top); t.position.y = 1.12; g.add(t); g.position.set(x, 0, z); g.rotation.y = ry; g.userData.static = true; World.group.add(g); const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)); addBoxCollider(x - 1.6 * c - 0.45 * s, z - 1.6 * s - 0.45 * c, x + 1.6 * c + 0.45 * s, z + 1.6 * s + 0.45 * c, 0, 1.2); return g; }
function vending(x, z, ry) {
  const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.95, 0.8), stdMat({ color: 0x1a2a4a, roughness: 0.4, metalness: 0.3 })); body.position.y = 0.975; g.add(body);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 1.2), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x88b8ff, emissiveIntensity: 0.55 })); win.position.set(-0.1, 1.2, 0.405); g.add(win);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const can = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.13, 8), stdMat({ color: pick([0xd22, 0x1a8cff, 0x2c2, 0xfc0, 0xeee]), metalness: 0.6, roughness: 0.3 })); can.position.set(-0.32 + c * 0.15, 0.75 + r * 0.28, 0.33); g.add(can); }
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.02), new THREE.MeshStandardMaterial({ color: 0x111, emissive: 0x30ff60, emissiveIntensity: 1 })); slot.position.set(0.36, 1.25, 0.41); g.add(slot);
  g.position.set(x, 0, z); g.rotation.y = ry; World.group.add(g);
  const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)); addBoxCollider(x - 0.5 * c - 0.4 * s, z - 0.5 * s - 0.4 * c, x + 0.5 * c + 0.4 * s, z + 0.5 * s + 0.4 * c, 0, 2);
  const fx = Math.sin(ry), fz = Math.cos(ry); const L = new THREE.PointLight(0x88b8ff, 0.6, 4); L.position.set(x + fx * 0.8, 1.4, z + fz * 0.8); World.group.add(L);
  addInteract({ pos: { x: x + fx * 0.6, y: 1.2, z: z + fz * 0.6 }, r: 1.8, label: () => Game.inv.coin ? `حط ريال في المكينة (${ar(Game.inv.coin)})` : 'مكينة مشروبات — تبي ريال', use: () => {
    if (!Game.inv.coin) { SFX.error(); UI.msg('تحتاج <b>ريال</b> 🪙. دوّر في المكاتب.', 2200); return; }
    Game.inv.coin--; if (!Game.inv.coin) delete Game.inv.coin; Game.updateInv(); sample('sfx_vend', x, z, { vol: 1.2 }); Game.noise(x, z, 14);
    later(() => { const k = Math.random() < 0.55 ? 'energy' : 'vitc'; Game.inv[k] = (Game.inv[k] | 0) + 1; Game.updateInv(); UI.msg(`طاح لك <b>${ITEMS[k].name}</b> ${ITEMS[k].icon}`, 2200); SFX.pick(); }, 2200);
  } });
  return g;
}
function whiteboard(x, z, ry, w = 3.4, lines) { const t = signTex({ w: 1024, h: 420, bg: '#f4f6f6', border: '#9aa0a6', bw: 14, age: true, lines: lines || [] }); return poster(t, x, 1.65, z, ry, w, 1.4); }
function chairMesh(x, z, ry) { const g = new THREE.Group(); const m = stdMat({ color: 0x2a3e5c, roughness: 0.6 }), mt = stdMat({ color: 0x333, metalness: 0.7 }); const s = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.42), m); s.position.y = 0.46; g.add(s); const b = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.05), m); b.position.set(0, 0.7, -0.2); g.add(b); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6), mt); l.position.y = 0.23; g.add(l); g.position.set(x, 0, z); g.rotation.y = ry; g.userData.static = true; World.group.add(g); }
function lectureHall(G, r, title) {
  const W = roomW(r); const rows = Math.floor((W.z1 - W.z0 - 3.4) / 1.35), cols = Math.floor((W.x1 - W.x0 - 1.4) / 2.1);
  const facingNorth = r.y0 >= 10; // board on the far wall from the corridor door
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { if (Math.random() < 0.12) continue; const x = W.x0 + 1.2 + j * 2.1 + 0.8, z = facingNorth ? W.z0 + 2.6 + i * 1.35 : W.z1 - 2.6 - i * 1.35; deskMesh(x, z, 0); chairMesh(x - 0.4, z + (facingNorth ? 0.55 : -0.55), facingNorth ? Math.PI : 0); chairMesh(x + 0.4, z + (facingNorth ? 0.55 : -0.55), facingNorth ? Math.PI : 0); }
  const bz = facingNorth ? W.z0 + 0.12 : W.z1 - 0.12; whiteboard(W.cx, bz, facingNorth ? 0 : Math.PI, 3.6, [{ t: title || '', y: 110, s: 64, c: '#1a3a7a', f: 'Arial' }, { t: pick(['HbA1c < 7%', 'ACE-I → cough', 'Warfarin + INR', 'CYP3A4 inhibitors', 'Metformin: 1st line', 'Loop diuretics → ↓K⁺']), y: 220, s: 54, c: '#222', f: 'Arial' }, { t: pick(['اختبار الأحد ٨ ص', 'لا تنسون الواجب', 'كويز مفاجئ 🙂', 'الحضور إلزامي']), y: 330, s: 50, c: '#b11' }]);
  const pod = prop(new THREE.BoxGeometry(1.0, 1.1, 0.6), stdMat({ color: 0x6a4a30 }), W.cx + 2.4, 0.55, facingNorth ? W.z0 + 1.1 : W.z1 - 1.1, 0, true);
}
function officeRoom(G, r) { const W = roomW(r); const x = W.cx + (r.side === 'w' ? -0.4 : 0.4); deskMesh(x, W.cz, Math.PI / 2); chairMesh(x + (r.side === 'w' ? -0.7 : 0.7), W.cz, r.side === 'w' ? -Math.PI / 2 : Math.PI / 2); shelfMesh(W.cx, W.z0 + 0.3, 0, 2.2, 1.8); }
function restroom(G, r) { const W = roomW(r); const m = stdMat({ color: 0xf0f0f0, roughness: 0.2 }); for (let i = 0; i < 2; i++) { prop(new THREE.BoxGeometry(0.6, 0.85, 0.45), m, W.x0 + 0.8 + i * 1.6, 0.42, W.z0 + 0.35, 0, true); } const mir = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), new THREE.MeshStandardMaterial({ color: 0x8aa0b0, metalness: 0.9, roughness: 0.05 })); mir.position.set(W.cx, 1.6, W.z0 + 0.12); World.group.add(mir); }
/* ---------------- main stairs + roller shutter ---------------- */
function mainStairs(G, opts = {}) {
  const x0 = 14 * CS, x1 = 17 * CS, zTop = 0.3, zBot = 3 * CS - 0.1, N = 16, rise = CWH / N, run = (zBot - zTop) / N;
  const sm = stdMat({ map: TEX.tile, roughness: 0.3 }), rail = new THREE.MeshStandardMaterial({ color: 0x9fc0c8, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.2 });
  for (let i = 0; i < N; i++) { const top = (i + 1) * rise, z1 = zBot - i * run; prop(new THREE.BoxGeometry(x1 - x0 - 0.4, top, run), sm, (x0 + x1) / 2, top / 2, z1 - run / 2, 0, false); World.surfaces.push({ x0: x0 + 0.2, x1: x1 - 0.2, z0: z1 - run, z1, y: top }); }
  for (const x of [x0 + 0.15, x1 - 0.15]) { const g = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.0, zBot - zTop), rail); g.position.set(x, CWH / 2 + 0.5, (zTop + zBot) / 2); g.rotation.x = Math.atan2(CWH, zBot - zTop); World.group.add(g); addBoxCollider(x - 0.1, zTop, x + 0.1, zBot, -1, 8); }
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 3, 1.6), new THREE.MeshBasicMaterial({ color: 0x05070a, side: THREE.BackSide })); shaft.position.set((x0 + x1) / 2, CWH + 1.4, zTop + 0.8); World.group.add(shaft);
  addTrigger({ x: (x0 + x1) / 2, z: zTop + 0.6, w: 3.5, d: 0.8, cond: () => Player.pos.y > CWH - 0.7 && (!opts.cond || opts.cond()), fire: () => opts.onTop && opts.onTop() });
  // roller shutter at the foot of the stairs
  const sh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, CWH, 0.08), stdMat({ map: TEX.metal, color: 0xa8aaa8, metalness: 0.6, roughness: 0.45 })); sh.position.set((x0 + x1) / 2, CWH / 2, 3 * CS + 0.1); World.group.add(sh);
  const col = addBoxCollider(x0, 3 * CS, x1, 3 * CS + 0.2, -1, 8);
  const S = { mesh: sh, col, open: 0, target: 0 };
  World.updaters.push(dt => { if (S.open < S.target) { S.open = Math.min(S.target, S.open + Math.max(dt, 0.033) * 0.4); sh.position.y = CWH / 2 + S.open * CWH; if (S.open > 0.55) col.off = true; } });
  if (opts.open) { S.open = S.target = 1; sh.position.y = CWH * 1.5; col.off = true; }
  const lab = signTex({ w: 512, h: 160, bg: '#ac1c14', age: true, lines: [{ t: opts.label || 'الدرج مغلق', y: 80, s: 48, c: '#fff' }, { t: opts.sub || '', y: 135, s: 30, c: '#ffd' }] });
  S.sign = poster(lab, (x0 + x1) / 2, 1.9, 3 * CS + 0.16, 0, 1.6, 0.5);
  return S;
}
function sideStairsBlocked(G) { for (const x of [2, 28]) { const g = new THREE.Mesh(new THREE.BoxGeometry(CS, CWH, 0.1), stdMat({ map: TEX.metal, color: 0x8a8c8c, metalness: 0.6 })); g.position.set((x + 0.5) * CS, CWH / 2, CS + 0.05); World.group.add(g); addBoxCollider(x * CS, CS - 0.05, (x + 1) * CS, CS + 0.15, -1, 8); poster(signTex({ w: 512, h: 128, bg: '#333', lines: [{ t: 'مغلق للصيانة', y: 82, s: 46, c: '#ffd36b' }] }), (x + 0.5) * CS, 1.8, CS + 0.12, 0, 1.4, 0.36); } }
/* ---------------- interactive noise toys ---------------- */
function balloon(x, z, y = rnd(1.4, 2.2)) {
  const col = pick([0xff3b6b, 0x3bb0ff, 0xffd23b, 0x6bff8a, 0xffffff, 0x0f8a4a]);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), new THREE.MeshStandardMaterial({ color: col, roughness: 0.2, metalness: 0.05 })); b.scale.y = 1.2; b.position.set(x, y, z); World.group.add(b);
  const str = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, y - 0.2, 3), stdMat({ color: 0xeeeeee })); str.position.set(x, (y - 0.2) / 2, z); World.group.add(str);
  const ph = rnd(0, 6); World.updaters.push(() => { if (b.parent) b.position.y = y + Math.sin(Game.t * 1.1 + ph) * 0.03; });
  const pop = () => { if (!b.parent) return; World.group.remove(b); World.group.remove(str); sample('sfx_pop', x, z, { vol: 1.4 }); Game.noise(x, z, 32); Game.shake(0.15); };
  const it = addInteract({ pos: { x, y, z }, r: 1.8, label: 'افقع البالونة 🎈', use: () => { it.done = true; pop(); UI.msg('بوم!… أكيد سمعها.', 1800); } });
  return { pop: () => { it.done = true; pop(); }, b };
}
function canOnFloor(x, z) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.12, 10), new THREE.MeshStandardMaterial({ color: pick([0xd22, 0x1a8cff, 0xeee]), metalness: 0.8, roughness: 0.3 })); c.rotation.z = Math.PI / 2; c.position.set(x, 0.033, z); World.group.add(c); const v = { x: 0, z: 0 }; let cd = 0;
  World.updaters.push(dt => { cd -= dt; const P = Player.pos, d = Math.hypot(P.x - c.position.x, P.z - c.position.z); if (d < 0.45 && cd <= 0 && Player.moveAmt > 0.5) { cd = 1; const a = Math.atan2(c.position.x - P.x, c.position.z - P.z); v.x = Math.sin(a) * (1.5 + Player.moveAmt * 0.5); v.z = Math.cos(a) * (1.5 + Player.moveAmt * 0.5); sample('sfx_can', c.position.x, c.position.z, { vol: Player.crouch > 0.5 ? 0.4 : 1 }); Game.noise(c.position.x, c.position.z, Player.crouch > 0.5 ? 5 : 14); }
    if (Math.abs(v.x) + Math.abs(v.z) > 0.01) { c.position.x += v.x * dt; c.position.z += v.z * dt; c.rotation.y += dt * 8; v.x *= 0.93; v.z *= 0.93; collide(c.position, 0.05, 0, 0.2); } }); }
function fireAlarm(x, z, ry) { const g = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.06), new THREE.MeshStandardMaterial({ color: 0xc81414, emissive: 0x400000 })); g.position.set(x, 1.35, z); g.rotation.y = ry; World.group.add(g);
  const it = addInteract({ pos: { x, y: 1.35, z }, r: 1.6, once: true, label: 'اسحب إنذار الحريق 🔔 (يلهيه)', use: () => { for (let i = 0; i < 3; i++) later(() => sample('sfx_bell', x, z, { vol: 1.5 }), i * 3200); Game.noise(x, z, 80); Game.monsters.forEach(m => { if (m.state !== 'off' && m.state !== 'lure' && m.state !== 'dark') { m.state = 'investigate'; m.goto(x, z); m.path = []; m.repath = 99; } }); UI.msg('🔔 الإنذار يصيح… كل الدكاترة رايحين له. اهرب الحين!', 3200); } }); }
/* throwing an empty bottle: lands with a crash and pulls the doctor there */
function throwBottle() {
  const P = Player, fx = -Math.sin(P.yaw) * Math.cos(P.pitch), fz = -Math.cos(P.yaw) * Math.cos(P.pitch), fy = Math.sin(P.pitch);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.2, 10), new THREE.MeshStandardMaterial({ color: 0x9fd8c8, transparent: true, opacity: 0.6, roughness: 0.05 }));
  const pos = new THREE.Vector3(P.pos.x + fx * 0.4, P.eyeY() - 0.1, P.pos.z + fz * 0.4), vel = new THREE.Vector3(fx * 11, fy * 11 + 3, fz * 11); m.position.copy(pos); World.group.add(m);
  World.updaters.push(function f(dt) { if (!m.parent) return; vel.y -= 14 * dt; const ox = pos.x, oz = pos.z; pos.addScaledVector(vel, dt); m.position.copy(pos); m.rotation.x += dt * 12; const before = pos.x + pos.z; collide(pos, 0.05, pos.y - 0.05, pos.y + 0.05); const hitWall = Math.abs(pos.x + pos.z - before) > 1e-4;
    if (pos.y <= 0.05 || hitWall || pos.y > CWH - 0.1) { World.group.remove(m); SFX.bulbPop(pos.x, pos.z); SFX.clank(pos.x, pos.z); Game.noise(pos.x, pos.z, 40); Game.monsters.forEach(mm => { if (mm.state === 'wander' || mm.state === 'search' || mm.state === 'investigate') { mm.state = 'investigate'; mm.goto(pos.x, pos.z); mm.repath = 99; } }); UI.msg('…كراااش', 1200); } });
  SFX.paper && SFX.paper();
}
ITEMS.bottle = { name: 'علبة زجاج فاضية', icon: '🍾', desc: 'ارمها بزر «استخدم» عشان تلهي الدكتور: يروح للمكان اللي تطيح فيه.', use() { throwBottle(); return true; } };
ITEMS.coin = { name: 'ريال', icon: '🪙', desc: 'للمكينة اللي جنب الجلسة تحت الدرج.', use() { UI.msg('حطه في مكينة المشروبات.', 1600); return false; } };
ITEMS.fuse = { name: 'فيوز كهرباء', icon: '🔌', desc: 'ركّبه في لوحة غرفة الكهرباء.', use() { return false; } };
ITEMS.eleckey = { name: 'مفتاح غرفة الكهرباء', icon: '🗝️', desc: 'يفتح غرفة الكهرباء جنب الدرج الغربي.', use() { return false; } };
ITEMS.storekey = { name: 'مفتاح المخزن', icon: '🗝️', desc: '', use() { return false; } };
['bottle', 'coin', 'fuse', 'eleckey'].forEach(k => { INV_NAMES[k] = ITEMS[k].name; INV_ICONS[k] = ITEMS[k].icon; INV_DESC[k] = ITEMS[k].desc; });
function pickupKind(kind, x, z, y = 0.78) { return spawnItem(kind, x, z, y); }
/* lights: square ceiling panels in corridors and halls */
function collegeLights(G, frac, seed, extra = {}) {
  const fx = []; for (let y = 0; y < G.H; y++) for (let x = 0; x < G.W; x++) { if (!G.floor[y * G.W + x] || G.void[y * G.W + x]) continue; if ((x + y) % 2) continue; fx.push({ x: G.cx(x), z: G.cz(y), flick: Math.random() < 0.2 ? rnd(0.15, 0.5) : 0, on: Math.random() > 0.1 }); }
  darkZones(fx, G, frac, seed); if (extra.keepLit) fx.forEach(f => { if (extra.keepLit(f)) f.on = true; });
  buildFixtures(fx, CWH, { intensity: 2.4, power: extra.power || 3.6, range: 8.5, lightColor: extra.color || 0xf4f6ff, color: 0xf8faff, w: 1.1, d: 1.1 }); initLightPool(8);
  return fx;
}
function knockSpawn(m, voiceId) { const G = World.grid, P = Player.pos; let best = null, bd = 0; for (let i = 0; i < 120; i++) { const x = (Math.random() * G.W) | 0, y = (Math.random() * G.H) | 0; if (!G.floor[y * G.W + x] || G.void[y * G.W + x]) continue; const wx = G.cx(x), wz = G.cz(y), d = Math.hypot(wx - P.x, wz - P.z); if (d > bd && d < 40 && !losCheck(wx, wz, P.x, P.z) && bfsPath(G, x, y, ...G.cell(P.x, P.z), true)) { bd = d; best = [wx, wz]; } } if (best) m.place(best[0], best[1]); SFX.knock(m.pos.x, m.pos.z, 4); later(() => SFX.knock(m.pos.x, m.pos.z, 3), 1500); later(() => { m.activate('wander'); m.combT = 0; voice(voiceId, m.pos.x, m.pos.z, { force: true }); }, 2600); }

/* =====================================================================
   FLOOR 1 · الدور الأرضي — د. مجاهد
   ===================================================================== */
Object.assign(NOTES, {
  F1: { head: 'ورقة ملصوقة على مكتب الاستقبال', sig: '— طالب سنة رابعة', text: 'الكلية مقفلة والكهرباء طافية… <b>والدرج عليه شتر حديد</b>.<br>• عشان ينفتح لازم ترجّع الكهرباء: <b>٣ فيوزات</b> متفرقة في القاعات، ركّبها في <b>غرفة الكهرباء</b> جنب الدرج الغربي.<br>• مفتاح غرفة الكهرباء <b>في درج مكتب الاستقبال</b>.<br>• فيه مكينة مشروبات تحت الدرج… تبي <b>ريال</b> 🪙 (بالمكاتب).<br>• إذا سمعت <b>طرق</b>… د. مجاهد صحى. لا تركض جنبه، اكسر خط النظر، وتخبى <b>تحت الطاولات</b> أو في <b>فتحات الجدار</b>.<br>• البالونات تفقع… والعلب ترن. كل صوت يجيبه.' },
  F2: { head: 'ورقة على درابزين الدور الثاني', sig: '— ؟', text: 'الدور الثاني.<br>• <b>يسار</b>: قسم الطلاب (المختبرات). <b>يمين</b>: قسم الطالبات… <b>الأبواب مقفلة. لا تحاول.</b><br>• بوابة الدرج للدور الثالث تبي <b>٤ مفاتيح</b> تلفها <b>خلال ٥ ثواني</b>.<br>• ٣ مفاتيح في <b>خزائن المعاطف</b> بالمختبرات، والرابع في <b>مخزن الصيدلية الافتراضية</b>… وقفله أرقام ألوان.<br>• د. منهاج <b>ما يقدر يفتح الأبواب</b>، بس <b>يقلّد الأصوات</b>. لا تروح للصوت.' },
  F3: { head: 'ورقة على باب الدرج', sig: '— فني الصيانة', text: 'الدور الثالث: مكاتب الدكاترة والإدارة… و<b>قاعة M</b>.<br>• النور يطفي كل شوي، ود. أمل <b>تمشي في الظلام</b>.<br>• إذا طفى: <b>ثبّت نور الكشاف على وجهها</b>. النور يوقفها. إذا شلته… تقرب.<br>• كلمة سر قاعة M في <b>مكتب وكيل الكلية</b> (يمين).<br>• قاعة M: <b>يسار</b> بعد مكاتب الدكاترة، وبعدين <b>يمين</b>.' },
  store: { head: 'ورقة على باب المخزن', sig: '— مشرف المختبر', text: 'رمز المخزن = ألوان العلب في الرفوف المعلّم عليها <b>✚ أحمر</b> في <b>الصيدلية الافتراضية</b>،<br><b>من الرقم الأصغر للأكبر</b>.' },
  vd: { head: 'ورقة في درج مكتب الوكيل', sig: '— إدارة الكلية', text: 'كلمة سر جهاز <b>قاعة M</b>:<br><b>أول دواء نبدأ فيه لمريض السكري النوع الثاني</b><br>(بالإنجليزي، بدون مسافات)<br><br><i>ولا تنسون: الاختبار النهائي في قاعة M يوم الأحد.</i>' }
});
Object.assign(LEVEL_TIPS, {
  L0: ['اكسر خط النظر ولف بالزوايا، د. مجاهد يبطّئ عند المنعطفات.', 'ادخل تحت الطاولة وأنت منحني قبل لا يشوفك… مو قدامه.', 'فتحات الجدار أمان كامل: انحنِ وادخل.', 'ارمِ علبة زجاج بعيد عشان تلهيه.'],
  L1: ['د. منهاج ما يفتح الأبواب: الغرفة المسكّرة أمان.', 'لا تروح للصوت اللي يناديك من قسم الطالبات.', 'لف المفاتيح الأربعة خلال ٥ ثواني.'],
  L2: ['إذا طفى النور: ثبّت الكشاف على وجهها لين يرجع النور.', 'وفّر البطارية، والبطاريات 🔋 متفرقة في المكاتب.', 'لا توقف وهي وراك.']
});
LEVELS.L0 = {
  id: 'L0', order: 0, card: ['LEVEL 0', 'الدور الأرضي', 'كلية الصيدلة · جامعة القصيم'], surface: 'tile', vig: 1.0, sat: 0.95,
  build() {
    const G = collegeGrid(); World.grid = G;
    const names = [{ name: 'قاعة ١٠١', kind: 'hall' }, { name: 'قاعة ١٠٢', kind: 'hall' }, { name: 'قاعة ١٠٣', kind: 'hall' }, { name: 'قاعة ١٠٤', kind: 'hall' }, { name: 'قاعة ١٠٥', kind: 'hall' }, { name: 'قاعة ١٠٦', kind: 'hall' }, { name: 'قاعة ١٠٧', kind: 'hall' }, { name: 'قاعة ١٠٨', kind: 'hall' }, { name: 'قاعة ١٠٩', kind: 'hall' }, { name: 'قاعة ١١٠', kind: 'hall' }, { name: 'قاعة ١١١', kind: 'hall' }, { name: 'قاعة ١١٢', kind: 'hall' }];
    planFloor(G, 1, names);
    setupEnv({ fog: 0x0e1014, fogD: 0.03, sky: 0xbfd0e8, ground: 0x2a2620, amb: 0.5, exposure: 1.05, bloom: 0.55, bloomT: 0.8, hum: 0.45, drone: 0.25, tint: [0.98, 1, 1.04], grain: 0.035 });
    // doors (made before walls so the frames are built)
    G.halls.forEach(r => { const ds = hallDoors(G, r); ds.forEach(d => doorSign(d, r.name, 'B4-' + r.name.replace(/[^\d٠-٩]/g, ''))); });
    G.offices.forEach((r, i) => { const d = officeDoor(G, r); doorSign(d, pick(['مكتب', 'مكتب أكاديمي', 'مكتب إداري']), (r.side === 'w' ? 'W' : 'E') + (i + 1)); });
    const ed = addDoor(G, 1, 1, 2, 1, { tex: TEX.metalDoor, trim: 0x555, locked: true, key: 'eleckey', lockedMsg: 'غرفة الكهرباء مقفلة. المفتاح عند الاستقبال.' }); doorSign(ed, 'غرفة الكهرباء', '⚡', '#8a1a12');
    G.wc.forEach(r => { const d = addDoor(G, r.x0 === 3 ? 3 : 27, 1, r.x0 === 3 ? 2 : 28, 1, { tex: TEX.woodDoor, trim: 0x8a8f94 }); doorSign(d, 'دورة مياه', 'WC', '#1f4f6e'); });
    const hsd = addDoor(G, 25, 1, 24, 1, { tex: TEX.glassDoor, trim: 0x9aa0a6, locked: true, lockedMsg: 'باب زجاج… وراه ممر كلية العلوم الطبية التطبيقية. مقفل.' }); doorSign(hsd, 'كلية العلوم الطبية التطبيقية', '←', '#1f4f6e');
    buildShell(G, { skylight: true });
    // furnish
    G.halls.forEach(r => lectureHall(G, r, r.name));
    G.offices.forEach(r => officeRoom(G, r)); G.wc.forEach(r => restroom(G, r));
    // lobby: reception desk, blue sofas, plants, banner, vending machines under the stairs
    reception(16.6 * CS, 19.6 * CS, -Math.PI / 2);
    [[13.9, 6], [17.1, 6], [13.9, 12], [17.1, 12], [13.9, 18.5], [17.1, 18.5]].forEach(([x, y], i) => sofa(x * CS, y * CS, i % 2 ? -Math.PI / 2 : Math.PI / 2, 0x1d5c70));
    sofa(14.9 * CS, 3.9 * CS, Math.PI, 0x1d5c70); sofa(16.1 * CS, 3.9 * CS, Math.PI, 0x1d5c70);
    vending(17.6 * CS, 3.5 * CS, -Math.PI / 2); vending(17.6 * CS, 4.6 * CS, -Math.PI / 2);
    [[13.4, 4.2], [17.6, 20.6], [13.4, 20.6], [13.4, 13.6], [17.6, 13.6]].forEach(([x, y]) => plant(x * CS, y * CS));
    const logo = window.IMG_LOGO ? imgTex(window.IMG_LOGO) : null; if (logo) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.05), new THREE.MeshStandardMaterial({ map: logo, transparent: true, roughness: 0.6 })); pl.position.set(15.5 * CS, 3.1, 3 * CS + 0.25); World.group.add(pl); }
    const ban = signTex({ w: 1024, h: 300, bg: '#ffffff', age: true, lines: [{ t: 'يوم حصاد مشاريع التخرج', y: 120, s: 78, c: '#0f5135' }, { t: 'GRADUATION PROJECTS DAY', y: 210, s: 48, c: '#1f4f6e', f: 'Arial' }] });
    poster(ban, 15.5 * CS, 2.6, 21.9 * CS, Math.PI, 4.2, 1.2);
    // graduation-day balloons in the lobby: pop one and he hears it
    const balloons = []; for (let i = 0; i < 12; i++) balloons.push(balloon(rnd(13.6, 17.4) * CS, rnd(10, 20) * CS)); Game.flags.balloons = balloons;
    for (let i = 0; i < 9; i++) { const y = pick([8.5, 9.4, 15.4, 16.5]), x = pick([rnd(3.3, 12.5), rnd(18.5, 27.6)]); canOnFloor(x * CS, y * CS); }
    fireAlarm(3 * CS + 0.12, 9.6 * CS, Math.PI / 2); fireAlarm(28 * CS - 0.12, 15.4 * CS, -Math.PI / 2);
    // crawl holes in corridor walls (safe spots)
    [[2, 5, 'w'], [2, 18, 'w'], [28, 6, 'e'], [28, 19, 'e'], [10, 9, 's'], [21, 15, 'n'], [6, 16, 's'], [24, 8, 'n']].forEach(([cx, cy, sd]) => { const sd2 = wallSide(G, cx, cy, sd); if (!sd2) return; const p = onWall(G, cx, cy, sd2, 0); addLockerHide(p.x + Math.sin(p.ry) * 0.25, p.z + Math.cos(p.ry) * 0.25, p.ry); });
    // lights: patches of the building are dark
    collegeLights(G, 0.42, 7, { keepLit: f => f.z > 17 * CS && Math.abs(f.x - 15.5 * CS) < 4 });
    // the shutter + stairs
    const sh = mainStairs(G, { label: 'الدرج مقفل', sub: 'الكهرباء مفصولة', cond: () => Game.flags.power, onTop: () => noclipTo('L1') }); Game.flags.shutter = sh;
    sideStairsBlocked(G);
    // objectives: key in the reception drawer, 3 fuses in random halls, coins in offices
    addInteract({ pos: { x: 16.6 * CS, y: 1, z: 19.6 * CS }, r: 2.2, once: true, label: 'فتّش درج الاستقبال', use: () => { SFX.doorOpen(16.6 * CS, 19.6 * CS); Game.inv.eleckey = 1; Game.held = 'eleckey'; Game.updateInv(); UI.msg('لقيت <b>مفتاح غرفة الكهرباء</b> 🗝️', 2600); UI.objective('افتح غرفة الكهرباء', 'آخر الممر الغربي جنب الدرج · امسك المفتاح'); if (!Game.flags.spawned) later(() => l0Spawn(), 9000); } });
    const fuseHalls = G.halls.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    fuseHalls.forEach(r => { const W = roomW(r); const d = World.hides.filter(h => h.type === 'table' && h.x > W.x0 && h.x < W.x1 && h.z > W.z0 && h.z < W.z1); const t = d.length ? pick(d) : { x: W.cx, z: W.cz }; pickupKind('fuse', t.x, t.z); });
    G.offices.slice().sort(() => Math.random() - 0.5).slice(0, 3).forEach(r => { const W = roomW(r); pickupKind('coin', W.cx + (r.side === 'w' ? -0.4 : 0.4), W.cz); });
    G.offices.slice().sort(() => Math.random() - 0.5).slice(0, 4).forEach(r => { const W = roomW(r); pickupKind(pick(['battery', 'bottle', 'bottle', 'vitc']), W.cx + rnd(-0.4, 0.4), W.cz + 0.5, 0.78); });
    pickupKind('redjuice', 16.6 * CS, 18.9 * CS, 1.15); // right on the reception desk, under the light
    // fuse panel in the electrical room
    const ew = roomW(G.elec); const panel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.15), stdMat({ color: 0x5a6066, metalness: 0.6 })); panel.position.set(ew.cx, 1.4, ew.z0 + 0.12); World.group.add(panel);
    const slots = [0, 1, 2].map(i => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.05), new THREE.MeshStandardMaterial({ color: 0x222, emissive: 0x330000 })); s.position.set(ew.cx - 0.25 + i * 0.25, 1.4, ew.z0 + 0.22); World.group.add(s); return s; });
    Game.flags.fuses = 0;
    addInteract({ pos: { x: ew.cx, y: 1.4, z: ew.z0 + 0.4 }, r: 1.8, cond: () => !Game.flags.power, label: () => Game.inv.fuse ? 'ركّب الفيوز' : `لوحة الكهرباء (${ar(Game.flags.fuses)}/٣)`, use: () => {
      if (!Game.inv.fuse) { SFX.locked(); UI.msg('تحتاج فيوز. الفيوزات في القاعات.', 2000); return; }
      Game.inv.fuse--; if (!Game.inv.fuse) delete Game.inv.fuse; Game.updateInv(); slots[Game.flags.fuses].material.emissive.set(0x00aa33); Game.flags.fuses++; SFX.clank(ew.cx, ew.z0); Game.noise(ew.cx, ew.z0, 10);
      if (Game.flags.fuses < 3) { UI.msg(`فيوز ${ar(Game.flags.fuses)}/٣`, 1800); UI.objective(`ركّب الفيوزات (${ar(Game.flags.fuses)}/٣)`, 'دوّر في القاعات المظلمة'); return; }
      powerOn();
    } });
    // spawn at the entrance, facing the long corridor
    Player.pos.set(15.5 * CS, 0, 21.4 * CS); Player.yaw = 0;
    noteOnWall(G, 16, 21, 'e', NOTES.F1, () => { if (!Game.flags.o0) { Game.flags.o0 = 1; UI.objective('فتّش مكتب الاستقبال', 'يمينك'); } });
    graffiti(G, 2, 12, 'w', 'لا تركض… يسمعك', { color: 'rgba(130,12,8,0.8)' }); graffiti(G, 21, 9, 'n', '|||| |||| |||| ٣٦', { color: 'rgba(25,18,10,0.8)', size: 46 }); graffiti(G, 28, 4, 'e', 'العلوم الطبية مو مخرج');
    loreNote(G, 0, 7, 'w', 'l0a'); loreNote(G, 30, 13, 'e', 'l0b');
    const mj = new Monster('mujahid', { walk: 1.2, run: 4.85, sight: 18, sightDark: 5, doors: 'bang', catchR: 0.95 }); Game.monsters.push(mj); mj.place(-99, -99);
    Game.flags.t0 = Game.t; World.batches = staticBatch();
  },
  update(dt) {
    const F = Game.flags, t = Game.t - F.t0;
    if (!F.toast1 && t > 20) { F.toast1 = 1; SFX.phone(); UI.toast('د. مجاهد', 'وينك يا طالب؟ الكويز بدأ 🙂'); }
    if (!F.spawned && t > 150) l0Spawn();
    if (!F.bellT || Game.t > F.bellT) { F.bellT = Game.t + rnd(70, 110); if (t > 30) sample('sfx_bell', 15.5 * CS + rnd(-20, 20), 12 * CS, { vol: 0.5, rate: 0.85 }); }
    if (F.spawned && !F.selfPop && Game.t - F.spawnT > 40 && Math.random() < dt * 0.02) { F.selfPop = 1; const b = (F.balloons || []).find(b => b.b.parent); if (b) { b.pop(); UI.msg('…بالونة فقعت لحالها؟', 2000); } }
    if (F.hsKnock === undefined && Math.hypot(Player.pos.x - 24 * CS, Player.pos.z - 1.5 * CS) < 3) { F.hsKnock = 1; later(() => { SFX.knock(25.5 * CS, 1.5 * CS, 3); UI.msg('…أحد يطق من ورا الباب الزجاج', 2200); }, 800); }
  },
  respawn() { respawnFloor(() => { const F = Game.flags; if (F.power) { Player.pos.set(15.5 * CS, 0, 6 * CS); Player.yaw = 0; } else { Player.pos.set(15.5 * CS, 0, 21.4 * CS); Player.yaw = 0; } }); }
};
function l0Spawn() { const F = Game.flags; if (F.spawned) return; F.spawned = true; F.spawnT = Game.t; knockSpawn(Game.monsters[0], 'm1'); UI.msg('…<b>طق طق طق</b>', 2200); }
function powerOn() {
  const F = Game.flags; F.power = true; SFX.success(); SFX.rumble(2.5); Game.shake(0.5);
  UI.msg('⚡ رجعت الكهرباء', 2200);
  // the lights come back one by one… then the corridor goes dark again except the path to the stairs
  World.fixtures.forEach((f, i) => { const was = f.on; f.base = 0; later(() => { f.base = 1; f.on = true; World.blackoutChanged = true; }, 200 + (f.z / CS) * 60 + Math.random() * 300); });
  later(() => { SFX.lightsOff(); World.fixtures.forEach(f => { if (Math.abs(f.x - 15.5 * CS) > 4) f.base = Math.random() < 0.3 ? 1 : 0; }); World.blackoutChanged = true; }, 3800);
  later(() => { const S = F.shutter; S.target = 1; SFX.elevatorMotor(4); S.sign.visible = false; UI.objective('اطلع الدرج للدور الثاني!', 'الشتر ينفتح… واركض'); }, 1600);
  later(() => { const m = Game.monsters[0]; if (m.state === 'off') { m.place(15.5 * CS, 21 * CS, Math.PI); m.activate('chase'); } m.state = 'chase'; m.lastSeen = Game.t; m.lastSeenPos = { x: Player.pos.x, z: Player.pos.z }; m.place(m.pos.x, m.pos.z); sample('sfx_sting', Player.pos.x, Player.pos.z, { flat: true }); voice('m11', m.pos.x, m.pos.z, { force: true }); }, 4400);
}
function respawnFloor(place) {
  const F = Game.flags; Game.state = 'play'; Player.vel.set(0, 0, 0); Player.vy = 0; Player.pos.y = 0; Player.onGround = true; Player.pitch = 0; place();
  Game.monsters.forEach(m => { if (m.state === 'off' && !F.spawned) return; m.path = []; m.bang = null; m.target = null; m.lastSeenPos = null; m.sawHide = false; const G = World.grid; let best = null, bd = 0; for (let i = 0; i < 80; i++) { const x = (Math.random() * G.W) | 0, y = (Math.random() * G.H) | 0; if (!G.floor[y * G.W + x] || G.void[y * G.W + x]) continue; const wx = G.cx(x), wz = G.cz(y), d = Math.hypot(wx - Player.pos.x, wz - Player.pos.z); if (d > bd && !losCheck(wx, wz, Player.pos.x, Player.pos.z)) { bd = d; best = [wx, wz]; } } if (best) m.place(best[0], best[1]); if (m.state !== 'off') { m.state = 'wander'; m.root.visible = true; m.combT = Game.t + 12; } });
  UI.msg('…رجعت. بس هو ما زال هنا.', 2600);
}

/* =====================================================================
   FLOOR 2 · الدور الثاني — د. منهاج (boys left · girls right, locked)
   ===================================================================== */
LEVELS.L1 = {
  id: 'L1', order: 1, card: ['LEVEL 1', 'الدور الثاني', 'المختبرات · قسم الطلاب وقسم الطالبات'], surface: 'tile', vig: 1.1, sat: 0.85,
  build() {
    const G = collegeGrid(); World.grid = G;
    const names = [{ name: 'مختبر الصيدلانيات', kind: 'lab' }, { name: 'مختبر الكيمياء الصيدلية', kind: 'lab' }, { name: 'الصيدلية الافتراضية', kind: 'vp', oneDoor: true }, { name: 'مختبر علم الأدوية', kind: 'lab' }, { name: 'قاعة ٢٠١', kind: 'hall' }, { name: 'مخزن الصيدلية', kind: 'store' },
      { name: 'قاعة ٢٠٧', kind: 'girls' }, { name: 'قاعة ٢٠٨', kind: 'girls' }, { name: 'مختبر ٢٠٩', kind: 'girls' }, { name: 'مختبر ٢١٠', kind: 'girls' }, { name: 'قاعة ٢١١', kind: 'girls' }, { name: 'قاعة ٢١٢', kind: 'girls' }];
    planFloor(G, 2, names);
    for (let y = 6; y <= 18; y++) for (let x = 14; x <= 16; x++) { G.floor[y * G.W + x] = 0; G.void[y * G.W + x] = 1; } // the open void over the lobby
    setupEnv({ fog: 0x0b0d10, fogD: 0.035, sky: 0x9fb0c8, ground: 0x1a1816, amb: 0.32, exposure: 1.0, bloom: 0.55, bloomT: 0.8, hum: 0.3, drone: 0.45, wind: 0.25, tint: [0.96, 1, 1.05], grain: 0.04 });
    G.halls.forEach(r => {
      if (r.kind === 'girls') { hallDoors(G, r, { locked: true, lockedMsg: 'قسم الطالبات… الباب مقفل.' }).forEach(d => { doorSign(d, r.name, 'قسم الطالبات', '#6a1f4a'); d.girls = true; }); return; }
      if (r.kind === 'store') { const ds = hallDoors(G, r, { tex: TEX.metalDoor, locked: true, lockedMsg: 'المخزن مقفل… فيه لوحة أرقام ألوان جنب الباب.' }); ds.forEach(d => doorSign(d, r.name, 'STORE', '#8a1a12')); Game.flags.storeDoors = ds; return; }
      hallDoors(G, r).forEach(d => doorSign(d, r.name, r.kind === 'lab' ? 'LAB' : 'B4-' + r.name.replace(/[^\d٠-٩]/g, '')));
    });
    G.offices.forEach((r, i) => { const d = officeDoor(G, r, r.side === 'e' ? { locked: true, lockedMsg: 'مقفل.' } : {}); doorSign(d, r.side === 'e' ? 'قسم الطالبات' : 'مكتب', (r.side === 'w' ? 'W' : 'E') + (i + 1), r.side === 'e' ? '#6a1f4a' : '#0f5135'); });
    addDoor(G, 1, 1, 2, 1, { tex: TEX.metalDoor, locked: true, lockedMsg: 'مقفل.' });
    G.wc.forEach(r => { const d = addDoor(G, r.x0 === 3 ? 3 : 27, 1, r.x0 === 3 ? 2 : 28, 1, { tex: TEX.woodDoor, locked: r.x0 !== 3, lockedMsg: 'مقفل.' }); doorSign(d, 'دورة مياه', r.x0 === 3 ? 'WC' : 'WC · طالبات', '#1f4f6e'); });
    addDoor(G, 25, 1, 24, 1, { tex: TEX.glassDoor, locked: true, lockedMsg: 'مقفل.' });
    // a partition with a locked door where the girls' section starts
    for (const y of [8, 15]) { const d = addDoor(G, 17, y, 18, y, { tex: TEX.woodDoor, trim: 0x6a1f4a, locked: true, lockedMsg: 'قسم الطالبات. الدخول ممنوع.', width: 1.4 }); doorSign(d, 'قسم الطالبات', 'منطقة مغلقة', '#6a1f4a'); G.v[G.vi(18, y + 1)] = 1; }
    buildShell(G, { void: 1 });
    // the void: glass railing + darkness down to the lobby
    const rail = new THREE.MeshStandardMaterial({ color: 0x9fc0c8, transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.3 }), top = stdMat({ color: 0xc8ccd0, metalness: 0.8, roughness: 0.3 });
    const vx0 = 14 * CS, vx1 = 17 * CS, vz0 = 6 * CS, vz1 = 19 * CS;
    for (const [a, b, c, d] of [[vx0, vz0, vx1, vz0], [vx0, vz1, vx1, vz1], [vx0, vz0, vx0, vz1], [vx1, vz0, vx1, vz1]]) { const L = Math.hypot(c - a, d - b), g = new THREE.Mesh(new THREE.BoxGeometry(c - a || 0.03, 1.05, d - b || 0.03), rail); g.position.set((a + c) / 2, 0.52, (b + d) / 2); World.group.add(g); const t = new THREE.Mesh(new THREE.BoxGeometry((c - a) || 0.06, 0.05, (d - b) || 0.06), top); t.position.set((a + c) / 2, 1.06, (b + d) / 2); World.group.add(t); addBoxCollider(Math.min(a, c) - 0.05, Math.min(b, d) - 0.05, Math.max(a, c) + 0.05, Math.max(b, d) + 0.05, -1, 8); }
    for (const [x, y, ry] of [[14.9, 9, Math.PI / 2], [16.1, 13, -Math.PI / 2], [14.9, 16, Math.PI / 2]]) sofa(x * CS, y * CS, ry, 0x123a46).position.y = -CWH;
    // furnish: labs, the virtual pharmacy, the store
    G.halls.forEach(r => { if (r.kind === 'hall') lectureHall(G, r, r.name); else if (r.kind === 'lab') labRoom(G, r); else if (r.kind === 'girls') girlsRoomTease(G, r); });
    const vp = G.halls.find(r => r.kind === 'vp'), store = G.halls.find(r => r.kind === 'store');
    virtualPharmacy(G, vp); storeRoom(G, store);
    G.offices.forEach(r => { if (r.side === 'w') officeRoom(G, r); }); restroom(G, G.wc[0]);
    [[2, 6, 'w'], [2, 19, 'w'], [9, 9, 's'], [5, 16, 's'], [13, 4, 'w'], [17, 20, 'e']].forEach(([cx, cy, sd]) => { const sd2 = wallSide(G, cx, cy, sd); if (!sd2) return; const p = onWall(G, cx, cy, sd2, 0); addLockerHide(p.x + Math.sin(p.ry) * 0.25, p.z + Math.cos(p.ry) * 0.25, p.ry); });
    for (let i = 0; i < 7; i++) canOnFloor(pick([rnd(3.3, 12.5), rnd(13.3, 13.8), rnd(17.2, 17.8)]) * CS, pick([8.5, 9.4, 15.4, 16.5, rnd(4, 20)]) * CS);
    fireAlarm(3 * CS + 0.12, 15.6 * CS, Math.PI / 2);
    collegeLights(G, 0.5, 11, { power: 3.2 });
    // the gate to the third floor: 4-key panel
    const sh = mainStairs(G, { label: 'بوابة الدور الثالث', sub: '٤ مفاتيح · لفها خلال ٥ ثواني', cond: () => Game.flags.gateOpen, onTop: () => noclipTo('L2') }); Game.flags.shutter = sh;
    sideStairsBlocked(G);
    Game.flags.keys = 0; Game.flags.slots = [0, 0, 0, 0]; Game.flags.turnT = 0;
    const slotMs = [-1.5, -0.5, 0.5, 1.5].map(dx => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.06), new THREE.MeshStandardMaterial({ color: 0x333, metalness: 0.7, emissive: 0x220000 })); m.position.set(15.5 * CS + dx, 1.3, 3 * CS + 0.2); World.group.add(m); return m; }); Game.flags.slotMs = slotMs;
    slotMs.forEach((m, i) => addInteract({ pos: { x: m.position.x, y: 1.3, z: 3 * CS + 0.5 }, r: 1.3, cond: () => !Game.flags.gateOpen, label: () => Game.flags.slots[i] === 2 ? 'ملفوف ✓' : Game.flags.slots[i] === 1 ? 'لف المفتاح' : (/^k\d$/.test(Game.held) ? 'ركّب المفتاح' : 'فتحة مفتاح فاضية'), use: () => keySlot2(i) }));
    // lab coat lockers with keys 1-3 (labs), key 4 in the store
    const labs = G.halls.filter(r => r.kind === 'lab'); labs.forEach((r, i) => { const W = roomW(r); const L = lockerMesh(W.x0 + 0.6 + i * 0.1, W.z1 - 0.45, Math.PI, 0x6a7a6e); const has = i < 3; addInteract({ pos: { x: L.front.x, y: 1.2, z: L.front.z }, r: 1.7, once: true, label: 'فتّش خزانة المعاطف', use: () => { SFX.doorOpen(L.x, L.z); Game.noise(L.x, L.z, 6); if (has) giveKey(); else UI.msg('معاطف مختبر… وريحة فورمالين.', 2000); } }); });
    // spawn on the landing, looking down the gallery
    Player.pos.set(15.5 * CS, 0, 4.3 * CS); Player.yaw = Math.PI;
    noteOnWall(G, 14, 3, 'w', NOTES.F2, () => { if (!Game.flags.o1) { Game.flags.o1 = 1; UI.objective('دوّر على المفاتيح (٠/٤)', 'خزائن المعاطف في المختبرات · يسار'); } });
    graffiti(G, 17, 9, 'e', 'لا ترد على الصوت', { color: 'rgba(160,20,10,0.8)' }); graffiti(G, 3, 12, 'w', '٣٧', { size: 110, color: 'rgba(20,20,20,0.75)' }); loreNote(G, 0, 9, 'w', 'l1a');
    placeItems(G, ['battery', 'bottle', 'bottle', 'vitc', 'energy'], { x: Player.pos.x, z: Player.pos.z });
    const mh = new Monster('minhaj', { walk: 1.35, run: 4.95, sight: 20, sightDark: 6, doors: 'none', catchR: 1.05, fov: 2.2 }); Game.monsters.push(mh); mh.place(-99, -99);
    mh.customUpdate = () => mh.state === 'lure';
    Game.flags.t0 = Game.t; World.batches = staticBatch();
  },
  update(dt) {
    const F = Game.flags, P = Player.pos, mh = Game.monsters[0], t = Game.t - F.t0;
    if (F.turnT && Game.t > F.turnT) { F.turnT = 0; if (!F.gateOpen) { F.slots = F.slots.map(s => s ? 1 : 0); F.slotMs.forEach(m => m.material.emissive.set(0x333300)); SFX.error(); UI.msg('ما لحقت… المفاتيح رجعت. لفها كلها خلال ٥ ثواني!', 3000); } }
    $('timer').textContent = F.turnT ? ar(Math.max(0, Math.ceil(F.turnT - Game.t))) : ''; $('timer').classList.toggle('on', !!F.turnT);
    // the lure: after a while he calls you from the girls' side, standing behind the glass partition
    if (!F.lureStart && t > 35) { F.lureStart = 1; mh.place(19.5 * CS, 8.5 * CS, -Math.PI / 2); mh.root.visible = true; mh.state = 'lure'; F.lureT = Game.t; }
    if (mh.state === 'lure') {
      mh.doc.P.armR.rotation.x = -2.6 + Math.sin(Game.t * 6) * 0.4; mh.yaw = Math.atan2(P.x - mh.pos.x, P.z - mh.pos.z);
      if (Game.t > (F.lureVoice || 0)) { F.lureVoice = Game.t + 7; voice('n1', mh.pos.x, mh.pos.z, { force: true }); }
      const d = Math.hypot(P.x - mh.pos.x, P.z - mh.pos.z);
      if (d < 7 || Game.t - F.lureT > 30) { mh.stretch = 1.38; mh.doc.stretch = 1.38; sample('sfx_scream_n', mh.pos.x, mh.pos.z, { vol: 1.2 }); Game.shake(0.5); mh.place(13.6 * CS, 8.6 * CS); mh.state = 'chase'; mh.lastSeen = Game.t; mh.lastSeenPos = { x: P.x, z: P.z }; later(() => voice('n6', mh.pos.x, mh.pos.z, { force: true }), 900); }
    }
    // girls' doors rattle and whisper when you pass (and he copies voices from behind them)
    if (Game.t > (F.rattleT || 0)) { const d = World.doors.filter(d => d.girls && Math.hypot(d.ex - P.x, d.ez - P.z) < 4)[0]; if (d) { F.rattleT = Game.t + rnd(10, 18); SFX.locked(); SFX.bang(d.ex, d.ez); if (Math.random() < 0.5) sample('sfx_whisp', d.ex, d.ez, { vol: 0.8 }); else voice(pick(['n5', 'n8']), d.ex, d.ez, { force: true, rate: 1.05 }); Game.shake(0.15); } }
  },
  respawn() { respawnFloor(() => { Player.pos.set(15.5 * CS, 0, 4.3 * CS); Player.yaw = Math.PI; Game.flags.turnT = 0; }); const mh = Game.monsters[0]; if (mh.state === 'lure') { mh.state = 'wander'; } mh.stretch = 1.38; mh.doc.stretch = 1.38; }
};
function giveKey() { const F = Game.flags; F.keys++; SFX.pick(); const id = 'k' + F.keys; Game.inv[id] = true; Game.held = id; Game.updateInv(); UI.msg(`لقيت <b>مفتاح ${ar(F.keys)}/٤</b> 🗝️`, 2400); UI.objective(F.keys < 4 ? `دوّر على المفاتيح (${ar(F.keys)}/٤)` : 'ركّب المفاتيح الأربعة في بوابة الدرج', F.keys < 4 ? (F.keys === 3 ? 'الرابع في مخزن الصيدلية الافتراضية' : 'خزائن المعاطف بالمختبرات') : 'آخر الممر · قدّام'); }
function keySlot2(i) {
  const F = Game.flags, m = F.slotMs[i];
  if (F.slots[i] === 0) { if (!/^k\d$/.test(Game.held)) { SFX.locked(); UI.msg('امسك مفتاح بيدك أول (من الشنطة)', 2000); return; } delete Game.inv[Game.held]; Game.updateInv(); F.slots[i] = 1; SFX.unlock(); m.material.emissive.set(0x333300); if (F.slots.every(s => s)) UI.objective('لف المفاتيح الأربعة خلال ٥ ثواني!', 'لف أول واحد… وبسرعة الباقي'); return; }
  if (F.slots[i] === 1) { if (!F.slots.every(s => s)) { UI.msg('ركّب الأربعة أول.', 1800); return; } F.slots[i] = 2; SFX.clank(m.position.x, m.position.z); m.material.emissive.set(0x00aa33); Game.noise(Player.pos.x, Player.pos.z, 12); if (!F.turnT) F.turnT = Game.t + 5; if (F.slots.every(s => s === 2)) { F.turnT = 0; F.gateOpen = 1; const S = F.shutter; S.target = 1; S.sign.visible = false; SFX.success(); SFX.elevatorMotor(4); UI.objective('اطلع الدرج للدور الثالث!', 'وهو جاي'); const mh = Game.monsters[0]; mh.state = 'chase'; mh.root.visible = true; mh.lastSeen = Game.t; mh.lastSeenPos = { x: Player.pos.x, z: Player.pos.z }; if (mh.pos.x < -50) mh.place(15.5 * CS, 20 * CS); mh.run = 5.15; voice('n2', mh.pos.x, mh.pos.z, { force: true }); } }
}
function labRoom(G, r) {
  const W = roomW(r); const bench = stdMat({ color: 0xd8dcdc, roughness: 0.4 }), cab = stdMat({ color: 0x1f3f5a, roughness: 0.5 });
  for (let i = 0; i < 2; i++) { const z = W.z0 + 2.6 + i * 3.6; prop(new THREE.BoxGeometry(W.x1 - W.x0 - 3, 0.9, 1.1), cab, W.cx, 0.45, z, 0, true); prop(new THREE.BoxGeometry(W.x1 - W.x0 - 2.9, 0.05, 1.2), bench, W.cx, 0.93, z, 0, false);
    for (let k = 0; k < 8; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, rnd(0.15, 0.3), 10), new THREE.MeshStandardMaterial({ color: pick([0x9fd8c8, 0xd8c89f, 0xc89fd8, 0xffffff]), transparent: true, opacity: 0.6, roughness: 0.05 })); b.position.set(W.x0 + 2 + k * 1.2, 1.05, z + rnd(-0.3, 0.3)); World.group.add(b); } }
  whiteboard(W.cx, W.z0 + 0.12, 0, 3.4, [{ t: r.name, y: 110, s: 60, c: '#1a3a7a' }, { t: 'Safety first · Goggles ON', y: 230, s: 46, c: '#b11', f: 'Arial' }]);
  const hood = prop(new THREE.BoxGeometry(1.6, 2.2, 0.8), stdMat({ color: 0xc8ccd0, metalness: 0.3 }), W.x1 - 1.1, 1.1, W.z0 + 0.5, 0, true);
}
function girlsRoomTease(G, r) { /* never entered: just light leaking under the door */ const W = roomW(r); const l = new THREE.PointLight(0xffd8e8, 0.35, 5); l.position.set(W.cx, 1.2, W.cz); World.group.add(l); }
function virtualPharmacy(G, r) {
  const W = roomW(r); const F = Game.flags; const COL = CAR_COLORS.slice(0, 6); F.bottleCode = []; let slot = 0;
  const marks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].sort(() => Math.random() - 0.5).slice(0, 4).sort((a, b) => a - b);
  for (let row = 0; row < 3; row++) for (let i = 0; i < 4; i++) {
    const x = W.x0 + 1.4 + i * 2.3, z = W.z0 + 1.6 + row * 3.0; shelfMesh(x, z, 0, 2.2, 2.0, 'med');
    const idx = slot++, c = pick(COL), marked = marks.includes(idx); if (marked) F.bottleCode.push(c.id);
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 14), new THREE.MeshStandardMaterial({ color: c.hex, roughness: 0.35, metalness: 0.1 })); jar.position.set(x, 1.42, z + 0.12); World.group.add(jar);
    poster(signTex({ w: 256, h: 160, bg: marked ? '#fff2f2' : '#f4f4f4', age: true, lines: [{ t: ar(idx + 1), y: 90, s: 80, c: '#111' }, marked ? { t: '✚', y: 150, s: 56, c: '#d21' } : { t: '', y: 0 }] }), x, 1.05, z + 0.24, 0, 0.36, 0.22);
  }
  poster(signTex({ w: 1024, h: 260, bg: '#0f5135', lines: [{ t: 'الصيدلية الافتراضية', y: 110, s: 80, c: '#fff' }, { t: 'Virtual Pharmacy Lab', y: 200, s: 50, c: '#bfe8d0', f: 'Arial' }] }), W.cx, 3.0, W.z1 - 0.12, Math.PI, 3.6, 0.9);
  // the counter
  prop(new THREE.BoxGeometry(4, 1.1, 0.7), stdMat({ color: 0xe8e4dc }), W.cx, 0.55, W.z1 - 2.0, 0, true);
}
function storeRoom(G, r) {
  const W = roomW(r); for (let i = 0; i < 3; i++) shelfMesh(W.x0 + 1.5 + i * 3, W.z1 - 0.5, Math.PI, 2.4, 2.4, 'med');
  const F = Game.flags, ds = F.storeDoors || []; const d = ds[0]; if (!d) return;
  const kx = d.ex + (d.horiz ? 0.9 : 0), kz = d.ez + (d.horiz ? -0.15 : 0.9);
  const kp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.06), new THREE.MeshStandardMaterial({ color: 0x222, emissive: 0x113311 })); kp.position.set(kx, 1.3, kz); World.group.add(kp);
  addInteract({ pos: { x: kx, y: 1.3, z: kz - 0.4 }, r: 1.6, cond: () => d.locked, label: 'لوحة أرقام المخزن', use: () => openKeypad({ title: 'مخزن الصيدلية', hint: 'ألوان العلب المعلّمة ✚ (٤)', len: 4, code: F.bottleCode, keys: CAR_COLORS.map(c => ({ id: c.id, color: c.color, name: c.name })), onOk: () => { d.locked = false; ds.forEach(x => x.locked = false); toggleDoor(d); UI.msg('انفتح المخزن', 1600); } }) });
  noteOnWall(G, Math.floor((r.x0 + r.x1) / 2), 16, 'n', NOTES.store);
  const kx2 = W.cx, kz2 = W.cz; const keyM = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16), stdMat({ color: 0xc8a040, metalness: 0.9, roughness: 0.3 })); pickupItem(keyM, kx2, 1.0, kz2, 'خذ المفتاح الرابع', () => giveKey());
  deskMesh(kx2, kz2, 0);
}

/* =====================================================================
   FLOOR 3 · الدور الثالث — د. أمل (offices · قاعة M)
   ===================================================================== */
LEVELS.L2 = {
  id: 'L2', order: 2, card: ['LEVEL 2', 'الدور الثالث', 'مكاتب الدكاترة · قاعة M'], surface: 'tile', vig: 1.2, sat: 0.85,
  build() {
    const G = collegeGrid(); World.grid = G;
    const names = [{ name: 'مكاتب أعضاء هيئة التدريس', kind: 'cubes', rect: [3, 3, 12, 7] }, { merge: true }, { name: 'مكتب د.', kind: 'office2' }, { name: 'مكتب د.', kind: 'office2' }, { name: 'قاعة M', kind: 'examM', rect: [3, 17, 12, 21] }, { merge: true },
      { name: 'مكتب وكيل الكلية', kind: 'vd' }, { name: 'شؤون الطلاب', kind: 'admin' }, { name: 'مكتب العميد', kind: 'dean' }, { name: 'السكرتارية', kind: 'admin' }, { name: 'قاعة الاجتماعات', kind: 'meet' }, { name: 'الأرشيف', kind: 'admin' }];
    planFloor(G, 3, names);
    for (let y = 6; y <= 18; y++) for (let x = 14; x <= 16; x++) { G.floor[y * G.W + x] = 0; G.void[y * G.W + x] = 1; }
    setupEnv({ fog: 0x08090c, fogD: 0.045, sky: 0x8a94a8, ground: 0x121014, amb: 0.2, exposure: 1.05, bloom: 0.6, bloomT: 0.75, hum: 0.2, drone: 0.55, tint: [1, 0.97, 1.02], grain: 0.045 });
    let mDoor = null;
    G.halls.forEach(r => {
      if (r.kind === 'examM') { const d = addDoor(G, 6, 17, 6, 16, { tex: TEX.redDoor, trim: 0x3a0a08, locked: true, lockedMsg: 'قاعة M مقفلة. الجهاز جنب الباب يبي كلمة سر.', width: 1.4 }); doorSign(d, 'قاعة M', 'قاعة الاختبارات', '#8a1a12'); mDoor = d; return; }
      if (r.kind === 'dean') { hallDoors(G, r, { locked: true, lockedMsg: 'مكتب العميد… مقفل.' }).forEach(d => doorSign(d, r.name, 'DEAN', '#1f2f4e')); return; }
      if (r.kind === 'cubes') { const d = addDoor(G, 7, 7, 7, 8, { tex: TEX.glassDoor, trim: 0x9aa0a6, width: 1.4 }); doorSign(d, r.name, 'FACULTY', '#0f5135'); return; }
      hallDoors(G, r).forEach(d => doorSign(d, r.name, r.kind === 'vd' ? 'VICE DEAN' : ''));
    });
    G.offices.forEach((r, i) => { const d = officeDoor(G, r, Math.random() < 0.25 ? { locked: true, lockedMsg: 'مقفل.' } : {}); doorSign(d, r.side === 'w' ? 'مكتب عضو هيئة تدريس' : 'مكتب إداري', (r.side === 'w' ? 'W' : 'E') + (i + 1)); });
    addDoor(G, 1, 1, 2, 1, { tex: TEX.metalDoor, locked: true, lockedMsg: 'مقفل.' });
    G.wc.forEach(r => { const d = addDoor(G, r.x0 === 3 ? 3 : 27, 1, r.x0 === 3 ? 2 : 28, 1, { tex: TEX.woodDoor }); doorSign(d, 'دورة مياه', 'WC', '#1f4f6e'); });
    addDoor(G, 25, 1, 24, 1, { tex: TEX.glassDoor, locked: true, lockedMsg: 'مقفل.' });
    buildShell(G, { void: 2 });
    const rail = new THREE.MeshStandardMaterial({ color: 0x9fc0c8, transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.3 }); const vx0 = 14 * CS, vx1 = 17 * CS, vz0 = 6 * CS, vz1 = 19 * CS;
    for (const [a, b, c, d] of [[vx0, vz0, vx1, vz0], [vx0, vz1, vx1, vz1], [vx0, vz0, vx0, vz1], [vx1, vz0, vx1, vz1]]) { const g = new THREE.Mesh(new THREE.BoxGeometry(c - a || 0.03, 1.05, d - b || 0.03), rail); g.position.set((a + c) / 2, 0.52, (b + d) / 2); World.group.add(g); addBoxCollider(Math.min(a, c) - 0.05, Math.min(b, d) - 0.05, Math.max(a, c) + 0.05, Math.max(b, d) + 0.05, -1, 8); }
    // rooms
    G.halls.forEach(r => { const W = roomW(r);
      if (r.kind === 'cubes') cubicles(G, r);
      else if (r.kind === 'examM') examHall(G, r);
      else if (r.kind === 'vd') { deskMesh(W.cx, W.cz, 0); deskMesh(W.cx + 1.7, W.cz, 0); chairMesh(W.cx, W.cz - 0.8, 0); shelfMesh(W.cx, W.z0 + 0.3, 0, 2.4, 3.2); sofa(W.x1 - 1.2, W.cz + 1.5, -Math.PI / 2, 0x3a2a20); poster(signTex({ w: 512, h: 160, bg: '#1f2f4e', lines: [{ t: 'وكيل الكلية', y: 95, s: 60, c: '#fff' }] }), W.cx, 2.6, W.z0 + 0.12, 0, 1.6, 0.5);
        const pz = W.cz, px = W.cx + 0.85; const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), new THREE.MeshStandardMaterial({ color: 0xe9e0c8, side: THREE.DoubleSide })); paper.rotation.x = -Math.PI / 2; paper.position.set(px, 0.79, pz); World.group.add(paper);
        addInteract({ pos: { x: px, y: 0.8, z: pz }, r: 1.6, label: 'اقرأ الورقة اللي على المكتب', use: () => openNote(Object.assign({}, NOTES.vd, { after: () => { Game.flags.gotPw = 1; UI.objective('افتح قاعة M', 'الجهاز جنب بابها · يسار ثم يمين'); } })) }); }
      else if (r.kind === 'meet') { prop(new THREE.BoxGeometry(5, 0.08, 1.6), stdMat({ color: 0x6a4a30, roughness: 0.4 }), W.cx, 0.76, W.cz, 0, false); for (let i = 0; i < 6; i++) { chairMesh(W.cx - 2 + i * 0.8, W.cz - 1.1, 0); chairMesh(W.cx - 2 + i * 0.8, W.cz + 1.1, Math.PI); } World.hides.push({ type: 'table', x: W.cx, z: W.cz, hw: 2.5, hd: 0.8 }); World.mcol.push({ x0: W.cx - 2.5, z0: W.cz - 0.8, x1: W.cx + 2.5, z1: W.cz + 0.8, y0: -1, y1: 3 }); }
      else if (r.kind !== 'dean') { for (let i = 0; i < 3; i++) deskMesh(W.x0 + 1.6 + i * 2.6, W.cz, 0); shelfMesh(W.cx, W.z1 - 0.3, Math.PI, 2.2, 3); }
    });
    G.offices.forEach(r => officeRoom(G, r)); G.wc.forEach(r => restroom(G, r));
    [[2, 9, 'w'], [2, 18, 'w'], [28, 10, 'e'], [13, 12, 'w'], [17, 12, 'e'], [24, 16, 's']].forEach(([cx, cy, sd]) => { const sd2 = wallSide(G, cx, cy, sd); if (!sd2) return; const p = onWall(G, cx, cy, sd2, 0); addLockerHide(p.x + Math.sin(p.ry) * 0.25, p.z + Math.cos(p.ry) * 0.25, p.ry); });
    collegeLights(G, 0.35, 23, { power: 3.0, color: 0xfff4e8 });
    mainStairs(G, { open: true, label: 'الدور الثالث' }).sign.visible = false; sideStairsBlocked(G);
    // the terminal at hall M
    const tx = 6.5 * CS + 1.0, tz = 16.95 * CS; const tm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.08), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x0a3a1a, emissiveIntensity: 1.5 })); tm.position.set(tx, 1.35, tz); World.group.add(tm);
    addInteract({ pos: { x: tx, y: 1.35, z: tz - 0.3 }, r: 1.8, cond: () => mDoor.locked, label: 'جهاز قاعة M', use: () => openTerminal({ banner: 'QU · PHARMACY · EXAM HALL M<br>&gt; أدخل كلمة السر:', answers: ['metformin', 'ميتفورمين', 'متفورمين', 'glucophage', 'جلوكوفاج'], okText: 'قاعة M انفتحت.', creepy: true, onOk: () => { mDoor.locked = false; toggleDoor(mDoor); finalRun(); } }) });
    // spawn
    Player.pos.set(15.5 * CS, 0, 4.3 * CS); Player.yaw = Math.PI;
    noteOnWall(G, 16, 3, 'e', NOTES.F3, () => { if (!Game.flags.o2) { Game.flags.o2 = 1; UI.objective('لقّ كلمة السر', 'مكتب وكيل الكلية · يمين'); } });
    graffiti(G, 13, 8, 'n', 'ثبّت النور عليها', { color: 'rgba(230,220,200,0.6)' }); graffiti(G, 3, 15, 'w', 'لا توقف', { color: 'rgba(170,20,10,0.85)' }); loreNote(G, 28, 13, 'e', 'l2a');
    placeItems(G, ['battery', 'battery', 'battery', 'vitc', 'vitc', 'bottle', 'redjuice'], { x: Player.pos.x, z: Player.pos.z });
    const am = new Monster('amal', { walk: 1.25, run: 4.9, sight: 9, sightDark: 9, doors: 'open', catchR: 1.0 }); Game.monsters.push(am); am.place(-99, -99); am.customUpdate = (dt, d) => amalUpdate(am, dt, d);
    Game.flags.cycle = Game.t + 14; Game.flags.dark = false; Game.flags.mDoor = mDoor; World.batches = staticBatch();
  },
  update(dt) { const F = Game.flags; if (!F.chase) lightCycle(dt); },
  respawn() { const F = Game.flags; respawnFloor(() => { if (F.chase) { Player.pos.set(6.5 * CS, 0, 15.6 * CS); Player.yaw = 0; } else { Player.pos.set(15.5 * CS, 0, 4.3 * CS); Player.yaw = Math.PI; } F.dark = false; World.blackout = false; World.blackoutChanged = true; F.cycle = Game.t + 9; }); const am = Game.monsters[0]; if (!F.chase) { am.state = 'off'; am.root.visible = false; } else { am.state = 'chase'; am.place(15.5 * CS, 20 * CS); am.lastSeen = Game.t; am.lastSeenPos = { x: Player.pos.x, z: Player.pos.z }; } }
};
function cubicles(G, r) { const W = roomW(r); const part = stdMat({ color: 0x8a96a0, roughness: 0.8 });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const x = W.x0 + 2.2 + i * 5.6, z = W.z0 + 2.6 + j * 5.4; if (x > W.x1 - 2) continue;
    for (const [a, b, w, d] of [[0, -1.5, 3.4, 0.08], [-1.7, 0, 0.08, 3], [1.7, 0, 0.08, 3]]) prop(new THREE.BoxGeometry(w, 1.45, d), part, x + a, 0.72, z + b, 0, true);
    deskMesh(x, z - 0.9, 0); chairMesh(x, z - 0.2, Math.PI); if (Math.random() < 0.5) { const mon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.03), new THREE.MeshStandardMaterial({ color: 0x050505, emissive: Math.random() < 0.3 ? 0x1a3a6a : 0x000000 })); mon.position.set(x, 1.0, z - 1.1); World.group.add(mon); } } }
function examHall(G, r) { const W = roomW(r); for (let i = 0; i < 6; i++) for (let j = 0; j < 9; j++) { const x = W.x0 + 1.6 + j * 2.6, z = W.z0 + 3 + i * 1.7; if (x > W.x1 - 1) continue; const d = prop(new THREE.BoxGeometry(0.7, 0.05, 0.5), stdMat({ color: 0xb79a6a }), x, 0.74, z, 0, false); chairMesh(x, z + 0.4, Math.PI); const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29), stdMat({ color: 0xf2f2ee })); paper.rotation.x = -Math.PI / 2; paper.position.set(x, 0.77, z); paper.userData.static = true; World.group.add(paper); }
  whiteboard(W.cx, W.z1 - 0.12, Math.PI, 5, [{ t: 'الاختبار النهائي', y: 120, s: 80, c: '#b11' }, { t: 'الوقت المتبقي: ٠٠:٠٠', y: 240, s: 60, c: '#222' }, { t: 'ممنوع الجوال', y: 340, s: 50, c: '#1a3a7a' }]); }
function finalRun() {
  const F = Game.flags; F.chase = true; World.blackout = false; World.blackoutChanged = true; if (F.dark) lightsBack(); F.dark = false; Game.level.unlimitedStamina = true;
  World.fixColor.set(0xff2a20); UI.objective('ادخل قاعة M! لا توقف', 'وصل لنص القاعة');
  const am = Game.monsters[0], G = World.grid; am.doc.horror = false; am.doc.faceM.emissiveIntensity = 0.6; am.place(15.5 * CS, 20.5 * CS, Math.PI); am.root.visible = true; am.state = 'chase'; am.lastSeen = Game.t; am.lastSeenPos = { x: Player.pos.x, z: Player.pos.z }; am.run = 4.8; am.sight = 40; am.lose = 99;
  am.customUpdate = () => { am.run = Player.moveAmt < 3.4 ? 5.4 : 4.8; return false; };
  later(() => { voice('a9', am.pos.x, am.pos.z, { force: true }); sample('sfx_scream_f', am.pos.x, am.pos.z, { vol: 1.3 }); }, 500);
  addTrigger({ x: 7.5 * CS, z: 19.5 * CS, w: 4, d: 2, fire: () => { Game.monsters[0].deactivate(); noclipTo('END'); } });
}
/* --- Amal: lights cycle, walks in the dark unless you hold the beam on her --- */
function lightCycle(dt) {
  const F = Game.flags;
  if (!F.dark && Game.t > F.cycle) { const r = Math.random(); if (r < 0.25 && !F.fakeFlick) { F.fakeFlick = 1; flick(3); F.cycle = Game.t + rnd(6, 9); return; } F.fakeFlick = 0; if (r < 0.75) flick(2); later(() => goDark(), r < 0.75 ? 650 : 50); F.cycle = Game.t + 99; }
}
function flick(n) { for (let i = 0; i < n; i++) { later(() => { World.blackout = true; World.blackoutChanged = true; SFX.lightsOff(); }, i * 220); later(() => { World.blackout = false; World.blackoutChanged = true; }, i * 220 + 110); } }
function goDark() {
  const F = Game.flags; if (Game.level.id !== 'L2') return; if (F.chase || Game.state !== 'play') { F.cycle = Game.t + 8; return; }
  F.dark = true; World.blackout = true; World.blackoutChanged = true; SFX.lightsOff(); setBed('drone', 0.8);
  const am = Game.monsters[0], G = World.grid, P = Player.pos; let best = null;
  for (const [lo, hi, needLos] of [[6, 12, 1], [3.5, 8, 1], [4, 12, 0]]) { for (let y = 0; y < G.H && !best; y++) for (let x = 0; x < G.W && !best; x++) { if (!G.floor[y * G.W + x] || Math.random() < 0.3) continue; const wx = G.cx(x), wz = G.cz(y), d = Math.hypot(wx - P.x, wz - P.z); if (d > lo && d < hi && (!needLos || losCheck(wx, wz, P.x, P.z)) && bfsPath(G, x, y, ...G.cell(P.x, P.z), true)) best = [wx, wz]; } if (best) break; }
  if (best) { am.place(best[0], best[1], Math.atan2(P.x - best[0], P.z - best[1])); am.root.visible = true; am.state = 'dark'; am.doc.horror = true; am.doc.faceM.emissiveIntensity = 3.2; later(() => voice(pick(['a2', 'a8', 'a7']), am.pos.x, am.pos.z, { force: true, vol: 0.9 }), 900); }
  const dur = rnd(7, 10); later(() => lightsBack(), dur * 1000);
}
function lightsBack() { const F = Game.flags; if (!F.dark) return; F.dark = false; World.blackout = false; World.blackoutChanged = true; SFX.lightsOn(); setBed('drone', 0.55); const am = Game.monsters[0]; if (am && am.state === 'dark') { am.root.visible = false; am.state = 'off'; } F.cycle = Game.t + rnd(10, 16); }
function amalUpdate(am, dt, d) {
  const F = Game.flags, P = Player.pos;
  if (am.state === 'dark') {
    const dx = P.x - am.pos.x, dz = P.z - am.pos.z, fx = -Math.sin(Player.yaw), fz = -Math.cos(Player.yaw);
    const toHer = Math.hypot(dx, dz) || 1, cos = (-dx * fx - dz * fz) / toHer;
    const lit = Player.light && Player.battery > 0.01 && !Player.hidden && toHer < 15 && cos > Math.cos(0.36) && losCheck(P.x, P.z, am.pos.x, am.pos.z);
    am.yaw = Math.atan2(dx, dz);
    if (Player.inHole) { am.speed = 0; return true; }
    if (lit) { am.speed = 0; F.litT = (F.litT || 0) + dt; am.doc.faceM.emissiveIntensity = 1.2 + Math.random() * 0.6; am.doc.P.head.rotation.z = Math.sin(Game.t * 40) * 0.08; if (F.litT > 0.4 && Game.t > (F.hissT || 0)) { F.hissT = Game.t + 1.6; SFX.hiss(am.pos.x, am.pos.z); } if (toHer < 6) { am.pos.x -= dx / toHer * dt * 0.5; am.pos.z -= dz / toHer * dt * 0.5; } }
    else { F.litT = 0; const v = (toHer < 5 ? 2.4 : 1.7) * dt; am.pos.x += dx / toHer * v; am.pos.z += dz / toHer * v; collide(am.pos, 0.3, 0.3, 1.8, World.mcol); am.speed = v / dt; am.doc.faceM.emissiveIntensity = 3.2; if (Game.t > (F.stepT || 0)) { F.stepT = Game.t + 0.5; SFX.mstep(am.pos.x, am.pos.z, false, false); } }
    if (d < 1.15 && !lit) { Game.die(am, 'لازم تثبت نور الكشاف عليها. إذا شلته… تقرب.'); return true; }
    Game.stress = Math.max(Game.stress, clamp(1 - d / 10, 0.35, 1));
    return true;
  }
  return false;
}
