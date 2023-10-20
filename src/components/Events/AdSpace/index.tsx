import React, { FC, memo } from 'react';
import iconRightArrow from '@/assets/img/rightArrow.svg';
import nftIllstration from '@/assets/img/events/nftIllstration.svg';
import './index.sass';

interface AdSpaceProps {
  onClick: () => void;
}
const AdSpace: FC<AdSpaceProps> = memo(({ onClick }) => {
  return (
    <div className="adSpace adSpaceNft">
      <div className="left">
        <img src={nftIllstration} alt="" />
        <div className="bannerContent">
          <h3 className="ct">Early Bird NFT Rewards </h3>
          <div className="cn">
            <p>Connect API Data, make an attestation and submit it on-chain.</p>
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
