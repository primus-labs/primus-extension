import React, { useState, useRef, useEffect } from 'react';
import type { MouseEvent } from 'react';
import './index.sass';
import PfilterContent from './PfilterContent';
interface TokenTableProps {
  onChange: (label: string | undefined) => void;
}

const PFilter: React.FC<TokenTableProps> = ({ onChange }) => {
  const [dorpdownVisible, setDorpdownVisible] = useState<boolean>(false);
  const [activeItem, setActiveItem] = useState<string>();
  const handleChange = (label: string | undefined) => {
    label && setActiveItem(label);
    onChange(label);
  };
  const willCloseEl = useRef(null);
  const iconEl = useRef(null);
  const handleEnterAvatar = () => {
    setDorpdownVisible(true)
  }
  const handleLeaveAvatar = () => {
    setDorpdownVisible(false)
  }
  useEffect(() => {
    const dE = document.documentElement;
    const dEClickHandler: any = (ev: MouseEvent<HTMLElement>) => {
      if (ev.target !== willCloseEl.current && ev.target !== iconEl.current) {
        setDorpdownVisible(false);
      }
    };
    dE.addEventListener('click', dEClickHandler);
    return () => {
      dE.removeEventListener('click', dEClickHandler);
    };
  }, []);
  return (
    <section className="pFilter" ref={willCloseEl} onMouseEnter={handleEnterAvatar}  onMouseLeave={handleLeaveAvatar}>
      <div
        className={
          activeItem !== undefined && activeItem !== 'All' ? 'filterIconWrapper active' : 'filterIconWrapper'
        }
        onClick={() => {
          setDorpdownVisible((i) => !i);
        }}
        ref={iconEl}
        onMouseEnter={handleEnterAvatar}
      ></div>
      <PfilterContent onChange={handleChange} visible={dorpdownVisible} />
    </section>
  );
};

export default PFilter;
