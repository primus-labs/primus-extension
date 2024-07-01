import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setConnectWalletDialogVisibleAction } from '@/store/actions';
import PButton from '@/newComponents/PButton';
import ConnectWallet from '@/newComponents/ConnectWallet';
import Connected from './Connected';

import './index.scss';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';

const PConnect = memo(() => {
  const dispatch: Dispatch<any> = useDispatch();
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const handleConnect = useCallback(() => {
    dispatch(setConnectWalletDialogVisibleAction(1));
  }, [dispatch]);

  const handleCloseConnectWallet = useCallback(() => {
    dispatch(setConnectWalletDialogVisibleAction(0));
  }, [dispatch]);
  const handleSubmitConnectWallet = useCallback(() => {
    dispatch(setConnectWalletDialogVisibleAction(0));
  }, [dispatch]);
  return (
    <div className="pConnect">
      {connectedWallet?.address ? (
        <Connected onConnect={handleConnect} />
      ) : (
        <PButton
          className="connectBtn"
          text="Connect wallet"
          onClick={handleConnect}
        />
      )}
      <ConnectWallet
        onClose={handleCloseConnectWallet}
        onSubmit={handleSubmitConnectWallet}
      />
    </div>
  );
});

export default PConnect;
