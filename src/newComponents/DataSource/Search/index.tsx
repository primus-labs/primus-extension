import React, { useState, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { DATASOURCEMAPVALUES } from '@/config/dataSource';
import type { UserState } from '@/types/store';
import PInput from '@/newComponents/PInput';
import PSelect from '@/newComponents/PSelect';
import iconSearch from '@/assets/newImg/layout/iconSearch.svg';
import './index.scss'

const Search: React.FC = () => {
  const dispatch = useDispatch();
  const dataSourceQueryStr = useSelector(
    (state: UserState) => state.dataSourceQueryStr
  );
  const dataSourceQueryType = useSelector(
    (state: UserState) => state.dataSourceQueryType
  );
  const tList = useMemo(() => {
    let arr: string[] = [];
    DATASOURCEMAPVALUES.forEach((i) => {
      if (!arr.includes(i.type)) {
        arr.push(i.type);
      }
    });
    const newArr = arr.map((i) => ({ label: i, value: i }));
    newArr.unshift({
      value: 'All',
      label: 'All',
    });
    return newArr;
  }, []);
  const handleChangeStr = useCallback((v) => {
    dispatch({
      type: 'setDataSourceQueryStr',
      payload: v,
    });
  }, []);
  const handleChangeType = useCallback((v) => {
    dispatch({
      type: 'setDataSourceQueryType',
      payload: v,
    });
  }, []);
  return (
    <div className="dataSourceSearchBar">
      <PSelect
        className="serachType"
        placeholder="Select source type"
        list={tList}
        value={dataSourceQueryType}
        onChange={handleChangeType}
        prefix={<i className="iconfont icon-iconFilter prefix"></i>}
        showSelf={true}
      />
      <PInput
        className="serachStr"
        placeholder="Search data source name"
        type="text"
        onChange={handleChangeStr}
        onSearch={handleChangeStr}
        value={dataSourceQueryStr}
        prefix={<img src={iconSearch} className="prefix" />}
      />
    </div>
  );
};

export default Search;
