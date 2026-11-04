/* global chrome, console, clearTimeout, setTimeout */
import jp from 'jsonpath';
import { sendMsgToTab } from '../../utils/utils.js';
import { matchesTemplateId } from './templateIdUtils.js';

/**
 * @param {string} raw
 * @returns {string|null}
 */
function trimValidJumpUrlBase(raw) {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t) return null;
  try {
    const parsed = new URL(t);
    return parsed.href.replace(/\/+$/, '');
  } catch (_e) {
    return null;
  }
}

export const TEMPLATE_ID = '801a0cae-c21d-4063-91c6-fb58687c9d30';
export const displayName = 'Hyperliquid';

export const HYPERLIQUID_PORTFOLIO_URL =
  'https://app.hyperliquid.xyz/portfolio';
export const HYPERLIQUID_INFO_URL = 'https://api-ui.hyperliquid.xyz/info';

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
 * @typedef {object} HyperliquidJoinFlowState
 * @property {HyperliquidJoinPhase} phase
 * @property {boolean} legalCheckHandled
 * @property {boolean} [referralClickPending]
 */

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
 * Fields logged when a Hyperliquid /info POST is seen, including parse failures.
 * @param {unknown} parsedBody
 * @param {{ raw?: Array<{ bytes?: unknown }>; error?: string } | null | undefined} requestBody
 * @param {unknown} parseError
 * @returns {{ type: string | null; bodyParsed: boolean; hasRaw: boolean; requestBodyError: string | null; parseError: string | null }}
 */
export function describeHyperliquidInfoPostBody(parsedBody, requestBody, parseError) {
  const type =
    parsedBody &&
    typeof parsedBody === 'object' &&
    !Array.isArray(parsedBody) &&
    typeof parsedBody.type === 'string'
      ? parsedBody.type
      : null;
  const hasRaw = Boolean(requestBody?.raw?.[0]?.bytes);
  let parseErrorText = null;
  if (parseError) {
    parseErrorText =
      parseError instanceof Error ? parseError.message : String(parseError);
  }
  return {
    type,
    bodyParsed: parsedBody != null,
    hasRaw,
    requestBodyError:
      typeof requestBody?.error === 'string' ? requestBody.error : null,
    parseError: parseErrorText,
  };
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
 * @returns {unknown}
 */
function parseHyperliquidInfoBodyObject(body) {
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
  return parsed;
}

/**
 * @param {unknown} body
 * @returns {unknown}
 */
export function readHyperliquidInfoUser(body) {
  const parsed = parseHyperliquidInfoBodyObject(body);
  if (!parsed || !('user' in parsed)) {
    return undefined;
  }
  const user = parsed.user;
  if (typeof user === 'string' && !user.trim()) {
    return undefined;
  }
  return user;
}

/**
 * Remember wallet/user from any intercepted /info POST for legalCheck replay.
 * @param {object} state
 * @param {unknown} body
 */
export function rememberHyperliquidInfoUser(state, body) {
  if (!matches(state?.activeTemplate)) return;
  const user = readHyperliquidInfoUser(body);
  if (user !== undefined) {
    state.hyperliquidJoinInfoUser = user;
  }
}

/**
 * @param {object} state
 * @returns {unknown}
 */
function findHyperliquidInfoUserInRequestsMap(state) {
  const map = state?.requestsMap;
  if (!map || typeof map !== 'object') {
    return undefined;
  }
  for (const entry of Object.values(map)) {
    const user = readHyperliquidInfoUser(entry?.body);
    if (user !== undefined) {
      return user;
    }
  }
  return undefined;
}

/**
 * Build the body used to replay legalCheck (must match page payload, including user).
 * @param {object} state
 * @param {unknown} sourceBody
 * @returns {Record<string, unknown> | null}
 */
export function buildLegalCheckReplayBody(state, sourceBody) {
  const parsed = parseHyperliquidInfoBodyObject(sourceBody);
  const user =
    readHyperliquidInfoUser(parsed) ??
    state?.hyperliquidJoinInfoUser ??
    findHyperliquidInfoUserInRequestsMap(state);

  if (
    parsed &&
    typeof parsed.type === 'string' &&
    parsed.type === INFO_TYPE_LEGAL_CHECK
  ) {
    const replay = { ...parsed };
    if (user !== undefined && replay.user == null) {
      replay.user = user;
    }
    return replay;
  }

  if (user === undefined) {
    return null;
  }

  return { type: INFO_TYPE_LEGAL_CHECK, user };
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
      legalCheckInFlight: false,
      referralClickPending: false,
    };
  }
  return state.hyperliquidJoinFlow;
}

