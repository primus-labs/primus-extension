import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  memo,
  useRef,
} from 'react';

import './index.scss';
import pointsEarnedIcon from '@/assets/newImg/achievements/pointsEarnedIcon.svg';
import pointsEarnedShareIcon from '@/assets/newImg/achievements/pointsEarnedShareIcon.svg';
import shareHover from '@/assets/newImg/achievements/shareHover.svg';
import textCopyIcon from '@/assets/newImg/achievements/textCopyIcon.svg';
import { getUserInfo } from '@/services/api/achievements';
import copy from 'copy-to-clipboard';
import useMsgs from '@/hooks/useMsgs';
import PButton from '@/newComponents/PButton';
import Icon from 'antd/lib/icon';
import ShareButton from '@/newComponents/Ahievements/TopCard/ShareButton';

type AchievementTopCardProps = {
  handleRewardsHistory: any;
  handleSharePoints: any;
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
    handleSharePoints,
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
            <div className="pointsShare">
              <span className={'pointsShareText'}>Share on social media</span>
              <PButton
                className="referralShareIcon"
                type="icon"
                icon={<i className="iconfont icon-iconShareActive"></i>}
                onClick={handleSharePoints}
              />
              {/*<ShareButton imgHover={shareHover} img={pointsEarnedShareIcon} onClick={handleSharePoints} btnDesc={"Share on social media"}/>*/}
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
            <div className={'referralShare'}>
              <span className={'referralShareText'}>Share on social media</span>
              <PButton
                className="referralShareIcon"
                type="icon"
                icon={<i className="iconfont icon-iconShareActive"></i>}
                onClick={handleShareReferralCode}
              />
              {/*<ShareButton imgHover={shareHover} img={pointsEarnedShareIcon} onClick={handleShareReferralCode} btnDesc={"Share on social media"}/>*/}
            </div>
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
