import React, { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import PInput from '@/components/PInput/index';
import PButton from '@/components/PButton';
import AsideAnimation from '@/components/Layout/AsideAnimation';
import { postMsg } from '@/utils/utils';
import './index.scss';

const Lock = memo(() => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const backUrl = searchParams.get('backUrl');
  const [hadSetPwd, setHadSetPwd] = useState();
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
        const targetUrl = backUrl? decodeURIComponent(backUrl) : '/events';
        navigate(targetUrl);
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
      const targetUrl = backUrl ? decodeURIComponent(backUrl) : '/events';
      navigate(targetUrl);
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
  const checkIfHadSetPwd = useCallback(async () => {
    let { keyStore } = await chrome.storage.local.get(['keyStore']);
    setHadSetPwd(!!keyStore);
  }, []);

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
        <article className={hadSetPwd ? 'hadSetPwd' : ''}>
          <section className="descWrapper">
            <h1>Welcome Back！</h1>
            <p>Liberate Data and Computation with Cryptography.</p>
          </section>
          {hadSetPwd && (
            <main className="articleMain formItem">
              <PInput
                label="Password"
                type="password"
                placeholder="Please enter your password"
                onChange={handleChangePwd}
                onSearch={handleSubmitPwd}
                visible
                errorTip={errorMsg}
              />
            </main>
          )}
          <PButton
            text="Unlock"
            suffix={<i className="iconfont icon-rightArrow"></i>}
            onClick={handleClickStart}
          />
        </article>
      </main>
    </div>
  );
});

export default Lock;
