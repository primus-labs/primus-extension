import React, { memo } from 'react';
import PButton from '@/newComponents/PButton';
import AssetDialog from './AssetDialog';
import OnChainDialog from './OnChainDialog';

interface PBackProps {
  type: string;
  onClose: () => void;
  onSubmit: () => void;
}
const PClose: React.FC<PBackProps> = memo(({ type, onClose, onSubmit }) => {
  return (
    <div className="createZkAttestation">
      {type === 'Assets Certificate' && (
        <AssetDialog onClose={onClose} onSubmit={onSubmit} />
      )}
      {type === 'On-chain Transaction' && (
        <OnChainDialog onClose={onClose} onSubmit={onSubmit} />
      )}
    </div>
  );
});

export default PClose;
