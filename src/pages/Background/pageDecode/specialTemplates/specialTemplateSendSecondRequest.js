/* global Set, console */
/**
 * Development-only helper:
 * replay the first `needCapture:false` request with the first captured request's
 * headers/cookie. This is only for local verification and never participates in
 * the formal attestation path.
 */
import { CURENV } from '@/config/envConstants';
import { getPageDecodeState } from '../state';
import { fetchRequestData } from '../utils';

const replayedRequestIds = new Set();

function resolveReplayConfig(activeTemplate) {
  if (CURENV !== 'development') {
    return null;
  }
  const requests = activeTemplate?.datasourceTemplate?.requests;
  if (!Array.isArray(requests) || requests.length < 2) {
    return null;
  }

  const captureRequestIndex = requests.findIndex((r) => r.needCapture !== false);
  const replayRequestIndex = requests.findIndex((r) => r.needCapture === false);

  if (
    captureRequestIndex < 0 ||
    replayRequestIndex < 0 ||
    captureRequestIndex >= requests.length ||
    replayRequestIndex >= requests.length ||
    captureRequestIndex === replayRequestIndex
  ) {
    return null;
  }

  return {
    captureRequestIndex,
    replayRequestIndex,
  };
}

/**
 * In development only, replay the chosen no-capture request with headers copied
 * from the chosen captured request. Runs at most once per active request id.
 */
export async function trySendSecondRequestWithFirstHeaders() {
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;
  const activeTemplate = state.activeTemplate;
  const replayConfig = resolveReplayConfig(activeTemplate);
  if (!replayConfig) return;

  const activeRequestId = activeTemplate?.requestid;
  if (typeof activeRequestId !== 'string' || !activeRequestId) return;
  if (replayedRequestIds.has(activeRequestId)) return;

  const { requestsMap } = state;
  const {
    datasourceTemplate: { requests },
  } = activeTemplate || { datasourceTemplate: { requests: [] } };

  const needCaptureRequest = requests[replayConfig.captureRequestIndex];
  const noCaptureRequest = requests[replayConfig.replayRequestIndex];
  if (!needCaptureRequest || !noCaptureRequest) return;
  if (needCaptureRequest.needCapture === false || noCaptureRequest.needCapture !== false) {
    return;
  }

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
    replayedRequestIds.add(activeRequestId);
    const response = await fetchRequestData({
      url,
      method,
      header,
      body,
    });
    console.log('debugSendSecondRequest success', {
      requestid: activeRequestId,
      captureRequestIndex: replayConfig.captureRequestIndex,
      replayRequestIndex: replayConfig.replayRequestIndex,
      method,
      url,
      response,
    });
  } catch (e) {
    console.log('debugSendSecondRequest fetch error', e);
  }
}
