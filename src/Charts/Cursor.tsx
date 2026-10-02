import { Circle, type PathCommand } from 'react-native-skia';
import { useEffect, type FC } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { commandsToBezier, getYForXOnBeziers } from './maths';

const CURSOR_SIZE = 10;

export type CursorProps = {
  commands?: SharedValue<PathCommand[]>;
  positionX: SharedValue<number>;
  size?: number;
  color?: string;
  /** When set, draws a ring of this color around the cursor. */
  strokeColor?: string;
  strokeWidth?: number;
  currentValue?: SharedValue<number> | SharedValue<number | undefined>;
  translateY?: SharedValue<number | undefined>;
};

const Cursor: FC<CursorProps> = function ({
  commands,
  positionX,
  color,
  strokeColor,
  strokeWidth = 2,
  currentValue,
  translateY,
  size = CURSOR_SIZE,
}) {
  const conflictingProps = currentValue !== undefined && translateY !== undefined;
  useEffect(() => {
    if (conflictingProps)
      console.warn('currentValue has no effect when translateY is set');
  }, [conflictingProps]);

  // Normalized once per path change, not on every cursor move
  const beziers = useDerivedValue(() => {
    const _commands = commands?.value;
    return _commands === undefined ? undefined : commandsToBezier(_commands);
  });

  const derivedTranslateY = useDerivedValue(() => {
    const _beziers = beziers.value;
    if (_beziers === undefined) {
      return 0;
    }
    const _value = getYForXOnBeziers(_beziers, positionX.value) ?? 0;
    if (translateY === undefined && currentValue !== undefined) {
      currentValue.value = _value;
    }
    return _value;
  });

  const _translateY = translateY ?? derivedTranslateY;

  const transform = useDerivedValue(() => [
    { translateX: positionX.value },
    { translateY: _translateY.value ?? 0 },
  ]);
  return (
    <>
      <Circle transform={transform} cx={0} cy={0} r={size} color={color} />
      {strokeColor !== undefined ? (
        <Circle
          transform={transform}
          cx={0}
          cy={0}
          r={size}
          color={strokeColor}
          style="stroke"
          strokeWidth={strokeWidth}
        />
      ) : null}
    </>
  );
};

export { Cursor };
