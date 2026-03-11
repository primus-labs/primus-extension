/**
 * For template b925f0c1: when assembling algorithm params, append one extra request
 * (Binance KYC current-kyc-status POST) and one extra response (userId, passKycLevel REVEAL).
 */

const SPECIAL_TEMPLATE_BINANCE_KYC_TEMPLATE_ID =
  'b925f0c1-f624-4438-80c7-ab08dab897e6';

const SPECIAL_TEMPLATE_BINANCE_KYC_EXTRA_REQUEST = {
  url: 'https://www.binance.com/bapi/kyc/v2/private/certificate/user-kyc/current-kyc-status',
  method: 'POST',
  name: 'sdk-1',
  body: {},
};

const SPECIAL_TEMPLATE_BINANCE_KYC_EXTRA_RESPONSE = {
  conditions: {
    type: 'CONDITION_EXPANSION',
    op: 'BOOLEAN_AND',
    subconditions: [
      {
        field: '$.data.userId',
        op: 'REVEAL_STRING',
        type: 'FIELD_REVEAL',
        reveal_id: 'userId',
      },
      {
        field: '$.data.passKycLevel',
        op: 'REVEAL_STRING',
        type: 'FIELD_REVEAL',
        reveal_id: 'passKycLevel',
      },
    ],
  },
};

/**
 * If template is Binance KYC and algorithm params have exactly one request/response,
 * append one extra request (headers from first) and one extra response.
 */
export function tryPatchAlgorithmParamsForSpecialTemplateBinanceAssetsHistory(
  algorithmParams,
  activeTemplate
) {
  const templateId =
    activeTemplate?.attTemplateID ?? activeTemplate?.id;
  if (templateId !== SPECIAL_TEMPLATE_BINANCE_KYC_TEMPLATE_ID) return;
  if (
    !algorithmParams?.requests?.length ||
    algorithmParams.requests.length !== 1 ||
    !algorithmParams?.responses?.length ||
    algorithmParams.responses.length !== 1
  ) {
    return;
  }

  const firstRequest = algorithmParams.requests[0];
  const extraHeaders = firstRequest?.headers
    ? { ...firstRequest.headers, 'Accept-Encoding': 'identity' }
    : { 'Accept-Encoding': 'identity' };

  algorithmParams.requests.push({
    ...SPECIAL_TEMPLATE_BINANCE_KYC_EXTRA_REQUEST,
    headers: extraHeaders,
  });

  algorithmParams.responses.push(
    JSON.parse(JSON.stringify(SPECIAL_TEMPLATE_BINANCE_KYC_EXTRA_RESPONSE))
  );
}
