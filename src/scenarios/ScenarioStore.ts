type ScenarioData = Record<string, any>;

interface ScenarioNode {
  id: string;
  getter: () => any;
  setter: (value: any) => void;
}

class ScenarioStore {
  private nodes = new Map<string, ScenarioNode>();
  private listeners = new Set<() => void>();

  private snapshot: Record<string, ScenarioData> = {};

  constructor() {
    this.refreshSnapshot();
  }

  register(id: string, getter: () => any, setter: (val: any) => void): () => void {
    this.nodes.set(id, { id, getter, setter });
    return () => {
      this.nodes.delete(id);
    };
  }

  saveScenario(name: string) {
    const data: ScenarioData = {};
    this.nodes.forEach((node, id) => {
      data[id] = node.getter();
    });

    const current = this.readFromStorage();
    current[name] = data;
    localStorage.setItem('__dev_scenarios', JSON.stringify(current));
    this.refreshSnapshot();
    this.notify();
  }

  loadScenario(name: string) {
    const data = this.snapshot[name];
    if (!data) return;

    Object.keys(data).forEach((id) => {
      const node = this.nodes.get(id);
      if (node) {
        console.log(`[Scenario] Restoring ${id}...`);
        node.setter(data[id]);
      }
    });
  }

  deleteScenario(name: string) {
    const current = this.readFromStorage();
    delete current[name];
    localStorage.setItem('__dev_scenarios', JSON.stringify(current));

    this.refreshSnapshot();
    this.notify();
  }

  getScenarios = (): Record<string, ScenarioData> => {
    return this.snapshot;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  // 📥 Export scenario as downloadable JSON file
  exportToFile(name: string): void {
    const data = this.snapshot[name];
    if (!data) {
      console.warn('[Scenario] No scenario found:', name);
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario-${name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 📤 Import scenario from JSON string
  importFromJSON(name: string, jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString) as ScenarioData;
      const current = this.readFromStorage();
      current[name] = data;
      localStorage.setItem('__dev_scenarios', JSON.stringify(current));
      this.refreshSnapshot();
      this.notify();
      return true;
    } catch (e) {
      console.error('[Scenario] Failed to import:', e);
      return false;
    }
  }

  // 🔍 Compare two scenarios and return differences
  diff(name1: string, name2: string): { key: string; value1: unknown; value2: unknown }[] {
    const data1 = this.snapshot[name1] ?? {};
    const data2 = this.snapshot[name2] ?? {};

    const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);
    const differences: { key: string; value1: unknown; value2: unknown }[] = [];

    allKeys.forEach((key) => {
      const val1 = data1[key];
      const val2 = data2[key];
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push({ key, value1: val1, value2: val2 });
      }
    });

    return differences;
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private refreshSnapshot() {
    this.snapshot = this.readFromStorage();
  }

  private readFromStorage(): Record<string, ScenarioData> {
    try {
      return JSON.parse(localStorage.getItem('__dev_scenarios') || '{}');
    } catch {
      return {};
    }
  }
}

export const scenarioStore = new ScenarioStore();
