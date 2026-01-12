import { chaosStore } from './ChaosStore.js';
import { telemetryStore } from './TelemetryStore.js';

function uuid(): string {
  let dt = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = ((dt + Math.random() * 16) % 16) | 0;
    dt = Math.floor(dt / 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function initNetworkInterceptor(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const originalFetch = window.fetch;

  window.fetch = async (...args): Promise<Response> => {
    const [resource, config] = args;
    const reqId = uuid();

    let url = 'unknown';
    let method = 'GET';

    if (typeof resource === 'string') {
      url = resource;
      method = config?.method ?? 'GET';
    } else if (resource instanceof Request) {
      url = resource.url;
      method = resource.method;
    }

    // Store request data for replay
    telemetryStore.startSpan(reqId, method, url, args);

    try {
      // 🌪️ Apply Chaos Mode (latency + random failure)
      await chaosStore.applyChoas();

      const response = await originalFetch(...args);
      telemetryStore.endSpan(reqId, response.ok ? 'success' : 'error');
      return response;
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Check if it's a Chaos Monkey error
        if (error.message.includes('Chaos Monkey')) {
          telemetryStore.endSpan(reqId, 'chaos');
          throw error;
        }
        if (error.name === 'AbortError' || error.message === 'The user aborted a request.') {
          telemetryStore.endSpan(reqId, 'cancelled');
        } else {
          telemetryStore.endSpan(reqId, 'error');
        }
      } else {
        telemetryStore.endSpan(reqId, 'error');
      }
      throw error;
    }
  };
}

// Re-export for convenience
export { chaosStore } from './ChaosStore.js';
