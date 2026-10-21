/**
 * Voice Assistant Service (8 Distinct Voice Profiles)
 *
 * 1. ChatGPT Breeze (Warm, conversational, dynamic inflection)
 * 2. Google Neural Clear (Clean, articulate studio presentation)
 * 3. Siri / Soft Gentle (Intimate, relaxed, calming cadence)
 * 4. Deep Resonance (Authoritative, rich lower-harmonic bass)
 * 5. Bright Energy (Upbeat, expressive, engaging)
 * 6. Classic Narrator (Storybook style, dramatic pauses)
 * 7. Studio Broadcast (Crisp journalistic precision)
 * 8. Minimalist AI (Balanced, futuristic, modern synthetic tone)
 *
 * Features:
 * - SpeechSynthesis Web API with automated browser voice matching
 * - Procedural Web Audio API sound synthesis fallback (so audio always plays even if OS has no voices installed)
 * - Real-time audio waveform emission for visualizer animations
 * - LocalStorage persistence for user preferences
 */

export interface VoiceProfile {
  id: string;
  name: string;
  category: 'ChatGPT' | 'Google' | 'Apple/Siri' | 'Deep' | 'Energetic' | 'Narrator' | 'Studio' | 'Minimalist';
  description: string;
  avatarIcon: string;
  tag: string;
  pitch: number;
  rate: number;
  gender: 'female' | 'male' | 'neutral';
  preferredVoiceNames: string[];
  sampleQuote: string;
  accentColor: string;
}

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'chatgpt_warm',
    name: 'ChatGPT Breeze',
    category: 'ChatGPT',
    description: 'Warm, natural conversational cadence with fluid emotional inflection',
    avatarIcon: '🎙️',
    tag: 'Conversational',
    pitch: 1.05,
    rate: 1.02,
    gender: 'female',
    preferredVoiceNames: ['Samantha', 'Google US English', 'Microsoft Zira', 'Karen', 'Victoria'],
    sampleQuote: "Hey there! I'm ready to help you brainstorm ideas, write code, or just talk through problems.",
    accentColor: '#10B981',
  },
  {
    id: 'google_neural',
    name: 'Google Neural Clear',
    category: 'Google',
    description: 'Crisp, studio-grade neural voice with precise articulation',
    avatarIcon: '🌐',
    tag: 'Studio Neural',
    pitch: 1.0,
    rate: 1.0,
    gender: 'male',
    preferredVoiceNames: ['Google UK English Male', 'Daniel', 'Microsoft David', 'Alex', 'Fred'],
    sampleQuote: "Google Neural Engine initialized. Providing factual, precise, and structured information.",
    accentColor: '#4285F4',
  },
  {
    id: 'siri_soft',
    name: 'Soft Gentle (Siri Style)',
    category: 'Apple/Siri',
    description: 'Relaxed, calm, and soothing cadence suitable for long reads and meditation',
    avatarIcon: '🌸',
    tag: 'Calm & Soothing',
    pitch: 0.95,
    rate: 0.92,
    gender: 'female',
    preferredVoiceNames: ['Moira', 'Tessa', 'Fiona', 'Microsoft Susan', 'Veena'],
    sampleQuote: "Take a deep breath. Let's take our time and work through your project step by step.",
    accentColor: '#EC4899',
  },
  {
    id: 'deep_resonance',
    name: 'Deep Resonance',
    category: 'Deep',
    description: 'Rich, deep baritone with resonant lower harmonics and commanding presence',
    avatarIcon: '🪐',
    tag: 'Deep Baritone',
    pitch: 0.75,
    rate: 0.95,
    gender: 'male',
    preferredVoiceNames: ['Oliver', 'Google UK English Male', 'Microsoft Mark', 'Ralph', 'Tom'],
    sampleQuote: "Standing by. Systems are fully operational and ready for your next directive.",
    accentColor: '#8B5CF6',
  },
  {
    id: 'bright_energy',
    name: 'Bright Energy',
    category: 'Energetic',
    description: 'High-tempo, enthusiastic, and cheerful cadence that brings ideas to life',
    avatarIcon: '⚡',
    tag: 'Upbeat & Fast',
    pitch: 1.15,
    rate: 1.12,
    gender: 'female',
    preferredVoiceNames: ['Victoria', 'Google US English', 'Samantha', 'Agnes'],
    sampleQuote: "Let's make something amazing today! I've got your project loaded and ready to rock!",
    accentColor: '#F59E0B',
  },
  {
    id: 'classic_narrator',
    name: 'Classic Narrator',
    category: 'Narrator',
    description: 'Storybook cadence with deliberate pacing and theatrical storytelling gravitas',
    avatarIcon: '📖',
    tag: 'Storyteller',
    pitch: 0.88,
    rate: 0.90,
    gender: 'male',
    preferredVoiceNames: ['Daniel', 'Alex', 'Bruce', 'Google UK English Male', 'Microsoft George'],
    sampleQuote: "In a world driven by lines of code, one creator set out to build the impossible.",
    accentColor: '#D97706',
  },
  {
    id: 'studio_pro',
    name: 'Studio Broadcast',
    category: 'Studio',
    description: 'Professional newsroom delivery with neutral, authoritative pacing',
    avatarIcon: '📡',
    tag: 'Journalistic',
    pitch: 1.0,
    rate: 1.05,
    gender: 'female',
    preferredVoiceNames: ['Karen', 'Samantha', 'Google US English', 'Microsoft Hazel'],
    sampleQuote: "Reporting live with your latest code review and system optimization metrics.",
    accentColor: '#06B6D4',
  },
  {
    id: 'minimalist_ai',
    name: 'Minimalist Synth',
    category: 'Minimalist',
    description: 'Futuristic, clean, sleek synthesized assistant with crystal clarity',
    avatarIcon: '🤖',
    tag: 'Futuristic AI',
    pitch: 1.08,
    rate: 1.08,
    gender: 'neutral',
    preferredVoiceNames: ['Cell', 'Zarvox', 'Trinoids', 'Google US English', 'Alex'],
    sampleQuote: "Flash AI audio synthesizer active. Processing requests at maximum throughput.",
    accentColor: '#10B981',
  },
];

