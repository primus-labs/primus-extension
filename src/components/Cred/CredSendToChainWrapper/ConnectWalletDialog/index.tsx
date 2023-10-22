import React, { useState, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom'
import WalletList from '@/components/WalletList';
import PMask from '@/components/PMask';

import PBack from '@/components/PBack';
import PBottomErrorTip from '@/components/PBottomErrorTip';

import { WALLETLIST } from '@/config/constants';

import type { WALLETITEMTYPE } from '@/config/constants';

import './index.scss';

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
  desc?:string
}

const ConnectWalletDialog: React.FC<DataSourcesDialogProps> = memo(
  ({
    onClose,
    onSubmit,
    onBack,
    desc = 'Your wallet address will be set as the account.',
  }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    const [errorTip, setErrorTip] = useState<string>();
    const [activeItem, setActiveItem] = useState<WALLETITEMTYPE>();
    // const list: DataFieldItem[] = WALLETLIST;

    const handleClickBack = useCallback(() => {
      onBack && onBack();
    }, []);
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

    const handleClickNext = () => {
      if (!activeItem) {
        setErrorTip('Please select one wallet');
        return;
      }
      onSubmit(activeItem);
    };
    const onChangeWallet = (item: WALLETITEMTYPE) => {
      if (!item.disabled) {
        setErrorTip(undefined);
        setActiveItem(item);
      }
    };

    return (
      <PMask onClose={onClose} closeable={!fromEvents}>
        <div className="padoDialog dataSourcesDialog connectWalletDialog">
          {!!onBack && <PBack onBack={handleClickBack} />}
          <main>
            <h1>Connect Your Wallet</h1>
            <h2>{desc}</h2>
            <WalletList onClick={onChangeWallet} />
          </main>
          <button className="nextBtn" onClick={handleClickNext}>
            {errorTip && <PBottomErrorTip text={errorTip} />}
            <span>Select</span>
          </button>
        </div>
      </PMask>
    );
  }
);

export default ConnectWalletDialog;
