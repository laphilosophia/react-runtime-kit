export type RequestStatus = 'pending' | 'success' | 'error' | 'cancelled' | 'chaos';

export interface TelemetrySpan {
  id: string;
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: RequestStatus;
  requestArgs?: Parameters<typeof fetch> | undefined; // For replay
  chaosAffected?: boolean;
}

class TelemetryStore {
  private spans: Map<string, TelemetrySpan> = new Map();
  private listeners: Set<() => void> = new Set();
  private currentSnapshot: TelemetrySpan[] = [];

  startSpan(id: string, method: string, url: string, requestArgs?: Parameters<typeof fetch>) {
    this.spans.set(id, {
      id,
      method,
      url,
      startTime: performance.now(),
      status: 'pending',
      requestArgs,
    });
    this.updateSnapshot();
    this.notify();
  }

  endSpan(id: string, status: RequestStatus) {
    const span = this.spans.get(id);
    if (span) {
      span.endTime = performance.now();
      span.duration = span.endTime - span.startTime;
      span.status = status;
      span.chaosAffected = status === 'chaos';
      this.updateSnapshot();
      this.notify();
    }
  }

  private updateSnapshot() {
    this.currentSnapshot = Array.from(this.spans.values()).sort(
      (a, b) => a.startTime - b.startTime
    );
  }

  getSnapshot = (): TelemetrySpan[] => {
    return this.currentSnapshot;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    this.listeners.forEach((l) => l());
  }

  clear() {
    this.spans.clear();
    this.updateSnapshot();
    this.notify();
  }

  // 🔄 Replay a request
  async replayRequest(id: string): Promise<Response | null> {
    const span = this.spans.get(id);
    if (!span?.requestArgs) {
      console.warn('[Telemetry] No request data to replay for:', id);
      return null;
    }

    console.log('[Telemetry] Replaying request:', span.method, span.url);

    // Use the native fetch to avoid double-tracking
    // The interceptor will create a new span for this
    return fetch(...span.requestArgs);
  }
}

export const telemetryStore = new TelemetryStore();
