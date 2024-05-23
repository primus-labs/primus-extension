import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
  useCallback,
} from 'react';
import PButton from '@/newComponents/PButton';
import Dropdown from './Dropdown';
// import iconClear from '@/assets/img/iconClear.svg';

import type { MouseEvent } from 'react';
import './index.scss';

interface PSelectProps {
  className?: string;
}

const Notification: React.FC<PSelectProps> = memo(({ className }) => {
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [dotVisible, setDotVisible] = useState(true);
  const selectInputEl = useRef(null);

  const formatPSelectCN = useMemo(() => {
    let cN = 'notification';
    if (className) {
      cN += ` ${className}`;
    }
    return cN;
  }, [className]);

  const handleEnter = async () => {
    setOptionsVisible(true);
    await chrome.storage.local.set({
      readNotification: '1',
    });
    await updateDotVisible();
  };
  const handleLeave = () => {
    setOptionsVisible(false);
  };

  useEffect(() => {
    const dE = document.documentElement;
    const dEClickHandler: any = (ev: MouseEvent<HTMLElement>) => {
      if (ev.target !== selectInputEl.current) {
        setOptionsVisible(false);
      }
    };
    dE.addEventListener('click', dEClickHandler);
    return () => {
      dE.removeEventListener('click', dEClickHandler);
    };
  }, []);
  const updateDotVisible = async () => {
    // await chrome.storage.local.set({
    //   readNotification: '0',
    // });
    const { readNotification } = await chrome.storage.local.get([
      'readNotification',
    ]);
    setDotVisible(readNotification !== '1');
  };
  useEffect(() => {
    updateDotVisible();
  }, []);

  return (
    <div className={formatPSelectCN}>
      <div
        className="bellWrapper"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        ref={selectInputEl}
      >
        {dotVisible && <div className="dot"></div>}
        <PButton
          type="icon"
          icon={<i className="iconfont icon-iconBell"></i>}
          onClick={handleEnter}
          className="bellBtn"
        ></PButton>
      </div>
      {optionsVisible && (
        <div
          className={'selectOptionswrapper'}
          onClick={handleEnter}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <Dropdown />
        </div>
      )}
    </div>
  );
});

export default Notification;
