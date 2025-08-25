const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// === Assets ===
const LEVELS = {
  Jungle: { color: "forestgreen", enemy: "Snake" },
  Volcano: { color: "darkred", enemy: "LavaBat" },
  Ice: { color: "lightblue", enemy: "IceWolf" },
  Desert: { color: "khaki", enemy: "Scorpion" }
};
const levelNames = Object.keys(LEVELS);
let currentLevel = 0;

// === Player ===
const player = { x: 400, y: 500, w: 40, h: 40, speed: 5 };

// === Enemies ===
let enemies = [];
let enemyTimer = 0;
const enemySpawnRate = 60;

// === Boss ===
let bossActive = false;
const boss = { x: 300, y: 100, w: 200, h: 60 };
let bossHealth = 100;
const bossMaxHealth = 100;
let bossAttackTimer = 0;

// === Input ===
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

function spawnEnemy() {
  const x = Math.random() * (WIDTH - 30);
  enemies.push({ x, y: -30, w: 30, h: 30 });
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "24px sans-serif";
  ctx.fillText(`Level: ${levelNames[currentLevel]}`, 10, 30);

  if (bossActive) {
    ctx.fillStyle = "red";
    ctx.fillRect(WIDTH / 2 - 100, 20, 200, 20);
    ctx.fillStyle = "green";
    ctx.fillRect(WIDTH / 2 - 100, 20, 200 * (bossHealth / bossMaxHealth), 20);
    ctx.fillText("Boss Battle!", WIDTH / 2 - 60, 50);
  }
}

function handleBoss() {
  bossAttackTimer++;
  if (bossAttackTimer % 90 === 0) {
    console.log("Boss attacks!");
  }

  if (bossHealth <= 0) {
    console.log("Boss defeated!");
    nextLevel();
  }
}

function nextLevel() {
  currentLevel = (currentLevel + 1) % levelNames.length;
  bossActive = false;
  bossHealth = bossMaxHealth;
  enemies = [];
}

function update() {
  // Background
  ctx.fillStyle = LEVELS[levelNames[currentLevel]].color;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Player movement
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;
  if (keys["Space"] && bossActive) bossHealth -= 5;

  // Enemy spawn
  enemyTimer++;
  if (enemyTimer >= enemySpawnRate && !bossActive) {
    spawnEnemy();
    enemyTimer = 0;
  }

  if (enemies.length > 10 && !bossActive) {
    bossActive = true;
    enemies = [];
  }

  // Draw player
  ctx.fillStyle = "blue";
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // Draw enemies
  ctx.fillStyle = "orange";
  enemies.forEach(enemy => {
    enemy.y += 2;
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
  });

  // Draw boss
  if (bossActive) {
    ctx.fillStyle = "purple";
    ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
    handleBoss();
  }

  drawUI();
  requestAnimationFrame(update);
}

update();