/**
 * Channel subscription (Twitch gql) template 515fd5af: pick the request body item that matches
 * matchReqBodyKey, probe MATCH_ONE jsonpaths against the response, then fix algorithm subconditions.
 */
import jp from 'jsonpath';
import { getPageDecodeState } from '../state';
import { validateResponseCondition } from '../utils';

export const TEMPLATE_ID_FOR_CHANNEL_SUBSCRIPTION =
  '515fd5af-49be-48e7-9345-d949c76e5f0d';

/** @deprecated Prefer TEMPLATE_ID_FOR_CHANNEL_SUBSCRIPTION */
export const templateIdForTwitch = TEMPLATE_ID_FOR_CHANNEL_SUBSCRIPTION;

function getChannelSubscriptionFields() {
  return getPageDecodeState().state.channelSubscriptionFields;
}

function changeChannelSubscriptionField(op, key, value) {
  const fields = getChannelSubscriptionFields();
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

export function isChannelSubscriptionTemplate(activeTemplate) {
  const id = activeTemplate?.attTemplateID ?? activeTemplate?.id;
  return id === TEMPLATE_ID_FOR_CHANNEL_SUBSCRIPTION;
}

function parseRequestBodyForMatch(requestMetaInfo) {
  const raw = requestMetaInfo?.body;
  if (raw == null) {
    return {};
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

/**
 * Align response conditions with the captured request body (graphql variables array).
 * @returns {{ checkRes: true, newJsonArr: unknown[] } | false}
 */
export function formatJsonArrFnForChannelSubscription(
  jsonArr,
  requestMetaInfo,
  matchReqBodyKey,
  matchRequestUrlResult
) {
  let checkRes = false;
  changeChannelSubscriptionField('reset');
  const newJsonArr = JSON.parse(JSON.stringify(jsonArr));
  const curRequestParams = parseRequestBodyForMatch(requestMetaInfo);

  if (!Array.isArray(curRequestParams) || !Array.isArray(matchReqBodyKey)) {
    return false;
  }

  const targetRequestParamItemsIdxArr = [];
  curRequestParams.forEach((i, k) => {
    const flag = matchReqBodyKey.every((j) => {
      const { key, value } = j;
      const curV = jp.query(i, `$.${key}`);
      return curV[0] === value;
    });
    if (flag) {
      targetRequestParamItemsIdxArr.push(k);
    }
  });

  if (targetRequestParamItemsIdxArr.length > 0) {
    const complexJsonpathIdx = newJsonArr.findIndex((i) => i?.op === 'MATCH_ONE');
    if (complexJsonpathIdx < 0) {
      return false;
    }
    for (const targetRequestParamItemIdx of targetRequestParamItemsIdxArr) {
      newJsonArr[complexJsonpathIdx].field = newJsonArr[
        complexJsonpathIdx
      ].field.replace('$[0]', `$[${targetRequestParamItemIdx}]`);
      const isMatch = validateResponseCondition(newJsonArr, matchRequestUrlResult);
      if (isMatch) {
        checkRes = true;
        changeChannelSubscriptionField(
          'add',
          'matchOneFatherJsonpath',
          newJsonArr[complexJsonpathIdx].field
        );
        break;
      }
    }
  }
  return checkRes ? { checkRes, newJsonArr } : false;
}

/**
 * Patch template responses: set MATCH_ONE father jsonpath from the index chosen during target check.
 */
export function tryPatchFormatResponseForSpecialTemplateChannelSubscription(
  formatResponse,
  activeTemplate
) {
  if (!isChannelSubscriptionTemplate(activeTemplate)) {
    return;
  }
  if (!Array.isArray(formatResponse) || formatResponse.length === 0) {
    return;
  }
  const path = getChannelSubscriptionFields().matchOneFatherJsonpath;
  if (path == null) {
    return;
  }
  formatResponse[0].conditions.subconditions.forEach((i) => {
    if (i.op === 'MATCH_ONE') {
      i.field = path;
    }
  });
}
