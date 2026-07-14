/* =========================================================
   MATH TUG ARENA — APPLICATION LOGIC
   Sections:
     1. Config & data (classes, categories, difficulty)
     2. Question bank / generators
     3. Audio engine — sound effects (Web Audio API, synthesized)
     4. Global state
     5. Screen navigation
     6. Class / category / mode rendering
     7. Game engine (rope mechanics, scoring, keypad)
     8. Robot AI
     9. Victory overlay
     10. Fullscreen control
     11. Bootstrapping
   ========================================================= */

/* ---------------------------------------------------------
   1. CONFIG & DATA
--------------------------------------------------------- */
const CLASS_META = {
  4: { icon: '🌱', desc: 'Foundations of arithmetic.', diff: 'beginner' },
  5: { icon: '🍀', desc: 'Ratios, percentages & practice.', diff: 'easy' },
  6: { icon: '🔷', desc: 'Integers, factors & multiples.', diff: 'easy' },
  7: { icon: '📘', desc: 'Intro to algebra & geometry.', diff: 'medium' },
  8: { icon: '📗', desc: 'Equations, squares & commerce math.', diff: 'medium' },
  9: { icon: '📙', desc: 'Polynomials, stats & probability.', diff: 'hard' },
  10: { icon: '🎓', desc: 'Quadratics, trig & mensuration.', diff: 'advanced' },
};

const DIFF_LABEL = { beginner: 'Beginner', easy: 'Easy', medium: 'Medium', hard: 'Hard', advanced: 'Advanced', expert: 'Expert', pro: 'Pro' };

const CATEGORY_META = {
  addition: { name: 'Addition', icon: '➕' },
  subtraction: { name: 'Subtraction', icon: '➖' },
  multiplication: { name: 'Multiplication', icon: '✖️' },
  division: { name: 'Division', icon: '➗' },
  mixed: { name: 'Mixed Practice', icon: '🎯' },
  fractions: { name: 'Fractions', icon: '🍰' },
  decimals: { name: 'Decimals', icon: '🔢' },
  wordproblems: { name: 'Word Problems', icon: '📖' },
  ratio: { name: 'Ratio', icon: '⚖️' },
  percentage: { name: 'Percentage', icon: '💯' },
  integers: { name: 'Integers', icon: '🔀' },
  factors: { name: 'Factors', icon: '🧩' },
  lcm: { name: 'LCM', icon: '🔗' },
  hcf: { name: 'HCF', icon: '🔑' },
  algebra: { name: 'Algebra', icon: '🅰️' },
  geometry: { name: 'Geometry', icon: '📐' },
  exponents: { name: 'Exponents', icon: '⚡' },
  linear: { name: 'Linear Equations', icon: '📈' },
  squares: { name: 'Squares & Roots', icon: '√' },
  profitloss: { name: 'Profit & Loss', icon: '💰' },
  polynomials: { name: 'Polynomials', icon: '∑' },
  coordgeo: { name: 'Coordinate Geometry', icon: '🗺️' },
  statistics: { name: 'Statistics', icon: '📊' },
  probability: { name: 'Probability', icon: '🎲' },
  quadratic: { name: 'Quadratic Equations', icon: '📉' },
  trigonometry: { name: 'Trigonometry', icon: '📏' },
  mensuration: { name: 'Mensuration', icon: '📦' },
};

const CLASS_CATEGORIES = (function () {
  const c4 = ['addition', 'subtraction', 'multiplication', 'division', 'mixed', 'fractions', 'decimals', 'wordproblems'];
  const c5 = c4.concat(['ratio', 'percentage']);
  const c6 = c5.concat(['integers', 'factors', 'lcm', 'hcf']);
  const c7 = c6.concat(['algebra', 'geometry', 'exponents']);
  const c8 = c7.concat(['linear', 'squares', 'profitloss']);
  const c9 = c8.concat(['polynomials', 'coordgeo', 'statistics', 'probability']);
  const c10 = c9.concat(['quadratic', 'trigonometry', 'mensuration']);
  return { 4: c4, 5: c5, 6: c6, 7: c7, 8: c8, 9: c9, 10: c10 };
})();

const BOT_PROFILES = {
  // min/max = "thinking" delay (ms) before the robot starts typing its
  // answer — this is what gives a human time to read + solve the question
  // first. Values were increased across every tier so the robot always
  // feels beatable-with-effort rather than instant, and each tier now also
  // gets extra thinking time scaled to the actual question's difficulty
  // (see questionComplexityDelay) so a fast tier can't quietly skip the
  // "read the problem" time a longer number or higher class deserves.
  // Easy is intentionally very generous so beginners always get a real
  // shot at beating it; the higher mistake rate also means it isn't just
  // slow, it's genuinely beatable.
  easy: { min: 12000, max: 19000, mistake: 0.35, label: 'Easy' },
  medium: { min: 7000, max: 10500, mistake: 0.16, label: 'Medium' },
  hard: { min: 4000, max: 6000, mistake: 0.07, label: 'Hard' },
  expert: { min: 2200, max: 3600, mistake: 0.03, label: 'Expert' },
  impossible: { min: 1200, max: 2200, mistake: 0.0, label: 'Impossible' },
};

/* Victory clips shown when a side wins — used both for the arena swap
   behind the overlay and inside the victory overlay itself. Swap these
   paths any time to use different celebration GIFs (jumping, dancing,
   hands-up, trophy, confetti, etc.) — nothing else in the code needs
   to change. */
const VICTORY_GIFS = {
  left: 'win_blue.gif',
  right: 'win_red.gif',
};

/* ---------------------------------------------------------
   2. QUESTION BANK
--------------------------------------------------------- */
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

function tierOf(cls) { return cls <= 5 ? 1 : cls <= 7 ? 2 : cls <= 9 ? 3 : 4; }

