import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useGame } from '../state/GameContext';

type UiSound = 'open' | 'success' | 'finale';

interface AmbienceContextValue {
  isActive: boolean;
  activate: () => Promise<void>;
  disable: () => void;
  playUiSound: (sound: UiSound) => void;
}

class AmbienceEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambienceBus: GainNode | null = null;
  private uiBus: GainNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private toneTimer: number | null = null;
  private suspendTimer: number | null = null;

  async start(volume: number): Promise<void> {
    if (!this.context) this.createSoundscape();
    const context = this.context;
    if (!context) return;

    if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
    this.suspendTimer = null;
    await context.resume();
    this.setVolume(volume);
    this.scheduleNightTone();
  }

  setVolume(volume: number): void {
    if (!this.context || !this.master) return;
    const next = Math.min(1, Math.max(0, volume));
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(next, now + 0.35);
  }

  suspend(): void {
    if (!this.context || !this.master) return;
    const context = this.context;
    const now = context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.3);
    if (this.toneTimer !== null) window.clearTimeout(this.toneTimer);
    if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
    this.toneTimer = null;
    this.suspendTimer = window.setTimeout(() => {
      if (context.state === 'running') void context.suspend();
      this.suspendTimer = null;
    }, 380);
  }

  play(sound: UiSound): void {
    if (!this.context || !this.uiBus || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const frequency = sound === 'open' ? 190 : sound === 'success' ? 392 : 98;

    oscillator.type = sound === 'finale' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      sound === 'open' ? frequency * 0.92 : frequency * 1.32,
      now + 0.24,
    );
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.075, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    oscillator.connect(gain).connect(this.uiBus);
    oscillator.start(now);
    oscillator.stop(now + 0.36);
  }

  async destroy(): Promise<void> {
    if (this.toneTimer !== null) window.clearTimeout(this.toneTimer);
    if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
    this.toneTimer = null;
    this.suspendTimer = null;
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        // Источник уже мог закончить работу сам.
      }
      source.disconnect();
    }
    this.sources = [];
    const context = this.context;
    this.context = null;
    this.master = null;
    this.ambienceBus = null;
    this.uiBus = null;
    if (context && context.state !== 'closed') await context.close();
  }

  private createSoundscape(): void {
    const context = new AudioContext();
    const master = context.createGain();
    const ambienceBus = context.createGain();
    const uiBus = context.createGain();
    master.gain.value = 0;
    ambienceBus.gain.value = 0.72;
    uiBus.gain.value = 0.82;
    ambienceBus.connect(master);
    uiBus.connect(master);
    master.connect(context.destination);

    this.context = context;
    this.master = master;
    this.ambienceBus = ambienceBus;
    this.uiBus = uiBus;

    this.createRain(context, ambienceBus);
    this.createLowPad(context, ambienceBus);
  }

  private createRain(context: AudioContext, destination: AudioNode): void {
    const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const channel = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < channel.length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.92 + white * 0.08;
      channel[index] = previous;
    }

    const rain = context.createBufferSource();
    const highpass = context.createBiquadFilter();
    const lowpass = context.createBiquadFilter();
    const gain = context.createGain();
    rain.buffer = buffer;
    rain.loop = true;
    highpass.type = 'highpass';
    highpass.frequency.value = 170;
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1550;
    gain.gain.value = 0.14;
    rain.connect(highpass).connect(lowpass).connect(gain).connect(destination);
    rain.start();
    this.sources.push(rain);
  }

  private createLowPad(context: AudioContext, destination: AudioNode): void {
    const pad = context.createGain();
    const filter = context.createBiquadFilter();
    pad.gain.value = 0.055;
    filter.type = 'lowpass';
    filter.frequency.value = 430;
    filter.Q.value = 0.7;
    pad.connect(filter).connect(destination);

    const notes = [55, 82.41, 110];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 1 ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index === 0 ? -5 : index === 2 ? 4 : 0;
      gain.gain.value = index === 1 ? 0.56 : 0.38;
      oscillator.connect(gain).connect(pad);
      oscillator.start();
      this.sources.push(oscillator);
    });

    const pulse = context.createOscillator();
    const pulseDepth = context.createGain();
    pulse.type = 'sine';
    pulse.frequency.value = 0.055;
    pulseDepth.gain.value = 0.012;
    pulse.connect(pulseDepth).connect(pad.gain);
    pulse.start();
    this.sources.push(pulse);

    const rumble = context.createOscillator();
    const rumbleGain = context.createGain();
    rumble.type = 'sine';
    rumble.frequency.value = 38;
    rumbleGain.gain.value = 0.018;
    rumble.connect(rumbleGain).connect(destination);
    rumble.start();
    this.sources.push(rumble);
  }

  private playNightTone(): void {
    if (!this.context || !this.ambienceBus || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    const notes = [146.83, 174.61, 196, 220];
    const frequency = notes[Math.floor(Math.random() * notes.length)] ?? 174.61;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.linearRampToValueAtTime(frequency * 0.995, now + 5.4);
    filter.type = 'lowpass';
    filter.frequency.value = 720;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.028, now + 1.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.4);
    oscillator.connect(filter).connect(gain).connect(this.ambienceBus);
    oscillator.start(now);
    oscillator.stop(now + 5.5);
  }

  private scheduleNightTone(): void {
    if (this.toneTimer !== null) window.clearTimeout(this.toneTimer);
    this.toneTimer = window.setTimeout(() => {
      this.playNightTone();
      this.scheduleNightTone();
    }, 7_000 + Math.random() * 9_000);
  }
}

