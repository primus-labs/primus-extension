import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TEMPLATE_ID,
  matches,
  describeUrlMatchForRequests,
  shouldLogUrlProbeForRequest,
} from './specialTemplateGoogleEmail.js';

const GOOGLE_DOC =
  'https://myaccount.google.com/?utm_source=chrome-profile-chooser&pli=1';

describe('Google email template debug helpers', () => {
  it('matches template id', () => {
    assert.equal(matches({ attTemplateID: TEMPLATE_ID }), true);
    assert.equal(matches({ attTemplateID: 'other' }), false);
  });

  it('describeUrlMatchForRequests shows REGX failure for unescaped query in pattern', () => {
    const requests = [
      {
        url: GOOGLE_DOC,
        urlType: 'REGX',
        method: 'GET',
        needCapture: true,
      },
    ];
    const slots = describeUrlMatchForRequests(GOOGLE_DOC, requests);
    assert.equal(slots[0].exactUrlEqual, true);
    assert.equal(slots[0].matched, true);
    assert.equal(slots[0].regxDirectMatch, false);
  });

  it('shouldLogUrlProbeForRequest limits to myaccount host', () => {
    assert.equal(shouldLogUrlProbeForRequest(GOOGLE_DOC), true);
    assert.equal(
      shouldLogUrlProbeForRequest('https://www.google.com/'),
      false
    );
  });
});
