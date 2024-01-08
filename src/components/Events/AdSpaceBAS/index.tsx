import React, { FC, memo, useEffect } from 'react';
import nftIllstration from '@/assets/img/events/nftIllstration.png';
import PButton from '@/components/PButton';

interface AdSpaceProps {
  onClick: () => void;
}
const AdSpace: FC<AdSpaceProps> = memo(({ onClick }) => {
  
  return (
    <div className="adSpace adSpaceNft">
      <div className="left">
        <img src={nftIllstration} alt="" />
        <div className="bannerContent">
          <h3 className="ct">BAS Event: Proof of Humanity</h3>
          <div className="cn">
            <p>Get an attestation with ....</p>
          </div>
        </div>
      </div>
      <PButton className="claimBtn" text="Join Now" onClick={onClick} />
    </div>
  );
});
export default AdSpace;
