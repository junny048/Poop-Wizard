const el = (id) => document.getElementById(id);
const startScreen = el("startScreen");
const authId = el("authId");
const authPassword = el("authPassword");
const authGate = el("authGate");
const loginForm = el("loginForm");
const authGateText = el("authGateText");
const chooseLoginBtn = el("chooseLoginBtn");
const openSignupBtn = el("openSignupBtn");
const backAuthBtn = el("backAuthBtn");
const authStatus = el("authStatus");
const signupModal = el("signupModal");
const signupId = el("signupId");
const signupPassword = el("signupPassword");
const signupUsername = el("signupUsername");
const signupSubmitBtn = el("signupSubmitBtn");
const signupCancelBtn = el("signupCancelBtn");
const startLeaderboard = el("startLeaderboard");
const startSubtitle = el("startSubtitle");
const authTitle = el("authTitle");
const startRankTitle = el("startRankTitle");
const loginBtn = el("loginBtn");
const logoutBtn = el("logoutBtn");
const logoutRow = el("logoutRow");
const authUserStatus = el("authUserStatus");
const startTabOnline = el("startTabOnline");
const panelTabOnline = el("panelTabOnline");
const startGameBtn = el("startGameBtn");
const langToggle = el("langToggle");
const leaderboardTitle = el("leaderboardTitle");
const leaderboardContent = el("leaderboardContent");
const userIdText = el("userIdText");
const hud = el("hud");
const hpText = el("hpText");
const hpFill = el("hpFill");
const skillBar = el("skillBar");
const levelup = el("levelup");
const choices = el("choices");
const canvas = el("game");
const ctx = canvas.getContext("2d");

const I18N = {
  en: { startSubtitle: "Top-down survival stage battle", authTitle: "Login", rank: "Online Leaderboard", start: "Start Game", signup: "Sign Up", login: "Login", needCfg: "Fill firebase-config.js", okOnline: "Online ready", fail: "Auth failed", loginOk: "Login success", signupOk: "Sign up success", user: "User", leaderboard: "Leaderboard", stage: "Stage", wave: "Wave", level: "Level", score: "Score", best: "Best", hp: "HP", paused: "Paused", resume: "Press ESC to resume", gameOver: "Game Over", restart: "Press F5 to restart" },
  ko: { startSubtitle: "탑다운 생존 스테이지 배틀", authTitle: "로그인 / 회원가입", rank: "온라인 랭킹", start: "게임 시작", signup: "회원가입", login: "로그인", needCfg: "firebase-config.js 설정 필요", okOnline: "온라인 사용 가능", fail: "인증 실패", loginOk: "로그인 완료", signupOk: "회원가입 완료", user: "유저", leaderboard: "랭킹", stage: "스테이지", wave: "웨이브", level: "레벨", score: "점수", best: "최고", hp: "체력", paused: "일시정지", resume: "ESC를 눌러 계속", gameOver: "게임 오버", restart: "F5로 다시 시작" },
};

const state = { lang: "en", started: false, paused: false, levelup: false, gameOver: false, stage: 1, wave: 1, score: 0, scoreSaved: false };
const player = { x: 0, y: 0, r: 14, hp: 100, maxHp: 100, speed: 280, level: 1, exp: 0, expNeed: 24, damage: 10, atkCd: 0, atkInt: 0.45 };
const input = { w: false, a: false, s: false, d: false };
const mouse = { x: 0, y: 0 };
const enemies = [];
const bullets = [];
const enemyBullets = [];
const dangerZones = [];
const stageGimmicks = [];
const portal = { on: false, x: 0, y: 0, r: 30 };
const unlockedSkills = [];
const skillState = { 1: 0, 2: 0, 3: 0, 4: 0 };
const effects = { slowUntil: 0 };
let nextEnemySlot = 0;
const BOSS_NAMES = ["King Caca", "Sewer Prophet", "Doom Nugget"];
const poopShotImg = new Image();
let poopShotReady = false;
poopShotImg.onload = () => { poopShotReady = true; };
poopShotImg.src = "assets/images/poop-shot.svg";

let firebaseReady = false;
let auth = null;
let db = null;
let me = null;
let onlineScores = [];
let authBusy = false;

function setMoveKey(key, pressed) {
  if (!key) return;
  const k = key.toLowerCase();
  if (k === "w" || k === "arrowup") input.w = pressed;
  if (k === "a" || k === "arrowleft") input.a = pressed;
  if (k === "s" || k === "arrowdown") input.s = pressed;
  if (k === "d" || k === "arrowright") input.d = pressed;
}

function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener("resize", resize); resize();

