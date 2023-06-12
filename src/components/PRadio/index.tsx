import React, { useState, useEffect, useCallback } from 'react';
import './index.sass';

type OptionItem = {
  text: string;
  value: string;
  icon?: string;
};
interface PSelectProps {
  options: OptionItem[];
  onChange: (val: string) => void;
  val: string;
}

const PRadio: React.FC<PSelectProps> = ({ onChange, options, val }) => {
  const [activeValue, setActiveValue] = useState<string>();
  const handleChange = (item: OptionItem | undefined) => {
    setActiveValue(item?.value)
    onChange(item?.value ?? '')
  };
  const liClassName = useCallback(
    (item: OptionItem) => {
      let defaultCN = 'radioOption';
      if (item.value === activeValue) {
        defaultCN += ' active';
      }
      return defaultCN;
    },
    [activeValue]
  );
  useEffect(() => {
    if (val) {
      setActiveValue(val)
    }
  }, [val])
  return (
    <div className="pRadio">
      <ul className="radioOptions">
        {options.map((item) => {
          return (
            <li
              className={liClassName(item)}
              key={item.value}
              onClick={() => handleChange(item)}
            >
              <span>{item.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PRadio;
