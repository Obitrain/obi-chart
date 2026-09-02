import { useRoute } from '@react-navigation/native';
import { useEffect, useRef } from 'react';

export type DemoStep = {
  /** Milliseconds after the screen mounted. */
  at: number;
  run: () => void;
};

// Plays `steps` when the screen is opened with `?demo=1` (see bin/capture-gifs.sh).
export function useDemo(steps: DemoStep[]) {
  const route = useRoute();
  const enabled =
    (route.params as { demo?: string } | undefined)?.demo !== undefined;
  const stepsRef = useRef(steps);

  useEffect(() => {
    stepsRef.current = steps;
  });

  useEffect(() => {
    if (!enabled) return;
    // Handlers are read at fire time so re-renders keep the latest closures.
    const timers = stepsRef.current.map(({ at }, i) =>
      setTimeout(() => stepsRef.current[i]?.run(), at)
    );
    return () => timers.forEach(clearTimeout);
  }, [enabled]);
}
