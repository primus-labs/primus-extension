/**
 * Builds algorithm subconditions for array aggregate attConditions (aggregateOp).
 *
 * Single-level: template expression `$.dailySpend[*].totalTokens` splits into:
 * - field: `$.dailySpend[*]+`
 * - subfields: [`+.totalTokens`]
 *
 * Nested: `feilds[].aggregation` FIELD_ARITHMETIC tree (DeepSeek spend / Cursor series).
 *
 * @example Reveal sum of array elements
 * attConditions: [[{ field: "dailySpend", aggregateOp: "+" }]]
 *
 * @example Nested template aggregation
 * attConditions: [[{ field: "spend", aggregateOp: "+" }]]
 * feilds[].aggregation: { type: FIELD_ARITHMETIC, field: $.data...series[*]+, subfields: [...] }
 */

export const ALLOWED_AGGREGATE_OPS = ['+', '*'];

export const RANGE_OPERATORS = [
  '>',
  '>=',
  '=',
  '!=',
  '<',
  '<=',
  'STREQ',
  'STRNEQ',
  'STRCASEEQ',
  'STRCASENEQ',
];

/** Matches array wildcard segment followed by a property path, e.g. $.dailySpend[*].totalTokens */
const ARRAY_ELEMENT_EXPRESSION_RE = /^(.+\[\*\])\.(.+)$/;

/**
 * Split template JSONPath into FIELD_ARITHMETIC array field + relative subfields.
 * @param {string} expression
 * @returns {{ arrayField: string, subfields: string[] } | null}
 */
export function splitExpressionForAggregate(expression) {
  if (typeof expression !== 'string' || !expression.trim()) {
    return null;
  }
  const trimmed = expression.trim();
  const match = trimmed.match(ARRAY_ELEMENT_EXPRESSION_RE);
  if (!match) {
    return null;
  }
  const [, arrayPrefix, relativePath] = match;
  return {
    arrayField: `${arrayPrefix}+`,
    subfields: [`+.${relativePath}`],
  };
}

/**
 * Append a relative segment (+.path or +.path[*]+) to a JSONPath prefix for validation sampling.
 * @param {string} prefix
 * @param {string} relativeField
 * @returns {string | null}
 */
function appendRelativeFieldToJsonPath(prefix, relativeField) {
  if (typeof relativeField !== 'string' || !relativeField.startsWith('+.')) {
    return null;
  }
  let segment = relativeField.slice(2);
  segment = segment.replace(/\[\*\]\+$/, '[0]');
  if (!segment) {
    return null;
  }
  return `${prefix}.${segment}`;
}

/**
 * @param {unknown} subfieldItem
 * @param {string} pathPrefix
 * @returns {string | null}
 */
function resolveSamplePathFromSubfield(subfieldItem, pathPrefix) {
  if (typeof subfieldItem === 'string') {
    if (!subfieldItem.startsWith('+.')) {
      return subfieldItem;
    }
    return appendRelativeFieldToJsonPath(pathPrefix, subfieldItem);
  }
  if (
    subfieldItem &&
    typeof subfieldItem === 'object' &&
    subfieldItem.type === 'FIELD_ARITHMETIC'
  ) {
    return resolveJsonPathFromArithmeticField(subfieldItem, pathPrefix);
  }
  return null;
}

/**
 * Reconstruct a sample JSONPath for response validation from arithmetic field shape (supports nested trees).
 * @param {{ type?: string, field?: string, subfields?: unknown[] }} arithmeticField
 * @param {string} [pathPrefix] Parent path for nested relative fields
 * @returns {string | null}
 */
export function resolveJsonPathFromArithmeticField(arithmeticField, pathPrefix) {
  if (!arithmeticField || typeof arithmeticField !== 'object') {
    return null;
  }
  const arrayField = arithmeticField.field;
  const subfields = arithmeticField.subfields;

  let currentPrefix = pathPrefix;
  if (typeof arrayField === 'string') {
    if (arrayField.startsWith('+.')) {
      if (!pathPrefix) {
        return null;
      }
      currentPrefix = appendRelativeFieldToJsonPath(pathPrefix, arrayField);
      if (!currentPrefix) {
        return null;
      }
    } else if (arrayField.includes('[*]+')) {
      currentPrefix = arrayField.replace('[*]+', '[0]');
    } else if (!arrayField.includes('[*]+')) {
      currentPrefix = arrayField;
    } else {
      return null;
    }
  }

  if (!currentPrefix || !Array.isArray(subfields) || subfields.length === 0) {
    if (typeof arrayField === 'string' && !arrayField.includes('[*]+') && !arrayField.startsWith('+.')) {
      return arrayField;
    }
    return null;
  }

  for (const item of subfields) {
    const resolved = resolveSamplePathFromSubfield(item, currentPrefix);
    if (resolved) {
      return resolved;
    }
  }
  return null;
}

/**
 * @param {unknown} item
 * @param {boolean} isRoot
 * @param {string | null} sdkAggregateOp Root op override from SDK when isRoot
 * @returns {{ type: string, op: string, field: string, subfields: unknown[] } | null}
 */
