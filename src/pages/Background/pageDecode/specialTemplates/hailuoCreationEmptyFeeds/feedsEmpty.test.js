import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isCreationFeedsEmpty } from './feedsEmpty.js';
import { tryPatchAlgorithmParamsForHailuoCreationEmptyFeeds } from './patchAlgorithmParams.js';

describe('isCreationFeedsEmpty', () => {
  it('returns true for empty feeds array', () => {
    assert.equal(
      isCreationFeedsEmpty({ data: { feeds: [] } }),
      true
    );
  });

  it('returns true for null feeds', () => {
    assert.equal(
      isCreationFeedsEmpty({ data: { feeds: null } }),
      true
    );
  });

  it('returns true when feeds key is missing', () => {
    assert.equal(isCreationFeedsEmpty({ data: {} }), true);
  });

  it('returns false when feeds has items', () => {
    assert.equal(
      isCreationFeedsEmpty({ data: { feeds: [{ feedType: 1 }] } }),
      false
    );
  });
});

describe('tryPatchAlgorithmParamsForHailuoCreationEmptyFeeds', () => {
  it('does not patch when mode flag is false', () => {
    const params = {
      host: 'hailuoai.video',
      requests: [{ url: 'a' }],
      responses: [{ x: 1 }],
    };
    tryPatchAlgorithmParamsForHailuoCreationEmptyFeeds(
      params,
      { id: 'b67a9894-f3b3-4fd2-ba32-0097e83d4514' },
      { hailuoCreationEmptyFeedsMode: false }
    );
    assert.equal(params.host, 'hailuoai.video');
    assert.equal(params.requests.length, 1);
  });

  it('replaces requests/responses when empty feeds mode is active', () => {
    const params = {
      host: 'hailuoai.video',
      requests: [{ url: 'creation' }],
      responses: [{ x: 1 }],
    };
    tryPatchAlgorithmParamsForHailuoCreationEmptyFeeds(
      params,
      { id: 'b67a9894-f3b3-4fd2-ba32-0097e83d4514' },
      {
        hailuoCreationEmptyFeedsMode: true,
        hailuoIdentityLookupRequestId: 'rid-1',
        requestsMap: {
          'rid-1': {
            url: 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=x',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { foo: 1 },
          },
        },
      }
    );
    assert.equal(params.host, 'identitytoolkit.googleapis.com');
    assert.equal(params.requests.length, 1);
    assert.equal(params.responses.length, 1);
    assert.equal(
      params.responses[0].conditions.subconditions[0].reveal_id,
      'userName'
    );
  });
});
