import React, { useMemo, memo } from 'react';

import PMask from '@/components/PMask';
import PBack from '@/components/PBack';
import iconInfoColorful from '@/assets/img/iconInfoColorful.svg';

import './index.sass';
interface AddSourceSucDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

const ReconfirmDialog: React.FC<AddSourceSucDialogProps> = memo(
  ({
    onClose,
    onSubmit,
    onBack,
  }) => {
    return (
      <PMask onClose={onClose}>
        <div className="padoDialog  reconfirmDialog">
          <PBack onBack={onBack} />
          <main>
            <img className="sucImg" src={iconInfoColorful} alt="" />
            <h1>Are your sure to delete?</h1>
            <h2>
              To re-connect, you will need to go through the process again.
            </h2>
          </main>
          <button className="nextBtn" onClick={onSubmit}>
            <span>Delete</span>
          </button>
        </div>
      </PMask>
    );
  }
);

export default ReconfirmDialog;
