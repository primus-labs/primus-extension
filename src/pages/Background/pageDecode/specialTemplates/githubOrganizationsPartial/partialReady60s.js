/**
 * After 60s from data-source tab open, ready with subset if at least one
 * configured request reached isTarget === 1.
 */
/* global clearTimeout, setTimeout, console */
import { getPageDecodeState, PAGE_DECODE_PHASES } from '../../state.js';
import { formatAlgorithmParamsFn } from '../../templateMatcher.js';
import {
  checkWebRequestIsReady,
  finalizeWebRequestReady,
} from '../../requestInterceptor.js';
import { matches } from './templateId.js';

export const PARTIAL_READY_MS = 60_000;

/** @type {ReturnType<typeof setTimeout> | null} */
let partialReadyTimerId = null;

/**
 * @param {{ partialCaptureIndices?: number[] | null } | null | undefined} state
 * @returns {boolean}
 */
export function isPartialCaptureActive(state) {
  return Array.isArray(state?.partialCaptureIndices);
}

/**
 * @param {{ activeTemplate?: object; requestsMap?: object } | null | undefined} state
 * @returns {number[]}
 */
export function getPartialCaptureIndices(state) {
  const requests = state?.activeTemplate?.datasourceTemplate?.requests;
  const requestsMap = state?.requestsMap || {};
  if (!Array.isArray(requests)) {
    return [];
  }

  const indices = [];
  requests.forEach((r, reqIdx) => {
    if (r?.needCapture === false) {
      return;
    }
    const hasTarget = Object.values(requestsMap).some(
      (sInfo) =>
        sInfo?.templateRequestUrl === r.url && sInfo?.isTarget === 1
    );
    if (hasTarget) {
      indices.push(reqIdx);
    }
  });
  return indices;
}

function countNeedCaptureRequests(requests) {
  if (!Array.isArray(requests)) {
    return 0;
  }
  return requests.filter((r) => r?.needCapture !== false).length;
}

export function clearPartialReadyTimer() {
  if (partialReadyTimerId != null) {
    clearTimeout(partialReadyTimerId);
    partialReadyTimerId = null;
  }
}

export function armPartialReadyTimer() {
  clearPartialReadyTimer();
  const { state } = getPageDecodeState();
  if (!matches(state.activeTemplate)) {
    return;
  }
  partialReadyTimerId = setTimeout(() => {
    partialReadyTimerId = null;
    void tryPartialCaptureReady();
  }, PARTIAL_READY_MS);
}

async function tryPartialCaptureReady() {
  const { state } = getPageDecodeState();
  if (!matches(state.activeTemplate)) {
    return;
  }
  if (state.isReadyRequest || state.phase === PAGE_DECODE_PHASES.ATTESTING) {
    return;
  }

  const requests = state.activeTemplate?.datasourceTemplate?.requests;
  const totalNeedCapture = countNeedCaptureRequests(requests);
  const indices = getPartialCaptureIndices(state);

  if (indices.length === 0) {
    return;
  }

  if (indices.length === totalNeedCapture) {
    clearPartialReadyTimer();
    state.partialCaptureIndices = null;
    await checkWebRequestIsReady();
    return;
  }

  state.partialCaptureIndices = indices;
  if (!state.formatAlgorithmParams) {
    await formatAlgorithmParamsFn();
  }
  console.log('githubPartialReady: subset ready', indices);
  await finalizeWebRequestReady(state);
}
