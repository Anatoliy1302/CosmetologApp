import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useAsyncFocus(loadFn, deps = []) {
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.resolve(loadFn(() => active))
        .then(() => {
          if (active) setLoading(false);
        })
        .catch(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }, deps)
  );

  return { loading, setLoading };
}