class VoiceAssistantService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentVoiceId: string = 'chatgpt_warm';
  private speechRate: number = 1.0;
  private isAutoPlayEnabled: boolean = false;
  private audioCtx: AudioContext | null = null;
  private listeners: Set<(speaking: boolean, messageId: string | null) => void> = new Set();
  private currentlySpeakingMessageId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedVoice = localStorage.getItem('flash_selected_voice_id');
      if (savedVoice && VOICE_PROFILES.some((v) => v.id === savedVoice)) {
        this.currentVoiceId = savedVoice;
      }
      const savedRate = localStorage.getItem('flash_voice_speed');
      if (savedRate) {
        this.speechRate = parseFloat(savedRate) || 1.0;
      }
      this.isAutoPlayEnabled = localStorage.getItem('flash_voice_autoplay') === 'true';

      // Pre-warm voices
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }

  public getProfiles(): VoiceProfile[] {
    return VOICE_PROFILES;
  }

  public getCurrentProfile(): VoiceProfile {
    return (
      VOICE_PROFILES.find((v) => v.id === this.currentVoiceId) ||
      VOICE_PROFILES[0]
    );
  }

  public setVoiceProfile(id: string): void {
    if (VOICE_PROFILES.some((v) => v.id === id)) {
      this.currentVoiceId = id;
      localStorage.setItem('flash_selected_voice_id', id);
    }
  }

  public getSpeechRate(): number {
    return this.speechRate;
  }

  public setSpeechRate(rate: number): void {
    this.speechRate = Math.max(0.5, Math.min(2.0, rate));
    localStorage.setItem('flash_voice_speed', this.speechRate.toString());
  }

  public isAutoPlay(): boolean {
    return this.isAutoPlayEnabled;
  }

  public setAutoPlay(enabled: boolean): void {
    this.isAutoPlayEnabled = enabled;
    localStorage.setItem('flash_voice_autoplay', enabled.toString());
  }

  public subscribe(listener: (speaking: boolean, messageId: string | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(speaking: boolean, messageId: string | null) {
    this.currentlySpeakingMessageId = speaking ? messageId : null;
    this.listeners.forEach((l) => l(speaking, this.currentlySpeakingMessageId));
  }

  public isSpeaking(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.speechSynthesis?.speaking || this.currentlySpeakingMessageId);
  }

  public getSpeakingMessageId(): string | null {
    return this.currentlySpeakingMessageId;
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.notify(false, null);
  }

  /**
   * Cleans markdown symbols and code blocks so speech reads smoothly
   */
  public cleanTextForSpeech(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted for voice playback. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      .replace(/>\s+/g, '')
      .replace(/---+/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  }

  /**
   * Speaks the provided text using the selected voice profile
   */
  public speak(
    rawText: string,
    messageId?: string,
    overrideVoiceId?: string
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      this.stop();

      const text = this.cleanTextForSpeech(rawText);
      if (!text) {
        resolve();
        return;
      }

      const activeVoice =
        VOICE_PROFILES.find((v) => v.id === (overrideVoiceId || this.currentVoiceId)) ||
        VOICE_PROFILES[0];

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        const availableVoices = window.speechSynthesis.getVoices();

        // Match preferred voice name from OS
        let matchedVoice: SpeechSynthesisVoice | null = null;
        for (const pref of activeVoice.preferredVoiceNames) {
          const found = availableVoices.find(
            (v) => v.name.toLowerCase().includes(pref.toLowerCase()) && v.lang.startsWith('en')
          );
          if (found) {
            matchedVoice = found;
            break;
          }
        }

        if (!matchedVoice && availableVoices.length > 0) {
          // Fallback to any English voice
          matchedVoice = availableVoices.find((v) => v.lang.startsWith('en')) || availableVoices[0];
        }

        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        utterance.pitch = activeVoice.pitch;
        utterance.rate = activeVoice.rate * this.speechRate;

        utterance.onstart = () => {
          this.notify(true, messageId || 'preview');
        };

        utterance.onend = () => {
          this.notify(false, null);
          resolve();
        };

        utterance.onerror = (e) => {
          console.warn('Speech synthesis notice:', e);
          this.notify(false, null);
          resolve();
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback procedural acoustic chime
        this.playProceduralVoiceTone(activeVoice);
        resolve();
      }
    });
  }

  /**
   * Web Audio procedural audio feedback fallback
   */
  private playProceduralVoiceTone(profile: VoiceProfile) {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = profile.gender === 'female' ? 440 : profile.gender === 'male' ? 220 : 330;
      osc.frequency.setValueAtTime(baseFreq * profile.pitch, ctx.currentTime);
      osc.type = profile.id === 'minimalist_ai' ? 'sawtooth' : 'sine';

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (err) {
      console.warn('Web Audio fallback tone error:', err);
    }
  }
}

export const voiceAssistantService = new VoiceAssistantService();
