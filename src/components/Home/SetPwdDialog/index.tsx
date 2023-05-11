import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { Dispatch } from 'react'
import './index.sass'
import iconETH from '@/assets/img/iconETH.svg';
import PInput from '@/components/PInput/index'
import PMask from '@/components/PMask'
import { useSelector } from 'react-redux'
import type { UserState } from '@/store/reducers'
import {postMsg} from '@/utils/utils'

interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const SetPwdDialog: React.FC<SetPwdDialogProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()
  const { onClose, onSubmit, onCancel } = props
  const padoServicePort = useSelector((state: UserState) => state.padoServicePort)
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
      // console.log(pwd, currentRules)
      return currentRules
    } else {
      return initalRules
    }
  }, [pwd])
  const handleClickNext = async () => {
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
        postMsg(padoServicePort, {
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
        dispatch({
          type: 'setUserPassword',
          payload: pwd
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
          const lowercaseAddr = message.res.toLowerCase()
          setAccountAddr(lowercaseAddr)
        }
      }
    }
    padoServicePort.onMessage.addListener(padoServicePortListener)

    const msg = {
      fullScreenType: 'wallet',
      reqMethodName: 'create',
      params: {}
    }
    postMsg(padoServicePort, msg)
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
    <PMask onClose={onClose}>
      <div className="padoDialog setPwdDialog">
        <main>
          <header className="setPwdDialogHeader">
            <div className="iconBack" onClick={handleClickBack}></div>
            <div className="headerContent">
              {/* TODO */}
              <div className="networkItem">
                <img className="iconNetwork" src={iconETH} alt="" />
              </div>
              <p className="address">{accountAddr}</p>
            </div>
          </header>
          <h1>Set Password</h1>
          <h2>Enter an secure password to protect local data and private key.</h2>
          <h6>Setting</h6>
          <PInput type="password" placeholder="Please enter your password" onChange={handleChangePwd} visible/>
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
          <h6 className="reconfirmLabel">Reconfirm</h6>
          <PInput type="password" placeholder="Please confirm your password" onChange={handleChangeConfirm} onSearch={handleClickNext} visible/>
          {errorTipVisible && <p className="errorTip">Entered passwords differ!</p>}
        </main>
        <button className="nextBtn" onClick={handleClickNext}>
          <span>OK</span>
        </button>
      </div>
    </PMask>
  );
};

export default SetPwdDialog;
