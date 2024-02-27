import React, {
  FC,
  useState,
  useMemo,
  memo,
  useCallback,
  useEffect,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { formatAddress } from '@/utils/utils';
import { WALLETMAP } from '@/config/wallet';
import { setConnectWalletActionAsync } from '@/store/actions';

import PButton from '@/newComponents/PButton';
import iconClose from '@/assets/newImg/layout/iconClose.svg';
import './index.scss';
import type { UserState } from '@/types/store';
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
  // console.log('222connectedWallets', connectedWallets, connectedWallet);//delete

  const showAddr = useMemo(() => {
    return formatAddress(connectedWallet?.address, 4, 4, '...');
  }, connectedWallet?.address);

  const handleConnectOther = useCallback(() => {
    dispatch(setConnectWalletActionAsync(undefined));
    onConnect();
  }, [onConnect]);
  const handleDisConnect = () => {
    dispatch(setConnectWalletActionAsync(undefined));
  };

  return (
    <div className="pConnected">
      <div className="addressWrapper">
        <span>{showAddr}</span>
        <i className="iconfont icon-DownArrow"></i>
      </div>
      <div className="historyWrapper">
        <ul className="walletItems">
          {Object.keys(connectedWallets).map((wK) => {
            return (
              <li className="walletItem">
                <div className="recordItem">
                  <div className="left">
                    <img
                      src={WALLETMAP[wK].icon}
                      alt=""
                      className="iconWallet"
                    />
                    <span>{WALLETMAP[wK].name}</span>
                  </div>
                </div>
                {Object.keys(connectedWallets[wK]).map((addrK) => {
                  return (
                    <div className="recordItem">
                      <div className="left">
                        {addrK === connectedWallet?.address ? (
                          <i className="iconfont icon-Legal"></i>
                        ) : (
                          <div className="placeHolder"></div>
                        )}
                        <span>{formatAddress(addrK, 4, 4, '...')}</span>
                      </div>
                      {addrK === connectedWallet?.address && (
                        <img
                          src={iconClose}
                          alt=""
                          className="right iconClose"
                          onClick={handleDisConnect}
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
          className="fullWidth"
          onClick={handleConnectOther}
        />
      </div>
    </div>
  );
});

export default PConnect;
