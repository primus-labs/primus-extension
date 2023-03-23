import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router';
import {connect} from 'react-redux';
import rem from '@/utils/rem.js';
import {getAllStorageAsync} from '@/store/actions'
// import store from '@/store/index'
import PHeader from '@/components/PHeader'
import PMask from '@/components/PMask'
import AuthDialog from '@/components/AuthDialog'
import CreateAccountDialog from '@/components/CreateAccountDialog'
import SetPwdDialog from '@/components/SetPwdDialog'
import SetSucDialog from '@/components/SetSucDialog'
import BackgroundAnimation from '@/components/BackgroundAnimation'
import AsideAnimation from '@/components/AsideAnimation'
import './Home.sass';
import { getMutipleStorageSyncData } from '@/utils/utils'

const Home = (props) => {
  // const {getAllStorageAsync} = props
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
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
    setStep(1)
  }
  const handleSubmitSetPwd = () => {
    setStep(4)
  }
  const handleCancelSetPwd= () => {
    setStep(2)
  }
  const handleSubmitSetSuc = () => {
    navigate('/datas')
  }
  const checkActiveStep = async() => {
    // chrome.storage.local.remove(['userInfo', 'keyStore'],  (storedData) => {
    //   console.log("remove 'userinfo' & 'keyStore' successfully")
    // })// TODO DEL!!!
    
    // It can be called like this:
    let {userInfo, keyStore} = await getMutipleStorageSyncData(['userInfo','keyStore']);
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
  const initalPage = async () => {
    await getAllStorageAsync()
    // console.log('props', props, store.getState())
    await checkActiveStep()
  }
  useEffect(() => {
    rem()
    initalPage()
    // navigate('/datas')// TODO !!!DEL
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
// export default connect(
//   (store) => store, 
//   {
//     getAllStorageAsync
//   })(Home);
