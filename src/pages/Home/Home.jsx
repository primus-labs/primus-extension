import React, { useState, useEffect, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useWinWidth from '@/hooks/useWinWidth';
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

  useEffect(() => {
    navigate('/home');
  }, []);

  return <div className={`pageGuide ${lastTheme} ${cName} `}></div>;
});
export default Home;
