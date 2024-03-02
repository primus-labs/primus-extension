import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import useWallet from '@/hooks/useWallet';
import { formatAddress } from '@/utils/utils';
import SetDialog from './SetDialog';
import SetProcessDialog from './SetProcessDialog';
import type { UserState } from '@/types/store';
import './index.scss';

interface PButtonProps {
  // visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  requireAssets?: boolean;
}

const Nav: React.FC<PButtonProps> = memo(
  ({ onClose, onSubmit, requireAssets = false }) => {
    const [step, setStep] = useState<number>(1);
    const [activeRequest, setActiveRequest] = useState<any>({});
    const [chainId, setChainId] = useState<string | number>('');
    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );

    const handleCloseConnectWalletProcessDialog = useCallback(() => {
      onClose();
    }, []);

    const handleCloseConnectWallet = useCallback(() => {
      onClose();
    }, [onClose]);

    const handleSubmitConnectWallet = useCallback(async ( walletId) => {
      setChainId(walletId);
    }, []);

    // useEffect(() => {
    //   if (visible) {
    //     setStep(1);
    //     setActiveRequest({});
    //   }
    // }, [visible]);
    return (
      <div className={'submitOnChain'}>
        {step === 1 && (
          <SetDialog
            onClose={handleCloseConnectWallet}
            onSubmit={handleSubmitConnectWallet}
          />
        )}
        {step === 2 && (
          <SetProcessDialog
            preset={chainId}
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
