/**
 * Reputation Phala — Binance earn account token balance (template 031720f6):
 * optional additionParams asset match in API list, then reveal asset / totalAmount / userId for one row.
 */
import { parseUrlQuery, updateUrlParams } from '../utils/utils';
import { getPageDecodeState } from './state';

export const TEMPLATE_ID_FOR_REPUTATION_PHALA_BINANCE_EARN_BALANCE =
  '031720f6-5b78-405c-a91c-3b6efd1586ce';

/** @deprecated Prefer TEMPLATE_ID_FOR_REPUTATION_PHALA_BINANCE_EARN_BALANCE */
export const templateIdForReputationPhalaBinanceEarnBalance =
  TEMPLATE_ID_FOR_REPUTATION_PHALA_BINANCE_EARN_BALANCE;

function getReputationPhalaFields() {
  return getPageDecodeState().state.reputationPhalaBinanceEarnFields;
}

function changeReputationPhalaField(op, key, value) {
  const fields = getReputationPhalaFields();
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

export function isReputationPhalaBinanceEarnBalanceTemplate(activeTemplate) {
  const id = activeTemplate?.attTemplateID ?? activeTemplate?.id;
  return id === TEMPLATE_ID_FOR_REPUTATION_PHALA_BINANCE_EARN_BALANCE;
}

export function updateRequestMapFnForReputationPhalaBinanceEarnBalance(
  oldRequestMap,
  additionParamsObj
) {
  const oldUrl = oldRequestMap.url;
  const oldQueryParams = parseUrlQuery(oldUrl);
  const { pageSize } = oldQueryParams;
  const newUrlParams = {
    pageSize,
  };
  if (pageSize && additionParamsObj?.pageSize) {
    newUrlParams.pageSize = additionParamsObj?.pageSize;
  }

  const newUrl = updateUrlParams(oldUrl, newUrlParams);
  oldRequestMap.url = newUrl;
  return oldRequestMap;
}

async function checkTargetAssetIdxFn(
  matchRequestUrlResult,
  notMetHandler,
  additionParamsObj,
  metHandler
) {
  const { asset } = additionParamsObj ?? {};
  changeReputationPhalaField('reset');
  if (!matchRequestUrlResult) {
    return false;
  }
  const { code, data } = matchRequestUrlResult;
  if (code !== '000000') {
    return false;
  }
  let targetAssetIdx = data.findIndex((i) => i.asset === asset);
  if (!asset) {
    targetAssetIdx = 0;
  }
  if (targetAssetIdx >= 0) {
    metHandler(targetAssetIdx, data[targetAssetIdx]);
    return true;
  }
  await notMetHandler();
  return false;
}

export async function checkTargetRequestFnForReputationPhalaBinanceEarnBalance(
  matchRequestUrlResult,
  notMetHandler,
  additionParamsObj
) {
  const metHandler = (reputationPhalaBinanceEarnAssetIdx) => {
    changeReputationPhalaField(
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
}

/**
 * Patch template responses to reveal the selected row (index set during checkSDKTargetRequest).
 * Call before assigning responses into algorithm params so plaintext_outputs stay aligned.
 */
export function tryPatchFormatResponseForSpecialTemplateReputationPhalaBinanceEarnBalance(
  formatResponse,
  activeTemplate
) {
  if (!isReputationPhalaBinanceEarnBalanceTemplate(activeTemplate)) {
    return;
  }
  if (!Array.isArray(formatResponse) || formatResponse.length === 0) {
    return;
  }
  const targetIdx =
    getReputationPhalaFields().reputationPhalaBinanceEarnAsset ?? 0;
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
}
