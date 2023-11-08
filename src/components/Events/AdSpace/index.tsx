import React, { FC, memo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { Dispatch } from 'react';
import iconRightArrow from '@/assets/img/rightArrow.svg';
import nftIllstration from '@/assets/img/events/nftIllstration.svg';
import PButton from '@/components/PButton';
import './index.scss';
import { setBadgeEventPeriodActionAsync } from '@/store/actions';

interface AdSpaceProps {
  onClick: () => void;
}
const AdSpace: FC<AdSpaceProps> = memo(({ onClick }) => {
  const dispatch: Dispatch<any> = useDispatch();
  useEffect(() => {
    dispatch(setBadgeEventPeriodActionAsync());
  }, [dispatch]);
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
      <PButton className="claimBtn" text="Claim Now" onClick={onClick}/>
    </div>
  );
});
export default AdSpace;
