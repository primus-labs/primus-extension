import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import PMask from '@/newComponents/PMask';
import PButton from '@/newComponents/PButton';
import PClose from '@/newComponents/PClose';
import './index.scss';
interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}

const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onClose, onSubmit }) => {
    return (
      <PMask>
        <div className="pDialog2 confirmDeleteDialog">
          <PClose onClick={onClose} />
          <main>
            <header>
              <h1>Sure to delete?</h1>
              <h2>
                Deleted attestations that were not submitted cannot be recovered
                or searched for by the create wallet function on-chain.
              </h2>
            </header>
            <PButton
              text="Confirm"
              className="fullWidth confirmBtn"
              onClick={onSubmit}
            ></PButton>
          </main>
        </div>
      </PMask>
    );
  }
);

export default SetPwdDialog;