function t(k) { return I18N[state.lang][k] || k; }
function setAuthStatus(msg, err = false) { authStatus.textContent = msg; authStatus.style.color = err ? "#ff9f9f" : "#bff5c9"; }
function toEmail(id) { return `${id}@poopwizard.local`; }
function normalizeId(id) { return id.trim().toLowerCase(); }
function normalizeUsernameKey(name) { return name.trim().toLowerCase(); }
function isValidId(id) { return /^[a-z0-9._-]{4,24}$/.test(id); }
function isValidPassword(pw) { return pw.length >= 6; }
function isValidUsername(name) { return name.length >= 2 && name.length <= 20; }
function authErrorText(err) {
  const code = err?.code || "";
  if (code === "auth/email-already-in-use") return "ID already exists";
  if (code === "auth/invalid-email") return "ID format is invalid (a-z, 0-9, . _ -)";
  if (code === "auth/weak-password") return "Password must be at least 6 characters";
  if (code === "auth/user-not-found") return "Account not found";
  if (code === "auth/wrong-password" || code === "auth/invalid-credential") return "Wrong ID or password";
  if (code === "auth/network-request-failed") return "Network error. Check internet and retry";
  if (code === "already-exists") return "Username already exists";
  const msg = err?.message ? `: ${err.message}` : "";
  return `Auth failed (${code || "unknown"})${msg}`;
}
function setAuthBusy(v) {
  authBusy = v;
  if (chooseLoginBtn) chooseLoginBtn.disabled = v;
  if (openSignupBtn) openSignupBtn.disabled = v;
  if (signupSubmitBtn) signupSubmitBtn.disabled = v;
  if (loginBtn) loginBtn.disabled = v;
  if (backAuthBtn) backAuthBtn.disabled = v;
}
function welcomeText(username) {
  return state.lang === "en"
    ? `Login complete! Welcome, ${username}. Press Start Game.`
    : `로그인 완료! ${username}님 환영합니다. Start Game을 눌러주세요.`;
}
function updateStartAvailability() {
  const canStart = !!me;
  if (startGameBtn) {
    startGameBtn.disabled = !canStart;
    startGameBtn.classList.toggle("hidden", !canStart);
    startGameBtn.title = canStart ? "" : (state.lang === "en" ? "Login required" : "로그인 필요");
  }
  if (logoutRow) logoutRow.classList.toggle("hidden", !canStart);
}
function onAuthReadyToPlay(username) {
  setAuthStatus(welcomeText(username));
  if (!state.started) {
    showAuthGate();
    startGameBtn.focus();
  }
  updateStartAvailability();
}
function animatePanel(node) {
  if (!node) return;
  node.classList.remove("panelFlash");
  void node.offsetWidth;
  node.classList.add("panelFlash");
}
function showAuthGate() {
  loginForm.classList.add("hidden");
  authGate.classList.remove("hidden");
  animatePanel(authGate);
}
function showLoginForm() {
  authGate.classList.add("hidden");
  loginForm.classList.remove("hidden");
  animatePanel(loginForm);
  authId.focus();
}
function openSignupModal() {
  signupModal.classList.remove("hidden");
  animatePanel(el("signupCard"));
  signupId.focus();
}
function bindPulseEffects() {
  document.querySelectorAll("[data-pulse]").forEach((node) => {
    node.addEventListener("click", () => {
      node.classList.remove("pulseActive");
      void node.offsetWidth;
      node.classList.add("pulseActive");
      setTimeout(() => node.classList.remove("pulseActive"), 180);
    });
  });
}
function dispUser() { return me?.username || "-"; }
function normalizeLeaderboardRows(rows) {
  const byUser = new Map();
  for (const r of rows || []) {
    const userId = String(r.userId || "legacy");
    const score = Number(r.score || 0);
    const stage = Number(r.stage || 1);
    const level = Number(r.level || 1);
    const at = Number(r.at || r.updatedAt || Date.now());
    const prev = byUser.get(userId);
    if (!prev || score > prev.score || (score === prev.score && at > prev.at)) {
      byUser.set(userId, { userId, score, stage, level, at });
    }
  }
  return Array.from(byUser.values()).sort((a, b) => b.score - a.score).slice(0, 10);
}
function bestScore() { return onlineScores[0]?.score || 0; }
function dist(a, b, c, d) { return Math.hypot(c - a, d - b); }
function angleNorm(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
function nowSec() { return performance.now() * 0.001; }

const ACTIVE_SKILLS = [
  {
    key: "1",
    name: "Shockwave",
    cd: 7,
    use: () => {
      const radius = 170;
      for (const e of enemies) {
        if (dist(player.x, player.y, e.x, e.y) <= radius + e.r) e.hp -= 120;
      }
      dangerZones.push({ kind: "ringFx", x: player.x, y: player.y, r: 20, maxR: radius, life: 0.28 });
    },
  },
  {
    key: "2",
    name: "Orb Nova",
    cd: 8,
    use: () => {
      const cnt = 16;
      for (let i = 0; i < cnt; i += 1) {
        const ang = (Math.PI * 2 * i) / cnt;
        bullets.push({ x: player.x, y: player.y, vx: Math.cos(ang) * 460, vy: Math.sin(ang) * 460, life: 1.15, r: 4, dmg: player.damage * 1.6 });
      }
    },
  },
  {
    key: "3",
    name: "Meteor",
    cd: 12,
    use: () => {
      dangerZones.push({ kind: "meteor", x: mouse.x, y: mouse.y, r: 68, life: 0.9, arm: 0.9, dmg: player.damage * 8 });
    },
  },
  {
    key: "4",
    name: "Time Slow",
    cd: 16,
    use: () => { effects.slowUntil = nowSec() + 4.8; },
  },
];

function unlockBossSkill() {
  if (unlockedSkills.length >= ACTIVE_SKILLS.length) return;
  const next = ACTIVE_SKILLS[unlockedSkills.length];
  unlockedSkills.push(next);
  setAuthStatus(
    state.lang === "en"
      ? `New skill unlocked: [${next.key}] ${next.name}`
      : `새 스킬 해금: [${next.key}] ${next.name}`,
  );
}

function castSkill(key) {
  const s = unlockedSkills.find((x) => x.key === key);
  if (!s || state.paused || state.levelup || state.gameOver || !state.started) return;
  if (skillState[key] > 0) return;
  s.use();
  skillState[key] = s.cd;
}

function initStageGimmicks() {
  stageGimmicks.length = 0;
  const type = ((state.stage - 1) % 4) + 1;
  const count = 3 + Math.min(3, Math.floor(state.stage / 2));
  for (let i = 0; i < count; i += 1) {
    stageGimmicks.push({
      type,
      x: 90 + Math.random() * (canvas.width - 180),
      y: 110 + Math.random() * (canvas.height - 220),
      r: 44 + Math.random() * 24,
      t: Math.random() * 10,
    });
  }
}

function applyStageGimmicks(dt) {
  for (const g of stageGimmicks) {
    g.t += dt;
    const d = dist(player.x, player.y, g.x, g.y);
    if (g.type === 1) {
      if (d < g.r + player.r) player.hp -= 7.5 * dt;
    } else if (g.type === 2) {
      if (d < g.r + player.r) player.hp -= 5.8 * dt;
    } else if (g.type === 3) {
      if (d < g.r + player.r) player.hp -= (Math.sin(g.t * 7) > 0.65 ? 22 : 0) * dt;
    } else if (g.type === 4) {
      if (d < g.r + player.r) player.hp -= 8.8 * dt;
    }
  }
}

function renderSkillBar() {
  if (!skillBar) return;
  const slots = ACTIVE_SKILLS.map((s) => {
    const unlocked = unlockedSkills.some((u) => u.key === s.key);
    const cd = skillState[s.key] || 0;
    const cdText = cd > 0 ? `<span class="cd">${cd.toFixed(1)}s</span>` : "Ready";
    const label = unlocked ? s.name : "Locked";
    return `<div class="skillSlot ${unlocked ? "" : "locked"}"><span class="k">${s.key}</span>${label}<br>${cdText}</div>`;
  });
  skillBar.innerHTML = slots.join("");
}
addEventListener("keydown", (e) => setMoveKey(e.key, true));
addEventListener("keyup", (e) => setMoveKey(e.key, false));
canvas.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

function updateStartText() {
  startSubtitle.textContent = t("startSubtitle");
  authTitle.textContent = t("authTitle");
  startRankTitle.textContent = t("rank");
  authGateText.textContent = state.lang === "en" ? "Choose an option" : "옵션을 선택하세요";
  chooseLoginBtn.textContent = t("login");
  openSignupBtn.textContent = t("signup");
  backAuthBtn.textContent = state.lang === "en" ? "Back" : "뒤로";
  loginBtn.textContent = t("login");
  startGameBtn.textContent = t("start");
}

function renderRows(rows, target) {
  target.innerHTML = normalizeLeaderboardRows(rows).map((r, i) => `<div class="leaderboard-row"><span>#${i + 1} ${r.userId || "legacy"}</span><span>${r.score}</span></div>`).join("") || `<div class="leaderboard-row"><span>-</span><span>0</span></div>`;
}
function updateTabButtons() {
  if (startTabOnline) startTabOnline.classList.add("active");
  if (panelTabOnline) panelTabOnline.classList.add("active");
}

function renderBoards() {
  leaderboardTitle.textContent = t("rank");
  userIdText.textContent = `${t("user")}: ${dispUser()}`;
  if (authUserStatus) {
    authUserStatus.textContent = me
      ? (state.lang === "en" ? `Welcome, ${me.username}!` : `${me.username}님 환영합니다!`)
      : (state.lang === "en" ? "Not logged in" : "로그인되지 않음");
  }
  updateStartAvailability();
  const pool = onlineScores;
  renderRows(pool, leaderboardContent);
  renderRows(pool, startLeaderboard);
  updateTabButtons();
}

async function loadOnlineScores() {
  if (!firebaseReady) return;
  try {
    const snap = await db.collection("scores").orderBy("score", "desc").limit(20).get();
    onlineScores = normalizeLeaderboardRows(snap.docs.map((d) => d.data()));
    renderBoards();
  } catch {}
}

async function initFirebase() {
  const cfg = window.POOP_WIZARD_FIREBASE_CONFIG;
  if (!window.firebase || !cfg?.apiKey || !cfg?.authDomain || !cfg?.projectId || !cfg?.appId) {
    setAuthStatus(t("needCfg"), true);
    return;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    auth = firebase.auth();
    db = firebase.firestore();
    firebaseReady = true;
    setAuthStatus(t("okOnline"));
    auth.onAuthStateChanged(async (u) => {
      if (!u) { me = null; renderBoards(); return; }
      let username = u.displayName || u.email.split("@")[0];
      try {
        const doc = await db.collection("users").doc(u.uid).get();
        if (doc.exists && doc.data().username) username = doc.data().username;
      } catch {}
      me = { uid: u.uid, username };
      onAuthReadyToPlay(username);
      renderBoards();
    });
    await loadOnlineScores();
  } catch {
    setAuthStatus(t("fail"), true);
  }
}

async function signup() {
  if (!firebaseReady || authBusy) return;
  const id = normalizeId(signupId.value);
  const pw = signupPassword.value.trim();
  const username = signupUsername.value.trim();
  const usernameKey = normalizeUsernameKey(username);
  if (!isValidId(id)) return setAuthStatus("ID must be 4-24 chars (a-z, 0-9, . _ -)", true);
  if (!isValidPassword(pw)) return setAuthStatus("Password must be at least 6 characters", true);
  if (!isValidUsername(username)) return setAuthStatus("Username must be 2-20 characters", true);
  if (usernameKey.includes("/")) return setAuthStatus("Username cannot include /", true);
  try {
    setAuthBusy(true);
    setAuthStatus("Creating account...");
    const cred = await auth.createUserWithEmailAndPassword(toEmail(id), pw);
    try {
      await db.collection("usernames").doc(usernameKey).create({
        uid: cred.user.uid,
        username,
        usernameKey,
        createdAt: Date.now(),
      });
    } catch (nameErr) {
      try { await cred.user.delete(); } catch {}
      try { await auth.signOut(); } catch {}
      throw nameErr;
    }
    try {
      await cred.user.updateProfile({ displayName: username });
    } catch {}
    try {
      await db.collection("users").doc(cred.user.uid).set({ id, username, usernameKey, createdAt: Date.now() }, { merge: true });
    } catch (profileErr) {
      console.warn("profile write failed", profileErr);
    }
    me = { uid: cred.user.uid, username };
    signupModal.classList.add("hidden");
    authId.value = id;
    authPassword.value = "";
    signupId.value = "";
    signupPassword.value = "";
    signupUsername.value = "";
    onAuthReadyToPlay(username);
  } catch (err) {
    console.error("signup failed", err);
    setAuthStatus(authErrorText(err), true);
  } finally {
    setAuthBusy(false);
  }
}
async function login() {
  if (!firebaseReady || authBusy) return;
  const id = normalizeId(authId.value);
  const pw = authPassword.value.trim();
  if (!isValidId(id)) return setAuthStatus("Check ID format (a-z, 0-9, . _ -)", true);
  if (!isValidPassword(pw)) return setAuthStatus("Password must be at least 6 characters", true);
  try {
    setAuthBusy(true);
    setAuthStatus("Logging in...");
    const cred = await auth.signInWithEmailAndPassword(toEmail(id), pw);
    const doc = await db.collection("users").doc(cred.user.uid).get();
    me = { uid: cred.user.uid, username: doc.exists ? doc.data().username : (cred.user.displayName || id) };
    onAuthReadyToPlay(me.username);
  } catch (err) {
    console.error("login failed", err);
    setAuthStatus(authErrorText(err), true);
  } finally {
    setAuthBusy(false);
  }
}

async function logout() {
  if (!firebaseReady || !auth) return;
  try {
    await auth.signOut();
    me = null;
    setAuthStatus(state.lang === "en" ? "Logged out" : "로그아웃됨");
    renderBoards();
  } catch {
    setAuthStatus(t("fail"), true);
  }
}
async function submitOnline() {
  if (!firebaseReady || !me || !db) return;
  try {
    const now = Date.now();
    const scoreRef = db.collection("scores").doc(me.uid);
    const prevDoc = await scoreRef.get();
    const prevScore = prevDoc.exists ? Number(prevDoc.data().score || 0) : 0;
    if (state.score < prevScore) {
      await loadOnlineScores();
      return;
    }
    await scoreRef.set({
      uid: me.uid,
      userId: me.username || dispUser(),
      score: Math.max(0, Math.floor(state.score)),
      stage: Math.max(1, Math.floor(state.stage)),
      level: Math.max(1, Math.floor(player.level)),
      updatedAt: now,
    }, { merge: true });
    await loadOnlineScores();
  } catch {}
}

function saveScoreIfNeeded() {
  if (state.scoreSaved) return;
  state.scoreSaved = true;
  submitOnline();
}

function resetRun() {
  player.x = canvas.width / 2; player.y = canvas.height / 2; player.hp = player.maxHp; player.level = 1; player.exp = 0; player.expNeed = 24;
  player.damage = 10; player.atkInt = 0.45; player.atkCd = 0;
  state.stage = 1; state.wave = 1; state.score = 0; state.gameOver = false; state.scoreSaved = false;
  enemies.length = 0; bullets.length = 0; enemyBullets.length = 0; dangerZones.length = 0; portal.on = false;
  unlockedSkills.length = 0;
  skillState[1] = 0; skillState[2] = 0; skillState[3] = 0; skillState[4] = 0;
  effects.slowUntil = 0;
  nextEnemySlot = 0;
  initStageGimmicks();
  spawnWave();
}

function spawnEnemy(boss = false) {
  const side = Math.floor(Math.random() * 4);
  let x = 0, y = 0;
  if (side === 0) { x = Math.random() * canvas.width; y = -30; }
  if (side === 1) { x = canvas.width + 30; y = Math.random() * canvas.height; }
  if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 30; }
  if (side === 3) { x = -30; y = Math.random() * canvas.height; }
  const phaseScale = 1 + (state.stage - 1) * 0.25;
  const waveScale = 1 + (state.wave - 1) * 0.2;
  const difficultyScale = 1 + (state.stage - 1) * 0.18 + (state.wave - 1) * 0.14;
  const typePool = ["slime", "goblin", "skeleton"];
  const type = boss ? "boss" : typePool[Math.floor(Math.random() * typePool.length)];
  const typeHp = type === "goblin" ? 0.9 : type === "skeleton" ? 1.2 : 1.0;
  const typeSpeed = type === "goblin" ? 1.02 : type === "skeleton" ? 0.94 : 1.0;
  const typeDamage = type === "skeleton" ? 1.2 : type === "goblin" ? 0.95 : 1.0;
  const baseHp = boss ? 1160 * phaseScale * waveScale : 48 * phaseScale * waveScale * typeHp;
  const baseSpeed = boss ? (142 + state.stage * 12 + state.wave * 4) : (132 + state.stage * 9 + state.wave * 5) * typeSpeed;
  const baseDamage = boss ? (26 + state.stage * 5 + state.wave * 2) : (8 + state.stage * 2 + state.wave) * typeDamage;
  const bossVariant = boss ? ((state.stage - 1) % 3) : -1;
  const lane = nextEnemySlot % 6;
  nextEnemySlot += 1;
  enemies.push({
    x, y, boss, type, r: boss ? 44 : 13, hp: baseHp, maxHp: baseHp,
    speed: baseSpeed, damage: baseDamage,
    phase: 1, dashCd: 2.5, ringCd: 3.3, burstCd: 1.9, dashTime: 0, tele: 0, dx: 0, dy: 0,
    atkCd: type === "skeleton" ? 1.1 : 0.9,
    dashPrep: 0,
    chargeDirX: 0,
    chargeDirY: 0,
    bossVariant,
    lane,
    laneSwapCd: 0.7 + Math.random() * 1.4,
    routeAngle: Math.random() * Math.PI * 2,
    spiral: Math.random() * Math.PI * 2,
    fanCd: 2.6,
    summonCd: 8.5,
    diff: difficultyScale,
  });
}
function spawnWave() {
  if (state.wave === 5) return spawnEnemy(true);
  const n = 8 + state.wave * 4 + (state.stage - 1) * 3;
  for (let i = 0; i < n; i += 1) spawnEnemy(false);
}

