import React, {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  setAttestLoading,
  setCredentialsAsync,
  setActiveAttestation,
} from '@/store/actions';
import useMsgs from '@/hooks/useMsgs';
import useEventDetail from '@/hooks/useEventDetail';
import useAlgorithm from '@/hooks/useAlgorithm';
import useTimeout from '@/hooks/useTimeout';
import useInterval from '@/hooks/useInterval';
import useAllSources from '@/hooks/useAllSources';
import { eventReport } from '@/services/api/usertracker';
import {
  postMsg,
  strToHex,
  base64ToHex,
  strToHexSha256,
  getAccount,
} from '@/utils/utils';

import {
  BASEVENTNAME,
  LINEAEVENTNAME,
  SCROLLEVENTNAME,
} from '@/config/events';
import { DATASOURCEMAP } from '@/config/dataSource';
import {
  ATTESTATIONPOLLINGTIMEOUT,
  ATTESTATIONPOLLINGTIME,
} from '@/config/constants';
import { ATTESTATIONTYPEMAP, ALLVERIFICATIONCONTENTTYPEEMAP } from '@/config/attestation';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { DataSourceMapType } from '@/types/dataSource';
import type { ActiveRequestType } from '@/types/config';
const CLIENTTYPE = '@primuslabs/extension';

function inferSchemaTypeFromActiveAttestation(
  activeAttestation: any,
  webProofTypes: any[]
): string {
  if (!activeAttestation?.verificationContent || !webProofTypes?.length) {
    return '';
  }
  const contentObj =
    ALLVERIFICATIONCONTENTTYPEEMAP[activeAttestation.verificationContent];
  if (!contentObj) return '';
  const found = webProofTypes.find(
    (i: any) =>
      i.dataSource === activeAttestation.dataSourceId &&
      (i.name === contentObj?.label ||
        i.name === contentObj?.templateName ||
        i.name === contentObj?.value)
  );
  return found?.schemaType ?? '';
}