const GEN = {
  addition(cls) {
    const shape = pick(['single', 'single', 'teen', 'twoDigit']);
    let a, b;
    if (shape === 'single') { a = randInt(2, 9); b = randInt(2, 9); }
    else if (shape === 'teen') { a = randInt(10, 19); b = randInt(2, 9); }
    else { a = randInt(11, 40); b = randInt(2, 30); }
    return { text: `${a} + ${b}`, answer: a + b };
  },
  subtraction(cls) {
    const shape = pick(['teen', 'teen', 'twoDigit']);
    let a, b;
    if (shape === 'teen') { a = randInt(11, 19); b = randInt(2, 9); }
    else { a = randInt(20, 40); b = randInt(2, 20); }
    if (b > a) { const t = a; a = b; b = t; }
    return { text: `${a} \u2212 ${b}`, answer: a - b };
  },
  multiplication(cls) {
    const a = randInt(2, 9), b = randInt(2, 9);
    return { text: `${a} \u00D7 ${b}`, answer: a * b };
  },
  division(cls) {
    const b = randInt(2, 9), k = randInt(2, 9); const a = b * k;
    return { text: `${a} \u00F7 ${b}`, answer: k };
  },
  mixed(cls) {
    const fns = [GEN.addition, GEN.subtraction, GEN.multiplication, GEN.division];
    return pick(fns)(cls);
  },
  fractions(cls) {
    const denoms = [2, 3, 4, 5, 6, 8, 10]; const d = pick(denoms); const mult = randInt(2, 10);
    const base = d * mult; const n = randInt(1, d - 1);
    return { text: `What is ${n}/${d} of ${base}?`, answer: Math.round(n * base / d) };
  },
  decimals(cls) {
    const a = randInt(1, 40) / 2, b = randInt(1, 40) / 2;
    const sum = a + b;
    if (Number.isInteger(sum)) return { text: `${a} + ${b}`, answer: sum };
    return { text: `Round ${a + 0.3} to the nearest whole number`, answer: Math.round(a + 0.3) };
  },
  wordproblems(cls) {
    const t = tierOf(cls); const hi = t <= 1 ? 40 : t === 2 ? 150 : t === 3 ? 400 : 900;
    const items = ['apples', 'marbles', 'pencils', 'stickers', 'books', 'coins'];
    const names = ['Sam', 'Maya', 'Alex', 'Priya', 'Liam', 'Nisha'];
    const item = pick(items), name = pick(names);
    const kind = pick(['add', 'sub', 'mul']);
    if (kind === 'add') { const a = randInt(5, hi), b = randInt(5, hi); return { text: `${name} has ${a} ${item} and gets ${b} more. Total?`, answer: a + b }; }
    if (kind === 'sub') { const a = randInt(10, hi), b = randInt(1, a); return { text: `${name} has ${a} ${item} and gives away ${b}. Left?`, answer: a - b }; }
    const a = randInt(2, 12), b = randInt(2, 20); return { text: `${name} packs ${a} bags of ${b} ${item} each. Total?`, answer: a * b };
  },
  ratio(cls) {
    const a = randInt(2, 9), b = randInt(2, 9), k = randInt(2, 10);
    return { text: `Ratio of boys to girls is ${a}:${b}. If there are ${b * k} girls, how many boys?`, answer: a * k };
  },
  percentage(cls) {
    const p = pick([5, 10, 20, 25, 50, 75]); const base = randInt(2, 30) * 4;
    return { text: `${p}% of ${base}`, answer: Math.round(p / 100 * base) };
  },
  integers(cls) {
    const a = randInt(2, 30), b = randInt(a + 1, a + 30);
    return { text: `(\u2212${a}) + ${b}`, answer: b - a };
  },
  factors(cls) {
    const nums = [12, 16, 18, 20, 24, 28, 30, 36, 40, 45, 48, 60];
    const n = pick(nums); let count = 0; for (let i = 1; i <= n; i++) { if (n % i === 0) count++; }
    return { text: `How many factors does ${n} have?`, answer: count };
  },
  lcm(cls) {
    const a = randInt(2, 12), b = randInt(2, 12);
    return { text: `LCM of ${a} and ${b}`, answer: (a * b) / gcd(a, b) };
  },
  hcf(cls) {
    const a = randInt(4, 60), b = randInt(4, 60);
    return { text: `HCF of ${a} and ${b}`, answer: gcd(a, b) };
  },
  algebra(cls) {
    const a = randInt(2, 9), x = randInt(1, 15), b = randInt(0, 25); const c = a * x + b;
    return { text: `${a}x + ${b} = ${c}   x = ?`, answer: x };
  },
  geometry(cls) {
    const a = randInt(30, 110), b = randInt(20, 180 - a - 10);
    return { text: `A triangle has angles ${a}\u00B0 and ${b}\u00B0. Find the third angle.`, answer: 180 - a - b };
  },
  exponents(cls) {
    const a = randInt(2, 12), n = pick([2, 2, 2, 3]);
    return { text: `${a}${n === 2 ? '\u00B2' : '\u00B3'}`, answer: Math.pow(a, n) };
  },
  linear(cls) {
    const a = randInt(2, 12), x = randInt(1, 20), b = randInt(-30, 30);
    const c = a * x + b; const bTxt = b >= 0 ? `+ ${b}` : `\u2212 ${Math.abs(b)}`;
    return { text: `${a}x ${bTxt} = ${c}   x = ?`, answer: x };
  },
  squares(cls) {
    if (Math.random() < 0.5) { const a = randInt(2, 25); return { text: `${a}\u00B2`, answer: a * a }; }
    const a = randInt(2, 25); return { text: `\u221A${a * a}`, answer: a };
  },
  profitloss(cls) {
    const cp = randInt(50, 900); const profit = Math.random() < 0.5;
    const sp = profit ? cp + randInt(5, 200) : cp - randInt(5, Math.min(200, cp - 5));
    return { text: `Cost price \u20B9${cp}, selling price \u20B9${sp}. Find the ${profit ? 'profit' : 'loss'}.`, answer: Math.abs(sp - cp) };
  },
  polynomials(cls) {
    const a = randInt(2, 9), x = randInt(1, 12), b = randInt(0, 20);
    return { text: `p(x) = ${a}x + ${b}. Find p(${x}).`, answer: a * x + b };
  },
  coordgeo(cls) {
    const y = randInt(1, 20), x1 = randInt(1, 15), x2 = randInt(x1 + 1, x1 + 25);
    return { text: `Distance between (${x1},${y}) and (${x2},${y})`, answer: x2 - x1 };
  },
  statistics(cls) {
    const n = randInt(3, 5); const mean = randInt(4, 40); const vals = [];
    let sum = 0; for (let i = 0; i < n - 1; i++) { const v = randInt(1, mean * 2); vals.push(v); sum += v; }
    const last = mean * n - sum;
    if (last < 0 || !Number.isFinite(last)) return GEN.statistics(cls);
    vals.push(last);
    return { text: `Find the mean of: ${vals.join(', ')}`, answer: mean };
  },
  probability(cls) {
    const a = randInt(2, 20), b = randInt(2, 20);
    return { text: `A bag has ${a} red balls and ${b} blue balls. Total balls?`, answer: a + b };
  },
  quadratic(cls) {
    const r1 = randInt(1, 12), r2 = randInt(1, 12); const s = r1 + r2;
    return { text: `A quadratic has roots summing to ${s}. One root is ${r1}. Find the other root.`, answer: r2 };
  },
  trigonometry(cls) {
    const a = randInt(10, 80);
    return { text: `In a right triangle, one non-right angle is ${a}\u00B0. Find the other non-right angle.`, answer: 90 - a };
  },
  mensuration(cls) {
    if (Math.random() < 0.5) { const l = randInt(3, 40), w = randInt(3, 40); return { text: `Area of a rectangle ${l} \u00D7 ${w}`, answer: l * w }; }
    const s = randInt(3, 50); return { text: `Perimeter of a square with side ${s}`, answer: s * 4 };
  },
};

function generateQuestion(category, cls, avoidText) {
  const fn = GEN[category] || GEN.mixed;
  let q = fn(cls);
  if (avoidText && q.text === avoidText) { q = fn(cls); }
  return q;
}

/* ---------------------------------------------------------
   3. AUDIO ENGINE — SOUND EFFECTS (synthesized, no audio files)
   ---------------------------------------------------------
   All gameplay SFX (clicks, correct/wrong, combo, power pull, rope
   whoosh, victory/defeat fanfare) share one AudioContext (see
   sharedCtx()).
--------------------------------------------------------- */
let sharedAudioCtx = null;
function sharedCtx() {
  if (!sharedAudioCtx) {
    try { sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { sharedAudioCtx = null; }
  }
  return sharedAudioCtx;
}
function resumeSharedCtx() {
  const ac = sharedCtx();
  if (ac && ac.state === 'suspended') ac.resume();
  return ac;
}

const Audio2 = (function () {
  let muted = false;
  function tone(freq, dur, type, gainVal, delay) {
    if (muted) return; const ac = sharedCtx(); if (!ac) return;
    const t0 = ac.currentTime + (delay || 0);
    const osc = ac.createOscillator(); const gain = ac.createGain();
    osc.type = type || 'sine'; osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(gainVal !== undefined ? gainVal : 0.18, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  // Short filtered noise burst — used for the rope "whoosh" on every pull.
  function noiseBurst(dur, filterFreq, gainVal, delay) {
    if (muted) return; const ac = sharedCtx(); if (!ac) return;
    const t0 = ac.currentTime + (delay || 0);
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const noise = ac.createBufferSource(); noise.buffer = buffer;
    const filter = ac.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.setValueAtTime(filterFreq, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(200, filterFreq * 0.6), t0 + dur);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(gainVal, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    noise.connect(filter); filter.connect(gain); gain.connect(ac.destination);
    noise.start(t0); noise.stop(t0 + dur + 0.02);
  }
  return {
    setMuted(v) { muted = v; },
    isMuted() { return muted; },
    click() { tone(520, 0.06, 'square', 0.12); },
    correct() { tone(660, 0.12, 'triangle', 0.2); tone(880, 0.14, 'triangle', 0.18, 0.08); },
    wrong() { tone(220, 0.18, 'sawtooth', 0.16); tone(160, 0.22, 'sawtooth', 0.14, 0.09); },
    combo() { tone(740, 0.1, 'sine', 0.16); tone(988, 0.12, 'sine', 0.16, 0.07); tone(1318, 0.16, 'sine', 0.16, 0.14); },
    power() { tone(180, 0.2, 'sawtooth', 0.2); tone(520, 0.22, 'triangle', 0.2, 0.08); tone(880, 0.26, 'triangle', 0.22, 0.16); },
    whoosh(side) { noiseBurst(0.22, side === 'right' ? 1400 : 1100, 0.09); },
    countdown() { tone(440, 0.08, 'square', 0.14); },
    victory() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 'triangle', 0.2, i * 0.13)); },
    defeat() { [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.16, i * 0.16)); },
  };
})();

