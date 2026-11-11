import {
  isCapcutEntriesQueryUrl,
  isEntriesEmpty,
} from './entriesEmpty.js';
import {
  findEverPhotoTokenInRequestsMap,
  resolveEverPhotoTokenResponse,
} from './everPhotoCapture.js';
import {
  resetCapcutCreationEmptyEntriesMode,
  setCapcutCreationEmptyEntriesMode,
} from './modeState.js';
import { validateEmptyEntriesUserIdResponse } from './validateEmptyEntriesMode.js';

/**
 * @param {{
 *   state: {
 *     capcutCreationEmptyEntriesMode?: boolean;
 *     capcutEverPhotoTokenRequestId?: string | null;
 *   };
 *   requestsMap: Record<string, unknown>;
 *   templateRequestUrl: string;
 *   matchRequestUrlResult: unknown;
 * }} ctx
 * @returns {Promise<{ handled: boolean; isMatch?: boolean }>}
 */
export async function tryCheckCapcutCreationEmptyEntriesTarget(ctx) {
  const { state, requestsMap, templateRequestUrl, matchRequestUrlResult } =
    ctx;

  if (!isCapcutEntriesQueryUrl(templateRequestUrl)) {
    return { handled: false };
  }

  if (!isEntriesEmpty(matchRequestUrlResult)) {
    resetCapcutCreationEmptyEntriesMode(state);
    return { handled: false };
  }

  const tokenCapture = findEverPhotoTokenInRequestsMap(requestsMap);
  if (!tokenCapture) {
    resetCapcutCreationEmptyEntriesMode(state);
    return { handled: true, isMatch: false };
  }

  const tokenResponse = await resolveEverPhotoTokenResponse(tokenCapture.entry);
  const isMatch = validateEmptyEntriesUserIdResponse(tokenResponse);
  if (!isMatch) {
    resetCapcutCreationEmptyEntriesMode(state);
    return { handled: true, isMatch: false };
  }

  setCapcutCreationEmptyEntriesMode(state, tokenCapture);
  if (tokenResponse != null && typeof tokenResponse === 'object') {
    tokenCapture.entry.responseData = tokenResponse;
  }
  return { handled: true, isMatch: true };
}
