import React, {
  FC,
  memo,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import dayjs from 'dayjs';
import PMask from '@/components/PMask';
import PTabsNew from '@/components/PTabsNew';
import mysteryBoxImg from '@/assets/img/events/mysteryBoxImg.svg';
import mysteryBoxReward from '@/assets/img/events/mysteryBoxReward.svg';
import iconEmpty from '@/assets/img/layout/iconEmpty.svg';
import './index.scss';
import { setRewardsDialogVisibleAction } from '../../store/actions/index';
import { useSelector } from 'react-redux';
import useInterval from '@/hooks/useInterval'
import type { UserState } from '@/types/store';

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
  const [diffTime, setDiffTime] = useState<any>();
  const [tickSwitchFlag, setTickSwitchFlag] = useState<boolean>(false);
  const [joinedBadgeFlag, setJoinedBadgeFlag] = useState<boolean>();
  const [activeTab, setActiveTab] = useState<string>('Badges');
  const rewardsDialogVisible = useSelector(
    (state: UserState) => state.rewardsDialogVisible
  );
  const rewards = useSelector((state: UserState) => state.rewards);
  // console.log('rewards', rewards);

  const joinedNFTsFlag = useMemo(() => {
    return Object.values(rewards).length > 0;
  }, [rewards]);
  const emptyEl = useMemo(() => {
    return (
      <div className="emptyWrapper">
        <img src={iconEmpty} alt="" />
        <p>Completing tasks in the Event page to get your rewards.</p>
      </div>
    );
  }, []);
  const tickFn = () => {
    const d = dayjs('2023-10-29 12:00:00').diff(dayjs(),'day')
    const h = dayjs('2023-10-29 12:00:00').diff(dayjs(), 'hour');
    const m = dayjs('2023-10-29 12:00:00').diff(dayjs(), 'minute');
    const s = dayjs('2023-10-29 12:00:00').diff(dayjs(), 'second');
    const formatD = ((d % 365) + '').padStart(2,'0');
    const formatH = ((h % 24) + '').padStart(2, '0');
    const formatM = ((m % 60) + '').padStart(2, '0');
    const formatS = ((s % 60) + '').padStart(2, '0');
    setDiffTime(`${formatD} : ${formatH} : ${formatM} : ${formatS}`);
  }
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
  useEffect(() => {
    if (rewardsDialogVisible?.visible) {
      queryIfJoined();
      rewardsDialogVisible?.tab && setActiveTab(rewardsDialogVisible?.tab);
      setTickSwitchFlag(true)
    }
  }, [rewardsDialogVisible]);

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
                {/* TODO!!! */}
                {/* <div className="rewardWrapper win">
                        <img src={mysteryBoxReward} alt="" />
                        <div className="descWrapper">
                          1<sup>st</sup> Commemorative Badge
                        </div>
                      </div> */}
                {activeTab === 'Badges' && (
                  <>
                    {joinedBadgeFlag ? (
                      <div className="rewardWrapper">
                        <img src={mysteryBoxImg} alt="" />
                        <div className="timeWrapper">{diffTime}</div>
                      </div>
                    ) : (
                      emptyEl
                    )}
                  </>
                )}
                {activeTab === 'NFTs' && (
                  <>
                    {joinedNFTsFlag ? (
                      <div className="rewardWrapper win">
                        <img src={mysteryBoxReward} alt="" />
                        <div className="descWrapper">
                          1<sup>st</sup> Commemorative Badge
                        </div>
                      </div>
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
