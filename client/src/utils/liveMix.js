// Shared listener-side mix state for the live player.
//
// Welcome and ending tones arrive as their own LiveKit track from the
// "tone-player-bot", separate from the DJ's mic. The listener's browser mixes
// them, so the tone used to play at full volume and drown out the DJ.
// Tones now play lower, and lower still while the DJ is talking.
//
// The Auto DJ <audio id="auto-dj"> must stay silent while a tone or a live DJ
// is on air. Several code paths used to restart it (the play button, the
// volume slider, socket events), which mixed Auto DJ into the welcome tone
// until the page was refreshed.

export const TONE_GAIN = 0.5;
export const TONE_GAIN_UNDER_VOICE = 0.18;

let listenerVolume = 1;
let djSpeaking = false;
let toneActive = false;
let liveMic = false;
const toneElements = new Set();
// An album track the listener chose. It is a detached `new Audio()`, so the
// radio button's querySelectorAll('audio') never sees it; track it here.
let onDemandAudio = null;

const clamp = (v) => Math.max(0, Math.min(1, Number(v) || 0));

export function toneVolume() {
    return clamp(listenerVolume * (djSpeaking ? TONE_GAIN_UNDER_VOICE : TONE_GAIN));
}

function applyToneVolume() {
    const v = toneVolume();
    toneElements.forEach((el) => { el.volume = v; });
}

export function registerToneElement(el) {
    if (!el) return;
    el.dataset.tone = '1';
    toneElements.add(el);
    el.volume = toneVolume();
}

export function unregisterToneElement(el) {
    toneElements.delete(el);
}

export function isToneElement(el) {
    return el?.dataset?.tone === '1';
}

export function setListenerVolume(v) {
    listenerVolume = clamp(v);
    applyToneVolume();
}

export function getListenerVolume() {
    return listenerVolume;
}

export function setDjSpeaking(speaking) {
    if (djSpeaking === !!speaking) return;
    djSpeaking = !!speaking;
    applyToneVolume();
}

export function setToneActive(active) {
    toneActive = !!active;
}

export function setLiveMic(active) {
    liveMic = !!active;
}

export function isAutoDjSuppressed() {
    return toneActive || liveMic || !!onDemandAudio;
}

// An album track started: it outranks the radio, so silence everything else
// (Auto DJ and any live DJ / tone audio). Pausing Auto DJ also flips the
// radio button to "play".
export function startOnDemand(audio) {
    if (onDemandAudio && onDemandAudio !== audio) {
        try { onDemandAudio.pause(); } catch (e) { /* gone */ }
    }
    onDemandAudio = audio;
    if (typeof document === 'undefined') return;
    document.querySelectorAll('audio').forEach((el) => {
        if (el !== audio && !el.paused) el.pause();
    });
}

// The album track paused, ended or its page closed. The radio stays off until
// the listener presses play.
export function endOnDemand(audio) {
    if (onDemandAudio === audio) onDemandAudio = null;
}

// The listener pressed the radio button: the album track gives way.
export function stopOnDemand() {
    const audio = onDemandAudio;
    onDemandAudio = null;
    if (audio) {
        try { audio.pause(); } catch (e) { /* gone */ }
    }
}

function autoDjElement() {
    return typeof document !== 'undefined' ? document.getElementById('auto-dj') : null;
}

export function suppressAutoDj() {
    const el = autoDjElement();
    if (!el) return;
    el.pause();
    el.volume = 0;
}

// Bring Auto DJ back after a tone or a live show, only if nothing else is on
// air and the listener was playing.
export function resumeAutoDj(listenerWantsPlay) {
    if (isAutoDjSuppressed()) return;
    const el = autoDjElement();
    if (!el) return;
    el.volume = listenerVolume;
    if (listenerWantsPlay) el.play().catch(() => { /* autoplay guard */ });
}
