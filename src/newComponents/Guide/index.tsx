import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import page1 from '@/assets/newImg/guide/page1.svg';
import page2 from '@/assets/newImg/guide/page2.svg';
import page3 from '@/assets/newImg/guide/page3.svg';
import page4 from '@/assets/newImg/guide/page4.svg';
import page5 from '@/assets/newImg/guide/page5.svg';
import './index.scss';
import { useNavigate } from 'react-router-dom';

const Guide = memo(({ }) => {
  const navigate = useNavigate()
  const [step, setStep] = useState<number>(1);
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
  const handleClick = useCallback(() => {
    if (step <= 4) {
      setStep((p) => p + 1);
    } else {
      navigate('/home');
    }
  }, [step]);
  useEffect(() => {
    setStep(1);
  }, []);
 
  return (
    <div className="pageGuide">
      <img
        src={imgSrc}
        alt=""
        onClick={handleClick}
        className={`guideImg ${step > 3 && 'longImg'}`}
      />
    </div>
  );
});

export default Guide;
