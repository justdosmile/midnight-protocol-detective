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
  private hum: OscillatorNode | null = null;
  private noise: AudioBufferSourceNode | null = null;
  private relayTimer: number | null = null;

  async start(volume: number): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.context.destination);

      this.hum = this.context.createOscillator();
      const humGain = this.context.createGain();
      this.hum.type = 'sine';
      this.hum.frequency.value = 46;
      humGain.gain.value = 0.035;
      this.hum.connect(humGain).connect(this.master);
      this.hum.start();

      const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < channel.length; index += 1) {
        channel[index] = (Math.random() * 2 - 1) * 0.025;
      }
      this.noise = this.context.createBufferSource();
      this.noise.buffer = buffer;
      this.noise.loop = true;
      const noiseFilter = this.context.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 900;
      this.noise.connect(noiseFilter).connect(this.master);
      this.noise.start();
    }

    await this.context.resume();
    this.setVolume(volume);
    this.scheduleRelay();
  }

  setVolume(volume: number): void {
    if (!this.context || !this.master) return;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.25);
  }

  suspend(): void {
    if (!this.context || !this.master) return;
    this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.08);
    if (this.relayTimer !== null) window.clearTimeout(this.relayTimer);
    this.relayTimer = null;
  }

  play(sound: UiSound): void {
    if (!this.context || !this.master || this.context.state !== 'running') return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const frequency = sound === 'open' ? 180 : sound === 'success' ? 420 : 110;
    oscillator.type = sound === 'finale' ? 'sawtooth' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    if (sound !== 'open') {
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.35, this.context.currentTime + 0.22);
    }
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, this.context.currentTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.32);
    oscillator.connect(gain).connect(this.master);
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.34);
  }

  private scheduleRelay(): void {
    if (this.relayTimer !== null) window.clearTimeout(this.relayTimer);
    this.relayTimer = window.setTimeout(() => {
      this.play('open');
      this.scheduleRelay();
    }, 8_000 + Math.random() * 8_000);
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
