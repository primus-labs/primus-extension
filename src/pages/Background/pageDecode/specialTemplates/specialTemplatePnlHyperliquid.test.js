import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TEMPLATE_ID,
  buttonLabelEndsWithReferral,
  getHyperliquidJoinReferralSuffix,
  getHyperliquidTemplateJoinBaseUrl,
  getJoinReferralSegmentFromUrl,
  findJoinReferralButton,
  needsHyperliquidJoinUrlCorrection,
  isHyperliquidJoinPageUrl,
  isHyperliquidTradePageUrl,
  shouldNavigateToPortfolioAfterLegalCheck,
  shouldSkipInitialReloadForJumpTo,
  isHyperliquidInfoUrl,
  isLegalCheckBody,
  isAcceptTerms2WithSignatureBody,
  shouldSkipHyperliquidAttestationInfoReplay,
  INFO_TYPE_PORTFOLIO,
  INFO_TYPE_LEGAL_CHECK,
  readAcceptedTermsFromLegalCheckResponse,
  shouldDeferHyperliquidPortfolioValidation,
  parseHyperliquidInfoBody,
  onHyperliquidInfoRequestObserved,
  ensureHyperliquidJoinLegalCheck,
  buildLegalCheckReplayBody,
  rememberHyperliquidInfoUser,
  onHyperliquidJoinReferralClicked,
  isHyperliquidJoinAwaitReferralClick,
  shouldPreventHyperliquidReferralNavigation,
  resetHyperliquidJoinFlow,
} from './specialTemplatePnlHyperliquid.js';

const HL_TEMPLATE = { attTemplateID: TEMPLATE_ID };
const JOIN_JUMP = 'https://app.hyperliquid.xyz/join/PRIMUSLABS';
const HL_DATA_PAGE_JOIN = {
  dataPageTemplate: { baseUrl: JOIN_JUMP },
};

function hlState(jumpTo = JOIN_JUMP, flow) {
  const state = {
    activeTemplate: { ...HL_TEMPLATE, jumpTo },
    dataSourcePageTabId: 1,
  };
  if (flow) {
    state.hyperliquidJoinFlow = flow;
  }
  return state;
}

describe('isHyperliquidJoinPageUrl', () => {
  it('matches hyperliquid join URL', () => {
    assert.equal(
      isHyperliquidJoinPageUrl('https://app.hyperliquid.xyz/join/PRIMUSLABS'),
      true
    );
  });

  it('does not match portfolio URL', () => {
    assert.equal(
      isHyperliquidJoinPageUrl('https://app.hyperliquid.xyz/portfolio'),
      false
    );
  });
});

describe('buttonLabelEndsWithReferral', () => {
  it('matches localized label ending with referral code', () => {
    assert.equal(
      buttonLabelEndsWithReferral('使用代码加入：PRIMUSLABS', 'PRIMUSLABS'),
      true
    );
  });

  it('normalizes whitespace', () => {
    assert.equal(
      buttonLabelEndsWithReferral('Join code:  PRIMUSLABS  ', 'PRIMUSLABS'),
      true
    );
  });
});

describe('findJoinReferralButton', () => {
  it('matches button[type="button"] whose label ends with referral suffix', () => {
    let selector = '';
    const expected = { textContent: 'Join PRIMUSLABS' };
    const doc = {
      querySelectorAll(value) {
        selector = value;
        return [{ textContent: 'Cancel' }, expected];
      },
    };
    assert.equal(findJoinReferralButton(doc, 'PRIMUSLABS'), expected);
    assert.equal(selector, 'button[type="button"]');
  });
});

describe('getHyperliquidJoinReferralSuffix', () => {
  it('prefers additionParams hyperliquidJoinReferralSuffix', () => {
    assert.equal(
      getHyperliquidJoinReferralSuffix({
        jumpTo: 'https://app.hyperliquid.xyz/join/OTHER',
        additionParamsObj: { hyperliquidJoinReferralSuffix: 'FROM_PARAMS' },
      }),
      'FROM_PARAMS'
    );
  });

  it('reads suffix from dataPageTemplate.baseUrl', () => {
    assert.equal(
      getHyperliquidJoinReferralSuffix({
        ...HL_DATA_PAGE_JOIN,
        jumpTo: 'https://app.hyperliquid.xyz/join/OTHER',
      }),
      'PRIMUSLABS'
    );
  });

  it('falls back to jumpTo path segment when baseUrl missing', () => {
    assert.equal(
      getHyperliquidJoinReferralSuffix({
        jumpTo: 'https://app.hyperliquid.xyz/join/CUSTOMCODE',
      }),
      'CUSTOMCODE'
    );
  });

  it('returns empty when no join baseUrl or jumpTo segment', () => {
    assert.equal(
      getHyperliquidJoinReferralSuffix({
        jumpTo: 'https://app.hyperliquid.xyz/portfolio',
      }),
      ''
    );
  });
});

