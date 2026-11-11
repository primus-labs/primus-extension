import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classNameMatchesSubstring,
  classListHaystackIncludesAll,
  isElementVisiblyPresent,
  hasVisibleHailuoFixedSection,
  hasVisibleDreaminaModalDiv,
  isHostOverlayVisiblyPresent,
  DREAMINA_HOST_OVERLAY_CLASS_MARKERS,
} from './domDetect.js';
import {
  TEMPLATE_ID_DREAMINA,
  TEMPLATE_ID_HAILUO_CREATION,
} from './templateIds.js';

/**
 * @param {string} tag
 * @param {string[]} classList
 * @param {{ width?: number; height?: number; connected?: boolean }} [opts]
 */
function mockEl(tag, classList, opts = {}) {
  const { width = 100, height = 24, connected = true } = opts;
  return {
    tagName: tag.toUpperCase(),
    classList,
    isConnected: connected,
    getBoundingClientRect: () => ({ width, height }),
  };
}

/**
 * @param {{ sections?: unknown[]; divs?: unknown[] }} groups
 */
function mockDoc(groups) {
  return {
    querySelectorAll(selector) {
      if (selector === 'section') {
        return groups.sections ?? [];
      }
      if (typeof selector === 'string' && selector.includes('zoomModal-enter-done')) {
        return (groups.divs ?? []).filter((el) =>
          classListHaystackIncludesAll(el, DREAMINA_HOST_OVERLAY_CLASS_MARKERS)
        );
      }
      if (selector === 'div') {
        return groups.divs ?? [];
      }
      return [];
    },
  };
}

describe('hostOverlayHide domDetect', () => {
  it('classNameMatchesSubstring matches token substring', () => {
    const el = mockEl('section', ['panel-fixed-top']);
    assert.equal(classNameMatchesSubstring(el, 'fixed'), true);
    assert.equal(classNameMatchesSubstring(el, 'modal'), false);
  });

  it('isElementVisiblyPresent requires size and connection', () => {
    assert.equal(
      isElementVisiblyPresent(mockEl('div', ['x'], { width: 0 })),
      false
    );
    assert.equal(
      isElementVisiblyPresent(mockEl('div', ['x'], { connected: false })),
      false
    );
    assert.equal(isElementVisiblyPresent(mockEl('div', ['modal-wrap'])), true);
  });

  it('hasVisibleHailuoFixedSection detects visible section with fixed in class', () => {
    const doc = mockDoc({
      sections: [
        mockEl('section', ['other']),
        mockEl('section', ['host-fixed-overlay']),
      ],
    });
    assert.equal(hasVisibleHailuoFixedSection(doc), true);
    assert.equal(
      hasVisibleHailuoFixedSection(mockDoc({ sections: [mockEl('section', ['foo'])] })),
      false
    );
  });

  it('hasVisibleDreaminaModalDiv requires modal+center+zoomModal-enter-done', () => {
    const doc = mockDoc({
      divs: [
        mockEl('div', ['content']),
        mockEl('div', ['ui-modal', 'layout-center', 'zoomModal-enter-done']),
        mockEl('div', ['dreamina-modal-root']),
      ],
    });
    assert.equal(hasVisibleDreaminaModalDiv(doc), true);
    assert.equal(
      hasVisibleDreaminaModalDiv(
        mockDoc({ divs: [mockEl('div', ['content-only'])] })
      ),
      false
    );
    assert.equal(
      hasVisibleDreaminaModalDiv(
        mockDoc({ divs: [mockEl('div', ['ui-modal', 'layout-center'])] })
      ),
      false
    );
  });

  it('isHostOverlayVisiblyPresent routes by template id', () => {
    const hailuoDoc = mockDoc({
      sections: [mockEl('section', ['is-fixed'])],
    });
    const dreaminaDoc = mockDoc({
      divs: [
        mockEl('div', ['lv-modal', 'dialog-center', 'zoomModal-enter-done']),
      ],
    });
    assert.equal(
      isHostOverlayVisiblyPresent(TEMPLATE_ID_HAILUO_CREATION, hailuoDoc),
      true
    );
    assert.equal(
      isHostOverlayVisiblyPresent(TEMPLATE_ID_DREAMINA, dreaminaDoc),
      true
    );
    assert.equal(isHostOverlayVisiblyPresent('other-template', hailuoDoc), false);
  });
});
