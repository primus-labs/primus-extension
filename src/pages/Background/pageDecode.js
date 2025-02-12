import jp from 'jsonpath';
import {
  assembleAlgorithmParams,
  assembleAlgorithmParamsForSDK,
} from './exData';
import { storeDataSource } from './dataSourceUtils';
import { DATASOURCEMAP } from '@/config/dataSource';
import { PADOSERVERURL } from '@/config/envConstants';
import { padoExtensionVersion } from '@/config/constants';
import { eventReport } from '@/services/api/usertracker';
import customFetch, { customFetch2 } from './utils/request';
import {
  monadEventName,
  monadTemplateId,
  monadEventListUrlFn,
  monadProfileUrlFn,
} from './padoZKAttestationJSSDK/lumaMonad.js';
import {
  isJSONString,
  isObject,
  parseCookie,
  isUrlWithQueryFn,
  checkIsRequiredUrl,
} from './utils/utils';

let monadFields = {};

let PRE_ATTEST_PROMOT = '';
let dataSourcePageTabId;
let activeTemplate = {};
let currExtentionId;

let isReadyRequest = false;
let operationType = null;
let RequestsHasCompleted = false;
let formatAlgorithmParams = null;
let preAlgorithmStatus = '';
let preAlgorithmTimer = null;
let preAlgorithmFlag = false;
let chatgptHasLogin = false;
let sdkTargetRequestId = '';
let listenerFn = () => {};
let onBeforeSendHeadersFn = () => {};
let onBeforeRequestFn = () => {};
let onCompletedFn = () => {};
let requestsMap = {};

const removeRequestsMap = async (url) => {
  // console.log('requestsMap-remove', url);
  // await chrome.storage.local.remove([
  //   'https://www.tiktok.com/passport/web/account/info/',
  //   'https://api.x.com/1.1/account/settings.json',
  // ]);
  delete requestsMap[url];
};
const storeRequestsMap = (url, urlInfo) => {
  const lastStoreRequestObj = requestsMap[url] || {};
  console.log('requestsMap-store', url, lastStoreRequestObj, urlInfo);
  const urlInfoHeaders = urlInfo?.headers;
  if (
    urlInfoHeaders &&
    (urlInfoHeaders?.['Content-Type']?.includes('text/plain') ||
      urlInfoHeaders?.['content-type']?.includes('text/plain')) &&
    lastStoreRequestObj.body
  ) {
    urlInfo.body = JSON.stringify(lastStoreRequestObj.body);
  }
  Object.assign(requestsMap, {
    [url]: { ...lastStoreRequestObj, ...urlInfo },
  });

  return requestsMap[url];
};

const resetVarsFn = () => {
  isReadyRequest = false;
  operationType = null;
  RequestsHasCompleted = false;
  formatAlgorithmParams = null;
  preAlgorithmStatus = '';
  preAlgorithmTimer = null;
  preAlgorithmFlag = false;
  chatgptHasLogin = false;
  requestsMap = {};
  sdkTargetRequestId = '';
  monadFields = {};
  chrome.runtime.onMessage.removeListener(listenerFn);
};
const handlerForSdk = async (processAlgorithmReq, operation) => {
  const {
    padoZKAttestationJSSDKBeginAttest,
    padoZKAttestationJSSDKDappTabId: dappTabId,
  } = await chrome.storage.local.get([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKDappTabId',
  ]);
  const { activeRequestAttestation: lastActiveRequestAttestationStr } =
    await chrome.storage.local.get(['activeRequestAttestation']);
  if (processAlgorithmReq && lastActiveRequestAttestationStr) {
    processAlgorithmReq({
      reqMethodName: 'stop',
    });
  }
  if (padoZKAttestationJSSDKBeginAttest) {
    await chrome.storage.local.remove([
      'padoZKAttestationJSSDKBeginAttest',
      'padoZKAttestationJSSDKAttestationPresetParams',
      'padoZKAttestationJSSDKXFollowerCount',
      'activeRequestAttestation',
    ]);
    let desc = `The user ${operation} the attestation`;
    let resParams = { result: false };
    if (!resParams.result) {
      resParams.errorData = {
        title: '',
        desc: desc,
        code: '00004',
      };
      resParams.reStartFlag = true;
    }
    try {
      chrome.tabs.sendMessage(dappTabId, {
        type: 'padoZKAttestationJSSDK',
        name: 'startAttestationRes',
        params: resParams,
      });
    } catch (error) {
      console.log('handlerForSdk error:', handlerForSdk);
    }
  }
};

const extraRequestFn = async () => {
  // { currentWindow: true }
  const tabs = await chrome.tabs.query({});
  const dataSourcePageTabObj = tabs.find((i) => i.id === dataSourcePageTabId);
  const pathname = new URL(dataSourcePageTabObj.url).pathname;
  const arr = pathname.split('/');
  const chatgptQuestionSessionId = arr[arr.length - 1];
  const requestUrl = 'https://chatgpt.com/backend-api/conversation';
  const fullRequestUrl = `${requestUrl}/${chatgptQuestionSessionId}`;

  // const storageRes = await chrome.storage.local.get(requestUrl);
  const storageRes = requestsMap;
  const activeInfo = Object.values(storageRes).find(
    (i) => i.url === requestUrl
  );
  try {
    const requestRes = await customFetch(fullRequestUrl, {
      method: 'GET',
      // headers: JSON.parse(storageRes[requestUrl]).headers,
      headers: activeInfo.headers,
    });

    const messageIds = [];
    Object.keys(requestRes.mapping).forEach((mK) => {
      const parts = requestRes.mapping[mK]?.message?.content?.parts;
      if (parts && parts[0]) {
        messageIds.push(mK);
      }
    });
    const obj = {
      request: {
        url: fullRequestUrl,
        method: 'GET',
        headers: {
          host: 'chatgpt.com',
        },
      },
      response: {
        messageIds,
      },
    };
    chrome.storage.local.set({
      [`${requestUrl}-extra`]: JSON.stringify(obj),
    });
    RequestsHasCompleted = true;
  } catch (e) {
    console.log('fetch chatgpt conversation error', e);
  }
};
const extraRequestFn2 = async (params) => {
  try {
    const { ...requestParams } = params;
    const requestRes = await customFetch2(requestParams);
    if (typeof requestRes === 'object' && requestRes !== null) {
      return requestRes;
    }
  } catch (e) {
    console.log('fetch custom request error', e);
  }
};

