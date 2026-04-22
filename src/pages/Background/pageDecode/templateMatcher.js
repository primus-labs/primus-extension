/**
 * Builds algorithm params from the active template and captured request map.
 */
import { isObject, mergeQueryParamsIntoUrl } from '../utils/utils';
import { assembleAlgorithmParamsForSDK } from '../exData';
import { PADOSERVERURL } from '@/config/envConstants';
import { padoExtensionVersion } from '@/config/constants';
import { getPageDecodeState } from './state';
import { tryPatchAlgorithmParamsForSpecialTemplateLinkedinConnections } from './specialTemplates/specialTemplateLinkedinConnections';
import { tryPatchAlgorithmParamsForSpecialTemplateLumaMonad } from './specialTemplates/specialTemplateLumaMonad';
import {
  getAmazonHostOverrideForAlgorithmParams,
  rewriteAmazonRequestUrlsForAlgorithmParams,
} from './specialTemplates/specialTemplateAmazon';
import {
  getJumpUrlHostOverrideForAlgorithmParams,
  rewriteRequestUrlsForJumpUrl,
} from './additionParamsJumpUrl';
import { tryPatchFormatResponseForSpecialTemplateReputationPhalaBinanceEarnBalance } from './specialTemplates/specialTemplateReputationPhalaBinanceEarnBalance';
import { tryPatchFormatResponseForSpecialTemplateChannelSubscription } from './specialTemplates/specialTemplateChannelSubscription';
import { tryPatchFormatRequestsAndResponseForSpecialTemplateReputationPhala } from './specialTemplates/specialTemplateReputationPhala';

export async function formatAlgorithmParamsFn() {
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;
  const activeTemplate = state.activeTemplate;
  const requestsMap = state.requestsMap;

  const {
    dataSource,
    schemaType,
    datasourceTemplate: { host, requests, responses, calculations, cipher },
    uiTemplate,
    id,
    event,
    category,
    requestid,
    algorithmType,
  } = activeTemplate;

  const aligorithmParams = await assembleAlgorithmParamsForSDK(
    {
      dataSource: activeTemplate.dataSource,
      algorithmType: activeTemplate.algorithmType,
      requestid: activeTemplate.requestid,
      sslCipherSuite: activeTemplate.sslCipherSuite,
      allJsonResponseFlag: activeTemplate.allJsonResponseFlag,
      dataPageTemplate: activeTemplate.dataPageTemplate,
    },
    activeTemplate.ext
  );

  const formatRequests = [];
  const referenceRequestEntry = (() => {
    const needCaptureRequest = requests.find(
      (r) => r.needCapture !== false
    );
    if (!needCaptureRequest) return null;
    return Object.values(requestsMap).find(
      (sInfo) =>
        sInfo.templateRequestUrl === needCaptureRequest.url &&
        sInfo.isTarget === 1
    ) || null;
  })();
  const referenceHeaders = referenceRequestEntry?.headers
    ? { ...referenceRequestEntry.headers }
    : {};

  const additionParamsObj = activeTemplate?.additionParamsObj || {};
  const needUpdateRequests = additionParamsObj.needUpdateRequests;
  const hasNeedUpdateRequests =
    Array.isArray(needUpdateRequests) && needUpdateRequests.length > 0;

  const requestsCloned = JSON.parse(JSON.stringify(requests));
  for (let reqIdx = 0; reqIdx < requestsCloned.length; reqIdx++) {
    const r = requestsCloned[reqIdx];
    if (r.queryDetail) continue;

    const updateParams = hasNeedUpdateRequests
      ? needUpdateRequests[reqIdx] ?? {}
      : {};
    const hasQueryParams =
      typeof updateParams.queryParams === 'object' &&
      updateParams.queryParams !== null &&
      !Array.isArray(updateParams.queryParams);

    if (r.needCapture === false) {
      let resolvedUrl = r.url;
      if (hasNeedUpdateRequests && hasQueryParams) {
        resolvedUrl = mergeQueryParamsIntoUrl(r.url, updateParams.queryParams);
      }
      const noCaptureItem = {
        ...r,
        headers: { ...referenceHeaders },
        body: isObject(r.body) ? { ...r.body } : r.body || {},
        url: resolvedUrl,
      };
      if (noCaptureItem.headers) {
        noCaptureItem.headers['Accept-Encoding'] = 'identity';
      }
      formatRequests.push(noCaptureItem);
      continue;
    }

    const targetRequestId =
      Object.values(requestsMap).find(
        (sInfo) => sInfo.templateRequestUrl === r.url && sInfo.isTarget === 1
      )?.requestId || '';
    const currRequestInfoObj = requestsMap[targetRequestId] || {};
    const {
      headers: curRequestHeader,
      body: curRequestBody,
      queryString,
      url
    } = currRequestInfoObj;

    Object.assign(r, {
      headers: { ...curRequestHeader },
      body: isObject(curRequestBody) ? { ...curRequestBody } : curRequestBody,
      url: queryString ? r.url + '?' + queryString : r.url,
    });
    // Prefer the real captured URL when available; otherwise keep the merged template URL.
    formatRequests.push({ ...r, url: url || r.url });
  }

  const amazonHostOverride = rewriteAmazonRequestUrlsForAlgorithmParams(
    formatRequests,
    activeTemplate
  );

  const jumpUrlHostOverride = rewriteRequestUrlsForJumpUrl(
    formatRequests,
    activeTemplate
  );

  const formatResponse = JSON.parse(JSON.stringify(responses));
  for (const fr of formatRequests) {
    if (fr.headers) {
      fr.headers['Accept-Encoding'] = 'identity';
    }
    if (typeof fr.url === 'string') {
      fr.url = fr.url.split('#')[0];
    }
  }

  const algorithmHost =
    jumpUrlHostOverride ||
    amazonHostOverride ||
    getJumpUrlHostOverrideForAlgorithmParams(activeTemplate, formatRequests) ||
    getAmazonHostOverrideForAlgorithmParams(activeTemplate, formatRequests) ||
    host;

  tryPatchFormatResponseForSpecialTemplateReputationPhalaBinanceEarnBalance(
    formatResponse,
    activeTemplate
  );
  tryPatchFormatResponseForSpecialTemplateChannelSubscription(
    formatResponse,
    activeTemplate
  );
  tryPatchFormatRequestsAndResponseForSpecialTemplateReputationPhala(
    formatRequests,
    formatResponse,
    activeTemplate
  );

  Object.assign(aligorithmParams, {
    reqType: 'web',
    host: algorithmHost,
    schemaType,
    requests: formatRequests,
    responses: formatResponse,
    uiTemplate,
    templateId: id,
    calculations,
    PADOSERVERURL,
    padoExtensionVersion,
  });

  await tryPatchAlgorithmParamsForSpecialTemplateLinkedinConnections(aligorithmParams, activeTemplate);
  tryPatchAlgorithmParamsForSpecialTemplateLumaMonad(aligorithmParams, activeTemplate);

  state.formatAlgorithmParams = aligorithmParams;
  console.log('formatAlgorithmParams', aligorithmParams, activeTemplate);
}
