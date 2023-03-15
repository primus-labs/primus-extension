import React from 'react';
import rightArrow from '@/assets/img/rightArrow.svg';
import iconChecked from '@/assets/img/iconChecked.svg';
import iconETH from '@/assets/img/iconETH.svg';
import iconBinance from '@/assets/img/iconBinance.svg';
import iconNetwork3 from '@/assets/img/iconNetwork3.svg';
import iconNetwork4 from '@/assets/img/iconNetwork4.svg';
import iconNetwork5 from '@/assets/img/iconNetwork5.svg';
import iconNetwork6 from '@/assets/img/iconNetwork6.svg';
import './index.sass'


interface CretateAccountDialogProps {
  onSubmit: () => void,
  onCancel: () => void
}
const CretateAccountDialog: React.FC<CretateAccountDialogProps> = ({onSubmit, onCancel}) => {
  const networkList = [
    // {
    //   icon: iconETH,
    //   title: 'ETH'
    // },
    {
      icon: iconBinance,
      title: 'Binance'
    },
    {
      icon: iconNetwork3,
      title: '3'
    },
    {
      icon: iconNetwork4,
      title: '4'
    },
    {
      icon: iconNetwork5,
      title: '5'
    },
    {
      icon: iconNetwork6,
      title: '6'
    },
  ]
  const handleClickNext = () => {
    onSubmit()
  }
  const handleClickBack = () => {
    onCancel()
  }
  
  return (
    <div className="pDialog authDialog createAccountDialog">
      <header className="createAccountDialogHeader">
        <div className="iconBack" onClick={handleClickBack}></div>
        <div className="haderContent">
          <i></i>
          <span>tate@padolabs.org</span>
          <img src={iconChecked} alt="back" />
        </div>
      </header>
      <main>
        <h1>Create account</h1>
        <h2>An on-chain address will be created for you to manage your own data more safely. You can select the following networks</h2>
        <h6>Continue with</h6>
        <div className="activeNetwork networkItem">
          <img src={iconETH} alt="ETH" />
        </div>
        <div className="dividerWrapper">
          <i></i>
          <div className="divider">or</div>
          <i></i>
        </div>
        <ul className="networkList">
          {networkList.map(item => {
            return (<li className="networkItem" key={item.title}>
              <img src={item.icon} alt="" />
            </li>)
          })}
        </ul>
      </main>
      <button className="nextBtn" onClick={handleClickNext}>
        <span>Next</span>
        <img src={rightArrow} alt="right arrow" />
      </button>
    </div>
  );
};

export default CretateAccountDialog;
