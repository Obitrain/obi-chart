import { useCallback, useEffect, useState } from 'react';
import { Dimensions, type ScaledSize } from 'react-native';

function useDimensions(dim: 'window' | 'screen' = 'window') {
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get(dim));

  const onChange = useCallback(
    ({ screen, window }: { window: ScaledSize; screen: ScaledSize }) => {
      setDimensions(dim === 'screen' ? screen : window);
    },
    [dim]
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', onChange);

    return () => {
      if (typeof subscription?.remove === 'function') subscription.remove();
    };
  }, [onChange]);

  return dimensions;
}

export { useDimensions };
