import React, { FC, memo, useState, useCallback, useEffect } from 'react';
import PMask from '@/components/PMask';
import PTabsNew from '@/components/PTabsNew';
import ClaimDialogHeaderDialog from '../../ClaimWrapper/ClaimDialogHeader';
import iconShield from '@/assets/img/events/iconShield.svg';
import mysteryBoxImg from '@/assets/img/events/mysteryBoxImg.svg';
import mysteryBoxReward from '@/assets/img/events/mysteryBoxReward.svg';
import './index.scss';

interface ClaimDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}
const tabList = [
  {
    text: 'Badges',
  },
  {
    text: 'NFTs',
  },
];
const ClaimDialog: FC<ClaimDialogProps> = memo(({ onClose, onSubmit }) => {
  const [flag, setFlag] = useState<boolean>();
  const [activeTab, setActiveTab] = useState<string>('Badges');
  const handleSubmit = () => {
    onSubmit();
  };
  const handleChangeTab = useCallback((val: string) => {
    setActiveTab(val);
  }, []);
  const queryIfWin = async () => {
    const { mysteryBoxRewards } = await chrome.storage.local.get([
      'mysteryBoxRewards',
    ]);
    setFlag(true);
  };
  useEffect(() => {
    queryIfWin();
  }, []);
  return (
    <PMask onClose={onClose}>
      <div className="padoDialog mysteryBoxRewardsDialog">
        <main>
          <h1>Rewards</h1>
          <div className="content">
            <PTabsNew
              onChange={handleChangeTab}
              value={activeTab}
              list={tabList}
            />
            {flag ? (
              <div className="rewardWrapper win">
                <img src={mysteryBoxReward} alt="" />
                <div className="descWrapper">1<sup>st</sup> Commemorative Badge</div>
              </div>
            ) : (
              <div className="rewardWrapper">
                <img src={mysteryBoxImg} alt="" />
                <div className="timeWrapper">5:24:00:00</div>
              </div>
            )}
          </div>
        </main>
        <button className="nextBtn" onClick={handleSubmit}>
          <span>OK</span>
        </button>
      </div>
    </PMask>
  );
});
export default ClaimDialog;
