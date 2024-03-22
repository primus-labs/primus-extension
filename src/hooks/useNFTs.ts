import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

const useNFTs = function useNFTs() {
  const nfts = useSelector((state) => state.nfts);
  const accountsNftsListMap = useMemo(() => {
    const m = Object.keys(nfts).reduce((prevM, currM) => {
      const currentAccountNfts = nfts[currM];
      let arr: any = [];
      if (currentAccountNfts) {
        arr = Object.values(currentAccountNfts).reduce(
          (prev: any, curr: any) => {
            prev.push(...curr);
            return prev;
          },
          []
        );
      }
      prevM[currM] = arr;
      return prevM;
    }, {});
    return m;
  }, [nfts]);
  const accountsNftsList = useMemo(() => {
    const m = Object.keys(accountsNftsListMap).reduce(
      (prevM: any, currM: any) => {
        const currentAccountNftsArr = accountsNftsListMap[currM]
          ? Object.values(accountsNftsListMap[currM])
          : [];
        if (currentAccountNftsArr) {
          prevM.push(...currentAccountNftsArr);
        }
        return prevM;
      },
      []
    );
    return m;
  }, [accountsNftsListMap]);
  const chainNftsListMap = useMemo(() => {
    const m = accountsNftsList.reduce((prevM: any, currM: any) => {
      const { chain } = currM;
      if (chain in prevM) {
        prevM[chain].push(currM);
      } else {
        prevM[chain] = [currM];
      }
      return prevM;
    }, {});
    return m;
  }, [accountsNftsList]);
  return { accountsNftsListMap, accountsNftsList, chainNftsListMap };
};

export default useNFTs;
