import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import './index.scss';
import PSelect from '@/newComponents/PSelect';
import textCopyIcon from '@/assets/newImg/achievements/textCopyIcon.svg';
import mode from '@/assets/newImg/settings/mode.svg';
import { getUserInfo } from '@/services/api/achievements';
import copy from 'copy-to-clipboard';
import PButton from '@/newComponents/PButton';


const Setting = memo(() => {

  const [currencies, setCurrencies] = useState([]);
  const [currencyChosen, setCurrencyChosen] = useState('USD');

  const [updateFrequency, setUpdateFrequency] = useState([]);
  const [updateFrequencyChosen, setUpdateFrequencyChosen] = useState('5');
  const [mainWallet, setMainWallet] = useState('');
  const [serialNum, setSerialNum] = useState('');


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

  }, []);

  const currencyItems = useMemo(() => {
    return currencies.map(item => {
      return {
        label: item,
        value: item,
      };
    });
  }, [currencies]);

  const updateFrequencyItems = useMemo(() => {
    return updateFrequency.map(item => {
      return {
        label: item + ' Minute',
        value: item,
      };
    });
  }, [updateFrequency]);

  const copyMainWalletFn = () => {
    copy(mainWallet);
    // eslint-disable-next-line no-undef
    alert('copy success');
  };

  const copySerialNumFn = () => {
    copy(serialNum);
    // eslint-disable-next-line no-undef
    alert('copy success');
  };


  const PHr = () => {
    return <hr
      style={{ marginTop: '16px', marginBottom: '16px', color: '##E0E0E0', height: '1px', background: '#E0E0E0' }} />;
  };


  return (
    <div className={'outerDiv'}>
      <div className={'cardDiv1'}>
        <div className={'currencyDiv'}>
          <div className={'descDiv'}>
            <div className={'title'}>Preferred currency</div>
            <div className={'content'}>Choose the currency shown to your asset balance</div>
          </div>
          <div className={'selectDiv'} style={{ width: '149px', height: '32px' }}>
            <PSelect
              align="horizontal"
              list={currencyItems}
              value={currencyChosen}
              onChange={(v) => {
                setCurrencyChosen(v);
              }}
              showSelf={false}
            />
          </div>
        </div>
        <PHr />
        <div className={'currencyDiv'}>
          <div className={'descDiv'}>
            <p className={'title'}>Data update frequency</p>
            <p className={'content'}>Select the frequency to automatically update your fetched data sources.</p>
          </div>
          <div className={'selectDiv'} style={{ width: '149px', height: '32px' }}>
            <PSelect
              align="horizontal"
              list={updateFrequencyItems}
              value={updateFrequencyChosen}
              onChange={(v) => {
                setUpdateFrequencyChosen(v);
              }}
              showSelf={false}
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
            <img className={'iconDiv'} src={textCopyIcon} alt={textCopyIcon} onClick={copyMainWalletFn} />
          </div>
        </div>
        <PHr />

        <div className={'currencyDiv'}>
          <div className={'descDiv'}>
            <p className={'title'}>Setup password</p>
            <p className={'content'}>Set a password to secure the data on your computer.</p>
          </div>
          <div className={'selectDiv'} style={{ width: '155px', height: '32px' }}>
            <PButton type={'secondary'} onClick={() => {
            }} text={'Change Password'} />
          </div>
        </div>

      </div>

      <div className={'cardDiv3'}>
        <div className={'serialNumDiv'}>
          <div className={'serialNumTitle'}>Serial number</div>
          <div className={'serialNumTxt'}>
            <div className={'textDiv'}>{serialNum}</div>
            <img className={'iconDiv'} src={textCopyIcon} alt={textCopyIcon} onClick={copySerialNumFn} />
          </div>
        </div>
        <PHr />
        <div className={'modeDiv'}>
          <div className={'textDiv'}>Mode</div>
          <img className={'iconDiv'} src={mode}></img>
        </div>
      </div>
    </div>
  );
});

export default Setting;