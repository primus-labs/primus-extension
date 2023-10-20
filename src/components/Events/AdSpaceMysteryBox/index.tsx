import React, { FC, memo } from 'react';
import iconRightArrow from '@/assets/img/rightArrow.svg';
import bannerIllstration from '@/assets/img/events/bannerIllstration.svg';
import './index.sass';

interface AdSpaceProps {
  onClick: () => void;
}
const AdSpace: FC<AdSpaceProps> = memo(({ onClick }) => {
  return (
    <div className="adSpace adSpace1">
      <div className="left">
        <img src={bannerIllstration} alt="" />
        <div className="bannerContent">
          <h3 className="ct">1000 USDT Lucky Draw for Product Debut</h3>
          <div className="cn">
            <p>
              Limited commemorative badges for the 1st group PADO loyal members
            </p>
            <p>2023.10.23~2023.10.29</p>
          </div>
        </div>
      </div>
      <button className="right" onClick={onClick}>
        <span>Join Now</span>
        <img src={iconRightArrow} alt="" className="suffix" />
      </button>
    </div>
  );
});
export default AdSpace;
