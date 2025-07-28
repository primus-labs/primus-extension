import jp from 'jsonpath';
import dayjs from 'dayjs';
// import utc from 'dayjs/plugin/utc';
// dayjs.extend(utc);
import { customFetch2 } from '../utils/request';
export const extraRequestFn2 = async (params) => {
  try {
    const { ...requestParams } = params;
    const requestRes = await customFetch2(requestParams);
    if (typeof requestRes === 'object' && requestRes !== null) {
      return requestRes;
    }
  } catch (e) {
    console.log('fetch custom request error', e);
  }
};

export const errorFn = async (errorData, dataSourcePageTabId) => {
  let resParams = {
    result: false,
    errorData,
  };
  const { padoZKAttestationJSSDKDappTabId: dappTabId } =
    await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
  chrome.tabs.sendMessage(dappTabId, {
    type: 'padoZKAttestationJSSDK',
    name: 'getAttestationRes',
    params: resParams,
  });
  await chrome.storage.local.remove([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKWalletAddress',
    'padoZKAttestationJSSDKAttestationPresetParams',
    'padoZKAttestationJSSDKXFollowerCount',
    'activeRequestAttestation',
  ]);
  if (dataSourcePageTabId) {
    await chrome.tabs.remove(dataSourcePageTabId);
  }
};

export const checkResIsMatchConditionFn = (
  jsonPathArr,
  matchRequestUrlResult
) => {
  const isMatch = jsonPathArr.every((jpItem) => {
    try {
      let hasField = false;
      if (jpItem?.op === 'MATCH_ONE') {
        const {
          field: fatherJsonPath,
          subconditions: [{ type, op, field: sonJsonpath, value }],
        } = jpItem;
        const firstJsonPath = fatherJsonPath?.split('[*]+')?.[0];
        const lastJsonpath = sonJsonpath.split('+')[1];
        let jsonpathQueryStr = '';

        if (['>', '>=', '=', '!=', '<', '<=', 'STREQ', 'STRNEQ'].includes(op)) {
          // let formatOp = op;
          // if (['=', 'STREQ'].includes(op)) {
          //   formatOp = '==';
          // }
          // if (['STRNEQ'].includes(op)) {
          //   formatOp = '!=';
          // }
          // const formatValue = ['STREQ', 'STRNEQ'].includes(op)
          //   ? `"${value}"`
          //   : value; // TODO
          // jsonpathQueryStr = `${firstJsonPath}[?(@${lastJsonpath} ${formatOp} ${formatValue})]`;

          jsonpathQueryStr = `${firstJsonPath}[0]${lastJsonpath}`;
          hasField =
            jp.query(matchRequestUrlResult, jsonpathQueryStr).length > 0;
        }
      } else {
        hasField = jp.query(matchRequestUrlResult, jpItem).length > 0;
      }
      return hasField;
    } catch {
      return false;
    }
  });
  return isMatch;
};
export const getNMonthsBeforeTime = (timestamp, n) => {
  const nowTime = dayjs(timestamp);
  let targetTime2 = nowTime.subtract(n, 'month');
  targetTime2 = targetTime2.subtract(1, 'day').add(1, 'second').valueOf();
  console.log('targetTime2', targetTime2);
  return targetTime2;
};
export const getUTCDayLastSecondTime = (timestamp) => {
  const nowTime = dayjs(timestamp);
  const targetTime = nowTime.endOf('day').valueOf();
  return targetTime;
};
