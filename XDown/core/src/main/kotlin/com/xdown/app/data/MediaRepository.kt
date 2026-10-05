package com.xdown.app.data

import retrofit2.HttpException
import java.io.IOException

class MediaRepository(private val api: FxTwitterApi) {
    suspend fun loadProfile(handle: String): Profile {
        val response = runCatching { api.profile(handle) }.getOrElse { throw mapError(it) }
        val body = response.body()
        when {
            response.isSuccessful && body?.user != null -> {
                val profile = MediaMapper.toProfile(body.user, handle)
                if (profile.isProtected) {
                    throw XDownException("Este perfil é protegido e a mídia não é pública.")
                }
                return profile
            }
            body?.reason.equals("suspended", ignoreCase = true) -> {
                throw XDownException("Esta conta está suspensa.")
            }
            response.code() == 404 -> throw XDownException("Perfil não encontrado.")
            response.code() == 401 -> throw XDownException("A API recusou o pedido. Tente novamente em alguns minutos.")
            response.code() == 429 -> throw XDownException("Muitas requisições. Espere um pouco e tente de novo.")
            else -> throw XDownException(body?.message ?: "Não foi possível abrir este perfil.")
        }
    }

    suspend fun loadMediaPage(handle: String, cursor: String?): MediaPage {
        val response = runCatching {
            api.media(handle, count = 50, cursor = cursor)
        }.getOrElse { throw mapError(it) }

        val body = response.body()
        if (response.code() == 404 && (body == null || body.results.isEmpty())) {
            return MediaPage(emptyList(), null)
        }
        if (response.code() == 429) {
            throw XDownException("Muitas requisições. Espere um pouco e tente de novo.")
        }
        if (!response.isSuccessful && response.code() !in listOf(404)) {
            throw XDownException(body?.message ?: "Falha ao listar a mídia do perfil.")
        }

        val items = body?.results
            .orEmpty()
            .flatMap { MediaMapper.toMediaItems(it, handle) }
        return MediaPage(
            items = items,
            nextCursor = body?.cursor?.bottom?.takeIf { it.isNotBlank() },
        )
    }

    private fun mapError(error: Throwable): XDownException {
        return when (error) {
            is XDownException -> error
            is IOException -> XDownException("Sem conexão. Verifique a internet e tente novamente.")
            is HttpException -> XDownException("Erro de rede (${error.code()}). Tente novamente.")
            else -> XDownException("Algo deu errado ao buscar o perfil.")
        }
    }
}
