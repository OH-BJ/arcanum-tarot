/**
 * Web Audio로 직접 합성하는 효과음 — 음원 파일이 없어 저작권·용량 걱정이 없다.
 * 브라우저 자동재생 정책 때문에 사용자의 첫 클릭(입장 버튼)에서 unlockAudio()를 호출해야 소리가 난다.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let reverb: ConvolverNode | null = null;
let noise: AudioBuffer | null = null;
let ambient: { stop: () => void } | null = null;
let lastHover = 0;

const MUTE_KEY = "arcanum:muted";
let muted = readMuted();

function readMuted() {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    /* 저장 불가 환경은 무시 */
  }
  if (ctx && master) master.gain.setTargetAtTime(value ? 0 : 0.9, ctx.currentTime, 0.15);
}

/** 사용자 제스처 안에서 호출 — 오디오 컨텍스트 생성/재개 */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    ctx = new AudioContext();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(comp).connect(ctx.destination);

    // 생성한 잔향 (지수 감쇠 노이즈)
    reverb = ctx.createConvolver();
    const len = ctx.sampleRate * 3;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    reverb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    reverb.connect(wet).connect(master);

    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const n = noise.getChannelData(0);
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
  }
  void ctx.resume();
}

function ready() {
  return ctx && master && reverb && noise ? { ctx, master, reverb, noise } : null;
}

/** 출력 노드: 원음 + 잔향 */
function out(gain: number, wet = 0) {
  const a = ready()!;
  const g = a.ctx.createGain();
  g.gain.value = gain;
  g.connect(a.master);
  if (wet > 0) {
    const s = a.ctx.createGain();
    s.gain.value = wet;
    g.connect(s).connect(a.reverb);
  }
  return g;
}

