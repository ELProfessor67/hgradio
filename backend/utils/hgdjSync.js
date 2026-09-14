/**
 * hgdjSync.js
 * ─────────────────────────────────────────────────────────────
 * Shared helpers to sync playlists and songs to HGDJLive API.
 * All functions are fail-safe: errors are logged but NEVER
 * bubble up to the calling controller so the main app response
 * is never affected.
 *
 * Playlist endpoint: https://hgdjlive.com/api/v1/noauth/playlist
 *   { _id, title, description, artist?, album?, cover?, coverEx?, isTemp? }
 *
 * Song endpoint:     https://hgdjlive.com/api/v1/noauth/song
 *   { _id, title, audio, audioEx, cover, coverEx, size, type,
 *     artist?, description?, duration?, album?, playlistId }
 *
 * Playlists and songs live on DIFFERENT endpoints — posting a song
 * body to the playlist endpoint silently drops the track.
 * ─────────────────────────────────────────────────────────────
 */

const PLAYLIST_API =
  process.env.HGDJ_PLAYLIST_API || "https://hgdjlive.com/api/v1/noauth/playlist";

// Derived from the playlist URL so a single env override keeps both in sync.
const SONG_API =
  process.env.HGDJ_SONG_API || PLAYLIST_API.replace(/\/playlist\/?$/, "/song");

const DEFAULT_COVER = "/upload/cover/default.jpg";

// ─── Low-level POST helper ───────────────────────────────────
async function hgdjPost(url, body) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let payload = null;
  try {
    payload = await resp.json();
  } catch {
    /* non-JSON response */
  }

  // 409 means the record is already present — the desired end state, not a failure.
  if (resp.status === 409) {
    return { ...payload, alreadyExists: true };
  }

  if (!resp.ok) {
    const details = payload?.message || JSON.stringify(payload) || "";
    throw new Error(`HGDJLive API error ${resp.status}: ${details}`);
  }

  return payload;
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
 * @returns {Promise<boolean>} true when the playlist exists on HGDJLive afterwards
 */
