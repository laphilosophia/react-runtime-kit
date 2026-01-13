import type { ComponentType, CSSProperties } from 'react';
import { useEffect, useState, useSyncExternalStore } from 'react';

// === TYPES ===
type PropValue = string | number | boolean | undefined;

interface PropOverride {
  [propName: string]: PropValue;
}

export interface RegisteredComponent {
  id: string;
  displayName: string;
  props: Record<string, PropValue>;
  propTypes: Record<string, 'string' | 'number' | 'boolean'>;
}

// === STORE ===
class PropStore {
  private overrides: Map<string, PropOverride> = new Map();
  private registry: Map<string, RegisteredComponent> = new Map();
  private listeners = new Set<() => void>();
  private enabled = false;

  // Cached snapshots for useSyncExternalStore
  private cachedRegistry: RegisteredComponent[] = [];
  private cachedAllOverrides: Map<string, PropOverride> = new Map();
  private cachedOverridesById: Map<string, PropOverride> = new Map();
  private emptyOverride: PropOverride = {};

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.notify();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  register(
    id: string,
    displayName: string,
    props: Record<string, PropValue>,
    propTypes: Record<string, 'string' | 'number' | 'boolean'>
  ): void {
    this.registry.set(id, { id, displayName, props, propTypes });
    this.updateSnapshots();
    this.notify();
  }

  unregister(id: string): void {
    this.registry.delete(id);
    this.overrides.delete(id);
    this.cachedOverridesById.delete(id);
    this.updateSnapshots();
    this.notify();
  }

  setOverride(id: string, propName: string, value: PropValue): void {
    const current = this.overrides.get(id) ?? {};
    current[propName] = value;
    this.overrides.set(id, current);
    this.cachedOverridesById.set(id, { ...current });
    this.updateSnapshots();
    this.notify();
  }

  clearOverrides(id: string): void {
    this.overrides.delete(id);
    this.cachedOverridesById.set(id, {});
    this.updateSnapshots();
    this.notify();
  }

  getOverrides = (id: string): PropOverride => {
    return this.cachedOverridesById.get(id) ?? this.emptyOverride;
  };

  getRegistry = (): RegisteredComponent[] => {
    return this.cachedRegistry;
  };

