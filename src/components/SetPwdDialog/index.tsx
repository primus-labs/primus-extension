import React, { useState, useEffect } from 'react';
import './index.sass'
import iconETH from '@/assets/img/iconETH.svg';
import iconChecked from '@/assets/img/iconChecked.svg';
import PInput from '@/components/PInput'
const Web3EthAccounts = require('web3-eth-accounts');

interface SetPwdDialogProps {
  onSubmit: () => void,
  onCancel: () => void
}

const SetPwdDialog: React.FC<SetPwdDialogProps> = ({onSubmit, onCancel}) => {
  const [account, setAccount] = useState<any>()
  const handleClickNext = () => {
    const encryptAccount = account.encrypt('padopado2023')
    chrome.storage.local.set({ wallet: JSON.stringify(encryptAccount) })
    onSubmit()
  }
  const initAccount = () => {
    const accounts = new Web3EthAccounts();
    const acc = accounts.create()
    setAccount(acc)
  }
  useEffect(() => {
    initAccount()
  }, [])
  return (
      <div className="pDialog authDialog setPwdDialog">
          <header className="setPwdDialogHeader">
            <div className="headerContent">
              <div className="iconWrapper">
                <img src={iconETH} alt="" />
              </div>
              <p className="address">{account?.address}</p>
            </div>
          </header>
          <main>
            <h1>Set Password</h1>
            <h2>Set a password to protect the information you store locally</h2>
            <h6>Setting</h6>
            <PInput/>
            <div className="validateWrapper">
              <div className="descTitle">The following combinations are recommended：</div>
              <div className="descItem">
                <img src={iconChecked} alt="" />0-9 digits
              </div>
              <div className="descItem">
                <img src={iconChecked} alt="" />A-Z letters
              </div>
              <div className="descItem">
                <img src={iconChecked} alt="" />Special symbols
              </div>
              <div className="descItem">
                <img src={iconChecked} alt="" />Greater than 10 characters
              </div>
            </div>
            <h6>Reconfirm</h6>
            <PInput/>
          </main>
          <button className="nextBtn" onClick={handleClickNext}>
            <span>OK</span>
            </button>
        {/* </div> */}
      </div>
  );
};

export default SetPwdDialog;
