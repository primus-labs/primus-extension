import React, { useState, useEffect } from 'react';
import './index.sass';
import iconExport from '@/assets/img/iconExport.svg';
import PMask from '@/components/PMask';
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import { QRCodeSVG } from 'qrcode.react';
import { exportJson } from '@/utils/utils';

interface QRCodeDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}

const QRCodeDialog: React.FC<QRCodeDialogProps> = ({ onClose, onSubmit }) => {
  const [jsonStr, setJsonStr] = useState<string>('')
  const handleClickNext = () => {
    onSubmit();
  };
  const handleExport = () => {
    exportJson(jsonStr, 'credential');
  };
  useEffect(() => {
    const jsonStr = JSON.stringify({
      attester: '0x7ab44DE0156925fe0c24482a2cDe48C465e47573',
      schemaData: {
        source: 'binance',
        useridhash: '0xaaaa...',
        receipt: "0x7ab44de0156925fe0c24482a2cde48c465e47573",
        getdatatime: '1684916453',
        baseValue: '1000',
        balanceGreaterThanBaseValue: true,
      },
      signature: '0xaa...',
    });
    setJsonStr(jsonStr);
  }, [])
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
};

export default QRCodeDialog;
