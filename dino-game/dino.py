import json
import math
import os
import random
import sys

import pygame


def caminho_base():
    if hasattr(sys, "_MEIPASS"):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))


def caminho_dados():
    if getattr(sys, "frozen", False):
        return os.path.join(os.path.dirname(sys.executable), "recorde.json")
    return os.path.join(caminho_base(), "recorde.json")


BASE = caminho_base()
ASSETS = os.path.join(BASE, "assets")

pygame.init()
pygame.mixer.init()

LARGURA = 900
ALTURA = LARGURA * 3 // 4
FPS = 60
ALTURA_CHAO = 50
Y_CHAO = ALTURA - ALTURA_CHAO

tela = pygame.Surface((LARGURA, ALTURA))
janela = pygame.display.set_mode((LARGURA, ALTURA), pygame.RESIZABLE)
tamanho_janela = (LARGURA, ALTURA)
maximizado = False

icone = pygame.image.load(os.path.join(ASSETS, "dino_cap.png"))
pygame.display.set_icon(icone)
pygame.display.set_caption("Dino Game")

# ================================ IMAGENS ================================

fundo_original = pygame.image.load(os.path.join(ASSETS, "background.png"))
escala_fundo = LARGURA / fundo_original.get_width()
fundo_altura = round(fundo_original.get_height() * escala_fundo)
background_img = pygame.transform.scale(fundo_original, (LARGURA, fundo_altura))
FUNDO_Y = ALTURA - fundo_altura
CEU = background_img.get_at((0, 0))[:3]

dino_img = pygame.transform.scale(
    pygame.image.load(os.path.join(ASSETS, "dino.png")), (60, 60)
)

cactus_small_img = pygame.transform.scale(
    pygame.image.load(os.path.join(ASSETS, "cactus_small.png")), (30, 40)
)

cactus_big_img = pygame.transform.scale(
    pygame.image.load(os.path.join(ASSETS, "cactus_big.png")), (40, 60)
)

bird_img = pygame.transform.scale(
    pygame.image.load(os.path.join(ASSETS, "bird.png")), (50, 30)
)

cloud_img = pygame.transform.scale(
    pygame.image.load(os.path.join(ASSETS, "cloud.png")), (80, 50)
)

# ================================ SONS ================================

jump = pygame.mixer.Sound(os.path.join(ASSETS, "jump.wav"))
hit = pygame.mixer.Sound(os.path.join(ASSETS, "hit.wav"))

pygame.mixer.music.load(os.path.join(ASSETS, "music.mp3"))
pygame.mixer.music.set_volume(0.3)
pygame.mixer.music.play(-1)

# ================================ CORES ================================

PRETO = (30, 30, 30)
VERDE = (0, 150, 0)
CINZA = (120, 120, 120)
CHAO = (67, 128, 123)

# ================================ FONTE ================================

FONTE_PATH = os.path.join(ASSETS, "PhileaBold.otf")

fonte = pygame.font.Font(FONTE_PATH, 30)
fonte_grande = pygame.font.Font(FONTE_PATH, 60)
fonte_titulo = pygame.font.Font(FONTE_PATH, 72)
fonte_pequena = pygame.font.Font(FONTE_PATH, 22)

clock = pygame.time.Clock()

# ================================ CHÃO (pré-renderizado) ================================

chao_surface = pygame.Surface((LARGURA, ALTURA_CHAO))
chao_surface.fill(CHAO)
for i in range(0, LARGURA, 20):
    altura_linha = random.randint(5, 15)
    pygame.draw.line(chao_surface, (50, 100, 90), (i, 0), (i, altura_linha), 2)

# ================================ ESTADO DO JOGO ================================

DINO_Y_CHAO = Y_CHAO - 50
DINO_TAMANHO = (60, 60)
DINO_AGACHADO = (60, 35)

dino = pygame.Rect(80, DINO_Y_CHAO, *DINO_TAMANHO)
vel_y = 0
gravidade = 0.8
pulando = False
agachado = False

