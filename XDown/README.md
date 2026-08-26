# XDown

App Android para baixar fotos, GIFs e vídeos de um **perfil público** do X (Twitter) a partir do link.

Cole `https://x.com/usuario`, `@usuario` ou só o nome do perfil. O app lista a mídia e salva os arquivos na galeria (`Pictures/XDown` para fotos, `Movies/XDown` para vídeos).

## Como abrir

1. Instale o [Android Studio](https://developer.android.com/studio).
2. **File → Open** e escolha esta pasta `XDown`.
3. Espere o Gradle sincronizar (o Android Studio usa o JDK embutido; não precisa do Java 25 do sistema).
4. Conecte um celular com Android 10+ ou suba um emulador.
5. Clique em **Run**.

Você também pode compartilhar um link de perfil do X para o XDown pelo menu Compartilhar.

## Limites importantes

- Use só para conteúdo que **você tem permissão** de copiar (por exemplo, backup do seu próprio perfil).
- Contas **protegidas**, suspensas ou inexistentes não funcionam.
- A listagem vem da [API pública do FxEmbed](https://api.fxtwitter.com), um serviço de terceiros. Ela pode mudar, limitar requisições ou ficar fora do ar. A API oficial do X hoje é paga e não é prática para um app pessoal.
- Perfís com muita mídia são paginados: role a grade para carregar mais antes de baixar.

## O que o app faz

1. Interpreta o link e extrai o @usuario.
2. Busca o perfil e a aba de mídia.
3. Mostra uma grade (filtro Tudo / Fotos / Vídeos).
4. Toque para selecionar e baixe os selecionados ou tudo o que estiver visível.

## Estrutura

```
app/src/main/java/com/xdown/app/
  data/          parser, API, download para a galeria
  ui/            tela Compose
  XDownViewModel.kt
```
