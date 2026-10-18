# CashBook

Livro caixa para desktop (Windows) e Android. O mesmo `index.html` registra débitos e créditos, despesas e entradas fixas, parcelamento, impressão do livro, exportação CSV e backup.

Os dados ficam no aparelho. Não há servidor.

## O que o app faz

- Lançamentos do período, com histórico, documento, categoria, forma e situação
- Saldo anterior, saldo do período, valores em aberto e saldo previsto
- Entradas e despesas fixas (mensais ou anuais)
- Compra parcelada e empréstimo, uma parcela por mês
- Impressão do livro, exportação CSV e restauração de backup
- Cadastro do titular, formas de liquidação e categorias
- Tema claro ou escuro

## Desktop (Windows)

Precisa de Python 3 e do [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) (já vem no Windows 11 e na maioria dos Windows 10 atualizados).

Na pasta `cashbook`:

```bat
pip install pywebview
python app.py
```

A janela abre o livro em tela cheia de app. Perfil e arquivos copiados da interface ficam em `%APPDATA%\LivroCaixa`.

## Android

O app é um WebView que carrega o mesmo `index.html`. Exige Android 10 (API 29) ou mais novo.

1. Instale o [Android Studio](https://developer.android.com/studio).
2. **File → Open** e escolha a pasta `cashbook/android`.
3. Espere o Gradle sincronizar. O build copia `index.html` e `bg.jpg` da pasta pai para os assets.
4. Conecte um celular ou suba um emulador e clique em **Run**.

CSV e backup saem na pasta **Downloads** do aparelho.

## Estrutura

```
app.py        janela desktop (pywebview + Edge)
index.html    livro caixa (interface e dados)
bg.jpg        fundo da tela
icon.ico      ícone da janela no Windows
android/      app Android (WebView)
```
