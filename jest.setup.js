// Pin the timezone so date bucketing tests behave the same on every machine
process.env.TZ = 'UTC';

require('react-native-reanimated').setUpTests();
