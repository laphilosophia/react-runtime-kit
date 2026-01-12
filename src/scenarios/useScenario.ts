import { useEffect, useRef } from 'react';
import { scenarioStore } from './ScenarioStore.js';

export function useScenario<T>(id: string, value: T, setter: (val: T) => void) {
  const valueRef = useRef(value);
  const setterRef = useRef(setter);

  useEffect(() => {
    valueRef.current = value;
    setterRef.current = setter;
  }, [value, setter]);

  useEffect(() => {
    const unregister = scenarioStore.register(
      id,
      () => valueRef.current,
      (val: T) => setterRef.current(val)
    );

    return unregister;
  }, [id]);
}
