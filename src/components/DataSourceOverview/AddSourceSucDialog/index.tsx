import React from 'react';
import './index.sass'
import iconSuc from '@/assets/img/iconSuc.svg';
import Bridge from '@/components/Bridge/index'
import PMask from '@/components/PMask'
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog'

interface AddSourceSucDialogProps {
  onClose: () => void;
  activeSource?: DataFieldItem;
  onSubmit: () => void;
  desc: string
}

const AddSourceSucDialog: React.FC<AddSourceSucDialogProps> = ({ onClose, activeSource, onSubmit, desc }) => {
  const icon = activeSource?.icon
  const handleClickNext = () => {
    onSubmit()
  }
  return (
    <PMask onClose={onClose}>
      <div className="padoDialog addDataSourceSucDialog">
        <main>
          <Bridge endIcon={icon} />
          <img className="sucImg" src={iconSuc} alt="" />
          <h1>Congratulations</h1>
          <h2>{desc}</h2>
        </main>
        <button className="nextBtn" onClick={handleClickNext}>
          <span>OK</span>
        </button>
      </div>
    </PMask>
  );
};

export default AddSourceSucDialog;
