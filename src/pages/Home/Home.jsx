import React, { useState, useEffect, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useWinWidth from '@/hooks/useWinWidth';
import useTimeout from '@/hooks/useTimeout';
import iconLogoPrimus from '@/assets/newImg/guide/iconLogoPrimus.svg';
import iconLogoPrimusForDark from '@/assets/newImg/guide/iconLogoPrimusForDark.svg';
import './home.scss';

const Home = memo(() => {
  const size = useWinWidth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [lastTheme, setLastTheme] = useState('light');
  const cName = useMemo(() => {
    if (size.width >= 1366) {
      if ([0].includes(step)) {
        return 'fixedH';
      }
      // if ([0, 4, 5].includes(step)) {
      //   return 'fixedH';
      // } else if ([1, 2, 3].includes(step)) {
      //   return 'autoH';
      // }
      return 'autoH';
    } else {
      return 'autoH';
    }
  }, [step, size]);

  useEffect(() => {
    const cT = localStorage.getItem('colorTheme');
    if (cT) {
      setLastTheme(cT);
    }
  }, []);
  const timeoutStep1Fn = async () => {
    navigate('/home');
  };
  useTimeout(timeoutStep1Fn, 1300, true, false);

  return (
    <div className={`pageGuide ${lastTheme} ${cName} `}>
      {step === 0 && (
        <div className="animationWrapper animate__animated animate__fadeIn">
          <img
            src={lastTheme === 'dark' ? iconLogoPrimusForDark : iconLogoPrimus}
            alt=""
          />
          {/* <i></i>
          <div className="logonTxt">
            Liberate Data and Computation with Cryptography
          </div> */}
        </div>
      )}
    </div>
  );
});
export default Home;
