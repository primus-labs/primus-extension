import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';

import './index.scss';
import pointsEarnedIcon from '@/assets/newImg/achievements/pointsEarnedIcon.svg';
import pointsEarnedShareIcon from '@/assets/newImg/achievements/pointsEarnedShareIcon.svg';
import textCopyIcon from '@/assets/newImg/achievements/textCopyIcon.svg';
import { getUserInfo } from '@/services/api/achievements';
import copy from 'copy-to-clipboard';


type AchievementTopCardProps = {
  handleRewardsHistory: any,
  handleSharePoints: any,
  handleShareReferralCode: any,
  referralCode,
  totalScore,
  referrals,
  countedReferrals
}


const AchievementTopCard: React.FC<AchievementTopCardProps> = memo(({referralCode,totalScore,referrals,countedReferrals,handleRewardsHistory,handleSharePoints,handleShareReferralCode}) => {


  const copyReferralCodeFn = () => {
    copy(referralCode);
    alert('copy success');
  };


  return (
    <div className="pageAchievementTopCard">
      <div className="leftCard">
        <div className="pointsEarned">
          <div className="pointsEarned-text"><p>Points Earned</p></div>
          <div className="points-score">{totalScore}</div>
          <div className="reward-history" onClick={handleRewardsHistory}>
            <img className="reward-history-icon" src={pointsEarnedIcon} />
            <div className="reward-history-text">
              Rewards History
            </div>
          </div>
        </div>
        <div className="pointsShare">
          <div className="pointsShareText">Share on social media</div>
          <img className="pointsShareIcon" src={pointsEarnedShareIcon} />
        </div>
      </div>
      <div className="rightCard">
        <div className="referral">
          <div className={'referral-text'}>Referrals</div>
          <div className={'referral-times'}>{referrals}</div>
          <div className={'referral-counted-referrals'}>
            <div className={'referral-counted-referrals-text'}>Counted referrals</div>
            <div className={'referral-counted-referrals-count'}>{countedReferrals}</div>
          </div>
          <div className={'referral-code'}>
            <div className={'referral-code-text'}>Referral Code</div>
            <div className={'referral-code-main'}>
              <div className={'referral-code-main-text'}>{referralCode}</div>
              <img className={'referral-code-copy-ico'} src={textCopyIcon} onClick={copyReferralCodeFn}></img>
            </div>
          </div>
        </div>
        <div className={'referralShare'}>
          <div className={'referralShareText'}> Share on social media</div>
          <img className={'referralShareIcon'} src={pointsEarnedShareIcon}></img>
        </div>
      </div>
    </div>
  );
});

export default AchievementTopCard;