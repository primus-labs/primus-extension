import { v4 as uuidv4 } from 'uuid';
import { getSysConfig, getProofTypes } from '@/services/api/config';
import { eventReport } from '@/services/api/usertracker';
import { queryTemplateById } from '@/services/api/devconsole';
import { attestByDelegationProxyFee } from '@/services/chains/eas.js';
import { ALLVERIFICATIONCONTENTTYPEEMAP } from '@/config/attestation';
import { updateAlgoUrl } from '@/config/envConstants';
import { pageDecodeMsgListener } from '../pageDecode.js';
import { attestBrevisFn } from './brevis';
import { schemaNameFn } from './utils';

import { CURENV, ONCHAINLIST, EASINFOMAP } from '@/config/chain';
import { PADOADDRESS } from '@/config/envConstants';
import { regenerateAttestation } from '@/services/api/cred';
import { strToHexSha256 } from '@/utils/utils';
import { getDataSourceAccount } from '../dataSourceUtils';
import { getPadoUrl, getProxyUrl, getZkPadoUrl } from '@/config/envConstants';
import { STARTOFFLINETIMEOUT } from '@/config/constants';

let hasGetTwitterScreenName = false;
let sdkParams = {};
let sdkVersion = '';
const fetchAttestationTemplateList = async () => {
  try {
    const fetchRes = await getProofTypes({
      type: 'web_cred',
    });
    const { rc, mc, result } = fetchRes;
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

const getAttestation = async (attetstationRequestId) => {
  const { credentials } = await chrome.storage.local.get(['credentials']);
  const curCredential = JSON.parse(credentials)[attetstationRequestId];
  return curCredential;
};

export const padoZKAttestationJSSDKMsgListener = async (
  request,
  sender,
  sendResponse,
  USERPASSWORD,
  fullscreenPort,
  processAlgorithmReq
) => {
  const { name, params } = request;

  if (name === 'initAttestation') {
    console.log('debuge-zktls-initAttestation', params?.sdkVersion);
    await fetchAttestationTemplateList();
    await fetchConfigure();
    sdkVersion = params?.sdkVersion;

    const { configMap } = await chrome.storage.local.get(['configMap']);
    const sdkSupportHosts =
      JSON.parse(JSON.parse(configMap).SDK_SUPPORT_HOST) ?? [];
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
      padoZKAttestationJSSDKBeginAttest: sdkVersion || '1',
    });
    processAlgorithmReq({
      reqMethodName: 'start',
    });
    updateAlgoUrl();

    console.log('333pado-bg-receive-initAttestation', dappTabId);
  }
  if (name === 'startAttestation') {
    sdkVersion = params?.sdkVersion;
    console.log('debuge-zktls-startAttestation', sdkVersion, params);
    await chrome.storage.local.set({
      padoZKAttestationJSSDKBeginAttest: sdkVersion || '1',
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

    let padoUrl;
    let algorithmType;
    if (sdkVersion) {
      algorithmType = params.attRequest?.attMode?.algorithmType || 'proxytls';
    } else {
      algorithmType = params.algorithmType;
    }
    if (algorithmType === 'proxytls') {
      padoUrl = await getZkPadoUrl();
    } else {
      padoUrl = await getPadoUrl();
    }
    const proxyUrl = await getProxyUrl();
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
        // debugger;
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
          const jumpTo = JSON.parse(dataPageTemplate).baseUrl;
          const host =
            dataSourceTemplateObj[0]?.requestTemplate?.host ||
            new URL(jumpTo).host;
          const newRequests = dataSourceTemplateObj.reduce(
            (prev, curr, idx) => {
              const {
                requestTemplate: { targetUrlExpression, targetUrlType, method },
              } = curr;
              const requestItem = {
                name: `sdk-${idx}`,
                url: targetUrlExpression,
                urlType: targetUrlType,
                method,
              };
              prev.push(requestItem);
              return prev;
            },
            []
          );
          const opMap = {
            string: 'REVEAL_STRING',
            number: 'REVEAL_STRING',
            boolean: 'REVEAL_STRING',
          };
          const newResponses = dataSourceTemplateObj.reduce((prev, curr) => {
            const { responseTemplate } = curr;
            const subconditions = responseTemplate.reduce((prevS, currS) => {
              const {
                resolver: { type, expression },
                valueType,
                fieldType,
                feilds,
              } = currS;
              const subconditionItem = {
                field: expression,
                op: opMap[feilds[0].DataType] || 'REVEAL_STRING',
                reveal_id: feilds[0].key,
                type: fieldType,
              };
              prevS.push(subconditionItem);
              return prevS;
            }, []);
            let responseItem = {
              conditions: {
                type: 'CONDITION_EXPANSION',
                op: '&',
                subconditions,
              },
            };
            prev.push(responseItem);
            return prev;
          }, []);
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
            },
            sslCipherSuite,
          };
          activeAttestationParams = {
            dataSourceId: dataSource,
            verificationContent: name,
            verificationValue: description,
            fetchType: 'Web',
            attestOrigin: params.attRequest?.appId, // TODO-zktls
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
    } else {
      walletAddress = params.walletAddress;
      sdkParams = params;
      const {
        attestationTypeID,
        dappSymbol,
        attestationParameters,
        algorithmType,
      } = params;
      chainName = params.chainName;

      const { webProofTypes } = await chrome.storage.local.get([
        'webProofTypes',
      ]);
      let webProofTypesList = [];
      if (webProofTypes) {
        webProofTypesList = JSON.parse(webProofTypes);
      } else {
        await fetchAttestationTemplateList();
        const { webProofTypes } = await chrome.storage.local.get([
          'webProofTypes',
        ]);
        webProofTypesList = JSON.parse(webProofTypes);
      }

      activeWebProofTemplate = webProofTypesList.find(
        (i) => i.id === attestationTypeID
      );
      let verificationContent = '';
      let verificationValue;

      let acc = '';

      if (attestationTypeID === '101') {
        verificationContent = '3';
        verificationValue = 'since 2024 July';
        acc = walletAddress;
        activeAttestationParams = {
          dataSourceId: 'web3 wallet',
          verificationContent,
          verificationValue,
          fetchType: 'Web',
          attestOrigin: dappSymbol,
          account: walletAddress,
          attestationType: 'On-chain Transactions',
          fetchType: 'API',
          requestid,
          signature: attestationParameters[0],
          timestamp: attestationParameters[1],
          chainName,
        };
        attestBrevisFn(activeAttestationParams, dappTabId);
      } else {
        verificationContent = Object.keys(ALLVERIFICATIONCONTENTTYPEEMAP).find(
          (k) => {
            const obj = ALLVERIFICATIONCONTENTTYPEEMAP[k];
            const { name } = activeWebProofTemplate;
            if (
              [
                'Assets Proof',
                'Token Holding',
                'X Followers',
                'Spot 30-Day Trade Vol',
              ].includes(name)
            ) {
              return name === obj.value;
            }
            return name === obj.label || name === obj.templateName;
          }
        );

        if (verificationContent === 'KYC Status') {
          verificationValue = 'Basic Verification';
        } else if (verificationContent === 'Account ownership') {
          verificationValue = 'Account owner';
        } else if (verificationContent === 'Assets Proof') {
          verificationValue = attestationParameters[0];
        } else if (verificationContent === 'Token Holding') {
          verificationValue = attestationParameters[0];
        } else if (verificationContent === 'X Followers') {
          verificationValue = attestationParameters[0];
          await chrome.storage.local.set({
            padoZKAttestationJSSDKXFollowerCount: verificationValue,
          });
        } else if (verificationContent === 'Spot 30-Day Trade Vol') {
          verificationValue = attestationParameters[0];
        } else if (attestationTypeID === '19') {
          verificationValue = 'Defined input';
        }

        activeAttestationParams = {
          dataSourceId: activeWebProofTemplate.dataSource,
          verificationContent,
          verificationValue,
          fetchType: 'Web',
          attestOrigin: dappSymbol,
          algorithmType,
        };

        acc = await getDataSourceAccount(activeAttestationParams.dataSourceId);
        activeAttestationParams.account = acc;

        if (
          ['Assets Proof', 'Token Holding', 'Spot 30-Day Trade Vol'].includes(
            verificationContent
          )
        ) {
          activeAttestationParams.attestationType = 'Assets Verification';
          const responses = activeWebProofTemplate.datasourceTemplate.responses;
          const lastResponse = responses[responses.length - 1];
          const lastResponseConditions = lastResponse.conditions;
          const lastResponseConditionsSubconditions =
            lastResponseConditions.subconditions;

          if (
            ['Assets Proof', 'Spot 30-Day Trade Vol'].includes(
              activeAttestationParams.verificationContent
            )
          ) {
            // change verification value
            lastResponseConditions.value =
              activeAttestationParams.verificationValue;
            // for okx
            if (lastResponseConditionsSubconditions) {
              const lastSubCondition =
                lastResponseConditionsSubconditions[
                  lastResponseConditionsSubconditions.length - 1
                ];
              lastSubCondition.value =
                activeAttestationParams.verificationValue;
            }
          } else if (
            activeAttestationParams.verificationContent === 'Token Holding'
          ) {
            if (lastResponseConditionsSubconditions) {
              const firstSubCondition = lastResponseConditionsSubconditions[0];
              firstSubCondition.value =
                activeAttestationParams.verificationValue;
              firstSubCondition.subconditions[0].value =
                activeAttestationParams.verificationValue;
            }
          }
        } else if (
          ['KYC Status', 'Account ownership'].includes(verificationContent)
        ) {
          activeAttestationParams.attestationType = 'Humanity Verification';
        } else if (['X Followers'].includes(verificationContent)) {
          activeAttestationParams.attestationType = 'Social Connections';
          activeWebProofTemplate.datasourceTemplate.responses[1].conditions.subconditions[1].value =
            attestationParameters[0];
        } else if (attestationTypeID === '19') {
          activeAttestationParams.attestationType = 'Humanity Verification';
          if (attestationParameters && attestationParameters[0]) {
            activeAttestationParams.chatGPTExpression = {
              expression: attestationParameters[1] || 'EQUALS', //CONTAINS OR EQUALS
              value: attestationParameters[0],
            };
          }
        }
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
      USERPASSWORD,
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
    const { configMap, padoZKAttestationJSSDKAttestationPresetParams } =
      await chrome.storage.local.get([
        'configMap',
        'padoZKAttestationJSSDKAttestationPresetParams',
      ]);
    const attestTipMap =
      JSON.parse(JSON.parse(configMap).ATTESTATION_PROCESS_NOTE) ?? {};

    const activeAttestationParams = JSON.parse(
      padoZKAttestationJSSDKAttestationPresetParams
    );
    const errorMsgTitle = [
      'Assets Verification',
      'Humanity Verification',
    ].includes(activeAttestationParams.attestationType)
      ? `${activeAttestationParams.attestationType} failed!`
      : `${activeAttestationParams.attestationType} proof failed!`;
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
      USERPASSWORD,
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
      resParams.errorData = {
        title: msgObj.title,
        desc: msgObj.desc,
        code,
      };
      resParams.reStartFlag = true;
    }
    chrome.tabs.sendMessage(dappTabId, {
      type: 'padoZKAttestationJSSDK',
      name: 'startAttestationRes',
      params: resParams,
    });
  }

  // if (name === 'stopOffscreen') {
  //   const { activeRequestAttestation } = await chrome.storage.local.get([
  //     'activeRequestAttestation',
  //   ]);
  //   if (activeRequestAttestation) {
  //     const activeRequestAttestationObj = JSON.parse(activeRequestAttestation);
  //     if (
  //       !activeRequestAttestationObj.attestOrigin
  //     ) {
  //       processAlgorithmReq({
  //         reqMethodName: 'stop',
  //       });
  //       await chrome.storage.local.remove([
  //         'padoZKAttestationJSSDKBeginAttest',
  //         'padoZKAttestationJSSDKAttestationPresetParams',
  //         'padoZKAttestationJSSDKXFollowerCount',
  //         'activeRequestAttestation',
  //       ]);
  //     }
  //   }
  // }

  if (name === 'sendToChainRes') {
    const { attestationRequestId, chainName, onChainRes: upChainRes } = params;
    const curCredential = await getAttestation(attestationRequestId);
    console.log(
      'sdk-bg-sdk-receive-sendToChainRes',
      curCredential,
      attestationRequestId,
      chainName
    );
    const testNetNameMap = {
      'Scroll Sepolia': 'Scroll Sepolia',
      Sepolia: 'Sepolia',
      BSCTestnet: 'BSC',
      opBNBTestnet: 'opBNB',
    };
    const isTestNet = Object.keys(testNetNameMap).includes(chainName);
    const upperChainEventType =
      CURENV === 'production' && isTestNet
        ? 'UPPER_CHAIN_TESTNET'
        : 'UPPER_CHAIN';
    if (curCredential) {
      const { address, schemaType, source } = curCredential;
      try {
        const rawDataType = `${schemaType}-${schemaNameFn(chainName)}`;
        let upchainNetwork = isTestNet ? testNetNameMap[chainName] : chainName;
        if (CURENV === 'production' && chainName === 'Linea Goerli') {
          upchainNetwork = 'Linea Mainnet';
        }
        var eventInfo = {
          eventType: upperChainEventType,
          rawData: {
            network: upchainNetwork,
            type: rawDataType,
            source: source,
            // attestationId: uniqueId,
            address,
          },
        };
        eventInfo.rawData.attestOrigin = curCredential.attestOrigin;

        if (upChainRes) {
          if (upChainRes.error) {
            // if (upChainRes.error === 1) {
            //   sendToChainResult = false;
            //   sendToChainMsg = 'Your balance is insufficient';
            // } else if (upChainRes.error === 2) {
            //   sendToChainResult = false;
            //   sendToChainMsg = 'Please try again later.';
            // }
            eventInfo.rawData = Object.assign(eventInfo.rawData, {
              status: 'FAILED',
              reason: upChainRes.message,
            });
            eventReport(eventInfo);
            return;
          }
          const newProvided = curCredential.provided ?? [];
          if (
            (CURENV === 'production' && !isTestNet) ||
            (CURENV === 'development' && !!isTestNet)
          ) {
            const curEnvChainList = isTestNet
              ? Object.values(EASINFOMAP['development'])
              : ONCHAINLIST;
            const currentChainObj = curEnvChainList.find((i) => {
              if (CURENV === 'production' && chainName === 'Linea Mainnet') {
                return 'Linea Goerli' === i.title;
              } else {
                return upchainNetwork === i.title;
              }
            });
            currentChainObj.attestationUID = upChainRes;
            currentChainObj.submitAddress = address;
            newProvided.push(currentChainObj);
            const { credentials } = await chrome.storage.local.get([
              'credentials',
            ]);
            const cObj = { ...JSON.parse(credentials) };

            cObj[attestationRequestId] = Object.assign(curCredential, {
              provided: newProvided,
            });
            await chrome.storage.local.set({
              credentials: JSON.stringify(cObj),
            });
          }

          if (curCredential.reqType === 'web') {
            try {
              if (newProvided.length && newProvided.length > 0) {
                const flag = newProvided.some(
                  (i) => i.chainName.indexOf('Linea') > -1
                );
                if (flag) {
                  await chrome.storage.local.set({
                    mysteryBoxRewards: '1',
                  });
                }
              }
            } catch {}
          }
          // sendToChainResult = true;
          // sendToChainMsg = 'Your attestation is recorded on-chain!';
          eventInfo.rawData = Object.assign(eventInfo.rawData, {
            status: 'SUCCESS',
            reason: '',
            txHash: upChainRes,
          });
          eventReport(eventInfo);
        } else {
          // sendToChainResult = true;
          // sendToChainMsg = 'Please try again later.';
          eventInfo.rawData = Object.assign(eventInfo.rawData, {
            status: 'FAILED',
            reason: 'attestByDelegationProxyFee error',
          });
          eventReport(eventInfo);
        }
      } catch (e) {
        console.log('sdk-bg-sdk-receive-sendToChainRes-catch', e);
      }
    }
  }
};

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const {
    padoZKAttestationJSSDKBeginAttest,
    padoZKAttestationJSSDKDappTabId: dappTabId,
  } = await chrome.storage.local.get([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKDappTabId',
  ]);
  if (tabId === dappTabId && padoZKAttestationJSSDKBeginAttest) {
    pageDecodeMsgListener(
      {
        type: 'pageDecode',
        name: 'cancel',
      },
      sender,
      sendResponse,
      USERPASSWORD,
      fullscreenPort,
      hasGetTwitterScreenName,
      processAlgorithmReq
    );
  }
});
