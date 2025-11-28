import { updateUrlParams, parseUrlQuery } from '../utils/utils';
import { getLevelObj } from '../utils/amountRange';
import { changeFieldsObjFn } from '../utils/localVar';

export const templateIdForBinanceEarnHistory =
  'aa85c07d-cb6b-457e-8531-fe6a3c96b4fb';

export let fields = {};

export const formatRequestResponseFnForBinanceEarnHistory = (
  formatRequests,
  formatResponse
) => {
  const formatRequest2 = JSON.parse(JSON.stringify({ ...formatRequests[0] }));
  // const formatResponse2 = JSON.parse(JSON.stringify({ ...formatResponse[0] }));
  formatRequests[1] = {
    ...formatRequest2,
    url: fields['secondUrl'],
    name: 'sdk-1',
  };
  const [oldR1] = formatResponse;

  let r1 = {
    ...oldR1,
    conditions: {
      ...oldR1.conditions, // subscriptionList
      subconditions: [
        // {
        //   ...oldR1.conditions.subconditions[0],
        //   reveal_id: 'subscriptionAsset',
        //   field: '$.data[*].asset',
        // },
        // {
        //   ...oldR1.conditions.subconditions[0],
        //   reveal_id: 'subscriptionAmount',
        //   field: '$.data[*].amount',
        // },
        {
          ...oldR1.conditions.subconditions[0],
          reveal_id: 'subscriptionList',
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

  if (startTime && additionParamsObj?.startTime) {
    newUrlParams.startTime = additionParamsObj?.startTime;
  }
  if (endTime && additionParamsObj?.endTime) {
    newUrlParams.endTime = additionParamsObj?.endTime;
  }
  if (pageSize && additionParamsObj?.pageSize) {
    newUrlParams.pageSize = additionParamsObj?.pageSize;
  }
  if (additionParamsObj?.asset) {
    newUrlParams.asset = additionParamsObj?.asset;
  }

  const newUrl = updateUrlParams(oldUrl, newUrlParams);
  oldRequestMap.url = newUrl;

  const oldUrl2 = `https://www.binance.com/bapi/earn/v1/private/lending/union/redemption/list?pageIndex=1&pageSize=20&startTime=1744732800000&endTime=1760371199999&lendingType=DAILY`;
  const newUrl2 = updateUrlParams(oldUrl2, newUrlParams);
  changeFieldsObjFn(fields, 'add', 'secondUrl', newUrl2);

  // TODO
  // let matchRequestUrlResult2 = extraRequestFn2({
  //   ...requestsMap[matchRequestId],
  //   header: requestsMap[matchRequestId].headers,
  //   url: newUrl2,
  // });

  return oldRequestMap;
};

// old reputation phala event
export const templateIdForBinanceEarnHistoryABalance =
  'aa85c07d-cb6b-457e-8531-fe6a3c96b4fc';
// export const templateIdForBinanceEarnHistoryABalanceThirdRequestUrl =
//   'https://www.binance.com/bapi/earn/v1/private/finance-earn/position/group-by-asset';
export const templateIdForBinanceEarnHistoryABalanceThirdRequestUrl =
  'https://www.binance.com/bapi/earn/v2/private/lending/daily/token/position?pageIndex=1&pageSize=100&sortType=ASC&sortBy=ASSET';
export const formatRequestResponseFnForBinanceEarnHistoryABalance = (
  formatRequests,
  formatResponse
) => {
  const {
    formatRequests: newFormatRequests,
    formatResponse: newFormatResponse,
  } = formatRequestResponseFnForBinanceEarnHistory(
    formatRequests,
    formatResponse
  );
  // set third request url
  const formatRequest2 = JSON.parse(
    JSON.stringify({ ...newFormatRequests[0] })
  );
  newFormatRequests[2] = {
    ...formatRequest2,
    url: templateIdForBinanceEarnHistoryABalanceThirdRequestUrl,
    name: 'sdk-2',
  };

  const [oldRes1, oldRes2] = newFormatResponse;
  const {
    conditions: {
      subconditions: [{ field, reveal_id }],
    },
  } = oldRes1;
  oldRes1.conditions.subconditions[0] = {
    op: 'REVEAL_HEX_STRING',
    type: 'FIELD_REVEAL',
    field: { type: 'FIELD_ARITHMETIC', op: 'SHA256', field: '$' },
    reveal_id,
  };

  const {
    conditions: {
      subconditions: [{ reveal_id: reveal_id2 }],
    },
  } = oldRes2;
  oldRes2.conditions.subconditions[0] = {
    op: 'REVEAL_HEX_STRING',
    type: 'FIELD_REVEAL',
    field: { type: 'FIELD_ARITHMETIC', op: 'SHA256', field: '$' },
    reveal_id: reveal_id2,
  };

  newFormatResponse[2] = {
    ...oldRes1,
    conditions: {
      ...oldRes1.conditions,
      subconditions: [
        {
          op: 'REVEAL_HEX_STRING',
          type: 'FIELD_REVEAL',
          field: {
            type: 'FIELD_ARITHMETIC',
            op: 'SHA256',
            field: '$', // .data.assetDetails
          },
          reveal_id: 'assetDetails',
        },
      ],
    },
  };
  return {
    formatRequests: newFormatRequests,
    formatResponse: newFormatResponse,
  };
};

//  new reputation phala event
export const templateIdForReputationPhalaBinanceEarnBalance =
  '031720f6-5b78-405c-a91c-3b6efd1586ce'; // binance eran account some token(params) balance

  export const updateRequestMapFnForReputationPhalaBinanceEarnBalance = (
    oldRequestMap,
    additionParamsObj
  ) => {
    const oldUrl = oldRequestMap.url;
    const oldQueryParams = parseUrlQuery(oldUrl);
    const { pageSize } = oldQueryParams;
    // asset
    const newUrlParams = {
      pageSize,
    };
    if (pageSize && additionParamsObj?.pageSize) {
      newUrlParams.pageSize = additionParamsObj?.pageSize;
    }

    const newUrl = updateUrlParams(oldUrl, newUrlParams);
    oldRequestMap.url = newUrl;
    return oldRequestMap;
  };
export const checkTargetRequestFnForReputationPhalaBinanceEarnBalance = async (
  matchRequestUrlResult,
  notMetHandler,
  additionParamsObj
) => {
  const metHandler = async (reputationPhalaBinanceEarnAssetIdx) => {
    changeFieldsObjFn(
      fields,
      'add',
      'reputationPhalaBinanceEarnAsset',
      reputationPhalaBinanceEarnAssetIdx
    );
  };
  return checkTargetAssetIdxFn(
    matchRequestUrlResult,
    notMetHandler,
    additionParamsObj,
    metHandler
  );
};
export const formatRequestResponseFnForReputationPhalaBinanceEarnBalance = (
  formatRequests,
  formatResponse
) => {
  const targetIdx = fields.reputationPhalaBinanceEarnAsset;
  formatResponse[0].conditions.subconditions = [
    {
      field: `$.data[${targetIdx}].asset`,
      op: 'REVEAL_STRING',
      type: 'FIELD_REVEAL',
      reveal_id: 'asset',
    },
    {
      field: `$.data[${targetIdx}].totalAmount`,
      op: 'REVEAL_STRING',
      type: 'FIELD_REVEAL',
      reveal_id: 'totalAmount',
    },
    {
      field: `$.data[${targetIdx}].userId`,
      op: 'REVEAL_STRING',
      type: 'FIELD_REVEAL',
      reveal_id: 'userId',
    },
  ];
  return {
    formatRequests,
    formatResponse,
  };
};
export const checkTargetAssetIdxFn = async (
  matchRequestUrlResult,
  notMetHandler,
  additionParamsObj,
  metHandler
) => {
  const { asset } = additionParamsObj ?? {};
  changeFieldsObjFn(fields, 'reset');
  if (matchRequestUrlResult) {
    const { code, data } = matchRequestUrlResult;
    if (code === '000000') {
      let targetAssetIdx = data.findIndex((i) => i.asset === asset);
      if (!asset) {
        targetAssetIdx = 0;
      }
      if (targetAssetIdx >= 0) {
        metHandler(targetAssetIdx, data[targetAssetIdx]);
        return true;
      } else {
        notMetHandler();
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
};

export const templateIdForBinanceSomeTokenBalance =
  'fdd4b203-2c02-49c3-89bf-fa51942c1f3a'; // binance some token(params) balance
export const templateIdForBinanceSomeTokenBalanceRequestUrl =
  'https://www.binance.com/bapi/asset/v2/private/asset-service/wallet/asset';
export const checkTargetRequestFnForBinanceSomeTokenBalance = async (
  matchRequestUrlResult,
  notMetHandler,
  extendedParamsObj
) => {
  const { balanceLevelRules } = extendedParamsObj ?? {};
  const metHandler = async (idx, val) => {
    const balance = val.amount;
    const { min, startIntervalType } =
      getLevelObj(balance, balanceLevelRules) || {};
    changeFieldsObjFn(fields, 'add', 'binanceSpotSomeTokenIdx', idx);
    changeFieldsObjFn(fields, 'add', 'someTokenAmountRangeMin', String(min));
    changeFieldsObjFn(
      fields,
      'add',
      'someTokenAmountRangeOp',
      startIntervalType === 'open' ? '>' : '>='
    );
  };
  return checkTargetAssetIdxFn(
    matchRequestUrlResult,
    notMetHandler,
    extendedParamsObj,
    metHandler
  );
};

export const formatRequestResponseFnForBinanceSomeTokenBalance = (
  formatRequests,
  formatResponse
) => {
  const {
    binanceSpotSomeTokenIdx,
    someTokenAmountRangeMin,
    someTokenAmountRangeOp,
  } = fields;
  formatResponse[1].conditions.subconditions = [
    {
      field: `$.data[${binanceSpotSomeTokenIdx}].asset`,
      op: 'REVEAL_STRING',
      type: 'FIELD_REVEAL',
      reveal_id: 'asset',
    },
    {
      field: `$.data[${binanceSpotSomeTokenIdx}].amount`,
      reveal_id: 'balance',
      // op: 'REVEAL_STRING',
      // type: 'FIELD_REVEAL',
      type: 'FIELD_RANGE',
      op: someTokenAmountRangeOp,
      value: someTokenAmountRangeMin,
    },
  ];
  return {
    formatRequests,
    formatResponse,
  };
};
