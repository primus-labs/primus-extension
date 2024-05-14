import React, { useState, useMemo, useCallback, useEffect, memo, FC } from 'react';

import './index.scss';
import { TaskItem } from '@/newComponents/Ahievements/AchievementTaskItem';

export type PageSelectProps = {
  current: number;
  totalPage: number;
  onClick: any;
};

const PageSelect: React.FC<PageSelectProps> = memo(({ current, totalPage, onClick }) => {
  // let [current, setCurrent] = useState(1);
  // let [total, setTotal] = useState(1);


  const PageItemComponent = () => {
    return Array.from({ length: totalPage }, (_, index) => CreatePageItem(index + 1));
  };

  const CreatePageItem = (page) => {
    if(page===current) {
      return <div className={'page-select-item-selected'} key={page} onClick={() => onClick(page)} >{page}</div>;
    }else {
      return <div className={'page-select-item'} key={page} onClick={() => onClick(page)} >{page}</div>;
    }
  };

  const CreatePreItem = () => {
    const pre = '<';
    return <div className={'page-select-item'} key="pre" onClick={()=>{onClick('pre')}}>{pre}</div>;
  };

  const CreateNextItem = () => {
    const next = '>';
    return <div className={'page-select-item'} key="next" onClick={()=>{onClick('next')}}>{next}</div>;
  };


  return (
    <div className="page-select">
      <div className="page-select-items">
        <CreatePreItem />
        {PageItemComponent()}
        <CreateNextItem />
      </div>
    </div>
  );
});

export default PageSelect;