import { getLevelObj } from '../utils/amountRange';
import { changeFieldsObjFn } from '../utils/localVar';

let fields = {};

export const checkTargetAssetIdxFn = async (
  matchRequestUrlResult,
  notMetHandler,
  additionParamsObj,
  metHandler
) => {
  const asset = additionParamsObj?.asset;
  changeFieldsObjFn(fields, 'reset');
  if (matchRequestUrlResult && Array.isArray(matchRequestUrlResult)) {
    const [allAssetsObj, ...walletAddressesObjArr] = matchRequestUrlResult;
    if (allAssetsObj?.n === 'All Assets') {
      let targetAssetIdx = allAssetsObj.pi.findIndex(
        (i) => i.coin?.s === asset
      );
      if (!asset) {
        targetAssetIdx = 0;
      }
      if (targetAssetIdx >= 0) {
        metHandler(
          targetAssetIdx,
          allAssetsObj.pi[targetAssetIdx],
          walletAddressesObjArr
        );
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

export const templateIdForCoinstatsSomeTokenBalance =
  '69ca8d78-f557-499b-9754-8d19ef8db9e5';
export const checkTargetRequestFnForCoinstatsSomeTokenBalance = async (
  matchRequestUrlResult,
  notMetHandler,
  extendedParamsObj
) => {
  const { balanceLevelRules } = extendedParamsObj ?? {};
  const metHandler = async (idx, val, walletAddressesObjArr) => {
    const balance = val.c;
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
    changeFieldsObjFn(
      fields,
      'add',
      'walletAddressesObjArr',
      walletAddressesObjArr
    );
  };
  return checkTargetAssetIdxFn(
    matchRequestUrlResult,
    notMetHandler,
    extendedParamsObj,
    metHandler
  );
};

export const formatRequestResponseFnForCoinstatsSpotSomeTokenBalance = (
  formatRequests,
  formatResponse
) => {
  const {
    someTokenIdx,
    someTokenAmountRangeMin,
    someTokenAmountRangeOp,
    walletAddressesObjArr,
  } = fields;
  const walletAddressesConditionStrArr = walletAddressesObjArr.map(
    (walletAddressesObj, k) => {
      return {
        // field: `$[${k + 1}].ai.walletAdress`,
        // op: 'SHA256',
        // type: 'FIELD_VALUE',
        // reveal_id: `walletAddress${k}`,
        op: 'REVEAL_HEX_STRING',
        type: 'FIELD_REVEAL',
        field: {
          type: 'FIELD_ARITHMETIC',
          op: 'SHA256',
          field: `$[${k + 1}].ai.walletAdress`,
        },
        reveal_id: `walletAddress${k}`,
      };
    }
  );
  formatResponse[0].conditions.subconditions = [
    {
      field: `$[0].pi[${someTokenIdx}].coin.s`,
      op: 'REVEAL_STRING',
      type: 'FIELD_REVEAL',
      reveal_id: 'asset',
    },
    {
      field: `$[0].pi[${someTokenIdx}].c`,
      reveal_id: 'balance',
      type: 'FIELD_RANGE',
      op: someTokenAmountRangeOp,
      value: someTokenAmountRangeMin,
    },
    ...walletAddressesConditionStrArr,
  ];

  return {
    formatRequests,
    formatResponse,
  };
};
