import React, {useState, useRef} from 'react';
import {
  useNavigate
} from "react-router-dom";
import PHeader from '@/components/PHeader'
import PMask from '@/components/PMask'
import AuthDialog from '@/components/AuthDialog'
import CreateAccountDialog from '@/components/CreateAccountDialog'
import SetPwdDialog from '@/components/SetPwdDialog'

import illustration from '@/assets/img/illustration.svg';
import rightArrow from '@/assets/img/rightArrow.svg';
import bgLayer1 from '@/assets/img/bgLayer1.svg';
import bgLayer2 from '@/assets/img/bgLayer2.svg';
import bgLayer3 from '@/assets/img/bgLayer3.svg';
import bgLayer4 from '@/assets/img/bgLayer4.svg';

import './Home.sass';

const Home = () => {
  const [maskVisible, setMaskVisible] = useState(false)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [step, setStep] = useState(0)
  const navigate = useNavigate();
  const shapeEl = useRef()
  const handleClickStart = () => {
    // navigate("auth");
    setMaskVisible(true)
    setDialogVisible(true)
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
  const handleMouseMove =(e)=> {
    // console.log(e)
    // console.dir(shapeEl.current)
    // shapeEl.current.style.left = e.clientX-500+'px'
    // shapeEl.current.style.top = e.clientY-250+'px'
  }
  return (
    <div className="appPage appHome" onMouseMove={handleMouseMove}>
      <div className="baseLayer">
        <div className="bgLayer">
          {/* <div className="shape1" ref={shapeEl}>
          </div> */}
          {/* <div className="shape2" ref={shapeEl}>
            <img src={shapeImg} className="shapeImg" alt="shapeImg" />
          </div> */}
          {/* <div className="shape3" ref={shapeEl}> */}
            <img src={bgLayer1} className="layer1" alt="shapeImg" />
            <img src={bgLayer2} className="layer2" alt="shapeImg" />
            <img src={bgLayer3} className="layer3" alt="shapeImg" />
            <img src={bgLayer4} className="layer4" alt="shapeImg" />
            <div className="layer5"></div>
          {/* </div> */}
        </div>
        <header className="appHeader">
          <PHeader/>
        </header>
        <main className="appContent">
          <aside>
            <img src={illustration} className="illustration" alt="illustration" />
          </aside>
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
    </div>
  );
};

export default Home;
