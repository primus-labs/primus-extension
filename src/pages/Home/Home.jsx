import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router';
import rem from '@/utils/rem.js';
import PHeader from '@/components/PHeader'
import PMask from '@/components/PMask'
import AuthDialog from '@/components/AuthDialog'
import CreateAccountDialog from '@/components/CreateAccountDialog'
import SetPwdDialog from '@/components/SetPwdDialog'
import SetSucDialog from '@/components/SetSucDialog'
import BackgroundAnimation from '@/components/BackgroundAnimation'
import AsideAnimation from '@/components/AsideAnimation'
import './Home.sass';

const Home = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const handleClickStart = async() => {
    // setMaskVisible(true)
    // setStep(1)
    const isInProcess = await checkActiveStep()
    if(!isInProcess) {
      setStep(1)
    }
  }
  const handleCloseMask = () => {
    setStep(0)
  }
  const handleSubmitAuth = () => {
    setStep(2)
  }
  const handleSubmitCreateAccount = () => {
    setStep(3)
  }
  const handleCancelCreateAccount = () => {
    setStep(2)
  }
  const handleSubmitSetPwd = () => {
    setStep(4)
  }
  const handleCancelSetPwd= () => {
    setStep(3)
  }
  const handleSubmitSetSuc = () => {
    navigate('/datas')
  }
  const checkActiveStep = async() => {
    // chrome.storage.local.remove(['userInfo', 'keyStore'],  (storedData) => {
    //   console.log("remove 'userinfo' & 'keyStore' successfully")
    // })// TODO DEL!!!
    function getAllStorageSyncData(top_key) {
      // Immediately return a promise and start asynchronous work
      return new Promise((resolve, reject) => {
        // Asynchronously fetch all data from storage.sync.
        chrome.storage.local.get(top_key, (items) => {
          // Pass any observed errors down the promise chain.
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          // Pass the data retrieved from storage down the promise chain.
          resolve(items);
        });
      });
    }
    
    // It can be called like this:
    const {userInfo, keyStore} = await getAllStorageSyncData(['userInfo', 'keyStore']);
    // If user information is cached,it represents that it is authorized => step2 
    if ( userInfo ) {
      setStep(2)
    }
    // If keyStore is cached,,it represents that the user has already bound a wallet => data page TODO
    if ( keyStore ) {
      navigate('/datas')
    }
    return userInfo || keyStore
  }
  useEffect(() => {
    rem()
    checkActiveStep()
  }, [])

  return (
    <div className="appPage appHome">
      <div className="baseLayer">
        <BackgroundAnimation/>
        <header className="appHeader">
          <PHeader/>
        </header>
        <main className="appContent">
          <AsideAnimation/>
          <article>
            <section className="descWrapper">
              <h1>Welcome to PADO data gateway</h1>
              <p>A Trustless Data Gateway Connecting Web2 and Web3</p>
              <p>Seems like your first time using. Please click on below button to proceed</p>
            </section>
            <button className="startBtn" onClick={handleClickStart}>
              <span>Click here to start</span>
              <div className="iconArrow"></div>
            </button>
          </article>
        </main>
      </div>
      {[1,2,3,4].includes(step) && <PMask onClose={handleCloseMask}/>}
      {step === 1 && <AuthDialog onSubmit={handleSubmitAuth}/>}
      {step === 2 && <CreateAccountDialog onSubmit={handleSubmitCreateAccount} onCancel={handleCancelCreateAccount}/>}
      {step === 3 && <SetPwdDialog onSubmit={handleSubmitSetPwd} onCancel={handleCancelSetPwd}/>}
      {step === 4 && <SetSucDialog onSubmit={handleSubmitSetSuc}/>}
    </div>
  );
};

export default Home;