/* ---------------------------------------------------------
   4. GLOBAL STATE
--------------------------------------------------------- */
const S = {
  cls: 4,
  category: 'addition',
  mode: 'robot',          // 'robot' | 'player' | 'online'
  botDifficulty: 'hard',
  screenStack: [],

  // online (cross-device) match state
  onlineSide: null,        // 'left' | 'right' — which panel THIS device controls
  roomCode: null,
  onlineStarted: false,    // guards startMatch() from firing twice off the listener
  onlineListenerRef: null, // firebase ref currently being listened to (for cleanup)

  // match state
  position: 50,            // 0 = left finish line, 100 = right finish line, 50 = center line
  round: 1,
  matchStartTs: 0,
  matchTimerHandle: null,
  fastestMs: null,

  left: { name: 'Player 1', score: 0, combo: 0, correct: 0, wrong: 0, question: null, input: '', qStartTs: 0, perfectCounter: 0 },
  right: { name: 'ROBOT', score: 0, combo: 0, correct: 0, wrong: 0, question: null, input: '', qStartTs: 0, perfectCounter: 0, timer: null },

  over: false,
};

const PULL_BASE = 6;
const FAST_MS = 4000;
const COMBO_BONUS_AT = 3;
const PERFECT_AT = 5;

const WIN_MARGIN = 8; // percent from each edge
const LEFT_FINISH = WIN_MARGIN;
const RIGHT_FINISH = 100 - WIN_MARGIN;

/* ---------------------------------------------------------
   5. SCREEN NAVIGATION
--------------------------------------------------------- */
const SCREEN_ORDER = ['landing', 'class', 'category', 'mode', 'game'];
let currentScreenName = 'landing';

/* showScreen() now drives its slide-direction from an explicit navigation
   STACK (S.screenStack) rather than a fixed SCREEN_ORDER position. This is
   what lets Back always retrace the player's ACTUAL journey instead of a
   hard-coded screen hierarchy — e.g. a player who lands on the "mode"
   screen straight from Home (via Join Battle, skipping Class/Topic) will
   have Back take them straight back Home, because that's genuinely the
   previous screen on the stack, not because of any special-casing.

   opts:
     push:   false  -> don't push the outgoing screen onto the stack
                        (used for Back itself, and for "reset to root"
                        jumps like Quit / Play Again / Back to Home).
     isBack: true   -> force the "returning" slide animation (from the
                        left) regardless of SCREEN_ORDER position. */
function showScreen(name, opts) {
  opts = opts || {};
  if (name === currentScreenName) return;
  const current = document.getElementById('screen-' + currentScreenName);
  const next = document.getElementById('screen-' + name);
  if (!next) return;

  let goingForward;
  if (typeof opts.isBack === 'boolean') {
    goingForward = !opts.isBack;
  } else {
    const fromIdx = SCREEN_ORDER.indexOf(currentScreenName);
    const toIdx = SCREEN_ORDER.indexOf(name);
    goingForward = toIdx === -1 || fromIdx === -1 ? true : toIdx >= fromIdx;
  }

  next.classList.remove('screen-leaving', 'screen-leaving-back');
  next.classList.add(goingForward ? 'screen-enter-from-right' : 'screen-enter-from-left');

  void next.offsetWidth;

  next.classList.add('active');
  next.classList.remove('screen-enter-from-right', 'screen-enter-from-left');

  if (current && current !== next) {
    current.classList.remove('active');
    current.classList.add(goingForward ? 'screen-leaving' : 'screen-leaving-back');
    const staleCurrent = current;
    setTimeout(function () {
      staleCurrent.classList.remove('screen-leaving', 'screen-leaving-back');
    }, 460);
  }

  if (opts.push !== false) {
    S.screenStack.push(currentScreenName);
  }

  currentScreenName = name;
  document.body.classList.toggle('game-active', name === 'game');
}

/* Pop the real previous screen off the journey stack and go there. Falls
   back to 'landing' if the stack is ever empty (defensive only). */
function goBack() {
  const prev = S.screenStack.length ? S.screenStack.pop() : 'landing';
  showScreen(prev, { isBack: true, push: false });
}

/* Reset navigation to a fresh root — used whenever we jump the player to
   a screen outside the normal forward flow (quitting a match, playing
   again, choosing another topic, heading back to Home from the victory
   screen) so that a subsequent Back tap still makes sense instead of
   replaying stale history from the match that just ended. */
function resetNavTo(name, stackBeneath) {
  S.screenStack = stackBeneath || [];
  showScreen(name, { isBack: true, push: false });
}

/* ---------------------------------------------------------
   6. CLASS / CATEGORY / MODE RENDERING
--------------------------------------------------------- */
function renderClassGrid() {
  const grid = document.getElementById('class-grid');
  grid.innerHTML = '';
  Object.keys(CLASS_META).forEach(function (k) {
    const cls = parseInt(k, 10); const meta = CLASS_META[cls];
    const card = document.createElement('button');
    card.className = 'class-card';
    card.style.setProperty('--card-a', 'var(--primary)');
    card.style.setProperty('--card-b', 'var(--secondary)');
    card.innerHTML = `
      <span class="class-icon">${meta.icon}</span>
      <h3>Class ${cls}</h3>
      <p>${meta.desc}</p>
      <span class="diff-badge ${meta.diff}">${DIFF_LABEL[meta.diff]}</span>
    `;
    card.addEventListener('click', function () {
      Audio2.click();
      S.cls = cls;
      renderCategoryGrid();
      document.getElementById('cat-class-num').textContent = cls;
      showScreen('category');
    });
    grid.appendChild(card);
  });
}

function renderCategoryGrid() {
  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';
  CLASS_CATEGORIES[S.cls].forEach(function (key) {
    const meta = CATEGORY_META[key];
    const card = document.createElement('button');
    card.className = 'category-card';
    card.style.setProperty('--card-a', 'var(--secondary)');
    card.style.setProperty('--card-b', 'var(--primary)');
    card.innerHTML = `<span class="class-icon">${meta.icon}</span><h3>${meta.name}</h3>`;
    card.addEventListener('click', function () {
      Audio2.click();
      S.category = key;
      document.getElementById('mode-sub').textContent = `${meta.name} \u2022 Class ${S.cls}`;
      resetModeScreen();
      showScreen('mode');
    });
    grid.appendChild(card);
  });
}

function resetModeScreen() {
  document.getElementById('mode-robot').classList.remove('selected');
  document.getElementById('mode-player').classList.remove('selected');
  document.getElementById('mode-online').classList.remove('selected');
  document.getElementById('robot-config').classList.add('hidden');
  document.getElementById('player-config').classList.add('hidden');
  document.getElementById('online-config').classList.add('hidden');
  showOnlineTab('host');
  hideOnlineError();
  resetJoinPreview();
}

