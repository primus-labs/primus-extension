import React, {
  FC,
  memo,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import PButton from '@/components/PButton';
import iconRightArrow from '@/assets/img/rightArrow.svg';
import bannerIllstration from '@/assets/img/events/luckyDrawIllstration.svg';
import './index.scss';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import { setRewardsDialogVisibleAction } from '@/store/actions';
import { checkLotteryResults } from '@/services/api/event';
interface AdSpaceProps {
  onClick: () => void;
}
dayjs.extend(utc);
const AdSpace: FC<AdSpaceProps> = memo(({ onClick }) => {
  const [BadgeLottryResult, setBadgeLottryResult] = useState<any>();
  const dispatch: Dispatch<any> = useDispatch();
  const badgeEventPeriod = useSelector(
    (state: UserState) => state.badgeEventPeriod
  );
  const formatPeriod = useMemo(() => {
    const { startTime, endTime } = badgeEventPeriod;
    const s = dayjs.utc(+startTime).format('YYYY.MM.DD');
    const e = dayjs.utc(+endTime).format('YYYY.MM.DD');
    return `${s}~${e}`;
  }, [badgeEventPeriod]);

  const BADGELOTTRYTIMESTR = useMemo(() => {
    const { startTime, endTime } = badgeEventPeriod;
    return +endTime;
  }, [badgeEventPeriod]);
  const badgeOpenFlag = useMemo(() => {
    const flag = dayjs().isBefore(dayjs(BADGELOTTRYTIMESTR));
    return flag;
  }, [BADGELOTTRYTIMESTR]);
  const handleOnClick = useCallback(() => {
    if (BadgeLottryResult?.result) {
      dispatch(
        setRewardsDialogVisibleAction({
          visible: true,
          tab: 'Badges',
        })
      );
    }
  }, [BadgeLottryResult?.result, dispatch]);
  const fetchLotteryResults = useCallback(async () => {
    if (dayjs().isAfter(dayjs(BADGELOTTRYTIMESTR))) {
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
  }, [BADGELOTTRYTIMESTR]);

  useEffect(() => {
    fetchLotteryResults();
  }, [fetchLotteryResults]);

  return (
    <div className={`adSpace luckyDraw ${badgeOpenFlag ? '' : ' disabled'}`}>
      <div className="left">
        <img src={bannerIllstration} alt="" />
        <div className="bannerContent">
          <h3 className="ct">1000 USDT Lucky Draw for Product Debut</h3>
          <div className="cn">
            <p>
              Limited commemorative badges for the 1st group PADO loyal members
            </p>
            {/* <p>2023.10.23~2023.10.29</p> */}
            <p>{formatPeriod}</p>
          </div>
        </div>
      </div>
      {badgeOpenFlag ? (
        <PButton
          text="Join Now"
          suffix={<i className="iconfont icon-rightArrow"></i>}
          onClick={onClick}
        />
      ) : (
        <PButton
          text={BadgeLottryResult?.result ? 'Rewards' : 'Closed'}
          className={BadgeLottryResult?.result ? '' : 'disabled'}
          onClick={handleOnClick}
        />
      )}
    </div>
  );
});
export default AdSpace;
