import React from 'react';
import './index.sass'
import iconSuc from '@/assets/img/iconSuc.svg';
import iconError from '@/assets/img/iconError.svg';
import iconInfoColorful from '@/assets/img/iconInfoColorful.svg';
import Bridge from '@/components/DataSourceOverview/Bridge/index'
import PMask from '@/components/PMask'
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog'
import PLoading from '@/components/PLoading'

interface AddSourceSucDialogProps {
  onClose: () => void;
  activeSource?: DataFieldItem;
  onSubmit: () => void;
  desc?: string;
  title?:string;
  type?:string;
}

const AddSourceSucDialog: React.FC<AddSourceSucDialogProps> = ({ onClose, activeSource, onSubmit, title='Congratulations',desc='',type='suc' }) => {
  const icon = activeSource?.icon
  const handleClickNext = () => {
    onSubmit()
  }
  return (
    <PMask onClose={onClose}>
      <div className="padoDialog addDataSourceSucDialog">
        <main>
          <Bridge endIcon={icon} />
          {type === 'suc' && <img className="sucImg" src={iconSuc} alt="" />}
          {type === 'error' && <img className="sucImg" src={iconError} alt="" />}
          {type === 'warn' && <img className="sucImg" src={iconInfoColorful} alt="" />}
          {type === 'loading' && <PLoading/>}
          <h1>{title}</h1>
          <h2>{desc}</h2>
        </main>
        {type !== 'loading' && <button className="nextBtn" onClick={handleClickNext}>
          <span>OK</span>
        </button>}
      </div>
    </PMask>
  );
};

export default AddSourceSucDialog;
