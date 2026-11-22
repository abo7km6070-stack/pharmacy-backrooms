/* =====================================================================
   world: edge-grid levels, geometry, collision, LOS, lights, props
   ===================================================================== */
const World = {};
function worldReset() {
  if (World.group) { R.scene.remove(World.group); disposeTree(World.group); }
  World.group = new THREE.Group(); R.scene.add(World.group);
  World.colliders = []; World.dyn = []; World.interact = []; World.hides = []; World.doors = []; World.fixtures = []; World.triggers = []; World.updaters = []; World.voids = []; World.beams = []; World.floorsY = []; World.surfaces = [];
  World.los = losCheck;
}
function disposeTree(o) { o.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) { (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => { if (m.map && m.map.userData && !m.map.userData.keep) { } m.dispose(); }); } }); }

/* ---------------- grid ---------------- */
function makeGrid(W, H, S, ox = 0, oz = 0) {
  const G = { W, H, S, ox, oz, h: new Uint8Array(W * (H + 1)), v: new Uint8Array((W + 1) * H), floor: new Uint8Array(W * H).fill(1), doorAt: new Map() };
  G.hi = (x, y) => y * W + x;          // edge above cell (x,y): between (x,y-1) & (x,y)
  G.vi = (x, y) => y * (W + 1) + x;    // edge left of cell (x,y): between (x-1,y) & (x,y)
  G.cx = x => ox + (x + 0.5) * S; G.cz = y => oz + (y + 0.5) * S;
  G.cell = (wx, wz) => [Math.floor((wx - ox) / S), Math.floor((wz - oz) / S)];
  G.inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  // edge between neighbouring cells; returns edge value
  G.edge = (x, y, nx, ny) => { if (nx === x + 1) return G.v[G.vi(x + 1, y)]; if (nx === x - 1) return G.v[G.vi(x, y)]; if (ny === y + 1) return G.h[G.hi(x, y + 1)]; if (ny === y - 1) return G.h[G.hi(x, y)]; return 1; };
  G.setEdge = (x, y, nx, ny, val) => { if (nx === x + 1) G.v[G.vi(x + 1, y)] = val; else if (nx === x - 1) G.v[G.vi(x, y)] = val; else if (ny === y + 1) G.h[G.hi(x, y + 1)] = val; else if (ny === y - 1) G.h[G.hi(x, y)] = val; };
  G.border = () => { for (let x = 0; x < W; x++) { G.h[G.hi(x, 0)] = 1; G.h[G.hi(x, H)] = 1; } for (let y = 0; y < H; y++) { G.v[G.vi(0, y)] = 1; G.v[G.vi(W, y)] = 1; } };
  // rect room: walls around a block of cells (x0..x1,y0..y1 inclusive), interior cleared
  G.room = (x0, y0, x1, y1) => {
    for (let x = x0; x <= x1; x++) { for (let y = y0 + 1; y <= y1; y++) G.h[G.hi(x, y)] = 0; G.h[G.hi(x, y0)] = 1; G.h[G.hi(x, y1 + 1)] = 1; }
    for (let y = y0; y <= y1; y++) { for (let x = x0 + 1; x <= x1; x++) G.v[G.vi(x, y)] = 0; G.v[G.vi(x0, y)] = 1; G.v[G.vi(x1 + 1, y)] = 1; }
  };
  G.open = (x0, y0, x1, y1) => { for (let x = x0; x <= x1; x++) for (let y = y0 + 1; y <= y1; y++) G.h[G.hi(x, y)] = 0; for (let y = y0; y <= y1; y++) for (let x = x0 + 1; x <= x1; x++) G.v[G.vi(x, y)] = 0; };
  return G;
}
/* random backrooms maze: sparse walls, pillars, guaranteed connectivity */
function backroomsMaze(G, rand, density = 0.42) {
  const { W, H } = G;
  for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) G.h[G.hi(x, y)] = rand() < density * (rand() < 0.5 ? 1 : 0.6) ? 1 : 0;
  for (let y = 0; y < H; y++) for (let x = 1; x < W; x++) G.v[G.vi(x, y)] = rand() < density * (rand() < 0.5 ? 1 : 0.6) ? 1 : 0;
  // long runs feel more liminal: extend some walls
  for (let i = 0; i < W * H * 0.08; i++) { const x = (rand() * W) | 0, y = 1 + ((rand() * (H - 1)) | 0), L = 2 + ((rand() * 4) | 0); for (let k = 0; k < L && x + k < W; k++) G.h[G.hi(x + k, y)] = 1; }
  for (let i = 0; i < W * H * 0.08; i++) { const x = 1 + ((rand() * (W - 1)) | 0), y = (rand() * H) | 0, L = 2 + ((rand() * 4) | 0); for (let k = 0; k < L && y + k < H; k++) G.v[G.vi(x, y + k)] = 1; }
  G.border();
}
function connectAll(G, rand) {
  const { W, H } = G; const comp = new Int32Array(W * H).fill(-1);
  const flood = (sx, sy, id) => { const q = [[sx, sy]]; comp[sy * W + sx] = id; while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!G.inside(nx, ny) || comp[ny * W + nx] >= 0 || !G.floor[ny * W + nx]) continue; if (G.edge(x, y, nx, ny) === 1) continue; comp[ny * W + nx] = id; q.push([nx, ny]); } } };
  let changed = true, guard = 0;
  while (changed && guard++ < 400) {
    comp.fill(-1); let id = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (comp[y * W + x] < 0 && G.floor[y * W + x]) flood(x, y, id++);
    if (id <= 1) break; changed = false;
    // knock down a random wall between different components
    const cand = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!G.floor[y * W + x]) continue; for (const [dx, dy] of [[1, 0], [0, 1]]) { const nx = x + dx, ny = y + dy; if (!G.inside(nx, ny) || !G.floor[ny * W + nx]) continue; if (comp[y * W + x] !== comp[ny * W + nx] && G.edge(x, y, nx, ny) === 1 && !G.locked?.(x, y, nx, ny)) cand.push([x, y, nx, ny]); } }
    if (cand.length) { const c = cand[(rand() * cand.length) | 0]; G.setEdge(c[0], c[1], c[2], c[3], 0); changed = true; }
  }
}
/* ---------------- geometry from grid ---------------- */
function boxGeo(w, h, d, x, y, z, uvScale = 1, uvY = 1) {
  const g = new THREE.BoxGeometry(w, h, d);
  // world-scaled UVs: u along the long horizontal axis, v up
  const pos = g.attributes.position, uv = g.attributes.uv, nrm = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i) + x, py = pos.getY(i) + y, pz = pos.getZ(i) + z, nx = Math.abs(nrm.getX(i)), ny = Math.abs(nrm.getY(i));
    let u, v; if (ny > 0.5) { u = px; v = pz; } else if (nx > 0.5) { u = pz; v = py; } else { u = px; v = py; }
    uv.setXY(i, u / uvScale, v / uvY);
  }
  g.translate(x, y, z); return g;
}
function addMerged(geos, mat, opts = {}) {
  if (!geos.length) return null;
  const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(geos, false); geos.forEach(g => g.dispose());
  const m = new THREE.Mesh(merged, mat); m.matrixAutoUpdate = false; m.updateMatrix(); World.group.add(m); return m;
}
function buildGridWalls(G, mat, wallH, T = 0.18, uvW = 2, opts = {}) {
  const geos = [], { W, H, S, ox, oz } = G;
  const col = (x0, z0, x1, z1) => World.colliders.push({ x0, z0, x1, z1, y0: -10, y1: wallH + 5 });
  // horizontal edges: merge runs
  for (let y = 0; y <= H; y++) { let x = 0; while (x < W) { if (G.h[G.hi(x, y)] !== 1) { x++; continue; } let e = x; while (e + 1 < W && G.h[G.hi(e + 1, y)] === 1) e++; const len = (e - x + 1) * S + T, cx = ox + (x + e + 1) / 2 * S, cz = oz + y * S; geos.push(boxGeo(len, wallH, T, cx, wallH / 2, cz, uvW, wallH)); col(cx - len / 2, cz - T / 2, cx + len / 2, cz + T / 2); x = e + 1; } }
  for (let x = 0; x <= W; x++) { let y = 0; while (y < H) { if (G.v[G.vi(x, y)] !== 1) { y++; continue; } let e = y; while (e + 1 < H && G.v[G.vi(x, e + 1)] === 1) e++; const len = (e - y + 1) * S + T, cz = oz + (y + e + 1) / 2 * S, cx = ox + x * S; geos.push(boxGeo(T, wallH, len, cx, wallH / 2, cz, uvW, wallH)); col(cx - T / 2, cz - len / 2, cx + T / 2, cz + len / 2); y = e + 1; } }
  return addMerged(geos, mat);
}
function buildGridFloor(G, floorMat, ceilMat, wallH, uv = 2, opts = {}) {
  // per-cell quads: long skinny triangles cause precision artifacts on some GPUs
  const fg = [], cg = [], { W, H, S, ox, oz } = G;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!G.floor[y * W + x]) continue; const cx = ox + (x + 0.5) * S, cz = oz + (y + 0.5) * S; fg.push(planeGeo(S, S, cx, 0, cz, uv, false)); if (ceilMat && !(opts.skipCeil && opts.skipCeil(x, y))) cg.push(planeGeo(S, S, cx, wallH, cz, opts.ceilUV || uv, true)); }
  addMerged(fg, floorMat); if (ceilMat) addMerged(cg, ceilMat);
}
function planeGeo(w, d, x, y, z, uv, down) {
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(down ? Math.PI / 2 : -Math.PI / 2);
  const pos = g.attributes.position, u = g.attributes.uv; for (let i = 0; i < pos.count; i++) u.setXY(i, (pos.getX(i) + x) / uv, (pos.getZ(i) + z) / uv);
  g.translate(x, y, z); return g;
}
/* ---------------- collision ---------------- */
function addBoxCollider(x0, z0, x1, z1, y0 = -10, y1 = 10, tag) { const c = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y0, y1, tag }; World.colliders.push(c); return c; }
function collide(pos, r, feetY, headY) {
  for (let pass = 0; pass < 2; pass++) {
    const list = World.colliders.concat(World.dyn);
    for (const c of list) {
      if (c.off) continue; if (headY < c.y0 || feetY > c.y1 - 0.05) continue;
      const qx = clamp(pos.x, c.x0, c.x1), qz = clamp(pos.z, c.z0, c.z1);
      let dx = pos.x - qx, dz = pos.z - qz; const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; pos.x += dx * k; pos.z += dz * k; }
        else { // inside box: push out along min axis
          const l = pos.x - c.x0, rr = c.x1 - pos.x, t = pos.z - c.z0, b = c.z1 - pos.z, m = Math.min(l, rr, t, b);
          if (m === l) pos.x = c.x0 - r; else if (m === rr) pos.x = c.x1 + r; else if (m === t) pos.z = c.z0 - r; else pos.z = c.z1 + r;
        }
      }
    }
  }
}
/* standing surfaces (tables/boxes you can climb onto, beams) */
function groundAt(x, z, footY) {
  let g = World.baseFloor !== undefined ? World.baseFloor : 0;
  for (const v of World.voids) if (x > v.x0 && x < v.x1 && z > v.z0 && z < v.z1) { g = v.y; break; }
  for (const b of World.beams) { // beam: segment from (ax,az) to (bx,bz) with half-width hw at height y
    const dx = b.bx - b.ax, dz = b.bz - b.az, L2 = dx * dx + dz * dz; let t = ((x - b.ax) * dx + (z - b.az) * dz) / L2; t = clamp(t, 0, 1);
    const px = b.ax + dx * t, pz = b.az + dz * t; if (Math.hypot(x - px, z - pz) < b.hw && footY > b.y - 0.35) g = Math.max(g, b.y);
  }
  for (const s of World.surfaces) if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && footY > s.y - 0.45) g = Math.max(g, s.y);
  return g;
}
/* ---------------- line of sight (grid edges + closed doors) ---------------- */
function losCheck(ax, az, bx, bz) {
  const G = World.grid; if (!G) return true;
  const dist = Math.hypot(bx - ax, bz - az); const steps = Math.ceil(dist / (G.S * 0.25)) + 1;
  let [cx, cy] = G.cell(ax, az); { const [tx, ty] = G.cell(bx, bz); if (!G.inside(cx, cy) || !G.inside(tx, ty)) return true; }
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, x = lerp(ax, bx, t), z = lerp(az, bz, t); const [nx, ny] = G.cell(x, z);
    if (nx !== cx || ny !== cy) {
      if (!G.inside(nx, ny)) return false;
      if (nx !== cx && ny !== cy) { // diagonal: require both paths blocked to count blocked
        const e1 = G.edge(cx, cy, nx, cy) || G.edge(nx, cy, nx, ny), e2 = G.edge(cx, cy, cx, ny) || G.edge(cx, ny, nx, ny);
        if (blocks(e1, G, cx, cy, nx, cy) && blocks(e2, G, cx, cy, cx, ny)) return false;
      } else if (blocks(G.edge(cx, cy, nx, ny), G, cx, cy, nx, ny)) return false;
      cx = nx; cy = ny;
    }
  }
  return true;
}
function blocks(e, G, x, y, nx, ny) { if (e === 1) return true; if (e === 2) { const d = G.doorAt.get(edgeKey(x, y, nx, ny)); return d ? d.open < 0.6 : false; } return false; }
function edgeKey(x, y, nx, ny) { if (nx < x || ny < y) return edgeKey(nx, ny, x, y); return x + ',' + y + ',' + nx + ',' + ny; }
/* BFS path on cell grid */
function bfsPath(G, sx, sy, tx, ty, canDoor) {
  const { W, H } = G; if (!G.inside(sx, sy) || !G.inside(tx, ty)) return null;
  const prev = new Int32Array(W * H).fill(-1), s = sy * W + sx, t = ty * W + tx; prev[s] = s; const q = [s]; let h = 0;
  while (h < q.length) { const c = q[h++]; if (c === t) break; const x = c % W, y = (c / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!G.inside(nx, ny)) continue; const j = ny * W + nx; if (prev[j] >= 0 || !G.floor[j] || G.noMonster?.[j]) continue; const e = G.edge(x, y, nx, ny); if (e === 1) continue; if (e === 2) { const d = G.doorAt.get(edgeKey(x, y, nx, ny)); if (d && (d.locked || (!canDoor && d.open < 0.6))) continue; } prev[j] = c; q.push(j); } }
  if (prev[t] < 0) return null; const path = []; let c = t; while (c !== s) { path.push(c); c = prev[c]; } path.reverse(); return path.map(c => [G.cx(c % W), G.cz((c / W) | 0)]);
}
/* ---------------- doors ---------------- */
function addDoor(G, x, y, nx, ny, opts = {}) {
  const S = G.S, wallH = opts.wallH || World.wallH, horiz = ny !== y; // door on horizontal edge (between rows)
  G.setEdge(x, y, nx, ny, 2);
  let ex, ez; if (horiz) { ex = G.ox + (x + 0.5) * S; ez = G.oz + Math.max(y, ny) * S; } else { ex = G.ox + Math.max(x, nx) * S; ez = G.oz + (y + 0.5) * S; }
  const dw = opts.width || 1.05, dh = opts.height || 2.15, T = 0.18;
  // frame walls around door within the edge
  const side = (S - dw) / 2, mat = opts.wallMat || World.wallMat;
  const geos = [];
  if (horiz) {
    geos.push(boxGeo(side, wallH, T, ex - S / 2 + side / 2, wallH / 2, ez, 2, wallH)); geos.push(boxGeo(side, wallH, T, ex + S / 2 - side / 2, wallH / 2, ez, 2, wallH));
    geos.push(boxGeo(dw, wallH - dh, T, ex, dh + (wallH - dh) / 2, ez, 2, wallH));
    addBoxCollider(ex - S / 2, ez - T / 2, ex - dw / 2, ez + T / 2); addBoxCollider(ex + dw / 2, ez - T / 2, ex + S / 2, ez + T / 2);
  } else {
    geos.push(boxGeo(T, wallH, side, ex, wallH / 2, ez - S / 2 + side / 2, 2, wallH)); geos.push(boxGeo(T, wallH, side, ex, wallH / 2, ez + S / 2 - side / 2, 2, wallH));
    geos.push(boxGeo(T, wallH - dh, dw, ex, dh + (wallH - dh) / 2, ez, 2, wallH));
    addBoxCollider(ex - T / 2, ez - S / 2, ex + T / 2, ez - dw / 2); addBoxCollider(ex - T / 2, ez + dw / 2, ex + T / 2, ez + S / 2);
  }
  addMerged(geos, mat);
  // frame trim
  const trim = new THREE.MeshStandardMaterial({ color: opts.trim || 0x5a4630, roughness: 0.7 });
  const tg = [];
  if (horiz) { tg.push(boxGeo(0.08, dh, T + 0.06, ex - dw / 2 - 0.04, dh / 2, ez)); tg.push(boxGeo(0.08, dh, T + 0.06, ex + dw / 2 + 0.04, dh / 2, ez)); tg.push(boxGeo(dw + 0.16, 0.08, T + 0.06, ex, dh + 0.04, ez)); }
  else { tg.push(boxGeo(T + 0.06, dh, 0.08, ex, dh / 2, ez - dw / 2 - 0.04)); tg.push(boxGeo(T + 0.06, dh, 0.08, ex, dh / 2, ez + dw / 2 + 0.04)); tg.push(boxGeo(T + 0.06, 0.08, dw + 0.16, ex, dh + 0.04, ez)); }
  addMerged(tg, trim);
  const pivot = new THREE.Group(); pivot.position.set(horiz ? ex - dw / 2 : ex, 0, horiz ? ez : ez - dw / 2);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(horiz ? dw : 0.06, dh, horiz ? 0.06 : dw), new THREE.MeshStandardMaterial({ map: opts.tex || TEX.door, roughness: 0.6, metalness: opts.metal ? 0.5 : 0, color: opts.tint || 0xffffff }));
  leaf.position.set(horiz ? dw / 2 : 0, dh / 2, horiz ? 0 : dw / 2); pivot.add(leaf); World.group.add(pivot);
  if (opts.window) { const win = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.45), new THREE.MeshStandardMaterial({ color: 0x223344, emissive: 0x0a141c, roughness: 0.1, metalness: 0.4 })); win.position.set(horiz ? dw * 0.5 : 0.035, dh * 0.72, horiz ? 0.035 : dw * 0.5); if (!horiz) win.rotation.y = Math.PI / 2; pivot.add(win); }
  const col = horiz ? { x0: ex - dw / 2, z0: ez - 0.06, x1: ex + dw / 2, z1: ez + 0.06, y0: -1, y1: dh } : { x0: ex - 0.06, z0: ez - dw / 2, x1: ex + 0.06, z1: ez + dw / 2, y0: -1, y1: dh };
  World.dyn.push(col);
  const door = { G, x, y, nx, ny, ex, ez, horiz, pivot, leaf, open: 0, target: 0, locked: !!opts.locked, key: opts.key, col, name: opts.name || 'الباب', swing: opts.swing || 1, onOpen: opts.onOpen, fake: opts.fake, banged: 0, closedT: 0 };
  G.doorAt.set(edgeKey(x, y, nx, ny), door); World.doors.push(door);
  World.interact.push({ door, get pos() { return { x: door.ex, y: 1.2, z: door.ez }; }, r: 1.9, label: () => door.locked ? (door.key && Game.inv[door.key] ? (Game.held === door.key ? 'افتح بالمفتاح' : 'امسك المفتاح وافتح') : 'مقفل') : (door.target > 0.5 ? 'سكّر الباب' : 'افتح الباب'), use: () => useDoor(door) });
  return door;
}
function useDoor(d) {
  if (d.locked) {
    if (d.key && Game.inv[d.key] && Game.held !== d.key) { SFX.locked(); const i = Game.slots().indexOf(d.key) + 1; UI.msg(`امسك <b>${INV_NAMES[d.key]}</b> بيدك أول (اضغط <b>${ar(i)}</b> أو افتح الشنطة)`, 3200); return; }
    if (d.key && Game.inv[d.key]) { d.locked = false; delete Game.inv[d.key]; Game.updateInv(); SFX.unlock(); UI.msg('انفتح القفل', 1600); setTimeout(() => toggleDoor(d), 300); if (d.onUnlock) d.onUnlock(); return; }
    SFX.locked(); Game.noise(d.ex, d.ez, 6); if (d.lockedMsg) UI.msg(d.lockedMsg, 3000); return;
  }
  toggleDoor(d);
}
function toggleDoor(d) { d.target = d.target > 0.5 ? 0 : 1; if (d.target) { SFX.doorOpen(d.ex, d.ez); if (d.onOpen) { const f = d.onOpen; d.onOpen = null; f(d); } } else { SFX.doorShut(d.ex, d.ez); d.closedT = Game.t; } Game.noise(d.ex, d.ez, 5); }
function updateDoors(dt) {
  for (const d of World.doors) {
    if (d.open !== d.target) { d.open += Math.sign(d.target - d.open) * dt * 2.4; if (Math.abs(d.open - d.target) < 0.02) d.open = d.target; }
    d.pivot.rotation.y = -d.open * 1.55 * d.swing;
    d.col.off = d.open > 0.75;
  }
}
/* ---------------- ceiling light fixtures + dynamic light pool ---------------- */
function buildFixtures(list, y, opts = {}) {
  // list: [{x,z,on,flick}] — emissive panels via InstancedMesh, real lights pooled
  const pw = opts.w || 1.2, pd = opts.d || 0.6;
  const geo = new THREE.BoxGeometry(pw, 0.05, pd);
  const mat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: opts.color || 0xfff3d0, emissiveIntensity: opts.intensity || 2.6, emissiveMap: TEX.panel, roughness: 1 });
  const offMat = new THREE.MeshStandardMaterial({ color: 0x55534a, roughness: 0.9, emissive: 0x000000 });
  const im = new THREE.InstancedMesh(geo, mat, list.length), imOff = new THREE.InstancedMesh(geo, offMat, list.length);
  const m4 = new THREE.Matrix4();
  list.forEach((f, i) => { f.i = i; f.y = y; f.level = 1; f.base = f.on === false ? 0 : 1; f.flick = f.flick || 0; m4.makeTranslation(f.x, y - 0.03, f.z); im.setMatrixAt(i, m4); imOff.setMatrixAt(i, m4); });
  im.instanceMatrix.needsUpdate = true; World.group.add(im); World.group.add(imOff);
  World.fixtures = list; World.fixMesh = im; World.fixOff = imOff; World.fixColor = new THREE.Color(opts.lightColor || 0xfff0c8); World.fixPower = (opts.power || 7) * 0.38; World.fixRange = opts.range || 9;
  World.zero = new THREE.Matrix4().makeScale(0, 0, 0);
  refreshFixtures();
}
function refreshFixtures() {
  const im = World.fixMesh, off = World.fixOff, m4 = new THREE.Matrix4();
  if (!im) return;
  World.fixtures.forEach(f => { const lit = f.base * f.level > 0.25 && !World.blackout; m4.makeTranslation(f.x, f.y - 0.03, f.z); im.setMatrixAt(f.i, lit ? m4 : World.zero); off.setMatrixAt(f.i, lit ? World.zero : m4); });
  im.instanceMatrix.needsUpdate = true; off.instanceMatrix.needsUpdate = true;
}
const LightPool = { lights: [], n: 0 };
function initLightPool(n) {
  LightPool.lights.forEach(l => R.scene.remove(l)); LightPool.lights = [];
  for (let i = 0; i < n; i++) { const l = new THREE.PointLight(0xffffff, 0, 10, 2); l.castShadow = false; R.scene.add(l); LightPool.lights.push(l); }
}
function updateLightPool(dt) {
  const fx = World.fixtures, P = Player.pos; let dirty = false;
  for (const f of fx) {
    let lv = 1;
    if (f.flick) { f.ft = (f.ft || 0) - dt; if (f.ft <= 0) { f.ft = Math.random() < 0.15 ? rnd(0.03, 0.12) : rnd(0.05, 1.6); f.fs = Math.random() < f.flick ? rnd(0, 0.35) : 1; } lv = f.fs; }
    if (f.dead) lv = 0;
    if (Math.abs(lv - f.level) > 0.3) dirty = true; f.level = lv;
    f.d2 = (f.x - P.x) ** 2 + (f.z - P.z) ** 2;
  }
  if (dirty || World.blackoutChanged) { refreshFixtures(); World.blackoutChanged = false; }
  const lit = fx.filter(f => f.base * f.level > 0.25 && !World.blackout).sort((a, b) => a.d2 - b.d2);
  LightPool.lights.forEach((l, i) => { const f = lit[i]; if (f && f.d2 < 900) { l.position.set(f.x, f.y - 0.25, f.z); l.color.copy(World.fixColor); l.intensity = World.fixPower * f.level * (World.lightMul ?? 1); l.distance = World.fixRange; } else l.intensity = 0; });
}
/* ---------------- props helpers ---------------- */
const MAT = {};
function stdMat(o) { return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.8, metalness: 0 }, o)); }
function prop(geo, mat, x, y, z, ry = 0, col = true, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; (parent || World.group).add(m); if (col) { geo.computeBoundingBox(); const b = geo.boundingBox; const hw = (b.max.x - b.min.x) / 2, hd = (b.max.z - b.min.z) / 2, c = Math.cos(ry), s = Math.sin(ry); const ex = Math.abs(c * hw) + Math.abs(s * hd), ez = Math.abs(s * hw) + Math.abs(c * hd); addBoxCollider(x - ex, z - ez, x + ex, z + ez, y + b.min.y, y + b.max.y); } return m; }
function poster(tex, x, y, z, ry, w = 0.9, h = 0.6) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 })); m.position.set(x, y, z); m.rotation.y = ry; World.group.add(m); return m; }
/* wall-mounted item facing a direction: place at cell edge */
function onWall(G, cx, cy, side, y, offset = 0) { // side: 'n','s','e','w' wall of cell
  const S = G.S, x = G.cx(cx), z = G.cz(cy), e = 0.1;
  if (side === 'n') return { x: x + offset, z: z - S / 2 + e, ry: 0 };
  if (side === 's') return { x: x - offset, z: z + S / 2 - e, ry: Math.PI };
  if (side === 'w') return { x: x - S / 2 + e, z: z - offset, ry: Math.PI / 2 };
  return { x: x + S / 2 - e, z: z + offset, ry: -Math.PI / 2 };
}
function addInteract(o) { World.interact.push(o); return o; }
function addTrigger(o) { World.triggers.push(o); return o; }
