import React, { FC, memo, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import PButton from '@/components/PButton';
import iconRightArrow from '@/assets/img/rightArrow.svg';
import bannerIllstration from '@/assets/img/events/luckyDrawIllstration.svg';
import './index.scss';
import type { UserState } from '@/types/store';
interface AdSpaceProps {
  onClick: () => void;
}
dayjs.extend(utc);
const AdSpace: FC<AdSpaceProps> = memo(({ onClick }) => {
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
        <PButton text="Close" className="disabled" onClick={() => {}} />
      )}
    </div>
  );
});
export default AdSpace;
