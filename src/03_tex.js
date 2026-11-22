/* =====================================================================
   procedural textures (canvas) — walls, floors, ceilings, signs
   ===================================================================== */
const TEX = {};
function hash2(x, y, s) { let n = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967295; }
function vnoise(x, y, P, s) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const m = a => ((a % P) + P) % P; const a = hash2(m(xi), m(yi), s), b = hash2(m(xi + 1), m(yi), s), c = hash2(m(xi), m(yi + 1), s), d = hash2(m(xi + 1), m(yi + 1), s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, P, s, oct = 5) { let t = 0, amp = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { t += vnoise(x * f, y * f, P * f, s + i) * amp; n += amp; amp *= 0.5; f *= 2; } return t / n; }
function canvasTex(w, h, painter, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  painter(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, R.renderer.capabilities.getMaxAnisotropy());
  if (opts.srgb !== false) t.encoding = THREE.sRGBEncoding;
  t.userData.canvas = c;
  return t;
}
/* per-pixel field painter */
function field(g, w, h, fn) { const img = g.getImageData(0, 0, w, h), d = img.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; const c = fn(x / w, y / h, x, y, d[i], d[i + 1], d[i + 2]); d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c.length > 3 ? c[3] : 255; } g.putImageData(img, 0, 0); }
function bumpFrom(tex) { const src = tex.userData.canvas; const b = new THREE.CanvasTexture(src); b.wrapS = b.wrapT = THREE.RepeatWrapping; return b; }

