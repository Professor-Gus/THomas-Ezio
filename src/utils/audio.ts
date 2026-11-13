// Simple synthesizer using Web Audio API for immersive futuristic sound effects

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setMute(muted: boolean) {
  isMuted = muted;
}

export function playBeep(frequency = 800, duration = 0.08, type: OscillatorType = 'sine') {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Smooth ramp down to prevent click pop
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

export function playTechClick() {
  playBeep(1200, 0.03, 'triangle');
}

export function playSuccess() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.05, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    playTone(523.25, now, 0.1); // C5
    playTone(659.25, now + 0.08, 0.15); // E5
    playTone(783.99, now + 0.16, 0.25); // G5
  } catch (e) {}
}

export function playError() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.04, start);
      gain.gain.linearRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    playTone(180, now, 0.15);
    playTone(130, now + 0.08, 0.2);
  } catch (e) {}
}

export function playScannerSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.4);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.5);
  } catch (e) {}
}

export function playWarpCharge() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 1.2);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(120, now);
    osc2.frequency.exponentialRampToValueAtTime(2400, now + 1.2);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 1.3);
    osc2.start();
    osc2.stop(now + 1.3);
  } catch (e) {}
}

let alarmInterval: any = null;

export function startAlarm(frequency = 440) {
  if (isMuted) return;
  if (alarmInterval) clearInterval(alarmInterval);

  const triggerAlarmTone = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(frequency * 1.5, ctx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  triggerAlarmTone();
  alarmInterval = setInterval(triggerAlarmTone, 800);
}

export function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}
