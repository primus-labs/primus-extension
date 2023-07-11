import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';

import KYCVerifyDialog from './KYCVerifyDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import {
  getConnectAntQrcode,
  getConnectAntResult,
} from '@/services/api/dataSource';
import { setKYCsAsync } from '@/store/actions';
import useInterval from '@/hooks/useInterval';
import { getCurrentDate } from '@/utils/utils';
import { KYCStoreVersion } from '@/config/constants';
import { exportJson } from '@/utils/exportFile';

import iconExport2 from '@/assets/img/iconExport2.svg'
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
    const [KYCRes, setKYCRes] = useState<string>('');

    const walletAddress = useSelector(
      (state: UserState) => state.walletAddress
    );
    const userInfo = useSelector((state: UserState) => state.userInfo);
    const requestConfigParams = useMemo(() => {
      const { id, token } = userInfo;
      const requestConfigP = {
        extraHeader: {
          'user-id': id,
          Authorization: `Bearer ${token}`,
        },
      };
      return requestConfigP;
    }, [userInfo]);

    const dispatch: Dispatch<any> = useDispatch();

    const [qrCodeVal, setQrCodeVal] = useState<string>('');

    const onSubmitActiveRequestDialog = useCallback(() => {
      const jsonStr = JSON.stringify(KYCRes, null, '\t');
      exportJson(jsonStr, 'eKYC verification result');
    }, [KYCRes]);

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
          const { status, credentialInfo, orderId, credentialType } = result;
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
              setActiveRequest({
                type: 'loading',
                title: 'Committing',
                desc: 'You are currently performing on your phone.',
              });
              break;
            case 'SUCCESS':
              console.log('ant connected!');
              setSwitchFlag(false);
              setKYCRes(result);
              setActiveRequest({
                type: 'suc',
                title: 'Congratulations',
                desc: 'Your eKYC verification result has been generated.',
              });
              const lowerCaseSourceName =
                activeSource?.name.toLowerCase() as string;
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
        } else {
          setActiveRequest({
            type: 'error',
            title: 'Failed',
            desc: 'Your eKYC verification failed.',
          });
        }
      } catch {
        setActiveRequest({
          type: 'error',
          title: 'Failed',
          desc: 'Your eKYC verification failed.',
        });
        console.log('getConnectAntResult network error');
      }
    }, [requestConfigParams, orderId, dispatch, activeSource?.name]);
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

    const footerButton = (
      <button className="nextBtn" onClick={onSubmitActiveRequestDialog}>
        <img src={iconExport2} alt="" className="iconPrefix" />
        <span>Authorize to import </span>
      </button>
    );
    
    
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
            footerButton={footerButton}
          />
        )}
      </>
    );
  }
);

export default KYCVerify;
