import React, { useState, useMemo, useCallback } from 'react';
import PMask from '@/components/PMask';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import PBack from '@/components/PBack';
import PBottomErrorTip from '@/components/PBottomErrorTip';
import { WALLETLIST } from '@/config/constants';
import type { WALLETITEMTYPE } from '@/config/constants';
import './index.sass';

export type DataFieldItem = {
  icon: any;
  name: string;
  type: string;
  desc?: string;
  requirePassphase?: boolean;
};
interface DataSourcesDialogProps {
  onClose: () => void;
  onSubmit: (item: WALLETITEMTYPE) => void;
  onBack?: () => void;
}
const ConnectWalletDialog: React.FC<DataSourcesDialogProps> = ({
  onClose,
  onSubmit,
  onBack,
}) => {
  const [errorTip, setErrorTip] = useState<string>();
  const [activeItem, setActiveItem] = useState<WALLETITEMTYPE>();
  // const list: DataFieldItem[] = WALLETLIST;
  const handleClickNext = () => {
    if (!activeItem) {
      setErrorTip('Please select one wallet');
      return;
    }
    onSubmit(activeItem);
  };
  const handleClickData = (item: WALLETITEMTYPE) => {
    if (!item.disabled) {
      setErrorTip(undefined);
      setActiveItem(item);
    }
  };
  const handleClickBack = () => {
    onBack && onBack();
  };
  const liClassName = useCallback(
    (item: WALLETITEMTYPE) => {
      let defaultClassName = 'networkItem';
      if (item.disabled) {
        defaultClassName += ' disabled';
      }
      if (activeItem?.name === item.name) {
        defaultClassName += ' active';
      }
      return defaultClassName;
    },
    [activeItem]
  );

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog dataSourcesDialog connectWalletDialog">
        {!!onBack && <PBack onBack={handleClickBack} />}
        <main>
          <AddressInfoHeader />
          <h1>
            <span>Connect Wallet</span>
          </h1>
          <div className="scrollList">
            <ul className="dataList">
              {WALLETLIST.map((item) => {
                return (
                  <li
                    className={liClassName(item)}
                    key={item.name}
                    onClick={() => {
                      handleClickData(item);
                    }}
                  >
                    <img src={item.icon} alt="" />
                    <div className="desc">{item.name}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        </main>
        <button className="nextBtn" onClick={handleClickNext}>
          {errorTip && <PBottomErrorTip text={errorTip} />}
          <span>Select</span>
        </button>
      </div>
    </PMask>
  );
};

export default ConnectWalletDialog;
