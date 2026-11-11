import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATE_ID_CAPCUT_CREATION } from './capcutCreationEmptyEntries/constants.js';
import {
  isCapcutLibraryJumpTargetUrl,
  shouldUseCapcutLibraryJumpNavigation,
} from './specialTemplateCapcutLibraryJump.js';

const TARGET = 'https://www.capcut.com/library/creatives';

describe('isCapcutLibraryJumpTargetUrl', () => {
  it('accepts exact and subpath match', () => {
    assert.equal(isCapcutLibraryJumpTargetUrl(TARGET, TARGET), true);
    assert.equal(
      isCapcutLibraryJumpTargetUrl(
        'https://www.capcut.com/library/creatives?foo=1',
        TARGET
      ),
      true
    );
  });

  it('rejects my-edit', () => {
    assert.equal(
      isCapcutLibraryJumpTargetUrl('https://www.capcut.com/my-edit', TARGET),
      false
    );
  });
});

describe('shouldUseCapcutLibraryJumpNavigation', () => {
  const template = { attTemplateID: TEMPLATE_ID_CAPCUT_CREATION };

  it('enables for capcut library creatives target', () => {
    assert.equal(shouldUseCapcutLibraryJumpNavigation(template, TARGET), true);
  });

  it('skips other templates', () => {
    assert.equal(
      shouldUseCapcutLibraryJumpNavigation({ attTemplateID: 'other' }, TARGET),
      false
    );
  });

  it('skips non-library href for capcut template', () => {
    assert.equal(
      shouldUseCapcutLibraryJumpNavigation(
        template,
        'https://www.capcut.com/login'
      ),
      false
    );
  });
});
