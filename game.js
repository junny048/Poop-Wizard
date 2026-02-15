const el = (id) => document.getElementById(id);
const startScreen = el("startScreen");
const authId = el("authId");
const authPassword = el("authPassword");
const authUsername = el("authUsername");
const authStatus = el("authStatus");
const startLeaderboard = el("startLeaderboard");
const startSubtitle = el("startSubtitle");
const authTitle = el("authTitle");
const startRankTitle = el("startRankTitle");
const signupBtn = el("signupBtn");
const loginBtn = el("loginBtn");
const logoutBtn = el("logoutBtn");
const authUserStatus = el("authUserStatus");
const startTabOnline = el("startTabOnline");
const startTabLocal = el("startTabLocal");
const panelTabOnline = el("panelTabOnline");
const panelTabLocal = el("panelTabLocal");
const startGameBtn = el("startGameBtn");
const langToggle = el("langToggle");
const leaderboardTitle = el("leaderboardTitle");
const leaderboardContent = el("leaderboardContent");
const userIdText = el("userIdText");
const hud = el("hud");
const hpText = el("hpText");
const hpFill = el("hpFill");
const levelup = el("levelup");
const choices = el("choices");
const canvas = el("game");
const ctx = canvas.getContext("2d");

const I18N = {
  en: { startSubtitle: "Top-down survival stage battle", authTitle: "Login / Sign Up", rank: "Online Leaderboard", start: "Start Game", signup: "Sign Up", login: "Login", needCfg: "Fill firebase-config.js", okOnline: "Online ready", fail: "Auth failed", loginOk: "Login success", signupOk: "Sign up success", user: "User", leaderboard: "Leaderboard", stage: "Stage", wave: "Wave", level: "Level", score: "Score", best: "Best", hp: "HP", paused: "Paused", resume: "Press ESC to resume", gameOver: "Game Over", restart: "Press F5 to restart" },
  ko: { startSubtitle: "탑다운 생존 스테이지 배틀", authTitle: "로그인 / 회원가입", rank: "온라인 랭킹", start: "게임 시작", signup: "회원가입", login: "로그인", needCfg: "firebase-config.js 설정 필요", okOnline: "온라인 사용 가능", fail: "인증 실패", loginOk: "로그인 완료", signupOk: "회원가입 완료", user: "유저", leaderboard: "랭킹", stage: "스테이지", wave: "웨이브", level: "레벨", score: "점수", best: "최고", hp: "체력", paused: "일시정지", resume: "ESC를 눌러 계속", gameOver: "게임 오버", restart: "F5로 다시 시작" },
};

const state = { lang: "en", started: false, paused: false, levelup: false, gameOver: false, stage: 1, wave: 1, score: 0, scoreSaved: false, boardMode: "online" };
const player = { x: 0, y: 0, r: 14, hp: 100, maxHp: 100, speed: 240, level: 1, exp: 0, expNeed: 24, damage: 10, atkCd: 0, atkInt: 0.45 };
const input = { w: false, a: false, s: false, d: false };
const mouse = { x: 0, y: 0 };
const enemies = [];
const bullets = [];
const portal = { on: false, x: 0, y: 0, r: 30 };

let firebaseReady = false;
let auth = null;
let db = null;
let me = null;
let onlineScores = [];

function setMoveKey(key, pressed) {
  if (!key) return;
  const k = key.toLowerCase();
  if (k === "w" || k === "arrowup") input.w = pressed;
  if (k === "a" || k === "arrowleft") input.a = pressed;
  if (k === "s" || k === "arrowdown") input.s = pressed;
  if (k === "d" || k === "arrowright") input.d = pressed;
}

const LEADERBOARD_KEY = "poop_wizard_leaderboard_v1";
const UID_KEY = "poop_wizard_user_id_v1";
let localScores = [];
let anonId = localStorage.getItem(UID_KEY) || `u${Math.random().toString(36).slice(2, 10)}`;
localStorage.setItem(UID_KEY, anonId);
try { localScores = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]"); } catch { localScores = []; }

function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener("resize", resize); resize();