// inject-dynamic
export const pageDecodeMsgListener = async (
  request,
  sender,
  sendResponse,
  password,
  port,
  hasGetTwitterScreenName,
  processAlgorithmReq
) => {
  const { name, params, operation } = request;
  if (name === 'init') {
    activeTemplate = {};
    activeTemplate = params;
    resetVarsFn();
  }
  if (activeTemplate.dataSource) {
    let {
      dataSource,
      jumpTo,
      datasourceTemplate: { requests },
    } = activeTemplate;

    const checkSDKTargetRequestFn = async () => {
      const {
        datasourceTemplate: { requests, responses },
      } = activeTemplate;

      const sdkRequestUrl = requests[0].url;

      const matchRequestIdArr = Object.keys(requestsMap).filter((key) => {
        const checkRes = checkIsRequiredUrl({
          requestUrl: requestsMap[key].url,
          requiredUrl: sdkRequestUrl,
          urlType: requests[0].urlType || 'REGX',
          queryParams: requests[0].queryParams,
        });
        return checkRes;
      });

      const hadTargetRequestId = Object.keys(requestsMap).some((k) => {
        if (matchRequestIdArr.includes(k)) {
          if (requestsMap[k].isTarget === 1) {
            sdkTargetRequestId = k;
          }
          return requestsMap[k].isTarget === 1;
        } else {
          return false;
        }
      });
      if (!hadTargetRequestId) {
        for (const matchRequestId of [...matchRequestIdArr]) {
          if (requestsMap[matchRequestId].isTarget === 1) {
            sdkTargetRequestId = matchRequestId;
            break;
          } else if (requestsMap[matchRequestId].isTarget === 2) {
          } else {
            const jsonPathArr = responses[0].conditions.subconditions.map(
              (i) => i.field
            );
            let targetRequestUrl = requestsMap[matchRequestId].url;
            if (activeTemplate?.attTemplateID === monadTemplateId) {
              // 'https://api.lu.ma/home/get-events?period=past&pagination_limit=1000';
              targetRequestUrl = monadEventListUrlFn(targetRequestUrl); // TODO
            }
            let matchRequestUrlResult = await extraRequestFn2({
              ...requestsMap[matchRequestId],
              header: requestsMap[matchRequestId].headers,
              url: targetRequestUrl,
            });
            // TODO del
            if (
              matchRequestUrlResult &&
              targetRequestUrl ===
                'https://api.lu.ma/home/get-events?period=past&pagination_limit=1000'
            ) {
              matchRequestUrlResult = {
                entries: [
                  {
                    api_id: 'evt-OjuuAyAyXTMSsUD',
                    event: {
                      api_id: 'evt-OjuuAyAyXTMSsUD',
                      calendar_api_id: 'cal-fMrW6DRAB14tCbj',
                      cover_url:
                        'https://images.lumacdn.com/event-covers/53/d4f946c2-e086-452a-b160-ba8623e69354',
                      end_at: '2023-06-14T18:30:00.000Z',
                      event_type: 'independent',
                      hide_rsvp: false,
                      location_type: 'zoom',
                      name: 'Welcome to zkIgnite - Gathering 1',
                      one_to_one: false,
                      recurrence_id: null,
                      show_guest_list: false,
                      start_at: '2023-06-14T17:00:00.000Z',
                      timezone: 'America/New_York',
                      url: 'lowglwxw',
                      user_api_id: 'usr-84geKnbuQUMmz8z',
                      visibility: 'public',
                      waitlist_enabled: false,
                      can_register_for_multiple_tickets: false,
                      duration_interval: 'P0Y0M0DT1H30M0S',
                      virtual_info: {
                        has_access: true,
                        raw_join_url: 'https://us06web.zoom.us/j/83099166072',
                        zoom_id: '83099166072',
                        password: null,
                      },
                      geo_longitude: null,
                      geo_latitude: null,
                      geo_address_info: null,
                      geo_address_visibility: 'public',
                    },
                    cover_image: {
                      vibrant_color: '#8371f4',
                      colors: ['#fefdff', '#7e6eea', '#8877d8', '#a9a6e8'],
                    },
                    calendar: {
                      access_level: 'public',
                      api_id: 'cal-fMrW6DRAB14tCbj',
                      avatar_url:
                        'https://cdn.lu.ma/avatars-default/community_avatar_7.png',
                      cover_image_url:
                        'https://images.lumacdn.com/calendar-defaults/patterns/dots-100.png',
                      description_short: null,
                      event_submission_restriction: 'none',
                      geo_city: null,
                      geo_country: null,
                      geo_latitude: null,
                      geo_longitude: null,
                      geo_region: null,
                      google_measurement_id: null,
                      instagram_handle: null,
                      launch_status: 'launched',
                      linkedin_handle: null,
                      luma_plus_active: false,
                      meta_pixel_id: null,
                      name: 'Personal',
                      personal_user_api_id: 'usr-84geKnbuQUMmz8z',
                      refund_policy: null,
                      slug: null,
                      social_image_url: null,
                      stripe_account_id: null,
                      tax_config: null,
                      tiktok_handle: null,
                      timezone: null,
                      tint_color: '#de3163',
                      track_meta_ads_from_luma: false,
                      twitter_handle: null,
                      verified_at: '2023-08-02T17:35:07.657Z',
                      website: null,
                      youtube_handle: null,
                      is_personal: true,
                    },
                    start_at: '2023-06-14T17:00:00.000Z',
                    hosts: [
                      {
                        api_id: 'usr-84geKnbuQUMmz8z',
                        avatar_url:
                          'https://cdn.lu.ma/avatars/ll/36a235e5-72e5-4def-9e5a-84f0e3d141ad',
                        bio_short: null,
                        instagram_handle: null,
                        last_online_at: '2023-04-07T15:34:36.868Z',
                        linkedin_handle: null,
                        name: 'Janay',
                        tiktok_handle: null,
                        timezone: 'America/New_York',
                        twitter_handle: null,
                        username: null,
                        website: null,
                        youtube_handle: null,
                        access_level: 'manager',
                        event_api_id: 'evt-OjuuAyAyXTMSsUD',
                      },
                      {
                        api_id: 'usr-PA0zIj3QiK3OsW5',
                        avatar_url:
                          'https://cdn.lu.ma/avatars/wu/209a32a4-d00c-4e15-9b8e-79cc6de1d4f1',
                        bio_short:
                          'Join us for weekly office hours, every Wednesday!',
                        instagram_handle: null,
                        last_online_at: '2023-03-29T16:52:30.175Z',
                        linkedin_handle: null,
                        name: 'Mina Protocol Office Hours',
                        tiktok_handle: null,
                        timezone: 'Asia/Bangkok',
                        twitter_handle: 'dinaturalist',
                        username: 'mina',
                        website: 'http://minaprotocol.com',
                        youtube_handle: null,
                        access_level: 'manager',
                        event_api_id: 'evt-OjuuAyAyXTMSsUD',
                      },
                      {
                        api_id: 'usr-OCJzZzGIdCO7gvn',
                        avatar_url:
                          'https://cdn.lu.ma/avatars-default/avatar_3.png',
                        bio_short: null,
                        instagram_handle: null,
                        last_online_at: '2023-04-06T14:07:46.997Z',
                        linkedin_handle: null,
                        name: 'Alex Peter',
                        tiktok_handle: null,
                        timezone: 'Europe/Paris',
                        twitter_handle: null,
                        username: null,
                        website: null,
                        youtube_handle: null,
                        access_level: 'manager',
                        event_api_id: 'evt-OjuuAyAyXTMSsUD',
                      },
                      {
                        api_id: 'usr-oQBZBVchrIYPfRG',
                        avatar_url:
                          'https://cdn.lu.ma/avatars-default/avatar_47.png',
                        bio_short: null,
                        instagram_handle: null,
                        last_online_at: '2023-04-03T11:02:45.516Z',
                        linkedin_handle: null,
                        name: 'Will Cove',
                        tiktok_handle: null,
                        timezone: 'Asia/Singapore',
                        twitter_handle: null,
                        username: null,
                        website: null,
                        youtube_handle: null,
                        access_level: 'manager',
                        event_api_id: 'evt-OjuuAyAyXTMSsUD',
                      },
                      {
                        api_id: 'usr-eGCxfVLDyz1vIX4',
                        avatar_url:
                          'https://cdn.lu.ma/avatars-default/avatar_45.png',
                        bio_short: null,
                        instagram_handle: null,
                        last_online_at: null,
                        linkedin_handle: null,
                        name: 'Angus',
                        tiktok_handle: null,
                        timezone: null,
                        twitter_handle: null,
                        username: null,
                        website: null,
                        youtube_handle: null,
                        access_level: 'manager',
                        event_api_id: 'evt-OjuuAyAyXTMSsUD',
                      },
                      {
                        api_id: 'usr-HVqJJTAgKCwPV5L',
                        avatar_url:
                          'https://cdn.lu.ma/avatars-default/avatar_22.png',
                        bio_short: null,
                        instagram_handle: null,
                        last_online_at: null,
                        linkedin_handle: null,
                        name: 'Dylan Kugler',
                        tiktok_handle: null,
                        timezone: 'America/New_York',
                        twitter_handle: null,
                        username: null,
                        website: null,
                        youtube_handle: null,
                        access_level: 'manager',
                        event_api_id: 'evt-OjuuAyAyXTMSsUD',
                      },
                    ],
                    guest_count: 0,
                    ticket_count: 0,
                    ticket_info: {
                      price: null,
                      is_free: true,
                      max_price: null,
                      is_sold_out: false,
                      spots_remaining: null,
                      is_near_capacity: false,
                      require_approval: false,
                      currency_info: null,
                    },
                    featured_guests: [],
                    role: {
                      type: 'guest',
                      proxy_key: 'g-RlcT9blXwGzl4MC',
                      approval_status: 'approved',
                      ticket_key: 'awZ7UH',
                    },
                  },
                ],
                has_more: false,
              };
            }
            let isTargetUrl = jsonPathArr.every((jpItem) => {
              try {
                const hasField =
                  jp.query(matchRequestUrlResult, jpItem).length > 0;
                return hasField;
              } catch {
                return false;
              }
            });
            if (
              matchRequestUrlResult &&
              activeTemplate?.attTemplateID === monadTemplateId
            ) {
              const monadEventIdx = matchRequestUrlResult?.entries.findIndex(
                (i) => {
                  return i.event.name.includes(monadEventName);
                }
              );
              if (monadEventIdx >= 0) {
                monadFields.name = {
                  key: 'name',
                  value:
                    matchRequestUrlResult?.entries[monadEventIdx].event.name,
                  jsonPath: `$.entries[${monadEventIdx}].event.name`,
                };
                const cookieObj = parseCookie(
                  requestsMap[matchRequestId].headers.Cookie
                );
                const userId =
                  cookieObj['luma.auth-session-key']?.split('.')[0];
                if (userId) {
                  const profileUrl = monadProfileUrlFn(userId);
                  const profileUrlResult = await extraRequestFn2({
                    ...requestsMap[matchRequestId],
                    header: requestsMap[matchRequestId].headers,
                    url: profileUrl,
                  });
                  monadFields['api_id'] = {
                    key: 'api_id',
                    value: profileUrlResult?.user.api_id,
                    jsonPath: `$.profileUrlResult.user.api_id`,
                  };
                  isTargetUrl = true;
                }
              } else {
                let errorMsgTitle = [
                  'Assets Verification',
                  'Humanity Verification',
                ].includes(activeTemplate.attestationType)
                  ? `${activeTemplate.attestationType} failed!`
                  : `${activeTemplate.attestationType} proof failed!`;
                const { configMap } = await chrome.storage.local.get([
                  'configMap',
                ]);
                const attestTipMap =
                  JSON.parse(JSON.parse(configMap).ATTESTATION_PROCESS_NOTE) ??
                  {};
                const errorCode = '00104';
                let msgObj = {
                  title: errorMsgTitle,
                  type: attestTipMap[errorCode].type,
                  desc: attestTipMap[errorCode].desc,
                  sourcePageTip: attestTipMap[errorCode].title,
                };
                const msg = {
                  name: 'end',
                  params: {
                    result: 'warn',
                    failReason: { ...msgObj },
                  },
                };
                handleEnd(msg);
              }
            }

            if (isTargetUrl) {
              sdkTargetRequestId = matchRequestId;
              storeRequestsMap(matchRequestId, { isTarget: 1 });
              break;
            } else {
              storeRequestsMap(matchRequestId, { isTarget: 2 });
            }
          }
        }
      }
    };
    const checkWebRequestIsReadyFn = async () => {
      const checkReadyStatusFn = async () => {
        let {
          dataSource,
          datasourceTemplate: { requests, responses },
          sdkVersion,
        } = activeTemplate;

        const interceptorRequests = requests.filter((r) => r.name !== 'first');
        const interceptorUrlArr = interceptorRequests.map((i) => i.url);

        const storageObj = requestsMap;
        const storageArr = Object.values(storageObj);

        if (
          interceptorUrlArr.length > 0 &&
          storageArr.length >= interceptorUrlArr.length
        ) {
          let captureNum = 0;
          let f = interceptorRequests.every(async (r) => {
            const activeRequestInfo = Object.values(requestsMap).find(
              (rInfo) => {
                const checkRes = checkIsRequiredUrl({
                  requestUrl: rInfo.url,
                  requiredUrl: r.url,
                  urlType: r.urlType,
                  queryParams: r.queryParams,
                });
                return checkRes;
                // return matchReg(r.url, rInfo.url);
              }
            );
            if (activeRequestInfo) {
              let targetRequestId = activeRequestInfo.requestId;
              const sRrequestObj = requestsMap[targetRequestId] || {};
              // console.log('sRrequestObj', storageObj, url, sRrequestObj, r);
              chatgptHasLogin = !!sRrequestObj?.headers?.Authorization;
              const headersFlag =
                !r.headers || (!!r.headers && !!sRrequestObj.headers);
              const bodyFlag = !r.body || (!!r.body && !!sRrequestObj.body);
              const cookieFlag =
                !r.cookies ||
                (!!r.cookies &&
                  !!sRrequestObj.headers &&
                  !!sRrequestObj.headers.Cookie);

              if (activeRequestInfo && headersFlag && bodyFlag && cookieFlag) {
                captureNum += 1;
              }
              return activeRequestInfo && headersFlag && bodyFlag && cookieFlag;
            } else {
              return false;
            }
          });
          f = captureNum === interceptorRequests.length;

          let fl = false;
          if (sdkVersion) {
            fl = f && !!sdkTargetRequestId;
          } else {
            fl = f;
          }

          if (fl) {
            if (dataSource === 'chatgpt') {
              fl =
                !!f &&
                chatgptHasLogin &&
                RequestsHasCompleted &&
                preAlgorithmStatus === '1';
            } else {
              if (!formatAlgorithmParams) {
                await formatAlgorithmParamsFn();
              }
            }
          }
          return fl;
        } else {
          return false;
        }
      };
      isReadyRequest = await checkReadyStatusFn();
      if (isReadyRequest) {
        console.log('all web requests are captured', requestsMap);
        chrome.tabs.sendMessage(
          dataSourcePageTabId,
          {
            type: 'pageDecode',
            name: 'webRequestIsReady',
            params: {
              isReady: isReadyRequest,
            },
          },
          function (response) {}
        );
      }
    };

    const formatAlgorithmParamsFn = async () => {
      let {
        dataSource,
        schemaType,
        datasourceTemplate: { host, requests, responses, calculations },
        uiTemplate,
        id,
        event,
        category,
        requestid,
        algorithmType,
        sdkVersion,
      } = activeTemplate;
      const form = {
        source: dataSource,
        type: category,
        label: null,
        exUserId: null,
        requestid,
        algorithmType: algorithmType || 'proxytls',
      };
      if (event) {
        form.event = event;
      }
      // "X Followers" required update baseValue
      // console.log('activeTemplate', activeTemplate, dataSource);
      if (activeTemplate.id === '15') {
        form.baseValue =
          activeTemplate.datasourceTemplate.responses[1].conditions.subconditions[1].value;
      }
      if (activeTemplate.requestid) {
        form.requestid = activeTemplate.requestid;
      }
      let aligorithmParams = {};
      if (sdkVersion) {
        aligorithmParams = await assembleAlgorithmParamsForSDK(
          {
            dataSource: activeTemplate.dataSource,
            algorithmType: activeTemplate.algorithmType,
            requestid: activeTemplate.requestid,
            sslCipherSuite: activeTemplate.sslCipherSuite,
          },
          activeTemplate.ext
        );
      } else {
        aligorithmParams = await assembleAlgorithmParams(form, password);
      }

      const formatRequests = [];
      for (const r of JSON.parse(JSON.stringify(requests))) {
        if (r.queryDetail) {
          continue;
        }

        let { headers, cookies, body, urlType } = r;
        // let formatUrlKey = url;
        let targetRequestId = '';
        if (sdkVersion && sdkTargetRequestId) {
          targetRequestId = sdkTargetRequestId;
        } else {
          targetRequestId = Object.values(requestsMap).find((rInfo) => {
            const checkRes = checkIsRequiredUrl({
              requestUrl: rInfo.url,
              requiredUrl: r.url,
              urlType: r.urlType,
              queryParams: r.queryParams,
            });
            return checkRes;
            // return matchReg(url, rInfo.url);
          })?.requestId;
          console.log(
            'formatAlgorithmParamsFn-after',
            requestsMap,
            targetRequestId
          );
        }

        const currRequestInfoObj = requestsMap[targetRequestId] || {};
        const {
          headers: curRequestHeader,
          body: curRequestBody,
          queryString,
          url,
        } = currRequestInfoObj;

        const cookiesObj = curRequestHeader
          ? parseCookie(curRequestHeader.Cookie)
          : {};
        let formateHeader = {},
          formateCookie = {},
          formateBody = {};

        if (sdkVersion) {
          Object.assign(r, {
            headers: { ...curRequestHeader },
            body: isObject(curRequestBody)
              ? { ...curRequestBody }
              : curRequestBody,
            url: queryString ? r.url + '?' + queryString : r.url,
          });
        } else {
          if (headers && headers.length > 0) {
            headers.forEach((hk) => {
              if (curRequestHeader) {
                const inDataSourceHeaderKey = Object.keys(
                  curRequestHeader
                ).find((h) => h.toLowerCase() === hk.toLowerCase());
                formateHeader[hk] = curRequestHeader[inDataSourceHeaderKey];
              }
            });
            Object.assign(r, {
              headers: formateHeader,
            });
          }

          if (cookies && cookies.length > 0) {
            cookies.forEach((ck) => {
              formateCookie[ck] = cookiesObj[ck];
            });
            Object.assign(r, {
              cookies: formateCookie,
            });
          }
          if (body && body.length > 0) {
            body.forEach((hk) => {
              formateBody[hk] = curRequestBody[hk];
            });
            Object.assign(r, {
              body: formateBody,
            });
          }
          if (queryString) {
            Object.assign(r, {
              url: r.url + '?' + queryString,
            });
          }
          if ('queryParams' in r) {
            delete r.queryParams;
          }
        }
        formatRequests.push({ ...r, url: r.name === 'first' ? r.url : url });
      }
      const activeInfo = formatRequests.find((i) => i.headers);
      const activeHeader = Object.assign({}, activeInfo?.headers);
      const authInfoName = dataSource + '-auth';
      await chrome.storage.local.set({
        [authInfoName]: JSON.stringify(activeHeader),
      });
      let formatResponse = JSON.parse(JSON.stringify(responses));
      if (dataSource === 'chatgpt') {
        const { chatGPTExpression } = activeTemplate;
        if (chatGPTExpression) {
          aligorithmParams.chatGPTExpression = chatGPTExpression;
        }
        const extraRequestSK = `https://chatgpt.com/backend-api/conversation-extra`;
        const extraSObj = await chrome.storage.local.get([extraRequestSK]);
        const extraRequestInfo = extraSObj[extraRequestSK]
          ? JSON.parse(extraSObj[extraRequestSK])
          : {};
        const {
          request: {
            url,
            method,
            headers: { host },
          },
          response: { messageIds },
        } = extraRequestInfo;

        formatRequests[1].url = url;
        formatRequests[1].method = method;
        formatRequests[1].headers.host = host;
        let originSubConditionItem =
          formatResponse[1].conditions.subconditions[0];
        formatResponse[1].conditions.subconditions = [];
        messageIds.forEach((mK) => {
          const fieldArr = originSubConditionItem.field.split('.');
          fieldArr[2] = mK;
          formatResponse[1].conditions.subconditions.push({
            ...originSubConditionItem,
            reveal_id: mK,
            field: fieldArr.join('.'),
          });
        });
      } else {
        if (activeTemplate.attTemplateID === monadTemplateId) {
          formatRequests[0].url = monadEventListUrlFn(formatRequests[0].url);
          const profileUrl = monadProfileUrlFn(monadFields['api_id'].value);
          formatRequests[1] = {
            ...formatRequests[0],
            url: profileUrl,
          };
          const formatResponseItemFn = (idx, { key, value, jsonPath }) => {
            formatResponse[idx] = {
              op: 'BOOLEAN_AND',
              type: 'CONDITION_EXPANSION',
              subconditions: [
                {
                  field: jsonPath,
                  op: '=',
                  reveal_id: key,
                  type: 'FIELD_RANGE',
                  value,
                },
              ],
            };
          };
          formatResponseItemFn(0, monadFields['name']);
          formatResponseItemFn(1, monadFields['api_id']);
        }
        for (const fr of formatRequests) {
          if (fr.headers) {
            fr.headers['Accept-Encoding'] = 'identity';
          }
        }
      }
      Object.assign(aligorithmParams, {
        reqType: 'web',
        host: host,
        schemaType,
        requests: formatRequests,
        responses: formatResponse,
        uiTemplate,
        templateId: id,
        calculations,
        PADOSERVERURL,
        padoExtensionVersion,
      });
      if (schemaType?.startsWith('OKX_TOKEN_HOLDING')) {
        aligorithmParams.requests[2].url =
          aligorithmParams.requests[2].url.replace('limit=5', 'limit=100');
      }

      formatAlgorithmParams = aligorithmParams;
      console.log(
        'formatAlgorithmParams',
        formatAlgorithmParams,
        form,
        activeTemplate
      );
    };

    const preAlgorithmFn = async () => {
      console.log('preAlgorithmFn');
      if (preAlgorithmFlag) {
        return;
      }

      let aligorithmParams = Object.assign(
        { isUserClick: 'false' },
        formatAlgorithmParams
      );
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestation',
        params: JSON.parse(JSON.stringify(aligorithmParams)),
      });
      preAlgorithmFlag = true;
    };
    listenerFn = async (message, sender, sendResponse) => {
      const { padoZKAttestationJSSDKBeginAttest } =
        await chrome.storage.local.get(['padoZKAttestationJSSDKBeginAttest']);
      if (padoZKAttestationJSSDKBeginAttest) {
        const { resType, resMethodName } = message;
        const errorFn = async () => {
          let resParams = {
            result: false,
            errorData: {
              title: 'Launch failed: unstable connection.',
              desc: 'Launch failed: unstable connection.',
              code: '00011',
            },
          };
          const { padoZKAttestationJSSDKDappTabId: dappTabId } =
            await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
          chrome.tabs.sendMessage(dappTabId, {
            type: 'padoZKAttestationJSSDK',
            name: 'getAttestationRes',
            params: resParams,
          });
          const attestationType = formatAlgorithmParams?.attestationType;
          const errorMsgTitle = [
            'Assets Verification',
            'Humanity Verification',
          ].includes(attestationType)
            ? `${attestationType} failed!`
            : `${attestationType} proof failed!`;

          msgObj = {
            type: 'error',
            title: errorMsgTitle,
            desc: 'The algorithm has not been initialized.Please try again later.',
            sourcePageTip: errorMsgTitle,
          };
          await chrome.storage.local.remove([
            'padoZKAttestationJSSDKBeginAttest',
            'padoZKAttestationJSSDKWalletAddress',
            'padoZKAttestationJSSDKAttestationPresetParams',
            'padoZKAttestationJSSDKXFollowerCount',
            'activeRequestAttestation',
          ]);
          if (dataSourcePageTabId) {
            await chrome.tabs.remove(dataSourcePageTabId);
          }
        };
        if (
          resType === 'algorithm' &&
          ['getAttestation', 'getAttestationResult'].includes(resMethodName)
        ) {
          if (message.res) {
            const { retcode, isUserClick } = JSON.parse(message.res);
            if (isUserClick === 'false') {
              console.log('preAlgorithm message', message);
              if (resMethodName === 'getAttestation') {
                if (retcode === '0') {
                  if (!preAlgorithmTimer) {
                    preAlgorithmTimer = setInterval(() => {
                      chrome.runtime.sendMessage({
                        type: 'algorithm',
                        method: 'getAttestationResult',
                        params: {},
                      });
                    }, 1000);
                    console.log('preAlgorithmTimer-set', preAlgorithmTimer);
                  }
                } else {
                  errorFn();
                }
              }
              if (resMethodName === 'getAttestationResult') {
                const { retcode, content, retdesc, details, isUserClick } =
                  JSON.parse(message.res);

                if (retcode === '1') {
                  if (details.online.statusDescription === 'RUNNING_PAUSE') {
                    console.log(
                      'preAlgorithmTimer-clear',
                      preAlgorithmTimer,
                      'preAlgorithmStatus',
                      retcode
                    );
                    clearInterval(preAlgorithmTimer);
                    preAlgorithmStatus = retcode;
                    checkWebRequestIsReadyFn();
                  }
                } else if (retcode === '2') {
                  console.log(
                    'preAlgorithmTimer-clear',
                    preAlgorithmTimer,
                    'preAlgorithmStatus',
                    retcode
                  );
                  clearInterval(preAlgorithmTimer);
                  preAlgorithmStatus = retcode;
                  errorFn();
                }
              }
            }
          }
        }
      }
    };
    chrome.runtime.onMessage.addListener(listenerFn);

    if (name === 'init') {
      const { configMap } = await chrome.storage.local.get(['configMap']);
      PRE_ATTEST_PROMOT = [
        'Processing data',
        'Please login or go to the right page',
      ];
      if (configMap && JSON.parse(configMap).PRE_ATTEST_PROMOT) {
        PRE_ATTEST_PROMOT = JSON.parse(JSON.parse(configMap).PRE_ATTEST_PROMOT);
      }
      operationType = request.operation;
      const currentWindowTabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      currExtentionId = currentWindowTabs[0]?.id;
      const interceptorUrlArr = requests
        .filter((r) => r.name !== 'first')
        .map((i) => i.url);
      // const aaa = await chrome.storage.local.get(interceptorUrlArr);
      await chrome.storage.local.remove(interceptorUrlArr);
      console.log('lastStorage-remove', interceptorUrlArr);
      // const bbb = await chrome.storage.local.get(interceptorUrlArr);
      // console.log('555-newattestations', capturedUrlKeyArr, aaa, bbb);

      chrome.webRequest.onBeforeSendHeaders.removeListener(
        onBeforeSendHeadersFn
      );
      chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
      chrome.webRequest.onCompleted.removeListener(onCompletedFn);
      onBeforeSendHeadersFn = async (details) => {
        if (details.tabId !== dataSourcePageTabId) {
          return;
        }
        let {
          dataSource,
          jumpTo,
          datasourceTemplate: { requests },
          sdkVersion,
        } = activeTemplate;
        const {
          url: currRequestUrl,
          requestHeaders,
          method,
          requestId,
        } = details;

        let formatUrlKey = currRequestUrl;
        let addQueryStr = '';
        let needQueryDetail = false;
        let formatHeader = requestHeaders.reduce((prev, curr) => {
          const { name, value } = curr;
          prev[name] = value;
          return prev;
        }, {});
        if (
          currRequestUrl === 'https://chatgpt.com/public-api/conversation_limit'
        ) {
          chatgptHasLogin = !!formatHeader.Authorization;
          if (dataSource === 'chatgpt') {
            const tipStr = chatgptHasLogin ? 'toMessage' : 'toLogin';
            console.log('setUIStep-', tipStr);
            chrome.tabs.sendMessage(
              dataSourcePageTabId,
              {
                type: 'pageDecode',
                name: 'setUIStep',
                params: {
                  step: tipStr,
                },
              },
              function (response) {}
            );
          }
        }
        const isTarget = requests.some((r) => {
          if (r.name === 'first') {
            return false;
          }
          if (r.queryParams && r.queryParams[0]) {
            const urlStrArr = currRequestUrl.split('?');
            const hostUrl = urlStrArr[0];
            let curUrlWithQuery = r.url === hostUrl;
            if (r.queryDetail) {
              needQueryDetail = r.queryDetail;
            }
            if (r.url === hostUrl) {
              curUrlWithQuery = isUrlWithQueryFn(currRequestUrl, r.queryParams);
            }
            if (curUrlWithQuery) {
              addQueryStr = curUrlWithQuery;
            }
            formatUrlKey = hostUrl;
          }
          const checkRes = checkIsRequiredUrl({
            requestUrl: currRequestUrl,
            requiredUrl: r.url,
            urlType: r.urlType,
            queryParams: r.queryParams,
          });
          return checkRes;
        });

        if (isTarget) {
          let newCapturedInfo = {
            headers: formatHeader,
            method,
            url: currRequestUrl,
            requestId,
          };
          if (addQueryStr) {
            newCapturedInfo.queryString = addQueryStr;
          }
          const newCurrRequestObj = storeRequestsMap(
            requestId,
            newCapturedInfo
          );
          const requireUrlArr = [
            'https://www.tiktok.com/passport/web/account/info/',
            'https://api.x.com/1.1/account/settings.json',
          ];
          const curRequireUrl = requireUrlArr.find((i) =>
            currRequestUrl.includes(i)
          );
          if (curRequireUrl) {
            await chrome.storage.local.set({
              [curRequireUrl]: JSON.stringify(newCurrRequestObj),
            });
          }
          if (
            needQueryDetail &&
            formatUrlKey.startsWith(
              'https://api.x.com/1.1/account/settings.json'
            ) &&
            !hasGetTwitterScreenName
          ) {
            const options = {
              headers: newCurrRequestObj.headers,
            };
            hasGetTwitterScreenName = true;
            const res = await fetch(
              formatUrlKey + '?' + newCurrRequestObj.queryString,
              options
            );
            const result = await res.json();
            //need to go profile page
            await chrome.tabs.update(dataSourcePageTabId, {
              url: jumpTo + result.screen_name,
            });
          }
          if (sdkVersion) {
            await checkSDKTargetRequestFn();
          }
          checkWebRequestIsReadyFn();
        }
      };
      onBeforeRequestFn = async (subDetails) => {
        if (subDetails.tabId !== dataSourcePageTabId) {
          return;
        }
        let {
          datasourceTemplate: { requests },
        } = activeTemplate;
        const { url: currRequestUrl, requestBody, requestId } = subDetails;

        removeRequestsMap(requestId);
        let formatUrlKey = currRequestUrl;
        const isTarget = requests.some((r) => {
          if (r.name === 'first') {
            return false;
          }
          const checkRes = checkIsRequiredUrl({
            requestUrl: currRequestUrl,
            requiredUrl: r.url,
            urlType: r.urlType,
            queryParams: r.queryParams,
          });
          return checkRes;
        });
        if (isTarget) {
          if (requestBody && requestBody.raw) {
            const rawBody = requestBody.raw[0];
            if (rawBody && rawBody.bytes) {
              const byteArray = new Uint8Array(rawBody.bytes);
              const bodyText = new TextDecoder().decode(byteArray);
              // console.log(
              //   `targeturl:${subDetails.url}, method:${subDetails.method} Request Body: ${bodyText}`
              // );

              storeRequestsMap(requestId, {
                body: JSON.parse(bodyText),
              });
            }
          }
          if (requestBody && requestBody.formData) {
            await storeRequestsMap(requestId, {
              body: requestBody.formData,
              isFormData: true,
            });
          }
        }
      };
      onCompletedFn = async (details) => {
        if (details.tabId !== dataSourcePageTabId) {
          return;
        }
        let { dataSource } = activeTemplate;

        if (dataSource === 'chatgpt') {
          console.log('onCompletedFn', dataSource, details);
          // chatgpt has only one requestUrl
          await extraRequestFn();
          console.log('setUIStep-toVerify');
          chrome.tabs.sendMessage(
            dataSourcePageTabId,
            {
              type: 'pageDecode',
              name: 'setUIStep',
              params: {
                step: 'toVerify',
              },
            },
            function (response) {}
          );
          await formatAlgorithmParamsFn();
          console.log('RequestsHasCompleted=', RequestsHasCompleted);
          preAlgorithmFn();
          checkWebRequestIsReadyFn();
        }
      };

      chrome.webRequest.onBeforeSendHeaders.addListener(
        onBeforeSendHeadersFn,
        { urls: ['<all_urls>'], types: ['xmlhttprequest'] },
        ['requestHeaders', 'extraHeaders']
      );
      chrome.webRequest.onBeforeRequest.addListener(
        onBeforeRequestFn,
        { urls: ['<all_urls>'], types: ['xmlhttprequest'] },
        ['requestBody']
      );

      chrome.webRequest.onCompleted.addListener(
        onCompletedFn,
        { urls: interceptorUrlArr, types: ['xmlhttprequest'] },
        ['responseHeaders', 'extraHeaders']
      );
      const tabCreatedByPado = await chrome.tabs.create({
        url: jumpTo,
      });
      dataSourcePageTabId = tabCreatedByPado.id;
      console.log('pageDecode dataSourcePageTabId:', dataSourcePageTabId);
      const injectFn = async () => {
        await chrome.scripting.executeScript({
          target: {
            tabId: dataSourcePageTabId,
          },
          files: ['pageDecode.bundle.js'],
        });
        await chrome.scripting.insertCSS({
          target: { tabId: dataSourcePageTabId },
          files: ['static/css/pageDecode.css'],
        });
      };

      checkWebRequestIsReadyFn();
      chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (
          tabId === dataSourcePageTabId &&
          (changeInfo.url || changeInfo.title)
        ) {
          await injectFn();
          checkWebRequestIsReadyFn();
        }
      });

      chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
        if (tabId === dataSourcePageTabId) {
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            // name: 'abortAttest',
            name: 'stop',
          });
          dataSourcePageTabId = null;
          handlerForSdk(processAlgorithmReq, 'cancel');
          chrome.webRequest.onBeforeSendHeaders.removeListener(
            onBeforeSendHeadersFn
          );
          chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
          chrome.webRequest.onCompleted.removeListener(onCompletedFn);
        }
      });
      await injectFn();
    }
    if (name === 'initCompleted') {
      console.log('content_scripts-bg-decode receive:initCompleted');
      sendResponse({
        name: 'append',
        params: {
          ...activeTemplate,
          PADOSERVERURL,
          padoExtensionVersion,
          PRE_ATTEST_PROMOT,
        },
        dataSourcePageTabId: dataSourcePageTabId,
        isReady: isReadyRequest,
        operation: operationType,
      });
      checkWebRequestIsReadyFn();
    }
    if (name === 'start') {
      await chrome.storage.local.set({
        beginAttest: '1',
      });
      let aligorithmParams = Object.assign(
        { isUserClick: 'true' },
        formatAlgorithmParams
      );
      await chrome.storage.local.set({
        activeRequestAttestation: JSON.stringify(aligorithmParams),
      });
      console.log('pageDecode-algorithmParams', aligorithmParams);

      var eventInfo = {
        eventType: 'ATTESTATION_START_PAGEDECODE',
        rawData: {
          source: aligorithmParams.source,
          schemaType: aligorithmParams.schemaType,
          sigFormat: aligorithmParams.sigFormat,
          attestationId: aligorithmParams.requestid,
          event: aligorithmParams.event,
          address: aligorithmParams?.user?.address,
          requestid: aligorithmParams.requestid,
          order: '3',
        },
      };
      const {
        padoZKAttestationJSSDKBeginAttest,
        padoZKAttestationJSSDKAttestationPresetParams,
      } = await chrome.storage.local.get([
        'padoZKAttestationJSSDKBeginAttest',
        'padoZKAttestationJSSDKAttestationPresetParams',
      ]);
      if (padoZKAttestationJSSDKBeginAttest) {
        const prestParamsObj = JSON.parse(
          padoZKAttestationJSSDKAttestationPresetParams
        );
        const formatOrigin =
          padoZKAttestationJSSDKBeginAttest === '1'
            ? prestParamsObj.attestOrigin
            : prestParamsObj.appId;
        eventInfo.rawData.attestOrigin = formatOrigin;
      }
      eventReport(eventInfo);
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestation',
        params: JSON.parse(JSON.stringify(aligorithmParams)),
      });
      if (!activeTemplate.sdkVersion) {
        const { constructorF } = DATASOURCEMAP[dataSource];
        if (constructorF) {
          const ex = new constructorF();
          // const storageRes = await chrome.storage.local.get([dataSource]);
          // const hadConnectedCurrDataSource = !!storageRes[dataSource];
          await storeDataSource(dataSource, ex, port, {
            withoutMsg: true,
            attestationRequestid: aligorithmParams.requestid,
          });
        }
      }
    }

    if (name === 'close' || name === 'cancel') {
      try {
        await chrome.tabs.update(currExtentionId, {
          active: true,
        });
      } catch (error) {
        console.log('cancel error:', error);
      }
      if (dataSourcePageTabId) {
        await chrome.tabs.remove(dataSourcePageTabId);
      }
      resetVarsFn();
      handlerForSdk(processAlgorithmReq, 'cancel');
    }
    if (name === 'end') {
      handleEnd(request);
    }
  } else {
    if (name === 'end') {
      handleEnd(request);
    }
  }
};

const handleEnd = (request) => {
  if (dataSourcePageTabId) {
    chrome.tabs.sendMessage(
      dataSourcePageTabId,
      request,
      function (response) {}
    );
    chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeadersFn);
    chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
    chrome.webRequest.onCompleted.removeListener(onCompletedFn);
    resetVarsFn();
  }
};
