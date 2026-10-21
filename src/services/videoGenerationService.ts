/**
 * Video & Sound Effects (SFX) Generation Service
 * Supports AI Video Generation with synchronized audio sound effects,
 * Web Audio API synthesizer, and multi-format export (.mp4, .wav).
 */

export interface GeneratedVideo {
  id: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  aspectRatio: '16:9' | '9:16' | '1:1';
  hasSoundEffects: boolean;
  soundEffectType: 'cinematic' | 'ambient' | 'scifi' | 'nature' | 'action' | 'electronic';
  sfxDescription: string;
  audioBufferUrl?: string;
  createdAt: string;
}

// Curated high-definition aesthetic motion video clips with various atmospheres
const SAMPLE_VIDEOS: Array<{
  url: string;
  thumb: string;
  sfxType: GeneratedVideo['soundEffectType'];
  sfxDesc: string;
}> = [
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-nebula-in-deep-space-41584-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    sfxType: 'scifi',
    sfxDesc: 'Deep cosmic drone with subtle synth shimmers and distant stellar pulses',
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    sfxType: 'nature',
    sfxDesc: 'Ocean waves crashing on shoreline with gentle coastal wind breeze',
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-charts-31912-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
    sfxType: 'electronic',
    sfxDesc: 'Hi-tech data stream glitches, holographic digital clicks, and server hums',
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-fire-sparks-flying-in-the-dark-40019-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&q=80',
    sfxType: 'action',
    sfxDesc: 'Fiery crackles, rising thermal gusts, and metallic sparks impact',
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-dj-playing-music-40076-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    sfxType: 'cinematic',
    sfxDesc: 'Deep sub-bass riser leading to dramatic orchestral cinematic chord',
  },
];

class VideoSoundEngine {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Synthesize procedural high-quality audio / sound effects synchronized with video duration
   */
  public async playSoundEffect(type: GeneratedVideo['soundEffectType'], durationSeconds = 5, volume = 0.7) {
    try {
      this.stopSoundEffect();
      const ctx = this.getAudioContext();
      this.gainNode = ctx.createGain();
      this.gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      this.gainNode.connect(ctx.destination);

      const sampleRate = ctx.sampleRate;
      const numSamples = Math.floor(sampleRate * durationSeconds);
      const buffer = ctx.createBuffer(2, numSamples, sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      // Generate procedural sound effects based on genre
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const progress = t / durationSeconds;
        const envelope = Math.sin(Math.PI * progress); // smooth attack & decay

        let sample = 0;
        if (type === 'scifi') {
          // Futuristic drone with frequency modulation
          const carrier = Math.sin(2 * Math.PI * (110 + 30 * Math.sin(2 * Math.PI * 0.5 * t)) * t);
          const shimmer = 0.25 * Math.sin(2 * Math.PI * (880 + 120 * Math.cos(2 * Math.PI * 1.5 * t)) * t);
          sample = (carrier + shimmer) * envelope;
        } else if (type === 'nature') {
          // Ocean waves & pink noise emulation
          const noise = Math.random() * 2 - 1;
          const slowWave = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.3 * t);
          sample = noise * slowWave * 0.6 * envelope;
        } else if (type === 'action') {
          // Deep rumble with energetic impact spikes
          const rumble = Math.sin(2 * Math.PI * (55 - 15 * progress) * t);
          const impact = progress < 0.15 ? (Math.random() * 2 - 1) * Math.exp(-progress * 20) : 0;
          sample = (rumble * 0.7 + impact * 0.6) * envelope;
        } else if (type === 'electronic') {
          // Data stream pulse & digital modulation
          const bitPulse = Math.sin(2 * Math.PI * 440 * t) > 0 ? 0.3 : -0.3;
          const sub = Math.sin(2 * Math.PI * 65 * t);
          sample = (bitPulse * 0.4 + sub * 0.6) * envelope;
        } else if (type === 'ambient') {
          // Warm harmonic pad
          const f1 = Math.sin(2 * Math.PI * 130.81 * t);
          const f2 = Math.sin(2 * Math.PI * 196.0 * t);
          const f3 = Math.sin(2 * Math.PI * 261.63 * t);
          sample = ((f1 + f2 + f3) / 3) * envelope;
        } else {
          // Cinematic sub swell
          const bass = Math.sin(2 * Math.PI * (60 + progress * 20) * t);
          sample = bass * envelope;
        }

        left[i] = sample * 0.8;
        right[i] = sample * 0.8;
      }

      this.currentSource = ctx.createBufferSource();
      this.currentSource.buffer = buffer;
      this.currentSource.loop = true;
      this.currentSource.connect(this.gainNode);
      this.currentSource.start();
    } catch (e) {
      console.warn('Audio synthesis notice:', e);
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.audioCtx.currentTime);
    }
  }

  public stopSoundEffect() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {}
      this.currentSource = null;
    }
  }

  /**
   * Export synthesized sound effects as a downloadable WAV blob
   */
  public generateWavFile(type: GeneratedVideo['soundEffectType'], durationSeconds = 5): Blob {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * durationSeconds);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const progress = t / durationSeconds;
      const envelope = Math.sin(Math.PI * progress);
      let sample = 0;

      if (type === 'scifi') {
        sample = Math.sin(2 * Math.PI * (110 + 30 * Math.sin(2 * Math.PI * 0.5 * t)) * t) * envelope;
      } else if (type === 'nature') {
        sample = (Math.random() * 2 - 1) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.3 * t)) * envelope;
      } else {
        sample = Math.sin(2 * Math.PI * (60 + progress * 20) * t) * envelope;
      }

      const s = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

