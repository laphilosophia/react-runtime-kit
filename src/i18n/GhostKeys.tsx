import type { ReactNode } from 'react';
import { createContext } from 'react';

// === TYPES ===
interface I18nInstance {
  t: (key: string, options?: Record<string, unknown>) => string;
}

interface GhostKeysContextValue {
  enabled: boolean;
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
}

// Context
const GhostKeysContext = createContext<GhostKeysContextValue | null>(null);

// === STORE ===
let globalI18nInstance: I18nInstance | null = null;
let ghostKeysEnabled = false;
const keyRegistry = new Map<HTMLElement, string>();

// === INIT FUNCTION ===
/**
 * Initialize Ghost Keys with your i18n instance
 *
 * @example
 * // With i18next
 * import i18n from './i18n';
 * initGhostKeys(i18n);
 *
 * // With react-intl (wrap intl.formatMessage)
 * initGhostKeys({ t: (key) => intl.formatMessage({ id: key }) });
 */
export function initGhostKeys(i18nInstance: I18nInstance): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  globalI18nInstance = i18nInstance;
  ghostKeysEnabled = true;

  // Listen for Alt+Click globally
  document.addEventListener('click', (e) => {
    if (!e.altKey) return;

    e.preventDefault();
    e.stopPropagation();

    // Find the closest element with a data-i18n-key
    const target = e.target as HTMLElement;
    const element = target.closest('[data-i18n-key]') as HTMLElement;

    if (element) {
      const key = element.getAttribute('data-i18n-key');
      if (key) {
        showKeyOverlay(key, element);
      }
    }
  }, true);
}

// === OVERLAY ===
function showKeyOverlay(key: string, element: HTMLElement): void {
  // Remove existing overlay
  const existing = document.getElementById('__ghost_key_overlay');
  if (existing) existing.remove();

  const rect = element.getBoundingClientRect();

  const overlay = document.createElement('div');
  overlay.id = '__ghost_key_overlay';
  overlay.style.cssText = `
    position: fixed;
    top: ${rect.bottom + 8}px;
    left: ${rect.left}px;
    z-index: 99999;
    background: rgba(17, 24, 39, 0.95);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(124, 58, 237, 0.5);
    border-radius: 0.5rem;
    padding: 0.75rem;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 0.75rem;
    color: #e5e7eb;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    max-width: 300px;
  `;

  overlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
      <span style="color: #c4b5fd; font-weight: 600;">👻 Ghost Key</span>
      <button id="__ghost_key_close" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 1rem;">✕</button>
    </div>
    <div style="background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 0.25rem; font-family: ui-monospace, monospace; word-break: break-all;">
      ${key}
    </div>
    <button id="__ghost_key_copy" style="
      margin-top: 0.5rem;
      width: 100%;
      background: #7c3aed;
      color: white;
      border: none;
      padding: 0.375rem;
      border-radius: 0.25rem;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.7rem;
    ">📋 Copy Key</button>
  `;

  document.body.appendChild(overlay);

  // Event listeners
  document.getElementById('__ghost_key_close')?.addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('__ghost_key_copy')?.addEventListener('click', () => {
    navigator.clipboard.writeText(key);
    const btn = document.getElementById('__ghost_key_copy');
    if (btn) {
      btn.textContent = '✅ Copied!';
      setTimeout(() => {
        btn.textContent = '📋 Copy Key';
      }, 1500);
    }
  });

  // Close on click outside
  setTimeout(() => {
    const closeHandler = (e: MouseEvent) => {
      if (!overlay.contains(e.target as Node)) {
        overlay.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 100);
}

// === WRAPPER FUNCTION ===
/**
 * Wrap your translation function to enable Ghost Keys
 *
 * @example
 * // Instead of: t('auth.login.title')
 * // Use: ghostT(t, 'auth.login.title')
 *
 * // Or create a helper:
 * const gt = (key: string) => ghostT(t, key);
 */
export function ghostT(
  t: (key: string, options?: Record<string, unknown>) => string,
  key: string,
  options?: Record<string, unknown>
): string {
  // In production, just return the translation
  if (process.env.NODE_ENV !== 'development' || !ghostKeysEnabled) {
    return t(key, options);
  }

  return t(key, options);
}

// === COMPONENTS ===
interface GhostTextProps {
  i18nKey: string;
  children: ReactNode;
}

/**
 * Wrapper component that adds data-i18n-key attribute
 * Use this to wrap translated text for Alt+Click inspection
 *
 * @example
 * <GhostText i18nKey="auth.login.title">
 *   {t('auth.login.title')}
 * </GhostText>
 */
export function GhostText({ i18nKey, children }: GhostTextProps): ReactNode {
  if (process.env.NODE_ENV !== 'development' || !ghostKeysEnabled) {
    return <>{children}</>;
  }

  return (
    <span data-i18n-key={i18nKey} style={{ cursor: 'help' }}>
      {children}
    </span>
  );
}

// === STATUS CHECK ===
export function isGhostKeysEnabled(): boolean {
  return ghostKeysEnabled;
}
