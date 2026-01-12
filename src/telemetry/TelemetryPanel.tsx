import type { CSSProperties } from 'react';
import { useState, useSyncExternalStore } from 'react';
import { Button } from '../components/ui/button.js';
import { chaosStore } from './ChaosStore.js';
import { consoleStore, type ConsoleSpan } from './ConsoleInterceptor.js';
import { telemetryStore, type TelemetrySpan } from './TelemetryStore.js';

// === STYLES ===
const panelStyle: CSSProperties = {
  position: 'fixed',
  bottom: '1rem',
  left: '1rem',
  width: '26rem',
  maxHeight: '500px',
  zIndex: 50,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(17, 24, 39, 0.95)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(75, 85, 99, 0.6)',
  borderRadius: '0.75rem',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  overflow: 'hidden',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '0.75rem',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0.75rem',
  backgroundColor: 'rgba(31, 41, 55, 0.5)',
  borderBottom: '1px solid rgba(75, 85, 99, 0.6)',
};

const tabsStyle: CSSProperties = {
  display: 'flex',
  gap: '0.25rem',
  padding: '0.5rem',
  borderBottom: '1px solid rgba(75, 85, 99, 0.4)',
};

const tabStyle = (active: boolean): CSSProperties => ({
  padding: '0.375rem 0.75rem',
  borderRadius: '0.375rem',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.7rem',
  fontWeight: 600,
  backgroundColor: active ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
  color: active ? '#a5b4fc' : '#9ca3af',
  transition: 'all 0.15s',
});

const contentStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '0.5rem',
};

const rowStyle: CSSProperties = {
  position: 'relative',
  height: '1.75rem',
  display: 'flex',
  alignItems: 'center',
  padding: '0 0.25rem',
  borderRadius: '0.25rem',
  marginBottom: '0.125rem',
};

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

const sliderContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  padding: '0.5rem',
};

const sliderRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
};

const sliderStyle: CSSProperties = {
  flex: 1,
  height: '0.375rem',
  borderRadius: '0.25rem',
  appearance: 'none',
  backgroundColor: 'rgba(75, 85, 99, 0.5)',
  cursor: 'pointer',
};

const dotStyle = (isActive: boolean): CSSProperties => ({
  width: '0.5rem',
  height: '0.5rem',
  borderRadius: '50%',
  backgroundColor: isActive ? '#22c55e' : '#6b7280',
});

const getBarColor = (status: string): string => {
  switch (status) {
    case 'success': return '#10b981';
    case 'error': return '#ef4444';
    case 'cancelled': return '#64748b';
    case 'chaos': return '#f97316';
    default: return '#0ea5e9';
  }
};

type TabType = 'network' | 'console' | 'chaos';

const getConsoleColor = (level: string): string => {
  switch (level) {
    case 'error': return '#ef4444';
    case 'warn': return '#f59e0b';
    case 'info': return '#3b82f6';
    case 'debug': return '#8b5cf6';
    default: return '#9ca3af';
  }
};

// === CONSOLE TAB ===
const ConsoleTab = () => {
  const logs = useSyncExternalStore(consoleStore.subscribe, consoleStore.getSnapshot);
  const visibleLogs = logs.slice(-50);

  if (visibleLogs.length === 0) {
    return (
      <div style={{ color: '#4b5563', textAlign: 'center', padding: '2rem 0', fontStyle: 'italic' }}>
        No console output yet...
      </div>
    );
  }

  return (
    <>
      {visibleLogs.map((log: ConsoleSpan) => (
        <div
          key={log.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            padding: '0.375rem 0.25rem',
            borderBottom: '1px solid rgba(75, 85, 99, 0.2)',
            backgroundColor: log.level === 'error' ? 'rgba(239, 68, 68, 0.1)' :
              log.level === 'warn' ? 'rgba(245, 158, 11, 0.05)' : undefined,
          }}
        >
          <span style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            color: getConsoleColor(log.level),
            minWidth: '2.5rem',
            textTransform: 'uppercase',
          }}>
            {log.level}
          </span>
          <span style={{
            flex: 1,
            color: '#e5e7eb',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.7rem',
            wordBreak: 'break-word',
            lineHeight: 1.4,
          }}>
            {log.message}
          </span>
        </div>
      ))}
    </>
  );
};

