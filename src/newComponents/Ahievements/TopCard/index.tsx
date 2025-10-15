import React, { memo } from 'react';

import './index.scss';
import copy from 'copy-to-clipboard';
import useMsgs from '@/hooks/useMsgs';
import PButton from '@/newComponents/PButton';
type AchievementTopCardProps = {
  handleRewardsHistory: any;
  handleShareReferralCode: any;
  referralCode;
  totalScore;
  referrals;
  countedReferrals;
};

const AchievementTopCard: React.FC<AchievementTopCardProps> = memo(
  ({
    referralCode,
    totalScore,
    referrals,
    countedReferrals,
    handleRewardsHistory,
    handleShareReferralCode,
  }) => {
    const { msgs, addMsg } = useMsgs();

    const copyReferralCodeFn = () => {
      const copyDetail = `Download and install the Primus Chrome extension from https://primuslabs.xyz/. Remember to sign up and fill in my referral code ${referralCode}  to earn extra points.`;
      copy(copyDetail);

      addMsg({
        type: 'suc',
        title: 'Copied',
        link: '',
      });
    };

    return (
      <div className="pageAchievementTopCard">
        <div className="leftCard">
          <div className={'points-text-line'}>
            <div className="pointsEarned-text">
              <p>Points Earned</p>
            </div>
          </div>
          <div className="pointsEarned">
            <div className="points-score">{totalScore}</div>
            <div className="reward-history" onClick={handleRewardsHistory}>
              {/* <img className="reward-history-icon" src={pointsEarnedIcon} /> */}
              <i className="iconfont icon-pointsEarnedIcon1 reward-history-icon"></i>
              <div className="reward-history-text">Rewards History</div>
            </div>
          </div>
        </div>
        <div className="rightCard">
          <div className={'referral-text-line'}>
            <div className={'referral-text'}>Referrals</div>
          </div>
          <div className={'referral-times'}>{referrals}</div>
          <div className="referral">
            <div className={'referral-counted-referrals'}>
              <div className={'referral-counted-referrals-text'}>
                Counted referrals
              </div>
              <div className={'referral-counted-referrals-count'}>
                {countedReferrals}
              </div>
            </div>
            <div className={'referral-code'}>
              <div className={'referral-code-text'}>Referral Code</div>
              <div className={'referral-code-main'}>
                <div className={'referral-code-main-text'}>{referralCode}</div>
                <PButton
                  type="icon"
                  className={'referral-code-copy-ico'}
                  icon={<i className="iconfont icon-iconCopy"></i>}
                  onClick={copyReferralCodeFn}
                />
                {/*<img className={'referral-code-copy-ico'} src={textCopyIcon} onClick={copyReferralCodeFn}></img>*/}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default AchievementTopCard;
