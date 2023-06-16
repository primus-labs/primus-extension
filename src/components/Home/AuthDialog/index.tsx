import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AuthSourcesItem, AuthSourcesItems } from '@/services/api/user';
import PHeader from '@/components/Layout/PHeader';

import PMask from '@/components/PMask';
import rightArrow from '@/assets/img/rightArrow.svg';
import './index.sass';
import { useSelector } from 'react-redux';
import type { UserState } from '@/store/reducers';
import { getAuthUrl, postMsg } from '@/utils/utils';
import {DEFAULTAUTHSOURCELIST} from '@/config/constants'

interface authDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}

const AuthDialog: React.FC<authDialogProps> = ({ onClose, onSubmit }) => {
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );

  const [oAuthSources, setOAuthSources] = useState<AuthSourcesItems>(
    DEFAULTAUTHSOURCELIST
  );
  const [activeSource, setActiveSource] = useState<string>();
  const [authWindowId, setAuthWindowId] = useState<number>();
  const [checkIsAuthDialogTimer, setCheckIsAuthDialogTimer] = useState<any>();
  const [errorTip, setErrorTip] = useState<string>();
  const handleClickNext = () => {
    if (!activeSource) {
      setErrorTip('Please select one Auth to sign up');
      return;
    }
  };
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
  const fetchIsAuthDialog = (state: string, source: string) => {
    const msg = {
      fullScreenType: 'padoService',
      reqMethodName: 'checkIsLogin',
      params: {
        state,
        source,
        data_type: 'LOGIN',
      },
    };
    postMsg(padoServicePort, msg);
    console.log('page_send:checkIsLogin request');
  };
  const createAuthWindowCallBack: (
    state: string,
    source: string,
    window?: chrome.windows.Window | undefined
  ) => void = (state, source, res) => {
    const newWindowId = res?.id;
    setAuthWindowId(newWindowId);
    // console.log('create', newWindowId)
    const timer = setInterval(() => {
      fetchIsAuthDialog(state, source);
    }, 1000);
    setCheckIsAuthDialogTimer(timer);
    const removeWindowCallBack = (windowId: number) => {
      setAuthWindowId(undefined);
      windowId === newWindowId && timer && clearInterval(timer);
      padoServicePort.onMessage.removeListener(padoServicePortListener);
    };
    const padoServicePortListener = async function (message: any) {
      if (message.resMethodName === 'checkIsLogin') {
        console.log('page_get:checkIsLogin:', message.res);
        if (message.res) {
          // console.log('remove', newWindowId)
          newWindowId &&
            chrome.windows.get(newWindowId, {}, (win) => {
              win?.id && chrome.windows.remove(newWindowId);
            });
          timer && clearInterval(timer);
          onSubmit();
        }
      }
    };
    chrome.windows.onRemoved.addListener(removeWindowCallBack);
    padoServicePort.onMessage.addListener(padoServicePortListener);
  };
  const handleClickOAuthSource = (item: AuthSourcesItem) => {
    const source = item.name;
    if (item.enabled !== '0') {
      return;
    }
    setActiveSource(source);
    setErrorTip(undefined);
    // If the authorization window is open,focus on it
    if (authWindowId) {
      chrome.windows.update(authWindowId, {
        focused: true,
      });
      return;
    }
    const state = uuidv4();
    var width = 520;
    var height = 620;
    const windowScreen: Screen = window.screen;
    var left = Math.round(windowScreen.width / 2 - width / 2);
    var top = Math.round(windowScreen.height / 2 - height / 2);
    const authUrl = getAuthUrl({
      source,
      state,
    });
    const windowOptions: chrome.windows.CreateData = {
      url: authUrl,
      type: 'popup',
      focused: true,
      // setSelfAsOpener: false,
      top,
      left,
      width,
      height,
    };
    chrome.windows.create(windowOptions, (window) => {
      createAuthWindowCallBack(state, source, window);
    });
  };

  useEffect(() => {
    padoServicePort && getAllOAuthSources();
  }, [padoServicePort]);
  useEffect(() => {
    return () => {
      checkIsAuthDialogTimer && clearInterval(checkIsAuthDialogTimer);
    };
  }, [checkIsAuthDialogTimer]);

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
                    item.enabled === '0'
                      ? 'licensorItem'
                      : 'licensorItem disabled'
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
        </main>
        <button className="nextBtn authDialogNextBtn" onClick={handleClickNext}>
          {errorTip && (
            <div className="tipWrapper">
              <div className="errorTip">{errorTip}</div>
            </div>
          )}
          <span>Next</span>
          <img src={rightArrow} alt="" />
        </button>
      </div>
    </PMask>
  );
};

export default AuthDialog;
