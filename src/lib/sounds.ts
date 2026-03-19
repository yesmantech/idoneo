/**
 * @file sounds.ts
 * @description Tier S premium sound effects using Web Audio API.
 *
 * Rich, warm sounds built with layered harmonics, low-pass filters,
 * chorus detuning, and smooth ADSR envelopes. Inspired by Duolingo's
 * satisfying audio feedback — no raw oscillator beeps.
 *
 * All sounds are stateless, fire-and-forget, and respect the
 * `idoneo_sounds_enabled` toggle in localStorage.
 */

// ============================================================================
// AUDIO CONTEXT (lazy singleton)
// ============================================================================

let _ctx: AudioContext | null = null;

function ctx(): AudioContext | null {
    try {
        if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (_ctx.state === 'suspended') _ctx.resume();
        return _ctx;
    } catch {
        return null;
    }
}

// ============================================================================
// TOGGLE
// ============================================================================

function canPlay(): boolean {
    try {
        const v = localStorage.getItem('idoneo_sounds_enabled');
        return v === null ? true : v === 'true';
    } catch { return true; }
}

export function getSoundsEnabled(): boolean {
    return canPlay();
}

// ============================================================================
// DSP BUILDING BLOCKS
// ============================================================================

/** Create a bell-like tone with harmonic partials */
function bell(
    freq: number,
    duration: number,
    vol: number,
    startTime: number,
    ac: AudioContext,
    dest: AudioNode,
) {
    // Bell = fundamental + inharmonic partials with fast decay
    const partials = [
        { ratio: 1, amp: 1.0, decay: duration },
        { ratio: 2.0, amp: 0.6, decay: duration * 0.7 },
        { ratio: 3.0, amp: 0.3, decay: duration * 0.5 },
        { ratio: 4.2, amp: 0.2, decay: duration * 0.35 },
        { ratio: 5.4, amp: 0.1, decay: duration * 0.25 },
    ];

    partials.forEach(p => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const filter = ac.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq * p.ratio;

        // Warmth: low-pass filter rolls off harsh highs
        filter.type = 'lowpass';
        filter.frequency.value = Math.min(freq * p.ratio * 3, 8000);
        filter.Q.value = 1;

        // ADSR: soft attack, natural decay
        const peakVol = vol * p.amp;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(peakVol, startTime + 0.008); // 8ms attack
        gain.gain.exponentialRampToValueAtTime(peakVol * 0.4, startTime + p.decay * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + p.decay);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc.start(startTime);
        osc.stop(startTime + p.decay + 0.05);
    });
}

/** Rich warm pad/chord tone with chorus detuning */
function warmTone(
    freq: number,
    duration: number,
    vol: number,
    startTime: number,
    ac: AudioContext,
    dest: AudioNode,
    type: OscillatorType = 'triangle',
) {
    // 3 detuned voices for chorus width
    const detunes = [-6, 0, 6];
    detunes.forEach(detune => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const filter = ac.createBiquadFilter();

        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;

        filter.type = 'lowpass';
        filter.frequency.value = freq * 4;
        filter.Q.value = 0.7;

        const v = vol / detunes.length;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(v, startTime + 0.015);
        gain.gain.setValueAtTime(v, startTime + duration * 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
    });
}

/** Sparkle/shimmer — noise burst filtered to high frequency */
function shimmer(
    duration: number,
    vol: number,
    startTime: number,
    ac: AudioContext,
    dest: AudioNode,
) {
    const bufferSize = ac.sampleRate * duration;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = ac.createBufferSource();
    source.buffer = buffer;

    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 6000;
    filter.Q.value = 2;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    source.start(startTime);
}

// ============================================================================
// EXPORTED SOUND EFFECTS
// ============================================================================

/**
 * ✅ Correct answer — satisfying bell "ding" (Duolingo-style)
 * Two clean bell tones: perfect fifth + octave
 */
export function soundCorrect() {
    if (!canPlay()) return;
    const ac = ctx();
    if (!ac) return;
    const t = ac.currentTime;

    bell(880, 0.4, 0.12, t, ac, ac.destination); // A5
    bell(1320, 0.35, 0.08, t + 0.06, ac, ac.destination); // E6 (perfect fifth above)
}

