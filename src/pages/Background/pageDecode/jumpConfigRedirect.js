/**
 * Generic multi-step tab redirects driven by dataPageTemplate.jumpConfig:
 * intercept URL + JSON response -> extract (JSONPath) -> assemble URL -> tab navigation
 * (chrome.tabs.update; LinkedIn profile template hard-reloads after jump — see specialTemplates).
 *
 * Optional per-step: navigate=false (collect only), matchMode=presence (webRequest seen, no replay).
 * Optional root assemble + requireParams: navigate once after all steps complete.
 * Optional stepOrder=any: steps are unordered gates (complete in any order).
 */
import { checkIsRequiredUrl } from '../utils/utils';
import { getPageDecodeState } from './state';
import { fetchRequestData } from './utils';
import { applyJumpConfigDataSourceNavigation } from './specialTemplates/specialTemplateLinkedinProfileJump.js';
import {
  extractJumpParams,
  assembleJumpUrl,
  jumpConfigRequireParamsSatisfied,
  jumpConfigAllStepsComplete,
  jumpConfigStepKey,
} from './jumpConfigRedirectPure.js';

export { extractJumpParams, assembleJumpUrl } from './jumpConfigRedirectPure.js';

/** Verbose diagnostics for Fomo-style jumpConfig URLs in service worker console. */
function isJumpConfigDiagUrl(url) {
  if (typeof url !== 'string') return false;
  return (
    url.includes('/v2/users') ||
    url.includes('/referral/useReferralCode')
  );
}

/**
 * @param {string} event
 * @param {object} [detail]
 */
function logJumpConfigDiag(event, detail) {
  console.log('[jumpConfig]', event, detail ?? '');
}

/**
 * @param {string} currRequestUrl
 * @param {string|undefined} method
 * @param {string} source
 */
function logJumpConfigRequestContext(currRequestUrl, method, source) {
  if (!isJumpConfigDiagUrl(currRequestUrl)) return;
  const { state } = getPageDecodeState();
  const jc = state.jumpConfigState;
  if (!jc?.steps?.length) {
    logJumpConfigDiag(`${source}: no jumpConfigState`, { url: currRequestUrl });
    return;
  }
  const matchedSteps = jc.steps
    .map((step, idx) =>
      interceptMatchesStep(step, currRequestUrl, method)
        ? {
            idx,
            stepId: step.stepId ?? `idx_${idx}`,
            matchMode: stepMatchMode(step),
          }
        : null
    )
    .filter(Boolean);
  if (matchedSteps.length === 0) return;

  const current = jc.steps[jc.currentStepIndex];
  logJumpConfigDiag(`${source}: request`, {
    url: currRequestUrl,
    method: method || 'GET',
    stepOrder: jc.stepOrder,
    currentStepIndex: jc.currentStepIndex,
    currentStepId: current?.stepId ?? `idx_${jc.currentStepIndex}`,
    currentMatchMode: current ? stepMatchMode(current) : null,
    matchedSteps,
    isApplying: jc.isApplying,
    finalized: jc.finalized,
    extractedParams: { ...jc.extractedParams },
  });
}

/**
 * @param {object|null|undefined} jumpConfig
 */
export function initJumpConfigState(jumpConfig) {
  const { state } = getPageDecodeState();
  if (
    !jumpConfig ||
    typeof jumpConfig !== 'object' ||
    !Array.isArray(jumpConfig.steps) ||
    jumpConfig.steps.length === 0
  ) {
    state.jumpConfigState = null;
    logJumpConfigDiag('init skipped', { reason: 'missing or empty jumpConfig' });
    return;
  }
  state.jumpConfigState = {
    defaultJumpUrl: jumpConfig.defaultJumpUrl || '',
    assemble: jumpConfig.assemble ?? null,
    requireParams: Array.isArray(jumpConfig.requireParams)
      ? jumpConfig.requireParams
      : [],
    stepOrder: jumpConfig.stepOrder === 'any' ? 'any' : 'sequential',
    steps: jumpConfig.steps,
    currentStepIndex: 0,
    extractedParams: {},
    completedStepKeys: new Set(),
    isApplying: false,
    finalized: false,
  };
  logJumpConfigDiag('init ok', {
    stepCount: jumpConfig.steps.length,
    stepIds: jumpConfig.steps.map(
      (s, i) => s.stepId ?? `idx_${i}`
    ),
    stepOrder: state.jumpConfigState.stepOrder,
    hasRootAssemble: !!jumpConfig.assemble,
    requireParams: state.jumpConfigState.requireParams,
  });
}

