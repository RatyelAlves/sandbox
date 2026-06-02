# FlashPDF

Aplicacao Windows para **impressao em lote de arquivos PDF**, com interface grafica. Desenvolvida para o **3o Tabelionato de Protesto de Titulos de Belo Horizonte**.

Extrai PDFs de pastas, subpastas e arquivos **ZIP** (e **RAR**, se o WinRAR estiver instalado). Utiliza **SumatraPDF** para imprimir.

---

## Download

### Recomendado — um unico arquivo (nao precisa instalar SumatraPDF)

**[Baixar FlashPDF_Portable.exe](release/FlashPDF_Portable.exe)** (~16 MB)

1. Baixe o arquivo acima
2. Duplo clique em `FlashPDF_Portable.exe`
3. Selecione a pasta com PDFs e clique em **IMPRIMIR**

Link direto no GitHub (troque `SEU_USUARIO`):

```
https://github.com/RatyelAlves/print-pdf/raw/main/release/FlashPDF_Portable.exe
```

### Versao padrao (exige SumatraPDF instalado)

**[Baixar FlashPDF.exe](release/FlashPDF.exe)** (~125 KB)

Instale o [SumatraPDF](https://www.sumatrapdfreader.org/download-free-pdf-viewer) antes de usar.

---

## Requisitos

| Item | Portable | Padrao |
|------|----------|--------|
| Windows 10/11 | Sim | Sim |
| SumatraPDF | Nao (incluso) | Sim |
| WinRAR | So para `.rar` | So para `.rar` |

---

## Uso rapido

1. **Selecionar pasta** (ou arrastar uma pasta para a janela)
2. Aguardar a contagem de PDFs na fila
3. Clicar em **IMPRIMIR**
4. Escolher impressora e frente/verso
5. Confirmar

Log de impressao: `%LOCALAPPDATA%\FlashPDF\print-log.txt`

---

## Documentacao completa

**[FlashPDF/README.md](FlashPDF/README.md)**

---

## Atualizar o download no GitHub

```powershell
cd FlashPDF
powershell -ExecutionPolicy Bypass -File .\scripts\publish-release.ps1

cd ..
git add .
git commit -m "Atualiza executaveis"
git push origin main
```

Isso regera os arquivos em `release/` e sobe para o GitHub.

---

## Licenca

Projeto interno do 3o Tabelionato de Protesto de Titulos de Belo Horizonte.  
SumatraPDF e WinRAR sao softwares de terceiros com licencas proprias.
