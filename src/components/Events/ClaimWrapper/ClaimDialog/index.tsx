import React, { FC, memo } from 'react';
import PMask from '@/components/PMask';
import ClaimDialogHeaderDialog from '../ClaimDialogHeader';
import iconShield from '@/assets/img/events/iconShield.svg';
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
      <div className="padoDialog claimDialog">
        <main>
          <div className="headerWrapper">
            <ClaimDialogHeaderDialog
              title="Early Bird NFT Reward"
              illustration={false}
            />
          </div>
          <div className="descContent">
            <p className="title">Complete the following tasks to get:</p>
            <ul className="details">
              <li>
                <i>
                  <span></span>
                </i>
                <span>Connected API data</span>
              </li>
              <li>
                <i>
                  <span></span>
                </i>
                <span>Generate any attestation</span>
              </li>
              <li>
                <i>
                  <span></span>
                </i>
                <span>Submit at least one attestation to Linea mainnet</span>
              </li>
            </ul>
            <p className="desc">
              You will have an Early Bird NFT after completing the event. (
              <span>Each user can only claim one</span>)
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
