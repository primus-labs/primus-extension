import React, { memo } from 'react';
import Bridge from '@/components/DataSourceOverview/Bridge/index';
import PMask from '@/components/PMask';
import QRCodeMain from '@/components/Cred/QRCodeMain';
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

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog kycVerifyDialog">
          <PBack onBack={onCancel} />
          <main>
            <Bridge endIcon={icon} />
            <QRCodeMain
              title="Let’s get you verified"
              desc="You can scan this QR code to complete a verification process through your smart phone. Provided by ZAN."
              qrcodeValue={qrCodeVal}
              qrcodeSize={159}
            />
            <div className="friendlyRemainer">
              <h6>Before you start, please:</h6>
              <ul>
                <li>
                  <i></i>Prepare a valid government-issued ID{' '}
                </li>
                <li>
                  <i></i>Check if your smart phone’s camera is working
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
