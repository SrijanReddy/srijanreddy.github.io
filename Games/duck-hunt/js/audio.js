let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function playTone(freq, duration, type = 'square', volume = 0.3, delay = 0) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
  gain.gain.setValueAtTime(volume, ac.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
  osc.start(ac.currentTime + delay);
  osc.stop(ac.currentTime + delay + duration + 0.01);
}

function playNoise(duration, volume = 0.2) {
  const ac = getCtx();
  const bufferSize = ac.sampleRate * duration;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ac.createBufferSource();
  const gain = ac.createGain();
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(ac.destination);
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  source.start();
}

export const Audio = {
  muted: false,

  gunshot() {
    if (this.muted) return;
    playNoise(0.08, 0.4);
    playTone(80, 0.12, 'sawtooth', 0.2);
  },

  duckHit() {
    if (this.muted) return;
    playTone(600, 0.08, 'square', 0.2);
    playTone(450, 0.08, 'square', 0.2, 0.08);
    playTone(300, 0.1, 'square', 0.15, 0.16);
  },

  duckFall() {
    if (this.muted) return;
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ac.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
    osc.start();
    osc.stop(ac.currentTime + 0.41);
  },

  dogLaugh() {
    if (this.muted) return;
    // HA HA HA — three rising bursts, each louder and more obnoxious
    const ha = [600, 750, 600, 750, 500, 700, 900, 700, 900, 600, 800, 1000, 800, 1000];
    ha.forEach((freq, i) => playTone(freq, 0.09, 'square', 0.4, i * 0.1));
  },

  dogRetrieve() {
    if (this.muted) return;
    [400, 500, 600, 800].forEach((f, i) => playTone(f, 0.1, 'square', 0.2, i * 0.1));
  },

  roundComplete() {
    if (this.muted) return;
    [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.15, 'square', 0.2, i * 0.15));
  },

  gameOver() {
    if (this.muted) return;
    [400, 350, 300, 200].forEach((f, i) => playTone(f, 0.2, 'sawtooth', 0.2, i * 0.2));
  },

  titleMusic() {
    if (this.muted) return;
    const melody = [
      [523, 0.1], [659, 0.1], [784, 0.2], [659, 0.1], [523, 0.1],
      [440, 0.1], [523, 0.3],
    ];
    let t = 0;
    melody.forEach(([f, d]) => { playTone(f, d, 'square', 0.15, t); t += d + 0.02; });
  },
};
