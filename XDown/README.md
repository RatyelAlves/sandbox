# XDown

[![GitHub](https://img.shields.io/badge/github-RatyelAlves%2FXDown-181717)](https://github.com/RatyelAlves/XDown)

App para baixar fotos, GIFs e vídeos de um perfil do X (Twitter) a partir do link. Tem versão **Android** e **Desktop** (Windows), com o mesmo núcleo de busca e download.

Cole `https://x.com/usuario`, `@usuario` ou só o nome do perfil.

- **Android:** salva na galeria (`Pictures/XDown` para fotos, `Movies/XDown` para vídeos).
- **Desktop:** salva em `Downloads/XDown`.

Só lista **mídia pública**. Perfis protegidos, suspensos ou inexistentes não funcionam.

## Desktop (Windows)

1. Instale o [JDK 17](https://learn.microsoft.com/java/openjdk/download) (Microsoft OpenJDK ou Temurin). O Gradle 8 deste projeto **não sobe no Java 25**.
2. Na pasta `XDown`, rode:

```bat
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot
gradlew :desktop:run
```

Para gerar um instalador `.msi`:

```bat
gradlew :desktop:packageMsi
```

O instalador fica em `desktop/build/compose/binaries/main/msi/`.

## Android

1. Instale o [Android Studio](https://developer.android.com/studio).
2. **File → Open** e escolha esta pasta `XDown`.
3. Espere o Gradle sincronizar (o Android Studio usa o JDK embutido).
4. Conecte um celular com Android 10+ ou suba um emulador.
5. Clique em **Run**.

Você também pode compartilhar um link de perfil do X para o XDown pelo menu Compartilhar.

## Limites importantes

- Use só para conteúdo que **você tem permissão** de copiar (por exemplo, backup do seu próprio perfil).
- Só mídia **pública**. Perfis protegidos, suspensos ou inexistentes não funcionam.
- A listagem vem da [API do FxEmbed](https://api.fxtwitter.com) e pode mudar se o X ou o FxEmbed mudarem.
- Perfís com muita mídia são paginados: role a grade para carregar mais antes de baixar.
- No desktop, o preview de vídeo mostra a capa; use **Abrir** no navegador ou baixe o arquivo.

## O que o app faz

1. Interpreta o link e extrai o @usuario.
2. Busca o perfil e a aba de mídia.
3. Mostra uma grade (filtro Tudo / Fotos / Vídeos).
4. Selecione e baixe os arquivos visíveis.

## Estrutura

```
core/      parser, API, ViewModel (JVM compartilhado)
app/       Android (Compose + galeria)
desktop/   Windows (Compose Desktop + Downloads/XDown)
```

## Assinatura de release (Android)

`local.properties`, `keystore.properties` e `*.jks` não vão para o Git. Copie `keystore.properties.example` se for gerar um APK assinado.
