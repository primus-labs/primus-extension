import React, { memo } from 'react';
import { useSearchParams } from 'react-router-dom';

import Bridge from '@/components/DataSourceOverview/Bridge/index';
import PMask from '@/components/PMask';
import QRCodeMain from '@/components/Cred/QRCodeDialog/QRCodeMain';
import PBack from '@/components/PBack';

import './index.scss';

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

const rules = [
  'Prepare a valid government-issued ID',
  'Check if your phone’s camera is working',
  'Be prepared to take a selfie and photos of your ID',
];
const KYCVerifyDialog: React.FC<KYCVerifyDialogProps> = memo(
  ({ onClose, activeSource, onCancel, qrCodeVal }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
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
            {/* <header>
              <h1>Verify Your Identity</h1>
              <h2>
                Use your phone to scan the QR code and initiate an identity
                verification process through ZAN's POV service.
              </h2>
            </header> */}
            <QRCodeMain
              title="Verify Your Identity"
              desc="Use your phone to scan the QR code and initiate an identity
                verification process through ZAN's POV service."
              qrcodeValue={qrCodeVal}
              qrcodeSize={200}
            />
          </main>
          <div className="bottomSafeTip">
            PADO never participates in the entire process.
          </div>
        </div>
      </PMask>
    );
  }
);

export default KYCVerifyDialog;
