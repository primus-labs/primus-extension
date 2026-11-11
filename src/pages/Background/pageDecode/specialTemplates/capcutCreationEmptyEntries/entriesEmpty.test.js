import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isEntriesEmpty } from './entriesEmpty.js';
import { tryPatchAlgorithmParamsForCapcutCreationEmptyEntries } from './patchAlgorithmParams.js';

describe('isEntriesEmpty', () => {
  it('returns true for empty entries array', () => {
    assert.equal(
      isEntriesEmpty({ data: { entries: [] } }),
      true
    );
  });

  it('returns true for null entries', () => {
    assert.equal(
      isEntriesEmpty({ data: { entries: null } }),
      true
    );
  });

  it('returns true when entries key is missing', () => {
    assert.equal(isEntriesEmpty({ data: {} }), true);
  });

  it('returns false when entries has items', () => {
    assert.equal(
      isEntriesEmpty({ data: { entries: [{ format: 'video' }] } }),
      false
    );
  });
});

describe('tryPatchAlgorithmParamsForCapcutCreationEmptyEntries', () => {
  it('does not patch when mode flag is false', () => {
    const params = {
      host: 'cloudspace-normal.capcutapi.com',
      requests: [{ url: 'a' }],
      responses: [{ x: 1 }],
    };
    tryPatchAlgorithmParamsForCapcutCreationEmptyEntries(
      params,
      { id: 'abf3b33d-06cc-453d-8a90-927d4e2827ba' },
      { capcutCreationEmptyEntriesMode: false }
    );
    assert.equal(params.host, 'cloudspace-normal.capcutapi.com');
    assert.equal(params.requests.length, 1);
  });

  it('replaces requests/responses when empty entries mode is active', () => {
    const params = {
      host: 'cloudspace-normal.capcutapi.com',
      requests: [{ url: 'query' }],
      responses: [{ x: 1 }],
    };
    tryPatchAlgorithmParamsForCapcutCreationEmptyEntries(
      params,
      { id: 'abf3b33d-06cc-453d-8a90-927d4e2827ba' },
      {
        capcutCreationEmptyEntriesMode: true,
        capcutEverPhotoTokenRequestId: 'rid-1',
        requestsMap: {
          'rid-1': {
            url: 'https://edit-api-sg.capcut.com/cc/v1/workspace/get_ever_photo_token',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {},
          },
        },
      }
    );
    assert.equal(params.host, 'edit-api-sg.capcut.com');
    assert.equal(params.requests.length, 1);
    assert.equal(params.responses.length, 1);
    assert.equal(
      params.responses[0].conditions.subconditions[0].reveal_id,
      'userId'
    );
  });
});