describe('Hyperliquid join referral URL correction', () => {
  it('getJoinReferralSegmentFromUrl parses join path segment', () => {
    assert.equal(
      getJoinReferralSegmentFromUrl('https://app.hyperliquid.xyz/join/PRIMUSLABS'),
      'PRIMUSLABS'
    );
    assert.equal(
      getJoinReferralSegmentFromUrl('https://app.hyperliquid.xyz/join/MMREFCSI'),
      'MMREFCSI'
    );
    assert.equal(
      getJoinReferralSegmentFromUrl('https://app.hyperliquid.xyz/join/'),
      ''
    );
    assert.equal(
      getJoinReferralSegmentFromUrl('https://app.hyperliquid.xyz/portfolio'),
      null
    );
  });

  it('getHyperliquidTemplateJoinBaseUrl reads dataPageTemplate.baseUrl', () => {
    assert.equal(
      getHyperliquidTemplateJoinBaseUrl({
        ...HL_DATA_PAGE_JOIN,
        jumpTo: 'https://app.hyperliquid.xyz/join/MMREFCSI',
      }),
      JOIN_JUMP
    );
  });

  it('needsHyperliquidJoinUrlCorrection compares full join URL to baseUrl', () => {
    assert.equal(
      needsHyperliquidJoinUrlCorrection(
        'https://app.hyperliquid.xyz/join/MMREFCSI',
        JOIN_JUMP
      ),
      true
    );
    assert.equal(
      needsHyperliquidJoinUrlCorrection(
        'https://app.hyperliquid.xyz/join/PRIMUSLABS',
        JOIN_JUMP
      ),
      false
    );
    assert.equal(
      needsHyperliquidJoinUrlCorrection(
        'https://app.hyperliquid.xyz/join/',
        JOIN_JUMP
      ),
      true
    );
  });
});

describe('shouldSkipInitialReloadForJumpTo', () => {
  it('skips reload for join jumpTo', () => {
    assert.equal(
      shouldSkipInitialReloadForJumpTo(
        'https://app.hyperliquid.xyz/join/PRIMUSLABS'
      ),
      true
    );
  });

  it('does not skip reload for portfolio jumpTo', () => {
    assert.equal(
      shouldSkipInitialReloadForJumpTo(
        'https://app.hyperliquid.xyz/portfolio'
      ),
      false
    );
  });
});

describe('shouldNavigateToPortfolioAfterLegalCheck', () => {
  it('navigates when referral click was pending', () => {
    assert.equal(
      shouldNavigateToPortfolioAfterLegalCheck(
        { referralClickPending: true },
        'https://app.hyperliquid.xyz/join/PRIMUSLABS'
      ),
      true
    );
  });

  it('navigates when tab already on trade', () => {
    assert.equal(
      shouldNavigateToPortfolioAfterLegalCheck(
        { referralClickPending: false },
        'https://app.hyperliquid.xyz/trade'
      ),
      true
    );
  });

  it('does not navigate on join without pending click', () => {
    assert.equal(
      shouldNavigateToPortfolioAfterLegalCheck(
        { referralClickPending: false },
        'https://app.hyperliquid.xyz/join/PRIMUSLABS'
      ),
      false
    );
  });

  it('isHyperliquidTradePageUrl matches trade path', () => {
    assert.equal(
      isHyperliquidTradePageUrl('https://app.hyperliquid.xyz/trade'),
      true
    );
    assert.equal(
      isHyperliquidTradePageUrl('https://app.hyperliquid.xyz/join/X'),
      false
    );
  });
});

