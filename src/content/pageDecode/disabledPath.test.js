import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DISABLED_GITHUB_TWO_FACTOR_URL_REGEX,
  DISABLED_LINKEDIN_MFA_URL_REGEX,
  DISABLED_OPENAI_MFA_URL_REGEX,
  DISABLED_X_MFA_URL_REGEX,
} from './disabledUrlRegex.js';

function isMfaDisabledHref(href) {
  const lower = href.toLowerCase();
  return (
    DISABLED_GITHUB_TWO_FACTOR_URL_REGEX.test(lower) ||
    DISABLED_LINKEDIN_MFA_URL_REGEX.test(lower) ||
    DISABLED_OPENAI_MFA_URL_REGEX.test(lower) ||
    DISABLED_X_MFA_URL_REGEX.test(lower)
  );
}

describe('disabledPath MFA URL regexes', () => {
  const shouldDisable = [
    'https://github.com/sessions/two-factor/app',
    'https://www.linkedin.com/mypreferences/d/two-factor-authentication/enroll',
    'https://www.linkedin.com/checkpoint/challenge/AQHIraNkTHSa2QAAAaF79CqJPXeRULArtes5X7Vc-ZdcHtbwMNeirqoBaFBvkpEhMkpXlTgr3v7VKuLRV5YH9HNjnyk0kw/?ut=05SMi0okka0sw1',
    'https://auth.openai.com/mfa-challenge/6ae04591b61c8191a90418bae4762869',
    'https://x.com/i/flow/two-factor-auth-app-enrollment',
    'https://x.com/i/jf/onboarding/web#/s/two_factor_code/r-q2d1r9',
    'https://x.com/i/jf/onboarding/web?redirect_after_login=%2Fhome&mode=login',
    'https://x.com/i/jf/onboarding/web?redirect_after_login=%2Fhome&mode=login#/s/two_factor_code/r-mon4m',
  ];

  for (const url of shouldDisable) {
    it(`disables popup for ${url.slice(0, 60)}...`, () => {
      assert.equal(isMfaDisabledHref(url), true);
    });
  }

  const shouldAllow = [
    'https://x.com/home',
    'https://github.com/login',
    'https://www.linkedin.com/feed/',
    'https://auth.openai.com/log-in',
  ];

  for (const url of shouldAllow) {
    it(`allows popup for ${url}`, () => {
      assert.equal(isMfaDisabledHref(url), false);
    });
  }
});
