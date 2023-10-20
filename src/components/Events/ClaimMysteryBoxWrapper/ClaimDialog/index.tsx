import React, { FC, memo } from 'react';
import PMask from '@/components/PMask';
import ClaimDialogHeaderDialog from '../../ClaimWrapper/ClaimDialogHeader';
import iconShield from '@/assets/img/events/iconShield.svg'
import './index.sass';
interface ClaimDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}
const ClaimDialog: FC<ClaimDialogProps> = memo(({ onClose, onSubmit }) => {
  const hanldeSubmit = () => {
    onSubmit()
  };
  return (
    <PMask onClose={onClose}>
      <div className="padoDialog claimMysteryBoxDialog">
        <main>
          <div className="headerWrapper">
            <ClaimDialogHeaderDialog title="Product Officially Launch" />
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
              The rewards will be announced in <b>29th Oct (4am UTC time)</b>{' '}
              and you will find your lucky badge in the Rewards menu.
            </p>
            <p className="specialTip">
              <img src={iconShield} alt="" />
              <span>PADO uses IZK to ensure your privacy</span>
            </p>
          </div>
        </main>

        <button className="nextBtn gray" onClick={hanldeSubmit}>
          <span>Join Now</span>
        </button>
      </div>
    </PMask>
  );
});
export default ClaimDialog;
