import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  useWeb3Modal,
  useWeb3ModalProvider,
  useWeb3ModalAccount,
  useDisconnect,
  useWeb3ModalState,
  useWeb3ModalEvents,
} from '@web3modal/ethers5/react';
import { setConnectWalletActionAsync } from '@/store/actions';
// import { EASInfo } from '@/config/envConstants';

// import { ethers } from 'ethers';
// import { connectWallet, switchChain } from '@/services/wallets/metamask';

import {
  // setConnectWalletDialogVisible1,
  connectWalletAsync,
} from '@/store/actions';
import { formatAddress } from '@/utils/utils';
import { DATASOURCEMAP } from '@/config/constants';

import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import PButton from '@/components/PButton';
import ConnectWalletDialog from '@/components/Cred/CredSendToChainWrapper/ConnectWalletDialog';
import './index.scss';
import type { UserState } from '@/types/store';
import type { WALLETITEMTYPE } from '@/config/constants';
import type { ActiveRequestType } from '@/types/config';
import iconWallet from '@/assets/img/layout/iconWallet.svg';

const PConnect = memo(() => {
  // 4. Use modal hook
  const { open } = useWeb3Modal();
  const {
    address: walletConnectAddress,
    chainId,
    isConnected: walletConnectIsConnect,
  } = useWeb3ModalAccount();
  const { walletProvider: walletConnectProvider } = useWeb3ModalProvider();
  // const { open: isOpen, selectedNetworkId } = useWeb3ModalState();
  // const events = useWeb3ModalEvents();
  // const { disconnect } = useDisconnect();

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
  const connectWalletAsyncFn = useCallback(
    (connectObj?: any) => {
      const startFn = () => {
        setActiveRequest({
          type: 'loading',
          title: 'Sign the message',
          desc: "PADO uses this signature to verify that you're the owner of this address.",
        });
        setStep(2);
      };
      const errorFn = () => {
        setActiveRequest({
          type: 'warn',
          title: 'Unable to proceed',
          desc: errorDescEl,
        });
      };
      dispatch(connectWalletAsync(connectObj, startFn, errorFn));
    },
    [dispatch, errorDescEl]
  );
  const handleSubmitConnectWallet = useCallback(
    async (wallet?: WALLETITEMTYPE) => {
      if (wallet?.name === 'MetaMask') {
        setActiveRequest({
          type: 'loading',
          title: 'Requesting Connection',
          desc: 'Check MetaMask to confirm the connection.',
        });
        setStep(2);
        connectWalletAsyncFn(undefined);
      } else if (wallet?.name === 'WalletConnect') {
        open();
      }
    },
    [open, connectWalletAsyncFn]
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
      handleSubmitConnectWallet();
    }
  }, [handleSubmitConnectWallet]);
  // useEffect(() => {
  //   checkIfHadBound();
  // }, [checkIfHadBound]); // TODO!!!
  useEffect(() => {
    if (connectedWallet?.address) {
      setConnectWalletDialogVisible1(false);
      setStep(1);
    }
  }, [connectedWallet?.address]);
  useEffect(() => {
    if (walletConnectIsConnect) {
      connectWalletAsyncFn({
        name: 'walletconnect',
        provider: walletConnectProvider,
        address: walletConnectAddress,
      });
    } else {
      dispatch(setConnectWalletActionAsync(undefined));
    }
  }, [
    walletConnectProvider,
    walletConnectAddress,
    walletConnectIsConnect,
    connectWalletAsyncFn,
    dispatch,
  ]);
  useEffect(() => {
    console.log('222123', walletConnectProvider, chainId);
    if (walletConnectProvider) {
      walletConnectProvider.on('chainChanged', (chainId: number) => {
        console.log('2221234', chainId);
      });
    }
  }, [walletConnectProvider, chainId]);
  // useEffect(() => {
  //   console.log('222123', events)
  // },[events])
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
