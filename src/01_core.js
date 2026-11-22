'use strict';
/* =====================================================================
   كلية الصيدلة: الباك رومز — core: utils, renderer, post-fx, input, UI
   ===================================================================== */
if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false; // hex colours are sRGB
const TAU = Math.PI * 2;
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[(Math.random() * arr.length) | 0];
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k, d) { try { const v = localStorage.getItem('pbr_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('pbr_' + k, JSON.stringify(v)); } catch (e) { } }
};

/* ---------------- renderer + post ---------------- */
const R = {};
const PostShader = {
  uniforms: {
    tDiffuse: { value: null }, time: { value: 0 }, exposure: { value: 1 },
    grain: { value: 0.07 }, vig: { value: 1.0 }, ca: { value: 1.0 }, sat: { value: 1.0 },
    tint: { value: new THREE.Vector3(1, 1, 1) }, flash: { value: 0 }, flashCol: { value: new THREE.Vector3(1, 1, 1) },
    red: { value: 0 }, glitch: { value: 0 }, dark: { value: 0 }, wobble: { value: 0 }
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time,exposure,grain,vig,ca,sat,flash,red,glitch,dark,wobble; uniform vec3 tint,flashCol; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
    vec3 tex(vec2 uv){ return texture2D(tDiffuse,uv).rgb; }
    void main(){
      vec2 uv=vUv;
      if(wobble>0.0){ uv+=vec2(sin(uv.y*18.0+time*3.0),cos(uv.x*14.0+time*2.3))*0.004*wobble; }
      if(glitch>0.0){
        float row=floor(uv.y*36.0);
        float g=step(1.0-glitch*0.55,h(vec2(row,floor(time*24.0))));
        uv.x+=g*(h(vec2(row,floor(time*24.0)+1.0))-0.5)*0.12*glitch;
      }
      vec2 d=uv-0.5; float r2=dot(d,d);
      float a=ca*(0.0006+r2*0.008)+glitch*0.01;
      vec3 c=vec3(tex(uv+d*a).r, tex(uv).g, tex(uv-d*a).b);
      c=aces(c*exposure);
      c=pow(c,vec3(1.0/2.2));
      float l=dot(c,vec3(0.299,0.587,0.114));
      c=mix(vec3(l),c,sat)*tint;
      c+= (h(uv*vec2(1733.0,977.0)+fract(time*13.0))-0.5)*grain;
      c*=1.0-smoothstep(0.12,0.9,r2*vig*2.2);
      c=mix(c,vec3(0.45,0.0,0.0),red*smoothstep(0.02,0.42,r2));
      c*=1.0-dark;
      c=mix(c,flashCol,flash);
      gl_FragColor=vec4(c,1.0);
    }`
};
const quality = { scale: store.get('qscale', isTouch ? 0.75 : 1), bloom: store.get('bloom', true) };
function initRenderer() {
  const canvas = $('cv');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.outputEncoding = THREE.LinearEncoding;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000, 1);
  R.renderer = renderer;
  R.scene = new THREE.Scene();
  R.camera = new THREE.PerspectiveCamera(74, 1, 0.04, 220);
  R.scene.add(R.camera);
  const gl2 = renderer.capabilities.isWebGL2, rt = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: gl2 ? (isTouch ? 2 : 4) : 0 });
  R.composer = new THREE.EffectComposer(renderer, rt); // MSAA on the scene pass: no more jagged edges / shimmering
  R.renderPass = new THREE.RenderPass(R.scene, R.camera);
  R.composer.addPass(R.renderPass);
  R.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.55, 0.86);
  R.composer.addPass(R.bloom);
  R.post = new THREE.ShaderPass(PostShader);
  R.post.renderToScreen = true;
  R.composer.addPass(R.post);
  R.P = R.post.uniforms;
  resize();
  addEventListener('resize', resize);
}
function resize() {
  const w = innerWidth, h = innerHeight;
  const pr = Math.min(devicePixelRatio || 1, quality.scale >= 1 ? 2 : 1.5) * quality.scale;
  R.renderer.setPixelRatio(pr);
  R.renderer.setSize(w, h, false);
  R.composer.setPixelRatio(pr);
  R.composer.setSize(w, h);
  R.bloom.setSize(w * pr * 0.5, h * pr * 0.5);
  R.bloom.enabled = quality.bloom;
  R.camera.aspect = w / h; R.camera.updateProjectionMatrix();
  $('rotate').classList.toggle('on', isTouch && h > w * 1.05);
}

/* ---------------- input ---------------- */
const BIND_DEF = { fwd: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', run: 'ShiftLeft', crouch: 'KeyZ', jump: 'Space', use: 'KeyE', light: 'KeyF', bag: 'Tab', peek: 'KeyQ', item: 'Mouse0' };
const BIND_NAMES = { fwd: 'قدّام', back: 'ورا', left: 'يسار', right: 'يمين', run: 'ركض', crouch: 'انحناء', jump: 'قفز', use: 'تفاعل', light: 'الكشاف', bag: 'الشنطة', peek: 'طلّ', item: 'استخدم الغرض اللي بيدك' };
const Input = { keys: {}, lookX: 0, lookY: 0, joy: { x: 0, y: 0 }, tRun: false, tCrouch: false, locked: false, sens: store.get('sens', 1), binds: Object.assign({}, BIND_DEF, store.get('binds', {})), lastMove: 0 };
const ALT_KEYS = { fwd: 'ArrowUp', back: 'ArrowDown' };
function down(a) { return !!(Input.keys[Input.binds[a]] || (ALT_KEYS[a] && Input.keys[ALT_KEYS[a]])); }
function actionOf(code) { for (const a in Input.binds) if (Input.binds[a] === code) return a; if (code === 'ArrowUp') return 'fwd'; return null; }
function keyLabel(code) { if (!code) return '—'; if (code.startsWith('Key')) return code.slice(3); if (code.startsWith('Digit')) return code.slice(5); return ({ Space: 'Space', ShiftLeft: 'Shift', ShiftRight: 'R-Shift', ControlLeft: 'Ctrl', ControlRight: 'R-Ctrl', AltLeft: 'Alt', Tab: 'Tab', CapsLock: 'Caps', Backquote: '`', Mouse0: 'M1', Mouse2: 'M2' })[code] || code; }
function initInput() {
  addEventListener('keydown', e => {
    if (Input.capture) { e.preventDefault(); if (e.code !== 'Escape') Input.capture(e.code); else Input.capture(null); return; }
    if (e.ctrlKey && Game.state === 'play') e.preventDefault(); // Ctrl+W etc. must not close the tab mid-game
    Input.keys[e.code] = true;
    if (Game.onKey) Game.onKey(e.code, e);
    if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.code) || (Game.state === 'play' && Object.values(Input.binds).includes(e.code))) e.preventDefault();
  });
  addEventListener('keyup', e => { Input.keys[e.code] = false; });
  addEventListener('mousedown', e => { const c = 'Mouse' + e.button; if (Input.capture) { e.preventDefault(); Input.capture(c); return; } if (Game.state !== 'play' || !Input.locked) return; Input.keys[c] = true; if (Game.onKey) Game.onKey(c, e); });
  addEventListener('mouseup', e => { Input.keys['Mouse' + e.button] = false; });
  addEventListener('contextmenu', e => { if (Game.state === 'play') e.preventDefault(); });
  addEventListener('blur', () => { Input.keys = {}; });
  document.addEventListener('mousemove', e => {
    if (document.pointerLockElement !== $('cv')) return;
    const now = performance.now(); let mx = e.movementX, my = e.movementY;
    // Chrome/Windows sometimes reports a huge bogus jump right after locking or on high-rate mice: drop it
    if (now - (Input.lockT || 0) < 120 || Math.abs(mx) > 260 || Math.abs(my) > 260) return;
    Input.lookX += mx; Input.lookY += my;
  });
  document.addEventListener('pointerlockchange', () => {
    Input.locked = document.pointerLockElement === $('cv'); Input.lockT = performance.now();
    if (!Input.locked && Game.state === 'play' && !isTouch && !Game.suppressPause) Game.pause(true);
    Game.suppressPause = false;
  });
  $('cv').addEventListener('click', () => { if (Game.state === 'play') lockPointer(); });
  if (isTouch) initTouch();
}
function lockPointer() {
  if (isTouch) return;
  try { const c = $('cv'); let p; try { p = c.requestPointerLock({ unadjustedMovement: true }); } catch (e) { p = null; } if (p && p.catch) p.catch(() => { try { const q = c.requestPointerLock(); if (q && q.catch) q.catch(() => { }); } catch (e) { } }); else if (!p) c.requestPointerLock(); } catch (e) { }
}
function unlockPointer() { Game.suppressPause = true; try { document.exitPointerLock(); } catch (e) { } }
function initTouch() {
  const joy = $('joy'), knob = $('knob');
  let jid = null, cx = 0, cy = 0, lid = null, lx = 0, ly = 0;
  joy.addEventListener('pointerdown', e => { jid = e.pointerId; const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; joy.setPointerCapture(jid); mv(e); });
  const mv = e => { if (e.pointerId !== jid) return; let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy), R0 = 52; if (m > R0) { dx *= R0 / m; dy *= R0 / m; } knob.style.transform = `translate(${dx}px,${dy}px)`; Input.joy.x = dx / R0; Input.joy.y = dy / R0; };
  joy.addEventListener('pointermove', mv);
  const end = e => { if (e.pointerId !== jid) return; jid = null; Input.joy.x = Input.joy.y = 0; knob.style.transform = ''; };
  joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
  const lookEl = $('lookpad');
  lookEl.addEventListener('pointerdown', e => { if (lid !== null) return; lid = e.pointerId; lx = e.clientX; ly = e.clientY; lookEl.setPointerCapture(lid); });
  lookEl.addEventListener('pointermove', e => { if (e.pointerId !== lid) return; Input.lookX += (e.clientX - lx) * 2.1; Input.lookY += (e.clientY - ly) * 2.1; lx = e.clientX; ly = e.clientY; });
  const endL = e => { if (e.pointerId === lid) lid = null; };
  lookEl.addEventListener('pointerup', endL); lookEl.addEventListener('pointercancel', endL);
  const tb = (id, fn) => $(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  tb('tUse', () => Game.onKey && Game.onKey('KeyE'));
  tb('tLight', () => Game.onKey && Game.onKey('KeyF'));
  tb('tJump', () => Game.onKey && Game.onKey('Space'));
  tb('tRun', () => { Input.tRun = !Input.tRun; $('tRun').classList.toggle('act', Input.tRun); });
  tb('tCrouch', () => { Input.tCrouch = !Input.tCrouch; $('tCrouch').classList.toggle('act', Input.tCrouch); });
  tb('tPause', () => Game.pause(true));
  tb('tBag', () => toggleBag(true));
}

/* ---------------- UI helpers ---------------- */
const UI = {
  msgT: 0, toastT: 0,
  msg(html, ms = 3800) { const m = $('msg'); m.innerHTML = html; m.classList.add('on'); clearTimeout(this.msgT); this.msgT = setTimeout(() => m.classList.remove('on'), ms); },
  objective(t, sub) {
    $('objT').textContent = t; $('objS').textContent = sub || '';
    const o = $('obj'); o.classList.remove('flash'); void o.offsetWidth; o.classList.add('on', 'flash');
  },
  prompt(t) { const p = $('prompt'); if (t) { p.textContent = t; p.classList.add('on'); } else p.classList.remove('on'); },
  toast(from, text, ms = 5200) {
    const t = $('toast'); $('toastFrom').textContent = from; $('toastText').textContent = text;
    t.classList.add('on'); clearTimeout(this.toastT); this.toastT = setTimeout(() => t.classList.remove('on'), ms);
  },
  sub(html, ms = 3200) { const s = $('subs'); s.innerHTML = html; s.classList.add('on'); clearTimeout(this.subT); this.subT = setTimeout(() => s.classList.remove('on'), ms); },
  show(id, on) { $(id).classList.toggle('on', on); },
  card(level, title, sub) {
    $('lcLevel').textContent = level; $('lcTitle').textContent = title; $('lcSub').textContent = sub || '';
    const c = $('levelcard'); c.classList.remove('on'); void c.offsetWidth; c.classList.add('on');
    setTimeout(() => c.classList.remove('on'), 4200);
  }
};
