import React, { useState, useEffect,memo } from 'react';
import { useSelector } from 'react-redux';

import PHeader from '@/components/Layout/PHeader';
import PMask from '@/components/PMask';
import rightArrow from '@/assets/img/rightArrow.svg';

import type { AuthSourcesItem, AuthSourcesItems } from '@/services/api/user';
import type { UserState } from '@/types/store';
import { postMsg } from '@/utils/utils';
import { DEFAULTAUTHSOURCELIST } from '@/config/constants';
import useAuthorization from '@/hooks/useAuthorization';

import './index.sass';

interface authDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}

const AuthDialog: React.FC<authDialogProps> = memo(({ onClose, onSubmit }) => {

  const [oAuthSources, setOAuthSources] = useState<AuthSourcesItems>(
    DEFAULTAUTHSOURCELIST
  );
  const [activeSource, setActiveSource] = useState<string>();
  const [errorTip, setErrorTip] = useState<string>();

  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const authorize = useAuthorization();

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
  
  const handleClickOAuthSource = (item: AuthSourcesItem) => {
    const source = item.name;
    if (item.enabled !== '0') {
      return;
    }
    setActiveSource(source);
    setErrorTip(undefined);
    const upperCaseSourceName = source.toUpperCase()
    const dataType = 'LOGIN'
    authorize(upperCaseSourceName, onSubmit, dataType);
  };

  useEffect(() => {
    padoServicePort && getAllOAuthSources();
  }, [padoServicePort]);
  

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
});

export default AuthDialog;
