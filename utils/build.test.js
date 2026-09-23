const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');

// Run the actual build entry points with real Webpack compilations, but a tiny
// fixture config and no archive plugin so tests cannot overwrite release files.
const runner = `
  const path = require('node:path');
  const [script, scenario, directory] = process.argv.slice(1);
  const config = {
    entry: path.join(directory, scenario === 'error' ? 'missing.js' : 'entry.js'),
    output: { path: path.join(directory, 'output') },
    optimization: { minimize: false },
    plugins: [{
      apply(compiler) {
        if (scenario === 'warning') {
          compiler.hooks.thisCompilation.tap('FixtureWarning', (compilation) => {
            compilation.warnings.push(new Error('Fixture warning'));
          });
        }
        if (scenario === 'fatal') {
          compiler.hooks.beforeRun.tapAsync('FixtureFailure', (_compiler, done) => {
            done(new Error('Fixture fatal error'));
          });
        }
      }
    }]
  };
  require.cache[require.resolve('./webpack.config')] = { exports: config, loaded: true };
  require.cache[require.resolve('zip-webpack-plugin')] = {
    exports: class { apply() {} }, loaded: true
  };
  require('./utils/' + script);
`;

for (const script of ['build.js', 'buildtest.js']) {
  for (const [scenario, expectedStatus] of [
    ['success', 0],
    ['warning', 0],
    ['error', 1],
    ['fatal', 1],
  ]) {
    test(`${script}: ${scenario} exits with ${expectedStatus}`, () => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'primus-build-'));
      try {
        fs.writeFileSync(
          path.join(directory, 'entry.js'),
          'module.exports = 42;'
        );
        const result = spawnSync(
          process.execPath,
          ['-e', runner, script, scenario, directory],
          { cwd: root, encoding: 'utf8', timeout: 30000 }
        );
        assert.ifError(result.error);
        assert.equal(result.signal, null);
        assert.equal(
          result.status,
          expectedStatus,
          `${result.stdout}\n${result.stderr}`
        );
        if (scenario === 'success' || scenario === 'warning') {
          assert.ok(fs.existsSync(path.join(directory, 'output', 'main.js')));
        }
        if (scenario === 'fatal') {
          assert.match(result.stderr, /Fixture fatal error/);
        }
      } finally {
        fs.rmSync(directory, { recursive: true, force: true });
      }
    });
  }
}
