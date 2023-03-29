import React from 'react';
import './index.sass'
import iconSuc from '@/assets/img/iconSuc.svg';
import Bridge from '@/components/Bridge/index'
import type { DataFieldItem } from '@/components/DataFieldsDialog'

interface SetSucDialogProps {
  activeSource?: DataFieldItem;
  onSubmit: () => void
}

const AddSourceDialog: React.FC<SetSucDialogProps> = ({ activeSource, onSubmit }) => {
  const icon = activeSource?.icon
  const handleClickNext = () => {
    onSubmit()
  }
  return (
    <div className="addSourceSucDialog">
      <main>
        <Bridge endIcon={icon} />
        <img className="sucImg" src={iconSuc} alt="" />
        <h1>Congratulations</h1>
        <h2>Data Connected!</h2>
      </main>
      <button className="nextBtn" onClick={handleClickNext}>
        <span>OK</span>
      </button>
    </div>
  );
};

export default AddSourceDialog;
