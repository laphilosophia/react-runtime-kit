import type { CSSProperties } from 'react';
import { useRef, useState, useSyncExternalStore } from 'react';
import { scenarioStore } from './ScenarioStore.js';

const contentPadding: CSSProperties = {
  padding: '0.5rem',
};

const inputStyle: CSSProperties = {
  flex: 1,
  backgroundColor: 'rgba(31, 41, 55, 1)',
  border: '1px solid rgba(75, 85, 99, 0.8)',
  borderRadius: '0.25rem',
  padding: '0.25rem 0.5rem',
  color: '#e5e7eb',
  outline: 'none',
  fontSize: '0.75rem',
};

const saveButtonStyle: CSSProperties = {
  backgroundColor: '#7c3aed',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  padding: '0.25rem 0.5rem',
  fontWeight: 700,
  cursor: 'pointer',
};

const listItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: 'rgba(31, 41, 55, 0.5)',
  padding: '0.5rem',
  borderRadius: '0.25rem',
  marginBottom: '0.25rem',
  transition: 'background-color 0.15s',
};

const iconButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0.125rem',
  fontSize: '0.75rem',
};

const emptyStateStyle: CSSProperties = {
  color: '#4b5563',
  textAlign: 'center',
  padding: '1rem 0',
  fontStyle: 'italic',
};

export const ScenarioTabContent = () => {
  const scenarios = useSyncExternalStore(scenarioStore.subscribe, scenarioStore.getScenarios);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!newName.trim()) return;
    scenarioStore.saveScenario(newName);
    setNewName('');
  };

  const copyToClipboard = (name: string) => {
    const data = scenarios[name];
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const name = file.name.replace(/\.json$/, '').replace(/^scenario-/, '');
      scenarioStore.importFromJSON(name, content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={contentPadding}>
      {/* Save New */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New scenario name..."
          style={inputStyle}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button onClick={handleSave} style={saveButtonStyle}>+</button>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ ...saveButtonStyle, backgroundColor: '#3b82f6' }}
          title="Import from file"
        >
          📤
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </div>

      {/* List */}
      {Object.keys(scenarios).length === 0 ? (
        <div style={emptyStateStyle}>No saved states</div>
      ) : (
        Object.keys(scenarios).map((name) => (
          <div
            key={name}
            style={listItemStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.8)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.5)'; }}
          >
            <span
              style={{
                fontWeight: 500,
                color: '#d1d5db',
                cursor: 'pointer',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginRight: '0.5rem',
              }}
              onClick={() => scenarioStore.loadScenario(name)}
              title="Click to Restore"
            >
              {name}
            </span>
            <div style={{ display: 'flex', gap: '0.125rem' }}>
              <button
                onClick={() => scenarioStore.exportToFile(name)}
                style={{ ...iconButtonStyle, color: '#34d399' }}
                title="Download JSON"
              >
                📥
              </button>
              <button
                onClick={() => copyToClipboard(name)}
                style={{ ...iconButtonStyle, color: '#60a5fa' }}
                title="Copy JSON"
              >
                📋
              </button>
              <button
                onClick={() => scenarioStore.deleteScenario(name)}
                style={{ ...iconButtonStyle, color: '#f87171' }}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
