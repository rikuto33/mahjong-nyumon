/*
 * 効果音。音源ファイルは使わず、Web Audio API でその場で合成する（雀魂の音源は使わない）。
 * iPad Safari では最初のタップ以降でないと音が出ないので、AudioContext は初回再生時に作る。
 */

export type SoundName = 'select' | 'discard' | 'call' | 'riichi' | 'win' | 'draw' | 'correct' | 'wrong' | 'tick';

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** 短い音（周波数・長さ・波形・音量・開始の遅れ） */
function tone(c: AudioContext, freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, slideTo?: number) {
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** 牌を卓に置く「コトッ」という音：短いノイズを帯域通過させる */
function knock(c: AudioContext, vol: number, freq: number, delay = 0) {
  const t0 = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * 0.06);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = 2.5;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t0);
}

export function play(name: SoundName) {
  if (!enabled) return;
  const c = audio();
  if (!c) return;
  switch (name) {
    case 'select':
      knock(c, 0.25, 2600);
      break;
    case 'discard':
      knock(c, 0.9, 1400);
      tone(c, 180, 0.05, 'sine', 0.15);
      break;
    case 'tick':
      tone(c, 1320, 0.07, 'triangle', 0.12);
      break;
    case 'call':
      tone(c, 660, 0.12, 'triangle', 0.22);
      tone(c, 990, 0.18, 'triangle', 0.22, 0.09);
      break;
    case 'riichi':
      tone(c, 440, 0.5, 'sawtooth', 0.08, 0, 880);
      tone(c, 880, 0.3, 'triangle', 0.18, 0.35);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(c, f, 0.35, 'triangle', 0.2, i * 0.11));
      tone(c, 1568, 0.6, 'sine', 0.12, 0.45);
      break;
    case 'draw':
      tone(c, 392, 0.3, 'sine', 0.15);
      tone(c, 330, 0.45, 'sine', 0.15, 0.22);
      break;
    case 'correct':
      tone(c, 784, 0.12, 'triangle', 0.2);
      tone(c, 1175, 0.22, 'triangle', 0.2, 0.1);
      break;
    case 'wrong':
      tone(c, 220, 0.25, 'square', 0.07, 0, 180);
      break;
  }
}
