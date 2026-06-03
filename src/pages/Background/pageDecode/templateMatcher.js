/* global console */
/**
 * Builds algorithm params from the active template and captured request map.
 */
import {
  isObject,
  mergeBodyParams,
  mergeQueryParamsIntoUrl,
} from '../utils/utils';
import { assembleAlgorithmParamsForSDK } from '../exData';
import { PADOSERVERURL } from '@/config/envConstants';
import { padoExtensionVersion } from '@/config/constants';
import { getPageDecodeState } from './state';
import { tryPatchAlgorithmParamsForSpecialTemplateLinkedinConnections } from './specialTemplates/specialTemplateLinkedinConnections';
import { tryPatchAlgorithmParamsForSpecialTemplateLumaMonad } from './specialTemplates/lumaMonad';
import { tryPatchAlgorithmParamsForSpecialTemplateLumaPagedApproved } from './specialTemplates/lumaPagedApproved';
import {
  getAmazonHostOverrideForAlgorithmParams,
  rewriteAmazonRequestUrlsForAlgorithmParams,
} from './specialTemplates/amazon';
import {
  getJumpUrlHostOverrideForAlgorithmParams,
  rewriteRequestUrlsForJumpUrl,
} from './additionParamsJumpUrl';
import { getPatchedFormatResponseForSpecialTemplateReputationPhalaBinanceEarnBalance } from './specialTemplates/specialTemplateReputationPhalaBinanceEarnBalance';
import { tryPatchFormatResponseForSpecialTemplateChannelSubscription } from './specialTemplates/specialTemplateChannelSubscription';
import { getPatchedFormatParamsForSpecialTemplateReputationPhala } from './specialTemplates/specialTemplateReputationPhala';

export async function formatAlgorithmParamsFn() {
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;
  const activeTemplate = state.activeTemplate;
  const requestsMap = state.requestsMap;
  const datasourceTemplate = activeTemplate?.datasourceTemplate;
  if (
    !datasourceTemplate ||
    !Array.isArray(datasourceTemplate.requests) ||
    !Array.isArray(datasourceTemplate.responses)
  ) {
    console.log('[formatAlgorithmParamsFn] skip: datasourceTemplate is not ready');
    return;
  }

  const {
    schemaType,
    datasourceTemplate: { host, requests, responses, calculations },
    uiTemplate,
    id,
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
    const hasBodyParams =
      typeof updateParams.bodyParams === 'object' &&
      updateParams.bodyParams !== null &&
      !Array.isArray(updateParams.bodyParams);
    const applyNeedUpdateRequestParams = (baseUrl, baseBody) => {
      const resolvedUrl =
        hasNeedUpdateRequests && hasQueryParams
          ? mergeQueryParamsIntoUrl(baseUrl, updateParams.queryParams)
          : baseUrl;
      const resolvedBody =
        hasNeedUpdateRequests && hasBodyParams
          ? mergeBodyParams(baseBody, updateParams.bodyParams)
          : baseBody;

      return { resolvedUrl, resolvedBody };
    };

    if (r.needCapture === false) {
      const { resolvedUrl, resolvedBody } = applyNeedUpdateRequestParams(
        r.url,
        isObject(r.body) ? { ...r.body } : r.body || {}
      );
      const noCaptureItem = {
        ...r,
        headers: { ...referenceHeaders },
        body: resolvedBody,
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

    const baseUrl = url || (queryString ? r.url + '?' + queryString : r.url);
    const baseBody = isObject(curRequestBody)
      ? { ...curRequestBody }
      : curRequestBody;
    const { resolvedUrl, resolvedBody } = applyNeedUpdateRequestParams(
      baseUrl,
      baseBody
    );

    Object.assign(r, {
      headers: { ...curRequestHeader },
      body: resolvedBody,
      url: resolvedUrl,
    });
    formatRequests.push({ ...r });
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

  const patchedReputationPhalaBinanceEarnFormatResponse =
    getPatchedFormatResponseForSpecialTemplateReputationPhalaBinanceEarnBalance(
      formatResponse,
      activeTemplate
    );
  if (patchedReputationPhalaBinanceEarnFormatResponse) {
    formatResponse.splice(
      0,
      formatResponse.length,
      ...patchedReputationPhalaBinanceEarnFormatResponse
    );
  }
  tryPatchFormatResponseForSpecialTemplateChannelSubscription(
    formatResponse,
    activeTemplate
  );
  const patchedReputationPhalaFormatParams =
    getPatchedFormatParamsForSpecialTemplateReputationPhala(
      formatRequests,
      formatResponse,
      activeTemplate
    );
  if (patchedReputationPhalaFormatParams) {
    formatRequests.splice(
      0,
      formatRequests.length,
      ...patchedReputationPhalaFormatParams.formatRequests
    );
    formatResponse.splice(
      0,
      formatResponse.length,
      ...patchedReputationPhalaFormatParams.formatResponse
    );
  }

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
  tryPatchAlgorithmParamsForSpecialTemplateLumaPagedApproved(aligorithmParams, activeTemplate);

  state.formatAlgorithmParams = aligorithmParams;
  console.log('formatAlgorithmParams', aligorithmParams, activeTemplate);
}
