import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BigNumber from 'bignumber.js';
import {
  useWeb3Modal,
  useWeb3ModalState,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers5/react';
import {setConnectWalletActionAsync} from '@/store/actions'
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
    const [walletLabel, setWalletLabel] = useState<string>();
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
    const [step, setStep] = useState<number>(1);
    const { open } = useWeb3Modal();
    const {
      address: walletConnectAddress,
      isConnected: walletConnectIsConnect,
    } = useWeb3ModalAccount();
    const { walletProvider: walletConnectProvider } = useWeb3ModalProvider();

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
    const connectWalletAsyncFn = useCallback(
      (connectObj?: any) => {
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
            type: 'warn',
            title: 'Unable to proceed',
            desc: errorDescEl,
          });
        };
        const sucFn = async (walletObj: any) => {
          try {
            var { signature, timestamp, address: curConnectedAddr } = walletObj;
            if (!signature && !timestamp) {
              timestamp = +new Date() + '';
              const walletInfo =
                connectObj?.name === 'walletconnect'
                  ? {
                      walletName: connectObj?.name,
                      walletProvider: connectObj.provider,
                    }
                  : undefined;
              signature = await requestSign(
                curConnectedAddr,
                timestamp,
                walletInfo
              );
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
                walletLabel
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
        dispatch(
          connectWalletAsync(
            connectObj,
            startFn,
            errorFn,
            sucFn,
            undefined,
            walletLabel
          )
        );
      },
      [dispatch, errorDescEl, walletLabel]
    );
    const onSubmitConnectWalletDataDialog = useCallback(
      async (item: WALLETITEMTYPE, label?: string) => {
        setWalletLabel(label);
        if (item?.name === 'MetaMask') {
          connectWalletAsyncFn(undefined);
        } else if (item?.name === 'WalletConnect') {
          open();
        }
      },
      [connectWalletAsyncFn, open]
    );
    useEffect(() => {
      if (walletConnectIsConnect) {
        connectWalletAsyncFn({
          name: 'walletconnect',
          provider: walletConnectProvider,
          address: walletConnectAddress,
        });
      } else {
        dispatch(setConnectWalletActionAsync(undefined));
      }
    }, [
      walletConnectProvider,
      walletConnectAddress,
      walletConnectIsConnect,
      connectWalletAsyncFn,
      dispatch
    ]);
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
