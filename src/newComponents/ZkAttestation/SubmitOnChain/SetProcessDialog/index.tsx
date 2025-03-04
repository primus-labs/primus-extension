import React, { useState, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { WALLETITEMTYPE } from '@/config/constants';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import iconConnectWalletSuc from '@/assets/newImg/layout/iconConnectWalletSuc.png';
import iconConnectWalletFail from '@/assets/newImg/layout/iconConnectWalletFail.svg';
import iconConnectWalletWarn from '@/assets/newImg/layout/iconConnectWalletWarn.svg';
import iconWalletMetamask from '@/assets/img/iconWalletMetamask.svg';
import './index.scss';
import PButton from '@/newComponents/PButton';


interface DataSourcesDialogProps {
  preset: any;
  onClose?: () => void;
  onSubmit?: () => void;
  activeRequest: any;
}
const ConnectWalletDialog: React.FC<DataSourcesDialogProps> = memo(
  ({ preset, onClose, onSubmit, activeRequest }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');

    const [accountAddr, setAccountAddr] = useState<any>();
    const [errorTip, setErrorTip] = useState<string>();
    const [activeItem, setActiveItem] = useState<WALLETITEMTYPE>();

    const handleClose = useCallback(() => {
      onClose && onClose();
    }, [onClose]);
    const handleSubmit = useCallback(() => {
      if (activeRequest?.btnTxt === 'Try Again') {
        onSubmit && onSubmit();
      } else {
        onClose && onClose();
      }
    }, [onClose, onSubmit, activeRequest?.btnTxt]);

    return (
      <PMask>
        <div className="pDialog2 ConnectWalletProcessDialog">
          <PClose onClick={handleClose} />
          <main>
            <div className="pic">
              {activeRequest?.type === 'loading' && (
                <>
                  <div className="spiner"></div>
                  <img src={preset} alt="" className="walletImg" />
                </>
              )}
              {activeRequest?.type === 'suc' && (
                <>
                  <img
                    src={iconConnectWalletSuc}
                    alt=""
                    className="sucCircle"
                  />
                  <img src={preset} alt="" className="walletImg" />
                </>
              )}
              {activeRequest?.type === 'fail' && (
                <img src={iconConnectWalletFail} alt="" className="resultImg" />
              )}
              {activeRequest?.type === 'warn' && (
                <img src={iconConnectWalletWarn} alt="" className="resultImg" />
              )}
            </div>
            <div className="descWrapper">
              <h5>{activeRequest?.title}</h5>
              <h6>{activeRequest?.desc}</h6>
              {activeRequest?.code && <p>{activeRequest?.code}</p>}
            </div>
          </main>
          {(activeRequest?.type === 'suc' ||
            activeRequest?.type === 'fail' ||
            activeRequest?.type === 'warn') && (
            <PButton
              text={activeRequest?.btnTxt ? activeRequest?.btnTxt : 'Ok'}
              onClick={handleSubmit}
              className="fullWidth"
            />
          )}
        </div>
      </PMask>
    );
  }
);

export default ConnectWalletDialog;
