import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TEMPLATE_ID,
  buttonLabelEndsWithReferral,
  getHyperliquidJoinReferralSuffix,
  getHyperliquidTemplateJoinBaseUrl,
  getJoinReferralSegmentFromUrl,
  needsHyperliquidJoinUrlCorrection,
  isHyperliquidJoinPageUrl,
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
  onHyperliquidJoinReferralClicked,
  isHyperliquidJoinAwaitReferralClick,
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

describe('join flow handlers', () => {
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

  it('referral click navigates while join flow is not completed', async () => {
    const state = hlState(JOIN_JUMP, {
      phase: 'awaitingLegalCheck',
      legalCheckHandled: false,
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

  it('isHyperliquidJoinAwaitReferralClick reflects phase', () => {
    const state = hlState(JOIN_JUMP, {
      phase: 'awaitReferralClick',
      legalCheckHandled: true,
    });
    assert.equal(isHyperliquidJoinAwaitReferralClick(state), true);
    resetHyperliquidJoinFlow(state);
    assert.equal(isHyperliquidJoinAwaitReferralClick(state), false);
  });
});
