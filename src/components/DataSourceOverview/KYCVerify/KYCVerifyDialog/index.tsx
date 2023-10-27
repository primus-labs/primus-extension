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
            <QRCodeMain
              title="Get You Verified"
              desc={descEl}
              qrcodeValue={qrCodeVal}
              qrcodeSize={200}
            />
            <div className="descContent">
              <p className="title">Before you start, please:</p>
              <ul className="rules">
                {rules.map((i, k) => {
                  return (
                    <li key={k}>
                      <i>
                        <span></span>
                      </i>
                      <span>{i}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </main>
        </div>
      </PMask>
    );
  }
);

export default KYCVerifyDialog;
