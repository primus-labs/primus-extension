import React, { useState, useEffect, useMemo } from 'react';
import './index.sass'
import iconETH from '@/assets/img/iconETH.svg';
import iconChecked from '@/assets/img/iconChecked.svg';
import PInput from '@/components/PInput/index'
const Web3EthAccounts = require('web3-eth-accounts');

interface SetPwdDialogProps {
  onSubmit: () => void,
  onCancel: () => void
}

const SetPwdDialog: React.FC<SetPwdDialogProps> = ({onSubmit, onCancel}) => {
  const [account, setAccount] = useState<any>()
  const [pwd, setPwd] = useState<string>()
  const [confirm, setConfirm] = useState<string>()
  const pwdRules = useMemo(() => {
    const initalRules = [
      {
        desc: '0-9 digits',
        reg: /\d/,
        legal: false
      },
      {
        desc: 'A-Z letters',
        reg: /[A-Z]/,
        legal: false
      },
      {
        desc: 'Special symbols',
        reg: /[\~!@#$%^&*()?,./;'<>:"_-]/,
        legal: false
      },
      {
        desc: 'Greater than 10 characters',
        reg: /[\w\W]{8,60}/,
        legal: false
      }
    ]
    const currentRules =  initalRules.map((rule: any) => {
          if (rule.reg.test(pwd) ) {
            rule.legal = true
          }
          return rule
        })
    return pwd? currentRules: initalRules
  }, [pwd])
  const handleClickNext = () => {
    // TODO validate form again
    if(!pwd || !confirm || errorTipVisible) {
      return
    }
    const pwdIsLegal = pwdRules.every(i=>i.legal)
    if (!pwdIsLegal) { return }
    const encryptAccount = account.encrypt(pwd)
    chrome.runtime.sendMessage({
      type: 'storage',
      key: 'keyStore',
      value: JSON.stringify(encryptAccount)
    })
    
    onSubmit()
  }
  const handleClickBack = () => {
    onCancel()
  }
  const initAccount = () => {
    const web3EthAccounts = new Web3EthAccounts();
    chrome.storage.local.get(['privateKey'],  (storedData) => {
      console.log('storage-privateKey', storedData['privateKey'])
      if ( storedData['privateKey'] ) {
        const acc = web3EthAccounts.privateKeyToAccount(account.privateKey);
        setAccount(acc)
      } else {
        const acc = web3EthAccounts.create()
        chrome.runtime.sendMessage({
          type: 'storage',
          key: 'privateKey',
          value: acc.privateKey
        })
        setAccount(acc)
      }
    })
  }
  const handleChangePwd = (val: string) => {
    setPwd(val)
  }
  const handleChangeConfirm = (val: string) => {
    setConfirm(val)
  }

  const errorTipVisible = useMemo( () => {
    return pwd && confirm && pwd !== confirm
  },[pwd, confirm])

  useEffect(() => {
    initAccount()
  }, [])
  
  return (
    <div className="pDialog authDialog setPwdDialog">
      <header className="setPwdDialogHeader">
        <div className="iconBack" onClick={handleClickBack}></div>
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
        <PInput type="password" onChange={handleChangePwd}/>
        <div className="validateWrapper">
          <div className="descTitle">The following combinations are recommended：</div>
          <ul className="descItems">
            {pwdRules.map(i => {
              return <li key={i.desc} className={i.legal? 'descItem checked': 'descItem'} >
              {i.desc}
              </li>
            })
            }
          </ul>
          {/* <div className="descItem">
            0-9 digits
          </div>
          <div className="descItem">
            A-Z letters
          </div>
          <div className="descItem">
            Special symbols
          </div>
          <div className="descItem">
            Greater than 10 characters
          </div> */}
        </div>
        <h6>Reconfirm</h6>
        <PInput type="password" onChange={handleChangeConfirm}/>
        {errorTipVisible && <p className="errorTip">Entered passwords differ!</p>}
      </main>
      <button className="nextBtn" onClick={handleClickNext}>
        <span>OK</span>
      </button>
    </div>
  );
};

export default SetPwdDialog;
