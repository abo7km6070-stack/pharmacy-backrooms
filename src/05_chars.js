/* =====================================================================
   characters: the three doctors (3D, procedural) + their AI
   ===================================================================== */
function faceCanvas(type, horror) {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  g.clearRect(0, 0, S, S);
  const cx = S / 2;
  // layout on decal (u: 0..1 across ~160° of head, v: top..bottom)
  const eyeY = 228, eyeDX = 70, mouthY = 360;
  const skin = { mujahid: '#3b2418', minhaj: '#9b6a45', amal: '#e6c2a4' }[type];
  if (horror && type === 'amal') { // smiler: black face, glowing eyes, huge grin (drawn as emissive later)
    g.fillStyle = 'rgba(0,0,0,0.96)'; g.beginPath(); g.ellipse(cx, 280, 210, 250, 0, 0, TAU); g.fill();
    return c;
  }
  // brows
  g.strokeStyle = type === 'amal' ? '#2a1a14' : (type === 'mujahid' ? '#151010' : '#141010'); g.lineCap = 'round';
  g.lineWidth = type === 'amal' ? 9 : 13;
  const browTilt = horror ? 18 : 0;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * (eyeDX + 46), eyeY - 46 + (horror ? -6 : 0)); g.quadraticCurveTo(cx + s * (eyeDX + 5), eyeY - 66, cx + s * 22, eyeY - 44 + browTilt); g.stroke(); }
  // eyes
  for (const s of [-1, 1]) {
    const ex = cx + s * eyeDX;
    if (type === 'amal' && !horror) { // makeup: eyeshadow + liner + lashes
      g.fillStyle = 'rgba(120,60,80,0.45)'; g.beginPath(); g.ellipse(ex, eyeY - 12, 46, 24, 0, 0, TAU); g.fill();
    }
    g.fillStyle = horror ? '#000' : '#f4efe6'; g.beginPath(); g.ellipse(ex, eyeY, horror ? 34 : 30, horror ? 26 : 16, 0, 0, TAU); g.fill();
    if (!horror) {
      g.fillStyle = type === 'amal' ? '#3b2416' : '#24160f'; g.beginPath(); g.arc(ex + s * 2, eyeY + 1, 12, 0, TAU); g.fill();
      g.fillStyle = '#050303'; g.beginPath(); g.arc(ex + s * 2, eyeY + 1, 6, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + s * 2 - 4, eyeY - 4, 3, 0, TAU); g.fill();
      g.strokeStyle = type === 'amal' ? '#0a0606' : 'rgba(20,10,8,.8)'; g.lineWidth = type === 'amal' ? 6 : 3;
      g.beginPath(); g.ellipse(ex, eyeY, 31, 17, 0, Math.PI, TAU); g.stroke();
      if (type === 'amal') { g.beginPath(); g.moveTo(ex + s * 30, eyeY - 2); g.lineTo(ex + s * 46, eyeY - 12); g.stroke(); for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(ex + k * 8, eyeY - 16); g.lineTo(ex + k * 9, eyeY - 26); g.lineWidth = 3; g.stroke(); } }
    } else { g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, eyeY, 4, 0, TAU); g.fill(); }
  }
  // nose shading
  g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - 6, eyeY + 10); g.quadraticCurveTo(cx - 18, eyeY + 78, cx - 2, eyeY + 92); g.stroke();
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(cx - 16, eyeY + 92, 9, 5, 0, 0, TAU); g.ellipse(cx + 16, eyeY + 92, 9, 5, 0, 0, TAU); g.fill();
  // mustache/beard (Mujahid: light beard + stubble)
  if (type === 'mujahid') {
    g.fillStyle = 'rgba(15,10,8,0.55)';
    for (let i = 0; i < 2600; i++) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()); const x = cx + Math.cos(a) * 150 * r, y = 400 + Math.sin(a) * 110 * r; if (y < 318 && Math.abs(x - cx) < 70) continue; if (y < 300) continue; g.fillRect(x, y, 2.4, 2.4); }
    g.fillStyle = 'rgba(15,10,8,0.7)'; g.beginPath(); g.ellipse(cx, mouthY - 24, 52, 11, 0, 0, TAU); g.fill();
  }
  if (type === 'amal' && !horror) { g.fillStyle = 'rgba(220,110,110,0.28)'; g.beginPath(); g.ellipse(cx - 118, 318, 44, 26, 0, 0, TAU); g.ellipse(cx + 118, 318, 44, 26, 0, 0, TAU); g.fill(); }
  // mouth
  if (horror) {
    g.fillStyle = '#080303'; g.beginPath(); g.ellipse(cx, mouthY + 14, 48, 62, 0, 0, TAU); g.fill();
    g.fillStyle = '#d9d2c4'; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(cx + k * 13 - 6, mouthY - 40); g.lineTo(cx + k * 13, mouthY - 22); g.lineTo(cx + k * 13 + 6, mouthY - 40); g.fill(); }
  } else {
    g.fillStyle = type === 'amal' ? '#b8323f' : 'rgba(80,30,25,.9)';
    g.beginPath(); g.moveTo(cx - 44, mouthY); g.quadraticCurveTo(cx, mouthY - 16 + (type === 'amal' ? -4 : 0), cx + 44, mouthY); g.quadraticCurveTo(cx, mouthY + 24, cx - 44, mouthY); g.fill();
    g.strokeStyle = 'rgba(30,10,8,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 40, mouthY + 1); g.quadraticCurveTo(cx, mouthY + 9, cx + 40, mouthY + 1); g.stroke();
  }
  return c;
}
function smileGlowCanvas() { // emissive map for Amal-smiler: eyes + giant grin
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  g.fillStyle = '#fff'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(256 + s * 72, 226, 20, 14, s * 0.25, 0, TAU); g.fill(); }
  g.beginPath(); g.moveTo(86, 318); g.quadraticCurveTo(256, 500, 426, 318); g.quadraticCurveTo(256, 400, 86, 318); g.fill();
  g.fillStyle = '#000'; g.lineWidth = 5; g.strokeStyle = '#000'; for (let k = -9; k <= 9; k++) { g.beginPath(); g.moveTo(256 + k * 18, 340 + (1 - (k / 9) ** 2) * 60); g.lineTo(256 + k * 18, 360 + (1 - (k / 9) ** 2) * 38); g.stroke(); }
  return c;
}
function eyeGlowCanvas() { const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.fillStyle = '#fff'; for (const s of [-1, 1]) { g.beginPath(); g.arc(256 + s * 70, 228, 9, 0, TAU); g.fill(); } return c; }
function texFromCanvas(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; return t; }

