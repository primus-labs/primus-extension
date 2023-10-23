import React, { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import iconArrow from '@/assets/img/rightArrow.svg';
import PInput from '@/components/PInput/index';
import PButton from '@/components/PButton'
import AsideAnimation from '@/components/Layout/AsideAnimation';
import { postMsg } from '@/utils/utils';
import './index.sass';

const Lock = memo(() => {
  const [hadSetPwd, setHadSetPwd] = useState()
  const dispatch = useDispatch();
  const padoServicePort = useSelector((state) => state.padoServicePort);
  const navigate = useNavigate();
  const [pwd, setPwd] = useState();
  const [errorMsg, setErrorMsg] = useState();
  const padoServicePortListener = async function (message) {
    if (message.resMethodName === 'decrypt') {
      console.log('page_get:decrypt:', 'lock');
      if (message.res) {
        // encrypt successfully
        await dispatch({
          type: 'setUserPassword',
          payload: pwd,
        });
        navigate('/events');
      } else {
        setErrorMsg('Incorrect password');
      }
      padoServicePort.onMessage.removeListener(padoServicePortListener);
    }
  };

  const handleClickStart = () => {
    if (hadSetPwd) {
      if (!pwd) {
        setErrorMsg('Please enter your password');
        return;
      }

      if (![undefined, null].includes(pwd)) {
        padoServicePort.onMessage.addListener(padoServicePortListener);
        const msg = {
          fullScreenType: 'wallet',
          reqMethodName: `decrypt`,
          params: {
            password: pwd,
          },
        };
        postMsg(padoServicePort, msg);
      }
    } else {
      navigate('/events');
    }
  };
  const handleChangePwd = (val) => {
    if (val && errorMsg && errorMsg === 'Please enter your password') {
      setErrorMsg(undefined);
    }
    setPwd(val);
  };
  const handleSubmitPwd = () => {
    handleClickStart();
  };
  const handleClearUserPwd = useCallback(async () => {
    await dispatch({
      type: 'setUserPassword',
      payload: undefined,
    });
    const msg = {
      fullScreenType: 'wallet',
      reqMethodName: 'clearUserPassword',
      params: {},
    };
    postMsg(padoServicePort, msg);
  }, [dispatch, padoServicePort]);
  const checkIfHadSetPwd = useCallback(async() => {
    let { keyStore } = await chrome.storage.local.get(['keyStore']);
    setHadSetPwd(!!keyStore);
  },[])

  useEffect(() => {
    handleClearUserPwd();
  }, [handleClearUserPwd]);
  useEffect(() => {
    checkIfHadSetPwd();
  }, [checkIfHadSetPwd]);

  return (
    <div className="pageIndex pageLock">
      <main className="appContent">
        <AsideAnimation />
        <article>
          <header className="articleHeader">
            <h1>Welcome Back！</h1>
            <p>Bringing all internet data into smart contracts.</p>
          </header>
          {hadSetPwd && (
            <main className="articleMain formItem">
              <h6>Password</h6>
              <PInput
                type="password"
                placeholder="Please enter your password"
                onChange={handleChangePwd}
                onSearch={handleSubmitPwd}
                visible
              />
              {errorMsg && <div className="errorTip">{errorMsg}</div>}
            </main>
          )}
          <footer className="articleFooter">
            <button className="startBtn" onClick={handleClickStart}>
              <span>Unlock</span>
              <div className="iconArrow"></div>
            </button>
            {/* <p className="forgetPwd">Forgot password?</p> */}
            {/* <p className="help">Need help? Contact PADO support</p> */}
          </footer>
        </article>
      </main>
    </div>
  );
});

export default Lock;