obstaculos = []
velocidade = 6

nuvens = [[random.randint(0, LARGURA), random.randint(70, 320)] for _ in range(4)]
pedras = []
particulas = []
pontos = 0
recorde = 0
menu = True
game_over = False
pause = False
som_ativo = True


def carregar_recorde():
    global recorde
    try:
        with open(caminho_dados(), encoding="utf-8") as arquivo:
            recorde = int(json.load(arquivo).get("recorde", 0))
    except (FileNotFoundError, json.JSONDecodeError, OSError, ValueError):
        recorde = 0


def salvar_recorde():
    try:
        with open(caminho_dados(), "w", encoding="utf-8") as arquivo:
            json.dump({"recorde": recorde}, arquivo)
    except OSError:
        pass


carregar_recorde()


def criar_obstaculo():
    tipo = random.choice(["small", "big", "bird"])
    if tipo == "small":
        return {
            "tipo": "small",
            "rect": pygame.Rect(LARGURA, Y_CHAO - 40, 30, 40),
            "img": cactus_small_img,
        }
    if tipo == "big":
        return {
            "tipo": "big",
            "rect": pygame.Rect(LARGURA, Y_CHAO - 60, 40, 60),
            "img": cactus_big_img,
        }

    y_base = random.choice([Y_CHAO - 100, Y_CHAO - 80])
    return {
        "tipo": "bird",
        "rect": pygame.Rect(LARGURA, y_base, 50, 30),
        "img": bird_img,
        "y_base": y_base,
        "fase": random.uniform(0, math.tau),
    }


def hitbox_dino(pousou=False, quer_agachar=False):
    if pulando:
        rect = pygame.Rect(dino.x, dino.y, *DINO_TAMANHO)
    elif pousou or (quer_agachar and not agachado):
        rect = pygame.Rect(dino.x, DINO_Y_CHAO, *DINO_TAMANHO)
    elif agachado:
        y = DINO_Y_CHAO + DINO_TAMANHO[1] - DINO_AGACHADO[1]
        rect = pygame.Rect(dino.x, y, *DINO_AGACHADO)
    else:
        rect = pygame.Rect(dino.x, DINO_Y_CHAO, *DINO_TAMANHO)
    return rect.inflate(-12, -8)


def hitbox_obstaculo(obs):
    rect = obs["rect"]
    if obs["tipo"] == "bird":
        return rect.inflate(-8, -4)
    return rect.inflate(-2, -2)


def calcular_escala():
    escala_flutuante = min(tamanho_janela[0] / LARGURA, tamanho_janela[1] / ALTURA)
    escala = max(1, int(escala_flutuante))
    largura_escala = LARGURA * escala
    altura_escala = ALTURA * escala
    offset_x = (tamanho_janela[0] - largura_escala) // 2
    offset_y = (tamanho_janela[1] - altura_escala) // 2
    return escala, offset_x, offset_y, largura_escala, altura_escala


def posicao_jogo(pos):
    if tamanho_janela == (LARGURA, ALTURA):
        return pos
    escala, offset_x, offset_y, _, _ = calcular_escala()
    return ((pos[0] - offset_x) / escala, (pos[1] - offset_y) / escala)


def alternar_maximizar():
    global janela, maximizado, tamanho_janela

    maximizado = not maximizado
    if maximizado:
        info = pygame.display.Info()
        janela = pygame.display.set_mode((info.current_w, info.current_h), pygame.FULLSCREEN)
        tamanho_janela = (info.current_w, info.current_h)
    else:
        janela = pygame.display.set_mode((LARGURA, ALTURA), pygame.RESIZABLE)
        tamanho_janela = (LARGURA, ALTURA)


def apresentar_tela():
    if tamanho_janela == (LARGURA, ALTURA):
        janela.blit(tela, (0, 0))
    else:
        _, offset_x, offset_y, largura_escala, altura_escala = calcular_escala()
        janela.fill(PRETO)
        janela.blit(
            pygame.transform.scale(tela, (largura_escala, altura_escala)),
            (offset_x, offset_y),
        )
    pygame.display.update()


