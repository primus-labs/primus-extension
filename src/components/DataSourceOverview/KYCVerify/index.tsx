import React, { useState, useEffect, memo, useCallback } from 'react';
import {useDispatch } from 'react-redux';

import KYCVerifyDialog from '@/components/DataSourceOverview/KYCVerifyDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';

import {setKYCsAsync} from '@/store/actions'
import './index.sass';

import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
import type { ExchangeMeta } from '@/types/dataSource';
import type { ActiveRequestType } from '@/types/config';
import type { Dispatch } from 'react';

export type GetDataFormProps = {
  name: string;
  apiKey: string;
  secretKey: string;
  passphase?: string;
  label?: string;
};
interface KYCVerifyProps {
  onClose: () => void;
  activeSource?: ExchangeMeta;
  onSubmit: () => void;
  // loading?: boolean;
  onCancel: () => void;
  // activeSourceKeys?: GetDataFormProps;
}

const KYCVerify: React.FC<KYCVerifyProps> = memo(
  ({
    onClose,
    onSubmit,
    activeSource,
    // loading = false,
    onCancel,
    // activeSourceKeys,
  }) => {
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>({
      type: 'loading',
      title: 'Processing',
      desc: 'You are currently performing on your phone.',
    });
    const [step,setStep] = useState<number>(1)
    // const requirePassphase = activeSource?.requirePassphase;
    const icon = activeSource?.icon;
    const dispatch: Dispatch<any> = useDispatch();
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
    const onSubmitKYCVerifyDialog = useCallback(() => {
      setStep(2)
    }, [])
    const onSubmitActiveRequestDialog=useCallback(() => {
      // setActiveRequest({
      //   type: 'suc',
      //   title: 'Congratulations',
      //   desc: 'Your eKYC verification result has been generated.',
      // });
      // await chrome.storage.local.set({
      //   [lowerCaseSourceName]: JSON.stringify(socialSourceData),
      // });
      // dispatch(setKYCsAsync());
    }, [])

    return (
      <>
        {step === 1 && (
          <KYCVerifyDialog
            onClose={onClose}
            onCancel={onCancel}
            activeSource={activeSource}
            onSubmit={onSubmitKYCVerifyDialog}
          />
        )}
        {step === 2 && (
        <AddSourceSucDialog
          onClose={onClose}
          onSubmit={onSubmitActiveRequestDialog}
          activeSource={activeSource}
          type={activeRequest?.type}
          title={activeRequest?.title}
          desc={activeRequest?.desc}
        />
      )}
        
      </>
    );
  }
);

export default KYCVerify;