/* ---------------------------------------------------------
   7. GAME ENGINE
--------------------------------------------------------- */
function startMatch() {
  clearTimeout(S.right.timer);
  clearInterval(S.matchTimerHandle);

  S.position = 50; S.round = 1; S.over = false; S.fastestMs = null;
  ['left', 'right'].forEach(function (side) {
    const p = S[side];
    p.score = 0; p.combo = 0; p.correct = 0; p.wrong = 0; p.input = ''; p.perfectCounter = 0;
    p.question = generateQuestion(S.category, S.cls);
    p.qStartTs = Date.now();
  });

  document.getElementById('left-name').value = S.left.name;
  document.getElementById('right-name').value = S.right.name;
  document.getElementById('right-name').disabled = (S.mode === 'robot' || S.mode === 'online');
  document.getElementById('left-name').disabled = (S.mode === 'online');
  document.getElementById('right-avatar').classList.toggle('hidden', S.mode !== 'robot');
  document.getElementById('right-avatar').textContent = '🤖';
  document.getElementById('arena-mode-label').textContent =
    S.mode === 'robot' ? 'Robot Battle' : (S.mode === 'online' ? 'Online Battle' : 'Player Battle');
  document.getElementById('game-topic-label').textContent = `Class ${S.cls} \u2022 ${CATEGORY_META[S.category].name}`;
  document.getElementById('thinking-indicator').classList.add('hidden');
  document.getElementById('right-cursor').classList.toggle('hidden', S.mode === 'robot');

  // In online mode each device only controls its own side's keypad.
  document.getElementById('left-keypad').classList.toggle('disabled', S.mode === 'online' && S.onlineSide !== 'left');
  document.getElementById('right-keypad').classList.toggle('disabled', S.mode === 'online' && S.onlineSide !== 'right');
  document.getElementById('victory-overlay').classList.remove('active');

  const tugGif = document.getElementById('tug-gif');
  const victoryGif = document.getElementById('arena-victory-gif');
  tugGif.classList.add('no-transition');
  tugGif.classList.remove('tug-fading-out');
  tugGif.style.setProperty('--pan', '0%');
  victoryGif.classList.remove('victory-visible');
  victoryGif.removeAttribute('src');

  renderAll();
  requestAnimationFrame(function () {
    tugGif.classList.remove('no-transition');
  });

  S.matchStartTs = Date.now();
  document.getElementById('match-timer').textContent = '00:00';
  S.matchTimerHandle = setInterval(updateMatchTimer, 1000);

  if (S.mode === 'robot') scheduleRobot();
  // Publish OUR real starting question right away — otherwise the opponent's
  // screen just shows a locally-guessed placeholder for our side until we
  // answer once, which is why the two screens showed different numbers.
  if (S.mode === 'online') pushOwnStatsToRoom();

  showScreen('game');
}

function updateMatchTimer() {
  const secs = Math.floor((Date.now() - S.matchStartTs) / 1000);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  document.getElementById('match-timer').textContent = `${mm}:${ss}`;
}

function renderAll() {
  document.getElementById('left-question').textContent = S.left.question.text;
  document.getElementById('right-question').textContent = S.right.question.text;
  document.getElementById('left-answer-display').innerHTML = S.left.input.length ? S.left.input : '&nbsp;';
  document.getElementById('right-answer-display').innerHTML = S.right.input.length ? S.right.input : '&nbsp;';
  document.getElementById('left-score').textContent = S.left.score;
  document.getElementById('right-score').textContent = S.right.score;
  document.getElementById('left-combo').textContent = S.left.combo;
  document.getElementById('right-combo').textContent = S.right.combo;
  document.getElementById('left-accuracy').textContent = accuracyOf(S.left) + '%';
  document.getElementById('right-accuracy').textContent = accuracyOf(S.right) + '%';
  document.getElementById('round-num').textContent = S.round;
  renderRope();
}

function accuracyOf(p) {
  const total = p.correct + p.wrong;
  return total === 0 ? 0 : Math.round((p.correct / total) * 100);
}

function renderRope() {
  const panPct = ((S.position - 50) / 50) * 46;
  document.getElementById('tug-gif').style.setProperty('--pan', panPct.toFixed(2) + '%');
  document.getElementById('glow-left').classList.toggle('active', S.position < 42);
  document.getElementById('glow-right').classList.toggle('active', S.position > 58);
}

/* Small camera-shake pulse fired on every correct pull, synced with the
   GIF pan (which already eases via the bouncy cubic-bezier on #tug-gif),
   plus a rope "whoosh" sound so the pull is felt as well as seen. */
function triggerRopePull(side) {
  const arenaShake = document.getElementById('arena-shake');
  arenaShake.classList.remove('camera-shake');
  void arenaShake.offsetWidth;
  arenaShake.classList.add('camera-shake');
  Audio2.whoosh(side);
}

/* ---- keypad wiring (shared handler) ----
   Uses pointerdown instead of click so that two fingers landing on the
   keypad at (roughly) the same time — e.g. two players racing on the
   same touchscreen tablet — both register immediately and independently.
   click events on some touch browsers can be delayed/serialized behind
   each other; pointerdown fires the instant each finger lands, per
   pointer, with no cross-talk between the two panels. preventDefault
   stops the browser from also firing a synthetic click/dblclick for the
   same touch (which would otherwise double-handle the tap). */
function wireKeypad(padId, side) {
  document.getElementById(padId).addEventListener('pointerdown', function (e) {
    const btn = e.target.closest('button'); if (!btn || S.over) return;
    if (side === 'right' && S.mode === 'robot') return; // robot side is AI-controlled
    if (S.mode === 'online' && side !== S.onlineSide) return; // opponent's panel is remote-controlled
    e.preventDefault();
    flashKeyPress(btn);
    handleKey(side, btn.dataset.k);
  }, { passive: false });
}

/* Immediate, JS-driven press feedback for every key (including OK),
   independent of :hover — so touch devices always show a visible tap
   response, and simultaneous taps on different keys/panels each get
   their own feedback without interfering with one another. */
function flashKeyPress(btn) {
  btn.classList.remove('key-pressed'); void btn.offsetWidth;
  btn.classList.add('key-pressed');
  setTimeout(function () { btn.classList.remove('key-pressed'); }, 160);
}

function handleKey(side, k) {
  if (S.over) return;
  const p = S[side];
  Audio2.click();
  if (k === 'c') { p.input = ''; }
  else if (k === 'ok') { submitAnswer(side); return; }
  else { if (p.input.length < 5) p.input += k; }
  renderAll();
}

function submitAnswer(side) {
  if (S.over) return;
  const p = S[side];
  if (p.input === '') return;
  const val = parseInt(p.input, 10);
  const elapsed = Date.now() - p.qStartTs;
  const panel = document.getElementById(side === 'left' ? 'panel-left' : 'panel-right');

  if (val === p.question.answer) {
    handleCorrect(side, elapsed, panel);
  } else {
    p.wrong++; p.combo = 0; p.perfectCounter = 0;
    Audio2.wrong();
    panel.classList.remove('shake', 'flash-wrong'); void panel.offsetWidth;
    panel.classList.add('shake', 'flash-wrong');
    p.input = ''; renderAll();
    if (S.mode === 'online' && side === S.onlineSide) pushOwnStatsToRoom();
  }
}

