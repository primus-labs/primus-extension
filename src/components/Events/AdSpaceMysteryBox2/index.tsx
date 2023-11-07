import React, { FC, memo, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import PButton from '@/components/PButton';
import iconRightArrow from '@/assets/img/rightArrow.svg';
import bannerIllstration from '@/assets/img/events/bannerIllstration.svg';
import './index.scss';
import type { UserState } from '@/types/store';
interface AdSpaceProps {
  onClick: () => void;
}
dayjs.extend(utc);
const AdSpace: FC<AdSpaceProps> = memo(({ onClick }) => {
  const badgeEventPeriod = useSelector(
    (state: UserState) => state.scrollEventPeriod
  );
  const formatPeriod = useMemo(() => {
    const { startTime, endTime } = badgeEventPeriod;
    const s = dayjs.utc(+startTime).format('YYYY.MM.DD');
    const e = dayjs.utc(+endTime).format('YYYY.MM.DD');
    return `${s}~${e}`;
  }, [badgeEventPeriod]);

  return (
    <div className="adSpace adSpaceBadge">
      <div className="left">
        <img src={bannerIllstration} alt="" />
        <div className="bannerContent">
          <h3 className="ct">Scroll Humanity Attestation</h3>
          <div className="cn">
            <p>Limited partnership badges for users.</p>
            {/* <p>2023.10.23~2023.10.29</p> */}
            <p>{formatPeriod}</p>
          </div>
        </div>
      </div>
      <PButton
        text="Join Now"
        suffix={<i className="iconfont icon-rightArrow"></i>}
        onClick={onClick}
      />
    </div>
  );
});
export default AdSpace;
