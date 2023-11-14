import React, { useState, useCallback, memo } from 'react';
import WalletList from '@/components/WalletList';
import PMask from '@/components/PMask';
import PButton from '@/components/PButton'
import PBack from '@/components/PBack';
import PBottomErrorTip from '@/components/PBottomErrorTip';

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
    const [errorTip, setErrorTip] = useState<string>();
    const [activeItem, setActiveItem] = useState<WALLETITEMTYPE>();
    // const list: DataFieldItem[] = WALLETLIST;

    const handleClickBack = useCallback(() => {
      onBack && onBack();
    }, []);

    const handleClickNext = () => {
      if (!activeItem) {
        setErrorTip('Please select one wallet');
        return;
      }
      onSubmit(activeItem);
    };
    const onChangeWallet = (item?: WALLETITEMTYPE) => {
      if (!item?.disabled) {
        setErrorTip(undefined);
        setActiveItem(item);
        onSubmit(item as WALLETITEMTYPE);
      }
    };

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog connectWalletDialog">
          {!!onBack && <PBack onBack={handleClickBack} />}
          <main>
            <header>
              <h1>Connect Your Wallet</h1>
              <h2>{desc}</h2>
            </header>
            <WalletList onClick={onChangeWallet} />
          </main>
          {/* <footer>
            <PButton text="Select" onClick={handleClickNext} />
            {errorTip && <PBottomErrorTip text={errorTip} />}
          </footer> */}
        </div>
      </PMask>
    );
  }
);

export default ConnectWalletDialog;