/**
 * @param {object} step
 */
function stepNavigateEnabled(step) {
  return step?.navigate !== false;
}

/**
 * @param {object} step
 * @returns {'presence' | 'replay'}
 */
function stepMatchMode(step) {
  return step?.matchMode === 'presence' ? 'presence' : 'replay';
}

/**
 * @param {object} jc
 */
function isUnorderedGates(jc) {
  return jc?.stepOrder === 'any';
}

/**
 * @param {object} jc
 */
function jcAllStepsComplete(jc) {
  return jumpConfigAllStepsComplete({
    stepOrder: jc.stepOrder,
    steps: jc.steps,
    currentStepIndex: jc.currentStepIndex,
    completedStepKeys: jc.completedStepKeys,
  });
}

/**
 * @param {object} jc
 * @param {string} requestUrl
 * @param {string} [method]
 * @returns {{ step: object, stepIndex: number, stepKey: string } | null}
 */
function findPendingReplayGate(jc, requestUrl, method) {
  if (!jc?.steps?.length) return null;
  for (let i = 0; i < jc.steps.length; i++) {
    const step = jc.steps[i];
    if (stepMatchMode(step) === 'presence') continue;
    const stepKey = jumpConfigStepKey(step, i);
    if (step.once !== false && jc.completedStepKeys.has(stepKey)) continue;
    if (!interceptMatchesStep(step, requestUrl, method)) continue;
    return { step, stepIndex: i, stepKey };
  }
  return null;
}

/**
 * @param {object} jc
 * @param {string} stepKey
 */
function markJumpConfigStepComplete(jc, stepKey) {
  jc.completedStepKeys.add(stepKey);
  if (!isUnorderedGates(jc)) {
    jc.currentStepIndex += 1;
  }
}

/**
 * @param {object} jc
 * @param {string} requestUrl
 * @param {string} [method]
 * @returns {{ step: object, stepIndex: number, stepKey: string } | null}
 */
function resolveReplayStepForRequest(jc, requestUrl, method) {
  if (isUnorderedGates(jc)) {
    return findPendingReplayGate(jc, requestUrl, method);
  }
  if (jc.currentStepIndex >= jc.steps.length) return null;
  const step = jc.steps[jc.currentStepIndex];
  if (stepMatchMode(step) === 'presence') return null;
  const stepIndex = jc.currentStepIndex;
  const stepKey = jumpConfigStepKey(step, stepIndex);
  if (step.once !== false && jc.completedStepKeys.has(stepKey)) return null;
  if (!interceptMatchesStep(step, requestUrl, method)) return null;
  return { step, stepIndex, stepKey };
}

/**
 * @param {object} step
 * @param {string} requestUrl
 * @param {string} [method]
 */
function interceptMatchesStep(step, requestUrl, method) {
  const intercept = step?.intercept;
  if (!intercept?.urlPattern || typeof requestUrl !== 'string') return false;

  const m = (method || 'GET').toUpperCase();
  const reqM = intercept.method;
  if (
    reqM &&
    String(reqM).toUpperCase() !== 'ALL' &&
    String(reqM).toUpperCase() !== m
  ) {
    return false;
  }

  return checkIsRequiredUrl({
    requestUrl,
    requiredUrl: intercept.urlPattern,
    urlType: intercept.urlType || 'REGX',
    queryParams: intercept.queryParams,
  });
}

/**
 * @param {object} jc
 * @param {object} step
 */
function resolveStepAssemble(jc, step) {
  return step?.assemble ?? jc?.assemble ?? null;
}

/**
 * Navigate once using root assemble after all steps complete.
 * @returns {Promise<boolean>}
 */
async function maybeFinalizeJumpConfigNavigation() {
  const { state } = getPageDecodeState();
  const jc = state.jumpConfigState;
  if (!jc?.steps?.length || jc.finalized) return false;
  if (!jcAllStepsComplete(jc)) return false;
  if (!jc.assemble || typeof jc.assemble !== 'object') return false;

  if (!jumpConfigRequireParamsSatisfied(jc.requireParams, jc.extractedParams)) {
    logJumpConfigDiag('finalize skipped', {
      reason: 'requireParams',
      requireParams: jc.requireParams,
      extractedParams: { ...jc.extractedParams },
    });
    return false;
  }

  const jumpTo = state.activeTemplate?.jumpTo;
  let newUrl = assembleJumpUrl(
    jc.assemble,
    jc.extractedParams,
    jc.defaultJumpUrl,
    jumpTo
  );
  if (!newUrl || !/^https?:\/\//i.test(newUrl)) {
    newUrl =
      jc.defaultJumpUrl ||
      (typeof jumpTo === 'string' ? jumpTo : '') ||
      '';
  }
  if (!newUrl) {
    console.warn('jumpConfig: finalize assembled URL empty, skip tab update');
    return false;
  }

  const tabId = state.dataSourcePageTabId;
  if (tabId == null) return false;

  const navigated = await applyJumpConfigDataSourceNavigation(
    state.activeTemplate,
    tabId,
    newUrl
  );
  if (!navigated) return false;

  jc.finalized = true;
  console.log('jumpConfig: finalized ->', newUrl);
  return true;
}

