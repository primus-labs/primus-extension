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
  const [connectWalletDialogVisible1, setConnectWalletDialogVisible1] =
    useState<boolean>(false);
  const connectWalletDialogVisible = useSelector(
    (state: UserState) => state.connectWalletDialogVisible
  );
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const handleConnect = useCallback(() => {
    //   setConnectWalletDialogVisible1(true);
    // }, []);
    dispatch(setConnectWalletDialogVisibleAction(true));
  }, [dispatch]);

  const handleCloseConnectWallet = useCallback(() => {
    // setConnectWalletDialogVisible1(false);
    dispatch(setConnectWalletDialogVisibleAction(false));
  }, [dispatch]);
  const handleSubmitConnectWallet = useCallback(() => {
    // setConnectWalletDialogVisible1(false);
    dispatch(setConnectWalletDialogVisibleAction(false));
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
        visible={connectWalletDialogVisible}
        onClose={handleCloseConnectWallet}
        onSubmit={handleSubmitConnectWallet}
      />
    </div>
  );
});

export default PConnect;
