import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useWallet from '@/hooks/useWallet';
import { formatAddress } from '@/utils/utils';
import { DATASOURCEMAP } from '@/config/constants';

import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import PButton from '@/newComponents/PButton';
import ConnectWalletDialog from '@/components/Cred/CredSendToChainWrapper/ConnectWalletDialog';
import ConnectWallet from '@/newComponents/ConnectWallet';

import './index.scss';
import type { UserState } from '@/types/store';
import type { WALLETITEMTYPE } from '@/config/constants';
import type { ActiveRequestType } from '@/types/config';
import iconWallet from '@/assets/img/layout/iconWallet.svg';

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
        '0x....'
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

      {/* {connectWalletDialogVisible1 && step === 1 && (
        <ConnectWalletDialog
          onClose={handleCloseMask}
          onSubmit={handleSubmitConnectWallet}
        />
      )}
      {connectWalletDialogVisible1 && step === 2 && (
        <AddSourceSucDialog
          type={activeRequest?.type}
          title={activeRequest?.title}
          desc={activeRequest?.desc}
          activeSource={DATASOURCEMAP['onChain']}
          onClose={handleCloseMask}
          onSubmit={onSubmitProcessDialog}
        />
      )} */}
    </div>
  );
});

export default PConnect;