const AmbienceContext = createContext<AmbienceContextValue | null>(null);

export const AmbienceProvider = ({ children }: PropsWithChildren) => {
  const { state, dispatch } = useGame();
  const engineRef = useRef<AmbienceEngine | null>(null);
  const [isActive, setIsActive] = useState(false);

  if (!engineRef.current) engineRef.current = new AmbienceEngine();

  const activate = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    try {
      await engine.start(state.settings.audio.volume);
      setIsActive(true);
      if (!state.settings.audio.enabled) {
        dispatch({
          type: 'SET_SETTINGS',
          settings: {
            ...state.settings,
            audio: { ...state.settings.audio, enabled: true },
          },
        });
      }
    } catch {
      await engine.destroy();
      setIsActive(false);
      dispatch({
        type: 'SET_SETTINGS',
        settings: {
          ...state.settings,
          audio: { ...state.settings.audio, enabled: false },
        },
      });
    }
  }, [dispatch, state.settings]);

  const disable = useCallback(() => {
    engineRef.current?.suspend();
    setIsActive(false);
    dispatch({
      type: 'SET_SETTINGS',
      settings: {
        ...state.settings,
        audio: { ...state.settings.audio, enabled: false },
      },
    });
  }, [dispatch, state.settings]);

  useEffect(() => {
    if (!state.settings.audio.enabled) {
      engineRef.current?.suspend();
      setIsActive(false);
    } else if (isActive) {
      engineRef.current?.setVolume(state.settings.audio.volume);
    }
  }, [isActive, state.settings.audio.enabled, state.settings.audio.volume]);

  useEffect(
    () => () => {
      const engine = engineRef.current;
      if (engine) void engine.destroy();
    },
    [],
  );

  const playUiSound = useCallback((sound: UiSound) => engineRef.current?.play(sound), []);
  const value = useMemo(
    () => ({ isActive, activate, disable, playUiSound }),
    [activate, disable, isActive, playUiSound],
  );

  return <AmbienceContext.Provider value={value}>{children}</AmbienceContext.Provider>;
};

export const useAmbience = (): AmbienceContextValue => {
  const value = useContext(AmbienceContext);
  if (!value) throw new Error('useAmbience должен вызываться внутри AmbienceProvider.');
  return value;
};
