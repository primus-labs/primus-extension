/**
 * For template 99d6d02a (LinkedIn Connections): after intercepting the template-configured
 * request, use its headers to send Voyager requests with start=0,10,20... from the extension.
 * If the count of connection items in a page is < 10, stop pagination.
 * Expand algorithmParams.requests and .responses into arrays aligned with pages.
 */
import { getPageDecodeState } from './state';
import { fetchRequestData } from './utils';

const TEMPLATE_ID_FOR_LINKEDIN_PAGE = '99d6d02a-74a1-4046-a9ab-d00083c5d49c';

const VOYAGER_BASE_URL =
  'https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(start:0,origin:FACETED_SEARCH,query:(flagshipSearchIntent:SEARCH_SRP,queryParameters:List((key:network,value:List(F)),(key:resultType,value:List(PEOPLE))),includeFiltersInResponse:false))&queryId=voyagerSearchDashClusters.05111e1b90ee7fea15bebe9f9410ced9';

const PAGE_SIZE = 10;

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

/**
 * Paginate Voyager requests using intercepted request headers until a page has < PAGE_SIZE connections.
 * Returns cached result for this session; concurrent callers share one in-flight run.
 * @param {Object} requestMetaInfo - First captured request (headers, etc.)
 * @returns {Promise<Array<{ url: string }>>}
 */
async function fetchLinkedInVoyagerPages(requestMetaInfo) {
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;

  if (!requestMetaInfo?.headers) return [];
  if (state.linkedinVoyagerPaginationCache) return state.linkedinVoyagerPaginationCache;
  if (state.linkedinVoyagerPaginationInFlight) {
    return state.linkedinVoyagerPaginationInFlight;
  }

  const run = async () => {
    const pages = [];
    let start = 0;
    const headers = {
      ...requestMetaInfo.headers,
      'Accept-Encoding': 'identity',
      Accept: 'application/json',
      accept: 'application/json',
    };

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
        console.log('linkedin voyager pagination request error', e);
        break;
      }
      if (response == null) break;

      pages.push({ url });
      const count = getConnectionsCount(response);
      if (count < PAGE_SIZE) break;
      start += PAGE_SIZE;
    }

    state.linkedinVoyagerPaginationCache = pages;
    return pages;
  };

  const inFlight = run();
  state.linkedinVoyagerPaginationInFlight = inFlight;
  try {
    return await inFlight;
  } finally {
    state.linkedinVoyagerPaginationInFlight = null;
  }
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

  const pages = await fetchLinkedInVoyagerPages(requestMetaInfo);
  if (pages.length === 0) return;

  const templateResponse = responses[0];
  const newRequests = pages.map((page, idx) => ({
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

  const newResponses = pages.map((_, pageIndex) => {
    const cloned = JSON.parse(JSON.stringify(templateResponse));
    const subconditions = cloned?.conditions?.subconditions;
    const revealId = `connectionsPage${pageIndex + 1}`;
    if (Array.isArray(subconditions)) {
      subconditions.forEach((sc) => {
        sc.reveal_id = revealId;
        sc.field =
          '$.data.searchDashClustersByAll.elements[0].items[*].item.entityResult.title.text';
      });
    }
    return cloned;
  });

  algorithmParams.requests = newRequests;
  algorithmParams.responses = newResponses;
}
