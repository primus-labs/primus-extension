/**
 * Reputation Phala — Binance earn account token balance (template 031720f6):
 * optional additionParams asset match in API list, then reveal asset / totalAmount / userId for one row.
 */
import { parseUrlQuery, updateUrlParams } from '../../utils/utils';
import { getPageDecodeState } from '../state';

export const TEMPLATE_ID_FOR_REPUTATION_PHALA_BINANCE_EARN_BALANCE =
  '031720f6-5b78-405c-a91c-3b6efd1586ce';

function getReputationPhalaFields() {
  return getPageDecodeState().getReputationPhalaBinanceEarnFields();
}

function resetReputationPhalaBinanceEarnFields() {
  getPageDecodeState().resetReputationPhalaBinanceEarnFields();
}

function setReputationPhalaBinanceEarnFields(fields) {
  return getPageDecodeState().setReputationPhalaBinanceEarnFields(fields);
}

export function isReputationPhalaBinanceEarnBalanceTemplate(activeTemplate) {
  const id = activeTemplate?.attTemplateID ?? activeTemplate?.id;
  return id === TEMPLATE_ID_FOR_REPUTATION_PHALA_BINANCE_EARN_BALANCE;
}

export function updateRequestMapFnForReputationPhalaBinanceEarnBalance(
  oldRequestMap,
  additionParamsObj
) {
  if (!oldRequestMap || typeof oldRequestMap !== 'object') {
    return oldRequestMap;
  }
  const oldUrl = oldRequestMap.url;
  if (typeof oldUrl !== 'string' || !oldUrl.trim()) {
    return { ...oldRequestMap };
  }
  const oldQueryParams = parseUrlQuery(oldUrl);
  const { pageSize } = oldQueryParams;
  const newUrlParams = {
    pageSize,
  };
  if (pageSize && additionParamsObj?.pageSize) {
    newUrlParams.pageSize = additionParamsObj?.pageSize;
  }

  const newUrl = updateUrlParams(oldUrl, newUrlParams);
  return {
    ...oldRequestMap,
    url: newUrl,
  };
}

function resolveSelectedAssetIndex(data, asset) {
  if (!Array.isArray(data) || data.length === 0) {
    return -1;
  }
  if (!asset) {
    return 0;
  }
  return data.findIndex((item) => item?.asset === asset);
}

function buildSelectedAssetContext(matchRequestUrlResult, additionParamsObj) {
  const { asset } = additionParamsObj ?? {};
  if (!matchRequestUrlResult) {
    return { selectedAssetContext: null, shouldNotifyFailure: false };
  }
  const { code, data } = matchRequestUrlResult;
  if (code !== '000000') {
    return { selectedAssetContext: null, shouldNotifyFailure: false };
  }
  const selectedAssetIndex = resolveSelectedAssetIndex(data, asset);
  if (selectedAssetIndex < 0) {
    return { selectedAssetContext: null, shouldNotifyFailure: true };
  }
  return {
    selectedAssetContext: {
      selectedAssetIndex,
      selectedAsset: data[selectedAssetIndex] ?? null,
    },
    shouldNotifyFailure: false,
  };
}

export async function checkTargetRequestFnForReputationPhalaBinanceEarnBalance(
  matchRequestUrlResult,
  notMetHandler,
  additionParamsObj
) {
  resetReputationPhalaBinanceEarnFields();
  const { selectedAssetContext, shouldNotifyFailure } = buildSelectedAssetContext(
    matchRequestUrlResult,
    additionParamsObj
  );
  if (!selectedAssetContext) {
    if (shouldNotifyFailure) {
      await notMetHandler();
    }
    return false;
  }
  setReputationPhalaBinanceEarnFields(selectedAssetContext);
  return true;
}

function buildBinanceEarnRevealSubconditions(targetIdx) {
  return [
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

/**
 * Build patched template responses to reveal the selected row (index set during checkSDKTargetRequest).
 */
export function getPatchedFormatResponseForSpecialTemplateReputationPhalaBinanceEarnBalance(
  formatResponse,
  activeTemplate
) {
  if (!isReputationPhalaBinanceEarnBalanceTemplate(activeTemplate)) {
    return null;
  }
  if (!Array.isArray(formatResponse) || formatResponse.length === 0) {
    return null;
  }
  const targetIdx =
    getReputationPhalaFields().selectedAssetIndex ?? 0;
  const nextFormatResponse = JSON.parse(JSON.stringify(formatResponse));
  if (!nextFormatResponse?.[0]?.conditions) {
    return nextFormatResponse;
  }
  nextFormatResponse[0].conditions.subconditions =
    buildBinanceEarnRevealSubconditions(targetIdx);
  return nextFormatResponse;
}
