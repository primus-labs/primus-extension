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

/** Normalize algorithm RPC payload for SDK event-report `errorData.data`. */
export function parseAlgorithmReportData(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw !== 'string') return raw as Record<string, unknown>;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { raw };
  }
}

export function strToHex(str: string) {
  const value = Buffer.from(str, 'utf-8');
  const returnValue = ethereumjsUtil.bufferToHex(
    ethereumjsUtil.keccak256(value)
  );
  return returnValue;
}
