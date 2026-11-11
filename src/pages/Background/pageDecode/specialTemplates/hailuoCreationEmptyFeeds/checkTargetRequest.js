import { isCreationFeedsEmpty, isHailuoCreationRequestUrl } from './feedsEmpty.js';
import {
  findIdentityLookupInRequestsMap,
  resolveIdentityLookupResponse,
} from './identityCapture.js';
import {
  resetHailuoCreationEmptyFeedsMode,
  setHailuoCreationEmptyFeedsMode,
} from './modeState.js';
import { validateEmptyFeedsIdentityResponse } from './validateEmptyFeedsMode.js';

/**
 * @param {{
 *   state: { hailuoCreationEmptyFeedsMode?: boolean; hailuoIdentityLookupRequestId?: string | null };
 *   requestsMap: Record<string, unknown>;
 *   templateRequestUrl: string;
 *   matchRequestUrlResult: unknown;
 * }} ctx
 * @returns {Promise<{ handled: boolean; isMatch?: boolean }>}
 */
export async function tryCheckHailuoCreationEmptyFeedsTarget(ctx) {
  const { state, requestsMap, templateRequestUrl, matchRequestUrlResult } = ctx;

  if (!isHailuoCreationRequestUrl(templateRequestUrl)) {
    return { handled: false };
  }

  const feedsEmpty = isCreationFeedsEmpty(matchRequestUrlResult);
  if (!feedsEmpty) {
    resetHailuoCreationEmptyFeedsMode(state);
    return { handled: false };
  }

  const identityCapture = findIdentityLookupInRequestsMap(requestsMap);
  if (!identityCapture) {
    resetHailuoCreationEmptyFeedsMode(state);
    return { handled: true, isMatch: false };
  }

  const identityResponse = await resolveIdentityLookupResponse(
    identityCapture.entry
  );
  const isMatch = validateEmptyFeedsIdentityResponse(identityResponse);
  if (!isMatch) {
    resetHailuoCreationEmptyFeedsMode(state);
    return { handled: true, isMatch: false };
  }

  setHailuoCreationEmptyFeedsMode(state, identityCapture);
  if (identityResponse != null && typeof identityResponse === 'object') {
    identityCapture.entry.responseData = identityResponse;
  }
  return { handled: true, isMatch: true };
}