/**
 * Mark current step complete and advance index (no replay).
 * @returns {Promise<boolean>}
 */
async function completeJumpConfigStepWithoutReplay(stepKey) {
  const { state } = getPageDecodeState();
  const jc = state.jumpConfigState;
  if (!jc) return false;

  markJumpConfigStepComplete(jc, stepKey);
  await maybeFinalizeJumpConfigNavigation();
  return true;
}

/**
 * Current step expects a JSON body (skip main_frame HTML for standalone fetch).
 */
export function currentJumpStepMatchesUrl(state, requestUrl, method) {
  const jc = state.jumpConfigState;
  if (!jc?.steps?.length) return false;
  if (isUnorderedGates(jc)) {
    return !!findPendingReplayGate(jc, requestUrl, method);
  }
  if (jc.currentStepIndex >= jc.steps.length) return false;
  const step = jc.steps[jc.currentStepIndex];
  return interceptMatchesStep(step, requestUrl, method);
}

/**
 * When request is not a template capture target but matches jumpConfig current step, store POST body.
 */
export function shouldStoreBodyForJumpConfig(state, currRequestUrl, method) {
  const jc = state.jumpConfigState;
  if (!jc) return false;

  let step;
  if (isUnorderedGates(jc)) {
    const gate = findPendingReplayGate(jc, currRequestUrl, method);
    if (!gate) return false;
    step = gate.step;
  } else {
    if (!currentJumpStepMatchesUrl(state, currRequestUrl, method)) return false;
    step = jc.steps[jc.currentStepIndex];
  }

  if (step && stepMatchMode(step) === 'presence') return false;
  const m = (method || 'GET').toUpperCase();
  return ['POST', 'PUT', 'PATCH'].includes(m);
}

/**
 * Core: one step match + extract + tab update + advance index (no lock).
 * @param {string} requestUrl
 * @param {object|string|null} responseData
 * @param {string} [method]
 * @returns {Promise<boolean>} true if a step was applied
 */
async function runJumpConfigStepIfMatched(requestUrl, responseData, method) {
  const { state } = getPageDecodeState();
  const jc = state.jumpConfigState;
  if (!jc?.steps?.length || jc.finalized) return false;
  if (
    !isUnorderedGates(jc) &&
    jc.currentStepIndex >= jc.steps.length
  ) {
    return false;
  }

  const resolved = resolveReplayStepForRequest(jc, requestUrl, method);
  if (!resolved) return false;

  const { step, stepKey } = resolved;

  if (isJumpConfigDiagUrl(requestUrl)) {
    logJumpConfigDiag('replay step intercept', {
      stepKey,
      stepOrder: jc.stepOrder,
      url: requestUrl,
      method: method || 'GET',
      hasResponse: responseData != null,
    });
  }

  if (
    responseData == null ||
    (typeof responseData !== 'object' && typeof responseData !== 'string')
  ) {
    if (isJumpConfigDiagUrl(requestUrl)) {
      logJumpConfigDiag('replay step skipped', {
        stepKey,
        reason: 'empty responseData',
        url: requestUrl,
      });
    }
    return false;
  }

  let data = responseData;
  if (typeof responseData === 'string') {
    try {
      data = JSON.parse(responseData);
    } catch {
      return false;
    }
  }

  jc.extractedParams = extractJumpParams(
    data,
    step.extract,
    jc.extractedParams
  );

  if (!stepNavigateEnabled(step)) {
    markJumpConfigStepComplete(jc, stepKey);
    logJumpConfigDiag('step done (no navigate)', {
      stepKey,
      stepOrder: jc.stepOrder,
      nextStepIndex: jc.currentStepIndex,
      allStepsComplete: jcAllStepsComplete(jc),
      extractedParams: { ...jc.extractedParams },
    });
    await maybeFinalizeJumpConfigNavigation();
    return true;
  }

  const jumpTo = state.activeTemplate?.jumpTo;
  const stepAssemble = resolveStepAssemble(jc, step);
  let newUrl = assembleJumpUrl(
    stepAssemble,
    jc.extractedParams,
    jc.defaultJumpUrl,
    jumpTo
  );
  if (!newUrl || !/^https?:\/\//i.test(newUrl)) {
    newUrl =
      jc.defaultJumpUrl ||
      (typeof jumpTo === 'string' ? jumpTo : '') ||
      '';
  }
  if (!newUrl) {
    console.warn('jumpConfig: assembled URL empty, skip tab update');
    return false;
  }

  const tabId = state.dataSourcePageTabId;
  if (tabId == null) return false;

  const navigated = await applyJumpConfigDataSourceNavigation(
    state.activeTemplate,
    tabId,
    newUrl
  );
  if (!navigated) return false;

  markJumpConfigStepComplete(jc, stepKey);
  console.log('jumpConfig: step done', stepKey, '->', newUrl);
  if (jcAllStepsComplete(jc) && jc.assemble) {
    jc.finalized = true;
  }
  return true;
}

