/**
 * Luma / Monad template (be2268c1): event list URL pagination, match "Monad" approved event,
 * profile fetch for api_id, then patch algorithm requests/responses.
 */
import { parseCookie } from '../../../utils/utils';
import { fetchRequestData } from '../../utils';
import { getPageDecodeState } from '../../state';
import {
  MONAD_CALCULATIONS,
  TEMPLATE_ID_FOR_LUMA_MONAD,
} from './constants';

const MONAD_EVENT_NAME = 'Monad';

export function eventListUrlForMonad(url, paginationCursor) {
  let newUrl = url.replace('pagination_limit=25', 'pagination_limit=10');
  if (paginationCursor) {
    newUrl += `&pagination_cursor=${paginationCursor}`;
  }
  return newUrl;
}

function buildMonadProfileUrl(userId) {
  return `https://api2.luma.com/user/profile?username=${userId}`;
}

function getMonadFields() {
  return getPageDecodeState().getMonadFields();
}

function resetMonadFields() {
  getPageDecodeState().resetMonadFields();
}

function setMonadFields(monadContext) {
  return getPageDecodeState().setMonadFields(monadContext);
}

function findApprovedMonadEventIndex(entries) {
  return entries.findIndex((entry) => {
    const lcEventName = entry?.event?.name?.toLowerCase?.() || '';
    return (
      lcEventName.includes(MONAD_EVENT_NAME.toLowerCase()) 
      &&
      entry?.role?.approval_status === 'approved'
    );
  });
}

function buildMonadEventFieldRecords(eventEntry, eventIdx, eventListUrl) {
  return {
    name: {
      key: 'name',
      value: eventEntry?.event?.name,
      jsonPath: `$.entries[${eventIdx}].event.name`,
    },
    approval_status: {
      key: 'approval_status',
      value: eventEntry?.role?.approval_status,
      jsonPath: `$.entries[${eventIdx}].role.approval_status`,
    },
    eventListUrl: {
      key: 'eventListUrl',
      value: eventListUrl,
    },
  };
}

function buildMonadProfileFieldRecord(profileResult) {
  return {
    key: 'api_id',
    value: profileResult?.user?.api_id,
    jsonPath: '$.user.api_id',
  };
}

function buildMonadResponseItem(subconditionItems) {
  return {
    conditions: {
      op: 'BOOLEAN_AND',
      type: 'CONDITION_EXPANSION',
      subconditions: subconditionItems.map(({ value, jsonPath }) => ({
        field: jsonPath,
        op: 'STREQ',
        type: 'FIELD_RANGE',
        value,
      })),
    },
  };
}

function buildPatchedMonadRequestsAndResponses(
  formatRequests,
  formatResponse,
  monadFields
) {
  const nextRequests = formatRequests.map((request) => ({ ...request }));
  const nextResponse = formatResponse.map((response) => ({ ...response }));

  const firstRequest = {
    ...nextRequests[0],
    url: monadFields.eventListUrl.value,
  };
  nextRequests[0] = firstRequest;
  nextRequests[1] = {
    ...firstRequest,
    url: buildMonadProfileUrl(monadFields.api_id.value),
    name: 'sdk-1',
  };

  nextResponse[0] = buildMonadResponseItem([
    monadFields.name,
    monadFields.approval_status,
  ]);
  nextResponse[1] = buildMonadResponseItem([monadFields.api_id]);

  return { formatRequests: nextRequests, formatResponse: nextResponse };
}

function getMonadUserIdFromCookie(headers) {
  const cookieObj = parseCookie(headers?.Cookie);
  return cookieObj['luma.auth-session-key']?.split('.')[0];
}

async function resolveMonadContext(result, checkUrl, requestMetaInfo) {
  if (!result) {
    return null;
  }

  const eventList = Array.isArray(result?.entries) ? result.entries : [];
  const monadEventIdx = findApprovedMonadEventIndex(eventList);
  if (monadEventIdx >= 0) {
    const eventFields = buildMonadEventFieldRecords(
      eventList[monadEventIdx],
      monadEventIdx,
      checkUrl
    );
    const userId = getMonadUserIdFromCookie(requestMetaInfo?.headers);
    if (!userId) {
      return null;
    }
    const profileUrl = buildMonadProfileUrl(userId);
    const profileUrlResult = await fetchRequestData({
      ...requestMetaInfo,
      header: requestMetaInfo?.headers,
      url: profileUrl,
      method: requestMetaInfo?.method || 'GET',
    });
    return {
      ...eventFields,
      api_id: buildMonadProfileFieldRecord(profileUrlResult),
    };
  }

  if (!result?.has_more) {
    return null;
  }

  const nextUrl = eventListUrlForMonad(requestMetaInfo.url, result?.next_cursor);
  const nextResult = await fetchRequestData({
    ...requestMetaInfo,
    header: requestMetaInfo?.headers,
    url: nextUrl,
    method: requestMetaInfo?.method || 'GET',
  });
  return resolveMonadContext(nextResult, nextUrl, requestMetaInfo);
}

export function isLumaMonadTemplate(activeTemplate) {
  const id = activeTemplate?.attTemplateID ?? activeTemplate?.id;
  return id === TEMPLATE_ID_FOR_LUMA_MONAD;
}

export async function checkTargetRequestFnForMonad(
  targetRequestUrl,
  matchRequestUrlResult,
  requestMetaInfo,
  notMetHandler
) {
  resetMonadFields();
  const monadContext = await resolveMonadContext(
    matchRequestUrlResult,
    targetRequestUrl,
    requestMetaInfo
  );
  if (!monadContext) {
    await notMetHandler();
    return false;
  }
  setMonadFields(monadContext);
  return true;
}

/**
 * After capture + checkTargetRequestFnForMonad, rewrite algorithm params (2 requests / 2 responses).
 */
export function tryPatchAlgorithmParamsForSpecialTemplateLumaMonad(
  algorithmParams,
  activeTemplate
) {
  if (!isLumaMonadTemplate(activeTemplate)) return;

  const monadFields = getMonadFields();
  if (
    !monadFields?.eventListUrl?.value ||
    monadFields?.api_id?.value == null ||
    monadFields?.api_id?.value === '' ||
    !Array.isArray(algorithmParams.requests) ||
    algorithmParams.requests.length === 0 ||
    !Array.isArray(algorithmParams.responses)
  ) {
    return;
  }

  const { formatRequests, formatResponse } = buildPatchedMonadRequestsAndResponses(
    algorithmParams.requests,
    algorithmParams.responses,
    monadFields
  );
  algorithmParams.requests = formatRequests;
  algorithmParams.responses = formatResponse;
  algorithmParams.calculations = MONAD_CALCULATIONS;
}
