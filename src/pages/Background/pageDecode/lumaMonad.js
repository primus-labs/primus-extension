import { extraRequestFn2 } from './utils';
import { parseCookie } from '../utils/utils';

export const monadEventName = 'dtla'; // TODO
export const templateIdForMonad = 'be2268c1-56b2-438a-80cb-eddf2e850b63'; // TODO

export let monadFields = {};
export let eventListUrlForMonad = (url) => {
  return url.replace('pagination_limit=25', 'pagination_limit=1000');
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
  matchRequestUrlResult,
  requestMetaInfo,
  notMetHandler
) => {
  // matchRequestUrlResult  requestsMap[matchRequestId] notMetHandler
  const monadEventIdx = matchRequestUrlResult?.entries.findIndex((i) => {
    const lcEventName = i.event.name.toLowerCase();
    const lcMonadEventName = monadEventName.toLowerCase();
    return (
      lcEventName.includes(lcMonadEventName) &&
      i.role.approval_status === 'approved'
    );
  });
  if (monadEventIdx >= 0) {
    changeFieldsObjFnForMonad('add', 'name', {
      key: 'name',
      value: matchRequestUrlResult?.entries[monadEventIdx].event.name,
      jsonPath: `$.entries[${monadEventIdx}].event.name`,
    });
    changeFieldsObjFnForMonad('add', 'approval_status', {
      key: 'approval_status',
      value: matchRequestUrlResult?.entries[monadEventIdx].role.approval_status,
      jsonPath: `$.entries[${monadEventIdx}].role.approval_status`,
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
      return true;
    }
  } else {
    await notMetHandler();
  }
};

export const formatRequestResponseFnForMonad = (
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
