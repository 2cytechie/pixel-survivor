/**
 * MusicManager — 程序化生成 8-bit 芯片音乐（Chiptune）
 * 使用 Web Audio API 合成，无需外部音频文件
 */
export class MusicManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private loopTimer: number | null = null;
  private bpm: number = 140;

  // 音色定义
  private readonly WAVE_SQUARE = 'square';
  private readonly WAVE_SAWTOOTH = 'sawtooth';
  private readonly WAVE_TRIANGLE = 'triangle';

  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.25;
    this.masterGain.connect(this.ctx.destination);
  }

  play(): void {
    if (this.isPlaying) return;
    this.init();
    if (this.ctx!.state === 'suspended') {
      this.ctx!.resume();
    }
    this.isPlaying = true;
    this.scheduleLoop();
  }

  stop(): void {
    this.isPlaying = false;
    if (this.loopTimer !== null) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : 0.25,
        this.ctx!.currentTime,
        0.05
      );
    }
    return this.isMuted;
  }

  get muted(): boolean {
    return this.isMuted;
  }

  get playing(): boolean {
    return this.isPlaying;
  }

  destroy(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }

  // ==================== 音乐编排 ====================

  private scheduleLoop(): void {
    if (!this.isPlaying || !this.ctx) return;

    const beatDur = 60 / this.bpm; // 秒/拍
    const barDur = beatDur * 4;     // 4拍一小节

    // 整首歌结构：Intro(2小节) → Verse(8小节) → Chorus(8小节) → Outro(2小节)
    // 简化为一个循环段落（8小节），包含主旋律+低音+鼓点
    const loopBars = 8;
    const loopDuration = loopBars * barDur;

    const now = this.ctx.currentTime + 0.05;

    // ── 低音线（Bass）──
    this.playBassLine(now, beatDur, loopBars);

    // ── 主旋律（Lead）──
    this.playLeadMelody(now, beatDur, loopBars);

    // ── 和弦铺底（Pad）──
    this.playChordPad(now, beatDur, loopBars);

    // ── 鼓点节奏 ──
    this.playDrums(now, beatDur, loopBars);

    // ── 琶音装饰 ──
    this.playArpeggio(now, beatDur, loopBars);

    // 循环
    this.loopTimer = window.setTimeout(() => {
      this.scheduleLoop();
    }, loopDuration * 1000 - 100);
  }

  // ==================== 低音线 ====================

  private playBassLine(startTime: number, beatDur: number, bars: number): void {
    // 激情的低音进行: Am - F - C - G (经典进行)
    const bassPattern = [
      // Am
      { note: 110, beats: 2 },   // A2
      { note: 130.81, beats: 2 }, // C3
      // F
      { note: 87.31, beats: 2 },  // F2
      { note: 110, beats: 2 },    // A2
      // C
      { note: 130.81, beats: 2 }, // C3
      { note: 164.81, beats: 2 }, // E3
      // G
      { note: 98, beats: 2 },     // G2
      { note: 123.47, beats: 2 }, // B2
    ];

    let t = startTime;
    for (let bar = 0; bar < bars; bar++) {
      const pat = bassPattern[bar % bassPattern.length];
      this.playNote(t, pat.note, beatDur * pat.beats * 0.9, this.WAVE_SAWTOOTH, 0.35, 0.05);
      // 每拍加一个八度低音
      this.playNote(t, pat.note / 2, beatDur * 2 * 0.8, this.WAVE_SQUARE, 0.2, 0.08);
      t += beatDur * 4;
    }
  }

  // ==================== 主旋律 ====================

  private playLeadMelody(startTime: number, beatDur: number, bars: number): void {
    // 激情的主旋律 — 高音方波，快速音型
    const melody: Array<{ note: number; start: number; dur: number }> = [];

    // 音阶频率 (A minor pentatonic + extras)
    const A3 = 220, B3 = 246.94, C4 = 261.63, D4 = 293.66, E4 = 329.63,
          F4 = 349.23, G4 = 392, A4 = 440, B4 = 493.88, C5 = 523.25,
          D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880;

    // 8小节旋律编排
    const patterns = [
      // Bar 0-1: 上行冲刺
      [A4, C5, E5, A5, G5, E5, C5, D5],
      // Bar 2-3: 高空盘旋
      [E5, G5, A5, G5, E5, D5, C5, E5],
      // Bar 4-5: 激烈下行
      [A5, G5, F5, E5, D5, C5, D5, E5],
      // Bar 6-7: 收束
      [C5, D5, E5, G5, A5, G5, E5, C5],
    ];

    let t = startTime;
    for (let bar = 0; bar < bars; bar++) {
      const pat = patterns[bar % patterns.length];
      for (let i = 0; i < pat.length; i++) {
        melody.push({
          note: pat[i],
          start: t + i * beatDur * 0.5,
          dur: beatDur * 0.45,
        });
      }
      t += beatDur * 4;
    }

    // 演奏旋律
    for (const m of melody) {
      this.playNote(m.start, m.note, m.dur, this.WAVE_SQUARE, 0.18, 0.02);
      // 加一个高八度泛音增加亮度
      this.playNote(m.start, m.note * 2, m.dur * 0.3, this.WAVE_SQUARE, 0.04, 0.01);
    }
  }

  // ==================== 和弦铺底 ====================

  private playChordPad(startTime: number, beatDur: number, bars: number): void {
    const chords = [
      // Am: A C E
      [220, 261.63, 329.63],
      // F: F A C
      [174.61, 220, 261.63],
      // C: C E G
      [261.63, 329.63, 392],
      // G: G B D
      [196, 246.94, 293.66],
    ];

    let t = startTime;
    for (let bar = 0; bar < bars; bar++) {
      const chord = chords[bar % chords.length];
      const dur = beatDur * 3.8;
      for (const freq of chord) {
        this.playNote(t, freq, dur, this.WAVE_TRIANGLE, 0.06, 0.3);
      }
      t += beatDur * 4;
    }
  }

  // ==================== 鼓点 ====================

  private playDrums(startTime: number, beatDur: number, bars: number): void {
    let t = startTime;
    for (let bar = 0; bar < bars; bar++) {
      // 每拍一个 kick
      for (let beat = 0; beat < 4; beat++) {
        this.playKick(t + beat * beatDur);
        // 反拍加 hi-hat
        this.playHiHat(t + beat * beatDur + beatDur * 0.5);
      }
      // 第2、4拍加重 snare
      this.playSnare(t + beatDur * 1);
      this.playSnare(t + beatDur * 3);
      // 偶数小节加 fill
      if (bar % 2 === 1) {
        this.playHiHat(t + beatDur * 3.5);
        this.playHiHat(t + beatDur * 3.75);
      }
      t += beatDur * 4;
    }
  }

  // ==================== 琶音装饰 ====================

  private playArpeggio(startTime: number, beatDur: number, bars: number): void {
    const arps = [
      [220, 329.63, 440, 329.63],       // Am arpeggio
      [174.61, 261.63, 349.23, 261.63], // F arpeggio
      [261.63, 392, 523.25, 392],       // C arpeggio
      [196, 293.66, 392, 293.66],       // G arpeggio
    ];

    let t = startTime;
    for (let bar = 0; bar < bars; bar++) {
      const arp = arps[bar % arps.length];
      // 每小节16分音符琶音
      for (let i = 0; i < 16; i++) {
        const noteIdx = i % arp.length;
        const noteTime = t + i * beatDur * 0.25;
        this.playNote(noteTime, arp[noteIdx], beatDur * 0.2, this.WAVE_SQUARE, 0.05, 0.01);
      }
      t += beatDur * 4;
    }
  }

  // ==================== 音符合成工具 ====================

  private playNote(
    startTime: number,
    freq: number,
    duration: number,
    waveType: OscillatorType,
    volume: number,
    attack: number
  ): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, startTime);

    // ADSR 包络
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + attack);
    gain.gain.setValueAtTime(volume, startTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  // ── Kick drum: 低频正弦波快速下滑 ──
  private playKick(time: number): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.12);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  // ── Snare: 噪声 + 三角波 ──
  private playSnare(time: number): void {
    if (!this.ctx || !this.masterGain) return;

    // 噪声部分
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    // 高通滤波让噪声更尖锐
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.15);

    // 三角波体
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.05);

    oscGain.gain.setValueAtTime(0.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  // ── Hi-hat: 高频噪声 ──
  private playHiHat(time: number): void {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.06);
  }
}
