import React, { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import PInput from '@/components/PInput/index';
import AsideAnimation from '@/components/Layout/AsideAnimation';
import './index.sass';
import { useSelector, useDispatch } from 'react-redux';
import { postMsg } from '@/utils/utils';

const Lock = memo(() => {
  const dispatch = useDispatch();
  const padoServicePort = useSelector((state) => state.padoServicePort);
  const navigate = useNavigate();
  const [pwd, setPwd] = useState();
  const [errorMsg, setErrorMsg] = useState();
  const padoServicePortListener = async function (message) {
    if (message.resMethodName === 'decrypt') {
      console.log('page_get:decrypt:', 'lock', message.res);
      if (message.res) {
        // encrypt successfully
        await dispatch({
          type: 'setUserPassword',
          payload: pwd,
        });
        navigate('/');
      } else {
        setErrorMsg('Incorrect password');
      }
      padoServicePort.onMessage.removeListener(padoServicePortListener);
    }
  };

  const handleClickStart = () => {
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

  useEffect(() => {
    handleClearUserPwd();
  }, [handleClearUserPwd]);

  return (
    <div className="pageIndex pageLock">
      <main className="appContent">
        <AsideAnimation />
        <article>
          <header className="articleHeader">
            <h1>WELCOME BACK！</h1>
            <p>Manage and share your data simply and safely.</p>
          </header>
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
          <footer className="articleFooter">
            <button className="unLockBtn" onClick={handleClickStart}>
              <span>Unlock</span>
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
