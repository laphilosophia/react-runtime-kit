import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { keyboardManager } from './keyboard/KeyboardManager.js';
import { propStore } from './props/PropInjector.js';
import { scenarioStore } from './scenarios/ScenarioStore.js';
import { chaosStore } from './telemetry/ChaosStore.js';
import { consoleStore, initConsoleInterceptor } from './telemetry/ConsoleInterceptor.js';
import { initNetworkInterceptor } from './telemetry/NetworkInterceptor.js';
import { telemetryStore } from './telemetry/TelemetryStore.js';

// Import content components (we'll create lightweight versions)
import { PropTabContent } from './props/PropContent.js';
import { ScenarioTabContent } from './scenarios/ScenarioContent.js';
import { ChaosTabContent, ConsoleTabContent, NetworkTabContent } from './telemetry/TelemetryContent.js';

type TabId = 'network' | 'console' | 'chaos' | 'scenarios' | 'props';

interface DevToolsProps {
  /** Position of the panel */
  position?: 'bottom-left' | 'bottom-right' | 'bottom-center';
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Tabs to show (default: all) */
  tabs?: TabId[];
  /** Enable keyboard shortcuts (default: true) */
  shortcuts?: boolean;
}

// === STYLES ===
const panelStyle = (position: string, isCollapsed: boolean): CSSProperties => ({
  position: 'fixed',
  bottom: '1rem',
  left: position === 'bottom-left' ? '1rem' : position === 'bottom-center' ? '50%' : undefined,
  right: position === 'bottom-right' ? '1rem' : undefined,
  transform: position === 'bottom-center' ? 'translateX(-50%)' : undefined,
  width: isCollapsed ? 'auto' : '36rem',
  maxHeight: isCollapsed ? 'auto' : '500px',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(17, 24, 39, 0.98)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(75, 85, 99, 0.6)',
  borderRadius: '0.75rem',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  overflow: 'hidden',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '0.75rem',
});

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0.75rem',
  backgroundColor: 'rgba(31, 41, 55, 0.5)',
  borderBottom: '1px solid rgba(75, 85, 99, 0.6)',
  cursor: 'pointer',
  userSelect: 'none',
};

const tabsStyle: CSSProperties = {
  display: 'flex',
  width: '100%',
  gap: '0.125rem',
  padding: '0.375rem',
  borderBottom: '1px solid rgba(75, 85, 99, 0.4)',
  flexWrap: 'wrap',
};

const tabStyle = (active: boolean, hasAlert: boolean): CSSProperties => ({
  padding: '0.375rem 0.625rem',
  borderRadius: '0.375rem',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.7rem',
  fontWeight: 600,
  backgroundColor: active ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
  color: hasAlert && !active ? '#f87171' : active ? '#a5b4fc' : '#9ca3af',
  transition: 'all 0.15s',
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
});

const contentStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  minHeight: '200px',
  maxHeight: '400px',
};

const badgeStyle = (color: string): CSSProperties => ({
  fontSize: '0.6rem',
  backgroundColor: color,
  padding: '0.125rem 0.375rem',
  borderRadius: '0.25rem',
  minWidth: '1rem',
  textAlign: 'center',
});

const iconButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#6b7280',
  padding: '0.25rem',
  display: 'flex',
  alignItems: 'center',
  transition: 'color 0.15s',
};

const TAB_CONFIG: Record<TabId, { icon: string; label: string }> = {
  network: { icon: '📡', label: 'Network' },
  console: { icon: '🖥️', label: 'Console' },
  chaos: { icon: '🌪️', label: 'Chaos' },
  scenarios: { icon: '📋', label: 'Scenarios' },
  props: { icon: '🎭', label: 'Props' },
};

