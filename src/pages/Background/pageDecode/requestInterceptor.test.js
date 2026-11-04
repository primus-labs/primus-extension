import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canFinalizePageDecodeReady,
  shouldIgnorePageDecodeWebRequest,
} from './requestPolicy.js';
import { createPageDecodeState } from './state.js';
import {
  shouldDeferHyperliquidPortfolioValidation,
  TEMPLATE_ID as HYPERLIQUID_TEMPLATE_ID,
} from './specialTemplates/specialTemplatePnlHyperliquid.js';

const RUNTIME_ID = 'primus-extension-id';
const DATA_SOURCE_TAB_ID = 42;

describe('pageDecode webRequest policy', () => {
  it('captures extension-initiated main_frame navigation in the data-source tab', () => {
    assert.equal(
      shouldIgnorePageDecodeWebRequest(
        {
          initiator: `chrome-extension://${RUNTIME_ID}`,
          tabId: DATA_SOURCE_TAB_ID,
          type: 'main_frame',
        },
        { dataSourcePageTabId: DATA_SOURCE_TAB_ID },
        RUNTIME_ID
      ),
      false
    );
  });

  it('ignores extension background replays and unrelated tabs', () => {
    const state = { dataSourcePageTabId: DATA_SOURCE_TAB_ID };
    assert.equal(
      shouldIgnorePageDecodeWebRequest(
        {
          initiator: `chrome-extension://${RUNTIME_ID}`,
          tabId: -1,
          type: 'xmlhttprequest',
        },
        state,
        RUNTIME_ID
      ),
      true
    );
    assert.equal(
      shouldIgnorePageDecodeWebRequest(
        {
          initiator: 'https://github.com',
          tabId: 99,
          type: 'main_frame',
        },
        state,
        RUNTIME_ID
      ),
      true
    );
  });

  it('keeps normal page requests from the data-source tab and tabId -1', () => {
    const state = { dataSourcePageTabId: DATA_SOURCE_TAB_ID };
    assert.equal(
      shouldIgnorePageDecodeWebRequest(
        {
          initiator: 'https://app.hyperliquid.xyz',
          tabId: DATA_SOURCE_TAB_ID,
          type: 'xmlhttprequest',
        },
        state,
        RUNTIME_ID
      ),
      false
    );
    assert.equal(
      shouldIgnorePageDecodeWebRequest(
        { initiator: 'https://github.com', tabId: -1, type: 'main_frame' },
        state,
        RUNTIME_ID
      ),
      false
    );
  });
});

describe('pageDecode ready policy', () => {
  it('does not finalize before content initCompleted', () => {
    assert.equal(canFinalizePageDecodeReady({ contentReady: false }), false);
    assert.equal(canFinalizePageDecodeReady({ contentReady: true }), true);
  });

  it('resets content readiness for every attestation', () => {
    const pageDecodeState = createPageDecodeState();
    pageDecodeState.state.contentReady = true;
    pageDecodeState.reset();
    assert.equal(pageDecodeState.state.contentReady, false);
  });
});

describe('template isolation', () => {
  it('does not defer GitHub or Google target validation', () => {
    for (const attTemplateID of [
      '38396d71-242d-49da-a1aa-0affc3f70eaf',
      '0385fbd1-a652-48ea-924a-52e4d81f7c9c',
    ]) {
      assert.equal(
        shouldDeferHyperliquidPortfolioValidation({
          activeTemplate: { attTemplateID },
        }),
        false
      );
    }
  });

  it('still defers Hyperliquid join validation before portfolio', () => {
    assert.equal(
      shouldDeferHyperliquidPortfolioValidation({
        activeTemplate: {
          attTemplateID: HYPERLIQUID_TEMPLATE_ID,
          jumpTo: 'https://app.hyperliquid.xyz/join/PRIMUSLABS',
        },
      }),
      true
    );
  });
});
