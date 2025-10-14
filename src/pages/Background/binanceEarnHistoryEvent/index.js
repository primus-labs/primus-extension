export const templateIdForbBinanceEarnHistory30Days =
  'aa85c07d-cb6b-457e-8531-fe6a3c96b4fb';
export const startTimeDistanceForBinanceEarnHistory = 1; //1 month
export const rowForBinanceEarnHistory = 100; //max:100

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
  formatRequests[1] = { ...formatRequests[0],url: binanceEarnHistoryFields['secondUrl'],name:'sdk-1'};
  formatResponse[1] = { ...formatResponse[0] };
  formatResponse[0].conditions.subconditions[0].reveal_id = 'subscriptionId';
  formatResponse[1].conditions.subconditions[0].reveal_id = 'redemptionId';
  return { formatRequests, formatResponse };
};