const DOC_DEF = {
  mujahid: { name: 'د. مجاهد', height: 1.62, girth: 1.32, skin: 0x3b2418, pants: 0x2b2d33, shirt: 0x34465f, hair: 'horseshoe', coat: 0xeeeeea },
  minhaj: { name: 'د. منهاج', height: 1.98, girth: 0.72, skin: 0x9b6a45, pants: 0x3b3a36, shirt: 0xb9c3cf, hair: 'full', coat: 0xf0f0ec },
  amal: { name: 'د. أمل', height: 1.62, girth: 0.92, skin: 0xe6c2a4, pants: 0x111114, shirt: 0x111114, hair: 'hijab', coat: 0xf3f2ef, hijab: 0x26283a }
};
function makeDoctor(type) {
  const D = DOC_DEF[type], k = D.height / 1.75, gw = D.girth;
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.78 });
  const skinM = new THREE.MeshStandardMaterial({ color: D.skin, roughness: 0.55 });
  const coatM = new THREE.MeshStandardMaterial({ color: D.coat, roughness: 0.82, side: THREE.DoubleSide });
  const pantsM = M(D.pants), shirtM = M(D.shirt), shoeM = M(0x121212);
  const P = {};
  const hipY = 0.92 * k;
  // legs (or abaya skirt for Amal)
  if (type === 'amal') {
    const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.27, hipY + 0.02, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.9, side: THREE.DoubleSide })); sk.position.y = hipY / 2; body.add(sk); P.skirt = sk;
    P.legL = new THREE.Group(); P.legR = new THREE.Group();
  } else {
    for (const s of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(s * 0.1 * gw, hipY, 0); body.add(leg);
      const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.075 * Math.sqrt(gw), hipY * 0.42, 4, 10), pantsM); th.position.y = -hipY * 0.25; leg.add(th);
      const knee = new THREE.Group(); knee.position.y = -hipY * 0.5; leg.add(knee);
      const sh = new THREE.Mesh(new THREE.CapsuleGeometry(0.062 * Math.sqrt(gw), hipY * 0.4, 4, 10), pantsM); sh.position.y = -hipY * 0.24; knee.add(sh);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.26), shoeM); shoe.position.set(0, -hipY * 0.48, 0.05); knee.add(shoe);
      P[s < 0 ? 'legL' : 'legR'] = leg; P[s < 0 ? 'kneeL' : 'kneeR'] = knee;
    }
  }
  // torso
  const torsoH = 0.56 * k;
  const torso = new THREE.Group(); torso.position.y = hipY; body.add(torso); P.torso = torso;
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.15 * gw, torsoH * 0.6, 6, 16), shirtM); chest.position.y = torsoH * 0.52; chest.scale.set(1, 1, 0.72); torso.add(chest);
  if (type === 'mujahid') { const belly = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14), shirtM); belly.position.set(0, torsoH * 0.36, 0.05); belly.scale.set(1.0, 0.9, 0.78); torso.add(belly); }
  // lab coat: open cylinder with a front gap
  const coatL = torsoH + 0.44 * k;
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.155 * gw, 0.235 * gw, coatL, 28, 4, true, Math.PI * 0.09, Math.PI * 1.82), coatM);
  coat.scale.z = 0.8; coat.position.y = torsoH * 0.98 - coatL / 2; torso.add(coat);
  // lapels
  for (const s of [-1, 1]) { const lp = new THREE.Mesh(new THREE.PlaneGeometry(0.06 * gw, torsoH * 0.42), coatM); lp.position.set(s * 0.045 * gw, torsoH * 0.78, 0.125 * gw + 0.012); lp.rotation.set(-0.12, s * 0.35, s * 0.2); torso.add(lp); }
  // pocket + pen
  const pk = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.06), new THREE.MeshStandardMaterial({ color: 0xdedbd2, roughness: 0.9 })); pk.position.set(-0.085 * gw, torsoH * 0.7, 0.13 * gw + 0.004); torso.add(pk);
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6), new THREE.MeshStandardMaterial({ color: 0x1a3aa8, roughness: 0.4 })); pen.position.set(-0.07 * gw, torsoH * 0.73, 0.13 * gw + 0.01); torso.add(pen);
  if (type === 'minhaj') { const tie = new THREE.Mesh(new THREE.BoxGeometry(0.035, torsoH * 0.5, 0.01), new THREE.MeshStandardMaterial({ color: 0x6a1420, roughness: 0.6 })); tie.position.set(0, torsoH * 0.72, 0.11 * gw); tie.rotation.x = -0.12; torso.add(tie); }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.11 * gw, 0.03, 6, 18, Math.PI * 1.3), coatM); collar.rotation.x = Math.PI / 2; collar.rotation.z = Math.PI * 0.85; collar.position.y = torsoH * 1.02; torso.add(collar);
  // name badge
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.035), new THREE.MeshStandardMaterial({ color: 0x1f5f9a, roughness: 0.4 })); badge.position.set(0.085 * gw, torsoH * 0.74, 0.13 * gw + 0.006); torso.add(badge);
  // arms
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * (0.17 * gw + 0.035), torsoH * 0.9, 0); torso.add(sh);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.068 * Math.sqrt(gw), 12, 10), coatM); sh.add(shoulder);
    const ua = new THREE.Mesh(new THREE.CapsuleGeometry(0.06 * Math.sqrt(gw), 0.24 * k, 4, 12), coatM); ua.position.y = -0.15 * k; sh.add(ua);
    const el = new THREE.Group(); el.position.y = -0.3 * k; sh.add(el);
    const fa = new THREE.Mesh(new THREE.CapsuleGeometry(0.05 * Math.sqrt(gw), 0.22 * k, 4, 10), coatM); fa.position.y = -0.14 * k; el.add(fa);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.056 * Math.sqrt(gw), 0.056 * Math.sqrt(gw), 0.03, 12), new THREE.MeshStandardMaterial({ color: 0xd6d3ca, roughness: 0.9 })); cuff.position.y = -0.26 * k; el.add(cuff);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), skinM); hand.scale.set(0.85, 1.35, 0.55); hand.position.y = -0.32 * k; el.add(hand);
    const fing = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.06, 3, 6), skinM); fing.position.set(s * -0.03, -0.37 * k, 0.012); fing.rotation.z = s * 0.3; el.add(fing); P[s < 0 ? 'handL' : 'handR'] = hand;
    P[s < 0 ? 'armL' : 'armR'] = sh; P[s < 0 ? 'elL' : 'elR'] = el;
  }
  // neck + head
  const neck = new THREE.Group(); neck.position.y = torsoH * 1.02; torso.add(neck); P.neck = neck;
  const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 10), skinM); nk.position.y = 0.04; neck.add(nk);
  const head = new THREE.Group(); head.position.y = 0.16; neck.add(head); P.head = head;
  const hr = 0.122;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(hr, 28, 20), skinM); skull.scale.set(type === 'minhaj' ? 0.92 : 1, 1.16, 1.02); head.add(skull);
  // face decal
  const faceN = texFromCanvas(faceCanvas(type, false)), faceH = texFromCanvas(faceCanvas(type, true));
  const glow = texFromCanvas(type === 'amal' ? smileGlowCanvas() : eyeGlowCanvas(), false);
  const faceM = new THREE.MeshStandardMaterial({ map: faceN, transparent: true, roughness: 0.6, emissive: 0xffffff, emissiveMap: glow, emissiveIntensity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const faceG = new THREE.SphereGeometry(hr * 1.006, 24, 18, Math.PI / 2 - 1.35, 2.7, 0.62, 1.55);
  const face = new THREE.Mesh(faceG, faceM); face.scale.copy(skull.scale); head.add(face);
  // ears
  if (type !== 'amal') for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), skinM); ear.scale.set(0.5, 1, 0.8); ear.position.set(s * hr * 0.95, 0, -0.005); head.add(ear); }
  // nose (3D) + jaw
  const nose = new THREE.Mesh(new THREE.ConeGeometry(type === 'minhaj' ? 0.02 : 0.024, type === 'minhaj' ? 0.06 : 0.048, 8), skinM); nose.rotation.x = Math.PI / 2 + 0.35; nose.position.set(0, -0.01, hr * 1.02 + 0.012); nose.scale.set(1, 1, 0.8); head.add(nose);
  if (type === 'mujahid') { nose.scale.set(1.35, 1, 1); const bm = new THREE.MeshStandardMaterial({ color: 0x151110, roughness: 1 }); const beard = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.04, 24, 10, Math.PI / 2 - 1.2, 2.4, Math.PI * 0.62, Math.PI * 0.3), bm); beard.scale.set(1.02, 1.18, 1.06); head.add(beard); const cheeks = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.0, 18, 12), skinM); cheeks.scale.set(1.12, 0.7, 1.0); cheeks.position.y = -0.045; head.add(cheeks); }
  if (type === 'minhaj') { skull.scale.set(0.86, 1.25, 1.0); const gl = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.6 }); for (const s of [-1, 1]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 16), gl); rim.position.set(s * 0.042, 0.022, hr * 1.03); head.add(rim); } const br = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.004, 0.004), gl); br.position.set(0, 0.024, hr * 1.04); head.add(br); }
  if (type === 'amal') { const lips = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 6), new THREE.MeshStandardMaterial({ color: 0xa82838, roughness: 0.35 })); lips.scale.set(1.5, 0.5, 0.6); lips.position.set(0, -0.07, hr * 0.98); head.add(lips); P.lips = lips; }
  // hair
  if (D.hair === 'horseshoe') {
    const hm = new THREE.MeshStandardMaterial({ color: 0x0f0c0b, roughness: 1 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(hr * 0.98, 0.028, 8, 24, Math.PI * 1.35), hm); ring.rotation.x = Math.PI / 2; ring.rotation.z = Math.PI * 0.825; ring.position.y = -0.005; ring.scale.set(1, 1.04, 1.6); head.add(ring);
  } else if (D.hair === 'full') {
    const hm = new THREE.MeshStandardMaterial({ color: 0x0b0a0a, roughness: 0.9 });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.07, 24, 14, 0, TAU, 0, 1.25), hm); cap.scale.copy(skull.scale); cap.position.set(0, 0.012, -0.01); cap.rotation.x = -0.25; head.add(cap);
  } else if (D.hair === 'hijab') {
    const hjM = new THREE.MeshStandardMaterial({ color: D.hijab, roughness: 0.92, side: THREE.DoubleSide });
    const hj = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.2, 30, 22, Math.PI / 2 + 0.78, TAU - 1.56, 0, Math.PI * 0.86), hjM); hj.scale.set(1, 1.15, 1.05); head.add(hj);
    const top = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.2, 30, 10, Math.PI / 2 - 0.8, 1.6, 0, 0.62), hjM); top.scale.copy(hj.scale); head.add(top);
    const chin = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.2, 24, 10, Math.PI / 2 - 0.8, 1.6, Math.PI * 0.72, Math.PI * 0.2), hjM); chin.scale.copy(hj.scale); head.add(chin);
    const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.3, 0.32, 24, 1, true), hjM); drape.position.y = -0.19; head.add(drape);
  }
  root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });
  return { root, body, P, D, type, faceM, faceN, faceH, k, hipY, phase: 0, stretch: 1, set horror(v) { faceM.map = v ? faceH : faceN; faceM.emissive.set(type === 'amal' ? 0xfff2dc : 0xff2a10); head.scale.setScalar(v ? 1.2 : 1); faceM.needsUpdate = true; } };
}
function animDoctor(doc, dt, speed, mode) {
  // smoothed, per-character gait: everything eases toward its target so poses never snap
  const P = doc.P, T = doc.type, run = speed > 2.6;
  doc.spd = lerp(doc.spd || 0, speed, 1 - Math.exp(-8 * dt)); const sp = doc.spd, mv = clamp(sp / 0.8, 0, 1);
  const cad = T === 'minhaj' ? (run ? 7.2 : 3.9) : T === 'mujahid' ? (run ? 10.5 : 6.2) : (run ? 9 : 5);
  doc.phase += dt * cad * clamp(sp / 1.2 + 0.25, 0, 1.25) * (sp > 0.05 ? 1 : 0);
  const s = Math.sin(doc.phase), c = Math.cos(doc.phase), amp = (run ? 0.8 : 0.42) * (T === 'minhaj' ? 1.2 : T === 'mujahid' ? 0.8 : 1);
  const k = 1 - Math.exp(-14 * dt), E = (o, key, v) => { o[key] += (v - o[key]) * k; };
  const reach = mode === 'reach' ? 1 : 0; doc.reach = lerp(doc.reach || 0, reach, 1 - Math.exp(-5 * dt)); const rc = doc.reach;
  if (P.legL.rotation) { E(P.legL.rotation, 'x', s * amp * mv); E(P.legR.rotation, 'x', -s * amp * mv); }
  if (P.kneeL) { E(P.kneeL.rotation, 'x', Math.max(0, -c) * amp * 1.2 * mv); E(P.kneeR.rotation, 'x', Math.max(0, c) * amp * 1.2 * mv); }
  const swing = T === 'minhaj' ? 0.45 : 0.8, dangle = T === 'minhaj' ? 0.12 : 0;
  E(P.armL.rotation, 'x', lerp(-s * amp * swing * mv + dangle, -1.35, rc)); E(P.armR.rotation, 'x', lerp(s * amp * swing * mv + dangle, -1.45, rc));
  E(P.armL.rotation, 'z', lerp(T === 'mujahid' ? 0.22 : 0.07, 0.15, rc)); E(P.armR.rotation, 'z', lerp(T === 'mujahid' ? -0.22 : -0.07, -0.15, rc));
  E(P.elL.rotation, 'x', -0.2 - (run ? 0.7 : 0.15) * (1 - rc) - (T === 'minhaj' ? -0.1 : 0)); P.elR.rotation.x = P.elL.rotation.x;
  const breathe = Math.sin(Game.t * 1.6 + (doc.seed || (doc.seed = Math.random() * 6))) * 0.012;
  const hunch = T === 'minhaj' ? 0.2 : 0;
  E(P.torso.rotation, 'x', (run ? 0.24 : 0.05) + hunch + breathe); P.torso.position.y = doc.hipY + Math.abs(s) * (run ? 0.05 : 0.022) * mv + breathe * 0.5;
  // Mujahid waddles side to side, Amal glides, Minhaj bobs his long neck
  E(P.torso.rotation, 'z', T === 'mujahid' ? s * 0.07 * mv : T === 'amal' ? s * 0.02 * mv : s * 0.035 * mv);
  E(P.torso.rotation, 'y', -s * 0.09 * mv);
  if (P.skirt) E(P.skirt.rotation, 'z', s * 0.06 * mv);
  // head: idle look-around, then lock onto the player when close or chasing
  const dx = Player.pos.x - doc.root.position.x, dz = Player.pos.z - doc.root.position.z, dist = Math.hypot(dx, dz);
  let look = Math.sin(Game.t * 0.6 + doc.seed) * 0.5 * (1 - mv * 0.6);
  if (dist < 9 || mode === 'reach') { let a = Math.atan2(dx, dz) - doc.root.rotation.y; while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; look = clamp(a, -1.1, 1.1); }
  E(P.head.rotation, 'y', look); E(P.head.rotation, 'x', T === 'minhaj' ? -0.15 : 0);
  E(P.head.rotation, 'z', mode === 'tilt' ? Math.sin(Game.t * 1.3) * 0.35 + 0.3 : (T === 'minhaj' ? Math.sin(doc.phase * 2) * 0.04 * mv : 0));
  doc.root.scale.y = lerp(doc.root.scale.y, doc.stretch, dt * 3);
}

