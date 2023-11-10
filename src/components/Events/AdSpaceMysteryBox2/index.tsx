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
    const s = dayjs.utc(+startTime).format('YYYY.MM.DD-h-a');
    const e = dayjs.utc(+endTime).format('YYYY.MM.DD-h-a');
   
    const sArr = s.split('-');
    const eArr = e.split('-');
    return `${sArr[0]} ${sArr[1]}${sArr[2]} UTC ~ ${eArr[0]} ${eArr[1]}${eArr[2]} UTC`;
  }, [badgeEventPeriod]);

  return (
    <div className="adSpace adSpaceBadge">
      <div className="left">
        <img src={bannerIllstration} alt="" />
        <div className="bannerContent">
          <h3 className="ct">Scroll zkAttestation Launch Campaign</h3>
          <div className="cn">
            <p>Limited badge for attestation participants</p>
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
