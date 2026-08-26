package com.xdown.app

import com.xdown.app.data.ApiVideo
import com.xdown.app.data.ApiVideoFormat
import com.xdown.app.data.MediaMapper
import com.xdown.app.data.ProfileUrlParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ProfileUrlParserTest {
    @Test
    fun handleFromFullUrl() {
        assertEquals("nasa", ProfileUrlParser.extractHandle("https://x.com/nasa"))
        assertEquals("nasa", ProfileUrlParser.extractHandle("https://x.com/nasa/media"))
        assertEquals("nasa", ProfileUrlParser.extractHandle("https://twitter.com/nasa"))
        assertEquals("NASA", ProfileUrlParser.extractHandle("https://www.x.com/NASA"))
    }

    @Test
    fun handleFromBareAndAt() {
        assertEquals("elonmusk", ProfileUrlParser.extractHandle("elonmusk"))
        assertEquals("elonmusk", ProfileUrlParser.extractHandle("@elonmusk"))
        assertEquals("elonmusk", ProfileUrlParser.extractHandle("x.com/elonmusk"))
    }

    @Test
    fun rejectsReservedAndInvalid() {
        assertNull(ProfileUrlParser.extractHandle("https://x.com/home"))
        assertNull(ProfileUrlParser.extractHandle("https://example.com/nasa"))
        assertNull(ProfileUrlParser.extractHandle(""))
        assertNull(ProfileUrlParser.extractHandle("this_handle_is_way_too_long"))
    }
}

class MediaMapperTest {
    @Test
    fun originalPhotoKeepsPbsOrig() {
        val url = "https://pbs.twimg.com/media/abc.jpg?format=jpg&name=small"
        assertEquals(
            "https://pbs.twimg.com/media/abc.jpg?format=jpg&name=orig",
            MediaMapper.originalPhotoUrl(url),
        )
    }

    @Test
    fun bestVideoPrefersHighestMp4Bitrate() {
        val video = ApiVideo(
            url = "https://video.twimg.com/low.mp4",
            formats = listOf(
                ApiVideoFormat(container = "mp4", bitrate = 256000, url = "https://video.twimg.com/a.mp4"),
                ApiVideoFormat(container = "mp4", bitrate = 2_000_000, url = "https://video.twimg.com/b.mp4"),
                ApiVideoFormat(container = "m3u8", bitrate = 9_000_000, url = "https://video.twimg.com/c.m3u8"),
            ),
        )
        assertEquals("https://video.twimg.com/b.mp4", MediaMapper.bestVideoUrl(video))
    }
}
