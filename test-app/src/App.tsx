import { useEffect, useState } from 'react';
import { DevTools, withDevProps } from 'react-runtime-kit';
import './App.css';

// Test component with dev props
const TestButton = withDevProps(
  ({ label, disabled, count }: { label: string; disabled: boolean; count: number }) => (
    <button disabled={disabled} style={{ padding: '10px 20px', fontSize: '16px' }}>
      {label} ({count})
    </button>
  ),
  'TestButton',
  { label: 'string', disabled: 'boolean', count: 'number' }
)

function App() {
  const [count, setCount] = useState(0)
  const [data, setData] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Test console output
  useEffect(() => {
    console.log('App mounted!')
    console.info('Info message')
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/todos/1')
      const json = await response.json()
      setData(json.title)
      console.log('Fetched:', json)
    } catch (error) {
      console.error('Fetch failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h1>🧪 React Runtime Kit Test</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>Counter Test</h2>
        <p>Count: {count}</p>
        <button onClick={() => setCount(c => c + 1)}>Increment</button>
        <button onClick={() => setCount(0)} style={{ marginLeft: '10px' }}>Reset</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Network Test</h2>
        <button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
        {data && <p>Result: {data}</p>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>PropInjector Test</h2>
        <TestButton label="Click Me" disabled={false} count={count} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Console Test</h2>
        <button onClick={() => console.log('Log message')}>Log</button>
        <button onClick={() => console.warn('Warning!')} style={{ marginLeft: '10px' }}>Warn</button>
        <button onClick={() => console.error('Error!')} style={{ marginLeft: '10px' }}>Error</button>
      </div>

      {/* Unified DevTools - single tabbed panel! */}
      <DevTools position="bottom-left" defaultCollapsed={false} />
    </div>
  )
}

export default App