function startGame() {
  if (!me) {
    setAuthStatus(state.lang === "en" ? "Please login first." : "먼저 로그인해주세요.", true);
    showLoginForm();
    return;
  }
  state.started = true;
  startScreen.classList.add("hidden");
  resetRun();
}

function shoot() {
  const a = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(a) * 520,
    vy: Math.sin(a) * 520,
    life: 1.3,
    r: 6,
    dmg: player.damage,
    rot: Math.random() * Math.PI * 2,
  });
}

function levelUpCheck(exp) {
  player.exp += exp;
  if (player.exp < player.expNeed) return;
  player.exp -= player.expNeed; player.expNeed = Math.floor(player.expNeed * 1.22 + 8); player.level += 1;
  state.levelup = true; levelup.classList.remove("hidden"); choices.innerHTML = "";
  const pool = [
    { name: "Damage +7", desc: "Basic attack damage up", apply: () => { player.damage += 7; } },
    { name: "Attack Speed +", desc: "Faster auto attack", apply: () => { player.atkInt = Math.max(0.1, player.atkInt * 0.86); } },
    { name: "Heal +40", desc: "Recover current HP", apply: () => { player.hp = Math.min(player.maxHp, player.hp + 40); } },
    { name: "Max HP +20", desc: "Increase survivability", apply: () => { player.maxHp += 20; player.hp += 20; } },
    { name: "Move Speed +22", desc: "Kite and dodge better", apply: () => { player.speed += 22; } },
    { name: "Shot Size +", desc: "Wider hit radius", apply: () => { bullets.forEach((b) => { b.r += 0.2; }); player.damage += 2; } },
    { name: "Cooldown Cut", desc: "Active skill cooldown -12%", apply: () => { Object.keys(skillState).forEach((k) => { skillState[k] *= 0.88; }); } },
    { name: "Shielded Heart", desc: "Small instant barrier heal", apply: () => { player.hp = Math.min(player.maxHp, player.hp + 24); player.maxHp += 6; } },
  ];
  const picks = [];
  while (picks.length < 3 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(idx, 1)[0]);
  }
  for (const opt of picks) {
    const b = document.createElement("button");
    b.className = "choice";
    b.innerHTML = `<h3>${opt.name}</h3><p>${opt.desc}</p>`;
    b.onclick = () => {
      opt.apply();
      state.levelup = false;
      levelup.classList.add("hidden");
    };
    choices.appendChild(b);
  }
}