/**
 * Presence-only step: request observed on data source tab (no replay).
 * @param {{ currRequestUrl: string, method?: string }} args
 */
export async function tryJumpConfigPresenceStep({ currRequestUrl, method }) {
  logJumpConfigRequestContext(currRequestUrl, method, 'presence');

  const { state } = getPageDecodeState();
  const jc = state.jumpConfigState;
  if (!jc?.steps?.length || jc.finalized) {
    if (isJumpConfigDiagUrl(currRequestUrl)) {
      logJumpConfigDiag('presence skipped', {
        reason: 'no steps or finalized',
        url: currRequestUrl,
        currentStepIndex: jc?.currentStepIndex,
      });
    }
    return;
  }

  if (isUnorderedGates(jc)) {
    for (let i = 0; i < jc.steps.length; i++) {
      const step = jc.steps[i];
      if (stepMatchMode(step) !== 'presence') continue;
      const stepKey = jumpConfigStepKey(step, i);
      if (step.once !== false && jc.completedStepKeys.has(stepKey)) continue;
      if (!interceptMatchesStep(step, currRequestUrl, method)) continue;

      logJumpConfigDiag('presence intercept matched', {
        stepKey,
        stepOrder: jc.stepOrder,
        url: currRequestUrl,
        method: method || 'GET',
      });

      try {
        await completeJumpConfigStepWithoutReplay(stepKey);
        logJumpConfigDiag('presence step done', {
          stepKey,
          stepOrder: jc.stepOrder,
          allStepsComplete: jcAllStepsComplete(jc),
        });
      } catch (e) {
        console.warn('jumpConfig: presence step failed', e);
      }
      return;
    }
    return;
  }

  if (jc.currentStepIndex >= jc.steps.length) {
    if (isJumpConfigDiagUrl(currRequestUrl)) {
      logJumpConfigDiag('presence skipped', {
        reason: 'all steps done',
        url: currRequestUrl,
        currentStepIndex: jc.currentStepIndex,
      });
    }
    return;
  }
  if (jc.isApplying) {
    if (isJumpConfigDiagUrl(currRequestUrl)) {
      logJumpConfigDiag('presence skipped', {
        reason: 'isApplying (replay in progress)',
        url: currRequestUrl,
        currentStepIndex: jc.currentStepIndex,
      });
    }
    return;
  }

  const step = jc.steps[jc.currentStepIndex];
  if (stepMatchMode(step) !== 'presence') {
    if (
      isJumpConfigDiagUrl(currRequestUrl) &&
      interceptMatchesStep(step, currRequestUrl, method)
    ) {
      logJumpConfigDiag('presence skipped', {
        reason: 'current step is replay not presence',
        url: currRequestUrl,
        currentStepId: step.stepId ?? `idx_${jc.currentStepIndex}`,
      });
    }
    return;
  }

  const stepKey = jumpConfigStepKey(step, jc.currentStepIndex);
  if (step.once !== false && jc.completedStepKeys.has(stepKey)) return;
  if (!interceptMatchesStep(step, currRequestUrl, method)) return;

  logJumpConfigDiag('presence intercept matched', {
    stepKey,
    url: currRequestUrl,
    method: method || 'GET',
  });

  jc.isApplying = true;
  try {
    await completeJumpConfigStepWithoutReplay(stepKey);
    logJumpConfigDiag('presence step done', {
      stepKey,
      nextStepIndex: jc.currentStepIndex,
    });
  } catch (e) {
    console.warn('jumpConfig: presence step failed', e);
  } finally {
    jc.isApplying = false;
  }
}

