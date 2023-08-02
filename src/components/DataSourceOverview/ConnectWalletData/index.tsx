import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BigNumber from 'bignumber.js';
import ConnectWalletDataDialog from './ConnectWalletDataDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import { setOnChainAssetsSourcesAsync } from '@/store/actions';
import { div, mul, gt, add, sub, getStatisticalData } from '@/utils/utils';
import { getAssetsOnChains } from '@/services/api/dataSource';
import { connectWallet, requestSign } from '@/services/wallets/metamask';
import { DATASOURCEMAP } from '@/config/constants';
import { getCurrentDate } from '@/utils/utils';
import type { ActiveRequestType } from '@/types/config';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { WALLETITEMTYPE } from '@/config/constants';

import './index.sass';

import { ChainAssetsMap, TokenMap } from '@/types/dataSource';

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
        setActiveRequest({
          type: 'loading',
          title: 'Processing',
          desc: 'Please complete the transaction in your wallet.',
        });
        setStep(2);
        try {
          const [accounts, chainId, provider] = await connectWallet();
          const curConnectedAddr = (accounts as string[])[0];
          const timestamp: string = +new Date() + '';
          const signature = await requestSign(curConnectedAddr, timestamp);
          const { rc, result, msg } = await getAssetsOnChains({
            signature,
            timestamp,
            address: curConnectedAddr,
          });
          if (rc === 0) {
            const res = getStatisticalData(result);

            const curAccOnChainAssetsItem: any = {
              address: curConnectedAddr,
              label,
              date: getCurrentDate(),
              timestamp: timestamp,
              signature,
              ...res,
              ...DATASOURCEMAP['onChainAssets'],
            };

            const { onChainAssetsSources: lastOnChainAssetsMapStr } =
              await chrome.storage.local.get(['onChainAssetsSources']);

            const lastOnChainAssetsMap = lastOnChainAssetsMapStr
              ? JSON.parse(lastOnChainAssetsMapStr)
              : {};
            if (curConnectedAddr in lastOnChainAssetsMap) {
              const lastCurConnectedAddrInfo =
                lastOnChainAssetsMap[curConnectedAddr];
              const pnl = sub(
                curAccOnChainAssetsItem.totalBalance,
                lastCurConnectedAddrInfo.totalBalance
              ).toFixed();

              curAccOnChainAssetsItem.pnl = pnl;
              curAccOnChainAssetsItem.time = pnl;
            }
            lastOnChainAssetsMap[curConnectedAddr] = curAccOnChainAssetsItem;

            await chrome.storage.local.set({
              onChainAssetsSources: JSON.stringify(lastOnChainAssetsMap),
            });

            await dispatch(setOnChainAssetsSourcesAsync());
            setActiveRequest({
              type: 'suc',
              title: 'Congratulations',
              desc: 'Data Connected!',
            });
          } else {
            setActiveRequest({
              type: 'error',
              title: 'Failed',
              desc: msg,
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
    useEffect(() => {
      setActiveRequest(undefined);
      setStep(1);
    }, [visible]);
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