export function resetHyperliquidJoinFlow(state) {
  delete state.hyperliquidJoinFlow;
  delete state.hyperliquidJoinReferralLastCorrectedUrl;
  delete state.hyperliquidJoinInfoUser;
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
 * acceptedTerms=false must retain native behavior so acceptTerms2 is sent.
 * @param {boolean} awaitReferralClick
 * @returns {boolean}
 */
export function shouldPreventHyperliquidReferralNavigation(
  awaitReferralClick
) {
  return awaitReferralClick === true;
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
 * @param {string} href
 * @returns {boolean}
 */
export function isHyperliquidTradePageUrl(href) {
  try {
    const parsed = new URL(href);
    if (!/hyperliquid\.xyz/i.test(parsed.hostname)) return false;
    return /\/trade(\/|$)/i.test(parsed.pathname);
  } catch (_e) {
    return false;
  }
}

/**
 * @param {{ referralClickPending?: boolean } | null | undefined} flow
 * @param {string} tabHref
 * @returns {boolean}
 */
export function shouldNavigateToPortfolioAfterLegalCheck(flow, tabHref) {
  if (!flow) return false;
  if (flow.referralClickPending === true) return true;
  return isHyperliquidTradePageUrl(tabHref);
}

/**
 * @param {number | null | undefined} tabId
 * @returns {Promise<string>}
 */
async function getDataSourceTabHref(tabId) {
  if (tabId == null) return '';
  try {
    const tab = await chrome.tabs.get(tabId);
    return typeof tab?.url === 'string' ? tab.url : '';
  } catch (_e) {
    return '';
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
 * @param {{ dataPageTemplate?: object | string } | null | undefined} activeTemplate
 * @returns {Record<string, unknown> | null}
 */
function parseDataPageTemplate(activeTemplate) {
  const raw = activeTemplate?.dataPageTemplate;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (_e) {
      /* ignore */
    }
  }
  return null;
}

/**
 * Template-configured join URL (dataPageTemplate.baseUrl), not launch_page jumpTo.
 * @param {{ dataPageTemplate?: object | string; jumpTo?: string } | null | undefined} activeTemplate
 * @returns {string}
 */
export function getHyperliquidTemplateJoinBaseUrl(activeTemplate) {
  const dataPage = parseDataPageTemplate(activeTemplate);
  const fromBase = trimValidJumpUrlBase(
    typeof dataPage?.baseUrl === 'string' ? dataPage.baseUrl : ''
  );
  if (fromBase && isHyperliquidJoinPageUrl(fromBase)) {
    return fromBase;
  }
  const fromJump = trimValidJumpUrlBase(activeTemplate?.jumpTo ?? '');
  if (fromJump && isHyperliquidJoinPageUrl(fromJump)) {
    return fromJump;
  }
  return '';
}

/**
 * @param {{ additionParamsObj?: { hyperliquidJoinReferralSuffix?: string }; dataPageTemplate?: object | string; jumpTo?: string } | null | undefined} activeTemplate
 * @returns {string}
 */
export function getHyperliquidJoinReferralSuffix(activeTemplate) {
  const fromParams = activeTemplate?.additionParamsObj?.hyperliquidJoinReferralSuffix;
  if (typeof fromParams === 'string' && fromParams.trim()) {
    return fromParams.trim();
  }
  const configuredJoinUrl = getHyperliquidTemplateJoinBaseUrl(activeTemplate);
  const fromBase = getJoinReferralSegmentFromUrl(configuredJoinUrl);
  if (fromBase) return fromBase;
  const fromJump = referralSuffixFromJumpTo(activeTemplate?.jumpTo ?? '');
  if (fromJump) return fromJump;
  return '';
}

/**
 * @param {string} href
 * @returns {string | null} join referral segment, empty string if /join/ only, null if not join
 */
export function getJoinReferralSegmentFromUrl(href) {
  try {
    const parsed = new URL(href);
    if (!/\/join(\/|$)/i.test(parsed.pathname)) {
      return null;
    }
    const segment = parsed.pathname.replace(/\/+$/, '').split('/').pop();
    if (!segment || segment.toLowerCase() === 'join') {
      return '';
    }
    return segment.trim();
  } catch (_e) {
    return null;
  }
}

/**
 * @param {string} href
 * @param {string} configuredBaseUrl
 * @returns {boolean}
 */
export function needsHyperliquidJoinUrlCorrection(href, configuredBaseUrl) {
  if (!isHyperliquidJoinPageUrl(href)) return false;
  const expected = trimValidJumpUrlBase(configuredBaseUrl ?? '');
  if (!expected) return false;
  return normalizeJoinUrlForCompare(href) !== normalizeJoinUrlForCompare(expected);
}

/**
 * @param {string} href
 * @returns {string}
 */
export function normalizeJoinUrlForCompare(href) {
  try {
    const parsed = new URL(href);
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
  } catch (_e) {
    return '';
  }
}

/**
 * Redirect data-source tab to the template expected join referral code (e.g. MetaMask wrong code).
 * @param {object} state
 * @param {number | null | undefined} tabId
 * @param {string} [urlHint]
 */
export async function maybeCorrectHyperliquidJoinReferralUrl(state, tabId, urlHint) {
  if (!matches(state.activeTemplate) || tabId == null) return;
  if (state.phase === 'idle') return;
  if (state.hyperliquidJoinFlow?.phase === 'completed') return;

  let currentUrl = typeof urlHint === 'string' ? urlHint : '';
  if (!currentUrl) {
    try {
      const tab = await chrome.tabs.get(tabId);
      currentUrl = tab?.url ?? '';
    } catch (_e) {
      return;
    }
  }

  const configuredBaseUrl = getHyperliquidTemplateJoinBaseUrl(
    state.activeTemplate
  );
  if (!needsHyperliquidJoinUrlCorrection(currentUrl, configuredBaseUrl)) {
    return;
  }

  const targetUrl = configuredBaseUrl;
  if (normalizeJoinUrlForCompare(currentUrl) === normalizeJoinUrlForCompare(targetUrl)) {
    return;
  }
  if (state.hyperliquidJoinReferralLastCorrectedUrl === targetUrl) {
    return;
  }

  state.hyperliquidJoinReferralLastCorrectedUrl = targetUrl;
  try {
    await chrome.tabs.update(tabId, { url: targetUrl });
    console.log('hyperliquidPnl: corrected join referral URL', targetUrl);
  } catch (e) {
    console.warn('hyperliquidPnl: join referral URL correction failed', e);
  }
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
 * @param {{ fetchRequestData?: (params: object) => Promise<{ data?: unknown }> }} [options]
 */
export async function onHyperliquidInfoRequestObserved(
  state,
  ctx,
  navigateFn,
  options = {}
) {
  if (!matches(state.activeTemplate)) return;
  const flow = ensureJoinFlow(state);
  if (!flow || flow.phase === 'completed') return;
  if (!isHyperliquidInfoPost(ctx.method, ctx.url)) return;

  const body = ctx.body ?? ctx.captured?.body;

  if (isAcceptTerms2WithSignatureBody(body) && flow.phase !== 'completed') {
    await completeJoinFlowNavigate(state, navigateFn);
    return;
  }

  if (
    !isLegalCheckBody(body) &&
    !isLegalCheckBody(ctx.captured?.body)
  ) {
    return;
  }

  if (flow.legalCheckHandled || flow.legalCheckInFlight) {
    return;
  }

  const captured = ctx.captured ?? {};
  if (!captured.headers) {
    return;
  }

  const replayBody = buildLegalCheckReplayBody(state, captured.body ?? body);
  if (!replayBody) {
    return;
  }

  flow.legalCheckInFlight = true;
  flow.legalCheckHandled = true;

  try {
    const fetchRequestData = options.fetchRequestData;
    if (typeof fetchRequestData !== 'function') {
      console.warn(
        'hyperliquidPnl: legalCheck replay skipped: missing replay function'
      );
      flow.legalCheckHandled = false;
      return;
    }
    const fetched = await fetchRequestData({
      url: ctx.url,
      method: 'POST',
      header: captured.headers,
      body: replayBody,
    });

    const acceptedTerms = readAcceptedTermsFromLegalCheckResponse(fetched?.data);
    console.log('hyperliquidPnl: legalCheck replay result', {
      acceptedTerms,
      requestId: ctx.requestId ?? null,
    });
    if (acceptedTerms === true) {
      flow.phase = 'awaitReferralClick';
      await notifyHyperliquidJoinReferralWaitUi(state);
      const tabHref = await getDataSourceTabHref(state.dataSourcePageTabId);
      if (shouldNavigateToPortfolioAfterLegalCheck(flow, tabHref)) {
        await completeJoinFlowNavigate(state, navigateFn);
      }
    } else {
      flow.phase = 'awaitAcceptTerms2';
    }
  } finally {
    flow.legalCheckInFlight = false;
  }
}

/**
 * Logged-in join pages do not always issue legalCheck themselves. Reuse the
 * first authenticated /info request headers to perform the same check once.
 * @param {object} state
 * @param {{ url: string; method: string; requestId?: string; captured?: { headers?: object } }} ctx
 * @param {() => Promise<void>} navigateFn
 * @param {{ fetchRequestData?: (params: object) => Promise<{ data?: unknown }> }} [options]
 */
export async function ensureHyperliquidJoinLegalCheck(
  state,
  ctx,
  navigateFn,
  options = {}
) {
  if (!matches(state?.activeTemplate)) return;
  const flow = ensureJoinFlow(state);
  if (
    !flow ||
    flow.phase !== 'awaitingLegalCheck' ||
    flow.legalCheckHandled ||
    flow.legalCheckInFlight ||
    !ctx?.captured?.headers ||
    !isHyperliquidInfoPost(ctx.method, ctx.url)
  ) {
    return;
  }
  const replayBody = buildLegalCheckReplayBody(state, ctx.captured?.body);
  if (!replayBody) {
    return;
  }
  await onHyperliquidInfoRequestObserved(
    state,
    {
      ...ctx,
      body: replayBody,
      captured: {
        ...ctx.captured,
        body: replayBody,
      },
    },
    navigateFn,
    options
  );
}

/**
 * @param {object} state
 * @param {Record<string, unknown>} payload
 * @returns {Promise<void>}
 */
async function sendHyperliquidJoinReferralWaitMsg(state, payload) {
  const tabId = state?.dataSourcePageTabId;
  if (tabId == null) return;
  await sendMsgToTab(tabId, {
    type: 'pageDecode',
    name: 'hyperliquidJoinReferralWait',
    ...payload,
  });
}

/**
 * Tell content to bind the join referral button as soon as legalCheck allows clicks.
 * @param {object} state
 * @returns {Promise<void>}
 */
export async function notifyHyperliquidJoinReferralWaitUi(state) {
  if (!matches(state.activeTemplate)) return;
  await sendHyperliquidJoinReferralWaitMsg(state, {
    hyperliquidJoinAwaitReferralClick: isHyperliquidJoinAwaitReferralClick(state),
    hyperliquidJoinEarlyReferralBind: true,
  });
}

/**
 * Ask content on join URL to bind referral button before legalCheck completes.
 * @param {object} state
 * @returns {Promise<void>}
 */
export async function notifyHyperliquidJoinEarlyReferralBind(state) {
  if (!matches(state.activeTemplate)) return;
  const jumpTo = state.activeTemplate?.jumpTo ?? '';
  if (!isHyperliquidJoinPageUrl(jumpTo)) return;
  await sendHyperliquidJoinReferralWaitMsg(state, {
    hyperliquidJoinEarlyReferralBind: true,
  });
}

/**
 * @param {object} state
 * @param {() => Promise<void>} navigateFn
 */
export async function onHyperliquidJoinReferralClicked(state, navigateFn) {
  if (!matches(state.activeTemplate)) return;
  const flow = ensureJoinFlow(state);
  if (!flow || flow.phase === 'completed') return;
  if (flow.phase === 'awaitReferralClick') {
    await completeJoinFlowNavigate(state, navigateFn);
    return;
  }
  flow.referralClickPending = true;
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
