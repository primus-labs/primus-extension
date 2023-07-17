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
import { getNaclEncryptionPublicKey, naclDecrypt } from '@/utils/naclcrypto';
import {postMsg} from '@/utils/utils'

import type { ExchangeMeta } from '@/types/dataSource';
import type { ActiveRequestType } from '@/types/config';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import iconExport2 from '@/assets/img/iconExport2.svg';
import './index.sass';
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
      desc: 'Please complete the operation on your phone.',
    }); 
    const [step, setStep] = useState<number>(1);
    const [switchFlag, setSwitchFlag] = useState<boolean>(false);
    const [orderId, setOrderId] = useState<string>('');
    const [KYCRes, setKYCRes] = useState<any>();
    const [privateKey, setPrivateKey] = useState<string>('');
    const userPassword = useSelector((state: UserState) => state.userPassword);

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
    const padoServicePort = useSelector(
      (state: UserState) => state.padoServicePort
    );

    const dispatch: Dispatch<any> = useDispatch();

    const [qrCodeVal, setQrCodeVal] = useState<string>('');

    const padoServicePortListener = useCallback(
      function (message: any) {
        if (message.resMethodName === 'decrypt') {
          console.log('page_get:decrypt:', 'exportWallet');
          if (message.res) {
            const { privateKey } = message.res;
            let formatPrivate = privateKey;
            if (privateKey.startsWith('0x')) {
              formatPrivate = privateKey.substr(2);
            }
            setPrivateKey(formatPrivate);
          } else {
            alert('Failed to decrypt wallet');
          }
          padoServicePort.onMessage.removeListener(padoServicePortListener);
        }
      },
      [padoServicePort.onMessage]
    );
    const decryptingKeyStore = useCallback(() => {
      if (userPassword) {
        const msgPassword = {
          fullScreenType: 'wallet',
          reqMethodName: 'resetUserPassword',
          params: {
            password: userPassword,
          },
        };
        postMsg(padoServicePort, msgPassword);
      }
      const msg = {
        fullScreenType: 'wallet',
        reqMethodName: `decrypt`,
        params: {},
      };
      postMsg(padoServicePort, msg);
    }, [padoServicePort, userPassword]);
    const onSubmitActiveRequestDialog = useCallback(async () => {
      const lowerCaseSourceName = activeSource?.name.toLowerCase() as string;
      await chrome.storage.local.set({
        [lowerCaseSourceName]: JSON.stringify(KYCRes),
      });
      await dispatch(setKYCsAsync());
      onClose();
    }, [KYCRes, activeSource?.name, dispatch, onClose]);

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
          const {
            status,
            credentialInfo,
            orderId,
            credentialType,
            verifyInfo,
          } = result;
          switch (status) {
            case 'INIT':
              break;
            case 'VERIFY':
              setStep(2);
              setActiveRequest({
                type: 'loading',
                title: 'Processing',
                desc: 'Please complete the operation on your phone.',
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
              const kycInfoJSON = naclDecrypt(verifyInfo, privateKey);
              const kycInfo = JSON.parse(kycInfoJSON);
              // "{"lastName":"","firstName":"","validUntil":"2025-11-30","dateOfBirth":"1988-01-01"}"
              setActiveRequest({
                type: 'suc',
                title: 'Congratulations',
                desc: 'Your eKYC verification result has been generated.',
              });
              const { countryName, docName, lastName, firstName } = kycInfo;
              const firstNameLen = firstName.length
              const symbolStr = '*'.repeat(firstNameLen);
              const formatFullName =
                countryName === 'China' && docName === 'ID Card'
                  ? `${lastName}${symbolStr}`
                  : `***${lastName}`;
              const kycSourceData = {
                credential: credentialInfo.credential,
                transactionHash: credentialInfo.transactionHash,
                // credentialType,
                // orderId,
                date: getCurrentDate(),
                timestamp: +new Date(),
                version: KYCStoreVersion,
                ...kycInfo,
                fullName: formatFullName,
                cipher: JSON.stringify(verifyInfo),
              };
              setKYCRes(kycSourceData);
              break;
            case 'FAILED':
              setSwitchFlag(false);
              setActiveRequest({
                type: 'error',
                title: 'Failed',
                desc: 'Your eKYC verification failed.',
              });
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
    }, [requestConfigParams, orderId, privateKey]);
    useInterval(fetchConnectResult, POLLINGTIME, switchFlag, false);
    const fetchConnectQrcodeValue = useCallback(async () => {
      
      const userPublicKey = getNaclEncryptionPublicKey(privateKey);
      const params = {
        userIdentity: walletAddress as string,
        userPublicKey,
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
    }, [walletAddress, requestConfigParams, privateKey]);

    useEffect(() => {
      privateKey && fetchConnectQrcodeValue();
    }, [privateKey, fetchConnectQrcodeValue]);
    useEffect(() => {
      decryptingKeyStore();
    }, [decryptingKeyStore]);
    useEffect(() => {
      padoServicePort.onMessage.addListener(padoServicePortListener);
      return () => {
        padoServicePort.onMessage.removeListener(padoServicePortListener);
      };
    }, [padoServicePort.onMessage, padoServicePortListener]);

    const footerButton =
      activeRequest?.type === 'suc' ? (
        <button className="nextBtn" onClick={onSubmitActiveRequestDialog}>
          <img src={iconExport2} alt="" className="iconPrefix" />
          <span>Authorize to import </span>
        </button>
      ) : (
        <button className="nextBtn gray" onClick={onSubmitActiveRequestDialog}>
          <span>OK </span>
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
            closeable={activeRequest?.type !== 'suc'}
          />
        )}
      </>
    );
  }
);

export default KYCVerify;