/**
 * Apply redirect for current step if intercept and response match.
 * @param {{ requestUrl: string, responseData: object, method?: string }} args
 */
export async function tryApplyJumpConfigFromResponse({
  requestUrl,
  responseData,
  method,
}) {
  const { state } = getPageDecodeState();
  const jc = state.jumpConfigState;
  if (!jc?.steps?.length || jc.finalized) return;
  if (
    !isUnorderedGates(jc) &&
    jc.currentStepIndex >= jc.steps.length
  ) {
    return;
  }
  if (jc.isApplying) return;
  if (
    isUnorderedGates(jc) &&
    !resolveReplayStepForRequest(jc, requestUrl, method)
  ) {
    return;
  }

  if (isJumpConfigDiagUrl(requestUrl)) {
    logJumpConfigRequestContext(requestUrl, method, 'templateTarget');
  }

  jc.isApplying = true;
  try {
    await runJumpConfigStepIfMatched(requestUrl, responseData, method);
  } catch (e) {
    console.warn('jumpConfig: redirect failed', e);
  } finally {
    jc.isApplying = false;
  }
}

/**
 * For requests that are not template targets but match jumpConfig intercept: fetch JSON and apply step.
 */
export async function tryJumpConfigStandaloneIntercept({
  currRequestUrl,
  method,
  formatHeader,
  requestId,
  type,
  storeInRequestsMap,
}) {
  logJumpConfigRequestContext(currRequestUrl, method, 'standalone');

  const { state } = getPageDecodeState();
  if (type === 'main_frame') return;

  const jc = state.jumpConfigState;
  if (!jc?.steps?.length || jc.finalized) return;

  const gate = isUnorderedGates(jc)
    ? findPendingReplayGate(jc, currRequestUrl, method)
    : null;
  if (isUnorderedGates(jc)) {
    if (!gate) return;
  } else if (!currentJumpStepMatchesUrl(state, currRequestUrl, method)) {
    return;
  }

  const step = isUnorderedGates(jc)
    ? gate.step
    : jc.steps[jc.currentStepIndex];
  if (stepMatchMode(step) === 'presence') return;

  const stepKey = isUnorderedGates(jc)
    ? gate.stepKey
    : jumpConfigStepKey(step, jc.currentStepIndex);
  if (step.once !== false && jc.completedStepKeys.has(stepKey)) return;
  if (jc.isApplying) return;

  if (isJumpConfigDiagUrl(currRequestUrl)) {
    logJumpConfigDiag('standalone replay start', {
      stepKey,
      url: currRequestUrl,
      method: method || 'GET',
    });
  }

  jc.isApplying = true;
  try {
    storeInRequestsMap(requestId, {
      headers: formatHeader,
      method,
      url: currRequestUrl,
      requestId,
      jumpConfigStandalone: true,
      type,
    });

    const entry = getPageDecodeState().state.requestsMap[requestId];
    const responseData = await fetchRequestData({
      url: currRequestUrl,
      method,
      header: formatHeader,
      body: entry?.body,
      isFormData: entry?.isFormData,
    });

    if (responseData == null) {
      if (isJumpConfigDiagUrl(currRequestUrl)) {
        logJumpConfigDiag('standalone replay failed', {
          stepKey,
          url: currRequestUrl,
          allowDefaultJumpFallback:
            stepNavigateEnabled(step) && !jc.assemble,
        });
      }
      const allowFallback =
        stepNavigateEnabled(step) && !jc.assemble;
      const fallback = jc.defaultJumpUrl;
      if (allowFallback && fallback && state.dataSourcePageTabId != null) {
        try {
          await applyJumpConfigDataSourceNavigation(
            state.activeTemplate,
            state.dataSourcePageTabId,
            fallback,
            { linkedInFollowUpNav: false }
          );
        } catch (_e) {
          /* ignore */
        }
      }
      return;
    }

    if (isJumpConfigDiagUrl(currRequestUrl)) {
      logJumpConfigDiag('standalone replay ok', {
        stepKey,
        url: currRequestUrl,
      });
    }
    await runJumpConfigStepIfMatched(currRequestUrl, responseData, method);
  } catch (e) {
    console.warn('jumpConfig: standalone intercept failed', e);
  } finally {
    jc.isApplying = false;
  }
}
