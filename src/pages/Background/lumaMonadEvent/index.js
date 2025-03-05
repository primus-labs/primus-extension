import { extraRequestFn2 } from '../pageDecode/utils';
import { parseCookie } from '../utils/utils';

let callerTabId;
let createdTabIdByExtension;

export const listener = async (request, sender) => {
  const { type, name, params } = request;

  if (name === 'followX') {
    callerTabId = null;
    callerTabId = sender.tab.id;
    const url = `https://twitter.com/intent/follow?screen_name=${params.screen_name}`;
    const tabCreatedByPado = await chrome.tabs.create({
      url,
    });
    createdTabIdByExtension = tabCreatedByPado.id;
  } else if (type === 'xFollow' && name === 'follow') {
    if (createdTabIdByExtension) {
      await chrome.tabs.remove(createdTabIdByExtension);
      chrome.tabs.sendMessage(callerTabId, {
        type: 'lumaMonadEvent',
        name: 'followXRes',
        params,
      });
      await chrome.tabs.update(callerTabId, {
        active: true,
      });
    }
  }
};


export const templateIdForMonad = 'be2268c1-56b2-438a-80cb-eddf2e850b63';

export let monadFields = {};
export let eventListUrlForMonad = (url, paginationCursor) => {
  let newUrl = url.replace('pagination_limit=25', `pagination_limit=10`);
  if (paginationCursor) {
    newUrl += `&pagination_cursor=${paginationCursor}`;
  }
  return newUrl;
};
export let monadProfileUrlFn = (userId) => {
  return `https://api.lu.ma/user/profile?username=${userId}`;
};
export const monadCalculations = {
  type: 'CONDITION_EXPANSION',
  op: '&',
  subconditions: [
    {
      type: 'RESPONSE_ID',
      id: 0,
    },
    {
      type: 'RESPONSE_ID',
      id: 1,
    },
  ],
};

export const changeFieldsObjFnForMonad = (op, key, value) => {
  if (op === 'delete') {
    delete monadFields[key];
  } else if (op === 'add') {
    monadFields[key] = value;
  } else if (op === 'update') {
    monadFields[key] = value;
  } else if (op === 'reset') {
    monadFields = {};
  }
};

export const checkTargetRequestFnForMonad = async (
  targetRequestUrl,
  matchRequestUrlResult,
  requestMetaInfo,
  notMetHandler
) => {
  let checkRes = false;
  const metHandler = async (eventList, monadEventIdx, metUrl) => {
    changeFieldsObjFnForMonad('add', 'name', {
      key: 'name',
      value: eventList[monadEventIdx].event.name,
      jsonPath: `$.entries[${monadEventIdx}].event.name`,
    });
    changeFieldsObjFnForMonad('add', 'approval_status', {
      key: 'approval_status',
      value: eventList[monadEventIdx].role.approval_status,
      jsonPath: `$.entries[${monadEventIdx}].role.approval_status`,
    });
    changeFieldsObjFnForMonad('add', 'eventListUrl', {
      key: 'eventListUrl',
      value: metUrl,
    });
    const cookieObj = parseCookie(requestMetaInfo?.headers?.Cookie);
    const userId = cookieObj['luma.auth-session-key']?.split('.')[0];
    if (userId) {
      const profileUrl = monadProfileUrlFn(userId);
      const profileUrlResult = await extraRequestFn2({
        ...requestMetaInfo,
        header: requestMetaInfo?.headers,
        url: profileUrl,
      });
      changeFieldsObjFnForMonad('add', 'api_id', {
        key: 'api_id',
        value: profileUrlResult?.user.api_id,
        jsonPath: `$.user.api_id`,
      });

      checkRes = true;
    }
  };

  const checkFn = async (result, checkUrl) => {
    if (result) {
      const eventList = result?.entries || [];
      const { configMap } = await chrome.storage.local.get(['configMap']);
      let requiredEventNameList = ['monad'];
      if (configMap) {
        const MONAD_EVENT_SUPPORT_SOURCESStr =
          JSON.parse(configMap)?.MONAD_EVENT_SUPPORT_SOURCES;
        if (MONAD_EVENT_SUPPORT_SOURCESStr) {
          requiredEventNameList = JSON.parse(MONAD_EVENT_SUPPORT_SOURCESStr);
        }
      }
      const monadEventIdx = eventList.findIndex((i) => {
        const lcEventName = i.event.name.toLowerCase();

        const hasRequiredEvent = requiredEventNameList.some((requiredEventName) => {
          const lcRequiredName = requiredEventName.toLowerCase();
          return lcEventName.includes(lcRequiredName);
        });
        return hasRequiredEvent && i.role.approval_status === 'approved';
        // TODO
      });

      if (monadEventIdx >= 0) {
        console.log('monad-check-met');
        await metHandler(eventList, monadEventIdx, checkUrl);
      } else {
        if (result?.has_more) {
          targetRequestUrl = eventListUrlForMonad(
            requestMetaInfo.url,
            result?.next_cursor
          );
          let nextResult = await extraRequestFn2({
            ...requestMetaInfo,
            header: requestMetaInfo.headers,
            url: targetRequestUrl,
          });
          console.log('monad-check-2');
          await checkFn(nextResult, targetRequestUrl);
        } else {
          console.log('monad-check-notmet');
          await notMetHandler();
        }
      }
    } else {
      await notMetHandler();
    }
  };
  console.log('monad-check1');
  await checkFn(matchRequestUrlResult, targetRequestUrl);
  return checkRes;
};

