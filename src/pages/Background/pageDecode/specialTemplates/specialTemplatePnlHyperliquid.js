/* global chrome, console, clearTimeout, setTimeout */
import jp from 'jsonpath';
import { matchesTemplateId } from './templateIdUtils.js';

export const TEMPLATE_ID = '801a0cae-c21d-4063-91c6-fb58687c9d30';
export const displayName = 'Hyperliquid';

export const HYPERLIQUID_PORTFOLIO_URL =
  'https://app.hyperliquid.xyz/portfolio';
export const HYPERLIQUID_INFO_URL = 'https://api-ui.hyperliquid.xyz/info';
export const DEFAULT_JOIN_REFERRAL_SUFFIX = 'PRIMUSLABS';

export const INFO_TYPE_LEGAL_CHECK = 'legalCheck';
export const INFO_TYPE_ACCEPT_TERMS2 = 'acceptTerms2';
/** Attestation replay target for PnL proof (SDK STREQ portfolio). */
export const INFO_TYPE_PORTFOLIO = 'portfolio';

export const ACCEPTED_TERMS_JSON_PATHS = [
  '$.acceptedTerms',
  '$.legalCheckResponse.acceptedTerms',
];

const RELOAD_DELAY_MS = 200;
const TAB_COMPLETE_WAIT_MS = 30000;

/** @typedef {'awaitingLegalCheck' | 'awaitReferralClick' | 'awaitAcceptTerms2' | 'completed'} HyperliquidJoinPhase */

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @param {number} tabId
 * @param {number} [timeoutMs]
 * @returns {Promise<void>}
 */
function waitForTabLoadComplete(tabId, timeoutMs = TAB_COMPLETE_WAIT_MS) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      chrome.tabs.onUpdated.removeListener(onUpdated);
      clearTimeout(timeoutId);
      resolve();
    };

    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId) return;
      if (changeInfo.status === 'complete') {
        finish();
      }
    };

    chrome.tabs.onUpdated.addListener(onUpdated);

    chrome.tabs
      .get(tabId)
      .then((tab) => {
        if (tab?.status === 'complete') {
          finish();
        }
      })
      .catch(() => {
        finish();
      });

    const timeoutId = setTimeout(finish, timeoutMs);
  });
}

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function matches(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID);
}

