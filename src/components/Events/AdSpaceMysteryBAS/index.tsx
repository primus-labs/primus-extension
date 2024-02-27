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
import useEventDetail from '@/hooks/useEventDetail';
import { setRewardsDialogVisibleAction } from '@/store/actions';
import { checkLotteryResults } from '@/services/api/event';
import { BASEVENTNAME } from '@/config/constants';
import PButton from '@/components/PButton';
import iconRightArrow from '@/assets/img/rightArrow.svg';
import bannerIllstration from '@/assets/img/events/bannerIllstration.svg';
import disabledBannerIllstration from '@/assets/img/events/luckyDrawIllstration.svg';
// import nftIllstration from '@/assets/img/events/nftIllstration.png';
import nftIllstration from '@/assets/img/events/basIllstration.svg';
import './index.scss';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
interface AdSpaceProps {
  onClick: () => void;
}
dayjs.extend(utc);
const AdSpace: FC<AdSpaceProps> = memo(({ onClick }) => {
  const dispatch: Dispatch<any> = useDispatch();
  const [BASEventDetail] = useEventDetail(BASEVENTNAME);
  const BASEventPeriod = useMemo(() => {
    if (BASEventDetail?.startTime) {
      const { startTime, endTime } = BASEventDetail;
      return {
        startTime,
        endTime,
      };
    } else {
      return {};
    }
  }, [BASEventDetail]);
  const formatPeriod = useMemo(() => {
    const { startTime, endTime } = BASEventPeriod;
    const s = dayjs.utc(+startTime).format('YYYY.MM.DD-h-a');
    const e = dayjs.utc(+endTime).format('YYYY.MM.DD-h-a');

    const sArr = s.split('-');
    const eArr = e.split('-');
    return `${sArr[0]} ~ ${eArr[0]}`;
  }, [BASEventPeriod]);

  const eventActiveFlag = useMemo(() => {
    const { startTime, endTime } = BASEventPeriod;
    const isUnStart = dayjs().isBefore(dayjs(+startTime))
    const isActive =
      dayjs().isAfter(dayjs(+startTime)) && dayjs().isBefore(dayjs(+endTime));
    const isEnd = dayjs().isAfter(dayjs(+endTime));
    const isLongTerm = BASEventDetail?.ext?.isLongTermEvent;
    if (isUnStart) {
      return 0;
    }
    if (isActive) {
      return 1;
    }
    if (isEnd && !isLongTerm) {
      return 2;
    }
    if (isLongTerm) {
      return 3;
    }

    return 0;
  }, [BASEventPeriod, BASEventDetail?.ext?.isLongTermEvent]);
  const formatCN = useMemo(() => {
    if (eventActiveFlag === 1) {
      return 'adSpace adSpaceBadge';
    } else if (eventActiveFlag === 2) {
      return 'adSpace adSpaceBadge disabled';
    } else if (eventActiveFlag === 3) {
      return 'adSpace adSpaceNft';
    } else {
      return 'adSpace';
    }
  }, [eventActiveFlag]);
  const formatImgCN = useMemo(() => {
    if (eventActiveFlag === 1) {
      return 'activeImg';
    } else if (eventActiveFlag === 2) {
      return 'disabledImg';
    } else {
      return '';
    }
  }, [eventActiveFlag]);
  const formatImgSrc = useMemo(() => {
    if (eventActiveFlag === 1) {
      return bannerIllstration;
    } else if (eventActiveFlag === 2) {
      return disabledBannerIllstration;
    } else {
      return nftIllstration;
    }
  }, [eventActiveFlag]);
  const formatBtnTxt = useMemo(() => {
    if (eventActiveFlag === 2) {
      return 'Closed';
    } else {
      return 'Join Now';
    }
  }, [eventActiveFlag]);
  const handleClick = useCallback(() => {
    if (eventActiveFlag === 1 || eventActiveFlag === 3) {
      onClick();
    }
  }, [onClick, eventActiveFlag]);

  return (
    <>
      {!!eventActiveFlag ? (
        <div className={formatCN}>
          <div className="left">
            <img className={formatImgCN} src={formatImgSrc} alt="" />
            <div className="bannerContent">
              <h3 className="ct">BAS Attestation Alliance</h3>
              <div className="cn">
                <p>
                  Bringing more traditional data attestations to the BNB
                  ecosystem.
                </p>
                {(eventActiveFlag === 1 || eventActiveFlag === 2) && (
                  <p>{formatPeriod}</p>
                )}
              </div>
            </div>
          </div>
          <PButton
            text={formatBtnTxt}
            className={eventActiveFlag === 2 ? 'disabled' : ''}
            suffix={
              eventActiveFlag === 1 && (
                <i className="iconfont icon-rightArrow"></i>
              )
            }
            onClick={handleClick}
          />
        </div>
      ) : (
        <></>
      )}
    </>
  );
});
export default AdSpace;
