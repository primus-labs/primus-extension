import React, { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAttestLoading, setActiveAttestation } from '@/store/actions';
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
  useEffect(() => {
    if (attestLoading === 2) {
      dispatch(setAttestLoading(0));
    }
  }, [attestLoading, dispatch]);
  return (
    <div className="createZkAttestation">
      {type === 'Assets Certificate' && (
        <AssetDialog onClose={onClose} onSubmit={onSubmit} />
      )}
      {type === 'Humanity Verification' && (
        <HumanityDialog onClose={onClose} onSubmit={onSubmit} />
      )}
      {type === 'On-chain Transaction' && (
        <OnChainDialog onClose={onClose} onSubmit={onSubmit} />
      )}
    </div>
  );
});

export default PClose;
