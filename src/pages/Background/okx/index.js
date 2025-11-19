import { getLevel, getRangeByLevel } from '../utils/amountRange';
export let okxFields = {};
export const changeFieldsObjFnForOkx = (op, key, value) => {
  if (op === 'delete') {
    delete okxFields[key];
  } else if (op === 'add') {
    okxFields[key] = value;
  } else if (op === 'update') {
    okxFields[key] = value;
  } else if (op === 'reset') {
    okxFields = {};
  }
};
export const checkTargetAssetIdxFn = async (
  matchRequestUrlResult,
  notMetHandler,
  additionParamsObj,
  metHandler
) => {
  const asset = additionParamsObj?.asset;
  changeFieldsObjFnForOkx('reset');
  if (matchRequestUrlResult) {
    const { code, data } = matchRequestUrlResult;
    if (code === 0) {
      let targetAssetIdx = data.crypto.balances.findIndex(
        (i) => i.currency === asset
      );
      if (!asset) {
        targetAssetIdx = 0;
      }
      if (targetAssetIdx >= 0) {
        metHandler(targetAssetIdx, data.crypto.balances[targetAssetIdx]);
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

export const templateIdForOkxSomeTokenBalance =
  'c28e20ca-de99-458d-bc3b-c7a7392872db';
export const templateIdForOkxSomeTokenBalanceRequestUrl =
  'https://www.okx.com/v2/asset/balance/balance-portfolio';
export const checkTargetRequestFnForOkxSomeTokenBalance = async (
  matchRequestUrlResult,
  notMetHandler,
  extendedParamsObj
) => {
  const { balanceLevelRules } = extendedParamsObj ?? {};
  const metHandler = async (idx, val) => {
    changeFieldsObjFnForOkx('add', 'okxSomeTokenIdx', idx);
    const balance = val.balance;
    const amountRangeLevel = getLevel(balance, balanceLevelRules);
    const { min, max } =
      getRangeByLevel(amountRangeLevel, balanceLevelRules) || {};
    changeFieldsObjFnForOkx('add', 'okxSomeTokenAmountRangeLevel', String(min));
  };
  return checkTargetAssetIdxFn(
    matchRequestUrlResult,
    notMetHandler,
    extendedParamsObj,
    metHandler
  );
};

export const formatRequestResponseFnForOkxSomeTokenBalance = (
  formatRequests,
  formatResponse
) => {
  const { okxSomeTokenIdx, okxSomeTokenAmountRangeLevel } = okxFields;
  formatResponse[1].conditions.subconditions = [
    {
      field: `$.data.crypto.balances[${okxSomeTokenIdx}].currency`,
      op: 'REVEAL_STRING',
      type: 'FIELD_REVEAL',
      reveal_id: 'asset',
    },
    {
      field: `$.data.crypto.balances[${okxSomeTokenIdx}].balance`,
      reveal_id: 'balance',
      type: 'FIELD_RANGE',
      op: '>',
      value: okxSomeTokenAmountRangeLevel,
    },
  ];

  return {
    formatRequests,
    formatResponse,
  };
};
