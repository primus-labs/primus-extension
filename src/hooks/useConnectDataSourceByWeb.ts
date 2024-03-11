import React, { useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setExSourcesAsync,
  setSocialSourcesAsync,
  setConnectByAPILoading,
  initWalletAddressActionAsync,
  setSysConfigAction,
  setActiveConnectDataSource,
} from '@/store/actions';
import { postMsg } from '@/utils/utils';
import { getPadoUrl, getProxyUrl } from '@/config/envConstants';
import { STARTOFFLINETIMEOUT } from '@/config/constants';

import { DATASOURCEMAP } from '@/config/dataSource';
import { eventReport } from '@/services/api/usertracker';
import { requestSignTypedData } from '@/services/wallets/utils';
import { getUserIdentity } from '@/services/api/user';

import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
type UseAlgorithm = () => void;

const useAlgorithm: UseAlgorithm = function useAlgorithm() {
  const dispatch: Dispatch<any> = useDispatch();
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const padoServicePortListener = useCallback(
    async function (message: any) {
      const { type } = message;
      if (type === 'dataSourceWeb') {
        const { name } = message;
        if (name === 'start') {
          dispatch(setActiveConnectDataSource({loading:1}));
        }
      }
    },
    [dispatch]
  );

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
