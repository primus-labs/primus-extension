import { utils } from 'ethers';
// Common configuration: centrally define level-to-range rules (sorted in ascending order)
// const LEVEL_RULES = [
//   {
//     level: 1,
//     min: 0,
//     max: 10,
//     startIntervalType: 'open',
//     endIntervalType: 'closed',
//   }, // 0 < x ≤ 10 → Level 1
//   {
//     level: 2,
//     min: 10,
//     max: 50,
//     startIntervalType: 'open',
//     endIntervalType: 'closed',
//   }, // 10 < x ≤ 50 → Level 2
// ];

/**
 * Get corresponding level based on input value (using common configuration)
 * @param {string|number} num - Input number (supports string or number type)
 * @returns {number} Level from 1 to 5 (returns 0 for invalid input)
 */
// = LEVEL_RULES
export function getLevel(num, rulesArr) {
  return getLevelObj(num, rulesArr)?.level;
}

/**
 * Get corresponding range array based on level (using common configuration)
 * @param {number} level - Target level (1 to 5)
 * @returns {Array<number>} [min, max] (returns empty array for invalid level)
 */
export function getRangeByLevel(level, rulesArr) {
  // Find the range corresponding to the level from configuration
  const rule = rulesArr.find((rule) => rule.level === level);
  return rule ?? {};
}
const parseToBN = (value, decimals = 18) => {
  if (value === Infinity || value === 'Infinity') return Infinity;
  const valueStr = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(valueStr)) {
    throw new Error(`Invalid number value: ${value}`);
  }
  return utils.parseUnits(valueStr, decimals);
};
export function getLevelObj(num, rulesArr) {
  if (num === null || num === undefined) return undefined;
  if (!Array.isArray(rulesArr) || rulesArr.length === 0) return undefined;

  const numStr = String(num).trim();
  if (!numStr || isNaN(Number(numStr))) {
    return undefined;
  }

  if (num === Infinity) {
    const infinityRule = rulesArr.find((rule) => rule.max === Infinity);
    return infinityRule || undefined;
  }

  let valueBN;
  try {
    valueBN = parseToBN(numStr);
  } catch (err) {
    console.error('Failed to parse num to BN:', err);
    return undefined;
  }

  // Iterate through configuration to find matching level
  for (const rule of rulesArr) {
    const { min, max, startIntervalType, endIntervalType, level } = rule;
    if (
      min === undefined ||
      startIntervalType === undefined ||
      endIntervalType === undefined ||
      !['open', 'closed'].includes(startIntervalType) ||
      !['open', 'closed'].includes(endIntervalType)
    ) {
      console.warn('Invalid rule configuration:', rule);
      continue;
    }

    let minBN;
    try {
      minBN = parseToBN(min);
    } catch (err) {
      console.warn('Failed to parse rule.min:', err, 'rule:', rule);
      continue;
    }

    const startCompare =
      startIntervalType === 'open'
        ? (a, b) => a.gt(b) // open：a > b
        : (a, b) => a.gte(b); // closed：a >= b
    const endCompare =
      endIntervalType === 'open'
        ? (a, b) => a.lt(b) // open：a < b
        : (a, b) => a.lte(b); // closed：a <= b

    if (max === Infinity) {
      if (startCompare(valueBN, minBN)) {
        return rule;
      }
      continue;
    }

    let maxBN;
    try {
      maxBN = parseToBN(max);
    } catch (err) {
      console.warn('Failed to parse rule.max:', err, 'rule:', rule);
      continue;
    }

    if (startCompare(valueBN, minBN) && endCompare(valueBN, maxBN)) {
      return rule;
    }
    // if (value > rule.min && value <= rule.max) {
    //   return rule;
    // }
  }

  return undefined; // Fallback (theoretically unreachable)
}
