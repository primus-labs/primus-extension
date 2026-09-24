/**
 * Builds algorithm subconditions for array aggregate attConditions (aggregateOp).
 *
 * Template expression like `$.dailySpend[*].totalTokens` splits into algorithm form:
 * - field: `$.dailySpend[*]+`
 * - subfields: [`+.totalTokens`]
 *
 * @example Reveal sum of array elements
 * attConditions: [[{ field: "dailySpend", aggregateOp: "+" }]]
 * Template expression: "$.dailySpend[*].totalTokens"
 *
 * @example Prove sum >= threshold
 * attConditions: [[{ field: "dailySpend", aggregateOp: "+", op: ">=", value: 100000 }]]
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
 * Reconstruct a standard JSONPath for response validation from arithmetic field shape.
 * @param {{ field?: string, subfields?: string[] }} arithmeticField
 * @returns {string | null}
 */
export function resolveJsonPathFromArithmeticField(arithmeticField) {
  if (!arithmeticField || typeof arithmeticField !== 'object') {
    return null;
  }
  const arrayField = arithmeticField.field;
  const subfields = arithmeticField.subfields;
  if (
    typeof arrayField === 'string' &&
    arrayField.includes('[*]+') &&
    Array.isArray(subfields) &&
    typeof subfields[0] === 'string' &&
    subfields[0].startsWith('+.')
  ) {
    const base = arrayField.replace('[*]+', '[*]');
    return `${base}.${subfields[0].slice(2)}`;
  }
  if (typeof arrayField === 'string' && !arrayField.includes('[*]+')) {
    return arrayField;
  }
  if (Array.isArray(subfields) && typeof subfields[0] === 'string') {
    if (subfields[0].startsWith('+.')) {
      return null;
    }
    return subfields[0];
  }
  return null;
}

/**
 * @param {string} expression
 * @param {string} aggregateOp
 * @returns {{ type: string, op: string, field: string, subfields: string[] } | null}
 */
function buildArithmeticField(expression, aggregateOp) {
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
export function resolveJsonPathForValidation(subcondition) {
  if (subcondition == null) {
    return null;
  }
  if (typeof subcondition === 'string') {
    return subcondition;
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
    if (typeof field.field === 'string' && !field.field.includes('[*]+')) {
      return field.field;
    }
  }
  return null;
}

/**
 * @param {{ aggregateOp?: string, op?: string, value?: unknown }} condition
 * @param {string} expression Template resolver.expression (array element JSONPath)
 * @param {string} revealKey Template feilds[].key
 * @returns {Record<string, unknown> | null} Algorithm subcondition, or null if aggregateOp invalid
 */
export function buildAggregateSubcondition(condition, expression, revealKey) {
  const aggregateOp = condition?.aggregateOp;
  if (aggregateOp == null || aggregateOp === '') {
    return null;
  }
  if (!ALLOWED_AGGREGATE_OPS.includes(aggregateOp)) {
    return null;
  }

  const arithmeticField = buildArithmeticField(expression, aggregateOp);
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
