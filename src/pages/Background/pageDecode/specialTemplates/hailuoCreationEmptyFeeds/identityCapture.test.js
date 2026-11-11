import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATE_ID_HAILUO_CREATION } from './constants.js';
import { shouldCaptureHailuoIdentityLookupRequest } from './feedsEmpty.js';

const LOOKUP_URL =
  'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=test';

describe('shouldCaptureHailuoIdentityLookupRequest', () => {
  const hailuoTemplate = { attTemplateID: TEMPLATE_ID_HAILUO_CREATION };

  it('returns true for hailuo template and lookup URL', () => {
    assert.equal(
      shouldCaptureHailuoIdentityLookupRequest(hailuoTemplate, LOOKUP_URL),
      true
    );
  });

  it('returns false for wrong template', () => {
    assert.equal(
      shouldCaptureHailuoIdentityLookupRequest(
        { attTemplateID: 'other-template' },
        LOOKUP_URL
      ),
      false
    );
  });

  it('returns false for non-lookup URL on hailuo template', () => {
    assert.equal(
      shouldCaptureHailuoIdentityLookupRequest(
        hailuoTemplate,
        'https://example.com/v1/accounts:lookup'
      ),
      false
    );
  });
});
