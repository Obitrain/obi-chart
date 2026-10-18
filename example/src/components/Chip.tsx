import type { FC } from 'react';
import { StyleSheet, Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import { Colors } from './theme';

export type ChipProps = { label: string; active?: boolean; onPress: () => void };

/** Toggle chip used by the demo screens' option rows. */
const Chip: FC<ChipProps> = function ({ label, active, onPress }) {
  return (
    <RectButton
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : undefined]}
    >
      <Text style={[styles.text, active ? styles.textActive : undefined]}>
        {label}
      </Text>
    </RectButton>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'hsl(0, 0%, 90%)',
  },
  chipActive: { backgroundColor: Colors.secondary },
  text: { fontSize: 13, fontWeight: '600', color: 'hsl(209, 13%, 35%)' },
  textActive: { color: Colors.white },
});

export { Chip };
