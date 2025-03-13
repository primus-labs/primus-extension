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

import { BASEVENTNAME, LINEAEVENTNAME } from '@/config/events';
import { DATASOURCEMAP } from '@/config/dataSource';
import {
  ATTESTATIONPOLLINGTIMEOUT,
  ATTESTATIONPOLLINGTIME,
} from '@/config/constants';
import { ATTESTATIONTYPEMAP } from '@/config/attestation';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { DataSourceMapType } from '@/types/dataSource';
import type { ActiveRequestType } from '@/types/config';

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
          var eventInfo: any = {
            eventType: 'ATTESTATION_GENERATE',
            rawData: {
              source: parsedActiveRequestAttestation.source,
              schemaType: parsedActiveRequestAttestation.schemaType,
              sigFormat: parsedActiveRequestAttestation.sigFormat,
              // attestationId: uniqueId,
              status: 'FAILED',
              reason: 'algorithm is not initialized',
              event: fromEvents,
              address: parsedActiveRequestAttestation?.address,
            },
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
        var eventInfo: any = {
          eventType: 'ATTESTATION_GENERATE',
          rawData: {
            source: parsedActiveRequestAttestation.source,
            schemaType: parsedActiveRequestAttestation.schemaType,
            sigFormat: parsedActiveRequestAttestation.sigFormat,
          },
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
            eventInfo.rawData = Object.assign(eventInfo.rawData, {
              attestationId: uniqueId,
              status: 'SUCCESS',
              reason: '',
              event: fromEvents,
              address: fullAttestation?.address,
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
            if (!content.signature && content.encodedData) {
              if (content.extraData) {
                // chatgpt input error
                errorCode = JSON.parse(content.extraData).errorCode + '';
                if (errorCode === '-1200010') {
                  Object.assign(msgObj, {
                    type: '',
                    desc: 'Invalid message.',
                    sourcePageTip: 'Invalid message.',
                  });
                } else {
                  errorCode = '00103'; // linea event had bund
                  Object.assign(msgObj, {
                    type: attestTipMap[errorCode].type,
                    desc: attestTipMap[errorCode].desc,
                    sourcePageTip: attestTipMap[errorCode].title,
                  });
                }
              } else {
                errorCode = '00103'; // linea event had bund
                Object.assign(msgObj, {
                  type: attestTipMap[errorCode].type,
                  desc: attestTipMap[errorCode].desc,
                  sourcePageTip: attestTipMap[errorCode].title,
                });
              }
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

            eventInfo.rawData = Object.assign(eventInfo.rawData, {
              status: 'FAILED',
              reason: 'Not met the requirements',
              event: fromEvents,
              address: parsedActiveRequestAttestation?.address,
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
          eventInfo.rawData = Object.assign(eventInfo.rawData, {
            status: 'FAILED',
            reason: eventInfoMsg,
            detail: {
              code,
              desc,
            },
            event: fromEvents,
            address: parsedActiveRequestAttestation?.address,
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

    var eventInfo: any = {
      eventType: 'ATTESTATION_GENERATE',
      rawData: {
        source: parsedActiveRequestAttestation.source,
        schemaType: parsedActiveRequestAttestation.schemaType,
        sigFormat: parsedActiveRequestAttestation.sigFormat,
        // attestationId: uniqueId,
        status: 'FAILED',
        reason: 'timeout',
        event: fromEvents,
        address: parsedActiveRequestAttestation?.address,
      },
    };

    if (beginAttest === '1') {
      eventInfo.rawData.getAttestationResultRes = getAttestationResultRes;
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
      if (type === 'pageDecode') {
        const { padoZKAttestationJSSDKBeginAttest } =
          await chrome.storage.local.get(['padoZKAttestationJSSDKBeginAttest']);
        if (padoZKAttestationJSSDKBeginAttest) {
          return;
        }
        // console.log('222message', message, activeAttestation);
        const errorMsgTitle = [
          'Assets Verification',
          'Humanity Verification',
        ].includes(activeAttestation.attestationType)
          ? `${activeAttestation.attestationType} failed!`
          : `${activeAttestation.attestationType} proof failed!`;
        let title = errorMsgTitle;

        if (name === 'cancel') {
          addMsg({
            type: 'error',
            title,
            desc: 'Unable to proceed. Please try again later.',
          });
          dispatch(setAttestLoading(3));
          dispatch(
            setActiveAttestation({
              loading: 3,
              msgObj: { btnTxt: 'Try Again' },
            })
          );
        } else if (name === 'start') {
          // dispatch(setAttestLoading(1));
          // dispatch(setActiveAttestation({ loading: 1 }));
        } else if (name === 'stop') {
          if (attestLoading === 1) {
            addMsg({
              type: 'error',
              title,
              desc: 'Unable to proceed. Please try again later.',
            });
            dispatch(setAttestLoading(3));
            dispatch(
              setActiveAttestation({
                loading: 3,
                msgObj: { btnTxt: 'Try Again' },
              })
            );
          }
          // if (activeRequest?.type === 'loading' || !activeRequest?.type) {
          //   setActiveRequest({
          //     type: 'warn',
          //     title: 'Unable to proceed',
          //     desc: 'Please try again later.',
          //   });
          // }
          // if (activeRequest?.type === 'loading') {
          //   setIntervalSwitch(false);
          // }
        } else if (name === 'interceptionFail') {
          clearFetchAttestationTimer();
          await chrome.storage.local.remove(['activeRequestAttestation']);
          addMsg({
            type: 'error',
            title,
            desc: 'Unable to proceed. Target data missing.',
          });
          dispatch(setAttestLoading(3));
          dispatch(
            setActiveAttestation({
              loading: 3,
              msgObj: { btnTxt: 'Try Again' },
            })
          );
        } else if (name === 'dataSourcePageDialogTimeout') {
          clearFetchAttestationTimer();
          await chrome.storage.local.remove(['activeRequestAttestation']);
          addMsg({
            type: 'error',
            title,
            desc: 'The process did not respond within 2 minutes. Please try again later.',
          });
          dispatch(setAttestLoading(3));
          dispatch(
            setActiveAttestation({
              loading: 3,
              msgObj: { btnTxt: 'Try Again' },
            })
          );
        }
        // else if (
        //   message.name === 'closeDataSourcePage' &&
        //   message.tryFlag
        // ) {
        //   LINEA_DEFI_VOYAGETryAgainFn();
        // }
        if (['stop', 'cancel', 'close'].includes(name)) {
          clearFetchAttestationTimer();
          if (['stop', 'cancel'].includes(name)) {
            chrome.storage.local.remove(['activeRequestAttestation']);
          }
        }
      } else if (type === 'googleAuth') {
        if (name === 'cancelAttest') {
          // google attest fail use dialog tip, not alert msg
          dispatch(setAttestLoading(3));
          dispatch(
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
  }, [dispatch, attestLoading, activeAttestation]);
  useEffect(() => {
    if (attestLoading === 1) {
      if (!['web3 wallet'].includes(activeAttestation.dataSourceId)) {
        setTimeoutSwitch(true);
      }
    }
  }, [attestLoading, activeAttestation]);
};
export default useALGAttest;
