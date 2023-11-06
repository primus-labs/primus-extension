import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { Dispatch } from 'react';
import dayjs from 'dayjs';
import RewardsDialog from '@/components/RewardsDialog';
import ClaimWrapper from '../ClaimWrapper';
import ClaimMysteryBoxWrapper from '../ClaimMysteryBoxWrapper';
import ClaimMysteryBoxWrapper2 from '../ClaimMysteryBoxWrapper2';
import RewardList from '../RewardList';
import AdSpace from '../AdSpace';
import AdSpaceMysteryBox from '../AdSpaceMysteryBox';
import AdSpaceMysteryBox2 from '../AdSpaceMysteryBox2';
import './index.scss';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
// import { BADGELOTTRYTIMESTR } from '@/config/constants';
import type { UserState } from '@/types/store';

import Slider from 'react-slick';

const EventsOverview = memo(() => {
  const dispatch: Dispatch<any> = useDispatch();
  const [searchParams] = useSearchParams();
  const NFTsProcess = searchParams.get('NFTsProcess');
  const BadgesProcess = searchParams.get('BadgesProcess');
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
  const [claimMysteryBoxVisible2, setClaimMysteryBoxVisible2] =
    useState<boolean>(false);
  
  const badgeEventPeriod = useSelector(
    (state: UserState) => state.badgeEventPeriod
  );
  const BADGELOTTRYTIMESTR = useMemo(() => {
    const { startTime, endTime } = badgeEventPeriod;
    return +endTime;
  }, [badgeEventPeriod]);
  const badgeOpenFlag = useMemo(() => {
    const flag = dayjs().isBefore(dayjs(BADGELOTTRYTIMESTR));
    return flag;
  }, [BADGELOTTRYTIMESTR]);
  const navigate = useNavigate();
  const onCloseClaimDialog = useCallback(() => {
    setClaimVisible(false);
    navigate('/events');
  }, [navigate]);
  const handleClickClaim = useCallback(() => {
    setClaimVisible(true);
    
  }, []);
  const onCloseClaimMysteryBoxDialog = useCallback(() => {
    setClaimMysteryBoxVisible(false);
    navigate('/events');
  }, [navigate]);
  const onCloseClaimMysteryBoxDialog2 = useCallback(() => {
    setClaimMysteryBoxVisible2(false);
    navigate('/events');
  }, [navigate]);
  const handleClickMysterybox = useCallback(() => {
    setClaimMysteryBoxVisible(true);
  }, []);
  const handleClickMysterybox2 = useCallback(() => {
    setClaimMysteryBoxVisible2(true);
  }, []);
  const navToCred = useCallback(() => {
    navigate(`/cred?proofType=UNISWAP_PROOF`);
  }, [navigate]);

  useEffect(() => {
    if (NFTsProcess) {
      setClaimVisible(true);
    }
  }, [NFTsProcess]);
  useEffect(() => {
    if (BadgesProcess) {
      setClaimMysteryBoxVisible(true);
    }
  }, [BadgesProcess]);
  
  return (
    <div className="eventOverview">
      <div className="eventOverviewContent">
        {/* <Slider {...settings}> */}
        <AdSpaceMysteryBox2 onClick={handleClickMysterybox2} />
        <AdSpace onClick={handleClickClaim} />
        <AdSpaceMysteryBox onClick={handleClickMysterybox} />
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
      <ClaimMysteryBoxWrapper2
        visible={claimMysteryBoxVisible2}
        onClose={onCloseClaimMysteryBoxDialog2}
        onSubmit={onCloseClaimMysteryBoxDialog2}
      />
    </div>
  );
});
export default EventsOverview;