// === NETWORK TAB ===
const NetworkTab = ({ spans }: { spans: TelemetrySpan[] }) => {
  const visibleSpans = spans.slice(-20);
  const minTime = visibleSpans.length > 0 ? visibleSpans[0]?.startTime : 0;
  const maxTime = visibleSpans.length > 0
    ? Math.max(...visibleSpans.map((s) => s.endTime || performance.now()))
    : 1000;
  const totalDuration = Math.max(maxTime - minTime!, 100);

  const handleReplay = (id: string) => {
    telemetryStore.replayRequest(id);
  };

  if (visibleSpans.length === 0) {
    return (
      <div style={{ color: '#4b5563', textAlign: 'center', padding: '2rem 0', fontStyle: 'italic' }}>
        Waiting for requests...
      </div>
    );
  }

  return (
    <>
      {visibleSpans.map((span) => {
        const startOffset = Math.max(span.startTime - minTime!, 0);
        const leftPercent = (startOffset / totalDuration) * 100;
        const currentDuration = span.duration || performance.now() - span.startTime;
        const widthPercent = Math.min((currentDuration / totalDuration) * 100, 100 - leftPercent);
        const urlName = span.url.split('/').slice(-2).join('/');

        return (
          <div
            key={span.id}
            style={{
              ...rowStyle,
              backgroundColor: span.chaosAffected ? 'rgba(249, 115, 22, 0.1)' : undefined,
            }}
          >
            {/* Labels */}
            <div style={{
              fontSize: '0.625rem',
              color: '#d1d5db',
              width: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontWeight: 700, opacity: 0.7, marginRight: '0.25rem' }}>
                {span.method}
              </span>
              {urlName}
              {span.chaosAffected && <span title="Chaos affected"> 🔥</span>}
            </div>

            {/* Timeline */}
            <div style={{ flex: 1, height: '100%', position: 'relative', margin: '0 0.25rem' }}>
              <div
                style={{
                  position: 'absolute',
                  height: '0.5rem',
                  top: '0.625rem',
                  borderRadius: '9999px',
                  backgroundColor: getBarColor(span.status),
                  opacity: 0.8,
                  transition: 'all 0.3s',
                  left: `${leftPercent}%`,
                  width: `${Math.max(widthPercent, 1)}%`,
                }}
                title={`${span.duration?.toFixed(0) ?? '...'}ms`}
              />
            </div>

            {/* Duration + Replay */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: '60px', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.625rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                {span.duration ? `${span.duration.toFixed(0)}ms` : '...'}
              </span>
              {span.requestArgs && (
                <button
                  onClick={() => handleReplay(span.id)}
                  style={{ ...iconButtonStyle, fontSize: '0.75rem' }}
                  title="Replay request"
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
                >
                  🔄
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

// === CHAOS TAB ===
const ChaosTab = () => {
  const config = useSyncExternalStore(
    chaosStore.subscribe,
    chaosStore.getConfig
  );

  return (
    <div style={sliderContainerStyle}>
      {/* Master Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem',
          backgroundColor: config.enabled ? 'rgba(249, 115, 22, 0.15)' : 'rgba(75, 85, 99, 0.2)',
          borderRadius: '0.5rem',
          border: config.enabled ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: config.enabled ? '#fb923c' : '#9ca3af' }}>
            🌪️ Chaos Mode
          </div>
          <div style={{ fontSize: '0.625rem', color: '#6b7280', marginTop: '0.125rem' }}>
            Inject latency & random failures
          </div>
        </div>
        <button
          onClick={() => chaosStore.setEnabled(!config.enabled)}
          style={{
            width: '3rem',
            height: '1.5rem',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: config.enabled ? '#f97316' : '#4b5563',
            position: 'relative',
            transition: 'background-color 0.2s',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '0.125rem',
              left: config.enabled ? '1.625rem' : '0.125rem',
              width: '1.25rem',
              height: '1.25rem',
              borderRadius: '50%',
              backgroundColor: '#fff',
              transition: 'left 0.2s',
            }}
          />
        </button>
      </div>

      {/* Latency Range */}
      <div style={{ opacity: config.enabled ? 1 : 0.5 }}>
        <div style={sliderRowStyle}>
          <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>🐌 Latency</span>
          <span style={{ color: '#e5e7eb', fontFamily: 'monospace', fontSize: '0.7rem' }}>
            {config.latencyMin}ms - {config.latencyMax}ms
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
          <input
            type="range"
            min="0"
            max="2000"
            step="100"
            value={config.latencyMin}
            onChange={(e) => chaosStore.setLatency(Number(e.target.value), config.latencyMax)}
            disabled={!config.enabled}
            style={sliderStyle}
          />
          <input
            type="range"
            min="500"
            max="10000"
            step="500"
            value={config.latencyMax}
            onChange={(e) => chaosStore.setLatency(config.latencyMin, Number(e.target.value))}
            disabled={!config.enabled}
            style={sliderStyle}
          />
        </div>
      </div>

      {/* Failure Rate */}
      <div style={{ opacity: config.enabled ? 1 : 0.5 }}>
        <div style={sliderRowStyle}>
          <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>💥 Failure Rate</span>
          <span style={{ color: '#e5e7eb', fontFamily: 'monospace', fontSize: '0.7rem' }}>
            {(config.failureRate * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.05"
          value={config.failureRate}
          onChange={(e) => chaosStore.setFailureRate(Number(e.target.value))}
          disabled={!config.enabled}
          style={{ ...sliderStyle, width: '100%', marginTop: '0.25rem' }}
        />
      </div>

      {/* Warning */}
      {config.enabled && (
        <div style={{
          padding: '0.5rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.375rem',
          color: '#fca5a5',
          fontSize: '0.65rem',
          textAlign: 'center',
        }}>
          ⚠️ Chaos Mode is active. Requests may fail or be delayed.
        </div>
      )}
    </div>
  );
};

// === MAIN PANEL ===
export const TelemetryPanel = () => {
  const spans = useSyncExternalStore(telemetryStore.subscribe, telemetryStore.getSnapshot);
  const consoleLogs = useSyncExternalStore(consoleStore.subscribe, consoleStore.getSnapshot);
  const chaosConfig = useSyncExternalStore(chaosStore.subscribe, chaosStore.getConfig);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('network');

  const pendingCount = spans.filter((s) => s.status === 'pending').length;
  const hasError = spans.some((s) => s.status === 'error' || s.status === 'chaos');
  const hasConsoleError = consoleLogs.some((l) => l.level === 'error');

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '1rem',
          left: '1rem',
          zIndex: 50,
          backgroundColor: chaosConfig.enabled
            ? 'rgba(249, 115, 22, 0.3)'
            : hasError
              ? 'rgba(127, 29, 29, 0.8)'
              : undefined,
          color: hasError ? '#fecaca' : undefined,
          borderColor: chaosConfig.enabled ? 'rgba(249, 115, 22, 0.5)' : undefined,
        }}
      >
        <div style={dotStyle(pendingCount > 0)} />
        <span style={{ fontWeight: 700 }}>Network</span>
        {chaosConfig.enabled && <span title="Chaos Mode Active">🌪️</span>}
        {pendingCount > 0 && (
          <span style={{
            fontSize: '0.625rem',
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: '0 0.375rem',
            borderRadius: '0.25rem',
            color: '#4ade80',
          }}>
            {pendingCount}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={dotStyle(pendingCount > 0)} />
          <span style={{ fontWeight: 600, color: '#d1d5db' }}>Telemetry</span>
          {chaosConfig.enabled && (
            <span style={{
              fontSize: '0.6rem',
              backgroundColor: 'rgba(249, 115, 22, 0.3)',
              color: '#fb923c',
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem',
            }}>
              CHAOS
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => telemetryStore.clear()}
            style={iconButtonStyle}
            title="Clear"
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={iconButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={tabsStyle}>
        <button
          style={tabStyle(activeTab === 'network')}
          onClick={() => setActiveTab('network')}
        >
          📡 Network ({spans.length})
        </button>
        <button
          style={{
            ...tabStyle(activeTab === 'console'),
            color: hasConsoleError && activeTab !== 'console' ? '#ef4444' : undefined,
          }}
          onClick={() => setActiveTab('console')}
        >
          🖥️ Console ({consoleLogs.length})
        </button>
        <button
          style={tabStyle(activeTab === 'chaos')}
          onClick={() => setActiveTab('chaos')}
        >
          🌪️ Chaos
        </button>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {activeTab === 'network' && <NetworkTab spans={spans} />}
        {activeTab === 'console' && <ConsoleTab />}
        {activeTab === 'chaos' && <ChaosTab />}
      </div>
    </div>
  );
};
