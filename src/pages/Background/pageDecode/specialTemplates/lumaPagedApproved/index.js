/**
 * Luma list pagination (52167341): scan every page for approved entries, then patch
 * algorithm params to one request/response per hit page (FIELD_REVEAL / REVEAL_STRING).
 * Remaining template request/response pairs (after the first) are appended; their
 * request `name` values are reassigned to sdk-(lastPagedN+1).. so they never collide
 * with paginated sdk-0..sdk-(pages-1).
 */
import { fetchRequestData } from '../../utils';
import { getPageDecodeState } from '../../state';
import { eventListUrlForMonad } from '../lumaMonad';
import {
  buildPagedApprovedCalculations,
  TEMPLATE_ID_FOR_LUMA_PAGED_APPROVED,
} from './constants';

const APPROVED_VALUE = 'approved';

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
    .map((entry, idx) =>
      entry?.role?.approval_status === APPROVED_VALUE ? idx : -1
    )
    .filter((idx) => idx >= 0);
}

/** First tail request uses sdk-(N+1) when the last paged request is sdk-N. */
function nextSdkNumericIndexAfterPaged(pagedRequests) {
  const last = pagedRequests[pagedRequests.length - 1]?.name;
  if (typeof last === 'string') {
    const m = last.match(/^sdk-(\d+)$/i);
    if (m) return Number(m[1]) + 1;
  }
  return pagedRequests.length;
}

function buildPagedApprovedResponseSubconditions(pageHits, pageIdx) {
  const subs = [];
  for (const { entryIdx } of pageHits.hits) {
    const ridBase = `p${pageIdx}_e${entryIdx}`;
    subs.push({
      field: `$.entries[${entryIdx}].event.name`,
      op: 'REVEAL_STRING',
      type: 'FIELD_REVEAL',
      reveal_id: `${ridBase}_eventName`,
    });
    subs.push({
      field: `$.entries[${entryIdx}].role.approval_status`,
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

  const baseRequest = algorithmParams.requests[0];
  const pagedRequests = pages.map((pageHits, idx) => ({
    ...baseRequest,
    url: pageHits.url,
    name: idx === 0 ? baseRequest.name : `sdk-${idx}`,
  }));

  const pagedResponses = pages.map((pageHits, pageIdx) =>
    buildPagedApprovedResponseItem(pageHits, pageIdx)
  );

  const rawTailReq = algorithmParams.requests.slice(1);
  const rawTailRes = algorithmParams.responses.slice(1);
  const tailLen = Math.min(rawTailReq.length, rawTailRes.length);
  const tailSdkStart = nextSdkNumericIndexAfterPaged(pagedRequests);
  const tailRequests = rawTailReq
    .slice(0, tailLen)
    .map((r, i) => ({ ...r, name: `sdk-${tailSdkStart + i}` }));
  const tailResponses = rawTailRes.slice(0, tailLen).map((r) => ({ ...r }));

  algorithmParams.requests = [...pagedRequests, ...tailRequests];
  algorithmParams.responses = [...pagedResponses, ...tailResponses];
  algorithmParams.calculations = buildPagedApprovedCalculations(
    pagedResponses.length + tailResponses.length
  );
}
