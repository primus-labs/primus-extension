import React, {useState, useEffect} from 'react';
import rem from '@/utils/rem.js';
import PHeader from '@/components/PHeader'
import PMask from '@/components/PMask'
import AuthDialog from '@/components/AuthDialog'
import CreateAccountDialog from '@/components/CreateAccountDialog'
import SetPwdDialog from '@/components/SetPwdDialog'
import SetSucDialog from '@/components/SetSucDialog'
import BackgroundAnimation from '@/components/BackgroundAnimation'
import AsideAnimation from '@/components/AsideAnimation'
import './index.sass';

const Lock = () => {
  const [maskVisible, setMaskVisible] = useState(false)
  const [step, setStep] = useState(0)
  const handleClickStart = () => {
    setMaskVisible(true)
    setStep(1)
  }
  
  useEffect(() => {
    rem()
  }, [])

  return (
    <div className="appPage appHome">
      <div className="baseLayer">
        <BackgroundAnimation/>
        
      </div>
      <div className="pageLayer">
      <header className="appHeader">
          <PHeader/>
        </header>
        <main className="appContent">
          <AsideAnimation/>
          <article>
            <section className="descWrapper">
              <h1>Welcome BACK！</h1>
              <p>A Trustless Data Gateway Connecting Web2 and Web3</p>
              <p>Seems like your first time using. Please click on below button to proceed</p>
            </section>
            <button className="startBtn" onClick={handleClickStart}>
              <span>Unlock</span>
            </button>
            <div className="forgetPwd">Forgot password?</div>
            <div className="help">Need help? Contact PADO support</div>
          </article>
        </main>
      </div>
    </div>
  );
};

export default Lock;
