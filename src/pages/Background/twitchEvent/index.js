import jp from 'jsonpath';
import { checkResIsMatchConditionFn } from '../pageDecode/utils';
export const templateIdForTwitch = '515fd5af-49be-48e7-9345-d949c76e5f0d';
export const formatJsonArrFnForTwitch = (
  jsonArr,
  requestMetaInfo,
  matchReqBodyKey,
  matchRequestUrlResult
) => {
  let checkRes = false;
  const newJsonArr = JSON.parse(JSON.stringify(jsonArr));
  const curRequestParams = requestMetaInfo.body
    ? JSON.parse(requestMetaInfo.body)
    : {};

  if (Array.isArray(curRequestParams)) {
    let targetRequestParamItemsIdxArr = [];
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

    if (targetRequestParamItemsIdxArr?.length > 0) {
      const complexJsonpathIdx = newJsonArr.findIndex(
        (i) => i?.op === 'MATCH_ONE'
      );
      for (const targetRequestParamItemIdx of targetRequestParamItemsIdxArr) {
        newJsonArr[complexJsonpathIdx].field = newJsonArr[
          complexJsonpathIdx
        ].field.replace('$[0]', `$[${targetRequestParamItemIdx}]`);
        const isMatch = checkResIsMatchConditionFn(
          newJsonArr,
          matchRequestUrlResult
        );
        if (isMatch) {
          checkRes = true;
          changeFieldsObjFnForTwitch(
            'add',
            'matchOneFatherJsonpath',
            newJsonArr[complexJsonpathIdx].field
          );
          break;
        }
      }
    }
  }
  return checkRes ? { checkRes, newJsonArr } : checkRes;
};

export let twitchFields = {};
export const changeFieldsObjFnForTwitch = (op, key, value) => {
  if (op === 'delete') {
    delete twitchFields[key];
  } else if (op === 'add') {
    twitchFields[key] = value;
  } else if (op === 'update') {
    twitchFields[key] = value;
  } else if (op === 'reset') {
    twitchFields = {};
  }
};
export const formatRequestResponseFnForTwitch = (
  formatRequests,
  formatResponse
) => {
  formatResponse[0].conditions.subconditions.forEach((i) => {
    if (i.op === 'MATCH_ONE') {
      i.field = twitchFields['matchOneFatherJsonpath'];
    }
  });
  return { formatRequests, formatResponse };
};
