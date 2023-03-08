import React, {useState, useEffect} from 'react';
import {
  useNavigate
} from "react-router-dom";
import PHeader from '@/components/PHeader'
import PMask from '@/components/PMask'
import AuthDialog from '@/components/AuthDialog'
import CreateAccountDialog from '@/components/CreateAccountDialog'
import SetPwdDialog from '@/components/SetPwdDialog'
import SetSucDialog from '@/components/SetSucDialog'
import BackgroundAnimation from '@/components/BackgroundAnimation'
import AsideAnimation from '@/components/AsideAnimation'

import illustration from '@/assets/img/illustration.svg';
import rightArrow from '@/assets/img/rightArrow.svg';
import './Home.sass';
import rem from '@/utils/rem.js';
// import "../../../utils/mouseTail.js"
const Home = () => {
  const [maskVisible, setMaskVisible] = useState(false)
  const [step, setStep] = useState(0)
  const navigate = useNavigate();
  const handleClickStart = () => {
    // navigate("auth");
    setMaskVisible(true)
    setStep(1)
  }
  const handleCloseMask = () => {
    setMaskVisible(false)
    setStep(0)
  }
  const handleSubmitAuth = () => {
    setStep(2)
  } 
  const handleSubmitCreateAccount = () => {
    setStep(3)
  } 
  const handleSubmitSetPwd = () => {
    setStep(4)
  }
  const handleSubmitSetSuc = () => {
    setMaskVisible(false)
    setStep(0)
  }
  
  useEffect(() => {
    rem()
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
              <img src={rightArrow} alt="right arrow" /></button>
          </article>
        </main>
      </div>
      {maskVisible && <PMask onClose={handleCloseMask}/>}
      {step === 1 && <AuthDialog onSubmit={handleSubmitAuth}/>}
      {step === 2 && <CreateAccountDialog onSubmit={handleSubmitCreateAccount}/>}
      {step === 3 && <SetPwdDialog onSubmit={handleSubmitSetPwd}/>}
      {step === 4 && <SetSucDialog onSubmit={handleSubmitSetSuc}/>}
    </div>
  );
};

export default Home;
