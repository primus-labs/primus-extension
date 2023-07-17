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
            <p className="title">PADO NFT REWARD for early birds!</p>
            <p className="desc">Meet the following conditions to claim:</p>
            <ul className="details">
              <li>
                <i></i>Connected any data source before Jul 30, 2023
              </li>
              <li>
                <i></i>Generated one credit credential
              </li>
              <li>
                <i></i>Provided at least one on-chain attestation
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