function t(k) { return I18N[state.lang][k] || k; }
function setAuthStatus(msg, err = false) { authStatus.textContent = msg; authStatus.style.color = err ? "#ff9f9f" : "#bff5c9"; }
function toEmail(id) { return `${id}@poopwizard.local`; }
function dispUser() { return me?.username || anonId; }
function bestScore() { const pool = onlineScores.length ? onlineScores : localScores; return pool[0]?.score || 0; }
function dist(a, b, c, d) { return Math.hypot(c - a, d - b); }
addEventListener("keydown", (e) => setMoveKey(e.key, true));
addEventListener("keyup", (e) => setMoveKey(e.key, false));
canvas.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

function updateStartText() {
  startSubtitle.textContent = t("startSubtitle");
  authTitle.textContent = t("authTitle");
  startRankTitle.textContent = t("rank");
  signupBtn.textContent = t("signup");
  loginBtn.textContent = t("login");
  startGameBtn.textContent = t("start");
}

function renderRows(rows, target) {
  target.innerHTML = rows.slice(0, 10).map((r, i) => `<div class="leaderboard-row"><span>#${i + 1} ${r.userId || "legacy"}</span><span>${r.score}</span></div>`).join("") || `<div class="leaderboard-row"><span>-</span><span>0</span></div>`;
}
function updateTabButtons() {
  const onlineActive = state.boardMode === "online";
  if (startTabOnline) startTabOnline.classList.toggle("active", onlineActive);
  if (panelTabOnline) panelTabOnline.classList.toggle("active", onlineActive);
  if (startTabLocal) startTabLocal.classList.toggle("active", !onlineActive);
  if (panelTabLocal) panelTabLocal.classList.toggle("active", !onlineActive);
}

function renderBoards() {
  const useOnline = state.boardMode === "online" && firebaseReady;
  leaderboardTitle.textContent = useOnline ? t("rank") : t("leaderboard");
  userIdText.textContent = `${t("user")}: ${dispUser()}`;
  if (authUserStatus) authUserStatus.textContent = me ? `Logged in: ${me.username}` : "Not logged in";
  const pool = useOnline ? onlineScores : localScores;
  renderRows(pool, leaderboardContent);
  renderRows(pool, startLeaderboard);
  updateTabButtons();
}

async function loadOnlineScores() {
  if (!firebaseReady) return;
  try {
    const snap = await db.collection("scores").orderBy("score", "desc").limit(20).get();
    onlineScores = snap.docs.map((d) => d.data());
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
      let username = u.email.split("@")[0];
      try {
        const doc = await db.collection("users").doc(u.uid).get();
        if (doc.exists && doc.data().username) username = doc.data().username;
      } catch {}
      me = { uid: u.uid, username };
      renderBoards();
    });
    await loadOnlineScores();
  } catch {
    setAuthStatus(t("fail"), true);
  }
}

async function signup() {
  if (!firebaseReady) return;
  const id = authId.value.trim(), pw = authPassword.value.trim(), username = authUsername.value.trim();
  if (!id || !pw || !username) return setAuthStatus(t("fail"), true);
  try {
    const cred = await auth.createUserWithEmailAndPassword(toEmail(id), pw);
    await db.collection("users").doc(cred.user.uid).set({ id, username, createdAt: Date.now() });
    me = { uid: cred.user.uid, username };
    setAuthStatus(t("signupOk"));
  } catch { setAuthStatus(t("fail"), true); }
}
async function login() {
  if (!firebaseReady) return;
  const id = authId.value.trim(), pw = authPassword.value.trim();
  if (!id || !pw) return setAuthStatus(t("fail"), true);
  try {
    const cred = await auth.signInWithEmailAndPassword(toEmail(id), pw);
    const doc = await db.collection("users").doc(cred.user.uid).get();
    me = { uid: cred.user.uid, username: doc.exists ? doc.data().username : id };
    setAuthStatus(t("loginOk"));
  } catch { setAuthStatus(t("fail"), true); }
}

async function logout() {
  if (!firebaseReady || !auth) return;
  try {
    await auth.signOut();
    me = null;
    setAuthStatus("Logged out");
    renderBoards();
  } catch {
    setAuthStatus(t("fail"), true);
  }
}
async function submitOnline() {
  if (!firebaseReady || !me || !db) return;
  try {
    const now = Date.now();
    await db.collection("scores").add({
      uid: me.uid,
      userId: me.username || dispUser(),
      score: Math.max(0, Math.floor(state.score)),
      stage: Math.max(1, Math.floor(state.stage)),
      level: Math.max(1, Math.floor(player.level)),
      createdAt: now,
    });
    await loadOnlineScores();
  } catch {}
}

