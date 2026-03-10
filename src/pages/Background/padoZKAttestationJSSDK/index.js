import { v4 as uuidv4 } from 'uuid';
import { getSysConfig, getProofTypes } from '@/services/api/config';
import { queryTemplateById } from '@/services/api/devconsole';
import { updateAlgoUrl } from '@/config/envConstants';
import { pageDecodeMsgListener } from '../pageDecode/index.js';
import { getAlgoApi } from './utils';

import { STARTOFFLINETIMEOUT } from '@/config/constants';
import { getErrorMsgTitleFn } from '../utils/handleError.js';

let hasGetTwitterScreenName = false;
let sdkParams = {};
let sdkVersion = '';
let sdkName = '';
let isNetworkSdk = false;
const fetchAttestationTemplateList = async () => {
  try {
    const fetchRes = await getProofTypes({
      type: 'web_cred',
    });
    const { rc, result } = fetchRes;
    if (rc === 0) {
      await chrome.storage.local.set({
        webProofTypes: JSON.stringify(result),
      });
    } else {
      // alert('getProofTypes network error');
    }
  } catch {}
};
const fetchConfigure = async () => {
  try {
    const { rc, result } = await getSysConfig();
    if (rc === 0 && result) {
      const configMap = result.reduce((prev, curr) => {
        const { configName, configValue } = curr;
        prev[configName] = configValue;
        return prev;
      }, {});
      await chrome.storage.local.set({
        configMap: JSON.stringify(configMap),
      });
    }
  } catch {}
};

const storeDappTabId = async (id) => {
  await chrome.storage.local.set({
    padoZKAttestationJSSDKDappTabId: id,
  });
  return id;
};

