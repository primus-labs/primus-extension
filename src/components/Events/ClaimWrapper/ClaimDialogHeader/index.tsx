import React, { FC, memo } from 'react';
import bannerIllstration from '@/assets/img/events/bannerIllstration.svg';

import './index.sass';

interface ClaimDialogHeaderProps {
  title?: string;
}
const ClaimDialogHeaderDialog: FC<ClaimDialogHeaderProps> = memo(
  ({ title = 'PADO Rewards' }) => {
    return (
      <header className="claimDialogHeader">
        <img className="illustration" src={bannerIllstration} alt="" />
        <span>{title}</span>
      </header>
    );
  }
);
export default ClaimDialogHeaderDialog;
