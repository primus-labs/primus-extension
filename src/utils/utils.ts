var ethereumjsUtil = require('ethereumjs-util');

/**
 * Safe JSON.parse for values from storage; returns fallback on invalid JSON.
 */
export function safeJsonParse<T = unknown>(str: string | undefined | null, fallback: T | null = null): T | null {
  try {
    if (str == null || str === '') return fallback;
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export function strToHex(str: string) {
  const value = Buffer.from(str, 'utf-8');
  const returnValue = ethereumjsUtil.bufferToHex(
    ethereumjsUtil.keccak256(value)
  );
  return returnValue;
}
