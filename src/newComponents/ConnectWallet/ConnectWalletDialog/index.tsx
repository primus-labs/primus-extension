import React, { useState, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { WALLETITEMTYPE } from '@/config/constants';
import WalletList from '@/components/WalletList';
import PButton from '@/components/PButton';
import PBack from '@/components/PBack';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import POptions from '@/newComponents/POptions'
import './index.scss';

export type DataFieldItem = {
  icon: any;
  name: string;
  type: string;
  desc?: string;
  requirePassphase?: boolean;
};
interface DataSourcesDialogProps {
  onClose?: () => void;
  onSubmit: (item: WALLETITEMTYPE) => void;
  desc?: string;
}

const ConnectWalletDialog: React.FC<DataSourcesDialogProps> = memo(
  ({
    onClose,
    onSubmit,
    desc = 'Connect wallet to see your data in one place...',
  }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');

    const [accountAddr, setAccountAddr] = useState<any>();
    const [errorTip, setErrorTip] = useState<string>();
    const [activeItem, setActiveItem] = useState<WALLETITEMTYPE>();
    // const list: DataFieldItem[] = WALLETLIST;

    const onChangeWallet = (item?: WALLETITEMTYPE) => {
      if (!item?.disabled) {
        setErrorTip(undefined);
        setActiveItem(item);
        // onSubmit(item as WALLETITEMTYPE);
      }
    };
    const handleSubmit = useCallback(() => {
      
    }, []);
    const handleClose = useCallback(() => {
      // dispatch({
      //   type: 'setConnectWalletDialogVisible',
      //   payload: false,
      // });
      onClose && onClose();
    }, [onClose]);
    const handleChangeWallet = useCallback(
      (item) => {
        onSubmit(item);
      },
      [onSubmit]
    );

    return (
      <PMask>
        {/*  onClose={onClose} closeable={fromEvents !== 'LINEA_DEFI_VOYAGE'} */}
        <div className="pDialog2 ConnectWalletDialog">
          <PClose onClick={handleClose} />
          <main>
            <header>
              <h1>Connect Your Wallet</h1>
              <h2>{desc}</h2>
            </header>
            {/* <WalletList onClick={onChangeWallet} /> */}
            <POptions onClick={handleChangeWallet} />
          </main>
        </div>
      </PMask>
    );
  }
);

export default ConnectWalletDialog;
