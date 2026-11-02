/**
 * Pure jumpConfig URL/param helpers (no chrome / page decode deps; unit-testable).
 */
import jp from 'jsonpath';

/**
 * @param {object} responseData
 * @param {object[]} extractRules
 * @param {object} existingParams
 */
export function extractJumpParams(responseData, extractRules, existingParams) {
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
export function assembleJumpUrl(assemble, params, defaultJumpUrl, jumpToFallback) {
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
 * @param {string[]} requireParams
 * @param {object} extractedParams
 */
export function jumpConfigRequireParamsSatisfied(requireParams, extractedParams) {
  const keys = requireParams;
  if (!Array.isArray(keys) || keys.length === 0) return true;
  for (const key of keys) {
    const v = extractedParams?.[key];
    if (v == null || String(v).trim() === '') {
      return false;
    }
  }
  return true;
}

/**
 * @param {object} step
 * @param {number} index
 */
export function jumpConfigStepKey(step, index) {
  return step?.stepId ?? `idx_${index}`;
}

/**
 * @param {{ stepOrder?: string, steps: object[], currentStepIndex: number, completedStepKeys: Set|Iterable<string> }} snapshot
 */
export function jumpConfigAllStepsComplete(snapshot) {
  const { steps, currentStepIndex, stepOrder } = snapshot;
  if (!Array.isArray(steps) || steps.length === 0) return false;

  const completed = snapshot.completedStepKeys;
  const hasKey = (key) =>
    completed instanceof Set
      ? completed.has(key)
      : Array.from(completed || []).includes(key);

  if (stepOrder === 'any') {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.once === false) continue;
      if (!hasKey(jumpConfigStepKey(step, i))) return false;
    }
    return true;
  }

  return currentStepIndex >= steps.length;
}