function envelope(param: AudioParam, t: number, attack: number, peak: number, decay: number) {
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(peak, t + attack);
  param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

/** 필터를 거친 노이즈 한 번 */
function noiseHit(opts: {
  at?: number;
  type: BiquadFilterType;
  freq: number;
  freqTo?: number;
  q?: number;
  attack: number;
  decay: number;
  gain: number;
  wet?: number;
}) {
  const a = ready();
  if (!a) return;
  const t = a.ctx.currentTime + (opts.at ?? 0);
  const src = a.ctx.createBufferSource();
  src.buffer = a.noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = a.ctx.createBiquadFilter();
  f.type = opts.type;
  f.Q.value = opts.q ?? 1;
  f.frequency.setValueAtTime(opts.freq, t);
  if (opts.freqTo) f.frequency.exponentialRampToValueAtTime(opts.freqTo, t + opts.attack + opts.decay);
  const g = a.ctx.createGain();
  envelope(g.gain, t, opts.attack, 1, opts.decay);
  src.connect(f).connect(g).connect(out(opts.gain, opts.wet));
  src.start(t, Math.random() * 1.5);
  src.stop(t + opts.attack + opts.decay + 0.05);
}

/** 종소리: 비조화 배음 + 긴 잔향 */
function bell(freq: number, at = 0, gain = 0.12, decay = 2.8) {
  const a = ready();
  if (!a) return;
  const t = a.ctx.currentTime + at;
  [1, 2.76, 5.4, 8.93].forEach((ratio, i) => {
    const o = a.ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq * ratio;
    const g = a.ctx.createGain();
    envelope(g.gain, t, 0.004, 1 / (i + 1.5), decay / (1 + i * 0.7));
    o.connect(g).connect(out(gain, 0.9));
    o.start(t);
    o.stop(t + decay + 0.1);
  });
}

function tone(opts: { freq: number; freqTo?: number; type?: OscillatorType; at?: number; attack: number; decay: number; gain: number; wet?: number }) {
  const a = ready();
  if (!a) return;
  const t = a.ctx.currentTime + (opts.at ?? 0);
  const o = a.ctx.createOscillator();
  o.type = opts.type ?? "sine";
  o.frequency.setValueAtTime(opts.freq, t);
  if (opts.freqTo) o.frequency.exponentialRampToValueAtTime(opts.freqTo, t + opts.attack + opts.decay);
  const g = a.ctx.createGain();
  envelope(g.gain, t, opts.attack, 1, opts.decay);
  o.connect(g).connect(out(opts.gain, opts.wet));
  o.start(t);
  o.stop(t + opts.attack + opts.decay + 0.05);
}

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export const sfx = {
  /** 낮게 깔리는 신비로운 배경음 (서서히 커짐) */
  ambientStart() {
    const a = ready();
    if (!a || ambient) return;
    const t = a.ctx.currentTime;
    const bus = a.ctx.createGain();
    bus.gain.setValueAtTime(0.0001, t);
    bus.gain.exponentialRampToValueAtTime(1, t + 4);
    const lp = a.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    bus.connect(lp).connect(out(0.5, 0.6));

    const nodes: AudioScheduledSourceNode[] = [];
    const voice = (freq: number, type: OscillatorType, gain: number, detune = 0) => {
      const o = a.ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      const g = a.ctx.createGain();
      g.gain.value = gain;
      o.connect(g).connect(bus);
      o.start(t);
      nodes.push(o);
      return g;
    };
    voice(55, "sine", 0.09);
    voice(82.41, "triangle", 0.035, 4);
    voice(110, "sine", 0.03, -6);
    const pad1 = voice(220, "sine", 0.012);
    const pad2 = voice(329.63, "sine", 0.01, 3);

    // 천천히 숨 쉬는 듯한 떨림
    const lfo = a.ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = a.ctx.createGain();
    lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain);
    lfoGain.connect(pad1.gain);
    lfoGain.connect(pad2.gain);
    const lfo2 = a.ctx.createOscillator();
    lfo2.frequency.value = 0.05;
    const lfo2Gain = a.ctx.createGain();
    lfo2Gain.gain.value = 250;
    lfo2.connect(lfo2Gain).connect(lp.frequency);
    lfo.start(t);
    lfo2.start(t);
    nodes.push(lfo, lfo2);

    // 공기 소리
    const air = a.ctx.createBufferSource();
    air.buffer = a.noise;
    air.loop = true;
    const bp = a.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 0.6;
    const airGain = a.ctx.createGain();
    airGain.gain.value = 0.012;
    air.connect(bp).connect(airGain).connect(bus);
    air.start(t);
    nodes.push(air);

    ambient = {
      stop: () => {
        bus.gain.setTargetAtTime(0.0001, a.ctx.currentTime, 0.5);
        nodes.forEach((n) => n.stop(a.ctx.currentTime + 3));
        ambient = null;
      },
    };
  },

  /** 인트로: 촛불이 하나씩 붙는 소리 (Candles의 점등 시각과 맞춤) */
  introCandles(count: number) {
    for (let i = 0; i < count; i++) {
      const at = 0.45 + i * 0.28;
      noiseHit({ at, type: "bandpass", freq: 1400, freqTo: 350, q: 0.8, attack: 0.01, decay: 0.35, gain: 0.22, wet: 0.3 });
      tone({ at, freq: 140, freqTo: 70, attack: 0.005, decay: 0.25, gain: 0.12 });
    }
    bell(392, 0.45 + count * 0.28 + 0.3, 0.07, 4);
  },

  /** 질문이 수정구슬로 빨려 들어감: 상승하는 반짝임 */
  absorb(duration: number) {
    const a = ready();
    if (!a) return;
    noiseHit({ type: "bandpass", freq: 500, freqTo: 4000, q: 2, attack: duration * 0.7, decay: duration * 0.3, gain: 0.12, wet: 0.5 });
    for (let i = 0; i < 10; i++) bell(pick(PENTATONIC) * 2, i * (duration / 12), 0.025, 1.2);
    tone({ at: duration * 0.85, freq: 110, freqTo: 55, attack: 0.02, decay: 1.2, gain: 0.25, wet: 0.5 });
    bell(523.25, duration * 0.85, 0.08, 3.5);
  },

  /** 셔플: 카드가 펄럭이는 소리 + 바람 */
  shuffle(duration: number) {
    noiseHit({ type: "bandpass", freq: 300, freqTo: 1200, q: 0.7, attack: duration * 0.45, decay: duration * 0.55, gain: 0.18, wet: 0.3 });
    for (let i = 0; i < 70; i++) {
      const at = Math.pow(Math.random(), 0.8) * duration * 0.85;
      noiseHit({ at, type: "highpass", freq: 2500 + Math.random() * 2500, attack: 0.002, decay: 0.03 + Math.random() * 0.03, gain: 0.05 + Math.random() * 0.05 });
    }
  },

  /** 카드를 뽑아 날려 보냄 */
  pick() {
    noiseHit({ type: "bandpass", freq: 700, freqTo: 2600, q: 1.2, attack: 0.08, decay: 0.35, gain: 0.2, wet: 0.2 });
  },

  /** 테이블에 카드가 내려앉음 */
  place() {
    noiseHit({ type: "lowpass", freq: 600, attack: 0.003, decay: 0.12, gain: 0.25 });
    noiseHit({ type: "highpass", freq: 3500, attack: 0.002, decay: 0.03, gain: 0.06 });
  },

  /** 카드 뒤집기 */
  flip() {
    noiseHit({ type: "bandpass", freq: 900, freqTo: 3000, q: 1, attack: 0.15, decay: 0.25, gain: 0.12, wet: 0.2 });
    noiseHit({ at: 0.32, type: "highpass", freq: 2200, attack: 0.002, decay: 0.05, gain: 0.12 });
  },

  /** 카드 공개 종소리 (역방향은 낮고 어둡게) */
  reveal(reversed: boolean) {
    const base = reversed ? 415.3 : 659.25;
    bell(base, 0, 0.1, 3);
    bell(base * (reversed ? 1.2 : 1.5), 0.12, 0.06, 2.5);
  },

  /** 메이저 아르카나: 깊은 울림 + 화음 + 반짝임 */
  major(reversed: boolean) {
    tone({ freq: 120, freqTo: 38, attack: 0.01, decay: 1.6, gain: 0.55, wet: 0.4 });
    noiseHit({ type: "lowpass", freq: 1800, freqTo: 120, attack: 0.005, decay: 1.4, gain: 0.25, wet: 0.6 });
    const chord = reversed ? [220, 261.63, 329.63, 415.3] : [261.63, 329.63, 392, 523.25];
    chord.forEach((f, i) => bell(f, 0.05 + i * 0.09, 0.09, 4.5));
    for (let i = 0; i < 8; i++) bell(pick(PENTATONIC) * 2, 0.4 + i * 0.11, 0.02, 1.5);
  },

  /** 덱 위로 마우스가 지나갈 때 아주 작은 틱 */
  hover() {
    const now = performance.now();
    if (now - lastHover < 70) return;
    lastHover = now;
    tone({ freq: 2200 + Math.random() * 600, attack: 0.002, decay: 0.04, gain: 0.015 });
  },

  /** 카드 회수 */
  gather() {
    noiseHit({ type: "bandpass", freq: 2400, freqTo: 500, q: 0.9, attack: 0.1, decay: 0.9, gain: 0.16, wet: 0.3 });
  },
};
