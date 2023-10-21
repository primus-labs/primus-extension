import React, { FC, memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';

import PMask from '@/components/PMask';
import ClaimDialogHeaderDialog from '../../ClaimWrapper/ClaimDialogHeader';
import iconShield from '@/assets/img/events/iconShield.svg';
import './index.sass';
import { UserState } from '@/types/store';
interface ClaimDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}
dayjs.extend(utc);
const ClaimDialog: FC<ClaimDialogProps> = memo(({ onClose, onSubmit }) => {
  const badgeEventPeriod = useSelector(
    (state: UserState) => state.badgeEventPeriod
  );
  const endStamp = useMemo(() => {
    const { startTime, endTime } = badgeEventPeriod;
    return +endTime;
  }, [badgeEventPeriod]);
  const formatEndTime = useMemo(() => {
    if (endStamp) {
      dayjs.utc();
      const s = dayjs.utc(endStamp).format('DD-MMM-h-a');
      const arr = s.split('-');
      return arr;
    }
  }, [endStamp]);
  const hanldeSubmit = () => {
    onSubmit();
  };
  return (
    <PMask onClose={onClose}>
      <div className="padoDialog claimMysteryBoxDialog">
        <main>
          <div className="headerWrapper">
            <ClaimDialogHeaderDialog
              title="Product Officially Launch"
              illustration={true}
            />
          </div>
          <div className="descContent">
            <p className="title">Commemorative Badge with $1000u Reward</p>
            <ul className="details">
              <li>
                <i>
                  <span></span>
                </i>
                <span>
                  Create an attestation to confirm your humanity through your
                  exchange accounts.
                </span>
              </li>
              <li>
                <i>
                  <span></span>
                </i>
                <span>Submit your attestation to Linea mainnet</span>
              </li>
            </ul>
            <p className="desc">
              You will have a mystery box after completing the event. (
              <span>Each user can only claim one</span>)
            </p>
            <p className="desc">
              The rewards will be announced in{' '}
              <b>
                {formatEndTime[0]}th {formatEndTime[1]} ({formatEndTime[2]}
                {formatEndTime[3]} UTC time)
              </b>
              and you will find your lucky badge in the Rewards menu.
            </p>
            <p className="specialTip">
              <img src={iconShield} alt="" />
              <span>PADO uses IZK to ensure your privacy</span>
            </p>
          </div>
        </main>

        <button className="nextBtn gray" onClick={hanldeSubmit}>
          <span>Claim Now</span>
        </button>
      </div>
    </PMask>
  );
});
export default ClaimDialog;
