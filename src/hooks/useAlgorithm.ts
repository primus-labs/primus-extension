import React, { useRef, useEffect, useCallback } from 'react';

import { postMsg } from '@/utils/utils';
import { useSelector } from 'react-redux';

import type { UserState } from '@/store/reducers';

type UseAlgorithm = (
  getAttestationCallback: () => void,
  getAttestationResultCallback: (res: any) => void
) => void;

const useAlgorithm: UseAlgorithm = function useAlgorithm(
  getAttestationCallback,
  getAttestationResultCallback
) {
  console.log('useAlgorithm');
  const savedCallback = useRef(() => {});
  useEffect(() => {
    savedCallback.current = getAttestationCallback;
  });
  const savedGetAttestationResultCallback = useRef((res:any) => {});
  useEffect(() => {
    savedGetAttestationResultCallback.current = getAttestationResultCallback;
  });
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const padoServicePortListener = useCallback(
    async function (message: any) {
      const { resType, resMethodName, res } = message;
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
          }
        }
        if (resMethodName === `getAttestation`) {
          if (res) {
            // TODO wheather wait getAttestation msg back
            const handler = () => savedCallback.current();
            handler();
            // TODO
          }
        }
        if (resMethodName === `getAttestationResult`) {
          if (res) {
            const handler = () => savedGetAttestationResultCallback.current(res);
            handler();
            // TODO
          }
        }
        if (resMethodName === `stop`) {
          if (res.retcode === 0) {
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
