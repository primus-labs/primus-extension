/**
 * For template 99d6d02a (LinkedIn Connections): after intercepting the template-configured
 * request, use its headers to send Voyager requests with start=0,10,20... from the extension.
 * If the count of connection items in a page is < 10, stop pagination.
 * Expand algorithmParams.requests and .responses into arrays aligned with pages.
 */
/* global console */
import { fetchRequestData } from '../utils';

const TEMPLATE_ID_FOR_LINKEDIN_PAGE = '99d6d02a-74a1-4046-a9ab-d00083c5d49c';

const VOYAGER_BASE_URL =
  'https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(start:0,origin:FACETED_SEARCH,query:(flagshipSearchIntent:SEARCH_SRP,queryParameters:List((key:network,value:List(F)),(key:resultType,value:List(PEOPLE))),includeFiltersInResponse:false))&queryId=voyagerSearchDashClusters.05111e1b90ee7fea15bebe9f9410ced9';

const PAGE_SIZE = 10;
const LINKEDIN_CONNECTIONS_REVEAL_FIELD =
  '$.data.searchDashClustersByAll.elements[0].items[*].item.entityResult.title.text';

const linkedinVoyagerPaginationRuntime = {
  requestKey: null,
  pages: null,
  inFlight: null,
};

/**
 * Build Voyager request URL for the given start offset.
 * @param {number} start
 * @returns {string}
 */
function buildLinkedInVoyagerSearchUrl(start) {
  return VOYAGER_BASE_URL.replace(/start:\d+/, `start:${start}`);
}

/**
 * Count connection items in response (items with entityResult).
 * @param {Object} response - Voyager API response
 * @returns {number}
 */
function getConnectionsCount(response) {
  try {
    const items =
      response?.data?.searchDashClustersByAll?.elements?.[0]?.items ?? [];
    return items.filter((i) => i?.item?.entityResult).length;
  } catch {
    return 0;
  }
}

function buildLinkedInRequestKey(activeTemplate, requestMetaInfo) {
  const templateRequestId =
    activeTemplate?.requestid ?? activeTemplate?.attTemplateID ?? activeTemplate?.id ?? '';
  const headers = requestMetaInfo?.headers ?? {};
  return JSON.stringify({
    templateRequestId,
    cookie: headers.Cookie || headers.cookie || '',
    csrfToken:
      headers['csrf-token'] || headers['Csrf-Token'] || headers['x-restli-protocol-version'] || '',
  });
}

function readCachedLinkedInVoyagerPages(requestKey) {
  if (
    linkedinVoyagerPaginationRuntime.requestKey === requestKey &&
    Array.isArray(linkedinVoyagerPaginationRuntime.pages)
  ) {
    return linkedinVoyagerPaginationRuntime.pages;
  }
  return null;
}

function getLinkedInVoyagerInFlight(requestKey) {
  if (linkedinVoyagerPaginationRuntime.requestKey === requestKey) {
    return linkedinVoyagerPaginationRuntime.inFlight;
  }
  return null;
}

function setLinkedInVoyagerRuntime(requestKey, pages, inFlight) {
  linkedinVoyagerPaginationRuntime.requestKey = requestKey;
  linkedinVoyagerPaginationRuntime.pages = pages;
  linkedinVoyagerPaginationRuntime.inFlight = inFlight;
}

/**
 * Assumption: LinkedIn returns full pages of PAGE_SIZE connection items until the last page,
 * where the connection count drops below PAGE_SIZE.
 */
function shouldContinueLinkedInVoyagerPagination(response) {
  return getConnectionsCount(response) >= PAGE_SIZE;
}

function cloneLinkedInTemplateResponse(templateResponse) {
  return JSON.parse(JSON.stringify(templateResponse));
}

function buildLinkedInVoyagerHeaders(requestMetaInfo) {
  return {
    ...(requestMetaInfo?.headers ?? {}),
    'Accept-Encoding': 'identity',
    Accept: 'application/json',
    accept: 'application/json',
  };
}

function buildLinkedInResponseForPage(templateResponse, pageIndex) {
  const cloned = cloneLinkedInTemplateResponse(templateResponse);
  const subconditions = cloned?.conditions?.subconditions;
  const revealId = `connectionsPage${pageIndex + 1}`;
  if (Array.isArray(subconditions)) {
    subconditions.forEach((subcondition) => {
      subcondition.reveal_id = revealId;
      subcondition.field = LINKEDIN_CONNECTIONS_REVEAL_FIELD;
    });
  }
  return cloned;
}

