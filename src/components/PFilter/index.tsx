import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import PfilterContent from './PfilterContent';
import type { MouseEvent } from 'react';
import type {FilterOptionList} from '@/types/config'
import './index.scss';

interface TokenTableProps {
  onChange: (label: string | undefined) => void;
  list: FilterOptionList;
}

const PFilter: React.FC<TokenTableProps> = memo(({ onChange,list }) => {
  const [dorpdownVisible, setDorpdownVisible] = useState<boolean>(false);//TODO!!!
  const [activeItem, setActiveItem] = useState<string>();

  const willCloseEl = useRef(null);
  const iconEl = useRef(null);

  const handleChange = useCallback(
    (label: string | undefined) => {
      label && setActiveItem(label);
      onChange(label);
    },
    [onChange]
  );
  
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
      <PfilterContent onChange={handleChange} visible={dorpdownVisible} list={list} />
    </section>
  );
});

export default PFilter;