function handleCorrect(side, elapsedMs, panel) {
  if (S.over) return;
  const p = S[side];
  p.correct++; p.combo++; p.perfectCounter++;
  if (S.fastestMs === null || elapsedMs < S.fastestMs) S.fastestMs = elapsedMs;

  let pull = PULL_BASE;
  let scoreGain = 10; // score is tracked for display purposes only — it never decides the winner
  let isPower = false;

  if (elapsedMs <= FAST_MS) { pull += 2; scoreGain += 5; }
  if (p.combo >= COMBO_BONUS_AT) { pull += 2; scoreGain += 5; }
  if (p.perfectCounter >= PERFECT_AT) { pull += 6; scoreGain += 20; isPower = true; p.perfectCounter = 0; }

  p.score += scoreGain;
  S.round++;

  const delta = pull;
  const signedDelta = (side === 'left' ? -delta : delta);

  if (S.mode === 'online') {
    // Authoritative combine happens server-side via a transaction so both
    // devices converge on the same value even if both pull at once; the
    // local bump below is just optimistic feedback until the listener
    // echoes the real number back.
    pushPositionDelta(signedDelta);
  }
  S.position += signedDelta;
  S.position = Math.max(0, Math.min(100, S.position));

  p.question = generateQuestion(S.category, S.cls, p.question.text);
  p.input = ''; p.qStartTs = Date.now();

  panel.classList.remove('flash-correct'); void panel.offsetWidth; panel.classList.add('flash-correct');

  triggerRopePull(side);

  const frame = document.getElementById('arena-frame');
  if (isPower) {
    frame.classList.remove('power-pull'); void frame.offsetWidth; frame.classList.add('power-pull');
    Audio2.power();
    spawnConfetti(6, side);
  } else if (p.combo >= COMBO_BONUS_AT) {
    Audio2.combo();
    spawnConfetti(3, side);
  } else {
    Audio2.correct();
  }

  renderAll();
  checkWin();
  if (S.mode === 'online' && side === S.onlineSide) pushOwnStatsToRoom();
}

function spawnConfetti(count, side) {
  const layer = document.getElementById('confetti-layer');
  const colors = ['#6C4CF1', '#22C1DC', '#FF5D73', '#F5B93D', '#22C55E'];
  const originX = side === 'left' ? '25%' : '75%';
  for (let i = 0; i < count * 4; i++) {
    const bit = document.createElement('div');
    bit.className = 'confetti-bit';
    bit.style.left = `calc(${originX} + ${randInt(-40, 40)}px)`;
    bit.style.background = pick(colors);
    bit.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';
    layer.appendChild(bit);
    setTimeout(() => bit.remove(), 1600);
  }
}

function checkWin() {
  if (S.over) return;

  if (S.mode === 'online') {
    // Online matches must end at exactly the same instant on both devices.
    // Deciding the winner locally here (from an optimistic, not-yet-synced
    // position) is exactly what let one device stop while the other kept
    // accepting answers. The single source of truth is the room's
    // `status`/`winner`, written atomically by pushPositionDelta()'s
    // transaction and picked up by both devices via listenRoom(). Here we
    // only clamp the visual so the rope doesn't look like it stalled short
    // of the line while we wait the (near-instant) round trip.
    if (S.position <= LEFT_FINISH) { S.position = 0; renderRope(); }
    else if (S.position >= RIGHT_FINISH) { S.position = 100; renderRope(); }
    return;
  }

  if (S.position <= LEFT_FINISH) { S.position = 0; renderRope(); endMatch('left'); }
  else if (S.position >= RIGHT_FINISH) { S.position = 100; renderRope(); endMatch('right'); }
}

function playVictorySequence(winnerSide) {
  const tugGif = document.getElementById('tug-gif');
  const victoryGif = document.getElementById('arena-victory-gif');
  const clip = VICTORY_GIFS[winnerSide];

  tugGif.classList.add('tug-fading-out');

  if (clip) {
    victoryGif.src = clip;
    victoryGif.alt = winnerSide === 'left' ? 'Blue team victory celebration' : 'Red team victory celebration';
    requestAnimationFrame(function () {
      victoryGif.classList.add('victory-visible');
    });
  }
}

/* A few varied lines per outcome so the same match ending doesn't always
   show the exact same sentence — keeps the celebration/encouragement
   feeling fresh across repeated "Play Again" rounds. */
const TAGLINES = {
  winRobot: [
    'Excellent Work! You out-solved the robot!',
    'Great Job! You pulled the rope all the way home!',
    'Awesome! Speed and accuracy paid off!',
  ],
  loseRobot: [
    "Try Again! The robot got there first this time.",
    "So Close! You're Improving \u2014 give it another go!",
    'Good Effort! Keep practicing and you\u2019ll get it next round.',
  ],
  winOnline: [
    'Excellent Work! You pulled the rope to your finish line first!',
    'Great Effort! That was a strong win!',
  ],
  loseOnline: [
    `Try Again! {opponent} pulled the rope to their finish line first.`,
    `You're Improving! {opponent} just edged you out \u2014 rematch?`,
  ],
  player: [
    '{opponent} pulled the rope to their finish line first.',
    'Great Effort from both sides \u2014 {opponent} takes it!',
  ],
};

function pickEncouragingTagline(isLocalWin, acc, winnerName) {
  let pool;
  if (S.mode === 'robot') pool = isLocalWin ? TAGLINES.winRobot : TAGLINES.loseRobot;
  else if (S.mode === 'online') pool = isLocalWin ? TAGLINES.winOnline : TAGLINES.loseOnline;
  else pool = TAGLINES.player;

  let line = pick(pool).replace('{opponent}', winnerName);
  if (acc >= 90) line += ' \uD83C\uDF1F Near-perfect accuracy!';
  return line;
}

/* ---------------------------------------------------------
   MATCH END — freeze the board and show the in-place victory overlay.
--------------------------------------------------------- */
function endMatch(winnerSide) {
  if (S.over) return;
  S.over = true;

  clearTimeout(S.right.timer);
  clearInterval(S.matchTimerHandle);

  document.getElementById('left-keypad').classList.add('disabled');
  document.getElementById('right-keypad').classList.add('disabled');

  const winner = S[winnerSide];
  const totalTime = document.getElementById('match-timer').textContent;

  // Whose perspective is THIS device showing?
  //  - robot mode: the human always plays 'left', the bot is always 'right'.
  //  - online mode: each device only "is" its own assigned S.onlineSide.
  //  - same-device VS Player: both players share one screen, so there is
  //    no single local perspective — keep the shared celebratory treatment.
  let isLocalWin = true;
  if (S.mode === 'robot') isLocalWin = (winnerSide === 'left');
  else if (S.mode === 'online') isLocalWin = (winnerSide === S.onlineSide);

  // Stats shown on the card: the winner's stats for a shared-screen match,
  // but each online device's OWN stats — a losing player should see how
  // *they* did, not have the winner's numbers pasted onto their loss.
  const statsSide = S.mode === 'online' ? S.onlineSide : winnerSide;
  const statsPlayer = S[statsSide];
  const acc = accuracyOf(statsPlayer);
  const xp = statsPlayer.score + (acc >= 90 ? 25 : 0);

  Audio2[isLocalWin ? 'victory' : 'defeat']();

  playVictorySequence(winnerSide);

  const overlay = document.getElementById('victory-overlay');
  const card = document.getElementById('victory-card');
  card.classList.remove('side-left', 'side-right', 'result-victory', 'result-defeat');
  card.classList.add(winnerSide === 'left' ? 'side-left' : 'side-right');
  card.classList.add(isLocalWin ? 'result-victory' : 'result-defeat');

  document.getElementById('victory-trophy').textContent = isLocalWin ? '\uD83C\uDFC6' : '\uD83D\uDC94';

  document.getElementById('victory-title').textContent = isLocalWin
    ? (S.mode === 'player' ? `${winner.name} Wins!` : 'Victory!')
    : 'Defeat \u2014 You Lost';

  document.getElementById('victory-tagline').textContent = pickEncouragingTagline(isLocalWin, acc, winner.name);

  document.getElementById('victory-gif').src = VICTORY_GIFS[winnerSide] || '';
  document.getElementById('victory-gif').alt = `${winner.name} celebration`;
  document.getElementById('victory-correct').textContent = statsPlayer.correct;
  document.getElementById('victory-accuracy').textContent = acc + '%';
  document.getElementById('victory-time').textContent = totalTime;
  document.getElementById('victory-xp').textContent = '+' + xp;

  document.getElementById('victory-play-again-btn').classList.toggle('hidden', S.mode === 'online');

  requestAnimationFrame(function () {
    overlay.classList.add('active');
    if (isLocalWin) spawnFireworks();
  });
}

