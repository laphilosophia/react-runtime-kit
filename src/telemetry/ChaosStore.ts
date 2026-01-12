export interface ChaosConfig {
  enabled: boolean;
  latencyMin: number;
  latencyMax: number;
  failureRate: number; // 0-1 (0.1 = 10%)
}

const DEFAULT_CONFIG: ChaosConfig = {
  enabled: false,
  latencyMin: 200,
  latencyMax: 2000,
  failureRate: 0.1,
};

const STORAGE_KEY = '__dev_chaos_config';

class ChaosStore {
  private config: ChaosConfig;
  private listeners = new Set<() => void>();

  constructor() {
    this.config = this.loadFromStorage();
  }

  private loadFromStorage(): ChaosConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_CONFIG };
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
  }

  getConfig = (): ChaosConfig => {
    return { ...this.config };
  };

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveToStorage();
    this.notify();
  }

  setLatency(min: number, max: number): void {
    this.config.latencyMin = min;
    this.config.latencyMax = max;
    this.saveToStorage();
    this.notify();
  }

  setFailureRate(rate: number): void {
    this.config.failureRate = Math.max(0, Math.min(1, rate));
    this.saveToStorage();
    this.notify();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  // Called by NetworkInterceptor
  async applyChoas(): Promise<void> {
    if (!this.config.enabled) return;

    // Random latency
    const delay =
      Math.random() * (this.config.latencyMax - this.config.latencyMin) +
      this.config.latencyMin;
    await new Promise((r) => setTimeout(r, delay));

    // Random failure
    if (Math.random() < this.config.failureRate) {
      throw new Error('🔥 Chaos Monkey struck! (Simulated network failure)');
    }
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }
}

export const chaosStore = new ChaosStore();
