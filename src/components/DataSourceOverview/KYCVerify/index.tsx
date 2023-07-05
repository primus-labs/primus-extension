import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';

import KYCVerifyDialog from '@/components/DataSourceOverview/KYCVerifyDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import {
  getConnectAntQrcode,
  getConnectAntResult,
} from '@/services/api/dataSource';
import { setKYCsAsync } from '@/store/actions';
import useInterval from '@/hooks/useInterval';
import { getCurrentDate } from '@/utils/utils';
import { KYCStoreVersion } from '@/config/constants';



import './index.sass';

import type { ExchangeMeta } from '@/types/dataSource';
import type { ActiveRequestType } from '@/types/config';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';

const POLLINGTIME = 3000;

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
  onCancel: () => void;
}

const KYCVerify: React.FC<KYCVerifyProps> = memo(
  ({ onClose, onSubmit, activeSource, onCancel }) => {
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>({
      type: 'loading',
      title: 'Processing',
      desc: 'You are currently performing on your phone.',
    });
    const [step, setStep] = useState<number>(1);
    const [switchFlag, setSwitchFlag] = useState<boolean>(false);
    const [orderId, setOrderId] = useState<string>('');

    const walletAddress = useSelector(
      (state: UserState) => state.walletAddress
    );
    const userInfo = useSelector((state: UserState) => state.userInfo);
    const requestConfigParams = useMemo(() => {
      const { token } = userInfo;
      const requestConfigParams = {
        extraHeader: {
          Authorization: `Bearer ${token}`,
        },
      };
      return requestConfigParams;
    }, [userInfo]);
   
    const dispatch: Dispatch<any> = useDispatch();
    
    const [qrCodeVal, setQrCodeVal] = useState<string>('');

    const onSubmitActiveRequestDialog = useCallback(() => {
      onSubmit();
    }, [onSubmit]);

    const fetchConnectResult = useCallback(async () => {
      const params = {
        orderId,
      };
      try {
        const { rc, result } = await getConnectAntResult(
          params,
          requestConfigParams
        );
        if (rc === 0) {
          const { status,credentialInfo,orderId,credentialType } = result;
          switch (status) {
            case 'INIT':
              break;
            case 'VERIFY':
              setStep(2);
              setActiveRequest({
                type: 'loading',
                title: 'Processing',
                desc: 'You are currently performing on your phone.',
              });
              break;
            case 'COMMIT':
              break;
            case 'SUCCESS':
              console.log('ant connected!');
              setSwitchFlag(false);
              setActiveRequest({
                type: 'suc',
                title: 'Congratulations',
                desc: 'Your eKYC verification result has been generated.',
              });
              const lowerCaseSourceName = activeSource?.name.toLowerCase() as string;
              const kycSourceData = {
                credential: credentialInfo.credential,
                transactionHash: credentialInfo.transactionHash,
                // credentialType,
                // orderId,
                date: getCurrentDate(),
                timestamp: +new Date(),
                version: KYCStoreVersion,
              };
              await chrome.storage.local.set({
                [lowerCaseSourceName]: JSON.stringify(kycSourceData),
              });
              dispatch(setKYCsAsync());
              
              break;
          }
        }
      } catch {
        alert('getConnectAntResult network error');
      }
    }, [requestConfigParams, orderId]);
    useInterval(fetchConnectResult, POLLINGTIME, switchFlag, false);
    const fetchConnectQrcodeValue = useCallback(async () => {
      const params = {
        userIdentity: walletAddress as string,
      };
      try {
        const { rc, result } = await getConnectAntQrcode(
          params,
          requestConfigParams
        );
        if (rc === 0) {
          // const jsonStr = JSON.stringify(result);
          setOrderId(result.orderId);
          setQrCodeVal(result.verifyUrl);
          setSwitchFlag(true);
        } else {
          alert('getConnectAntQrcode network error');
        }
      } catch {
        alert('getConnectAntQrcode network error');
      }
    }, [walletAddress, requestConfigParams]);

    useEffect(() => {
      fetchConnectQrcodeValue();
    }, [fetchConnectQrcodeValue]);
    return (
      <>
        {step === 1 && (
          <KYCVerifyDialog
            onClose={onClose}
            onCancel={onCancel}
            activeSource={activeSource}
            qrCodeVal={qrCodeVal}
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
