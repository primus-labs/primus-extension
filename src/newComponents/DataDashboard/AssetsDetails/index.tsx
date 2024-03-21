import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import PButton from '@/newComponents/PButton';
import PPTabs from '@/newComponents/PTabs';
import Portfolio from './Portfolio';
import Token from './Token';
import Chain from './Chain';
import './index.scss';

const tList = [
  { label: 'Portfolio', value: 'Portfolio' },
  { label: 'Token', value: 'Token' },
  { label: 'Chain', value: 'Chain' },
];
const AssetsDetails = memo(() => {

  const [activeTab, setActiveTab] = useState('Portfolio');
  const handleShare = useCallback(() => {}, []);

  return (
    <div className="assetsDetails">
      <div className="title">
        <span>Data Overview</span>
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
