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
import useMsgs from './useMsgs';
import { postMsg } from '@/utils/utils';
import { getPadoUrl, getProxyUrl } from '@/config/envConstants';
import { STARTOFFLINETIMEOUT } from '@/config/constants';

import { DATASOURCEMAP } from '@/config/dataSource';
import { eventReport } from '@/services/api/usertracker';
import { requestSignTypedData } from '@/services/wallets/utils';
import { getUserIdentity } from '@/services/api/user';

import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import type { ObjectType, SysConfigItem, GetSysConfigMsg } from '@/types/home';

type UseAlgorithm = () => void;

const useAlgorithm: UseAlgorithm = function useAlgorithm() {
  const { addMsg } = useMsgs();
  const dispatch: Dispatch<any> = useDispatch();
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const padoServicePortListener = useCallback(async function (message: any) {
    const { resType, res, msg, connectType, resMethodName, type } = message;
    if (resType && resType.startsWith('set-')) {
      console.log(`page_get:${resType}:`, res, msg);
      const lowerCaseSourceName = resType.split('-')[1];
      const activeDataSouceMetaInfo = DATASOURCEMAP[lowerCaseSourceName];
      const sourceType = activeDataSouceMetaInfo.type;
      var params = {
        result: 'success',
      };
      if (res) {
        if (sourceType === 'Assets') {
          dispatch(setExSourcesAsync());
        } else if (sourceType === 'Social') {
          dispatch(setSocialSourcesAsync());
        }
        dispatch(setActiveConnectDataSource({ loading: 2 }));
        addMsg({
          type: 'suc',
          title: 'Data connected!',
          link: `/datas/data?dataSourceId=${lowerCaseSourceName}`,
        });
        const eventInfo = {
          eventType: 'DATA_SOURCE_INIT',
          rawData: { type: sourceType, dataSource: lowerCaseSourceName },
        };
        eventReport(eventInfo);
      } else {
        dispatch(setActiveConnectDataSource({ loading: 3 }));
        let msgObj = {};

        params = {
          result: 'fail',
        };
        // TODO-newui eventReport
        // result: 'warn',
        // failReason,
        if (msg === 'AuthenticationError') {
          msgObj = {
            type: 'error',
            title: 'Invalid input',
            desc: 'Please check your API Key or Secret Key.',
          }
        } else if (msg === 'ExchangeNotAvailable') {
         msgObj = {
            type: 'warn',
            title: 'Service unavailable',
            desc: 'The network is unstable or the access may be restricted. Please adjust and try again later.',
          }
        } else if (msg === 'InvalidNonce') {
          msgObj = {
            type: 'warn',
            title: 'Something went wrong',
            desc: 'Looks like your time or internet settings may be incorrect. Please check and try again later.',
          }
        } else if (msg === 'TypeError: Failed to fetch') {
          msgObj = {
            type: 'warn',
            title: 'Your connection are lost',
            desc: 'Please check your internet connection and try again later.',
          }
        } else if (msg === 'RequestTimeout') {
          msgObj = {
            type: 'warn',
            title: 'Request timed out',
            desc: 'This request takes too long to process, it is timed out by the data source server.',
          }
        } else {
          msgObj = {
            type: 'warn',
            title: 'Ooops...',
            desc: 'Something went wrong. Please try again later.',
          }
        }
        dispatch(setActiveConnectDataSource({ loading: 3 }));
        addMsg(msgObj);
      }
      if (connectType === 'Web') {
        chrome.runtime.sendMessage({
          type: 'dataSourceWeb',
          name: 'end',
          result: res,
          params,
        });
      } else {
        dispatch(setConnectByAPILoading(2));
      }
    }
    if (resMethodName) {
      if (resMethodName === 'queryUserPassword') {
        if (res) {
          await dispatch({
            type: 'setUserPassword',
            payload: message.res,
          });
        }
      } else if (resMethodName === 'create') {
        console.log('page_get:create:', res);
        if (res) {
          const { privateKey } = await chrome.storage.local.get(['privateKey']);
          const privateKeyStr = privateKey?.substr(2);
          // const address = message.res.toLowerCase();
          const address = message.res;
          const timestamp = +new Date() + '';
          await chrome.storage.local.set({ padoCreatedWalletAddress: address });
          await dispatch(initWalletAddressActionAsync());
          try {
            const signature = await requestSignTypedData(
              privateKeyStr,
              address,
              timestamp
            );
            const res = await getUserIdentity({
              signature: signature as string,
              timestamp,
              address,
            });
            const { rc, result } = res;
            if (rc === 0) {
              const { bearerToken, identifier } = result;
              await chrome.storage.local.set({
                userInfo: JSON.stringify({
                  id: identifier,
                  token: bearerToken,
                }),
              });
              // const targetUrl = backUrl
              //   ? decodeURIComponent(backUrl)
              //   : '/events';
              // navigate(targetUrl);
            }
          } catch (e) {
            console.log('handleClickStart error', e);
          }
        }
      } else if (resMethodName === 'getSysConfig') {
        const { res } = message;
        console.log('page_get:getSysConfig:', res);
        if (res) {
          const configMap = res.reduce(
            (prev: ObjectType, curr: SysConfigItem) => {
              const { configName, configValue } = curr;
              prev[configName] = configValue;
              return prev;
            },
            {}
          );
          dispatch(setSysConfigAction(configMap));
        } else {
          //alert('getSysConfig network error');
          console.log('getSysConfig network error');
        }
      }
    }
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
