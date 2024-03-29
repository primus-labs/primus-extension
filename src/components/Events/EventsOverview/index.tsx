import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { Dispatch } from 'react';
import dayjs from 'dayjs';
import { setEventsActionAsync, initEventsActionAsync } from '@/store/actions';
import useEventDetail from '@/hooks/useEventDetail';
import RewardsDialog from '@/components/RewardsDialog';
import ClaimWrapper from '../ClaimWrapper';
import ClaimMysteryBoxWrapper from '../ClaimMysteryBoxWrapper';
import ClaimMysteryBoxWrapper2 from '../ClaimMysteryBoxWrapper2';
import RewardList from '../RewardList';
import AdSpace from '../AdSpace';
import AdSpaceBAS from '../AdSpaceBAS';
import AdSpaceMysteryBox from '../AdSpaceMysteryBox';
import AdSpaceMysteryBox2 from '../AdSpaceMysteryBox2';
import AdSpaceMysteryBAS from '../AdSpaceMysteryBAS';
import AdSpaceLineaDeFiVoyage from '../AdSpaceLineaDeFiVoyage';
import AdSpaceEthSign from '../AdSpaceEthSign';
import ConnectWalletDialog from '@/components/Cred/CredSendToChainWrapper/ConnectWalletDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import './index.scss';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
// import { BADGELOTTRYTIMESTR } from '@/config/constants';
import type { UserState } from '@/types/store';
import type { ActiveRequestType } from '@/types/config';
import Slider from 'react-slick';
import {
  BASEVENTNAME,
  ETHSIGNEVENTNAME,
  DATASOURCEMAP,
} from '@/config/constants';
import { setRewardsDialogVisibleAction } from '@/store/actions';

const EventsOverview = memo(() => {
  const [BASEventDetail, BASEventPeriod, formatPeriod, ethSignEventActiveFlag] =
    useEventDetail(ETHSIGNEVENTNAME);
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

  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const scrollEventPeriod = useSelector(
    (state: UserState) => state.scrollEventPeriod
  );

  const scrollEventActiveFlag = useMemo(() => {
    const { startTime, endTime } = scrollEventPeriod;
    const isActive =
      dayjs().isAfter(dayjs(+startTime)) && dayjs().isBefore(dayjs(+endTime));
    const isEnd = dayjs().isAfter(dayjs(+endTime));
    if (isActive) {
      return 1;
    }
    if (isEnd) {
      return 2;
    }
    return 0;
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

  const initEvent = useCallback(
    async (eventName) => {
      let isLastFinished = false;
      const res = await chrome.storage.local.get([eventName]);
      const initFn = async () => {
        await chrome.storage.local.set({
          [eventName]: JSON.stringify({
            // status: 0, //  0:start 1:end(suc)
            steps: [
              {
                status: 0,
              },
              {
                status: 0,
              },
              {
                status: 0,
              },
            ],
          }),
        });
      };
      if (res[eventName]) {
        const lastInfo = JSON.parse(res[eventName]);
        isLastFinished = lastInfo.status === 1;
        if (isLastFinished) {
          await initFn();
        }
      } else {
        await initFn();
      }
      navigate(`/cred?fromEvents=${eventName}`);
    },
    [navigate]
  );
  const handleClickClaimBAS = useCallback(async () => {
    await initEvent(BASEVENTNAME);
  }, [navigate]);
  const handleClickAdEthSign = useCallback(async () => {
    await initEvent(ETHSIGNEVENTNAME);
  }, [initEvent]);
  const handleClickAdSpaceLineaDeFiVoyage = useCallback(async () => {
    navigate('/cred?fromEvents=LINEA_DEFI_VOYAGE');
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
  useEffect(() => {
    dispatch(initEventsActionAsync());
  }, [dispatch]);

  return (
    <div className="eventOverview">
      <div className="eventOverviewContent">
        {ethSignEventActiveFlag === 1 && (
          <AdSpaceEthSign onClick={handleClickAdEthSign} />
        )}

        <AdSpaceLineaDeFiVoyage onClick={handleClickAdSpaceLineaDeFiVoyage} />
        {ethSignEventActiveFlag === 3 && (
          <AdSpaceEthSign onClick={handleClickAdEthSign} />
        )}
        <AdSpaceMysteryBAS onClick={handleClickClaimBAS} />
        {/* <AdSpaceBAS onClick={handleClickClaimBAS} /> */}
        {/* <Slider {...settings}> */}

        {scrollEventActiveFlag === 1 && (
          <AdSpaceMysteryBox2 onClick={handleClickMysterybox2} />
        )}
        <AdSpace onClick={handleClickClaim} />
        {scrollEventActiveFlag === 2 && (
          <AdSpaceMysteryBox2 onClick={handleClickMysterybox2} />
        )}
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
