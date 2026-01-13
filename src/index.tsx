// =============================================================================
// 🚀 React Runtime Kit
// =============================================================================
// Dev tools that actually spark joy. ✨

// === UNIFIED DEVTOOLS (Recommended) ===
export { DevTools } from './DevTools.js';

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
export { GhostText, ghostT, initGhostKeys, isGhostKeysEnabled } from './i18n/GhostKeys.js';

// === PROP INJECTOR ===
export { PropPanel, propStore, withDevProps } from './props/PropInjector.js';
export type { RegisteredComponent } from './props/PropInjector.js';

// === KEYBOARD SHORTCUTS ===
export { DEFAULT_SHORTCUTS, keyboardManager, useKeyboardShortcut } from './keyboard/KeyboardManager.js';