export const hooks = {
  pageDecodeModal: { darkTheme: true, placement: 'center' },
  jsonPath: { truncateAtEmptyArray: true },
};

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isHyperliquidInfoUrl(url) {
  if (typeof url !== 'string' || !url) return false;
  try {
    const parsed = new URL(url);
    const normalized = `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '');
    const expected = HYPERLIQUID_INFO_URL.replace(/\/$/, '');
    return normalized === expected;
  } catch (_e) {
    return false;
  }
}

/**
 * @param {string} method
 * @param {string} url
 * @returns {boolean}
 */
export function isHyperliquidInfoPost(method, url) {
  return String(method || '').toUpperCase() === 'POST' && isHyperliquidInfoUrl(url);
}

/**
 * @param {unknown} body
 * @returns {{ type: string; signature: string | null } | null}
 */
export function parseHyperliquidInfoBody(body) {
  let parsed = body;
  if (typeof body === 'string') {
    try {
      parsed = JSON.parse(body);
    } catch (_e) {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  const type = typeof parsed.type === 'string' ? parsed.type : '';
  const signature = hasHyperliquidRequestSignature(parsed)
    ? parsed.signature
    : null;
  return { type, signature };
}

/**
 * Hyperliquid signed actions use a hex string or { r, s, v } object.
 * @param {unknown} body
 * @returns {boolean}
 */
export function hasHyperliquidRequestSignature(body) {
  let parsed = body;
  if (typeof body === 'string') {
    try {
      parsed = JSON.parse(body);
    } catch (_e) {
      return false;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return false;
  }
  const signature = parsed.signature;
  if (typeof signature === 'string') {
    return signature.trim().length > 0;
  }
  if (signature && typeof signature === 'object') {
    return Boolean(signature.r || signature.s || signature.v);
  }
  return false;
}

/**
 * @param {unknown} body
 * @returns {boolean}
 */
export function isLegalCheckBody(body) {
  const info = parseHyperliquidInfoBody(body);
  return info?.type === INFO_TYPE_LEGAL_CHECK;
}

/**
 * @param {unknown} body
 * @returns {boolean}
 */
export function isAcceptTerms2WithSignatureBody(body) {
  const info = parseHyperliquidInfoBody(body);
  if (info?.type !== INFO_TYPE_ACCEPT_TERMS2) return false;
  return hasHyperliquidRequestSignature(body);
}

/**
 * Skip background replay in checkSDKTargetRequest for non-portfolio /info bodies.
 * @param {unknown} body
 * @returns {boolean}
 */
export function shouldSkipHyperliquidAttestationInfoReplay(body) {
  const info = parseHyperliquidInfoBody(body);
  if (!info?.type) return false;
  return info.type !== INFO_TYPE_PORTFOLIO;
}

/**
 * @param {unknown} data
 * @returns {boolean | null}
 */
export function readAcceptedTermsFromLegalCheckResponse(data) {
  if (data == null) return null;
  let root = data;
  if (typeof data === 'string') {
    try {
      root = JSON.parse(data);
    } catch (_e) {
      return null;
    }
  }
  for (const pathExpr of ACCEPTED_TERMS_JSON_PATHS) {
    try {
      const nodes = jp.query(root, pathExpr);
      if (nodes.length > 0 && typeof nodes[0] === 'boolean') {
        return nodes[0];
      }
    } catch (_e) {
      /* try next path */
    }
  }
  if (
    root &&
    typeof root === 'object' &&
    typeof root.legalCheckResponse === 'object' &&
    root.legalCheckResponse != null &&
    typeof root.legalCheckResponse.acceptedTerms === 'boolean'
  ) {
    return root.legalCheckResponse.acceptedTerms;
  }
  if (typeof root?.acceptedTerms === 'boolean') {
    return root.acceptedTerms;
  }
  return null;
}

/**
 * @param {object} state
 * @returns {{ phase: HyperliquidJoinPhase; legalCheckHandled: boolean } | null}
 */
function ensureJoinFlow(state) {
  if (!matches(state.activeTemplate)) return null;
  if (!state.hyperliquidJoinFlow) {
    const jumpTo = state.activeTemplate?.jumpTo ?? '';
    state.hyperliquidJoinFlow = {
      phase: isHyperliquidJoinPageUrl(jumpTo)
        ? 'awaitingLegalCheck'
        : 'completed',
      legalCheckHandled: false,
    };
  }
  return state.hyperliquidJoinFlow;
}

export function resetHyperliquidJoinFlow(state) {
  delete state.hyperliquidJoinFlow;
}

/**
 * @param {object} state
 */
function markJoinFlowCompleted(state) {
  const flow = ensureJoinFlow(state);
  if (!flow) return;
  flow.phase = 'completed';
}

/**
 * @param {{ activeTemplate?: object; hyperliquidJoinFlow?: { phase?: HyperliquidJoinPhase } } | null | undefined} state
 * @returns {boolean}
 */
export function shouldDeferHyperliquidPortfolioValidation(state) {
  if (!matches(state?.activeTemplate)) return false;
  const flow = state.hyperliquidJoinFlow;
  if (!flow) {
    const jumpTo = state.activeTemplate?.jumpTo ?? '';
    return isHyperliquidJoinPageUrl(jumpTo);
  }
  return flow.phase !== 'completed';
}

/**
 * @param {{ activeTemplate?: object; hyperliquidJoinFlow?: { phase?: HyperliquidJoinPhase } } | null | undefined} state
 * @returns {boolean}
 */
export function isHyperliquidJoinAwaitReferralClick(state) {
  if (!matches(state?.activeTemplate)) return false;
  const flow = ensureJoinFlow(state);
  return flow?.phase === 'awaitReferralClick';
}

/**
 * @param {string} text
 * @param {string} suffix
 * @returns {boolean}
 */
export function buttonLabelEndsWithReferral(text, suffix) {
  const normalized = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  const code = String(suffix ?? '').trim();
  if (!code) return false;
  return normalized.endsWith(code);
}

/**
 * @param {string} href
 * @returns {boolean}
 */
export function isHyperliquidJoinPageUrl(href) {
  try {
    const parsed = new URL(href);
    if (!/hyperliquid\.xyz/i.test(parsed.hostname)) return false;
    return /\/join(\/|$)/i.test(parsed.pathname);
  } catch (_e) {
    return false;
  }
}

/**
 * @param {string} jumpTo
 * @returns {string}
 */
function referralSuffixFromJumpTo(jumpTo) {
  if (typeof jumpTo !== 'string' || !jumpTo.trim()) return '';
  try {
    const parsed = new URL(jumpTo);
    if (!/\/join(\/|$)/i.test(parsed.pathname)) return '';
    const segment = parsed.pathname.replace(/\/+$/, '').split('/').pop();
    return segment && segment !== 'join' ? segment.trim() : '';
  } catch (_e) {
    return '';
  }
}

/**
 * @param {{ additionParamsObj?: { hyperliquidJoinReferralSuffix?: string }; jumpTo?: string } | null | undefined} activeTemplate
 * @returns {string}
 */
export function getHyperliquidJoinReferralSuffix(activeTemplate) {
  const fromParams = activeTemplate?.additionParamsObj?.hyperliquidJoinReferralSuffix;
  if (typeof fromParams === 'string' && fromParams.trim()) {
    return fromParams.trim();
  }
  const fromJump = referralSuffixFromJumpTo(activeTemplate?.jumpTo ?? '');
  if (fromJump) return fromJump;
  return DEFAULT_JOIN_REFERRAL_SUFFIX;
}

/**
 * @param {Document} doc
 * @param {string} suffix
 * @returns {HTMLButtonElement | null}
 */
export function findJoinReferralButton(doc, suffix) {
  const buttons = doc.querySelectorAll('button[type="button"]');
  for (const button of buttons) {
    if (buttonLabelEndsWithReferral(button.textContent, suffix)) {
      return button;
    }
  }
  return null;
}

/**
 * @param {string | null | undefined} jumpTo
 * @returns {boolean}
 */
export function shouldSkipInitialReloadForJumpTo(jumpTo) {
  return isHyperliquidJoinPageUrl(typeof jumpTo === 'string' ? jumpTo : '');
}

/**
 * @param {object} state
 * @param {() => Promise<void>} navigateFn
 */
async function completeJoinFlowNavigate(state, navigateFn) {
  if (state.hyperliquidJoinFlow?.phase === 'completed') return;
  markJoinFlowCompleted(state);
  await navigateFn(state.dataSourcePageTabId);
}

/**
 * @param {object} state
 * @param {{ url: string; method: string; body?: unknown; requestId?: string; captured?: { headers?: object; body?: unknown } }} ctx
 * @param {() => Promise<void>} navigateFn
 */
export async function onHyperliquidInfoRequestObserved(state, ctx, navigateFn) {
  if (!matches(state.activeTemplate)) return;
  const flow = ensureJoinFlow(state);
  if (!flow || flow.phase === 'completed') return;
  if (!isHyperliquidInfoPost(ctx.method, ctx.url)) return;

  const body = ctx.body ?? ctx.captured?.body;

  if (isAcceptTerms2WithSignatureBody(body) && flow.phase !== 'completed') {
    await completeJoinFlowNavigate(state, navigateFn);
    return;
  }

  if (!isLegalCheckBody(body) || flow.legalCheckHandled) {
    return;
  }

  const captured = ctx.captured ?? {};
  if (!captured.headers) {
    return;
  }

  flow.legalCheckHandled = true;

  const { fetchRequestDataForTemplateValidation } = await import('../utils.js');
  const fetched = await fetchRequestDataForTemplateValidation({
    url: ctx.url,
    method: 'POST',
    header: captured.headers,
    body: captured.body ?? body,
  });

  const acceptedTerms = readAcceptedTermsFromLegalCheckResponse(fetched?.data);
  if (acceptedTerms === true) {
    flow.phase = 'awaitReferralClick';
  } else {
    flow.phase = 'awaitAcceptTerms2';
  }
}

/**
 * @param {object} state
 * @param {() => Promise<void>} navigateFn
 */
export async function onHyperliquidJoinReferralClicked(state, navigateFn) {
  if (!matches(state.activeTemplate)) return;
  const flow = ensureJoinFlow(state);
  if (!flow || flow.phase === 'completed') return;
  await completeJoinFlowNavigate(state, navigateFn);
}

/**
 * @param {number | null | undefined} tabId
 * @returns {Promise<void>}
 */
export async function reloadDataSourceTabAfterOpen(tabId) {
  if (tabId == null) return;
  try {
    await waitForTabLoadComplete(tabId);
    await delay(RELOAD_DELAY_MS);
    await chrome.tabs.reload(tabId);
    await waitForTabLoadComplete(tabId);
    console.log('hyperliquidPnl: data source tab reload after initial load', tabId);
  } catch (e) {
    console.warn('hyperliquidPnl: data source tab reload failed', e);
  }
}

/**
 * @param {number | null | undefined} tabId
 * @returns {Promise<void>}
 */
export async function navigateDataSourceTabToPortfolio(tabId) {
  if (tabId == null) return;
  try {
    await chrome.tabs.update(tabId, { url: HYPERLIQUID_PORTFOLIO_URL });
    await waitForTabLoadComplete(tabId);
    await reloadDataSourceTabAfterOpen(tabId);
    console.log('hyperliquidPnl: navigated data source tab to portfolio', tabId);
  } catch (e) {
    console.warn('hyperliquidPnl: navigate to portfolio failed', e);
  }
}
