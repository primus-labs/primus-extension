import React, { useEffect, useMemo, useCallback, memo } from 'react';
import useUpdateAssetSources from '@/hooks/useUpdateAssetSources';
import useUpdateSocialSources from '@/hooks/useUpdateSocialSources';
import useUpdateAllSources from '@/hooks/useUpdateAllSources';
import useUpdateExSources from '@/hooks/useUpdateExSources';
import useUpdateOnChainSources from '@/hooks/useUpdateOnChainSources';

import './index.sass';
interface DataUpdateBarProps {
  type?: string;
  sourceName?: string;
  onUpdate: () => void;
}
const DataUpdateBar: React.FC<DataUpdateBarProps> = memo(
  ({ type = 'All', onUpdate, sourceName }) => {
    const [fetchAssetDatasLoading, fetchAssetDatas] = useUpdateAssetSources();
    const [fetchSocialDatasLoading, fetchSocialDatas] =
      useUpdateSocialSources();
    const [fetchAllDatasLoading, fetchAllDatas] = useUpdateAllSources();
    const [fetchExDatasLoading, fetchExDatas] = useUpdateExSources();
    const [fetchOnChainDatasLoading, fetchOnChainDatas] =
      useUpdateOnChainSources();
    const assetType = useMemo(() => {
      if (sourceName) {
        if (sourceName.startsWith('0x')) {
          return 'onChain'
        } else {
          return 'exchange'
        }
      } else {
        return 'Assets'
      }
    }, [sourceName]);
    const updating = useMemo(() => {
      if (type === 'All') {
        return fetchAllDatasLoading;
      } else if (type === 'Assets') {
        if (assetType === 'onChain') {
          return fetchOnChainDatasLoading;
        } else if (assetType === 'exchange') {
          return fetchExDatasLoading;
        } else {
          return fetchAssetDatasLoading;
        }
      } else if (type === 'Social') {
        return fetchSocialDatasLoading;
      }
    }, [
      fetchAssetDatasLoading,
      fetchSocialDatasLoading,
      fetchAllDatasLoading,
      type,
      assetType,
      fetchOnChainDatasLoading,
      fetchExDatasLoading,
    ]);
    const updateF = useCallback(() => {
      if (type === 'All') {
        (fetchAllDatas as () => void)();
      } else if (type === 'Assets') {
        if (assetType === 'onChain') {
          (fetchOnChainDatas as (name?: string) => void)(sourceName);
        } else if (assetType === 'exchange') {
          (fetchExDatas as (name?: string) => void)(sourceName);
        } else {
          (fetchAssetDatas as () => void)();
        }
      } else if (type === 'Social') {
        (fetchSocialDatas as () => void)();
      }
    }, [
      fetchAssetDatas,
      fetchSocialDatas,
      fetchAllDatas,
      type,
      sourceName,
      fetchOnChainDatas,
      fetchExDatas,
      assetType,
    ]);
    const handleClickUpdate = async () => {
      if (!updating) {
        await updateF();
      }
    };
    useEffect(() => {
      // Notify when update is complete
      !updating && onUpdate();
      // TODO avoid first request
    }, [updating]);
    return (
      <div className="dataUpdateBar">
        <button className="updateBtn" onClick={handleClickUpdate}>
          <div className={updating ? 'imgUpdate rotate' : 'imgUpdate'}></div>
          <span>Data Update</span>
        </button>
      </div>
    );
  }
);

export default DataUpdateBar;
