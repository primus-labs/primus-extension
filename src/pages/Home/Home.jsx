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
  const [maskVisible, setMaskVisible] = useState(false)
  const [step, setStep] = useState(0)
  const handleClickStart = () => {
    setMaskVisible(true)
    setStep(1)
  }
  const handleCloseMask = () => {
    setMaskVisible(false)
    setStep(0)
  }
  const handleSubmitAuth = () => {
    setStep(step => ++step)
  }
  const handleSubmitCreateAccount = () => {
    setStep(step => ++step)
  }
  const handleCancelCreateAccount = () => {
    setStep(step => --step)
  }
  const handleSubmitSetPwd = () => {
    setStep(step => ++step)
  }
  const handleCancelSetPwd= () => {
    setStep(step => --step)
  }
  const handleSubmitSetSuc = () => {
    setMaskVisible(false)
    setStep(0)
  }
  const checkActiveStep = () => {
    chrome.storage.local.get(['userInfo', 'keyStore'],  (storedData) => {
      // If user information is cached,it represents that it is authorized => step2 
      if ( storedData['userInfo'] ) {
        setStep(2)
      }
      // If keyStore is cached,,it represents that the user has already bound a wallet => data page TODO
      if ( storedData['keyStore'] ) {
        navigate('/datas')
      }
    })
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
      {maskVisible && <PMask onClose={handleCloseMask}/>}
      {step === 1 && <AuthDialog onSubmit={handleSubmitAuth}/>}
      {step === 2 && <CreateAccountDialog onSubmit={handleSubmitCreateAccount} onCancel={handleCancelCreateAccount}/>}
      {step === 3 && <SetPwdDialog onSubmit={handleSubmitSetPwd} onCancel={handleCancelSetPwd}/>}
      {step === 4 && <SetSucDialog onSubmit={handleSubmitSetSuc}/>}
    </div>
  );
};

export default Home;
