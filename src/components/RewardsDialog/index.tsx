import React, {
  FC,
  memo,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import dayjs from 'dayjs';
import PButton from '@/components/PButton';
import RewardItem from '@/components/Events/RewardList/RewardItem';
import PMask from '@/components/PMask';
import PTabsNew from '@/components/PTabsNew';
import mysteryBoxImg from '@/assets/img/events/mysteryBoxImg.svg';
import mysteryBoxFailImg from '@/assets/img/events/mysteryBoxFailImg.svg';
import mysteryBoxReward from '@/assets/img/events/mysteryBoxReward.svg';
import iconEmpty from '@/assets/img/layout/iconEmpty.svg';
import './index.scss';
import { setRewardsDialogVisibleAction } from '../../store/actions/index';
import { useSelector } from 'react-redux';
import useInterval from '@/hooks/useInterval';
import { checkLotteryResults } from '@/services/api/event';
import { SCROLLEVENTNAME } from '@/config/constants';
import type { UserState } from '@/types/store';
import type { RewardList } from '@/types/event';
interface ClaimDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}
const tabList = [
  {
    text: 'Badges',
  },
  {
    text: 'NFTs',
  },
];

const ClaimDialog: FC<ClaimDialogProps> = memo(({ onClose, onSubmit }) => {
  const badgeEventPeriod = useSelector(
    (state: UserState) => state.badgeEventPeriod
  );
  const scrollEventPeriod = useSelector(
    (state: UserState) => state.scrollEventPeriod
  );

  const BADGELOTTRYTIMESTR = useMemo(() => {
    const { startTime, endTime } = scrollEventPeriod;
    return +endTime;
  }, [scrollEventPeriod]);
  // const badgeOpenFlag = useMemo(() => {
  //   const flag = dayjs().isBefore(dayjs(BADGELOTTRYTIMESTR));
  //   return flag;
  // }, [BADGELOTTRYTIMESTR]);

  const [diffTime, setDiffTime] = useState<any>();
  const [tickSwitchFlag, setTickSwitchFlag] = useState<boolean>(false);
  const [joinedBadgeFlag, setJoinedBadgeFlag] = useState<boolean>(false);
  const [joinedScrollFlag, setJoinedScrollFlag] = useState<boolean>(false);

  const [BadgeLottryResult, setBadgeLottryResult] = useState<any>();
  const [scrollLottryResult, setScrollLottryResult] = useState<any>();
  const [activeTab, setActiveTab] = useState<string>('Badges');
  const rewardsDialogVisible = useSelector(
    (state: UserState) => state.rewardsDialogVisible
  );
  const rewards = useSelector((state: UserState) => state.rewards);

  const rewardList: RewardList = useMemo(() => {
    return Object.values(rewards);
  }, [rewards]);
  const joinedNFTsFlag = useMemo(() => {
    return rewardList.find((r) => !r.type);
  }, [rewardList]);
  const joinedBrevisFlag = useMemo(() => {
    return rewardList.find((r) => r?.event === 'brevis');
  }, [rewardList]);
  
  const emptyEl = useMemo(() => {
    return (
      <div className="emptyWrapper">
        <img src={iconEmpty} alt="" />
        <p>Completing tasks in the Event page to get your rewards.</p>
      </div>
    );
  }, []);
  const tickFn = () => {
    const diffStamp = dayjs(BADGELOTTRYTIMESTR).diff(dayjs());
    if (diffStamp <= 0) {
      setTickSwitchFlag(false);
      setDiffTime('loading...');
    } else {
      const d = dayjs(BADGELOTTRYTIMESTR).diff(dayjs(), 'day');
      const h = dayjs(BADGELOTTRYTIMESTR).diff(dayjs(), 'hour');
      const m = dayjs(BADGELOTTRYTIMESTR).diff(dayjs(), 'minute');
      const s = dayjs(BADGELOTTRYTIMESTR).diff(dayjs(), 'second');
      const formatD = ((d % 365) + '').padStart(2, '0');
      const formatH = ((h % 24) + '').padStart(2, '0');
      const formatM = ((m % 60) + '').padStart(2, '0');
      const formatS = ((s % 60) + '').padStart(2, '0');
      setDiffTime(`${formatD} : ${formatH} : ${formatM} : ${formatS}`);
    }
  };
  useInterval(tickFn, 1000, tickSwitchFlag, true);
  const handleSubmit = () => {
    onSubmit();
  };
  const handleChangeTab = useCallback((val: string) => {
    setActiveTab(val);
  }, []);
  const queryIfJoined = async () => {
    const { mysteryBoxRewards, scrollEvent } = await chrome.storage.local.get([
      'mysteryBoxRewards',
      'scrollEvent',
    ]);
    setJoinedBadgeFlag(!!mysteryBoxRewards);
    const scrollEventObj = scrollEvent ? JSON.parse(scrollEvent) : {};
    const joinFlag = !!scrollEventObj?.finishFlag;
    setJoinedScrollFlag(!!joinFlag);
  };
  const fetchLotteryResults = useCallback(async () => {
    if (dayjs().isAfter(dayjs(+badgeEventPeriod.endTime))) {
      const { rc, result } = await checkLotteryResults({
        event: 'PRODUCT_DEBUT',
      });
      if (rc === 0) {
        setBadgeLottryResult({
          result: result.result,
          icon: result.iconUrl,
        });
      }
    }
    if (dayjs().isAfter(dayjs(+scrollEventPeriod.endTime))) {
      const { rc, result } = await checkLotteryResults({
        event: SCROLLEVENTNAME,
      });
      if (rc === 0) {
        setScrollLottryResult({
          result: result.result,
          icon: result.iconUrl,
        });
      }
    }
  }, [badgeEventPeriod.endTime, scrollEventPeriod.endTime]);
  useEffect(() => {
    if (rewardsDialogVisible?.visible) {
      // queryIfJoined();
      rewardsDialogVisible?.tab && setActiveTab(rewardsDialogVisible?.tab);
      setTickSwitchFlag(true);
    }
  }, [rewardsDialogVisible]);
  useEffect(() => {
    fetchLotteryResults();
  }, [fetchLotteryResults]);

  const showBadgeFn = useCallback(
    (
      joinFlag: boolean,
      startTime: number,
      endTime: number,
      result: boolean
    ) => {
      // Started but not ended
      const flag1 =
        joinFlag &&
        dayjs().isAfter(dayjs(startTime)) &&
        dayjs().isBefore(dayjs(endTime));
      const flag2 = dayjs().isAfter(dayjs(endTime)) && result;
      // const flag3 = dayjs().isAfter(dayjs(endTime)) && !result;
     
      if (flag1) {
        return 1;
      }
      if (flag2) {
        return 2;
      }
      // if (flag3) {
      //   return 3;
      // }
      return 0;
    },
    []
  );
  const showItemFlag = useMemo(() => {
    const flagNum = showBadgeFn(
      joinedBadgeFlag,
      +badgeEventPeriod.startTime,
      +badgeEventPeriod.endTime,
      BadgeLottryResult?.result
    );
    return flagNum;
  }, [badgeEventPeriod, BadgeLottryResult, showBadgeFn, joinedBadgeFlag]);
  const showItemFlag2 = useMemo(() => {
    const flagNum = showBadgeFn(
      joinedScrollFlag,
      +scrollEventPeriod.startTime,
      +scrollEventPeriod.endTime,
      scrollLottryResult?.result
    );
    return flagNum;
  }, [scrollEventPeriod, scrollLottryResult, showBadgeFn, joinedScrollFlag]);
  useEffect(() => {
    rewardsDialogVisible?.visible && queryIfJoined();
  }, [rewardsDialogVisible?.visible]);
  return (
    <>
      {rewardsDialogVisible?.visible && (
        <PMask onClose={onClose}>
          <div className="padoDialog mysteryBoxRewardsDialog">
            <main>
              <header>
                <h1>Rewards</h1>
              </header>
              <div className="content">
                <PTabsNew
                  onChange={handleChangeTab}
                  value={activeTab}
                  list={tabList}
                />
                {activeTab === 'Badges' && (
                  <ul className="BadgesList">
                    {!!showItemFlag && (
                      <li>
                        {showItemFlag === 1 && (
                          <div className="rewardWrapper a">
                            <img src={mysteryBoxImg} alt="" />
                            <div className="timeWrapper">{diffTime}</div>
                          </div>
                        )}
                        {showItemFlag === 2 && (
                          <div className="rewardWrapper win a">
                            <img src={BadgeLottryResult.icon} alt="" />
                            <div className="descWrapper">
                              1<sup>st</sup> Commemorative Badge
                            </div>
                          </div>
                        )}
                        {/* {showItemFlag === 3 && (
                          <div className="rewardWrapper fail a">
                            <img src={mysteryBoxFailImg} alt="" className="" />
                            <div className="timeWrapper">00:00:00</div>
                          </div>
                        )} */}
                      </li>
                    )}
                    {!!showItemFlag2 && (
                      <li>
                        {showItemFlag2 === 1 && (
                          <div className="rewardWrapper d">
                            <img src={mysteryBoxImg} alt="" />
                            <div className="timeWrapper">{diffTime}</div>
                          </div>
                        )}
                        {showItemFlag2 === 2 && (
                          <div className="rewardWrapper win d">
                            <img src={scrollLottryResult.icon} alt="" />
                            <div className="descWrapper">
                              Scroll zkAttestation Medal
                            </div>
                          </div>
                        )}
                        {/* {showItemFlag2 === 3 && (
                          <div className="rewardWrapper fail d">
                            <img src={mysteryBoxFailImg} alt="" className="" />
                            <div className="timeWrapper">00:00:00</div>
                          </div>
                        )} */}
                      </li>
                    )}
                    {!!joinedBrevisFlag && (
                      <li>
                        <div className="rewardWrapper win d">
                          <img src={joinedBrevisFlag.image} alt="" />
                          <div className="descWrapper">BrevisUniNFT Badge</div>
                        </div>
                      </li>
                    )}
                    {!showItemFlag &&
                      !showItemFlag2 &&
                      !joinedBrevisFlag &&
                      emptyEl}
                  </ul>
                )}
                {activeTab === 'NFTs' && (
                  <>
                    {!!joinedNFTsFlag ? (
                      <RewardItem item={joinedNFTsFlag} />
                    ) : (
                      emptyEl
                    )}
                  </>
                )}
              </div>
            </main>
            <PButton text="OK" onClick={handleSubmit} />
          </div>
        </PMask>
      )}
    </>
  );
});
export default ClaimDialog;
