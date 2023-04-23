import React, { useState, useEffect } from 'react';
import {useNavigate} from 'react-router-dom'
import {connect } from 'react-redux'

import rem from '@/utils/rem.js';
import PHeader from '@/components/PHeader';
import PInput from '@/components/PInput/index'
import BackgroundAnimation from '@/components/BackgroundAnimation';
import AsideAnimation from '@/components/AsideAnimation';
import './index.sass';

const Lock = ({padoServicePort}) => {
  const navigate = useNavigate()
  const [pwd, setPwd] = useState();
  const [errorMsg, setErrorMsg] = useState();
  const handleClickStart = (val) => {
    const curPwd = pwd ?? val
    if (![undefined, null].includes(curPwd)) {
      const padoServicePortListener = function (message) {
        if (message.resMethodName === 'decrypt') {
          console.log("page_get:decrypt:", message.res);
          if (message.res) {
            // encrypt successfully
            navigate('/?refreshData=true')
          } else {
            setErrorMsg('Incorrect password')
          }
        }
      }
      padoServicePort.onMessage.addListener(padoServicePortListener)
      const msg = {
        fullScreenType: 'wallet',
        reqMethodName: `decrypt`,
        params: {
          password: curPwd
        }
      }
      padoServicePort.postMessage(msg)
    }
  };
  const handleChangePwd = (val) => {
    setPwd(val)
  }
  const handleSubmitPwd = (val) => {
    handleClickStart(val)
  }
  const handleClearUserPwd = () => {
    const msg = {
      fullScreenType: 'wallet',
      reqMethodName: 'clearUserPassword',
      params: {}
    }
    padoServicePort.postMessage(msg)
  }

  useEffect(() => {
    rem();
    handleClearUserPwd()
  }, []);

  return (
    <div className="pageIndex pageLock">
        <main className="appContent">
          <AsideAnimation />
          <article>
            <header className="articleHeader">
              <h1>Welcome BACK！</h1>
              <p>Manage and share your web data simply and safely.</p>
            </header>
            <main className="articleMain formItem" >
              <h6>Password</h6>
              <PInput type="password" placeholder="" onChange={handleChangePwd} onSearch={handleSubmitPwd} visible/>
              {errorMsg && <div className="errorTip">{errorMsg}</div>}
            </main>
            <footer className="articleFooter">
              <button className="unLockBtn" onClick={handleClickStart}>
                <span>Unlock</span>
                </button>
              {/* <p className="forgetPwd">Forgot password?</p> */}
              <p className="help">Need help? Contact PADO support</p>
            </footer>
          </article>
        </main>
    </div>
  );
};



export default connect(({ padoServicePort }) => ({ padoServicePort }), {})(Lock);
