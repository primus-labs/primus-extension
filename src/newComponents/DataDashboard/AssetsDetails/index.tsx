import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import PButton from '@/newComponents/PButton';
import PPTabs from '@/newComponents/PTabs';
import Portfolio from './Portfolio';
import Token from './Token';
import Chain from './Chain';
import './index.scss';

const AssetsDetails = memo(() => {
  const { hasChainAssets, hasTokenAssets } = useAssetsStatistic();
  const [activeTab, setActiveTab] = useState('Portfolio');
  const tList = useMemo(() => {
    let arr = [{ label: 'Portfolio', value: 'Portfolio' }];
    if (hasTokenAssets) {
      arr.push({ label: 'Token', value: 'Token' });
    }
    if (hasChainAssets) {
      arr.push({ label: 'Chain', value: 'Chain' });
    }
    return arr;
  }, [hasTokenAssets, hasChainAssets]);
  const handleShare = useCallback(() => {}, []);

  return (
    <div className="assetsDetails">
      <div className="title">
        <span>Assets Details</span>
        <div className="operations">
          <PButton
            type="text"
            text="Share on social media"
            suffix={<i className="iconfont icon-iconShare"></i>}
            onClick={handleShare}
          />
        </div>
      </div>
      <div className="content">
        <PPTabs
          list={tList}
          onChange={(p) => {
            setActiveTab(p);
          }}
          value={activeTab}
        />
        {activeTab === 'Portfolio' && <Portfolio />}
        {activeTab === 'Token' && <Token />}
        {activeTab === 'Chain' && <Chain />}
      </div>
    </div>
  );
});

export default AssetsDetails;
