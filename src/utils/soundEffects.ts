/**
 * Aura Finance - Premium Audio Confirmation System
 * 
 * Provides subtle, elegant, and lightweight Web Audio API sound effects
 * for transaction confirmations:
 * 1. Income: Soft, elegant positive chime (~200ms)
 * 2. Expense: Soft, clean confirmation click/tick (~160ms)
 * 
 * Zero external audio assets, zero network calls, completely resilient.
 */

const SOUND_STORAGE_KEY = 'aura_sound_effects_enabled';

// Shared AudioContext instance (lazy-initialized upon user interaction)
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        // Autoplay policy or device mute; handled gracefully
      });
    }
    return audioCtx;
  } catch (err) {
    console.debug('Web Audio API not available or blocked:', err);
    return null;
  }
};

/**
 * Checks if sound effects are enabled in user preferences.
 * Default is ON (true).
 */
export const isSoundEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    if (stored === null) return true; // Default ON
    return stored === 'true';
  } catch {
    return true;
  }
};

/**
 * Updates the user's sound effects preference and notifies active listeners.
 */
export const setSoundEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(
      new CustomEvent('aura_sound_pref_changed', { detail: { enabled } })
    );
  } catch (err) {
    console.debug('Failed to save sound preference:', err);
  }
};

/**
 * INCOME CONFIRMATION SOUND
 * - Soft, elegant positive chime.
 * - Duration: ~200ms.
 * - Gentle harmonic ascending dual-tone with soft exponential decay.
 * - Non-distracting, warm, and sophisticated.
 */
export const playIncomeSuccessSound = (): void => {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.22; // ~220ms total duration

    // Master gain node for income chime (very soft, premium volume)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.09, now + 0.015);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Subtle low-pass filter to keep sound warm and eliminate harsh digital highs
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);

    masterGain.connect(filter);
    filter.connect(ctx.destination);

    // Note 1: E6 (~1318 Hz) pure sine
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.5, now);
    osc1.frequency.exponentialRampToValueAtTime(1396.9, now + 0.1);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.8, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc1.connect(gain1);
    gain1.connect(masterGain);

    // Note 2: Gentle higher chime layer (G#6 ~1661 Hz) entering 40ms later
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1661.2, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(1760.0, now + duration);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.setValueAtTime(0.0001, now + 0.04);
    gain2.gain.linearRampToValueAtTime(0.6, now + 0.055);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    // Start & Stop
    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.04);
    osc2.stop(now + duration);
  } catch (err) {
    // Fail silently so transaction flow is never interrupted
    console.debug('Error playing income sound:', err);
  }
};

/**
 * EXPENSE CONFIRMATION SOUND
 * - Soft, clean confirmation click/tick.
 * - Duration: ~160ms.
 * - Tactile, neutral, and premium (like modern fintech haptic click).
 * - No warning or negative connotation.
 */
export const playExpenseSuccessSound = (): void => {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.16; // ~160ms total duration

    // Master gain for tactile tick (subtle, soft tap)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.07, now + 0.008);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Warm filter to round off the edges
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + duration);

    masterGain.connect(filter);
    filter.connect(ctx.destination);

    // Tactile body oscillator: 520Hz down to 260Hz smooth drop
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.09);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.001, now);
    oscGain.gain.linearRampToValueAtTime(0.9, now + 0.008);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(masterGain);

    // Subtle micro-click layer for tactile definition
    const microOsc = ctx.createOscillator();
    microOsc.type = 'triangle';
    microOsc.frequency.setValueAtTime(880, now);
    microOsc.frequency.exponentialRampToValueAtTime(440, now + 0.04);

    const microGain = ctx.createGain();
    microGain.gain.setValueAtTime(0.001, now);
    microGain.gain.linearRampToValueAtTime(0.3, now + 0.005);
    microGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    microOsc.connect(microGain);
    microGain.connect(masterGain);

    // Start & Stop
    osc.start(now);
    osc.stop(now + duration);
    microOsc.start(now);
    microOsc.stop(now + 0.045);
  } catch (err) {
    // Fail silently so transaction flow is never interrupted
    console.debug('Error playing expense sound:', err);
  }
};