/* ---------------- monster AI ---------------- */
class Monster {
  constructor(type, opt) {
    this.type = type; this.doc = makeDoctor(type); this.root = this.doc.root; World.group.add(this.root);
    Object.assign(this, { walk: 1.3, run: 4.85, turn: 6, sight: 16, sightDark: 4.5, fov: 1.9, hear: 1, lose: 4.5, doors: 'bang', catchR: 0.95 }, opt);
    this.pos = new THREE.Vector3(); this.yaw = 0; this.state = 'off'; this.path = []; this.repath = 0; this.target = null; this.lastSeen = -99; this.lastSeenPos = null; this.stride = 0; this.speed = 0; this.voiceT = 0; this.searchT = 0; this.visible = false; this.root.visible = false; this.bang = null; this.mode = '';
    this.sawHide = false; this.spotT = -99;
  }
  place(x, z, yaw = 0) { this.pos.set(x, 0, z); this.yaw = yaw; this.root.position.copy(this.pos); this.root.rotation.y = yaw; }
  activate(state = 'wander') { this.state = state; this.root.visible = true; this.path = []; this.target = null; }
  deactivate() { this.state = 'off'; this.root.visible = false; Game.chase = 0; }
  canSee() {
    if ((Player.hidden && !Player.peek) || Player.inHole) return false;
    const P = Player.pos, dx = P.x - this.pos.x, dz = P.z - this.pos.z, d = Math.hypot(dx, dz);
    const lit = Player.inLight() || Player.light;
    let range = lit ? this.sight : this.sightDark; if (Player.crouch > 0.5 && !lit) range *= 0.7; if (Game.chase > 0.5) range *= 1.6;
    if (d > range) return false;
    if (d > 2.2) { const fwdX = Math.sin(this.yaw), fwdZ = Math.cos(this.yaw); const dot = (dx * fwdX + dz * fwdZ) / d; if (dot < Math.cos(this.fov / 2)) return false; }
    if (Player.hiddenUnderTable && d > 1.3 && !this.sawHide) return false;
    return losCheck(this.pos.x, this.pos.z, P.x, P.z);
  }
  goto(x, z) { this.target = { x, z }; this.repath = 0; }
  update(dt) {
    if (this.state === 'off') return;
    const P = Player.pos, G = World.grid;
    const d = Math.hypot(P.x - this.pos.x, P.z - this.pos.z);
    if (this.customUpdate && this.customUpdate(dt, d) === true) { this.finishMove(dt); return; }
    if (this.state === 'script') { this.followPath(dt, this.scriptSpeed || this.walk); this.finishMove(dt); return; }
    const sees = this.canSee();
    if (sees) { if (this.state !== 'chase') { this.onSpot(); } this.lastSeen = Game.t; this.lastSeenPos = { x: P.x, z: P.z }; }
    // player hid while being watched
    if (!Player.hidden && !Player.hiddenUnderTable) this.sawHide = false;
    if (this.state === 'chase') {
      if (sees || this.sawHide) { this.goto(P.x, P.z); }
      else if (Game.t - this.lastSeen > this.lose) { this.state = 'search'; this.searchT = Game.t + 9; this.goto(this.lastSeenPos.x, this.lastSeenPos.z); Game.onLost && Game.onLost(this); }
      else if (this.lastSeenPos) this.goto(this.lastSeenPos.x, this.lastSeenPos.z);
      if (Game.t > this.voiceT) { this.voiceT = Game.t + rnd(4.5, 7); this.taunt(true); }
    } else {
      for (const n of Game.noises) { const nd = Math.hypot(n.x - this.pos.x, n.z - this.pos.z); if (nd < n.r * this.hear) { this.state = 'investigate'; this.goto(n.x, n.z); break; } }
      if (this.state === 'investigate' && !this.path.length && this.repath > 0.2) { this.state = 'search'; this.searchT = Game.t + 6; }
      if (this.state === 'search') { if (Game.t > this.searchT) { this.state = 'wander'; this.combT = 0; } else if (!this.path.length && this.repath > 0.5) { const c = this.randomCellNear(this.lastSeenPos || this.pos, 3); if (c) this.goto(c[0], c[1]); } }
      if (this.state === 'wander' && !this.path.length) {
        if (this.pauseT === undefined) this.pauseT = Game.t + rnd(0.4, 1.4); // short look-around at each stop
        if (Game.t > this.pauseT) { this.pauseT = undefined; let c = null;
          if (Game.t > (this.combT || 0)) { this.combT = Game.t + rnd(14, 26); c = this.randomCellNear(Player.pos, 3); } // director: comb the area the student is in
          if (!c) c = this.wanderCell(); if (c) this.goto(c[0], c[1]); }
        else { this.yaw += Math.sin(Game.t * 2.2) * dt * 1.4; }
      }
      // never stay stuck: if no path can be found for a while, pick somewhere else
      if (!this.path.length && this.target) { this.noPath = (this.noPath || 0) + dt; if (this.noPath > 2.5) { this.noPath = 0; this.target = null; const c = this.wanderCell(); if (c) this.goto(c[0], c[1]); } } else this.noPath = 0;
    }
    // mumbling to himself: you can hear him coming before you see him
    if (this.state !== 'chase' && d < 18 && Game.t > (this.idleT || 0)) { this.idleT = Game.t + rnd(7, 12); const L = VOICE_LINES[this.type].idle; if (L) voice(pick(L), this.pos.x, this.pos.z, { vol: 0.9 }); }
    // catch
    if (d < this.catchR && !Player.inHole && ((!Player.hidden && !Player.hiddenUnderTable) || this.sawHide) && Game.state === 'play' && !Player.safe) { Game.die(this, this.sawHide ? 'شافك وأنت تتخبى. اكسر خط النظر أول (لف زاوية أو سكّر باب) وبعدين تخبى.' : undefined); return; }
    const spd = this.state === 'chase' ? this.run : this.state === 'investigate' ? this.walk * 1.7 : this.walk;
    if (this.state === 'chase' && sees && d < 3.2 && !this.bang) { this.path = [[P.x, P.z]]; this.repath = 0.25; }
    this.followPath(dt, spd);
    this.finishMove(dt);
    Game.chase = Math.max(Game.chase, this.state === 'chase' ? 1 : 0);
    if (d < 7 && Game.t > (this.breathT || 0)) { this.breathT = Game.t + (this.state === 'chase' ? 0.9 : 1.8); SFX.mbreath && SFX.mbreath(this.pos.x, this.pos.z, this.type, this.state === 'chase'); }
    Game.stress = Math.max(Game.stress, clamp(1 - d / 14, 0, 1) * (this.state === 'chase' ? 1 : 0.6));
  }
  onSpot() { this.state = 'chase'; this.spotT = Game.t; this.voiceT = Game.t + 0.4; if (Game.t - (this.lastScream || -99) > 20) { this.lastScream = Game.t; SFX.stinger(); } }
  taunt(chase) { const v = VOICE_LINES[this.type]; const lines = chase && v.chase ? v.chase : [v.taunt1, v.taunt2, v.quiz || v.lure].filter(Boolean); if (!voice(pick(lines), this.pos.x, this.pos.z) && Math.random() < 0.5) SFX.laughSynth(this.pos.x, this.pos.z, this.type === 'amal' ? 1.5 : this.type === 'minhaj' ? 0.85 : 0.75); }
  followPath(dt, spd) {
    const G = World.grid; this.repath += dt;
    if (this.target && (this.repath > (this.state === 'chase' ? 0.35 : 1.2) || !this.path.length)) {
      const [sx, sy] = G.cell(this.pos.x, this.pos.z), [tx, ty] = G.cell(this.target.x, this.target.z);
      const p = bfsPath(G, sx, sy, tx, ty, this.doors !== 'none'); this.repath = 0;
      if (p) { this.path = p; if (p.length) p[p.length - 1] = [this.target.x, this.target.z]; } else this.path = [];
      if (sx === tx && sy === ty) this.path = [[this.target.x, this.target.z]];
    }
    this.speed = 0;
    if (this.bang) { // banging on a closed door
      this.bang.t -= dt; if (this.bang.t2 === undefined || Game.t > this.bang.t2) { this.bang.t2 = Game.t + 0.75; SFX.bang(this.bang.door.ex, this.bang.door.ez); Game.shake(0.25); }
      if (this.bang.t <= 0) { const dd = this.bang.door; this.bang = null; if (dd.target < 0.5) { dd.target = 1; SFX.doorOpen(dd.ex, dd.ez); } }
      return;
    }
    if (!this.path.length) return;
    const [wx, wz] = this.path[0]; const dx = wx - this.pos.x, dz = wz - this.pos.z, dd = Math.hypot(dx, dz);
    // closed door on the way?
    const [cx, cy] = G.cell(this.pos.x, this.pos.z), [nx, ny] = G.cell(wx, wz);
    if ((cx !== nx || cy !== ny) && Math.abs(cx - nx) + Math.abs(cy - ny) === 1 && G.edge(cx, cy, nx, ny) === 2) {
      const door = G.doorAt.get(edgeKey(cx, cy, nx, ny));
      if (door && door.open < 0.6) {
        const dist = Math.hypot(door.ex - this.pos.x, door.ez - this.pos.z);
        if (dist < 1.3) {
          if (this.doors === 'open' || door.fake) { door.target = 1; SFX.doorOpen(door.ex, door.ez); }
          else if (this.doors === 'bang') { if (Game.t - door.closedT < 22 && this.state === 'chase') { this.bang = { door, t: 6.5 }; } else { door.target = 1; SFX.doorOpen(door.ex, door.ez); } return; }
          else { this.path = []; this.state = 'search'; this.searchT = Game.t + 5; return; }
        }
      }
    }
    if (dd < 0.15) { this.path.shift(); return; }
    const want = Math.atan2(dx, dz); let da = want - this.yaw; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
    this.yaw += clamp(da, -this.turn * dt, this.turn * dt);
    const turnSlow = 1 - Math.min(0.55, Math.abs(da) * 0.5); // corners slow them down (lets skilled players escape)
    const v = Math.min(dd, spd * turnSlow * dt); const ox = this.pos.x, oz = this.pos.z; const n = Math.max(1, Math.ceil(v / 0.08));
    for (let i = 0; i < n; i++) { this.pos.x += Math.sin(this.yaw) * v / n; this.pos.z += Math.cos(this.yaw) * v / n; collide(this.pos, this.radius || 0.3, 0.3, 1.8); }
    this.speed = Math.hypot(this.pos.x - ox, this.pos.z - oz) / dt; if (this.speed < spd * 0.15 && v > 0.01) { this.blocked = (this.blocked || 0) + dt; if (this.blocked > 1.2) { this.blocked = 0; this.repath = 99; this.path = []; } } else this.blocked = 0;
  }
  finishMove(dt) {
    this.root.position.set(this.pos.x, this.pos.y || 0, this.pos.z); this.root.rotation.y = this.yaw;
    animDoctor(this.doc, dt, this.speed, this.mode || (this.state === 'chase' ? 'reach' : ''));
    if (this.speed > 0.2) { this.stride += this.speed * dt; const sl = this.speed > 2.6 ? 1.45 : 0.75; if (this.stride > sl) { this.stride = 0; SFX.mstep(this.pos.x, this.pos.z, this.type === 'mujahid', this.speed > 2.6); } }
  }
  wanderCell() {
    const G = World.grid; const P = Player.pos; // director bias: drift toward player's region but not onto them
    for (let i = 0; i < 30; i++) { const x = (Math.random() * G.W) | 0, y = (Math.random() * G.H) | 0; if (!G.floor[y * G.W + x] || G.noMonster?.[y * G.W + x]) continue; const wx = G.cx(x), wz = G.cz(y); const dp = Math.hypot(wx - P.x, wz - P.z); if (dp < 6) continue; if (Math.random() < 0.6 && dp > 22) continue; return [wx, wz]; }
    return null;
  }
  randomCellNear(p, r) { const G = World.grid; const [x0, y0] = G.cell(p.x, p.z); for (let i = 0; i < 20; i++) { const x = x0 + ((Math.random() * (2 * r + 1)) | 0) - r, y = y0 + ((Math.random() * (2 * r + 1)) | 0) - r; if (G.inside(x, y) && G.floor[y * G.W + x]) return [G.cx(x), G.cz(y)]; } return null; }
}
