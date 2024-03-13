import React, {
  useState,
  useEffect,
  memo,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import useListener from '@/hooks/useListener';
import useTimeout from '@/hooks/useTimeout';
import { postMsg } from '@/utils/utils';
import ReferralCodeInput from '@/newComponents/Ahievements/ReferralCodeInput';
import page1 from '@/assets/newImg/guide/page1.svg';
import page2 from '@/assets/newImg/guide/page2.svg';
import page3 from '@/assets/newImg/guide/page3.svg';
import page4 from '@/assets/newImg/guide/page4.svg';
import page5 from '@/assets/newImg/guide/page5.svg';
import iconLogoPado from '@/assets/newImg/guide/iconLogoPado.svg';
import './home.scss';

const Home = memo(() => {
  const guideImg = useRef(null);
  useListener();
  const navigate = useNavigate();
  const [visibleReferralCodeDialog, setVisibleReferralCodeDialog] = useState();
  const [step, setStep] = useState(0);
  const [timeoutStep2Switch, setTimeoutStep2Switch] = useState(false);
  const [showInputPasswordDialog, setShowInputPasswordDialog] = useState(false);
  const padoServicePort = useSelector((state) => state.padoServicePort);
  const imgSrc = useMemo(() => {
    let s = page1;
    switch (step) {
      case 1:
        s = page1;
        break;
      case 2:
        s = page2;
        break;
      case 3:
        s = page3;
        break;
      case 4:
        s = page4;
        break;
      case 5:
        s = page5;
        break;
      default:
        s = page1;
        break;
    }
    return s;
  }, [step]);
  const timeoutStep1Fn = () => {
    setStep(2);
    setTimeoutStep2Switch(true);
  };
  useTimeout(timeoutStep1Fn, 1300, true, false);
  // const timeoutStep2Fn = () => {
  //   setStep(2);
  // };
  // useTimeout(timeoutStep2Fn, 1000, timeoutStep2Switch, false);
  const handleClick = useCallback(async () => {
    if (step <= 4) {
      setStep((p) => p + 1);
    } else {
      setStep(1);

      const { keyStore, padoCreatedWalletAddress, privateKey, userInfo } =
        await chrome.storage.local.get([
          'keyStore',
          'padoCreatedWalletAddress',
          'privateKey',
          'userInfo',
        ]);
      if (!keyStore && !privateKey) {
        const msg = {
          fullScreenType: 'wallet',
          reqMethodName: 'create',
          params: {},
        };
        postMsg(padoServicePort, msg);
      }

      chrome.storage.local.set({
        guide: '1',
      });

      setVisibleReferralCodeDialog(true);
    }
  }, [step]);

  const checkIsFirstLogin = useCallback(async () => {
    const { guide } = await chrome.storage.local.get(['guide']);
    if (guide) {
      navigate('/home');
    }
  }, [navigate]);
  const handleReferralCodeClose = () => {
    setVisibleReferralCodeDialog(false);
  };
  const handleReferralCodeSubmit = useCallback(() => {
    navigate('/home');
  }, []);

  useEffect(() => {
    checkIsFirstLogin();
  }, [checkIsFirstLogin]);
  useEffect(() => {
    if (guideImg.current) {
      if (step === 4) {
        guideImg.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
        // guideImg.current.scrollTop = (460 / 1440) * window.innerWidth;
      }
      if ([0, 1, 2, 3].includes(step)) {
        guideImg.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  }, [step, guideImg]);

  return (
    <div
      className={`pageGuide ${
        [0, 4, 5].includes(step)
          ? 'fixedH'
          : [1, 2, 3].includes(step)
          ? 'autoH'
          : ''
      }`}
    >
      {step > 0 && (
        <img
          ref={guideImg}
          src={imgSrc}
          alt=""
          onClick={handleClick}
          className={`guideImg animate__animated animate__fadeIn`}
        />
      )}
      {step === 0 && (
        <div className="animationWrapper animate__animated animate__fadeIn">
          <img src={iconLogoPado} alt="" />
          {/* <i></i>
          <div className="logonTxt">
            Liberate Data and Computation with Cryptography
          </div> */}
        </div>
      )}
      {visibleReferralCodeDialog && (
        <ReferralCodeInput
          onClose={handleReferralCodeClose}
          setReferralTaskFinished={handleReferralCodeSubmit}
          onCancel={handleReferralCodeSubmit}
          required={false}
        />
      )}
    </div>
  );
});
export default Home;
