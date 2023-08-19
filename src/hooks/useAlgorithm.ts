import React, { useRef, useEffect, useCallback } from 'react';

import { postMsg } from '@/utils/utils';
import { useSelector } from 'react-redux';
import { getPadoUrl, getProxyUrl } from '@/config/envConstants';
import {STARTOFFLINETIMEOUT} from '@/config/constants'
import type { UserState } from '@/types/store';

type UseAlgorithm = (
  getAttestationCallback: (res:any) => void,
  getAttestationResultCallback: (res: any) => void
) => void;

const useAlgorithm: UseAlgorithm = function useAlgorithm(
  getAttestationCallback,
  getAttestationResultCallback
) {
  const savedCallback = useRef((res:any) => {});
  useEffect(() => {
    savedCallback.current = getAttestationCallback;
  });
  const savedGetAttestationResultCallback = useRef((res: any) => {});
  useEffect(() => {
    savedGetAttestationResultCallback.current = getAttestationResultCallback;
  });
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const padoServicePortListener = useCallback(
    async function (message: any) {
      const { resType, resMethodName, res,params } = message;
      if (resType === 'algorithm') {
        console.log(`page_get:${resMethodName}:`, res);
        if (resMethodName === `start`) {
          console.log(`page_get:start:`, message.res);
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
        if (resMethodName === `getAttestation`) {
          if (res) {
            // TODO wheather wait getAttestation msg back
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
      }
    },
    [padoServicePort]
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
};
export default useAlgorithm;
