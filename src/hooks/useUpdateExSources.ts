import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setExSourcesAsync } from '@/store/actions';

import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import { postMsg } from '@/utils/utils';
import useAllSources from './useAllSources';
type ExKeysStorages = {
  [propName: string]: any;
};
type queryObjType = {
  [propName: string]: any;
};
const useUpdateExSources = (flag = false) => {
  const { sourceMap } = useAllSources();
  const dispatch: Dispatch<any> = useDispatch();
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const [queryObj, setQueryObj] = useState<queryObjType>();
  const loading = useMemo(() => {
    const len = (queryObj && Object.keys(queryObj).length) || 0;
    if (queryObj && len > 0) {
      const flag = Object.values(queryObj).every((i) => i);
      // console.log(23333666, queryObj, 'loading:', !flag);
      return !flag;
    } else {
      return false;
    }
  }, [queryObj]);

  const exSources = useMemo(() => {
    return sourceMap.exSources;
  }, [sourceMap]);
  const fetchExDatas = useCallback(
    async (name?: string) => {
      const list = name ? [name] : Object.keys(exSources);
      list.map((i) => {
        setQueryObj((obj) => ({ ...obj, [i]: undefined }));
      });
      list.forEach(async (item) => {
        const reqType = `set-${item}`;
        const msg: any = {
          fullScreenType: 'networkreq',
          type: reqType,
          params: {
            withoutMsg: true,
          },
        };
        postMsg(padoServicePort, msg);
        console.log(`page_send:${reqType} request`);
      });
    },
    [padoServicePort, exSources]
  );
  const padoServicePortListener = useCallback(
    async function (message: any) {
      const { resType, res, msg } = message;
      if (resType?.startsWith(`set-`)) {
        console.log(`page_get:${resType}:`, message.res, 'useUpdateExSources');
        const name = resType.split('-')[1];
        setQueryObj((obj = {}) => {
          if (name in (obj as object)) {
            return { ...obj, [name]: true };
          } else {
            return obj;
          }
        });
        const curSourceUserInfo = exSources[name];
        if (res) {
          if (curSourceUserInfo?.expired === '1') {
            delete curSourceUserInfo.expired;
            await chrome.storage.local.set({
              [name]: JSON.stringify(curSourceUserInfo),
            });
          }
        } else {
          if (msg === 'AuthenticationError') {
            if (curSourceUserInfo) {
              curSourceUserInfo.expired = '1';
              await chrome.storage.local.set({
                [name]: JSON.stringify(curSourceUserInfo),
              });
            }
          }
        }
      }
    },
    [exSources]
  );
  useEffect(() => {
    padoServicePort.onMessage.addListener(padoServicePortListener);
    return () => {
      padoServicePort.onMessage.removeListener(padoServicePortListener);
    };
  }, [padoServicePort.onMessage, padoServicePortListener]);
  useEffect(() => {
    if (!loading) {
      dispatch(setExSourcesAsync());
    }
  }, [loading, dispatch]);
  return [loading, fetchExDatas];
};

export default useUpdateExSources;
