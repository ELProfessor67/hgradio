/**
 * hgdjSync.js
 * ─────────────────────────────────────────────────────────────
 * Shared helpers to sync playlists and songs to HGDJLive API.
 * All functions are fail-safe: errors are logged but NEVER
 * bubble up to the calling controller so the main app response
 * is never affected.
 *
 * API base: https://hgdjlive.com/api/v1/noauth/playlist
 *
 * Playlist body:
 *   { _id, title, description, artist?, album?, cover?, coverEx?, isTemp? }
 *
 * Song body:
 *   { _id, title, audio, audioEx, cover, coverEx, size, type,
 *     artist?, description?, duration?, album?, playlistId }
 * ─────────────────────────────────────────────────────────────
 */

const HGDJ_API = process.env.HGDJ_PLAYLIST_API || "https://hgdjlive.com/api/v1/noauth/playlist";

// ─── Low-level POST helper ───────────────────────────────────
async function hgdjPost(body) {
  const resp = await fetch(HGDJ_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    let details = "";
    try { details = await resp.text(); } catch { /* ignore */ }
    throw new Error(`HGDJLive API error ${resp.status}: ${details}`);
  }

  return resp.json();
}

// ─── Create / upsert a playlist on HGDJLive ──────────────────
/**
 * @param {object} data
 * @param {string} data._id         - MongoDB ObjectId string (used as playlist ID)
 * @param {string} data.title       - Playlist title
 * @param {string} data.description - Playlist description
 * @param {string} [data.artist]    - Artist name (optional)
 * @param {string} [data.album]     - Album name (optional)
 * @param {string} [data.cover]     - Cover image URL (optional)
 * @param {string} [data.coverEx]   - Cover extension e.g. "jpg" (optional)
 * @param {boolean} [data.isTemp]   - Temporary playlist flag (optional)
 */
export async function syncPlaylist(data) {
  try {
    const body = {
      _id:         String(data._id),
      title:       data.title,
      description: data.description || "",
      ...(data.artist  && { artist:  data.artist  }),
      ...(data.album   && { album:   data.album   }),
      ...(data.cover   && { cover:   data.cover   }),
      ...(data.coverEx && { coverEx: data.coverEx }),
      isTemp: data.isTemp ?? false,
    };

    const result = await hgdjPost(body);
    console.log(`[hgdjSync] Playlist synced: ${data._id} — ${data.title}`, result);
    return result;
  } catch (err) {
    console.error(`[hgdjSync] syncPlaylist failed for ${data._id}:`, err?.message || err);
  }
}

// ─── Add a song to a playlist on HGDJLive ────────────────────
/**
 * @param {object} data
 * @param {string} data._id        - Song ObjectId string
 * @param {string} data.title      - Song title
 * @param {string} data.audio      - Public audio URL
 * @param {string} [data.audioEx]  - Audio extension e.g. "mp3"
 * @param {string} data.cover      - Cover image URL
 * @param {string} [data.coverEx]  - Cover extension e.g. "jpg"
 * @param {number} [data.size]     - File size in bytes
 * @param {string} [data.type]     - MIME type e.g. "audio/mpeg"
 * @param {string} [data.artist]   - Artist name
 * @param {string} [data.description]
 * @param {number} [data.duration] - Duration in seconds
 * @param {string} [data.album]    - Album name
 * @param {string} data.playlistId - Target playlist ObjectId string
 */
export async function syncSong(data) {
  try {
    const body = {
      _id:        String(data._id),
      title:      data.title,
      audio:      data.audio,
      audioEx:    data.audioEx || "mp3",
      cover:      data.cover   || "",
      coverEx:    data.coverEx || "jpg",
      size:       data.size    || 0,
      type:       data.type    || "audio/mpeg",
      playlistId: String(data.playlistId),
      ...(data.artist      && { artist:      data.artist      }),
      ...(data.description && { description: data.description }),
      ...(data.duration    && { duration:    data.duration    }),
      ...(data.album       && { album:       data.album       }),
    };

    const result = await hgdjPost(body);
    console.log(`[hgdjSync] Song synced: ${data._id} — ${data.title} → playlist ${data.playlistId}`, result);
    return result;
  } catch (err) {
    console.error(`[hgdjSync] syncSong failed for ${data._id}:`, err?.message || err);
  }
}

// ─── Sync a full album (playlist + all songs) ────────────────
/**
 * Called when admin approves an album.
 * 1. Creates/upserts a playlist for the album on HGDJLive.
 * 2. Adds every song in the album to that playlist.
 *
 * @param {object} album        - Mongoose Album document (populated artist)
 * @param {string} artistName   - Resolved artist name string
 */
export async function syncAlbumToHGDJ(album, artistName) {
  const playlistId = String(album._id);

  // Step 1 — create the album playlist
  await syncPlaylist({
    _id:         playlistId,
    title:       album.title,
    description: album.description || "",
    artist:      artistName || "",
    album:       album.title,
    cover:       album.coverImg || "",
    coverEx:     "jpg",
    isTemp:      false,
  });

  // Step 2 — add each song in the album
  if (Array.isArray(album.songs) && album.songs.length > 0) {
    for (const song of album.songs) {
      await syncSong({
        _id:        String(song._id),
        title:      song.name || song.title || "Untitled",
        audio:      song.url,
        audioEx:    "mp3",
        cover:      album.coverImg || "",
        coverEx:    "jpg",
        size:       0,
        type:       "audio/mpeg",
        duration:   song.duration || 0,
        artist:     artistName || "",
        album:      album.title,
        playlistId: playlistId,
      });
    }
    console.log(`[hgdjSync] Album sync complete: ${album.songs.length} song(s) → playlist ${playlistId}`);
  }
}
