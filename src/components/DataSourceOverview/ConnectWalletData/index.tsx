import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BigNumber from 'bignumber.js';
import ConnectWalletDataDialog from './ConnectWalletDataDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import { setOnChainAssetsSourcesAsync } from '@/store/actions';
import { div, mul, gt, add, sub } from '@/utils/utils';
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

    const getStatisticalData = (res: any) => {
      const { nativeToken, erc20Token } = res;
      const tokenMap: any = {};
      let totalBalance: any = 0;
      const chainsAssetsMapReduceF: (
        prevChainsAssetMap: any,
        curChainName: string
      ) => ChainAssetsMap = (prevChainsAssetMap, curChainName) => {
        const curChainAssetArr =
          erc20Token[curChainName as keyof typeof erc20Token] ?? [];

        if (curChainAssetArr) {
          // erc20 token
          const curChainAssetMapReduceF = (prev: any, currTokenInfo: any) => {
            const {
              balance,
              contract_address,
              current_usd_price,
              decimals,
              symbol,
              logos,
            } = currTokenInfo;

            const amount = div(parseInt(balance), Math.pow(10, decimals));
            const amtNum = amount.toNumber();
            if (gt(amtNum, 0)) {
              const price = current_usd_price ?? 0;
              const rawValue = mul(amtNum, price);
              const value = rawValue.toFixed();
              const logo = logos[0]?.uri; // TODO default img
              const assetAddrASymbol = `${symbol}---${contract_address}`;
              const tokenInfoObj = {
                symbol,
                amount: amount.toFixed(),
                price,
                value,
                logo,
              };

              if (assetAddrASymbol in tokenMap) {
                const { amount: lastAmt } = tokenMap[assetAddrASymbol];
                const newAmt = add(lastAmt.toNumber(), amtNum);
                const newValue = mul(newAmt.toNumber(), price).toFixed();
                tokenMap[assetAddrASymbol] = {
                  ...tokenMap[assetAddrASymbol],
                  amount: newAmt.toFixed(),
                  value: newValue,
                };
              } else {
                tokenMap[assetAddrASymbol] = tokenInfoObj;
              }
              totalBalance = add(totalBalance, rawValue.toNumber());
              prev[assetAddrASymbol] = tokenInfoObj;
            }
            return prev;
          };
          const curChainAssetMap = curChainAssetArr.reduce(
            curChainAssetMapReduceF,
            {}
          );
          console.log('curChainAssetMap', curChainAssetMap);

          // native token
          const curChainNativeToken: any = nativeToken.find(
            (i) => i.chain === curChainName
          );
          const { balance, currentUsdPrice, currency } = curChainNativeToken;
          const curChainNativeTokenAmount = div(
            parseInt(balance),
            Math.pow(10, 18)
          );
          const curChainNativeTokenAmountNum =
            curChainNativeTokenAmount.toNumber();

          if (gt(curChainNativeTokenAmountNum, 0)) {
            const price = currentUsdPrice ?? 0;
            const rawValue = mul(curChainNativeTokenAmountNum, price);
            const value = rawValue.toFixed();
            const tokenInfoObj = {
              symbol: currency,
              amount: curChainNativeTokenAmount.toFixed(),
              price,
              value,
              isNative: true,
            };
            if (currency in tokenMap) {
              const { amount: lastAmt } = tokenMap[currency];
              const newAmt = add(
                Number(lastAmt),
                curChainNativeTokenAmountNum
              );
              const newValue = mul(newAmt.toNumber(), price).toFixed();
              tokenMap[currency] = {
                ...tokenMap[currency],
                amount: newAmt.toFixed(),
                value: newValue,
              };
            } else {
              tokenMap[currency] = tokenInfoObj;
            }
            totalBalance = add(totalBalance, rawValue.toNumber());

            curChainAssetMap[currency] = {
              symbol: currency,
              amount: curChainNativeTokenAmount.toFixed(),
              price,
              value,
              isNative: true,
            };
          }
          prevChainsAssetMap[curChainName] = curChainAssetMap;
        }
        return prevChainsAssetMap;
      };
      const chainsAssetsMap = Object.keys(erc20Token).reduce(
        chainsAssetsMapReduceF,
        {}
      );

      return {
        tokenListMap: tokenMap,
        chainsAssetsMap,
        totalBalance: totalBalance.toFixed(),
      };
    };
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
          const timestamp = +new Date() + '';
          const signRes = await requestSign(curConnectedAddr, timestamp);
          const { rc, result } = await getAssetsOnChains({
            signature: signRes,
            timestamp,
            address: curConnectedAddr,
          });
          if (rc === 0) {
            // const result = {
            //   nativeToken: [
            //     {
            //       chain: 'Arbitrum One',
            //       chainId: 42161,
            //       currency: 'ETH',
            //       balance: '0x66f47b56125c67',
            //       currentUsdPrice: '1930.21000000',
            //     },
            //     {
            //       chain: 'BSC',
            //       chainId: 56,
            //       currency: 'BNB',
            //       balance: '0x5a33caceee035',
            //       currentUsdPrice: '243.70000000',
            //     },
            //     {
            //       chain: 'Ethereum',
            //       chainId: 1,
            //       currency: 'ETH',
            //       balance: '0x9471eb6de535df',
            //       currentUsdPrice: '1930.21000000',
            //     },
            //     {
            //       chain: 'Polygon',
            //       chainId: 137,
            //       currency: 'MATIC',
            //       balance: '0x470de4df820000',
            //       currentUsdPrice: '0.77950000',
            //     },
            //     {
            //       chain: 'Avalanche',
            //       chainId: 43114,
            //       currency: 'AVAX',
            //       balance: '0x0',
            //       currentUsdPrice: '14.46000000',
            //     },
            //     {
            //       chain: 'Optimism',
            //       chainId: 10,
            //       currency: 'ETH',
            //       balance: '0x0',
            //       currentUsdPrice: '1930.21000000',
            //     },
            //   ],
            //   erc20Token: {
            //     'Arbitrum One': null,
            //     BSC: [
            //       {
            //         balance: '55437308182660911/1',
            //         contract_address:
            //           '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
            //         current_usd_price: '0.08',
            //         decimals: 18,
            //         logos: [
            //           {
            //             height: 250,
            //             uri: 'https://static.chainbase.online/logo/bsc/0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82.png',
            //             width: 250,
            //           },
            //         ],
            //         name: 'PancakeSwap Token',
            //         symbol: 'Cake',
            //         total_supply: '1246774215751051201610995531',
            //         urls: [
            //           {
            //             name: 'homepage',
            //             url: 'https://pancakeswap.finance/',
            //           },
            //         ],
            //       },
            //       {
            //         balance: '1000000000000/1',
            //         contract_address:
            //           '0x35122d1fe8001296f61290b8ba42ef597af31fb7',
            //         current_usd_price: 0,
            //         decimals: 6,
            //         logos: [],
            //         name: 'Wrapped ADAX',
            //         symbol: 'wADAX',
            //         total_supply: '100000000000000',
            //         urls: [],
            //       },
            //       {
            //         balance: '23000000000/1',
            //         contract_address:
            //           '0xd048b4c23af828e5be412505a51a8dd7b37782dd',
            //         current_usd_price: 0,
            //         decimals: 6,
            //         logos: [],
            //         name: 'AI Avail',
            //         symbol: 'AI-A',
            //         total_supply: '2000000000000',
            //         urls: [],
            //       },
            //     ],
            //     Ethereum: [
            //       {
            //         balance: '286497881386117044/1',
            //         contract_address:
            //           '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            //         current_usd_price: '1.73',
            //         decimals: 18,
            //         logos: [
            //           {
            //             height: 250,
            //             uri: 'https://static.chainbase.online/logo/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png',
            //             width: 250,
            //           },
            //         ],
            //         name: 'Uniswap',
            //         symbol: 'UNI',
            //         total_supply: '1000000000000000000000000000',
            //         urls: [
            //           {
            //             name: 'homepage',
            //             url: 'https://uniswap.org/',
            //           },
            //         ],
            //       },
            //       {
            //         balance: '10010000000000000000/1',
            //         contract_address:
            //           '0xbddab785b306bcd9fb056da189615cc8ece1d823',
            //         current_usd_price: 0,
            //         decimals: 18,
            //         logos: [],
            //         name: 'Ebakus',
            //         symbol: 'EBK',
            //         total_supply: '100000000000000000000000000',
            //         urls: [],
            //       },
            //       {
            //         balance: '88888800000000/1',
            //         contract_address:
            //           '0xc12d1c73ee7dc3615ba4e37e4abfdbddfa38907e',
            //         current_usd_price: 0,
            //         decimals: 8,
            //         logos: [],
            //         name: 'KickToken',
            //         symbol: 'KICK',
            //         total_supply: '125123346789819622107',
            //         urls: [],
            //       },
            //     ],
            //     Polygon: null,
            //     Avalanche: null,
            //     Optimism: null,
            //   },
            // };

            const res = getStatisticalData(result);

            const curAccOnChainAssetsItem: any = {
              address: curConnectedAddr,
              label,
              date: getCurrentDate(),
              timestamp: +new Date(),
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