function saveScoreIfNeeded() {
  if (state.scoreSaved) return;
  state.scoreSaved = true;
  localScores.push({ userId: dispUser(), score: state.score, stage: state.stage, level: player.level, at: Date.now() });
  localScores.sort((a, b) => b.score - a.score);
  localScores = localScores.slice(0, 10);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(localScores));
  renderBoards();
  submitOnline();
}

function resetRun() {
  player.x = canvas.width / 2; player.y = canvas.height / 2; player.hp = player.maxHp; player.level = 1; player.exp = 0; player.expNeed = 24;
  player.damage = 10; player.atkInt = 0.45; player.atkCd = 0;
  state.stage = 1; state.wave = 1; state.score = 0; state.gameOver = false; state.scoreSaved = false;
  enemies.length = 0; bullets.length = 0; portal.on = false;
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
  enemies.push({
    x, y, boss, r: boss ? 44 : 13, hp: boss ? 520 * phaseScale : 36 * phaseScale, maxHp: boss ? 520 * phaseScale : 36 * phaseScale,
    speed: boss ? 135 + state.stage * 10 : 135 + state.stage * 9, damage: boss ? 20 + state.stage * 4 : 8 + state.stage * 2,
    phase: 1, dashCd: 2.5, ringCd: 3.3, burstCd: 1.9, dashTime: 0, tele: 0, dx: 0, dy: 0,
  });
}
function spawnWave() {
  if (state.wave === 5) return spawnEnemy(true);
  const n = 7 + state.wave * 3 + (state.stage - 1) * 2;
  for (let i = 0; i < n; i += 1) spawnEnemy(false);
}

function startGame() {
  state.started = true;
  startScreen.classList.add("hidden");
  resetRun();
}

function shoot() {
  const a = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  bullets.push({ x: player.x, y: player.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, life: 1.2, r: 4, dmg: player.damage });
}

function levelUpCheck(exp) {
  player.exp += exp;
  if (player.exp < player.expNeed) return;
  player.exp -= player.expNeed; player.expNeed = Math.floor(player.expNeed * 1.22 + 8); player.level += 1;
  state.levelup = true; levelup.classList.remove("hidden"); choices.innerHTML = "";
  const pool = [() => (player.damage += 6), () => (player.atkInt = Math.max(0.12, player.atkInt * 0.88)), () => (player.maxHp += 20, player.hp = Math.min(player.maxHp, player.hp + 20))];
  ["Damage +6", "Fire Rate +", "HP +20"].forEach((name, i) => {
    const b = document.createElement("button"); b.className = "choice"; b.innerHTML = `<h3>${name}</h3><p>Upgrade</p>`;
    b.onclick = () => { pool[i](); state.levelup = false; levelup.classList.add("hidden"); };
    choices.appendChild(b);
  });
}

