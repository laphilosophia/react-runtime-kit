import type { CSSProperties } from 'react';
import { useSyncExternalStore } from 'react';
import { chaosStore } from './ChaosStore.js';
import { consoleStore, type ConsoleSpan } from './ConsoleInterceptor.js';
import { telemetryStore, type TelemetrySpan } from './TelemetryStore.js';

// === SHARED STYLES ===
const contentPadding: CSSProperties = {
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

const emptyStateStyle: CSSProperties = {
  color: '#4b5563',
  textAlign: 'center',
  padding: '2rem 0',
  fontStyle: 'italic',
};

const getBarColor = (status: string): string => {
  switch (status) {
    case 'success': return '#10b981';
    case 'error': return '#ef4444';
    case 'cancelled': return '#64748b';
    case 'chaos': return '#f97316';
    default: return '#0ea5e9';
  }
};

const getConsoleColor = (level: string): string => {
  switch (level) {
    case 'error': return '#ef4444';
    case 'warn': return '#f59e0b';
    case 'info': return '#3b82f6';
    case 'debug': return '#8b5cf6';
    default: return '#9ca3af';
  }
};

// === NETWORK TAB ===
export const NetworkTabContent = () => {
  const spans = useSyncExternalStore(telemetryStore.subscribe, telemetryStore.getSnapshot);
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
    return <div style={emptyStateStyle}>Waiting for requests...</div>;
  }

  return (
    <div style={contentPadding}>
      {visibleSpans.map((span: TelemetrySpan) => {
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
    </div>
  );
};

// === CONSOLE TAB ===
export const ConsoleTabContent = () => {
  const logs = useSyncExternalStore(consoleStore.subscribe, consoleStore.getSnapshot);
  const visibleLogs = logs.slice(-50);

  if (visibleLogs.length === 0) {
    return <div style={emptyStateStyle}>No console output yet...</div>;
  }

  return (
    <div style={contentPadding}>
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
    </div>
  );
};

// === CHAOS TAB ===
export const ChaosTabContent = () => {
  const config = useSyncExternalStore(chaosStore.subscribe, chaosStore.getConfig);

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
