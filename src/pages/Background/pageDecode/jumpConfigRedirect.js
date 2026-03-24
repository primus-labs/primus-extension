/**
 * Generic multi-step tab redirects driven by dataPageTemplate.jumpConfig:
 * intercept URL + JSON response -> extract (JSONPath) -> assemble URL -> chrome.tabs.update.
 */
import jp from 'jsonpath';
import { checkIsRequiredUrl } from '../utils/utils';
import { getPageDecodeState } from './state';
import { fetchRequestData } from './utils';

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
    return;
  }
  state.jumpConfigState = {
    defaultJumpUrl: jumpConfig.defaultJumpUrl || '',
    steps: jumpConfig.steps,
    currentStepIndex: 0,
    extractedParams: {},
    completedStepKeys: new Set(),
    isApplying: false,
  };
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
 * @param {object} responseData
 * @param {object[]} extractRules
 * @param {object} existingParams
 */
function extractJumpParams(responseData, extractRules, existingParams) {
  const prev = existingParams && typeof existingParams === 'object' ? existingParams : {};
  const out = {};
  if (!Array.isArray(extractRules)) return { ...prev };

  for (const rule of extractRules) {
    const key = rule?.paramKey;
    if (!key) continue;
    const from = rule.from || 'responseJson';
    let raw;
    if (from === 'responseJson' && rule.jsonPath) {
      try {
        const found = jp.query(responseData, rule.jsonPath);
        raw = found.length ? found[0] : undefined;
      } catch (_e) {
        raw = undefined;
      }
    }
    if (raw === undefined || raw === null) {
      out[key] =
        rule.defaultValue !== undefined && rule.defaultValue !== null
          ? rule.defaultValue
          : '';
    } else {
      out[key] = typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
    }
  }
  return { ...prev, ...out };
}

/**
 * @param {*} paramValue
 * @param {string} operator
 * @param {*} compareValue
 */
function evaluateCondition(paramValue, operator, compareValue) {
  const a = paramValue == null ? '' : String(paramValue);
  const op = String(operator || 'eq').toLowerCase();
  if (op === 'eq') return a === String(compareValue);
  if (op === 'ne') return a !== String(compareValue);
  if (op === 'contains') return a.includes(String(compareValue));
  if (op === 'in') {
    if (Array.isArray(compareValue)) {
      return compareValue.map(String).includes(a);
    }
    return String(compareValue)
      .split(',')
      .map((s) => s.trim())
      .includes(a);
  }
  return false;
}

/**
 * Replace `{paramKey}` in template string using params.
 * @param {string} template
 * @param {object} params
 */
function interpolateUrlTemplate(template, params) {
  if (typeof template !== 'string') return '';
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = params[k];
    return v != null && v !== '' ? encodeURIComponent(String(v)) : '';
  });
}

/**
 * @param {object} assemble
 * @param {object} params
 * @param {string} defaultJumpUrl
 * @param {string} [jumpToFallback]
 */
function assembleJumpUrl(assemble, params, defaultJumpUrl, jumpToFallback) {
  if (!assemble || typeof assemble !== 'object') {
    return defaultJumpUrl || jumpToFallback || '';
  }

  const { condition, paramMode, params: assembleParams } = assemble;
  let baseUrl = assemble.baseUrl || '';

  if (condition && condition.paramKey) {
    const pv = params[condition.paramKey];
    const ok = evaluateCondition(
      pv,
      condition.operator,
      condition.value
    );
    if (ok && condition.trueUrl) return interpolateUrlTemplate(condition.trueUrl, params);
    if (!ok && condition.falseUrl) {
      return interpolateUrlTemplate(condition.falseUrl, params);
    }
  }

  baseUrl = interpolateUrlTemplate(baseUrl, params);
  if (!baseUrl) {
    return defaultJumpUrl || jumpToFallback || '';
  }

  const mode = paramMode || 'query';
  const list = Array.isArray(assembleParams) ? assembleParams : [];

  if (mode === 'query') {
    const sp = new URLSearchParams();
    for (const item of list) {
      if (!item?.key) continue;
      const val =
        item.valueType === 'dynamic' && item.value != null
          ? params[item.value]
          : item.value;
      if (val !== undefined && val !== null && String(val) !== '') {
        sp.append(item.key, String(val));
      }
    }
    const q = sp.toString();
    return q ? `${baseUrl.split('#')[0]}?${q}` : baseUrl.split('#')[0];
  }

  if (mode === 'path') {
    let url = baseUrl.split('#')[0];
    for (const item of list) {
      if (!item?.key) continue;
      const val =
        item.valueType === 'dynamic' && item.value != null
          ? params[item.value]
          : item.value;
      const seg =
        val != null && val !== ''
          ? encodeURIComponent(String(val))
          : '';
      url = url.replace(
        new RegExp(`\\{${item.key}\\}`, 'g'),
        seg
      );
    }
    return url;
  }

  return baseUrl.split('#')[0] || defaultJumpUrl || jumpToFallback || '';
}

/**
 * Current step expects a JSON body (skip main_frame HTML for standalone fetch).
 */
export function currentJumpStepMatchesUrl(state, requestUrl, method) {
  const jc = state.jumpConfigState;
  if (!jc || jc.currentStepIndex >= jc.steps.length) return false;
  const step = jc.steps[jc.currentStepIndex];
  return interceptMatchesStep(step, requestUrl, method);
}

/**
 * When request is not a template capture target but matches jumpConfig current step, store POST body.
 */
export function shouldStoreBodyForJumpConfig(state, currRequestUrl, method) {
  if (!currentJumpStepMatchesUrl(state, currRequestUrl, method)) return false;
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
  if (!jc?.steps?.length || jc.currentStepIndex >= jc.steps.length) {
    return false;
  }

  const step = jc.steps[jc.currentStepIndex];
  const stepKey = step.stepId ?? `idx_${jc.currentStepIndex}`;
  const once = step.once !== false;
  if (once && jc.completedStepKeys.has(stepKey)) return false;

  if (!interceptMatchesStep(step, requestUrl, method)) return false;

  if (
    responseData == null ||
    (typeof responseData !== 'object' && typeof responseData !== 'string')
  ) {
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
  const jumpTo = state.activeTemplate?.jumpTo;
  let newUrl = assembleJumpUrl(
    step.assemble,
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

  await chrome.tabs.update(tabId, { url: newUrl });
  jc.completedStepKeys.add(stepKey);
  jc.currentStepIndex += 1;
  console.log('jumpConfig: step done', stepKey, '->', newUrl);
  return true;
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
  if (!jc?.steps?.length || jc.currentStepIndex >= jc.steps.length) return;
  if (jc.isApplying) return;

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
  const { state } = getPageDecodeState();
  if (type === 'main_frame') return;
  if (!currentJumpStepMatchesUrl(state, currRequestUrl, method)) return;

  const jc = state.jumpConfigState;
  const step = jc.steps[jc.currentStepIndex];
  const stepKey = step.stepId ?? `idx_${jc.currentStepIndex}`;
  if (step.once !== false && jc.completedStepKeys.has(stepKey)) return;
  if (jc.isApplying) return;

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
      const fallback = jc.defaultJumpUrl;
      if (fallback && state.dataSourcePageTabId != null) {
        try {
          await chrome.tabs.update(state.dataSourcePageTabId, { url: fallback });
        } catch (_e) {
          /* ignore */
        }
      }
      return;
    }

    await runJumpConfigStepIfMatched(currRequestUrl, responseData, method);
  } catch (e) {
    console.warn('jumpConfig: standalone intercept failed', e);
  } finally {
    jc.isApplying = false;
  }
}
