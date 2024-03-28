import React, { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PMask from '@/newComponents/PMask';

import './index.scss';
import PInput from '@/newComponents/PInput';
import PButton from '@/newComponents/PButton';
import { postMsg } from '@/utils/utils';
import { useDispatch, useSelector } from 'react-redux';

interface InputPasswordProps {
  onSubmit: () => void;
  showDialog:(isShow)=>void;
  // onCancel: () => void;
}

type PswFormType = {
  password: '';
  confirmation: '';
};

const WebComeBackDialog: React.FC<InputPasswordProps> = memo(
  ({onSubmit ,showDialog}) => {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState<any>();
    const dispatch = useDispatch();
    const padoServicePort = useSelector((state) => state.padoServicePort);
    const navigate = useNavigate();
    const [errorMsg, setErrorMsg] = useState('');
    const [hadSetPwd, setHadSetPwd] = useState();


    const checkIfHadSetPwd = useCallback(async () => {
      let { keyStore } = await chrome.storage.local.get(['keyStore']);
      // @ts-ignore
      setHadSetPwd(!!keyStore);
    }, []);

    useEffect(() => {
      checkIfHadSetPwd();
    }, [checkIfHadSetPwd]);


    const padoServicePortListener = async function (message) {
      if (message.resMethodName === 'decrypt') {
        console.log('page_get:decrypt:', 'lock');
        if (message.res) {
          // encrypt successfully
          await dispatch({
            type: 'setUserPassword',
            payload: password,
          });
          showDialog(false)
          sessionStorage.setItem('hasInputPsw', '1');
        } else {
          setErrorMsg('Incorrect password');
        }
        padoServicePort.onMessage.removeListener(padoServicePortListener);
      }
    };

    const handleClickStart = () => {
      if (hadSetPwd) {
        if (!password) {
          setErrorMsg('Please enter your password');
          return;
        }

        if (![undefined, null].includes(password)) {
          padoServicePort.onMessage.addListener(padoServicePortListener);
          const msg = {
            fullScreenType: 'wallet',
            reqMethodName: `decrypt`,
            params: {
              password: password,
            },
          };
          postMsg(padoServicePort, msg);
        }
      }
    };
    return (
      <PMask className="backMask">
        {/* onClose={onClose} closeable={!fromEvents} */}
        <div className="pDialog2 inputPassword">
          <main>
            <header>
              <h1>Welcome back</h1>
            </header>
            <section className="detailWrapper">
              <div className="step step1">
                <div className="con">
                  Please enter your password to continue.
                </div>
              </div>
            </section>

            <PInput
              label="Password"
              placeholder="password"
              type="password"
              onChange={(p) => {
                setPassword(p);
              }}
              value={password}
              errorTip={errorMsg}
            />
            <PButton
              text="Confirm"
              className="fullWidth confirmBtn"
              disabled={
              password === ''|| password === undefined}
              onClick={handleClickStart}
            ></PButton>
          </main>
        </div>
      </PMask>
    );
  },
);

export default WebComeBackDialog;
