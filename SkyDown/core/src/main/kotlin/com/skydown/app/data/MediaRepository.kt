package com.skydown.app.data

import retrofit2.HttpException
import java.io.IOException

class MediaRepository(
    private val api: BskyApi,
    private val plcApi: PlcApi,
) {
    suspend fun loadProfile(actor: String): Profile {
        val response = runCatching { api.profile(actor) }.getOrElse { throw mapError(it) }
        val body = response.body()
        if (!response.isSuccessful || body?.did.isNullOrBlank()) {
            throw mapHttpError(response.code(), errorMessage(response.errorBody()?.string()))
        }
        val pds = resolvePds(body!!.did!!)
        return MediaMapper.toProfile(body, actor, pds)
    }

    suspend fun loadMediaPage(actor: String, cursor: String?, profile: Profile): MediaPage {
        val response = runCatching {
            api.authorFeed(actor = actor, filter = "posts_with_media", limit = 50, cursor = cursor)
        }.getOrElse { throw mapError(it) }

        val body = response.body()
        if (response.code() == 400 || response.code() == 404) {
            return MediaPage(emptyList(), null)
        }
        if (response.code() == 429) {
            throw SkyDownException("Muitas requisições. Espere um pouco e tente de novo.")
        }
        if (!response.isSuccessful) {
            throw mapHttpError(
                response.code(),
                errorMessage(response.errorBody()?.string()),
            )
        }

        val items = body?.feed.orEmpty()
            .asSequence()
            .filter { it.reason == null }
            .mapNotNull { it.post }
            .filter { post ->
                val authorDid = post.author?.did
                authorDid.isNullOrBlank() || authorDid == profile.id
            }
            .flatMap { MediaMapper.toMediaItems(it, profile) }
            .toList()

        return MediaPage(
            items = items,
            nextCursor = body?.cursor?.takeIf { it.isNotBlank() },
        )
    }

    private suspend fun resolvePds(did: String): String {
        if (!did.startsWith("did:plc:", ignoreCase = true)) {
            return NetworkModule.FALLBACK_PDS
        }
        val response = runCatching { plcApi.didDoc(did) }.getOrNull()
        val endpoint = response?.body()?.service
            ?.firstOrNull { service ->
                service.type.equals("AtprotoPersonalDataServer", ignoreCase = true)
            }
            ?.serviceEndpoint
            ?.trim()
            ?.trimEnd('/')
        return endpoint?.takeIf { it.startsWith("https://") } ?: NetworkModule.FALLBACK_PDS
    }

    private fun mapHttpError(code: Int, apiMessage: String?): SkyDownException {
        return when (code) {
            400, 404 -> SkyDownException(apiMessage ?: "Perfil não encontrado.")
            401 -> SkyDownException("A API recusou o pedido. Tente novamente em alguns minutos.")
            429 -> SkyDownException("Muitas requisições. Espere um pouco e tente de novo.")
            else -> SkyDownException(apiMessage ?: "Não foi possível abrir este perfil.")
        }
    }

    private fun errorMessage(raw: String?): String? {
        if (raw.isNullOrBlank()) return null
        val parsed = runCatching {
            NetworkModule.json.decodeFromString(BskyError.serializer(), raw)
        }.getOrNull()
        return friendlyError(parsed?.error, parsed?.message)
    }

    private fun friendlyError(error: String?, message: String?): String? {
        return when {
            error.equals("AccountTakedown", true) -> "Esta conta foi removida."
            error.equals("AccountNotFound", true) -> "Perfil não encontrado."
            error.equals("InvalidRequest", true) &&
                message.orEmpty().contains("not found", true) -> "Perfil não encontrado."
            !message.isNullOrBlank() -> message
            else -> null
        }
    }

    private fun mapError(error: Throwable): SkyDownException {
        return when (error) {
            is SkyDownException -> error
            is IOException -> SkyDownException("Sem conexão. Verifique a internet e tente novamente.")
            is HttpException -> SkyDownException("Erro de rede (${error.code()}). Tente novamente.")
            else -> SkyDownException("Algo deu errado ao buscar o perfil.")
        }
    }
}
