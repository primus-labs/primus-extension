/**
 * Builds algorithm params from the active template and captured request map.
 */
import { isObject } from '../utils/utils';
import { assembleAlgorithmParamsForSDK } from '../exData';
import { PADOSERVERURL } from '@/config/envConstants';
import { padoExtensionVersion } from '@/config/constants';
import { getPageDecodeState } from './state';
import { tryPatchAlgorithmParamsForSpecialTemplateLinkedinConnections } from './specialTemplateLinkedinConnections';
import { rewriteAmazonNoCaptureRequestUrlsForAlgorithmParams } from './specialTemplateAmazon';

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

  for (const r of JSON.parse(JSON.stringify(requests))) {
    if (r.queryDetail) continue;

    if (r.needCapture === false) {
      const noCaptureItem = {
        ...r,
        headers: { ...referenceHeaders },
        body: isObject(r.body) ? { ...r.body } : r.body || {},
        url: r.url,
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
      url,
    } = currRequestInfoObj;

    Object.assign(r, {
      headers: { ...curRequestHeader },
      body: isObject(curRequestBody) ? { ...curRequestBody } : curRequestBody,
      url: queryString ? r.url + '?' + queryString : r.url,
    });
    formatRequests.push({ ...r, url });
  }

  rewriteAmazonNoCaptureRequestUrlsForAlgorithmParams(
    formatRequests,
    activeTemplate
  );

  const formatResponse = JSON.parse(JSON.stringify(responses));
  for (const fr of formatRequests) {
    if (fr.headers) {
      fr.headers['Accept-Encoding'] = 'identity';
    }
    fr.url = fr.url.split('#')[0];
  }

  Object.assign(aligorithmParams, {
    reqType: 'web',
    host,
    schemaType,
    requests: formatRequests,
    responses: formatResponse,
    uiTemplate,
    templateId: id,
    calculations,
    PADOSERVERURL,
    padoExtensionVersion,
  });

  if (activeTemplate.allJsonResponseFlag === 'true' && Array.isArray(formatResponse)) {
    for (const responseItem of formatResponse) {
      const subconditions = responseItem?.conditions?.subconditions;
      if (!Array.isArray(subconditions)) continue;
      const plaintext_outputs = subconditions
        .filter((itemB) => itemB?.reveal_id != null)
        .map((itemB) => {
          const fieldValue =
            itemB?.field && typeof itemB.field === 'object' && 'field' in itemB.field
              ? itemB.field.field
              : itemB?.field;
          return {
            id: String(itemB.reveal_id) + '_plain',
            field: fieldValue,
          };
        });
      responseItem.plaintext_outputs = plaintext_outputs;
    }
  }

  await tryPatchAlgorithmParamsForSpecialTemplateLinkedinConnections(aligorithmParams, activeTemplate);

  state.formatAlgorithmParams = aligorithmParams;
  console.log('formatAlgorithmParams', aligorithmParams, activeTemplate);
}
