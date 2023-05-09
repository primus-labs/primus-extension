import React from 'react';
import './index.sass'
import iconSuc from '@/assets/img/iconSuc.svg';
import PMask from '@/components/PMask'
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog'
import AuthInfoHeader from '@/components/DataSourceDetail/AuthInfoHeader'

interface AddSourceSucDialogProps {
  onClose: () => void;
  activeSource?: DataFieldItem
  onSubmit: () => void
  desc: string;
  title?:string;
}

const OnChainSucDialog: React.FC<AddSourceSucDialogProps> = ({ onClose, activeSource, onSubmit, title='Congratulations',desc }) => {
  const handleClickNext = () => {
    onSubmit()
  }
  return (
    <PMask onClose={onClose}>
      <div className="padoDialog addDataSourceSucDialog onChainSucDialog">
        <main>
          <AuthInfoHeader checked={false} backable={false} />
          <img className="sucImg" src={iconSuc} alt="" />
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

export default OnChainSucDialog;
