import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import './index.scss';
import PSelect from '@/newComponents/PSelect';
import textCopyIcon from '@/assets/newImg/achievements/textCopyIcon.svg';
import mode from '@/assets/newImg/settings/mode.svg';
import { getUserInfo } from '@/services/api/achievements';
import copy from 'copy-to-clipboard';
import { Button, Divider } from 'antd';
import SettingsSetPwdDialog from '@/newComponents/Settings/SettingSetPwdDialog';
import WebComeBackDialog from '@/newComponents/Settings/WebComeBack';
import useMsgs from '@/hooks/useMsgs';
import PButton from '@/newComponents/PButton';
import { useNavigate } from 'react-router-dom';

// eslint-disable-next-line react/display-name
const Setting = memo(() => {
  const [currencies, setCurrencies] = useState([]);
  const [currencyChosen, setCurrencyChosen] = useState('USD');

  const [updateFrequency, setUpdateFrequency] = useState([]);
  const [updateFrequencyChosen, setUpdateFrequencyChosen] = useState('5');
  const [mainWallet, setMainWallet] = useState('');
  const [serialNum, setSerialNum] = useState('');

  const [showSetPwdDialog, setShowSetPwdDialog] = useState(false);
  const [showInputPasswordDialog, setShowInputPasswordDialog] = useState(false);
  const { addMsg } = useMsgs();
  const [hadSetPwd, setHadSetPwd] = useState();
  const [passwordDialogTitle, setPasswordDialogTitle] = useState('');
  const [isChangePwd, setIsChangePwd] = useState(false);
  const navigate = useNavigate();

  const checkIfHadSetPwd = useCallback(async () => {
    // eslint-disable-next-line no-undef
    let { keyStore } = await chrome.storage.local.get(['keyStore']);
    // @ts-ignore
    setHadSetPwd(!!keyStore);
  }, []);

  useEffect(() => {
    async function getUserIgetUserInfoFnnfoFn() {
      const res = await getUserInfo();
      const { rc, result } = res;
      if (rc === 0) {
        setMainWallet(result.mainWallet);
        setSerialNum(result.userId);
      }
    }

    // @ts-ignore
    setCurrencies(['USD']);
    // @ts-ignore
    setUpdateFrequency(['5']);
    getUserIgetUserInfoFnnfoFn();
    checkIfHadSetPwd();
  }, []);

  const currencyItems = useMemo(() => {
    return currencies.map((item) => {
      return {
        label: item,
        value: item,
      };
    });
  }, [currencies]);

  const updateFrequencyItems = useMemo(() => {
    return updateFrequency.map((item) => {
      return {
        label: item + ' Minute',
        value: item,
      };
    });
  }, [updateFrequency]);

  const copyMainWalletFn = () => {
    copy(mainWallet);
    // eslint-disable-next-line no-undef
    addMsg({
      type: 'suc',
      title: 'Copied',
      link: '',
    });
  };

  const copySerialNumFn = () => {
    copy(serialNum);
    // eslint-disable-next-line no-undef
    addMsg({
      type: 'suc',
      title: 'Copied',
      link: '',
    });
  };

  const resetPwsSuccessCallbackFn = async () => {
    setShowSetPwdDialog(false);
    // eslint-disable-next-line no-undef
    let { keyStore } = await chrome.storage.local.get(['keyStore']);
    // @ts-ignore
    setHadSetPwd(!!keyStore);
    sessionStorage.setItem('hasInputPsw', '');
    navigate('/home');
    // setShowInputPasswordDialog(true);
  };

  return (
    <div className={'outerDiv'}>
      <div className="pageContent">
        <div className={'cardDiv1'}>
          <div className={'currencyDiv'}>
            <div className={'descDiv'}>
              <div className={'title'}>Preferred currency</div>
              <div className={'content'}>
                Choose the currency shown to your asset balance
              </div>
            </div>
            <div
              className={'selectDiv'}
              style={{
                width: '149px',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/*<Select*/}
              {/*  style={{ width: '149px', height: '32px' }}*/}
              {/*  defaultValue={currencyChosen}*/}
              {/*  options={currencyItems}*/}
              {/*  onChange={(v) => {*/}
              {/*    setCurrencyChosen(v);*/}
              {/*  }}>*/}
              {/*</Select>*/}
              <PSelect
                className={'selectDivInput'}
                list={currencyItems}
                onChange={(v) => {
                  setCurrencyChosen(v);
                }}
                value={currencyChosen}
              />
            </div>
          </div>
          <Divider
            style={{
              width: '1072px',
              marginTop: '16px',
              marginBottom: '16px',
              color: 'var(--border-tokens-border-primary)',
            }}
          />
          <div className={'currencyDiv'}>
            <div className={'descDiv'}>
              <p className={'title'}>Data update frequency</p>
              <p className={'content'}>
                Select the frequency to automatically update your fetched data
                sources.
              </p>
            </div>
            <div
              className={'selectDiv'}
              style={{
                width: '149px',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/*<Select*/}
              {/*  style={{ width: '149px', height: '32px' }}*/}
              {/*  defaultValue={updateFrequencyChosen}*/}
              {/*  options={updateFrequencyItems}*/}
              {/*  onChange={(v) => {*/}
              {/*    setUpdateFrequencyChosen(v);*/}
              {/*  }}>*/}
              {/*</Select>*/}

              <PSelect
                className={'selectDivInput'}
                list={updateFrequencyItems}
                onChange={(v) => {
                  setUpdateFrequencyChosen(v);
                }}
                value={updateFrequencyChosen}
              />
            </div>
          </div>
        </div>

        <div className={'cardDiv1'}>
          <div className={'currencyDiv'}>
            <div className={'descDiv'}>
              <p className={'title'}>Account</p>
              <p className={'content'}>Bounded wallet address</p>
            </div>
            <div className={'selectDiv'}>
              <div className={'textDiv'}>{mainWallet}</div>
              <PButton
                type="icon"
                className={'iconDiv'}
                icon={<i className="iconfont icon-iconCopy"></i>}
                onClick={copyMainWalletFn}
              />
              {/*<img className={'iconDiv'} src={textCopyIcon} alt={textCopyIcon} onClick={copyMainWalletFn} />*/}
            </div>
          </div>
          <Divider
            style={{
              width: '1072px',
              marginTop: '16px',
              marginBottom: '16px',
              color: '##E0E0E0',
            }}
          />

          <div className={'currencyDiv'}>
            <div className={'descDiv'}>
              <p className={'title'}>Setup password</p>
              <p className={'content'}>
                Set a password to secure the data on your computer.
              </p>
            </div>
            <div
              className={'selectDiv'}
              style={{
                width: '149px',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {hadSetPwd && (
                <PButton
                  className={'changePwdBtn'}
                  text={'Change Password'}
                  type="secondary"
                  onClick={() => {
                    setShowSetPwdDialog(true);
                    setPasswordDialogTitle('Change Password');
                    setIsChangePwd(true);
                  }}
                />
              )}
              {!hadSetPwd && (
                <PButton
                  className={'changePwdBtn'}
                  text={'Setup Password'}
                  type="secondary"
                  onClick={() => {
                    setShowSetPwdDialog(true);
                    setPasswordDialogTitle('Setup Password');
                    setIsChangePwd(false);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className={'cardDiv3'}>
          <div className={'serialNumDiv'}>
            <div className={'serialNumTitle'}>Serial number</div>
            <div className={'serialNumTxt'}>
              <div className={'textDiv'}>{serialNum}</div>
              <PButton
                type="icon"
                className={'iconDiv'}
                icon={<i className="iconfont icon-iconCopy"></i>}
                onClick={copySerialNumFn}
              />
            </div>
          </div>
        </div>
        {showSetPwdDialog && (
          <SettingsSetPwdDialog
            isChangePwd={isChangePwd}
            title={passwordDialogTitle}
            onClose={() => {
              setShowSetPwdDialog(false);
            }}
            onSubmit={() => {}}
            resetPwsSuccessCallback={resetPwsSuccessCallbackFn}
          />
        )}
        {showInputPasswordDialog && (
          <WebComeBackDialog
            onSubmit={() => {}}
            showDialog={setShowInputPasswordDialog}
          />
        )}
      </div>
    </div>
  );
});

export default Setting;
