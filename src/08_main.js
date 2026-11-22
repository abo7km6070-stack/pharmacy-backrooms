/* =====================================================================
   boot, menus, settings
   ===================================================================== */
const QUAL = { low: { scale: 0.6, bloom: false }, med: { scale: 0.8, bloom: true }, high: { scale: 1, bloom: true } };
function applyQuality(q) { const Q = QUAL[q] || QUAL.med; quality.scale = Q.scale; quality.bloom = Q.bloom; store.set('qual', q); store.set('qscale', Q.scale); store.set('bloom', Q.bloom); if (R.renderer) resize(); document.querySelectorAll('[data-q]').forEach(b => b.classList.toggle('sel', b.dataset.q === q)); }
function showScreen(id) { ['title', 'levels', 'settings', 'howto', 'pause', 'dead', 'ending'].forEach(s => $(s).classList.toggle('on', s === id)); }
function newRun(levelId) {
  audioInit();
  Game.deaths = 0; Game.notesRead = 0; Game.startT = Game.t; Game.inv = {}; Game.updateInv();
  showScreen(null); document.body.classList.add('playing');
  $('intro').classList.add('on');
  setTimeout(() => { startLevel(levelId || 'L0'); }, 900);
  setTimeout(() => $('intro').classList.remove('on'), 1600);
}
function toMenu() {
  Game.state = 'title'; unlockPointer(); document.body.classList.remove('playing');
  Game.monsters.forEach(m => m.deactivate()); partyStop(true);
  ['hum', 'drone', 'pipe', 'wind'].forEach(b => setBed(b, 0)); if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume();
  UI.prompt(''); $('obj').classList.remove('on'); $('slats').classList.remove('on'); muffle(false);
  showScreen('title'); refreshLevels();
}
function refreshLevels() {
  const r = store.get('reached', 0);
  document.querySelectorAll('[data-lvl]').forEach(b => { const o = +b.dataset.ord; b.disabled = o > r; b.classList.toggle('locked', o > r); });
  $('wonBadge').style.display = store.get('won', false) ? '' : 'none';
}
function bindUI() {
  const on = (id, fn) => $(id).addEventListener('click', e => { e.preventDefault(); SFX && A.ready && SFX.click(); fn(e); });
  on('btnStart', () => newRun('L0'));
  on('btnLevels', () => { audioInit(); refreshLevels(); showScreen('levels'); });
  on('btnSettings', () => { audioInit(); showScreen('settings'); Game.settingsFrom = 'title'; });
  on('btnHow', () => { showScreen('howto'); });
  document.querySelectorAll('.back').forEach(b => b.addEventListener('click', () => { if (Game.settingsFrom === 'pause' && Game.state === 'paused') { showScreen('pause'); Game.settingsFrom = null; } else showScreen('title'); }));
  document.querySelectorAll('[data-lvl]').forEach(b => b.addEventListener('click', () => newRun(b.dataset.lvl)));
  document.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => applyQuality(b.dataset.q)));
  const sens = $('sens'); sens.value = Input.sens; sens.oninput = () => { Input.sens = +sens.value; store.set('sens', Input.sens); };
  const vol = $('vol'); vol.value = store.get('vol', 0.9); vol.oninput = () => { store.set('vol', +vol.value); if (A.master) A.master.gain.value = +vol.value; };
  const subs = $('subsT'); subs.checked = Game.subs; subs.onchange = () => { Game.subs = subs.checked; store.set('subs', Game.subs); };
  on('btnResume', () => Game.pause(false));
  on('btnRestart', () => { showScreen(null); if (A.ctx) A.ctx.resume(); startLevel(Game.level.id); });
  on('btnPSettings', () => { Game.settingsFrom = 'pause'; showScreen('settings'); });
  on('btnPMenu', () => toMenu());
  on('retryBtn', () => respawn());
  on('btnDMenu', () => toMenu());
  on('btnAgain', () => newRun('L0'));
  on('btnEMenu', () => toMenu());
  $('noteClose').addEventListener('click', () => closeNote());
  $('note').addEventListener('click', e => { if (e.target.id === 'note') closeNote(); });
  $('kpClose').addEventListener('click', () => closeKeypad());
  $('kpClear').addEventListener('click', () => { if (Game.keypad) { Game.keypad.entry = []; renderKP(); } });
  $('termForm').addEventListener('submit', e => { e.preventDefault(); termSubmit(); });
  $('termClose').addEventListener('click', () => closeTerminal());
  $('termIn').addEventListener('keydown', e => e.stopPropagation());
  $('termIn').addEventListener('keyup', e => e.stopPropagation());
  if (isTouch) document.body.classList.add('touch');
  $('howKeys').style.display = isTouch ? 'none' : ''; $('howTouch').style.display = isTouch ? '' : 'none';
}
async function boot() {
  const bar = $('loadBar'), st = $('loadTxt');
  const step = (p, t) => { bar.style.width = p + '%'; st.textContent = t; return new Promise(r => setTimeout(r, 16)); };
  try {
    await step(5, 'تحميل الخطوط…');
    try { await Promise.race([Promise.all(['700 40px Tajawal', '400 40px Tajawal', '700 40px "Aref Ruqaa"'].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 2500))]); } catch (e) { }
    await step(15, 'تجهيز الرسوم…');
    initRenderer();
    await step(30, 'رسم ورق الجدران والموكيت…');
    buildTextures(); mkStyles();
    await step(70, 'تجهيز الإضاءة…');
    worldReset(); initInput(); initTorch(); initLightPool(8); bindUI(); applyQuality(store.get('qual', isTouch ? 'med' : 'high'));
    await step(90, 'إيقاظ الدكاترة…');
    requestAnimationFrame(frame);
    refreshLevels();
    await step(100, 'جاهز');
    $('loading').classList.add('gone'); showScreen('title');
    const q = new URLSearchParams(location.search).get('level'); if (q && LEVELS[q]) setTimeout(() => newRun(q), 300);
  } catch (e) {
    console.error(e); st.textContent = 'جهازك ما يدعم WebGL أو صار خطأ: ' + e.message; bar.style.background = '#c22';
  }
}
window.addEventListener('load', boot);