function update(dt) {
  if (!state.started || state.gameOver || state.paused || state.levelup) return;
  let dx = 0, dy = 0;
  if (input.w) dy -= 1; if (input.s) dy += 1; if (input.a) dx -= 1; if (input.d) dx += 1;
  const len = Math.hypot(dx, dy) || 1;
  player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x + (dx / len) * player.speed * dt));
  player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y + (dy / len) * player.speed * dt));
  player.atkCd -= dt; if (player.atkCd <= 0) { shoot(); player.atkCd = player.atkInt; }
  Object.keys(skillState).forEach((k) => { skillState[k] = Math.max(0, skillState[k] - dt); });
  applyStageGimmicks(dt);

  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const b = bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.rot = (b.rot || 0) + dt * 8;
    if (b.life <= 0) { bullets.splice(i, 1); continue; }
    for (let j = enemies.length - 1; j >= 0; j -= 1) {
      const e = enemies[j];
      if (dist(b.x, b.y, e.x, e.y) < b.r + e.r) {
        e.hp -= b.dmg; bullets.splice(i, 1);
        if (e.hp <= 0) {
          state.score += e.boss ? 800 : 20;
          levelUpCheck(e.boss ? 20 : 3);
          enemies.splice(j, 1);
          if (e.boss) {
            unlockBossSkill();
            portal.on = true;
            portal.x = canvas.width / 2;
            portal.y = canvas.height / 2;
          }
          else if (enemies.length === 0 && state.wave < 5) { state.wave += 1; spawnWave(); }
        }
        break;
      }
    }
  }

  for (const e of enemies) {
    const baseToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
    const stageScale = 1 + state.stage * 0.05;
    const slowed = nowSec() < effects.slowUntil;
    const slowMul = slowed ? 0.62 : 1;

    if (e.boss) {
      const hpPct = e.hp / e.maxHp;
      const phase = hpPct <= 0.35 ? 3 : hpPct <= 0.7 ? 2 : 1;
      const variant = e.bossVariant;
      e.phase = phase;
      e.dashCd -= dt;
      e.ringCd -= dt;
      e.burstCd -= dt;
      e.fanCd -= dt;
      e.summonCd -= dt;
      e.spiral += dt * (1.3 + phase * 0.32);

      if (e.dashTime > 0) {
        e.dashTime -= dt;
        e.x += e.dx * e.speed * (variant === 0 ? 2.9 : 2.3) * dt * slowMul;
        e.y += e.dy * e.speed * (variant === 0 ? 2.9 : 2.3) * dt * slowMul;
      } else if (e.tele > 0) {
        e.tele -= dt;
      } else {
        const orbit = baseToPlayer + Math.sin(nowSec() * (variant === 2 ? 1.35 : 0.8)) * (variant === 2 ? 0.64 : 0.4);
        e.x += Math.cos(orbit) * e.speed * (variant === 1 ? 0.62 : 0.74) * dt * slowMul;
        e.y += Math.sin(orbit) * e.speed * (variant === 1 ? 0.62 : 0.74) * dt * slowMul;
      }

      if (variant !== 1 && e.dashCd <= 0 && e.dashTime <= 0 && e.tele <= 0) {
        e.tele = Math.max(0.18, 0.4 - phase * 0.05);
        e.dx = Math.cos(baseToPlayer);
        e.dy = Math.sin(baseToPlayer);
        e.dashTime = 0.28 + phase * (variant === 0 ? 0.09 : 0.06);
        e.dashCd = Math.max(variant === 0 ? 0.5 : 0.75, (variant === 0 ? 2.0 : 2.5) - phase * 0.42 - state.stage * 0.09);
        dangerZones.push({ kind: "line", x: e.x, y: e.y, dx: e.dx, dy: e.dy, len: variant === 0 ? 290 : 250, w: 24, life: e.tele, dmg: 0 });
      }

      if (e.ringCd <= 0) {
        const radius = (variant === 1 ? 88 : 95) + phase * 26 + state.stage * 3;
        const windup = Math.max(0.45, 0.86 - phase * 0.1);
        dangerZones.push({ kind: "ring", x: e.x, y: e.y, r: radius, life: windup, arm: windup, dmg: 14 + phase * 5 + state.stage });
        if (variant === 2 || variant === 1) {
          dangerZones.push({ kind: "ring", x: e.x, y: e.y, r: radius + 68, life: windup + 0.15, arm: windup + 0.15, dmg: 10 + phase * 3 + state.stage });
        }
        e.ringCd = Math.max(1.05, 2.9 - phase * 0.45 - state.stage * 0.06);
      }

      if (e.burstCd <= 0) {
        const speed = (176 + phase * 20 + state.stage * 5) * (1 + e.diff * 0.06);
        if (variant === 0) {
          const cnt = 10 + phase * 2;
          for (let k = 0; k < cnt; k += 1) {
            const ang = (Math.PI * 2 * k) / cnt + e.spiral;
            enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, life: 2.8, r: 5, dmg: 8 + phase * 2 + Math.floor(state.stage * 0.75), color: "#ff875e" });
          }
        } else if (variant === 1) {
          const center = baseToPlayer;
          const spread = 0.9;
          const cnt = 7 + phase;
          for (let k = 0; k < cnt; k += 1) {
            const tShot = k / (cnt - 1 || 1);
            const ang = center - spread / 2 + tShot * spread;
            enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(ang) * (speed + 18), vy: Math.sin(ang) * (speed + 18), life: 2.4, r: 5, dmg: 10 + phase * 2, color: "#ffb86c" });
          }
          if (phase >= 2) dangerZones.push({ kind: "meteor", x: player.x, y: player.y, r: 56 + phase * 6, life: 0.85, arm: 0.85, dmg: 22 + phase * 6 });
        } else {
          for (let k = 0; k < 6; k += 1) {
            const ang = e.spiral + (Math.PI * 2 * k) / 6;
            enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(ang) * (speed + 34), vy: Math.sin(ang) * (speed + 34), life: 2.6, r: 6, dmg: 11 + phase * 2, color: "#ff6f6f" });
          }
        }
        e.burstCd = Math.max(0.6, 1.55 - phase * 0.2);
      }

      if (variant !== 0 && e.fanCd <= 0) {
        const pAng = baseToPlayer;
        const fan = variant === 2 ? 7 : 5;
        for (let i = -(fan >> 1); i <= (fan >> 1); i += 1) {
          const ang = pAng + i * (variant === 2 ? 0.14 : 0.18);
          enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(ang) * (228 + phase * 24 + state.wave * 6), vy: Math.sin(ang) * (228 + phase * 24 + state.wave * 6), life: 2.5, r: 4, dmg: 8 + phase, color: "#ffd280" });
        }
        e.fanCd = Math.max(0.78, 2.1 - state.stage * 0.06 - phase * 0.12);
      }

      if (variant === 1 && e.summonCd <= 0) {
        const summonCount = 1 + Math.floor(phase / 2);
        for (let s = 0; s < summonCount; s += 1) spawnEnemy(false);
        e.summonCd = Math.max(5.2, 8.2 - state.stage * 0.18 - phase * 0.5);
      }
    } else {
      e.laneSwapCd -= dt;
      if (e.laneSwapCd <= 0) {
        e.routeAngle += (Math.random() * 1.6 - 0.8);
        e.laneSwapCd = 0.8 + Math.random() * 1.4;
      }
      const playerVelX = ((input.d ? 1 : 0) - (input.a ? 1 : 0)) * player.speed;
      const playerVelY = ((input.s ? 1 : 0) - (input.w ? 1 : 0)) * player.speed;
      const predictT = e.type === "skeleton" ? 0.32 : 0.45;
      const px = player.x + playerVelX * predictT;
      const py = player.y + playerVelY * predictT;
      const laneOffset = (e.lane - 2.5) * 0.46;
      const desiredA = Math.atan2(py - e.y, px - e.x) + laneOffset + Math.sin(e.routeAngle) * 0.26;
      const desiredDist = e.type === "skeleton" ? 190 : e.type === "goblin" ? 62 : 78;
      const tx = px + Math.cos(desiredA + Math.PI) * desiredDist;
      const ty = py + Math.sin(desiredA + Math.PI) * desiredDist;
      const ta = Math.atan2(ty - e.y, tx - e.x);
      const d = dist(e.x, e.y, player.x, player.y);

      if (e.type === "skeleton") {
        e.atkCd -= dt;
        e.x += Math.cos(ta) * e.speed * 0.9 * dt * slowMul;
        e.y += Math.sin(ta) * e.speed * 0.9 * dt * slowMul;
        if (e.atkCd <= 0) {
          const lead = Math.atan2((player.y + playerVelY * 0.15) - e.y, (player.x + playerVelX * 0.15) - e.x);
          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(lead) * (238 + state.stage * 10 + state.wave * 6),
            vy: Math.sin(lead) * (238 + state.stage * 10 + state.wave * 6),
            life: 99,
            persistent: true,
            r: 4,
            dmg: 8 + Math.floor(state.stage * 0.8),
            color: "#d9f2ff",
          });
          e.atkCd = Math.max(0.44, 1.02 - state.stage * 0.04 - state.wave * 0.02);
        }
      } else if (e.type === "goblin") {
        e.atkCd -= dt;
        e.dashPrep -= dt;
        if (e.dashTime > 0) {
          e.dashTime -= dt;
          e.x += e.chargeDirX * e.speed * 2.15 * dt * slowMul;
          e.y += e.chargeDirY * e.speed * 2.15 * dt * slowMul;
        } else if (e.dashPrep > 0) {
          e.x += Math.cos(ta) * e.speed * 0.55 * dt * slowMul;
          e.y += Math.sin(ta) * e.speed * 0.55 * dt * slowMul;
        } else if (d < 240 && e.atkCd <= 0) {
          e.dashPrep = 0.22;
          e.chargeDirX = Math.cos(baseToPlayer);
          e.chargeDirY = Math.sin(baseToPlayer);
          e.dashTime = 0.16;
          e.atkCd = Math.max(0.95, 1.7 - state.stage * 0.03);
          dangerZones.push({ kind: "line", x: e.x, y: e.y, dx: e.chargeDirX, dy: e.chargeDirY, len: 94, w: 14, life: 0.2, dmg: 0 });
        } else {
          e.x += Math.cos(ta) * e.speed * 1.04 * dt * slowMul;
          e.y += Math.sin(ta) * e.speed * 1.04 * dt * slowMul;
        }
      } else {
        e.x += Math.cos(ta) * e.speed * 0.95 * dt * slowMul;
        e.y += Math.sin(ta) * e.speed * 0.95 * dt * slowMul;
      }
    }

    if (dist(player.x, player.y, e.x, e.y) < player.r + e.r) {
      player.hp -= e.damage * dt * (e.boss ? (3.4 * stageScale) : 1.8);
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
    const b = enemyBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (typeof b.life === "number") b.life -= dt;
    if (!b.persistent && b.life <= 0) { enemyBullets.splice(i, 1); continue; }
    const m = 40;
    if (b.x < -m || b.x > canvas.width + m || b.y < -m || b.y > canvas.height + m) { enemyBullets.splice(i, 1); continue; }
    if (dist(b.x, b.y, player.x, player.y) < b.r + player.r) {
      player.hp -= b.dmg;
      enemyBullets.splice(i, 1);
    }
  }

  for (let i = dangerZones.length - 1; i >= 0; i -= 1) {
    const z = dangerZones[i];
    z.life -= dt;
    if (z.life <= 0) { dangerZones.splice(i, 1); continue; }
    if (z.arm > 0) { z.arm -= dt; continue; }
    if (z.kind === "ring") {
      if (dist(z.x, z.y, player.x, player.y) < z.r + player.r) {
        player.hp -= z.dmg;
        z.arm = 999; // one-shot zone
      }
    } else if (z.kind === "meteor") {
      for (const e of enemies) {
        if (dist(z.x, z.y, e.x, e.y) <= z.r + e.r) e.hp -= z.dmg;
      }
      if (dist(z.x, z.y, player.x, player.y) <= z.r + player.r) player.hp -= Math.max(8, z.dmg * 0.35);
      dangerZones.push({ kind: "ringFx", x: z.x, y: z.y, r: z.r * 0.45, maxR: z.r * 1.2, life: 0.26 });
      z.arm = 999;
    }
  }

  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    if (e.hp > 0) continue;
    state.score += e.boss ? 800 : 20;
    levelUpCheck(e.boss ? 20 : 3);
    enemies.splice(i, 1);
    if (e.boss) {
      unlockBossSkill();
      portal.on = true;
      portal.x = canvas.width / 2;
      portal.y = canvas.height / 2;
    }
  }
  if (enemies.length === 0 && state.wave < 5 && !portal.on) {
    state.wave += 1;
    spawnWave();
  }

  if (player.hp <= 0) { player.hp = 0; state.gameOver = true; }
  if (portal.on && dist(player.x, player.y, portal.x, portal.y) < player.r + portal.r) {
    state.stage += 1;
    state.wave = 1;
    portal.on = false;
    enemies.length = 0;
    enemyBullets.length = 0;
    dangerZones.length = 0;
    initStageGimmicks();
    spawnWave();
  }
}

