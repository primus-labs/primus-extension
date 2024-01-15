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
import { BASEVENTNAME } from '@/config/constants';
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
  const dispatch: Dispatch<any> = useDispatch();
  const BASEventPeriod = useSelector(
    (state: UserState) => state.BASEventPeriod
  );
  const formatPeriod = useMemo(() => {
    const { startTime, endTime } = BASEventPeriod;
    const s = dayjs.utc(+startTime).format('YYYY.MM.DD-h-a');
    const e = dayjs.utc(+endTime).format('YYYY.MM.DD-h-a');

    const sArr = s.split('-');
    const eArr = e.split('-');
    return `${sArr[0]} ~ `;
  }, [BASEventPeriod]);

  const eventActiveFlag = useMemo(() => {
    const { startTime, endTime } = BASEventPeriod;
    // const isActive =
    //   dayjs().isAfter(dayjs(+startTime)) && dayjs().isBefore(dayjs(+endTime));
    const isActive = dayjs().isAfter(dayjs(+startTime));
    const isEnd = dayjs().isAfter(dayjs(+endTime));
    if (isActive) {
      return 1;
    }
    if (isEnd) {
      return 2;
    }
    return 0;
  }, [BASEventPeriod]);

  return (
    <>
      {!!eventActiveFlag ? (
        <div
          className={
            eventActiveFlag === 2
              ? 'adSpace adSpaceBadge disabled'
              : 'adSpace adSpaceBadge'
          }
        >
          <div className="left">
            {eventActiveFlag === 2 ? (
              <img
                className="disabledImg"
                src={disabledBannerIllstration}
                alt=""
              />
            ) : (
              <img className="activeImg" src={bannerIllstration} alt="" />
            )}
            <div className="bannerContent">
              <h3 className="ct">BNBChain Attestation Alliance</h3>
              <div className="cn">
                <p>
                  Bringing more traditional data attestations to the BNB
                  ecosystem.
                </p>
                <p>{formatPeriod}</p>
              </div>
            </div>
          </div>
          {eventActiveFlag === 1 ? (
            <PButton
              text="Join Now"
              suffix={<i className="iconfont icon-rightArrow"></i>}
              onClick={onClick}
            />
          ) : (
            <PButton
              text={'Closed'}
              className={'disabled'}
              onClick={() => {}}
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
