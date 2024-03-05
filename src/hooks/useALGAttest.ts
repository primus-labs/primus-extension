import React, {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  setAttestLoading,
  setCredentialsAsync,
  setActiveAttestation,
  setMsgs,
} from '@/store/actions';

import useEventDetail from '@/hooks/useEventDetail';
import useAlgorithm from '@/hooks/useAlgorithm';
import useTimeout from '@/hooks/useTimeout';
import useInterval from '@/hooks/useInterval';
import { eventReport } from '@/services/api/usertracker';
import { postMsg, strToHex, base64ToHex, strToHexSha256 } from '@/utils/utils';

import { BASEVENTNAME, LINEAEVENTNAME } from '@/config/events';
import { DATASOURCEMAP } from '@/config/dataSource';
import {
  ATTESTATIONPOLLINGTIMEOUT,
  ATTESTATIONPOLLINGTIME,
  BIGZERO,
  ONESECOND,
  ONEMINUTE,
  CredVersion,
  SCROLLEVENTNAME,
  schemaTypeMap,
  GOOGLEWEBPROOFID,
} from '@/config/constants';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { DataSourceMapType } from '@/types/dataSource';
import type { ActiveRequestType } from '@/types/config';

const useAttest = function useAttest() {
  const dispatch: Dispatch<any> = useDispatch();
  const [searchParams] = useSearchParams();
  const fromEvents = searchParams.get('fromEvents');
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
  const msgs = useSelector((state: UserState) => state.msgs);
  const [BASEventDetail] = useEventDetail(BASEVENTNAME);
  const initCredList = useCallback(async () => {
    await dispatch(setCredentialsAsync());
  }, [dispatch]);
  const clearFetchAttestationTimer = useCallback(() => {
    setIntervalSwitch(false);
    setTimeoutSwitch(false);
  }, []);
  const storeBASEventInfoFn = useCallback(
    async (address: any, taskExtraInfo: any) => {
      if (fromEvents === BASEVENTNAME) {
        const res = await chrome.storage.local.get([BASEVENTNAME]);
        if (res[BASEVENTNAME]) {
          const lastInfo = JSON.parse(res[BASEVENTNAME]);
          const lastTasks = lastInfo.steps[1].tasks ?? {};
          if (!lastInfo.address) {
            lastInfo.address = address;
          }
          lastInfo.steps[1].status = 1;
          lastInfo.steps[1].tasks = {
            ...lastTasks,
            ...taskExtraInfo, //taskExtraInfo: {[GOOGLEWEBPROOFID]: fullAttestation.requestid,}
          };
          await chrome.storage.local.set({
            [BASEVENTNAME]: JSON.stringify(lastInfo),
          });
        }
      }
    },
    [fromEvents]
  );
  const getAttestationCallback = useCallback(
    async (res: any) => {
      const { retcode, retdesc } = JSON.parse(res);
      if (retcode === '0') {
        setTimeoutSwitch(true);
        setIntervalSwitch(true);
      } else if (retcode === '2') {
        alert('Failed'); // TODO-newui notification
        dispatch(setAttestLoading(2));
        dispatch(setActiveAttestation({ loading: 2 }));
        // algorithm is not initialized
        // setActiveRequest({
        //   type: 'error',
        //   title: 'Failed',
        //   desc: (
        //     <>
        //       <p>The algorithm has not been initialized.</p>
        //       <p>Please try again later.</p>
        //     </>
        //   ),
        // });
        const { activeRequestAttestation } = await chrome.storage.local.get([
          'activeRequestAttestation',
        ]);
        const parsedActiveRequestAttestation = activeRequestAttestation
          ? JSON.parse(activeRequestAttestation)
          : {};
        var eventInfo: any = {
          eventType: 'ATTESTATION_GENERATE',
          rawData: {
            source: parsedActiveRequestAttestation.source,
            schemaType: parsedActiveRequestAttestation.schemaType,
            sigFormat: parsedActiveRequestAttestation.sigFormat,
            // attestationId: uniqueId,
            status: 'FAILED',
            reason: 'algorithm is not initialized',
          },
        };
        eventReport(eventInfo);
      }
    },
    [dispatch]
  );
  const getAttestationResultCallback = useCallback(
    async (res: any) => {
      const { retcode, content, retdesc, details } = JSON.parse(res);
      const { activeRequestAttestation } = await chrome.storage.local.get([
        'activeRequestAttestation',
      ]);

      const parsedActiveRequestAttestation = activeRequestAttestation
        ? JSON.parse(activeRequestAttestation)
        : {};
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
        if (
          content.balanceGreaterThanBaseValue === 'true' &&
          content.signature
        ) {
          const activeRequestId = parsedActiveRequestAttestation.requestid;
          if (activeRequestId !== content?.requestid) {
            return;
          }
          const fullAttestation = {
            ...content,
            ...parsedActiveRequestAttestation,
            ...activeAttestation,
          };

          const credentialsObj = { ...credentialsFromStore };
          credentialsObj[activeRequestId] = fullAttestation;
          await chrome.storage.local.set({
            credentials: JSON.stringify(credentialsObj),
          });
          await chrome.storage.local.remove(['activeRequestAttestation']);
          await initCredList();
          if (fullAttestation.reqType === 'web') {
            storeBASEventInfoFn(content.address, {
              [parsedActiveRequestAttestation.templateId]:
                parsedActiveRequestAttestation.requestid,
            });
            await chrome.runtime.sendMessage({
              type: 'pageDecode',
              name: 'attestResult',
              params: {
                result: 'success',
              },
            });
          }
          setCredRequestId(activeRequestId);
          // suc
          alert(`${activeAttestation.attestationType} is created!`);
          dispatch(setAttestLoading(2));
          dispatch(setActiveAttestation({ loading: 2 }));
          // setActiveRequest({
          //   type: 'suc',
          //   title: 'Congratulations',
          //   desc: 'Your proof is created!',
          // });

          const uniqueId = strToHexSha256(fullAttestation.signature);
          eventInfo.rawData = Object.assign(eventInfo.rawData, {
            attestationId: uniqueId,
            status: 'SUCCESS',
            reason: '',
          });
          eventReport(eventInfo);
        } else if (
          !content.signature ||
          content.balanceGreaterThanBaseValue === 'false'
        ) {
          var titleItem1 = 'Not met the requirements';
          let descItem1 =
            'Your request did not meet the necessary requirements.';
          if (activeAttestation?.verificationContent === 'Assets Proof') {
            descItem1 = `Insufficient assets in your ${
              activeAttestation?.dataSourceId === 'okx' ? 'Trading' : 'Spot'
            } Account.`;
          }
          // let descEl = (
          //   <>
          //     <p>{descItem1}</p>
          //     <p>Please confirm and try again later.</p>
          //   </>
          // );
          let btnTxt =
            titleItem1 === 'Not met the requirements' ? '' : undefined;

          if (parsedActiveRequestAttestation.reqType === 'web') {
            let failReason = '';
            if (!content.signature && content.encodedData) {
              titleItem1 = 'Unable to proceed';
              // descEl = <p>Not meeting the uniqueness requirement.</p>;
              failReason = 'Not meeting the uniqueness requirement.';
              btnTxt = '';
              await chrome.runtime.sendMessage({
                type: 'pageDecode',
                name: 'attestResult',
                params: {
                  result: 'warn',
                  failReason,
                },
              });
            } else {
              await chrome.runtime.sendMessage({
                type: 'pageDecode',
                name: 'attestResult',
                params: {
                  result: 'fail',
                },
              });
            }
          }
          alert('warn');
          dispatch(setAttestLoading(2));
          dispatch(setActiveAttestation({ loading: 2 }));
          // setActiveRequest({
          //   type: 'warn',
          //   title: titleItem1,
          //   desc: descEl,
          //   btnTxt,
          // });

          eventInfo.rawData = Object.assign(eventInfo.rawData, {
            status: 'FAILED',
            reason: 'Not met the requirements',
          });
          eventReport(eventInfo);
        }
      } else if (retcode === '2') {
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
        let requestResObj: ActiveRequestType = {
          type: 'warn',
          title: 'Something went wrong',
          desc: 'Please try again later.',
        };

        switch (code * 1) {
          case 10001:
            requestResObj = {
              type: 'warn',
              title: 'Unstable Internet Connection',
              desc: 'Looks like your internet condition is not stable enough to complete the zkAttestation flow. Please try again later.',
              code: `Error code: ${code}`,
            };
            break;
          case 10002:
            requestResObj = {
              type: 'warn',
              title: 'Connection broken',
              desc: 'The attestation process has been interrupted due to some unkown network error. Please try again later.',
              code: `Error code: ${code}`,
            };
            break;
          case 10003:
            requestResObj = {
              type: 'warn',
              title: 'Unable to proceed',
              desc: "Can't connect attestation servier due to unstable internet condition. Please try again later.",
              code: `Error code: ${code}`,
            };
            break;
          case 10004:
            requestResObj = {
              type: 'warn',
              title: 'Unable to proceed',
              desc: "Can't connect data source servier due to untable internet condition. Please try again later.",
              code: `Error code: ${code}`,
            };
            break;

          case 20005:
            requestResObj = {
              type: 'warn',
              title: 'Unable to proceed',
              desc: "Can't complete the attestation due to some workflow error. Please try again later.",
              code: `Error code: ${code}`,
            };
            break;
          case 30002:
            requestResObj = {
              type: 'warn',
              title: 'Unable to proceed',
              desc: "Can't complete the attestation flow due to some data source error. Please try again later.",
              code: `Error code: ${code}`,
            };
            break;
          case 30003:
          case 30004:
            requestResObj = {
              type: 'warn',
              title: 'Unable to proceed',
              desc: "Can't complete the attestation flow due to some data source error. Please try again later.",
              code: `Error code: ${code}`,
            };
            break;
          case 40004:
          case 40005:
            requestResObj = {
              type: 'warn',
              title: 'Unable to proceed',
              desc: 'Please try again later.',
              code: `Error code: ${code}`,
            };
            break;
          case 20001:
          case 20002:
          case 20003:
          case 20004:
          case 30001:
          case 40001:
          case 40002:
          case 40003:
          case 99999:
            requestResObj = {
              type: 'warn',
              title: 'Something went wrong',
              desc: 'Please try again later.',
              code: `Error code: ${code}`,
            };
            break;
          default:
            requestResObj = {
              type: 'warn',
              title: 'Something went wrong',
              desc: 'Please try again later.',
              code: `Error code: ${code}`,
            };
            break;
        }
        if (
          retdesc.indexOf('connect to proxy error') > -1 ||
          retdesc.indexOf('WebSocket On Error') > -1 ||
          retdesc.indexOf('connection error') > -1
        ) {
          eventInfoMsg = 'Unstable internet connection';
        }
        // setActiveRequest(requestResObj);//TODO-newui
        eventInfo.rawData = Object.assign(eventInfo.rawData, {
          status: 'FAILED',
          reason: eventInfoMsg,
          detail: {
            code,
            desc,
          },
        });
        eventReport(eventInfo);
        if (parsedActiveRequestAttestation.reqType === 'web') {
          let failReason = {
            title: requestResObj.title,
            desc: requestResObj.desc,
          };

          await chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'attestResult',
            params: {
              result: 'warn',
              failReason,
            },
          });
        }
      }
    },
    [
      clearFetchAttestationTimer,
      padoServicePort,
      initCredList,
      credentialsFromStore,
      activeAttestation,
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
    // if (activeRequest?.type === 'suc') {
    //   return;
    // }// TODO-newui
    const { activeRequestAttestation } = await chrome.storage.local.get([
      'activeRequestAttestation',
    ]);
    const parsedActiveRequestAttestation = activeRequestAttestation
      ? JSON.parse(activeRequestAttestation)
      : {};

    if (parsedActiveRequestAttestation.reqType === 'web') {
      await chrome.runtime.sendMessage({
        type: 'pageDecode',
        name: 'attestResult',
        params: {
          result: 'warn',
        },
      });
    }
    dispatch(setAttestLoading(2));
    dispatch(setActiveAttestation({ loading: 2 }));
    alert('Request Timed Out');
    // setActiveRequest({
    //   type: 'warn',
    //   title: 'Request Timed Out',
    //   desc: 'The service did not respond within the expected time. Please try again later.',
    // });
    var eventInfo: any = {
      eventType: 'ATTESTATION_GENERATE',
      rawData: {
        source: parsedActiveRequestAttestation.source,
        schemaType: parsedActiveRequestAttestation.schemaType,
        sigFormat: parsedActiveRequestAttestation.sigFormat,
        // attestationId: uniqueId,
        status: 'FAILED',
        reason: 'timeout',
      },
    };
    eventReport(eventInfo);

    const msg = {
      fullScreenType: 'algorithm',
      reqMethodName: 'stop',
      params: {},
    };
    console.log('after timeout port', padoServicePort);
    postMsg(padoServicePort, msg);
  }, [padoServicePort, clearFetchAttestationTimer]);
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
    const listerFn = (message: any) => {
      const { type, name } = message;
      if (type === 'pageDecode') {
        if (name === 'cancelAttest') {
          alert('Unable to proceed');
          dispatch(setAttestLoading(2));
          dispatch(setActiveAttestation({ loading: 2 }));
          // setActiveRequest({
          //   type: 'warn',
          //   title: 'Unable to proceed',
          //   desc: 'Please try again later.',
          // });
        } else if (name === 'sendRequest') {
          dispatch(setAttestLoading(1));
          dispatch(setActiveAttestation({ loading: 1 }));
          // setActiveRequest({
          //   type: 'loading',
          //   title: 'Attestation is processing',
          //   desc: 'It may take a few seconds.',
          // });
        } else if (name === 'abortAttest') {
          if (attestLoading === 1) {
            alert('Unable to proceed');
            const id = Date.now();
            const newMsgs = {
              ...msgs,
              id: {
                id,
                type: 'error',
                title: 'Unable to proceed',
                desc: 'Please try again later.',
              },
            };
            dispatch(setMsgs(newMsgs));
          }
          // if (activeRequest?.type === 'loading' || !activeRequest?.type) {//TODO-newui
          //   setActiveRequest({
          //     type: 'warn',
          //     title: 'Unable to proceed',
          //     desc: 'Please try again later.',
          //   });
          // }
          // if (activeRequest?.type === 'loading') {
          //   setIntervalSwitch(false);
          // }
          dispatch(setAttestLoading(2));
          dispatch(setActiveAttestation({ loading: 2 }));
        }
        // else if (
        //   message.name === 'closeDataSourcePage' &&
        //   message.tryFlag
        // ) {
        //   LINEA_DEFI_VOYAGETryAgainFn();
        // }
      } else if (type === 'googleAuth') {
        if (name === 'cancelAttest') {
          alert('Unable to proceed');
          dispatch(setAttestLoading(2));
          dispatch(setActiveAttestation({ loading: 2 }));
          // setActiveRequest({
          //   type: 'warn',
          //   title: 'Unable to proceed',
          //   desc: 'Please try again later.',
          // });
        }
      }
    };
    chrome.runtime.onMessage.addListener(listerFn);
    return () => {
      chrome.runtime.onMessage.removeListener(listerFn);
    };
  }, [dispatch, attestLoading]);
};
export default useAttest;
