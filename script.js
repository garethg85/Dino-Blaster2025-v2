const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Game State
let gameRunning = true;
let score = 0;

// Levels with visual themes (no external images)
const LEVELS = {
  Jungle: {
    bgColor: ['#1a4d1a', '#2e8b2e'],
    enemyColor: '#8B4513',
    bossColor: '#654321',
    name: '🌴 JUNGLE LEVEL 🌴',
    trees: true
  },
  Volcano: {
    bgColor: ['#8B0000', '#FF4500'],
    enemyColor: '#B22222',
    bossColor: '#800000',
    name: '🌋 VOLCANO LEVEL 🌋',
    lava: true
  },
  Ice: {
    bgColor: ['#191970', '#4169E1'],
    enemyColor: '#4682B4',
    bossColor: '#2F4F4F',
    name: '❄️ ICE LEVEL ❄️',
    snow: true
  },
  Desert: {
    bgColor: ['#F4A460', '#DEB887'],
    enemyColor: '#D2691E',
    bossColor: '#A0522D',
    name: '🏜️ DESERT LEVEL 🏜️',
    sand: true
  }
};

const levelNames = Object.keys(LEVELS);
let currentLevel = 0;
let levelTimer = 0;

// Player
const player = { 
  x: 400, 
  y: 500, 
  w: 40, 
  h: 40, 
  speed: 6,
  health: 100,
  maxHealth: 100,
  bullets: [],
  shootCooldown: 0
};

// Enemies
let enemies = [];
let enemyTimer = 0;
const enemySpawnRate = 45;
let enemiesKilled = 0;

// Boss
let bossActive = false;
const boss = { 
  x: 300, 
  y: 80, 
  w: 200, 
  h: 80,
  bullets: [],
  shootTimer: 0,
  moveTimer: 0,
  direction: 1
};
let bossHealth = 150;
const bossMaxHealth = 150;

// Input handling
const keys = {};
document.addEventListener("keydown", e => {
  keys[e.code] = true;
  keys[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", e => {
  keys[e.code] = false;
  keys[e.key.toLowerCase()] = false;
});

// Bullet class
class Bullet {
  constructor(x, y, dx, dy, color, size = 4, damage = 10) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.color = color;
    this.size = size;
    this.damage = damage;
  }
  
  update() {
    this.x += this.dx;
    this.y += this.dy;
  }
  
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// Particle effects
const particles = [];
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.dx = (Math.random() - 0.5) * 8;
    this.dy = (Math.random() - 0.5) * 8;
    this.color = color;
    this.life = 20 + Math.random() * 20;
    this.maxLife = this.life;
    this.size = 2 + Math.random() * 4;
  }
  
  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.life--;
    this.dx *= 0.95;
    this.dy *= 0.95;
  }
  
  draw() {
    const alpha = this.life / this.maxLife;
    const hex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.fillStyle = this.color + hex;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
}

function spawnEnemy() {
  const x = Math.random() * (WIDTH - 50);
  enemies.push({ 
    x, 
    y: -50, 
    w: 40 + Math.random() * 20, 
    h: 40 + Math.random() * 20,
    speed: 1.5 + Math.random() * 2,
    health: 30 + currentLevel * 10,
    maxHealth: 30 + currentLevel * 10
  });
}

