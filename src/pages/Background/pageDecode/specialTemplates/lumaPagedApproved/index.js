/**
 * Luma list pagination (52167341): scan every page for approved entries, then patch
 * algorithm params to one request/response per hit page (FIELD_REVEAL / REVEAL_STRING).
 *
 * Locates the event-list datasource row by URL (`get-events`) and expands it to one pair
 * per captured page with sequential sdk-* names. Leading rows (e.g. email) stay first using
 * the same interceptor-built headers/body; trailing template rows append after paging with
 * non-colliding sdk-* indices.
 */
import { fetchRequestData } from '../../utils';
import { getPageDecodeState } from '../../state';
import { eventListUrlForMonad } from '../lumaMonad';
import {
  getEntryApprovalStatusJsonPath,
  isEntryApproved,
} from '../lumaEntryUtils';
import {
  buildPagedApprovedCalculations,
  TEMPLATE_ID_FOR_LUMA_PAGED_APPROVED,
} from './constants';

function getLumaPagedApprovedHits() {
  return getPageDecodeState().getLumaPagedApprovedHits();
}

function resetLumaPagedApprovedHits() {
  getPageDecodeState().resetLumaPagedApprovedHits();
}

function setLumaPagedApprovedHits(payload) {
  return getPageDecodeState().setLumaPagedApprovedHits(payload);
}

export function isLumaPagedApprovedTemplate(activeTemplate) {
  const id = activeTemplate?.attTemplateID ?? activeTemplate?.id;
  return id === TEMPLATE_ID_FOR_LUMA_PAGED_APPROVED;
}

export function collectApprovedEntryIndexes(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry, idx) => (isEntryApproved(entry) ? idx : -1))
    .filter((idx) => idx >= 0);
}

/** Index of the datasource row that expands into multi-page event-list proofs. */
export function findLumaPagingDatasourceIndex(requests) {
  if (!Array.isArray(requests) || requests.length === 0) return 0;
  const idx = requests.findIndex(
    (r) =>
      typeof r.url === 'string' &&
      (r.url.includes('home/get-events') || r.url.includes('get-events'))
  );
  return idx >= 0 ? idx : 0;
}

function buildPagedApprovedResponseSubconditions(pageHits, pageIdx) {
  const subs = [];
  for (const { entryIdx, approvalStatusJsonPath } of pageHits.hits) {
    const ridBase = `p${pageIdx}_e${entryIdx}`;
    subs.push({
      field: `$.entries[${entryIdx}].event.name`,
      op: 'REVEAL_STRING',
      type: 'FIELD_REVEAL',
      reveal_id: `${ridBase}_eventName`,
    });
    subs.push({
      field: approvalStatusJsonPath,
      op: 'REVEAL_STRING',
      type: 'FIELD_REVEAL',
      reveal_id: `${ridBase}_approvalStatus`,
    });
  }
  return subs;
}

function buildPagedApprovedResponseItem(pageHits, pageIdx) {
  return {
    conditions: {
      op: 'BOOLEAN_AND',
      type: 'CONDITION_EXPANSION',
      subconditions: buildPagedApprovedResponseSubconditions(pageHits, pageIdx),
    },
  };
}

export async function resolvePagedApprovedHits(
  result,
  checkUrl,
  requestMetaInfo,
  hitPagesSoFar = []
) {
  if (!result) {
    return hitPagesSoFar.length > 0 ? { pages: hitPagesSoFar } : null;
  }

  const entries = Array.isArray(result.entries) ? result.entries : [];
  const approvedIndexes = collectApprovedEntryIndexes(entries);

  if (approvedIndexes.length > 0) {
    hitPagesSoFar.push({
      url: checkUrl,
      hits: approvedIndexes.map((entryIdx) => ({
        entryIdx,
        approvalStatusJsonPath: getEntryApprovalStatusJsonPath(
          entryIdx,
          entries[entryIdx]
        ),
      })),
    });
  }

  if (!result.has_more) {
    return hitPagesSoFar.length > 0 ? { pages: hitPagesSoFar } : null;
  }

  const nextUrl = eventListUrlForMonad(
    requestMetaInfo.url,
    result.next_cursor
  );
  const nextResult = await fetchRequestData({
    ...requestMetaInfo,
    header: requestMetaInfo?.headers,
    url: nextUrl,
    method: requestMetaInfo?.method || 'GET',
  });

  return resolvePagedApprovedHits(
    nextResult,
    nextUrl,
    requestMetaInfo,
    hitPagesSoFar
  );
}

export async function checkTargetRequestFnForLumaPagedApproved(
  targetRequestUrl,
  matchRequestUrlResult,
  requestMetaInfo,
  notMetHandler
) {
  resetLumaPagedApprovedHits();
  const resolved = await resolvePagedApprovedHits(
    matchRequestUrlResult,
    targetRequestUrl,
    requestMetaInfo,
    []
  );
  if (!resolved?.pages?.length) {
    await notMetHandler();
    return false;
  }
  setLumaPagedApprovedHits(resolved);
  return true;
}

export function tryPatchAlgorithmParamsForSpecialTemplateLumaPagedApproved(
  algorithmParams,
  activeTemplate
) {
  if (!isLumaPagedApprovedTemplate(activeTemplate)) return;

  const { pages } = getLumaPagedApprovedHits() || {};
  if (
    !Array.isArray(pages) ||
    pages.length === 0 ||
    !Array.isArray(algorithmParams.requests) ||
    algorithmParams.requests.length === 0 ||
    !Array.isArray(algorithmParams.responses)
  ) {
    return;
  }

  const req = algorithmParams.requests;
  const res = algorithmParams.responses;
  const pagerIdx = findLumaPagingDatasourceIndex(req);
  if (pagerIdx >= req.length || pagerIdx >= res.length) {
    return;
  }

  const leadRequests = req
    .slice(0, pagerIdx)
    .map((r, i) => ({ ...r, name: `sdk-${i}` }));
  const leadResponses = res.slice(0, pagerIdx).map((r) => ({ ...r }));

  const pagingBaseRequest = req[pagerIdx];
  const sdkPageStart = leadRequests.length;
  const pagedRequests = pages.map((pageHits, pageIdx) => ({
    ...pagingBaseRequest,
    url: pageHits.url,
    name: `sdk-${sdkPageStart + pageIdx}`,
  }));

  const pagedResponses = pages.map((pageHits, pageIdx) =>
    buildPagedApprovedResponseItem(pageHits, pageIdx)
  );

  const rawTailReq = req.slice(pagerIdx + 1);
  const rawTailRes = res.slice(pagerIdx + 1);
  const tailLen = Math.min(rawTailReq.length, rawTailRes.length);
  const tailSdkStart = sdkPageStart + pagedRequests.length;
  const tailRequests = rawTailReq
    .slice(0, tailLen)
    .map((r, i) => ({ ...r, name: `sdk-${tailSdkStart + i}` }));
  const tailResponses = rawTailRes.slice(0, tailLen).map((r) => ({ ...r }));

  algorithmParams.requests = [...leadRequests, ...pagedRequests, ...tailRequests];
  algorithmParams.responses = [
    ...leadResponses,
    ...pagedResponses,
    ...tailResponses,
  ];
  algorithmParams.calculations = buildPagedApprovedCalculations(
    leadResponses.length + pagedResponses.length + tailResponses.length
  );
}
