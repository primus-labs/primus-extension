import React, { memo } from 'react';

import PQRCode from '@/components/PQRCode';
import qrCodeDefault from '@/assets/img/loading-loop.svg';
import './index.scss';

interface QRCodeMainProps {
  title: string;
  desc: any;
  qrcodeValue: string;
  qrcodeSize?: number;
}

const QRCodeMain: React.FC<QRCodeMainProps> = memo(
  ({ title, desc, qrcodeValue, qrcodeSize }) => {
    return (
      <div className="qrcodeMain">
        <header>
          <h1>{title}</h1>
          <h2>{desc}</h2>
        </header>
        {qrcodeValue ? (
          <PQRCode value={qrcodeValue} size={qrcodeSize} />
        ) : (
          <div className="defaultImg">
            <img src={qrCodeDefault} alt="" />
          </div>
        )}
      </div>
    );
  }
);

export default QRCodeMain;
