import React, { useState, useEffect, memo } from 'react';
import { QRCodeSVG } from 'qrcode.react';

import PMask from '@/components/PMask';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import iconExport from '@/assets/img/iconExport.svg';
import './index.sass';

import { exportJson } from '@/utils/utils';
import { PADOADDRESS } from '@/config/envConstants';

import type { CredTypeItemType } from '@/components/Cred/CredItem';

interface QRCodeDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  activeCred?: CredTypeItemType;
}

const QRCodeDialog: React.FC<QRCodeDialogProps> = memo(
  ({ onClose, onSubmit, activeCred }) => {
    const [jsonStr, setJsonStr] = useState<string>('');

    const handleClickNext = () => {
      onSubmit();
    };
    const handleExport = () => {
      exportJson(jsonStr, 'credential');
    };
    useEffect(() => {
      if (activeCred) {
        const {
          source,
          authUseridHash,
          address,
          getDataTime,
          baseValue,
          balanceGreaterThanBaseValue,
          signature,
        } = activeCred;
        const jsonStr = JSON.stringify(
          {
            attester: PADOADDRESS,
            schemaData: {
              source,
              // useridhash,
              // sourceUseridHash: '',
              authUseridHash,
              receipt: address,
              getDataTime,
              baseValue,
              balanceGreaterThanBaseValue,
            },
            signature,
          },
          null,
          '\t'
        );
        setJsonStr(jsonStr);
      }
    }, [activeCred]);

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog qrcodeDialog">
          <main>
            <AddressInfoHeader />
            <h1>Present your credential</h1>
            <h2>Scan this QR code to use or download your credential.</h2>
            <QRCodeSVG value={jsonStr} size={220} />
            <div className="exportWrapper" onClick={handleExport}>
              <img className="exportIcon" src={iconExport} alt="" />
              <p>Export your credential</p>
            </div>
          </main>
          <button className="nextBtn" onClick={handleClickNext}>
            <span>OK</span>
          </button>
        </div>
      </PMask>
    );
  }
);

export default QRCodeDialog;
