import { utils } from 'ethers';
// Common configuration: centrally define level-to-range rules (sorted in ascending order)
const LEVEL_RULES = [
  { level: 1, min: 0, max: 10 }, // 0 < x ≤ 10 → Level 1
  { level: 2, min: 10, max: 50 }, // 10 < x ≤ 50 → Level 2
  { level: 3, min: 50, max: 100 }, // 50 < x ≤ 100 → Level 3
  { level: 4, min: 100, max: 200 }, // 100 < x ≤ 200 → Level 4
  { level: 5, min: 200, max: Infinity }, // x > 200 → Level 5
];

/**
 * Get corresponding level based on input value (using common configuration)
 * @param {string|number} num - Input number (supports string or number type)
 * @returns {number} Level from 1 to 5 (returns 0 for invalid input)
 */
// = LEVEL_RULES
export function getLevel(num, rulesArr) {
  if (num === null || num === undefined) return 0;
  const numStr = String(num).trim();
  if (!numStr || Number(numStr) <= 0) return 0;
  const valueBN = utils.parseUnits(numStr, 18);

  // Iterate through configuration to find matching level
  for (const rule of rulesArr) {
    // if (value > rule.min && value <= rule.max) {
    //   return rule.level;
    // }
    if (rule.max === Infinity) {
      const minBN = utils.parseUnits(String(rule.min), 18);
      if (valueBN.gt(minBN)) return rule.level;
      continue;
    }

    const minBN = utils.parseUnits(String(rule.min), 18);
    const maxBN = utils.parseUnits(String(rule.max), 18);

    if (valueBN.gt(minBN) && valueBN.lte(maxBN)) {
      return rule.level;
    }
  }

  return 0; // Fallback (theoretically unreachable)
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
