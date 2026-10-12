import { RANGE_OPERATORS } from '../padoZKAttestationJSSDK/buildAggregateSubcondition.js';

/**
 * @param {unknown} op
 * @returns {boolean}
 */
export function isRangeOperator(op) {
  return typeof op === 'string' && RANGE_OPERATORS.includes(op);
}

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * Coerce for numeric ops: both sides must be finite numbers to use numeric compare.
 * @param {unknown} actual
 * @param {unknown} expected
 */
function tryNumericPair(actual, expected) {
  const a = Number(actual);
  const b = Number(expected);
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) {
    return null;
  }
  return { a, b };
}

/**
 * Compare one extracted value against attCondition FIELD_RANGE op/value.
 * Numeric ops use Number() when both sides are finite; else string compare for =/!=.
 *
 * @param {unknown} actual
 * @param {string} op
 * @param {unknown} expected
 * @returns {boolean}
 */
export function evaluateFieldRange(actual, op, expected) {
  if (!isRangeOperator(op)) {
    return false;
  }

  switch (op) {
    case 'STREQ':
      return String(actual) === String(expected);
    case 'STRNEQ':
      return String(actual) !== String(expected);
    case 'STRCASEEQ':
      return String(actual).toLowerCase() === String(expected).toLowerCase();
    case 'STRCASENEQ':
      return String(actual).toLowerCase() !== String(expected).toLowerCase();
    case '=': {
      const pair = tryNumericPair(actual, expected);
      if (pair) return pair.a === pair.b;
      return String(actual) === String(expected);
    }
    case '!=': {
      const pair = tryNumericPair(actual, expected);
      if (pair) return pair.a !== pair.b;
      return String(actual) !== String(expected);
    }
    case '>': {
      const pair = tryNumericPair(actual, expected);
      if (pair) return pair.a > pair.b;
      return String(actual) > String(expected);
    }
    case '>=': {
      const pair = tryNumericPair(actual, expected);
      if (pair) return pair.a >= pair.b;
      return String(actual) >= String(expected);
    }
    case '<': {
      const pair = tryNumericPair(actual, expected);
      if (pair) return pair.a < pair.b;
      return String(actual) < String(expected);
    }
    case '<=': {
      const pair = tryNumericPair(actual, expected);
      if (pair) return pair.a <= pair.b;
      return String(actual) <= String(expected);
    }
    default:
      return false;
  }
}

/**
 * JsonPath may return multiple nodes; pass if any value satisfies op/value.
 *
 * @param {unknown[]} values
 * @param {string} op
 * @param {unknown} expected
 * @returns {boolean}
 */
export function evaluateFieldRangeAny(values, op, expected) {
  if (!Array.isArray(values) || values.length === 0) {
    return false;
  }
  return values.some((v) => evaluateFieldRange(v, op, expected));
}
