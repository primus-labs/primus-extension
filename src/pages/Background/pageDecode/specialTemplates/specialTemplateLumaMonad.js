/**
 * Luma / Monad template (be2268c1): event list URL pagination, match "Monad" approved event,
 * profile fetch for api_id, then patch algorithm requests/responses.
 */
import { parseCookie } from '../../utils/utils';
import { fetchRequestData } from '../utils';
import { getPageDecodeState } from '../state';

export const TEMPLATE_ID_FOR_LUMA_MONAD =
  'be2268c1-56b2-438a-80cb-eddf2e850b63';

/** Alias for legacy naming */
export const TEMPLATE_ID_FOR_MONAD = TEMPLATE_ID_FOR_LUMA_MONAD;
export const templateIdForMonad = TEMPLATE_ID_FOR_LUMA_MONAD;

export const monadEventName = 'Monad';

export const monadCalculations = {
  type: 'CONDITION_EXPANSION',
  op: '&',
  subconditions: [
    { type: 'RESPONSE_ID', id: 0 },
    { type: 'RESPONSE_ID', id: 1 },
  ],
};

export function eventListUrlForMonad(url, paginationCursor) {
  let newUrl = url.replace('pagination_limit=25', 'pagination_limit=10');
  if (paginationCursor) {
    newUrl += `&pagination_cursor=${paginationCursor}`;
  }
  return newUrl;
}

export function monadProfileUrlFn(userId) {
  return `https://api2.luma.com/user/profile?username=${userId}`;
}

function changeMonadField(op, key, value) {
  const { state } = getPageDecodeState();
  const fields = state.monadFields;
  if (op === 'reset') {
    Object.keys(fields).forEach((k) => {
      delete fields[k];
    });
    return;
  }
  if (op === 'delete') {
    delete fields[key];
  } else if (op === 'add' || op === 'update') {
    fields[key] = value;
  }
}

export function isLumaMonadTemplate(activeTemplate) {
  const id = activeTemplate?.attTemplateID ?? activeTemplate?.id;
  return id === TEMPLATE_ID_FOR_LUMA_MONAD;
}

/** @deprecated Use isLumaMonadTemplate */
export const isMonadTemplate = isLumaMonadTemplate;

export async function checkTargetRequestFnForMonad(
  targetRequestUrl,
  matchRequestUrlResult,
  requestMetaInfo,
  notMetHandler
) {
  let checkRes = false;
  changeMonadField('reset');

  const metHandler = async (eventList, monadEventIdx, metUrl) => {
    changeMonadField('add', 'name', {
      key: 'name',
      value: eventList[monadEventIdx].event.name,
      jsonPath: `$.entries[${monadEventIdx}].event.name`,
    });
    changeMonadField('add', 'approval_status', {
      key: 'approval_status',
      value: eventList[monadEventIdx].role.approval_status,
      jsonPath: `$.entries[${monadEventIdx}].role.approval_status`,
    });
    changeMonadField('add', 'eventListUrl', {
      key: 'eventListUrl',
      value: metUrl,
    });
    const cookieObj = parseCookie(requestMetaInfo?.headers?.Cookie);
    const userId = cookieObj['luma.auth-session-key']?.split('.')[0];
    if (userId) {
      const profileUrl = monadProfileUrlFn(userId);
      const profileUrlResult = await fetchRequestData({
        ...requestMetaInfo,
        header: requestMetaInfo?.headers,
        url: profileUrl,
        method: requestMetaInfo?.method || 'GET',
      });
      changeMonadField('add', 'api_id', {
        key: 'api_id',
        value: profileUrlResult?.user?.api_id,
        jsonPath: `$.user.api_id`,
      });
      checkRes = true;
    }
  };

  const checkFn = async (result, checkUrl) => {
    if (result) {
      const eventList = result?.entries || [];
      const monadEventIdx = eventList.findIndex((i) => {
        const lcEventName = i.event.name.toLowerCase();
        const lcMonadEventName = monadEventName.toLowerCase();
        return (
          lcEventName.includes(lcMonadEventName)
           &&
          i.role.approval_status === 'approved'
        );
      });
      // debugger

      if (monadEventIdx >= 0) {
        console.log('monad-check-met');
        await metHandler(eventList, monadEventIdx, checkUrl);
      } else if (result?.has_more) {
        const nextUrl = eventListUrlForMonad(
          requestMetaInfo.url,
          result?.next_cursor
        );
        const nextResult = await fetchRequestData({
          ...requestMetaInfo,
          header: requestMetaInfo.headers,
          url: nextUrl,
          method: requestMetaInfo?.method || 'GET',
        });
        console.log('monad-check-2');
        await checkFn(nextResult, nextUrl);
      } else {
        console.log('monad-check-notmet');
        await notMetHandler();
      }
    } else {
      await notMetHandler();
    }
  };

  console.log('monad-check1');
  await checkFn(matchRequestUrlResult, targetRequestUrl);
  return checkRes;
}

export function formatRequestResponseFnForMonad(formatRequests, formatResponse) {
  const { state } = getPageDecodeState();
  const monadFields = state.monadFields;

  formatRequests[0].url = monadFields.eventListUrl.value;
  const profileUrl = monadProfileUrlFn(monadFields.api_id.value);
  formatRequests[1] = {
    ...formatRequests[0],
    url: profileUrl,
    name: 'sdk-1',
  };

  const formatResponseItemFn = (idx, subconditionItems) => {
    const subconditions = subconditionItems.map(
      ({ key, value, jsonPath }) => ({
        field: jsonPath,
        op: 'STREQ',
        type: 'FIELD_RANGE',
        value,
      })
    );
    formatResponse[idx] = {
      conditions: {
        op: 'BOOLEAN_AND',
        type: 'CONDITION_EXPANSION',
        subconditions,
      },
    };
  };

  formatResponseItemFn(0, [
    monadFields.name,
    monadFields.approval_status,
  ]);
  formatResponseItemFn(1, [monadFields.api_id]);
  return { formatRequests, formatResponse };
}

/**
 * After capture + checkTargetRequestFnForMonad, rewrite algorithm params (2 requests / 2 responses).
 */
export function tryPatchAlgorithmParamsForSpecialTemplateLumaMonad(
  algorithmParams,
  activeTemplate
) {
  if (!isLumaMonadTemplate(activeTemplate)) return;

  const { state } = getPageDecodeState();
  const mf = state.monadFields;
  if (
    !mf?.eventListUrl?.value ||
    mf?.api_id?.value == null ||
    mf?.api_id?.value === ''
  ) {
    return;
  }

  const { formatRequests, formatResponse } = formatRequestResponseFnForMonad(
    algorithmParams.requests,
    algorithmParams.responses
  );
  algorithmParams.requests = formatRequests;
  algorithmParams.responses = formatResponse;
  algorithmParams.calculations = monadCalculations;
}
