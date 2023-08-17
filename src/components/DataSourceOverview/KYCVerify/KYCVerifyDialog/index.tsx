import React, { memo } from 'react';
import Bridge from '@/components/DataSourceOverview/Bridge/index';
import PMask from '@/components/PMask';
import QRCodeMain from '@/components/Cred/QRCodeDialog/QRCodeMain';
import PBack from '@/components/PBack';

import './index.sass';

import type { ExchangeMeta } from '@/types/dataSource';

export type GetDataFormProps = {
  name: string;
  apiKey: string;
  secretKey: string;
  passphase?: string;
  label?: string;
};
interface KYCVerifyDialogProps {
  onClose: () => void;
  activeSource?: ExchangeMeta;
  onCancel: () => void;
  qrCodeVal: string;
}

const KYCVerifyDialog: React.FC<KYCVerifyDialogProps> = memo(
  ({ onClose, activeSource, onCancel, qrCodeVal }) => {
    const icon = activeSource?.icon;
    const descEl = (
      <>
        <p>Please use your phone to scan the QR code.</p>
        <p> An identity verification process will be initiated by ZAN.</p>
      </>
    );
    return (
      <PMask onClose={onClose}>
        <div className="padoDialog kycVerifyDialog">
          <PBack onBack={onCancel} />
          <main>
            <Bridge endIcon={icon} />
            <QRCodeMain
              title="Get You Verified"
              desc={descEl}
              qrcodeValue={qrCodeVal}
              qrcodeSize={200}
            />
            <div className="friendlyRemainer">
              <h6>Before you start, please:</h6>
              <ul>
                <li>
                  <i></i>Prepare a valid government-issued ID{' '}
                </li>
                <li>
                  <i></i>Check if your phone’s camera is working
                </li>
                <li>
                  <i></i>Be prepared to take a selfie and photos of your ID
                </li>
              </ul>
            </div>
          </main>
        </div>
      </PMask>
    );
  }
);

export default KYCVerifyDialog;
