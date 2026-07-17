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
  private uiBus: GainNode | null = null;
  private soundtrack: HTMLAudioElement | null = null;
  private soundtrackSource: MediaElementAudioSourceNode | null = null;
  private suspendTimer: number | null = null;

  async start(volume: number): Promise<void> {
    if (!this.context) this.createSoundscape();
    const context = this.context;
    if (!context) return;

    if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
    this.suspendTimer = null;
    await context.resume();
    this.setVolume(volume);
    await this.soundtrack?.play();
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
    if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
    this.suspendTimer = window.setTimeout(() => {
      this.soundtrack?.pause();
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
    if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
    this.suspendTimer = null;
    if (this.soundtrack) {
      this.soundtrack.pause();
      this.soundtrack.currentTime = 0;
    }
    this.soundtrackSource?.disconnect();
    const context = this.context;
    this.context = null;
    this.master = null;
    this.uiBus = null;
    this.soundtrack = null;
    this.soundtrackSource = null;
    if (context && context.state !== 'closed') await context.close();
  }

  private createSoundscape(): void {
    const context = new AudioContext();
    const master = context.createGain();
    const ambienceBus = context.createGain();
    const uiBus = context.createGain();
    const soundtrack = new Audio(`${import.meta.env.BASE_URL}assets/house-ambience.mp3`);
    const soundtrackSource = context.createMediaElementSource(soundtrack);
    master.gain.value = 0;
    ambienceBus.gain.value = 0.5;
    uiBus.gain.value = 0.82;
    soundtrack.loop = true;
    soundtrack.preload = 'auto';
    soundtrackSource.connect(ambienceBus);
    ambienceBus.connect(master);
    uiBus.connect(master);
    master.connect(context.destination);

    this.context = context;
    this.master = master;
    this.uiBus = uiBus;
    this.soundtrack = soundtrack;
    this.soundtrackSource = soundtrackSource;
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
