import React, { FC, memo } from 'react';
import iconRightArrow from '@/assets/img/rightArrow.svg';
import bannerIllstration from '@/assets/img/events/bannerIllstrationCeler.svg';
import './index.sass';

interface AdSpaceProps {
  onClick: () => void;
}
const AdSpace: FC<AdSpaceProps> = memo(({ onClick }) => {
  return (
    <div className="adSpace adSpace2">
      <div className="left">
        <img src={bannerIllstration} alt="" />
        <div className="bannerContent">
          <h3 className="ct">Get BrevisUni NFT！ </h3>
          <div className="cn">
            <p>
              <span className="label">Issuer:&nbsp;</span>
              <span className="value">Brevis</span>
            </p>
            <p>
              <span className="label">Claim:&nbsp;</span>
              <span className="value">
                Attested largest ETH/USDC Uniswap transaction on Ethereum since
                June 6, 2023
              </span>
            </p>
          </div>
        </div>
      </div>
      <button className="right" onClick={onClick}>
        <span>Join Now</span>
      </button>
    </div>
  );
});
export default AdSpace;
