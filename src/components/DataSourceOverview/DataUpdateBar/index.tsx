import React, { useState, useMemo, useCallback, memo } from 'react';
import useUpdateAssetSources from '@/hooks/useUpdateAssetSources'
import useUpdateSocialSources from '@/hooks/useUpdateSocialSources'
import useUpdateAllSources from '@/hooks/useUpdateAllSources'

import './index.sass'
interface DataUpdateBarProps {
  type?: string
}
// TODO query assets or social or  all sources
const DataUpdateBar: React.FC<DataUpdateBarProps> = memo(({ type = 'All' }) => {
  const [fetchExDatasLoading, fetchExDatas] = useUpdateAssetSources()
  const [fetchSocialDatasLoading, fetchSocialDatas] = useUpdateSocialSources()
  const [fetchAllDatasLoading, fetchAllDatas] = useUpdateAllSources()
  const updating = useMemo(() => {
    if (type === 'All') {
      return fetchAllDatasLoading
    } else if (type === 'Assets') {
      return fetchExDatasLoading
    } else if (type === 'Social') {
      return fetchSocialDatasLoading
    }
  }, [fetchExDatasLoading, fetchSocialDatasLoading, fetchAllDatasLoading, type])
  const updateF = useCallback(() => {
    if (type === 'All') {
      (fetchAllDatas as () => void)();
    } else if (type === 'Assets') {
      (fetchExDatas as () => void)()
    } else if (type === 'Social') {
      (fetchSocialDatas as () => void)()
    }
  }, [fetchExDatas, fetchSocialDatas, fetchAllDatas, type])
  const handleClickUpdate = async () => {
    if (!updating) {
      updateF()
    }
  }
  return (
    <div className="dataUpdateBar">
      <button className="updateBtn" onClick={handleClickUpdate}>
        <div className={updating ? "imgUpdate rotate" : "imgUpdate"}></div>
        <span>Data Update</span>
      </button>
    </div>
  );
});

export default DataUpdateBar;
