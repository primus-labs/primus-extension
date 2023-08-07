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
          if (!signature) {
            setActiveRequest({
              type: 'error',
              title: 'Failed',
              desc: errorDescEl,
            });
            return;
          }
          const { rc, result, msg } = await getAssetsOnChains({
            signature,
            timestamp,
            address: curConnectedAddr,
          });

          if (rc === 0) {
            const result = {
              nativeToken: [
                {
                  chain: 'Ethereum',
                  chainId: 1,
                  currency: 'ETH',
                  balance: '0x9471eb6de535df',
                  currentUsdPrice: '1843.77000000',
                },
                {
                  chain: 'Polygon',
                  chainId: 137,
                  currency: 'MATIC',
                  balance: '0x470de4df820000',
                  currentUsdPrice: '0.67850000',
                },
                {
                  chain: 'BSC',
                  chainId: 56,
                  currency: 'BNB',
                  balance: '0xf14f7a478e75035',
                  currentUsdPrice: '244.00000000',
                },
                {
                  chain: 'Avalanche',
                  chainId: 43114,
                  currency: 'AVAX',
                  balance: '0x0',
                  currentUsdPrice: '12.74000000',
                },
                {
                  chain: 'Arbitrum One',
                  chainId: 42161,
                  currency: 'ETH',
                  balance: '0x11282c06b0c0',
                  currentUsdPrice: '1843.77000000',
                },
                {
                  chain: 'Optimism',
                  chainId: 10,
                  currency: 'ETH',
                  balance: '0x0',
                  currentUsdPrice: '1843.77000000',
                },
              ],
              erc20Token: {
                'Arbitrum One': null,
                BSC: [
                  {
                    contractAddress:
                      '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
                    decimals: '18',
                    name: 'PancakeSwap Token',
                    symbol: 'Cake',
                    totalSupply: '1246774215751051201610995531',
                    logos: [
                      {
                        height: 250,
                        width: 250,
                        uri: 'https://static.chainbase.online/logo/bsc/0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82.png',
                      },
                    ],
                    urls: [
                      {
                        name: 'homepage',
                        url: 'https://pancakeswap.finance/',
                      },
                    ],
                    currentUsdPrice: '1.443071509468086788',
                    balance: '0xc4f3f02588072f',
                  },
                ],
                Ethereum: [
                  {
                    contractAddress:
                      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
                    decimals: '18',
                    name: 'Uniswap',
                    symbol: 'UNI',
                    totalSupply: '1000000000000000000000000000',
                    logos: [
                      {
                        height: 250,
                        width: 250,
                        uri: 'https://static.chainbase.online/logo/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png',
                      },
                    ],
                    urls: [
                      {
                        name: 'homepage',
                        url: 'https://uniswap.org/',
                      },
                    ],
                    currentUsdPrice: '5.968630524340283079',
                    balance: '0x3f9d84e20ebe7b4',
                  },
                ],
                Polygon: null,
                Avalanche: null,
                Optimism: null,
              },
            };

            const res = getStatisticalData(result);

            const curAccOnChainAssetsItem: any = {
              address: curConnectedAddr,
              label,
              date: getCurrentDate(),
              timestamp: timestamp,
              signature,
              ...res,
              ...DATASOURCEMAP['onChain'],
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
            activeSource={DATASOURCEMAP['onChain']}
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
