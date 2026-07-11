# Fix Audio Streaming Quality — Songs Breaking / Cutting / Poor Sound

## Problem Summary
Audio streams are breaking, cutting out, and have poor sound quality when using LiveKit for streaming. After deep analysis of the codebase, I've identified **7 root causes** across multiple files.

## Root Cause Analysis

### 🔴 Critical Issues

#### 1. New AudioContext created per song — causes audio graph leaks
In [getSongStream()](file:///e:/audio_stream/src/hooks/useSocket.js#L576-L720), every time a song is played, a **brand new `AudioContext`** is created (line 586) and **never closed**. The old AudioContext is abandoned but still running. Additionally, in `playSong()` (line 1036), yet another AudioContext (`gaudioContext`) is created. This means:
- Multiple AudioContexts compete for the audio device
- Browser enforces a limit (~6) — excess contexts produce silence or glitches
- Memory leaks cause gradual degradation

#### 2. ScriptProcessorNode connected to destination — double audio output
At [line 668-670](file:///e:/audio_stream/src/hooks/useSocket.js#L668-L670), a `ScriptProcessorNode` is connected to `audioContext.destination`. This node is used only for visualization (volume metering), but connecting it to the destination causes the audio to be **played twice through different paths**, creating echo/distortion and audio artifacts.

#### 3. `replaceTrack` unpublishes then re-publishes — causes audio gap
In [replaceTrack()](file:///e:/audio_stream/src/hooks/useSocket.js#L242-L257), the code first **unpublishes** the existing track, then **publishes** a new one. This creates a noticeable gap/break in audio because:
- Unpublish → silence period → publish → negotiation → audio resumes
- Listeners hear a break every time a new song starts

#### 4. LiveKit token TTL is only 5 minutes
In [token/route.js line 63](file:///e:/audio_stream/src/app/api/v1/token/route.js#L63), `at.ttl = '5m'` means the token expires after 5 minutes. LiveKit disconnects the participant when the token expires, causing **stream drops every 5 minutes** if the room connection doesn't auto-refresh.

### 🟡 Secondary Issues

#### 5. Audio fetched entirely before playback (no streaming)
In [getObjectUrlFromAudio()](file:///e:/audio_stream/src/hooks/useSocket.js#L553-L574), the entire audio file is fetched into memory as an ArrayBuffer before creating an Object URL. For large audio files, this causes:
- Long loading delays before playback starts
- Memory spikes

#### 6. `songStreamloading` uses stale state in `playSong()`
At [line 1013](file:///e:/audio_stream/src/hooks/useSocket.js#L1013), `songStreamloading` is read from React state inside an async function, meaning it will always have the stale closure value from when `playSong` was created. This means the loading guard doesn't work properly, potentially causing race conditions with concurrent song loads.

#### 7. No `await` on LiveKit room connect
In [useConnect.js line 15](file:///e:/audio_stream/src/hooks/useConnect.js#L15), `roomRef.current.connect()` is not awaited. This means we might try to publish tracks before the room connection is established.

---

## Proposed Changes

### [useSocket.js](file:///e:/audio_stream/src/hooks/useSocket.js) — Core streaming fixes

#### Fix 1: Reuse a single AudioContext for the entire session
- Create one persistent `AudioContext` at `ownerJoin()` time and reuse it for all songs/filters
- Properly disconnect and clean up old source nodes when switching songs, but keep the same context
- Close the AudioContext only on `ownerLeft()`

#### Fix 2: Disconnect ScriptProcessor from destination
- Change the ScriptProcessor visualization to use a silent destination or disconnect from `audioContext.destination`
- The analyser/scriptProcessor should connect to a `createMediaStreamDestination()` (or just not connect to destination at all for analysis)

#### Fix 3: Seamless track replacement via LiveKit
- Instead of unpublish → publish, use the LiveKit track's `replaceTrack()` method on the `LocalTrackPublication` to swap the underlying `MediaStreamTrack` without interruption
- This avoids any gap in the stream

#### Fix 4: Use a ref for songStreamLoading to avoid stale closures
- Use `songStreamLoadingRef` (a ref) alongside the state variable so the guard in `playSong()` works correctly

#### Fix 5: Clean up old audio elements and object URLs
- When a new song starts, revoke the old Object URL to free memory
- Properly pause and remove references to old Audio elements

---

### [useConnect.js](file:///e:/audio_stream/src/hooks/useConnect.js) — Connection fixes

#### Fix 6: Await room connection
- `await` the `roomRef.current.connect()` call to ensure the room is fully connected before proceeding

---

### [token/route.js](file:///e:/audio_stream/src/app/api/v1/token/route.js) — Token TTL fix

#### Fix 7: Increase token TTL
- Change `at.ttl = '5m'` to `at.ttl = '24h'` to prevent token-based disconnections during long streaming sessions

---

## Open Questions

> [!IMPORTANT]
> **Are you experiencing the breaks on the broadcaster (DJ) side, the listener side, or both?**
> This will help me prioritize fixes. The changes above fix the broadcaster-side issues which are the most likely cause.

> [!NOTE]
> **What's the typical duration of your streaming sessions?**
> If sessions are longer than 5 minutes, the token TTL fix (#7) is almost certainly causing periodic disconnections.

---

## Verification Plan

### Manual Verification
1. Start a streaming session and play multiple songs in sequence — verify no audio breaks between songs
2. Stream for longer than 5 minutes continuously — verify no disconnection
3. Check browser DevTools console for AudioContext warnings (should see only 1 context)
4. Verify audio quality is clear without echo or double-playback artifacts
5. Monitor browser memory usage during extended playback — should be stable