function buildTextures() {
  const N = isTouch ? 256 : 512;
  /* --- LEVEL 0: mono-yellow wallpaper (repeats per 2m width, full height) --- */
  TEX.wallpaper = canvasTex(N, N, (g, w, h) => {
    field(g, w, h, (u, v) => {
      const n = fbm(u * 8, v * 8, 8, 11, 4), big = fbm(u * 2, v * 2, 2, 7, 3);
      let r = 196, gg = 176, b = 92;
      const stripe = Math.abs(((u * 16) % 1) - 0.5) < 0.04 ? 0.93 : 1;
      const dU = (u * 8) % 1, dV = (v * 8) % 1, dia = Math.abs(dU - 0.5) + Math.abs(dV - 0.5) < 0.12 ? 0.9 : 1;
      let k = (0.86 + n * 0.22) * stripe * dia * (0.92 + big * 0.12);
      const stain = fbm(u * 3 + 9, v * 5, 3, 31, 4); if (stain > 0.62) k *= 1 - (stain - 0.62) * 1.4;
      if (v > 0.9) k *= lerp(1, 0.72, (v - 0.9) / 0.1); if (v < 0.04) k *= lerp(0.8, 1, v / 0.04);
      const dirt = Math.max(0, fbm(u * 20, v * 3, 20, 5, 3) - 0.55) * 0.5; k -= dirt * (v > 0.7 ? 1 : 0.3);
      return [r * k, gg * k, b * k * 0.98];
    });
  });
  TEX.carpet = canvasTex(N, N, (g, w, h) => {
    field(g, w, h, (u, v, x, y) => {
      const n = fbm(u * 16, v * 16, 16, 3, 4), fib = hash2(x, y, 9), damp = fbm(u * 2 + 3, v * 2, 2, 51, 4);
      let k = 0.8 + n * 0.3 + (fib - 0.5) * 0.16; if (damp > 0.58) k *= 1 - (damp - 0.58) * 1.6;
      return [146 * k, 125 * k, 78 * k];
    });
  });
  TEX.ceiling = canvasTex(N, N, (g, w, h) => {
    field(g, w, h, (u, v, x, y) => {
      const n = fbm(u * 10, v * 10, 10, 13, 3), pore = hash2(x, y, 4) > 0.93 ? 0.88 : 1;
      let k = (0.86 + n * 0.14) * pore; const gu = (u * 2) % 1, gv = (v * 2) % 1;
      if (gu < 0.025 || gv < 0.025) k *= 0.62;
      const st = fbm(u * 3, v * 3 + 4, 3, 61, 4); if (st > 0.66) k *= 1 - (st - 0.66) * 1.8;
      return [222 * k, 214 * k, 182 * k];
    });
  });
  TEX.panel = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#fffdf2'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(160,160,140,.55)'; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); }
    g.strokeStyle = '#8c8a7c'; g.lineWidth = 8; g.strokeRect(0, 0, w, h);
  });
  /* --- LEVEL 1: concrete garage --- */
  TEX.concrete = canvasTex(N, N, (g, w, h) => {
    field(g, w, h, (u, v, x, y) => {
      const n = fbm(u * 6, v * 6, 6, 21, 5), sp = hash2(x, y, 8);
      let k = 0.78 + n * 0.3 + (sp > 0.985 ? -0.25 : 0) + (sp - 0.5) * 0.05;
      const streak = fbm(u * 24, v * 1.5, 24, 77, 3); if (streak > 0.6) k *= 1 - (streak - 0.6) * 0.9 * v;
      if (Math.abs(v - 0.5) < 0.004 || Math.abs(u - 0.5) < 0.003) k *= 0.75;
      for (const [cx, cy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) if (Math.hypot(u - cx, v - cy) < 0.012) k *= 0.45;
      return [128 * k, 128 * k, 124 * k];
    });
  });
  TEX.concreteFloor = canvasTex(N, N, (g, w, h) => {
    field(g, w, h, (u, v, x, y) => {
      const n = fbm(u * 8, v * 8, 8, 41, 5), oil = fbm(u * 2 + 7, v * 2, 2, 91, 4);
      let k = 0.7 + n * 0.28 + (hash2(x, y, 2) - 0.5) * 0.06; if (oil > 0.6) k *= 1 - (oil - 0.6) * 1.8;
      return [102 * k, 103 * k, 100 * k];
    });
  });
  /* --- LEVEL 2: pipe tunnels --- */
  TEX.tunnel = canvasTex(N, N, (g, w, h) => {
    field(g, w, h, (u, v, x, y) => {
      const bw = 1 / 4, bh = 1 / 8, row = Math.floor(v / bh), off = (row % 2) * bw / 2;
      const bu = ((u + off) % bw) / bw, bv = (v % bh) / bh, mortar = bu < 0.04 || bv < 0.08;
      const n = fbm(u * 12, v * 12, 12, 17, 4), brick = hash2(Math.floor((u + off) / bw), row, 3);
      let r = 92 + brick * 18, gg = 72 + brick * 10, b = 62; let k = mortar ? 0.55 : (0.75 + n * 0.35);
      const rust = fbm(u * 5, v * 7, 5, 81, 4); if (rust > 0.6) { r += 40; gg += 6; }
      if (v > 0.8) k *= lerp(1, 0.55, (v - 0.8) / 0.2);
      return [r * k, gg * k, b * k];
    });
  });
  TEX.grate = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#1a1a1c'; g.fillRect(0, 0, w, h);
    field(g, w, h, (u, v) => { const a = ((u * 16) % 1), b = ((v * 16) % 1); const bar = a < 0.22 || b < 0.22; const n = fbm(u * 8, v * 8, 8, 5, 3); const k = bar ? 0.75 + n * 0.4 : 0.12; return [92 * k, 90 * k, 86 * k]; });
  });
  TEX.metal = canvasTex(256, 256, (g, w, h) => { field(g, w, h, (u, v, x, y) => { const n = fbm(u * 4, v * 30, 4, 9, 4); const k = 0.6 + n * 0.5; const rust = fbm(u * 6, v * 6, 6, 44, 4) > 0.64; return rust ? [120 * k, 70 * k, 40 * k] : [118 * k, 120 * k, 122 * k]; }); });
  TEX.door = canvasTex(256, 512, (g, w, h) => {
    field(g, w, h, (u, v, x, y) => { const n = fbm(u * 3, v * 22, 3, 71, 4); const k = 0.75 + n * 0.35; return [150 * k, 112 * k, 70 * k]; });
    g.strokeStyle = 'rgba(40,25,10,.5)'; g.lineWidth = 6; g.strokeRect(28, 40, w - 56, h * 0.38); g.strokeRect(28, h * 0.5, w - 56, h * 0.42);
    g.fillStyle = '#c9b27a'; g.fillRect(w - 52, h * 0.47, 26, 12);
  });
  TEX.redDoor = canvasTex(256, 512, (g, w, h) => {
    field(g, w, h, (u, v) => { const n = fbm(u * 3, v * 12, 3, 72, 4); const k = 0.7 + n * 0.35; return [150 * k, 26 * k, 22 * k]; });
    g.fillStyle = '#d8d3c4'; g.fillRect(w * 0.3, h * 0.12, w * 0.4, h * 0.1); g.fillStyle = '#3a0a08'; g.font = 'bold 34px Tajawal, sans-serif'; g.textAlign = 'center'; g.fillText('قاعة الاختبار', w / 2, h * 0.19);
    g.fillStyle = '#c9b27a'; g.fillRect(w - 50, h * 0.48, 24, 14);
  });
  TEX.metalDoor = canvasTex(256, 512, (g, w, h) => {
    field(g, w, h, (u, v) => { const n = fbm(u * 2, v * 8, 2, 33, 4); const k = 0.7 + n * 0.3; return [96 * k, 104 * k, 108 * k]; });
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 4; g.strokeRect(20, 20, w - 40, h - 40); g.fillStyle = '#ddd'; g.fillRect(w - 46, h * 0.5, 20, 8);
  });
}
/* text signage / posters */
function signTex(opts) {
  const w = opts.w || 512, h = opts.h || 256;
  return canvasTex(w, h, (g) => {
    g.fillStyle = opts.bg || '#f3efe2'; g.fillRect(0, 0, w, h);
    if (opts.border) { g.strokeStyle = opts.border; g.lineWidth = opts.bw || 10; g.strokeRect(opts.bw / 2 || 5, opts.bw / 2 || 5, w - (opts.bw || 10), h - (opts.bw || 10)); }
    g.textAlign = 'center'; g.direction = 'rtl';
    (opts.lines || []).forEach(L => { g.fillStyle = L.c || '#222'; g.font = `${L.wt || 700} ${L.s || 40}px ${L.f || 'Tajawal, sans-serif'}`; g.fillText(L.t, w / 2, L.y); });
    if (opts.extra) opts.extra(g, w, h);
    if (opts.age !== false) { const img = g.getImageData(0, 0, w, h), d = img.data; for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) { const n = fbm(x / w * 4, y / h * 4, 4, 99, 3); const k = 0.88 + n * 0.14; for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const i = ((y + dy) * w + x + dx) * 4; d[i] *= k; d[i + 1] *= k; d[i + 2] *= k * 0.96; } } g.putImageData(img, 0, 0); }
  });
}
function imgTex(dataUrl, cb) { const t = new THREE.Texture(); const im = new Image(); im.onload = () => { t.image = im; t.needsUpdate = true; cb && cb(t); }; im.src = dataUrl; t.encoding = THREE.sRGBEncoding; return t; }
/* ---------------- real-college materials (Qassim pharmacy building style) ---------------- */
function buildCollegeTextures() {
  const N = isTouch ? 512 : 1024;
  // polished white porcelain tiles, 60cm, faint veins + grout
  TEX.tile = canvasTex(N, N, (g, w, h) => {
    field(g, w, h, (u, v, x, y) => {
      const t = 4, gu = (u * t) % 1, gv = (v * t) % 1, cell = Math.floor(u * t) + Math.floor(v * t) * 7;
      const vein = Math.abs(fbm(u * 5 + cell, v * 5, 5, 17 + cell, 4) - 0.5) < 0.012 ? 0.9 : 1;
      let k = (0.94 + hash2(Math.floor(u * t), Math.floor(v * t), 3) * 0.05 + fbm(u * 9, v * 9, 9, 7, 3) * 0.04) * vein;
      if (gu < 0.006 || gv < 0.006 || gu > 0.994 || gv > 0.994) k = 0.62;
      const dirt = Math.max(0, fbm(u * 3, v * 3, 3, 91, 4) - 0.6) * 0.5; k -= dirt;
      return [236 * k, 233 * k, 226 * k];
    });
  });
  // brown marble used for the central strip of the main corridor
  TEX.marble = canvasTex(512, 512, (g, w, h) => {
    field(g, w, h, (u, v) => { const n = fbm(u * 4, v * 4, 4, 23, 5), vein = Math.abs(Math.sin((u + n * 1.6) * 18)) < 0.06 ? 1.25 : 1; const k = (0.55 + n * 0.5) * vein; return [120 * k, 84 * k, 62 * k]; });
    g.strokeStyle = 'rgba(30,20,10,.5)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h);
  });
  // painted plaster wall, off-white, with a beige stone skirting band at the bottom
  TEX.plaster = canvasTex(N, N, (g, w, h) => {
    field(g, w, h, (u, v, x, y) => {
      const n = fbm(u * 14, v * 14, 14, 41, 4), big = fbm(u * 2, v * 2, 2, 42, 3);
      let r = 232, gg = 228, b = 216, k = 0.93 + n * 0.06 + big * 0.03;
      if (v > 0.88) { r = 196; gg = 174; b = 138; k = 0.85 + fbm(u * 8, v * 30, 8, 5, 3) * 0.2; if (v < 0.885) k *= 0.6; }
      const grime = Math.max(0, fbm(u * 6, v * 2 + 3, 6, 77, 4) - 0.58) * (v > 0.6 ? 0.9 : 0.35); k -= grime;
      const scuff = v > 0.75 && v < 0.88 && hash2(Math.floor(u * 90), Math.floor(v * 40), 9) > 0.985 ? 0.8 : 1;
      return [r * k * scuff, gg * k * scuff, b * k * scuff];
    });
  });
  // 60x60 white ceiling grid
  TEX.ceilGrid = canvasTex(512, 512, (g, w, h) => {
    field(g, w, h, (u, v, x, y) => { const gu = (u * 4) % 1, gv = (v * 4) % 1; let k = 0.9 + fbm(u * 12, v * 12, 12, 8, 3) * 0.08 + (hash2(x, y, 2) > 0.95 ? -0.06 : 0); if (gu < 0.02 || gv < 0.02) k = 0.7; const st = fbm(u * 2, v * 2, 2, 19, 4); if (st > 0.67) k *= 1 - (st - 0.67) * 1.4; return [238 * k, 236 * k, 230 * k]; });
  });
  // wooden lecture-hall door with steel kick plate + number plate area
  TEX.woodDoor = canvasTex(256, 512, (g, w, h) => {
    field(g, w, h, (u, v) => { const n = fbm(u * 2, v * 26, 2, 81, 4); const k = 0.72 + n * 0.32; return [168 * k, 120 * k, 78 * k]; });
    g.fillStyle = 'rgba(200,200,205,.9)'; g.fillRect(10, h - 60, w - 20, 46);
    g.fillStyle = '#b9bcc0'; g.fillRect(w - 46, h * 0.48, 30, 10); g.fillStyle = 'rgba(20,30,40,.85)'; g.fillRect(w * 0.3, h * 0.18, w * 0.4, h * 0.22);
  });
  TEX.bookSpines = canvasTex(512, 128, (g, w, h) => { let x = 0; const cols = ['#7a2424', '#24427a', '#24603a', '#a07a30', '#4a305a', '#8a8a8a', '#3a3a3a', '#b05a20']; while (x < w) { const bw = 7 + Math.random() * 16, bh = h * (0.72 + Math.random() * 0.28); g.fillStyle = cols[(Math.random() * cols.length) | 0]; g.fillRect(x, h - bh, bw - 1, bh); g.fillStyle = 'rgba(255,230,160,.5)'; g.fillRect(x + 2, h - bh + 10, bw - 5, 3); g.fillRect(x + 2, h - 18, bw - 5, 2); x += bw; } });
  TEX.medBoxes = canvasTex(512, 128, (g, w, h) => { let x = 0; const cols = ['#ffffff', '#e8f1fa', '#fff6e8', '#f2fff2']; const stripe = ['#1e5bc6', '#c62828', '#2e8b3e', '#e08a1a', '#7a3aa0', '#0f8a8a']; while (x < w) { const bw = 22 + Math.random() * 30, bh = h * (0.45 + Math.random() * 0.5); g.fillStyle = cols[(Math.random() * cols.length) | 0]; g.fillRect(x, h - bh, bw - 2, bh); g.fillStyle = stripe[(Math.random() * stripe.length) | 0]; g.fillRect(x, h - bh + bh * 0.25, bw - 2, bh * 0.18); g.fillStyle = '#333'; g.font = 'bold 9px Arial'; g.fillText(['mg', 'Tab', '500', 'Caps', '20mg'][(Math.random() * 5) | 0], x + 3, h - 8); x += bw; } });
  TEX.glassDoor = canvasTex(256, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, '#1a2a30'); grd.addColorStop(1, '#0b1418'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#9aa0a6'; g.lineWidth = 18; g.strokeRect(9, 9, w - 18, h - 18); g.fillStyle = '#c8ccd0'; g.fillRect(w - 40, h * 0.42, 12, h * 0.16);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(30, 30); g.lineTo(90, 30); g.lineTo(30, 200); g.fill();
  });
}
