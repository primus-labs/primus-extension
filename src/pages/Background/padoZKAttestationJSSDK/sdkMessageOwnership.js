import { isSdkMessageFromOwner } from '../messageSenderPolicy.js';

/**
 * Applies SDK sender ownership and guarantees one explicit blocked response.
 * @param {{
 *   name: string;
 *   senderTabId?: number;
 *   initializedOwnerTabId?: number | null;
 *   activeOwnerTabId?: number | null;
 *   onBlocked: (hasOwner: boolean) => Promise<void>;
 *   respond: (payload: { ok: false }) => void;
 * }} options
 * @returns {Promise<boolean>}
 */
export async function authorizeSdkMessage(options) {
  if (
    isSdkMessageFromOwner(
      options.name,
      options.senderTabId,
      options.initializedOwnerTabId,
      options.activeOwnerTabId
    )
  ) {
    return true;
  }

  const relevantOwnerTabId =
    options.name === 'startAttestation'
      ? options.initializedOwnerTabId
      : options.activeOwnerTabId;
  await options.onBlocked(relevantOwnerTabId != null);
  options.respond({ ok: false });
  return false;
}

/**
 * @param {string} name
 * @param {boolean} hasOwner
 */
export function createSdkOwnershipErrorMessage(name, hasOwner) {
  const code = hasOwner ? '00003' : '00001';
  return {
    type: 'padoZKAttestationJSSDK',
    name:
      name === 'initAttestation'
        ? 'initAttestationRes'
        : 'startAttestationRes',
    params: {
      result: false,
      errorData: {
        code,
        desc: hasOwner
          ? 'Another tab owns the current SDK session. Please try again later.'
          : 'The algorithm has not been initialized. Please initialize it and try again.',
      },
      reStartFlag: true,
    },
  };
}
