import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import useWallet from '@/hooks/useWallet';
import { formatAddress } from '@/utils/utils';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import ConnectWalletDialog from './ConnectWalletDialog';
import ConnectWalletProcessDialog from './ConnectWalletProcessDialog';
import SetAPI from '@/newComponents/SetAPIDialog/SetAPIForm';

import iconDone from '@/assets/newImg/layout/iconDone.svg';
import type { UserState } from '@/types/store';
import './index.scss';

interface PButtonProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  
}

const Nav: React.FC<PButtonProps> = memo(
  ({ onClose, onSubmit, visible}) => {
    const [step, setStep] = useState<number>(1);
    const [activeRequest, setActiveRequest] = useState<any>({});
    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );

    const handleCloseConnectWalletProcessDialog = useCallback(() => {
      onClose();
    }, []);
  
    const handleCloseConnectWallet = useCallback(() => {
      onClose();
    }, [onClose]);

    const { connect } = useWallet();
    const startFn = () => {
      setActiveRequest({
        type: 'loading',
        title: 'Requesting Connection',
        desc: 'Check your wallet to confirm the connection.',
      });
      setStep(2);
    };
    const errorFn = useCallback(() => {
      setActiveRequest({
        type: 'fail',
        title: 'Unable to proceed',
        desc: 'Unable to connect your wallet. Please try again later.',
      });
    }, []);
    const sucFn = useCallback((obj) => {
      const a = formatAddress(obj?.address, 6, 6, '......');
      setActiveRequest({
        type: 'suc',
        title: 'Connected',
        desc: a,
      });
    }, []);
    const handleSubmitConnectWallet = useCallback(
      async (wallet) => {
        if (wallet?.id === 'metamask') {
          // setActiveRequest({
          //   type: 'loading',
          //   title: 'Verify ownership',
          //   desc: 'Please sign-in the request in your web3 wallet to prove your are the holder.',
          // });
          setStep(2);
        }
        connect(
          wallet?.id,
          startFn,
          errorFn,
          sucFn,
          undefined,
          undefined,
        );
      },
      [connect, errorFn]
    );
    const checkIfHadBound = useCallback(async () => {
      const { connectedWalletAddress } = await chrome.storage.local.get([
        'connectedWalletAddress',
      ]);
      if (connectedWalletAddress) {
        const lastConnectedInfo = JSON.parse(connectedWalletAddress);
        handleSubmitConnectWallet(lastConnectedInfo);
      }
    }, [handleSubmitConnectWallet]);
    useEffect(() => {
      !connectedWallet?.address && checkIfHadBound();
    }, [connectedWallet]);
    useEffect(() => {
      if (visible) {
        setStep(1);
        setActiveRequest({});
      }
    }, [visible]);
    return (
      <div className={visible ? 'connectWallet visible' : 'connectWallet'}>
        {step === 1 && (
          <ConnectWalletDialog
            onClose={handleCloseConnectWallet}
            onSubmit={handleSubmitConnectWallet}
          />
        )}
        {step === 2 && (
          <ConnectWalletProcessDialog
            onClose={handleCloseConnectWalletProcessDialog}
            onSubmit={() => {}}
            activeRequest={activeRequest}
          />
        )}
      </div>
    );
  }
);

export default Nav;
