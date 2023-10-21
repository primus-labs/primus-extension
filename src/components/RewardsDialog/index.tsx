import React, {
  FC,
  memo,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import dayjs from 'dayjs';
import RewardItem from '@/components/events/RewardList/RewardItem';
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
const BADGELOTTRYTIMESTR = '2023-10-29 12:00:00';
const ClaimDialog: FC<ClaimDialogProps> = memo(({ onClose, onSubmit }) => {
  const [diffTime, setDiffTime] = useState<any>();
  const [tickSwitchFlag, setTickSwitchFlag] = useState<boolean>(false);
  const [joinedBadgeFlag, setJoinedBadgeFlag] = useState<boolean>();
  const [BadgeLottryResult, setBadgeLottryResult] = useState<any>();
  const [activeTab, setActiveTab] = useState<string>('Badges');
  const rewardsDialogVisible = useSelector(
    (state: UserState) => state.rewardsDialogVisible
  );
  const rewards = useSelector((state: UserState) => state.rewards);

  const rewardList: RewardList = useMemo(() => {
    return Object.values(rewards);
  }, [rewards]);
  const joinedNFTsFlag = useMemo(() => {
    return rewardList.length > 0;
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
    const { mysteryBoxRewards } = await chrome.storage.local.get([
      'mysteryBoxRewards',
    ]);
    setJoinedBadgeFlag(!!mysteryBoxRewards);
  };
  const fetchLotteryResults = async () => {
    const diffStamp = dayjs(BADGELOTTRYTIMESTR).diff(dayjs());
    if (diffStamp <= 0) {
        const { rc, result } = await checkLotteryResults({
          event: 'PRODUCT_DEBUT',
        });
        if (rc === 0) {
          setBadgeLottryResult({
            result: result.result,
            icon: result.iconUrl
          });
        }
    }
  };
  useEffect(() => {
    if (rewardsDialogVisible?.visible) {
      queryIfJoined();
      rewardsDialogVisible?.tab && setActiveTab(rewardsDialogVisible?.tab);
      setTickSwitchFlag(true);
    }
  }, [rewardsDialogVisible]);
  useEffect(() => {
    !tickSwitchFlag && fetchLotteryResults();
  }, [tickSwitchFlag]);
  useEffect(() => {
    if (BadgeLottryResult) {
      if (!BadgeLottryResult.result) {
        return () => {
          chrome.storage.local.remove(['mysteryBoxRewards']);
        }
      }
    }
  }, [BadgeLottryResult]);

  return (
    <>
      {rewardsDialogVisible?.visible && (
        <PMask onClose={onClose}>
          <div className="padoDialog mysteryBoxRewardsDialog">
            <main>
              <h1>Rewards</h1>
              <div className="content">
                <PTabsNew
                  onChange={handleChangeTab}
                  value={activeTab}
                  list={tabList}
                />
                {activeTab === 'Badges' && (
                  <>
                    {joinedBadgeFlag ? (
                      <>
                        {BadgeLottryResult ? (
                          <>
                            {BadgeLottryResult.result ? (
                              <div className="rewardWrapper win">
                                <img src={BadgeLottryResult.icon} alt="" />
                                <div className="descWrapper">
                                  1<sup>st</sup> Commemorative Badge
                                </div>
                              </div>
                            ) : (
                              <div className="rewardWrapper">
                                <img src={mysteryBoxFailImg} alt="" className=""/>
                                <div className="timeWrapper">00:00:00</div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="rewardWrapper">
                            <img src={mysteryBoxImg} alt="" />
                            <div className="timeWrapper">{diffTime}</div>
                          </div>
                        )}
                      </>
                    ) : (
                      emptyEl
                    )}
                  </>
                )}
                {activeTab === 'NFTs' && (
                  <>
                    {joinedNFTsFlag ? (
                      <RewardItem item={rewardList[0]} />
                    ) : (
                      emptyEl
                    )}
                  </>
                )}
              </div>
            </main>
            <button className="nextBtn" onClick={handleSubmit}>
              <span>OK</span>
            </button>
          </div>
        </PMask>
      )}
    </>
  );
});
export default ClaimDialog;
