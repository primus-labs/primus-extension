import { updateUrlParams, parseUrlQuery } from '../utils/utils';

export const templateIdForBinanceEarnHistory =
  'aa85c07d-cb6b-457e-8531-fe6a3c96b4fb';

export let binanceEarnHistoryFields = {};

export const changeFieldsObjFnForBinanceEarnHistory = (op, key, value) => {
  if (op === 'delete') {
    delete binanceEarnHistoryFields[key];
  } else if (op === 'add') {
    binanceEarnHistoryFields[key] = value;
  } else if (op === 'update') {
    binanceEarnHistoryFields[key] = value;
  } else if (op === 'reset') {
    binanceEarnHistoryFields = {};
  }
};

export const formatRequestResponseFnForBinanceEarnHistory = (
  formatRequests,
  formatResponse
) => {
  const formatRequest2 = JSON.parse(JSON.stringify({ ...formatRequests[0] }));
  // const formatResponse2 = JSON.parse(JSON.stringify({ ...formatResponse[0] }));
  formatRequests[1] = {
    ...formatRequest2,
    url: binanceEarnHistoryFields['secondUrl'],
    name: 'sdk-1',
  };
  const [oldR1] = formatResponse;

  let r1 = {
    ...oldR1,
    conditions: {
      ...oldR1.conditions, // subscriptionList
      subconditions: [
        {
          ...oldR1.conditions.subconditions[0],
          reveal_id: 'subscriptionAsset',
          field: '$.data[*].asset',
        },
        {
          ...oldR1.conditions.subconditions[0],
          reveal_id: 'subscriptionAmount',
          field: '$.data[*].amount',
        },
      ],
    },
  };
  let r2 = {
    ...oldR1,
    conditions: {
      ...oldR1.conditions,
      subconditions: [
        {
          ...oldR1.conditions.subconditions[0],
          reveal_id: 'redemptionList',
        },
      ],
    },
  };
  formatResponse = [r1, r2];
  return { formatRequests, formatResponse };
};

export const updateRequestMapFnForbBinanceEarnHistory = (
  oldRequestMap,
  additionParamsObj
) => {
  const oldUrl = oldRequestMap.url;
  const oldQueryParams = parseUrlQuery(oldUrl);
  const { startTime, endTime, pageSize, asset } = oldQueryParams;
  // asset
  const newUrlParams = {
    startTime,
    endTime,
    pageSize,
  };

  if (additionParamsObj?.startTime) {
    newUrlParams.startTime = additionParamsObj?.startTime;
  }
  if (additionParamsObj?.endTime) {
    newUrlParams.endTime = additionParamsObj?.endTime;
  }
  if (additionParamsObj?.pageSize) {
    newUrlParams.pageSize = additionParamsObj?.pageSize;
  }
  if (additionParamsObj?.asset) {
    newUrlParams.asset = additionParamsObj?.asset;
  }

  const newUrl = updateUrlParams(oldUrl, newUrlParams);
  oldRequestMap.url = newUrl;

  const oldUrl2 = `https://www.binance.com/bapi/earn/v1/private/lending/union/redemption/list?pageIndex=1&pageSize=20&startTime=1744732800000&endTime=1760371199999&lendingType=DAILY`;
  const newUrl2 = updateUrlParams(oldUrl2, newUrlParams);
  changeFieldsObjFnForBinanceEarnHistory('add', 'secondUrl', newUrl2);

  // TODO
  // let matchRequestUrlResult2 = extraRequestFn2({
  //   ...requestsMap[matchRequestId],
  //   header: requestsMap[matchRequestId].headers,
  //   url: newUrl2,
  // });

  return oldRequestMap;
};
