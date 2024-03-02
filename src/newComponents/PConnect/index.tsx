import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PButton from '@/newComponents/PButton';
import ConnectWallet from '@/newComponents/ConnectWallet';
import Connected from './Connected';

import './index.scss';
import type { UserState } from '@/types/store';

const PConnect = memo(() => {
  const [connectWalletDialogVisible1, setConnectWalletDialogVisible1] =
    useState<boolean>(false);
  // const connectWalletDialogVisible = useSelector(
  //   (state: UserState) => state.connectWalletDialogVisible
  // );
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const handleConnect = useCallback(() => {
    setConnectWalletDialogVisible1(true);
  }, []);

  const handleCloseConnectWallet = useCallback(() => {
    setConnectWalletDialogVisible1(false);
  }, []);
  const handleSubmitConnectWallet = useCallback(() => {
    setConnectWalletDialogVisible1(false);
  }, []);
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
        visible={connectWalletDialogVisible1}
        onClose={handleCloseConnectWallet}
        onSubmit={handleSubmitConnectWallet}
      />
    </div>
  );
});

export default PConnect;
