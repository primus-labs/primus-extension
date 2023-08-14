import React, { useCallback, useMemo } from 'react';
import useUpdateExSources from '@/hooks/useUpdateExSources';
import useUpdateOnChainSources from '@/hooks/useUpdateOnChainSources';

type ReturnPromiseType = () => Promise<void>;
const useUpdateAssetSources = () => {
  const [fetchExDatasLoading, fetchExDatas] = useUpdateExSources();
  const [fetchOnChainDatasLoading, fetchOnChainDatas] = useUpdateOnChainSources();
  const updating = useMemo(() => {
    return fetchExDatasLoading || fetchOnChainDatasLoading;
  }, [fetchExDatasLoading, fetchOnChainDatasLoading]);
  const updateF = useCallback(() => {
    Promise.all([
      (fetchExDatas as ReturnPromiseType)(),
      (fetchOnChainDatas as ReturnPromiseType)(),
    ]);
  }, [fetchExDatas, fetchOnChainDatas]);

  return [updating, updateF];
};

export default useUpdateAssetSources;
