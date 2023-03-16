import React from 'react';
import './index.sass'
import iconETH from '@/assets/img/iconETH.svg';
import iconChecked from '@/assets/img/iconChecked.svg';
import iconSuc from '@/assets/img/iconSuc.svg';

interface SetSucDialogProps {
  onSubmit: () => void
}

const SetSucDialog: React.FC<SetSucDialogProps> = ({onSubmit}) => {
  const handleClickNext = () => {
    onSubmit()
  }
  return (
      <div className="pDialog authDialog setSucDialog">
        <header className="createAccountDialogHeader">
          <i></i>
          <span>tate@padolabs.org</span>
          <img src={iconChecked} alt="back" />
        </header>
        <header className="setPwdDialogHeader">
          <div className="headerContent">
            <div className="iconWrapper">
              <img src={iconETH} alt="" />
            </div>
            <p className="address">0xCEd6324CaA3bF9df5ce0bc67   146b7A9E7657fFB1</p>
          </div>
        </header>
        <main>
          <img src={iconSuc} alt="" />
          <h1>Congratulations</h1>
          <h2>Your setup was successful</h2>
        </main>
        <button className="nextBtn" onClick={handleClickNext}>
          <span>OK</span>
          </button>
      </div>
  );
};

export default SetSucDialog;
