import React, { memo, useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { Dispatch } from 'react';
import RewardsDialog from '@/components/RewardsDialog';
import ClaimWrapper from '../ClaimWrapper';
import ClaimMysteryBoxWrapper from '../ClaimMysteryBoxWrapper';
import RewardList from '../RewardList';
import AdSpace from '../AdSpace';
import AdSpaceMysteryBox from '../AdSpaceMysteryBox';
import './index.sass';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import type { UserState } from '@/types/store';

import Slider from 'react-slick';

const EventsOverview = memo(() => {
  const dispatch: Dispatch<any> = useDispatch();
  const [searchParams] = useSearchParams();
  const Badges = searchParams.get('Badges');
  var settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    pauseOnHover: true,
    nextArrow: <></>,
    prevArrow: <></>,
  };
  const [claimVisible, setClaimVisible] = useState<boolean>(false);
  const [claimMysteryBoxVisible, setClaimMysteryBoxVisible] =
    useState<boolean>(false);
  const rewardsDialogVisible = useSelector(
    (state: UserState) => state.rewardsDialogVisible
  );
  const navigate = useNavigate();
  const onCloseClaimDialog = useCallback(() => {
    setClaimVisible(false);
  }, []);
  const handleClickClaim = useCallback(() => {
    setClaimVisible(true);
  }, []);
  const onCloseClaimMysteryBoxDialog = useCallback(() => {
    setClaimMysteryBoxVisible(false);
  }, []);
  const handleClickMysterybox = useCallback(() => {
    setClaimMysteryBoxVisible(true);
  }, []);
  const navToCred = useCallback(() => {
    navigate(`/cred?proofType=UNISWAP_PROOF`);
  }, [navigate]);
  
  useEffect(() => {
    !!Badges && setClaimMysteryBoxVisible(true);
  }, [Badges]);
  return (
    <div className="eventOverview">
      <div className="eventOverviewContent">
        {/* <Slider {...settings}> */}
        <AdSpaceMysteryBox onClick={handleClickMysterybox} />
        <AdSpace onClick={handleClickClaim} />
        {/* </Slider> */}
        {/* <section className="rewardsWrapper">
          <header>Rewards</header>
          <RewardList />
        </section> */}
      </div>
      <ClaimWrapper
        visible={claimVisible}
        onClose={onCloseClaimDialog}
        onSubmit={onCloseClaimDialog}
      />
      <ClaimMysteryBoxWrapper
        visible={claimMysteryBoxVisible}
        onClose={onCloseClaimMysteryBoxDialog}
        onSubmit={onCloseClaimMysteryBoxDialog}
      />
      {/* {rewardsDialogVisible && (
        <RewardsDialog
          onClose={onCloseRewardsDialog}
          onSubmit={onCloseRewardsDialog}
        />
      )} */}
    </div>
  );
});
export default EventsOverview;
