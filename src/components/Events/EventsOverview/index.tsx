import React, { memo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ClaimWrapper from '../ClaimWrapper';
import RewardList from '../RewardList';
import AdSpace from '../AdSpace';
import AdSpace2 from '../AdSpace2';
import './index.sass';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import Slider from 'react-slick';

const EventsOverview = memo(() => {
  var settings = {
    // dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    pauseOnHover: true,
    nextArrow: <></>,
    prevArrow: <></>,
  };
  const [claimVisible, setClaimVisible] = useState<boolean>(false);
  const navigate = useNavigate()
  const onCloseClaimDialog = useCallback(() => {
    setClaimVisible(false);
  }, []);
  const handleClickClaim = useCallback(() => {
    setClaimVisible(true)
  }, [])
  const navToCred = useCallback(() => {
    navigate(`/cred?proofType=UNISWAP_PROOF`);
  }, [navigate]);
  return (
    <div className="eventOverview">
      <div className="eventOverviewContent">
        <Slider {...settings}>
          <AdSpace onClick={handleClickClaim} />
          <AdSpace2 onClick={navToCred} />
        </Slider>
        <section className="rewardsWrapper">
          <header>Rewards</header>
          <RewardList />
        </section>
      </div>
      <ClaimWrapper
        visible={claimVisible}
        onClose={onCloseClaimDialog}
        onSubmit={onCloseClaimDialog}
      />
    </div>
  );
});
export default EventsOverview;