/* ---------------------------------------------------------
   8. ROBOT AI
--------------------------------------------------------- */
// Extra "reading + solving" time on top of the difficulty profile's base
// delay, scaled to how hard THIS particular question actually is — more
// digits in the answer and a higher class tier both mean more time,
// regardless of which difficulty tier the robot is set to. This keeps the
// difficulty selector meaningful (a "Hard" bot on Class 10 trig still
// takes noticeably longer per question than the same bot on Class 4
// addition) instead of always answering at a flat difficulty-only speed.
function questionComplexityDelay(question, cls) {
  const digits = String(Math.abs(question.answer)).length;
  const tier = tierOf(cls); // 1..4
  return (digits - 1) * 450 + (tier - 1) * 350;
}

function scheduleRobot() {
  if (S.over || S.mode !== 'robot') return;
  const profile = BOT_PROFILES[S.botDifficulty];
  document.getElementById('thinking-indicator').classList.remove('hidden');
  const base = randInt(profile.min, profile.max);
  const delay = base + questionComplexityDelay(S.right.question, S.cls);
  S.right.timer = setTimeout(function () { robotAnswer(profile); }, delay);
}

function robotAnswer(profile) {
  if (S.over) return;
  document.getElementById('thinking-indicator').classList.add('hidden');
  const makesMistake = Math.random() < profile.mistake;
  const correctVal = S.right.question.answer;
  const shownVal = makesMistake ? Math.max(0, correctVal + (Math.random() < 0.5 ? -1 : 1) * randInt(1, 3)) : correctVal;
  const digits = String(shownVal).split('');
  let i = 0;
  S.right.input = '';
  // Slower, more human-paced digit-by-digit typing (was 150ms/digit with a
  // 260ms pause before submitting) — the robot visibly "types" its answer
  // instead of stamping it out instantly.
  const typer = setInterval(function () {
    if (S.over) { clearInterval(typer); return; }
    S.right.input = digits.slice(0, i + 1).join('');
    document.getElementById('right-answer-display').innerHTML = S.right.input;
    i++;
    if (i >= digits.length) {
      clearInterval(typer);
      S.right.timer = setTimeout(function () {
        if (S.over) return;
        submitAnswer('right');
        if (!S.over) scheduleRobot();
      }, 500);
    }
  }, 260);
}

/* ---------------------------------------------------------
   9. VICTORY OVERLAY EFFECTS
--------------------------------------------------------- */
function spawnFireworks() {
  const layer = document.getElementById('victory-confetti');
  const colors = ['#6C4CF1', '#22C1DC', '#FF5D73', '#F5B93D', '#22C55E'];
  for (let i = 0; i < 40; i++) {
    const bit = document.createElement('div');
    bit.className = 'firework-bit';
    bit.style.left = (30 + Math.random() * 40) + '%';
    bit.style.top = (20 + Math.random() * 30) + '%';
    bit.style.background = pick(colors);
    bit.style.setProperty('--fx', (randInt(-120, 120)) + 'px');
    bit.style.setProperty('--fy', (randInt(-120, 120)) + 'px');
    bit.style.animationDelay = (Math.random() * 0.4) + 's';
    layer.appendChild(bit);
    setTimeout(() => bit.remove(), 1400);
  }
}

/* ---------------------------------------------------------
   10. FULLSCREEN CONTROL
   ---------------------------------------------------------
   A single toggle wired to both the global control cluster and the
   in-arena shortcut button. Uses the standard Fullscreen API with the
   webkit-prefixed fallback for older Safari, and keeps every button's
   icon in sync via the fullscreenchange event (so it stays correct even
   if the user exits with Esc instead of the button).
--------------------------------------------------------- */
function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}
function toggleFullscreen() {
  const el = document.documentElement;
  if (!isFullscreen()) {
    (el.requestFullscreen || el.webkitRequestFullscreen || function () { }).call(el);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen || function () { }).call(document);
  }
}
function syncFullscreenIcons() {
  const fs = isFullscreen();
  const icon = fs ? '⤡' : '⛶';
  const label = fs ? 'Exit fullscreen' : 'Fullscreen';
  ['fullscreen-btn', 'arena-fullscreen-btn'].forEach(function (id) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.textContent = icon;
    btn.title = label;
    btn.setAttribute('aria-label', label);
  });
}

/* ---------------------------------------------------------
   11. ONLINE MULTIPLAYER (Firebase Realtime Database)
   ---------------------------------------------------------
   Two devices sync a match through a `rooms/{code}` record. Each device
   only ever writes its OWN side's score/combo/question text, plus a
   signed delta to a shared `position` field via a transaction (so
   simultaneous pulls from both devices combine correctly instead of
   racing). Every device also listens to the whole room and mirrors the
   opponent's fields + the authoritative position into its local S, then
   re-runs the normal renderAll()/checkWin() — so the rest of the game
   engine (rope pull, victory, scoring) doesn't need to know networking
   is involved at all.
--------------------------------------------------------- */
let db = null;
try {
  if (typeof firebase !== 'undefined' && typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY') {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.database();
  }
} catch (e) {
  console.warn('Firebase init failed — VS Online will be disabled until firebase-config.js is set up.', e);
}
function firebaseReady() { return !!db; }

function makeRoomCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — easier to read aloud
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[randInt(0, chars.length - 1)];
  return code;
}

