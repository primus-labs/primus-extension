import { sanitizeRequestHeaders } from '../../../utils/utils.js';
import { applySdkAttConditionsToResponseSubconditions } from '../../../padoZKAttestationJSSDK/applyAttConditionToSubcondition.js';
import { isCapcutCreationTemplate } from './entriesEmpty.js';
import {
  EVER_PHOTO_TOKEN_HOST,
  FALLBACK_REQUEST,
  FALLBACK_RESPONSE,
} from './constants.js';

/**
 * @param {Record<string, unknown>} algorithmParams
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @param {{
 *   capcutCreationEmptyEntriesMode?: boolean;
 *   capcutEverPhotoTokenRequestId?: string | null;
 *   requestsMap?: Record<string, unknown>;
 * }} state
 */
export function tryPatchAlgorithmParamsForCapcutCreationEmptyEntries(
  algorithmParams,
  activeTemplate,
  state
) {
  if (!isCapcutCreationTemplate(activeTemplate)) {
    return;
  }
  if (state?.capcutCreationEmptyEntriesMode !== true) {
    return;
  }

  const requestId = state.capcutEverPhotoTokenRequestId;
  const entry =
    requestId != null && state.requestsMap
      ? state.requestsMap[requestId]
      : null;
  if (!entry || typeof entry !== 'object') {
    return;
  }

  const headers = entry.headers
    ? sanitizeRequestHeaders({ ...entry.headers })
    : {};
  headers['Accept-Encoding'] = 'identity';

  const capturedUrl =
    typeof entry.url === 'string' ? entry.url : FALLBACK_REQUEST.url;

  algorithmParams.host = EVER_PHOTO_TOKEN_HOST;
  algorithmParams.requests = [
    {
      ...FALLBACK_REQUEST,
      url: capturedUrl.split('#')[0],
      headers,
      body: entry.body ?? {},
    },
  ];
  algorithmParams.responses = [
    JSON.parse(JSON.stringify(FALLBACK_RESPONSE)),
  ];
  applySdkAttConditionsToResponseSubconditions(
    algorithmParams.responses,
    activeTemplate
  );
}
