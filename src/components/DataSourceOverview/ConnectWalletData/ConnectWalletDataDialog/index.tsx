import React, { useState, useEffect, memo, useCallback } from 'react';

import PControledInput from '@/components/PControledInput';
import PInput from '@/components/PInput';
import PButton from '@/components/PButton';
import Bridge from '@/components/DataSourceOverview/Bridge/index';
import PMask from '@/components/PMask';
import SourceGroup from '@/components/DataSourceOverview/SourceGroups/SourceGroup';
import iconDataSourceOnChainAssets from '@/assets/img/iconDataSourceOnChainAssets.svg';
import PBottomErrorTip from '@/components/PBottomErrorTip';
import PBack from '@/components/PBack';
import WalletList from '@/components/WalletList';
import './index.scss';

import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
import type { WALLETITEMTYPE } from '@/config/constants';
export type GetDataFormProps = {
  label?: string;
};
interface ConnectWalletDataDialogProps {
  onClose: () => void;
  onSubmit: (item: WALLETITEMTYPE, label?: string) => void;
  onCancel: () => void;
}

const ConnectWalletDataDialog: React.FC<ConnectWalletDataDialogProps> = memo(
  ({ onClose, onSubmit, onCancel }) => {
    const [errorTip, setErrorTip] = useState<string>();
    const [activeItem, setActiveItem] = useState<WALLETITEMTYPE>();
    const [label, setLabel] = useState<string>();

    const onChangeWallet = (item: WALLETITEMTYPE | undefined) => {
      if (item) {
        console.log('onChangeWallet', item);
        if (!item?.disabled) {
          setErrorTip(undefined);
          setActiveItem(item);
        }
      }
      
    };
    const handleClickNext = () => {
      if (!activeItem) {
        setErrorTip('Please select one wallet');
        return;
      }
      onSubmit(activeItem, label);
    };

    const handleChangeLabel = useCallback((val: string) => {
      setLabel(val);
    }, []);

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog connectWalletDataDialog">
          <PBack onBack={onCancel} />
          <main>
            <Bridge endIcon={iconDataSourceOnChainAssets} />
            <header>
              <h1>Connect Your Data</h1>
            </header>
            <div className="formContent">
              <div className="contItem ">
                <div className="label">Select Wallet</div>
                <WalletList onClick={onChangeWallet} />
              </div>
              <div className="contItem ">
                {/* <div className="label">Label (Optional)</div> */}
                <PInput
                  key="label"
                  placeholder="Please set your Label"
                  onChange={handleChangeLabel}
                  value={label}
                  label="Label (Optional)"
                />
              </div>
            </div>
          </main>
          <footer>
            <PButton text="Next" onClick={handleClickNext} />
            {errorTip && <PBottomErrorTip text={errorTip} />}
          </footer>
        </div>
      </PMask>
    );
  }
);

export default ConnectWalletDataDialog;
