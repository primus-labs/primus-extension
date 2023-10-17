import React, { useState, useMemo, memo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type {MouseEvent} from 'react'

import {
  setConnectWalletDialogVisibleAction,
  setConnectWalletAction,
} from '@/store/actions';
import { formatAddress } from '@/utils/utils';
import { connectWallet, requestSign } from '@/services/wallets/metamask';
import { DATASOURCEMAP } from '@/config/constants';
import { bindConnectedWallet } from '@/services/api/user';

import iconWallet from '@/assets/img/layout/iconWallet.svg';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import PButton from '@/components/PButton';
import ConnectWalletDialog from '@/components/Cred/CredSendToChainWrapper/ConnectWalletDialog';
import './index.scss';
import type { UserState } from '@/types/store';
import type { WALLETITEMTYPE } from '@/config/constants';
import type { ActiveRequestType } from '@/types/config';

const PConnect = memo(() => {
  const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
  const [step, setStep] = useState<number>(1);
  const connectWalletDialogVisible = useSelector(
    (state: UserState) => state.connectWalletDialogVisible
  );
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const dispatch = useDispatch();
  const errorDescEl = useMemo(
    () => (
      <>
        <p>Your wallet did not connect or refused to authorize.</p>
        <p>Please try again later.</p>
      </>
    ),
    []
  );
  const handleConnect = useCallback(
    () => {
      
      dispatch(setConnectWalletDialogVisibleAction(true));
    },
    [dispatch]
  );
  const handleCloseMask = useCallback(() => {
    dispatch(setConnectWalletDialogVisibleAction(false));
  }, [dispatch]);
  const handleSubmitConnectWallet = useCallback(
    async (wallet: WALLETITEMTYPE) => {
      setActiveRequest({
        type: 'loading',
        title: 'Sign the message',
        desc: "PADO uses this signature to verify that you're the owner of this address.",
      });
      setStep(2);
      try {
        const [accounts, chainId, provider] = await connectWallet();
        const address = (accounts as string[])[0];
        const type = wallet.name.toLowerCase();
        const timestamp: string = +new Date() + '';
        const signature = await requestSign(address, timestamp);
        if (!signature) {
          setActiveRequest({
            type: 'error',
            title: 'Failed',
            desc: errorDescEl,
          });
          return;
        }
        const res = await bindConnectedWallet({
          signature,
          timestamp,
          address,
          type,
        });
        const { rc, result } = res;
        if (rc === 0 && result) {
          await dispatch(setConnectWalletAction({ address, provider }));
          await dispatch(setConnectWalletDialogVisibleAction(false));
        }
      } catch (e) {
        console.log('pConnect catch e=', e);
        setActiveRequest({
          type: 'error',
          title: 'Failed',
          desc: errorDescEl,
        });
      }
    },
    [dispatch, errorDescEl]
  );
  const onSubmitProcessDialog = useCallback(() => {
    setStep(1);
    dispatch(setConnectWalletDialogVisibleAction(false));
  }, [dispatch]);
  return (
    <div className="PConnect">
      {connectedWallet?.address ? (
        <PButton
          prefix={iconWallet}
          text={formatAddress(connectedWallet?.address, 4)}
          onClick={() => {}}
        />
      ) : (
        <PButton text="Connect Wallet" onClick={handleConnect} />
      )}

      {connectWalletDialogVisible && step === 1 && (
        <ConnectWalletDialog
          onClose={handleCloseMask}
          onSubmit={handleSubmitConnectWallet}
        />
      )}
      {connectWalletDialogVisible && step === 2 && (
        <AddSourceSucDialog
          type={activeRequest?.type}
          title={activeRequest?.title}
          desc={activeRequest?.desc}
          activeSource={DATASOURCEMAP['onChain']}
          onClose={handleCloseMask}
          onSubmit={onSubmitProcessDialog}
        />
      )}
    </div>
  );
});

export default PConnect;
