/**
 * Builds algorithm params from the active template and captured request map.
 */
import { isObject } from '../utils/utils';
import { assembleAlgorithmParamsForSDK } from '../exData';
import { PADOSERVERURL } from '@/config/envConstants';
import { padoExtensionVersion } from '@/config/constants';
import { getPageDecodeState } from './state';

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
  for (const r of JSON.parse(JSON.stringify(requests))) {
    if (r.queryDetail) continue;

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
    formatRequests.push({ ...r, url: r.name === 'first' ? r.url : url });
  }

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

  state.formatAlgorithmParams = aligorithmParams;
  console.log('formatAlgorithmParams', aligorithmParams, activeTemplate);
}
