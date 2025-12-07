// ======================
// AUDIO SYNTH ENGINE
// ======================
export class AudioSynth {
  constructor() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.audioContext.destination);
  }

  resume() {
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }

  playTone(frequency, duration, type = "sine", volume = 0.3) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;

    osc.connect(gain);
    gain.connect(this.masterGain);

    const now = this.audioContext.currentTime;
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    osc.stop(now + duration);
  }

  playTick() {
    this.playTone(1200, 0.05, "square", 0.2);
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, "triangle", 0.4), i * 150);
    });
  }

  playLoss() {
    const notes = [800, 600, 400, 200];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, "sawtooth", 0.3), i * 100);
    });
  }

  playHeartbeat() {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this.playTone(120, 0.1, "sine", 0.4);
        setTimeout(() => this.playTone(100, 0.1, "sine", 0.3), 100);
      }, i * 500);
    }
  }
}
