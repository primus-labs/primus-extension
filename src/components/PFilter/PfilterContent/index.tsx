import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import './index.scss';
import type {FilterOptionList} from '@/types/config'
import PRadioNew from '@/components/PRadioNew';
interface TokenTableProps {
  onChange: (label: string | undefined) => void;
  visible: boolean;
  list: FilterOptionList;
}

const PFilterContent: React.FC<TokenTableProps> = memo(
  ({ onChange, visible, list }) => {
    const willCloseEl = useRef(null);
    const [activeItem, setActiveItem] = useState<string | undefined>('All');

    
    useEffect(() => {
      onChange(activeItem);
    }, [activeItem]);

    // useEffect(() => {
    //   setActiveItem('All');
    // }, [])
    const formatIconClassName = useCallback((item:any) => {
      let defaultCN = 'iconfont icon-iconCheckbox';
      if (item.disabled) {
        defaultCN += 'iconfont icon-iconCheckbox disabled';
      }
      if (activeItem === item.label) {
        defaultCN = 'iconfont icon-iconCheckboxActive checked';
      }
      return defaultCN;
    }, [activeItem]);

    return (
      <section
        className={visible ? 'pFilterContent visible' : 'pFilterContent'}
        ref={willCloseEl}
      >
        <PRadioNew onChange={setActiveItem} list={list} />
      </section>
    );
  }
);

export default PFilterContent;
