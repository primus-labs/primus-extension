import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { connect } from 'react-redux';
import rem from '@/utils/rem.js';
// import {getAllStorageAsync} from '@/store/actions'
// import store from '@/store/index'
import PHeader from '@/components/PHeader';
import TransferToChainDialog from '@/components/TransferToChainDialog'
import AuthDialog from '@/components/Home/AuthDialog';
import SetPwdDialog from '@/components/SetPwdDialog';
import SetSucDialog from '@/components/SetSucDialog';
import BackgroundAnimation from '@/components/BackgroundAnimation';
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
    title: 'ETH'
  },
  {
    icon: iconBinance,
    title: 'Binance'
  },
  {
    icon: iconNetwork3,
    title: '3'
  },
  {
    icon: iconNetwork4,
    title: '4'
  },
  {
    icon: iconNetwork5,
    title: '5'
  },
  {
    icon: iconNetwork6,
    title: '6'
  },
]
const Home = (props) => {
  // const {getAllStorageAsync} = props
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
    // chrome.storage.local.remove(['userInfo', 'keyStore'],  (storedData) => {
    //   console.log("remove 'userinfo' & 'keyStore' successfully")
    // })// TODO DEL!!!

    // It can be called like this:
    let { userInfo, privateKey, keyStore } = await getMutipleStorageSyncData([
      'userInfo',
      'privateKey',
      'keyStore',
    ]);
    // If keyStore is cached,,it represents that the user has already bound a wallet => data page
    if (keyStore) {
      navigate('/datas');
      return true
    }
    // If privateKey is cached,,it represents that the user has created account without password => step3
    if (privateKey) {
      setStep(3)
      return true
    }
    // If user information is cached,it represents that it is authorized => step2
    if (userInfo) {
      setStep(2)
      return true
    }
    
    return false
  };
  const initalPage = async () => {
    // await getAllStorageAsync()
    // console.log('props', props, store.getState())
    await checkActiveStep();
  };
  useEffect(() => {
    rem();
    initalPage()
    // navigate('/datas')// TODO !!!DEL
  }, []);
  useEffect(() => {
    console.log('step', step)
  }, [step]);

  return (
    <div className="pageHome">
      <div className="baseLayer">
        <BackgroundAnimation />
      </div>
      <div className="pageLayer">
        <header className="appHeader">
          <PHeader />
        </header>
        <main className="appContent">
          <AsideAnimation />
          <article>
            <section className="descWrapper">
              <h1>Welcome to PADO data gateway</h1>
              <p>A Trustless Data Gateway Connecting Web2 and Web3</p>
              <p>
                Seems like your first time using. Please click on below button
                to proceed
              </p>
            </section>
            <button className="startBtn" onClick={handleClickStart}>
              <span>Click here to start</span>
              <div className="iconArrow"></div>
            </button>
          </article>
        </main>
      </div>
      {step === 1 && <AuthDialog onSubmit={handleSubmitAuth} onClose={handleCloseMask} />}
      {step === 2 && <TransferToChainDialog
        onClose={handleCloseMask}
        onSubmit={handleSubmitCreateAccount}
        onCancel={handleCancelCreateAccount}
        title='Create account'
        desc='Create an on-chain address to easily manage your data to Web 3.0. The address will bind to your sign up account.'
        list={networkList}
        showButtonSuffixIcon={true}
      />}
      {step === 3 && (
        <SetPwdDialog
          onSubmit={handleSubmitSetPwd}
          onCancel={handleCancelSetPwd}
        />
      )}
      {step === 4 && <SetSucDialog onSubmit={handleSubmitSetSuc} />}
    </div>
  );
};
export default Home;
// export default connect(
//   (store) => store,
//   {
//     getAllStorageAsync
//   })(Home);