function drawBackground() {
  const level = LEVELS[levelNames[currentLevel]];
  
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, level.bgColor[0]);
  gradient.addColorStop(1, level.bgColor[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Level-specific decorations
  if (level.trees) {
    // Draw jungle trees
    for (let i = 0; i < 5; i++) {
      const x = i * 160 + 50;
      ctx.fillStyle = '#654321';
      ctx.fillRect(x, HEIGHT - 60, 20, 60);
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(x + 10, HEIGHT - 70, 30, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (level.lava) {
    // Draw lava bubbles
    for (let i = 0; i < 8; i++) {
      const x = Math.sin(levelTimer * 0.02 + i) * 50 + i * 100;
      const y = HEIGHT - 30 + Math.sin(levelTimer * 0.03 + i * 2) * 10;
      ctx.fillStyle = '#FF6347';
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (level.snow) {
    // Draw falling snow
    for (let i = 0; i < 30; i++) {
      const x = (i * 37 + levelTimer) % WIDTH;
      const y = (i * 23 + levelTimer * 0.5) % HEIGHT;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (level.sand) {
    // Draw sand dunes
    ctx.fillStyle = 'rgba(222, 184, 135, 0.3)';
    for (let i = 0; i < 4; i++) {
      const x = i * 200;
      ctx.beginPath();
      ctx.ellipse(x, HEIGHT - 20, 150, 40, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPlayer() {
  // Player body with cartoon style
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  
  // Player face
  ctx.fillStyle = 'white';
  ctx.fillRect(player.x + 8, player.y + 8, 8, 8);
  ctx.fillRect(player.x + 24, player.y + 8, 8, 8);
  
  ctx.fillStyle = 'black';
  ctx.fillRect(player.x + 10, player.y + 10, 4, 4);
  ctx.fillRect(player.x + 26, player.y + 10, 4, 4);
  
  // Smile
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x + 20, player.y + 25, 8, 0, Math.PI);
  ctx.stroke();
  
  // Health bar
  if (player.health < player.maxHealth) {
    ctx.fillStyle = 'red';
    ctx.fillRect(player.x, player.y - 12, player.w, 6);
    ctx.fillStyle = 'lime';
    ctx.fillRect(player.x, player.y - 12, player.w * (player.health / player.maxHealth), 6);
  }
}

function drawEnemy(enemy) {
  const level = LEVELS[levelNames[currentLevel]];
  
  // Enemy body
  ctx.fillStyle = level.enemyColor;
  ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
  
  // Enemy eyes (angry)
  ctx.fillStyle = 'red';
  const eyeSize = enemy.w * 0.15;
  ctx.fillRect(enemy.x + enemy.w * 0.2, enemy.y + enemy.h * 0.2, eyeSize, eyeSize);
  ctx.fillRect(enemy.x + enemy.w * 0.65, enemy.y + enemy.h * 0.2, eyeSize, eyeSize);
  
  // Health bar for stronger enemies
  if (enemy.health < enemy.maxHealth) {
    ctx.fillStyle = 'red';
    ctx.fillRect(enemy.x, enemy.y - 8, enemy.w, 4);
    ctx.fillStyle = 'orange';
    ctx.fillRect(enemy.x, enemy.y - 8, enemy.w * (enemy.health / enemy.maxHealth), 4);
  }
}

function drawBoss() {
  const level = LEVELS[levelNames[currentLevel]];
  
  // Boss body
  ctx.fillStyle = level.bossColor;
  ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
  
  // Boss details
  ctx.fillStyle = 'red';
  ctx.fillRect(boss.x + 30, boss.y + 15, 25, 25);
  ctx.fillRect(boss.x + 145, boss.y + 15, 25, 25);
  
  ctx.fillStyle = 'white';
  ctx.fillRect(boss.x + 33, boss.y + 18, 19, 19);
  ctx.fillRect(boss.x + 148, boss.y + 18, 19, 19);
  
  // Boss horns/spikes
  ctx.fillStyle = '#444';
  for (let i = 0; i < 5; i++) {
    const x = boss.x + 20 + i * 32;
    ctx.beginPath();
    ctx.moveTo(x, boss.y);
    ctx.lineTo(x - 8, boss.y - 15);
    ctx.lineTo(x + 8, boss.y - 15);
    ctx.closePath();
    ctx.fill();
  }
  
  // Boss health bar
  const barWidth = 300;
  const barHeight = 20;
  const barX = WIDTH / 2 - barWidth / 2;
  const barY = 20;
  
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = '#FF4500';
  ctx.fillRect(barX, barY, barWidth * (bossHealth / bossMaxHealth), barHeight);
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('BOSS', WIDTH / 2, barY + 15);
}

function drawUI() {
  const level = LEVELS[levelNames[currentLevel]];
  
  // Level name
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'left';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 3;
  ctx.strokeText(level.name, 20, 40);
  ctx.fillText(level.name, 20, 40);
  
  // Score
  ctx.textAlign = 'right';
  ctx.strokeText(`Score: ${score}`, WIDTH - 20, 40);
  ctx.fillText(`Score: ${score}`, WIDTH - 20, 40);
  
  // Progress indicator
  if (!bossActive) {
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'yellow';
    const progress = Math.min(enemiesKilled, 20);
    ctx.fillText(`Enemies defeated: ${progress}/20 - Boss spawns at 20!`, WIDTH/2, HEIGHT - 30);
  }
  
  // Controls
  ctx.font = '14px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('WASD/Arrows: Move • SPACE: Shoot • R: Restart', WIDTH/2, HEIGHT - 10);
}

function updatePlayer() {
  // Movement
  if (keys["ArrowLeft"] || keys["a"]) player.x -= player.speed;
  if (keys["ArrowRight"] || keys["d"]) player.x += player.speed;
  if (keys["ArrowUp"] || keys["w"]) player.y -= player.speed;
  if (keys["ArrowDown"] || keys["s"]) player.y += player.speed;
  
  // Keep player in bounds
  player.x = Math.max(0, Math.min(WIDTH - player.w, player.x));
  player.y = Math.max(HEIGHT/3, Math.min(HEIGHT - player.h, player.y));
  
  // Shooting
  if (player.shootCooldown > 0) player.shootCooldown--;
  
  if ((keys["Space"] || keys[" "]) && player.shootCooldown === 0) {
    player.bullets.push(new Bullet(player.x + player.w/2, player.y, 0, -8, '#FFD700', 6, 25));
    player.shootCooldown = 8;
  }
  
  // Update bullets
  player.bullets = player.bullets.filter(bullet => {
    bullet.update();
    return bullet.y > -20;
  });
}

function updateEnemies() {
  // Spawn enemies
  enemyTimer++;
  if (enemyTimer >= enemySpawnRate && !bossActive && enemiesKilled < 20) {
    spawnEnemy();
    enemyTimer = 0;
  }
  
  // Update enemies
  enemies = enemies.filter(enemy => {
    enemy.y += enemy.speed;
    return enemy.y < HEIGHT + 100;
  });
  
  // Spawn boss when enough enemies defeated
  if (enemiesKilled >= 20 && !bossActive) {
    bossActive = true;
    enemies = [];
    bossHealth = bossMaxHealth;
  }
}

function updateBoss() {
  if (!bossActive) return;
  
  boss.moveTimer++;
  
  // Boss movement pattern
  if (boss.moveTimer % 120 < 60) {
    boss.x += boss.direction * 2;
    if (boss.x <= 0 || boss.x >= WIDTH - boss.w) {
      boss.direction *= -1;
    }
  }
  
  // Boss shooting
  boss.shootTimer++;
  if (boss.shootTimer >= 35) {
    boss.shootTimer = 0;
    
    // Different attack patterns based on health
    if (bossHealth > bossMaxHealth * 0.7) {
      // Single shot
      boss.bullets.push(new Bullet(boss.x + boss.w/2, boss.y + boss.h, 0, 5, '#FF4444', 10, 30));
    } else if (bossHealth > bossMaxHealth * 0.3) {
      // Triple shot
      boss.bullets.push(new Bullet(boss.x + boss.w/2, boss.y + boss.h, -3, 5, '#FF4444', 8, 25));
      boss.bullets.push(new Bullet(boss.x + boss.w/2, boss.y + boss.h, 0, 5, '#FF4444', 8, 25));
      boss.bullets.push(new Bullet(boss.x + boss.w/2, boss.y + boss.h, 3, 5, '#FF4444', 8, 25));
    } else {
      // Spray pattern
      for (let i = -2; i <= 2; i++) {
        boss.bullets.push(new Bullet(boss.x + boss.w/2, boss.y + boss.h, i * 2, 5, '#FF6666', 6, 20));
      }
    }
  }
  
  // Update boss bullets
  boss.bullets = boss.bullets.filter(bullet => {
    bullet.update();
    return bullet.y < HEIGHT + 20 && bullet.x > -20 && bullet.x < WIDTH + 20;
  });
}

function checkCollisions() {
  // Player bullets vs enemies
  player.bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      if (bullet.x > enemy.x && bullet.x < enemy.x + enemy.w &&
          bullet.y > enemy.y && bullet.y < enemy.y + enemy.h) {
        
        enemy.health -= bullet.damage;
        player.bullets.splice(bIndex, 1);
        
        // Explosion particles
        for (let i = 0; i < 5; i++) {
          particles.push(new Particle(bullet.x, bullet.y, '#FFD700'));
        }
        
        if (enemy.health <= 0) {
          enemies.splice(eIndex, 1);
          enemiesKilled++;
          score += 100 + currentLevel * 50;
        }
      }
    });
  });
  
  // Player bullets vs boss
  if (bossActive) {
    player.bullets.forEach((bullet, bIndex) => {
      if (bullet.x > boss.x && bullet.x < boss.x + boss.w &&
          bullet.y > boss.y && bullet.y < boss.y + boss.h) {
        
        bossHealth -= bullet.damage;
        player.bullets.splice(bIndex, 1);
        score += 200;
        
        // Boss hit particles
        for (let i = 0; i < 8; i++) {
          particles.push(new Particle(bullet.x, bullet.y, '#FF6666'));
        }
      }
    });
  }
  
  // Boss bullets vs player
  boss.bullets.forEach((bullet, bIndex) => {
    if (bullet.x > player.x && bullet.x < player.x + player.w &&
        bullet.y > player.y && bullet.y < player.y + player.h) {
      
      boss.bullets.splice(bIndex, 1);
      player.health -= bullet.damage;
      
      // Player damage particles
      for (let i = 0; i < 4; i++) {
        particles.push(new Particle(player.x + player.w/2, player.y + player.h/2, '#FF4444'));
      }
    }
  });
  
  // Enemies vs player
  enemies.forEach((enemy, eIndex) => {
    if (enemy.x < player.x + player.w && enemy.x + enemy.w > player.x &&
        enemy.y < player.y + player.h && enemy.y + enemy.h > player.y) {
      
      enemies.splice(eIndex, 1);
      player.health -= 25;
      
      for (let i = 0; i < 6; i++) {
        particles.push(new Particle(enemy.x + enemy.w/2, enemy.y + enemy.h/2, '#FF8888'));
      }
    }
  });
}

function nextLevel() {
  currentLevel = (currentLevel + 1) % levelNames.length;
  bossActive = false;
  bossHealth = bossMaxHealth;
  enemies = [];
  boss.bullets = [];
  enemiesKilled = 0;
  score += 2000; // Level completion bonus
  
  // Heal player slightly
  player.health = Math.min(player.maxHealth, player.health + 30);
}

function gameOver(won) {
  gameRunning = false;
  
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  
  if (won) {
    ctx.fillText('LEVEL COMPLETE! 🎉', WIDTH/2, HEIGHT/2 - 60);
    ctx.fillStyle = '#FFD700';
    ctx.font = '32px Arial';
    ctx.fillText(`Final Score: ${score}`, WIDTH/2, HEIGHT/2);
  } else {
    ctx.fillText('GAME OVER! 💀', WIDTH/2, HEIGHT/2 - 60);
    ctx.fillStyle = '#FF6666';
    ctx.font = '32px Arial';
    ctx.fillText(`Final Score: ${score}`, WIDTH/2, HEIGHT/2);
  }
  
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText('Press R to restart', WIDTH/2, HEIGHT/2 + 60);
}

function restart() {
  gameRunning = true;
  currentLevel = 0;
  score = 0;
  enemiesKilled = 0;
  bossActive = false;
  bossHealth = bossMaxHealth;
  levelTimer = 0;
  
  player.health = player.maxHealth;
  player.x = 400;
  player.y = 500;
  player.bullets = [];
  player.shootCooldown = 0;
  
  enemies = [];
  boss.bullets = [];
  particles.length = 0;
  
  update();
}

function update() {
  if (!gameRunning) {
    if (keys['r'] || keys['R']) {
      restart();
      return;
    }
    return;
  }
  
  levelTimer++;
  
  drawBackground();
  
  updatePlayer();
  updateEnemies();
  updateBoss();
  checkCollisions();
  
  // Update particles
  particles.forEach((particle, index) => {
    particle.update();
    if (particle.life <= 0) {
      particles.splice(index, 1);
    }
  });
  
  // Draw everything
  enemies.forEach(drawEnemy);
  
  if (bossActive) {
    drawBoss();
    boss.bullets.forEach(bullet => bullet.draw());
  }
  
  drawPlayer();
  player.bullets.forEach(bullet => bullet.draw());
  particles.forEach(particle => particle.draw());
  
  drawUI();
  
  // Check win/lose conditions
  if (bossHealth <= 0 && bossActive) {
    setTimeout(() => nextLevel(), 1000);
  }
  
  if (player.health <= 0) {
    gameOver(false);
    return;
  }
  
  requestAnimationFrame(update);
}

// Start the game
update();
