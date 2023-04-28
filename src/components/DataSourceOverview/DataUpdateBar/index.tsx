import React, { useEffect, useMemo, useCallback, memo } from 'react';
import useUpdateAssetSources from '@/hooks/useUpdateAssetSources'
import useUpdateSocialSources from '@/hooks/useUpdateSocialSources'
import useUpdateAllSources from '@/hooks/useUpdateAllSources'

import './index.sass'
interface DataUpdateBarProps {
  type?: string;
  onUpdate: () => void;
  sourceName?: string;
}
const DataUpdateBar: React.FC<DataUpdateBarProps> = memo(({ type = 'All', onUpdate, sourceName }) => {
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
      (fetchExDatas as (name?:string) => void)(sourceName)
    } else if (type === 'Social') {
      (fetchSocialDatas as () => void)()
    }
  }, [fetchExDatas, fetchSocialDatas, fetchAllDatas, type, sourceName])
  const handleClickUpdate = async () => {
    if (!updating) {
      await updateF()
    }
  }
  useEffect(() => {
    // Notify when update is complete
    !updating && onUpdate()
    // TODO avoid first request
  }, [updating])
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
