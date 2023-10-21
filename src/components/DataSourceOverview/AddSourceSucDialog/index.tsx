import React, { useMemo, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Bridge from '@/components/DataSourceOverview/Bridge/index';
import PMask from '@/components/PMask';
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';

import iconSuc from '@/assets/img/iconSuc.svg';
import iconError from '@/assets/img/iconError.svg';
import iconLoading from '@/assets/img/iconLoading.svg';
import iconInfoColorful from '@/assets/img/iconInfoColorful.svg';

import './index.sass';
interface AddSourceSucDialogProps {
  onClose: () => void;
  activeSource?: DataFieldItem;
  onSubmit: () => void;
  desc?: any;
  title?: string;
  type?: string;
  headerType?: string;
  address?: string;
  footerButton?: any;
  closeable?: boolean;
  tip?: any;
  headerEl?: any;
}

const AddSourceSucDialog: React.FC<AddSourceSucDialogProps> = memo(
  ({
    headerEl,
    onClose,
    activeSource,
    onSubmit,
    title = 'Congratulations',
    desc = '',
    type = 'suc',
    headerType = 'dataSource',
    address,
    footerButton,
    closeable,
    tip,
  }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    footerButton = footerButton ?? (
      <button className="nextBtn" onClick={onSubmit}>
        <span>OK</span>
      </button>
    );
    // TODO!!!
    const icon = activeSource?.icon;

    const formatHeaderEl = useMemo(() => {
      return headerEl ?? <Bridge endIcon={icon} />;
    }, [headerEl, icon]);
    const formatCloseable = useMemo(() => {
      if (closeable === undefined) {
        if (fromEvents) {
          return !fromEvents;
        } else {
          return true
        }
      }
      return closeable
    }, [closeable,fromEvents]);
    return (
      <PMask onClose={onClose} closeable={formatCloseable}>
        <div className="padoDialog addDataSourceSucDialog">
          <main>
            {formatHeaderEl}
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
          {type !== 'loading' && footerButton}
          {tip}
        </div>
      </PMask>
    );
  }
);

export default AddSourceSucDialog;