describe('Hyperliquid info body helpers', () => {
  it('isHyperliquidInfoUrl matches api-ui info endpoint', () => {
    assert.equal(
      isHyperliquidInfoUrl('https://api-ui.hyperliquid.xyz/info'),
      true
    );
    assert.equal(
      isHyperliquidInfoUrl('https://api-ui.hyperliquid.xyz/info/'),
      true
    );
  });

  it('parseHyperliquidInfoBody reads type and signature', () => {
    assert.deepEqual(parseHyperliquidInfoBody({ type: 'legalCheck' }), {
      type: 'legalCheck',
      signature: null,
    });
    assert.deepEqual(
      parseHyperliquidInfoBody({ type: 'acceptTerms2', signature: '0xabc' }),
      { type: 'acceptTerms2', signature: '0xabc' }
    );
  });

  it('isLegalCheckBody and isAcceptTerms2WithSignatureBody', () => {
    assert.equal(isLegalCheckBody({ type: 'legalCheck' }), true);
    assert.equal(isAcceptTerms2WithSignatureBody({ type: 'acceptTerms2' }), false);
    assert.equal(
      isAcceptTerms2WithSignatureBody({
        type: 'acceptTerms2',
        signature: 'sig',
      }),
      true
    );
    assert.equal(
      isAcceptTerms2WithSignatureBody({
        type: 'acceptTerms2',
        signature: { r: '0x1', s: '0x2', v: 27 },
      }),
      true
    );
  });

  it('shouldSkipHyperliquidAttestationInfoReplay skips non-portfolio types', () => {
    assert.equal(
      shouldSkipHyperliquidAttestationInfoReplay({
        type: 'subAccounts2',
        user: '0xabc',
      }),
      true
    );
    assert.equal(
      shouldSkipHyperliquidAttestationInfoReplay({
        type: 'allBorrowLendReserveStates',
      }),
      true
    );
    assert.equal(
      shouldSkipHyperliquidAttestationInfoReplay({ type: INFO_TYPE_LEGAL_CHECK }),
      true
    );
    assert.equal(
      shouldSkipHyperliquidAttestationInfoReplay({ type: INFO_TYPE_PORTFOLIO }),
      false
    );
    assert.equal(shouldSkipHyperliquidAttestationInfoReplay(null), false);
  });

  it('readAcceptedTermsFromLegalCheckResponse', () => {
    assert.equal(
      readAcceptedTermsFromLegalCheckResponse({ acceptedTerms: true }),
      true
    );
    assert.equal(
      readAcceptedTermsFromLegalCheckResponse({
        legalCheckResponse: { acceptedTerms: false },
      }),
      false
    );
  });
});

describe('shouldDeferHyperliquidPortfolioValidation', () => {
  it('defers for join jumpTo before flow init', () => {
    assert.equal(
      shouldDeferHyperliquidPortfolioValidation(
        hlState('https://app.hyperliquid.xyz/join/PRIMUSLABS')
      ),
      true
    );
  });

  it('does not defer for portfolio jumpTo when flow completed', () => {
    assert.equal(
      shouldDeferHyperliquidPortfolioValidation(
        hlState('https://app.hyperliquid.xyz/portfolio', {
          phase: 'completed',
          legalCheckHandled: true,
        })
      ),
      false
    );
  });

  it('defers while join flow phase is not completed', () => {
    assert.equal(
      shouldDeferHyperliquidPortfolioValidation(
        hlState(JOIN_JUMP, {
          phase: 'awaitAcceptTerms2',
          legalCheckHandled: true,
        })
      ),
      true
    );
  });

  it('does not defer for other templates', () => {
    assert.equal(
      shouldDeferHyperliquidPortfolioValidation({
        activeTemplate: { attTemplateID: 'other' },
      }),
      false
    );
  });
});

describe('buildLegalCheckReplayBody', () => {
  it('merges user from intercepted legalCheck body', () => {
    const state = hlState(JOIN_JUMP);
    assert.deepEqual(
      buildLegalCheckReplayBody(state, {
        type: 'legalCheck',
        user: '0xabc',
      }),
      { type: 'legalCheck', user: '0xabc' }
    );
  });

  it('builds legalCheck from remembered user when fallback runs', () => {
    const state = hlState(JOIN_JUMP);
    rememberHyperliquidInfoUser(state, {
      type: 'spotMeta',
      user: '0xwallet',
    });
    assert.deepEqual(buildLegalCheckReplayBody(state, { type: 'spotMeta' }), {
      type: 'legalCheck',
      user: '0xwallet',
    });
  });

  it('returns null until user is known', () => {
    const state = hlState(JOIN_JUMP);
    assert.equal(buildLegalCheckReplayBody(state, { type: 'candleSnapshot' }), null);
  });
});