def processar_evento_tela(evento):
    global janela, tamanho_janela, maximizado

    if evento.type == pygame.VIDEORESIZE and not maximizado:
        tamanho_janela = (max(evento.w, LARGURA), max(evento.h, ALTURA))
        janela = pygame.display.set_mode(tamanho_janela, pygame.RESIZABLE)
    if evento.type == pygame.KEYDOWN and evento.key == pygame.K_F11:
        alternar_maximizar()


def texto(msg, fonte_usada, x, y, cor=PRETO):
    tela.blit(fonte_usada.render(msg, True, cor), (x, y))


def texto_centralizado(msg, fonte_usada, y, cor=PRETO):
    render = fonte_usada.render(msg, True, cor)
    x = (LARGURA - render.get_width()) // 2
    tela.blit(render, (x, y))


def desenhar_painel(centro_x, centro_y, largura, altura, alpha=220):
    rect = pygame.Rect(0, 0, largura, altura)
    rect.center = (centro_x, centro_y)
    painel = pygame.Surface((largura, altura), pygame.SRCALPHA)
    pygame.draw.rect(painel, (255, 255, 255, alpha), painel.get_rect(), border_radius=16)
    pygame.draw.rect(painel, PRETO, painel.get_rect(), 3, border_radius=16)
    tela.blit(painel, rect.topleft)
    return rect


def desenhar_tecla(texto_tecla, x, y, largura=54, altura=32):
    box = pygame.Rect(x, y, largura, altura)
    pygame.draw.rect(tela, (235, 235, 235), box, border_radius=6)
    pygame.draw.rect(tela, PRETO, box, 2, border_radius=6)
    render = fonte_pequena.render(texto_tecla, True, PRETO)
    tela.blit(
        render,
        (
            x + (largura - render.get_width()) // 2,
            y + (altura - render.get_height()) // 2,
        ),
    )
    return box


def desenhar_tecla_baixo(x, y, largura=54, altura=32):
    box = pygame.Rect(x, y, largura, altura)
    pygame.draw.rect(tela, (235, 235, 235), box, border_radius=6)
    pygame.draw.rect(tela, PRETO, box, 2, border_radius=6)
    cx, cy = box.centerx, box.centery
    pygame.draw.polygon(tela, PRETO, [(cx, cy + 6), (cx - 7, cy - 4), (cx + 7, cy - 4)])
    return box


