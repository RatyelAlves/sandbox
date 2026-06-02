# Dino Game

Jogo inspirado no clássico dinossauro do Chrome, desenvolvido em Python com Pygame.

**Autor:** Ratiel Alves de Souza

## Funcionalidades

- Menu inicial com recorde salvo localmente
- Obstáculos variados: cactos e pássaros
- Pulo, agachamento e pausa
- Velocidade progressiva conforme a pontuação
- Som e música com opção de mutar
- Tela cheia com **F11**, mantendo pixels nítidos

## Controles

| Tecla | Ação |
| --- | --- |
| Espaço / Enter | Pular, iniciar ou reiniciar |
| Seta para baixo | Agachar |
| P | Pausar |
| M | Ligar/desligar som |
| F11 | Maximizar / restaurar tela |
| ESC | Voltar ao menu |

## Requisitos

- Python 3.10+
- Pygame

## Como executar

### Opção 1 — Python

```bash
pip install -r requirements.txt
python dino.py
```

### Opção 2 — Windows (executável)

Abra a pasta `release/` e execute `dino.exe`.

### Opção 3 — Atalho Python (Windows)

```bash
jogar.bat
```

## Gerar / atualizar release

```bash
gerar-release.bat
```

Isso compila o jogo e copia o executável para a pasta `release/`.

## Estrutura do projeto

```
dino-game/
├── assets/           # Imagens, sons e fontes
├── release/          # Versão pronta para jogar (dino.exe)
├── dino.py           # Código principal do jogo
├── dino.spec         # Configuração do PyInstaller
├── gerar-release.bat # Gera o executável na pasta release
├── jogar.bat         # Atalho para rodar via Python
├── requirements.txt
└── README.md
```

## Observações

- O recorde é salvo automaticamente em `recorde.json` (ignorado pelo Git).
- Pastas `build/` e `dist/` são temporárias do PyInstaller e ficam fora do Git.
