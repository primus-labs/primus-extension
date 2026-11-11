/**
 * Map SDK attConditions onto algorithm response subconditions (mirrors attestation.js).
 */
import {
  buildAggregateSubcondition,
  RANGE_OPERATORS,
} from './buildAggregateSubcondition.js';
import {
  DEFAULT_REVEAL_TYPE,
  getDefaultRevealOpForResponseValueType,
} from '../pageDecode/streamTemplate.js';
/**
 * @param {string} raw
 * @param {unknown} [fallback]
 */
function safeJsonParse(raw, fallback = null) {
  if (typeof raw !== 'string' || raw === '') {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * @typedef {{ field?: string; op?: string; key?: string; value?: unknown; type?: string; aggregateOp?: string }} AttConditionItem
 */

/**
 * @param {unknown} attConditions
 * @param {string} revealId
 * @returns {AttConditionItem | null}
 */
export function findAttConditionForRevealId(attConditions, revealId) {
  if (!Array.isArray(attConditions) || !revealId) {
    return null;
  }
  for (const group of attConditions) {
    if (!Array.isArray(group)) {
      continue;
    }
    for (const item of group) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const matchField = item.op === 'MATCH_ONE' ? item.key : item.field;
      if (matchField === revealId) {
        return /** @type {AttConditionItem} */ (item);
      }
    }
  }
  return null;
}

/**
 * @param {Record<string, unknown>} baseSubcondition
 * @param {AttConditionItem | null | undefined} attCondition
 * @param {{ computeMode?: string; valueType?: string; feildEntry?: unknown }} [options]
 * @returns {Record<string, unknown>}
 */
export function applyAttConditionToSubcondition(
  baseSubcondition,
  attCondition,
  options = {}
) {
  const revealId = baseSubcondition?.reveal_id;
  const expression = baseSubcondition?.field;
  const valueType = options.valueType;

  /** @type {Record<string, unknown>} */
  let subconditionItem = {
    ...baseSubcondition,
    field: expression,
  };

  const handleREVEALFn = () => {
    subconditionItem.op = getDefaultRevealOpForResponseValueType(valueType);
    subconditionItem.type = DEFAULT_REVEAL_TYPE;
    if (revealId != null && revealId !== '') {
      subconditionItem.reveal_id = revealId;
    }
  };

  const handleNoneComputeFn = () => {
    subconditionItem.op = 'NONE';
    subconditionItem.type = 'FIELD_VALUE';
    if (revealId != null && revealId !== '') {
      subconditionItem.reveal_id = revealId;
    }
  };

  const computeMode = options.computeMode;
  if (computeMode === 'nonecomplete' || computeMode === 'nonepartial') {
    handleNoneComputeFn();
    return subconditionItem;
  }

  if (!attCondition) {
    return subconditionItem;
  }

  const hasAggregateOp =
    attCondition.aggregateOp != null && attCondition.aggregateOp !== '';
  if (hasAggregateOp) {
    const built = buildAggregateSubcondition(
      attCondition,
      { expression, feildEntry: options.feildEntry },
      revealId
    );
    if (built) {
      return built;
    }
    handleREVEALFn();
    return subconditionItem;
  }

  const { op, value, field, type } = attCondition;
  subconditionItem.op = op;
  if (typeof op === 'string' && RANGE_OPERATORS.includes(op)) {
    subconditionItem.type = 'FIELD_RANGE';
    subconditionItem.value = value;
  } else if (op === 'SHA256') {
    subconditionItem.type = 'FIELD_VALUE';
    if (revealId != null && revealId !== '') {
      subconditionItem.reveal_id = revealId;
    }
  } else if (op === 'SHA256_EX' || op === 'REVEAL_HEX_STRING') {
    subconditionItem.type = 'FIELD_REVEAL';
    subconditionItem.op = 'REVEAL_HEX_STRING';
    if (revealId != null && revealId !== '') {
      subconditionItem.reveal_id = revealId;
    }
    subconditionItem.field = {
      type: 'FIELD_ARITHMETIC',
      op: 'SHA256',
      field: expression,
    };
  } else if (op === 'SHA256_WITH_SALT') {
    subconditionItem.type = 'FIELD_REVEAL';
    subconditionItem.op = 'REVEAL_SALTTED_HASH';
    if (revealId != null && revealId !== '') {
      subconditionItem.reveal_id = revealId;
    }
    subconditionItem.field = {
      type: 'FIELD_ARITHMETIC',
      op,
      field: expression,
    };
  } else if (op === 'REVEAL_STRING') {
    handleREVEALFn();
  } else if (op === 'MATCH_ONE') {
    return { type, op, field, subconditions: value };
  } else {
    handleREVEALFn();
  }

  return subconditionItem;
}

/**
 * Apply SDK attRequest.attConditions to fallback response subconditions.
 *
 * @param {unknown[]} responses
 * @param {{ ext?: { appSignParameters?: string } } | null | undefined} activeTemplate
 */
export function applySdkAttConditionsToResponseSubconditions(
  responses,
  activeTemplate
) {
  const appSignRaw = activeTemplate?.ext?.appSignParameters;
  if (appSignRaw == null || appSignRaw === '') {
    return;
  }
  const attRequest =
    typeof appSignRaw === 'string'
      ? safeJsonParse(appSignRaw, null)
      : appSignRaw;
  if (!attRequest || typeof attRequest !== 'object') {
    return;
  }

  const attConditions = attRequest.attConditions;
  const computeMode = attRequest.computeMode;
  const hasAttConditions =
    Array.isArray(attConditions) && attConditions.length > 0;
  const hasNoneCompute =
    computeMode === 'nonecomplete' || computeMode === 'nonepartial';
  if (!hasAttConditions && !hasNoneCompute) {
    return;
  }

  if (!Array.isArray(responses)) {
    return;
  }

  for (const resp of responses) {
    if (!resp || typeof resp !== 'object') {
      continue;
    }
    const conditions = /** @type {{ subconditions?: unknown[] }} */ (resp)
      .conditions;
    const subconditions = conditions?.subconditions;
    if (!Array.isArray(subconditions)) {
      continue;
    }
    for (let idx = 0; idx < subconditions.length; idx++) {
      const base = subconditions[idx];
      if (!base || typeof base !== 'object') {
        continue;
      }
      const revealId = /** @type {{ reveal_id?: string }} */ (base).reveal_id;
      if (!revealId) {
        continue;
      }
      const attCond = findAttConditionForRevealId(attConditions, revealId);
      if (!attCond && !hasNoneCompute) {
        continue;
      }
      subconditions[idx] = applyAttConditionToSubcondition(
        /** @type {Record<string, unknown>} */ (base),
        attCond,
        { computeMode }
      );
    }
  }
}
