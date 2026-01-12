import type { CSSProperties } from 'react';
import { useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '../components/ui/button.js';
import { scenarioStore } from './ScenarioStore.js';

// Styles
const panelStyle: CSSProperties = {
  position: 'fixed',
  bottom: '1rem',
  left: '30rem',
  width: '20rem',
  maxHeight: '450px',
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
  backgroundColor: active ? 'rgba(124, 58, 237, 0.3)' : 'transparent',
  color: active ? '#c4b5fd' : '#9ca3af',
  transition: 'all 0.15s',
});

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

type TabType = 'list' | 'diff';

// === LIST TAB ===
const ListTab = ({
  scenarios,
  onSelect,
}: {
  scenarios: Record<string, unknown>;
  onSelect: (name: string) => void;
}) => {
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
    <>
      {/* Save New */}
      <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(75, 85, 99, 0.4)', display: 'flex', gap: '0.25rem' }}>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {Object.keys(scenarios).length === 0 && (
          <div style={{ color: '#4b5563', textAlign: 'center', padding: '1rem 0', fontStyle: 'italic' }}>
            No saved states
          </div>
        )}
        {Object.keys(scenarios).map((name) => (
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
                onClick={() => onSelect(name)}
                style={{ ...iconButtonStyle, color: '#a78bfa' }}
                title="Select for Diff"
              >
                🔍
              </button>
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
        ))}
      </div>
    </>
  );
};

// === DIFF TAB ===
const DiffTab = ({
  selected,
  scenarios,
  onClear,
}: {
  selected: string[];
  scenarios: Record<string, unknown>;
  onClear: () => void;
}) => {
  if (selected.length < 2) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
        <div style={{ marginBottom: '0.5rem' }}>🔍 Select 2 scenarios to compare</div>
        <div style={{ fontSize: '0.65rem', color: '#4b5563' }}>
          Use the 🔍 button on each scenario
        </div>
        {selected.length === 1 && (
          <div style={{ marginTop: '0.75rem', color: '#c4b5fd' }}>
            Selected: <strong>{selected[0]}</strong>
            <br />
            <span style={{ fontSize: '0.65rem' }}>Now select one more...</span>
          </div>
        )}
      </div>
    );
  }

  const differences = scenarioStore.diff(selected[0]!, selected[1]!);

  return (
    <div style={{ padding: '0.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
        padding: '0.375rem',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderRadius: '0.25rem',
      }}>
        <div style={{ fontSize: '0.65rem', color: '#c4b5fd' }}>
          <strong>{selected[0]}</strong> vs <strong>{selected[1]}</strong>
        </div>
        <button
          onClick={onClear}
          style={{ ...iconButtonStyle, color: '#6b7280', fontSize: '0.7rem' }}
        >
          Clear
        </button>
      </div>

      {/* Diff Results */}
      {differences.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#4ade80' }}>
          ✅ No differences found
        </div>
      ) : (
        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
          {differences.map((diff) => (
            <div
              key={diff.key}
              style={{
                padding: '0.5rem',
                marginBottom: '0.25rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '0.25rem',
                borderLeft: '3px solid #ef4444',
              }}
            >
              <div style={{ fontWeight: 700, color: '#e5e7eb', marginBottom: '0.25rem' }}>
                {diff.key}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f87171', marginBottom: '0.125rem' }}>- {selected[0]}</div>
                  <code style={{
                    display: 'block',
                    padding: '0.25rem',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: '0.125rem',
                    color: '#fca5a5',
                    wordBreak: 'break-all',
                  }}>
                    {JSON.stringify(diff.value1)}
                  </code>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#4ade80', marginBottom: '0.125rem' }}>+ {selected[1]}</div>
                  <code style={{
                    display: 'block',
                    padding: '0.25rem',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: '0.125rem',
                    color: '#86efac',
                    wordBreak: 'break-all',
                  }}>
                    {JSON.stringify(diff.value2)}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// === MAIN PANEL ===
export const ScenarioPanel = () => {
  const scenarios = useSyncExternalStore(
    (cb) => scenarioStore.subscribe(cb),
    () => scenarioStore.getScenarios()
  );

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [diffSelection, setDiffSelection] = useState<string[]>([]);

  const handleSelectForDiff = (name: string) => {
    if (diffSelection.includes(name)) return;
    const newSelection = [...diffSelection, name].slice(-2);
    setDiffSelection(newSelection);
    if (newSelection.length === 2) {
      setActiveTab('diff');
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        style={{ position: 'fixed', bottom: '1rem', left: '7.5rem', zIndex: 50 }}
      >
        <span style={{ fontWeight: 700 }}>Scenarios</span>
        {Object.keys(scenarios).length > 0 && (
          <span style={{
            fontSize: '0.625rem',
            backgroundColor: 'rgba(124, 58, 237, 0.4)',
            padding: '0 0.375rem',
            borderRadius: '0.25rem',
            color: '#c4b5fd',
          }}>
            {Object.keys(scenarios).length}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, color: '#c4b5fd' }}>State Hydrator</span>
        <button
          onClick={() => setIsOpen(false)}
          style={{ ...iconButtonStyle, color: '#6b7280' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={tabsStyle}>
        <button
          style={tabStyle(activeTab === 'list')}
          onClick={() => setActiveTab('list')}
        >
          📋 List ({Object.keys(scenarios).length})
        </button>
        <button
          style={{
            ...tabStyle(activeTab === 'diff'),
            color: diffSelection.length > 0 && activeTab !== 'diff' ? '#a78bfa' : undefined,
          }}
          onClick={() => setActiveTab('diff')}
        >
          🔍 Diff {diffSelection.length > 0 && `(${diffSelection.length})`}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'list' && (
          <ListTab scenarios={scenarios} onSelect={handleSelectForDiff} />
        )}
        {activeTab === 'diff' && (
          <DiffTab
            selected={diffSelection}
            scenarios={scenarios}
            onClear={() => setDiffSelection([])}
          />
        )}
      </div>
    </div>
  );
};