describe('join flow handlers', () => {
  it('replays a synthetic legalCheck once from the first authenticated info request', async () => {
    const state = hlState(JOIN_JUMP, {
      phase: 'awaitingLegalCheck',
      legalCheckHandled: false,
      legalCheckInFlight: false,
      referralClickPending: false,
    });
    state.hyperliquidJoinInfoUser = '0xwallet';
    const replayBodies = [];
    const context = {
      url: 'https://api-ui.hyperliquid.xyz/info',
      method: 'POST',
      requestId: 'first-info',
      captured: {
        headers: { 'content-type': 'application/json' },
        body: { type: 'candleSnapshot', user: '0xwallet' },
      },
    };
    const options = {
      async fetchRequestData(params) {
        replayBodies.push(params.body);
        return { data: { acceptedTerms: false } };
      },
    };

    await ensureHyperliquidJoinLegalCheck(state, context, async () => {}, options);
    await ensureHyperliquidJoinLegalCheck(state, context, async () => {}, options);

    assert.deepEqual(replayBodies, [{ type: 'legalCheck', user: '0xwallet' }]);
    assert.equal(state.hyperliquidJoinFlow.phase, 'awaitAcceptTerms2');
    assert.equal(state.hyperliquidJoinFlow.legalCheckHandled, true);
  });

  it('moves synthetic acceptedTerms=true result to awaitReferralClick', async () => {
    const originalChrome = globalThis.chrome;
    globalThis.chrome = {
      tabs: {
        async sendMessage() {},
        async get() {
          return { url: JOIN_JUMP };
        },
      },
    };
    try {
      const state = hlState(JOIN_JUMP, {
        phase: 'awaitingLegalCheck',
        legalCheckHandled: false,
        legalCheckInFlight: false,
        referralClickPending: false,
      });
      state.hyperliquidJoinInfoUser = '0xwallet';
      await ensureHyperliquidJoinLegalCheck(
        state,
        {
          url: 'https://api-ui.hyperliquid.xyz/info',
          method: 'POST',
          captured: {
            headers: { 'content-type': 'application/json' },
            body: { type: 'userFillsByTime', user: '0xwallet' },
          },
        },
        async () => {},
        {
          async fetchRequestData() {
            return { data: { acceptedTerms: true } };
          },
        }
      );
      assert.equal(state.hyperliquidJoinFlow.phase, 'awaitReferralClick');
    } finally {
      globalThis.chrome = originalChrome;
    }
  });

  it('acceptTerms2 with signature navigates before legalCheck replay finishes', async () => {
    const state = hlState(JOIN_JUMP, {
      phase: 'awaitingLegalCheck',
      legalCheckHandled: false,
    });
    let navigated = false;
    await onHyperliquidInfoRequestObserved(
      state,
      {
        url: 'https://api-ui.hyperliquid.xyz/info',
        method: 'POST',
        body: {
          type: 'acceptTerms2',
          signature: { r: '0xabc', s: '0xdef', v: 27 },
        },
      },
      async () => {
        navigated = true;
      }
    );
    assert.equal(navigated, true);
    assert.equal(state.hyperliquidJoinFlow.phase, 'completed');
  });

  it('referral click navigates when awaitReferralClick', async () => {
    const state = hlState(JOIN_JUMP, {
      phase: 'awaitReferralClick',
      legalCheckHandled: true,
    });
    let navigated = false;
    await onHyperliquidJoinReferralClicked(state, async () => {
      navigated = true;
    });
    assert.equal(navigated, true);
    assert.equal(state.hyperliquidJoinFlow.phase, 'completed');

    navigated = false;
    await onHyperliquidJoinReferralClicked(state, async () => {
      navigated = true;
    });
    assert.equal(navigated, false);
  });

  it('referral click before awaitReferralClick sets pending only', async () => {
    const state = hlState(JOIN_JUMP, {
      phase: 'awaitingLegalCheck',
      legalCheckHandled: false,
      referralClickPending: false,
    });
    let navigated = false;
    await onHyperliquidJoinReferralClicked(state, async () => {
      navigated = true;
    });
    assert.equal(navigated, false);
    assert.equal(state.hyperliquidJoinFlow.referralClickPending, true);
  });

  it('isHyperliquidJoinAwaitReferralClick reflects phase', () => {
    const state = hlState(JOIN_JUMP, {
      phase: 'awaitReferralClick',
      legalCheckHandled: true,
    });
    assert.equal(isHyperliquidJoinAwaitReferralClick(state), true);
    resetHyperliquidJoinFlow(state);
    assert.equal(isHyperliquidJoinAwaitReferralClick(state), false);
  });

  it('only prevents native referral navigation after acceptedTerms=true', () => {
    assert.equal(shouldPreventHyperliquidReferralNavigation(false), false);
    assert.equal(shouldPreventHyperliquidReferralNavigation(undefined), false);
    assert.equal(shouldPreventHyperliquidReferralNavigation(true), true);
  });
});