/**
 * Paginate Voyager requests using intercepted request headers until a page has < PAGE_SIZE connections.
 * Concurrent callers for the same attestation share one in-flight run.
 * @param {Object} requestMetaInfo - First captured request (headers, etc.)
 * @returns {Promise<{ pages: Array<{ url: string }>, status: 'success'|'partial'|'failed' }>}
 */
async function fetchLinkedInVoyagerPages(requestMetaInfo, activeTemplate) {
  if (!requestMetaInfo?.headers) {
    return {
      pages: [],
      status: 'failed',
    };
  }
  const requestKey = buildLinkedInRequestKey(activeTemplate, requestMetaInfo);
  const cachedPages = readCachedLinkedInVoyagerPages(requestKey);
  if (cachedPages) {
    return {
      pages: cachedPages,
      status: 'success',
    };
  }
  const inFlight = getLinkedInVoyagerInFlight(requestKey);
  if (inFlight) {
    return inFlight;
  }

  const run = async () => {
    const pages = [];
    let start = 0;
    const headers = buildLinkedInVoyagerHeaders(requestMetaInfo);

    for (;;) {
      const url = buildLinkedInVoyagerSearchUrl(start);
      let response;
      try {
        response = await fetchRequestData({
          url,
          method: 'GET',
          header: headers,
          body: undefined,
        });
      } catch (e) {
        console.log('linkedin voyager pagination request error', {
          start,
          error: e,
        });
        return {
          pages,
          status: pages.length > 0 ? 'partial' : 'failed',
        };
      }
      if (response == null) {
        return {
          pages,
          status: pages.length > 0 ? 'partial' : 'failed',
        };
      }

      pages.push({ url });
      if (!shouldContinueLinkedInVoyagerPagination(response)) {
        return {
          pages,
          status: 'success',
        };
      }
      start += PAGE_SIZE;
    }

    return {
      pages,
      status: 'success',
    };
  };

  const inFlightPromise = run();
  setLinkedInVoyagerRuntime(requestKey, null, inFlightPromise);
  try {
    const result = await inFlightPromise;
    if (result.status !== 'failed') {
      setLinkedInVoyagerRuntime(requestKey, result.pages, null);
    } else {
      setLinkedInVoyagerRuntime(requestKey, null, null);
    }
    return result;
  } finally {
    if (linkedinVoyagerPaginationRuntime.requestKey === requestKey) {
      linkedinVoyagerPaginationRuntime.inFlight = null;
    }
  }
}

function buildLinkedInPatchedRequests(firstRequest, pages) {
  return pages.map((page, idx) => ({
    ...firstRequest,
    url: page.url,
    name: idx === 0 ? firstRequest.name : `sdk-${idx}`,
    headers: {
      ...firstRequest.headers,
      'Accept-Encoding': 'identity',
      Accept: 'application/json',
      accept: 'application/json',
    },
  }));
}

function buildLinkedInPatchedResponses(templateResponse, pages) {
  return pages.map((_, pageIndex) =>
    buildLinkedInResponseForPage(templateResponse, pageIndex)
  );
}

/**
 * If template is LinkedIn Connections and algorithmParams have exactly one request/response,
 * replace them with paginated Voyager requests and per-page responses (reveal_id: connectionsPage1, etc.).
 */
export async function tryPatchAlgorithmParamsForSpecialTemplateLinkedinConnections(
  algorithmParams,
  activeTemplate
) {
  const templateId = activeTemplate?.attTemplateID ?? activeTemplate?.id;
  if (templateId !== TEMPLATE_ID_FOR_LINKEDIN_PAGE) return;

  const requests = algorithmParams?.requests ?? [];
  const responses = algorithmParams?.responses ?? [];
  if (requests.length !== 1 || responses.length !== 1) return;

  const firstRequest = requests[0];
  const requestMetaInfo = {
    headers: firstRequest?.headers ?? {},
  };

  const { pages, status } = await fetchLinkedInVoyagerPages(
    requestMetaInfo,
    activeTemplate
  );
  if (pages.length === 0 || status === 'failed') return;

  const templateResponse = responses[0];
  algorithmParams.requests = buildLinkedInPatchedRequests(firstRequest, pages);
  algorithmParams.responses = buildLinkedInPatchedResponses(
    templateResponse,
    pages
  );
}
