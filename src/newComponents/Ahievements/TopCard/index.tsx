import React, {memo} from "react";

import './index.scss';
import pointsEarnedIcon from "@/assets/newImg/achievements/pointsEarnedIcon.svg"
import pointsEarnedShareIcon from "@/assets/newImg/achievements/pointsEarnedShareIcon.svg"
import textCopyIcon from "@/assets/newImg/achievements/textCopyIcon.svg"

const AchievementTopCard = memo(() => {
    const handleRewardsHistory = () => {
        // eslint-disable-next-line no-undef
        alert("handler")
    }
    return (
        <div className="pageAchievementTopCard">
            <div className="leftCard">
                <div className="pointsEarned">
                    <div className="pointsEarned-text"><p>Points Earned</p></div>
                    <div className="points-score">12,300</div>
                    <div className="reward-history" onClick={handleRewardsHistory}>
                        <img className="reward-history-icon" src={pointsEarnedIcon}/>
                        <div className="reward-history-text">
                            Rewards History
                        </div>
                    </div>
                </div>
                <div className="pointsShare">
                    <div className="pointsShareText">Share on social media</div>
                    <img className="pointsShareIcon" src={pointsEarnedShareIcon}/>
                </div>
            </div>
            <div className="rightCard">
                <div className="referral">
                    <div className={"referral-text"}>Referrals</div>
                    <div className={"referral-times"}>23</div>
                    <div className={"referral-counted-referrals"}>
                        <div className={"referral-counted-referrals-text"}>Counted referrals</div>
                        <div className={"referral-counted-referrals-count"}>5</div>
                    </div>
                    <div className={"referral-code"}>
                        <div className={"referral-code-text"}>Referral Code</div>
                        <div className={"referral-code-main"}>
                            <div className={"referral-code-main-text"}>qazxswe</div>
                            <img className={"referral-code-copy-ico"} src={textCopyIcon}></img>
                        </div>
                    </div>
                </div>
                <div className={"referralShare"}>
                    <div className={"referralShareText"}> Share on social media</div>
                    <img className={"referralShareIcon"} src={pointsEarnedShareIcon}></img>
                </div>
            </div>
        </div>
    );
});

export default AchievementTopCard;