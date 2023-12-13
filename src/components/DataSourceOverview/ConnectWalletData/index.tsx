import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BigNumber from 'bignumber.js';
import ConnectWalletDataDialog from './ConnectWalletDataDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import { setOnChainAssetsSourcesAsync } from '@/store/actions';
import { div, mul, gt, add, sub, getStatisticalData } from '@/utils/utils';
import { getAssetsOnChains } from '@/services/api/dataSource';
import { connectWallet, requestSign } from '@/services/wallets/metamask';
import { DATASOURCEMAP, ONEMINUTE } from '@/config/constants';
import { getCurrentDate } from '@/utils/utils';
import { connectWalletAsync, getChainAssets } from '@/store/actions/index';
import type { ActiveRequestType } from '@/types/config';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { WALLETITEMTYPE } from '@/config/constants';

import { ChainAssetsMap, TokenMap } from '@/types/dataSource';
import { eventReport } from '@/services/api/usertracker';

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
type LogoItem = {
  width: string;
  height: string;
  uri: string;
};
type Erc20TokenItem = {
  balance: string;
  contract_address: string;
  current_usd_price: string | number | null;
  decimals: number;
  logos: LogoItem[];
  name: string;
  symbol: string;
  total_supply: string;
  urls: any[];
};
type Erc20TokenOnChainItem = Erc20TokenItem[];
type Erc20TokenOnChainsMap = {
  [propName: string]: Erc20TokenOnChainItem | null;
};
const ConnectWalletData: React.FC<KYCVerifyProps> = memo(
  ({ onClose, onSubmit, onCancel, visible = true }) => {
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
    const [step, setStep] = useState<number>(1);

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
      async (item: WALLETITEMTYPE, label?: string) => {
        // 1112
        const startFn = () => {
          setActiveRequest({
            type: 'loading',
            title: 'Processing',
            desc: 'Please complete the transaction in your wallet.',
          });
          setStep(2);
        };
        const errorFn = () => {
          setActiveRequest({
            type: 'error',
            title: 'Unable to proceed',
            desc: errorDescEl,
          });
        };
        const sucFn = async (walletObj: any) => {
          try {
            var { signature, timestamp, address: curConnectedAddr } = walletObj;
            
            if (!signature && !timestamp) {
              timestamp = +new Date() + '';
              signature = await requestSign(curConnectedAddr, timestamp);
              if (!signature) {
                setActiveRequest({
                  type: 'error',
                  title: 'Unable to proceed',
                  desc: errorDescEl,
                });
                return;
              }
              await getChainAssets(
                signature,
                timestamp,
                curConnectedAddr,
                dispatch,
                label
              );
            }
            setActiveRequest({
              type: 'suc',
              title: 'Congratulations',
              desc: 'Data Connected!',
            });
          } catch {
            setActiveRequest({
              type: 'error',
              title: 'Unable to proceed',
              desc: errorDescEl,
            });
          }
        };
        dispatch(connectWalletAsync(undefined, startFn, errorFn, sucFn,undefined,label));
      },
      [errorDescEl, dispatch]
    );
    useEffect(() => {
      setActiveRequest(undefined);
      setStep(1);
    }, [visible]);
    return (
      <div className="connectWalletDataWrapper">
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
            activeSource={DATASOURCEMAP['onChain']}
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
          />
        )}
      </div>
    );
  }
);

export default ConnectWalletData;
