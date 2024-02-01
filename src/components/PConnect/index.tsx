import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import useWallet from '@/hooks/useWallet';
import { formatAddress } from '@/utils/utils';
import { DATASOURCEMAP } from '@/config/constants';

import {
  setConnectWalletActionAsync,
  setConnectWalletDialogVisibleAction,
} from '@/store/actions';

import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import PButton from '@/components/PButton';
import ConnectWalletDialog from '@/components/Cred/CredSendToChainWrapper/ConnectWalletDialog';
import './index.scss';
import type { UserState } from '@/types/store';
import type { WALLETITEMTYPE } from '@/config/constants';
import type { ActiveRequestType } from '@/types/config';
import iconWallet from '@/assets/img/layout/iconWallet.svg';

const PConnect = memo(() => {
  const [searchParams] = useSearchParams();
  const [connectWalletDialogVisible1, setConnectWalletDialogVisible1] =
    useState<boolean>(false);
  const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
  const [step, setStep] = useState<number>(1);
  const connectWalletDialogVisible = useSelector(
    (state: UserState) => state.connectWalletDialogVisible
  );
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const dispatch: React.Dispatch<any> = useDispatch();

  const errorDescEl = useMemo(
    () => (
      <>
        <p>Your wallet did not connect or refused to authorize.</p>
        <p>Please try again later.</p>
      </>
    ),
    []
  );
  const handleConnect = useCallback(() => {
    setConnectWalletDialogVisible1(true);
    setStep(1);
  }, []);
  const handleCloseMask = useCallback(() => {
    setConnectWalletDialogVisible1(false);
  }, []);
  const startFn = () => {
    setActiveRequest({
      type: 'loading',
      title: 'Sign the message',
      desc: "PADO uses this signature to verify that you're the owner of this address.",
    });
    setStep(2);
  };
  const errorFn = useCallback(() => {
    setActiveRequest({
      type: 'warn',
      title: 'Unable to proceed',
      desc: errorDescEl,
    });
  }, [errorDescEl]);
  const { connect } = useWallet();
  const handleSubmitConnectWallet = useCallback(
    async (wallet?: WALLETITEMTYPE) => {
      const lowerCaseWalletName = wallet?.name?.toLowerCase();
      if (wallet?.name && lowerCaseWalletName !== 'walletconnect') {
        setActiveRequest({
          type: 'loading',
          title: 'Requesting Connection',
          desc: 'Check MetaMask to confirm the connection.',
        });
        setStep(2);
        if (lowerCaseWalletName === 'plug wallet') {
          chrome.runtime.sendMessage({
            type: 'icp',
            name: 'connectWallet',
            params: {
              walletName: lowerCaseWalletName,
              operation: 'createTab',
              path: 'http://localhost:3001/other/connectWallet',
            },
          });
          return;
        }
      }
      connect(wallet?.name, startFn, errorFn);
    },
    [connect, errorFn]
  );
  const onSubmitProcessDialog = useCallback(() => {
    setStep(1);
    setConnectWalletDialogVisible1(false);
  }, []);
  const checkIfHadBound = useCallback(async () => {
    const { connectedWalletAddress } = await chrome.storage.local.get([
      'connectedWalletAddress',
    ]);
    if (connectedWalletAddress) {
      const lastConnectedInfo = JSON.parse(connectedWalletAddress);
      handleSubmitConnectWallet(lastConnectedInfo);
    }
  }, [handleSubmitConnectWallet]);
  // useEffect(() => {
  //     checkIfHadBound();
  // }, []);
  useEffect(() => {
    if (connectedWallet?.address) {
      setConnectWalletDialogVisible1(false);
      setStep(1);
    }
  }, [connectedWallet?.address]);
  useEffect(() => {
    const listerFn = async (message: any) => {
      if (message.type === 'icp') {
        if (message.name === 'connectWallet') {
          setStep(2);
          if (message.result) {
            await dispatch(
              setConnectWalletActionAsync({
                name: 'plug wallet',
                address: message.params.address,
              })
            );
            await dispatch(setConnectWalletDialogVisibleAction(false));
          } else {
            setActiveRequest({
              type: 'warn',
              title: 'Unable to proceed',
              desc: 'Please try again later.',
            });
          }
        }
      }
    };
    chrome.runtime.onMessage.addListener(listerFn);
    return () => {
      chrome.runtime.onMessage.removeListener(listerFn);
    };
  }, [dispatch]);
  return (
    <div className="PConnect">
      {connectedWallet?.address ? (
        <PButton
          prefix={<img src={iconWallet} alt="" />}
          text={formatAddress(connectedWallet?.address, 4)}
          onClick={() => {}}
        />
      ) : (
        <PButton text="Connect Wallet" onClick={handleConnect} />
      )}
      {connectWalletDialogVisible1 && step === 1 && (
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
      )}
    </div>
  );
});

export default PConnect;
