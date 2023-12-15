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
import { setRewardsDialogVisibleAction } from '@/store/actions';
import { checkLotteryResults } from '@/services/api/event';
import { SCROLLEVENTNAME } from '@/config/constants';
import PButton from '@/components/PButton';
import iconRightArrow from '@/assets/img/rightArrow.svg';
import bannerIllstration from '@/assets/img/events/bannerIllstration.svg';
import disabledBannerIllstration from '@/assets/img/events/luckyDrawIllstration.svg';
import './index.scss';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
interface AdSpaceProps {
  onClick: () => void;
}
dayjs.extend(utc);
const AdSpace: FC<AdSpaceProps> = memo(({ onClick }) => {
  const [BadgeLottryResult, setBadgeLottryResult] = useState<any>();
  const dispatch: Dispatch<any> = useDispatch();
  const scrollEventPeriod = useSelector(
    (state: UserState) => state.scrollEventPeriod
  );
  const formatPeriod = useMemo(() => {
    const { startTime, endTime } = scrollEventPeriod;
    const s = dayjs.utc(+startTime).format('YYYY.MM.DD-h-a');
    const e = dayjs.utc(+endTime).format('YYYY.MM.DD-h-a');

    const sArr = s.split('-');
    const eArr = e.split('-');
    return `${sArr[0]} ${sArr[1]}${sArr[2]} UTC ~ ${eArr[0]} ${eArr[1]}${eArr[2]} UTC`;
  }, [scrollEventPeriod]);

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
    try {
      if (dayjs().isAfter(dayjs(+scrollEventPeriod.endTime))) {
        const { rc, result } = await checkLotteryResults({
          event: SCROLLEVENTNAME,
        });
        if (rc === 0) {
          setBadgeLottryResult({
            result: result.result,
            icon: result.iconUrl,
          });
        }
      }
    } catch (e) {
      console.log('fetchLotteryResults catch e=', e);
    }
  }, [scrollEventPeriod]);

  useEffect(() => {
    fetchLotteryResults();
  }, [fetchLotteryResults]);
  return (
    <>
      {!!scrollEventActiveFlag ? (
        <div
          className={
            scrollEventActiveFlag === 2
              ? 'adSpace adSpaceBadge disabled'
              : 'adSpace adSpaceBadge'
          }
        >
          <div className="left">
            {scrollEventActiveFlag === 2 ? (
              <img
                className="disabledImg"
                src={disabledBannerIllstration}
                alt=""
              />
            ) : (
              <img className="activeImg" src={bannerIllstration} alt="" />
            )}
            <div className="bannerContent">
              <h3 className="ct">Scroll zkAttestation Launch Campaign</h3>
              <div className="cn">
                <p>Limited badge for attestation participants</p>
                <p>{formatPeriod}</p>
              </div>
            </div>
          </div>
          {scrollEventActiveFlag === 1 ? (
            <PButton
              text="Join Now"
              suffix={<i className="iconfont icon-rightArrow"></i>}
              onClick={onClick}
            />
          ) : (
            <PButton
              text={BadgeLottryResult?.result ? 'Rewards' : 'Closed'}
              className={BadgeLottryResult?.result ? 'simple' : 'disabled'}
              onClick={handleOnClick}
            />
          )}
        </div>
      ) : (
        <></>
      )}
    </>
  );
});
export default AdSpace;