def desenhar_linha_controle(x_tecla, x_label, y, tecla, descricao, seta_baixo=False):
    if seta_baixo:
        desenhar_tecla_baixo(x_tecla, y)
    else:
        desenhar_tecla(tecla, x_tecla, y)

    render_desc = fonte_pequena.render(descricao, True, PRETO)
    tela.blit(render_desc, (x_label, y + (32 - render_desc.get_height()) // 2))


def desenhar_controles_menu(painel):
    largura_tecla = 54
    espaco = 14
    altura_linha = 36

    descricoes = ["Pular", "Agachar", "Pausar", "Som"]
    largura_label = max(fonte_pequena.render(desc, True, PRETO).get_width() for desc in descricoes)
    largura_bloco = largura_tecla + espaco + largura_label
    x_tecla = painel.centerx - largura_bloco // 2
    x_label = x_tecla + largura_tecla + espaco

    y_sep = painel.y + 205
    pygame.draw.line(tela, CINZA, (painel.x + 36, y_sep), (painel.right - 36, y_sep), 1)

    y = y_sep + 18
    desenhar_linha_controle(x_tecla, x_label, y, "ESP", "Pular")
    y += altura_linha
    desenhar_linha_controle(x_tecla, x_label, y, "", "Agachar", seta_baixo=True)
    y += altura_linha

    largura_par = largura_bloco * 2 + 28
    x_par = painel.centerx - largura_par // 2
    x_tecla_p = x_par
    x_label_p = x_tecla_p + largura_tecla + espaco
    x_tecla_m = x_par + largura_bloco + 28
    x_label_m = x_tecla_m + largura_tecla + espaco

    desenhar_linha_controle(x_tecla_p, x_label_p, y, "P", "Pausar")
    desenhar_linha_controle(x_tecla_m, x_label_m, y, "M", "Som")

    render_tela = fonte_pequena.render("F11 - Maximizar tela", True, CINZA)
    tela.blit(render_tela, (painel.centerx - render_tela.get_width() // 2, painel.bottom - 28))


def desenhar_fundo():
    tela.fill(CEU)
    tela.blit(background_img, (0, FUNDO_Y))
    tela.blit(chao_surface, (0, Y_CHAO))


def desenhar_overlay(titulo, linhas, cor_titulo=PRETO):
    overlay = pygame.Surface((LARGURA, ALTURA), pygame.SRCALPHA)
    overlay.fill((255, 255, 255, 140))
    tela.blit(overlay, (0, 0))

    altura_painel = 120 + len(linhas) * 34 + 24
    painel = desenhar_painel(LARGURA // 2, ALTURA // 2, 520, altura_painel)
    texto_centralizado(titulo, fonte_titulo, painel.y + 28, cor_titulo)

    y = painel.y + 100
    for linha, cor in linhas:
        fonte_linha = fonte if len(linha) <= 18 else fonte_pequena
        texto_centralizado(linha, fonte_linha, y, cor)
        y += 34


def formatar_pontos(valor):
    return f"{valor // 100:04d}"


def resetar_jogo():
    global pontos, velocidade, obstaculos, pedras, particulas
    global vel_y, pulando, agachado, pause, game_over

    pontos = 0
    velocidade = 6
    obstaculos = []
    pedras = []
    particulas = []
    vel_y = 0
    pulando = False
    agachado = False
    pause = False
    game_over = False
    dino.update(80, DINO_Y_CHAO, *DINO_TAMANHO)


def alternar_som():
    global som_ativo
    som_ativo = not som_ativo
    if som_ativo:
        pygame.mixer.music.set_volume(0.3)
    else:
        pygame.mixer.music.set_volume(0.0)


def desenhar_cenario():
    desenhar_fundo()

    for nuvem in nuvens:
        tela.blit(cloud_img, (nuvem[0], nuvem[1]))

    for pedra in pedras:
        pygame.draw.circle(tela, (90, 90, 90), pedra, 3)


def desenhar_dino():
    altura = max(0, DINO_Y_CHAO - dino.y)
    largura_sombra = max(20, 60 - int(altura * 0.15))
    alpha = max(20, 80 - int(altura * 0.3))

    sombra = pygame.Surface((largura_sombra, 15), pygame.SRCALPHA)
    pygame.draw.ellipse(sombra, (0, 0, 0, alpha), (0, 0, largura_sombra, 15))
    pos_x = dino.x + (60 - largura_sombra) // 2
    tela.blit(sombra, (pos_x, Y_CHAO))

    if agachado and not pulando:
        sprite_y = DINO_Y_CHAO + (DINO_TAMANHO[1] - DINO_AGACHADO[1])
        imagem = pygame.transform.scale(dino_img, DINO_AGACHADO)
        tela.blit(imagem, (dino.x, sprite_y))
    else:
        tela.blit(dino_img, (dino.x, dino.y))


def desenar_hud():
    hud = pygame.Surface((LARGURA, 46), pygame.SRCALPHA)
    pygame.draw.rect(hud, (255, 255, 255, 180), hud.get_rect())
    tela.blit(hud, (0, 0))

    texto(f"Pontos: {formatar_pontos(pontos)}", fonte_pequena, 20, 12)
    render_recorde = fonte_pequena.render(f"Recorde: {formatar_pontos(recorde)}", True, PRETO)
    tela.blit(render_recorde, (LARGURA - render_recorde.get_width() - 20, 12))
    if not som_ativo:
        render_som = fonte_pequena.render("Som: OFF", True, CINZA)
        tela.blit(render_som, (LARGURA // 2 - render_som.get_width() // 2, 12))


def processar_pulo():
    global vel_y, pulando, agachado
    if not pulando:
        agachado = False
        vel_y = -15
        pulando = True
        if som_ativo:
            jump.play()


def atualizar_movimento_dino():
    global vel_y, pulando

    dino.height = DINO_TAMANHO[1]
    dino.y += vel_y
    vel_y += gravidade

    pousou = False
    if dino.y >= DINO_Y_CHAO:
        if pulando:
            pousou = True
        dino.y = DINO_Y_CHAO
        pulando = False
        vel_y = 0

    return pousou


def aplicar_agachado(teclas):
    global agachado

    agachado = teclas[pygame.K_DOWN] and not pulando and dino.y >= DINO_Y_CHAO
    if agachado:
        dino.height = DINO_AGACHADO[1]
        dino.y = DINO_Y_CHAO + (DINO_TAMANHO[1] - DINO_AGACHADO[1])
    elif not pulando:
        dino.height = DINO_TAMANHO[1]
        dino.y = DINO_Y_CHAO


def atualizar_particulas(pousou):
    global particulas

    if pousou:
        for _ in range(10):
            particulas.append(
                [
                    dino.x + 30,
                    Y_CHAO,
                    random.randint(-3, 3),
                    random.randint(-5, -1),
                    random.randint(3, 6),
                ]
            )

    novas_particulas = []
    for particula in particulas:
        particula[0] += particula[2]
        particula[1] += particula[3]
        particula[3] += 0.3
        particula[4] -= 0.2
        if particula[4] > 0:
            novas_particulas.append(particula)

    particulas = novas_particulas


def atualizar_obstaculos(pousou=False, quer_agachar=False):
    global game_over

    if len(obstaculos) == 0 or obstaculos[-1]["rect"].x < LARGURA - random.randint(250, 400):
        obstaculos.append(criar_obstaculo())

    hitbox = hitbox_dino(pousou=pousou, quer_agachar=quer_agachar)
    for obs in obstaculos:
        obs["rect"].x -= velocidade
        if obs["tipo"] == "bird":
            obs["fase"] += 0.08
            obs["rect"].y = obs["y_base"] + int(math.sin(obs["fase"]) * 18)

        if hitbox.colliderect(hitbox_obstaculo(obs)):
            if som_ativo:
                hit.play()
            game_over = True
            break

    obstaculos[:] = [obs for obs in obstaculos if obs["rect"].x > -50]


def atualizar_cenario():
    global pontos, velocidade, recorde

    if random.randint(0, 20) == 0:
        pedras.append([LARGURA, random.randint(Y_CHAO + 10, Y_CHAO + 40)])

    for pedra in pedras:
        pedra[0] -= velocidade
    pedras[:] = [pedra for pedra in pedras if pedra[0] > -10]

    for nuvem in nuvens:
        nuvem[0] -= 2
        if nuvem[0] < -80:
            nuvem[0] = LARGURA
            nuvem[1] = random.randint(70, 320)

    pontos += 1
    if pontos % 200 == 0:
        velocidade += 0.5
    if pontos > recorde:
        recorde = pontos
        salvar_recorde()


def desenhar_particulas_e_obstaculos():
    for particula in particulas:
        pygame.draw.circle(
            tela,
            (200, 200, 200),
            (int(particula[0]), int(particula[1])),
            int(particula[4]),
        )

    desenhar_dino()

    for obs in obstaculos:
        tela.blit(obs["img"], (obs["rect"].x, obs["rect"].y))


def iniciar_jogo():
    global menu
    menu = False
    resetar_jogo()


def voltar_menu():
    global menu, game_over
    game_over = False
    menu = True
    resetar_jogo()


def desenhar_menu():
    desenhar_fundo()

    painel = desenhar_painel(LARGURA // 2, ALTURA // 2, 500, 360)
    texto_centralizado("DINO GAME", fonte_titulo, painel.y + 24)
    texto_centralizado(f"Recorde: {formatar_pontos(recorde)}", fonte_pequena, painel.y + 88, CINZA)

    texto_jogar = fonte_grande.render("JOGAR", True, PRETO)
    botao = pygame.Rect(
        0,
        painel.y + 118,
        texto_jogar.get_width() + 48,
        texto_jogar.get_height() + 14,
    )
    botao.centerx = painel.centerx

    mouse = posicao_jogo(pygame.mouse.get_pos())
    cor_botao = (0, 180, 0) if botao.collidepoint(mouse) else VERDE
    pygame.draw.rect(tela, cor_botao, botao, border_radius=10)
    pygame.draw.rect(tela, PRETO, botao, 2, border_radius=10)
    tela.blit(
        texto_jogar,
        (
            botao.x + (botao.width - texto_jogar.get_width()) // 2,
            botao.y + (botao.height - texto_jogar.get_height()) // 2,
        ),
    )

    desenhar_controles_menu(painel)

    return botao


# ================================ LOOP ================================

rodando = True

while rodando:
    if menu:
        botao = desenhar_menu()

        for evento in pygame.event.get():
            if evento.type == pygame.QUIT:
                rodando = False
            processar_evento_tela(evento)
            if evento.type == pygame.MOUSEBUTTONDOWN and botao.collidepoint(posicao_jogo(evento.pos)):
                iniciar_jogo()
            if evento.type == pygame.KEYDOWN:
                if evento.key in (pygame.K_RETURN, pygame.K_SPACE):
                    iniciar_jogo()

        apresentar_tela()
        clock.tick(FPS)
        continue

    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            rodando = False
        processar_evento_tela(evento)
        if evento.type == pygame.KEYDOWN:
            if evento.key == pygame.K_SPACE:
                processar_pulo()
            if evento.key == pygame.K_p:
                pause = not pause
            if evento.key == pygame.K_m:
                alternar_som()
            if evento.key == pygame.K_ESCAPE:
                voltar_menu()

    if pause:
        desenhar_cenario()
        desenhar_particulas_e_obstaculos()
        desenar_hud()
        desenhar_overlay("PAUSADO", [("P - Continuar", PRETO), ("F11 - Maximizar tela", CINZA)])
        apresentar_tela()
        clock.tick(FPS)
        continue

    teclas = pygame.key.get_pressed()
    pousou = atualizar_movimento_dino()
    atualizar_obstaculos(pousou=pousou, quer_agachar=teclas[pygame.K_DOWN])
    aplicar_agachado(teclas)
    atualizar_particulas(pousou)
    atualizar_cenario()

    desenhar_cenario()
    desenhar_particulas_e_obstaculos()
    desenar_hud()
    apresentar_tela()
    clock.tick(FPS)

    while game_over:
        desenhar_cenario()
        desenhar_particulas_e_obstaculos()
        desenar_hud()

        linhas = [(f"Pontos: {formatar_pontos(pontos)}", PRETO)]
        if pontos >= recorde and pontos > 0:
            linhas.append(("Novo recorde!", VERDE))
        linhas.extend(
            [
                ("ESPACO - Jogar novamente", PRETO),
                ("ESC - Menu", CINZA),
                ("F11 - Maximizar tela", CINZA),
            ]
        )
        desenhar_overlay("GAME OVER", linhas)

        for evento in pygame.event.get():
            if evento.type == pygame.QUIT:
                rodando = False
                game_over = False
            processar_evento_tela(evento)
            if evento.type == pygame.MOUSEBUTTONDOWN:
                resetar_jogo()
            if evento.type == pygame.KEYDOWN:
                if evento.key in (pygame.K_SPACE, pygame.K_RETURN):
                    resetar_jogo()
                if evento.key == pygame.K_ESCAPE:
                    voltar_menu()

        apresentar_tela()
        clock.tick(FPS)

pygame.quit()
