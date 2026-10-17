// Web Audio API dispatcher sound utility for urgent notifications and callouts
class DispatchAudioManager {
  private audioCtx: AudioContext | null = null;
  private intervalId: any = null;
  private isAlerting = false;
  private muted = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!this.audioCtx) {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Play a single crisp double-tone dispatch alert
  public playTone(freq1 = 784, freq2 = 1046.5, duration = 0.18): void {
    if (this.muted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq1, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + duration);

      // Tone 2 (higher harmony)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq2, now + duration * 0.7);
      gain2.gain.setValueAtTime(0.4, now + duration * 0.7);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 1.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + duration * 0.7);
      osc2.stop(now + duration * 1.8);

      // Second pulse 300ms later for urgent attention
      const t3 = now + 0.32;
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq2, t3);
      gain3.gain.setValueAtTime(0.4, t3);
      gain3.gain.exponentialRampToValueAtTime(0.001, t3 + duration * 1.5);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(t3);
      osc3.stop(t3 + duration * 1.5);
    } catch (e) {
      console.warn('Dispatch audio error:', e);
    }
  }

  // Start continuous repeating dispatch alarm until acknowledged
  public startAlert(): void {
    if (this.isAlerting) return;
    this.isAlerting = true;

    // Play immediately
    this.playTone(880, 1318.51);

    // Repeat every 2.8 seconds
    this.intervalId = setInterval(() => {
      if (!this.isAlerting) {
        clearInterval(this.intervalId);
        return;
      }
      this.playTone(880, 1318.51);
    }, 2800);
  }

  // Stop the alarm
  public stopAlert(): void {
    this.isAlerting = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public isActive(): boolean {
    return this.isAlerting;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }
}

export const dispatchAudio = new DispatchAudioManager();
