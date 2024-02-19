import React, { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { postMsg, sub } from '@/utils/utils';

import type { UserState } from '@/types/store';
import type {
  SocialDataList,
  ExDataList,
  KYCDataList,
  SourceDataList,
  SourceData,
  ExchangeMeta,
} from '@/types/dataSource';

const useAllSources = (sourceName?: undefined | null| string) => {
  const exSources = useSelector((state: UserState) => state.exSources);
  const socialSources = useSelector((state: UserState) => state.socialSources);
  const kycSources = useSelector((state: UserState) => state.kycSources);

  const exList = useMemo(() => {
    const sourceArr: ExDataList = Object.values({ ...exSources });
    const orderedExList = sourceArr.sort((a, b) =>
      sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber()
    );
    return orderedExList;
  }, [exSources]);
  const socialList = useMemo(() => {
    const sourceArr: SocialDataList = Object.values({ ...socialSources });
    const orderedSocialList = sourceArr.sort((a, b) =>
      sub(Number(b.followers), Number(a.followers)).toNumber()
    );
    return orderedSocialList;
  }, [socialSources]);
  const kycList: KYCDataList = useMemo(() => {
    return Object.values({ ...kycSources });
  }, [kycSources]);
  const allSourceList: SourceDataList = useMemo(() => {
    return [...exList, ...socialList, ...kycList];
  }, [exList, socialList, kycList]);
  const allSourceMap: any = useMemo(() => {
    return {
      exSources,
      socialSources,
      kycSources,
    };
  }, [exSources, socialSources, kycSources]);
  const activeSourceInfo: any = useMemo(() => {
    if (sourceName) {
      const lowerCaseName = sourceName.toLowerCase()
      return (
        exSources[lowerCaseName] ||
        socialSources[lowerCaseName] ||
        kycSources[lowerCaseName]
      );
    } else {
      return null;
    }
  }, [exSources, socialSources, kycSources]);
  // sourceName
  return [allSourceList, allSourceMap, activeSourceInfo];
};

export default useAllSources;
