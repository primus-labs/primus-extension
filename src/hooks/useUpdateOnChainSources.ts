import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
// import useAllSources from './useAllSources';
import { DATASOURCEMAP } from '@/config/constants';
import { getCurrentDate, getStatisticalData, sub } from '@/utils/utils';
import { setOnChainAssetsSourcesAsync } from '@/store/actions';

import { getAssetsOnChains } from '@/services/api/dataSource';
import { ONEMINUTE } from '@/config/constants';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import type { onChainAssetsData } from '@/types/dataSource';

type queryObjType = {
  [propName: string]: any;
};
const useUpdateOnChainSources = () => {
  // const { sourceMap } = useAllSources();
  const dispatch: Dispatch<any> = useDispatch();
  
  const [queryObj, setQueryObj] = useState<queryObjType>();
  // const onChainAssetsSources = useMemo(() => {
  //   return sourceMap.onChainAssetsSources;
  // }, [sourceMap]);
  const loading = useMemo(() => {
    const len = (queryObj && Object.keys(queryObj).length) || 0;
    if (queryObj && len > 0) {
      const flag = Object.values(queryObj).every((i) => i);
      return !flag;
    } else {
      return false;
    }
  }, [queryObj]);
  // name
  const fetchOnChainDatas = useCallback(async (name?: string) => {
    const { onChainAssetsSources: onChainAssetsSourcesStr } =
      await chrome.storage.local.get(['onChainAssetsSources']);
    const onChainAssetsSourcesObj = onChainAssetsSourcesStr
      ? JSON.parse(onChainAssetsSourcesStr)
      : {};
    let list: string[] = [];
    if (name) {
      setQueryObj((obj) => ({ ...obj, [name]: undefined }));
      list = [name];
    } else {
      Object.keys(onChainAssetsSourcesObj).forEach((i) => {
        // i => address
        setQueryObj((obj) => ({ ...obj, [i]: undefined }));
        list.push(i);
      });
    }

    list.forEach(async (item) => {
      const lastCurConnectedAddrInfo = onChainAssetsSourcesObj[item];

      const { signature, timestamp, address } =
        lastCurConnectedAddrInfo as onChainAssetsData;
      // Signature is permanently valid
      if (signature) {
        try {
          const { rc, result } = await getAssetsOnChains(
            {
              signature,
              timestamp,
              address,
            },
            {
              timeout: ONEMINUTE,
            }
          );
          if (rc === 0) {
            const res = getStatisticalData(result);
            const curAccOnChainAssetsItem: any = {
              address,
              timestamp,
              signature,
              date: getCurrentDate(),
              updateTimestamp: +new Date(),
              ...res,
              ...DATASOURCEMAP['onChain'],
            };
            const pnl = sub(
              curAccOnChainAssetsItem.totalBalance,
              lastCurConnectedAddrInfo.totalBalance
            ).toFixed();

            curAccOnChainAssetsItem.pnl = pnl;
            curAccOnChainAssetsItem.label = lastCurConnectedAddrInfo.label;

            const newOnChainAssetsMap = Object.assign(onChainAssetsSourcesObj, {
              [address]: curAccOnChainAssetsItem,
            });
            setQueryObj((obj) => ({
              ...obj,
              [address]: curAccOnChainAssetsItem,
            }));
            await chrome.storage.local.set({
              onChainAssetsSources: JSON.stringify(newOnChainAssetsMap),
            });
          } else {
          }
        } catch (e) {}
      }
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      dispatch(setOnChainAssetsSourcesAsync());
    }
  }, [loading, dispatch]);

  return [loading, fetchOnChainDatas];
};

export default useUpdateOnChainSources;
