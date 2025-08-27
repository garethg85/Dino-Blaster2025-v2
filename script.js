const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// === Assets ===
const LEVELS = {
  Jungle: {
    background: "https://i.imgur.com/O7vXqek.png", // Cartoon jungle bg
    enemy: "https://i.imgur.com/mfBeC3C.png", // Cartoon snake
  },
  Volcano: {
    background: "https://i.imgur.com/I6vF6XM.png", // Cartoon volcano bg
    enemy: "https://i.imgur.com/5f3xZfk.png", // Lava bat
  },
  Ice: {
    background: "https://i.imgur.com/yz3HKlW.png", // Cartoon ice bg
    enemy: "https://i.imgur.com/cxz6HXg.png", // Ice wolf
  },
  Desert: {
    background: "https://i.imgur.com/OkeULqq.png", // Cartoon desert bg
    enemy: "https://i.imgur.com/uiYIZE4.png", // Scorpion
  }
};
const levelNames = Object.keys(LEVELS);
let currentLevel = 0;

// === Player ===
const playerImage = new Image();
playerImage.src = "https://i.imgur.com/EZcKS8D.png"; // Cartoon hero character

const player = { x: 400, y: 500, w: 40, h: 40, speed: 5 };

// === Enemies ===
let enemies = [];
let enemyTimer = 0;
const enemySpawnRate = 60;

function loadEnemyImage() {
  const url = LEVELS[levelNames[currentLevel]].enemy;
  const img = new Image();
  img.src = url;
  return img;
}
let enemyImage = loadEnemyImage();

// === Boss ===
let bossActive = false;
const boss = { x: 300, y: 100, w: 200, h: 60 };
let bossHealth = 100;
const bossMaxHealth = 100;
let bossAttackTimer = 0;

const bossImage = new Image();
bossImage.src = "https://i.imgur.com/0mCzFaK.png"; // Cartoon boss monster

// === Background ===
const bgImage = new Image();
bgImage.src = LEVELS[levelNames[currentLevel]].background;

// === Input ===
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

function spawnEnemy() {
  const x = Math.random() * (WIDTH - 30);
  enemies.push({ x, y: -30, w: 50, h: 50 });
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "24px Comic Sans MS, sans-serif";
  ctx.fillText(`Level: ${levelNames[currentLevel]}`, 10, 30);

  if (bossActive) {
    ctx.fillStyle = "red";
    ctx.fillRect(WIDTH / 2 - 100, 20, 200, 20);
    ctx.fillStyle = "limegreen";
    ctx.fillRect(WIDTH / 2 - 100, 20, 200 * (bossHealth / bossMaxHealth), 20);
    ctx.fillStyle = "white";
    ctx.fillText("Boss Battle!", WIDTH / 2 - 60, 50);
  }
}

function handleBoss() {
  bossAttackTimer++;
  if (bossAttackTimer % 90 === 0) {
    console.log("Boss attacks!");
    // Could add boss attack animations or effects here later
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

  // Reload level assets
  enemyImage = loadEnemyImage();
  bgImage.src = LEVELS[levelNames[currentLevel]].background;
}

function update() {
  // Draw background
  if (bgImage.complete) {
    ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = LEVELS[levelNames[currentLevel]].color || "black";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // Player movement
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;
  if (keys["Space"] && bossActive) bossHealth -= 5;

  // Keep player inside canvas
  player.x = Math.max(0, Math.min(WIDTH - player.w, player.x));

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
  if (playerImage.complete) {
    ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
  } else {
    // fallback rectangle if image not loaded
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // Draw enemies
  enemies.forEach(enemy => {
    enemy.y += 2;
    if (enemyImage.complete) {
      ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.w, enemy.h);
    } else {
      ctx.fillStyle = "orange";
      ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    }
  });

  // Draw boss
  if (bossActive) {
    if (bossImage.complete) {
      ctx.drawImage(bossImage, boss.x, boss.y, boss.w, boss.h);
    } else {
      ctx.fillStyle = "purple";
      ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
    }
    handleBoss();
  }

  drawUI();
  requestAnimationFrame(update);
}

update();
