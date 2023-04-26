import React, { useState, useMemo, useCallback, memo } from 'react';
import useUpdateAssetSources from '@/hooks/useUpdateAssetSources'
import useUpdateSocialSources from '@/hooks/useUpdateSocialSources'
import useUpdateAllSources from '@/hooks/useUpdateAllSources'

import './index.sass'
interface DataAddBarProps {
  onClick: () => void
}
const DataAddBar: React.FC<DataAddBarProps> = memo(({ onClick}) => {
  const handleClickUpdate = async () => {
    onClick()
  }
  return (
    <div className="dataAddBar">
      <button className="updateBtn" onClick={handleClickUpdate}>
        <div className="imgUpdate"></div>
        <span>Add Data</span>
      </button>
    </div>
  );
});

export default DataAddBar;
