import React, { useRef, useEffect, useCallback } from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { setExSourcesAsync, setSocialSourcesAsync } from '@/store/actions';
import { postMsg } from '@/utils/utils';
import { getPadoUrl, getProxyUrl } from '@/config/envConstants';
import { STARTOFFLINETIMEOUT } from '@/config/constants';
import { eventReport } from '@/services/api/usertracker';

import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';

type UseAlgorithm = () => void;

const useAlgorithm: UseAlgorithm = function useAlgorithm() {
  const dispatch: Dispatch<any> = useDispatch();
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const padoServicePortListener = useCallback(async function (message: any) {
    const { resType, res, msg } = message;
    console.log(`page_get:${resType}:`, res);
    if (resType.startsWith('set-')) {
      const lowerCaseSourceName = resType.split('-')[1];
      var params = {
          result: 'success',
        }
      if (res) {
        dispatch(setExSourcesAsync());
        const eventInfo = {
          eventType: 'DATA_SOURCE_INIT',
          rawData: { type: 'Assets', dataSource: lowerCaseSourceName },
        };
        eventReport(eventInfo);
      } else {
        params = {
          result: 'fail',
        };
        // result: 'warn',
        // failReason,
        // if (msg === 'AuthenticationError') {
        //   setActiveRequest({
        //     type: 'error',
        //     title: 'Invalid input',
        //     desc: 'Please check your API Key or Secret Key.',
        //   });
        // } else if (msg === 'ExchangeNotAvailable') {
        //   setActiveRequest({
        //     type: 'warn',
        //     title: 'Service unavailable',
        //     desc: 'The network is unstable or the access may be restricted. Please adjust and try again later.',
        //   });
        // } else if (msg === 'InvalidNonce') {
        //   setActiveRequest({
        //     type: 'warn',
        //     title: 'Something went wrong',
        //     desc: 'Looks like your time or internet settings may be incorrect. Please check and try again later.',
        //   });
        // } else if (msg === 'TypeError: Failed to fetch') {
        //   setActiveRequest({
        //     type: 'warn',
        //     title: 'Your connection are lost',
        //     desc: 'Please check your internet connection and try again later.',
        //   });
        // } else if (msg === 'RequestTimeout') {
        //   setActiveRequest({
        //     type: 'warn',
        //     title: 'Request timed out',
        //     desc: 'This request takes too long to process, it is timed out by the data source server.',
        //   });
        // } else {
        //   setActiveRequest({
        //     type: 'warn',
        //     title: 'Ooops...',
        //     desc: 'Something went wrong. Please try again later.',
        //   });
        // }
      }
      chrome.runtime.sendMessage({
        type: 'dataSourceWeb',
        name: 'end',
        result: res,
        params,
      });
    }
    padoServicePort.onMessage.removeListener(padoServicePortListener);
  }, []);

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
