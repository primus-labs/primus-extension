import React, { memo, FC } from 'react';
import { QRCodeSVG } from 'qrcode.react';


import './index.sass';

interface PQRCodeProps {
  value: string;
  size?: number;
}
const PQRCode: FC<PQRCodeProps> = memo(({ value, size = 220 }) => {
  return (
    <div className="pQRCodeWrapper">
      <QRCodeSVG value={value} size={size} />
    </div>
  );
});

export default PQRCode;
