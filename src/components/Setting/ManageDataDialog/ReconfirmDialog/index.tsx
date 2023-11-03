import React, { useMemo, memo } from 'react';

import PMask from '@/components/PMask';
import PButton from '@/components/PButton';
import PBack from '@/components/PBack';
import iconInfoColorful from '@/assets/img/iconInfoColorful.svg';

import './index.scss';
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
        <div className="padoDialog addDataSourceSucDialog reconfirmDialog">
          <PBack onBack={onBack} />
          <main>
            <div className="holderH"></div>
            <img className="processImg sucImg" src={iconInfoColorful} alt="" />
            <header>
              <h1>Sure to delete?</h1>
              <h2>
                You will need to go through the whole process to re-connect.
              </h2>
            </header>
          </main>
          <PButton text="Delete" onClick={onSubmit} />
        </div>
      </PMask>
    );
  }
);

export default ReconfirmDialog;
