// Procedural Web Audio API sound generator for Vintage Vault
// Zero external audio files required - works 100% offline with zero latency!

class SoundManager {
  private ctx: AudioContext | null = null;
  public soundEnabled = true;
  public musicEnabled = true;
  public fxVolume = 0.8;
  public bgmVolume = 0.5;

  private bgmInterval: number | null = null;
  private isBgmPlaying = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(fx: number, bgm: number) {
    this.fxVolume = Math.max(0, Math.min(1, fx));
    this.bgmVolume = Math.max(0, Math.min(1, bgm));
  }

  // Rust / Chemical cleaner fizz
  public playLaserHiss() {
    if (!this.soundEnabled || this.fxVolume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.12;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400 + Math.random() * 800, this.ctx.currentTime);
      filter.Q.value = 3.0;

      const gain = this.ctx.createGain();
      const peak = 0.08 * this.fxVolume;
      gain.gain.setValueAtTime(peak, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (_) {}
  }

  // Polishing buffing friction
  public playBuff() {
    if (!this.soundEnabled || this.fxVolume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 40, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.09);

      const peak = 0.1 * this.fxVolume;
      gain.gain.setValueAtTime(peak, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (_) {}
  }

  // Mechanical gear click
  public playGearClick() {
    if (!this.soundEnabled || this.fxVolume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + Math.random() * 300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

      const peak = 0.15 * this.fxVolume;
      gain.gain.setValueAtTime(peak, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (_) {}
  }

  // Cash Register Ka-Ching!
  public playCashRegister() {
    if (!this.soundEnabled || this.fxVolume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // High chime bell
      const bell = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(1975.53, now); // B6
      bell.frequency.setValueAtTime(2637.02, now + 0.08); // E7
      bellGain.gain.setValueAtTime(0.2 * this.fxVolume, now);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      bell.connect(bellGain);
      bellGain.connect(this.ctx.destination);
      bell.start(now);
      bell.stop(now + 0.6);

      // Coin clatter
      for (let i = 0; i < 4; i++) {
        const coin = this.ctx.createOscillator();
        const coinGain = this.ctx.createGain();
        coin.type = 'sine';
        coin.frequency.setValueAtTime(1400 + i * 280, now + 0.08 + i * 0.04);
        coinGain.gain.setValueAtTime(0.08 * this.fxVolume, now + 0.08 + i * 0.04);
        coinGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.04);
        coin.connect(coinGain);
        coinGain.connect(this.ctx.destination);
        coin.start(now + 0.08 + i * 0.04);
        coin.stop(now + 0.25 + i * 0.04);
      }
    } catch (_) {}
  }

  // Auction gavel knock
  public playGavel() {
    if (!this.soundEnabled || this.fxVolume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3 * this.fxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (_) {}
  }

  // Grade upgrade chime
  public playGradeUpgrade() {
    if (!this.soundEnabled || this.fxVolume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.12 * this.fxVolume, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.35);
      });
    } catch (_) {}
  }

  // Cute customer blip
  public playCustomerBlip(pitch = 1) {
    if (!this.soundEnabled || this.fxVolume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 * pitch + Math.random() * 60, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.06 * this.fxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (_) {}
  }

  // Cozy Vintage Ambient BGM (Soft warm chords)
  public toggleMusic(enable?: boolean) {
    this.musicEnabled = enable !== undefined ? enable : !this.musicEnabled;
    if (this.musicEnabled) {
      this.startLofiBgm();
    } else {
      this.stopLofiBgm();
    }
  }

  public startLofiBgm() {
    if (!this.musicEnabled || this.isBgmPlaying || this.bgmVolume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.isBgmPlaying = true;

      const chords = [
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [164.81, 196.00, 246.94, 293.66], // Em7
        [146.83, 174.61, 220.00, 261.63], // Dm7
        [130.81, 164.81, 196.00, 246.94]  // Cmaj7
      ];

      let chordIndex = 0;
      const playNextChord = () => {
        if (!this.isBgmPlaying || !this.ctx || !this.musicEnabled) return;
        const currentChord = chords[chordIndex];
        chordIndex = (chordIndex + 1) % chords.length;
        const now = this.ctx.currentTime;

        currentChord.forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          const peak = 0.02 * this.bgmVolume;
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(peak, now + 0.6);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(now);
          osc.stop(now + 3.4);
        });
      };

      playNextChord();
      this.bgmInterval = window.setInterval(playNextChord, 3600);
    } catch (_) {}
  }

  public stopLofiBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const soundManager = new SoundManager();