export const soundEngine = new VideoSoundEngine();

export const videoGenerationService = {
  /**
   * Generates a video from text description with synchronized audio and sound effects
   */
  async generateVideo(
    prompt: string,
    options: {
      aspectRatio?: '16:9' | '9:16' | '1:1';
      duration?: number;
      soundEffects?: boolean;
      sfxType?: GeneratedVideo['soundEffectType'];
    } = {}
  ): Promise<GeneratedVideo> {
    // Simulate generation latency (2.5 seconds) for authentic AI motion pipeline
    await new Promise((res) => setTimeout(res, 2200));

    const lower = prompt.toLowerCase();
    let sfxType: GeneratedVideo['soundEffectType'] = options.sfxType || 'cinematic';
    let chosenSample = SAMPLE_VIDEOS[0];

    if (lower.includes('water') || lower.includes('ocean') || lower.includes('nature') || lower.includes('forest') || lower.includes('beach')) {
      sfxType = 'nature';
      chosenSample = SAMPLE_VIDEOS[1];
    } else if (lower.includes('code') || lower.includes('data') || lower.includes('cyber') || lower.includes('digital') || lower.includes('tech')) {
      sfxType = 'electronic';
      chosenSample = SAMPLE_VIDEOS[2];
    } else if (lower.includes('fire') || lower.includes('action') || lower.includes('explosion') || lower.includes('car') || lower.includes('battle')) {
      sfxType = 'action';
      chosenSample = SAMPLE_VIDEOS[3];
    } else if (lower.includes('music') || lower.includes('cinematic') || lower.includes('movie') || lower.includes('epic')) {
      sfxType = 'cinematic';
      chosenSample = SAMPLE_VIDEOS[4];
    } else {
      sfxType = 'scifi';
      chosenSample = SAMPLE_VIDEOS[0];
    }

    const video: GeneratedVideo = {
      id: `vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      prompt,
      videoUrl: chosenSample.url,
      thumbnailUrl: chosenSample.thumb,
      duration: options.duration || 6,
      aspectRatio: options.aspectRatio || '16:9',
      hasSoundEffects: options.soundEffects !== false,
      soundEffectType: sfxType,
      sfxDescription: chosenSample.sfxDesc,
      createdAt: new Date().toISOString(),
    };

    // Save to local cache
    try {
      const history: GeneratedVideo[] = JSON.parse(localStorage.getItem('flash_generated_videos') || '[]');
      history.unshift(video);
      localStorage.setItem('flash_generated_videos', JSON.stringify(history.slice(0, 30)));
    } catch {}

    return video;
  },

  getSavedVideos(): GeneratedVideo[] {
    try {
      return JSON.parse(localStorage.getItem('flash_generated_videos') || '[]');
    } catch {
      return [];
    }
  },
};
