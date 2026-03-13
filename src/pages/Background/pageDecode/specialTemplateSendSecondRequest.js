/**
 * For template 9119207f: when the first requestUrl (needCapture) is intercepted,
 * send the second requestUrl (needCapture:false) from the extension using the
 * first request's headers and cookie. Other flows are unchanged.
 */
import { getPageDecodeState } from './state';
import { fetchRequestData } from './utils';

const SPECIAL_TEMPLATE_TWO_REQUEST_ID = '';

/**
 * If active template is the special one with two requestUrls (one needCapture, one needCapture:false),
 * and we have captured the first request, send the second request from the extension with the
 * first request's headers and cookie, and store the response in state.
 */
export async function trySendSecondRequestWithFirstHeaders() {
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;
  const templateId = state.activeTemplate?.attTemplateID ?? state.activeTemplate?.id;
  if (templateId !== SPECIAL_TEMPLATE_TWO_REQUEST_ID) return;

  const { requestsMap, specialSecondRequestSent } = state;
  const {
    datasourceTemplate: { requests },
  } = state.activeTemplate || { datasourceTemplate: { requests: [] } };

  const needCaptureRequest = requests.find(
    (r) => r.needCapture !== false
  );
  const noCaptureRequest = requests.find((r) => r.needCapture === false);
  if (!needCaptureRequest || !noCaptureRequest) return;
  if (specialSecondRequestSent) return;

  const firstCaptured = Object.values(requestsMap).find(
    (sInfo) =>
      sInfo.templateRequestUrl === needCaptureRequest.url && sInfo.headers
  );
  if (!firstCaptured?.headers) return;

  const header = { ...firstCaptured.headers };
  header['Accept-Encoding'] = 'identity';

  const method = (noCaptureRequest.method || 'GET').toUpperCase();
  const body = noCaptureRequest.body ?? (method !== 'GET' ? {} : undefined);
  const url = noCaptureRequest.url;

  try {
    const response = await fetchRequestData({
      url,
      method,
      header,
      body,
    });
    state.specialSecondRequestResponse = response;
    state.specialSecondRequestSent = true;
  } catch (e) {
    console.log('specialTemplateSendSecondRequest fetch error', e);
  }
}
