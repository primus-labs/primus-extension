/**
 * LinkedIn page template - special handling.
 * After intercepting the template-configured request, use its header to send Voyager requests with start=0,10,20... from the extension;
 * If the count of items with template===UNIVERSAL in $.included is 10, fetch next page; otherwise stop.
 * Pass to the algorithm requests/responses as arrays aligned with pages; each response field is $.included.
 */

import { extraRequestFn2 } from '../pageDecode/utils.js';

export const templateIdForLinkedInPage =
  '99d6d02a-74a1-4046-a9ab-d00083c5d49c';

const VOYAGER_BASE_URL =
  'https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(start:0,origin:FACETED_SEARCH,query:(flagshipSearchIntent:SEARCH_SRP,queryParameters:List((key:network,value:List(F)),(key:resultType,value:List(PEOPLE))),includeFiltersInResponse:false))&queryId=voyagerSearchDashClusters.05111e1b90ee7fea15bebe9f9410ced9';

/** Backward compatibility; actual pagination uses buildLinkedInVoyagerSearchUrl(0) */
export const LINKEDIN_VOYAGER_SEARCH_URL = VOYAGER_BASE_URL;

/**
 * Build Voyager request URL for the given start offset
 * @param {number} start
 * @returns {string}
 */
export const buildLinkedInVoyagerSearchUrl = (start) => {
  return VOYAGER_BASE_URL.replace(/start:\d+/, `start:${start}`);
};

const UNIVERSAL = 'UNIVERSAL';

/**
 * Count items in response.included where template === 'UNIVERSAL'
 * @param {Object} response - Voyager API response
 * @returns {number}
 */
export const getUniversalIncludedCount = (response) => {
  const included = response?.included || [];
  return included.filter((item) => item?.template === UNIVERSAL).length;
};

/** Cache of pagination results for this session; avoids re-running the full request chain when formatAlgorithmParamsFn is triggered multiple times */
let paginationCache = null;
/** In-flight promise for pagination; shared across concurrent callers to avoid duplicate requests */
let paginationInFlight = null;

/**
 * Call when proof session starts; clears pagination cache
 */
export const resetVoyagerExtraRequestSentForSession = () => {
  paginationCache = null;
  paginationInFlight = null;
};

/**
 * Paginate with intercepted request header (start=0,10,20...) until a page has UNIVERSAL count !== 10.
 * Returns cached result for this session; if not cached, runs pagination and caches; concurrent callers share one in-flight run.
 * @param {Object} requestMetaInfo - Intercepted request info (includes headers)
 * @returns {Promise<Array<{ url: string }>>} Per-page request info (url + same header)
 */
export const fetchLinkedInVoyagerRequests = async (requestMetaInfo) => {
  if (!requestMetaInfo?.headers) return [];
  if (paginationCache) return paginationCache;
  if (paginationInFlight) return paginationInFlight;

  const run = async () => {
    const pages = [];
    let start = 0;
    const PAGE_SIZE = 10;

    for (;;) {
      const url = buildLinkedInVoyagerSearchUrl(start);
      let response;
      try {
        response = await extraRequestFn2({
          ...requestMetaInfo,
          header: {...requestMetaInfo.headers, 
            Accept: 'application/json',
            accept: 'application/json',
          },
          url,
        });
      } catch (e) {
        // eslint-disable-next-line no-undef
        console.log('linkedin voyager pagination request error', e);
        break;
      }
      if (response == null) break;
      pages.push({ url });
      const count = getUniversalIncludedCount(response);
      if (count !== PAGE_SIZE) break;
      start += PAGE_SIZE;
    }

    paginationCache = pages;
    return pages;
  };

  paginationInFlight = run();
  try {
    return await paginationInFlight;
  } finally {
    paginationInFlight = null;
  }
};

/**
 * Page template: paginate Voyager requests and expand formatRequests/formatResponse into arrays aligned with pages
 * @param {Array} formatRequests - Already contains one intercepted request
 * @param {Array} formatResponse - Response conditions (at least one)
 * @returns {{ formatRequests: Array, formatResponse: Array }}
 */
export const formatRequestResponseFnForLinkedInPage = async (
  formatRequests,
  formatResponse
) => {
  const first = formatRequests[0];
  if (!first) {
    return { formatRequests, formatResponse };
  }

  const pages = await fetchLinkedInVoyagerRequests(first);
  if (pages.length === 0) {
    return { formatRequests, formatResponse };
  }

  const newFormatRequests = pages.map((page, idx) => ({
    ...first,
    url: page.url,
    name: idx === 0 ? first.name : `sdk-${idx}`,
    headers: {...first.headers, accept: 'application/json',}
  }));

  const templateResponse = formatResponse[0];
  if (!templateResponse) {
    return { formatRequests: newFormatRequests, formatResponse };
  }

  const newFormatResponse = pages.map(() => {
    const cloned = JSON.parse(JSON.stringify(templateResponse));
    const subconditions = cloned?.conditions?.subconditions;
    if (Array.isArray(subconditions)) {
      subconditions.forEach((sc) => {
        // sc.field = '$.included';
        sc.reveal_id = 'included'
        sc.field = '$.data.searchDashClustersByAll.elements[0].items[*].item.entityResult.title.text'
        // sc.field = '$.data.searchDashClustersByAll.elements[0].items'
      });
    }
    return cloned;
  });

  return {
    formatRequests: newFormatRequests,
    formatResponse: newFormatResponse,
  };
};
