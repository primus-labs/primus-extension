import React, { useState, useEffect, memo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PInput from '@/components/PInput/index';
import PHeader from '@/components/Layout/PHeader';
import PMask from '@/components/PMask';
import PBottomErrorTip from '@/components/PBottomErrorTip';
import rightArrow from '@/assets/img/rightArrow.svg';

import type { AuthSourcesItem, AuthSourcesItems } from '@/services/api/user';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';

import { postMsg } from '@/utils/utils';
import { DEFAULTAUTHSOURCELIST } from '@/config/constants';
import useAuthorization from '@/hooks/useAuthorization';
import { initUserInfoActionAsync } from '@/store/actions';

import './index.sass';

interface authDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}

const AuthDialog: React.FC<authDialogProps> = memo(({ onClose, onSubmit }) => {
  const [pwd, setPwd] = useState<string>();
  const [oAuthSources, setOAuthSources] = useState<AuthSourcesItems>(
    DEFAULTAUTHSOURCELIST
  );
  const [activeSource, setActiveSource] = useState<string>();
  const [errorTip, setErrorTip] = useState<string>();

  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const dispatch: Dispatch<any> = useDispatch();

  const authorize = useAuthorization();

  const handleClickNext = async() => {
    if (!activeSource) {
      setErrorTip('Please select one Auth to sign up');
      return;
    }
    if (!pwd) {
      setErrorTip('Please enter your Invitation Code');
      return;
    }
    await chrome.storage.local.set({
      invitationCode: pwd
    });
    const upperCaseSourceName = activeSource.toUpperCase();
    const dataType = 'LOGIN';
    authorize(upperCaseSourceName, handleSubmit, dataType);
  };
  useEffect(() => {
    activeSource && pwd && setErrorTip('');
  }, [activeSource, pwd]);
  const fetchAllOAuthSources = () => {
    const msg = {
      fullScreenType: 'padoService',
      reqMethodName: 'getAllOAuthSources',
    };
    postMsg(padoServicePort, msg);
    console.log('page_send:getAllOAuthSources request');
  };
  const getAllOAuthSources = async () => {
    const padoServicePortListener = async function (message: any) {
      const { res } = message;
      if (message.resMethodName === 'getAllOAuthSources') {
        if (res) {
          setOAuthSources(res);
        } else {
          // alert('getAllOAuthSources network error');
        }
        console.log('page_get:getAllOAuthSources:', res);
      }
    };
    padoServicePort.onMessage.addListener(padoServicePortListener);
    fetchAllOAuthSources();
  };
  const handleSubmit = useCallback(async () => {
    await dispatch(initUserInfoActionAsync());
    onSubmit();
  }, [onSubmit, dispatch]);
  const handleClickOAuthSource = (item: AuthSourcesItem) => {
    const source = item.name;
    if (item.enabled !== '0') {
      return;
    }
    
    if (source === activeSource) {
      setActiveSource(undefined);
      return
    }
    setActiveSource(source);
    // setErrorTip(undefined);
    // const upperCaseSourceName = source.toUpperCase();
    // const dataType = 'LOGIN';
    // authorize(upperCaseSourceName, handleSubmit, dataType);
  };
  const handleChangePwd = useCallback((val: string) => {
    setPwd(val);
  }, []);

  useEffect(() => {
    padoServicePort && getAllOAuthSources();
  }, [padoServicePort]);
  const liClassNameFn = useCallback(
    (item: AuthSourcesItem) => {
      let activeCN = 'licensorItem';
      if (item.enabled === '1') {
        activeCN += ' disabled';
      }
      if (item.name === activeSource) {
        activeCN += ' active';
      }
      return activeCN;
    },
    [activeSource]
  );

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog authDialog">
        <main>
          <PHeader />
          <h1>Sign up</h1>
          <ul className="licensorList">
            {oAuthSources.map((item: AuthSourcesItem) => {
              return (
                <li
                  key={item.id}
                  className={
                    liClassNameFn(item)
                  }
                  onClick={() => {
                    handleClickOAuthSource(item);
                  }}
                >
                  <img src={item.logoUrl} alt="" />
                </li>
              );
            })}
          </ul>
          <div className="dividerWrapper">
            <i></i>
            <div className="divider">and</div>
            <i></i>
          </div>
          <div className="formItem">
            <h6>Invitation Code</h6>
            <PInput
              placeholder="Please enter your Invitation Code"
              onChange={handleChangePwd}
            />
          </div>
        </main>
        <button className="nextBtn authDialogNextBtn" onClick={handleClickNext}>
          {errorTip && <PBottomErrorTip text={errorTip} />}
          <span>Next</span>
          <img src={rightArrow} alt="" />
        </button>
      </div>
    </PMask>
  );
});

export default AuthDialog;