function draw() {
  function drawWizard() {
    const ang = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(ang);

    // robe
    ctx.fillStyle = "#2d4fa4";
    ctx.beginPath();
    ctx.moveTo(-12, 12);
    ctx.lineTo(12, 12);
    ctx.lineTo(8, -4);
    ctx.lineTo(-8, -4);
    ctx.closePath();
    ctx.fill();

    // hat
    ctx.fillStyle = "#365fc4";
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(10, -4);
    ctx.lineTo(0, -24);
    ctx.closePath();
    ctx.fill();

    // face
    ctx.fillStyle = "#f0d8b6";
    ctx.beginPath();
    ctx.arc(0, 2, 7, 0, Math.PI * 2);
    ctx.fill();

    // staff + gem
    ctx.strokeStyle = "#a7793f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(6, 5);
    ctx.lineTo(17, -6);
    ctx.stroke();
    ctx.fillStyle = "#6de1ff";
    ctx.beginPath();
    ctx.arc(18, -7, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawMonster(e) {
    const ang = Math.atan2(player.y - e.y, player.x - e.x);
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(ang);

    if (e.boss) {
      const variant = e.bossVariant || 0;
      if (variant === 0) {
        ctx.fillStyle = e.phase === 1 ? "#b63e3e" : e.phase === 2 ? "#d24a35" : "#e8592a";
        ctx.beginPath();
        ctx.arc(0, 0, e.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f7c291";
        ctx.beginPath();
        ctx.moveTo(-18, -24); ctx.lineTo(-6, -10); ctx.lineTo(-20, -8); ctx.closePath();
        ctx.moveTo(18, -24); ctx.lineTo(6, -10); ctx.lineTo(20, -8); ctx.closePath();
        ctx.fill();
      } else if (variant === 1) {
        ctx.fillStyle = e.phase === 1 ? "#6f4bc1" : e.phase === 2 ? "#7e56d9" : "#9464f1";
        ctx.beginPath();
        ctx.ellipse(0, 0, e.r + 3, e.r - 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ccb7ff";
        for (let i = 0; i < 6; i += 1) {
          const ang2 = (Math.PI * 2 * i) / 6 + e.spiral;
          ctx.beginPath();
          ctx.arc(Math.cos(ang2) * (e.r - 6), Math.sin(ang2) * (e.r - 6), 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = e.phase === 1 ? "#2f7ea4" : e.phase === 2 ? "#2c95ba" : "#36aed3";
        ctx.beginPath();
        ctx.rect(-e.r, -e.r + 6, e.r * 2, e.r * 1.7);
        ctx.fill();
        ctx.fillStyle = "#9be8ff";
        ctx.fillRect(-14, -8, 28, 6);
      }
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-11, -4, 4.5, 0, Math.PI * 2);
      ctx.arc(11, -4, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1b0b0b";
      ctx.beginPath();
      ctx.arc(-9, -3, 2.2, 0, Math.PI * 2);
      ctx.arc(9, -3, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === "slime") {
      ctx.fillStyle = "#4cae73";
      ctx.beginPath();
      ctx.ellipse(0, 2, e.r + 2, e.r - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(198,255,224,0.55)";
      ctx.beginPath();
      ctx.ellipse(-4, -3, 5, 3, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1f3a28";
      ctx.beginPath();
      ctx.arc(-4, 1, 1.8, 0, Math.PI * 2);
      ctx.arc(4, 1, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === "goblin") {
      ctx.fillStyle = "#7ea23f";
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9bc352";
      ctx.fillRect(-e.r, 2, e.r * 2, e.r - 2);
      ctx.fillStyle = "#e6f0c7";
      ctx.beginPath();
      ctx.arc(-4, -2, 2.2, 0, Math.PI * 2);
      ctx.arc(4, -2, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a3214";
      ctx.fillRect(-1.5, 2, 3, 4);
    } else {
      // skeleton
      ctx.fillStyle = "#d8d8d8";
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2e2e2e";
      ctx.beginPath();
      ctx.arc(-4, -2, 2.6, 0, Math.PI * 2);
      ctx.arc(4, -2, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-5, 4, 10, 2);
      ctx.fillStyle = "#c44545";
      ctx.fillRect(-3, 8, 6, 2);
    }

    ctx.restore();
  }

  const themeIdx = (state.stage - 1) % 4;
  const themes = [
    ["#1b1a15", "#0d0b08", "rgba(144,96,52,0.16)"],
    ["#0d1624", "#091019", "rgba(76,149,196,0.17)"],
    ["#1a1020", "#0e0815", "rgba(187,96,192,0.16)"],
    ["#1a1f12", "#101508", "rgba(133,187,96,0.16)"],
  ];
  const theme = themes[themeIdx];
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, theme[0]); g.addColorStop(1, theme[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = theme[2];
  for (let i = 0; i < 24; i += 1) {
    const px = ((i * 137 + state.stage * 53) % 1000) / 1000 * canvas.width;
    const py = ((i * 89 + state.stage * 31) % 1000) / 1000 * canvas.height;
    ctx.beginPath();
    ctx.arc(px, py, 24 + (i % 7) * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const gk of stageGimmicks) {
    if (gk.type === 1) {
      ctx.fillStyle = "rgba(118, 56, 43, 0.34)";
      ctx.beginPath();
      ctx.arc(gk.x, gk.y, gk.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 156, 116, 0.45)";
    } else if (gk.type === 2) {
      ctx.fillStyle = "rgba(49, 92, 129, 0.3)";
      ctx.beginPath();
      ctx.arc(gk.x, gk.y, gk.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(131, 204, 255, 0.5)";
    } else if (gk.type === 3) {
      const hot = Math.sin(gk.t * 7) > 0.65;
      ctx.fillStyle = hot ? "rgba(209, 72, 30, 0.38)" : "rgba(118, 58, 33, 0.28)";
      ctx.beginPath();
      ctx.arc(gk.x, gk.y, gk.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hot ? "rgba(255, 212, 132, 0.7)" : "rgba(255, 176, 108, 0.4)";
    } else {
      ctx.fillStyle = "rgba(73, 104, 45, 0.3)";
      ctx.beginPath();
      ctx.arc(gk.x, gk.y, gk.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(186, 255, 149, 0.5)";
    }
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gk.x, gk.y, gk.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const z of dangerZones) {
    if (z.kind === "line") {
      ctx.save();
      ctx.translate(z.x, z.y);
      const ang = Math.atan2(z.dy, z.dx);
      ctx.rotate(ang);
      ctx.fillStyle = "rgba(255,96,96,0.24)";
      ctx.fillRect(0, -z.w * 0.5, z.len, z.w);
      ctx.restore();
    } else if (z.kind === "ring") {
      const armed = z.arm <= 0;
      ctx.strokeStyle = armed ? "rgba(255,76,76,0.9)" : "rgba(255,160,90,0.8)";
      ctx.lineWidth = armed ? 5 : 3;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (z.kind === "meteor") {
      const p = Math.max(0, Math.min(1, (z.arm || 0) / 0.9));
      ctx.fillStyle = `rgba(255,140,90,${0.2 + (1 - p) * 0.25})`;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,220,180,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r * (0.35 + (1 - p) * 0.65), 0, Math.PI * 2);
      ctx.stroke();
    } else if (z.kind === "ringFx") {
      const lifeP = Math.max(0, z.life / 0.28);
      const rr = z.maxR ? z.maxR - (z.maxR - z.r) * lifeP : z.r;
      ctx.strokeStyle = `rgba(255,236,162,${0.7 * lifeP})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(z.x, z.y, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  for (const eb of enemyBullets) {
    ctx.fillStyle = eb.color || "#ffc06d";
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, eb.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const b of bullets) {
    const ang = Math.atan2(b.vy, b.vx);
    if (poopShotReady) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang + (b.rot || 0));
      const s = 18;
      ctx.drawImage(poopShotImg, -s / 2, -s / 2, s, s);
      ctx.restore();
    } else {
      ctx.fillStyle = "#9d6d31";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,227,183,0.65)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,227,183,0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
  for (const e of enemies) {
    drawMonster(e);
    if (e.boss) {
      const w = 110;
      ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(e.x - w / 2, e.y - e.r - 18, w, 8);
      ctx.fillStyle = "#f15353"; ctx.fillRect(e.x - w / 2, e.y - e.r - 18, (e.hp / e.maxHp) * w, 8);
      ctx.fillStyle = "#fff"; ctx.font = "700 12px Verdana"; ctx.textAlign = "center"; ctx.fillText(`P${e.phase}`, e.x, e.y - e.r - 24);
      const bn = BOSS_NAMES[e.bossVariant || 0] || "Boss";
      ctx.fillStyle = "#ffe8b8";
      ctx.font = "700 11px Verdana";
      ctx.fillText(bn, e.x, e.y - e.r - 34);
    }
  }
  drawWizard();
  if (portal.on) { ctx.strokeStyle = "#58d5ff"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(portal.x, portal.y, portal.r, 0, Math.PI * 2); ctx.stroke(); }
  if (state.gameOver) {
    saveScoreIfNeeded();
    ctx.fillStyle = "rgba(0,0,0,0.58)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "700 44px Verdana"; ctx.fillText(t("gameOver"), canvas.width / 2, canvas.height / 2 - 16);
    ctx.font = "400 22px Verdana"; ctx.fillText(`${t("score")}: ${state.score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(t("restart"), canvas.width / 2, canvas.height / 2 + 52);
  }
  if (state.paused && !state.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "700 44px Verdana"; ctx.fillText(t("paused"), canvas.width / 2, canvas.height / 2 - 16);
    ctx.font = "400 24px Verdana"; ctx.fillText(t("resume"), canvas.width / 2, canvas.height / 2 + 24);
  }
}

function updateHud() {
  const skillLine = unlockedSkills.length
    ? unlockedSkills.map((s) => `[${s.key}] ${s.name} ${skillState[s.key] > 0 ? `(${skillState[s.key].toFixed(1)}s)` : ""}`).join(" | ")
    : (state.lang === "en" ? "Defeat bosses to unlock skills (1-4)" : "보스를 처치해 스킬(1-4)을 해금하세요");
  hud.innerHTML = `${t("stage")}: ${state.stage}<br>${t("wave")}: ${state.wave}<br>${t("level")}: ${player.level}<br>${t("score")}: ${state.score} | ${t("best")}: ${bestScore()}<br>${skillLine}`;
  hpText.textContent = `${t("hp")} ${Math.ceil(player.hp)}/${player.maxHp}`;
  hpFill.style.width = `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`;
  langToggle.textContent = state.lang === "en" ? "KO" : "EN";
  renderSkillBar();
}

langToggle.addEventListener("click", () => {
  state.lang = state.lang === "en" ? "ko" : "en";
  updateStartText();
  renderBoards();
  updateHud();
  if (me) setAuthStatus(welcomeText(me.username));
});
chooseLoginBtn.addEventListener("click", showLoginForm);
openSignupBtn.addEventListener("click", openSignupModal);
backAuthBtn.addEventListener("click", showAuthGate);
signupSubmitBtn.addEventListener("click", signup);
signupCancelBtn.addEventListener("click", () => signupModal.classList.add("hidden"));
signupUsername.addEventListener("keydown", (e) => { if (e.key === "Enter") signup(); });
signupPassword.addEventListener("keydown", (e) => { if (e.key === "Enter") signup(); });
authPassword.addEventListener("keydown", (e) => { if (e.key === "Enter") login(); });
loginBtn.addEventListener("click", login);
if (logoutBtn) logoutBtn.addEventListener("click", logout);
if (startTabOnline) startTabOnline.addEventListener("click", renderBoards);
if (panelTabOnline) panelTabOnline.addEventListener("click", renderBoards);
startGameBtn.addEventListener("click", startGame);
addEventListener("keydown", (e) => {
  if (["1", "2", "3", "4"].includes(e.key)) {
    castSkill(e.key);
    return;
  }
  if (e.key !== "Escape") return;
  if (!signupModal.classList.contains("hidden")) {
    signupModal.classList.add("hidden");
    return;
  }
  if (state.started && !state.gameOver && !state.levelup) state.paused = !state.paused;
});

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  if (state.started) updateHud();
  requestAnimationFrame(loop);
}

updateStartText();
showAuthGate();
bindPulseEffects();
renderBoards();
renderSkillBar();
initFirebase();
requestAnimationFrame(loop);

