// Overrides for the microsoft/react-native preset:
// - react: caret unions instead of accumulated exact pins
// - animation: the library requires Reanimated 4 (worklets, scheduleOnRN)
// - gestures: the library uses the Gesture Handler 3 hook API (usePanGesture, ...)
const react = {
  name: 'react',
  version: '^16.9.0 || ^17.0.0 || ^18.0.0 || ^19.0.0',
};
const animation = {
  name: 'react-native-reanimated',
  version: '^4.0.0',
};
const gestures = {
  name: 'react-native-gesture-handler',
  version: '^3.1.0',
};

module.exports = Object.fromEntries(
  ['0.79', '0.80', '0.81', '0.82', '0.83', '0.84', '0.85', '0.87'].map(
    (profile) => [profile, { react, animation, gestures }]
  )
);

// Dev profile: pin to the Expo SDK 57 bundled versions (Gesture Handler 3 is newer than Expo's pick)
module.exports['0.86'] = {
  react,
  animation: { name: 'react-native-reanimated', version: '~4.5.1' },
  gestures: { name: 'react-native-gesture-handler', version: '^3.2.1' },
  jest: { name: 'jest', version: '^30.0.0' },
};
