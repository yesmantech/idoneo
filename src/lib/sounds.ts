/**
 * @file sounds.ts
 * @description Tier S procedural sound effects using Web Audio API.
 *
 * Zero audio files — all sounds generated via OscillatorNode + GainNode.
 * Mirrors haptics.ts architecture: reads `idoneo_sounds_enabled` from localStorage.
 *
 * ## Sound Effects
 *
 * | Function            | Trigger                          |
 * |---------------------|----------------------------------|
 * | `soundCorrect()`    | Correct answer (instant-check)   |
 * | `soundWrong()`      | Wrong answer (instant-check)     |
 * | `soundBadgeUnlock()` | Badge celebration modal         |
 * | `soundQuizComplete()` | Quiz results — passed          |
 * | `soundQuizFail()`   | Quiz results — failed            |
 * | `soundTap()`        | Light UI tap                     |
 */

// ============================================================================
// AUDIO CONTEXT (lazy singleton)
// ============================================================================

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
    try {
        if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Resume suspended context (iOS requires user gesture)
        if (_ctx.state === 'suspended') _ctx.resume();
        return _ctx;
    } catch {
        return null;
    }
}

// ============================================================================
// PREFERENCES
// ============================================================================

const SOUNDS_KEY = 'idoneo_sounds_enabled';

export function getSoundsEnabled(): boolean {
    try {
        const v = localStorage.getItem(SOUNDS_KEY);
        return v === null ? true : v === 'true';
    } catch { return true; }
}

function canPlay(): boolean {
    return getSoundsEnabled();
}

// ============================================================================
// LOW-LEVEL HELPERS
// ============================================================================

/** Play a tone with frequency ramp and gain envelope */
function playTone(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.15,
    delay: number = 0,
) {
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime + delay);
    osc.frequency.exponentialRampToValueAtTime(
        Math.max(endFreq, 20), // Prevent 0 or negative
        ctx.currentTime + delay + duration
    );

    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
}

/** Play a chord (multiple tones simultaneously) */
function playChord(
    freqs: number[],
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.08,
    delay: number = 0,
) {
    freqs.forEach(f => playTone(f, f * 1.01, duration, type, volume, delay));
}

// ============================================================================
// SOUND EFFECTS
// ============================================================================

/**
 * ✅ Correct answer — bright rising double-chime
 */
export function soundCorrect() {
    if (!canPlay()) return;
    // Two quick rising notes: C5 → E5
    playTone(523, 660, 0.12, 'sine', 0.13, 0);
    playTone(660, 784, 0.15, 'sine', 0.15, 0.08);
}

/**
 * ❌ Wrong answer — soft descending buzz
 */
export function soundWrong() {
    if (!canPlay()) return;
    // Low descending tone
    playTone(300, 180, 0.25, 'triangle', 0.1, 0);
    playTone(280, 160, 0.2, 'triangle', 0.06, 0.05);
}

/**
 * 🏆 Badge unlock — sparkle fanfare sequence
 */
export function soundBadgeUnlock() {
    if (!canPlay()) return;
    // Ascending arpeggio: C5 → E5 → G5 → C6 + shimmer
    playTone(523, 530, 0.15, 'sine', 0.1, 0);
    playTone(659, 665, 0.15, 'sine', 0.12, 0.1);
    playTone(784, 790, 0.15, 'sine', 0.12, 0.2);
    playTone(1047, 1055, 0.25, 'sine', 0.14, 0.3);
    // Shimmer overtones
    playTone(1568, 1580, 0.3, 'sine', 0.05, 0.35);
    playTone(2093, 2100, 0.25, 'sine', 0.03, 0.4);
    // Final chord
    playChord([523, 659, 784, 1047], 0.5, 'sine', 0.06, 0.45);
}

/**
 * 🎉 Quiz complete — success chord (passed)
 */
export function soundQuizComplete() {
    if (!canPlay()) return;
    // Triumphant major chord with rising sweep
    playTone(392, 523, 0.15, 'sine', 0.1, 0); // G4 → C5
    playChord([523, 659, 784], 0.3, 'sine', 0.08, 0.12); // C major
    playChord([523, 659, 784, 1047], 0.6, 'sine', 0.1, 0.35); // Full C major
}

/**
 * 😔 Quiz complete — fail tone (didn't pass)
 */
export function soundQuizFail() {
    if (!canPlay()) return;
    // Gentle minor descent — not harsh, encouraging retry
    playTone(392, 370, 0.3, 'sine', 0.08, 0);
    playTone(330, 294, 0.35, 'sine', 0.07, 0.15);
    playTone(294, 262, 0.4, 'triangle', 0.06, 0.3);
}

/**
 * 👆 Light tap — subtle click for UI interactions
 */
export function soundTap() {
    if (!canPlay()) return;
    playTone(800, 600, 0.04, 'sine', 0.06, 0);
}
