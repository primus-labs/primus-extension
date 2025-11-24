import { getLevelObj } from '../utils/amountRange';
import { changeFieldsObjFn } from '../utils/localVar';
export let fields = {};
export const checkTargetAssetIdxFn = async (
  matchRequestUrlResult,
  notMetHandler,
  additionParamsObj,
  metHandler
) => {
  const asset = additionParamsObj?.asset;
  changeFieldsObjFn('reset', fields);
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
    const balance = val.balance;
    const { min, startIntervalType } =
      getLevelObj(balance, balanceLevelRules) || {};
    changeFieldsObjFn(fields, 'add', 'someTokenIdx', idx);
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

export const formatRequestResponseFnForOkxSomeTokenBalance = (
  formatRequests,
  formatResponse
) => {
  const { someTokenIdx, someTokenAmountRangeMin, someTokenAmountRangeOp } =
    fields;
  formatResponse[1].conditions.subconditions = [
    {
      field: `$.data.crypto.balances[${someTokenIdx}].currency`,
      op: 'REVEAL_STRING',
      type: 'FIELD_REVEAL',
      reveal_id: 'asset',
    },
    {
      field: `$.data.crypto.balances[${someTokenIdx}].balance`,
      reveal_id: 'balance',
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