/**
 * ❌ Wrong answer — soft warm "boop", not harsh
 * Descending minor second with filtered warmth
 */
export function soundWrong() {
    if (!canPlay()) return;
    const ac = ctx();
    if (!ac) return;
    const t = ac.currentTime;

    warmTone(330, 0.25, 0.1, t, ac, ac.destination); // E4
    warmTone(311, 0.3, 0.08, t + 0.08, ac, ac.destination); // Eb4 (minor second down)
}

/**
 * 🏆 Badge unlock — magical sparkle cascade + triumphant chord
 */
export function soundBadgeUnlock() {
    if (!canPlay()) return;
    const ac = ctx();
    if (!ac) return;
    const t = ac.currentTime;

    // Rising arpeggio bells
    bell(523, 0.3, 0.08, t, ac, ac.destination);        // C5
    bell(659, 0.3, 0.09, t + 0.1, ac, ac.destination);  // E5
    bell(784, 0.3, 0.1, t + 0.2, ac, ac.destination);   // G5
    bell(1047, 0.5, 0.12, t + 0.3, ac, ac.destination); // C6

    // Sparkle shimmer
    shimmer(0.6, 0.04, t + 0.25, ac, ac.destination);

    // Warm sustain chord (C major)
    warmTone(523, 0.8, 0.06, t + 0.4, ac, ac.destination);
    warmTone(659, 0.8, 0.05, t + 0.4, ac, ac.destination);
    warmTone(784, 0.8, 0.05, t + 0.4, ac, ac.destination);
    warmTone(1047, 0.7, 0.04, t + 0.4, ac, ac.destination);
}

/**
 * 🎉 Quiz passed — victory fanfare with rich chord
 */
export function soundQuizComplete() {
    if (!canPlay()) return;
    const ac = ctx();
    if (!ac) return;
    const t = ac.currentTime;

    // Quick ascending grace notes
    bell(392, 0.15, 0.06, t, ac, ac.destination);        // G4
    bell(494, 0.15, 0.07, t + 0.07, ac, ac.destination); // B4
    bell(587, 0.15, 0.08, t + 0.14, ac, ac.destination); // D5

    // Triumphant G major chord (warm + bell layers)
    const chordStart = t + 0.22;
    // Bell layer
    bell(784, 0.6, 0.1, chordStart, ac, ac.destination);  // G5
    bell(988, 0.5, 0.07, chordStart, ac, ac.destination);  // B5
    bell(1175, 0.5, 0.06, chordStart, ac, ac.destination); // D6

    // Warm pad layer
    warmTone(392, 1.0, 0.06, chordStart, ac, ac.destination);  // G4
    warmTone(494, 1.0, 0.05, chordStart, ac, ac.destination);  // B4
    warmTone(587, 1.0, 0.05, chordStart, ac, ac.destination);  // D5
    warmTone(784, 0.9, 0.04, chordStart, ac, ac.destination);  // G5

    // Shimmer sparkle
    shimmer(0.5, 0.03, chordStart + 0.1, ac, ac.destination);
}

/**
 * 😔 Quiz failed — gentle, encouraging minor chord
 * Not punishing — just a soft "try again" feel
 */
export function soundQuizFail() {
    if (!canPlay()) return;
    const ac = ctx();
    if (!ac) return;
    const t = ac.currentTime;

    // Gentle descending two-note motif
    warmTone(440, 0.4, 0.07, t, ac, ac.destination, 'sine');       // A4
    warmTone(392, 0.5, 0.06, t + 0.2, ac, ac.destination, 'sine'); // G4

    // Soft minor chord sustain (Am)
    warmTone(220, 0.8, 0.04, t + 0.4, ac, ac.destination, 'sine'); // A3
    warmTone(262, 0.8, 0.03, t + 0.4, ac, ac.destination, 'sine'); // C4
    warmTone(330, 0.7, 0.03, t + 0.4, ac, ac.destination, 'sine'); // E4
}

/**
 * 👆 UI tap — subtle, premium click
 */
export function soundTap() {
    if (!canPlay()) return;
    const ac = ctx();
    if (!ac) return;
    const t = ac.currentTime;

    bell(1200, 0.08, 0.05, t, ac, ac.destination);
}
