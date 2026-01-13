# 🚀 React Runtime Kit

> **Dev tools that actually spark joy. ✨**
> Network telemetry, state snapshots, chaos testing, and more — for the developer who values their sanity.

---

## ✨ What's Inside?

This toolkit gives you superpowers during development:

| Feature | Description |
|---------|-------------|
| 📡 **Network Monitor** | Real-time Gantt-style timeline of all API requests |
| 🖥️ **Console Capture** | Collapsible JSON viewer for console.log/warn/error |
| 🌪️ **Chaos Mode** | Inject latency & random failures to test error handling |
| 🔄 **Request Replay** | One-click replay of any captured request |
| 💾 **State Hydrator** | Save/restore app state with named scenarios |
| 📥 **Import/Export** | Share scenarios as JSON files |
| 🔍 **Diff View** | Compare two scenarios side-by-side |
| 👻 **Ghost Keys** | Alt+Click to reveal i18n translation keys |
| 🎭 **Prop Injector** | Change component props at runtime |
| ⌨️ **Shortcuts** | Keyboard shortcuts for power users |

---

## 📦 Installation

```bash
npm install react-runtime-kit
```

---

## 🚀 Quick Start (The Easy Way)

Just drop in the DevTools component. Done.

```tsx
import { DevTools } from 'react-runtime-kit';

function App() {
  return (
    <>
      <YourAwesomeApp />
      <DevTools />
    </>
  );
}
```

That's it! Everything initializes automatically:
- Network interceptor ✅
- Console interceptor ✅
- Keyboard shortcuts ✅
- All panels ready ✅

---

## 🛠️ Manual Setup (Pick What You Need)

### 1. Initialize Interceptors

```tsx
import { initNetworkInterceptor, initConsoleInterceptor } from 'react-runtime-kit';

// Call once at app entry
initNetworkInterceptor();
initConsoleInterceptor();
```

### 2. Add Panels

```tsx
import { TelemetryPanel, ScenarioPanel } from 'react-runtime-kit';

function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <>
          <TelemetryPanel />
          <ScenarioPanel />
        </>
      )}
    </>
  );
}
```

### 3. Register State for Snapshots

```tsx
import { useScenario } from 'react-runtime-kit';

function MyComponent() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  // These will be captured in snapshots
  useScenario('user', user, setUser);
  useScenario('cart', cart, setCart);

  return <div>...</div>;
}
```

---

## 🌪️ Chaos Mode

Test your error handling without touching code:

1. Open the Telemetry panel
2. Click the "Chaos" tab
3. Toggle Chaos Mode ON
4. Adjust latency (200ms - 10000ms)
5. Set failure rate (0% - 50%)

Watch your Junior developers finally add `isLoading` states. 😈

---

## 👻 Ghost Keys (i18n Debugger)

Never hunt for translation keys again:

```tsx
import { initGhostKeys, GhostText } from 'react-runtime-kit';

// Initialize with your i18n instance
initGhostKeys(i18n);

// Wrap your translated text
<GhostText i18nKey="auth.login.title">
  {t('auth.login.title')}
</GhostText>
```

Then just **Alt+Click** (or **Option+Click** on Mac) on any text to see its key!

---

## 🎭 Prop Injector

Test component variations without code changes:

```tsx
import { withDevProps, PropPanel } from 'react-runtime-kit';

// Wrap your component
const Button = withDevProps(
  ({ disabled, variant }) => <button disabled={disabled}>{variant}</button>,
  'Button',
  { disabled: 'boolean', variant: 'string' }
);

// Add the panel
<PropPanel />
```

Now you can toggle `disabled` and change `variant` right from the panel!

---

## ⌨️ Keyboard Shortcuts

When using `<DevTools />`, these work automatically:

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Shift + T` | Toggle Telemetry Panel |
| `Cmd/Ctrl + Shift + S` | Toggle Scenarios Panel |
| `Cmd/Ctrl + Shift + P` | Toggle Props Panel |
| `Cmd/Ctrl + Shift + C` | Toggle Chaos Mode |

---

## 📖 API Reference

### Initialization

| Function | Description |
|----------|-------------|
| `initNetworkInterceptor()` | Patches `fetch` to track requests |
| `initConsoleInterceptor()` | Captures console.log/warn/error |
| `initGhostKeys(i18n)` | Enables Alt+Click i18n key reveal |

### Components

| Component | Description |
|-----------|-------------|
| `<DevTools />` | All-in-one: all panels + interceptors + shortcuts |
| `<TelemetryPanel />` | Network, Console, and Chaos tabs |
| `<ScenarioPanel />` | State snapshots with diff view |
| `<PropPanel />` | Runtime prop editing |
| `<GhostText i18nKey="..." />` | i18n key-aware text wrapper |

### Hooks

| Hook | Description |
|------|-------------|
| `useScenario(id, value, setter)` | Register state for snapshots |

### HOCs

| HOC | Description |
|-----|-------------|
| `withDevProps(Component, name, propTypes)` | Enable runtime prop injection |

### Stores

| Store | Description |
|-------|-------------|
| `telemetryStore` | Network request data |
| `consoleStore` | Captured console logs |
| `chaosStore` | Chaos mode configuration |
| `scenarioStore` | Saved state scenarios |
| `propStore` | Prop overrides registry |
| `keyboardManager` | Keyboard shortcuts |

---

## 🎨 Features

| Feature | Description |
|---------|-------------|
| **Zero Config** | Just import and go. No providers, no context, no drama. |
| **Zero Dependencies** | Pure React. No Tailwind, no CSS imports, nothing. |
| **Auto-disabled in Prod** | Interceptors do nothing outside development. |
| **Persistent Storage** | Scenarios and Chaos config survive page refreshes. |
| **Team Sharing** | Export scenarios as JSON, share with teammates. |

---

## 🤝 Philosophy

This isn't a "production monitoring solution" or an "enterprise observability platform."

It's a tiny, delightful toolkit that makes the **Code-Verify** phase of development less painful. Because that's where the real time goes.

---

## 📜 License

MIT — Do whatever you want. Have fun. Build cool stuff.

---

<p align="center">
  <strong>Made with ☕ and mass amounts of frustration debugging network requests.</strong>
</p>
