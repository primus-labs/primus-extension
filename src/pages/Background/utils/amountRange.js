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

export function getLevelObj(num, rulesArr) {
  if (num === null || num === undefined) return 0;
  const numStr = String(num).trim();
  if (!numStr || Number(numStr) <= 0) return 0;
  const valueBN = utils.parseUnits(numStr, 18);

  // Iterate through configuration to find matching level
  for (const rule of rulesArr) {
    const { min, max, startIntervalType, endIntervalType, level } = rule;
    // if (value > rule.min && value <= rule.max) {
    //   return rule.level;
    // }
    const startPointCompareName = startIntervalType === 'open' ? 'gt' : 'gte';
    const endPointCompareName = endIntervalType === 'open' ? 'lt' : 'lte';
    if (max === Infinity) {
      const minBN = utils.parseUnits(String(min), 18);
      if (valueBN[startPointCompareName](minBN)) return level;
      continue;
    }
    const minBN = utils.parseUnits(String(rule.min), 18);
    const maxBN = utils.parseUnits(String(rule.max), 18);
    if (
      valueBN[startPointCompareName](minBN) &&
      valueBN[endPointCompareName](maxBN)
    ) {
      return rule;
    }
  }

  return undefined; // Fallback (theoretically unreachable)
}
