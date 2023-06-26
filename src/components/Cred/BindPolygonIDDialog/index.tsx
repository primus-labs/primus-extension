import React, { memo } from 'react';

import PMask from '@/components/PMask';
import QRCodeMain from '@/components/Cred/QRCodeMain';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import './index.sass';

import type { CredTypeItemType } from '@/components/Cred/CredItem';

interface BindPolygonIDDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  activeCred?: CredTypeItemType;
}

const BindPolygonIDDialog: React.FC<BindPolygonIDDialogProps> = memo(
  ({ onClose, onSubmit, activeCred }) => {
    const handleClickNext = () => {
      onSubmit();
    };

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog qrcodeDialog bindPolygonidDialog">
          <main>
            <AddressInfoHeader /> 
            <QRCodeMain
              title="Bind your Polygon DID"
              desc="Use your Polygon ID wallet to scan this QR code and bind your Polygon DID with this credential."
              qrcodeValue="https://fanyi.baidu.com/?aldtype=16047#en/zh/"
            />
          </main>
          <button className="nextBtn" onClick={handleClickNext}>
            <span>OK</span>
          </button>
        </div>
      </PMask>
    );
  }
);

export default BindPolygonIDDialog;
