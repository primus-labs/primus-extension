import React, {
  FC,
  useState,
  useMemo,
  memo,
  useCallback,
  useEffect,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { utils } from 'ethers';
import { formatAddress } from '@/utils/utils';
import { WALLETMAP } from '@/config/wallet';
import {
  setConnectWalletActionAsync,
  setConnectedWalletsActionAsync,
} from '@/store/actions';

import PButton from '@/newComponents/PButton';
import iconClose from '@/assets/newImg/layout/iconClose.svg';
import './index.scss';
import type { UserState } from '@/types/store';
import { switchAccount } from '@/services/wallets/metamask';
interface PConnectProps {
  onConnect: () => void;
}
const PConnect: FC<PConnectProps> = memo(({ onConnect }) => {
  const dispatch: React.Dispatch<any> = useDispatch();
  const connectedWallets = useSelector(
    (state: UserState) => state.connectedWallets
  );

  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  console.log('222connectedWallets', connectedWallets, connectedWallet); //delete

  const showAddr = useMemo(() => {
    return formatAddress(
      connectedWallet?.address
        ? utils.getAddress(connectedWallet?.address)
        : '',
      7,
      5,
      '...'
    );
  }, [connectedWallet?.address]);

  /*const handleConnectOther = useCallback(() => {
    dispatch(setConnectWalletActionAsync(undefined));
    onConnect();
  }, [onConnect]);*/
  const handleConnectOther = () => {
    switchAccount(connectedWallet?.provider);
  };
  const handleDisConnect = useCallback(
    async (e, wk, addrK) => {
      e.stopPropagation();
      // console.log('222', wk, addrK);
      
      
      const newrecords = { ...connectedWallets };
      delete newrecords[wk][addrK];
      if (Object.keys(newrecords[wk]).length === 0) {
        delete newrecords[wk];
      }
      await chrome.storage.local.set({
        connectedWallets: JSON.stringify(newrecords),
      });
      await dispatch(setConnectedWalletsActionAsync());
      if (addrK === connectedWallet?.address) {
        const firstWK = Object.keys(connectedWallets).filter(
          (i) => i !== 'undefined'
        )[0];
        if (firstWK) {
          const firstAddrK = Object.keys(connectedWallets[firstWK])[0];
          await dispatch(
            setConnectWalletActionAsync({
              id: 'metamask',
              name: 'MetaMask',
              address: firstAddrK,
              provider: connectedWallet?.provider,
            })
          );
        } else {
          await dispatch(setConnectWalletActionAsync(undefined));
        }
      }
    },
    [connectedWallets]
  );
  const handleChangeAddress = (addr: any) => {
    if (addr === connectedWallet?.address) {
      return;
    }
    dispatch(
      setConnectWalletActionAsync({
        id: 'metamask',
        name: 'MetaMask',
        address: addr,
        provider: connectedWallet?.provider,
      })
    );
  };

  return (
    <div className="pConnected">
      <div className="addressWrapper">
        <span>{showAddr}</span>
        <i className="iconfont icon-DownArrow"></i>
      </div>
      <div className="historyWrapper">
        <ul className="walletItems">
          {Object.keys(connectedWallets)
            .filter((wK) => wK !== 'undefined')
            .map((wK, k) => {
              return (
                <li className="walletItem" key={k}>
                  <div className="recordItem">
                    <div className="left">
                      <img
                        src={WALLETMAP[wK]?.icon}
                        alt=""
                        className="iconWallet"
                      />
                      <span>{WALLETMAP[wK]?.name}</span>
                    </div>
                  </div>
                  {Object.keys(connectedWallets[wK])?.map((addrK, addrKIdx) => {
                    return (
                      <div
                        className="recordItem addressItem"
                        onClick={() => handleChangeAddress(addrK)}
                        key={addrKIdx}
                      >
                        <div className="left">
                          {addrK === connectedWallet?.address ? (
                            <i className="iconfont icon-Legal"></i>
                          ) : (
                            <div className="placeHolder"></div>
                          )}

                          <span>
                            {formatAddress(
                              utils.getAddress(addrK),
                              7,
                              5,
                              '...'
                            )}
                          </span>
                        </div>
                        
                        {addrK !== connectedWallet?.address && (
                          <img
                            src={iconClose}
                            alt=""
                            className="right iconClose"
                            onClick={(e) => {
                              handleDisConnect(e, wK, addrK);
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </li>
              );
            })}
        </ul>
        <PButton
          text="Connect another wallet"
          type="text2"
          prefix={<i className="iconfont icon-Add"></i>}
          className="fullWidth connectBtn"
          onClick={handleConnectOther}
        />
      </div>
    </div>
  );
});

export default PConnect;
