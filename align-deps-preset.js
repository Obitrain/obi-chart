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
  ['0.79', '0.80', '0.81', '0.82', '0.84', '0.85'].map((profile) => [
    profile,
    { react, animation },
  ])
);

// Keep the dev profile's tilde pin so devDependencies stay on 4.2.x
module.exports['0.83'] = {
  react,
  animation: { name: 'react-native-reanimated', version: '~4.2.0' },
};
