const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'worklets-babel-'));
try {
  const filename = path.join(directory, 'sample.js');
  fs.writeFileSync(filename, 'function sample() { "worklet"; return 42; }');
  const { code } = babel.transformFileSync(filename, {
    configFile: false,
    babelrc: false,
    plugins: [require('react-native-worklets/plugin')],
  });
  const sample = vm.runInNewContext(`${code}; sample;`, { global: { Error } });
  assert.equal(typeof sample.__workletHash, 'number');
  assert.equal(sample(), 42);
  console.log(`Worklet transformation passed with Babel ${babel.version}`);
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
