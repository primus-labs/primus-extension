import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jp from 'jsonpath';
import { truncateJsonPathAtUnreachable } from './truncateJsonPathAtUnreachable.js';

const SPEND_PATH = '$.dailySpend[0].totalTokens';

describe('truncateJsonPathAtUnreachable', () => {
  it('truncates {} to $ before dailySpend', () => {
    const { path, truncated } = truncateJsonPathAtUnreachable(SPEND_PATH, {});
    assert.equal(truncated, true);
    assert.equal(path, '$');
    assert.ok(jp.query({}, path).length > 0);
  });

  it('truncates empty dailySpend array to $.dailySpend', () => {
    const { path, truncated } = truncateJsonPathAtUnreachable(SPEND_PATH, {
      dailySpend: [],
    });
    assert.equal(truncated, true);
    assert.equal(path, '$.dailySpend');
  });

  it('does not truncate when totalTokens exists', () => {
    const root = { dailySpend: [{ totalTokens: 1 }] };
    const { path, truncated } = truncateJsonPathAtUnreachable(SPEND_PATH, root);
    assert.equal(truncated, false);
    assert.equal(path, SPEND_PATH);
  });

  it('truncates when dailySpend is null', () => {
    const { path, truncated } = truncateJsonPathAtUnreachable(SPEND_PATH, {
      dailySpend: null,
    });
    assert.equal(truncated, true);
    assert.equal(path, '$.dailySpend');
  });
});

const ASSET_TYPE_PATH = '$.data.asset_list[*].type';

describe('truncateJsonPathAtUnreachable wildcard [*]', () => {
  it('truncates to asset_list when array is empty', () => {
    const root = { data: { asset_list: [] } };
    const { path, truncated } = truncateJsonPathAtUnreachable(
      ASSET_TYPE_PATH,
      root
    );
    assert.equal(truncated, true);
    assert.equal(path, '$.data.asset_list');
    assert.ok(jp.query(root, path).length > 0);
  });

  it('truncates to asset_list when null', () => {
    const root = { data: { asset_list: null } };
    const { path, truncated } = truncateJsonPathAtUnreachable(
      ASSET_TYPE_PATH,
      root
    );
    assert.equal(truncated, true);
    assert.equal(path, '$.data.asset_list');
  });

  it('does not truncate when asset_list has items', () => {
    const root = { data: { asset_list: [{ type: 1 }, { type: 2 }] } };
    const { path, truncated } = truncateJsonPathAtUnreachable(
      ASSET_TYPE_PATH,
      root
    );
    assert.equal(truncated, false);
    assert.equal(path, ASSET_TYPE_PATH);
  });
});
