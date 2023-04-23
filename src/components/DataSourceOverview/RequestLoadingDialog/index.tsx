import React from 'react';
import './index.sass'
import iconLoading from '@/assets/img/loading.svg';
import Bridge from '@/components/Bridge/index'
import PMask from '@/components/PMask'
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog'
import PLoading from '@/components/PLoading'

interface AddSourceSucDialogProps {
  onClose: () => void;
  activeSource?: DataFieldItem;
  onSubmit: () => void;
  desc: string;
  title?:string;
}

const AddSourceSucDialog: React.FC<AddSourceSucDialogProps> = ({ onClose, activeSource, onSubmit, title='Congratulations',desc }) => {
  const icon = activeSource?.icon
  const handleClickNext = () => {
    onSubmit()
  }
  return (
    <PMask onClose={onClose}>
      <div className="padoDialog addDataSourceSucDialog requestLoadingDialog">
        <main>
          <Bridge endIcon={icon} />
          {/* <img className="sucImg" src={iconLoading} alt="" /> */}
          <PLoading/>
          <h1>{title}</h1>
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
