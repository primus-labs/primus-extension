import React, { useState, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { WALLETITEMTYPE } from '@/config/constants';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import iconConnectWalletMetaMaskSuc from '@/assets/newImg/layout/iconConnectWalletMetaMaskSuc.svg';
import iconConnectWalletFail from '@/assets/newImg/layout/iconConnectWalletFail.svg';
import iconWalletMetamask from '@/assets/img/iconWalletMetamask.svg';
import './index.scss';
import PButton from '@/newComponents/PButton';

export type DataFieldItem = {
  icon: any;
  name: string;
  type: string;
  desc?: string;
  requirePassphase?: boolean;
};
interface DataSourcesDialogProps {
  onClose?: () => void;
  onSubmit?: () => void;
  activeRequest: any;
}
const ConnectWalletDialog: React.FC<DataSourcesDialogProps> = memo(
  ({ onClose, onSubmit, activeRequest }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');

    const [accountAddr, setAccountAddr] = useState<any>();
    const [errorTip, setErrorTip] = useState<string>();
    const [activeItem, setActiveItem] = useState<WALLETITEMTYPE>();
    // const list: DataFieldItem[] = WALLETLIST;

    const handleClose = useCallback(() => {
      // dispatch({
      //   type: 'setConnectWalletDialogVisible',
      //   payload: false,
      // });
      onClose && onClose();
    }, [onClose]);

    return (
      <PMask>
        <div className="pDialog2 ConnectWalletProcessDialog">
          <PClose onClick={handleClose} />
          <main>
            <div className="pic">
              {activeRequest?.type === 'loading' && (
                <>
                  <div className="spiner"></div>
                  <img src={iconWalletMetamask} alt="" className="walletImg" />
                </>
              )}
              {activeRequest?.type === 'suc' && (
                <img
                  src={iconConnectWalletMetaMaskSuc}
                  alt=""
                  className="resultImg"
                />
              )}
              {activeRequest?.type === 'fail' && (
                <img src={iconConnectWalletFail} alt="" className="resultImg" />
              )}
            </div>
            <div className="descWrapper">
              <h5>{activeRequest?.title}</h5>
              <h6>{activeRequest?.desc}</h6>
            </div>
            {activeRequest?.type === 'suc' ||
              (activeRequest?.type === 'fail' && (
                <PButton
                  text={activeRequest?.type === 'suc' ? 'Confirm' : 'Ok'}
                onClick={handleClose}
                className='fullWidth'
                />
              ))}
          </main>
        </div>
      </PMask>
    );
  }
);

export default ConnectWalletDialog;
