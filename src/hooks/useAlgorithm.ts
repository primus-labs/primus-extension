import React, { useRef, useEffect, useCallback } from 'react';
import { postMsg } from '@/utils/utils';
import { useSelector } from 'react-redux';
import { getPadoUrl, getProxyUrl } from '@/config/envConstants';
import { STARTOFFLINETIMEOUT } from '@/config/constants';
import type { UserState } from '@/types/store';
import { eventReport } from '@/services/api/usertracker';

type UseAlgorithm = (
  getAttestationCallback: (res: any) => void,
  getAttestationResultCallback: (res: any) => void,
  cancelCallStartOfflineFlag?: boolean
  // cancelAttestationCallback?: (res:any) =>void
) => void;

const useAlgorithm: UseAlgorithm = function useAlgorithm(
  getAttestationCallback,
  getAttestationResultCallback,
  cancelCallStartOfflineFlag = false
  // cancelAttestationCallback
) {
  const savedCallback = useRef((res: any) => {});
  useEffect(() => {
    savedCallback.current = getAttestationCallback;
  });
  const savedGetAttestationResultCallback = useRef((res: any) => {});
  useEffect(() => {
    savedGetAttestationResultCallback.current = getAttestationResultCallback;
  });
  // const savedCancelAttestationCallback = useRef((res: any) => {});
  // useEffect(() => {
  //   cancelAttestationCallback && (savedCancelAttestationCallback.current = cancelAttestationCallback);
  // });
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const padoServicePortListener = useCallback(
    async function (message: any) {
      const { resType, resMethodName, res, params } = message;
      if (resType === 'algorithm') {
        console.log(`page_get:${resMethodName}:`, res);
        if (resMethodName === `start`) {
          console.log(`page_get:start:`, message.res);
          let eventInfo = {
            eventType: 'ATTESTATION_INIT_2',
            rawData: {},
          };
          eventReport(eventInfo);
          const msg = {
            fullScreenType: 'algorithm',
            reqMethodName: 'init',
            params: {},
          };
          postMsg(padoServicePort, msg);
          console.log(`page_send:init request`);
        }
        if (resMethodName === `init`) {
          if (res) {
            // algorithm is ready
            // if (!cancelCallStartOfflineFlag) {
            //   const padoUrl = await getPadoUrl();
            //   const proxyUrl = await getProxyUrl();
            //   postMsg(padoServicePort, {
            //     fullScreenType: 'algorithm',
            //     reqMethodName: 'startOffline',
            //     params: {
            //       offlineTimeout: STARTOFFLINETIMEOUT,
            //       padoUrl,
            //       proxyUrl,
            //     },
            //   });
            // }
          }
        }
        if (resMethodName === `getAttestation`) {
          // TODO wheather wait getAttestation msg back
          if (res) {
            let eventInfo = {
              eventType: 'ATTESTATION_START_FRONTEND',
              rawData: {
                requestid: message.requestid,
                order: '7',
              },
            };
            eventReport(eventInfo);
            const handler = () => savedCallback.current(res);
            handler();
          }
        }
        if (resMethodName === `getAttestationResult`) {
          if (res) {
            const handler = () =>
              savedGetAttestationResultCallback.current(res);
            handler();
          }
        }
        if (resMethodName === `stop`) {
          if (res.retcode === 0 && !params?.noRestart) {
            const msg: any = {
              fullScreenType: 'algorithm',
              reqMethodName: 'start',
              params: {},
            };
            postMsg(padoServicePort, msg);
            console.log(`page_send:start request`);
          }
        }
        if (resMethodName === 'lineaEventStartOffline') {
          if (cancelCallStartOfflineFlag) {
            const padoUrl = await getPadoUrl();
            const proxyUrl = await getProxyUrl();
            postMsg(padoServicePort, {
              fullScreenType: 'algorithm',
              reqMethodName: 'startOffline',
              params: {
                offlineTimeout: STARTOFFLINETIMEOUT,
                padoUrl,
                proxyUrl,
              },
            });
          }
        }
        // if (
        //   message.type === 'pageDecode' &&
        //   message.name === 'cancelAttest'
        // ) {
        //   const handler = () => savedCancelAttestationCallback.current(res);
        //   handler();
        // }
      }
    },
    [padoServicePort, cancelCallStartOfflineFlag]
  );
  const initAlgorithm = useCallback(() => {
    const msg: any = {
      fullScreenType: 'algorithm',
      reqMethodName: 'start',
      params: {},
    };
    postMsg(padoServicePort, msg);
    console.log(`page_send:start request`);
  }, [padoServicePort]);
  useEffect(() => {
    initAlgorithm();
  }, [initAlgorithm]);
  useEffect(() => {
    if (padoServicePort) {
      padoServicePort.onMessage.addListener(padoServicePortListener);
      return () => {
        padoServicePort.onMessage.removeListener(padoServicePortListener);
      };
    }
  }, [padoServicePort, padoServicePortListener]);

  useEffect(() => {
    console.log('updated port in page layout', padoServicePort.name);
    const beforeunloadFn = async () => {
        const msg = {
          fullScreenType: 'algorithm',
          reqMethodName: 'stop',
          params: {
            noRestart: true,
          },
        };
        postMsg(padoServicePort, msg);
    };
    window.addEventListener('beforeunload', beforeunloadFn);
    return () => {
      window.removeEventListener('beforeunload', beforeunloadFn);
    };
  }, [padoServicePort]);
};
export default useAlgorithm;