/**
 * Unified DevTools panel with tabbed interface.
 *
 * @example
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
  position = 'bottom-left',
  defaultCollapsed = true,
  tabs = ['network', 'console', 'chaos', 'scenarios', 'props'],
  shortcuts = true,
}: DevToolsProps = {}): ReactNode {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [activeTab, setActiveTab] = useState<TabId>(tabs[0] ?? 'network');

  // Subscribe to stores for badges
  const spans = useSyncExternalStore(telemetryStore.subscribe, telemetryStore.getSnapshot);
  const consoleLogs = useSyncExternalStore(consoleStore.subscribe, consoleStore.getSnapshot);
  const chaosConfig = useSyncExternalStore(chaosStore.subscribe, chaosStore.getConfig);
  const scenarios = useSyncExternalStore(scenarioStore.subscribe, scenarioStore.getScenarios);
  const registry = useSyncExternalStore(propStore.subscribe, propStore.getRegistry);

  // Computed values
  const pendingCount = spans.filter((s) => s.status === 'pending').length;
  const errorCount = spans.filter((s) => s.status === 'error' || s.status === 'chaos').length;
  const consoleErrorCount = consoleLogs.filter((l) => l.level === 'error').length;
  const scenarioCount = Object.keys(scenarios).length;
  const propsCount = registry.length;

  // Initialize interceptors
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    initNetworkInterceptor();
    initConsoleInterceptor();

    // Register keyboard shortcuts
    if (shortcuts) {
      keyboardManager.register({
        key: 'd',
        ctrl: true,
        shift: true,
        callback: () => setIsCollapsed((v) => !v),
        description: 'Toggle DevTools',
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

  const getBadge = (tabId: TabId): ReactNode => {
    switch (tabId) {
      case 'network':
        if (errorCount > 0) return <span style={badgeStyle('rgba(239, 68, 68, 0.4)')}>{errorCount}</span>;
        if (pendingCount > 0) return <span style={badgeStyle('rgba(34, 197, 94, 0.4)')}>{pendingCount}</span>;
        if (spans.length > 0) return <span style={badgeStyle('rgba(75, 85, 99, 0.5)')}>{spans.length}</span>;
        return null;
      case 'console':
        if (consoleErrorCount > 0) return <span style={badgeStyle('rgba(239, 68, 68, 0.4)')}>{consoleErrorCount}</span>;
        if (consoleLogs.length > 0) return <span style={badgeStyle('rgba(75, 85, 99, 0.5)')}>{consoleLogs.length}</span>;
        return null;
      case 'chaos':
        if (chaosConfig.enabled) return <span style={badgeStyle('rgba(249, 115, 22, 0.4)')}>ON</span>;
        return null;
      case 'scenarios':
        if (scenarioCount > 0) return <span style={badgeStyle('rgba(124, 58, 237, 0.4)')}>{scenarioCount}</span>;
        return null;
      case 'props':
        if (propsCount > 0) return <span style={badgeStyle('rgba(234, 88, 12, 0.4)')}>{propsCount}</span>;
        return null;
      default:
        return null;
    }
  };

  const hasAlert = (tabId: TabId): boolean => {
    if (tabId === 'network') return errorCount > 0;
    if (tabId === 'console') return consoleErrorCount > 0;
    return false;
  };

  // Collapsed state - show minimal floating button
  if (isCollapsed) {
    return (
      <div style={panelStyle(position, true)}>
        <div
          style={headerStyle}
          onClick={() => setIsCollapsed(false)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>🛠️</span>
            <span style={{ fontWeight: 600, color: '#d1d5db' }}>DevTools</span>
            {chaosConfig.enabled && (
              <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(249, 115, 22, 0.3)', color: '#fb923c', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>
                CHAOS
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {errorCount > 0 && <span style={badgeStyle('rgba(239, 68, 68, 0.4)')}>{errorCount} err</span>}
            {pendingCount > 0 && <span style={badgeStyle('rgba(34, 197, 94, 0.4)')}>{pendingCount}</span>}
            <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>▲</span>
          </div>
        </div>
      </div>
    );
  }

  // Expanded state
  return (
    <div style={panelStyle(position, false)}>
      {/* Header */}
      <div style={headerStyle} onClick={() => setIsCollapsed(true)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>🛠️</span>
          <span style={{ fontWeight: 600, color: '#d1d5db' }}>DevTools</span>
          {chaosConfig.enabled && (
            <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(249, 115, 22, 0.3)', color: '#fb923c', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>
              CHAOS
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={(e) => { e.stopPropagation(); telemetryStore.clear(); consoleStore.clear(); }}
            style={iconButtonStyle}
            title="Clear all"
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
          >
            🗑️
          </button>
          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>▼</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={tabsStyle}>
        {tabs.map((tabId) => (
          <button
            key={tabId}
            style={tabStyle(activeTab === tabId, hasAlert(tabId))}
            onClick={() => setActiveTab(tabId)}
          >
            <span>{TAB_CONFIG[tabId].icon}</span>
            <span>{TAB_CONFIG[tabId].label}</span>
            {getBadge(tabId)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {activeTab === 'network' && <NetworkTabContent />}
        {activeTab === 'console' && <ConsoleTabContent />}
        {activeTab === 'chaos' && <ChaosTabContent />}
        {activeTab === 'scenarios' && <ScenarioTabContent />}
        {activeTab === 'props' && <PropTabContent />}
      </div>
    </div>
  );
}