function update(dt) {
  if (!state.started || state.gameOver || state.paused || state.levelup) return;
  let dx = 0, dy = 0;
  if (input.w) dy -= 1; if (input.s) dy += 1; if (input.a) dx -= 1; if (input.d) dx += 1;
  const len = Math.hypot(dx, dy) || 1;
  player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x + (dx / len) * player.speed * dt));
  player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y + (dy / len) * player.speed * dt));
  player.atkCd -= dt; if (player.atkCd <= 0) { shoot(); player.atkCd = player.atkInt; }

  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const b = bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0) { bullets.splice(i, 1); continue; }
    for (let j = enemies.length - 1; j >= 0; j -= 1) {
      const e = enemies[j];
      if (dist(b.x, b.y, e.x, e.y) < b.r + e.r) {
        e.hp -= b.dmg; bullets.splice(i, 1);
        if (e.hp <= 0) {
          state.score += e.boss ? 800 : 20;
          levelUpCheck(e.boss ? 20 : 3);
          enemies.splice(j, 1);
          if (e.boss) { portal.on = true; portal.x = canvas.width / 2; portal.y = canvas.height / 2; }
          else if (enemies.length === 0 && state.wave < 5) { state.wave += 1; spawnWave(); }
        }
        break;
      }
    }
  }

  for (const e of enemies) {
    const a = Math.atan2(player.y - e.y, player.x - e.x);
    let speedMul = 1;
    if (e.boss) {
      const hpPct = e.hp / e.maxHp;
      const phase = hpPct <= 0.4 ? 3 : hpPct <= 0.7 ? 2 : 1;
      e.phase = phase;
      e.dashCd -= dt; e.ringCd -= dt; e.burstCd -= dt;
      if (e.dashTime > 0) { e.dashTime -= dt; e.x += e.dx * e.speed * (2.4 + phase * 0.35) * dt; e.y += e.dy * e.speed * (2.4 + phase * 0.35) * dt; }
      else if (e.tele > 0) { e.tele -= dt; }
      else if (e.dashCd <= 0) { e.tele = Math.max(0.15, 0.38 - phase * 0.05); e.dx = Math.cos(a); e.dy = Math.sin(a); e.dashTime = 0.28 + phase * 0.05; e.dashCd = Math.max(0.7, 2.8 - phase * 0.4 - state.stage * 0.08); }
      if (e.ringCd <= 0) { player.hp -= dist(e.x, e.y, player.x, player.y) < 90 + phase * 25 ? 10 + phase * 4 : 0; e.ringCd = Math.max(1.1, 3.2 - phase * 0.5 - state.stage * 0.05); }
      if (e.burstCd <= 0) { player.hp -= 6 + phase * 2; e.burstCd = Math.max(0.7, 1.8 - phase * 0.25); }
    } else {
      e.x += Math.cos(a) * e.speed * speedMul * dt;
      e.y += Math.sin(a) * e.speed * speedMul * dt;
    }
    if (dist(player.x, player.y, e.x, e.y) < player.r + e.r) player.hp -= e.damage * dt * (e.boss ? 2.7 : 2.1);
  }

  if (player.hp <= 0) { player.hp = 0; state.gameOver = true; }
  if (portal.on && dist(player.x, player.y, portal.x, portal.y) < player.r + portal.r) { state.stage += 1; state.wave = 1; portal.on = false; enemies.length = 0; spawnWave(); }
}

function draw() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#1b1a15"); g.addColorStop(1, "#0d0b08");
  ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const b of bullets) { ctx.fillStyle = "#9d6d31"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); }
  for (const e of enemies) {
    ctx.fillStyle = e.boss ? (e.phase === 1 ? "#b63e3e" : e.phase === 2 ? "#d24a35" : "#e8592a") : "#4da66b";
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
    if (e.boss) {
      const w = 110;
      ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(e.x - w / 2, e.y - e.r - 18, w, 8);
      ctx.fillStyle = "#f15353"; ctx.fillRect(e.x - w / 2, e.y - e.r - 18, (e.hp / e.maxHp) * w, 8);
      ctx.fillStyle = "#fff"; ctx.font = "700 12px Verdana"; ctx.textAlign = "center"; ctx.fillText(`P${e.phase}`, e.x, e.y - e.r - 24);
    }
  }
  ctx.fillStyle = "#243c8b"; ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
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
  hud.innerHTML = `${t("stage")}: ${state.stage}<br>${t("wave")}: ${state.wave}<br>${t("level")}: ${player.level}<br>${t("score")}: ${state.score} | ${t("best")}: ${bestScore()}`;
  hpText.textContent = `${t("hp")} ${Math.ceil(player.hp)}/${player.maxHp}`;
  hpFill.style.width = `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`;
  langToggle.textContent = state.lang === "en" ? "KO" : "EN";
}

langToggle.addEventListener("click", () => { state.lang = state.lang === "en" ? "ko" : "en"; updateStartText(); renderBoards(); updateHud(); });
signupBtn.addEventListener("click", signup);
loginBtn.addEventListener("click", login);
if (logoutBtn) logoutBtn.addEventListener("click", logout);
if (startTabOnline) startTabOnline.addEventListener("click", () => { state.boardMode = "online"; renderBoards(); });
if (panelTabOnline) panelTabOnline.addEventListener("click", () => { state.boardMode = "online"; renderBoards(); });
if (startTabLocal) startTabLocal.addEventListener("click", () => { state.boardMode = "local"; renderBoards(); });
if (panelTabLocal) panelTabLocal.addEventListener("click", () => { state.boardMode = "local"; renderBoards(); });
startGameBtn.addEventListener("click", startGame);
addEventListener("keydown", (e) => { if (e.key === "Escape" && state.started && !state.gameOver && !state.levelup) state.paused = !state.paused; });

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
renderBoards();
initFirebase();
requestAnimationFrame(loop);
