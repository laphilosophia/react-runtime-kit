import type { CSSProperties } from 'react';
import { useSyncExternalStore } from 'react';
import { propStore, type RegisteredComponent } from './PropInjector.js';

const contentPadding: CSSProperties = {
  padding: '0.5rem',
};

const iconButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#6b7280',
  padding: '0.25rem',
  fontSize: '0.65rem',
};

const emptyStateStyle: CSSProperties = {
  color: '#4b5563',
  textAlign: 'center',
  padding: '1rem',
  fontStyle: 'italic',
};

// Prop Editor for individual component
const ComponentPropEditor = ({ component }: { component: RegisteredComponent }) => {
  const overrides = useSyncExternalStore(propStore.subscribe, () => propStore.getOverrides(component.id));
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
            style={{ ...iconButtonStyle, color: '#f87171' }}
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
              flexDirection: 'row',
              alignItems: 'start',
              gap: '1rem',
              padding: '0.25rem',
              backgroundColor: isOverridden ? 'rgba(234, 88, 12, 0.1)' : undefined,
              borderRadius: '0.25rem',
            }}
          >
            <span style={{
              width: '5rem',
              fontSize: '0.7rem',
              textAlign: 'right',
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
                  width: '8rem',
                  padding: '0.25rem 0.5rem',
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
                  width: '8rem',
                  padding: '0.25rem 0.5rem',
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

export const PropTabContent = () => {
  const registry = useSyncExternalStore(propStore.subscribe, propStore.getRegistry);

  if (registry.length === 0) {
    return (
      <div style={emptyStateStyle}>
        No components registered.
        <br />
        <span style={{ fontSize: '0.65rem' }}>Use withDevProps() HOC</span>
      </div>
    );
  }

  return (
    <div style={contentPadding}>
      {registry.map((comp) => (
        <ComponentPropEditor key={comp.id} component={comp} />
      ))}
    </div>
  );
};
