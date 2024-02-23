import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { postMsg, sub } from '@/utils/utils';
import useAllSources from '@/hooks/useAllSources';
import { DATASOURCEMAP } from '@/config/dataSource';
import { eventReport } from '@/services/api/usertracker';

import {
  setExSourcesAsync,
  setSocialSourcesAsync,
  setKYCsAsync,
  setCredentialsAsync,
  setOnChainAssetsSourcesAsync,
} from '@/store/actions';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import type { DataSourceItemType } from '@/config/dataSource';

import type {
  SocialDataList,
  ExDataList,
  KYCDataList,
  SourceDataList,
  SourceData,
  ExchangeMeta,
} from '@/types/dataSource';
const DataSouces = Object.values(DATASOURCEMAP);

const useSource = (sourceName: string) => {
  var lowerCaseName = sourceName?.toLowerCase();
  const dispatch: Dispatch<any> = useDispatch();
  const [sourceList, allSourceMap] = useAllSources();
  var activeDataSouceMetaInfo = useMemo(() => {
    var obj =
      DataSouces.find((i) => i.name.toLowerCase() === lowerCaseName) || {};
    return obj as DataSourceItemType;
  }, [lowerCaseName]);
  const activeSourceInfo: any = useMemo(() => {
    if (lowerCaseName) {
      return (
        allSourceMap.exSources[lowerCaseName] ||
        allSourceMap.socialSources[lowerCaseName] ||
        allSourceMap.kycSources[lowerCaseName]
      );
    } else {
      return null;
    }
  }, [allSourceMap, lowerCaseName]);
  const handleDelete = useCallback(
    async (name?: string) => {
      if (name) {
        lowerCaseName = name.toLowerCase();
        activeDataSouceMetaInfo = DataSouces.find(
          (i) => i.name.toLowerCase() === lowerCaseName
        ) as DataSourceItemType;
      }
      // Delete credentials storage related to the exchange
      const { credentials: credentialsStr } = await chrome.storage.local.get([
        'credentials',
      ]);
      const credentialObj = credentialsStr ? JSON.parse(credentialsStr) : {};
      let newCredentialObj = { ...credentialObj };
      Object.keys(credentialObj).forEach((key) => {
        if (lowerCaseName === credentialObj[key].source) {
          const curCred = newCredentialObj[key];
          if (!curCred.provided) {
            delete newCredentialObj[key];
          }
        }
      });
      await chrome.storage.local.set({
        credentials: JSON.stringify(newCredentialObj),
      });
      // Delete on-chain datas

      // dispatch action & report event
      dispatch(setCredentialsAsync());
      if (activeDataSouceMetaInfo?.type === 'Assets') {
        // Delete data source storage
        if (lowerCaseName && lowerCaseName !== 'Web3 Wallet') {
          await chrome.storage.local.remove([lowerCaseName]);
        }
        // TODO-newui
        // if (i.name.startsWith('0x')) {
        if (lowerCaseName === 'Web3 Wallet') {
          const { onChainAssetsSources: onChainAssetsSourcesStr } =
            await chrome.storage.local.get(['onChainAssetsSources']);
          const onChainAssetsSourcesObj = onChainAssetsSourcesStr
            ? JSON.parse(onChainAssetsSourcesStr)
            : {};
          let newOnChainAssetsSourcesObj = { ...onChainAssetsSourcesObj };
          // key account address
          // if (newOnChainAssetsSourcesObj[key]) {
          //   delete newOnChainAssetsSourcesObj[key];
          // }
          await chrome.storage.local.set({
            onChainAssetsSources: JSON.stringify(newOnChainAssetsSourcesObj),
          });

          dispatch(setOnChainAssetsSourcesAsync());
          return eventReport({
            eventType: 'DATA_SOURCE_DELETE',
            rawData: {
              type: 'Assets',
              dataSource: 'onchain-ConnectWallet',
            },
          });
        } else {
          dispatch(setExSourcesAsync());
          return eventReport({
            eventType: 'DATA_SOURCE_DELETE',
            rawData: {
              type: activeDataSouceMetaInfo?.type,
              dataSource: lowerCaseName,
            },
          });
        }
      } else {
        if (activeDataSouceMetaInfo?.type === 'Social') {
          dispatch(setSocialSourcesAsync());
        } else if (activeDataSouceMetaInfo?.type === 'Humanity') {
          dispatch(setKYCsAsync());
        }
        return eventReport({
          eventType: 'DATA_SOURCE_DELETE',
          rawData: {
            type: activeDataSouceMetaInfo?.type,
            dataSource: lowerCaseName,
          },
        });
      }
    },
    [activeDataSouceMetaInfo, lowerCaseName]
  );

  return {
    metaInfo: activeDataSouceMetaInfo,
    userInfo: activeSourceInfo,
    deleteFn: handleDelete,
  };
};

export default useSource;
