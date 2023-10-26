import React, { FC, memo } from 'react';
import bannerIllstration from '@/assets/img/events/bannerIllstration.svg';

import './index.scss';

interface ClaimDialogHeaderProps {
  title?: string;
  illustration?: boolean;
}
const ClaimDialogHeaderDialog: FC<ClaimDialogHeaderProps> = memo(
  ({ title = 'PADO Reward', illustration = false }) => {
    return (
      <header className="claimDialogHeader">
        {illustration && (
          <img className="illustration" src={bannerIllstration} alt="" />
        )}
        <span>{title}</span>
      </header>
    );
  }
);
export default ClaimDialogHeaderDialog;
