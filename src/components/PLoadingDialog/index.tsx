import React, { useState } from 'react';
import PMask from '@/components/PMask'
import PLoading from '@/components/PLoading'
import './index.sass'

// export type GetDataFormProps = {
//   name: string;
//   apiKey: string;
//   secretKey: string;
//   passphase?: string;
// }
interface PLoadingDialogProps {
  onClose: () => void;
}

const PLoadingDialog: React.FC<PLoadingDialogProps> = ({ onClose }) => {

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog pLoadingDialog">
        <PLoading />
      </div>
    </PMask>
  );
};

export default PLoadingDialog;
