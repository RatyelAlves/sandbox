# Downloads

Executaveis para download manual pelo GitHub.

| Arquivo | Descricao |
|---------|-----------|
| `FlashPDF_Portable.exe` | **Recomendado** — um unico arquivo, SumatraPDF incluso |
| `FlashPDF.exe` | Versao padrao — exige SumatraPDF instalado no PC |

Para regerar:

```powershell
cd FlashPDF
powershell -ExecutionPolicy Bypass -File .\scripts\publish-release.ps1
```

Depois faca commit e push da pasta `release/`.
