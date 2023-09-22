import React, { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';

import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import PHeader from '@/components/Layout/PHeader';
import TransferToChainDialog from '@/components/DataSourceDetail/TransferToChainDialog';
import AuthDialog from '@/components/Home/AuthDialog';
import SetPwdDialog from '@/components/Home/SetPwdDialog';
import SetSucDialog from '@/components/Home/SetSucDialog';
import AsideAnimation from '@/components/Layout/AsideAnimation';

import { setSocialSourcesAsync } from '@/store/actions';
import { postMsg } from '@/utils/utils';
import { CHAINNETWORKLIST } from '@/config/constants';

import './Home.sass';

const Home = memo(() => {
  const [step, setStep] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const padoServicePort = useSelector((state) => state.padoServicePort);

  const handleClickStart = async () => {
    const isInProcess = await checkActiveStep();
    if (!isInProcess) {
      setStep(1);
    }
  };
  const handleCloseMask = useCallback(() => {
    setStep(0);
  }, []);
  const handleSubmitAuth = useCallback(() => {
    dispatch(setSocialSourcesAsync());
    setStep(3);
  }, [dispatch]);
  // const handleSubmitCreateAccount = useCallback(() => {
  //   setStep(3);
  // }, []);
  const handleCancelCreateAccount = useCallback(() => {
    setStep(1);
  }, []);
  const handleSubmitSetPwd = useCallback(() => {
    setStep(4);
  }, []);
  const handleCancelSetPwd = useCallback(() => {
    setStep(2);
  }, []);
  const handleSubmitSetSuc = useCallback(() => {
    navigate('/datas');
  }, [navigate]);
  
  const checkActiveStep = useCallback(async () => {
    // It can be called like this:
    let { userInfo, privateKey, keyStore } = await chrome.storage.local.get([
      'userInfo',
      'privateKey',
      'keyStore',
    ]);

    // If keyStore is cached,,it represents that the user has already bound a wallet => data page
    if (keyStore) {
      navigate('/datas');
      // const padoServicePortListener = async function (message) {
      //   if (message.resMethodName === 'queryUserPassword') {
      //     if (!message.res) {
      //       navigate('/lock');
      //     } else {
      //       navigate('/datas');
      //     }
      //   }
      //   padoServicePort.onMessage.removeListener(padoServicePortListener);
      // };
      // padoServicePort.onMessage.addListener(padoServicePortListener);
      // const msg = {
      //   fullScreenType: 'wallet',
      //   reqMethodName: 'queryUserPassword',
      //   params: {},
      // };
      // postMsg(padoServicePort, msg);
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
  }, [navigate, padoServicePort]);

  useEffect(() => {
    checkActiveStep();  
  }, []);

  return (
    <div className="pageIndex pageHome">
      <main className="appContent">
        <AsideAnimation />
        <article>
          <section className="descWrapper">
            <h1>Welcome to PADO Attestation Service</h1>
            <p>Bringing all internet data into smart contracts.</p>
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
      {/* {step === 2 && (
        <TransferToChainDialog
          onClose={handleCloseMask}
          onSubmit={handleSubmitCreateAccount}
          onCancel={handleCancelCreateAccount}
          title="Create account"
          desc="Create an EVM compatible on-chain address to easily manage your data. The address will bind to your sign up account."
          list={CHAINNETWORKLIST}
          showButtonSuffixIcon={true}
          tip="Please select one chain to create"
          listTitle="Compatible with"
          listSeparator="and"
          requireItem={false}
        />
      )} */}
      {step === 3 && (
        <SetPwdDialog
          onClose={handleCloseMask}
          onSubmit={handleSubmitSetPwd}
          onCancel={handleCancelSetPwd}
        />
      )}
      {/* {step === 4 && (
        <SetSucDialog
          onClose={handleSubmitSetSuc}
          onSubmit={handleSubmitSetSuc}
        />
      )} */}
      {step === 4 && (
        <AddSourceSucDialog
          onClose={handleSubmitSetSuc}
          onSubmit={handleSubmitSetSuc}
          type="suc"
          title="Congratulations"
          desc="You have signed up successfully!"
          headerEl={<PHeader />}
        />
      )}
    </div>
  );
});
export default Home;
