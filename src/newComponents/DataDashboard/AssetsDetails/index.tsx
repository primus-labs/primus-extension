import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import { getUserInfo } from '@/services/api/achievements';
import PButton from '@/newComponents/PButton';
import PPTabs from '@/newComponents/PTabs';
import Portfolio from './Portfolio';
import Token from './Token';
import Chain from './Chain';
import ShareComponent from '@/newComponents/Ahievements/ShareComponent';
import './index.scss';

const AssetsDetails = memo(() => {
  const { formatTotalAssetsBalance, hasChainAssets, hasTokenAssets } =
    useAssetsStatistic();
  const [activeTab, setActiveTab] = useState('Portfolio');
  const [visibleShareDiag, setVisibleShareDiag] = useState<boolean>(false);
  const [shareType, setShareType] = useState('data_dashboard');
  const [totalScore, setTotalScore] = useState(0);
  const [referralCode, setRefferralCode] = useState('');
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
  const handleShare = useCallback(() => {
    setVisibleShareDiag(true);
  }, []);
  const handleSharePageClose = () => {
    setVisibleShareDiag(false);
  };
  const getUserInfoFn = async () => {
    const res = await getUserInfo();
    const { rc, result } = res;
    if (rc === 0) {
      setRefferralCode(result.referralCode);
      setTotalScore(result.totalScore);
    }
  };
  useEffect(() => {
    getUserInfoFn();
  }, []);
  return (
    <div className="assetsDetails">
      <div className="title">
        <span>Assets Details</span>
        {/* <div className="operations">
          <PButton
            type="text"
            text="Share on social media"
            suffix={<i className="iconfont icon-iconShareActive"></i>}
            onClick={handleShare}
          />
        </div> */}
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
      {visibleShareDiag && (
        <ShareComponent
          onClose={handleSharePageClose}
          shareType={shareType}
          scoreShareProps={{
            score: totalScore,
            referralCode,
            totalBalance: formatTotalAssetsBalance,
          }}
        />
      )}
    </div>
  );
});

export default AssetsDetails;