export const padoZKAttestationJSSDKMsgListener = async (
  request,
  sender,
  sendResponse,
  fullscreenPort,
  processAlgorithmReq
) => {
  const { name, params } = request;

  if (name === 'initAttestation') {
    console.log(
      'debuge-zktls-initAttestation',
      params?.sdkVersion,
      'dapptabTabId:',
      sender.tab.id
    );
    await fetchAttestationTemplateList();
    await fetchConfigure();
    sdkVersion = params?.sdkVersion;
    sdkName = params?.sdkName;
    isNetworkSdk = sdkName && sdkName.indexOf('network') > -1;

    const { configMap } = await chrome.storage.local.get(['configMap']);
    let sdkSupportHosts = [];
    if (
      configMap &&
      JSON.parse(configMap) &&
      JSON.parse(configMap).SDK_SUPPORT_HOST
    ) {
      sdkSupportHosts = JSON.parse(JSON.parse(configMap).SDK_SUPPORT_HOST);
    }
    const dappTabId = await storeDappTabId(sender.tab.id);

    if (!sdkVersion) {
      if (params.hostname === 'localhost') {
      } else if (!sdkSupportHosts.includes(params.hostname)) {
        chrome.tabs.sendMessage(dappTabId, {
          type: 'padoZKAttestationJSSDK',
          name: 'initAttestationRes',
          params: {
            result: false,
            errorData: {
              title: '',
              desc: 'Your dapp is not authorized',
              code: '00009',
            },
          },
        });
        return;
      }
    }
    await chrome.storage.local.set({
      padoZKAttestationJSSDKBeginAttest: sdkVersion,
    });
    processAlgorithmReq({
      reqMethodName: 'start',
    });
    if (!isNetworkSdk) {
      updateAlgoUrl();
    }
    console.log('333pado-bg-receive-initAttestation', dappTabId);
  }
  if (name === 'startAttestation') {
    sdkVersion = params?.sdkVersion;
    sdkName = params?.sdkName;
    isNetworkSdk = sdkName && sdkName.indexOf('network') > -1;
    console.log(
      'debuge-zktls-startAttestation',
      sdkVersion,
      'time:',
      new Date().toLocaleString(),
      'params',
      JSON.stringify(params)
    );
    await chrome.storage.local.set({
      padoZKAttestationJSSDKBeginAttest: sdkVersion,
    });
    processAlgorithmReq({
      reqMethodName: 'start',
    });
    const {
      activeRequestAttestation: lastActiveRequestAttestationStr,
      padoZKAttestationJSSDKDappTabId: dappTabId,
    } = await chrome.storage.local.get([
      'activeRequestAttestation',
      'padoZKAttestationJSSDKDappTabId',
    ]);
    if (lastActiveRequestAttestationStr) {
      await chrome.storage.local.remove(['padoZKAttestationJSSDKBeginAttest']);
      const desc =
        'An attestation process is currently being generated. Please try again later.';
      let resParams = { result: false };
      if (!resParams.result) {
        resParams.errorData = {
          title: '',
          desc,
          code: '00003',
        };
      }
      chrome.tabs.sendMessage(dappTabId, {
        type: 'padoZKAttestationJSSDK',
        name: 'startAttestationRes',
        params: resParams,
      });
      return;
    }
    let activeWebProofTemplate = {};
    let activeAttestationParams = {};
    let chainName;
    const requestid = uuidv4();
    sdkParams = params;

    chainName = params.chainName;
    let walletAddress;

    let algorithmType;
    if (sdkVersion) {
      algorithmType = params.attRequest?.attMode?.algorithmType || 'proxytls';
    } else {
      algorithmType = params.algorithmType;
    }

    const algoApisParam = isNetworkSdk ? params.attRequest?.algoApis : undefined;

    if (isNetworkSdk && !params.attRequest?.algoApis?.[0]) {
      console.log('network-sdk params error');
      const resParams = {
        result: false,
        errorData: {
          title: 'Invalid Algorithm Parameters',
          desc: 'Invalid Algorithm Parameters',
          code: '00015',
        },
      };
      const { padoZKAttestationJSSDKDappTabId: dappTabId } =
        await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
      chrome.tabs.sendMessage(dappTabId, {
        type: 'padoZKAttestationJSSDK',
        name: 'getAttestationRes',
        params: resParams,
      });
      return;
    }
    // TODO

    const padoUrlKey = algorithmType === 'proxytls' ? 'zkPadoUrl' : 'padoUrl';
    let padoUrl = await getAlgoApi(padoUrlKey, algoApisParam);
    let proxyUrl = await getAlgoApi('proxyUrl', algoApisParam);

    chrome.runtime.sendMessage({
      type: 'algorithm',
      method: 'startOffline',
      params: { offlineTimeout: STARTOFFLINETIMEOUT, padoUrl, proxyUrl },
    });

    if (sdkVersion) {
      const {
        attRequest: { attTemplateID, userAddress },
        appSignature,
      } = params;
      walletAddress = userAddress;

      try {
        const { rc, result } = await queryTemplateById(attTemplateID);
        if (rc === 0 && result) {
          const {
            id,
            name,
            description,
            category,
            dataSource,
            dataPageTemplate,
            dataSourceTemplate,
            sslCipherSuite,
          } = result;

          const dataSourceTemplateObj = JSON.parse(dataSourceTemplate);
          let jumpTo = JSON.parse(dataPageTemplate).baseUrl;
          const additionParams = params.attRequest?.additionParams;
          let additionParamsObj = {};
          if (additionParams) {
            try {
              additionParamsObj = JSON.parse(additionParams);
              if (additionParamsObj.launch_page) {
                jumpTo = additionParamsObj.launch_page;
              }
            } catch (err) {
              console.log(
                'Invalid json string ,additionParamsObj.launch_page err',
                err
              );
            }
          }
          const host =
            dataSourceTemplateObj[0]?.requestTemplate?.host ||
            new URL(jumpTo).host;
          const newRequests = dataSourceTemplateObj.reduce(
            (prev, curr, idx) => {
              const {
                requestTemplate: {
                  targetUrlExpression,
                  targetUrlType,
                  method,
                  matchReqBodyKey,
                  ignoreResponse,
                },
              } = curr;
              const requestItem = {
                name: `sdk-${idx}`,
                url: targetUrlExpression,
                urlType: targetUrlType,
                method,
                matchReqBodyKey,
                ignoreResponse,
              };
              prev.push(requestItem);
              return prev;
            },
            []
          );

          const newResponses = dataSourceTemplateObj.reduce(
            (prev, curr, currIdx) => {
              const { responseTemplate } = curr;
              const subconditions = responseTemplate.reduce((prevS, currS) => {
                const {
                  resolver: { expression },
                  feilds: [{ key }],
                } = currS;
                let subconditionItem = {
                  field: expression,
                  // op: opMap[feilds[0].DataType] || 'REVEAL_STRING', // TODO ">"
                  // reveal_id: feilds[0].key, // required if type is REVEAL_STRING
                  // type: fieldType, // "FIELD_REVEAL" FIELD_VALUE  FIELD_RANGE
                };
                const subItemCondition = params.attRequest?.attConditions?.[
                  currIdx
                ]?.find((i) => {
                  if (i.op === 'MATCH_ONE') {
                    return i.key === key;
                  } else {
                    return i.field === key;
                  }
                });
                const handleREVEALFn = () => {
                  subconditionItem.op = 'REVEAL_STRING';
                  subconditionItem.type = 'FIELD_REVEAL';
                  subconditionItem.reveal_id = key;
                };
                const handleNoneComputeFn = () => {
                  subconditionItem.op = 'NONE';
                  subconditionItem.type = 'FIELD_VALUE';
                };
                const computeMode = params.attRequest?.computeMode;
                if (
                  computeMode === 'nonecomplete' ||
                  computeMode === 'nonepartial'
                ) {
                  handleNoneComputeFn();
                } else if (subItemCondition) {
                  const { op, value, field, type } = subItemCondition;
                  subconditionItem.op = op;
                  if (
                    [
                      '>',
                      '>=',
                      '=',
                      '!=',
                      '<',
                      '<=',
                      'STREQ',
                      'STRNEQ',
                    ].includes(op)
                  ) {
                    subconditionItem.type = 'FIELD_RANGE';
                    subconditionItem.value = value;
                  } else if (['SHA256'].includes(op)) {
                    subconditionItem.type = 'FIELD_VALUE';
                    subconditionItem.reveal_id = key;
                  } else if (['SHA256_EX', 'REVEAL_HEX_STRING'].includes(op)) {
                    subconditionItem.type = 'FIELD_REVEAL';
                    subconditionItem.op = 'REVEAL_HEX_STRING';
                    subconditionItem.reveal_id = key;
                    subconditionItem.field = {
                      type: 'FIELD_ARITHMETIC',
                      op: 'SHA256',
                      field: subconditionItem.field,
                    };
                  } else if (op === 'REVEAL_STRING') {
                    handleREVEALFn();
                  } else if (op === 'MATCH_ONE') {
                    subconditionItem = {
                      type,
                      op,
                      field,
                      subconditions: value,
                    };
                  }
                } else {
                  handleREVEALFn();
                }
                // TODO
                // field: '$.data.create_time';
                // op: '>';
                // type: 'FIELD_RANGE';
                // value: '978278400';
                prevS.push(subconditionItem);
                return prevS;
              }, []);
              let responseItem = {
                conditions: {
                  type: 'CONDITION_EXPANSION',
                  op: 'BOOLEAN_AND',
                  subconditions,
                },
              };
              prev.push(responseItem);
              return prev;
            },
            []
          );
          activeWebProofTemplate = {
            id,
            name,
            category,
            description,
            dataSource,
            jumpTo,
            datasourceTemplate: {
              host,
              requests: newRequests,
              responses: newResponses,
              calculations: undefined,
            },
            sslCipherSuite,
          };
          activeAttestationParams = {
            dataSourceId: dataSource,
            verificationContent: name,
            verificationValue: description,
            fetchType: 'Web',
            attestOrigin: params.attRequest?.appId || sdkVersion,
            account: '',
            attestationType: category,
            requestid,
            algorithmType:
              params.attRequest?.attMode?.algorithmType || 'proxytls', // TODO-zktls
            sdkVersion,
            ext: {
              appSignParameters: JSON.stringify(params.attRequest),
              appSignature,
              padoUrl,
              proxyUrl,
            },
            attTemplateID,
            extendedParams: params.attRequest?.extendedParams,
            additionParamsObj,
            allJsonResponseFlag: params.attRequest?.allJsonResponseFlag,
            clientType: sdkName,
          };
        } else {
          const resParams = {
            result: false,
            errorData: {
              title: 'Invalid Template ID.',
              desc: 'Invalid Template ID.',
              code: '00012',
            },
          };
          const { padoZKAttestationJSSDKDappTabId: dappTabId } =
            await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
          chrome.tabs.sendMessage(dappTabId, {
            type: 'padoZKAttestationJSSDK',
            name: 'getAttestationRes',
            params: resParams,
          });
        }
      } catch (e) {
        console.log('sdk template error:', e);
        const resParams = {
          result: false,
          errorData: {
            title: 'Invalid Template ID.',
            desc: 'Invalid Template ID.',
            code: '00012',
          },
        };
        const { padoZKAttestationJSSDKDappTabId: dappTabId } =
          await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
        chrome.tabs.sendMessage(dappTabId, {
          type: 'padoZKAttestationJSSDK',
          name: 'getAttestationRes',
          params: resParams,
        });
      }
    }

    await chrome.storage.local.set({
      padoZKAttestationJSSDKWalletAddress: walletAddress,
    });
    console.log('debuge-zktls-startAttestation2', walletAddress);
    chrome.storage.local.remove(['beginAttest', 'getAttestationResultRes']);
    await chrome.storage.local.set({
      padoZKAttestationJSSDKAttestationPresetParams: JSON.stringify(
        Object.assign({ chainName }, activeAttestationParams)
      ),
    }); // old version's sdk need chainName

    const currRequestTemplate = {
      ...activeAttestationParams,
      ...activeWebProofTemplate,
    };
    pageDecodeMsgListener(
      {
        type: 'pageDecode',
        name: 'init',
        params: {
          ...currRequestTemplate,
          requestid,
        },
        // extensionTabId: currentWindowTabs[0]?.id,
        operation: 'attest',
      },
      sender,
      sendResponse,
      fullscreenPort,
      hasGetTwitterScreenName,
      processAlgorithmReq
    );
  }

  if (name === 'getAttestationResult') {
    processAlgorithmReq({
      reqMethodName: 'getAttestationResult',
      params: {},
    });
  }

  if (name === 'getAttestationResultTimeout') {
    if (sdkParams.attestationTypeID === '101') {
      return;
    }
    const { configMap } =
      await chrome.storage.local.get([
        'configMap',
      ]);
    let attestTipMap = {};
    if (
      configMap &&
      JSON.parse(configMap) &&
      JSON.parse(configMap).ATTESTATION_PROCESS_NOTE
    ) {
      attestTipMap = JSON.parse(JSON.parse(configMap).ATTESTATION_PROCESS_NOTE);
    }

    const errorMsgTitle = await getErrorMsgTitleFn();

    const code = '00002';
    const msgObj = {
      type: attestTipMap[code].type,
      title: errorMsgTitle,
      desc: attestTipMap[code].desc,
      sourcePageTip: attestTipMap[code].title,
    };

    await chrome.storage.local.remove([
      'padoZKAttestationJSSDKBeginAttest',
      'padoZKAttestationJSSDKWalletAddress',
      'padoZKAttestationJSSDKAttestationPresetParams',
      'padoZKAttestationJSSDKXFollowerCount',
      'activeRequestAttestation',
    ]);
    pageDecodeMsgListener(
      {
        name: 'end',
        params: {
          result: 'warn',
          failReason: {
            ...msgObj,
          },
        },
      },
      sender,
      sendResponse,
      fullscreenPort,
      hasGetTwitterScreenName,
      processAlgorithmReq
    );
    processAlgorithmReq({
      reqMethodName: 'stop',
    });
    const { padoZKAttestationJSSDKDappTabId: dappTabId } =
      await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
    let resParams = { result: false };

    if (!resParams.result) {
      const { attestationLogInQuery } = await chrome.storage.local.get([
        'attestationLogInQuery',
      ]);
      resParams.errorData = {
        title: msgObj.title,
        desc: msgObj.desc,
        code,
        data: attestationLogInQuery || JSON.stringify({}),
      };
      resParams.reStartFlag = true;
    }
    chrome.tabs.sendMessage(dappTabId, {
      type: 'padoZKAttestationJSSDK',
      name: 'startAttestationRes',
      params: resParams,
    });
  }

};

chrome.tabs.onRemoved.addListener(async (tabId, _removeInfo) => {
  const {
    padoZKAttestationJSSDKBeginAttest,
    padoZKAttestationJSSDKDappTabId: dappTabId,
  } = await chrome.storage.local.get([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKDappTabId',
  ]);
  if (tabId === dappTabId && padoZKAttestationJSSDKBeginAttest) {
    pageDecodeMsgListener({
      type: 'pageDecode',
      name: 'cancel',
    });
  }
});
