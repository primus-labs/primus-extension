import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { connect, useSelector } from 'react-redux';
import TransferToChainDialog from '@/components/DataSourceDetail/TransferToChainDialog';
import AuthDialog from '@/components/Home/AuthDialog';
import SetPwdDialog from '@/components/Home/SetPwdDialog';
import SetSucDialog from '@/components/Home/SetSucDialog';
import AsideAnimation from '@/components/AsideAnimation';
import './Home.sass';
import { getMutipleStorageSyncData } from '@/utils/utils';
import iconETH from '@/assets/img/iconETH.svg';
import iconBinance from '@/assets/img/iconBinance.svg';
import iconNetwork3 from '@/assets/img/iconNetwork3.svg';
import iconNetwork4 from '@/assets/img/iconNetwork4.svg';
import iconNetwork5 from '@/assets/img/iconNetwork5.svg';
import iconNetwork6 from '@/assets/img/iconNetwork6.svg';

const networkList = [
  {
    icon: iconETH,
    title: 'ETH',
  },
  {
    icon: iconBinance,
    title: 'Binance',
  },
  {
    icon: iconNetwork3,
    title: '3',
  },
  {
    icon: iconNetwork4,
    title: '4',
  },
  {
    icon: iconNetwork5,
    title: '5',
  },
  {
    icon: iconNetwork6,
    title: '6',
  },
];
const Home = () => {
  const padoServicePort = useSelector((state) => state.padoServicePort)
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const handleClickStart = async () => {
    const isInProcess = await checkActiveStep();
    if (!isInProcess) {
      setStep(1);
    }
  };
  const handleCloseMask = () => {
    setStep(0);
  };
  const handleSubmitAuth = () => {
    setStep(2);
  };
  const handleSubmitCreateAccount = () => {
    setStep(3);
  };
  const handleCancelCreateAccount = () => {
    setStep(1);
  };
  const handleSubmitSetPwd = () => {
    setStep(4);
  };
  const handleCancelSetPwd = () => {
    setStep(2);
  };
  const handleSubmitSetSuc = () => {
    navigate('/datas');
  };
  const checkActiveStep = async () => {
    // It can be called like this:
    let { userInfo, privateKey, keyStore } = await getMutipleStorageSyncData([
      'userInfo',
      'privateKey',
      'keyStore',
    ]);
    // If keyStore is cached,,it represents that the user has already bound a wallet => data page
    if (keyStore) {
      const padoServicePortListener = async function (message) {
        if (message.resMethodName === 'queryUserPassword') {
          console.log("page_get:queryUserPassword:", message.res);
          if(!message.res) {
            navigate('/lock')
          } else {
            navigate('/datas');
          }
        }
      }
      padoServicePort.onMessage.addListener(padoServicePortListener)
      const msg = {
        fullScreenType: 'wallet',
        reqMethodName: 'queryUserPassword',
        params: {}
      }
      padoServicePort.postMessage(msg)
      return true;
    }
    // If privateKey is cached,,it represents that the user has created account without password => step3
    if (privateKey) {
      setStep(3);
      return true;
    }
    // If user information is cached,it represents that it is authorized => step2
    if (userInfo) {
      setStep(2);
      return true;
    }

    return false;
  };
  
  useEffect(() => {
    checkActiveStep();
  }, []);
  
  return (
    <div className="pageIndex pageHome">
      <main className="appContent">
        <AsideAnimation />
        <article>
          <section className="descWrapper">
            <h1><span>WELCOME TO </span><br/>zkDATA ATTESTATION SERVICE</h1>
            <p>Manage and share your web data simply and safely.</p>
          </section>
          <button className="startBtn" onClick={handleClickStart}>
            <span>Click here to start</span>
            <div className="iconArrow"></div>
          </button>
        </article>
      </main>
      {step === 1 && (
        <AuthDialog onSubmit={handleSubmitAuth} onClose={handleCloseMask} />
      )}
      {step === 2 && (
        <TransferToChainDialog
          onClose={handleCloseMask}
          onSubmit={handleSubmitCreateAccount}
          onCancel={handleCancelCreateAccount}
          title="Create account"
          desc="Create an on-chain address to easily manage your data to Web 3.0. The address will bind to your sign up account."
          list={networkList}
          showButtonSuffixIcon={true}
        />
      )}
      {step === 3 && (
        <SetPwdDialog
          onClose={handleCloseMask}
          onSubmit={handleSubmitSetPwd}
          onCancel={handleCancelSetPwd}
        />
      )}
      {step === 4 && (
        <SetSucDialog onClose={handleCloseMask} onSubmit={handleSubmitSetSuc} />
      )}
    </div>
  );
};
export default Home;
