import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import './index.sass';

interface PInputProps {
  onChange: (val: string) => void;
  placeholder?: string;
}
type TabItem = {
  text: string;
  value: number | string;
};

const PSelect: React.FC<PInputProps> = ({ onChange, placeholder = '' }) => {
  const [options, setOptions] = useState<TabItem[]>([
    {
      value: 100,
      text: 'All',
    },
    {
      value: 1,
      text: 'Assets',
    },
    {
      value: 2,
      text: 'Social',
    },
  ]);
  const [activeOption, setActiveOption] = useState<TabItem>({
    value: 100,
    text: 'All',
  });
  const [optionsVisible, setOptionsVisible] = useState(false);
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const formatVal = e.target.value.trim();
    onChange(formatVal);
  };
  const handleClickSelect = () => {
    setOptionsVisible(visible => !visible);
  };
  return (
    <div className="pSelect">
      <div className="selectInput" onClick={handleClickSelect}>
        {activeOption?.text}
      </div>
      {optionsVisible && (
        <ul className="selectOptions">
          {options.map((item) => {
            return (
              <li className="selectOption">
                <span>{item.text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
    // <select className="pSelect" onChange={handleChange} placeholder={placeholder} >
    //   {options.map((item) => {
    //     return (
    //       <option
    //       >
    //         <span className="abc">{item.text}</span>
    //       </option>
    //     );
    //   })}
    // </select>
  );
};

export default PSelect;
