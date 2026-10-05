# SkyDown

[![GitHub](https://img.shields.io/badge/github-RatyelAlves%2FSkyDown-181717)](https://github.com/RatyelAlves/SkyDown)

App para baixar fotos, GIFs e vídeos de um **perfil público** do Bluesky a partir do link. Tem versão **Android** e **Desktop** (Windows), com o mesmo núcleo de busca e download.

Cole `https://bsky.app/profile/usuario.bsky.social`, `@usuario`, o handle completo ou só o nome (vira `nome.bsky.social`).

- **Android:** salva na galeria (`Pictures/SkyDown` para fotos, `Movies/SkyDown` para vídeos).
- **Desktop:** salva em `Downloads/SkyDown`.

## Desktop (Windows)

1. Instale o [JDK 17](https://learn.microsoft.com/java/openjdk/download) (Microsoft OpenJDK ou Temurin). O Gradle 8 deste projeto **não sobe no Java 25**.
2. Na pasta `SkyDown`, rode:

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
2. **File → Open** e escolha esta pasta `SkyDown`.
3. Espere o Gradle sincronizar (o Android Studio usa o JDK embutido).
4. Conecte um celular com Android 10+ ou suba um emulador.
5. Clique em **Run**.

Você também pode compartilhar um link de perfil do Bluesky para o SkyDown pelo menu Compartilhar.

O APK de release fica em `release/SkyDown-1.0.0.apk`.

## Limites importantes

- Use só para conteúdo que **você tem permissão** de copiar (por exemplo, backup do seu próprio perfil).
- Contas inexistentes, removidas ou com mídia indisponível não funcionam.
- A listagem vem da [API pública do Bluesky](https://public.api.bsky.app) (AT Protocol). Ela pode limitar requisições ou mudar.
- Arquivos originais (fotos e vídeos) saem do PDS da conta via `com.atproto.sync.getBlob`.
- Perfís com muita mídia são paginados: role a grade para carregar mais antes de baixar.
- No desktop, o preview de vídeo mostra a capa; use **Abrir** no navegador ou baixe o arquivo.

## O que o app faz

1. Interpreta o link e extrai o handle ou DID.
2. Busca o perfil e os posts com mídia.
3. Mostra uma grade (filtro Tudo / Fotos / Vídeos).
4. Selecione e baixe os arquivos visíveis.

## Estrutura

```
core/      parser, API pública do Bluesky, ViewModel
app/       Android (Compose + galeria)
desktop/   Windows (Compose Desktop + Downloads/SkyDown)
```

## Assinatura de release (Android)

`local.properties`, `keystore.properties` e `*.jks` não vão para o Git. Copie `keystore.properties.example` se for gerar um APK assinado.
