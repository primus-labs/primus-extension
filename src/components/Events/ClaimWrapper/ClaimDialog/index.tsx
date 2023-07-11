import React, { FC, memo } from 'react';
import PMask from '@/components/PMask';
import ClaimDialogHeaderDialog from '../ClaimDialogHeader';
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
            <ClaimDialogHeaderDialog />
          </div>
          <div className="descContent">
            <p className="title">
              For early users, PADO launched on-boarding NFT REWARD!{' '}
            </p>
            <p className="desc">
              Anyone who meets the following conditions can immediately claim:
            </p>
            <ul className="details">
              <li>
                <i></i>Connected any data source before Jul 30, 2023
              </li>
              <li>
                <i></i>Generate an credit credential
              </li>
              <li>
                <i></i>Provide on-chain attestation
              </li>
            </ul>
          </div>
        </main>

        <button className="nextBtn gray" onClick={hanldeSubmit}>
          <span>Claim</span>
        </button>
      </div>
    </PMask>
  );
});
export default ClaimDialog;
