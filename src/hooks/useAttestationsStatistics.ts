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
  const [attestationsOnChainChains, setAttestationsOnChainChains] =
    useState<any>({});
  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );
  const attestationsLen = useMemo(() => {
    return Object.keys(credentialsFromStore).length;
  }, [credentialsFromStore]);
  const onChainAttestationsList = useMemo(() => {
    const l = Object.values(credentialsFromStore).filter(
      (i: any) => i.provided && i.provided.length > 0
    );
    return l;
  }, [credentialsFromStore]);
  const onChainAttestationsLen = useMemo(() => {
    return onChainAttestationsList.length;
  }, [onChainAttestationsList]);
  // {bsc: {1: {}}}
  const attestationsSubmitOnChainMap = useMemo(() => {
    const m: any = onChainAttestationsList.reduce((prev: any, curr: any) => {
      const { provided, requestid } = curr;
      provided.forEach((chainItem) => {
        const { title } = chainItem;
        if (title in prev) {
          prev[title][requestid] = curr;
        } else {
          prev[title] = {
            [requestid]: curr,
          };
        }
      }, {});
      return prev;
    }, {});

    return m;
  }, [onChainAttestationsList]);
  // {"Humanity Verification": {1: {...}}}
  const onChainAttestationsTypeMap = useMemo(() => {
    const m: any = onChainAttestationsList.reduce((prev: any, curr: any) => {
      const { provided, requestid, attestationType } = curr;
      if (attestationType in prev) {
        prev[attestationType][requestid] = curr;
      } else {
        prev[attestationType] = {
          [requestid]: curr,
        };
      }
      return prev;
    }, {});
    return m;
  }, [onChainAttestationsList]);
  // {"Humanity Verification": { 'BSC': {1: {...}}}}
  const onChainAttestationsTypeChainMap = useMemo(() => {
    const m: any = Object.keys(onChainAttestationsTypeMap).reduce(
      (prev: any, curr: any) => {
        const atsList = Object.values(onChainAttestationsTypeMap[curr]);
        const chainMap = atsList.reduce((prevM: any, currM: any) => {
          const { provided, requestid } = currM;
          provided.forEach((chainItem) => {
            const { title } = chainItem;
            if (title in prevM) {
              prevM[title][requestid] = currM;
            } else {
              prevM[title] = {
                [requestid]: currM,
              };
            }
          }, {});
          return prevM;
        }, {});
        prev[curr] = chainMap;
        return prev;
      },
      {}
    );
    return m;
  }, [onChainAttestationsTypeMap]);
  const attestationsSubmitOnChainLen = useMemo(() => {
    if (onChainAttestationsList?.length > 0) {
      const l: any = onChainAttestationsList.reduce((prev: any, curr: any) => {
        prev.push(...curr.provided);
        return prev;
      }, []);
      return l.length;
    } else {
      return 0;
    }
  }, [onChainAttestationsList]);
  const onChainAttestationsChainsIconList = useMemo(() => {
    return Object.values(attestationsOnChainChains).map((i: any) => i.icon);
  }, [attestationsOnChainChains]);
  const initOnChainFn = useCallback(() => {
    const m = onChainAttestationsList.reduce((prev: any, curr: any) => {
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
    setAttestationsOnChainChains(m);
  }, [onChainAttestationsList]);
  useEffect(() => {
    initOnChainFn();
  }, [initOnChainFn]);
  return {
    attestationsLen,
    onChainAttestationsList,
    onChainAttestationsLen,
    attestationsSubmitOnChainLen,
    onChainAttestationsChainsIconList,
    attestationsSubmitOnChainMap,
    onChainAttestationsTypeChainMap,
  };
};
export default useAttestationsStatistics;
