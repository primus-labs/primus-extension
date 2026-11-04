import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA_SOURCE_TAB_PLACEHOLDER_URL,
  isInjectableHttpUrl,
  openDataSourceTabAssignIdThenNavigate,
} from './openDataSourceTab.js';

describe('openDataSourceTabAssignIdThenNavigate', () => {
  it('assigns tab id before navigating to jumpTo', async () => {
    const order = [];
    const tabsApi = {
      async create({ url }) {
        order.push(`create:${url}`);
        return { id: 7 };
      },
      async update(tabId, { url }) {
        order.push(`update:${tabId}:${url}`);
      },
    };
    let assigned = null;
    const jumpTo = 'https://app.hyperliquid.xyz/join/PRIMUSLABS';
    const id = await openDataSourceTabAssignIdThenNavigate(
      jumpTo,
      (tabId) => {
        assigned = tabId;
        order.push(`assign:${tabId}`);
      },
      tabsApi
    );
    assert.equal(id, 7);
    assert.equal(assigned, 7);
    assert.equal(DATA_SOURCE_TAB_PLACEHOLDER_URL, 'about:blank');
    assert.deepEqual(order, [
      'create:about:blank',
      'assign:7',
      `update:7:${jumpTo}`,
    ]);
  });

  it('waits until the committed url is http(s) before returning', async () => {
    assert.equal(isInjectableHttpUrl('about:blank'), false);
    assert.equal(
      isInjectableHttpUrl('https://app.hyperliquid.xyz/join/PRIMUSLABS'),
      true
    );
    const jumpTo = 'https://app.hyperliquid.xyz/join/PRIMUSLABS';
    let reads = 0;
    const tabsApi = {
      async create() {
        return { id: 7 };
      },
      async update() {},
      async get() {
        reads += 1;
        return reads < 2 ? { url: 'about:blank' } : { url: jumpTo };
      },
    };
    const id = await openDataSourceTabAssignIdThenNavigate(
      jumpTo,
      () => {},
      tabsApi,
      { navigationTimeoutMs: 500 }
    );
    assert.equal(id, 7);
    assert.equal(reads, 2);
  });
});
