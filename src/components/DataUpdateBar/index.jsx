import React, {useState, useMemo} from 'react';
import useUpdateAssetSources from '@/hooks/useUpdateAssetSources'
import useUpdateSocialSources from '@/hooks/useUpdateSocialSources'
import useUpdateAllSources from '@/hooks/useUpdateAllSources'

import './index.sass'
// TODO query assets or social or  all sources
const DataUpdateBar = () => {
  // const [fetchExDatasLoading, fetchExDatas] = useUpdateAssetSources()
  // const [fetchSocialDatasLoading, fetchSocialDatas] = useUpdateSocialSources()
  // const updating = useMemo(() => {
  //   return fetchExDatasLoading || fetchSocialDatasLoading
  // },[fetchExDatasLoading , fetchSocialDatasLoading])
  const [updating,updateF] = useUpdateAllSources()
  const handleClickUpdate = async () => {
    if (!updating) {
      // Promise.all([fetchExDatas(), fetchSocialDatas()])
      updateF()
    }
  }
  return (
    <div className="dataUpdateBar">
      <button className="updateBtn" onClick={handleClickUpdate}>
        <div className={updating? "imgUpdate rotate": "imgUpdate"}></div>
        <span>Data Update</span>
    </button>
    </div>
  );
};

export default DataUpdateBar;
