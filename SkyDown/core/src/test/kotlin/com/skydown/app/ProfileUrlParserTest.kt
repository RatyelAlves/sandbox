package com.skydown.app

import com.skydown.app.data.BskyAuthor
import com.skydown.app.data.BskyEmbed
import com.skydown.app.data.BskyImage
import com.skydown.app.data.BskyPost
import com.skydown.app.data.BskyProfile
import com.skydown.app.data.BskyRecord
import com.skydown.app.data.MediaKind
import com.skydown.app.data.MediaMapper
import com.skydown.app.data.ProfileUrlParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ProfileUrlParserTest {
    @Test
    fun handleFromFullUrl() {
        assertEquals("nasa.bsky.social", ProfileUrlParser.extractHandle("https://bsky.app/profile/nasa.bsky.social"))
        assertEquals("nasa.bsky.social", ProfileUrlParser.extractHandle("https://bsky.app/profile/nasa.bsky.social/media"))
        assertEquals("bsky.app", ProfileUrlParser.extractHandle("https://bsky.app/profile/bsky.app"))
        assertEquals("nasa.bsky.social", ProfileUrlParser.extractHandle("https://www.bsky.app/profile/NASA.bsky.social"))
    }

    @Test
    fun handleFromBareAndAt() {
        assertEquals("jay.bsky.social", ProfileUrlParser.extractHandle("jay.bsky.social"))
        assertEquals("jay.bsky.social", ProfileUrlParser.extractHandle("@jay.bsky.social"))
        assertEquals("jay.bsky.social", ProfileUrlParser.extractHandle("jay"))
        assertEquals("jay.bsky.social", ProfileUrlParser.extractHandle("@jay"))
        assertEquals("jay.bsky.social", ProfileUrlParser.extractHandle("bsky.app/profile/jay.bsky.social"))
    }

    @Test
    fun didFromUrl() {
        val did = "did:plc:z72i7hdynmk6r22z27h6tvur"
        assertEquals(did, ProfileUrlParser.extractHandle("https://bsky.app/profile/$did"))
        assertEquals(did, ProfileUrlParser.extractHandle(did))
    }

    @Test
    fun customDomainHandle() {
        assertEquals("jay.bsky.team", ProfileUrlParser.extractHandle("https://bsky.app/profile/jay.bsky.team"))
        assertEquals("example.com", ProfileUrlParser.extractHandle("example.com"))
    }

    @Test
    fun rejectsReservedAndInvalid() {
        assertNull(ProfileUrlParser.extractHandle("https://bsky.app/search"))
        assertNull(ProfileUrlParser.extractHandle("https://example.com/profile/nasa"))
        assertNull(ProfileUrlParser.extractHandle(""))
        assertNull(ProfileUrlParser.extractHandle("not a handle"))
    }
}

class MediaMapperTest {
    @Test
    fun cidFromCdnUrl() {
        val url = "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:abc/bafkreiexamplecid"
        assertEquals("bafkreiexamplecid", MediaMapper.cidFromCdnUrl(url))
    }

    @Test
    fun blobUrlEncodesDid() {
        val url = MediaMapper.blobUrl(
            "https://puffball.us-east.host.bsky.network",
            "did:plc:z72i7hdynmk6r22z27h6tvur",
            "bafkreicid",
        )
        assertTrue(url.contains("com.atproto.sync.getBlob"))
        assertTrue(url.contains("cid=bafkreicid"))
        assertTrue(url.contains("did=did"))
    }

    @Test
    fun mapsImagesAndGifVideo() {
        val profile = MediaMapper.toProfile(
            BskyProfile(did = "did:plc:abc", handle = "demo.bsky.social", displayName = "Demo"),
            "demo.bsky.social",
            "https://pds.example",
        )
        val post = BskyPost(
            uri = "at://did:plc:abc/app.bsky.feed.post/3kpost",
            author = BskyAuthor(did = "did:plc:abc", handle = "demo.bsky.social"),
            record = BskyRecord(text = "hello"),
            embed = BskyEmbed(
                type = "app.bsky.embed.recordWithMedia#view",
                media = BskyEmbed(
                    type = "app.bsky.embed.images#view",
                    images = listOf(
                        BskyImage(
                            thumb = "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:abc/bafkreiimg",
                            fullsize = "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:abc/bafkreiimg",
                        ),
                    ),
                ),
            ),
        )
        val photos = MediaMapper.toMediaItems(post, profile)
        assertEquals(1, photos.size)
        assertEquals(MediaKind.PHOTO, photos[0].kind)
        assertTrue(photos[0].downloadUrl.contains("bafkreiimg"))

        val videoPost = post.copy(
            uri = "at://did:plc:abc/app.bsky.feed.post/3kvid",
            embed = BskyEmbed(
                type = "app.bsky.embed.video#view",
                cid = "bafkreivid",
                playlist = "https://video.bsky.app/watch/x/playlist.m3u8",
                thumbnail = "https://video.bsky.app/watch/x/thumbnail.jpg",
                presentation = "gif",
            ),
        )
        val videos = MediaMapper.toMediaItems(videoPost, profile)
        assertEquals(1, videos.size)
        assertEquals(MediaKind.GIF, videos[0].kind)
        assertEquals("https://video.bsky.app/watch/x/playlist.m3u8", videos[0].playbackUrl)
        assertTrue(videos[0].downloadUrl.contains("bafkreivid"))
    }

    @Test
    fun parsesPublicApiEmbedJson() {
        val json = com.skydown.app.data.NetworkModule.json
        val embed = json.decodeFromString(
            BskyEmbed.serializer(),
            """{"images":[{"thumb":"https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:abc/bafkreiimg","fullsize":"https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:abc/bafkreiimg","alt":"","aspectRatio":{"height":600,"width":800}}],"${'$'}type":"app.bsky.embed.images#view"}""",
        )
        assertEquals("app.bsky.embed.images#view", embed.type)
        assertEquals(1, embed.images.size)
    }
}
