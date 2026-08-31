import { SaveManager } from './SaveManager';

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private activeVoices = 0;
  private maxVoices = 10;

  private sfxGainNode: GainNode | null = null;
  private musicGainNode: GainNode | null = null;

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.sfxGainNode = this.ctx.createGain();
        this.sfxGainNode.connect(this.ctx.destination);
        this.musicGainNode = this.ctx.createGain();
        this.musicGainNode.connect(this.ctx.destination);
        this.updateVolumes();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.updateVolumes();
    return this.ctx;
  }

  public updateVolumes(): void {
    if (!this.ctx || !this.sfxGainNode || !this.musicGainNode) return;
    const settings = SaveManager.getInstance().getData().settings;
    const sfxVol = settings.sfxEnabled ? (settings.sfxVolume ?? 1.0) : 0;
    const musicVol = settings.musicEnabled ? (settings.musicVolume ?? 0.8) : 0;
    this.sfxGainNode.gain.setValueAtTime(sfxVol, this.ctx.currentTime);
    this.musicGainNode.gain.setValueAtTime(musicVol, this.ctx.currentTime);
  }

  public getSfxDestination(): AudioNode {
    if (!this.sfxGainNode && this.ctx) {
      this.sfxGainNode = this.ctx.createGain();
      this.sfxGainNode.connect(this.ctx.destination);
      this.updateVolumes();
    }
    return this.sfxGainNode || this.ctx!.destination;
  }

  private isSfxEnabled(): boolean {
    const s = SaveManager.getInstance().getData().settings;
    return s.sfxEnabled && (s.sfxVolume ?? 1.0) > 0;
  }

  // ==========================================
  // CLIQUE EM PERGAMINHO / BOTÃO REAL
  // ==========================================
  public playClick(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  // ==========================================
  // DISPARO DE ARCO / GATLING (BOW TWANG)
  // ==========================================
  public playGatling(): void {
    if (!this.isSfxEnabled() || this.activeVoices >= this.maxVoices) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    this.activeVoices++;
    const t = ctx.currentTime;

    // 1. Estalo da Corda de Arco (Bow Twang)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(820, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.05);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.07);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());

    // 2. Assobio da Flecha / Projétil
    const whoosh = ctx.createOscillator();
    const whooshGain = ctx.createGain();
    whoosh.type = 'sine';
    whoosh.frequency.setValueAtTime(1400, t + 0.02);
    whoosh.frequency.exponentialRampToValueAtTime(600, t + 0.08);

    whooshGain.gain.setValueAtTime(0.08, t + 0.02);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    whoosh.connect(whooshGain);
    whooshGain.connect(this.getSfxDestination());

    osc.start(t);
    osc.stop(t + 0.07);
    whoosh.start(t + 0.02);
    whoosh.stop(t + 0.08);

    osc.onended = () => { this.activeVoices--; };
  }

  // ==========================================
  // CATAPULTA DE CERCO / CANHÃO (FIERY CATAPULT BLAST)
  // ==========================================
  public playCannon(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Sub-grave retumbante da catapulta / impacto
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, t);
    subOsc.frequency.exponentialRampToValueAtTime(28, t + 0.45);

    subGain.gain.setValueAtTime(0.48, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    subOsc.connect(subGain);
    subGain.connect(this.getSfxDestination());

    // 2. Estrondo de madeira de cerco e chama ardente
    const blastOsc = ctx.createOscillator();
    const blastGain = ctx.createGain();
    blastOsc.type = 'triangle';
    blastOsc.frequency.setValueAtTime(280, t);
    blastOsc.frequency.exponentialRampToValueAtTime(45, t + 0.32);

    blastGain.gain.setValueAtTime(0.35, t);
    blastGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    blastOsc.connect(blastGain);
    blastGain.connect(this.getSfxDestination());

    subOsc.start(t);
    subOsc.stop(t + 0.45);
    blastOsc.start(t);
    blastOsc.stop(t + 0.32);
  }

  // ==========================================
  // FEIXE ARCANO / LASER (ARCANE MANA HUM)
  // ==========================================
  public playLaser(): void {
    if (!this.isSfxEnabled() || this.activeVoices >= this.maxVoices) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    this.activeVoices++;
    const t = ctx.currentTime;

    // Oscilador com Zumbido Místico e Modulação Harmônica
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(920, t);
    osc1.frequency.linearRampToValueAtTime(740, t + 0.14);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(460, t);
    osc2.frequency.linearRampToValueAtTime(370, t + 0.14);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.14);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.getSfxDestination());

    osc1.start(t);
    osc1.stop(t + 0.14);
    osc2.start(t);
    osc2.stop(t + 0.14);

    osc1.onended = () => { this.activeVoices--; };
  }

  // ==========================================
  // GELO CRISTALINO / MAGIA GLACIAL
  // ==========================================
  public playFreeze(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.linearRampToValueAtTime(1800, t + 0.22);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.22);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // ==========================================
  // RELÂMPAGO & ARCO ELÉTRICO TESLA
  // ==========================================
  public playTesla(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(680, t);
    osc.frequency.setValueAtTime(950, t + 0.03);
    osc.frequency.setValueAtTime(380, t + 0.07);
    osc.frequency.setValueAtTime(820, t + 0.11);

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.16);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // ==========================================
  // TILINTAR DE BOLSA DE MOEDAS (GOLD POUCH JINGLE)
  // ==========================================
  public playCoin(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    // Múltiplos tinidos metálicos de moedas de ouro colidindo
    const freqs = [1480, 2093, 2793, 3520];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.035);

      gain.gain.setValueAtTime(0.18, t + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.035 + 0.18);

      osc.connect(gain);
      gain.connect(this.getSfxDestination());

      osc.start(t + idx * 0.035);
      osc.stop(t + idx * 0.035 + 0.18);
    });
  }

  // ==========================================
  // CONSTRUÇÃO REAL / ALVENARIA
  // ==========================================
  public playBuild(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.setValueAtTime(440, t + 0.06);
    osc.frequency.setValueAtTime(660, t + 0.12);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.2);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // ==========================================
  // APRIMORAMENTO / ENCANTAMENTO RÚNICO
  // ==========================================
  public playUpgrade(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Arpeggio mágico ascendente
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5 E5 G5 C6 E6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);

      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.14);

      osc.connect(gain);
      gain.connect(this.getSfxDestination());

      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.14);
    });
  }

  // ==========================================
  // FANFARRA REAL DE VITÓRIA (ROYAL FANFARE JINGLE)
  // ==========================================
  public playVictory(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Fanfarra triunfal com trompetes imperiais em C maior
    const fanfareMelody = [
      { f: 523.25, d: 0.14 }, // C5
      { f: 523.25, d: 0.10 }, // C5
      { f: 523.25, d: 0.10 }, // C5
      { f: 659.25, d: 0.22 }, // E5
      { f: 783.99, d: 0.18 }, // G5
      { f: 1046.5, d: 0.55 }  // C6 (Trompete Real)
    ];

    let t = ctx.currentTime;
    fanfareMelody.forEach((note, idx) => {
      // 1. Tom fundamental de bronze
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(note.f, t);

      gain1.gain.setValueAtTime(0.28, t);
      gain1.gain.exponentialRampToValueAtTime(0.005, t + note.d);

      osc1.connect(gain1);
      gain1.connect(this.getSfxDestination());

      // 2. Harmônico suave de trompete
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(note.f * 1.5, t);

      gain2.gain.setValueAtTime(0.15, t);
      gain2.gain.exponentialRampToValueAtTime(0.005, t + note.d);

      osc2.connect(gain2);
      gain2.connect(this.getSfxDestination());

      osc1.start(t);
      osc1.stop(t + note.d);
      osc2.start(t);
      osc2.stop(t + note.d);

      t += note.d * 0.92;
    });
  }

  // ==========================================
  // SINO SOLENE DE CATEDRAL NA DERROTA (SOLEMN CATHEDRAL BELL)
  // ==========================================
  public playDefeat(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Badalada Solene de Sino de Catedral (Harmônicos Inarmônicos e Decaimento Lento de 2.2s)
    const bellPartials = [
      { f: 110.0, gain: 0.40, decay: 2.2 }, // Hum tone (Lá grave)
      { f: 220.0, gain: 0.35, decay: 1.8 }, // Prime (Lá)
      { f: 261.63, gain: 0.30, decay: 1.5 }, // Tierce Menor (Dó - Tristeza Eclesiástica)
      { f: 329.63, gain: 0.25, decay: 1.4 }, // Quint (Mi)
      { f: 440.0, gain: 0.20, decay: 1.1 }, // Octave
      { f: 659.25, gain: 0.14, decay: 0.8 }  // Superquint
    ];

    bellPartials.forEach(partial => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(partial.f, t);

      gain.gain.setValueAtTime(partial.gain, t);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + partial.decay);

      osc.connect(gain);
      gain.connect(this.getSfxDestination());

      osc.start(t);
      osc.stop(t + partial.decay);
    });
  }

  public playHeroMove(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  public playHeroAttack(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  public playSniperShot(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  public playHeroSlam(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.45, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  public playHeroShield(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  public playHeroLevelUp(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Fanfarra heroica régia
    const chords = [
      { f: 523.25, d: 0.1 }, // C5
      { f: 659.25, d: 0.1 }, // E5
      { f: 783.99, d: 0.1 }, // G5
      { f: 1046.5, d: 0.25 } // C6
    ];

    let time = ctx.currentTime;
    chords.forEach(c => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(c.f, time);

      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + c.d);

      osc.connect(gain);
      gain.connect(this.getSfxDestination());

      osc.start(time);
      osc.stop(time + c.d);
      time += c.d * 0.9;
    });
  }

  public playHeroRespawn(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  // ==========================================
  // SANTUÁRIO DA PRESSA ARCANA (CHIME DE VELOCIDADE)
  // ==========================================
  public playShrineHaste(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const notes = [659.25, 880.0, 1174.66, 1760.0]; // E5, A5, D6, A6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + idx * 0.04 + 0.25);

      gain.gain.setValueAtTime(0.22, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.25);

      osc.connect(gain);
      gain.connect(this.getSfxDestination());

      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.25);
    });
  }

  // ==========================================
  // SANTUÁRIO DA ONDA DE CHOQUE (NOVA ARCANA)
  // ==========================================
  public playShrineShockwave(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Sub-impacto estrondoso
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(200, t);
    subOsc.frequency.exponentialRampToValueAtTime(32, t + 0.5);

    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    subOsc.connect(subGain);
    subGain.connect(this.getSfxDestination());

    // Shimmer de mana dourada
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sawtooth';
    shimmer.frequency.setValueAtTime(880, t);
    shimmer.frequency.exponentialRampToValueAtTime(220, t + 0.4);

    shimmerGain.gain.setValueAtTime(0.3, t);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.getSfxDestination());

    subOsc.start(t);
    subOsc.stop(t + 0.5);
    shimmer.start(t);
    shimmer.stop(t + 0.4);
  }

  // ==========================================
  // RUGIDO & ATAQUE AÉREO DO DRAGÃO ANCESTRAL
  // ==========================================
  public playDragonRoar(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Rugido visceral profundo com modulação
    const roarOsc = ctx.createOscillator();
    const roarGain = ctx.createGain();
    roarOsc.type = 'sawtooth';
    roarOsc.frequency.setValueAtTime(90, t);
    roarOsc.frequency.linearRampToValueAtTime(160, t + 0.25);
    roarOsc.frequency.exponentialRampToValueAtTime(45, t + 1.2);

    roarGain.gain.setValueAtTime(0.45, t);
    roarGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    roarOsc.connect(roarGain);
    roarGain.connect(this.getSfxDestination());

    // Rajada de chamas / Whoosh
    const whoosh = ctx.createOscillator();
    const whooshGain = ctx.createGain();
    whoosh.type = 'triangle';
    whoosh.frequency.setValueAtTime(240, t + 0.1);
    whoosh.frequency.exponentialRampToValueAtTime(60, t + 0.9);

    whooshGain.gain.setValueAtTime(0.35, t + 0.1);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    whoosh.connect(whooshGain);
    whooshGain.connect(this.getSfxDestination());

    roarOsc.start(t);
    roarOsc.stop(t + 1.2);
    whoosh.start(t + 0.1);
    whoosh.stop(t + 0.9);
  }

  // ==========================================
  // TROVÃO & RELÂMPAGO DO CLIMA DINÂMICO
  // ==========================================
  public playThunder(): void {
    if (!this.isSfxEnabled()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Estalo de relâmpago inicial agudo
    const snap = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snap.type = 'sawtooth';
    snap.frequency.setValueAtTime(1200, t);
    snap.frequency.exponentialRampToValueAtTime(80, t + 0.15);

    snapGain.gain.setValueAtTime(0.35, t);
    snapGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    snap.connect(snapGain);
    snapGain.connect(this.getSfxDestination());

    // Estrondo retumbante grave contínuo
    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(80, t + 0.05);
    rumble.frequency.linearRampToValueAtTime(40, t + 0.8);

    rumbleGain.gain.setValueAtTime(0.4, t + 0.05);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    rumble.connect(rumbleGain);
    rumbleGain.connect(this.getSfxDestination());

    snap.start(t);
    snap.stop(t + 0.15);
    rumble.start(t + 0.05);
    rumble.stop(t + 0.8);
  }
}
