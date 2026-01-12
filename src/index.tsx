// =============================================================================
// 🚀 React Runtime Kit
// =============================================================================
// Dev tools that actually spark joy. ✨

// === TELEMETRY MODULE ===
export type { ChaosConfig } from './telemetry/ChaosStore.js';
export { consoleStore, initConsoleInterceptor } from './telemetry/ConsoleInterceptor.js';
export type { ConsoleLevel, ConsoleSpan } from './telemetry/ConsoleInterceptor.js';
export { chaosStore, initNetworkInterceptor } from './telemetry/NetworkInterceptor.js';
export { TelemetryPanel } from './telemetry/TelemetryPanel.js';
export { telemetryStore } from './telemetry/TelemetryStore.js';
export type { RequestStatus, TelemetrySpan } from './telemetry/TelemetryStore.js';

// === SCENARIO MODULE ===
export { ScenarioPanel } from './scenarios/ScenarioPanel.js';
export { scenarioStore } from './scenarios/ScenarioStore.js';
export { useScenario } from './scenarios/useScenario.js';

// === GHOST KEYS (i18n Debugger) ===
export { ghostT, GhostText, initGhostKeys, isGhostKeysEnabled } from './i18n/GhostKeys.js';

// === PROP INJECTOR ===
export { PropPanel, propStore, withDevProps } from './props/PropInjector.js';

// === KEYBOARD SHORTCUTS ===
export { DEFAULT_SHORTCUTS, keyboardManager, useKeyboardShortcut } from './keyboard/KeyboardManager.js';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { keyboardManager } from './keyboard/KeyboardManager.js';
import { PropPanel } from './props/PropInjector.js';
import { ScenarioPanel } from './scenarios/ScenarioPanel.js';
import { chaosStore } from './telemetry/ChaosStore.js';
import { initConsoleInterceptor } from './telemetry/ConsoleInterceptor.js';
import { initNetworkInterceptor } from './telemetry/NetworkInterceptor.js';
import { TelemetryPanel } from './telemetry/TelemetryPanel.js';

interface DevToolsProps {
  /** Show Telemetry Panel (default: true) */
  telemetry?: boolean;
  /** Show Scenario Panel (default: true) */
  scenarios?: boolean;
  /** Show Prop Injector Panel (default: false) */
  props?: boolean;
  /** Enable keyboard shortcuts (default: true) */
  shortcuts?: boolean;
}

/**
 * All-in-one DevTools component. Just drop it in your app.
 *
 * @example
 * // In your App.tsx
 * import { DevTools } from 'react-runtime-kit';
 *
 * function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       <DevTools />
 *     </>
 *   );
 * }
 */
export function DevTools({
  telemetry = true,
  scenarios = true,
  props = false,
  shortcuts = true,
}: DevToolsProps = {}): ReactNode {
  const [showTelemetry, setShowTelemetry] = useState(telemetry);
  const [showScenarios, setShowScenarios] = useState(scenarios);
  const [showProps, setShowProps] = useState(props);

  // Initialize interceptors
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    initNetworkInterceptor();
    initConsoleInterceptor();

    // Register keyboard shortcuts
    if (shortcuts) {
      keyboardManager.register({
        key: 't',
        ctrl: true,
        shift: true,
        callback: () => setShowTelemetry((v) => !v),
        description: 'Toggle Telemetry',
      });
      keyboardManager.register({
        key: 's',
        ctrl: true,
        shift: true,
        callback: () => setShowScenarios((v) => !v),
        description: 'Toggle Scenarios',
      });
      keyboardManager.register({
        key: 'p',
        ctrl: true,
        shift: true,
        callback: () => setShowProps((v) => !v),
        description: 'Toggle Props',
      });
      keyboardManager.register({
        key: 'c',
        ctrl: true,
        shift: true,
        callback: () => chaosStore.setEnabled(!chaosStore.isEnabled()),
        description: 'Toggle Chaos Mode',
      });
    }
  }, [shortcuts]);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {showTelemetry && <TelemetryPanel />}
      {showScenarios && <ScenarioPanel />}
      {showProps && <PropPanel />}
    </>
  );
}

