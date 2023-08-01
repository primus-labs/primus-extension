import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { getAssetsOnChains } from '@/services/api/dataSource';
import { connectWallet, requestSign } from '@/services/wallets/metamask';
import ConnectWalletDataDialog from './ConnectWalletDataDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import {
  getConnectAntQrcode,
  getConnectAntResult,
} from '@/services/api/dataSource';
import { setKYCsAsync } from '@/store/actions';
import useInterval from '@/hooks/useInterval';
import useTimeout from '@/hooks/useTimeout';
import { getCurrentDate } from '@/utils/utils';
import { KYCStoreVersion } from '@/config/constants';
import { getNaclEncryptionPublicKey, naclDecrypt } from '@/utils/naclcrypto';
import { postMsg } from '@/utils/utils';
import { DATASOURCEMAP } from '@/config/constants';
import type { ExchangeMeta } from '@/types/dataSource';
import type { ActiveRequestType } from '@/types/config';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { WALLETITEMTYPE } from '@/config/constants';
import iconExport2 from '@/assets/img/iconExport2.svg';
import './index.sass';
import { Result } from 'antd';
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
  onSubmit: () => void;
  onCancel: () => void;
  visible?: boolean;
}

const ConnectWalletData: React.FC<KYCVerifyProps> = memo(
  ({ onClose, onSubmit, onCancel, visible = true }) => {
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
    const [step, setStep] = useState<number>(1);
    const [switchFlag, setSwitchFlag] = useState<boolean>(false);
    const [timeoutSwitch, setTimeoutSwitchFlag] = useState<boolean>(false);
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
    const errorDescEl = useMemo(
      () => (
        <>
          <p>Your wallet did not connect or refused to authorize.</p>
          <p>Please try again later.</p>
        </>
      ),
      []
    );

    const dispatch: Dispatch<any> = useDispatch();

    const onSubmitActiveRequestDialog = useCallback(async () => {
      if (activeRequest?.type === 'loading') {
        onClose();
      } else {
        onClose();
      }
    }, [onClose]);

    const onCloseStatusDialog = useCallback(() => {
      onClose();
    }, [onClose]);

    const onSubmitConnectWalletDataDialog = useCallback(
      async (item: WALLETITEMTYPE) => {
        setActiveRequest({
          type: 'loading',
          title: 'Processing',
          desc: 'Please complete the transaction in your wallet.',
        });
        setStep(2);
        try {
          const [accounts, chainId, provider] = await connectWallet();
          const curConnectedAddr = (accounts as string[])[0];
          const timestamp = +new Date() + ''
          const signRes = await requestSign(curConnectedAddr, timestamp);
          const { rc, result } = await getAssetsOnChains({
            signature: signRes,
            timestamp ,
            address: curConnectedAddr,
          });
          if (rc === 0) {
            setActiveRequest({
              type: 'suc',
              title: 'Congratulations',
              desc: 'Data Connected!',
            });
          } else {
            setActiveRequest({
              type: 'suc',
              title: 'Congratulations',
              desc: 'Data Connected!',
            });
          }
        } catch (e) {
          setActiveRequest({
            type: 'error',
            title: 'Failed',
            desc: errorDescEl,
          });
        }
      },
      [activeRequest?.type, onClose]
    );
    return (
      <>
        {visible && step === 1 && (
          <ConnectWalletDataDialog
            onClose={onClose}
            onCancel={onCancel}
            onSubmit={onSubmitConnectWalletDataDialog}
          />
        )}
        {visible && step === 2 && (
          <AddSourceSucDialog
            onClose={onCloseStatusDialog}
            onSubmit={onSubmitActiveRequestDialog}
            activeSource={DATASOURCEMAP['onChainAssets']}
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
          />
        )}
      </>
    );
  }
);

export default ConnectWalletData;
