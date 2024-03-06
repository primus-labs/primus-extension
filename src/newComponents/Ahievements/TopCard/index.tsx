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


const AchievementTopCard: React.FC<AchievementTopCardProps> = memo(({
                                                                      referralCode,
                                                                      totalScore,
                                                                      referrals,
                                                                      countedReferrals,
                                                                      handleRewardsHistory,
                                                                      handleSharePoints,
                                                                      handleShareReferralCode,
                                                                    }) => {


  const copyReferralCodeFn = () => {
    const copyDetail = `Download and install the PADO Chrome extension from https://padolabs.org/. Remember to sign up and fill in your referral code ${referralCode}  to earn extra points.`
    copy(copyDetail);

    alert('copy success');
  };


  return (
    <div className="pageAchievementTopCard">
      <div className="leftCard">

        <div className={'points-text-line'}>
          <div className="pointsEarned-text"><p>Points Earned</p></div>
          <div className="pointsShare" onClick={handleSharePoints}>
            <div className="pointsShareText">Share on social media</div>
            <img className="pointsShareIcon" src={pointsEarnedShareIcon} />
          </div>
        </div>
        <div className="pointsEarned">
          <div className="points-score">{totalScore}</div>
          <div className="reward-history" onClick={handleRewardsHistory}>
            <img className="reward-history-icon" src={pointsEarnedIcon} />
            <div className="reward-history-text">
              Rewards History
            </div>
          </div>
        </div>

      </div>
      <div className="rightCard">
        <div className={'referral-text-line'}>
          <div className={'referral-text'}>Referrals</div>
          <div className={'referralShare'} onClick={handleShareReferralCode}>
            <div className={'referralShareText'}> Share on social media</div>
            <img className={'referralShareIcon'} src={pointsEarnedShareIcon}></img>
          </div>
        </div>
        <div className="referral">
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
      </div>
    </div>
  );
});

export default AchievementTopCard;