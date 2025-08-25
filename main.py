import pygame, random, sys

pygame.init()
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
clock = pygame.time.Clock()

# === Assets ===
LEVELS = {
    "Jungle": (pygame.Color("forestgreen"), "Snake"),
    "Volcano": (pygame.Color("darkred"), "LavaBat"),
    "Ice": (pygame.Color("lightblue"), "IceWolf"),
    "Desert": (pygame.Color("khaki"), "Scorpion")
}
level_names = list(LEVELS.keys())
current_level = 0

# === Player ===
player = pygame.Rect(400, 500, 40, 40)
player_speed = 5

# === Enemies ===
enemies = []
enemy_timer = 0
enemy_spawn_rate = 60

# === Boss ===
boss_active = False
boss = pygame.Rect(300, 100, 200, 60)
boss_health = 100
boss_max_health = 100
boss_attack_timer = 0

# === Fonts ===
font = pygame.font.SysFont(None, 36)

def spawn_enemy():
    enemy = pygame.Rect(random.randint(0, WIDTH-30), -30, 30, 30)
    enemies.append(enemy)

def draw_ui():
    level_text = font.render(f"Level: {level_names[current_level]}", True, pygame.Color("white"))
    screen.blit(level_text, (10, 10))

    if boss_active:
        pygame.draw.rect(screen, pygame.Color("red"), (WIDTH//2 - 100, 20, 200, 20))
        pygame.draw.rect(screen, pygame.Color("green"), (WIDTH//2 - 100, 20, 200 * (boss_health / boss_max_health), 20))
        boss_text = font.render("Boss Battle!", True, pygame.Color("white"))
        screen.blit(boss_text, (WIDTH//2 - 60, 45))

def handle_boss():
    global boss_health, boss_attack_timer
    if boss_active:
        boss_attack_timer += 1
        if boss_attack_timer % 90 == 0:
            print("Boss attacks!")  # Placeholder for projectile logic

        if boss_health <= 0:
            print("Boss defeated!")
            next_level()

def next_level():
    global current_level, boss_active, boss_health, enemies
    current_level += 1
    if current_level >= len(level_names):
        current_level = 0
    boss_active = False
    boss_health = boss_max_health
    enemies.clear()

# === Game Loop ===
while True:
    screen.fill(LEVELS[level_names[current_level]][0])

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT]: player.x -= player_speed
    if keys[pygame.K_RIGHT]: player.x += player_speed
    if keys[pygame.K_SPACE] and boss_active:
        boss_health -= 5

    enemy_timer += 1
    if enemy_timer >= enemy_spawn_rate and not boss_active:
        spawn_enemy()
        enemy_timer = 0

    if len(enemies) > 10 and not boss_active:
        boss_active = True
        enemies.clear()

    pygame.draw.rect(screen, pygame.Color("blue"), player)

    for enemy in enemies:
        enemy.y += 2
        pygame.draw.rect(screen, pygame.Color("orange"), enemy)

    if boss_active:
        pygame.draw.rect(screen, pygame.Color("purple"), boss)
        handle_boss()

    draw_ui()
    pygame.display.flip()
    clock.tick(60)