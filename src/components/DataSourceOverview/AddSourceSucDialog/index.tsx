import React, { useMemo, memo } from 'react';

import Bridge from '@/components/DataSourceOverview/Bridge/index';
import PMask from '@/components/PMask';
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import AuthInfoHeader from '@/components/DataSourceDetail/AuthInfoHeader';
import PolygonIdAddressInfoHeader from '@/components/Cred/PolygonIdAddressInfoHeader'
import iconSuc from '@/assets/img/iconSuc.svg';
import iconError from '@/assets/img/iconError.svg';
import iconLoading from '@/assets/img/iconLoading.svg';
import iconInfoColorful from '@/assets/img/iconInfoColorful.svg';

import './index.sass';
interface AddSourceSucDialogProps {
  onClose: () => void;
  activeSource?: DataFieldItem;
  onSubmit: () => void;
  desc?: string;
  title?: string;
  type?: string;
  headerType?: string;
  address?: string;
}

const AddSourceSucDialog: React.FC<AddSourceSucDialogProps> = memo(
  ({
    onClose,
    activeSource,
    onSubmit,
    title = 'Congratulations',
    desc = '',
    type = 'suc',
    headerType = 'dataSource',
    address,
  }) => {
    const icon = activeSource?.icon;

    const dialogClassName = useMemo(() => {
      let defaultCN = 'padoDialog addDataSourceSucDialog';
      if (headerType === 'attestation') {
        defaultCN += ' attestSucDialog';
      }
      if (headerType === 'setting') {
        defaultCN += ' setSucDialog';
      }
      defaultCN += ` ${type}`;
      return defaultCN;
    }, [headerType, type]);

    return (
      <PMask onClose={onClose}>
        <div className={dialogClassName}>
          <main>
            {headerType === 'setting' && (
              <AuthInfoHeader checked={false} backable={false} />
            )}
            {headerType === 'dataSource' && <Bridge endIcon={icon} />}
            {headerType === 'attestation' && <AddressInfoHeader />}
            {headerType === 'polygonIdAttestation' && (
              <PolygonIdAddressInfoHeader address={address as string} />
            )}
            {type === 'suc' && <img className="sucImg" src={iconSuc} alt="" />}
            {type === 'error' && (
              <img className="sucImg" src={iconError} alt="" />
            )}
            {type === 'warn' && (
              <img className="sucImg" src={iconInfoColorful} alt="" />
            )}
            {type === 'loading' && (
              <img className="loadingImg" src={iconLoading} alt="" />
            )}
            <h1>{title}</h1>
            <h2>{desc}</h2>
          </main>
          {type !== 'loading' && (
            <button className="nextBtn" onClick={onSubmit}>
              <span>OK</span>
            </button>
          )}
        </div>
      </PMask>
    );
  }
);

export default AddSourceSucDialog;
