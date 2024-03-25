import React, {
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { EASInfo } from '@/config/chain';

import type { UserState } from '@/types/store';

const useAttestationsStatistics = function () {
  const [onChains, setOnChains] = useState<any>({});
  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );
  const attestationsLen = useMemo(() => {
    return Object.keys(credentialsFromStore).length;
  }, [credentialsFromStore]);
  const attestationsOnChainList = useMemo(() => {
    const l = Object.values(credentialsFromStore).filter(
      (i: any) => i.provided && i.provided.length > 0
    );
    return l;
  }, [credentialsFromStore]);
  const attestationsOnChainLen = useMemo(() => {
    return attestationsOnChainList.length;
  }, [attestationsOnChainList]);
  const attestationsOnChainIconList = useMemo(() => {
    return Object.values(onChains).map((i: any) => i.icon);
  }, [onChains]);
  const initOnChainFn = useCallback(() => {
    const m = attestationsOnChainList.reduce((prev: any, curr: any) => {
      const provided = curr?.provided;
      if (provided) {
        let currCredM = provided.reduce((p, c) => {
          const { title } = c;
          p[title] = {
            id: title,
            icon: EASInfo[title].icon,
          };
          return p;
        }, {});
        prev = { ...prev, ...currCredM };
      }
      return prev;
    }, {});
    setOnChains(m);
  }, [attestationsOnChainList]);
  useEffect(() => {
    initOnChainFn();
  }, [initOnChainFn]);
  return {
    attestationsLen,
    attestationsOnChainLen,
    attestationsOnChainIconList,
  };
};
export default useAttestationsStatistics;
