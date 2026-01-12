type ShortcutCallback = () => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: ShortcutCallback;
  description: string;
}

class KeyboardManager {
  private shortcuts: Map<string, Shortcut> = new Map();
  private enabled = true;

  constructor() {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      this.init();
    }
  }

  private init(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private getShortcutId(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    // Ignore if typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const id = this.getShortcutId(e);
    const shortcut = this.shortcuts.get(id);

    if (shortcut) {
      e.preventDefault();
      shortcut.callback();
    }
  }

  /**
   * Register a keyboard shortcut
   *
   * @example
   * keyboardManager.register({
   *   key: 't',
   *   ctrl: true,
   *   shift: true,
   *   callback: () => toggleTelemetry(),
   *   description: 'Toggle Telemetry Panel'
   * });
   */
  register(shortcut: Shortcut): () => void {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.shift) parts.push('shift');
    parts.push(shortcut.key.toLowerCase());

    const id = parts.join('+');
    this.shortcuts.set(id, shortcut);

    return () => {
      this.shortcuts.delete(id);
    };
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  getShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  formatShortcut(shortcut: Shortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('⌘');
    if (shortcut.alt) parts.push('⌥');
    if (shortcut.shift) parts.push('⇧');
    parts.push(shortcut.key.toUpperCase());
    return parts.join('');
  }
}

export const keyboardManager = new KeyboardManager();

/**
 * Hook to register keyboard shortcuts
 *
 * @example
 * useKeyboardShortcut({
 *   key: 't',
 *   ctrl: true,
 *   shift: true,
 *   callback: () => setIsOpen(!isOpen),
 *   description: 'Toggle Panel'
 * });
 */
export function useKeyboardShortcut(shortcut: Shortcut): void {
  if (process.env.NODE_ENV !== 'development') return;

  // Register on import (not a hook, but works for static registration)
  keyboardManager.register(shortcut);
}

// === DEFAULT SHORTCUTS ===
// These will be registered when the DevTools component is used

export const DEFAULT_SHORTCUTS = {
  toggleTelemetry: { key: 't', ctrl: true, shift: true, description: 'Toggle Telemetry' },
  toggleScenarios: { key: 's', ctrl: true, shift: true, description: 'Toggle Scenarios' },
  toggleChaos: { key: 'c', ctrl: true, shift: true, description: 'Toggle Chaos Mode' },
  toggleProps: { key: 'p', ctrl: true, shift: true, description: 'Toggle Prop Panel' },
} as const;
