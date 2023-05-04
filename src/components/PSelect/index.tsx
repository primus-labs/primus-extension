import React, { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, MouseEvent, PointerEvent } from 'react';
import './index.sass';

type OptionItem = {
  text: string;
  value: string;
};
interface PSelectProps {
  options: OptionItem[]
  onChange: (val: string) => void;
  placeholder?: string;
  val: string;
}

const PSelect: React.FC<PSelectProps> = ({ onChange, options, placeholder = '', val }) => {
  // const [activeOption, setActiveOption] = useState<OptionItem>();
  const [optionsVisible, setOptionsVisible] = useState(false);
  const selectInputEl = useRef(null);
  const handleChange = (item: OptionItem) => {
    // setActiveOption(item)
    onChange(item.value);
  };
  const handleClickSelect = () => {
    setOptionsVisible((visible) => !visible);
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
  // useEffect(() => {
    // setActiveOption(options[0])
    
  // }, [])
  return (
    <div className="pSelect">
      <div
        ref={selectInputEl}
        className="selectInput"
        onClick={handleClickSelect}
      >
        {/* {activeOption?.text} */}
        {val}
      </div>
      {optionsVisible && (
        <ul className="selectOptions">
          {options.map((item) => {
            return (
              <li className="selectOption" key={item.value} onClick={() => handleChange(item)}>
                <span>{item.text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PSelect;
