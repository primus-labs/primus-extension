import React from 'react';
import './index.sass'
import iconSuc from '@/assets/img/iconSuc.svg';
import Bridge from '@/components/Bridge/index'

interface SetSucDialogProps {
  onSubmit: () => void
}

const AddSourceDialog: React.FC<SetSucDialogProps> = ({ onSubmit }) => {
  const handleClickNext = () => {
    onSubmit()
  }
  return (
    <div className="addSourceDialog">
      <Bridge />
      <main>
        <img src={iconSuc} alt="" />
        <h1>Congratulations</h1>
        <h2>Your event authorization was successful</h2>
      </main>
      <button className="nextBtn" onClick={handleClickNext}>
        <span>OK</span>
      </button>
    </div>
  );
};

export default AddSourceDialog;
