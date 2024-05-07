import React, { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { postMsg, sub } from '@/utils/utils';
import { WALLETMAP } from '@/config/wallet';
import type { UserState } from '@/types/store';
import type {
  SocialDataList,
  ExDataList,
  KYCDataList,
  SourceDataList,
  SourceData,
  ExchangeMeta,
} from '@/types/dataSource';

const useAllSources = (sourceName?: undefined | null | string) => {
  const exSources = useSelector((state: UserState) => state.exSources);
  const socialSources = useSelector((state: UserState) => state.socialSources);
  const kycSources = useSelector((state: UserState) => state.kycSources);
  const onChainAssetsSources = useSelector(
    (state: UserState) => state.onChainAssetsSources
  );
  const exList = useMemo(() => {
    const sourceArr: ExDataList = Object.values({ ...JSON.parse(JSON.stringify(exSources)) });
    const orderedExList = sourceArr.sort((a, b) =>
      sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber()
    );
    return orderedExList;
  }, [exSources]);
  const socialList = useMemo(() => {
    const sourceArr: SocialDataList = Object.values({ ...JSON.parse(JSON.stringify(socialSources)) });
    const orderedSocialList = sourceArr.sort((a, b) =>
      sub(Number(b.followers), Number(a.followers)).toNumber()
    );
    return orderedSocialList;
  }, [socialSources]);
  const kycList: KYCDataList = useMemo(() => {
    return Object.values({ ...JSON.parse(JSON.stringify(kycSources)) });
  }, [kycSources]);
  const onChainList: any = useMemo(() => {
    const l = Object.values({ ...JSON.parse(JSON.stringify(onChainAssetsSources)) });
    console.log('check-onChainList', l, onChainAssetsSources); // delete
    return l;
  }, [onChainAssetsSources]);
  const allSourceList: SourceDataList = useMemo(() => {
    return [...exList, ...socialList, ...kycList, ...onChainList];
  }, [exList, socialList, kycList]);

  const sortedConnectedOnChainAssetsSourcesList = useMemo(() => {
    const sortFn = (l) => {
      return l.sort((a: any, b: any) =>
        sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber()
      );
    };
    const l = sortFn(onChainList);
    return l;
  }, [onChainList]);
  const connectedAssetsSourcesList = useMemo(() => {
    let l = exList;
    if (onChainList.length > 0) {
      const newOnChainList = onChainList.map((i: any) => {
        const { name, icon } = WALLETMAP['metamask'];
        return Object.assign(i, { name, icon, id: i.address });
      });
      l = l.concat(newOnChainList);
    }
    return l;
  }, [exList, onChainList]);
  const sortedConnectedAssetsSourcesList = useMemo(() => {
    const sortFn = (l) => {
      return l.sort((a: any, b: any) =>
        sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber()
      );
    };
    return sortFn(connectedAssetsSourcesList);
  }, [connectedAssetsSourcesList]);

  const allSourceMap: any = useMemo(() => {
    return {
      exSources,
      socialSources,
      kycSources,
      onChainAssetsSources,
    };
  }, [exSources, socialSources, kycSources, onChainAssetsSources]);
  const allSourceMap2: any = useMemo(() => {
    return {
      ...exSources,
      ...socialSources,
      ...kycSources,
      ...onChainAssetsSources,
    };
  }, [exSources, socialSources, kycSources, onChainAssetsSources]);
  const activeSourceInfo: any = useMemo(() => {
    if (sourceName) {
      const lowerCaseName = sourceName.toLowerCase();
      return (
        exSources[lowerCaseName] ||
        socialSources[lowerCaseName] ||
        kycSources[lowerCaseName] ||
        onChainAssetsSources[lowerCaseName]
      );
    } else {
      return null;
    }
  }, [exSources, socialSources, kycSources, onChainAssetsSources]);
  // sourceName
  return {
    connectedOnChainSourcesList: onChainList,
    sourceList: allSourceList,
    sourceMap: allSourceMap,
    sourceMap2: allSourceMap2,
    activeSourceInfo,
    sortedConnectedAssetsSourcesList,
    sortedConnectedOnChainAssetsSourcesList,
  };
};

export default useAllSources;
