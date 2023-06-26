import React, { memo } from 'react';

import PQRCode from '@/components/PQRCode';
import './index.sass';

interface QRCodeMainProps {
  title: string;
  desc: string;
  qrcodeValue: string;
}

const QRCodeMain: React.FC<QRCodeMainProps> = memo(
  ({ title, desc, qrcodeValue }) => {
    return (
      <div className="qrcodeMain">
        <h1>{title}</h1>
        <h2>{desc}</h2>
        <PQRCode value={qrcodeValue} />
      </div>
    );
  }
);

export default QRCodeMain;
