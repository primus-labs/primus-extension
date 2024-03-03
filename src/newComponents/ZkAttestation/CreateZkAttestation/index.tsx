import React, { memo, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAttestLoading, setActiveAttestation } from '@/store/actions';
import useCheckIsConnectedWallet from '@/hooks/useCheckIsConnectedWallet';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import AssetDialog from './AssetDialog';
import HumanityDialog from './HumanityDialog';

import OnChainDialog from './OnChainDialog';

interface PBackProps {
  type: string;
  onClose: () => void;
  onSubmit: () => void;
}
const PClose: React.FC<PBackProps> = memo(({ type, onClose, onSubmit }) => {
  const dispatch: Dispatch<any> = useDispatch();
  const attestLoading = useSelector((state: UserState) => state.attestLoading);
  // const [checkIsConnectFlag, setCheckIsConnectFlag] = useState<boolean>(false);
  const { connected } = useCheckIsConnectedWallet(true);
  useEffect(() => {
    if (attestLoading === 2) {
      dispatch(setAttestLoading(0));
    }
  }, [attestLoading, dispatch]);
  return (
    <div className="createZkAttestation">
      {connected ? (
        <>
          {type === 'Assets Certificate' && (
            <AssetDialog type={type} onClose={onClose} onSubmit={onSubmit} />
          )}
          {type === 'Humanity Verification' && (
            <HumanityDialog type={type} onClose={onClose} onSubmit={onSubmit} />
          )}
          {type === 'On-chain Transaction' && (
            <OnChainDialog type={type} onClose={onClose} onSubmit={onSubmit} />
          )}
        </>
      ) : (
        <></>
      )}
    </div>
  );
});

export default PClose;
