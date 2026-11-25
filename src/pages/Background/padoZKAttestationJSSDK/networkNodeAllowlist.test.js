import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectHostsFromNodeInfoRows,
  isHostAllowed,
  normalizeHost,
  parseWssHost,
  validateNetworkAlgoApis,
} from './networkAlgoApiValidate.js';

describe('networkNodeAllowlist', () => {
  it('normalizeHost trims and lowercases', () => {
    assert.equal(normalizeHost('  API.Example.COM:443  '), 'api.example.com:443');
    assert.equal(normalizeHost(''), '');
  });

  it('parseWssHost extracts host with default port 443', () => {
    assert.equal(
      parseWssHost('wss://node.example.com/algorithm'),
      'node.example.com:443'
    );
    assert.equal(
      parseWssHost('wss://node.example.com:8443/algorithm'),
      'node.example.com:8443'
    );
    assert.equal(parseWssHost('https://evil.com/x'), null);
    assert.equal(parseWssHost('javascript:alert(1)'), null);
  });

  it('isHostAllowed matches host with or without :443', () => {
    const set = new Set(['registered.node:443']);
    assert.equal(isHostAllowed('registered.node:443', set), true);
    assert.equal(isHostAllowed('registered.node', set), true);
    assert.equal(isHostAllowed('evil.node:443', set), false);
  });

  it('validateNetworkAlgoApis requires matching registered hosts', () => {
    const allowed = new Set(['good.node:443']);
    const goodApis = [
      'wss://good.node/algorithm',
      'wss://good.node/algorithm-proxy',
      'wss://good.node/algoproxy',
    ];
    assert.deepEqual(validateNetworkAlgoApis(goodApis, 'proxytls', allowed), {
      ok: true,
    });
    assert.deepEqual(validateNetworkAlgoApis(goodApis, 'mpctls', allowed), {
      ok: true,
    });

    const badApis = [
      'wss://evil.node/algorithm',
      'wss://evil.node/algorithm-proxy',
      'wss://evil.node/algoproxy',
    ];
    const bad = validateNetworkAlgoApis(badApis, 'proxytls', allowed);
    assert.equal(bad.ok, false);
    assert.match(bad.reason, /registered network nodes/);
  });

  it('validates the endpoint selected by algorithmType', () => {
    const allowed = new Set(['good.node:443']);
    const missingProxyTls = validateNetworkAlgoApis(
      ['wss://good.node/algorithm', '', 'wss://good.node/algoproxy'],
      'proxytls',
      allowed
    );
    assert.equal(missingProxyTls.ok, false);

    const invalidProxyTls = validateNetworkAlgoApis(
      [
        'wss://good.node/algorithm',
        'https://good.node/algorithm-proxy',
        'wss://good.node/algoproxy',
      ],
      'proxytls',
      allowed
    );
    assert.equal(invalidProxyTls.ok, false);

    const unsupported = validateNetworkAlgoApis(
      [
        'wss://good.node/algorithm',
        'wss://good.node/algorithm-proxy',
        'wss://good.node/algoproxy',
      ],
      'unknown',
      allowed
    );
    assert.equal(unsupported.ok, false);
    assert.match(unsupported.reason, /Unsupported/);
  });

  it('collectHostsFromNodeInfoRows keeps only status registered', () => {
    const hosts = collectHostsFromNodeInfoRows([
      { status: 0, urls: ['bad.host:443'] },
      { status: 1, urls: ['good.host:443', 'Good.Host:443'] },
    ]);
    assert.deepEqual([...hosts].sort(), ['good.host:443']);
  });
});