export const formatRequestResponseFnForMonad = (
  formatRequests,
  formatResponse
) => {
  formatRequests[0].url = monadFields['eventListUrl'].value;
  const profileUrl = monadProfileUrlFn(monadFields['api_id'].value);
  formatRequests[1] = {
    ...formatRequests[0],
    url: profileUrl,
    name: 'sdk-1',
  };
  const formatResponseItemFn = (idx, subconditionItems) => {
    const subconditions = subconditionItems.map(({ key, value, jsonPath }) => ({
      field: jsonPath,
      op: 'STREQ',
      type: 'FIELD_RANGE',
      value,
    }));

    formatResponse[idx] = {
      conditions: {
        op: 'BOOLEAN_AND',
        type: 'CONDITION_EXPANSION',
        subconditions,
      },
    };
  };
  formatResponseItemFn(0, [
    monadFields['name'],
    monadFields['approval_status'], // TODO
  ]);
  formatResponseItemFn(1, [monadFields['api_id']]);
  return { formatRequests, formatResponse };
};

export const informFollowXForMonad = async (params) => {
  const { padoZKAttestationJSSDKDappTabId: dappTabId } =
    await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
  if (dappTabId) {
    chrome.tabs.sendMessage(dappTabId, {
      type: 'padoZKAttestationJSSDK',
      name: 'followX',
      params,
    });
  }
};

export const formatRequestResponseFnForMonad2 = (
  formatRequests,
  formatResponse
) => {
  formatRequests[0].url = eventListUrlForMonad(formatRequests[0].url);
  const profileUrl = monadProfileUrlFn(monadFields['api_id'].value);
  formatRequests[1] = {
    ...formatRequests[0],
    url: profileUrl,
    name: 'sdk-1',
  };
  const formatResponseItemFn = (idx, subconditionItems) => {
    const subconditions = subconditionItems.map(({ key, value, jsonPath }) => ({
      field: jsonPath,
      op: 'STREQ',
      type: 'FIELD_RANGE',
      value,
    }));

    formatResponse[idx] = {
      conditions: {
        op: 'BOOLEAN_AND',
        type: 'CONDITION_EXPANSION',
        subconditions,
      },
    };
  };
  formatResponseItemFn(0, [
    monadFields['name'],
    monadFields['approval_status'],
  ]);
  formatResponseItemFn(1, [monadFields['api_id']]);
  formatResponse[0] = {
    conditions: {
      type: 'CONDITION_EXPANSION',
      op: 'MATCH_ONE',
      field: '$.entries[*]+',
      subconditions: [
        {
          type: 'CONDITION_EXPANSION',
          op: '&',
          subconditions: [
            {
              type: 'FIELD_RANGE',
              op: 'STREQ',
              field: '+.event.name',
              value: monadFields['name'].value,
            },
            // {
            //   type: 'FIELD_RANGE',
            //   op: 'STREQ',
            //   field: '+.role.approval_status',
            //   value: monadFields['approval_status'].value,
            // },
          ],
        },
      ],
    },
  };
  return { formatRequests, formatResponse };
};
