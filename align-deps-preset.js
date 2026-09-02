// Overrides for the microsoft/react-native preset:
// - react: caret unions instead of accumulated exact pins
// - animation: the library requires Reanimated 4 (worklets, scheduleOnRN)
const react = {
  name: 'react',
  version: '^16.9.0 || ^17.0.0 || ^18.0.0 || ^19.0.0',
};
const animation = {
  name: 'react-native-reanimated',
  version: '^4.0.0',
};

module.exports = Object.fromEntries(
  ['0.79', '0.80', '0.81', '0.82', '0.83', '0.84', '0.85', '0.87'].map(
    (profile) => [profile, { react, animation }]
  )
);

// Dev profile: pin to the Expo SDK 57 bundled versions
module.exports['0.86'] = {
  react,
  animation: { name: 'react-native-reanimated', version: '~4.5.1' },
  gestures: { name: 'react-native-gesture-handler', version: '~2.32.0' },
};
