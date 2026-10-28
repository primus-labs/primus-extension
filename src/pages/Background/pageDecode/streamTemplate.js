/**
 * Template helpers for responseTemplate valueType STREAM (stream body attestation).
 * requestTemplate must set ignoreResponse: true and requireReplayValidation: true
 * so replay skips JSONPath validation (non-JSON stream bodies).
 */

export const STREAM_RESPONSE_VALUE_TYPE = 'STREAM';
export const STREAM_REVEAL_OP = 'REVEAL_HEX_STRING';
export const DEFAULT_REVEAL_OP = 'REVEAL_STRING';
export const DEFAULT_REVEAL_TYPE = 'FIELD_REVEAL';

export function isStreamResponseValueType(valueType) {
  return String(valueType || '').toUpperCase() === STREAM_RESPONSE_VALUE_TYPE;
}

export function responseTemplateIndicatesStream(responseTemplate) {
  if (!Array.isArray(responseTemplate)) {
    return false;
  }
  return responseTemplate.some((rt) => isStreamResponseValueType(rt?.valueType));
}

export function getDefaultRevealOpForResponseValueType(valueType) {
  return isStreamResponseValueType(valueType) ? STREAM_REVEAL_OP : DEFAULT_REVEAL_OP;
}
