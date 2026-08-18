// Speech Synthesis & Interactive Web Audio Service for AI Voice Calls

export interface VoiceProfile {
  id: string;
  name: string;
  toneDescription: string;
  rate: number;
  pitch: number;
  lang?: string;
}

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'astra_telugu',
    name: 'ఆస్ట్రా - తెలుగు AI (Astra Telugu Voice)',
    toneDescription: 'గౌరవప్రదమైన, స్పష్టమైన మరియు దయతో కూడిన తెలుగు సంభాషణ (Respectful & Clear Telugu)',
    rate: 0.92,
    pitch: 1.05,
    lang: 'te-IN',
  },
  {
    id: 'officer_telugu',
    name: 'అధికారి శర్మ - తెలుగు (Officer Sharma Telugu)',
    toneDescription: 'అధికారిక, స్పష్టమైన మరియు నేరుగా మాట్లాడే తెలుగు (Official & Direct Telugu)',
    rate: 0.95,
    pitch: 0.98,
    lang: 'te-IN',
  },
  {
    id: 'warm_empathetic',
    name: 'Astra (Warm & Empathetic - English)',
    toneDescription: 'Attentive, conversational, comforting human cadence',
    rate: 0.94,
    pitch: 1.05,
    lang: 'en-IN',
  },
  {
    id: 'professional_officer',
    name: 'Officer Davis (Executive Resolution - English)',
    toneDescription: 'Crisp, official, direct & courteous',
    rate: 0.98,
    pitch: 0.98,
    lang: 'en-US',
  },
];

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  // Pre-process text to make it sound conversational and natural when spoken aloud
  public formatTextForHumanSpeech(text: string): string {
    let clean = text;
    const isTelugu = /[\u0C00-\u0C7F]/.test(clean);

    if (isTelugu) {
      // Clean up punctuation and formats for smooth Telugu speech
      clean = clean.replace(/₹\s?(\d+([,.]\d+)?)/g, '$1 రూపాయలు');
      clean = clean.replace(/Rs\.?\s?(\d+([,.]\d+)?)/gi, '$1 రూపాయలు');
      clean = clean.replace(/#/g, 'నంబర్ ');
      clean = clean.replace(/EB-(\d+)/gi, 'ఈ బీ $1');
      clean = clean.replace(/MTR-(\d+)/gi, 'మీటర్ $1');
      clean = clean.replace(/(\d+)d\b/g, '$1 రోజులు');
    } else {
      // Replace currencies for English
      clean = clean.replace(/₹\s?(\d+([,.]\d+)?)/g, '$1 rupees');
      clean = clean.replace(/\$\s?(\d+([,.]\d+)?)/g, '$1 dollars');
      clean = clean.replace(/Rs\.?\s?(\d+([,.]\d+)?)/gi, '$1 rupees');
      
      // Spell out account numbers like EB-102 -> E B 1 0 2
      clean = clean.replace(/\b(EB|MTR|CA)-(\d+)\b/gi, (_, prefix, digits) => {
        const spelledPrefix = prefix.split('').join(' ');
        const spelledDigits = digits.split('').join(' ');
        return `${spelledPrefix} ${spelledDigits}`;
      });

      // Replace abbreviations
      clean = clean.replace(/\b(\d+)d\b/g, '$1 days');
      clean = clean.replace(/\bapprox\b/gi, 'approximately');
      clean = clean.replace(/\bmin\b/gi, 'minute');
      clean = clean.replace(/\bsec\b/gi, 'second');
    }

    return clean;
  }

  public speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      volume?: number;
      voiceName?: string;
      profileId?: string;
      lang?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (e: any) => void;
    } = {}
  ): SpeechSynthesisUtterance | null {
    if (!this.synth) {
      if (options.onEnd) options.onEnd();
      return null;
    }

    this.stop();

    const spokenText = this.formatTextForHumanSpeech(text);
    const utterance = new SpeechSynthesisUtterance(spokenText);
    const hasTeluguCharacters = /[\u0C00-\u0C7F]/.test(text);

    // Profile lookup
    const profile = VOICE_PROFILES.find((p) => p.id === options.profileId);
    utterance.rate = options.rate ?? profile?.rate ?? (hasTeluguCharacters ? 0.92 : 0.94);
    utterance.pitch = options.pitch ?? profile?.pitch ?? 1.05;
    utterance.volume = options.volume ?? 1.0;

    // Set language tag
    if (hasTeluguCharacters || options.lang === 'te-IN' || profile?.lang === 'te-IN') {
      utterance.lang = 'te-IN';
    } else if (options.lang) {
      utterance.lang = options.lang;
    } else if (profile?.lang) {
      utterance.lang = profile.lang;
    }

    const voices = this.getVoices();
    if (voices.length > 0) {
      let selectedVoice: SpeechSynthesisVoice | undefined;

      // If Telugu text or profile, search for Telugu voices first
      if (hasTeluguCharacters || utterance.lang.startsWith('te')) {
        selectedVoice = voices.find(
          (v) =>
            v.lang.startsWith('te') ||
            v.name.toLowerCase().includes('telugu') ||
            v.name.toLowerCase().includes('mohan') ||
            v.name.toLowerCase().includes('heera') ||
            v.name.toLowerCase().includes('kavya')
        );
        // Secondary fallback to Indian accented voices for clear phonetics
        if (!selectedVoice) {
          selectedVoice = voices.find(
            (v) =>
              v.lang === 'en-IN' ||
              v.lang === 'hi-IN' ||
              v.name.includes('India') ||
              v.name.includes('Ravi') ||
              v.name.includes('Veena') ||
              v.name.includes('Swara')
          );
        }
      }

      if (!selectedVoice && options.voiceName) {
        selectedVoice = voices.find((v) => v.name === options.voiceName);
      }
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (v) =>
            v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Karen') ||
            v.name.includes('Zira') ||
            v.name.includes('Ravi') ||
            v.name.includes('Microsoft')
        );
      }
      if (!selectedVoice) selectedVoice = voices[0];
      utterance.voice = selectedVoice;
    }

    if (options.onStart) utterance.onstart = () => options.onStart!();
    if (options.onEnd) utterance.onend = () => options.onEnd!();
    if (options.onError) utterance.onerror = (e) => options.onError!(e);

    this.synth.speak(utterance);
    return utterance;
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Realistic phone ringer audio using Web Audio API synthesis
  public playRingtone(): () => void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return () => {};

      const ctx = new AudioContextClass();
      this.audioCtx = ctx;

      let isPlaying = true;

      const playTonePair = () => {
        if (!isPlaying || ctx.state === 'closed') return;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // Standard US/UK ring frequency (440Hz + 480Hz)
        osc1.frequency.value = 440;
        osc2.frequency.value = 480;

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + 1.8);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 2.0);
        osc2.stop(ctx.currentTime + 2.0);

        if (isPlaying) {
          setTimeout(playTonePair, 4000);
        }
      };

      playTonePair();

      return () => {
        isPlaying = false;
        try {
          ctx.close();
        } catch (_) {}
      };
    } catch {
      return () => {};
    }
  }

  // Call connected chime
  public playConnectChime() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}
  }

  // Keypad DTMF beep sound
  public playKeypadBeep(freq: number = 800) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (_) {}
  }
}

export const speechService = new SpeechService();
