# FlashPDF

Aplicacao Windows para **impressao em lote de arquivos PDF**, com interface grafica. Desenvolvida para o **3o Tabelionato de Protesto de Titulos de Belo Horizonte**.

Utiliza **SumatraPDF** para imprimir e permite extrair PDFs de pastas, subpastas e arquivos **ZIP** (e **RAR**, se o WinRAR estiver instalado).

---

## Indice

1. [Para quem vai usar o programa](#para-quem-vai-usar-o-programa)
2. [Onde estao os arquivos .exe](#onde-estao-os-arquivos-exe)
3. [Instalacao nas maquinas do cartorio](#instalacao-nas-maquinas-do-cartorio)
4. [Como executar o FlashPDF](#como-executar-o-flashpdf)
5. [Como usar o programa](#como-usar-o-programa)
6. [Requisitos](#requisitos)
7. [Para desenvolvedores - gerar o .exe](#para-desenvolvedores---gerar-o-exe)
8. [Para desenvolvedores - gerar o instalador](#para-desenvolvedores---gerar-o-instalador)
9. [Estrutura do projeto](#estrutura-do-projeto)
10. [Problemas comuns](#problemas-comuns)

---

## Para quem vai usar o programa

Voce **nao precisa** do PowerShell nem do codigo-fonte. Basta um destes:

| Opcao | Arquivo | Quando usar |
|-------|---------|-------------|
| **Instalador portable** (recomendado) | `installer\Output\FlashPDF_Portable_Setup.exe` | Distribuir sem precisar instalar SumatraPDF |
| **Instalador padrao** | `installer\Output\FlashPDF_Setup.exe` | Instala FlashPDF + SumatraPDF (se incluido no build) |
| **Portable direto** | `dist\FlashPDF_Portable.exe` | Pen drive ou copiar um unico arquivo |
| **Programa direto** | `dist\FlashPDF.exe` | Teste rapido (exige Sumatra instalado) |

---

## Onde estao os arquivos .exe

Todos os caminhos abaixo sao relativos a pasta **FlashPDF** do projeto.

### Programa (aplicacao)

| Descricao | Caminho |
|-----------|---------|
| **Executavel portable (Sumatra incluso)** | `dist\FlashPDF_Portable.exe` |
| **Executavel padrao** | `dist\FlashPDF.exe` |
| Copia usada pelo Inno Setup | `installer\FlashPDF.exe` |

**Caminho completo de exemplo** (ajuste se o OneDrive mudar o nome da pasta):

```
C:\Users\SEU_USUARIO\OneDrive\...\PrintPDF Code\FlashPDF\dist\FlashPDF.exe
```

### Instalador (setup para outras maquinas)

| Descricao | Caminho |
|-----------|---------|
| **Instalador portable** | `installer\Output\FlashPDF_Portable_Setup.exe` |
| **Instalador padrao** | `installer\Output\FlashPDF_Setup.exe` |

So existe **depois** de compilar o Inno Setup (veja secao [gerar o instalador](#para-desenvolvedores---gerar-o-instalador)).

---

## Instalacao nas maquinas do cartorio

### Com o instalador (recomendado)

1. Copie `installer\Output\FlashPDF_Setup.exe` para um pen drive, rede ou e-mail interno.
2. Na maquina de destino, de um **duplo clique** no `FlashPDF_Setup.exe`.
3. Siga o assistente (Next / Avancar).
4. Se o setup incluir o SumatraPDF, ele sera instalado automaticamente em segundo plano.
5. Ao final, use o atalho **FlashPDF** no menu Iniciar (ou na Area de Trabalho, se marcou a opcao).

**Pasta padrao apos instalar:**

```
C:\Program Files\FlashPDF\FlashPDF.exe
```

(ou `C:\Users\...\AppData\Local\Programs\...` dependendo da escolha no assistente)

### Sem instalador (copiar o .exe)

1. Copie apenas o arquivo `dist\FlashPDF.exe` para a maquina.
2. Instale o [SumatraPDF](https://www.sumatrapdfreader.org/download-free-pdf-viewer) manualmente (obrigatorio).
3. De duplo clique em `FlashPDF.exe`.

---

## Como executar o FlashPDF

### Apos instalar pelo setup

- Menu Iniciar → **FlashPDF**
- Ou atalho na Area de Trabalho (se foi criado na instalacao)

### Usando o .exe copiado (`dist\FlashPDF.exe`)

1. Abra o Explorer e va ate a pasta onde esta o `FlashPDF.exe`.
2. **Duplo clique** em `FlashPDF.exe`.
3. Nao e necessario abrir o PowerShell.

### Pelo codigo-fonte (somente teste / desenvolvimento)

```powershell
cd "CAMINHO\PrintPDF Code\FlashPDF"
powershell -ExecutionPolicy Bypass -STA -File ".\src\flashpdf.ps1"
```

---

## Como usar o programa

1. Clique em **Selecionar pasta** e escolha a pasta com os PDFs (ou ZIP/RAR), ou **arraste uma pasta** para a janela do programa.
2. Aguarde a contagem: aparece quantos PDFs serao impressos e a lista na fila.
3. Use **Atualizar** se voce adicionou ou removeu arquivos na pasta sem fechar o programa.
4. (Opcional) Em **Ordenar por**, escolha: Nome, Data ou Pasta.
5. Clique em **IMPRIMIR**.
6. Escolha a **impressora** e, se quiser, marque **frente e verso** (a ultima escolha e lembrada na proxima vez).
7. Confirme na caixa de dialogo (quantidade e impressora).
8. Acompanhe a barra de progresso; use **Cancelar impressao** se precisar parar.
9. Se houver erros, o programa oferece **reimprimir apenas os arquivos com falha**.

**Preferencias salvas automaticamente** (pasta, impressora, duplex e ordenacao):

```
%LOCALAPPDATA%\FlashPDF\settings.json
```

**Log de impressao:**

```
%LOCALAPPDATA%\FlashPDF\print-log.txt
```

No programa: botao **Abrir pasta do log**.

---

## Requisitos

| Item | Obrigatorio? | Observacao |
|------|----------------|------------|
| Windows 10/11 | Sim | |
| SumatraPDF | Sim | Instalado pelo setup ou manualmente |
| WinRAR | Nao | Apenas para arquivos `.rar` |
| PowerShell 5.1 | Nao* | *So para gerar o .exe ou rodar o `.ps1` |

---

## Para desenvolvedores - gerar o .exe

Abra o **PowerShell**, va ate a pasta **FlashPDF** e execute:

```powershell
cd "C:\Users\SEU_USUARIO\...\PrintPDF Code\FlashPDF"
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

**Saida:**

- `dist\FlashPDF.exe` — programa para uso ou distribuicao
- `installer\FlashPDF.exe` — copia para compilar o instalador no Inno Setup

**Primeira vez:** o script pode instalar o modulo `ps2exe` automaticamente (confirme com **S** ou **Y**).

Para publicar no GitHub (pasta `release/`):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-release.ps1
```

A versao exibida no programa esta em `src\flashpdf.ps1` (`$script:AppVersion`).

---

## Um unico .exe (portable — recomendado para pen drive)

E possivel gerar **um unico arquivo** que ja inclui o SumatraPDF portable. Nao precisa instalar nada alem do Windows.

```powershell
cd "...\PrintPDF Code\FlashPDF"
powershell -ExecutionPolicy Bypass -File .\build-portable.ps1
```

**Saida:** `dist\FlashPDF_Portable.exe` (~15 MB)

Na primeira execucao, o Sumatra embutido e extraido para:

```
%LOCALAPPDATA%\FlashPDF\SumatraPDF.exe
```

**O que entra no pacote unico:**

| Incluso | Observacao |
|---------|------------|
| FlashPDF | Sim |
| SumatraPDF | Sim (portable, embutido) |
| WinRAR | Nao (software pago; `.rar` ainda exige WinRAR instalado) |
| ZIP / PDF | Sim (Windows nativo) |

Para usar: copie **somente** `FlashPDF_Portable.exe` para outra maquina e de duplo clique.

### Instalador portable (Inno Setup)

Para distribuir com atalhos no Menu Iniciar (sem instalar Sumatra separadamente):

```powershell
powershell -ExecutionPolicy Bypass -File .\compilar-instalador.ps1
```

Gera **dois** instaladores em `installer\Output\`:

| Arquivo | Conteudo |
|---------|----------|
| `FlashPDF_Portable_Setup.exe` | FlashPDF + Sumatra embutido |
| `FlashPDF_Setup.exe` | FlashPDF + instala SumatraPDF (se presente no build) |

---

## Para desenvolvedores - gerar o instalador

### Pre-requisitos

1. **Inno Setup 6** — https://jrsoftware.org/isinfo.php  
2. (Opcional) Instalador do Sumatra 64-bit salvo como:  
   `FlashPDF\SumatraPDF-3.5.2-64-install.exe`  
   Download: https://www.sumatrapdfreader.org/download-free-pdf-viewer  

### Opcao A - Um comando (recomendado)

```powershell
cd "...\PrintPDF Code\FlashPDF"
powershell -ExecutionPolicy Bypass -File .\compilar-instalador.ps1
```

Gera o `.exe` do app e, se o Inno Setup estiver instalado, compila o setup.

### Opcao B - Passo a passo manual

**Passo 1** — Gerar o programa:

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

Confirme que existe: `installer\FlashPDF.exe`

**Passo 2** — Inno Setup:

1. Abra o Inno Setup 6.
2. **File → Open** → `installer\FlashPDF_Setup.iss`
3. **Build → Compile** (Ctrl+F9)

**Saida do instalador:**

```
installer\Output\FlashPDF_Setup.exe
```

### Erro "Falta FlashPDF.exe" no Inno

Execute o `build.ps1` **antes** de compilar. O arquivo deve estar em:

```
installer\FlashPDF.exe
```

(na **mesma pasta** do arquivo `FlashPDF_Setup.iss`)

---

## Estrutura do projeto

```
FlashPDF/
├── README.md                 ← este arquivo
├── src/
│   ├── flashpdf.ps1          ← codigo-fonte
│   └── flashpdf.ico          ← icone
├── dist/
│   ├── FlashPDF.exe          ← PROGRAMA padrao
│   └── FlashPDF_Portable.exe ← PROGRAMA portable (Sumatra incluso)
├── installer/
│   ├── FlashPDF_Setup.iss    ← instalador padrao
│   ├── FlashPDF_Portable_Setup.iss ← instalador portable
│   ├── FlashPDF.exe          ← copia para compilar o setup padrao
│   ├── FlashPDF_Portable.exe ← copia para compilar o setup portable
│   └── Output/
│       ├── FlashPDF_Setup.exe
│       └── FlashPDF_Portable_Setup.exe
├── scripts/
│   ├── create-icon.ps1
│   ├── prepare-sumatra.ps1
│   └── publish-release.ps1
├── build.ps1                 ← gera dist\FlashPDF.exe
├── build-portable.ps1        ← gera dist\FlashPDF_Portable.exe (Sumatra incluso)
├── compilar-instalador.ps1   ← build + Inno (padrao e portable)
├── bundled/
│   └── SumatraPDF.exe        ← Sumatra portable (gerado pelo prepare-sumatra.ps1)
└── SumatraPDF-3.5.2-64-install.exe  (opcional, para o setup)
```

---

## Problemas comuns

| Problema | Solucao |
|----------|---------|
| "SumatraPDF nao encontrado" | Instale o SumatraPDF ou use o `FlashPDF_Setup.exe` que instala junto |
| ZIP nao abre | ZIP usa Windows nativo; verifique se o arquivo nao esta corrompido |
| RAR ignorado | Instale o WinRAR ou converta para ZIP |
| Inno pede build.ps1 | Rode `build.ps1` e confira `installer\FlashPDF.exe` |
| Antivirus bloqueia o .exe | Comum em apps gerados por PowerShell; adicione excecao interna |
| Pasta no OneDrive "vazia" | Clique com botao direito na pasta → **Manter sempre neste dispositivo** |

---

## Contato / suporte interno

Em caso de erro na impressao, envie o arquivo de log:

```
%LOCALAPPDATA%\FlashPDF\print-log.txt
```

Ou use o botao **Abrir pasta do log** dentro do programa.
