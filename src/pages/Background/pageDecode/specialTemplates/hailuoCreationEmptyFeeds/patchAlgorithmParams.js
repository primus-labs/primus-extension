import { sanitizeRequestHeaders } from '../../../utils/utils.js';
import { applySdkAttConditionsToResponseSubconditions } from '../../../padoZKAttestationJSSDK/applyAttConditionToSubcondition.js';
import { isHailuoCreationTemplate } from './feedsEmpty.js';
import {
  FALLBACK_REQUEST,
  FALLBACK_RESPONSE,
  IDENTITY_LOOKUP_HOST,
} from './constants.js';

/**
 * @param {Record<string, unknown>} algorithmParams
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @param {{
 *   hailuoCreationEmptyFeedsMode?: boolean;
 *   hailuoIdentityLookupRequestId?: string | null;
 *   requestsMap?: Record<string, unknown>;
 * }} state
 */
export function tryPatchAlgorithmParamsForHailuoCreationEmptyFeeds(
  algorithmParams,
  activeTemplate,
  state
) {
  if (!isHailuoCreationTemplate(activeTemplate)) {
    return;
  }
  if (state?.hailuoCreationEmptyFeedsMode !== true) {
    return;
  }

  const requestId = state.hailuoIdentityLookupRequestId;
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

  const capturedUrl = typeof entry.url === 'string' ? entry.url : FALLBACK_REQUEST.url;

  algorithmParams.host = IDENTITY_LOOKUP_HOST;
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
