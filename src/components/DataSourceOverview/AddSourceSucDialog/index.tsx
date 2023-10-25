import React, { useMemo, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Bridge from '@/components/DataSourceOverview/Bridge/index';
import PMask from '@/components/PMask';
import PButton from '@/components/PButton';
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';

import iconSuc from '@/assets/img/iconSuc.svg';
import iconError from '@/assets/img/iconError.svg';
import iconLoading from '@/assets/img/iconLoading.svg';
import iconInfoColorful from '@/assets/img/iconInfoColorful.svg';

import './index.scss';
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
  showBottom?: boolean;
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
    showBottom,
  }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
   
    const formatFooterButton = useMemo(() => {
      if (footerButton) {
        return footerButton;
      } else {
        if (type === 'suc') {
          return <PButton text="OK" onClick={onSubmit}></PButton>;
        } else {
          return <PButton text="OK" className="gray" onClick={onClose}></PButton>;
        }
      }
    }, [footerButton, type, onSubmit,onClose]);
    const icon = activeSource?.icon;

    const formatHeaderEl = useMemo(() => {
      return headerEl ?? <Bridge endIcon={icon} />;
    }, [headerEl, icon]);
    const formatCloseable = useMemo(() => {
      if (closeable === undefined) {
        if (fromEvents) {
          return !fromEvents;
        } else {
          return true;
        }
      }
      return closeable;
    }, [closeable, fromEvents]);
    const formatShowBottom = useMemo(() => {
      if (showBottom) {
        return showBottom;
      } else {
        return type !== 'loading';
      }
    }, [showBottom, type]);
    return (
      <PMask onClose={onClose} closeable={formatCloseable}>
        <div className="padoDialog addDataSourceSucDialog">
          <main>
            {formatHeaderEl}
            {type === 'suc' && (
              <img className="processImg" src={iconSuc} alt="" />
            )}
            {type === 'error' && (
              <img className="processImg" src={iconError} alt="" />
            )}
            {type === 'warn' && (
              <img className="processImg" src={iconInfoColorful} alt="" />
            )}
            {type === 'loading' && (
              <img className="processImg loadingImg" src={iconLoading} alt="" />
            )}
            <div className="processDesc">
              <h1>{title}</h1>
              <h2>{desc}</h2>
            </div>
          </main>
          {type !== 'loading' && formatFooterButton}
          {type === 'loading' && tip}
        </div>
      </PMask>
    );
  }
);

export default AddSourceSucDialog;
