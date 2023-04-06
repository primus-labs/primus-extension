import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux'
// import { countAdd, countMinus } from '../../store/reducers/app'
import './index.sass'
import iconETH from '@/assets/img/iconETH.svg';
import PInput from '@/components/PInput/index'
const Web3EthAccounts = require('web3-eth-accounts');


interface SetPwdDialogProps {
  onSubmit: () => void,
  onCancel: () => void,
  padoServicePort: chrome.runtime.Port
}

const SetPwdDialog: React.FC<SetPwdDialogProps> = (props) => {
  const { onSubmit, onCancel, padoServicePort } = props
  const [accountAddr, setAccountAddr] = useState<any>()
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
        desc: 'a-z letters',
        reg: /[A-Za-z]/,
        legal: false
      },
      {
        desc: 'Special symbols',
        reg: /[\~!@#$%^&*()?,./;'<>:"_-]/,
        legal: false
      },
      {
        desc: 'Greater than 8 characters',
        reg: /[\w\W]{8,60}/,
        legal: false
      }
    ]
    if (pwd) {
      const currentRules = initalRules.map((rule: any) => {
        if (rule.reg.test(pwd)) {
          rule.legal = true
        }
        return rule
      })
      console.log(pwd, currentRules)
      return currentRules
    } else {
      return initalRules
    }
  }, [pwd])
  const handleClickNext = async () => {
    // TODO validate form again
    if (!pwd || !confirm || errorTipVisible) {
      return
    }
    const pwdIsLegal = pwdRules.every(i => i.legal)
    if (!pwdIsLegal) { return }
    fetchBindUserAddress()

  }
  const fetchBindUserAddress = () => {
    chrome.storage.local.get(['userInfo'], (storedData) => {
      if (storedData['userInfo']) {
        const userId = JSON.parse(storedData['userInfo']).id
        const padoServicePortListener = function (message: any) {
          if (message.resMethodName === 'bindUserAddress') {
            console.log("page_get:bindUserAddress:", message.res);
            if (message.res) {
              onSubmit()
            } else {
              // loading
            }
          }
        }
        padoServicePort.onMessage.addListener(padoServicePortListener)
        padoServicePort.postMessage({
          fullScreenType: 'padoService',
          reqMethodName: 'bindUserAddress',
          params: {
            userId: userId,
            walletAddress: accountAddr,
            password: pwd,
          },
          config: {
            // TODO
            extraHeader: {
              'user-id': userId
            }
          }
        })
      }
    })
  }
  const handleClickBack = () => {
    onCancel()
  }
  const initAccount = () => {
    const padoServicePortListener = function (message: any) {
      if (message.resMethodName === 'create') {
        console.log("page_get:create:", message.res);
        if (message.res) {
          setAccountAddr(message.res)
        }
      }
    }
    padoServicePort.onMessage.addListener(padoServicePortListener)

    const msg = {
      fullScreenType: 'wallet',
      reqMethodName: 'create',
      params: {}
    }
    padoServicePort.postMessage(msg)

    // const web3EthAccounts = new Web3EthAccounts();
    // const acc = web3EthAccounts.create()
    // setAccount(acc)
  }
  const handleChangePwd = (val: string) => {
    setPwd(val)
  }
  const handleChangeConfirm = (val: string) => {
    setConfirm(val)
  }

  const errorTipVisible = useMemo(() => {
    return pwd && confirm && pwd !== confirm
  }, [pwd, confirm])

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
          <p className="address">{accountAddr}</p>
        </div>
      </header>
      <main>
        <h1>Set Password</h1>
        <h2>Set a password to protect the information you store locally</h2>
        <h6>Setting</h6>
        <PInput type="password" onChange={handleChangePwd} />
        <div className="validateWrapper">
          <div className="descTitle">The following combinations are recommended：</div>
          <ul className="descItems">
            {pwdRules.map(i => {
              return <li key={i.desc} className={i.legal ? 'descItem checked' : 'descItem'} >
                {i.desc}
              </li>
            })
            }
          </ul>
        </div>
        <h6>Reconfirm</h6>
        <PInput type="password" onChange={handleChangeConfirm} />
        {errorTipVisible && <p className="errorTip">Entered passwords differ!</p>}
      </main>
      <button className="nextBtn" onClick={handleClickNext}>
        <span>OK</span>
      </button>
    </div>
  );
};

export default connect((store) => store, {})(SetPwdDialog);