  getAllOverrides = (): Map<string, PropOverride> => {
    return this.cachedAllOverrides;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private updateSnapshots(): void {
    this.cachedRegistry = Array.from(this.registry.values());
    this.cachedAllOverrides = new Map(this.overrides);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}

export const propStore = new PropStore();

// === HOC ===
/**
 * Higher-Order Component that enables runtime prop injection
 *
 * @example
 * const Button = withDevProps(({ disabled, variant }) => (
 *   <button disabled={disabled}>{variant} Button</button>
 * ), 'Button', { disabled: 'boolean', variant: 'string' });
 */
export function withDevProps<P extends Record<string, PropValue>>(
  Component: ComponentType<P>,
  displayName: string,
  propTypes: Record<keyof P, 'string' | 'number' | 'boolean'>
): ComponentType<P> {
  const id = `${displayName}-${Math.random().toString(36).slice(2, 8)}`;

  const WrappedComponent = (props: P) => {
    // Register on mount
    useEffect(() => {
      if (process.env.NODE_ENV !== 'development') return;

      propStore.register(id, displayName, props as Record<string, PropValue>, propTypes);
      return () => {
        propStore.unregister(id);
      };
    }, []);

    // Update props when they change
    useEffect(() => {
      if (process.env.NODE_ENV !== 'development') return;
      propStore.register(id, displayName, props as Record<string, PropValue>, propTypes);
    }, [props]);

    // Get overrides
    const overrides = useSyncExternalStore(
      propStore.subscribe,
      () => propStore.getOverrides(id)
    );

    // In production, just render normally
    if (process.env.NODE_ENV !== 'development') {
      return <Component {...props} />;
    }

    // Merge props with overrides
    const mergedProps = { ...props, ...overrides } as P;

    return <Component {...mergedProps} />;
  };

  WrappedComponent.displayName = `withDevProps(${displayName})`;
  return WrappedComponent;
}

// === PANEL ===
const panelStyle: CSSProperties = {
  position: 'fixed',
  bottom: '1rem',
  right: '1rem',
  width: '18rem',
  maxHeight: '400px',
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

const iconButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#6b7280',
  padding: '0.25rem',
};

export const PropPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const registry = useSyncExternalStore(propStore.subscribe, propStore.getRegistry);
  const allOverrides = useSyncExternalStore(propStore.subscribe, propStore.getAllOverrides);

  const overrideCount = Array.from(allOverrides.values()).reduce(
    (sum, o) => sum + Object.keys(o).length,
    0
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          zIndex: 50,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 0.75rem',
          backgroundColor: overrideCount > 0 ? 'rgba(234, 88, 12, 0.3)' : 'rgba(31, 41, 55, 0.9)',
          color: '#d1d5db',
          border: '1px solid rgba(75, 85, 99, 0.5)',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        🎭 Props
        {overrideCount > 0 && (
          <span style={{
            fontSize: '0.625rem',
            backgroundColor: 'rgba(234, 88, 12, 0.4)',
            padding: '0 0.375rem',
            borderRadius: '0.25rem',
            color: '#fdba74',
          }}>
            {overrideCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, color: '#fdba74' }}>🎭 Prop Injector</span>
        <button
          onClick={() => setIsOpen(false)}
          style={iconButtonStyle}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {registry.length === 0 ? (
          <div style={{ color: '#4b5563', textAlign: 'center', padding: '1rem', fontStyle: 'italic' }}>
            No components registered.
            <br />
            <span style={{ fontSize: '0.65rem' }}>Use withDevProps() HOC</span>
          </div>
        ) : (
          registry.map((comp) => (
            <ComponentPropEditor key={comp.id} component={comp} />
          ))
        )}
      </div>
    </div>
  );
};

// === PROP EDITOR ===
const ComponentPropEditor = ({ component }: { component: RegisteredComponent }) => {
  const overrides = useSyncExternalStore(
    propStore.subscribe,
    () => propStore.getOverrides(component.id)
  );

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div style={{
      marginBottom: '0.5rem',
      padding: '0.5rem',
      backgroundColor: hasOverrides ? 'rgba(234, 88, 12, 0.1)' : 'rgba(31, 41, 55, 0.5)',
      borderRadius: '0.375rem',
      border: hasOverrides ? '1px solid rgba(234, 88, 12, 0.3)' : '1px solid transparent',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.375rem',
      }}>
        <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{component.displayName}</span>
        {hasOverrides && (
          <button
            onClick={() => propStore.clearOverrides(component.id)}
            style={{ ...iconButtonStyle, fontSize: '0.65rem', color: '#f87171' }}
          >
            Reset
          </button>
        )}
      </div>

      {Object.entries(component.propTypes).map(([propName, propType]) => {
        const currentValue = overrides[propName] ?? component.props[propName];
        const isOverridden = propName in overrides;

        return (
          <div
            key={propName}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.25rem',
              padding: '0.25rem',
              backgroundColor: isOverridden ? 'rgba(234, 88, 12, 0.1)' : undefined,
              borderRadius: '0.25rem',
            }}
          >
            <span style={{
              flex: 1,
              fontSize: '0.7rem',
              color: isOverridden ? '#fdba74' : '#9ca3af',
            }}>
              {propName}
            </span>

            {propType === 'boolean' && (
              <input
                type="checkbox"
                checked={currentValue as boolean}
                onChange={(e) => propStore.setOverride(component.id, propName, e.target.checked)}
                style={{ accentColor: '#f97316' }}
              />
            )}

            {propType === 'string' && (
              <input
                type="text"
                value={(currentValue as string) ?? ''}
                onChange={(e) => propStore.setOverride(component.id, propName, e.target.value)}
                style={{
                  width: '80px',
                  padding: '0.125rem 0.25rem',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(75, 85, 99, 0.5)',
                  borderRadius: '0.125rem',
                  color: '#e5e7eb',
                  fontSize: '0.65rem',
                }}
              />
            )}

            {propType === 'number' && (
              <input
                type="number"
                value={(currentValue as number) ?? 0}
                onChange={(e) => propStore.setOverride(component.id, propName, Number(e.target.value))}
                style={{
                  width: '60px',
                  padding: '0.125rem 0.25rem',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(75, 85, 99, 0.5)',
                  borderRadius: '0.125rem',
                  color: '#e5e7eb',
                  fontSize: '0.65rem',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
