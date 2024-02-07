import React, { memo, useCallback } from 'react';
import PButton from '@/newComponents/PButton';
import './index.scss';
interface PBackProps {}
const Banner: React.FC = memo(({}) => {
  const handleJoin = useCallback(() => {}, []);
  return (
    <div className="homeBanner">
      <div className="content">
        <div className="intro">
          <div className="brief">
            <h1>BNBChain Attestation Alliance</h1>
            <h3>
              Bringing more traditional data attestations to the BNB ecosystem.
              Finish simple tasks to win your XP！
            </h3>
          </div>
          <div className="desc">
            <div className="left">
              <div className="iconfont icon-iconDelete"></div>
              <span>BAS XP</span>
            </div>
            <div className="right">
              <div className="iconfont icon-iconDelete"></div>
              <span>Jan.24 - Feb.14</span>
            </div>
          </div>
        </div>
        <PButton
          text="Join now"
          type="primary"
          size="m"
          className="joinBtn"
          onClick={handleJoin}
        />
      </div>
    </div>
  );
});

export default Banner;