function showOnlineTab(tab) {
  document.querySelectorAll('.online-tab').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); });
  document.getElementById('online-host-panel').classList.toggle('hidden', tab !== 'host');
  document.getElementById('online-join-panel').classList.toggle('hidden', tab !== 'join');
  document.getElementById('online-waiting-panel').classList.add('hidden');
  if (tab !== 'join') resetJoinPreview();
}
function showWaitingPanel(code) {
  document.getElementById('online-host-panel').classList.add('hidden');
  document.getElementById('online-join-panel').classList.add('hidden');
  document.getElementById('online-waiting-panel').classList.remove('hidden');
  document.getElementById('room-code-display').textContent = code;
}
function showOnlineError(msg) {
  const el = document.getElementById('online-error-text');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideOnlineError() {
  document.getElementById('online-error-text').classList.add('hidden');
}

async function createRoom() {
  hideOnlineError();
  if (!firebaseReady()) { showOnlineError('Online play isn\u2019t set up yet \u2014 see firebase-config.js for a 3-minute setup.'); return; }
  const name = (document.getElementById('name-online-host').value || 'Player 1').trim().slice(0, 14) || 'Player 1';
  const code = makeRoomCode();
  const roomRef = db.ref('rooms/' + code);

  try {
    await roomRef.set({
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      cls: S.cls,
      category: S.category,
      status: 'waiting',
      position: 50,
      left: { name: name, connected: true, score: 0, combo: 0, correct: 0, wrong: 0, questionText: '' },
      right: { name: '', connected: false, score: 0, combo: 0, correct: 0, wrong: 0, questionText: '' },
    });
    S.onlineSide = 'left';
    S.roomCode = code;
    S.left.name = name;
    S.onlineStarted = false;
    roomRef.child('left/connected').onDisconnect().set(false);
    showWaitingPanel(code);
    listenRoom(code);
  } catch (err) {
    showOnlineError('Could not create room: ' + err.message);
  }
}

// Room codes are invitations to someone else's already-configured battle,
// so we never assume a class/topic here — we look the room up first and
// show the player exactly what they're being invited into.
let pendingJoin = null; // { code, name } once a valid, still-waiting room is found

async function joinRoom() {
  hideOnlineError();
  if (!firebaseReady()) { showOnlineError('Online play isn\u2019t set up yet \u2014 see firebase-config.js for a 3-minute setup.'); return; }
  const name = (document.getElementById('name-online-join').value || 'Player 2').trim().slice(0, 14) || 'Player 2';
  const code = (document.getElementById('join-code-input').value || '').trim().toUpperCase();
  if (!code) { showOnlineError('Enter a room code.'); return; }

  const roomRef = db.ref('rooms/' + code);
  try {
    const snap = await roomRef.get();
    if (!snap.exists()) { showOnlineError('No room found with that code.'); return; }
    const data = snap.val();
    if (data.status !== 'waiting') { showOnlineError('That match already started or ended.'); return; }

    pendingJoin = { code, name };
    showJoinPreview(data);
  } catch (err) {
    showOnlineError('Could not look up room: ' + err.message);
  }
}

// Renders the friend's actual battle details — class, topic, and the
// difficulty tied to that class (see CLASS_META) — instead of any fixed
// placeholder, then swaps the code-entry fields out for a confirm step.
function showJoinPreview(data) {
  const catMeta = CATEGORY_META[data.category];
  const clsDiff = (CLASS_META[data.cls] && CLASS_META[data.cls].diff) || 'medium';

  document.getElementById('preview-class-num').textContent = data.cls;
  document.getElementById('preview-topic-name').textContent = catMeta ? catMeta.name : data.category;
  const badge = document.getElementById('preview-diff-badge');
  badge.textContent = DIFF_LABEL[clsDiff] || clsDiff;
  badge.className = 'diff-badge ' + clsDiff;

  document.getElementById('online-join-fields').classList.add('hidden');
  document.getElementById('online-join-preview').classList.remove('hidden');
}

function resetJoinPreview() {
  pendingJoin = null;
  const preview = document.getElementById('online-join-preview');
  if (preview) preview.classList.add('hidden');
  const fields = document.getElementById('online-join-fields');
  if (fields) fields.classList.remove('hidden');
}

async function confirmJoin() {
  if (!pendingJoin) return;
  const { code, name } = pendingJoin;
  const roomRef = db.ref('rooms/' + code);
  try {
    const snap = await roomRef.get();
    if (!snap.exists()) { showOnlineError('That room no longer exists.'); resetJoinPreview(); return; }
    const data = snap.val();
    if (data.status !== 'waiting') { showOnlineError('That match already started or ended.'); resetJoinPreview(); return; }

    await roomRef.update({
      status: 'playing',
      matchStartTs: firebase.database.ServerValue.TIMESTAMP,
      right: { name: name, connected: true, score: 0, combo: 0, correct: 0, wrong: 0, questionText: '' },
    });

    S.onlineSide = 'right';
    S.roomCode = code;
    S.cls = data.cls;
    S.category = data.category;
    S.right.name = name;
    S.onlineStarted = false;
    roomRef.child('right/connected').onDisconnect().set(false);
    listenRoom(code);
  } catch (err) {
    showOnlineError('Could not join room: ' + err.message);
    resetJoinPreview();
  }
}

function listenRoom(code) {
  leaveOnlineRoom(); // detach any previous listener first
  const roomRef = db.ref('rooms/' + code);
  S.onlineListenerRef = roomRef;

  roomRef.on('value', function (snap) {
    const data = snap.val();
    if (!data) return; // room was removed

    if (S.onlineSide === 'left' && !S.onlineStarted) {
      document.getElementById('online-status-text').textContent =
        (data.right && data.right.connected) ? `${data.right.name} joined \u2014 starting\u2026` : 'Waiting for opponent to join\u2026';
    }

    if (data.status === 'playing' && !S.onlineStarted) {
      S.mode = 'online';
      S.onlineStarted = true;
      S.cls = data.cls;
      S.category = data.category;
      // Pull the opponent's real name in before the panels first render,
      // otherwise startMatch() would fall back to the placeholder default.
      const opp0 = S.onlineSide === 'left' ? 'right' : 'left';
      if (data[opp0] && data[opp0].name) S[opp0].name = data[opp0].name;
      startMatch();
      return; // next snapshot will carry live values to sync against
    }

    // Match-end is authoritative and shared: the room's status/winner were
    // written atomically by pushPositionDelta()'s transaction. Both devices
    // receive this same snapshot and both end the match here, together,
    // instead of each deciding independently from local state.
    if (data.status === 'ended' && S.onlineStarted && !S.over) {
      if (typeof data.position === 'number') S.position = data.position;
      renderAll();
      endMatch(data.winner === 'right' ? 'right' : 'left');
      return;
    }

    if (data.status === 'playing' && S.onlineStarted && !S.over) {
      const opp = S.onlineSide === 'left' ? 'right' : 'left';
      if (data[opp]) {
        S[opp].score = data[opp].score || 0;
        S[opp].combo = data[opp].combo || 0;
        S[opp].correct = data[opp].correct || 0;
        S[opp].wrong = data[opp].wrong || 0;
        if (data[opp].name && data[opp].name !== S[opp].name) {
          S[opp].name = data[opp].name;
          // renderAll() only touches score/combo/question spans — the name
          // fields are <input>s set once in startMatch(), so refresh it here.
          document.getElementById(opp + '-name').value = data[opp].name;
        }
        if (data[opp].questionText) {
          S[opp].question = S[opp].question || { text: '', answer: 0 };
          S[opp].question.text = data[opp].questionText;
        }
      }
      if (typeof data.position === 'number') S.position = data.position;
      renderAll();
      checkWin();
    }
  });
}

function pushPositionDelta(delta) {
  if (!S.roomCode || !db) return;
  // Transact on the WHOLE room (not just /position) so that reading
  // status, computing the new position, and — if this delta crosses a
  // finish line — writing status:'ended' + winner all happen as one
  // atomic, serialized operation. Firebase retries this function with
  // the latest server data on conflict, so if both players answer at the
  // exact same moment, one of the two transactions always runs second,
  // sees the up-to-date position, and either combines cleanly or sees
  // status already 'ended' and backs off — the match can never end
  // differently (or at a different time) for the two devices.
  db.ref('rooms/' + S.roomCode).transaction(function (room) {
    if (!room) return room; // room not loaded yet on the server — abort, try again next answer
    if (room.status === 'ended') return; // match already decided — ignore this stray delta entirely

    const base = (typeof room.position === 'number') ? room.position : 50;
    const next = Math.max(0, Math.min(100, base + delta));
    room.position = next;

    if (next <= LEFT_FINISH) {
      room.status = 'ended';
      room.winner = 'left';
      room.endedAt = Date.now();
    } else if (next >= RIGHT_FINISH) {
      room.status = 'ended';
      room.winner = 'right';
      room.endedAt = Date.now();
    }
    return room;
  });
}

function pushOwnStatsToRoom() {
  if (!S.roomCode || !db || !S.onlineSide) return;
  const p = S[S.onlineSide];
  db.ref('rooms/' + S.roomCode + '/' + S.onlineSide).update({
    score: p.score, combo: p.combo, correct: p.correct, wrong: p.wrong,
    questionText: p.question ? p.question.text : '',
  });
}

function leaveOnlineRoom() {
  if (S.onlineListenerRef) {
    S.onlineListenerRef.off('value');
    S.onlineListenerRef = null;
  }
}

function exitOnlineMatch() {
  if (S.roomCode && db && S.onlineSide) {
    db.ref('rooms/' + S.roomCode + '/' + S.onlineSide + '/connected').set(false).catch(function () { });
  }
  leaveOnlineRoom();
  S.roomCode = null;
  S.onlineSide = null;
  S.onlineStarted = false;
}

/* ---------------------------------------------------------
   12. BOOTSTRAP
--------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {

  // floating symbols on landing
  const symbols = ['+', '\u2212', '\u00D7', '\u00F7', '=', '\u03C0', '\u221A', '%'];
  const symLayer = document.getElementById('floating-symbols');
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('span');
    s.className = 'float-sym';
    s.textContent = pick(symbols);
    s.style.left = Math.random() * 100 + '%';
    s.style.fontSize = (20 + Math.random() * 34) + 'px';
    s.style.animationDuration = (10 + Math.random() * 10) + 's';
    s.style.animationDelay = (Math.random() * 10) + 's';
    symLayer.appendChild(s);
  }

  /* ---- sound effects preference (persisted) ---- */
  const sfxBtn = document.getElementById('mute-btn');

  let sfxMuted = false;
  try {
    const savedSfx = localStorage.getItem('mta_sfx_muted');
    if (savedSfx !== null) sfxMuted = savedSfx === 'true';
  } catch (e) { /* localStorage unavailable — fall back to defaults */ }

  Audio2.setMuted(sfxMuted);

  function refreshSfxBtn() {
    sfxBtn.textContent = sfxMuted ? '🔇' : '🔊';
    sfxBtn.title = sfxMuted ? 'Unmute sound effects' : 'Mute sound effects';
    sfxBtn.classList.toggle('off', sfxMuted);
  }
  refreshSfxBtn();

  sfxBtn.addEventListener('click', function () {
    sfxMuted = !sfxMuted;
    Audio2.setMuted(sfxMuted);
    try { localStorage.setItem('mta_sfx_muted', String(sfxMuted)); } catch (e) { }
    refreshSfxBtn();
    if (!sfxMuted) Audio2.click();
  });

  // The AudioContext can only resume after a user gesture (browser
  // autoplay policy) — prime it on the very first tap/keypress so sound
  // effects play reliably right away.
  function primeAudioOnce() {
    resumeSharedCtx();
    document.removeEventListener('pointerdown', primeAudioOnce);
    document.removeEventListener('keydown', primeAudioOnce);
  }
  document.addEventListener('pointerdown', primeAudioOnce, { once: true });
  document.addEventListener('keydown', primeAudioOnce, { once: true });

  /* ---- fullscreen ---- */
  document.getElementById('fullscreen-btn').addEventListener('click', function () {
    Audio2.click();
    toggleFullscreen();
  });
  document.getElementById('arena-fullscreen-btn').addEventListener('click', function () {
    Audio2.click();
    toggleFullscreen();
  });
  document.addEventListener('fullscreenchange', syncFullscreenIcons);
  document.addEventListener('webkitfullscreenchange', syncFullscreenIcons);
  syncFullscreenIcons();

  // landing -> class
  document.getElementById('play-btn').addEventListener('click', function (e) {
    e.preventDefault();
    Audio2.click();
    renderClassGrid();
    showScreen('class');
  });

  // landing -> straight into VS Online (skips class/category — a joined
  // room inherits its class/category from whoever hosted it, so there is
  // nothing real to show yet. We deliberately do NOT stamp a placeholder
  // like "Class 4 - Addition" here: that class/topic isn't known until
  // the friend's room code is actually looked up, and showing a fixed
  // guess would just be wrong for anyone joining a different battle.
  document.getElementById('join-battle-btn').addEventListener('click', function (e) {
    e.preventDefault();
    Audio2.click();
    resetModeScreen();
    document.getElementById('mode-online').classList.add('selected');
    document.getElementById('online-config').classList.remove('hidden');
    document.getElementById('mode-sub').textContent = `Enter your friend\u2019s room code to see their battle\u2019s class, topic & difficulty`;
    showOnlineTab('join');
    showScreen('mode');
  });

  // back buttons
  document.querySelectorAll('.back-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { Audio2.click(); goBack(); });
  });

  // mode selection
  document.getElementById('mode-robot').addEventListener('click', function () {
    Audio2.click();
    resetModeScreen();
    this.classList.add('selected');
    document.getElementById('robot-config').classList.remove('hidden');
  });
  document.getElementById('mode-player').addEventListener('click', function () {
    Audio2.click();
    resetModeScreen();
    this.classList.add('selected');
    document.getElementById('player-config').classList.remove('hidden');
  });
  document.getElementById('mode-online').addEventListener('click', function () {
    Audio2.click();
    resetModeScreen();
    this.classList.add('selected');
    document.getElementById('online-config').classList.remove('hidden');
  });

  // VS Online: host/join tabs + actions
  document.getElementById('online-tabs').addEventListener('click', function (e) {
    const btn = e.target.closest('.online-tab'); if (!btn) return;
    Audio2.click();
    hideOnlineError();
    showOnlineTab(btn.dataset.tab);
  });
  document.getElementById('create-room-btn').addEventListener('click', function () { Audio2.click(); createRoom(); });
  document.getElementById('join-room-btn').addEventListener('click', function () { Audio2.click(); joinRoom(); });
  document.getElementById('confirm-join-btn').addEventListener('click', function () { Audio2.click(); confirmJoin(); });
  document.getElementById('cancel-join-preview-btn').addEventListener('click', function () { Audio2.click(); hideOnlineError(); resetJoinPreview(); });
  document.getElementById('cancel-room-btn').addEventListener('click', function () {
    Audio2.click();
    if (S.roomCode && db) db.ref('rooms/' + S.roomCode).remove().catch(function () { });
    exitOnlineMatch();
    showOnlineTab('host');
  });
  document.getElementById('copy-code-btn').addEventListener('click', function () {
    const code = document.getElementById('room-code-display').textContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(function () {
        const btn = document.getElementById('copy-code-btn');
        const prevText = btn.textContent;
        btn.textContent = '\u2705 Copied!';
        setTimeout(function () { btn.textContent = prevText; }, 1400);
      }).catch(function () { });
    }
  });

  document.getElementById('difficulty-row').addEventListener('click', function (e) {
    const btn = e.target.closest('.diff-pill'); if (!btn) return;
    document.querySelectorAll('.diff-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    S.botDifficulty = btn.dataset.diff;
  });

  document.getElementById('start-robot-btn').addEventListener('click', function () {
    S.mode = 'robot';
    S.left.name = (document.getElementById('name-solo').value || 'Player 1').trim().slice(0, 14) || 'Player 1';
    S.right.name = 'ROBOT';
    startMatch();
  });
  document.getElementById('start-player-btn').addEventListener('click', function () {
    S.mode = 'player';
    S.left.name = (document.getElementById('name-p1').value || 'Player 1').trim().slice(0, 14) || 'Player 1';
    S.right.name = (document.getElementById('name-p2').value || 'Player 2').trim().slice(0, 14) || 'Player 2';
    startMatch();
  });

  // keypads
  wireKeypad('left-keypad', 'left');
  wireKeypad('right-keypad', 'right');

  // physical keyboard support (non-touch devices) — controls left panel only
  const isTouch = matchMedia('(pointer:coarse)').matches;
  if (!isTouch) {
    document.addEventListener('keydown', function (e) {
      if (S.over) return;
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT')) return; // don't hijack name fields
      const controlSide = S.mode === 'online' ? S.onlineSide : 'left';
      if (!controlSide) return;
      if (/^[0-9]$/.test(e.key)) handleKey(controlSide, e.key);
      else if (e.key === 'Backspace') handleKey(controlSide, 'c');
      else if (e.key === 'Enter') handleKey(controlSide, 'ok');
    });
  }

  // quit button
  document.getElementById('quit-btn').addEventListener('click', function () {
    if (confirm('Quit this match?')) {
      clearTimeout(S.right.timer); clearInterval(S.matchTimerHandle);
      if (S.mode === 'online') exitOnlineMatch();
      document.getElementById('victory-overlay').classList.remove('active');
      renderClassGrid();
      resetNavTo('class', ['landing']);
    }
  });

  // victory overlay actions — everything stays on the game screen
  document.getElementById('victory-play-again-btn').addEventListener('click', function () {
    Audio2.click();
    document.getElementById('victory-overlay').classList.remove('active');
    startMatch();
  });
  document.getElementById('victory-home-btn').addEventListener('click', function () {
    Audio2.click();
    if (S.mode === 'online') exitOnlineMatch();
    document.getElementById('victory-overlay').classList.remove('active');
    resetNavTo('landing', []);
  });
  document.getElementById('victory-another-btn').addEventListener('click', function () {
    Audio2.click();
    if (S.mode === 'online') exitOnlineMatch();
    document.getElementById('victory-overlay').classList.remove('active');
    renderClassGrid();
    resetNavTo('class', ['landing']);
  });

});