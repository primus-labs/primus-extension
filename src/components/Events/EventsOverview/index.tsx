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
import ConnectWalletDialog from '@/components/Cred/CredSendToChainWrapper/ConnectWalletDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import './index.scss';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
// import { BADGELOTTRYTIMESTR } from '@/config/constants';
import type { UserState } from '@/types/store';
import type { ActiveRequestType } from '@/types/config';
import Slider from 'react-slick';
import { DATASOURCEMAP } from '@/config/constants';
import { setRewardsDialogVisibleAction } from '@/store/actions';
const EventsOverview = memo(() => {
  const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
  const [processDialogVisible, setProcessDialogVisible] = useState<boolean>();
  const [connectDialogVisible, setConnectDialogVisible] = useState<boolean>();
  const dispatch: Dispatch<any> = useDispatch();
  const [searchParams] = useSearchParams();
  const NFTsProcess = searchParams.get('NFTsProcess');
  const BadgesProcess = searchParams.get('BadgesProcess');
  const ScrollProcess = searchParams.get('ScrollProcess');
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
 
  const scrollEventPeriod = useSelector(
    (state: UserState) => state.scrollEventPeriod
  );
  
  const scrollEventActiveFlag = useMemo(() => {
    const { startTime, endTime } = scrollEventPeriod;
    const isActive = dayjs().isAfter(dayjs(+startTime)) && dayjs().isBefore(dayjs(+endTime));
    const isEnd = dayjs().isAfter(dayjs(+endTime))
    if (isActive) {
      return 1
    }
    if (isEnd) {
      return 2
    }
    return 0
  }, [scrollEventPeriod]);
    
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
  
  const handleClickMysterybox = useCallback(() => {
    setClaimMysteryBoxVisible(true);
  }, []);
  const handleClickMysterybox2 = useCallback(async () => {
    
    const { scrollEvent } = await chrome.storage.local.get(['scrollEvent']);
    const scrollEventObj = scrollEvent ? JSON.parse(scrollEvent) : {};
   
    if (scrollEventObj?.finishFlag) {
      dispatch(
        setRewardsDialogVisibleAction({
          visible: true,
          tab: 'Badges',
        })
      );
    } else {
      navigate(`/cred?fromEvents=Scroll`);
    }
  }, [navigate, dispatch]);
  
  

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
  useEffect(() => {
    if (ScrollProcess) {
      if (ScrollProcess === 'suc') {
        dispatch(
          setRewardsDialogVisibleAction({
            visible: true,
            tab: 'Badges',
          })
        );
      } else {
        setClaimMysteryBoxVisible2(true);
      }
    }
  }, [ScrollProcess, dispatch]);
  

  return (
    <div className="eventOverview">
      <div className="eventOverviewContent">
        {/* <Slider {...settings}> */}
        {scrollEventActiveFlag === 1 && <AdSpaceMysteryBox2 onClick={handleClickMysterybox2} />}
        <AdSpace onClick={handleClickClaim} />
        {scrollEventActiveFlag === 2 && <AdSpaceMysteryBox2 onClick={handleClickMysterybox2} />}
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

      {/* {connectDialogVisible && (
        <ConnectWalletDialog
          onClose={() => {
            setConnectDialogVisible(false);
          }}
          onSubmit={handleSubmitConnectWallet}
        />
      )}

      {processDialogVisible && (
        <AddSourceSucDialog
          type={activeRequest?.type}
          title={activeRequest?.title}
          desc={activeRequest?.desc}
          activeSource={DATASOURCEMAP['onChain']}
          onClose={handleCloseMask}
          onSubmit={onSubmitProcessDialog}
        />
      )} */}
    </div>
  );
});
export default EventsOverview;
