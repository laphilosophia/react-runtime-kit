export type ConsoleLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

export interface ConsoleSpan {
  id: string;
  level: ConsoleLevel;
  message: string;
  timestamp: number;
  args: unknown[];
}

class ConsoleStore {
  private logs: ConsoleSpan[] = [];
  private listeners = new Set<() => void>();
  private maxLogs = 100;
  private cachedSnapshot: ConsoleSpan[] = [];

  addLog(level: ConsoleLevel, args: unknown[]) {
    const message = args
      .map((arg) => {
        if (typeof arg === 'string') return arg;
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' ');

    this.logs.push({
      id: `${Date.now()}-${Math.random()}`,
      level,
      message,
      timestamp: performance.now(),
      args,
    });

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.updateSnapshot();
    this.notify();
  }

  private updateSnapshot() {
    this.cachedSnapshot = [...this.logs];
  }

  getSnapshot = (): ConsoleSpan[] => {
    return this.cachedSnapshot;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  clear() {
    this.logs = [];
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const consoleStore = new ConsoleStore();

// Original console methods backup
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console),
};

let isInitialized = false;

export function initConsoleInterceptor(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  if (isInitialized) {
    return;
  }

  isInitialized = true;

  console.log = (...args: unknown[]) => {
    consoleStore.addLog('log', args);
    originalConsole.log(...args);
  };

  console.warn = (...args: unknown[]) => {
    consoleStore.addLog('warn', args);
    originalConsole.warn(...args);
  };

  console.error = (...args: unknown[]) => {
    consoleStore.addLog('error', args);
    originalConsole.error(...args);
  };

  console.info = (...args: unknown[]) => {
    consoleStore.addLog('info', args);
    originalConsole.info(...args);
  };

  console.debug = (...args: unknown[]) => {
    consoleStore.addLog('debug', args);
    originalConsole.debug(...args);
  };
}
