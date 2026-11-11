import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isLinkedInNomadProfileCaptureUrl,
  isLinkedInProfileUrlEquivalent,
  shouldTreatLinkedInProfileHtmlFragment,
} from './linkedinNomadValidation.js';
import { matchesTemplateId } from './templateIdUtils.js';

const TEMPLATE_ID = 'a87deb8c-32c7-41c7-ac69-60bad0e35a38';
const matches = (t) => matchesTemplateId(t, TEMPLATE_ID);

const PROFILE =
  'https://www.linkedin.com/in/test-user?isSelfProfile=true';
const PROFILE_NO_QUERY = 'https://www.linkedin.com/in/test-user/';
const PROFILE_TRAILING = 'https://www.linkedin.com/in/test-user';

describe('isLinkedInNomadProfileCaptureUrl', () => {
  it('accepts /in/ profile URLs', () => {
    assert.equal(isLinkedInNomadProfileCaptureUrl(PROFILE), true);
    assert.equal(isLinkedInNomadProfileCaptureUrl(PROFILE_NO_QUERY), true);
  });

  it('rejects login and non-profile paths', () => {
    assert.equal(
      isLinkedInNomadProfileCaptureUrl('https://www.linkedin.com/login'),
      false
    );
    assert.equal(
      isLinkedInNomadProfileCaptureUrl('https://github.com/in/foo'),
      false
    );
  });
});

describe('isLinkedInProfileUrlEquivalent', () => {
  it('allows isSelfProfile query stripping and trailing slash', () => {
    assert.equal(
      isLinkedInProfileUrlEquivalent(PROFILE, PROFILE_NO_QUERY),
      true
    );
    assert.equal(
      isLinkedInProfileUrlEquivalent(PROFILE, PROFILE_TRAILING),
      true
    );
  });

  it('rejects different handles and login redirects', () => {
    assert.equal(
      isLinkedInProfileUrlEquivalent(
        PROFILE,
        'https://www.linkedin.com/in/other-user'
      ),
      false
    );
    assert.equal(
      isLinkedInProfileUrlEquivalent(
        PROFILE,
        'https://www.linkedin.com/login?session_redirect=...'
      ),
      false
    );
  });

  it('does not treat cross-host as equivalent', () => {
    assert.equal(
      isLinkedInProfileUrlEquivalent(PROFILE, 'https://evil.com/in/test-user'),
      false
    );
  });
});

describe('shouldTreatLinkedInProfileHtmlFragment', () => {
  const fragment = '<section><div><p class="i87gpp i87ljc">Shanghai</p></div></section>';

  it('accepts profile-like fragments without html root', () => {
    assert.equal(shouldTreatLinkedInProfileHtmlFragment('', fragment), true);
    assert.equal(
      shouldTreatLinkedInProfileHtmlFragment('text/plain', fragment),
      true
    );
  });

  it('rejects JSON and empty', () => {
    assert.equal(shouldTreatLinkedInProfileHtmlFragment('', '{"a":1}'), false);
    assert.equal(shouldTreatLinkedInProfileHtmlFragment('', ''), false);
  });

});

describe('non-LinkedIn template isolation', () => {
  it('matches only LinkedIn nomad template id', () => {
    assert.equal(matches({ attTemplateID: TEMPLATE_ID }), true);
    assert.equal(
      matches({ attTemplateID: '38396d71-242d-49da-a1aa-0affc3f70eaf' }),
      false
    );
  });

  it('github URL is not a LinkedIn profile capture URL', () => {
    assert.equal(
      isLinkedInNomadProfileCaptureUrl('https://github.com/'),
      false
    );
  });
});
