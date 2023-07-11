import React, { memo } from 'react';
import iconRightArrow from '@/assets/img/rightArrow.svg';
import bannerIllstration from '@/assets/img/events/bannerIllstration.svg';
import './index.sass';

const EventsOverview = memo(() => {
  return (
    <div className="eventOverview">
      <div className="banner">
        <div className="left">
          <img src={bannerIllstration} alt="" />
          <div className="content">
            <h3 className="ct">Get on-boarding rewards! </h3>
            <div className="cn">
              <p>
                <div className="label">Issuer:&nbsp;</div>
                <div className="value">PADO Labs</div>
              </p>
              <p>
                <div className="label">Requirement:&nbsp;</div>
                <div className="value">
                  Connect to any data source, generate a proof, and provide it
                  on-chain!
                </div>
              </p>
            </div>
          </div>
        </div>
        <button className="right">
          <span>Claim Now</span>
          <img src={iconRightArrow} alt="" className="suffix" />
        </button>
      </div>
      <section className="rewardsWrapper">
        <header>Rewards</header>
      </section>
    </div>
  );
});
export default EventsOverview;
