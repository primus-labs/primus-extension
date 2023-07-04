import React, { useState, useEffect, memo, useCallback } from 'react';

import Bridge from '@/components/DataSourceOverview/Bridge/index';
import PMask from '@/components/PMask';
import QRCodeMain from '@/components/Cred/QRCodeMain';
import PBack from '@/components/PBack';
import './index.sass';

import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
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
  onSubmit: () => void;
  // loading?: boolean;
  onCancel: () => void;
  // activeSourceKeys?: GetDataFormProps;
}

const KYCVerifyDialog: React.FC<KYCVerifyDialogProps> = memo(
  ({
    onClose,
    onSubmit,
    activeSource,
    // loading = false,
    onCancel,
    // activeSourceKeys,
  }) => {
    // const requirePassphase = activeSource?.requirePassphase;
    const icon = activeSource?.icon;
    // const name = activeSource?.name ?? '';

    // const [apiKey, setApiKey] = useState<string>();
    // const [secretKey, setSecretKey] = useState<string>();
    // const [passphase, setPassphase] = useState<string>();
    // const [label, setLabel] = useState<string>();
    // const [submitted, setSubmitted] = useState<boolean>(false);
    const [qrCodeVal, setQrCodeVal] = useState<string>('');
    

    const handleClickNext = () => {
      // setSubmitted(true);
      // if (loading) {
      //   return;
      // }
      // if (!apiKey || !secretKey || (requirePassphase && !passphase)) {
      //   return;
      // }
      // setSubmitted(false);
      // const form = {
      //   name: name.toLowerCase(),
      //   apiKey,
      //   secretKey,
      //   passphase,
      //   label,
      // };
      // requirePassphase && (form.passphase = passphase);
      onSubmit();
    };

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
          <button className="nextBtn" onClick={handleClickNext}>
            Next
          </button>
        </div>
      </PMask>
    );
  }
);

export default KYCVerifyDialog;
