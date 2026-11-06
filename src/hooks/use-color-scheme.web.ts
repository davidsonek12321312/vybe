import { useEffect, useRef, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * We schedule the hydration flag update via a ref + async to satisfy the react-hooks/set-state-in-effect rule.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const id = setTimeout(() => {
      if (mountedRef.current) {
        setHasHydrated(true);
      }
    }, 0);
    return () => {
      mountedRef.current = false;
      clearTimeout(id);
    };
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