export async function syncPlaylist(data) {
  try {
    const body = {
      _id: String(data._id),
      title: data.title,
      // HGDJLive rejects a blank description, so never send one.
      description: data.description || data.title || "Synced from HGC Radio",
      ...(data.artist && { artist: data.artist }),
      ...(data.album && { album: data.album }),
      ...(data.cover && { cover: data.cover }),
      ...(data.coverEx && { coverEx: data.coverEx }),
      isTemp: data.isTemp ?? false,
    };

    const result = await hgdjPost(PLAYLIST_API, body);
    console.log(
      `[hgdjSync] Playlist synced${result?.alreadyExists ? " (already existed)" : ""}: ${data._id} — ${data.title}`
    );
    return true;
  } catch (err) {
    console.error(
      `[hgdjSync] syncPlaylist failed for ${data._id}:`,
      err?.message || err
    );
    return false;
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
 * @returns {Promise<boolean>} true when the song exists on HGDJLive afterwards
 */
export async function syncSong(data) {
  try {
    if (!data.audio) {
      throw new Error("song has no audio URL");
    }

    const body = {
      _id: String(data._id),
      title: data.title,
      audio: data.audio,
      audioEx: data.audioEx || "mp3",
      cover: data.cover || DEFAULT_COVER,
      coverEx: data.coverEx || "jpg",
      // HGDJLive validates size/type as truthy, so fall back to non-zero values.
      size: data.size || 1,
      type: data.type || "audio/mpeg",
      description: data.description || data.title || "Synced from HGC Radio",
      playlistId: String(data.playlistId),
      ...(data.artist && { artist: data.artist }),
      ...(data.duration && { duration: data.duration }),
      ...(data.album && { album: data.album }),
    };

    const result = await hgdjPost(SONG_API, body);
    console.log(
      `[hgdjSync] Song synced${result?.alreadyExists ? " (already existed)" : ""}: ${data._id} — ${data.title} → playlist ${data.playlistId}`
    );
    return true;
  } catch (err) {
    console.error(
      `[hgdjSync] syncSong failed for ${data._id}:`,
      err?.message || err
    );
    return false;
  }
}

// ─── Remove a song from HGDJLive ─────────────────────────────
/**
 * Deletes a synced song so it disappears from the DJ panel, Go Live and Auto DJ.
 *
 * @param {string} songId - Song ObjectId string
 * @returns {Promise<boolean>} true when the song is absent on HGDJLive afterwards
 */
export async function deleteSongFromHGDJ(songId) {
  try {
    const url = `${SONG_API}?_id=${encodeURIComponent(String(songId))}`;
    const resp = await fetch(url, { method: "DELETE" });

    // 404 means it is already gone — the desired end state.
    if (!resp.ok && resp.status !== 404) {
      let details = "";
      try {
        details = (await resp.json())?.message || "";
      } catch {
        /* non-JSON response */
      }
      throw new Error(`HGDJLive API error ${resp.status}: ${details}`);
    }

    console.log(`[hgdjSync] Song removed: ${songId}`);
    return true;
  } catch (err) {
    console.error(
      `[hgdjSync] deleteSongFromHGDJ failed for ${songId}:`,
      err?.message || err
    );
    return false;
  }
}

// ─── Read a synced playlist back from HGDJLive ───────────────
/**
 * @param {string} playlistId
 * @returns {Promise<object|null>} the playlist with populated songs, or null
 */
async function fetchHGDJPlaylist(playlistId) {
  const url = `${PLAYLIST_API}?id=${encodeURIComponent(String(playlistId))}`;
  const resp = await fetch(url);

  if (resp.status === 404) return null;
  if (!resp.ok) {
    throw new Error(`HGDJLive API error ${resp.status}`);
  }

  const payload = await resp.json();
  return payload?.playlist || null;
}

// ─── Sync a full album (playlist + all songs) ────────────────
/**
 * Called when admin approves an album, and again whenever an approved album's
 * songs or details change, so the HGC DJ panel and Go Live stay in step.
 *
 * The album is the source of truth: its playlist on HGDJLive is reconciled to
 * mirror it exactly.
 *
 * 1. Creates/updates the album's playlist on HGDJLive.
 * 2. Creates/updates every song in the album on that playlist.
 * 3. Removes songs from the playlist that are no longer in the album.
 *
 * @param {object} album      - Mongoose Album document (populated artist)
 * @param {string} artistName - Resolved artist name string
 * @returns {Promise<{playlist: boolean, synced: number, failed: number, removed: number}>}
 */
export async function syncAlbumToHGDJ(album, artistName) {
  const playlistId = String(album._id);
  const songs = Array.isArray(album.songs) ? album.songs : [];

  const playlistOk = await syncPlaylist({
    _id: playlistId,
    title: album.title,
    description: album.description || "",
    artist: artistName || "",
    album: album.title,
    cover: album.coverImg || "",
    coverEx: "jpg",
    isTemp: false,
  });

  // Without the playlist the songs have nowhere to attach.
  if (!playlistOk) {
    console.error(
      `[hgdjSync] Album sync aborted for ${playlistId} — playlist could not be created`
    );
    return { playlist: false, synced: 0, failed: songs.length, removed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const song of songs) {
    const ok = await syncSong({
      _id: String(song._id),
      title: song.name || song.title || "Untitled",
      audio: song.url,
      audioEx: "mp3",
      cover: album.coverImg || "",
      coverEx: "jpg",
      type: "audio/mpeg",
      duration: song.duration || 0,
      artist: artistName || "",
      album: album.title,
      playlistId,
    });
    ok ? synced++ : failed++;
  }

  const removed = await pruneRemovedSongs(
    playlistId,
    songs.map((s) => String(s._id))
  );

  console.log(
    `[hgdjSync] Album sync complete for ${playlistId}: ${synced} synced, ${failed} failed, ${removed} removed of ${songs.length} song(s)`
  );

  return { playlist: true, synced, failed, removed };
}

// ─── Drop synced songs the album no longer contains ──────────
/**
 * Songs deleted from the album (or replaced wholesale via an album update) must
 * also leave the HGDJLive playlist, otherwise DJs keep seeing dead tracks.
 *
 * @param {string} playlistId
 * @param {string[]} keepIds - Song ids the album currently contains
 * @returns {Promise<number>} count of songs removed
 */
async function pruneRemovedSongs(playlistId, keepIds) {
  try {
    const playlist = await fetchHGDJPlaylist(playlistId);
    if (!playlist || !Array.isArray(playlist.songs)) return 0;

    const keep = new Set(keepIds.map(String));
    const stale = playlist.songs
      .map((s) => String(s?._id))
      .filter((id) => id && !keep.has(id));

    let removed = 0;
    for (const id of stale) {
      if (await deleteSongFromHGDJ(id)) removed++;
    }
    return removed;
  } catch (err) {
    console.error(
      `[hgdjSync] pruneRemovedSongs failed for ${playlistId}:`,
      err?.message || err
    );
    return 0;
  }
}
