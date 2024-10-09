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
import useWinWidth from '@/hooks/useWinWidth';
import { postMsg } from '@/utils/utils';
import ReferralCodeInput from '@/newComponents/Ahievements/ReferralCodeInput';
import page1 from '@/assets/newImg/guide/page1.png';
import page2 from '@/assets/newImg/guide/page2.png';
import page3 from '@/assets/newImg/guide/page3.png';
import page4 from '@/assets/newImg/guide/page4.png';
import page5 from '@/assets/newImg/guide/page5.png';
import iconLogoPado from '@/assets/newImg/guide/iconLogoPado.svg';
import iconLogoPadoForDark from '@/assets/newImg/guide/iconLogoPadoForDark.svg';
import './home.scss';
import useCreateAccount from '@/hooks/useCreateAccount';

const Home = memo(() => {
  const size = useWinWidth();
  const { createAccountFn } = useCreateAccount();
  const guideImg = useRef(null);
  useListener();
  const navigate = useNavigate();
  const [visibleReferralCodeDialog, setVisibleReferralCodeDialog] = useState();
  const [step, setStep] = useState(2);
  const [timeoutStep2Switch, setTimeoutStep2Switch] = useState(false);
  const [showInputPasswordDialog, setShowInputPasswordDialog] = useState(false);
  const [lastTheme, setLastTheme] = useState('light');
  const padoServicePort = useSelector((state) => state.padoServicePort);
  const cName = useMemo(() => {
    if (size.width >= 1366) {
      if ([0, 4, 5].includes(step)) {
        return 'fixedH';
      } else if ([1, 2, 3].includes(step)) {
        return 'autoH';
      }
    } else {
      return 'autoH';
    }
  }, [step, size]);
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
  // const timeoutStep1Fn = async () => {
  //   const f = await checkIsFirstLogin();
  //   if (f) {
  //     setStep(2);
  //     setTimeoutStep2Switch(true);
  //   }
  // };
  // useTimeout(timeoutStep1Fn, 1300, true, false);
  const initAccount = useCallback(async () => {
    const { keyStore, padoCreatedWalletAddress, privateKey, userInfo } =
      await chrome.storage.local.get([
        'keyStore',
        'padoCreatedWalletAddress',
        'privateKey',
        'userInfo',
      ]);
    if (!privateKey && !keyStore && !userInfo) {
      const msg = {
        fullScreenType: 'wallet',
        reqMethodName: 'create',
        params: {},
      };
      postMsg(padoServicePort, msg);
    }
    if (privateKey && !userInfo) {
      createAccountFn();
    }
  }, []);
  const handleClick = useCallback(async () => {
    if (step <= 4) {
      setStep((p) => p + 1);
    } else {
      setStep(1);
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
    } else {
      return true;
    }
  }, [navigate]);
  const handleReferralCodeClose = () => {
    setVisibleReferralCodeDialog(false);
  };
  const handleReferralCodeSubmit = useCallback(() => {
    navigate('/home');
  }, []);

  // useEffect(() => {
  //   checkIsFirstLogin();
  // }, [checkIsFirstLogin]);
  useEffect(() => {
    if (guideImg.current && size.width >= 1366) {
      if (step === 4) {
        guideImg.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
        // guideImg.current.scrollTop = (460 / 1440) * window.innerWidth;
      }
      if ([0, 1, 2, 3].includes(step)) {
        guideImg.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  }, [step, guideImg, size]);
  useEffect(() => {
    initAccount();
  }, [initAccount]);
  useEffect(() => {
    const cT = localStorage.getItem('colorTheme');
    if (cT) {
      setLastTheme(cT);
    }
  }, []);

  return (
    <div
      className={`pageGuide ${lastTheme} ${cName} `}
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
          <img
            src={lastTheme === 'dark' ? iconLogoPadoForDark : iconLogoPado}
            alt=""
          />
          {/* <i></i>
          <div className="logonTxt">
            Liberate Data and Computation with Cryptography
          </div> */}
        </div>
      )}
      {visibleReferralCodeDialog && (
        <ReferralCodeInput
          onClose={handleReferralCodeSubmit}
          setReferralTaskFinished={handleReferralCodeSubmit}
          onCancel={handleReferralCodeSubmit}
          required={false}
        />
      )}
    </div>
  );
});
export default Home;