function normalizeAggregationNode(item, isRoot, sdkAggregateOp) {
  if (typeof item === 'string') {
    return null;
  }
  if (!item || typeof item !== 'object') {
    return null;
  }
  const node = /** @type {Record<string, unknown>} */ (item);
  if (node.type !== 'FIELD_ARITHMETIC') {
    return null;
  }
  const field = node.field;
  const subfields = node.subfields;
  if (typeof field !== 'string' || !field.trim()) {
    return null;
  }
  if (!Array.isArray(subfields) || subfields.length === 0) {
    return null;
  }

  let op = node.op;
  if (isRoot && sdkAggregateOp) {
    op = sdkAggregateOp;
  }
  if (typeof op !== 'string' || !ALLOWED_AGGREGATE_OPS.includes(op)) {
    return null;
  }

  const normalizedSubfields = [];
  for (const sub of subfields) {
    if (typeof sub === 'string') {
      normalizedSubfields.push(sub);
      continue;
    }
    const nested = normalizeAggregationNode(sub, false, null);
    if (!nested) {
      return null;
    }
    normalizedSubfields.push(nested);
  }

  return {
    type: 'FIELD_ARITHMETIC',
    op,
    field,
    subfields: normalizedSubfields,
  };
}

/**
 * Normalize template feilds[].aggregation into algorithm FIELD_ARITHMETIC tree.
 * Root op uses SDK aggregateOp; nested ops come from template.
 * @param {Record<string, unknown> | null | undefined} aggregation
 * @param {string} sdkAggregateOp
 * @returns {Record<string, unknown> | null}
 */
export function normalizeTemplateAggregation(aggregation, sdkAggregateOp) {
  if (!aggregation || typeof aggregation !== 'object') {
    return null;
  }
  return normalizeAggregationNode(aggregation, true, sdkAggregateOp);
}

/**
 * @param {string} expression
 * @param {string} aggregateOp
 * @returns {{ type: string, op: string, field: string, subfields: string[] } | null}
 */
function buildArithmeticFieldFromExpression(expression, aggregateOp) {
  const split = splitExpressionForAggregate(expression);
  if (!split) {
    return null;
  }
  return {
    type: 'FIELD_ARITHMETIC',
    op: aggregateOp,
    field: split.arrayField,
    subfields: split.subfields,
  };
}

/**
 * Resolve a JSONPath string from a subcondition for pre-attestation response validation.
 * @param {Record<string, unknown> | string | null | undefined} subcondition
 * @returns {string | Record<string, unknown> | null}
 */
/**
 * Extension-only anchor from template resolver.expression when feilds[].aggregation is set.
 * Stripped before algorithm params are sent (see stripValidationJsonPathFromResponses).
 */
export const VALIDATION_JSON_PATH_KEY = 'validationJsonPath';

/**
 * @param {Array<{ conditions?: { subconditions?: unknown[] } }>} responses
 */
export function stripValidationJsonPathFromResponses(responses) {
  if (!Array.isArray(responses)) {
    return;
  }
  for (const resp of responses) {
    const subs = resp?.conditions?.subconditions;
    if (!Array.isArray(subs)) {
      continue;
    }
    for (const sub of subs) {
      if (sub && typeof sub === 'object') {
        delete sub[VALIDATION_JSON_PATH_KEY];
      }
    }
  }
}

export function resolveJsonPathForValidation(subcondition) {
  if (subcondition == null) {
    return null;
  }
  if (typeof subcondition === 'string') {
    return subcondition;
  }
  const anchor = subcondition[VALIDATION_JSON_PATH_KEY];
  if (typeof anchor === 'string' && anchor.trim()) {
    return anchor.trim();
  }
  if (subcondition.op === 'MATCH_ONE') {
    return subcondition;
  }
  const field = subcondition.field;
  if (typeof field === 'string') {
    if (field.includes('[*]+')) {
      return null;
    }
    return field;
  }
  if (field && typeof field === 'object' && !Array.isArray(field)) {
    const fromArithmetic = resolveJsonPathFromArithmeticField(field);
    if (fromArithmetic) {
      return fromArithmetic;
    }
    if (typeof field.field === 'string' && field.field.includes('[*]+')) {
      return null;
    }
    if (typeof field.field === 'string') {
      return field.field;
    }
  }
  return null;
}

/**
 * @param {{ aggregateOp?: string, op?: string, value?: unknown }} condition
 * @param {{ expression?: string, feildEntry?: { aggregation?: Record<string, unknown> } | null }} templateContext
 * @param {string} revealKey Template feilds[].key
 * @returns {Record<string, unknown> | null} Algorithm subcondition, or null if aggregateOp invalid
 */
export function buildAggregateSubcondition(condition, templateContext, revealKey) {
  const aggregateOp = condition?.aggregateOp;
  if (aggregateOp == null || aggregateOp === '') {
    return null;
  }
  if (!ALLOWED_AGGREGATE_OPS.includes(aggregateOp)) {
    return null;
  }

  const expression = templateContext?.expression;
  const feildEntry = templateContext?.feildEntry;

  let arithmeticField = null;
  if (feildEntry?.aggregation) {
    arithmeticField = normalizeTemplateAggregation(
      feildEntry.aggregation,
      aggregateOp
    );
  }
  if (!arithmeticField && typeof expression === 'string') {
    arithmeticField = buildArithmeticFieldFromExpression(expression, aggregateOp);
  }
  if (!arithmeticField) {
    return null;
  }

  const { op, value } = condition;
  const hasRangeCompare =
    op != null &&
    op !== '' &&
    op !== 'REVEAL_STRING' &&
    RANGE_OPERATORS.includes(op) &&
    value !== undefined;

  if (hasRangeCompare) {
    return {
      type: 'FIELD_RANGE',
      op,
      value,
      field: arithmeticField,
    };
  }

  return {
    type: 'FIELD_REVEAL',
    op: 'REVEAL_NUMBER',
    reveal_id: revealKey,
    field: arithmeticField,
  };
}
