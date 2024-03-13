import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DATASOURCEMAP } from '@/config/dataSource';
import { postMsg } from '@/utils/utils';
import { setSocialSourcesAsync } from '@/store/actions';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import useAuthorization from '@/hooks/useAuthorization';
import useAllSources from './useAllSources';

type ExKeysStorages = {
  [propName: string]: any;
};
type queryObjType = {
  [propName: string]: any;
};
const useUpdateSocialSources = () => {
  const { sourceMap } = useAllSources();
  const userInfo = useSelector((state: UserState) => state.userInfo);
  const dispatch: Dispatch<any> = useDispatch();
  const authorize = useAuthorization();
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const [queryObj, setQueryObj] = useState<queryObjType>();
  const socialSources = useMemo(() => {
    return sourceMap.socialSources;
  }, [sourceMap]);
  const loading = useMemo(() => {
    const len = (queryObj && Object.keys(queryObj).length) || 0;
    if (queryObj && len > 0) {
      const flag = Object.values(queryObj).every((i) => i);
      // console.log(23333555, queryObj, 'loading:', !flag);
      return !flag;
    } else {
      return false;
    }
  }, [queryObj]);
  const fetchSocialDatas = useCallback(async () => {
    const sourceNameList = Object.keys(socialSources);

    sourceNameList.forEach((i) => {
      const { timestamp } = socialSources[i];
      const now = +new Date();
      // refresh data more than an hour since the last time it was obtained
      if (i !== 'x' || (i === 'x' && now - timestamp > 1000 * 60 * 60)) {
        setQueryObj((obj) => ({ ...obj, [i]: undefined }));
      }
    });

    sourceNameList.forEach(async (item) => {
      const { connectType } = DATASOURCEMAP[item];
      if (connectType === 'Auth') {
        const msg: any = {
          fullScreenType: 'padoService',
          reqMethodName: `refreshAuthData`,
          params: {
            userId: userInfo.id,
            source: item.toUpperCase(),
          },
        };
        postMsg(padoServicePort, msg);
        console.log(`page_send:refreshAuthData request`);
      } else if (connectType === 'Web') {
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
      }
    });
  }, [padoServicePort, authorize, socialSources]);
  const padoServicePortListener = async function (message: any) {
    const { resMethodName, res, params } = message;
    if (resMethodName === 'refreshAuthData') {
      console.log(`page_get:${resMethodName}:`, res);
      const lowerCaseSourceName = params?.source.toLowerCase();
      if (res) {
        setQueryObj((obj) => ({ ...obj, [lowerCaseSourceName]: true }));
      } else {
        if (params?.mc === 'UNAUTHORIZED_401') {
          const curSourceUserInfo = socialSources[lowerCaseSourceName];
          curSourceUserInfo.expired = '1';
          await chrome.storage.local.set({
            [lowerCaseSourceName]: JSON.stringify(curSourceUserInfo),
          });
          setQueryObj((obj) => ({ ...obj, [lowerCaseSourceName]: true }));
        }
      }
    }
    const { resType } = message;
    if (resType?.startsWith(`set-`)) {
      console.log(`page_get:${resType}:`, res);
      const name = resType.split('-')[1];
      setQueryObj((obj) => ({ ...obj, [name]: true }));
    }
  };
  useEffect(() => {
    if (!loading) {
      dispatch(setSocialSourcesAsync());
    }
  }, [loading, dispatch]);
  useEffect(() => {
    padoServicePort.onMessage.addListener(padoServicePortListener);
    return () => {
      padoServicePort.onMessage.removeListener(padoServicePortListener);
    };
  }, [padoServicePort.onMessage]);

  return [loading, fetchSocialDatas];
};

export default useUpdateSocialSources;