const useALGAttest = function useAttest() {
  const { pathname } = useLocation();
  const { sourceMap2 } = useAllSources();
  const { msgs, addMsg } = useMsgs();
  const dispatch: Dispatch<any> = useDispatch();
  const [searchParams] = useSearchParams();
  const fromEvents = searchParams.get('id');
  const [credRequestId, setCredRequestId] = useState<string>();
  const [timeoutSwitch, setTimeoutSwitch] = useState<boolean>(false);
  const [intervalSwitch, setIntervalSwitch] = useState<boolean>(false);
  // const [hadSetPwd, setHadSetPwd] = useState<boolean>(false);
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const activeAttestation = useSelector(
    (state: UserState) => state.activeAttestation
  );
  const attestLoading = useSelector((state: UserState) => state.attestLoading);
  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );
  const sysConfig = useSelector((state: UserState) => state.sysConfig);

  const attestTipMap = useMemo(() => {
    const configStr = sysConfig.ATTESTATION_PROCESS_NOTE;
    const configObj = configStr ? JSON.parse(configStr) : {};
    return configObj;
  }, [sysConfig]);
  // const msgs = useSelector((state: UserState) => state.msgs);
  const [BASEventDetail] = useEventDetail(BASEVENTNAME);
  const initCredList = useCallback(async () => {
    await dispatch(setCredentialsAsync());
  }, [dispatch]);
  const clearFetchAttestationTimer = useCallback(() => {
    setIntervalSwitch(false);
    setTimeoutSwitch(false);
  }, []);

  const activeAttestationRef = useRef(activeAttestation);
  const webProofTypesRef = useRef(webProofTypes);
  const fromEventsRef = useRef(fromEvents);
  const listenerContextRef = useRef<{
    dispatch: Dispatch<any>;
    addMsg: (msg: any) => void;
    attestLoading: number;
    clearFetchAttestationTimer: () => void;
  }>({ dispatch, addMsg, attestLoading, clearFetchAttestationTimer });

  useEffect(() => {
    activeAttestationRef.current = activeAttestation;
    webProofTypesRef.current = webProofTypes;
    fromEventsRef.current = fromEvents;
    listenerContextRef.current = {
      dispatch,
      addMsg,
      attestLoading,
      clearFetchAttestationTimer,
    };
  }, [
    activeAttestation,
    webProofTypes,
    fromEvents,
    dispatch,
    addMsg,
    attestLoading,
    clearFetchAttestationTimer,
  ]);

  const storeEventInfoFn = useCallback(async (fullAttestation) => {
    const {
      event: eventId,
      address: currentAddress,
      source,
      templateId,
      requestid,
    } = fullAttestation;
    const res = await chrome.storage.local.get([eventId]);
    if (res[eventId]) {
      const lastEventObj = JSON.parse(res[eventId]);
      const lastInfo = lastEventObj[currentAddress];
      if (lastInfo) {
        const { taskMap } = lastInfo;
        const attestationTypeId = Object.keys(taskMap.attestation)[0];
        if ((attestationTypeId as string) in ATTESTATIONTYPEMAP) {
          taskMap.attestation[attestationTypeId as string] = requestid;
        } else {
          taskMap.attestation[templateId] = requestid;
        }
        await chrome.storage.local.set({
          [eventId]: JSON.stringify(lastEventObj),
        });
      }
    }
  }, []);
  const getAttestationCallback = useCallback(
    async (res: any) => {
      const { retcode, retdesc, isUserClick } = JSON.parse(res);
      if (isUserClick === 'true') {
        if (retcode === '0') {
          setIntervalSwitch(true);
          console.log(`front page start Start timing.`);
          // Restart timing
          setTimeoutSwitch(false);
          setTimeout(() => {
            setTimeoutSwitch(true);
          }, 50);
        } else {
          const errorMsgTitle = [
            'Assets Verification',
            'Humanity Verification',
          ].includes(activeAttestation.attestationType)
            ? `${activeAttestation.attestationType} failed!`
            : `${activeAttestation.attestationType} proof failed!`;

          //  else if (retcode === '2')
          const msgObj = {
            type: 'error',
            title: errorMsgTitle,
            desc:
              retcode === '2'
                ? 'Algorithm startup exception.'
                : 'Operation too frequent. Please try again later.',
            sourcePageTip:
              retcode === '2'
                ? 'Wrong parameters. '
                : 'Too many requests. Please try again later.',
          };
          if (activeAttestation.dataSourceId === 'coinbase') {
          } else {
            addMsg(msgObj);
          }
          dispatch(setAttestLoading(3));
          dispatch(
            setActiveAttestation({
              loading: 3,
              msgObj: { ...msgObj, btnTxt: 'Try Again' },
            })
          );

          // algorithm is not initialized

          const { activeRequestAttestation } = await chrome.storage.local.get([
            'activeRequestAttestation',
          ]);
          const parsedActiveRequestAttestation = activeRequestAttestation
            ? JSON.parse(activeRequestAttestation)
            : {};
          if (parsedActiveRequestAttestation.reqType === 'web') {
            await chrome.runtime.sendMessage({
              type: 'pageDecode',
              name: 'end',
              params: {
                result: 'warn',
                failReason: {
                  ...msgObj,
                },
              },
            });
          }
          const errorCode = retcode === '2' ? '00001' : '00000';
          const {source,schemaType,address,sigFormat} = parsedActiveRequestAttestation
          var eventInfo: any = {
            eventType: 'ATTESTATION_GENERATE',
            rawData: {
                "source": source,
                clientType: CLIENTTYPE,
                "appId": "",
                "templateId": schemaType,
                "address": address,
                "status": "FAILED",
                "detail": {
                    "code": errorCode,
                    "desc": ""
                },
                "ext": {
                  "sigFormat": sigFormat,
                  "event": fromEvents,
                }
              
            }
          };
          eventReport(eventInfo);
        }
      }
    },
    [dispatch, activeAttestation.dataSourceId, fromEvents]
  );
  const getAttestationResultCallback = useCallback(
    async (res: any) => {
      await chrome.storage.local.set({ getAttestationResultRes: res });
      const { retcode, content, retdesc, details, isUserClick } =
        JSON.parse(res);
      if (isUserClick === 'true') {
        const { activeRequestAttestation } = await chrome.storage.local.get([
          'activeRequestAttestation',
        ]);

        const parsedActiveRequestAttestation = activeRequestAttestation
          ? JSON.parse(activeRequestAttestation)
          : {};
        const errorMsgTitle = [
          'Assets Verification',
          'Humanity Verification',
        ].includes(activeAttestation.attestationType)
          ? `${activeAttestation.attestationType} failed!`
          : `${activeAttestation.attestationType} proof failed!`;

        const {source,schemaType,address,sigFormat} = parsedActiveRequestAttestation
        var eventInfo: any = {
          eventType: 'ATTESTATION_GENERATE',
          rawData: {
              "source": source,
              "clientType": CLIENTTYPE,
              "appId": "",
              "templateId": schemaType,
              "address": address,
              "ext": {
                "sigFormat": sigFormat,
                "event": fromEvents,
              }
          }
        };

        if (retcode === '0') {
          clearFetchAttestationTimer();
          await chrome.storage.local.remove(['activeRequestAttestation']);

          if (
            content.balanceGreaterThanBaseValue === 'true' &&
            content.signature
          ) {
            const activeRequestId = parsedActiveRequestAttestation.requestid;
            if (activeRequestId !== content?.requestid) {
              return;
            }
            const acc =
              sourceMap2[activeAttestation.dataSourceId]
                ?.attestationRequestid === activeRequestId
                ? getAccount(
                    DATASOURCEMAP[activeAttestation.dataSourceId],
                    sourceMap2[activeAttestation.dataSourceId]
                  )
                : '';
            let fullAttestation = {
              ...content,
              ...parsedActiveRequestAttestation,
              ...activeAttestation,
              account: acc,
            };
            if (fullAttestation.verificationContent === 'X Followers') {
              const xFollowerCount = sessionStorage.getItem('xFollowerCount');
              fullAttestation.xFollowerCount = xFollowerCount;
              sessionStorage.removeItem('xFollowerCount');
            }

            const credentialsObj = { ...credentialsFromStore };
            credentialsObj[activeRequestId] = fullAttestation;
            await chrome.storage.local.set({
              credentials: JSON.stringify(credentialsObj),
            });

            await initCredList();
            if (fullAttestation.reqType === 'web') {
              if (fullAttestation.event) {
                await storeEventInfoFn(fullAttestation);
              }

              await chrome.runtime.sendMessage({
                type: 'pageDecode',
                name: 'end',
                params: {
                  result: 'success',
                },
              });
            }
            setCredRequestId(activeRequestId);
            // suc
            const sucMsgTitle = [
              'Assets Verification',
              'Humanity Verification',
            ].includes(activeAttestation.attestationType)
              ? `${activeAttestation.attestationType} is created!`
              : `${activeAttestation.attestationType} proof is created!`;
            const msgObj = {
              type: 'suc',
              title: sucMsgTitle,
              desc: '',
              link: '/Attestation',
            };
            if (pathname !== '/Attestation') {
              msgObj.desc = 'See details in the Attestation page.';
            }
            if (activeAttestation.dataSourceId !== 'coinbase') {
              addMsg(msgObj);
            }
            dispatch(setAttestLoading(2));
            dispatch(setActiveAttestation({ loading: 2, msgObj }));

            const uniqueId = strToHexSha256(fullAttestation.signature);
            Object.assign(eventInfo.rawData, {
              status: 'SUCCESS',
              address: fullAttestation?.address, 
              ext: {
                ...eventInfo.rawData.ext,
                attestationId: uniqueId
              }
            });
            eventReport(eventInfo);
          } else if (
            !content.signature ||
            content.balanceGreaterThanBaseValue === 'false'
          ) {
            // attestTipMap
            let title = errorMsgTitle;
            let msgObj = {
              type: 'error',
              title,
              desc: '',
              sourcePageTip: '',
            };
            let btnTxt = '';

            let errorCode;
            const totalTipMapForSdk = {
              '-1200010': 'Invalid message.', // chatgpt input error
            }
            const { extraData,signature,encodedData } = content;
            if (
              extraData &&
              JSON.parse(extraData) &&
              Object.keys(totalTipMapForSdk).includes(
                JSON.parse(extraData).errorCode + ''
              )
            ) {
              errorCode = JSON.parse(extraData).errorCode + '';
              const showTip = totalTipMapForSdk[errorCode];
              Object.assign(msgObj, {
                type: '',
                desc: showTip,
                sourcePageTip: showTip,
              });
            } else if (!signature && encodedData) {
              errorCode = '00103'; // linea event had bund
              const {type,desc,title} = attestTipMap[errorCode];
              Object.assign(msgObj, {
                type,
                desc,
                sourcePageTip: title,
              });
            } else if (
              activeAttestation?.verificationContent === 'Assets Proof' &&
              activeAttestation?.dataSourceId === 'binance'
            ) {
              let type, desc, title;
              errorCode = '00102';
              type = attestTipMap[errorCode].type;
              desc = attestTipMap[errorCode].desc;
              title = attestTipMap[errorCode].title;
              Object.assign(msgObj, {
                type,
                desc,
                sourcePageTip: title,
              });
            } else {
              errorCode = '00104';
              Object.assign(msgObj, {
                type: attestTipMap[errorCode].type,
                desc: attestTipMap[errorCode].desc,
                sourcePageTip: attestTipMap[errorCode].title,
              });
            }

            await chrome.runtime.sendMessage({
              type: 'pageDecode',
              name: 'end',
              params: {
                result: 'warn',
                failReason: { ...msgObj },
              },
            });
            if (activeAttestation.dataSourceId !== 'coinbase') {
              addMsg(msgObj);
            }
            dispatch(setAttestLoading(3));
            dispatch(
              setActiveAttestation({
                loading: 3,
                msgObj: { ...msgObj, btnTxt },
              })
            );

            Object.assign(eventInfo.rawData, {
              status: 'FAILED',
              address: parsedActiveRequestAttestation?.address, 
              detail: {
                code: errorCode,
                desc: ""
              },
            });
            eventReport(eventInfo);
          }
        } else if (retcode === '2') {
          clearFetchAttestationTimer();
          await chrome.storage.local.remove(['activeRequestAttestation']);

          const {
            errlog: { code, desc },
          } = details;
          const msg = {
            fullScreenType: 'algorithm',
            reqMethodName: 'stop',
            params: {},
          };
          postMsg(padoServicePort, msg);
          var eventInfoMsg = 'Something went wrong';
          let title = errorMsgTitle;
          let msgObj = {
            type: 'warn',
            title,
            desc: '',
            sourcePageTip: '',
            code: '',
          };
          let codeTipObj = attestTipMap[code];
          if (codeTipObj) {
          } else {
            codeTipObj = attestTipMap['99999'];
          }
          Object.assign(msgObj, {
            type: codeTipObj.type,
            desc: codeTipObj.desc,
            sourcePageTip: codeTipObj.title,
            code: `Error ${code}`,
          });

          if (activeAttestation.dataSourceId !== 'coinbase') {
            addMsg(msgObj);
          }
          dispatch(setAttestLoading(3));
          dispatch(
            setActiveAttestation({
              loading: 3,
              msgObj: { ...msgObj, btnTxt: 'Try Again' },
            })
          );
          if (
            retdesc.indexOf('connect to proxy error') > -1 ||
            retdesc.indexOf('WebSocket On Error') > -1 ||
            retdesc.indexOf('connection error') > -1
          ) {
            eventInfoMsg = 'Unstable internet connection';
          }

          Object.assign(eventInfo.rawData, {
            status: 'FAILED',
            address: parsedActiveRequestAttestation?.address, 
            detail: {
              code,
              desc
            },
            ext: {
              ...eventInfo.rawData.ext,
              reason: eventInfoMsg,
            }
          });
          eventReport(eventInfo);
          if (parsedActiveRequestAttestation.reqType === 'web') {
            await chrome.runtime.sendMessage({
              type: 'pageDecode',
              name: 'end',
              params: {
                result: 'warn',
                failReason: { ...msgObj },
              },
            });
          }
        }
      }
    },
    [
      clearFetchAttestationTimer,
      padoServicePort,
      initCredList,
      credentialsFromStore,
      activeAttestation,
      sourceMap2,
      pathname,
      attestTipMap,
    ]
  );
  useAlgorithm(
    getAttestationCallback,
    getAttestationResultCallback,
    fromEvents === LINEAEVENTNAME
  );
  const timeoutFn = useCallback(async () => {
    console.log('120s timeout');
    clearFetchAttestationTimer();
    const { activeRequestAttestation } = await chrome.storage.local.get([
      'activeRequestAttestation',
    ]);
    if (!activeRequestAttestation) {
      return;
    }
    const parsedActiveRequestAttestation = activeRequestAttestation
      ? JSON.parse(activeRequestAttestation)
      : {};
    const errorMsgTitle = [
      'Assets Verification',
      'Humanity Verification',
    ].includes(activeAttestation.attestationType)
      ? `${activeAttestation.attestationType} failed!`
      : `${activeAttestation.attestationType} proof failed!`;
    const msgObj = {
      type: attestTipMap['00002'].type,
      title: errorMsgTitle,
      desc: attestTipMap['00002'].desc,
      sourcePageTip: attestTipMap['00002'].title,
    };
    if (parsedActiveRequestAttestation.reqType === 'web') {
      await chrome.runtime.sendMessage({
        type: 'pageDecode',
        name: 'end',
        params: {
          result: 'warn',
          failReason: { ...msgObj },
        },
      });
    }

    if (activeAttestation.dataSourceId === 'coinbase') {
    } else {
      addMsg(msgObj);
    }
    dispatch(setAttestLoading(3));
    dispatch(
      setActiveAttestation({
        loading: 3,
        msgObj: { ...msgObj, btnTxt: 'Try Again' },
      })
    );
    const { beginAttest, getAttestationResultRes } =
      await chrome.storage.local.get([
        'beginAttest',
        'getAttestationResultRes',
      ]);


    if (beginAttest === '1') {
      const {source,schemaType,address,sigFormat} = parsedActiveRequestAttestation
      var eventInfo: any = {
        eventType: 'ATTESTATION_GENERATE',
        rawData: {
            source: source,
            clientType: CLIENTTYPE,
            appId: "",
            templateId: schemaType,
            address: address,
            ext: {
              sigFormat: sigFormat,
              event: fromEvents,
              getAttestationResultRes: getAttestationResultRes
            },
            detail: {
              code: '00002',
              desc: '',
            }
        }
      };
      eventReport(eventInfo);
    }

    const msg = {
      fullScreenType: 'algorithm',
      reqMethodName: 'stop',
      params: {},
    };
    console.log('after timeout port', padoServicePort);
    postMsg(padoServicePort, msg);
    await chrome.storage.local.remove(['activeRequestAttestation']);
  }, [
    padoServicePort,
    clearFetchAttestationTimer,
    activeAttestation,
    attestTipMap,
  ]);
  const intervalFn = useCallback(() => {
    const msg = {
      fullScreenType: 'algorithm',
      reqMethodName: 'getAttestationResult',
      params: {},
    };
    postMsg(padoServicePort, msg);
    console.log('page_send:getAttestationResult request');
  }, [padoServicePort]);
  useTimeout(timeoutFn, ATTESTATIONPOLLINGTIMEOUT, timeoutSwitch, false);
  useInterval(intervalFn, ATTESTATIONPOLLINGTIME, intervalSwitch, false);

  useEffect(() => {
    const listerFn = async (message: any) => {
      const { type, name } = message;
      const ctx = listenerContextRef.current;
      const activeAttestation = activeAttestationRef.current;
      const webProofTypes = webProofTypesRef.current;
      const fromEvents = fromEventsRef.current;
      if (type === 'pageDecode') {
        const { padoZKAttestationJSSDKBeginAttest } =
          await chrome.storage.local.get(['padoZKAttestationJSSDKBeginAttest']);
        if (padoZKAttestationJSSDKBeginAttest) {
          return;
        }
        const errorMsgTitle = [
          'Assets Verification',
          'Humanity Verification',
        ].includes(activeAttestation?.attestationType)
          ? `${activeAttestation.attestationType} failed!`
          : `${activeAttestation.attestationType} proof failed!`;
        let title = errorMsgTitle;

        if (name === 'cancel') {
          ctx.addMsg({
            type: 'error',
            title,
            desc: 'Unable to proceed. Please try again later.',
          });
          ctx.dispatch(setAttestLoading(3));
          ctx.dispatch(
            setActiveAttestation({
              loading: 3,
              msgObj: { btnTxt: 'Try Again' },
            })
          );
        } else if (name === 'start') {
          await chrome.storage.local.remove(['interceptionFailReportTimestamp']);
        } else if (name === 'stop') {
          if (ctx.attestLoading === 1) {
            ctx.addMsg({
              type: 'error',
              title,
              desc: 'Unable to proceed. Please try again later.',
            });
            ctx.dispatch(setAttestLoading(3));
            ctx.dispatch(
              setActiveAttestation({
                loading: 3,
                msgObj: { btnTxt: 'Try Again' },
              })
            );
          }
        } else if (name === 'interceptionFail') {
          ctx.clearFetchAttestationTimer();
          const { interceptionFailReportTimestamp } =
            await chrome.storage.local.get(['interceptionFailReportTimestamp']);
          if (
            interceptionFailReportTimestamp &&
            Date.now() - Number(interceptionFailReportTimestamp) < 2000
          ) {
            return;
          }
          await chrome.storage.local.set({
            interceptionFailReportTimestamp: Date.now().toString(),
          });
          const { activeRequestAttestation } =
            await chrome.storage.local.get(['activeRequestAttestation']);
          if (activeRequestAttestation) {
            const parsed = JSON.parse(activeRequestAttestation);
            const { source, schemaType, address, sigFormat } = parsed;
            const eventInfo: any = {
              eventType: 'ATTESTATION_GENERATE',
              rawData: {
                source,
                clientType: CLIENTTYPE,
                appId: '',
                templateId: schemaType,
                address,
                ext: { sigFormat, event: fromEvents },
                status: 'FAILED',
                detail: {
                  code: '00013',
                  desc: 'Unable to proceed. Target data missing.',
                },
              },
            };
            eventReport(eventInfo);
            await chrome.storage.local.remove(['activeRequestAttestation']);
          } else {
            const inferredSchemaType = inferSchemaTypeFromActiveAttestation(
              activeAttestation,
              webProofTypes
            );
            const {
              connectedWalletAddress,
              scrollEvent,
              [BASEVENTNAME]: basEventValue,
              padoZKAttestationJSSDKWalletAddress,
            } = await chrome.storage.local.get([
              'connectedWalletAddress',
              'scrollEvent',
              BASEVENTNAME,
              'padoZKAttestationJSSDKWalletAddress',
            ]);
            let formatAddress: string | undefined;
            if (connectedWalletAddress) {
              formatAddress = JSON.parse(connectedWalletAddress).address;
            }
            if (fromEvents === SCROLLEVENTNAME && scrollEvent) {
              const scrollEventObj = JSON.parse(scrollEvent) as {
                address?: string;
              };
              if (scrollEventObj?.address) {
                formatAddress = scrollEventObj.address;
              }
            } else if (fromEvents === BASEVENTNAME && basEventValue) {
              const lastInfo = JSON.parse(basEventValue) as { address?: string };
              if (lastInfo?.address) {
                formatAddress = lastInfo.address;
              }
            }
            if (padoZKAttestationJSSDKWalletAddress) {
              formatAddress = padoZKAttestationJSSDKWalletAddress;
            }
            const eventInfo: any = {
              eventType: 'ATTESTATION_GENERATE',
              rawData: {
                source: activeAttestation?.dataSourceId ?? '',
                clientType: CLIENTTYPE,
                appId: '',
                templateId:
                  (inferredSchemaType || activeAttestation?.attestationType) ??
                  '',
                address: formatAddress ?? '',
                ext: { event: fromEvents },
                status: 'FAILED',
                detail: {
                  code: '00013',
                  desc: 'Unable to proceed. Target data missing.',
                },
              },
            };
            eventReport(eventInfo);
          }
          ctx.addMsg({
            type: 'error',
            title,
            desc: 'Unable to proceed. Target data missing.',
          });
          ctx.dispatch(setAttestLoading(3));
          ctx.dispatch(
            setActiveAttestation({
              loading: 3,
              msgObj: { btnTxt: 'Try Again' },
            })
          );
        } else if (name === 'dataSourcePageDialogTimeout') {
          ctx.clearFetchAttestationTimer();
          ctx.addMsg({
            type: 'error',
            title,
            desc: 'The process did not respond within 2 minutes. Please try again later.',
          });
          ctx.dispatch(setAttestLoading(3));
          ctx.dispatch(
            setActiveAttestation({
              loading: 3,
              msgObj: { btnTxt: 'Try Again' },
            })
          );
        }
        if (['stop', 'cancel', 'close'].includes(name)) {
          ctx.clearFetchAttestationTimer();
          if (['stop', 'cancel'].includes(name)) {
            chrome.storage.local.remove(['activeRequestAttestation']);
          }
        }
      } else if (type === 'googleAuth') {
        if (name === 'cancelAttest') {
          ctx.dispatch(setAttestLoading(3));
          ctx.dispatch(
            setActiveAttestation({
              loading: 3,
              msgObj: {
                type: 'warn',
                title: 'Unable to proceed',
                desc: 'Please try again later.',
                btnTxt: 'Try Again',
              },
            })
          );
        }
      }
    };
    chrome.runtime.onMessage.addListener(listerFn);
    return () => {
      chrome.runtime.onMessage.removeListener(listerFn);
    };
  }, []);
  useEffect(() => {
    if (attestLoading === 1) {
      if (!['web3 wallet'].includes(activeAttestation.dataSourceId)) {
        setTimeoutSwitch(true);
      }
    }
  }, [attestLoading, activeAttestation]);
};
export default useALGAttest;
